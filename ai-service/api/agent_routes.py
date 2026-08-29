import json
import os
from datetime import datetime, timezone
from dotenv import load_dotenv
from fastapi import APIRouter, Depends, status,HTTPException
from fastapi.responses import JSONResponse
from sqlmodel import Session, select,delete

from api.database import get_session
from api.security import get_current_user   # ← swap this import to whatever auth_routes.py actually uses
from api.groq_client import get_groq_client          # ← assumes groq_client.py exports a ready `client` — adjust name if it's different
from api.models import AgentConversation, AgentMessage
from api.models import MessageRequest, MessageResponse, ConversationResponse, AgentMessageOut,ExecuteActionRequest,PendingAction, StepSyncRequest
from tools.agent_tools import TASK_TOOLS
from tools.plan_tools import PLAN_TOOLS
from tools.read_only_tool_handler import READ_ONLY_TOOL_HANDLERS,TOOL_DISPLAY_CONFIG
from tools.mutating_tool_handler import MUTATING_ACTION_HANDLERS
from prompt.agent_prompt import SYSTEM_PROMPT_TEMPLATE
from services.plan_client import sync_step_in_cache,invalidate_plan_cache

load_dotenv()



router = APIRouter(prefix="/agent", tags=["Agent"])

MODEL = os.getenv("AGENT_MODEL") or "openai/gpt-oss-20b"




SYSTEM_PROMPT=SYSTEM_PROMPT_TEMPLATE

TOOLS = TASK_TOOLS + PLAN_TOOLS

MUTATING_TOOLS = {
    "create_task", "update_task", "delete_task", "delete_plan",
}
MAX_TOOL_ITERATIONS = 5  # safety cap: max Groq round-trips per user message



def _get_or_create_conversation(session: Session, user_email: str, conversation_id: int | None) -> AgentConversation:
    if conversation_id is not None:
        conversation = session.exec(
            select(AgentConversation).where(
                AgentConversation.id == conversation_id,
                AgentConversation.user_email == user_email,
            )
        ).first()
        if conversation is not None:
            return conversation
    conversation = AgentConversation(user_email=user_email)
    session.add(conversation)
    session.commit()
    session.refresh(conversation)
    return conversation


def _save_message(
    session: Session, 
    conversation_id: int, 
    role: str, 
    content: str, 
    data_type: str | None = None, 
    data: any = None
) -> AgentMessage:
    message = AgentMessage(
        conversation_id=conversation_id, 
        role=role, 
        content=content,
        data_type=data_type,
        data=data
    )
    session.add(message)
    session.commit()
    session.refresh(message)
    return message




@router.post("/message", response_model=MessageResponse)
def send_agent_message(
    request: MessageRequest,
    session: Session = Depends(get_session),
    user_email: str = Depends(get_current_user),
):
    try:
        conversation = _get_or_create_conversation(session, user_email, request.conversation_id)
        _save_message(session, conversation.id, "user", request.message)

        history = session.exec(
            select(AgentMessage)
            .where(AgentMessage.conversation_id == conversation.id)
            .order_by(AgentMessage.created_at.desc())
            .limit(6)
        ).all()
        history = list(reversed(history))

        groq_messages = [{
            "role": "system",
            "content": SYSTEM_PROMPT.format(
                user_email=user_email,
                today=datetime.now(timezone.utc).date().isoformat(),
            ),
        }]
        groq_messages += [{"role": m.role, "content": m.content} for m in history]

        groq_client = get_groq_client()

        # 👇 NEW: remembers the most recent task data fetched anywhere in this
        # request's loop, so we can attach TASK_LIST cards to the model's final
        # text answer — even though that answer itself carries no tool call.
        last_task_data_type: str | None = None
        last_task_data: list | None = None

        for _ in range(MAX_TOOL_ITERATIONS):
            response = groq_client.chat.completions.create(
                model=MODEL, messages=groq_messages, tools=TOOLS, tool_choice="auto"
            )
            choice = response.choices[0].message

            # --- FINAL ANSWER: no more tools requested ---
            if not choice.tool_calls:
                reply_text = choice.content or ""
                _save_message(
                    session, conversation.id, "assistant", reply_text,
                    data_type=last_task_data_type, data=last_task_data,
                )
                conversation.updated_at = datetime.now(timezone.utc)
                session.commit()
                return MessageResponse(
                    reply=reply_text,
                    conversation_id=conversation.id,
                    data_type=last_task_data_type,
                    data=last_task_data,
                )

            tool_call = choice.tool_calls[0]
            tool_name = tool_call.function.name
            args = json.loads(tool_call.function.arguments)

            # --- MUTATING ACTIONS (Requires UI Approval) — unchanged, still stops immediately ---
            if tool_name in MUTATING_TOOLS:
                approval_msg = f"Approval required to run `{tool_name}`."
                _save_message(session, conversation.id, "assistant", approval_msg)
                return MessageResponse(
                    reply=approval_msg,
                    conversation_id=conversation.id,
                    requires_approval=True,
                    pending_action=PendingAction(action_type=tool_name, arguments=args),
                )

            # --- READ-ONLY TOOLS: execute, then feed result back into the loop ---
            result_data = None
            
            try:
                handler = READ_ONLY_TOOL_HANDLERS.get(tool_name)
                if handler:
                    result_data = handler(user_email, args)
            except Exception:
                error_reply = "Service is currently unavailable. Please try again later when the Gateway is Active."
                _save_message(session, conversation.id, "assistant", error_reply)
                return MessageResponse(reply=error_reply, conversation_id=conversation.id)

            data_type, trim_fn = TOOL_DISPLAY_CONFIG.get(tool_name, (None, lambda x: x))
            full_data, llm_data  = trim_fn(
                [t.model_dump() if hasattr(t, 'model_dump') else dict(t) for t in (result_data or [])]
            )

            # Remember it in case the model's NEXT reply is the final text answer
            last_task_data_type = data_type
            last_task_data = full_data

            groq_messages.append({
                "role": "assistant",
                "content": choice.content,
                "tool_calls": [
                    {
                        "id": tool_call.id,
                        "type": "function",
                        "function": {
                            "name": tool_call.function.name,
                            "arguments": tool_call.function.arguments,
                        },
                    }
                ],
            })
            groq_messages.append({
                "role": "tool",
                "tool_call_id": tool_call.id,
                "content": json.dumps(llm_data),
            })
            # loop continues — model sees the result on the next iteration

        # Fallback: loop exhausted MAX_TOOL_ITERATIONS without a final answer
        fallback_text = "I wasn't able to complete that — could you rephrase your request?"
        _save_message(session, conversation.id, "assistant", fallback_text)
        conversation.updated_at = datetime.now(timezone.utc)
        session.commit()
        return MessageResponse(reply=fallback_text, conversation_id=conversation.id)

    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})


@router.get("/conversations")
def get_conversations(
    session: Session = Depends(get_session),
    user_email: str = Depends(get_current_user),
):
    try:
        conversations = session.exec(
            select(AgentConversation)
            .where(AgentConversation.user_email == user_email)
            .order_by(AgentConversation.updated_at.desc())
        ).all()

        return conversations

    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": str(e)},
        )


@router.get(
    "/messages/{conversation_id}",
    response_model=ConversationResponse
)
def get_conversation_messages(
    conversation_id: int,
    session: Session = Depends(get_session),
    user_email: str = Depends(get_current_user),
):
    try:
        conversation = session.exec(
            select(AgentConversation)
            .where(
                AgentConversation.id == conversation_id,
                AgentConversation.user_email == user_email
            )
        ).first()

        if conversation is None:
            return JSONResponse(
                status_code=404,
                content={"error": "Conversation not found"},
            )

        messages = session.exec(
            select(AgentMessage)
            .where(
                AgentMessage.conversation_id == conversation_id
            )
            .order_by(
                AgentMessage.created_at.asc()
            )
        ).all()

        # FIX: Include data_type and data when loading past conversation history
        return ConversationResponse(
            messages=[
                AgentMessageOut(
                    role=m.role,
                    content=m.content,
                    created_at=m.created_at,
                    data_type=m.data_type,
                    data=m.data
                )
                for m in messages
            ]
        )

    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": str(e)},
        )

@router.delete("/delete/{conversation_id}")
def deleteConversation(
    conversation_id : int,
    session : Session = Depends(get_session),
    user_email : str = Depends(get_current_user)
    
):
    try :
        conversation = session.exec(
            select(AgentConversation)
            .where(
                AgentConversation.id == conversation_id,
                AgentConversation.user_email == user_email
                )
            
        ).first()
        if conversation is None:
                return JSONResponse(
                status_code=404,
                content={"error": "Conversation not found"},
                )

        session.exec(
            delete(AgentMessage)
            .where(
                AgentMessage.conversation_id == conversation_id
            )
        )

        session.exec(
            delete(AgentConversation)
            .where(AgentConversation.id == conversation_id)

        )

        session.delete(conversation)

        session.commit()

        return { "message": "Conversation deleted successfully" }



    except Exception as e :
        return JSONResponse(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content={"error": str(e)},
        )




@router.post("/execute-action")
def execute_approved_action(
    req: ExecuteActionRequest,
    session: Session = Depends(get_session),
    user_email: str = Depends(get_current_user),
):
    try:
        handler = MUTATING_ACTION_HANDLERS.get(req.action_type)

        if handler is None:
            raise HTTPException(
                status_code=400,
                detail="Invalid action type",
            )

        result_message = handler(
            req.arguments,
            user_email,
        )

        _save_message(
            session,
            req.conversation_id,
            "assistant",
            result_message,
        )

        return {
            "status": "success",
            "message": result_message,
        }

    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": str(e)},
        )


# plan sync related issues
@router.patch("/{plan_id}/steps/{step_id}/sync-cache")
def sync_step_cache(
    plan_id: int,
    step_id: int,
    req: StepSyncRequest,
    user_email: str = Depends(get_current_user),
):
    synced = sync_step_in_cache(user_email, plan_id, step_id, req.isCompleted)
    return {"synced": synced}

@router.post("/plans/invalidate-cache")
def invalidate_cache(user_email: str = Depends(get_current_user)):
    invalidate_plan_cache(user_email)
    return {"invalidated": True}
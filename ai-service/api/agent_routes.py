import json
import os
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, status
from fastapi.responses import JSONResponse
from sqlmodel import Session, select,delete

from api.database import get_session
from api.security import get_current_user   # ← swap this import to whatever auth_routes.py actually uses
from api.groq_client import get_groq_client          # ← assumes groq_client.py exports a ready `client` — adjust name if it's different
from api.models import AgentConversation, AgentMessage
from api.models import MessageRequest, MessageResponse, ConversationResponse, AgentMessageOut
from services.task_client import get_tasks

router = APIRouter(prefix="/agent", tags=["Agent"])

MODEL = "openai/gpt-oss-20b"

SYSTEM_PROMPT = """You are DevBoard's assistant, helping {user_email} with their tasks.
Today's date is {today}. Call `get_tasks` when the question needs real task data
(counts, due dates, status, blockers) — don't guess. You can't create/edit/delete
tasks yet — say that's coming soon if asked. Keep answers short."""

TOOLS = [{
    "type": "function",
    "function": {
        "name": "get_tasks",
        "description": "Get the current user's own tasks — title, status, priority, due date.",
        "parameters": {"type": "object", "properties": {}},
    },
}]


def _get_or_create_conversation(session: Session, user_email: str) -> AgentConversation:
    conversation = session.exec(
        select(AgentConversation).where(AgentConversation.user_email == user_email)
    ).first()
    if conversation is None:
        conversation = AgentConversation(user_email=user_email)
        session.add(conversation)
        session.commit()
        session.refresh(conversation)
    return conversation


def _save_message(session: Session, conversation_id: int, role: str, content: str) -> AgentMessage:
    message = AgentMessage(conversation_id=conversation_id, role=role, content=content)
    session.add(message)
    session.commit()
    session.refresh(message)
    return message


def _trim_tasks(tasks: list[dict]) -> list[dict]:
    # keep only what the model needs to reason about — cuts token usage
    # a lot vs. sending the full Spring Boot task objects
    if not isinstance(tasks, list):
        return []
    return [
        {
            "title": t.get("title"),
            "status": t.get("status"),
            "priority": t.get("priority"),
            "dueDate": t.get("dueDate"),
        }
        for t in tasks if isinstance(t, dict)
    ]


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
            .limit(10)
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
        response = groq_client.chat.completions.create(
            model=MODEL, messages=groq_messages, tools=TOOLS, tool_choice="auto",
        )
        choice = response.choices[0].message

        if choice.tool_calls:
            groq_messages.append({
                "role": "assistant",
                "content": choice.content or "",
                "tool_calls": [
                    {
                        "id": tc.id,
                        "type": tc.type,
                        "function": {
                            "name": tc.function.name,
                            "arguments": tc.function.arguments,
                        }
                    }
                    for tc in choice.tool_calls
                ]
            })
            for tool_call in choice.tool_calls:
                # user_email always comes from the JWT-derived dependency,
                # never from the model's tool_call arguments
                tasks = get_tasks(user_email)
                groq_messages.append({
                    "role": "tool",
                    "tool_call_id": tool_call.id,
                    "content": json.dumps(_trim_tasks(tasks)),
                })
            follow_up = groq_client.chat.completions.create(model=MODEL, messages=groq_messages)
            reply_text = follow_up.choices[0].message.content or ""
        else:
            reply_text = choice.content or ""

        _save_message(session, conversation.id, "assistant", reply_text)

        # Update conversation timestamp
        conversation.updated_at = datetime.now(timezone.utc)
        session.add(conversation)
        session.commit()

        return MessageResponse(reply=reply_text, conversation_id=conversation.id)

    except Exception as e:
        print(f"Error in send_agent_message: {str(e)}")
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": str(e)},
        )


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

        # First verify that this conversation belongs to this user
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

        # Fetch messages only for this conversation
        messages = session.exec(
            select(AgentMessage)
            .where(
                AgentMessage.conversation_id == conversation_id
            )
            .order_by(
                AgentMessage.created_at.asc()
            )
        ).all()

        return ConversationResponse(
            messages=[
                AgentMessageOut(
                    role=m.role,
                    content=m.content,
                    created_at=m.created_at
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
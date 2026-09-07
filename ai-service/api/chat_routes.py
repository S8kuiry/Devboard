from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from datetime import datetime, timezone


from api.database import get_session
from api.models import (
    PlanConversation,
    PlanMessage,
    SavePlanChatRequest,
    PlanChatResponse,
    PlanChatMessageOut,
    PromoteChatRequest,
)
from api.security import get_current_user


router = APIRouter(
    prefix="/plan-chat",
    tags=["Plan Chat"],
)


# ============================================================
# GET CHAT HISTORY
# ============================================================

@router.get(
    "/{namespace}",
    response_model=PlanChatResponse,
)
def get_plan_chat(
    namespace: str,
    session: Session = Depends(get_session),
    owner_email: str = Depends(get_current_user),

):
    """
    Get all chat messages belonging to a plan/draft.

    namespace can be:
        - draft UUID before plan is saved
        - str(plan_id) after plan is saved
    """

    conversation = session.exec(
        select(PlanConversation)
        .where(PlanConversation.namespace == namespace,
               PlanConversation.owner_email == owner_email)
    ).first()

    # No conversation yet
    if not conversation:
        return PlanChatResponse(messages=[])

    messages = session.exec(
        select(PlanMessage)
        .where(
            PlanMessage.conversation_id == conversation.id
        )
        .order_by(PlanMessage.created_at)
    ).all()

    return PlanChatResponse(
        messages=[
            PlanChatMessageOut(
                role=message.role,
                content=message.content,
                action=message.action,
                steps=message.steps,
                attachments=message.attachments,
                created_at=message.created_at,
            )
            for message in messages
        ]
    )


# ============================================================
# SAVE CHAT
# ============================================================

@router.post("/save", response_model=PlanChatResponse)
def save_plan_chat(
    request: SavePlanChatRequest,
    session: Session = Depends(get_session),
    owner_email: str = Depends(get_current_user),
):
    if not request.namespace.strip():
        raise HTTPException(status_code=400, detail="Namespace is required")

    conversation = session.exec(
        select(PlanConversation)
        .where(PlanConversation.namespace == request.namespace,
               PlanConversation.owner_email == owner_email)
    ).first()

    if not conversation:
        conversation = PlanConversation(namespace=request.namespace, owner_email=owner_email)
        session.add(conversation)
        session.commit()
        session.refresh(conversation)

    saved_messages = []
    for message_data in request.messages:
        message = PlanMessage(
            conversation_id=conversation.id,
            role=message_data.role,
            content=message_data.content,
            action=message_data.action,
            steps=message_data.steps,
            attachments=message_data.attachments,
        )
        session.add(message)
        saved_messages.append(message)

    conversation.updated_at = datetime.now(timezone.utc)
    session.add(conversation)
    session.commit()

    for message in saved_messages:
        session.refresh(message)

    return PlanChatResponse(
        messages=[
            PlanChatMessageOut(
                role=m.role, content=m.content, action=m.action,
                steps=m.steps, attachments=m.attachments, created_at=m.created_at,
            )
            for m in saved_messages
        ]
    )

# ============================================================
# DELETE CHAT
# ============================================================

@router.delete(
    "/{namespace}",

)
def delete_plan_chat(
    namespace: str,
    session: Session = Depends(get_session),
    owner_email: str = Depends(get_current_user),
):
    """
    Delete an entire plan conversation.

    Useful when a draft is discarded.
    """

    conversation = session.exec(
        select(PlanConversation)
        .where(PlanConversation.namespace == namespace,
            PlanConversation.owner_email == owner_email)
    ).first()

    if not conversation:
        return {
            "message": "Conversation already deleted",
        }

    session.delete(conversation)
    session.commit()

    return {
        "message": "Plan conversation deleted",
        "namespace": namespace,
    }


@router.post("/promote")
def promote_plan_chat(
    request: PromoteChatRequest,
    session: Session = Depends(get_session),
    owner_email: str = Depends(get_current_user),
):
    conversation = session.exec(
        select(PlanConversation)
        .where(PlanConversation.namespace == request.draft_id,
               PlanConversation.owner_email == owner_email)
    ).first()

    if not conversation:
        return {"message": "No conversation to promote"}

    conversation.namespace = request.plan_id
    conversation.plan_id = int(request.plan_id)
    conversation.updated_at = datetime.now(timezone.utc)
    session.add(conversation)
    session.commit()

    return {"namespace": conversation.namespace, "plan_id": conversation.plan_id}
# Pydantic request/response schemas
from pydantic import BaseModel,EmailStr
from sqlmodel import SQLModel, Field,Column,JSON
from typing import Optional,Any
from datetime import datetime, timezone



class ConvertRequest(BaseModel):
    raw_text:str

class RefineRequest(BaseModel):
    raw_text: str
    instruction: str = "Fix technical typos, structure chronologically, and clarify missing engineering details."
    mode: str = "chat"  # "chat" or "draft"



# ==========================================
# 1. DATABASE ENTITY (Maps to 'users' table)
# ==========================================
class User(SQLModel,table=True):
    __tablename__="users"

    id: Optional[int] = Field(default=None , primary_key=True)
    email : str = Field(unique=True , nullable=False ,index=True)
    password : str = Field(nullable=False)
    name : str = Field(nullable=False)


# ==========================================
# 2. AUTH SCHEMAS (Request / Response DTOs)
# ==========================================

class RegisterRequest(BaseModel):
    email : EmailStr
    password : str
    name : str

class LoginRequest(BaseModel):
    email : EmailStr
    password :str

class AuthResponse(BaseModel):
    token: str
    email: str
    name: str



# ==========================================
# 2. DATABASE ENTITY 
# ==========================================
class AgentConversation(SQLModel,table=True):
    __tablename__="agent_conversation"

    id: Optional[int] = Field(primary_key=True,default=None)
    user_email : str = Field(nullable=False)
    # Explicit datetime type hints with automatic timestamp defaults
    created_at: datetime = Field(
      default_factory=lambda: datetime.now(timezone.utc)
    )
    updated_at: datetime = Field(
      default_factory=lambda: datetime.now(timezone.utc),
      sa_column_kwargs={"onupdate": lambda: datetime.now(timezone.utc)},
    )

# ==========================================
# 3. DATABASE ENTITY 
# ==========================================
class AgentMessage(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    conversation_id: int = Field(foreign_key="agent_conversation.id")
    role: str
    content: str
    data_type: Optional[str] = None
    data: Optional[Any] = Field(default=None, sa_column=Column(JSON)) # Stores task JSON in DB
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
# ==========================================
# SCHEMAS (Request / Response DTOs)
# ==========================================
class PendingAction(BaseModel):
    action_type: str  # 'create_task', 'update_task', 'delete_task'
    arguments: dict
    
class MessageRequest(BaseModel):
    message : str
    conversation_id: int | None = None

# api/models.py
class MessageResponse(BaseModel):
    reply: str
    conversation_id: int
    requires_approval: bool = False
    pending_action: Optional[PendingAction] = None
    data_type: Optional[str] = None  # "TASK_LIST" or "TASK_SINGLE"
    data: Optional[Any] = None       # Array of task dicts for React Cards


class AgentMessageOut(BaseModel):
    role: str
    content: str
    created_at: datetime
    data_type: Optional[str] = None
    data: Optional[Any] = None

class ConversationResponse(BaseModel):
    messages: list[AgentMessageOut]

class ExecuteActionRequest(BaseModel):
    conversation_id: int
    action_type: str
    arguments: dict


#plans steps ttlcache handler
class StepSyncRequest(BaseModel):
    isCompleted: bool

    

# Pydantic request/response schemas
from pydantic import BaseModel,EmailStr
from sqlmodel import SQLModel, Field
from typing import Optional
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
class AgentMessage(SQLModel,table=True):
    __tablename__="agent_message"

    id : Optional[int] = Field(primary_key=True,default=None)

    conversation_id : int = Field(
        foreign_key="agent_conversation.id",nullable=False
    )

    # Restricts string values strictly to 'user' or 'assistant'
    role : str = Field(nullable=False)

    # Message content (maps to TEXT in PostgreSQL / SQLite)
    content: str = Field(nullable=False)

    # Creation timestamp
    created_at: datetime = Field(
      default_factory=lambda: datetime.now(timezone.utc)
    ) 
# ==========================================
# SCHEMAS (Request / Response DTOs)
# ==========================================
class MessageRequest(BaseModel):
    message : str

class MessageResponse(BaseModel):
    reply : str

class AgentMessageOut(BaseModel):
    role: str
    content: str
    created_at: datetime

class ConversationResponse(BaseModel):
    messages: list[AgentMessageOut]

    

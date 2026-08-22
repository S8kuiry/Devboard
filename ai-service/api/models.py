# Pydantic request/response schemas
from pydantic import BaseModel,EmailStr
from sqlmodel import SQLModel, Field
from typing import Optional



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
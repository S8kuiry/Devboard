from typing import List
from fastapi import APIRouter, Depends, Query, status
from fastapi.responses import JSONResponse
from sqlmodel import Session, select

from api.database import get_session
from api.models import User, RegisterRequest, LoginRequest, AuthResponse
from api.security import hash_password, verify_password, generate_token

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/register")
def register(request: RegisterRequest, session: Session = Depends(get_session)):
    try:
        # Check if email already exists in DB
        existing_user = session.exec(select(User).where(User.email == request.email)).first()
        if existing_user:
            raise ValueError("User already exists")

        # Create and persist new user
        user = User(
            email=request.email,
            name=request.name,
            password=hash_password(request.password)
        )
        session.add(user)
        session.commit()
        session.refresh(user)

        # Returns {"message": "User registered: email@example.com"} with HTTP 201
        return JSONResponse(
            status_code=status.HTTP_201_CREATED,
            content={"message": f"User registered: {user.email}"}
        )
    except ValueError as e:
        # Returns {"error": "User already exists"} with HTTP 400
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"error": str(e)}
        )
    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"error": str(e)}
        )


@router.post("/login")
def login(request: LoginRequest, session: Session = Depends(get_session)):
    try:
        user = session.exec(select(User).where(User.email == request.email)).first()

        if not user:
            raise ValueError("User not found")

        if not verify_password(request.password, user.password):
            raise ValueError("Invalid password ")

        token = generate_token(user.email)
        
        # Returns AuthResponse JSON directly with HTTP 200
        return AuthResponse(token=token, email=user.email, name=user.name)

    except ValueError as e:
        # Returns {"error": "Invalid credentials"} with HTTP 401
        return JSONResponse(
            status_code=status.HTTP_401_UNAUTHORIZED,
            content={"error": str(e)}
        )
    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_401_UNAUTHORIZED,
            content={"error": str(e)}
        )


@router.get("/emails")
def get_user_emails(session: Session = Depends(get_session)):
    try:
        users = session.exec(select(User)).all()
        emails = [user.email for user in users]
        
        # Returns array of email strings ["user1@gmail.com", "user2@gmail.com"]
        return emails
    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_401_UNAUTHORIZED,
            content={"error": str(e)}
        )


@router.get("/exists")
def check_user_exists(email: str = Query(...), session: Session = Depends(get_session)):
    try:
        user = session.exec(select(User).where(User.email == email)).first()
        
        # Returns boolean true or false
        return user is not None
    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_401_UNAUTHORIZED,
            content={"error": str(e)}
        )


@router.get("/ping")
def ping():
    try:
        # Returns string "greetings"
        return "greetings"
    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"error": str(e)}
        )
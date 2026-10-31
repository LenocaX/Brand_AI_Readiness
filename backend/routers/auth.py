from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session
from datetime import timedelta

from backend.database import get_db
from backend.models_db import User
from backend.schemas import UserRegisterRequest, UserLoginRequest, UserResponse
from backend.auth import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user,
    ACCESS_TOKEN_EXPIRE_MINUTES,
)

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register_user(request: UserRegisterRequest, response: Response, db: Session = Depends(get_db)):
    email = request.email.lower().strip()
    existing = db.query(User).filter(User.email == email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists.",
        )

    user = User(
        email=email,
        hashed_password=hash_password(request.password),
        full_name=request.full_name,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Automatically set session cookie upon registration
    token = create_access_token({"sub": user.id, "email": user.email})
    response.set_cookie(
        key="canopy_session",
        value=token,
        httponly=True,
        samesite="lax",
        secure=False,  # set True in HTTPS production
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )

    return user


@router.post("/login")
def login_user(request: UserLoginRequest, response: Response, db: Session = Depends(get_db)):
    email = request.email.lower().strip()
    user = db.query(User).filter(User.email == email).first()
    if not user or not verify_password(request.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been deactivated.",
        )

    token = create_access_token({"sub": user.id, "email": user.email})
    response.set_cookie(
        key="canopy_session",
        value=token,
        httponly=True,
        samesite="lax",
        secure=False,
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "created_at": user.created_at,
        },
    }


@router.post("/logout")
def logout_user(response: Response):
    response.delete_cookie(key="canopy_session")
    return {"message": "Logged out successfully."}


@router.get("/me", response_model=UserResponse)
def get_current_user_profile(user: User = Depends(get_current_user)):
    return user

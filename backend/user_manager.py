import uuid
import re
from typing import Optional
from models import User
from auth import get_password_hash, verify_password
from database import SessionLocal, UserDB


def generate_username_from_email(email: str) -> str:
    """
    Generate a username suggestion from an email address.
    Example: mrlabinotjaha@gmail.com -> mr_labinotjaha
    """
    # Get the part before @
    local_part = email.split("@")[0]

    # Replace dots and other special chars with underscores
    username = re.sub(r'[.\-+]', '_', local_part)

    # Remove any other non-alphanumeric characters except underscores
    username = re.sub(r'[^a-zA-Z0-9_]', '', username)

    # Remove consecutive underscores
    username = re.sub(r'_+', '_', username)

    # Remove leading/trailing underscores
    username = username.strip('_')

    # Ensure it's lowercase
    username = username.lower()

    # Ensure minimum length
    if len(username) < 3:
        username = username + "_user"

    return username


def get_unique_username(base_username: str) -> str:
    """Get a unique username by appending numbers if needed."""
    db = SessionLocal()
    try:
        username = base_username
        counter = 1
        while db.query(UserDB).filter(UserDB.username.ilike(username)).first():
            username = f"{base_username}_{counter}"
            counter += 1
        return username
    finally:
        db.close()


def suggest_username(email: str) -> str:
    """Suggest a unique username based on email."""
    base_username = generate_username_from_email(email)
    return get_unique_username(base_username)


def create_user(email: str, password: str, username: Optional[str] = None) -> Optional[User]:
    db = SessionLocal()
    try:
        # Check if email already exists
        if db.query(UserDB).filter(UserDB.email.ilike(email)).first():
            return None

        # Generate username if not provided
        if not username:
            username = suggest_username(email)
        else:
            # Check if provided username already exists
            if db.query(UserDB).filter(UserDB.username.ilike(username)).first():
                return None

        user_id = str(uuid.uuid4())
        hashed_password = get_password_hash(password)

        db_user = UserDB(
            id=user_id,
            username=username,
            email=email.lower(),
            hashed_password=hashed_password,
            google_id=None
        )
        db.add(db_user)
        db.commit()

        return User(id=user_id, username=username, email=email)
    finally:
        db.close()


def authenticate_user(username_or_email: str, password: str) -> Optional[User]:
    db = SessionLocal()
    try:
        # Try to find user by username first
        user = db.query(UserDB).filter(UserDB.username.ilike(username_or_email)).first()

        # If not found, try by email
        if not user:
            user = db.query(UserDB).filter(UserDB.email.ilike(username_or_email)).first()

        if not user:
            return None

        # Check if user has a password (Google-only users won't have one)
        if not user.hashed_password:
            return None

        if not verify_password(password, user.hashed_password):
            return None

        return User(id=user.id, username=user.username, email=user.email)
    finally:
        db.close()


def get_user_by_id(user_id: str) -> Optional[User]:
    db = SessionLocal()
    try:
        user = db.query(UserDB).filter(UserDB.id == user_id).first()
        if not user:
            return None
        return User(id=user.id, username=user.username, email=user.email)
    finally:
        db.close()


def update_user_profile(user_id: str, username: str) -> Optional[User]:
    """Update user's profile (username)."""
    db = SessionLocal()
    try:
        user = db.query(UserDB).filter(UserDB.id == user_id).first()
        if not user:
            return None

        # Check if new username is different
        if user.username.lower() == username.lower():
            return User(id=user.id, username=user.username, email=user.email)

        # Check if new username is already taken by another user
        existing = db.query(UserDB).filter(
            UserDB.username.ilike(username),
            UserDB.id != user_id
        ).first()
        if existing:
            return None

        # Update username
        user.username = username
        db.commit()

        return User(id=user.id, username=user.username, email=user.email)
    finally:
        db.close()


def change_user_password(user_id: str, current_password: str, new_password: str) -> bool:
    """Change user's password."""
    db = SessionLocal()
    try:
        user = db.query(UserDB).filter(UserDB.id == user_id).first()
        if not user:
            return False

        # Google-only users can't change password (they don't have one)
        if not user.hashed_password:
            return False

        # Verify current password
        if not verify_password(current_password, user.hashed_password):
            return False

        # Update password
        user.hashed_password = get_password_hash(new_password)
        db.commit()
        return True
    finally:
        db.close()


def delete_user_account(user_id: str, password: str) -> bool:
    """Delete user account after verifying password."""
    db = SessionLocal()
    try:
        user = db.query(UserDB).filter(UserDB.id == user_id).first()
        if not user:
            return False

        # Verify password (if they have one - Google users need their Google account)
        if user.hashed_password:
            if not verify_password(password, user.hashed_password):
                return False

        db.delete(user)
        db.commit()
        return True
    finally:
        db.close()


def get_or_create_google_user(google_id: str, email: str, name: str) -> User:
    """Get existing user by Google ID or create a new one."""
    db = SessionLocal()
    try:
        # Check if we already have this Google user
        user = db.query(UserDB).filter(UserDB.google_id == google_id).first()
        if user:
            return User(id=user.id, username=user.username, email=user.email)

        # Check if a user with this email already exists
        existing_user = db.query(UserDB).filter(UserDB.email.ilike(email)).first()
        if existing_user:
            # Link Google account to existing user
            existing_user.google_id = google_id
            db.commit()
            return User(id=existing_user.id, username=existing_user.username, email=existing_user.email)

        # Create new user
        user_id = str(uuid.uuid4())

        # Generate unique username from name or email
        if name:
            base_username = re.sub(r'[^a-zA-Z0-9_]', '_', name.lower())
            base_username = re.sub(r'_+', '_', base_username).strip('_')
        else:
            base_username = generate_username_from_email(email)

        username = get_unique_username(base_username)

        db_user = UserDB(
            id=user_id,
            username=username,
            email=email.lower(),
            hashed_password=None,  # Google users don't have a password
            google_id=google_id
        )
        db.add(db_user)
        db.commit()

        return User(id=user_id, username=username, email=email)
    finally:
        db.close()

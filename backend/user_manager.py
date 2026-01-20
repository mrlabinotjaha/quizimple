import uuid
import re
from typing import Optional
from models import User
from auth import get_password_hash, verify_password

# In-memory user storage
users_db: dict[str, dict] = {}  # user_id -> user data
username_to_id: dict[str, str] = {}  # username -> user_id
email_to_id: dict[str, str] = {}  # email -> user_id
google_id_to_user_id: dict[str, str] = {}  # google_id -> user_id


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
    username = base_username
    counter = 1
    while username.lower() in username_to_id:
        username = f"{base_username}_{counter}"
        counter += 1
    return username


def suggest_username(email: str) -> str:
    """Suggest a unique username based on email."""
    base_username = generate_username_from_email(email)
    return get_unique_username(base_username)


def create_user(email: str, password: str, username: Optional[str] = None) -> Optional[User]:
    # Check if email already exists
    if email.lower() in email_to_id:
        return None

    # Generate username if not provided
    if not username:
        username = suggest_username(email)
    else:
        # Check if provided username already exists
        if username.lower() in username_to_id:
            return None

    user_id = str(uuid.uuid4())
    hashed_password = get_password_hash(password)

    users_db[user_id] = {
        "id": user_id,
        "username": username,
        "email": email,
        "hashed_password": hashed_password,
        "google_id": None
    }
    username_to_id[username.lower()] = user_id
    email_to_id[email.lower()] = user_id

    return User(id=user_id, username=username, email=email)


def authenticate_user(username_or_email: str, password: str) -> Optional[User]:
    # Try to find user by username first
    user_id = username_to_id.get(username_or_email.lower())

    # If not found, try by email
    if not user_id:
        user_id = email_to_id.get(username_or_email.lower())

    if not user_id:
        return None

    user_data = users_db.get(user_id)
    if not user_data:
        return None

    # Check if user has a password (Google-only users won't have one)
    if not user_data.get("hashed_password"):
        return None

    if not verify_password(password, user_data["hashed_password"]):
        return None

    return User(id=user_data["id"], username=user_data["username"], email=user_data.get("email"))


def get_user_by_id(user_id: str) -> Optional[User]:
    user_data = users_db.get(user_id)
    if not user_data:
        return None
    return User(id=user_data["id"], username=user_data["username"], email=user_data.get("email"))


def update_user_profile(user_id: str, username: str) -> Optional[User]:
    """Update user's profile (username)."""
    user_data = users_db.get(user_id)
    if not user_data:
        return None

    # Check if new username is different
    old_username = user_data["username"]
    if old_username.lower() == username.lower():
        return User(id=user_data["id"], username=user_data["username"], email=user_data.get("email"))

    # Check if new username is already taken by another user
    if username.lower() in username_to_id and username_to_id[username.lower()] != user_id:
        return None

    # Update username
    del username_to_id[old_username.lower()]
    user_data["username"] = username
    username_to_id[username.lower()] = user_id

    return User(id=user_data["id"], username=user_data["username"], email=user_data.get("email"))


def change_user_password(user_id: str, current_password: str, new_password: str) -> bool:
    """Change user's password."""
    user_data = users_db.get(user_id)
    if not user_data:
        return False

    # Google-only users can't change password (they don't have one)
    if not user_data.get("hashed_password"):
        return False

    # Verify current password
    if not verify_password(current_password, user_data["hashed_password"]):
        return False

    # Update password
    user_data["hashed_password"] = get_password_hash(new_password)
    return True


def delete_user_account(user_id: str, password: str) -> bool:
    """Delete user account after verifying password."""
    user_data = users_db.get(user_id)
    if not user_data:
        return False

    # Verify password (if they have one - Google users need their Google account)
    if user_data.get("hashed_password"):
        if not verify_password(password, user_data["hashed_password"]):
            return False

    # Remove from all indices
    username = user_data.get("username")
    email = user_data.get("email")
    google_id = user_data.get("google_id")

    if username and username.lower() in username_to_id:
        del username_to_id[username.lower()]
    if email and email.lower() in email_to_id:
        del email_to_id[email.lower()]
    if google_id and google_id in google_id_to_user_id:
        del google_id_to_user_id[google_id]

    del users_db[user_id]
    return True


def get_or_create_google_user(google_id: str, email: str, name: str) -> User:
    """Get existing user by Google ID or create a new one."""
    # Check if we already have this Google user
    if google_id in google_id_to_user_id:
        user_id = google_id_to_user_id[google_id]
        user_data = users_db.get(user_id)
        if user_data:
            return User(id=user_data["id"], username=user_data["username"], email=user_data.get("email"))

    # Check if a user with this email already exists
    existing_user_id = email_to_id.get(email.lower())
    if existing_user_id:
        # Link Google account to existing user
        user_data = users_db.get(existing_user_id)
        if user_data:
            user_data["google_id"] = google_id
            google_id_to_user_id[google_id] = existing_user_id
            return User(id=user_data["id"], username=user_data["username"], email=user_data.get("email"))

    # Create new user
    user_id = str(uuid.uuid4())

    # Generate unique username from name or email
    if name:
        base_username = re.sub(r'[^a-zA-Z0-9_]', '_', name.lower())
        base_username = re.sub(r'_+', '_', base_username).strip('_')
    else:
        base_username = generate_username_from_email(email)

    username = get_unique_username(base_username)

    users_db[user_id] = {
        "id": user_id,
        "username": username,
        "email": email,
        "hashed_password": None,  # Google users don't have a password
        "google_id": google_id
    }
    username_to_id[username.lower()] = user_id
    email_to_id[email.lower()] = user_id
    google_id_to_user_id[google_id] = user_id

    return User(id=user_id, username=username, email=email)

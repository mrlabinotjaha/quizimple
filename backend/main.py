from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import json
import uuid
import os
from typing import Optional

from datetime import datetime
from models import (
    UserCreate, UserLogin, Token, QuizCreate, QuizUpdate, QuestionCreate,
    QuestionsImport, Quiz, Question, AIGenerateRequest, TemplateCreate,
    TemplateCategory, TemplateRating, TemplateUpdate, GoogleAuthRequest,
    UserUpdate, PasswordChange, AccountDelete, User, GroupCreate, GroupInvite, Group,
    AdminLogin, RoomState
)
from auth import create_access_token, get_current_user, decode_token
from user_manager import (
    create_user, authenticate_user, get_or_create_google_user, suggest_username,
    update_user_profile, change_user_password, delete_user_account, get_user_by_id
)
import httpx
from quiz_manager import (
    create_quiz, get_quiz, get_user_quizzes, add_question,
    import_questions, delete_question, delete_quiz, update_quiz_settings,
    update_all_questions_settings
)
from ai_service import generate_questions
from room_manager import (
    create_room, get_room, join_room, leave_room, start_quiz as start_room_quiz,
    submit_answer, calculate_scores, next_question, end_quiz,
    get_leaderboard, get_players_list, record_tab_switch,
    pause_quiz, resume_quiz, disconnect_player, reconnect_player, cleanup_disconnected
)
from session_manager import (
    save_session, get_session, get_quiz_sessions, get_quiz_analytics, get_user_sessions
)
from template_manager import (
    publish_template, get_template, get_all_templates, get_user_templates,
    increment_uses, rate_template, delete_template, get_featured_templates,
    get_categories_with_counts, verify_template_passcode, update_template,
    get_template_by_quiz_id, delete_all_templates, get_group_templates
)
from group_manager import (
    create_group as gm_create_group, get_group as gm_get_group,
    get_user_groups, add_member, remove_member as gm_remove_member,
    delete_group as gm_delete_group, is_group_member, invite_by_username
)
from database import init_db, SessionLocal, UserDB, QuizDB, TemplateDB, SessionDB, GroupDB, GroupMemberDB

app = FastAPI(title="Quiz App API")

# Initialize database tables on startup
@app.on_event("startup")
async def startup_event():
    import asyncio
    print("Initializing database...")
    try:
        loop = asyncio.get_event_loop()
        await asyncio.wait_for(loop.run_in_executor(None, init_db), timeout=30)
        print("Database initialized successfully!")
    except asyncio.TimeoutError:
        print("WARNING: Database init timed out after 30s - will retry on first request")
    except Exception as e:
        print(f"WARNING: Database init failed: {e}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Health check endpoint for Railway
@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "service": "quizimple-api"}


# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.room_connections: dict[str, dict[str, WebSocket]] = {}  # room_code -> {user_id: websocket}

    async def connect(self, websocket: WebSocket, room_code: str, user_id: str):
        await websocket.accept()
        if room_code not in self.room_connections:
            self.room_connections[room_code] = {}
        self.room_connections[room_code][user_id] = websocket

    def disconnect(self, room_code: str, user_id: str):
        if room_code in self.room_connections:
            self.room_connections[room_code].pop(user_id, None)
            if not self.room_connections[room_code]:
                del self.room_connections[room_code]

    async def send_to_user(self, room_code: str, user_id: str, message: dict):
        if room_code in self.room_connections and user_id in self.room_connections[room_code]:
            await self.room_connections[room_code][user_id].send_json(message)

    async def broadcast_to_room(self, room_code: str, message: dict):
        if room_code in self.room_connections:
            for websocket in self.room_connections[room_code].values():
                await websocket.send_json(message)


manager = ConnectionManager()

# Track room start times for session recording
room_start_times: dict[str, datetime] = {}


# Google OAuth configuration
GOOGLE_CLIENT_ID = None  # Set via environment variable in production

# Admin configuration
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "admin123")


from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

admin_security = HTTPBearer()


async def get_admin_user(credentials: HTTPAuthorizationCredentials = Depends(admin_security)) -> dict:
    """Dependency that checks the token has role=admin."""
    token = credentials.credentials
    payload = decode_token(token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if payload.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return payload


# Auth endpoints
@app.post("/api/auth/register", response_model=Token)
async def register(user_data: UserCreate):
    user = create_user(user_data.email, user_data.password, user_data.username)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email or username already exists"
        )
    token = create_access_token({"sub": user.id, "username": user.username})
    return Token(access_token=token)


@app.get("/api/auth/suggest-username")
async def get_username_suggestion(email: str):
    """Suggest a username based on email address."""
    if not email or "@" not in email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Valid email required"
        )
    return {"username": suggest_username(email)}


@app.post("/api/auth/login", response_model=Token)
async def login(user_data: UserLogin):
    user = authenticate_user(user_data.username, user_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username/email or password"
        )
    token = create_access_token({"sub": user.id, "username": user.username})
    return Token(access_token=token)


@app.post("/api/auth/google", response_model=Token)
async def google_auth(auth_data: GoogleAuthRequest):
    """Authenticate with Google OAuth."""
    try:
        # Verify the Google ID token
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"https://oauth2.googleapis.com/tokeninfo?id_token={auth_data.credential}"
            )
            if response.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid Google token"
                )

            token_info = response.json()

            # Extract user info from the token
            google_id = token_info.get("sub")
            email = token_info.get("email")
            name = token_info.get("name", "")

            if not google_id or not email:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid token data"
                )

            # Get or create user
            user = get_or_create_google_user(google_id, email, name)

            # Create JWT token
            token = create_access_token({"sub": user.id, "username": user.username})
            return Token(access_token=token)

    except httpx.RequestError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Could not verify Google token"
        )


@app.get("/api/auth/me", response_model=User)
async def get_me(current_user: dict = Depends(get_current_user)):
    user = get_user_by_id(current_user["id"])
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return user


# User management endpoints
@app.patch("/api/users/me", response_model=User)
async def update_profile(user_data: UserUpdate, current_user: dict = Depends(get_current_user)):
    """Update current user's profile."""
    updated_user = update_user_profile(current_user["id"], user_data.username)
    if not updated_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken"
        )
    return updated_user


@app.put("/api/users/me/password")
async def change_password(data: PasswordChange, current_user: dict = Depends(get_current_user)):
    """Change current user's password."""
    if not change_user_password(current_user["id"], data.current_password, data.new_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )
    return {"message": "Password changed successfully"}


@app.delete("/api/users/me")
async def delete_account(data: AccountDelete, current_user: dict = Depends(get_current_user)):
    """Delete current user's account."""
    if not delete_user_account(current_user["id"], data.password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect password"
        )
    return {"message": "Account deleted successfully"}


# Quiz endpoints
@app.post("/api/quizzes", response_model=Quiz)
async def create_new_quiz(quiz_data: QuizCreate, current_user: dict = Depends(get_current_user)):
    quiz = create_quiz(quiz_data.name, current_user["id"], quiz_data.hide_results, quiz_data.fun_mode)
    return quiz


@app.get("/api/quizzes")
async def list_quizzes(current_user: dict = Depends(get_current_user)):
    quizzes = get_user_quizzes(current_user["id"])
    return quizzes


@app.get("/api/quizzes/{quiz_id}")
async def get_quiz_by_id(quiz_id: str, current_user: dict = Depends(get_current_user)):
    quiz = get_quiz(quiz_id)
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    if quiz.owner_id != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    return quiz


@app.delete("/api/quizzes/{quiz_id}")
async def delete_quiz_by_id(quiz_id: str, current_user: dict = Depends(get_current_user)):
    quiz = get_quiz(quiz_id)
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    if quiz.owner_id != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    delete_quiz(quiz_id)
    return {"message": "Quiz deleted"}


@app.patch("/api/quizzes/{quiz_id}", response_model=Quiz)
async def update_quiz(quiz_id: str, quiz_data: QuizUpdate, current_user: dict = Depends(get_current_user)):
    quiz = get_quiz(quiz_id)
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    if quiz.owner_id != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    updated_quiz = update_quiz_settings(quiz_id, quiz_data.hide_results, quiz_data.fun_mode)
    return updated_quiz


@app.post("/api/quizzes/{quiz_id}/questions", response_model=Question)
async def add_quiz_question(
    quiz_id: str,
    question_data: QuestionCreate,
    current_user: dict = Depends(get_current_user)
):
    quiz = get_quiz(quiz_id)
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    if quiz.owner_id != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    question = add_question(quiz_id, question_data)
    if not question:
        raise HTTPException(status_code=400, detail="Failed to add question")
    return question


@app.post("/api/quizzes/{quiz_id}/questions/import")
async def import_quiz_questions(
    quiz_id: str,
    data: QuestionsImport,
    current_user: dict = Depends(get_current_user)
):
    quiz = get_quiz(quiz_id)
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    if quiz.owner_id != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    questions = import_questions(quiz_id, data.questions, replace=data.replace)
    action = "Replaced with" if data.replace else "Imported"
    return {"message": f"{action} {len(questions)} questions", "count": len(questions)}


@app.post("/api/quizzes/{quiz_id}/questions/generate")
async def generate_quiz_questions(
    quiz_id: str,
    data: AIGenerateRequest,
    current_user: dict = Depends(get_current_user)
):
    quiz = get_quiz(quiz_id)
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    if quiz.owner_id != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    try:
        questions = generate_questions(data.prompt)
        imported = import_questions(quiz_id, questions, replace=data.replace)
        action = "Replaced with" if data.replace else "Generated and added"
        return {
            "message": f"{action} {len(imported)} questions",
            "count": len(imported),
            "questions": [q.model_dump() for q in imported]
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI generation failed: {str(e)}")


@app.delete("/api/quizzes/{quiz_id}/questions/{question_index}")
async def delete_quiz_question(
    quiz_id: str,
    question_index: int,
    current_user: dict = Depends(get_current_user)
):
    quiz = get_quiz(quiz_id)
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    if quiz.owner_id != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    if not delete_question(quiz_id, question_index):
        raise HTTPException(status_code=400, detail="Failed to delete question")
    return {"message": "Question deleted"}


class BulkQuestionUpdate(BaseModel):
    time_limit: Optional[int] = None
    points: Optional[int] = None


@app.patch("/api/quizzes/{quiz_id}/questions/bulk")
async def bulk_update_questions(
    quiz_id: str,
    data: BulkQuestionUpdate,
    current_user: dict = Depends(get_current_user)
):
    quiz = get_quiz(quiz_id)
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    if quiz.owner_id != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    if data.time_limit is None and data.points is None:
        raise HTTPException(status_code=400, detail="No updates provided")

    updated_count = update_all_questions_settings(quiz_id, data.time_limit, data.points)
    return {"message": f"Updated {updated_count} questions", "count": updated_count}


# Room endpoints
@app.post("/api/rooms")
async def create_new_room(quiz_id: str, current_user: dict = Depends(get_current_user)):
    quiz = get_quiz(quiz_id)
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    if quiz.owner_id != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    room = create_room(quiz_id, current_user["id"])
    if not room:
        raise HTTPException(status_code=400, detail="Failed to create room")
    return {"room_code": room.code}


@app.get("/api/rooms/{room_code}")
async def get_room_info(room_code: str, current_user: dict = Depends(get_current_user)):
    room = get_room(room_code)
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")

    quiz = get_quiz(room.quiz_id)

    return {
        "code": room.code,
        "quiz_name": quiz.name if quiz else "Unknown",
        "state": room.state,
        "is_host": room.host_id == current_user["id"],
        "players": get_players_list(room_code),
        "current_question": room.current_question,
        "total_questions": len(quiz.questions) if quiz else 0
    }


# Session endpoints
@app.get("/api/sessions")
async def list_user_sessions(current_user: dict = Depends(get_current_user)):
    """Get all quiz sessions hosted by the current user."""
    sessions = get_user_sessions(current_user["id"])
    return sessions


@app.get("/api/quizzes/{quiz_id}/sessions")
async def list_quiz_sessions(quiz_id: str, current_user: dict = Depends(get_current_user)):
    """Get all sessions for a specific quiz."""
    quiz = get_quiz(quiz_id)
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    if quiz.owner_id != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    sessions = get_quiz_sessions(quiz_id)
    return sessions


@app.get("/api/quizzes/{quiz_id}/analytics")
async def get_quiz_analytics_endpoint(quiz_id: str, current_user: dict = Depends(get_current_user)):
    """Get aggregated analytics for a quiz."""
    quiz = get_quiz(quiz_id)
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    if quiz.owner_id != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    analytics = get_quiz_analytics(quiz_id)
    return analytics


@app.get("/api/sessions/{session_id}")
async def get_session_details(session_id: str, current_user: dict = Depends(get_current_user)):
    """Get detailed information about a specific session."""
    session = get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.host_id != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    return session


# Template Market endpoints
@app.get("/api/templates")
async def list_templates(
    request: Request,
    category: Optional[str] = None,
    search: Optional[str] = None,
    sort_by: str = "uses"
):
    """Get all templates from the marketplace."""
    cat = None
    if category:
        try:
            cat = TemplateCategory(category)
        except ValueError:
            pass

    # Try to get current user for group filtering (optional auth)
    user_id = None
    auth_header = request.headers.get("authorization", "")
    if auth_header.startswith("Bearer "):
        token = auth_header.split(" ", 1)[1]
        payload = decode_token(token)
        if payload:
            user_id = payload.get("sub")

    templates = get_all_templates(category=cat, search=search, sort_by=sort_by, user_id=user_id)
    return templates


@app.get("/api/templates/featured")
async def get_featured(request: Request):
    """Get featured templates."""
    # Try to get current user for group filtering (optional auth)
    user_id = None
    auth_header = request.headers.get("authorization", "")
    if auth_header.startswith("Bearer "):
        token = auth_header.split(" ", 1)[1]
        payload = decode_token(token)
        if payload:
            user_id = payload.get("sub")

    templates = get_featured_templates(user_id=user_id)
    return templates


@app.get("/api/templates/categories")
async def get_categories():
    """Get all categories with template counts."""
    return get_categories_with_counts()


@app.get("/api/templates/group/{group_id}")
async def get_group_templates_endpoint(group_id: str, current_user: dict = Depends(get_current_user)):
    """Get all templates in a group (must be a member)."""
    if not is_group_member(group_id, current_user["id"]):
        raise HTTPException(status_code=403, detail="Not a member of this group")
    return get_group_templates(group_id)


@app.get("/api/templates/mine")
async def get_my_templates(current_user: dict = Depends(get_current_user)):
    """Get templates published by the current user."""
    templates = get_user_templates(current_user["id"])
    return templates


@app.get("/api/templates/{template_id}")
async def get_template_details(template_id: str):
    """Get details of a specific template including questions."""
    template = get_template(template_id)
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    # Get the original quiz to include questions
    original_quiz = get_quiz(template.quiz_id)

    # Return template with questions
    template_dict = template.model_dump()
    template_dict["questions"] = [q.model_dump() for q in original_quiz.questions] if original_quiz else []

    return template_dict


@app.post("/api/quizzes/{quiz_id}/publish")
async def publish_quiz_as_template(
    quiz_id: str,
    data: TemplateCreate,
    current_user: dict = Depends(get_current_user)
):
    """Publish a quiz as a template to the marketplace."""
    quiz = get_quiz(quiz_id)
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    if quiz.owner_id != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    if len(quiz.questions) < 1:
        raise HTTPException(status_code=400, detail="Quiz must have at least 1 question")

    # Prevent duplicate - if template already exists for this quiz, return error
    existing = get_template_by_quiz_id(quiz_id)
    if existing:
        raise HTTPException(status_code=400, detail="Template already exists for this quiz. Use edit instead.")

    template = publish_template(
        quiz_id=quiz_id,
        name=data.name,
        description=data.description,
        category=data.category,
        author_id=current_user["id"],
        author_name=current_user["username"],
        questions_count=len(quiz.questions),
        tags=data.tags,
        is_private=data.is_private,
        passcode=data.passcode,
        visibility=data.visibility,
        group_id=data.group_id
    )
    return template


class TemplatePasscodeVerify(BaseModel):
    passcode: str


@app.post("/api/templates/{template_id}/verify")
async def verify_template_passcode_endpoint(template_id: str, data: TemplatePasscodeVerify):
    """Verify a passcode for a private template."""
    template = get_template(template_id)
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    if not template.is_private:
        return {"valid": True}
    if not verify_template_passcode(template_id, data.passcode):
        raise HTTPException(status_code=403, detail="Incorrect passcode")
    return {"valid": True}


class TemplateUseRequest(BaseModel):
    passcode: Optional[str] = None


@app.post("/api/templates/{template_id}/use")
async def use_template(template_id: str, data: TemplateUseRequest = TemplateUseRequest(), current_user: dict = Depends(get_current_user)):
    """Create a copy of a template as a new quiz."""
    template = get_template(template_id)
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    # Check passcode for private templates
    if template.is_private:
        if not data.passcode:
            raise HTTPException(status_code=403, detail="Passcode required")
        if not verify_template_passcode(template_id, data.passcode):
            raise HTTPException(status_code=403, detail="Incorrect passcode")

    # Get the original quiz
    original_quiz = get_quiz(template.quiz_id)
    if not original_quiz:
        raise HTTPException(status_code=404, detail="Template source quiz not found")

    # Create a new quiz with the same questions
    new_quiz = create_quiz(
        name=f"{template.name} (Copy)",
        owner_id=current_user["id"],
        hide_results=original_quiz.hide_results
    )

    # Copy questions
    from models import QuestionCreate
    questions_to_import = [
        QuestionCreate(
            text=q.text,
            type=q.type,
            options=q.options,
            correct=q.correct,
            time_limit=q.time_limit,
            points=q.points
        )
        for q in original_quiz.questions
    ]
    import_questions(new_quiz.id, questions_to_import)

    # Increment uses count
    increment_uses(template_id)

    # Get the updated quiz with questions
    updated_quiz = get_quiz(new_quiz.id)
    return updated_quiz


@app.post("/api/templates/{template_id}/rate")
async def rate_template_endpoint(
    template_id: str,
    data: TemplateRating,
    current_user: dict = Depends(get_current_user)
):
    """Rate a template (1-5 stars)."""
    template = rate_template(template_id, current_user["id"], data.rating)
    if not template:
        raise HTTPException(status_code=404, detail="Template not found or invalid rating")
    return template


@app.patch("/api/templates/{template_id}")
async def update_template_endpoint(
    template_id: str,
    data: TemplateUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update a template (only by author)."""
    updated = update_template(
        template_id=template_id,
        user_id=current_user["id"],
        name=data.name,
        description=data.description,
        category=data.category,
        tags=data.tags,
        is_private=data.is_private,
        passcode=data.passcode,
        visibility=data.visibility,
        group_id=data.group_id
    )
    if not updated:
        raise HTTPException(status_code=404, detail="Template not found or not authorized")
    return updated


@app.delete("/api/templates/all")
async def delete_all_templates_endpoint(current_user: dict = Depends(get_current_user)):
    """Delete all templates. Admin cleanup."""
    count = delete_all_templates()
    return {"message": f"Deleted {count} templates"}


@app.delete("/api/templates/{template_id}")
async def delete_template_endpoint(template_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a template (only by author)."""
    if not delete_template(template_id, current_user["id"]):
        raise HTTPException(status_code=404, detail="Template not found or not authorized")
    return {"message": "Template deleted"}


# Group endpoints
@app.post("/api/groups")
async def create_group_endpoint(data: GroupCreate, current_user: dict = Depends(get_current_user)):
    """Create a new group."""
    group = gm_create_group(data.name, current_user["id"])
    return group


@app.get("/api/groups")
async def list_user_groups_endpoint(current_user: dict = Depends(get_current_user)):
    """Get all groups the current user is a member of."""
    groups = get_user_groups(current_user["id"])
    return groups


@app.get("/api/groups/{group_id}")
async def get_group_endpoint(group_id: str, current_user: dict = Depends(get_current_user)):
    """Get group details."""
    group = gm_get_group(group_id)
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    if not is_group_member(group_id, current_user["id"]):
        raise HTTPException(status_code=403, detail="Not a member of this group")
    return group


@app.post("/api/groups/{group_id}/invite")
async def invite_to_group(group_id: str, data: GroupInvite, current_user: dict = Depends(get_current_user)):
    """Invite a user to a group by username. Only the owner can invite."""
    group = gm_get_group(group_id)
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    if group.owner_id != current_user["id"]:
        raise HTTPException(status_code=403, detail="Only the group owner can invite members")
    result = invite_by_username(group_id, data.username)
    if not result:
        raise HTTPException(status_code=400, detail="User not found or already a member")
    return result


@app.delete("/api/groups/{group_id}/members/{user_id}")
async def remove_from_group(group_id: str, user_id: str, current_user: dict = Depends(get_current_user)):
    """Remove a member from a group. Only the owner can remove members."""
    group = gm_get_group(group_id)
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    if group.owner_id != current_user["id"]:
        raise HTTPException(status_code=403, detail="Only the group owner can remove members")
    if not gm_remove_member(group_id, user_id):
        raise HTTPException(status_code=400, detail="Cannot remove user (not found or is owner)")
    return {"message": "Member removed"}


@app.delete("/api/groups/{group_id}")
async def delete_group_endpoint(group_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a group. Only the owner can delete."""
    if not gm_delete_group(group_id, current_user["id"]):
        raise HTTPException(status_code=404, detail="Group not found or not authorized")
    return {"message": "Group deleted"}


@app.delete("/api/groups/{group_id}/leave")
async def leave_group(group_id: str, current_user: dict = Depends(get_current_user)):
    """Leave a group. The owner cannot leave (must delete instead)."""
    if not gm_remove_member(group_id, current_user["id"]):
        raise HTTPException(status_code=400, detail="Cannot leave group (not a member or you are the owner)")
    return {"message": "Left group"}


# WebSocket endpoint
@app.websocket("/ws/{room_code}")
async def websocket_endpoint(
    websocket: WebSocket,
    room_code: str,
    token: Optional[str] = None,
    guest_name: Optional[str] = None,
    guest_id: Optional[str] = None
):
    user_id: str
    username: str
    is_guest = False

    if token:
        # Authenticated user
        payload = decode_token(token)
        if not payload:
            await websocket.close(code=4001)
            return
        user_id = payload.get("sub")
        username = payload.get("username")
    elif guest_name:
        # Guest user - reuse existing ID if reconnecting, otherwise generate new
        room = get_room(room_code)
        if guest_id and room and guest_id in room.players:
            user_id = guest_id
            username = room.players[guest_id].username
        else:
            user_id = f"guest_{uuid.uuid4().hex[:8]}"
            username = guest_name.strip()[:20]
        is_guest = True
    else:
        await websocket.close(code=4001)
        return

    room = get_room(room_code)
    if not room:
        await websocket.close(code=4004)
        return

    # Check if this is a reconnection
    is_reconnection = user_id in room.players and room.players[user_id].disconnected_at is not None
    if is_reconnection:
        reconnect_player(room_code, user_id)

    await manager.connect(websocket, room_code, user_id)

    # If reconnecting, broadcast updated player list
    if is_reconnection:
        await manager.broadcast_to_room(room_code, {
            "event": "player_joined",
            "data": {"players": get_players_list(room_code)}
        })

    try:
        # Send current room state
        quiz = get_quiz(room.quiz_id)
        connected_data = {
            "room_code": room_code,
            "state": room.state,
            "is_host": room.host_id == user_id,
            "players": get_players_list(room_code),
            "current_question": room.current_question,
            "total_questions": len(quiz.questions) if quiz else 0,
            "user_id": user_id
        }

        # If game is in progress, include current question so reconnecting players can continue
        if room.state == RoomState.PLAYING and quiz and room.current_question < len(quiz.questions):
            question = quiz.questions[room.current_question]
            connected_data["question"] = {
                "text": question.text,
                "type": question.type,
                "options": question.options,
                "time_limit": question.time_limit,
                "points": question.points,
                "correct": question.correct  # For host display
            }
            connected_data["fun_mode"] = quiz.fun_mode

        await websocket.send_json({
            "event": "connected",
            "data": connected_data
        })

        while True:
            data = await websocket.receive_json()
            event = data.get("event")

            if event == "join_room":
                player = join_room(room_code, user_id, username)
                if player:
                    await manager.broadcast_to_room(room_code, {
                        "event": "player_joined",
                        "data": {"players": get_players_list(room_code)}
                    })

            elif event == "start_quiz":
                if start_room_quiz(room_code, user_id):
                    # Record start time for session tracking
                    room_start_times[room_code] = datetime.utcnow()
                    print(f"[DEBUG] Quiz started - room_code: {room_code}, start_time set: {room_start_times[room_code]}")

                    quiz = get_quiz(room.quiz_id)
                    if quiz and len(quiz.questions) > 0:
                        question = quiz.questions[0]
                        await manager.broadcast_to_room(room_code, {
                            "event": "quiz_started",
                            "data": {
                                "question": {
                                    "text": question.text,
                                    "type": question.type,
                                    "options": question.options,
                                    "time_limit": question.time_limit,
                                    "points": question.points,
                                    "correct": question.correct  # For host display
                                },
                                "index": 0,
                                "total": len(quiz.questions),
                                "fun_mode": quiz.fun_mode
                            }
                        })

            elif event == "submit_answer":
                question_index = data.get("data", {}).get("question_index")
                answers = data.get("data", {}).get("answers", [])

                if submit_answer(room_code, user_id, question_index, answers):
                    room = get_room(room_code)
                    await manager.broadcast_to_room(room_code, {
                        "event": "answer_received",
                        "data": {
                            "count": room.answers_received,
                            "total": len(room.players)
                        }
                    })

                    # Auto-trigger when all players have answered
                    if room.answers_received >= len(room.players) and len(room.players) > 0:
                        await manager.broadcast_to_room(room_code, {
                            "event": "all_answered"
                        })

            elif event == "tab_switch":
                # Record tab switch for cheat detection
                record_tab_switch(room_code, user_id)

            elif event == "pause_quiz":
                time_remaining = data.get("data", {}).get("time_remaining", 0)
                if pause_quiz(room_code, user_id, time_remaining):
                    await manager.broadcast_to_room(room_code, {
                        "event": "quiz_paused",
                        "data": {"time_remaining": time_remaining}
                    })

            elif event == "resume_quiz":
                time_remaining = resume_quiz(room_code, user_id)
                if time_remaining >= 0:
                    await manager.broadcast_to_room(room_code, {
                        "event": "quiz_resumed",
                        "data": {"time_remaining": time_remaining}
                    })

            elif event == "show_results":
                scores = calculate_scores(room_code)
                room = get_room(room_code)
                quiz = get_quiz(room.quiz_id)

                if quiz and room.current_question < len(quiz.questions):
                    question = quiz.questions[room.current_question]
                    player_answers = {}
                    for pid, player in room.players.items():
                        player_answers[player.username] = player.answers.get(room.current_question, [])

                    await manager.broadcast_to_room(room_code, {
                        "event": "question_results",
                        "data": {
                            "correct": question.correct,
                            "scores": {room.players[uid].username: score for uid, score in scores.items()},
                            "answers": player_answers,
                            "hide_results": quiz.hide_results
                        }
                    })

            elif event == "next_question":
                # Calculate scores for current question before moving on
                calculate_scores(room_code)

                if next_question(room_code, user_id):
                    room = get_room(room_code)
                    quiz = get_quiz(room.quiz_id)

                    if quiz and room.current_question < len(quiz.questions):
                        question = quiz.questions[room.current_question]
                        await manager.broadcast_to_room(room_code, {
                            "event": "next_question",
                            "data": {
                                "question": {
                                    "text": question.text,
                                    "type": question.type,
                                    "options": question.options,
                                    "time_limit": question.time_limit,
                                    "points": question.points,
                                    "correct": question.correct  # For host display
                                },
                                "index": room.current_question,
                                "total": len(quiz.questions),
                                "fun_mode": quiz.fun_mode
                            }
                        })
                else:
                    # Quiz ended - save session
                    room = get_room(room_code)
                    quiz = get_quiz(room.quiz_id)

                    print(f"[DEBUG] Quiz ended via next_question - room_code: {room_code}")
                    print(f"[DEBUG] room_start_times keys: {list(room_start_times.keys())}")
                    print(f"[DEBUG] room_code in room_start_times: {room_code in room_start_times}")
                    print(f"[DEBUG] quiz exists: {quiz is not None}")
                    if room:
                        print(f"[DEBUG] quiz_id: {room.quiz_id}, players count: {len(room.players)}")

                    # Save session if we have a start time
                    session_data = None
                    if room_code in room_start_times and quiz:
                        try:
                            saved_session = save_session(
                                quiz_id=room.quiz_id,
                                quiz_name=quiz.name,
                                room_code=room_code,
                                host_id=room.host_id,
                                started_at=room_start_times[room_code],
                                players=room.players,
                                questions=quiz.questions
                            )
                            session_data = {"session_id": saved_session.id}
                            print(f"[DEBUG] Session saved - session_id: {saved_session.id}, quiz_id: {room.quiz_id}")
                        except Exception as e:
                            print(f"[DEBUG] ERROR saving session: {e}")
                            import traceback
                            traceback.print_exc()
                        finally:
                            del room_start_times[room_code]
                    else:
                        print(f"[DEBUG] Session NOT saved - room_code in room_start_times: {room_code in room_start_times}, quiz: {quiz is not None}")

                    # Prepare questions for review (with correct answers)
                    questions_review = []
                    if quiz:
                        for q in quiz.questions:
                            questions_review.append({
                                "text": q.text,
                                "type": q.type,
                                "options": q.options,
                                "correct": q.correct,
                                "points": q.points
                            })

                    await manager.broadcast_to_room(room_code, {
                        "event": "quiz_ended",
                        "data": {
                            "leaderboard": get_leaderboard(room_code),
                            "hide_results": quiz.hide_results if quiz else False,
                            "session": session_data,
                            "questions": questions_review
                        }
                    })

            elif event == "end_quiz":
                print(f"[DEBUG] end_quiz event received - room_code: {room_code}, user_id: {user_id}")
                if end_quiz(room_code, user_id):
                    room = get_room(room_code)
                    quiz = get_quiz(room.quiz_id)

                    print(f"[DEBUG] Quiz ended via end_quiz - room_code: {room_code}")
                    print(f"[DEBUG] room_code in room_start_times: {room_code in room_start_times}")

                    # Save session if we have a start time
                    session_data = None
                    if room_code in room_start_times and quiz:
                        try:
                            saved_session = save_session(
                                quiz_id=room.quiz_id,
                                quiz_name=quiz.name,
                                room_code=room_code,
                                host_id=room.host_id,
                                started_at=room_start_times[room_code],
                                players=room.players,
                                questions=quiz.questions
                            )
                            session_data = {"session_id": saved_session.id}
                            print(f"[DEBUG] Session saved via end_quiz - session_id: {saved_session.id}")
                        except Exception as e:
                            print(f"[DEBUG] ERROR saving session via end_quiz: {e}")
                            import traceback
                            traceback.print_exc()
                        finally:
                            del room_start_times[room_code]
                    else:
                        print(f"[DEBUG] Session NOT saved via end_quiz - room_code in room_start_times: {room_code in room_start_times}")

                    # Prepare questions for review (with correct answers)
                    questions_review = []
                    if quiz:
                        for q in quiz.questions:
                            questions_review.append({
                                "text": q.text,
                                "type": q.type,
                                "options": q.options,
                                "correct": q.correct,
                                "points": q.points
                            })

                    await manager.broadcast_to_room(room_code, {
                        "event": "quiz_ended",
                        "data": {
                            "leaderboard": get_leaderboard(room_code),
                            "hide_results": quiz.hide_results if quiz else False,
                            "session": session_data,
                            "questions": questions_review
                        }
                    })

    except WebSocketDisconnect:
        manager.disconnect(room_code, user_id)

        # Don't remove player immediately — use grace period
        room = get_room(room_code)
        if room and room.state == RoomState.LOBBY:
            # In lobby, remove immediately
            leave_room(room_code, user_id)
            await manager.broadcast_to_room(room_code, {
                "event": "player_left",
                "data": {"players": get_players_list(room_code)}
            })
        elif room and user_id in room.players and room.host_id != user_id:
            # Player disconnected during game — mark as disconnected and auto-pause
            player_name = room.players[user_id].username
            disconnect_player(room_code, user_id)

            # Auto-pause the quiz so host can decide
            if not room.paused:
                # Calculate approximate time remaining (rough estimate)
                quiz = get_quiz(room.quiz_id)
                time_remaining = 0
                if quiz and room.current_question < len(quiz.questions):
                    time_remaining = quiz.questions[room.current_question].time_limit
                pause_quiz(room_code, room.host_id, time_remaining)

                await manager.broadcast_to_room(room_code, {
                    "event": "quiz_paused",
                    "data": {"time_remaining": time_remaining}
                })

            # Notify host about the disconnection
            await manager.broadcast_to_room(room_code, {
                "event": "player_disconnected",
                "data": {
                    "username": player_name,
                    "players": get_players_list(room_code)
                }
            })

            # Schedule cleanup after 60 seconds if still disconnected
            import asyncio
            async def _cleanup_after_grace():
                await asyncio.sleep(60)
                removed = cleanup_disconnected(room_code, grace_seconds=60)
                if removed:
                    await manager.broadcast_to_room(room_code, {
                        "event": "player_left",
                        "data": {"players": get_players_list(room_code)}
                    })
            asyncio.create_task(_cleanup_after_grace())
        elif room and user_id == room.host_id:
            # Host disconnected — just remove from connection manager, don't remove from room
            pass


# ==================== Admin Dashboard Endpoints ====================

@app.post("/api/admin/login")
async def admin_login(data: AdminLogin):
    """Admin login with hardcoded password."""
    if data.password != ADMIN_PASSWORD:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid admin password",
        )
    token = create_access_token({"sub": "admin", "role": "admin"})
    return {"access_token": token, "token_type": "bearer"}


@app.get("/api/admin/stats")
async def admin_stats(admin: dict = Depends(get_admin_user)):
    """Get admin dashboard statistics."""
    db = SessionLocal()
    try:
        from sqlalchemy import func

        total_users = db.query(func.count(UserDB.id)).scalar() or 0
        total_quizzes = db.query(func.count(QuizDB.id)).scalar() or 0
        total_templates = db.query(func.count(TemplateDB.id)).scalar() or 0
        total_sessions = db.query(func.count(SessionDB.id)).scalar() or 0
        total_groups = db.query(func.count(GroupDB.id)).scalar() or 0

        # Recent users with quiz count
        recent_users_rows = db.query(UserDB).order_by(UserDB.created_at.desc()).limit(10).all()
        recent_users = []
        for u in recent_users_rows:
            quiz_count = db.query(func.count(QuizDB.id)).filter(QuizDB.owner_id == u.id).scalar() or 0
            recent_users.append({
                "id": u.id,
                "username": u.username,
                "email": u.email,
                "created_at": u.created_at.isoformat() if u.created_at else None,
                "quiz_count": quiz_count,
            })

        # Recent quizzes with owner username and question count
        recent_quizzes_rows = (
            db.query(QuizDB, UserDB.username)
            .join(UserDB, QuizDB.owner_id == UserDB.id)
            .order_by(QuizDB.created_at.desc())
            .limit(10)
            .all()
        )
        recent_quizzes = []
        for quiz, owner_username in recent_quizzes_rows:
            question_count = len(quiz.questions) if quiz.questions else 0
            recent_quizzes.append({
                "id": quiz.id,
                "name": quiz.name,
                "owner_username": owner_username,
                "question_count": question_count,
                "created_at": quiz.created_at.isoformat() if quiz.created_at else None,
            })

        # Recent templates
        recent_templates_rows = db.query(TemplateDB).order_by(TemplateDB.created_at.desc()).limit(10).all()
        recent_templates = []
        for t in recent_templates_rows:
            recent_templates.append({
                "id": t.id,
                "name": t.name,
                "author_name": t.author_name,
                "visibility": t.visibility,
                "uses_count": t.uses_count,
                "created_at": t.created_at.isoformat() if t.created_at else None,
            })

        return {
            "total_users": total_users,
            "total_quizzes": total_quizzes,
            "total_templates": total_templates,
            "total_sessions": total_sessions,
            "total_groups": total_groups,
            "recent_users": recent_users,
            "recent_quizzes": recent_quizzes,
            "recent_templates": recent_templates,
        }
    finally:
        db.close()


# Admin Users CRUD
@app.get("/api/admin/users")
async def admin_list_users(admin: dict = Depends(get_admin_user)):
    """List all users."""
    db = SessionLocal()
    try:
        from sqlalchemy import func

        users = db.query(UserDB).order_by(UserDB.created_at.desc()).all()
        result = []
        for u in users:
            quiz_count = db.query(func.count(QuizDB.id)).filter(QuizDB.owner_id == u.id).scalar() or 0
            result.append({
                "id": u.id,
                "username": u.username,
                "email": u.email,
                "created_at": u.created_at.isoformat() if u.created_at else None,
                "quiz_count": quiz_count,
            })
        return result
    finally:
        db.close()


@app.delete("/api/admin/users/{user_id}")
async def admin_delete_user(user_id: str, admin: dict = Depends(get_admin_user)):
    """Delete a user and all their data."""
    db = SessionLocal()
    try:
        user = db.query(UserDB).filter(UserDB.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        db.delete(user)
        db.commit()
        return {"message": f"User '{user.username}' deleted successfully"}
    finally:
        db.close()


# Admin Quizzes CRUD
@app.get("/api/admin/quizzes")
async def admin_list_quizzes(admin: dict = Depends(get_admin_user)):
    """List all quizzes."""
    db = SessionLocal()
    try:
        rows = (
            db.query(QuizDB, UserDB.username)
            .join(UserDB, QuizDB.owner_id == UserDB.id)
            .order_by(QuizDB.created_at.desc())
            .all()
        )
        result = []
        for quiz, owner_username in rows:
            question_count = len(quiz.questions) if quiz.questions else 0
            result.append({
                "id": quiz.id,
                "name": quiz.name,
                "owner_id": quiz.owner_id,
                "owner_username": owner_username,
                "question_count": question_count,
                "created_at": quiz.created_at.isoformat() if quiz.created_at else None,
            })
        return result
    finally:
        db.close()


@app.delete("/api/admin/quizzes/{quiz_id}")
async def admin_delete_quiz(quiz_id: str, admin: dict = Depends(get_admin_user)):
    """Delete a quiz."""
    db = SessionLocal()
    try:
        quiz = db.query(QuizDB).filter(QuizDB.id == quiz_id).first()
        if not quiz:
            raise HTTPException(status_code=404, detail="Quiz not found")
        db.delete(quiz)
        db.commit()
        return {"message": f"Quiz '{quiz.name}' deleted successfully"}
    finally:
        db.close()


# Admin Templates CRUD
@app.get("/api/admin/templates")
async def admin_list_templates(admin: dict = Depends(get_admin_user)):
    """List all templates."""
    db = SessionLocal()
    try:
        templates = db.query(TemplateDB).order_by(TemplateDB.created_at.desc()).all()
        result = []
        for t in templates:
            result.append({
                "id": t.id,
                "name": t.name,
                "author_name": t.author_name,
                "visibility": t.visibility,
                "category": t.category,
                "uses_count": t.uses_count,
                "rating": t.rating,
                "created_at": t.created_at.isoformat() if t.created_at else None,
            })
        return result
    finally:
        db.close()


@app.delete("/api/admin/templates/{template_id}")
async def admin_delete_template(template_id: str, admin: dict = Depends(get_admin_user)):
    """Delete a template."""
    db = SessionLocal()
    try:
        template = db.query(TemplateDB).filter(TemplateDB.id == template_id).first()
        if not template:
            raise HTTPException(status_code=404, detail="Template not found")
        db.delete(template)
        db.commit()
        return {"message": f"Template '{template.name}' deleted successfully"}
    finally:
        db.close()


# Admin Groups CRUD
@app.get("/api/admin/groups")
async def admin_list_groups(admin: dict = Depends(get_admin_user)):
    """List all groups."""
    db = SessionLocal()
    try:
        from sqlalchemy import func

        groups = db.query(GroupDB).order_by(GroupDB.created_at.desc()).all()
        result = []
        for g in groups:
            owner = db.query(UserDB).filter(UserDB.id == g.owner_id).first()
            owner_username = owner.username if owner else "unknown"
            member_count = db.query(func.count(GroupMemberDB.id)).filter(GroupMemberDB.group_id == g.id).scalar() or 0
            result.append({
                "id": g.id,
                "name": g.name,
                "owner_username": owner_username,
                "member_count": member_count,
                "created_at": g.created_at.isoformat() if g.created_at else None,
            })
        return result
    finally:
        db.close()


@app.delete("/api/admin/groups/{group_id}")
async def admin_delete_group(group_id: str, admin: dict = Depends(get_admin_user)):
    """Delete a group."""
    db = SessionLocal()
    try:
        group = db.query(GroupDB).filter(GroupDB.id == group_id).first()
        if not group:
            raise HTTPException(status_code=404, detail="Group not found")
        db.delete(group)
        db.commit()
        return {"message": f"Group '{group.name}' deleted successfully"}
    finally:
        db.close()


# Serve static frontend files in production
STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")
if os.path.exists(STATIC_DIR):
    app.mount("/assets", StaticFiles(directory=os.path.join(STATIC_DIR, "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        # Serve index.html for all non-API routes (SPA routing)
        file_path = os.path.join(STATIC_DIR, full_path)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(STATIC_DIR, "index.html"))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

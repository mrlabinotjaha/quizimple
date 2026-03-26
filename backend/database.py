import os
from sqlalchemy import create_engine, Column, String, Integer, Float, Boolean, Text, DateTime, JSON, ForeignKey, inspect, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.ext.mutable import MutableList
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime

# Get database URL from environment variable (Railway provides this automatically)
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./quiz.db")

# Railway uses postgres:// but SQLAlchemy needs postgresql://
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Create engine with connection timeout
engine = create_engine(DATABASE_URL, pool_pre_ping=True, pool_timeout=10, connect_args={"connect_timeout": 10} if "postgresql" in DATABASE_URL else {})

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create base class for models
Base = declarative_base()


# Database Models
class UserDB(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=True)
    hashed_password = Column(String, nullable=True)
    google_id = Column(String, unique=True, index=True, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    quizzes = relationship("QuizDB", back_populates="owner", cascade="all, delete-orphan")
    templates = relationship("TemplateDB", back_populates="author", cascade="all, delete-orphan")
    owned_groups = relationship("GroupDB", back_populates="owner", cascade="all, delete-orphan")
    group_memberships = relationship("GroupMemberDB", back_populates="user", cascade="all, delete-orphan")


class QuizDB(Base):
    __tablename__ = "quizzes"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    owner_id = Column(String, ForeignKey("users.id"), nullable=False)
    questions = Column(MutableList.as_mutable(JSON), default=list)  # Store questions as JSON array
    hide_results = Column(Boolean, default=False)
    fun_mode = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    owner = relationship("UserDB", back_populates="quizzes")
    sessions = relationship("SessionDB", back_populates="quiz", cascade="all, delete-orphan")


class SessionDB(Base):
    __tablename__ = "sessions"

    id = Column(String, primary_key=True, index=True)
    quiz_id = Column(String, ForeignKey("quizzes.id"), nullable=False)
    quiz_name = Column(String, nullable=False)
    room_code = Column(String, nullable=False)
    host_id = Column(String, nullable=False)
    started_at = Column(DateTime, nullable=False)
    ended_at = Column(DateTime, nullable=False)
    total_questions = Column(Integer, default=0)
    participants = Column(JSON, default=list)  # Store as JSON array
    question_stats = Column(JSON, default=list)  # Store as JSON array

    # Relationships
    quiz = relationship("QuizDB", back_populates="sessions")


class TemplateDB(Base):
    __tablename__ = "templates"

    id = Column(String, primary_key=True, index=True)
    quiz_id = Column(String, nullable=False)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String, nullable=False)
    author_id = Column(String, ForeignKey("users.id"), nullable=False)
    author_name = Column(String, nullable=False)
    questions_count = Column(Integer, default=0)
    uses_count = Column(Integer, default=0)
    rating = Column(Float, default=0.0)
    ratings_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    tags = Column(JSON, default=list)
    is_private = Column(Boolean, default=False)
    passcode = Column(String, nullable=True)
    visibility = Column(String, default="public")  # "public", "private", "group"
    group_id = Column(String, ForeignKey("groups.id"), nullable=True)

    # Relationships
    author = relationship("UserDB", back_populates="templates")
    ratings = relationship("TemplateRatingDB", back_populates="template", cascade="all, delete-orphan")


class TemplateRatingDB(Base):
    __tablename__ = "template_ratings"

    id = Column(Integer, primary_key=True, autoincrement=True)
    template_id = Column(String, ForeignKey("templates.id"), nullable=False)
    user_id = Column(String, nullable=False)
    rating = Column(Integer, nullable=False)

    # Relationships
    template = relationship("TemplateDB", back_populates="ratings")


class GroupDB(Base):
    __tablename__ = "groups"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    owner_id = Column(String, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    owner = relationship("UserDB", back_populates="owned_groups")
    members = relationship("GroupMemberDB", back_populates="group", cascade="all, delete-orphan")


class GroupMemberDB(Base):
    __tablename__ = "group_members"

    id = Column(Integer, primary_key=True, autoincrement=True)
    group_id = Column(String, ForeignKey("groups.id"), nullable=False)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    role = Column(String, default="member")  # "owner" or "member"
    joined_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    group = relationship("GroupDB", back_populates="members")
    user = relationship("UserDB", back_populates="group_memberships")


def _migrate_db():
    """Add missing columns to existing tables."""
    inspector = inspect(engine)
    if "templates" in inspector.get_table_names():
        columns = [col["name"] for col in inspector.get_columns("templates")]
        with engine.begin() as conn:
            if "is_private" not in columns:
                conn.execute(text("ALTER TABLE templates ADD COLUMN is_private BOOLEAN DEFAULT FALSE"))
            if "passcode" not in columns:
                conn.execute(text("ALTER TABLE templates ADD COLUMN passcode VARCHAR"))
            if "visibility" not in columns:
                conn.execute(text("ALTER TABLE templates ADD COLUMN visibility VARCHAR DEFAULT 'public'"))
            if "group_id" not in columns:
                conn.execute(text("ALTER TABLE templates ADD COLUMN group_id VARCHAR"))


def init_db():
    """Initialize database tables."""
    try:
        Base.metadata.create_all(bind=engine)
        _migrate_db()
    except Exception as e:
        print(f"WARNING: Database initialization error: {e}")
        print("App will start but some features may not work until DB is available.")


def get_db():
    """Get database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

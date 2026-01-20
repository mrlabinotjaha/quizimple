import os
from sqlalchemy import create_engine, Column, String, Integer, Float, Boolean, Text, DateTime, JSON, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.ext.mutable import MutableList
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime

# Get database URL from environment variable (Railway provides this automatically)
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./quiz.db")

# Railway uses postgres:// but SQLAlchemy needs postgresql://
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Create engine
engine = create_engine(DATABASE_URL)

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


def init_db():
    """Initialize database tables."""
    Base.metadata.create_all(bind=engine)


def get_db():
    """Get database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

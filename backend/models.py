from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum


class QuestionType(str, Enum):
    SINGLE = "single"
    MULTIPLE = "multiple"


class TemplateVisibility(str, Enum):
    PUBLIC = "public"
    PRIVATE = "private"
    GROUP = "group"


class Question(BaseModel):
    text: str
    type: QuestionType = QuestionType.SINGLE
    options: list[str]
    correct: list[int]  # indices of correct answers
    time_limit: int = 30  # seconds
    points: int = 100


class QuestionCreate(BaseModel):
    text: str
    type: QuestionType = QuestionType.SINGLE
    options: list[str]
    correct: list[int]
    time_limit: int = 30
    points: int = 100


class QuestionsImport(BaseModel):
    questions: list[QuestionCreate]
    replace: bool = False  # If true, delete existing questions before importing


class AIGenerateRequest(BaseModel):
    prompt: str = Field(..., min_length=10, max_length=500)
    replace: bool = False  # If true, delete existing questions before generating


class Quiz(BaseModel):
    id: str
    name: str
    owner_id: str
    questions: list[Question] = []
    hide_results: bool = False  # Hide results from quiz takers
    fun_mode: bool = False  # Enable chaotic fun effects during quiz


class QuizCreate(BaseModel):
    name: str
    hide_results: bool = False
    fun_mode: bool = False


class QuizUpdate(BaseModel):
    hide_results: bool = None
    fun_mode: bool = None


class UserCreate(BaseModel):
    email: str = Field(..., min_length=5)
    username: Optional[str] = Field(None, min_length=3, max_length=50)
    password: str = Field(..., min_length=4)


class UserLogin(BaseModel):
    username: str  # Can be username or email
    password: str


class GoogleAuthRequest(BaseModel):
    credential: str  # Google ID token


class User(BaseModel):
    id: str
    username: str
    email: Optional[str] = None


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserUpdate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)


class PasswordChange(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=4)


class AccountDelete(BaseModel):
    password: str


class Player(BaseModel):
    id: str
    username: str
    score: int = 0
    answers: dict[int, list[int]] = {}  # question_index -> selected options
    answer_times: dict[int, float] = {}  # question_index -> time taken in seconds
    tab_switches: int = 0  # cheat detection: number of times user switched tabs
    correct_answers: int = 0  # number of questions answered correctly
    disconnected_at: Optional[float] = None  # timestamp when disconnected


class RoomState(str, Enum):
    LOBBY = "lobby"
    PLAYING = "playing"
    FINISHED = "finished"


class Room(BaseModel):
    code: str
    quiz_id: str
    host_id: str
    players: dict[str, Player] = {}  # user_id -> Player
    state: RoomState = RoomState.LOBBY
    current_question: int = 0
    answers_received: int = 0
    question_start_time: float = 0.0  # timestamp when current question started
    paused: bool = False
    time_remaining_when_paused: float = 0.0  # seconds left on timer when paused


# WebSocket message models
class WSMessage(BaseModel):
    event: str
    data: dict = {}


class RoomCreated(BaseModel):
    room_code: str


class PlayerJoined(BaseModel):
    players: list[dict]


class QuizStarted(BaseModel):
    question: dict
    index: int
    total: int


class AnswerReceived(BaseModel):
    count: int
    total: int


class QuestionResults(BaseModel):
    correct: list[int]
    scores: dict[str, int]
    answers: dict[str, list[int]]


class QuizEnded(BaseModel):
    leaderboard: list[dict]


# Quiz Session models - stores history of quiz plays
class PlayerResult(BaseModel):
    user_id: str
    username: str
    score: int
    correct_answers: int
    wrong_answers: int
    tab_switches: int
    answers: dict[int, list[int]] = {}  # question_index -> selected options


class QuizSession(BaseModel):
    id: str
    quiz_id: str
    quiz_name: str
    room_code: str
    host_id: str
    started_at: str  # ISO datetime
    ended_at: str  # ISO datetime
    total_questions: int
    participants: list[PlayerResult]
    question_stats: list[dict] = []  # Per-question statistics


class QuestionStat(BaseModel):
    question_index: int
    question_text: str
    correct_answers: list[int]
    total_attempts: int
    correct_attempts: int
    accuracy_percentage: float
    answer_distribution: dict[int, int] = {}  # option_index -> count


# Template Market models
class TemplateCategory(str, Enum):
    PROGRAMMING = "programming"
    EDUCATION = "education"
    SCIENCE = "science"
    LANGUAGES = "languages"
    HISTORY = "history"
    HEALTHCARE = "healthcare"
    BUSINESS = "business"
    ENTERTAINMENT = "entertainment"
    OTHER = "other"


class QuizTemplate(BaseModel):
    id: str
    quiz_id: str
    name: str
    description: str
    category: TemplateCategory
    author_id: str
    author_name: str
    questions_count: int
    uses_count: int = 0
    rating: float = 0.0
    ratings_count: int = 0
    created_at: str  # ISO datetime
    tags: list[str] = []
    is_private: bool = False
    visibility: str = "public"  # "public", "private", "group"
    group_id: Optional[str] = None
    group_name: Optional[str] = None


class TemplateCreate(BaseModel):
    name: str
    description: str
    category: TemplateCategory
    tags: list[str] = []
    is_private: bool = False
    passcode: Optional[str] = None
    visibility: str = "public"
    group_id: Optional[str] = None


class TemplateUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[TemplateCategory] = None
    tags: Optional[list[str]] = None
    is_private: Optional[bool] = None
    passcode: Optional[str] = None
    visibility: Optional[str] = None
    group_id: Optional[str] = None


class TemplateRating(BaseModel):
    rating: int  # 1-5


# Group models
class Group(BaseModel):
    id: str
    name: str
    owner_id: str
    created_at: str
    member_count: int = 0
    members: list[dict] = []  # [{id, username, role}]


class GroupCreate(BaseModel):
    name: str


class GroupInvite(BaseModel):
    username: str


class AdminLogin(BaseModel):
    password: str

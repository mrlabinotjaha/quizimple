import uuid
from typing import Optional
from models import Quiz, Question, QuestionCreate, QuestionType

# In-memory quiz storage
quizzes_db: dict[str, Quiz] = {}  # quiz_id -> Quiz


def create_quiz(name: str, owner_id: str, hide_results: bool = False, fun_mode: bool = False) -> Quiz:
    quiz_id = str(uuid.uuid4())
    quiz = Quiz(id=quiz_id, name=name, owner_id=owner_id, questions=[], hide_results=hide_results, fun_mode=fun_mode)
    quizzes_db[quiz_id] = quiz
    return quiz


def update_quiz_settings(quiz_id: str, hide_results: bool = None, fun_mode: bool = None) -> Optional[Quiz]:
    quiz = quizzes_db.get(quiz_id)
    if not quiz:
        return None
    if hide_results is not None:
        quiz.hide_results = hide_results
    if fun_mode is not None:
        quiz.fun_mode = fun_mode
    return quiz


def get_quiz(quiz_id: str) -> Optional[Quiz]:
    return quizzes_db.get(quiz_id)


def get_user_quizzes(user_id: str) -> list[Quiz]:
    return [quiz for quiz in quizzes_db.values() if quiz.owner_id == user_id]


def add_question(quiz_id: str, question_data: QuestionCreate) -> Optional[Question]:
    quiz = quizzes_db.get(quiz_id)
    if not quiz:
        return None

    question = Question(
        text=question_data.text,
        type=question_data.type,
        options=question_data.options,
        correct=question_data.correct,
        time_limit=question_data.time_limit,
        points=question_data.points
    )
    quiz.questions.append(question)
    return question


def clear_questions(quiz_id: str) -> bool:
    """Clear all questions from a quiz."""
    quiz = quizzes_db.get(quiz_id)
    if not quiz:
        return False
    quiz.questions = []
    return True


def import_questions(quiz_id: str, questions: list[QuestionCreate], replace: bool = False) -> list[Question]:
    quiz = quizzes_db.get(quiz_id)
    if not quiz:
        return []

    # Clear existing questions if replace is True
    if replace:
        quiz.questions = []

    added_questions = []
    for q_data in questions:
        question = Question(
            text=q_data.text,
            type=q_data.type,
            options=q_data.options,
            correct=q_data.correct,
            time_limit=q_data.time_limit,
            points=q_data.points
        )
        quiz.questions.append(question)
        added_questions.append(question)

    return added_questions


def delete_question(quiz_id: str, question_index: int) -> bool:
    quiz = quizzes_db.get(quiz_id)
    if not quiz or question_index < 0 or question_index >= len(quiz.questions):
        return False

    quiz.questions.pop(question_index)
    return True


def delete_quiz(quiz_id: str) -> bool:
    if quiz_id in quizzes_db:
        del quizzes_db[quiz_id]
        return True
    return False

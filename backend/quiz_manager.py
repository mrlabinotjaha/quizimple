import uuid
from typing import Optional
from models import Quiz, Question, QuestionCreate, QuestionType
from database import SessionLocal, QuizDB


def create_quiz(name: str, owner_id: str, hide_results: bool = False, fun_mode: bool = False) -> Quiz:
    db = SessionLocal()
    try:
        quiz_id = str(uuid.uuid4())
        db_quiz = QuizDB(
            id=quiz_id,
            name=name,
            owner_id=owner_id,
            questions=[],
            hide_results=hide_results,
            fun_mode=fun_mode
        )
        db.add(db_quiz)
        db.commit()
        return Quiz(id=quiz_id, name=name, owner_id=owner_id, questions=[], hide_results=hide_results, fun_mode=fun_mode)
    finally:
        db.close()


def update_quiz_settings(quiz_id: str, hide_results: bool = None, fun_mode: bool = None) -> Optional[Quiz]:
    db = SessionLocal()
    try:
        quiz = db.query(QuizDB).filter(QuizDB.id == quiz_id).first()
        if not quiz:
            return None
        if hide_results is not None:
            quiz.hide_results = hide_results
        if fun_mode is not None:
            quiz.fun_mode = fun_mode
        db.commit()

        questions = [Question(**q) for q in (quiz.questions or [])]
        return Quiz(
            id=quiz.id,
            name=quiz.name,
            owner_id=quiz.owner_id,
            questions=questions,
            hide_results=quiz.hide_results,
            fun_mode=quiz.fun_mode
        )
    finally:
        db.close()


def get_quiz(quiz_id: str) -> Optional[Quiz]:
    db = SessionLocal()
    try:
        quiz = db.query(QuizDB).filter(QuizDB.id == quiz_id).first()
        if not quiz:
            return None
        questions = [Question(**q) for q in (quiz.questions or [])]
        return Quiz(
            id=quiz.id,
            name=quiz.name,
            owner_id=quiz.owner_id,
            questions=questions,
            hide_results=quiz.hide_results,
            fun_mode=quiz.fun_mode
        )
    finally:
        db.close()


def get_user_quizzes(user_id: str) -> list[Quiz]:
    db = SessionLocal()
    try:
        quizzes = db.query(QuizDB).filter(QuizDB.owner_id == user_id).all()
        result = []
        for quiz in quizzes:
            questions = [Question(**q) for q in (quiz.questions or [])]
            result.append(Quiz(
                id=quiz.id,
                name=quiz.name,
                owner_id=quiz.owner_id,
                questions=questions,
                hide_results=quiz.hide_results,
                fun_mode=quiz.fun_mode
            ))
        return result
    finally:
        db.close()


def add_question(quiz_id: str, question_data: QuestionCreate) -> Optional[Question]:
    db = SessionLocal()
    try:
        quiz = db.query(QuizDB).filter(QuizDB.id == quiz_id).first()
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

        questions = quiz.questions or []
        questions.append(question.model_dump())
        quiz.questions = questions
        db.commit()

        return question
    finally:
        db.close()


def clear_questions(quiz_id: str) -> bool:
    """Clear all questions from a quiz."""
    db = SessionLocal()
    try:
        quiz = db.query(QuizDB).filter(QuizDB.id == quiz_id).first()
        if not quiz:
            return False
        quiz.questions = []
        db.commit()
        return True
    finally:
        db.close()


def import_questions(quiz_id: str, questions: list[QuestionCreate], replace: bool = False) -> list[Question]:
    db = SessionLocal()
    try:
        quiz = db.query(QuizDB).filter(QuizDB.id == quiz_id).first()
        if not quiz:
            return []

        # Clear existing questions if replace is True
        if replace:
            quiz.questions = []

        existing_questions = quiz.questions or []
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
            existing_questions.append(question.model_dump())
            added_questions.append(question)

        quiz.questions = existing_questions
        db.commit()

        return added_questions
    finally:
        db.close()


def delete_question(quiz_id: str, question_index: int) -> bool:
    db = SessionLocal()
    try:
        quiz = db.query(QuizDB).filter(QuizDB.id == quiz_id).first()
        if not quiz:
            return False

        questions = quiz.questions or []
        if question_index < 0 or question_index >= len(questions):
            return False

        questions.pop(question_index)
        quiz.questions = questions
        db.commit()
        return True
    finally:
        db.close()


def delete_quiz(quiz_id: str) -> bool:
    db = SessionLocal()
    try:
        quiz = db.query(QuizDB).filter(QuizDB.id == quiz_id).first()
        if not quiz:
            return False
        db.delete(quiz)
        db.commit()
        return True
    finally:
        db.close()

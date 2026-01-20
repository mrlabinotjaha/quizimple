from datetime import datetime
import uuid
from models import QuizSession, PlayerResult, QuestionStat
from database import SessionLocal, SessionDB


def save_session(
    quiz_id: str,
    quiz_name: str,
    room_code: str,
    host_id: str,
    started_at: datetime,
    players: dict,
    questions: list
) -> QuizSession:
    """Save a completed quiz session with all player results and statistics."""
    db = SessionLocal()
    try:
        session_id = str(uuid.uuid4())
        ended_at = datetime.utcnow()

        # Convert players to PlayerResult objects
        participants = []
        for player_id, player in players.items():
            total_questions = len(questions)
            correct = player.correct_answers
            wrong = total_questions - correct

            participant = PlayerResult(
                user_id=player_id,
                username=player.username,
                score=player.score,
                correct_answers=correct,
                wrong_answers=wrong,
                tab_switches=player.tab_switches,
                answers=player.answers
            )
            participants.append(participant)

        # Calculate question statistics
        question_stats = []
        for q_idx, question in enumerate(questions):
            answer_distribution: dict[int, int] = {}
            correct_attempts = 0
            total_attempts = 0

            for player in players.values():
                if q_idx in player.answers:
                    total_attempts += 1
                    player_answers = player.answers[q_idx]

                    # Track answer distribution
                    for ans in player_answers:
                        answer_distribution[ans] = answer_distribution.get(ans, 0) + 1

                    # Check if correct
                    if sorted(player_answers) == sorted(question.correct):
                        correct_attempts += 1

            accuracy = (correct_attempts / total_attempts * 100) if total_attempts > 0 else 0

            stat = QuestionStat(
                question_index=q_idx,
                question_text=question.text,
                correct_answers=question.correct,
                total_attempts=total_attempts,
                correct_attempts=correct_attempts,
                accuracy_percentage=round(accuracy, 1),
                answer_distribution=answer_distribution
            )
            question_stats.append(stat.model_dump())

        # Sort participants by score
        participants.sort(key=lambda p: p.score, reverse=True)

        # Save to database
        db_session = SessionDB(
            id=session_id,
            quiz_id=quiz_id,
            quiz_name=quiz_name,
            room_code=room_code,
            host_id=host_id,
            started_at=started_at,
            ended_at=ended_at,
            total_questions=len(questions),
            participants=[p.model_dump() for p in participants],
            question_stats=question_stats
        )
        db.add(db_session)
        db.commit()

        session = QuizSession(
            id=session_id,
            quiz_id=quiz_id,
            quiz_name=quiz_name,
            room_code=room_code,
            host_id=host_id,
            started_at=started_at.isoformat(),
            ended_at=ended_at.isoformat(),
            total_questions=len(questions),
            participants=participants,
            question_stats=question_stats
        )

        print(f"[DEBUG session_manager] Session saved - id: {session_id}, quiz_id: {quiz_id}")
        return session
    finally:
        db.close()


def get_session(session_id: str) -> QuizSession | None:
    """Get a specific quiz session by ID."""
    db = SessionLocal()
    try:
        session = db.query(SessionDB).filter(SessionDB.id == session_id).first()
        if not session:
            return None

        participants = [PlayerResult(**p) for p in (session.participants or [])]
        return QuizSession(
            id=session.id,
            quiz_id=session.quiz_id,
            quiz_name=session.quiz_name,
            room_code=session.room_code,
            host_id=session.host_id,
            started_at=session.started_at.isoformat(),
            ended_at=session.ended_at.isoformat(),
            total_questions=session.total_questions,
            participants=participants,
            question_stats=session.question_stats or []
        )
    finally:
        db.close()


def get_quiz_sessions(quiz_id: str) -> list[QuizSession]:
    """Get all sessions for a specific quiz."""
    db = SessionLocal()
    try:
        sessions = db.query(SessionDB).filter(SessionDB.quiz_id == quiz_id).order_by(SessionDB.ended_at.desc()).all()
        result = []
        for session in sessions:
            participants = [PlayerResult(**p) for p in (session.participants or [])]
            result.append(QuizSession(
                id=session.id,
                quiz_id=session.quiz_id,
                quiz_name=session.quiz_name,
                room_code=session.room_code,
                host_id=session.host_id,
                started_at=session.started_at.isoformat(),
                ended_at=session.ended_at.isoformat(),
                total_questions=session.total_questions,
                participants=participants,
                question_stats=session.question_stats or []
            ))
        return result
    finally:
        db.close()


def get_user_sessions(user_id: str) -> list[QuizSession]:
    """Get all sessions hosted by a specific user."""
    db = SessionLocal()
    try:
        sessions = db.query(SessionDB).filter(SessionDB.host_id == user_id).order_by(SessionDB.ended_at.desc()).all()
        result = []
        for session in sessions:
            participants = [PlayerResult(**p) for p in (session.participants or [])]
            result.append(QuizSession(
                id=session.id,
                quiz_id=session.quiz_id,
                quiz_name=session.quiz_name,
                room_code=session.room_code,
                host_id=session.host_id,
                started_at=session.started_at.isoformat(),
                ended_at=session.ended_at.isoformat(),
                total_questions=session.total_questions,
                participants=participants,
                question_stats=session.question_stats or []
            ))
        return result
    finally:
        db.close()


def get_quiz_analytics(quiz_id: str) -> dict:
    """Get aggregated analytics for a quiz across all sessions."""
    sessions = get_quiz_sessions(quiz_id)

    if not sessions:
        return {
            "total_sessions": 0,
            "total_participants": 0,
            "average_score": 0,
            "average_accuracy": 0,
            "sessions": []
        }

    total_participants = 0
    total_score = 0
    total_correct = 0
    total_questions_answered = 0

    for session in sessions:
        for participant in session.participants:
            total_participants += 1
            total_score += participant.score
            total_correct += participant.correct_answers
            total_questions_answered += session.total_questions

    avg_score = total_score / total_participants if total_participants > 0 else 0
    avg_accuracy = (total_correct / total_questions_answered * 100) if total_questions_answered > 0 else 0

    return {
        "total_sessions": len(sessions),
        "total_participants": total_participants,
        "average_score": round(avg_score, 1),
        "average_accuracy": round(avg_accuracy, 1),
        "sessions": [s.model_dump() for s in sessions[:10]]  # Last 10 sessions
    }

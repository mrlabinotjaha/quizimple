from datetime import datetime
import uuid
from models import QuizSession, PlayerResult, QuestionStat

# In-memory storage for quiz sessions
sessions_db: dict[str, QuizSession] = {}
quiz_sessions_index: dict[str, list[str]] = {}  # quiz_id -> [session_ids]


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

    # Store session
    sessions_db[session_id] = session

    # Index by quiz_id
    if quiz_id not in quiz_sessions_index:
        quiz_sessions_index[quiz_id] = []
    quiz_sessions_index[quiz_id].append(session_id)

    print(f"[DEBUG session_manager] Session saved - id: {session_id}, quiz_id: {quiz_id}")
    print(f"[DEBUG session_manager] sessions_db count: {len(sessions_db)}")
    print(f"[DEBUG session_manager] quiz_sessions_index[{quiz_id}]: {quiz_sessions_index[quiz_id]}")

    return session


def get_session(session_id: str) -> QuizSession | None:
    """Get a specific quiz session by ID."""
    return sessions_db.get(session_id)


def get_quiz_sessions(quiz_id: str) -> list[QuizSession]:
    """Get all sessions for a specific quiz."""
    print(f"[DEBUG session_manager] get_quiz_sessions called - quiz_id: {quiz_id}")
    print(f"[DEBUG session_manager] quiz_sessions_index keys: {list(quiz_sessions_index.keys())}")
    session_ids = quiz_sessions_index.get(quiz_id, [])
    print(f"[DEBUG session_manager] session_ids for quiz: {session_ids}")
    sessions = [sessions_db[sid] for sid in session_ids if sid in sessions_db]
    # Sort by ended_at descending (most recent first)
    sessions.sort(key=lambda s: s.ended_at, reverse=True)
    print(f"[DEBUG session_manager] returning {len(sessions)} sessions")
    return sessions


def get_user_sessions(user_id: str) -> list[QuizSession]:
    """Get all sessions hosted by a specific user."""
    sessions = [s for s in sessions_db.values() if s.host_id == user_id]
    sessions.sort(key=lambda s: s.ended_at, reverse=True)
    return sessions


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

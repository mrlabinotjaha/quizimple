import random
import string
from typing import Optional
from models import Room, Player, RoomState
from quiz_manager import get_quiz

# In-memory room storage
rooms_db: dict[str, Room] = {}  # room_code -> Room


def generate_room_code() -> str:
    while True:
        code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
        if code not in rooms_db:
            return code


def create_room(quiz_id: str, host_id: str) -> Optional[Room]:
    quiz = get_quiz(quiz_id)
    if not quiz:
        return None

    room_code = generate_room_code()
    room = Room(
        code=room_code,
        quiz_id=quiz_id,
        host_id=host_id,
        players={},
        state=RoomState.LOBBY,
        current_question=0,
        answers_received=0
    )
    rooms_db[room_code] = room
    return room


def get_room(room_code: str) -> Optional[Room]:
    return rooms_db.get(room_code)


def join_room(room_code: str, user_id: str, username: str) -> Optional[Player]:
    room = rooms_db.get(room_code)
    if not room or room.state != RoomState.LOBBY:
        return None

    if user_id in room.players:
        return room.players[user_id]

    player = Player(id=user_id, username=username, score=0, answers={})
    room.players[user_id] = player
    return player


def leave_room(room_code: str, user_id: str) -> bool:
    room = rooms_db.get(room_code)
    if not room or user_id not in room.players:
        return False

    del room.players[user_id]
    return True


def start_quiz(room_code: str, host_id: str) -> bool:
    room = rooms_db.get(room_code)
    if not room or room.host_id != host_id:
        return False

    if room.state != RoomState.LOBBY:
        return False

    quiz = get_quiz(room.quiz_id)
    if not quiz or len(quiz.questions) == 0:
        return False

    room.state = RoomState.PLAYING
    room.current_question = 0
    room.answers_received = 0
    return True


def submit_answer(room_code: str, user_id: str, question_index: int, answers: list[int]) -> bool:
    room = rooms_db.get(room_code)
    if not room or room.state != RoomState.PLAYING:
        return False

    if user_id not in room.players:
        return False

    if room.current_question != question_index:
        return False

    player = room.players[user_id]
    if question_index in player.answers:
        return False  # Already answered

    player.answers[question_index] = answers
    room.answers_received += 1
    return True


def calculate_scores(room_code: str) -> dict[str, int]:
    room = rooms_db.get(room_code)
    if not room:
        return {}

    quiz = get_quiz(room.quiz_id)
    if not quiz:
        return {}

    question_index = room.current_question
    if question_index >= len(quiz.questions):
        return {}

    question = quiz.questions[question_index]
    correct_answers = set(question.correct)

    scores = {}
    for user_id, player in room.players.items():
        player_answers = set(player.answers.get(question_index, []))
        if player_answers == correct_answers:
            player.score += question.points
            player.correct_answers += 1
        scores[user_id] = player.score

    return scores


def next_question(room_code: str, host_id: str) -> bool:
    room = rooms_db.get(room_code)
    if not room or room.host_id != host_id:
        return False

    quiz = get_quiz(room.quiz_id)
    if not quiz:
        return False

    if room.current_question + 1 >= len(quiz.questions):
        room.state = RoomState.FINISHED
        return False

    room.current_question += 1
    room.answers_received = 0
    return True


def end_quiz(room_code: str, host_id: str) -> bool:
    room = rooms_db.get(room_code)
    if not room or room.host_id != host_id:
        return False

    room.state = RoomState.FINISHED
    return True


def get_leaderboard(room_code: str) -> dict:
    room = rooms_db.get(room_code)
    if not room:
        return {"players": [], "total_questions": 0}

    quiz = get_quiz(room.quiz_id)
    total_questions = len(quiz.questions) if quiz else 0

    players = [
        {
            "username": p.username,
            "score": p.score,
            "user_id": p.id,
            "tab_switches": p.tab_switches,
            "correct_answers": p.correct_answers,
            "wrong_answers": total_questions - p.correct_answers
        }
        for p in room.players.values()
    ]
    players.sort(key=lambda x: x["score"], reverse=True)

    return {
        "players": players,
        "total_questions": total_questions
    }


def get_players_list(room_code: str) -> list[dict]:
    room = rooms_db.get(room_code)
    if not room:
        return []

    return [
        {"id": p.id, "username": p.username, "score": p.score}
        for p in room.players.values()
    ]


def delete_room(room_code: str) -> bool:
    if room_code in rooms_db:
        del rooms_db[room_code]
        return True
    return False


def record_tab_switch(room_code: str, user_id: str) -> bool:
    room = rooms_db.get(room_code)
    if not room or room.state != RoomState.PLAYING:
        return False

    if user_id not in room.players:
        return False

    room.players[user_id].tab_switches += 1
    return True

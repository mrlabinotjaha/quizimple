import os
import json
import re
from dotenv import load_dotenv
from groq import Groq
from models import QuestionCreate, QuestionType

# Load environment variables from .env file
load_dotenv()


SYSTEM_PROMPT = """You are a quiz question generator. Generate quiz questions based on the user's request.

You MUST respond with a valid JSON object containing a "questions" array. Each question must have this exact structure:
{
  "questions": [
    {
      "text": "The question text",
      "type": "single",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct": [0],
      "time_limit": 30,
      "points": 100
    }
  ]
}

Rules:
- "type" must be either "single" (one correct answer) or "multiple" (can have multiple correct answers)
- "correct" is an array of indices (0-based) of the correct options
- For "single" type, "correct" must have exactly one index
- For "multiple" type, "correct" can have one or more indices
- "options" must have 2-6 options
- "time_limit" should be 10-60 seconds based on question difficulty
- "points" should be 50-200 based on difficulty (easy: 50-100, medium: 100-150, hard: 150-200)
- Questions should be clear, accurate, and educational
- Avoid trick questions unless specifically requested
- Make sure all correct answers are actually correct

IMPORTANT: Respond ONLY with the JSON object, no additional text or explanation."""


def generate_questions(prompt: str) -> list[QuestionCreate]:
    """Generate quiz questions using Groq API."""
    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key:
        raise ValueError("GROQ_API_KEY environment variable is not set")

    client = Groq(api_key=api_key)

    chat_completion = client.chat.completions.create(
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": prompt}
        ],
        model="llama-3.3-70b-versatile",
        temperature=0.7,
        max_tokens=4096,
    )

    response_text = chat_completion.choices[0].message.content

    # Try to extract JSON from the response
    json_match = re.search(r'\{[\s\S]*\}', response_text)
    if not json_match:
        raise ValueError("No valid JSON found in AI response")

    json_str = json_match.group()
    data = json.loads(json_str)

    questions_data = data.get("questions", [])
    if not questions_data:
        raise ValueError("No questions found in AI response")

    # Validate and convert to QuestionCreate objects
    questions = []
    for q in questions_data:
        # Ensure type is valid
        q_type = q.get("type", "single")
        if q_type not in ["single", "multiple"]:
            q_type = "single"

        # Ensure correct is a list
        correct = q.get("correct", [0])
        if not isinstance(correct, list):
            correct = [correct]

        # Validate correct indices
        options = q.get("options", [])
        correct = [c for c in correct if isinstance(c, int) and 0 <= c < len(options)]
        if not correct:
            correct = [0]

        # For single type, ensure only one correct answer
        if q_type == "single" and len(correct) > 1:
            correct = [correct[0]]

        question = QuestionCreate(
            text=q.get("text", ""),
            type=QuestionType(q_type),
            options=options,
            correct=correct,
            time_limit=min(max(q.get("time_limit", 30), 5), 120),
            points=min(max(q.get("points", 100), 10), 1000)
        )
        questions.append(question)

    return questions

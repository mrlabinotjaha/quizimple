from datetime import datetime
import uuid
from models import QuizTemplate, TemplateCategory

# In-memory storage for templates
templates_db: dict[str, QuizTemplate] = {}
template_ratings: dict[str, dict[str, int]] = {}  # template_id -> {user_id: rating}


def publish_template(
    quiz_id: str,
    name: str,
    description: str,
    category: TemplateCategory,
    author_id: str,
    author_name: str,
    questions_count: int,
    tags: list[str]
) -> QuizTemplate:
    """Publish a quiz as a template to the marketplace."""
    template_id = str(uuid.uuid4())

    template = QuizTemplate(
        id=template_id,
        quiz_id=quiz_id,
        name=name,
        description=description,
        category=category,
        author_id=author_id,
        author_name=author_name,
        questions_count=questions_count,
        uses_count=0,
        rating=0.0,
        ratings_count=0,
        created_at=datetime.utcnow().isoformat(),
        tags=tags
    )

    templates_db[template_id] = template
    return template


def get_template(template_id: str) -> QuizTemplate | None:
    """Get a specific template by ID."""
    return templates_db.get(template_id)


def get_all_templates(
    category: TemplateCategory | None = None,
    search: str | None = None,
    sort_by: str = "uses",  # uses, rating, recent
    limit: int = 50
) -> list[QuizTemplate]:
    """Get all templates with optional filtering and sorting."""
    templates = list(templates_db.values())

    # Filter by category
    if category:
        templates = [t for t in templates if t.category == category]

    # Search in name, description, and tags
    if search:
        search_lower = search.lower()
        templates = [
            t for t in templates
            if search_lower in t.name.lower()
            or search_lower in t.description.lower()
            or any(search_lower in tag.lower() for tag in t.tags)
        ]

    # Sort
    if sort_by == "uses":
        templates.sort(key=lambda t: t.uses_count, reverse=True)
    elif sort_by == "rating":
        templates.sort(key=lambda t: (t.rating, t.ratings_count), reverse=True)
    elif sort_by == "recent":
        templates.sort(key=lambda t: t.created_at, reverse=True)

    return templates[:limit]


def get_user_templates(user_id: str) -> list[QuizTemplate]:
    """Get all templates published by a user."""
    templates = [t for t in templates_db.values() if t.author_id == user_id]
    templates.sort(key=lambda t: t.created_at, reverse=True)
    return templates


def increment_uses(template_id: str) -> bool:
    """Increment the uses count for a template."""
    if template_id in templates_db:
        templates_db[template_id].uses_count += 1
        return True
    return False


def rate_template(template_id: str, user_id: str, rating: int) -> QuizTemplate | None:
    """Rate a template (1-5 stars)."""
    if template_id not in templates_db:
        return None

    if rating < 1 or rating > 5:
        return None

    # Initialize ratings dict for template if needed
    if template_id not in template_ratings:
        template_ratings[template_id] = {}

    # Store/update user's rating
    template_ratings[template_id][user_id] = rating

    # Recalculate average rating
    ratings = template_ratings[template_id]
    avg_rating = sum(ratings.values()) / len(ratings)

    template = templates_db[template_id]
    template.rating = round(avg_rating, 1)
    template.ratings_count = len(ratings)

    return template


def delete_template(template_id: str, user_id: str) -> bool:
    """Delete a template (only by author)."""
    if template_id not in templates_db:
        return False

    template = templates_db[template_id]
    if template.author_id != user_id:
        return False

    del templates_db[template_id]
    if template_id in template_ratings:
        del template_ratings[template_id]

    return True


def get_featured_templates(limit: int = 6) -> list[QuizTemplate]:
    """Get featured templates (high rating + many uses)."""
    templates = list(templates_db.values())
    # Score = rating * log(uses + 1)
    import math
    templates.sort(
        key=lambda t: t.rating * math.log(t.uses_count + 2),
        reverse=True
    )
    return templates[:limit]


def get_categories_with_counts() -> list[dict]:
    """Get all categories with template counts."""
    counts: dict[str, int] = {}
    for template in templates_db.values():
        cat = template.category
        counts[cat] = counts.get(cat, 0) + 1

    return [
        {"category": cat.value, "count": counts.get(cat, 0)}
        for cat in TemplateCategory
    ]

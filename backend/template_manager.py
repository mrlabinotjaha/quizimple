from datetime import datetime
import uuid
import math
from models import QuizTemplate, TemplateCategory
from database import SessionLocal, TemplateDB, TemplateRatingDB


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
    db = SessionLocal()
    try:
        template_id = str(uuid.uuid4())

        db_template = TemplateDB(
            id=template_id,
            quiz_id=quiz_id,
            name=name,
            description=description,
            category=category.value,
            author_id=author_id,
            author_name=author_name,
            questions_count=questions_count,
            uses_count=0,
            rating=0.0,
            ratings_count=0,
            created_at=datetime.utcnow(),
            tags=tags
        )
        db.add(db_template)
        db.commit()

        return QuizTemplate(
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
            created_at=db_template.created_at.isoformat(),
            tags=tags
        )
    finally:
        db.close()


def get_template(template_id: str) -> QuizTemplate | None:
    """Get a specific template by ID."""
    db = SessionLocal()
    try:
        template = db.query(TemplateDB).filter(TemplateDB.id == template_id).first()
        if not template:
            return None
        return QuizTemplate(
            id=template.id,
            quiz_id=template.quiz_id,
            name=template.name,
            description=template.description,
            category=TemplateCategory(template.category),
            author_id=template.author_id,
            author_name=template.author_name,
            questions_count=template.questions_count,
            uses_count=template.uses_count,
            rating=template.rating,
            ratings_count=template.ratings_count,
            created_at=template.created_at.isoformat(),
            tags=template.tags or []
        )
    finally:
        db.close()


def get_all_templates(
    category: TemplateCategory | None = None,
    search: str | None = None,
    sort_by: str = "uses",  # uses, rating, recent
    limit: int = 50
) -> list[QuizTemplate]:
    """Get all templates with optional filtering and sorting."""
    db = SessionLocal()
    try:
        query = db.query(TemplateDB)

        # Filter by category
        if category:
            query = query.filter(TemplateDB.category == category.value)

        templates = query.all()

        # Convert to QuizTemplate objects
        result = []
        for t in templates:
            result.append(QuizTemplate(
                id=t.id,
                quiz_id=t.quiz_id,
                name=t.name,
                description=t.description,
                category=TemplateCategory(t.category),
                author_id=t.author_id,
                author_name=t.author_name,
                questions_count=t.questions_count,
                uses_count=t.uses_count,
                rating=t.rating,
                ratings_count=t.ratings_count,
                created_at=t.created_at.isoformat(),
                tags=t.tags or []
            ))

        # Search in name, description, and tags
        if search:
            search_lower = search.lower()
            result = [
                t for t in result
                if search_lower in t.name.lower()
                or search_lower in t.description.lower()
                or any(search_lower in tag.lower() for tag in t.tags)
            ]

        # Sort
        if sort_by == "uses":
            result.sort(key=lambda t: t.uses_count, reverse=True)
        elif sort_by == "rating":
            result.sort(key=lambda t: (t.rating, t.ratings_count), reverse=True)
        elif sort_by == "recent":
            result.sort(key=lambda t: t.created_at, reverse=True)

        return result[:limit]
    finally:
        db.close()


def get_user_templates(user_id: str) -> list[QuizTemplate]:
    """Get all templates published by a user."""
    db = SessionLocal()
    try:
        templates = db.query(TemplateDB).filter(TemplateDB.author_id == user_id).order_by(TemplateDB.created_at.desc()).all()
        result = []
        for t in templates:
            result.append(QuizTemplate(
                id=t.id,
                quiz_id=t.quiz_id,
                name=t.name,
                description=t.description,
                category=TemplateCategory(t.category),
                author_id=t.author_id,
                author_name=t.author_name,
                questions_count=t.questions_count,
                uses_count=t.uses_count,
                rating=t.rating,
                ratings_count=t.ratings_count,
                created_at=t.created_at.isoformat(),
                tags=t.tags or []
            ))
        return result
    finally:
        db.close()


def increment_uses(template_id: str) -> bool:
    """Increment the uses count for a template."""
    db = SessionLocal()
    try:
        template = db.query(TemplateDB).filter(TemplateDB.id == template_id).first()
        if not template:
            return False
        template.uses_count += 1
        db.commit()
        return True
    finally:
        db.close()


def rate_template(template_id: str, user_id: str, rating: int) -> QuizTemplate | None:
    """Rate a template (1-5 stars)."""
    db = SessionLocal()
    try:
        template = db.query(TemplateDB).filter(TemplateDB.id == template_id).first()
        if not template:
            return None

        if rating < 1 or rating > 5:
            return None

        # Check if user has already rated
        existing_rating = db.query(TemplateRatingDB).filter(
            TemplateRatingDB.template_id == template_id,
            TemplateRatingDB.user_id == user_id
        ).first()

        if existing_rating:
            existing_rating.rating = rating
        else:
            new_rating = TemplateRatingDB(
                template_id=template_id,
                user_id=user_id,
                rating=rating
            )
            db.add(new_rating)

        # Recalculate average rating
        all_ratings = db.query(TemplateRatingDB).filter(TemplateRatingDB.template_id == template_id).all()
        if all_ratings:
            avg_rating = sum(r.rating for r in all_ratings) / len(all_ratings)
            template.rating = round(avg_rating, 1)
            template.ratings_count = len(all_ratings)

        db.commit()

        return QuizTemplate(
            id=template.id,
            quiz_id=template.quiz_id,
            name=template.name,
            description=template.description,
            category=TemplateCategory(template.category),
            author_id=template.author_id,
            author_name=template.author_name,
            questions_count=template.questions_count,
            uses_count=template.uses_count,
            rating=template.rating,
            ratings_count=template.ratings_count,
            created_at=template.created_at.isoformat(),
            tags=template.tags or []
        )
    finally:
        db.close()


def delete_template(template_id: str, user_id: str) -> bool:
    """Delete a template (only by author)."""
    db = SessionLocal()
    try:
        template = db.query(TemplateDB).filter(TemplateDB.id == template_id).first()
        if not template:
            return False

        if template.author_id != user_id:
            return False

        db.delete(template)
        db.commit()
        return True
    finally:
        db.close()


def get_featured_templates(limit: int = 6) -> list[QuizTemplate]:
    """Get featured templates (high rating + many uses)."""
    db = SessionLocal()
    try:
        templates = db.query(TemplateDB).all()
        result = []
        for t in templates:
            result.append(QuizTemplate(
                id=t.id,
                quiz_id=t.quiz_id,
                name=t.name,
                description=t.description,
                category=TemplateCategory(t.category),
                author_id=t.author_id,
                author_name=t.author_name,
                questions_count=t.questions_count,
                uses_count=t.uses_count,
                rating=t.rating,
                ratings_count=t.ratings_count,
                created_at=t.created_at.isoformat(),
                tags=t.tags or []
            ))

        # Score = rating * log(uses + 1)
        result.sort(
            key=lambda t: t.rating * math.log(t.uses_count + 2),
            reverse=True
        )
        return result[:limit]
    finally:
        db.close()


def get_categories_with_counts() -> list[dict]:
    """Get all categories with template counts."""
    db = SessionLocal()
    try:
        templates = db.query(TemplateDB).all()
        counts: dict[str, int] = {}
        for template in templates:
            cat = template.category
            counts[cat] = counts.get(cat, 0) + 1

        return [
            {"category": cat.value, "count": counts.get(cat.value, 0)}
            for cat in TemplateCategory
        ]
    finally:
        db.close()

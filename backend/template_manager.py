from datetime import datetime
import uuid
import math
from models import QuizTemplate, TemplateCategory
from database import SessionLocal, TemplateDB, TemplateRatingDB, GroupDB, GroupMemberDB


def _get_visibility(t) -> str:
    """Get the visibility for a template, with backward compat for is_private."""
    if hasattr(t, 'visibility') and t.visibility:
        return t.visibility
    # Backward compat: if is_private is True, treat as "private"
    if t.is_private:
        return "private"
    return "public"


def _build_template(t, db=None) -> QuizTemplate:
    """Build a QuizTemplate from a TemplateDB row."""
    visibility = _get_visibility(t)
    group_id = getattr(t, 'group_id', None)
    group_name = None
    if group_id and db:
        group = db.query(GroupDB).filter(GroupDB.id == group_id).first()
        if group:
            group_name = group.name
    return QuizTemplate(
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
        tags=t.tags or [],
        is_private=t.is_private or False,
        visibility=visibility,
        group_id=group_id,
        group_name=group_name
    )


def publish_template(
    quiz_id: str,
    name: str,
    description: str,
    category: TemplateCategory,
    author_id: str,
    author_name: str,
    questions_count: int,
    tags: list[str],
    is_private: bool = False,
    passcode: str | None = None,
    visibility: str = "public",
    group_id: str | None = None
) -> QuizTemplate:
    """Publish a quiz as a template to the marketplace."""
    db = SessionLocal()
    try:
        template_id = str(uuid.uuid4())

        # Backward compat: if is_private is set but visibility not explicitly changed
        if is_private and visibility == "public":
            visibility = "private"

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
            tags=tags,
            is_private=is_private,
            passcode=passcode if is_private or visibility == "private" else None,
            visibility=visibility,
            group_id=group_id if visibility == "group" else None
        )
        db.add(db_template)
        db.commit()
        db.refresh(db_template)

        return _build_template(db_template, db)
    finally:
        db.close()


def get_template_by_quiz_id(quiz_id: str) -> QuizTemplate | None:
    """Get a template by its source quiz ID."""
    db = SessionLocal()
    try:
        template = db.query(TemplateDB).filter(TemplateDB.quiz_id == quiz_id).first()
        if not template:
            return None
        return _build_template(template, db)
    finally:
        db.close()


def delete_all_templates() -> int:
    """Delete all templates. For admin cleanup."""
    db = SessionLocal()
    try:
        # Delete ratings first
        db.query(TemplateRatingDB).delete()
        count = db.query(TemplateDB).delete()
        db.commit()
        return count
    finally:
        db.close()


def get_template(template_id: str) -> QuizTemplate | None:
    """Get a specific template by ID."""
    db = SessionLocal()
    try:
        template = db.query(TemplateDB).filter(TemplateDB.id == template_id).first()
        if not template:
            return None
        return _build_template(template, db)
    finally:
        db.close()


def verify_template_passcode(template_id: str, passcode: str) -> bool:
    """Verify a passcode for a private template."""
    db = SessionLocal()
    try:
        template = db.query(TemplateDB).filter(TemplateDB.id == template_id).first()
        if not template:
            return False
        if not template.is_private:
            return True
        return template.passcode == passcode
    finally:
        db.close()


def get_all_templates(
    category: TemplateCategory | None = None,
    search: str | None = None,
    sort_by: str = "uses",  # uses, rating, recent
    limit: int = 50,
    user_id: str | None = None
) -> list[QuizTemplate]:
    """Get all templates with optional filtering and sorting."""
    db = SessionLocal()
    try:
        query = db.query(TemplateDB)

        # Filter by category
        if category:
            query = query.filter(TemplateDB.category == category.value)

        templates = query.all()

        # Get user's group IDs for group template filtering
        user_group_ids = set()
        if user_id:
            memberships = db.query(GroupMemberDB).filter(GroupMemberDB.user_id == user_id).all()
            user_group_ids = {m.group_id for m in memberships}

        # Convert to QuizTemplate objects, filtering by visibility
        result = []
        for t in templates:
            visibility = _get_visibility(t)
            # Always include public and private templates
            if visibility in ("public", "private"):
                result.append(_build_template(t, db))
            elif visibility == "group":
                # Only include group templates if user is a member
                if t.group_id and t.group_id in user_group_ids:
                    result.append(_build_template(t, db))
            else:
                # Unknown visibility, include anyway
                result.append(_build_template(t, db))

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


def get_group_templates(group_id: str) -> list[QuizTemplate]:
    """Get all templates shared with a specific group."""
    db = SessionLocal()
    try:
        templates = db.query(TemplateDB).filter(
            TemplateDB.group_id == group_id,
            TemplateDB.visibility == "group"
        ).order_by(TemplateDB.created_at.desc()).all()
        return [_build_template(t, db) for t in templates]
    finally:
        db.close()


def get_user_templates(user_id: str) -> list[QuizTemplate]:
    """Get all templates published by a user."""
    db = SessionLocal()
    try:
        templates = db.query(TemplateDB).filter(TemplateDB.author_id == user_id).order_by(TemplateDB.created_at.desc()).all()
        result = []
        for t in templates:
            result.append(_build_template(t, db))
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
        db.refresh(template)

        return _build_template(template, db)
    finally:
        db.close()


def update_template(
    template_id: str,
    user_id: str,
    name: str | None = None,
    description: str | None = None,
    category: TemplateCategory | None = None,
    tags: list[str] | None = None,
    is_private: bool | None = None,
    passcode: str | None = None,
    visibility: str | None = None,
    group_id: str | None = None
) -> QuizTemplate | None:
    """Update a template (only by author)."""
    db = SessionLocal()
    try:
        template = db.query(TemplateDB).filter(TemplateDB.id == template_id).first()
        if not template or template.author_id != user_id:
            return None

        if name is not None:
            template.name = name
        if description is not None:
            template.description = description
        if category is not None:
            template.category = category.value
        if tags is not None:
            template.tags = tags
        if is_private is not None:
            template.is_private = is_private
            if not is_private:
                template.passcode = None
            elif passcode is not None:
                template.passcode = passcode
        elif passcode is not None and template.is_private:
            template.passcode = passcode

        if visibility is not None:
            template.visibility = visibility
            # Sync is_private for backward compat
            if visibility == "private":
                template.is_private = True
            elif visibility == "public":
                template.is_private = False
                template.passcode = None
            elif visibility == "group":
                template.is_private = False
                template.passcode = None
        if group_id is not None:
            template.group_id = group_id

        db.commit()
        db.refresh(template)

        return _build_template(template, db)
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


def get_featured_templates(limit: int = 6, user_id: str | None = None) -> list[QuizTemplate]:
    """Get featured templates (high rating + many uses)."""
    db = SessionLocal()
    try:
        templates = db.query(TemplateDB).all()

        # Get user's group IDs for group template filtering
        user_group_ids = set()
        if user_id:
            memberships = db.query(GroupMemberDB).filter(GroupMemberDB.user_id == user_id).all()
            user_group_ids = {m.group_id for m in memberships}

        result = []
        for t in templates:
            visibility = _get_visibility(t)
            if visibility in ("public", "private"):
                result.append(_build_template(t, db))
            elif visibility == "group":
                if t.group_id and t.group_id in user_group_ids:
                    result.append(_build_template(t, db))
            else:
                result.append(_build_template(t, db))

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

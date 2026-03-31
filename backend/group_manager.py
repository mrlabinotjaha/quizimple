import uuid
from datetime import datetime
from database import SessionLocal, GroupDB, GroupMemberDB, UserDB
from models import Group


def _build_group(db_group, members_list=None) -> Group:
    """Build a Group model from a DB group object."""
    members = members_list or []
    return Group(
        id=db_group.id,
        name=db_group.name,
        owner_id=db_group.owner_id,
        created_at=db_group.created_at.isoformat(),
        member_count=len(members),
        members=members
    )


def create_group(name: str, owner_id: str) -> Group:
    """Create a new group and auto-add the owner as a member with role 'owner'."""
    db = SessionLocal()
    try:
        group_id = str(uuid.uuid4())
        db_group = GroupDB(
            id=group_id,
            name=name,
            owner_id=owner_id,
            created_at=datetime.utcnow()
        )
        db.add(db_group)

        # Auto-add owner as member
        owner_member = GroupMemberDB(
            group_id=group_id,
            user_id=owner_id,
            role="owner",
            joined_at=datetime.utcnow()
        )
        db.add(owner_member)
        db.commit()
        db.refresh(db_group)

        # Get owner username
        owner = db.query(UserDB).filter(UserDB.id == owner_id).first()
        owner_username = owner.username if owner else "Unknown"

        members = [{"id": owner_id, "username": owner_username, "role": "owner"}]
        return _build_group(db_group, members)
    finally:
        db.close()


def get_group(group_id: str) -> Group | None:
    """Get a group with member count and members list."""
    db = SessionLocal()
    try:
        db_group = db.query(GroupDB).filter(GroupDB.id == group_id).first()
        if not db_group:
            return None

        # Get members with usernames
        memberships = db.query(GroupMemberDB).filter(GroupMemberDB.group_id == group_id).all()
        members = []
        for m in memberships:
            user = db.query(UserDB).filter(UserDB.id == m.user_id).first()
            members.append({
                "id": m.user_id,
                "username": user.username if user else "Unknown",
                "role": m.role
            })

        return _build_group(db_group, members)
    finally:
        db.close()


def get_user_groups(user_id: str) -> list[Group]:
    """Get all groups a user is a member of."""
    db = SessionLocal()
    try:
        memberships = db.query(GroupMemberDB).filter(GroupMemberDB.user_id == user_id).all()
        groups = []
        for m in memberships:
            db_group = db.query(GroupDB).filter(GroupDB.id == m.group_id).first()
            if db_group:
                # Get all members for this group
                group_members = db.query(GroupMemberDB).filter(GroupMemberDB.group_id == db_group.id).all()
                members = []
                for gm in group_members:
                    user = db.query(UserDB).filter(UserDB.id == gm.user_id).first()
                    members.append({
                        "id": gm.user_id,
                        "username": user.username if user else "Unknown",
                        "role": gm.role
                    })
                groups.append(_build_group(db_group, members))
        return groups
    finally:
        db.close()


def add_member(group_id: str, user_id: str, role: str = "member") -> bool:
    """Add a user to a group."""
    db = SessionLocal()
    try:
        # Check if group exists
        db_group = db.query(GroupDB).filter(GroupDB.id == group_id).first()
        if not db_group:
            return False

        # Check if already a member
        existing = db.query(GroupMemberDB).filter(
            GroupMemberDB.group_id == group_id,
            GroupMemberDB.user_id == user_id
        ).first()
        if existing:
            return False

        member = GroupMemberDB(
            group_id=group_id,
            user_id=user_id,
            role=role,
            joined_at=datetime.utcnow()
        )
        db.add(member)
        db.commit()
        return True
    finally:
        db.close()


def remove_member(group_id: str, user_id: str) -> bool:
    """Remove a user from a group. Cannot remove the owner."""
    db = SessionLocal()
    try:
        membership = db.query(GroupMemberDB).filter(
            GroupMemberDB.group_id == group_id,
            GroupMemberDB.user_id == user_id
        ).first()
        if not membership:
            return False

        # Cannot remove the owner
        if membership.role == "owner":
            return False

        db.delete(membership)
        db.commit()
        return True
    finally:
        db.close()


def delete_group(group_id: str, user_id: str) -> bool:
    """Delete a group. Only the owner can delete."""
    db = SessionLocal()
    try:
        db_group = db.query(GroupDB).filter(GroupDB.id == group_id).first()
        if not db_group:
            return False

        if db_group.owner_id != user_id:
            return False

        db.delete(db_group)
        db.commit()
        return True
    finally:
        db.close()


def is_group_member(group_id: str, user_id: str) -> bool:
    """Check if a user is a member of a group."""
    db = SessionLocal()
    try:
        membership = db.query(GroupMemberDB).filter(
            GroupMemberDB.group_id == group_id,
            GroupMemberDB.user_id == user_id
        ).first()
        return membership is not None
    finally:
        db.close()


def invite_by_username(group_id: str, username: str) -> dict | None:
    """Find a user by username or email and add them to the group. Returns {id, username} or None."""
    db = SessionLocal()
    try:
        user = db.query(UserDB).filter(UserDB.username == username).first()
        if not user:
            user = db.query(UserDB).filter(UserDB.email == username).first()
        if not user:
            return None

        # Check if already a member
        existing = db.query(GroupMemberDB).filter(
            GroupMemberDB.group_id == group_id,
            GroupMemberDB.user_id == user.id
        ).first()
        if existing:
            return None

        member = GroupMemberDB(
            group_id=group_id,
            user_id=user.id,
            role="member",
            joined_at=datetime.utcnow()
        )
        db.add(member)
        db.commit()
        return {"id": user.id, "username": user.username}
    finally:
        db.close()

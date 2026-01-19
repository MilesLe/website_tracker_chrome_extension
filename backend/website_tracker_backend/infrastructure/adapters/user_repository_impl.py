"""
SQLAlchemy implementation of UserRepository.
"""
from sqlalchemy.orm import Session

from ...domain.interfaces.user_repository import UserRepository
from ..database.models import User


class SQLAlchemyUserRepository(UserRepository):
    """SQLAlchemy implementation of user repository."""
    
    def __init__(self, db: Session):
        """
        Initialize repository with database session.
        
        Args:
            db: SQLAlchemy database session
        """
        self._db = db
    
    def get_or_create_user(self, user_id: str) -> None:
        """
        Get existing user or create new one if not exists.
        
        Args:
            user_id: User identifier
        """
        user = self._db.query(User).filter(User.id == user_id).first()
        if not user:
            user = User(id=user_id)
            self._db.add(user)
            self._db.commit()
            self._db.refresh(user)

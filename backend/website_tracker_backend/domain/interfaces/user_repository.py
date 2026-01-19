"""
Interface for user repository (port).
"""
from abc import ABC, abstractmethod


class UserRepository(ABC):
    """Interface for accessing users."""
    
    @abstractmethod
    def get_or_create_user(self, user_id: str) -> None:
        """
        Get existing user or create new one if not exists.
        
        Args:
            user_id: User identifier
        """
        pass

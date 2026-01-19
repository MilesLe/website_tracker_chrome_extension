"""
SQLAlchemy models for the database.
"""
from sqlalchemy import Column, String, Integer, Float, Date, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

Base = declarative_base()


class User(Base):
    """User model for tracking extension users."""
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, unique=True, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    tracked_sites = relationship("TrackedSite", back_populates="user", cascade="all, delete-orphan")
    usage_records = relationship("UsageRecord", back_populates="user", cascade="all, delete-orphan")


class TrackedSite(Base):
    """Tracked site model for storing domain limits."""
    __tablename__ = "tracked_sites"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    domain = Column(String, nullable=False)
    daily_limit = Column(Integer, nullable=False)  # minutes
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="tracked_sites")
    
    __table_args__ = (UniqueConstraint('user_id', 'domain', name='_user_domain_uc'),)


class UsageRecord(Base):
    """Usage record model for storing daily usage per domain."""
    __tablename__ = "usage_records"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    domain = Column(String, nullable=False)
    date = Column(Date, nullable=False)  # YYYY-MM-DD
    minutes = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="usage_records")
    
    __table_args__ = (UniqueConstraint('user_id', 'domain', 'date', name='_user_domain_date_uc'),)

"""Pydantic models for request/response validation."""

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    question: str = Field(..., min_length=1, max_length=2000)
    employee_name: str = Field(..., min_length=1, max_length=200)
    employee_id: str = Field(..., min_length=1, max_length=100)
    session_id: Optional[str] = None


class SourceDocument(BaseModel):
    document: str
    section: str
    content: str
    relevance: float


class ChatResponse(BaseModel):
    id: str
    answer: str
    confidence: float
    sources: List[SourceDocument]
    response_time_ms: int


class FeedbackRequest(BaseModel):
    chat_id: str
    feedback: str = Field(..., pattern="^(positive|negative)$")
    flagged: bool = False
    notes: Optional[str] = None


class FeedbackResponse(BaseModel):
    success: bool
    message: str


class StatsResponse(BaseModel):
    total_questions: int
    active_employees: int
    total_conversations: int
    average_response_time_ms: float
    accuracy_rate: float
    average_confidence: float
    positive_feedback: int
    negative_feedback: int


class AnalyticsPoint(BaseModel):
    date: str
    count: int


class FAQItem(BaseModel):
    question: str
    count: int


class TopicItem(BaseModel):
    topic: str
    count: int


class EmployeeActivityItem(BaseModel):
    employee_name: str
    employee_id: str
    question_count: int
    last_active: str


class AnalyticsResponse(BaseModel):
    questions_per_day: List[AnalyticsPoint]
    weekly_questions: int
    monthly_questions: int
    frequently_asked: List[FAQItem]
    most_asked_topics: List[TopicItem]
    ai_accuracy: float
    average_confidence: float
    average_response_time_ms: float
    positive_vs_negative: dict
    employee_activity: List[EmployeeActivityItem]


class DocumentInfo(BaseModel):
    id: str
    name: str
    type: str
    sections: int
    uploaded_at: Optional[str] = None


class LogEntry(BaseModel):
    id: str
    timestamp: str
    employee_name: str
    employee_id: str
    question: str
    response_time_ms: int
    confidence: float
    feedback: Optional[str] = None
    flagged: bool


class HealthResponse(BaseModel):
    status: str
    version: str
    services: dict

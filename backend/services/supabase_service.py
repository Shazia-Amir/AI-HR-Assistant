"""Supabase client and database operations."""

import os
from typing import Any, Dict, List, Optional

from supabase import create_client, Client

from config import settings


class SupabaseService:
    _client: Optional[Client] = None

    @classmethod
    def get_client(cls) -> Client:
        if cls._client is None:
            cls._client = create_client(
                settings.supabase_url,
                settings.supabase_service_role_key,
            )
        return cls._client

    @classmethod
    def insert_chat_record(cls, record: Dict[str, Any]) -> Dict[str, Any]:
        client = cls.get_client()
        result = client.table("chat_history").insert(record).execute()
        return result.data[0] if result.data else {}

    @classmethod
    def update_feedback(
        cls, chat_id: str, feedback: str, flagged: bool, notes: Optional[str]
    ) -> Dict[str, Any]:
        client = cls.get_client()
        update_data: Dict[str, Any] = {"feedback": feedback, "flagged": flagged}
        if notes:
            update_data["feedback_notes"] = notes
        result = (
            client.table("chat_history")
            .update(update_data)
            .eq("id", chat_id)
            .execute()
        )
        return result.data[0] if result.data else {}

    @classmethod
    def get_chat_history(
        cls, limit: int = 50, offset: int = 0
    ) -> List[Dict[str, Any]]:
        client = cls.get_client()
        result = (
            client.table("chat_history")
            .select("*")
            .order("created_at", desc=True)
            .range(offset, offset + limit - 1)
            .execute()
        )
        return result.data

    @classmethod
    def get_chat_by_id(cls, chat_id: str) -> Optional[Dict[str, Any]]:
        client = cls.get_client()
        result = (
            client.table("chat_history").select("*").eq("id", chat_id).execute()
        )
        return result.data[0] if result.data else None

    @classmethod
    def get_all_chat_records(cls) -> List[Dict[str, Any]]:
        client = cls.get_client()
        result = (
            client.table("chat_history")
            .select("*")
            .order("created_at", desc=True)
            .execute()
        )
        return result.data

    @classmethod
    def get_flagged_conversations(cls) -> List[Dict[str, Any]]:
        client = cls.get_client()
        result = (
            client.table("chat_history")
            .select("*")
            .eq("flagged", True)
            .order("created_at", desc=True)
            .execute()
        )
        return result.data

    @classmethod
    def search_chat_history(cls, query: str) -> List[Dict[str, Any]]:
        client = cls.get_client()
        result = (
            client.table("chat_history")
            .select("*")
            .or_(f"question.ilike.%{query}%,ai_response.ilike.%{query}%,employee_name.ilike.%{query}%")
            .order("created_at", desc=True)
            .execute()
        )
        return result.data

    @classmethod
    def get_documents(cls) -> List[Dict[str, Any]]:
        client = cls.get_client()
        result = client.table("hr_documents").select("*").execute()
        return result.data

    @classmethod
    def insert_document(cls, record: Dict[str, Any]) -> Dict[str, Any]:
        client = cls.get_client()
        result = client.table("hr_documents").insert(record).execute()
        return result.data[0] if result.data else {}

    @classmethod
    def get_employee_sessions(cls) -> List[Dict[str, Any]]:
        client = cls.get_client()
        result = client.table("user_sessions").select("*").execute()
        return result.data

    @classmethod
    def upsert_employee(cls, name: str, employee_id: str) -> Dict[str, Any]:
        client = cls.get_client()
        existing = (
            client.table("employees")
            .select("*")
            .eq("employee_id", employee_id)
            .execute()
        )
        if existing.data:
            return existing.data[0]
        record = {"name": name, "employee_id": employee_id, "is_active": True}
        result = client.table("employees").insert(record).execute()
        return result.data[0] if result.data else {}


supabase_service = SupabaseService

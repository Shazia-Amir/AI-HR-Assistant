"""Analytics engine for computing HR dashboard metrics."""

from collections import Counter
from datetime import datetime, timedelta
from typing import Dict, List

from services.supabase_service import supabase_service


class AnalyticsEngine:
    @staticmethod
    def compute_stats() -> Dict:
        records = supabase_service.get_all_chat_records()

        total_questions = len(records)
        unique_employees = set(
            (r.get("employee_name"), r.get("employee_id")) for r in records
        )
        active_employees = len(unique_employees)

        response_times = [
            r.get("response_time_ms", 0) for r in records if r.get("response_time_ms")
        ]
        avg_response_time = (
            sum(response_times) / len(response_times) if response_times else 0
        )

        confidence_scores = [
            r.get("confidence", 0) for r in records if r.get("confidence") is not None
        ]
        avg_confidence = (
            sum(confidence_scores) / len(confidence_scores)
            if confidence_scores
            else 0
        )

        positive = sum(1 for r in records if r.get("feedback") == "positive")
        negative = sum(1 for r in records if r.get("feedback") == "negative")
        total_feedback = positive + negative
        accuracy_rate = (positive / total_feedback * 100) if total_feedback > 0 else 0

        return {
            "total_questions": total_questions,
            "active_employees": active_employees,
            "total_conversations": total_questions,
            "average_response_time_ms": round(avg_response_time, 2),
            "accuracy_rate": round(accuracy_rate, 2),
            "average_confidence": round(avg_confidence, 4),
            "positive_feedback": positive,
            "negative_feedback": negative,
        }

    @staticmethod
    def compute_analytics() -> Dict:
        records = supabase_service.get_all_chat_records()
        now = datetime.utcnow()

        # Questions per day (last 30 days)
        daily_counts: Dict[str, int] = Counter()
        for r in records:
            created = r.get("created_at", "")
            if created:
                try:
                    dt = datetime.fromisoformat(created.replace("Z", "+00:00"))
                    date_str = dt.strftime("%Y-%m-%d")
                    daily_counts[date_str] += 1
                except (ValueError, TypeError):
                    continue

        questions_per_day = []
        for i in range(29, -1, -1):
            date = now - timedelta(days=i)
            date_str = date.strftime("%Y-%m-%d")
            questions_per_day.append(
                {"date": date_str, "count": daily_counts.get(date_str, 0)}
            )

        # Weekly and monthly counts
        week_ago = now - timedelta(days=7)
        month_ago = now - timedelta(days=30)
        weekly_questions = 0
        monthly_questions = 0
        for r in records:
            created = r.get("created_at", "")
            if created:
                try:
                    dt = datetime.fromisoformat(created.replace("Z", "+00:00"))
                    if dt >= week_ago:
                        weekly_questions += 1
                    if dt >= month_ago:
                        monthly_questions += 1
                except (ValueError, TypeError):
                    continue

        # Frequently asked questions
        question_counts: Counter = Counter()
        for r in records:
            q = r.get("question", "")
            if q:
                normalized = q.strip().lower()
                question_counts[normalized] += 1

        frequently_asked = [
            {"question": q, "count": c} for q, c in question_counts.most_common(10)
        ]

        # Most asked topics (based on source documents)
        topic_counts: Counter = Counter()
        for r in records:
            sources = r.get("source_documents", [])
            if isinstance(sources, list):
                for src in sources:
                    if isinstance(src, dict):
                        topic_counts[src.get("document", "Unknown")] += 1
                    elif isinstance(src, str):
                        topic_counts[src] += 1

        most_asked_topics = [
            {"topic": t, "count": c} for t, c in topic_counts.most_common(10)
        ]

        # AI accuracy
        positive = sum(1 for r in records if r.get("feedback") == "positive")
        negative = sum(1 for r in records if r.get("feedback") == "negative")
        total_feedback = positive + negative
        ai_accuracy = (positive / total_feedback * 100) if total_feedback > 0 else 0

        # Average confidence
        confidence_scores = [
            r.get("confidence", 0) for r in records if r.get("confidence") is not None
        ]
        avg_confidence = (
            sum(confidence_scores) / len(confidence_scores)
            if confidence_scores
            else 0
        )

        # Average response time
        response_times = [
            r.get("response_time_ms", 0) for r in records if r.get("response_time_ms")
        ]
        avg_response_time = (
            sum(response_times) / len(response_times) if response_times else 0
        )

        # Positive vs negative
        positive_vs_negative = {
            "positive": positive,
            "negative": negative,
            "neutral": total_questions - positive - negative,
        }

        # Employee activity
        employee_activity_map: Dict[str, Dict] = {}
        for r in records:
            emp_id = r.get("employee_id", "Unknown")
            emp_name = r.get("employee_name", "Unknown")
            key = f"{emp_name}_{emp_id}"
            if key not in employee_activity_map:
                employee_activity_map[key] = {
                    "employee_name": emp_name,
                    "employee_id": emp_id,
                    "question_count": 0,
                    "last_active": r.get("created_at", ""),
                }
            employee_activity_map[key]["question_count"] += 1
            created = r.get("created_at", "")
            if created and created > employee_activity_map[key]["last_active"]:
                employee_activity_map[key]["last_active"] = created

        employee_activity = sorted(
            list(employee_activity_map.values()),
            key=lambda x: x["question_count"],
            reverse=True,
        )[:10]

        return {
            "questions_per_day": questions_per_day,
            "weekly_questions": weekly_questions,
            "monthly_questions": monthly_questions,
            "frequently_asked": frequently_asked,
            "most_asked_topics": most_asked_topics,
            "ai_accuracy": round(ai_accuracy, 2),
            "average_confidence": round(avg_confidence, 4),
            "average_response_time_ms": round(avg_response_time, 2),
            "positive_vs_negative": positive_vs_negative,
            "employee_activity": employee_activity,
        }

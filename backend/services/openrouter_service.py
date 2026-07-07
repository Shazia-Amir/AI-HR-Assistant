"""OpenRouter LLM service with streaming support."""

import json
from typing import AsyncGenerator, Dict, List

import httpx

from config import settings


class OpenRouterService:
    def __init__(self):
        self.api_key = settings.openrouter_api_key
        self.model = settings.openrouter_model
        self.base_url = settings.openrouter_base_url
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "http://localhost:3000",
            "X-Title": "AI HR Assistant",
        }

    def _build_messages(
        self, question: str, context: str, sources: List[Dict]
    ) -> List[Dict[str, str]]:
        has_context = len(sources) > 0

        system_prompt = (
            "You are a friendly and helpful AI HR Assistant for a company. "
            "You help employees with HR-related questions and also handle general conversation naturally.\n\n"
            "RULES:\n"
            "1. For greetings, small talk, or general conversation (e.g. 'Hi', 'Hello', 'How are you', 'Thanks') — "
            "respond warmly and naturally. You don't need HR documents for this.\n"
            "2. For HR-related questions where context is provided — answer accurately using ONLY "
            "the provided HR documents. Mention the source document name when relevant. "
            "Format responses using Markdown for readability.\n"
            "3. For HR-related questions where NO relevant context is found — politely explain "
            "that the specific information isn't in the current HR documentation and suggest "
            "contacting the HR department. Never invent policies, numbers, or procedures.\n"
            "4. Be concise, professional, and warm in tone.\n"
        )

        if has_context:
            context_text = "Relevant HR policy documents:\n\n"
            for i, src in enumerate(sources, 1):
                context_text += f"--- Source {i}: {src.get('document', 'Unknown')} ---\n"
                context_text += f"Section: {src.get('section', 'N/A')}\n"
                context_text += f"{src.get('content', '')}\n\n"
            user_prompt = f"{context_text}\nEmployee message: {question}"
        else:
            user_prompt = f"Employee message: {question}"

        return [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ]

    async def generate_response(
        self, question: str, context: str, sources: List[Dict]
    ) -> str:
        messages = self._build_messages(question, context, sources)
        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": 0.3,
            "max_tokens": 2000,
            "stream": False,
        }

        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                f"{self.base_url}/chat/completions",
                headers=self.headers,
                json=payload,
            )
            response.raise_for_status()
            data = response.json()
            return data["choices"][0]["message"]["content"]

    async def stream_response(
        self, question: str, context: str, sources: List[Dict]
    ) -> AsyncGenerator[str, None]:
        messages = self._build_messages(question, context, sources)
        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": 0.3,
            "max_tokens": 2000,
            "stream": True,
        }

        async with httpx.AsyncClient(timeout=120.0) as client:
            async with client.stream(
                "POST",
                f"{self.base_url}/chat/completions",
                headers=self.headers,
                json=payload,
            ) as response:
                response.raise_for_status()
                async for line in response.aiter_lines():
                    if line.startswith("data: "):
                        data_str = line[6:]
                        if data_str.strip() == "[DONE]":
                            break
                        try:
                            data = json.loads(data_str)
                            delta = data["choices"][0].get("delta", {})
                            content = delta.get("content", "")
                            if content:
                                yield content
                        except (json.JSONDecodeError, KeyError, IndexError):
                            continue


openrouter_service = OpenRouterService()

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
        system_prompt = (
            "You are an AI HR Assistant for a company. Your role is to answer "
            "employee questions about company HR policies accurately and helpfully.\n\n"
            "CRITICAL RULES:\n"
            "1. Answer ONLY using the provided context from company HR documents.\n"
            "2. If the context does not contain relevant information to answer the question, "
            "respond EXACTLY with: \"I'm sorry, but I couldn't find that information in the "
            "company's HR documentation. Please contact the HR department.\"\n"
            "3. Never hallucinate or invent policies, numbers, or procedures.\n"
            "4. Never answer questions outside the HR knowledge base.\n"
            "5. Be clear, professional, and concise.\n"
            "6. When referencing specific policies, mention the source document name.\n"
            "7. Format responses using Markdown for readability.\n"
        )

        context_text = "Here are the relevant HR policy documents:\n\n"
        for i, src in enumerate(sources, 1):
            context_text += f"--- Source {i}: {src.get('document', 'Unknown')} ---\n"
            context_text += f"Section: {src.get('section', 'N/A')}\n"
            context_text += f"{src.get('content', '')}\n\n"

        user_prompt = f"{context_text}\n\nEmployee Question: {question}\n\nAnswer based ONLY on the context above."

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

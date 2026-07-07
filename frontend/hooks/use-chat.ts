"use client";

import { useState, useCallback, useRef } from "react";
import { api, type SourceDocument } from "@/lib/api";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  confidence?: number;
  sources?: SourceDocument[];
  responseTimeMs?: number;
  feedback?: "positive" | "negative" | null;
  flagged?: boolean;
}

export function useChat(employeeName: string, employeeId: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(
    async (question: string, onStream?: (partial: string) => void) => {
      if (!question.trim() || isLoading) return;

      setError(null);
      setIsLoading(true);

      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: question,
      };

      const assistantId = crypto.randomUUID();
      const assistantPlaceholder: ChatMessage = {
        id: assistantId,
        role: "assistant",
        content: "",
      };

      setMessages((prev) => [...prev, userMessage, assistantPlaceholder]);

      try {
        const response = await api.chatStream({
          question,
          employee_name: employeeName,
          employee_id: employeeId,
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No response body");

        const decoder = new TextDecoder();
        let buffer = "";
        let fullContent = "";
        let metadata: { confidence: number; sources: SourceDocument[]; chat_id: string } | null = null;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const dataStr = line.slice(6);
            try {
              const data = JSON.parse(dataStr);
              if (data.type === "metadata") {
                metadata = {
                  confidence: data.confidence,
                  sources: data.sources,
                  chat_id: data.chat_id,
                };
              } else if (data.type === "content") {
                fullContent += data.content;
                onStream?.(fullContent);
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId ? { ...m, content: fullContent } : m
                  )
                );
              } else if (data.type === "done") {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId
                      ? {
                          ...m,
                          id: data.chat_id || assistantId,
                          confidence: metadata?.confidence,
                          sources: metadata?.sources,
                        }
                      : m
                  )
                );
              } else if (data.type === "error") {
                throw new Error(data.message);
              }
            } catch {
              continue;
            }
          }
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Failed to get response";
        setError(errorMsg);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? {
                  ...m,
                  content:
                    "I'm sorry, but I couldn't find that information in the company's HR documentation. Please contact the HR department.",
                }
              : m
          )
        );
      } finally {
        setIsLoading(false);
      }
    },
    [employeeName, employeeId, isLoading]
  );

  const regenerate = useCallback(
    async () => {
      const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
      if (!lastUserMsg) return;

      setMessages((prev) => {
        const idx = prev.findIndex((m) => m.id === lastUserMsg.id);
        return prev.slice(0, idx + 1);
      });

      await sendMessage(lastUserMsg.content);
    },
    [messages, sendMessage]
  );

  const clearChat = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  const updateMessageFeedback = useCallback(
    (messageId: string, feedback: "positive" | "negative", flagged?: boolean) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? { ...m, feedback, flagged: flagged ?? m.flagged }
            : m
        )
      );
    },
    []
  );

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    regenerate,
    clearChat,
    updateMessageFeedback,
  };
}

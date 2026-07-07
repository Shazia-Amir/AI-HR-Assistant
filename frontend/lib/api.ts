export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface SourceDocument {
  document: string;
  section: string;
  content: string;
  relevance: number;
}

export interface ChatResponse {
  id: string;
  answer: string;
  confidence: number;
  sources: SourceDocument[];
  response_time_ms: number;
}

export interface StatsResponse {
  total_questions: number;
  active_employees: number;
  total_conversations: number;
  average_response_time_ms: number;
  accuracy_rate: number;
  average_confidence: number;
  positive_feedback: number;
  negative_feedback: number;
}

export interface AnalyticsPoint {
  date: string;
  count: number;
}

export interface FAQItem {
  question: string;
  count: number;
}

export interface TopicItem {
  topic: string;
  count: number;
}

export interface EmployeeActivityItem {
  employee_name: string;
  employee_id: string;
  question_count: number;
  last_active: string;
}

export interface AnalyticsResponse {
  questions_per_day: AnalyticsPoint[];
  weekly_questions: number;
  monthly_questions: number;
  frequently_asked: FAQItem[];
  most_asked_topics: TopicItem[];
  ai_accuracy: number;
  average_confidence: number;
  average_response_time_ms: number;
  positive_vs_negative: {
    positive: number;
    negative: number;
    neutral: number;
  };
  employee_activity: EmployeeActivityItem[];
}

export interface LogEntry {
  id: string;
  timestamp: string;
  employee_name: string;
  employee_id: string;
  question: string;
  response_time_ms: number;
  confidence: number;
  feedback: string | null;
  flagged: boolean;
}

export interface ChatLogDetail {
  id: string;
  employee_name: string;
  employee_id: string;
  question: string;
  ai_response: string;
  retrieved_context: string | null;
  source_documents: SourceDocument[];
  confidence_score: number;
  response_time_ms: number;
  feedback: string | null;
  feedback_notes: string | null;
  flagged: boolean;
  created_at: string;
}

export interface DocumentInfo {
  id: string;
  name: string;
  type: string;
  sections: number;
  uploaded_at: string | null;
}

export interface HealthResponse {
  status: string;
  version: string;
  services: Record<string, boolean>;
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Request failed" }));
    throw new Error(error.detail || `HTTP ${res.status}`);
  }

  return res.json();
}

export const api = {
  chat: (data: { question: string; employee_name: string; employee_id: string }) =>
    apiFetch<ChatResponse>("/chat", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  chatStream: (data: { question: string; employee_name: string; employee_id: string }) =>
    fetch(`${API_BASE_URL}/chat/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),

  submitFeedback: (data: { chat_id: string; feedback: string; flagged?: boolean; notes?: string }) =>
    apiFetch<{ success: boolean; message: string }>("/feedback", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getStats: () => apiFetch<StatsResponse>("/stats"),

  getAnalytics: () => apiFetch<AnalyticsResponse>("/analytics"),

  getDocuments: () => apiFetch<DocumentInfo[]>("/documents"),

  getLogs: (params?: { limit?: number; offset?: number; page?: number; search?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.set("limit", String(params.limit));
    if (params?.page) {
      const offset = (params.page - 1) * (params.limit || 10);
      searchParams.set("offset", String(offset));
    }
    if (params?.offset) searchParams.set("offset", String(params.offset));
    if (params?.search) searchParams.set("search", params.search);
    const query = searchParams.toString();
    return apiFetch<LogEntry[]>(`/logs${query ? `?${query}` : ""}`);
  },

  getHealth: () => apiFetch<HealthResponse>("/health"),

  rebuildVectorStore: () =>
    apiFetch<{ success: boolean; message: string }>("/documents/rebuild", {
      method: "POST",
    }),
};

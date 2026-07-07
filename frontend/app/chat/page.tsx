"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Send, Plus, MessageSquare, Copy, RefreshCw, ThumbsUp, ThumbsDown,
  Flag, Download, Mic, Brain, Sparkles, FileText, ChevronDown,
  Trash2, Search, X, Loader2, Check
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ThemeToggle } from "@/components/theme-toggle";
import { useChat, type ChatMessage } from "@/hooks/use-chat";
import { api } from "@/lib/api";
import { cn, getConfidenceBg, downloadText, exportToCSV } from "@/lib/utils";

const SUGGESTED_QUESTIONS = [
  "How many annual leave days am I entitled to?",
  "What is the maternity leave policy?",
  "What are the core working hours?",
  "How does the leave approval workflow work?",
  "What is the late arrival policy?",
  "How many sick leave days do I get?",
  "What is the hybrid work model?",
  "How does the git workflow work?",
];

interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
}

export default function ChatPage() {
  const [employeeName, setEmployeeName] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [showIdentity, setShowIdentity] = useState(true);
  const [input, setInput] = useState("");
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<{ stop: () => void } | null>(null);

  const { messages, isLoading, sendMessage, regenerate, clearChat, updateMessageFeedback } =
    useChat(employeeName, employeeId);

  const activeSession = sessions.find((s) => s.id === activeSessionId);
  const displayMessages = activeSession ? activeSession.messages : messages;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [displayMessages]);

  useEffect(() => {
    const saved = localStorage.getItem("hr_chat_sessions");
    if (saved) {
      try {
        setSessions(JSON.parse(saved));
      } catch {
        // ignore
      }
    }
    const savedName = localStorage.getItem("hr_employee_name");
    const savedId = localStorage.getItem("hr_employee_id");
    if (savedName && savedId) {
      setEmployeeName(savedName);
      setEmployeeId(savedId);
      setShowIdentity(false);
    }
  }, []);

  const saveSession = useCallback((sessionId: string, msgs: ChatMessage[]) => {
    setSessions((prev) => {
      const title = msgs.find((m) => m.role === "user")?.content.slice(0, 40) || "New Chat";
      const existing = prev.find((s) => s.id === sessionId);
      const updated: ChatSession = existing
        ? { ...existing, title, messages: msgs, createdAt: new Date().toISOString() }
        : { id: sessionId, title, messages: msgs, createdAt: new Date().toISOString() };
      const newSessions = [updated, ...prev.filter((s) => s.id !== sessionId)].slice(0, 20);
      localStorage.setItem("hr_chat_sessions", JSON.stringify(newSessions));
      return newSessions;
    });
  }, []);

  useEffect(() => {
    if (messages.length > 0 && !activeSessionId) {
      const sid = crypto.randomUUID();
      setActiveSessionId(sid);
      saveSession(sid, messages);
    } else if (activeSessionId && messages.length > 0) {
      saveSession(activeSessionId, messages);
    }
  }, [messages, activeSessionId, saveSession]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const question = input.trim();
    setInput("");
    if (inputRef.current) inputRef.current.style.height = "auto";
    await sendMessage(question);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleNewChat = () => {
    clearChat();
    setActiveSessionId(null);
    setSidebarOpen(false);
  };

  const handleSelectSession = (sessionId: string) => {
    const session = sessions.find((s) => s.id === sessionId);
    if (session) {
      setActiveSessionId(sessionId);
      setSidebarOpen(false);
    }
  };

  const handleDeleteSession = (sessionId: string) => {
    setSessions((prev) => {
      const filtered = prev.filter((s) => s.id !== sessionId);
      localStorage.setItem("hr_chat_sessions", JSON.stringify(filtered));
      return filtered;
    });
    if (activeSessionId === sessionId) {
      handleNewChat();
    }
  };

  const handleCopy = (content: string, id: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleFeedback = async (messageId: string, feedback: "positive" | "negative") => {
    updateMessageFeedback(messageId, feedback);
    try {
      await api.submitFeedback({ chat_id: messageId, feedback });
      toast.success(feedback === "positive" ? "Marked as correct" : "Marked as incorrect");
    } catch {
      toast.error("Failed to submit feedback");
    }
  };

  const handleFlag = async (messageId: string) => {
    updateMessageFeedback(messageId, "negative", true);
    try {
      await api.submitFeedback({ chat_id: messageId, feedback: "negative", flagged: true });
      toast.success("Conversation flagged for review");
    } catch {
      toast.error("Failed to flag conversation");
    }
  };

  const handleExportChat = () => {
    if (displayMessages.length === 0) {
      toast.error("No messages to export");
      return;
    }
    const content = displayMessages
      .map((m) => `## ${m.role === "user" ? "Employee" : "AI Assistant"}\n\n${m.content}\n`)
      .join("\n---\n\n");
    downloadText(`chat-export-${Date.now()}.md`, content, "text/markdown");
    toast.success("Chat exported as Markdown");
  };

  const handleExportCSV = () => {
    if (displayMessages.length === 0) return;
    const data = displayMessages
      .filter((m) => m.role === "assistant")
      .map((m) => ({
        question: displayMessages.find((prev, i) => {
          const assistantIdx = displayMessages.indexOf(m);
          return prev.role === "user" && i < assistantIdx && i === assistantIdx - 1;
        })?.content || "",
        answer: m.content,
        confidence: m.confidence || 0,
        sources: m.sources?.map((s) => s.document).join("; ") || "",
      }));
    exportToCSV(data, `chat-export-${Date.now()}.csv`);
    toast.success("Chat exported as CSV");
  };

  const handleVoiceInput = () => {
    if (typeof window === "undefined" || !("webkitSpeechRecognition" in window)) {
      toast.error("Voice input not supported in this browser");
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: { results: { 0: { transcript: string } } }) => {
      const transcript = event.results[0].transcript;
      setInput(transcript);
    };

    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => {
      setIsListening(false);
      toast.error("Voice input failed");
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  };

  const filteredSessions = sessions.filter((s) =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (showIdentity) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background via-background to-muted/20 p-4">
        <div className="absolute right-4 top-4">
          <ThemeToggle />
        </div>
        <div className="w-full max-w-md glass-card p-8">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600">
              <Brain className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">AI HR Assistant</h1>
              <p className="text-sm text-muted-foreground">Enter your details to start</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Your Name</label>
              <Input
                value={employeeName}
                onChange={(e) => setEmployeeName(e.target.value)}
                placeholder="John Doe"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Employee ID</label>
              <Input
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                placeholder="EMP001"
              />
            </div>
            <Button
              variant="gradient"
              className="w-full"
              disabled={!employeeName.trim() || !employeeId.trim()}
              onClick={() => {
                localStorage.setItem("hr_employee_name", employeeName);
                localStorage.setItem("hr_employee_id", employeeId);
                setShowIdentity(false);
              }}
            >
              Start Chatting
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/50 md:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          </>
        )}
      </AnimatePresence>

      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 border-r bg-muted/30 backdrop-blur-xl transition-transform md:relative md:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600">
                <Brain className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold">HR Assistant</span>
            </div>
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSidebarOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="px-4 pb-2">
            <Button variant="gradient" className="w-full" onClick={handleNewChat}>
              <Plus className="mr-2 h-4 w-4" />
              New Chat
            </Button>
          </div>

          <div className="px-4 py-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search chats..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 pl-9 text-sm"
              />
            </div>
          </div>

          <ScrollArea className="flex-1 px-2">
            <div className="space-y-1 py-2">
              {filteredSessions.length === 0 ? (
                <div className="px-3 py-8 text-center text-sm text-muted-foreground">
                  No conversations yet
                </div>
              ) : (
                filteredSessions.map((session) => (
                  <div
                    key={session.id}
                    className={cn(
                      "group flex items-center gap-2 rounded-lg px-3 py-2 text-sm cursor-pointer transition-colors hover:bg-accent",
                      activeSessionId === session.id && "bg-accent"
                    )}
                    onClick={() => handleSelectSession(session.id)}
                  >
                    <MessageSquare className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="flex-1 truncate">{session.title}</span>
                    <button
                      className="opacity-0 transition-opacity group-hover:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSession(session.id);
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>

          <div className="border-t p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-xs font-bold text-white">
                  {employeeName.charAt(0).toUpperCase()}
                </div>
                <div className="text-sm">
                  <div className="font-medium">{employeeName}</div>
                  <div className="text-xs text-muted-foreground">{employeeId}</div>
                </div>
              </div>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b px-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSidebarOpen(true)}>
              <MessageSquare className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-indigo-500" />
              <span className="font-semibold">AI HR Assistant</span>
              <Badge variant="success" className="ml-2">Online</Badge>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={handleExportChat} disabled={displayMessages.length === 0}>
              <Download className="mr-1 h-4 w-4" />
              <span className="hidden sm:inline">Export</span>
            </Button>
            <Button variant="ghost" size="sm" onClick={handleExportCSV} disabled={displayMessages.length === 0}>
              <FileText className="mr-1 h-4 w-4" />
              <span className="hidden sm:inline">CSV</span>
            </Button>
          </div>
        </header>

        <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin">
          {displayMessages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center px-4">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600">
                <Brain className="h-10 w-10 text-white" />
              </div>
              <h2 className="mb-2 text-2xl font-bold">Ask me anything about HR policies</h2>
              <p className="mb-8 text-center text-muted-foreground">
                I can answer questions about leave policies, office hours, project management, and more.
              </p>
              <div className="grid w-full max-w-2xl gap-3 sm:grid-cols-2">
                {SUGGESTED_QUESTIONS.map((question) => (
                  <button
                    key={question}
                    onClick={() => {
                      setInput(question);
                      inputRef.current?.focus();
                    }}
                    className="glass-card p-4 text-left text-sm transition-all hover:shadow-md hover:-translate-y-0.5"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="mx-auto max-w-3xl px-4 py-6 space-y-6">
              {displayMessages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "flex gap-3",
                    message.role === "user" ? "flex-row-reverse" : "flex-row"
                  )}
                >
                  <div
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                      message.role === "user"
                        ? "bg-gradient-to-br from-indigo-500 to-purple-600"
                        : "bg-muted"
                    )}
                  >
                    {message.role === "user" ? (
                      <span className="text-xs font-bold text-white">
                        {employeeName.charAt(0).toUpperCase()}
                      </span>
                    ) : (
                      <Brain className="h-5 w-5 text-foreground" />
                    )}
                  </div>

                  <div className={cn("flex-1 space-y-2", message.role === "user" && "flex flex-col items-end")}>
                    <div
                      className={cn(
                        "rounded-2xl px-4 py-3 text-sm",
                        message.role === "user"
                          ? "bg-gradient-to-br from-indigo-500 to-purple-600 text-white"
                          : "glass-card"
                      )}
                    >
                      {message.role === "assistant" ? (
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                          <ReactMarkdown>{message.content || "..."}</ReactMarkdown>
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap">{message.content}</p>
                      )}
                    </div>

                    {message.role === "assistant" && message.content && (
                      <div className="flex flex-wrap items-center gap-2 px-1">
                        {message.confidence !== undefined && (
                          <Badge className={getConfidenceBg(message.confidence)}>
                            {Math.round(message.confidence * 100)}% confident
                          </Badge>
                        )}
                        {message.sources && message.sources.length > 0 && (
                          <div className="flex items-center gap-1">
                            <FileText className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              {message.sources.length} source{message.sources.length > 1 ? "s" : ""}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleCopy(message.content, message.id)}
                          >
                            {copiedId === message.id ? (
                              <Check className="h-3.5 w-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => regenerate()}
                            disabled={isLoading}
                          >
                            <RefreshCw className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className={cn("h-7 w-7", message.feedback === "positive" && "text-emerald-500")}
                            onClick={() => handleFeedback(message.id, "positive")}
                          >
                            <ThumbsUp className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className={cn("h-7 w-7", message.feedback === "negative" && "text-red-500")}
                            onClick={() => handleFeedback(message.id, "negative")}
                          >
                            <ThumbsDown className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className={cn("h-7 w-7", message.flagged && "text-amber-500")}
                            onClick={() => handleFlag(message.id)}
                          >
                            <Flag className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    )}

                    {message.role === "assistant" && message.sources && message.sources.length > 0 && message.content && (
                      <details className="group">
                        <summary className="flex cursor-pointer items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                          <ChevronDown className="h-3 w-3 transition-transform group-open:rotate-180" />
                          View sources
                        </summary>
                        <div className="mt-2 space-y-2">
                          {message.sources.map((source, idx) => (
                            <div key={idx} className="glass-card p-3 text-xs">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-medium">{source.document}</span>
                                <Badge variant="secondary">{Math.round(source.relevance * 100)}%</Badge>
                              </div>
                              <div className="text-muted-foreground mb-1">{source.section}</div>
                              <p className="text-muted-foreground line-clamp-3">{source.content}</p>
                            </div>
                          ))}
                        </div>
                      </details>
                    )}

                    {message.role === "assistant" && !message.content && isLoading && (
                      <div className="flex items-center gap-1 px-4 py-3 glass-card rounded-2xl">
                        <span className="typing-dot text-muted-foreground" />
                        <span className="typing-dot text-muted-foreground" />
                        <span className="typing-dot text-muted-foreground" />
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t bg-background/80 backdrop-blur-xl p-4">
          <div className="mx-auto max-w-3xl">
            <div className="relative flex items-end gap-2">
              <div className="relative flex-1">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    e.target.style.height = "auto";
                    e.target.style.height = Math.min(e.target.scrollHeight, 200) + "px";
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about HR policies..."
                  rows={1}
                  className="w-full resize-none rounded-xl border border-input bg-background px-4 py-3 pr-12 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring scrollbar-thin"
                  style={{ minHeight: "48px", maxHeight: "200px" }}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 bottom-2 h-8 w-8"
                  onClick={handleVoiceInput}
                >
                  <Mic className={cn("h-4 w-4", isListening && "text-red-500 animate-pulse")} />
                </Button>
              </div>
              <Button
                variant="gradient"
                size="icon"
                className="h-12 w-12 shrink-0"
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
              >
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
              </Button>
            </div>
            <p className="mt-2 text-center text-xs text-muted-foreground">
              Press Enter to send, Shift+Enter for new line. Answers are based on company HR documents.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

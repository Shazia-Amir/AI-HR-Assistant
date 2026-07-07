"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, MessageSquare, ChevronLeft, ChevronRight, Download } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { exportToCSV, getConfidenceBg, cn } from "@/lib/utils";
import { toast } from "sonner";

export default function ConversationsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const limit = 10;

  const { data: logs, isLoading } = useQuery({
    queryKey: ["logs", page, limit, search],
    queryFn: () => api.getLogs({ page, limit, search: search || undefined }),
    refetchInterval: 30000,
  });

  const allLogs = logs || [];
  const total = allLogs.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const handleExport = () => {
    if (allLogs.length === 0) {
      toast.error("No data to export");
      return;
    }
    const csvData = allLogs.map((log) => ({
      id: log.id,
      employee: log.employee_name,
      employee_id: log.employee_id,
      question: log.question,
      answer: log.answer,
      confidence: log.confidence,
      response_time_ms: log.response_time_ms,
      feedback: log.feedback || "",
      flagged: log.flagged,
      created_at: log.created_at,
    }));
    exportToCSV(csvData, `conversations-${Date.now()}.csv`);
    toast.success("Exported as CSV");
  };

  const selectedLog = allLogs.find((l) => l.id === selectedId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-10"
          />
        </div>
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-indigo-500" />
            All Conversations
          </CardTitle>
          <p className="text-sm text-muted-foreground">{total} total conversations</p>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : allLogs.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              No conversations found
            </div>
          ) : (
            <div className="space-y-2">
              {allLogs.map((log) => (
                <div
                  key={log.id}
                  className="cursor-pointer rounded-lg border p-4 transition-colors hover:bg-accent"
                  onClick={() => setSelectedId(log.id)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-xs font-bold text-white">
                          {log.employee_name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm font-medium">{log.employee_name}</span>
                        <span className="text-xs text-muted-foreground">· {log.employee_id}</span>
                      </div>
                      <p className="text-sm font-medium truncate">{log.question}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2">{log.answer}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <Badge className={getConfidenceBg(log.confidence)}>
                        {Math.round(log.confidence * 100)}%
                      </Badge>
                      {log.feedback && (
                        <Badge variant={log.feedback === "positive" ? "success" : "destructive"}>
                          {log.feedback === "positive" ? "👍" : "👎"}
                        </Badge>
                      )}
                      {log.flagged && <Badge variant="warning">Flagged</Badge>}
                      <span className="text-xs text-muted-foreground">
                        {new Date(log.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Prev
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Conversation Detail Dialog */}
      <Dialog open={!!selectedId} onOpenChange={() => setSelectedId(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Conversation Detail</DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div>
                <div className="text-xs font-medium text-muted-foreground mb-1">Employee</div>
                <div className="text-sm">
                  {selectedLog.employee_name} ({selectedLog.employee_id})
                </div>
              </div>
              <div>
                <div className="text-xs font-medium text-muted-foreground mb-1">Question</div>
                <div className="rounded-lg bg-muted/50 p-3 text-sm">{selectedLog.question}</div>
              </div>
              <div>
                <div className="text-xs font-medium text-muted-foreground mb-1">AI Answer</div>
                <div className="prose prose-sm dark:prose-invert max-w-none rounded-lg bg-muted/50 p-3">
                  <ReactMarkdown>{selectedLog.answer}</ReactMarkdown>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge className={getConfidenceBg(selectedLog.confidence)}>
                  {Math.round(selectedLog.confidence * 100)}% confident
                </Badge>
                <Badge variant="secondary">
                  Response: {selectedLog.response_time_ms}ms
                </Badge>
                {selectedLog.feedback && (
                  <Badge variant={selectedLog.feedback === "positive" ? "success" : "destructive"}>
                    {selectedLog.feedback === "positive" ? "Positive" : "Negative"} feedback
                  </Badge>
                )}
                {selectedLog.flagged && <Badge variant="warning">Flagged for review</Badge>}
              </div>
              <div className="text-xs text-muted-foreground">
                {new Date(selectedLog.created_at).toLocaleString()}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

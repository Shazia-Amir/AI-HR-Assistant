"use client";

import { useQuery } from "@tanstack/react-query";
import { Flag, ThumbsUp, ThumbsDown, MessageSquare } from "lucide-react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export default function FeedbackPage() {
  const { data: logs, isLoading } = useQuery({
    queryKey: ["logs", "feedback"],
    queryFn: () => api.getLogs({ limit: 50 }),
    refetchInterval: 30000,
  });

  const positiveFeedback = logs?.filter((l) => l.feedback === "positive") || [];
  const negativeFeedback = logs?.filter((l) => l.feedback === "negative") || [];
  const flagged = logs?.filter((l) => l.flagged) || [];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-emerald-500">{positiveFeedback.length}</div>
                <div className="text-xs text-muted-foreground mt-1">Positive Feedback</div>
              </div>
              <ThumbsUp className="h-8 w-8 text-emerald-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-red-500">{negativeFeedback.length}</div>
                <div className="text-xs text-muted-foreground mt-1">Negative Feedback</div>
              </div>
              <ThumbsDown className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-amber-500">{flagged.length}</div>
                <div className="text-xs text-muted-foreground mt-1">Flagged Conversations</div>
              </div>
              <Flag className="h-8 w-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="flagged">
        <TabsList>
          <TabsTrigger value="flagged">
            <Flag className="mr-2 h-4 w-4" />
            Flagged ({flagged.length})
          </TabsTrigger>
          <TabsTrigger value="negative">
            <ThumbsDown className="mr-2 h-4 w-4" />
            Negative ({negativeFeedback.length})
          </TabsTrigger>
          <TabsTrigger value="positive">
            <ThumbsUp className="mr-2 h-4 w-4" />
            Positive ({positiveFeedback.length})
          </TabsTrigger>
        </TabsList>

        {[
          { key: "flagged", data: flagged, emptyMsg: "No flagged conversations", icon: Flag },
          { key: "negative", data: negativeFeedback, emptyMsg: "No negative feedback", icon: ThumbsDown },
          { key: "positive", data: positiveFeedback, emptyMsg: "No positive feedback", icon: ThumbsUp },
        ].map((tab) => (
          <TabsContent key={tab.key} value={tab.key}>
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <tab.icon className="h-5 w-5 text-indigo-500" />
                  {tab.key === "flagged" ? "Flagged for Review" : tab.key === "negative" ? "Negative Feedback" : "Positive Feedback"}
                </CardTitle>
                <CardDescription>
                  {tab.key === "flagged"
                    ? "Conversations that need HR review"
                    : tab.key === "negative"
                    ? "Answers marked as incorrect by employees"
                    : "Answers marked as correct by employees"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-20 w-full" />
                    ))}
                  </div>
                ) : tab.data.length === 0 ? (
                  <div className="py-12 text-center text-sm text-muted-foreground">
                    {tab.emptyMsg}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {tab.data.map((log) => (
                      <div key={log.id} className="rounded-lg border p-4">
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
                            <Badge variant="secondary">
                              {Math.round(log.confidence * 100)}%
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(log.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

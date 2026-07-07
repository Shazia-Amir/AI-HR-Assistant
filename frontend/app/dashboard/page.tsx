"use client";

import { useQuery } from "@tanstack/react-query";
import {
  MessageSquare, Users, Clock, Target, ThumbsUp, ThumbsDown,
  TrendingUp, Activity, Brain, Zap
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend
} from "recharts";
import { motion } from "framer-motion";
import Link from "next/link";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatNumber, formatTime, formatNumber as fmtNum } from "@/lib/utils";

const COLORS = ["#6366f1", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#06b6d4", "#f43f5e", "#84cc16"];

export default function DashboardOverview() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["stats"],
    queryFn: api.getStats,
    refetchInterval: 30000,
  });

  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ["analytics"],
    queryFn: api.getAnalytics,
    refetchInterval: 60000,
  });

  const { data: logs } = useQuery({
    queryKey: ["logs", 5],
    queryFn: () => api.getLogs({ limit: 5 }),
    refetchInterval: 30000,
  });

  const statCards = [
    {
      title: "Total Questions",
      value: stats?.total_questions ?? 0,
      icon: MessageSquare,
      color: "from-indigo-500 to-blue-500",
      desc: "All time questions",
    },
    {
      title: "Active Employees",
      value: stats?.active_employees ?? 0,
      icon: Users,
      color: "from-purple-500 to-pink-500",
      desc: "Unique employees",
    },
    {
      title: "Avg Response Time",
      value: stats ? formatTime(stats.average_response_time_ms) : "0ms",
      icon: Clock,
      color: "from-amber-500 to-orange-500",
      desc: "AI response time",
    },
    {
      title: "Accuracy Rate",
      value: stats ? `${stats.accuracy_rate.toFixed(1)}%` : "0%",
      icon: Target,
      color: "from-emerald-500 to-teal-500",
      desc: "Based on feedback",
    },
    {
      title: "Positive Feedback",
      value: stats?.positive_feedback ?? 0,
      icon: ThumbsUp,
      color: "from-green-500 to-emerald-500",
      desc: "Correct answers",
    },
    {
      title: "Negative Feedback",
      value: stats?.negative_feedback ?? 0,
      icon: ThumbsDown,
      color: "from-red-500 to-rose-500",
      desc: "Incorrect answers",
    },
  ];

  const feedbackData = analytics
    ? [
        { name: "Positive", value: analytics.positive_vs_negative.positive, color: "#10b981" },
        { name: "Negative", value: analytics.positive_vs_negative.negative, color: "#f43f5e" },
        { name: "Neutral", value: analytics.positive_vs_negative.neutral, color: "#6b7280" },
      ]
    : [];

  const topicData = analytics?.most_asked_topics.slice(0, 6).map((t) => ({
    name: t.topic.length > 20 ? t.topic.slice(0, 20) + "..." : t.topic,
    count: t.count,
  })) || [];

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {statCards.map((card, idx) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
          >
            <Card className="glass-card overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${card.color}`}>
                    <card.icon className="h-5 w-5 text-white" />
                  </div>
                  {statsLoading ? (
                    <Skeleton className="h-6 w-12" />
                  ) : (
                    <span className="text-2xl font-bold">{formatNumber(card.value)}</span>
                  )}
                </div>
                <div className="text-sm font-medium">{card.title}</div>
                <div className="text-xs text-muted-foreground mt-1">{card.desc}</div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Questions Per Day */}
        <Card className="glass-card lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-indigo-500" />
              Questions Per Day
            </CardTitle>
            <CardDescription>Last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            {analyticsLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={analytics?.questions_per_day || []}>
                  <defs>
                    <linearGradient id="colorQuestions" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(v) => v.slice(5)}
                    className="text-xs"
                  />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="#6366f1"
                    strokeWidth={2}
                    fill="url(#colorQuestions)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Feedback Distribution */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-purple-500" />
              Feedback Distribution
            </CardTitle>
            <CardDescription>Positive vs Negative</CardDescription>
          </CardHeader>
          <CardContent>
            {analyticsLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={feedbackData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {feedbackData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Most Asked Topics */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-indigo-500" />
              Most Asked Topics
            </CardTitle>
            <CardDescription>By source document</CardDescription>
          </CardHeader>
          <CardContent>
            {analyticsLoading ? (
              <Skeleton className="h-[250px] w-full" />
            ) : topicData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={topicData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" className="text-xs" />
                  <YAxis dataKey="name" type="category" width={120} className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {topicData.map((_, idx) => (
                      <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[250px] items-center justify-center text-sm text-muted-foreground">
                No data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Employee Activity */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-500" />
              Employee Activity
            </CardTitle>
            <CardDescription>Top 10 most active employees</CardDescription>
          </CardHeader>
          <CardContent>
            {analyticsLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : analytics?.employee_activity.length ? (
              <div className="space-y-2 max-h-[250px] overflow-y-auto scrollbar-thin">
                {analytics.employee_activity.map((emp, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 rounded-lg border p-2"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-xs font-bold text-white">
                      {emp.employee_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{emp.employee_name}</div>
                      <div className="text-xs text-muted-foreground">{emp.employee_id}</div>
                    </div>
                    <Badge variant="secondary">{emp.question_count} Qs</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-[250px] items-center justify-center text-sm text-muted-foreground">
                No data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Conversations */}
      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-amber-500" />
                Recent Conversations
              </CardTitle>
              <CardDescription>Latest employee questions</CardDescription>
            </div>
            <Link href="/dashboard/conversations">
              <Button variant="outline" size="sm">View All</Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {!logs ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : logs.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No conversations yet
            </div>
          ) : (
            <div className="space-y-2">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-accent"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-xs font-bold text-white">
                    {log.employee_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{log.question}</div>
                    <div className="text-xs text-muted-foreground">
                      {log.employee_name} · {log.employee_id}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {log.feedback && (
                      <Badge variant={log.feedback === "positive" ? "success" : "destructive"}>
                        {log.feedback === "positive" ? "👍" : "👎"}
                      </Badge>
                    )}
                    {log.flagged && (
                      <Badge variant="warning">Flagged</Badge>
                    )}
                    <Badge variant="secondary">
                      {Math.round(log.confidence * 100)}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

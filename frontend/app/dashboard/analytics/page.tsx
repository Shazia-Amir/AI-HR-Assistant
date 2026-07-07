"use client";

import { useQuery } from "@tanstack/react-query";
import {
  BarChart3, TrendingUp, Clock, Target, Brain, MessageSquare
} from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  Cell
} from "recharts";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { formatTime } from "@/lib/utils";

const COLORS = ["#6366f1", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#06b6d4"];

export default function AnalyticsPage() {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ["analytics"],
    queryFn: api.getAnalytics,
    refetchInterval: 60000,
  });

  const { data: stats } = useQuery({
    queryKey: ["stats"],
    queryFn: api.getStats,
    refetchInterval: 30000,
  });

  const faqData = analytics?.frequently_asked.slice(0, 8).map((f) => ({
    name: f.question.length > 30 ? f.question.slice(0, 30) + "..." : f.question,
    full: f.question,
    count: f.count,
  })) || [];

  const radarData = analytics
    ? [
        { metric: "Accuracy", value: analytics.ai_accuracy },
        { metric: "Confidence", value: analytics.average_confidence * 100 },
        { metric: "Response", value: Math.max(0, 100 - analytics.average_response_time_ms / 10) },
        { metric: "Weekly", value: Math.min(100, analytics.weekly_questions * 5) },
        { metric: "Monthly", value: Math.min(100, analytics.monthly_questions) },
      ]
    : [];

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Weekly Questions", value: analytics?.weekly_questions ?? 0, icon: TrendingUp, color: "text-indigo-500" },
          { label: "Monthly Questions", value: analytics?.monthly_questions ?? 0, icon: BarChart3, color: "text-purple-500" },
          { label: "Avg Response Time", value: analytics ? formatTime(analytics.average_response_time_ms) : "0ms", icon: Clock, color: "text-amber-500" },
          { label: "AI Accuracy", value: analytics ? `${analytics.ai_accuracy.toFixed(1)}%` : "0%", icon: Target, color: "text-emerald-500" },
        ].map((stat) => (
          <Card key={stat.label} className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
                </div>
                <stat.icon className={`h-8 w-8 ${stat.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Questions Per Day */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-indigo-500" />
            Questions Per Day
          </CardTitle>
          <CardDescription>30-day trend</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-[300px] w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics?.questions_per_day || []}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" tickFormatter={(v) => v.slice(5)} className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip
                  contentStyle={{ backgroundColor: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                />
                <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Frequently Asked Questions */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-purple-500" />
              Frequently Asked Questions
            </CardTitle>
            <CardDescription>Top 8 most common questions</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : faqData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={faqData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" className="text-xs" />
                  <YAxis dataKey="name" type="category" width={150} className="text-xs" />
                  <Tooltip
                    contentStyle={{ backgroundColor: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                    formatter={(_value, _name, props) => [props.payload.full, "Question"]}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {faqData.map((_, idx) => (
                      <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">No data available</div>
            )}
          </CardContent>
        </Card>

        {/* AI Performance Radar */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-indigo-500" />
              AI Performance Overview
            </CardTitle>
            <CardDescription>Multi-dimensional metrics</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={radarData}>
                  <PolarGrid className="stroke-muted" />
                  <PolarAngleAxis dataKey="metric" className="text-xs" />
                  <PolarRadiusAxis className="text-xs" />
                  <Radar name="Score" dataKey="value" stroke="#6366f1" fill="#6366f1" fillOpacity={0.5} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Most Asked Topics */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-purple-500" />
            Most Asked Topics
          </CardTitle>
          <CardDescription>By source document references</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-[250px] w-full" />
          ) : analytics?.most_asked_topics.length ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={analytics.most_asked_topics}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="topic" className="text-xs" tickFormatter={(v) => v.length > 15 ? v.slice(0, 15) + "..." : v} />
                <YAxis className="text-xs" />
                <Tooltip
                  contentStyle={{ backgroundColor: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {analytics.most_asked_topics.map((_, idx) => (
                    <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[250px] items-center justify-center text-sm text-muted-foreground">No data available</div>
          )}
        </CardContent>
      </Card>

      {/* Employee Activity Table */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Employee Activity</CardTitle>
          <CardDescription>Top 10 most active employees</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : analytics?.employee_activity.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 pr-4 font-medium">#</th>
                    <th className="pb-2 pr-4 font-medium">Employee</th>
                    <th className="pb-2 pr-4 font-medium">Employee ID</th>
                    <th className="pb-2 pr-4 font-medium">Questions</th>
                    <th className="pb-2 font-medium">Last Active</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.employee_activity.map((emp, idx) => (
                    <tr key={idx} className="border-b last:border-0">
                      <td className="py-3 pr-4 text-muted-foreground">{idx + 1}</td>
                      <td className="py-3 pr-4 font-medium">{emp.employee_name}</td>
                      <td className="py-3 pr-4 text-muted-foreground">{emp.employee_id}</td>
                      <td className="py-3 pr-4">
                        <Badge variant="secondary">{emp.question_count}</Badge>
                      </td>
                      <td className="py-3 text-muted-foreground text-xs">
                        {emp.last_active ? new Date(emp.last_active).toLocaleDateString() : "N/A"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-8 text-center text-sm text-muted-foreground">No data available</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

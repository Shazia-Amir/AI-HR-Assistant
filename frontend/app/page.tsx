import Link from "next/link";
import { MessageSquare, BarChart3, Shield, Zap, Brain, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      <nav className="sticky top-0 z-50 glass border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600">
              <Brain className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold">HR Assistant</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/login">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link href="/signup">
              <Button variant="gradient" size="sm">Create Account</Button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-20">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-muted/50 px-4 py-1.5 text-sm text-muted-foreground">
            <Zap className="h-4 w-4 text-indigo-500" />
            AI-Powered HR Knowledge Base
          </div>
          <h1 className="mb-6 text-5xl font-bold tracking-tight md:text-6xl">
            Your <span className="gradient-text">AI HR Assistant</span>
            <br />
            for instant answers
          </h1>
          <p className="mb-8 text-lg text-muted-foreground md:text-xl">
            Ask questions about company policies, leave, office hours, and more.
            Get accurate answers powered by RAG technology — no more digging through handbooks.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/login">
              <Button variant="gradient" size="lg" className="w-full sm:w-auto">
                <MessageSquare className="mr-2 h-5 w-5" />
                Start Chatting
              </Button>
            </Link>
            <Link href="/signup">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                <BarChart3 className="mr-2 h-5 w-5" />
                Create Account
              </Button>
            </Link>
          </div>
        </div>

        <div className="mx-auto mt-24 grid max-w-5xl gap-6 md:grid-cols-3">
          {[
            { icon: Brain, title: "RAG-Powered", desc: "Answers grounded in your company's HR documents using retrieval-augmented generation." },
            { icon: BarChart3, title: "Analytics Dashboard", desc: "Monitor conversations, employee activity, AI accuracy, and feedback in real-time." },
            { icon: Shield, title: "Secure & Private", desc: "Supabase authentication, row-level security, and role-based access control." },
            { icon: Zap, title: "Streaming Responses", desc: "Get instant streaming answers with confidence scores and source references." },
            { icon: FileText, title: "Source References", desc: "Every answer includes the source document and section for full transparency." },
            { icon: MessageSquare, title: "ChatGPT-Style UI", desc: "Beautiful, responsive chat interface with dark mode, history, and export." },
          ].map((feature) => (
            <div
              key={feature.title}
              className="glass-card p-6 transition-all hover:shadow-lg hover:-translate-y-1"
            >
              <feature.icon className="mb-4 h-8 w-8 text-indigo-500" />
              <h3 className="mb-2 font-semibold">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.desc}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          AI HR Assistant — Production-ready RAG SaaS platform
        </div>
      </footer>
    </div>
  );
}

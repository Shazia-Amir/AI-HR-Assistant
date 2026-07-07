"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FileText, RefreshCw, Upload, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export default function DocumentsPage() {
  const queryClient = useQueryClient();

  const { data: documents, isLoading } = useQuery({
    queryKey: ["documents"],
    queryFn: api.getDocuments,
    refetchInterval: 60000,
  });

  const rebuildMutation = useMutation({
    mutationFn: api.rebuildVectorStore,
    onSuccess: () => {
      toast.success("Vector store rebuilt successfully");
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
    onError: () => {
      toast.error("Failed to rebuild vector store");
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">HR Documents</h2>
          <p className="text-sm text-muted-foreground">Manage knowledge base documents for the RAG pipeline</p>
        </div>
        <Button
          variant="gradient"
          onClick={() => rebuildMutation.mutate()}
          disabled={rebuildMutation.isPending}
        >
          {rebuildMutation.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          Rebuild Vector Store
        </Button>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-indigo-500" />
            Knowledge Base Documents
          </CardTitle>
          <CardDescription>Documents used for retrieval-augmented generation</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : !documents || documents.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              No documents found. Add HR policy documents to the documents directory.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {documents.map((doc) => (
                <Card key={doc.id} className="border">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600">
                        <FileText className="h-5 w-5 text-white" />
                      </div>
                      <Badge variant={doc.status === "active" ? "success" : "secondary"}>
                        {doc.status}
                      </Badge>
                    </div>
                    <h3 className="font-medium text-sm mb-1 truncate">{doc.title}</h3>
                    <p className="text-xs text-muted-foreground mb-2">
                      {doc.content_type} · {doc.chunk_count} chunks
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-2">{doc.description}</p>
                    <div className="mt-3 text-xs text-muted-foreground">
                      Updated: {new Date(doc.updated_at).toLocaleDateString()}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

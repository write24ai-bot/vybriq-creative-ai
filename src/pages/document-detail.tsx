import { useState, useRef, useEffect } from "react";
import { Link, useParams, useLocation } from "wouter";
import { useGetDocument, useUpdateDocument, useDeleteDocument } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Save, Trash2, Calendar, Edit3, Loader2, Download } from "lucide-react";
import { format } from "date-fns";
import { getGetDocumentQueryKey } from "@workspace/api-client-react";
import ReactMarkdown from "react-markdown";

export default function DocumentDetail() {
  const { id } = useParams();
  const docId = parseInt(id || "0", 10);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: document, isLoading } = useGetDocument(docId, {
    query: { enabled: !!docId, queryKey: getGetDocumentQueryKey(docId) }
  });

  const updateDocument = useUpdateDocument();
  const deleteDocument = useDeleteDocument();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  const initializedRef = useRef<number | null>(null);

  useEffect(() => {
    if (document && initializedRef.current !== document.id) {
      initializedRef.current = document.id;
      setTitle(document.title);
      setContent(document.content);
    }
  }, [document]);

  const handleSave = () => {
    if (!title.trim() || !content.trim()) return;

    updateDocument.mutate(
      { id: docId, data: { title, content } },
      {
        onSuccess: (updatedDoc) => {
          setIsEditing(false);
          toast({ title: "Saved", description: "Document updated successfully." });
          queryClient.setQueryData(getGetDocumentQueryKey(docId), updatedDoc);
        },
        onError: () => {
          toast({ title: "Error", description: "Failed to update document.", variant: "destructive" });
        }
      }
    );
  };

  const handleDelete = () => {
    if (!confirm("Are you sure you want to delete this document?")) return;

    deleteDocument.mutate(
      { id: docId },
      {
        onSuccess: () => {
          toast({ title: "Deleted", description: "Document removed." });
          setLocation("/documents");
        },
        onError: () => {
          toast({ title: "Error", description: "Failed to delete document.", variant: "destructive" });
        }
      }
    );
  };

  const handleExportPdf = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="border-b border-border/40 h-16" />
        <main className="flex-1 container mx-auto px-6 py-8">
          <div className="h-8 w-64 bg-card rounded animate-pulse mb-8" />
          <div className="h-96 w-full bg-card rounded-2xl animate-pulse" />
        </main>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <h2 className="text-xl font-medium mb-4">Document not found</h2>
        <Link href="/documents"><Button>Return to Library</Button></Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="no-print border-b border-border/40 bg-card/50 backdrop-blur-md sticky top-0 z-10">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/documents">
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-card">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="h-4 w-[1px] bg-border mx-2" />
            <span className="text-xs font-medium px-2 py-1 rounded bg-primary/10 text-primary capitalize border border-primary/20">
              {document.type}
            </span>
            <span className="text-sm text-muted-foreground flex items-center gap-1 hidden md:flex">
              <Calendar className="w-3 h-3" /> {format(new Date(document.updatedAt), "MMM d, yyyy")}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <Button variant="ghost" onClick={() => {
                  setIsEditing(false);
                  setTitle(document.title);
                  setContent(document.content);
                }}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={updateDocument.isPending} className="bg-primary hover:bg-primary/90 text-white">
                  {updateDocument.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  Save Changes
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportPdf}
                  className="border-border/40 gap-1.5"
                >
                  <Download className="w-4 h-4" /> Export PDF
                </Button>
                <Button variant="outline" onClick={() => setIsEditing(true)} className="border-border/40">
                  <Edit3 className="w-4 h-4 mr-2" /> Edit
                </Button>
                <Button variant="ghost" size="icon" onClick={handleDelete} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-6 py-8 max-w-4xl">
        <div className="bg-card border border-border/40 rounded-2xl p-8 min-h-[70vh] shadow-sm">
          {isEditing ? (
            <div className="flex flex-col gap-6 h-full no-print">
              <Input
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="text-3xl font-bold border-none bg-transparent px-0 h-auto focus-visible:ring-0 placeholder:text-muted-foreground/50"
                placeholder="Document Title"
              />
              <div className="h-[1px] w-full bg-border/40" />
              <Textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                className="flex-1 text-base leading-relaxed border-none bg-transparent px-0 focus-visible:ring-0 resize-none min-h-[500px]"
                placeholder="Write your content here..."
              />
            </div>
          ) : (
            <div className="print-area flex flex-col h-full">
              <h1 className="text-3xl font-bold mb-6">{document.title}</h1>
              <div className="h-[1px] w-full bg-border/40 mb-6" />
              <div className="prose prose-invert prose-base max-w-none
                prose-headings:text-foreground prose-headings:font-semibold
                prose-p:text-foreground/90 prose-p:leading-relaxed
                prose-strong:text-foreground prose-strong:font-semibold
                prose-ul:text-foreground/90 prose-ol:text-foreground/90
                prose-li:marker:text-primary
                prose-code:text-primary prose-code:bg-primary/10 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:before:content-none prose-code:after:content-none
                prose-pre:bg-background prose-pre:border prose-pre:border-border/40
                prose-blockquote:border-l-primary prose-blockquote:text-muted-foreground
                prose-hr:border-border/40
                prose-a:text-primary prose-a:no-underline hover:prose-a:underline">
                <ReactMarkdown>{document.content}</ReactMarkdown>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

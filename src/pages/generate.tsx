import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useParams } from "wouter";
import { useCreateDocument, useListDocuments, getListDocumentsQueryKey } from "@workspace/api-client-react";
import type { Document, ListDocumentsType } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Sparkles, Save, Loader2, Play, History, ChevronDown, ChevronUp, FileText, Clock, Code, Eye, Copy, Check, RefreshCw, Download } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import type { DocumentInput } from "@workspace/api-client-react";

const WRITING_STYLES = [
  { value: "professional", label: "Professional" },
  { value: "casual", label: "Casual & Friendly" },
  { value: "academic", label: "Academic / Formal" },
  { value: "creative", label: "Creative" },
  { value: "concise", label: "Concise & Clear" },
  { value: "persuasive", label: "Persuasive" },
];

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function Generate() {
  const { type } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [prompt, setPrompt] = useState("");
  const [subject, setSubject] = useState("");
  const [tone, setTone] = useState("");
  const [platform, setPlatform] = useState("");
  const [assignmentType, setAssignmentType] = useState("");
  const [slides, setSlides] = useState("5");
  const [writingStyle, setWritingStyle] = useState("");

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState("");
  const [title, setTitle] = useState("");
  const [historyOpen, setHistoryOpen] = useState(false);
  const [activeDocId, setActiveDocId] = useState<number | null>(null);
  const [rawMode, setRawMode] = useState(false);
  const [copied, setCopied] = useState(false);

  const contentEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const createDocument = useCreateDocument();

  const validType = (type ?? "note") as ListDocumentsType;
  const { data: historyDocs } = useListDocuments(
    { type: validType },
    { query: { queryKey: getListDocumentsQueryKey({ type: validType }), enabled: historyOpen } }
  );

  useEffect(() => {
    if (isGenerating && contentEndRef.current) {
      contentEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [generatedContent, isGenerating]);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
      if (e.key === "Enter") {
        e.preventDefault();
        if (!isGenerating && prompt.trim()) runGenerate();
      } else if (e.key === "s") {
        e.preventDefault();
        if (generatedContent && title && !createDocument.isPending && !isGenerating) handleSave();
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isGenerating, prompt, generatedContent, title, createDocument.isPending]);

  const loadDocument = (doc: Document) => {
    setTitle(doc.title);
    setGeneratedContent(doc.content);
    if (doc.prompt) setPrompt(doc.prompt);
    setActiveDocId(doc.id);
    setHistoryOpen(false);
    contentEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const runGenerate = async () => {
    if (!prompt.trim()) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setIsGenerating(true);
    setGeneratedContent("");
    setActiveDocId(null);

    const requestBody: Record<string, string> = { type: type ?? "note", prompt };

    if (type === "note") {
      requestBody.subject = subject;
      if (writingStyle) requestBody.tone = writingStyle;
    } else if (type === "caption") {
      requestBody.subject = platform;
      requestBody.tone = tone;
    } else if (type === "assignment") {
      requestBody.subject = subject;
      const parts = [assignmentType, writingStyle].filter(Boolean).join(", ");
      if (parts) requestBody.tone = parts;
    } else if (type === "presentation") {
      requestBody.subject = subject;
      const parts = [slides ? `${slides} slides` : "", writingStyle].filter(Boolean).join(", ");
      if (parts) requestBody.tone = parts;
    }

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) throw new Error("Generation failed");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error("No reader available");

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split("\n")) {
          if (line.startsWith("data: ")) {
            const dataStr = line.slice(6);
            if (dataStr.trim() === "[DONE]") continue;
            try {
              const data = JSON.parse(dataStr);
              if (data.content) setGeneratedContent((prev) => prev + data.content);
            } catch {
              // ignore parse errors for incomplete chunks
            }
          }
        }
      }

      if (!title) setTitle(prompt.substring(0, 40) + "...");
    } catch (error: unknown) {
      if (error instanceof Error && error.name !== "AbortError") {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      }
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  };

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    runGenerate();
  };

  const handleExportPdf = () => {
    if (!generatedContent) return;
    if (rawMode) setRawMode(false);
    setTimeout(() => window.print(), 50);
  };

  const handleCopy = async () => {
    if (!generatedContent) return;
    await navigator.clipboard.writeText(generatedContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    if (!generatedContent || !title) return;

    createDocument.mutate(
      { data: { title, content: generatedContent, type: type as DocumentInput["type"], prompt } },
      {
        onSuccess: (doc) => {
          toast({ title: "Saved to Library", description: "Your document has been saved." });
          setLocation(`/documents/${doc.id}`);
        },
        onError: () => {
          toast({ title: "Save Failed", description: "Could not save the document.", variant: "destructive" });
        },
      }
    );
  };

  const showStylePicker = type !== "caption";

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="border-b border-border/40 bg-card/50 backdrop-blur-md sticky top-0 z-10">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="h-4 w-[1px] bg-border mx-2" />
            <span className="font-medium flex items-center gap-2 capitalize">
              <Sparkles className="w-4 h-4 text-primary" /> {type} Generator
            </span>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-6 py-8 flex flex-col lg:flex-row gap-8">

        {/* Left Col: Input Form + History */}
        <div className="no-print w-full lg:w-1/3 flex flex-col gap-4">
          <form onSubmit={handleGenerate} className="flex flex-col gap-6 bg-card border border-border/40 p-6 rounded-2xl">

            {type === "note" && (
              <div className="space-y-2">
                <Label htmlFor="subject">Subject / Topic</Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Biology 101, History of Rome"
                  className="bg-background"
                />
              </div>
            )}

            {type === "caption" && (
              <>
                <div className="space-y-2">
                  <Label>Platform</Label>
                  <Select value={platform} onValueChange={setPlatform}>
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Select platform" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="instagram">Instagram</SelectItem>
                      <SelectItem value="tiktok">TikTok</SelectItem>
                      <SelectItem value="linkedin">LinkedIn</SelectItem>
                      <SelectItem value="twitter">Twitter / X</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Tone</Label>
                  <Select value={tone} onValueChange={setTone}>
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Select tone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="casual">Casual & Friendly</SelectItem>
                      <SelectItem value="humorous">Humorous</SelectItem>
                      <SelectItem value="inspirational">Inspirational</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {type === "assignment" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g. English Literature"
                    className="bg-background"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Assignment Type</Label>
                  <Select value={assignmentType} onValueChange={setAssignmentType}>
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="essay">Essay</SelectItem>
                      <SelectItem value="report">Report</SelectItem>
                      <SelectItem value="outline">Outline</SelectItem>
                      <SelectItem value="summary">Summary</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {type === "presentation" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="subject">Topic</Label>
                  <Input
                    id="subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g. Q3 Marketing Plan"
                    className="bg-background"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slides">Number of Slides</Label>
                  <Input
                    id="slides"
                    type="number"
                    min="1"
                    max="20"
                    value={slides}
                    onChange={(e) => setSlides(e.target.value)}
                    className="bg-background"
                  />
                </div>
              </>
            )}

            {showStylePicker && (
              <div className="space-y-2">
                <Label>Writing Style</Label>
                <Select value={writingStyle} onValueChange={setWritingStyle}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Select a style (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {WRITING_STYLES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="prompt">Prompt / Details</Label>
                {prompt.length > 800 && (
                  <span className={`text-xs tabular-nums ${prompt.length >= 1000 ? "text-destructive font-medium" : prompt.length >= 950 ? "text-orange-400" : "text-muted-foreground"}`}>
                    {1000 - prompt.length} left
                  </span>
                )}
              </div>
              <Textarea
                id="prompt"
                value={prompt}
                onChange={(e) => {
                  if (e.target.value.length <= 1000) setPrompt(e.target.value);
                }}
                placeholder="What specifically do you want to write about?"
                className={`min-h-[120px] bg-background resize-none transition-colors ${prompt.length >= 1000 ? "border-destructive focus-visible:ring-destructive" : prompt.length >= 950 ? "border-orange-400/60" : ""}`}
                required
              />
            </div>

            <Button type="submit" disabled={isGenerating || !prompt.trim()} className="w-full">
              {isGenerating ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...</>
              ) : (
                <><Play className="w-4 h-4 mr-2" /> Generate {type}</>
              )}
            </Button>
          </form>

          {/* History Panel */}
          <div className="bg-card border border-border/40 rounded-2xl overflow-hidden">
            <button
              type="button"
              onClick={() => setHistoryOpen((o) => !o)}
              className="w-full flex items-center justify-between px-5 py-4 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <span className="flex items-center gap-2">
                <History className="w-4 h-4" />
                Recent {type} documents
              </span>
              {historyOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            <AnimatePresence initial={false}>
              {historyOpen && (
                <motion.div
                  key="history"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <div className="border-t border-border/40 divide-y divide-border/30 max-h-72 overflow-y-auto">
                    {!historyDocs ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                      </div>
                    ) : historyDocs.length === 0 ? (
                      <div className="py-8 text-center text-sm text-muted-foreground">
                        No {type} documents yet
                      </div>
                    ) : (
                      historyDocs.map((doc) => (
                        <button
                          key={doc.id}
                          type="button"
                          onClick={() => loadDocument(doc)}
                          className={`w-full text-left px-5 py-3 hover:bg-primary/5 transition-colors group ${
                            activeDocId === doc.id ? "bg-primary/10" : ""
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <FileText className="w-4 h-4 mt-0.5 shrink-0 text-muted-foreground group-hover:text-primary transition-colors" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate text-foreground">
                                {doc.title}
                              </p>
                              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                <Clock className="w-3 h-3" />
                                {timeAgo(doc.updatedAt)}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right Col: Output */}
        <div className="w-full lg:w-2/3 flex flex-col gap-4">
          {generatedContent || isGenerating ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col h-[calc(100vh-10rem)] border border-border/40 rounded-2xl bg-card overflow-hidden"
            >
              <div className="p-4 border-b border-border/40 bg-card/50 flex justify-between items-center gap-3">
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Document Title"
                  className="max-w-xs bg-transparent border-transparent hover:border-border/50 focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-border h-8 font-medium"
                />

                {generatedContent && !isGenerating && (() => {
                  const words = generatedContent.trim().split(/\s+/).filter(Boolean).length;
                  const mins = Math.max(1, Math.round(words / 200));
                  return (
                    <span className="text-xs text-muted-foreground hidden md:inline">
                      {words.toLocaleString()} words · {mins} min read
                    </span>
                  );
                })()}

                <div className="flex items-center gap-2 ml-auto shrink-0">
                  {activeDocId && (
                    <span className="text-xs text-muted-foreground hidden sm:inline">From history</span>
                  )}

                  {/* Export PDF button */}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleExportPdf}
                    disabled={!generatedContent || isGenerating}
                    className="h-7 px-2.5 text-xs border-border/40 gap-1"
                  >
                    <Download className="w-3 h-3" /> Export PDF
                  </Button>

                  {/* Regenerate button */}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => runGenerate()}
                    disabled={isGenerating || !prompt.trim()}
                    className="h-7 px-2.5 text-xs border-border/40 gap-1"
                  >
                    <RefreshCw className={`w-3 h-3 ${isGenerating ? "animate-spin" : ""}`} />
                    Regenerate
                  </Button>

                  {/* Copy button */}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCopy}
                    disabled={!generatedContent || isGenerating}
                    className="h-7 px-2.5 text-xs border-border/40 gap-1"
                  >
                    {copied ? (
                      <><Check className="w-3 h-3 text-green-400" /> Copied</>
                    ) : (
                      <><Copy className="w-3 h-3" /> Copy</>
                    )}
                  </Button>

                  {/* Raw / Preview toggle */}
                  <div className="flex items-center rounded-lg border border-border/40 bg-background overflow-hidden text-xs">
                    <button
                      type="button"
                      onClick={() => setRawMode(false)}
                      className={`flex items-center gap-1 px-2.5 py-1.5 transition-colors ${!rawMode ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"}`}
                    >
                      <Eye className="w-3 h-3" /> Preview
                    </button>
                    <button
                      type="button"
                      onClick={() => setRawMode(true)}
                      className={`flex items-center gap-1 px-2.5 py-1.5 transition-colors ${rawMode ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"}`}
                    >
                      <Code className="w-3 h-3" /> Raw
                    </button>
                  </div>

                  <Button
                    onClick={handleSave}
                    disabled={!generatedContent || createDocument.isPending || isGenerating}
                    size="sm"
                    className="bg-primary hover:bg-primary/90 text-white"
                  >
                    {createDocument.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Save
                  </Button>
                </div>
              </div>

              <div className="flex-1 p-6 overflow-y-auto">
                {rawMode ? (
                  <pre className="font-mono text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap break-words">
                    {generatedContent}
                    {isGenerating && <span className="inline-block w-2 h-4 ml-1 bg-primary animate-pulse align-middle" />}
                  </pre>
                ) : (
                  <div className="print-area prose prose-invert prose-sm max-w-none
                    prose-headings:text-foreground prose-headings:font-semibold
                    prose-p:text-foreground/90 prose-p:leading-relaxed
                    prose-strong:text-foreground prose-strong:font-semibold
                    prose-ul:text-foreground/90 prose-ol:text-foreground/90
                    prose-li:marker:text-primary
                    prose-code:text-primary prose-code:bg-primary/10 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-code:before:content-none prose-code:after:content-none
                    prose-pre:bg-card prose-pre:border prose-pre:border-border/40
                    prose-blockquote:border-l-primary prose-blockquote:text-muted-foreground
                    prose-hr:border-border/40
                    prose-a:text-primary prose-a:no-underline hover:prose-a:underline">
                    <ReactMarkdown>{generatedContent}</ReactMarkdown>
                    {isGenerating && <span className="inline-block w-2 h-4 ml-1 bg-primary animate-pulse align-middle" />}
                  </div>
                )}
                <div ref={contentEndRef} />
              </div>
            </motion.div>
          ) : (
            <div className="h-full min-h-[400px] border border-dashed border-border/40 rounded-2xl flex flex-col items-center justify-center text-center p-8 bg-card/10">
              <Sparkles className="w-12 h-12 text-muted-foreground/30 mb-4" />
              <h3 className="text-xl font-medium mb-2 text-muted-foreground">Ready to write</h3>
              <p className="text-muted-foreground/70 max-w-sm">
                Fill out the details on the left and hit generate to watch your {type} come to life.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

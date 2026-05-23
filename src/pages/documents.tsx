import { useState } from "react";
import { Link } from "wouter";
import { useListDocuments } from "@workspace/api-client-react";
import { useAuth } from "@workspace/replit-auth-web";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, FileText, Calendar, LogOut } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import type { ListDocumentsParams } from "@workspace/api-client-react";

export default function Documents() {
  const [activeTab, setActiveTab] = useState<"all" | "note" | "caption" | "assignment" | "presentation">("all");
  const [search, setSearch] = useState("");
  const { user, logout } = useAuth();

  const { data: documents = [], isLoading } = useListDocuments(
    activeTab !== "all" ? { type: activeTab } : undefined,
    { query: { queryKey: ["documents", activeTab] } }
  );

  const filteredDocs = documents.filter(doc => 
    doc.title.toLowerCase().includes(search.toLowerCase()) ||
    doc.content.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/40 bg-card/50 backdrop-blur-md sticky top-0 z-10">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="font-bold text-lg tracking-tight text-white hover:opacity-80 transition-opacity">⚡ Vybriq</Link>
            <nav className="hidden md:flex gap-6">
              <Link href="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Dashboard</Link>
              <Link href="/documents" className="text-sm font-medium text-primary">Library</Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            {user?.profileImageUrl && (
              <img src={user.profileImageUrl} alt="avatar" className="w-7 h-7 rounded-full object-cover ring-1 ring-border" />
            )}
            <span className="text-sm text-muted-foreground hidden sm:block">{user?.firstName || user?.email}</span>
            <Button variant="ghost" size="icon" onClick={logout} className="h-8 w-8 text-muted-foreground hover:text-foreground">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">Library</h1>
            <p className="text-muted-foreground">All your generated content in one place.</p>
          </div>
          
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              value={search} 
              onChange={e => setSearch(e.target.value)}
              placeholder="Search documents..." 
              className="pl-9 bg-card border-border/40"
            />
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="mb-8">
          <TabsList className="bg-card/50 border border-border/40">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="note">Notes</TabsTrigger>
            <TabsTrigger value="caption">Captions</TabsTrigger>
            <TabsTrigger value="assignment">Assignments</TabsTrigger>
            <TabsTrigger value="presentation">Presentations</TabsTrigger>
          </TabsList>
        </Tabs>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-40 bg-card rounded-xl animate-pulse" />)}
          </div>
        ) : filteredDocs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredDocs.map((doc, i) => (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
              >
                <Link href={`/documents/${doc.id}`}>
                  <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full bg-card/40 hover:bg-card/60">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium px-2 py-1 rounded bg-primary/10 text-primary capitalize border border-primary/20">
                          {doc.type}
                        </span>
                      </div>
                      <CardTitle className="text-base line-clamp-1 group-hover:text-primary transition-colors">
                        {doc.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                        {doc.content.replace(/<[^>]*>?/gm, '') || "No content"}
                      </p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground/70">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(doc.createdAt), "MMM d, yyyy")}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-border/40 rounded-2xl bg-card/10">
            <FileText className="w-12 h-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-1">No documents found</h3>
            <p className="text-muted-foreground mb-6">
              {search ? "Try adjusting your search terms." : "You haven't generated any content of this type yet."}
            </p>
            {!search && (
              <Link href="/dashboard">
                <Button variant="outline">Go to Dashboard</Button>
              </Link>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

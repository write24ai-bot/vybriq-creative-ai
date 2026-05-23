import { Link } from "wouter";
import { useGetDashboardStats } from "@workspace/api-client-react";
import { useAuth } from "@workspace/replit-auth-web";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Image, PenTool, Presentation, Plus, ArrowRight, LogOut } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";

const generateCards = [
  {
    type: "note",
    title: "Smart Notes",
    description: "Transform scattered thoughts into structured notes.",
    icon: <FileText className="w-6 h-6" />,
    color: "bg-blue-500/10 text-blue-500 border-blue-500/20"
  },
  {
    type: "caption",
    title: "Captions",
    description: "Hook your audience with social captions.",
    icon: <Image className="w-6 h-6" />,
    color: "bg-pink-500/10 text-pink-500 border-pink-500/20"
  },
  {
    type: "assignment",
    title: "Assignments",
    description: "Draft essays, reports, and outlines.",
    icon: <PenTool className="w-6 h-6" />,
    color: "bg-purple-500/10 text-purple-500 border-purple-500/20"
  },
  {
    type: "presentation",
    title: "Presentations",
    description: "Structure compelling talks and slide decks.",
    icon: <Presentation className="w-6 h-6" />,
    color: "bg-orange-500/10 text-orange-500 border-orange-500/20"
  }
];

export default function Dashboard() {
  const { data: stats, isLoading } = useGetDashboardStats({ query: { queryKey: ["dashboard-stats"] } });
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      <header className="border-b border-border/40 bg-card/50 backdrop-blur-md sticky top-0 z-10">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="font-bold text-lg tracking-tight text-white hover:opacity-80 transition-opacity">⚡ Vybriq</Link>
            <nav className="hidden md:flex gap-6">
              <Link href="/dashboard" className="text-sm font-medium text-primary">Dashboard</Link>
              <Link href="/documents" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Library</Link>
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
        <div className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Welcome back{user?.firstName ? `, ${user.firstName}` : ""}</h1>
          <p className="text-muted-foreground">What are we creating today?</p>
        </div>

        <section className="mb-12">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5 text-primary" /> Create New
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {generateCards.map((card, i) => (
              <motion.div
                key={card.type}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
              >
                <Link href={`/generate/${card.type}`}>
                  <Card className="h-full hover:border-primary/50 transition-colors cursor-pointer group">
                    <CardHeader>
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-2 transition-transform group-hover:scale-110 ${card.color}`}>
                        {card.icon}
                      </div>
                      <CardTitle className="text-lg">{card.title}</CardTitle>
                      <CardDescription>{card.description}</CardDescription>
                    </CardHeader>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>

        {isLoading ? (
          <div className="space-y-4">
            <div className="h-8 w-48 bg-card rounded animate-pulse" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-card rounded-xl animate-pulse" />)}
            </div>
          </div>
        ) : stats ? (
          <>
            <section className="mb-12">
              <h2 className="text-lg font-semibold mb-4">Overview</h2>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <Card className="bg-card/50">
                  <CardHeader className="py-4">
                    <CardTitle className="text-muted-foreground text-sm font-medium">Total Docs</CardTitle>
                    <p className="text-3xl font-bold">{stats.totalDocuments}</p>
                  </CardHeader>
                </Card>
                <Card className="bg-card/50">
                  <CardHeader className="py-4">
                    <CardTitle className="text-muted-foreground text-sm font-medium">Notes</CardTitle>
                    <p className="text-3xl font-bold">{stats.byType?.note || 0}</p>
                  </CardHeader>
                </Card>
                <Card className="bg-card/50">
                  <CardHeader className="py-4">
                    <CardTitle className="text-muted-foreground text-sm font-medium">Captions</CardTitle>
                    <p className="text-3xl font-bold">{stats.byType?.caption || 0}</p>
                  </CardHeader>
                </Card>
                <Card className="bg-card/50">
                  <CardHeader className="py-4">
                    <CardTitle className="text-muted-foreground text-sm font-medium">Assignments</CardTitle>
                    <p className="text-3xl font-bold">{stats.byType?.assignment || 0}</p>
                  </CardHeader>
                </Card>
                <Card className="bg-card/50">
                  <CardHeader className="py-4">
                    <CardTitle className="text-muted-foreground text-sm font-medium">Presentations</CardTitle>
                    <p className="text-3xl font-bold">{stats.byType?.presentation || 0}</p>
                  </CardHeader>
                </Card>
              </div>
            </section>

            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Recent Documents</h2>
                <Link href="/documents" className="text-sm text-primary hover:underline flex items-center gap-1">
                  View All <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              
              {stats.recentDocuments?.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {stats.recentDocuments.map(doc => (
                    <Link href={`/documents/${doc.id}`} key={doc.id}>
                      <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full bg-card/40">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium px-2 py-1 rounded bg-secondary text-secondary-foreground capitalize">
                              {doc.type}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(doc.createdAt), "MMM d, yyyy")}
                            </span>
                          </div>
                          <CardTitle className="text-base line-clamp-1">{doc.title}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {doc.content.replace(/<[^>]*>?/gm, '').substring(0, 100) || "No content"}
                          </p>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              ) : (
                <Card className="bg-card/20 border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <FileText className="w-12 h-12 text-muted-foreground/50 mb-4" />
                    <h3 className="text-lg font-medium mb-1">No documents yet</h3>
                    <p className="text-muted-foreground mb-4">Start creating using the tools above.</p>
                  </CardContent>
                </Card>
              )}
            </section>
          </>
        ) : null}
      </main>
    </div>
  );
}

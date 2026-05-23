import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { PenTool, Image, FileText, Presentation } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30 flex flex-col">
      <header className="container mx-auto px-6 py-6 flex justify-between items-center border-b border-border/10">
        <div className="font-bold text-xl tracking-tight text-white">
          ⚡ Vybriq
        </div>
        <nav className="flex gap-4 items-center">
          <Link href="/dashboard" className="text-sm font-medium hover:text-primary transition-colors">
            Workspace
          </Link>
          <Link href="/dashboard">
            <Button className="rounded-full px-6">Get Started</Button>
          </Link>
        </nav>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center container mx-auto px-6 py-24 text-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-3xl"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8 border border-primary/20">
            ⚡ The AI companion for creators
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-tight">
            Write with <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400">clarity.</span> <br />
            Create with <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400">intent.</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto font-light">
            Vybriq is a sleek, focused AI writing studio. Whether it's a late-night essay, a sharp caption, or class notes that actually make sense.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/dashboard">
              <Button size="lg" className="rounded-full px-8 text-base h-14 bg-primary hover:bg-primary/90 text-white shadow-[0_0_40px_-10px_rgba(123,62,255,0.5)] transition-all">
                Open Studio
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button size="lg" variant="outline" className="rounded-full px-8 text-base h-14 border-border/50 hover:bg-white/5">
                View Examples
              </Button>
            </Link>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 40 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-32 w-full max-w-5xl text-left"
        >
          <FeatureCard 
            icon={<FileText className="w-6 h-6 text-primary" />} 
            title="Smart Notes" 
            desc="Transform scattered thoughts into structured, brilliant notes." 
          />
          <FeatureCard 
            icon={<Image className="w-6 h-6 text-primary" />} 
            title="Captions" 
            desc="Hook your audience with tone-perfect social captions." 
          />
          <FeatureCard 
            icon={<PenTool className="w-6 h-6 text-primary" />} 
            title="Assignments" 
            desc="Draft essays, reports, and outlines that hit the mark." 
          />
          <FeatureCard 
            icon={<Presentation className="w-6 h-6 text-primary" />} 
            title="Presentations" 
            desc="Structure compelling talks and slide decks instantly." 
          />
        </motion.div>
      </main>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="p-6 rounded-2xl bg-card border border-border/40 hover:border-primary/50 transition-colors group">
      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="font-semibold text-lg mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
    </div>
  );
}

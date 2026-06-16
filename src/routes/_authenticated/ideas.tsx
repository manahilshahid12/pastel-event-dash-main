import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, Trash2, Sparkles } from "lucide-react";
import { PASTELS, pastel } from "@/lib/pastel";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";

export const Route = createFileRoute("/_authenticated/ideas")({
  component: IdeasPage,
});

const STATUSES = [
  { value: "spark", label: "✨ Spark", desc: "Just an idea" },
  { value: "brewing", label: "🫖 Brewing", desc: "Worth thinking about" },
  { value: "ready", label: "🌸 Ready", desc: "Let's make it happen" },
];

function IdeasPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<string>("all");

  const { data: ideas = [] } = useQuery({
    queryKey: ["ideas"],
    queryFn: async () => {
      const { data, error } = await supabase.from("ideas").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const update = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: { status?: string; color?: string } }) => {
      await supabase.from("ideas").update(patch).eq("id", id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ideas"] }),
  });
  const remove = useMutation({
    mutationFn: async (id: string) => { await supabase.from("ideas").delete().eq("id", id); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ideas"] }),
  });

  const filtered = filter === "all" ? ideas : ideas.filter((i) => i.status === filter);

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto">
      <header className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <div className="sticker bg-butter text-butter-ink mb-2">💡 Brainstorm</div>
          <h1 className="text-4xl md:text-5xl font-bold">Idea jar</h1>
          <p className="text-muted-foreground mt-1">Drop every event idea here so nothing gets lost.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-full"><Sparkles className="w-4 h-4 mr-1"/> New idea</Button>
          </DialogTrigger>
          <CreateIdeaDialog onCreated={() => { setOpen(false); qc.invalidateQueries({ queryKey: ["ideas"] }); }}/>
        </Dialog>
      </header>

      <div className="flex gap-2 mb-6 flex-wrap">
        <button onClick={() => setFilter("all")} className={`sticker ${filter === "all" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>All ({ideas.length})</button>
        {STATUSES.map((s) => (
          <button key={s.value} onClick={() => setFilter(s.value)}
            className={`sticker ${filter === s.value ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
            {s.label} ({ideas.filter((i) => i.status === s.value).length})
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="paper-card p-16 text-center">
          <div className="text-6xl mb-3">🫧</div>
          <p className="text-muted-foreground">No ideas here yet. Toss in your first one!</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((idea, i) => {
            const p = pastel(idea.color);
            return (
              <div key={idea.id} className={`${p.bg} ${p.text} p-5 rounded-3xl shadow-sticker relative group ${i % 3 === 0 ? "cute-tilt-left" : i % 3 === 2 ? "cute-tilt-right" : ""}`}>
                <button onClick={() => { if (confirm("Delete this idea?")) remove.mutate(idea.id); }}
                  className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition"><Trash2 className="w-4 h-4"/></button>
                <div className="text-2xl mb-2">{p.sticker}</div>
                <h3 className="font-bold text-lg mb-1">{idea.title}</h3>
                {idea.description && <p className="text-sm opacity-80 mb-3 whitespace-pre-wrap">{idea.description}</p>}
                {idea.tags && idea.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {idea.tags.map((t: string) => <span key={t} className="text-[10px] bg-white/50 px-2 py-0.5 rounded-full font-semibold">#{t}</span>)}
                  </div>
                )}
                <div className="flex items-center justify-between text-[11px] opacity-70 mt-3">
                  <span>{format(parseISO(idea.created_at), "MMM d")}</span>
                  <select value={idea.status} onChange={(e) => update.mutate({ id: idea.id, patch: { status: e.target.value } })}
                    className="bg-white/60 px-2 py-1 rounded-full font-semibold text-[11px] border-none outline-none cursor-pointer">
                    {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CreateIdeaDialog({ onCreated }: { onCreated: () => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [color, setColor] = useState("peach");

  const mut = useMutation({
    mutationFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      const { error } = await supabase.from("ideas").insert({
        title, description: description || null, color,
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        author_id: u.user?.id ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Idea saved ✨"); onCreated(); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not save"),
  });

  return (
    <DialogContent className="rounded-3xl">
      <DialogHeader><DialogTitle className="text-2xl">💡 New idea</DialogTitle></DialogHeader>
      <form onSubmit={(e) => { e.preventDefault(); mut.mutate(); }} className="space-y-4">
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="A title for the spark..." required/>
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe it (or don't!)" rows={4}/>
        <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="tags, comma separated"/>
        <div>
          <div className="text-sm font-semibold mb-2">Sticker color</div>
          <div className="flex gap-2 flex-wrap">
            {PASTELS.map((p) => (
              <button key={p.name} type="button" onClick={() => setColor(p.name)}
                className={`sticker ${p.bg} ${p.text} ${color === p.name ? "ring-2 ring-primary ring-offset-2 ring-offset-card" : ""}`}>
                {p.sticker} {p.name}
              </button>
            ))}
          </div>
        </div>
        <DialogFooter><Button type="submit" disabled={mut.isPending} className="rounded-full w-full" size="lg">{mut.isPending ? "..." : "Add to jar"}</Button></DialogFooter>
      </form>
    </DialogContent>
  );
}

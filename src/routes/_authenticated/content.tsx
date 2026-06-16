import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import * as React from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { PASTELS, pastel } from "@/lib/pastel";
import { Plus, Trash2, Calendar, Eye, Edit2, FileText, Copy } from "lucide-react";
import { format, startOfWeek, endOfWeek, addDays, addWeeks, isSameDay } from "date-fns";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/content")({
  component: ContentPage,
});

const PLATFORMS = [
  { id: "instagram", label: "📷 Instagram", limit: 280 },
  { id: "tiktok", label: "🎵 TikTok", limit: 150 },
  { id: "linkedin", label: "💼 LinkedIn", limit: 500 },
  { id: "twitter", label: "𝕏 Twitter", limit: 280 },
  { id: "facebook", label: "📘 Facebook", limit: 1000 },
  { id: "slack", label: "💬 Slack", limit: 4000 },
];

const STATUSES = [
  { value: "draft", label: "✍️ Draft" },
  { value: "scheduled", label: "📅 Scheduled" },
  { value: "published", label: "✅ Published" },
];

function ContentPage() {
  const [cursor, setCursor] = useState(new Date());
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingFileId, setViewingFileId] = useState<string | null>(null);
  const qc = useQueryClient();

  const weekStart = startOfWeek(cursor);
  const weekEnd = endOfWeek(cursor);

  const { data: posts = [] } = useQuery({
    queryKey: ["content-posts", format(weekStart, "yyyy-MM-dd")],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("content_posts")
        .select("*")
        .gte("scheduled_at", weekStart.toISOString())
        .lte("scheduled_at", weekEnd.toISOString())
        .order("scheduled_at");
      if (error) throw error;
      return data || [];
    },
  });

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const postsByDay = posts.reduce((acc, post) => {
    const day = format(new Date(post.scheduled_at), "yyyy-MM-dd");
    if (!acc[day]) acc[day] = [];
    acc[day].push(post);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto">
      <header className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <div className="sticker bg-mint text-mint-ink mb-2">📝 Content calendar</div>
          <h1 className="text-4xl md:text-5xl font-bold">
            {format(weekStart, "MMM d")} – {format(weekEnd, "MMM d, yyyy")}
          </h1>
          <p className="text-muted-foreground mt-1">Plan, schedule, and publish across all platforms.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="rounded-full" onClick={() => setCursor(addWeeks(cursor, -1))}>
            ←
          </Button>
          <Button variant="outline" className="rounded-full" onClick={() => setCursor(new Date())}>
            This week
          </Button>
          <Button variant="outline" size="icon" className="rounded-full" onClick={() => setCursor(addWeeks(cursor, 1))}>
            →
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-full">
                <Plus className="w-4 h-4 mr-1" /> New post
              </Button>
            </DialogTrigger>
            <NewPostDialog onCreated={() => { setOpen(false); qc.invalidateQueries({ queryKey: ["content-posts"] }); }} />
          </Dialog>
        </div>
      </header>

      <div className="paper-card overflow-hidden">
        <div className="grid grid-cols-7 bg-muted/60 border-b border-border">
          {days.map((d) => (
            <div key={format(d, "yyyy-MM-dd")} className="px-3 py-3 text-xs font-bold uppercase tracking-wide text-muted-foreground text-center">
              {format(d, "EEE")}<br />{format(d, "MMM d")}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 auto-rows-[minmax(200px,1fr)] gap-px bg-border">
          {days.map((d) => {
            const dayKey = format(d, "yyyy-MM-dd");
            const dayPosts = postsByDay[dayKey] || [];
            const isToday = isSameDay(d, new Date());
            return (
              <div key={dayKey} className={`p-2 bg-card min-h-[200px] ${isToday ? "bg-accent/20" : ""}`}>
                <div className="space-y-1.5 h-full overflow-y-auto">
                  {dayPosts.map((post) => {
                    const p = pastel(post.color);
                    return (
                      <ContentPostCard
                        key={post.id}
                        post={post}
                        onDelete={() => qc.invalidateQueries({ queryKey: ["content-posts"] })}
                        onEdit={() => setEditingId(post.id)}
                        onViewFile={() => setViewingFileId(post.id)}
                      />
                    );
                  })}
                  {dayPosts.length === 0 && (
                    <button
                      onClick={() => setOpen(true)}
                      className="text-xs text-muted-foreground hover:text-primary transition w-full py-3 rounded-lg hover:bg-muted/50"
                    >
                      + Add post
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <section className="mt-10">
        <h2 className="text-2xl font-bold mb-4">Upcoming posts ({posts.length})</h2>
        {posts.length === 0 ? (
          <div className="paper-card p-12 text-center">
            <div className="text-6xl mb-3">🎨</div>
            <p className="text-muted-foreground">No posts scheduled. Create your first one!</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {posts.slice(0, 6).map((post, i) => (
              <ContentPostDetail
                key={post.id}
                post={post}
                index={i}
                onDelete={() => qc.invalidateQueries({ queryKey: ["content-posts"] })}
                onEdit={() => setEditingId(post.id)}
                onViewFile={() => setViewingFileId(post.id)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Edit Post Dialog */}
      {editingId && (
        <EditPostDialog
          postId={editingId}
          onClose={() => setEditingId(null)}
          onSuccess={() => {
            setEditingId(null);
            qc.invalidateQueries({ queryKey: ["content-posts"] });
          }}
        />
      )}

      {/* File Viewer Dialog */}
      {viewingFileId && (
        <FileViewerDialog
          postId={viewingFileId}
          onClose={() => setViewingFileId(null)}
        />
      )}
    </div>
  );
}

function ContentPostCard({
  post,
  onDelete,
  onEdit,
  onViewFile,
}: {
  post: any;
  onDelete: () => void;
  onEdit: () => void;
  onViewFile: () => void;
}) {
  const qc = useQueryClient();
  const p = pastel(post.color);
  const platform = PLATFORMS.find((pl) => pl.id === post.platform);

  const deleteMut = useMutation({
    mutationFn: async () => {
      await supabase.from("content_posts").delete().eq("id", post.id);
    },
    onSuccess: onDelete,
  });

  return (
    <div
      className={`${p.bg} ${p.text} p-2 rounded-lg text-[10px] font-semibold truncate cursor-pointer hover:shadow-md transition group relative`}
      onClick={onEdit}
    >
      <div className="truncate">{platform?.label}</div>
      <div className="line-clamp-1 text-[9px] opacity-70">{post.content}</div>
      <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 flex gap-1 transition">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onViewFile();
          }}
          className="bg-sky text-sky-ink rounded-full w-4 h-4 flex items-center justify-center text-[8px]"
          title="View file"
        >
          📄
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className="bg-primary text-primary-foreground rounded-full w-4 h-4 flex items-center justify-center text-[8px]"
        >
          ✏️
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            deleteMut.mutate();
          }}
          className="bg-destructive text-destructive-foreground rounded-full w-4 h-4 flex items-center justify-center text-[8px]"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

function ContentPostDetail({
  post,
  index,
  onDelete,
  onEdit,
  onViewFile,
}: {
  post: any;
  index: number;
  onDelete: () => void;
  onEdit: () => void;
  onViewFile: () => void;
}) {
  const qc = useQueryClient();
  const p = pastel(post.color);
  const platform = PLATFORMS.find((pl) => pl.id === post.platform);

  const updateStatus = useMutation({
    mutationFn: async (status: string) => {
      await supabase.from("content_posts").update({ status }).eq("id", post.id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["content-posts"] }),
  });

  const deleteMut = useMutation({
    mutationFn: async () => {
      await supabase.from("content_posts").delete().eq("id", post.id);
    },
    onSuccess: onDelete,
  });

  return (
    <div className={`${p.bg} ${p.text} p-5 rounded-3xl shadow-sticker ${index % 2 ? "cute-tilt-right" : "cute-tilt-left"}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="text-2xl">{p.sticker}</div>
        <div className="flex gap-2">
          <button onClick={() => onViewFile()} className="text-xs opacity-50 hover:opacity-100" title="View file">
            📄
          </button>
          <button onClick={() => onEdit()} className="text-xs opacity-50 hover:opacity-100">
            ✏️
          </button>
          <button onClick={() => deleteMut.mutate()} className="text-xs opacity-50 hover:opacity-100">
            ✕
          </button>
        </div>
      </div>
      <div className="text-[11px] font-bold opacity-80 mb-1">{platform?.label}</div>
      <p className="text-sm font-semibold mb-3 line-clamp-3">{post.content}</p>
      <div className="flex items-center justify-between text-[11px]">
        <span className="opacity-70">{format(new Date(post.scheduled_at), "MMM d, h:mm a")}</span>
        <Select value={post.status} onValueChange={(v) => updateStatus.mutate(v)}>
          <SelectTrigger className="w-[110px] h-6 text-[10px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="text-sm">
            {STATUSES.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

function NewPostDialog({ onCreated }: { onCreated: () => void }) {
  const [content, setContent] = useState("");
  const [platform, setPlatform] = useState("instagram");
  const [scheduledAt, setScheduledAt] = useState(format(new Date(), "yyyy-MM-dd"));
  const [time, setTime] = useState("10:00");
  const [color, setColor] = useState("lavender");
  const [status, setStatus] = useState("draft");

  const currentPlatform = PLATFORMS.find((p) => p.id === platform);

  const mut = useMutation({
    mutationFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      const scheduled_at = new Date(`${scheduledAt}T${time}`).toISOString();
      const { error } = await supabase.from("content_posts").insert({
        content,
        platform,
        scheduled_at,
        color,
        status,
        created_by: u.user?.id ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Post scheduled 📝");
      onCreated();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not save"),
  });

  return (
    <DialogContent className="rounded-3xl max-w-lg">
      <DialogHeader>
        <DialogTitle className="text-2xl">📝 New content post</DialogTitle>
      </DialogHeader>
      <form onSubmit={(e) => { e.preventDefault(); mut.mutate(); }} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-semibold">Platform</label>
          <Select value={platform} onValueChange={setPlatform}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PLATFORMS.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-semibold">Content ({content.length}/{currentPlatform?.limit})</label>
          <div className="space-y-2">
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your post or upload a file..."
              maxLength={currentPlatform?.limit}
              rows={4}
            />
            <div className="flex gap-2">
              <input
                type="file"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    try {
                      // Check file type - only allow text-based formats
                      const allowedExtensions = [".txt", ".md", ".csv", ".json", ".js", ".html", ".xml", ".log", ".rst", ".doc"];
                      const fileName = file.name.toLowerCase();
                      const fileExt = fileName.slice(fileName.lastIndexOf("."));

                      if (!allowedExtensions.includes(fileExt)) {
                        toast.error(`❌ File type not supported. Use: ${allowedExtensions.join(", ")}`);
                        return;
                      }

                      const reader = new FileReader();
                      reader.onload = async (event) => {
                        try {
                          let text = event.target?.result as string;

                          // If HTML file, extract plain text (remove HTML tags)
                          if (file.name.toLowerCase().endsWith(".html")) {
                            const parser = new DOMParser();
                            const doc = parser.parseFromString(text, "text/html");
                            text = doc.body.innerText || text;
                          }

                          const limit = currentPlatform?.limit || 5000;
                          if (text.length > limit) {
                            toast.error(`Text exceeds platform limit of ${limit} characters`);
                          } else {
                            // Upload file to Supabase Storage
                            const fileName = `${Date.now()}-${file.name}`;
                            console.log("Uploading file:", fileName, "Size:", file.size, "Type:", file.type);

                            const { data, error } = await supabase.storage
                              .from("content-files")
                              .upload(fileName, file, {
                                cacheControl: "3600",
                                upsert: true
                              });

                            if (error) {
                              console.error("Upload error:", error);
                              toast.error(`Upload failed: ${error.message}`);
                              return;
                            }

                            console.log("Upload successful:", data);
                            setContent(text);
                            (e.target as HTMLInputElement).dataset.fileName = fileName;
                            toast.success(`File "${file.name}" uploaded to Supabase!`);
                          }
                        } catch (err) {
                          toast.error("Error reading file");
                          console.error(err);
                        }
                      };
                      reader.onerror = () => {
                        toast.error("Failed to read file");
                      };
                      reader.readAsText(file);
                    } catch (err) {
                      toast.error("Error processing file");
                      console.error(err);
                    }
                  }
                }}
                className="hidden"
                id="content-file-upload"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => document.getElementById("content-file-upload")?.click()}
                className="rounded-full"
              >
                📤 Upload file
              </Button>
              {content && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setContent("")}
                  className="rounded-full"
                >
                  Clear
                </Button>
              )}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold">Date</label>
            <Input type="date" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold">Time</label>
            <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-semibold">Status</label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-semibold">Color</label>
          <div className="flex gap-2 flex-wrap">
            {PASTELS.map((p) => (
              <button
                key={p.name}
                type="button"
                onClick={() => setColor(p.name)}
                className={`sticker ${p.bg} ${p.text} ${color === p.name ? "ring-2 ring-primary ring-offset-2 ring-offset-card" : ""}`}
              >
                {p.sticker} {p.name}
              </button>
            ))}
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" disabled={mut.isPending} className="rounded-full w-full" size="lg">
            {mut.isPending ? "Saving..." : "Schedule post"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

function EditPostDialog({
  postId,
  onClose,
  onSuccess,
}: {
  postId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { data: post, isLoading } = useQuery({
    queryKey: ["content-post", postId],
    queryFn: async () => {
      const { data, error } = await supabase.from("content_posts").select("*").eq("id", postId).single();
      if (error) throw error;
      return data;
    },
  });

  const [content, setContent] = useState("");
  const [platform, setPlatform] = useState("instagram");
  const [scheduledAt, setScheduledAt] = useState(format(new Date(), "yyyy-MM-dd"));
  const [time, setTime] = useState("10:00");
  const [color, setColor] = useState("lavender");
  const [status, setStatus] = useState("draft");

  // Load post data when it arrives
  React.useEffect(() => {
    if (post) {
      setContent(post.content);
      setPlatform(post.platform);
      setScheduledAt(post.scheduled_at.split("T")[0]);
      setTime(post.scheduled_at.split("T")[1].slice(0, 5));
      setColor(post.color);
      setStatus(post.status);
    }
  }, [post]);

  const currentPlatform = PLATFORMS.find((p) => p.id === platform);

  const mut = useMutation({
    mutationFn: async () => {
      const scheduled_at = new Date(`${scheduledAt}T${time}`).toISOString();
      const { error } = await supabase.from("content_posts").update({
        content,
        platform,
        scheduled_at,
        color,
        status,
      }).eq("id", postId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Post updated 📝");
      onSuccess();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not save"),
  });

  if (isLoading) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="rounded-3xl max-w-lg">
          <div className="text-center py-8">Loading...</div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="rounded-3xl max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl">✏️ Edit post</DialogTitle>
        </DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); mut.mutate(); }} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold">Platform</label>
            <Select value={platform} onValueChange={setPlatform}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PLATFORMS.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold">Content ({content.length}/{currentPlatform?.limit})</label>
            <div className="space-y-2">
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your post or upload a file..."
                maxLength={currentPlatform?.limit}
                rows={4}
              />
              <div className="flex gap-2">
                <input
                  type="file"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      try {
                        // Check file type - only allow text-based formats
                        const allowedExtensions = [".txt", ".md", ".csv", ".json", ".js", ".html", ".xml", ".log", ".rst"];
                        const fileName = file.name.toLowerCase();
                        const fileExt = fileName.slice(fileName.lastIndexOf("."));

                        if (!allowedExtensions.includes(fileExt)) {
                          toast.error(`File type not supported. Supported: ${allowedExtensions.join(", ")}`);
                          return;
                        }

                        const reader = new FileReader();
                        reader.onload = async (event) => {
                          try {
                            let text = event.target?.result as string;

                            // If HTML file, extract plain text (remove HTML tags)
                            if (file.name.toLowerCase().endsWith(".html")) {
                              const parser = new DOMParser();
                              const doc = parser.parseFromString(text, "text/html");
                              text = doc.body.innerText || text;
                            }

                            const limit = currentPlatform?.limit || 5000;
                            if (text.length > limit) {
                              toast.error(`Text exceeds platform limit of ${limit} characters`);
                            } else {
                              // Upload file to Supabase Storage
                              const fileName = `${Date.now()}-${file.name}`;
                              console.log("Uploading file:", fileName, "Size:", file.size, "Type:", file.type);

                              const { data, error } = await supabase.storage
                                .from("content-files")
                                .upload(fileName, file, {
                                  cacheControl: "3600",
                                  upsert: true
                                });

                              if (error) {
                                console.error("Upload error:", error);
                                toast.error(`Upload failed: ${error.message}`);
                                return;
                              }

                              console.log("Upload successful:", data);
                              setContent(text);
                              (e.target as HTMLInputElement).dataset.fileName = fileName;
                              toast.success(`File "${file.name}" uploaded to Supabase!`);
                            }
                          } catch (err) {
                            toast.error("Error reading file");
                            console.error(err);
                          }
                        };
                        reader.onerror = () => {
                          toast.error("Failed to read file");
                        };
                        reader.readAsText(file);
                      } catch (err) {
                        toast.error("Error processing file");
                        console.error(err);
                      }
                    }
                  }}
                  className="hidden"
                  id="edit-content-file-upload"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById("edit-content-file-upload")?.click()}
                  className="rounded-full"
                >
                  📤 Upload file
                </Button>
                {content && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setContent("")}
                    className="rounded-full"
                  >
                    Clear
                  </Button>
                )}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold">Date</label>
              <Input type="date" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold">Time</label>
              <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold">Status</label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold">Color</label>
            <div className="flex gap-2 flex-wrap">
              {PASTELS.map((p) => (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => setColor(p.name)}
                  className={`sticker ${p.bg} ${p.text} ${color === p.name ? "ring-2 ring-primary ring-offset-2 ring-offset-card" : ""}`}
                >
                  {p.sticker} {p.name}
                </button>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={mut.isPending} className="rounded-full w-full" size="lg">
              {mut.isPending ? "Saving..." : "Update post"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function FileViewerDialog({ postId, onClose }: { postId: string; onClose: () => void }) {
  const { data: post, isLoading } = useQuery({
    queryKey: ["content-post", postId],
    queryFn: async () => {
      const { data, error } = await supabase.from("content_posts").select("*").eq("id", postId).single();
      if (error) throw error;
      return data;
    },
  });

  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (post) {
      navigator.clipboard.writeText(post.content);
      toast.success("Copied to clipboard!");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="rounded-3xl max-w-2xl max-h-[80vh]">
          <div className="text-center py-8">Loading...</div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!post) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="rounded-3xl max-w-2xl">
          <div className="text-center py-8">Post not found</div>
        </DialogContent>
      </Dialog>
    );
  }

  const platform = PLATFORMS.find((p) => p.id === post.platform);

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="rounded-3xl max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <FileText className="w-6 h-6" />
            📄 {platform?.label}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          <div className="p-4 rounded-2xl bg-muted/50 border border-border">
            <p className="text-sm whitespace-pre-wrap font-mono text-sm leading-relaxed">
              {post.content}
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            onClick={handleCopy}
            className="rounded-full flex-1"
            variant={copied ? "default" : "outline"}
          >
            <Copy className="w-4 h-4 mr-2" />
            {copied ? "Copied!" : "Copy all"}
          </Button>
          <Button onClick={onClose} className="rounded-full flex-1">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

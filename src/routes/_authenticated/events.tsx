import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { EventForm } from "@/components/EventForm";
import { PASTELS, pastel } from "@/lib/pastel";
import { ChevronLeft, ChevronRight, Plus, MapPin, Edit2, Eye, Trash2 } from "lucide-react";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, addMonths, isSameMonth, isSameDay, parseISO } from "date-fns";
import { toast } from "sonner";
import { syncGuestsFromLuma } from "@/lib/api/sync-guests.server";

export const Route = createFileRoute("/_authenticated/events")({
  ssr: false,
  component: EventsPage,
});

type EventRow = {
  id: string; title: string; description: string | null; location: string | null;
  start_at: string; end_at: string | null; color: string; luma_url: string | null;
};

function EventsPage() {
  const navigate = useNavigate();
  const [cursor, setCursor] = useState(new Date());
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [draftDate, setDraftDate] = useState<Date | null>(null);
  const qc = useQueryClient();

  const monthStart = startOfMonth(cursor);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const gridEnd = endOfWeek(endOfMonth(cursor), { weekStartsOn: 0 });

  const days = useMemo(() => {
    const arr: Date[] = [];
    for (let d = gridStart; d <= gridEnd; d = addDays(d, 1)) arr.push(d);
    return arr;
  }, [gridStart, gridEnd]);

  const { data: events = [] } = useQuery({
    queryKey: ["events", format(monthStart, "yyyy-MM")],
    queryFn: async () => {
      const { data, error } = await supabase.from("events").select("*")
        .gte("start_at", gridStart.toISOString())
        .lte("start_at", gridEnd.toISOString())
        .order("start_at");
      if (error) throw error;
      return data as EventRow[];
    },
  });

  const eventsByDay = useMemo(() => {
    const map = new Map<string, EventRow[]>();
    for (const e of events) {
      const k = format(parseISO(e.start_at), "yyyy-MM-dd");
      const arr = map.get(k) ?? [];
      arr.push(e);
      map.set(k, arr);
    }
    return map;
  }, [events]);

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto">
      <header className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <div className="sticker bg-lavender text-lavender-ink mb-2">🗓️ Event calendar</div>
          <h1 className="text-4xl md:text-5xl font-bold">{format(cursor, "MMMM yyyy")}</h1>
          <p className="text-muted-foreground mt-1">Plan, block dates, and rally the team.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="rounded-full" onClick={() => setCursor(addMonths(cursor, -1))}><ChevronLeft className="w-4 h-4"/></Button>
          <Button variant="outline" className="rounded-full" onClick={() => setCursor(new Date())}>Today</Button>
          <Button variant="outline" size="icon" className="rounded-full" onClick={() => setCursor(addMonths(cursor, 1))}><ChevronRight className="w-4 h-4"/></Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-full" onClick={() => setDraftDate(new Date())}>
                <Plus className="w-4 h-4 mr-1"/> New event
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-3xl max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-3xl">✨ Create Event</DialogTitle>
              </DialogHeader>
              <EventForm onSuccess={() => { setOpen(false); qc.invalidateQueries({ queryKey: ["events"] }); }} />
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <div className="paper-card overflow-hidden">
        <div className="grid grid-cols-7 bg-muted/60 border-b border-border">
          {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d) => (
            <div key={d} className="px-3 py-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 auto-rows-[minmax(120px,1fr)]">
          {days.map((d) => {
            const k = format(d, "yyyy-MM-dd");
            const dayEvents = eventsByDay.get(k) ?? [];
            const inMonth = isSameMonth(d, cursor);
            const today = isSameDay(d, new Date());
            return (
              <div key={k} className={`border-b border-r border-border p-2 min-h-[120px] ${inMonth ? "bg-card" : "bg-muted/30"}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs font-bold w-7 h-7 rounded-full flex items-center justify-center ${today ? "bg-primary text-primary-foreground" : inMonth ? "text-foreground" : "text-muted-foreground"}`}>{format(d, "d")}</span>
                  <button onClick={() => { setDraftDate(d); setOpen(true); }} className="opacity-0 hover:opacity-100 group-hover:opacity-100 text-muted-foreground hover:text-primary transition" aria-label="Add event">
                    <Plus className="w-3.5 h-3.5"/>
                  </button>
                </div>
                <div className="space-y-1">
                  {dayEvents.slice(0, 3).map((e) => {
                    const p = pastel(e.color);
                    return (
                      <Link key={e.id} to="/events/$id" params={{ id: e.id }}
                        className={`block ${p.bg} ${p.text} text-[11px] font-semibold px-2 py-1 rounded-lg truncate hover:scale-[1.02] transition`}>
                        <span className="mr-1">{p.sticker}</span>{e.title}
                      </Link>
                    );
                  })}
                  {dayEvents.length > 3 && <div className="text-[10px] text-muted-foreground pl-1">+{dayEvents.length - 3} more</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {events.length > 0 && (
        <section className="mt-10">
          <h2 className="text-2xl font-bold mb-4">Upcoming this month</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {events.slice(0, 6).map((e, i) => {
              const p = pastel(e.color);
              return (
                <Link
                  key={e.id}
                  to="/events/$id"
                  params={{ id: e.id }}
                  className={`paper-card p-5 hover:shadow-md hover:scale-105 transition group cursor-pointer ${i % 2 ? "cute-tilt-right" : "cute-tilt-left"}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className={`sticker ${p.bg} ${p.text}`}>{p.sticker} {format(parseISO(e.start_at), "EEE, MMM d")}</div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition" onClick={(evt) => evt.stopPropagation()}>
                      <button
                        onClick={(evt) => {
                          evt.preventDefault();
                          evt.stopPropagation();
                          setEditingId(e.id);
                        }}
                        className="p-2 hover:bg-muted rounded-full transition"
                        title="Edit event"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(evt) => {
                          evt.preventDefault();
                          evt.stopPropagation();
                          setPreviewId(e.id);
                        }}
                        className="p-2 hover:bg-muted rounded-full transition"
                        title="View event summary"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(evt) => {
                          evt.preventDefault();
                          evt.stopPropagation();
                          if (confirm(`Delete "${e.title}"? This cannot be undone.`)) {
                            supabase.from("events").delete().eq("id", e.id).then(() => {
                              toast.success("Event deleted");
                              qc.invalidateQueries({ queryKey: ["events"] });
                            }).catch((err) => {
                              toast.error("Failed to delete event");
                            });
                          }
                        }}
                        className="p-2 hover:bg-destructive/20 hover:text-destructive rounded-full transition"
                        title="Delete event"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <h3 className="text-xl font-bold mb-1 group-hover:text-primary transition">{e.title}</h3>
                  {e.location && <div className="flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="w-3.5 h-3.5"/>{e.location}</div>}
                  {e.description && <p className="text-sm mt-2 line-clamp-2">{e.description}</p>}
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Event Edit Dialog */}
      {editingId && events.find(e => e.id === editingId) && (
        <Dialog open={!!editingId} onOpenChange={() => setEditingId(null)}>
          <DialogContent className="rounded-3xl max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-3xl">✏️ Edit Event</DialogTitle>
            </DialogHeader>
            <EventForm
              eventId={editingId}
              initialData={events.find(e => e.id === editingId)}
              onSuccess={() => {
                setEditingId(null);
                qc.invalidateQueries({ queryKey: ["events"] });
              }}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Event Preview Modal */}
      {previewId && (
        <EventPreviewModal
          eventId={previewId}
          onClose={() => setPreviewId(null)}
          onViewFull={() => {
            navigate({ to: "/events/$id", params: { id: previewId } });
            setPreviewId(null);
          }}
          onDelete={() => {
            setPreviewId(null);
            qc.invalidateQueries({ queryKey: ["events"] });
          }}
        />
      )}
    </div>
  );
}

function EventPreviewModal({
  eventId,
  onClose,
  onViewFull,
  onDelete,
}: {
  eventId: string;
  onClose: () => void;
  onViewFull: () => void;
  onDelete: () => void;
}) {
  const qc = useQueryClient();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ created: number; synced: number } | null>(null);

  const { data: event, isLoading } = useQuery({
    queryKey: ["event", eventId],
    queryFn: async () => {
      const { data, error } = await supabase.from("events").select("*").eq("id", eventId).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: guestCount = 0 } = useQuery({
    queryKey: ["event-guests-count", eventId],
    queryFn: async () => {
      const { count, error } = await supabase.from("guests").select("*", { count: "exact" }).eq("event_id", eventId);
      if (error) throw error;
      return count || 0;
    },
  });

  const { data: speakers = [] } = useQuery({
    queryKey: ["event-speakers", eventId],
    queryFn: async () => {
      const { data, error } = await supabase.from("event_speakers").select("*").eq("event_id", eventId);
      if (error) throw error;
      return data || [];
    },
  });

  const handleSyncGuests = async () => {
    if (!event?.luma_url) {
      toast.error("This event doesn't have a Luma URL");
      return;
    }

    setIsSyncing(true);
    try {
      const lumaEventId = event.luma_url.split("/").pop();
      if (!lumaEventId) throw new Error("Invalid Luma URL");

      console.log("Syncing Luma event:", lumaEventId);

      const result = await syncGuestsFromLuma(lumaEventId);

      setSyncResult({ created: result.createdCount, synced: result.syncedCount });
      toast.success(
        `✅ Synced! Created: ${result.createdCount}, Updated: ${result.syncedCount}, Attended: ${result.attendedCount}`
      );

      // Refresh guest count
      qc.invalidateQueries({ queryKey: ["event-guests-count", eventId] });
    } catch (error) {
      console.error("Sync error:", error);
      toast.error(error instanceof Error ? error.message : "Sync failed");
    } finally {
      setIsSyncing(false);
    }
  };

  const isEventDone = event && new Date(event.end_at || event.start_at) < new Date();


  if (isLoading) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="rounded-3xl max-w-2xl">
          <div className="flex items-center justify-center p-10">
            <div className="text-muted-foreground">Loading...</div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!event) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="rounded-3xl max-w-2xl">
          <div className="flex items-center justify-center p-10">
            <div className="text-muted-foreground">Event not found</div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const p = pastel(event.color);

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="rounded-3xl max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className={`${p.bg} ${p.text} rounded-2xl p-6 mb-4 relative overflow-hidden`}>
          <div className={`absolute -top-10 -right-10 w-48 h-48 opacity-20 blur-2xl rounded-full`} style={{ backgroundColor: "currentColor" }} />
          <div className="relative">
            <div className="text-sm font-semibold mb-2 opacity-90">{p.sticker} {format(parseISO(event.start_at), "EEEE, MMMM d, yyyy")}</div>
            <h2 className="text-3xl font-bold">{event.title}</h2>
          </div>
        </div>

        <div className="space-y-4">
          {event.location && (
            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Location</label>
              <p className="text-lg flex items-center gap-2 mt-1">
                <MapPin className="w-4 h-4" />
                {event.location}
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Start Time</label>
              <p className="text-lg font-semibold mt-1">{format(parseISO(event.start_at), "h:mm a")}</p>
            </div>
            {event.end_at && (
              <div>
                <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">End Time</label>
                <p className="text-lg font-semibold mt-1">{format(parseISO(event.end_at), "h:mm a")}</p>
              </div>
            )}
          </div>

          {event.description && (
            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Description</label>
              <p className="text-sm mt-2 leading-relaxed">{event.description}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 py-3 px-4 bg-muted/50 rounded-2xl">
            <div>
              <div className="text-2xl font-bold">{guestCount}</div>
              <div className="text-xs text-muted-foreground">Attendees</div>
            </div>
            <div>
              <div className={`inline-block sticker ${p.bg} ${p.text}`}>{p.sticker} {event.color}</div>
            </div>
          </div>

          {speakers.length > 0 && (
            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-3 block">🎤 Panelists & Speakers</label>
              <div className="grid gap-2">
                {speakers.map((speaker) => (
                  <div key={speaker.id} className="p-3 rounded-2xl bg-muted/50 border border-muted">
                    <div className="font-semibold">{speaker.name}</div>
                    <div className="text-sm text-muted-foreground">{speaker.title}</div>
                    {speaker.bio && <p className="text-xs text-muted-foreground mt-1">{speaker.bio}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {event.luma_url && (
            <a
              href={event.luma_url}
              target="_blank"
              rel="noreferrer"
              className="block p-3 rounded-2xl bg-sky/20 border border-sky/30 hover:bg-sky/30 transition text-center font-semibold text-sm"
            >
              View on Luma →
            </a>
          )}
        </div>

        {isEventDone && event?.luma_url && (
          <div className="p-3 rounded-2xl bg-sky/20 border border-sky/30">
            <p className="text-sm font-semibold mb-2">📊 Sync Luma Attendee Data</p>
            <p className="text-xs text-muted-foreground mb-3">
              Update your guest database with final attendance from Luma
            </p>
            <Button
              onClick={handleSyncGuests}
              disabled={isSyncing}
              className="w-full rounded-full"
              size="sm"
            >
              {isSyncing ? "Syncing..." : "Sync from Luma"}
            </Button>
            {syncResult && (
              <p className="text-xs text-muted-foreground mt-2">
                ✅ Created: {syncResult.created}, Updated: {syncResult.synced}
              </p>
            )}
          </div>
        )}

        <div className="flex gap-2 pt-4 border-t border-border">
          <Button
            variant="ghost"
            onClick={() => {
              if (confirm(`Delete "${event.title}"? This cannot be undone.`)) {
                supabase.from("events").delete().eq("id", eventId).then(() => {
                  toast.success("Event deleted");
                  onDelete();
                  onClose();
                }).catch((err) => {
                  toast.error("Failed to delete event");
                });
              }
            }}
            className="rounded-full text-destructive"
          >
            <Trash2 className="w-4 h-4 mr-1" /> Delete
          </Button>
          <Button variant="outline" onClick={onClose} className="flex-1 rounded-full">
            Close
          </Button>
          <Button onClick={onViewFull} className="flex-1 rounded-full">
            View Full Details →
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}


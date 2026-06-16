import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Mail, Download, Upload, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";

export const Route = createFileRoute("/_authenticated/guests")({
  ssr: false,
  component: GuestsPage,
});

function GuestsPage() {
  const [open, setOpen] = useState(false);
  const [csvOpen, setCsvOpen] = useState(false);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"unified" | "by-event">("by-event");
  const qc = useQueryClient();

  const { data: guests = [] } = useQuery({
    queryKey: ["all-guests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("guests")
        .select("*, events!inner(title)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: events = [] } = useQuery({
    queryKey: ["events-list"],
    queryFn: async () => {
      const { data, error } = await supabase.from("events").select("id, title").order("start_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const eventGuestCounts = events.map((e) => ({
    ...e,
    guestCount: guests.filter((g) => g.event_id === e.id).length,
  }));

  const attended = guests.filter((g) => g.attended).length;
  const engaged = guests.filter((g) => g.rsvp_status === "yes").length;

  const filtered = guests.filter((g) => {
    const matchesSearch = g.name.toLowerCase().includes(search.toLowerCase()) || (g.email?.toLowerCase().includes(search.toLowerCase()) ?? false);
    if (filter === "all") return matchesSearch;
    if (filter === "attended") return g.attended && matchesSearch;
    if (filter === "engaged") return g.rsvp_status === "yes" && matchesSearch;
    return matchesSearch;
  });

  const eventGuests = selectedEventId
    ? guests.filter((g) => g.event_id === selectedEventId)
    : [];

  if (selectedEventId) {
    const event = events.find((e) => e.id === selectedEventId);
    return (
      <div className="p-6 md:p-10 max-w-7xl mx-auto">
        <button
          onClick={() => setSelectedEventId(null)}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ChevronRight className="w-4 h-4 mr-1 rotate-180" /> Back to all events
        </button>

        <header className="flex flex-wrap items-end justify-between gap-4 mb-6">
          <div>
            <div className="sticker bg-mint text-mint-ink mb-2">📋 Event guests</div>
            <h1 className="text-4xl md:text-5xl font-bold">{event?.title}</h1>
            <p className="text-muted-foreground mt-1">{eventGuests.length} attendees</p>
          </div>
        </header>

        <div className="paper-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/60 border-b border-border">
                <tr>
                  <th className="text-left px-4 py-3 font-bold">Name</th>
                  <th className="text-left px-4 py-3 font-bold">Email</th>
                  <th className="text-left px-4 py-3 font-bold">Status</th>
                  <th className="text-center px-4 py-3 font-bold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {eventGuests.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                      No guests for this event yet. Import a CSV to get started!
                    </td>
                  </tr>
                ) : (
                  eventGuests.map((guest, i) => (
                    <tr key={guest.id} className={i % 2 === 0 ? "bg-card" : "bg-muted/20"}>
                      <td className="px-4 py-3 font-semibold">{guest.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{guest.email || "—"}</td>
                      <td className="px-4 py-3">
                        <Select value={guest.rsvp_status || "pending"} onValueChange={(v) => {
                          supabase.from("guests").update({ rsvp_status: v }).eq("id", guest.id).then(() => {
                            qc.invalidateQueries({ queryKey: ["all-guests"] });
                          });
                        }}>
                          <SelectTrigger className="w-[110px] h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="text-sm">
                            <SelectItem value="pending">⏳ Pending</SelectItem>
                            <SelectItem value="yes">✅ Attended</SelectItem>
                            <SelectItem value="maybe">📋 Waiting</SelectItem>
                            <SelectItem value="no">❌ Not attended</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => {
                            if (confirm("Remove this guest?")) {
                              supabase.from("guests").delete().eq("id", guest.id).then(() => {
                                qc.invalidateQueries({ queryKey: ["all-guests"] });
                              });
                            }
                          }}
                          className="text-muted-foreground hover:text-destructive transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto">
      <header className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <div className="sticker bg-rose text-rose-ink mb-2">👥 Community</div>
          <h1 className="text-4xl md:text-5xl font-bold">Guest database</h1>
          <p className="text-muted-foreground mt-1">Centralized hub for all event attendees and community members.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Dialog open={csvOpen} onOpenChange={setCsvOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-full" variant="outline">
                <Upload className="w-4 h-4 mr-1" /> Import CSV
              </Button>
            </DialogTrigger>
            <ImportCSVDialog events={events} onCreated={() => { setCsvOpen(false); qc.invalidateQueries({ queryKey: ["all-guests"] }); }} />
          </Dialog>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-full">
                <Plus className="w-4 h-4 mr-1" /> Add guest
              </Button>
            </DialogTrigger>
            <AddGuestDialog events={events} onCreated={() => { setOpen(false); qc.invalidateQueries({ queryKey: ["all-guests"] }); }} />
          </Dialog>
        </div>
      </header>

      <div className="flex flex-wrap gap-3 mb-6">
        <div className="sticker bg-lavender text-lavender-ink">📊 {guests.length} total</div>
        <div className="sticker bg-mint text-mint-ink">🎀 {attended} attended</div>
        <div className="sticker bg-peach text-peach-ink">💚 {engaged} engaged</div>
      </div>

      {/* Event boxes view */}
      {eventGuestCounts.length > 0 && (
        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-4">Events & Attendees</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {eventGuestCounts.map((event) => (
              <button
                key={event.id}
                onClick={() => setSelectedEventId(event.id)}
                className="paper-card p-6 text-left hover:shadow-md hover:scale-105 transition cursor-pointer group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="sticker bg-sky text-sky-ink">📅</div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition" />
                </div>
                <h3 className="text-xl font-bold mb-1 group-hover:text-primary transition">{event.title}</h3>
                <div className="text-3xl font-bold text-primary mb-2">{event.guestCount}</div>
                <p className="text-xs text-muted-foreground">attendees</p>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Unified guest list */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">All attendees</h2>
        </div>

        <div className="paper-card p-4 mb-6">
          <div className="flex flex-wrap gap-2">
            <Input
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 min-w-[200px]"
            />
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All guests</SelectItem>
                <SelectItem value="attended">Attended</SelectItem>
                <SelectItem value="engaged">Engaged</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="paper-card p-12 text-center">
            <div className="text-6xl mb-3">🎯</div>
            <p className="text-muted-foreground">No guests match your filters. Add some guests to get started!</p>
          </div>
        ) : (
          <div className="paper-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/60 border-b border-border">
                  <tr>
                    <th className="text-left px-4 py-3 font-bold">Name</th>
                    <th className="text-left px-4 py-3 font-bold">Email</th>
                    <th className="text-left px-4 py-3 font-bold">Status</th>
                    <th className="text-left px-4 py-3 font-bold">Added</th>
                    <th className="text-center px-4 py-3 font-bold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((guest, i) => (
                    <GuestRow
                      key={guest.id}
                      guest={guest}
                      isAlternate={i % 2 === 0}
                      onUpdate={() => qc.invalidateQueries({ queryKey: ["all-guests"] })}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      <section className="mt-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Quick actions</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <Button className="rounded-3xl p-6 h-auto flex flex-col items-center gap-2 hover:scale-105 transition">
            <Mail className="w-6 h-6" />
            <span>Email all attendees</span>
          </Button>
          <Button variant="outline" className="rounded-3xl p-6 h-auto flex flex-col items-center gap-2 hover:scale-105 transition">
            <Download className="w-6 h-6" />
            <span>Export guest list</span>
          </Button>
        </div>
      </section>
    </div>
  );
}

function GuestRow({ guest, isAlternate, onUpdate }: { guest: any; isAlternate: boolean; onUpdate: () => void }) {
  const qc = useQueryClient();

  const updateStatus = useMutation({
    mutationFn: async (status: string) => {
      await supabase.from("guests").update({ rsvp_status: status }).eq("id", guest.id);
    },
    onSuccess: onUpdate,
  });

  const deleteGuest = useMutation({
    mutationFn: async () => {
      await supabase.from("guests").delete().eq("id", guest.id);
    },
    onSuccess: () => {
      toast.success("Guest removed");
      onUpdate();
    },
  });

  const getStatusDisplay = () => {
    if (guest.attended) return "✅ Attended";
    if (guest.rsvp_status === "yes") return "💚 Going";
    if (guest.rsvp_status === "maybe") return "📋 Waiting";
    if (guest.rsvp_status === "no") return "❌ Not attended";
    return "⏳ Pending";
  };

  return (
    <tr className={isAlternate ? "bg-card" : "bg-muted/20"}>
      <td className="px-4 py-3 font-semibold">{guest.name}</td>
      <td className="px-4 py-3 text-muted-foreground">{guest.email || "—"}</td>
      <td className="px-4 py-3">
        <span className="text-xs font-semibold">{getStatusDisplay()}</span>
      </td>
      <td className="px-4 py-3 text-muted-foreground text-xs">{format(parseISO(guest.created_at), "MMM d")}</td>
      <td className="px-4 py-3 text-center">
        <button
          onClick={() => {
            if (confirm("Remove this guest?")) deleteGuest.mutate();
          }}
          className="text-muted-foreground hover:text-destructive transition"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </td>
    </tr>
  );
}

function AddGuestDialog({ events, onCreated }: { events: any[]; onCreated: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [eventId, setEventId] = useState(events[0]?.id || "");

  const mut = useMutation({
    mutationFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      const { error } = await supabase.from("guests").insert({
        name,
        email: email || null,
        event_id: eventId || null,
        rsvp_status: "pending",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Guest added! 🎉");
      setName("");
      setEmail("");
      onCreated();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not save"),
  });

  return (
    <DialogContent className="rounded-3xl max-w-lg">
      <DialogHeader>
        <DialogTitle className="text-2xl">👥 Add guest</DialogTitle>
      </DialogHeader>
      <form onSubmit={(e) => { e.preventDefault(); mut.mutate(); }} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-semibold">Name</label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Guest name"
            required
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-semibold">Email</label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@example.com"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-semibold">Associated event (optional)</label>
          <Select value={eventId} onValueChange={setEventId}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {events.map((e) => (
                <SelectItem key={e.id} value={e.id}>
                  {e.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button type="submit" disabled={mut.isPending} className="rounded-full w-full" size="lg">
            {mut.isPending ? "Adding..." : "Add guest"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

function ImportCSVDialog({ events, onCreated }: { events: any[]; onCreated: () => void }) {
  const [eventId, setEventId] = useState(events[0]?.id || "");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<any[]>([]);
  const [step, setStep] = useState<"select" | "preview" | "importing">("select");

  const mut = useMutation({
    mutationFn: async () => {
      if (!preview.length) throw new Error("No data to import");

      const guestsToInsert = preview.map((row) => ({
        name: row.name || "",
        email: row.email || null,
        event_id: eventId || null,
        rsvp_status: row.status || "pending",
        attended: row.status === "attended",
      }));

      const { error } = await supabase.from("guests").insert(guestsToInsert);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(`Imported ${preview.length} guests! 🎉`);
      setFile(null);
      setPreview([]);
      setStep("select");
      onCreated();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Import failed"),
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);

    const text = await selectedFile.text();
    const lines = text.split("\n");
    const headers = lines[0].toLowerCase().split(",").map((h) => h.trim());

    const nameIdx = headers.findIndex((h) => h.includes("name"));
    const emailIdx = headers.findIndex((h) => h.includes("email"));
    const statusIdx = headers.findIndex((h) => h.includes("status"));

    const rows = lines.slice(1).filter((line) => line.trim()).map((line) => {
      const cols = line.split(",").map((c) => c.trim());
      return {
        name: cols[nameIdx] || "",
        email: cols[emailIdx] || "",
        status: cols[statusIdx] ? cols[statusIdx].toLowerCase() : "pending",
      };
    });

    setPreview(rows);
    setStep("preview");
  };

  return (
    <DialogContent className="rounded-3xl max-w-2xl">
      <DialogHeader>
        <DialogTitle className="text-2xl">📥 Import CSV</DialogTitle>
      </DialogHeader>

      {step === "select" && (
        <div className="space-y-4">
          <div>
            <label className="text-sm font-semibold mb-2 block">Select event</label>
            <Select value={eventId} onValueChange={setEventId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {events.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-semibold mb-2 block">CSV File</label>
            <div className="border-2 border-dashed border-border rounded-2xl p-6 text-center hover:bg-muted/50 transition cursor-pointer">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
                id="csv-input"
              />
              <label htmlFor="csv-input" className="cursor-pointer">
                <div className="text-3xl mb-2">📄</div>
                <p className="font-semibold">Click to upload CSV</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Format: Name, Email, Status
                </p>
              </label>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-sky/20 border border-sky/30">
            <p className="text-xs text-muted-foreground">
              <strong>CSV Format:</strong> Your file should have columns for Name, Email, and Status (pending, attended, waiting list, not attended)
            </p>
          </div>
        </div>
      )}

      {step === "preview" && (
        <div className="space-y-4">
          <div>
            <p className="text-sm font-semibold mb-3">Preview ({preview.length} rows)</p>
            <div className="max-h-96 overflow-y-auto rounded-xl border border-border">
              <table className="w-full text-xs">
                <thead className="bg-muted/60 sticky top-0">
                  <tr>
                    <th className="text-left px-3 py-2 font-bold">Name</th>
                    <th className="text-left px-3 py-2 font-bold">Email</th>
                    <th className="text-left px-3 py-2 font-bold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.slice(0, 50).map((row, i) => (
                    <tr key={i} className={i % 2 === 0 ? "bg-card" : "bg-muted/20"}>
                      <td className="px-3 py-2">{row.name}</td>
                      <td className="px-3 py-2 text-muted-foreground">{row.email || "—"}</td>
                      <td className="px-3 py-2">
                        <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-full">
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {preview.length > 50 && (
              <p className="text-xs text-muted-foreground mt-2">
                ... and {preview.length - 50} more rows
              </p>
            )}
          </div>
        </div>
      )}

      <DialogFooter>
        {step === "preview" && (
          <>
            <Button
              variant="outline"
              onClick={() => {
                setFile(null);
                setPreview([]);
                setStep("select");
              }}
              className="rounded-full"
            >
              Back
            </Button>
            <Button
              onClick={() => mut.mutate()}
              disabled={mut.isPending}
              className="rounded-full"
            >
              {mut.isPending ? "Importing..." : `Import ${preview.length} guests`}
            </Button>
          </>
        )}
        {step === "select" && (
          <Button
            disabled={!file}
            onClick={() => {}}
            className="rounded-full w-full"
            size="lg"
          >
            Select file to continue
          </Button>
        )}
      </DialogFooter>
    </DialogContent>
  );
}

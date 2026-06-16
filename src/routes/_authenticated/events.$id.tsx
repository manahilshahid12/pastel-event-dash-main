import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { pastel } from "@/lib/pastel";
import { ArrowLeft, Plus, Trash2, ExternalLink, Mail, Send, MapPin, CalendarDays, Users, ClipboardList, UtensilsCrossed, StickyNote } from "lucide-react";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/events/$id")({
  ssr: false,
  component: EventDetail,
});

function EventDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: event, isLoading } = useQuery({
    queryKey: ["event", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("events").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  async function deleteEvent() {
    if (!confirm("Delete this event and all its details?")) return;
    const { error } = await supabase.from("events").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Event removed");
    navigate({ to: "/events" });
  }

  async function sendDebrief() {
    const { data: guests } = await supabase.from("guests").select("email,name").eq("event_id", id);
    const emails = (guests ?? []).map((g) => g.email).filter(Boolean).join(",");
    if (!emails) return toast.info("No guest emails yet — add some first.");
    const subject = encodeURIComponent(`Debrief: ${event?.title ?? "our event"}`);
    const body = encodeURIComponent(`Hi everyone,\n\nThanks for joining ${event?.title}! Here's a quick debrief...\n`);
    window.open(`mailto:?bcc=${emails}&subject=${subject}&body=${body}`);
  }

  if (isLoading) return <div className="p-10 text-muted-foreground">Loading...</div>;
  if (!event) return <div className="p-10">Event not found. <Link to="/events" className="text-primary underline">Back</Link></div>;

  const p = pastel(event.color);

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto">
      <Link to="/events" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="w-4 h-4 mr-1"/> All events
      </Link>

      <header className={`paper-card p-6 md:p-8 mb-6 relative overflow-hidden`}>
        <div className={`absolute -top-10 -right-10 w-48 h-48 ${p.bg} rounded-full opacity-50 blur-2xl`}/>
        <div className="relative">
          <div className={`sticker ${p.bg} ${p.text} mb-3`}>{p.sticker} {format(parseISO(event.start_at), "EEEE")}</div>
          <h1 className="text-4xl md:text-5xl font-bold">{event.title}</h1>
          <div className="flex flex-wrap gap-4 mt-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><CalendarDays className="w-4 h-4"/>{format(parseISO(event.start_at), "MMM d, yyyy 'at' h:mm a")}</span>
            {event.location && <span className="flex items-center gap-1"><MapPin className="w-4 h-4"/>{event.location}</span>}
          </div>
          {event.description && <p className="mt-4 max-w-2xl">{event.description}</p>}
          <div className="flex flex-wrap gap-2 mt-5">
            {event.luma_url ? (
              <a href={event.luma_url} target="_blank" rel="noreferrer">
                <Button variant="outline" className="rounded-full"><ExternalLink className="w-4 h-4 mr-1"/> Open on Luma</Button>
              </a>
            ) : (
              <Button variant="outline" className="rounded-full" onClick={() => toast.info("Add a Luma URL to enable auto-invites. Full Luma API hookup coming soon.")}>
                <Send className="w-4 h-4 mr-1"/> Connect Luma
              </Button>
            )}
            <Button variant="outline" className="rounded-full" onClick={sendDebrief}>
              <Mail className="w-4 h-4 mr-1"/> Email debrief
            </Button>
            <Button variant="ghost" className="rounded-full text-destructive ml-auto" onClick={deleteEvent}>
              <Trash2 className="w-4 h-4 mr-1"/> Delete
            </Button>
          </div>
        </div>
      </header>

      <Tabs defaultValue="requirements">
        <TabsList className="rounded-full bg-muted p-1 mb-5 flex flex-wrap">
          <TabsTrigger value="requirements" className="rounded-full"><ClipboardList className="w-4 h-4 mr-1"/>Requirements</TabsTrigger>
          <TabsTrigger value="essentials" className="rounded-full"><UtensilsCrossed className="w-4 h-4 mr-1"/>Essentials</TabsTrigger>
          <TabsTrigger value="guests" className="rounded-full"><Users className="w-4 h-4 mr-1"/>Guests</TabsTrigger>
          <TabsTrigger value="agenda" className="rounded-full">📅 Agenda</TabsTrigger>
          <TabsTrigger value="media" className="rounded-full">🖼️ Media</TabsTrigger>
          <TabsTrigger value="speakers" className="rounded-full">🎤 Speakers</TabsTrigger>
          <TabsTrigger value="analytics" className="rounded-full">📊 Analytics</TabsTrigger>
          <TabsTrigger value="notes" className="rounded-full"><StickyNote className="w-4 h-4 mr-1"/>Notes</TabsTrigger>
        </TabsList>

        <TabsContent value="requirements"><Checklist eventId={id} table="requirements" placeholder="Book the venue, order flowers..." sticker="✅" /></TabsContent>
        <TabsContent value="essentials"><Essentials eventId={id} /></TabsContent>
        <TabsContent value="guests"><GuestList eventId={id} onChanged={() => qc.invalidateQueries({ queryKey: ["guests", id] })} /></TabsContent>
        <TabsContent value="agenda"><EventAgenda eventId={id} /></TabsContent>
        <TabsContent value="media"><EventMedia eventId={id} /></TabsContent>
        <TabsContent value="speakers"><EventSpeakers eventId={id} /></TabsContent>
        <TabsContent value="analytics"><EventAnalytics eventId={id} event={event} /></TabsContent>
        <TabsContent value="notes"><Notes eventId={id} /></TabsContent>
      </Tabs>
    </div>
  );
}

function Checklist({ eventId, table, placeholder, sticker }: { eventId: string; table: "requirements"; placeholder: string; sticker: string }) {
  const qc = useQueryClient();
  const [label, setLabel] = useState("");
  const key = [table, eventId];
  const { data: items = [] } = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await supabase.from(table).select("*").eq("event_id", eventId).order("created_at");
      if (error) throw error;
      return data;
    },
  });
  const add = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from(table).insert({ event_id: eventId, label });
      if (error) throw error;
    },
    onSuccess: () => { setLabel(""); qc.invalidateQueries({ queryKey: key }); },
  });
  const toggle = useMutation({
    mutationFn: async ({ id, done }: { id: string; done: boolean }) => {
      await supabase.from(table).update({ done }).eq("id", id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });
  const remove = useMutation({
    mutationFn: async (id: string) => { await supabase.from(table).delete().eq("id", id); },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });

  return (
    <div className="paper-card p-6">
      <form onSubmit={(e) => { e.preventDefault(); if (label.trim()) add.mutate(); }} className="flex gap-2 mb-4">
        <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder={placeholder} />
        <Button type="submit" className="rounded-full"><Plus className="w-4 h-4"/></Button>
      </form>
      <ul className="space-y-2">
        {items.map((it) => (
          <li key={it.id} className="flex items-center gap-3 p-3 rounded-2xl hover:bg-muted/50 transition group">
            <Checkbox checked={it.done} onCheckedChange={(v) => toggle.mutate({ id: it.id, done: !!v })} />
            <span className={`flex-1 ${it.done ? "line-through text-muted-foreground" : ""}`}>{sticker} {it.label}</span>
            <button onClick={() => remove.mutate(it.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive">
              <Trash2 className="w-4 h-4"/>
            </button>
          </li>
        ))}
        {items.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">Nothing here yet — add your first item ✨</p>}
      </ul>
    </div>
  );
}

const CATEGORIES = [
  { value: "catering", label: "🍰 Catering" },
  { value: "decor", label: "🎀 Decor" },
  { value: "av", label: "🎤 A/V" },
  { value: "swag", label: "🎁 Swag" },
  { value: "supplies", label: "📦 Supplies" },
  { value: "general", label: "✨ General" },
];

function Essentials({ eventId }: { eventId: string }) {
  const qc = useQueryClient();
  const [label, setLabel] = useState("");
  const [category, setCategory] = useState("catering");
  const key = ["essentials", eventId];
  const { data: items = [] } = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await supabase.from("essentials").select("*").eq("event_id", eventId).order("category");
      if (error) throw error;
      return data;
    },
  });
  const add = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("essentials").insert({ event_id: eventId, label, category });
      if (error) throw error;
    },
    onSuccess: () => { setLabel(""); qc.invalidateQueries({ queryKey: key }); },
  });
  const toggle = useMutation({
    mutationFn: async ({ id, done }: { id: string; done: boolean }) => { await supabase.from("essentials").update({ done }).eq("id", id); },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });
  const remove = useMutation({
    mutationFn: async (id: string) => { await supabase.from("essentials").delete().eq("id", id); },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });

  const grouped = CATEGORIES.map((c) => ({ ...c, items: items.filter((i) => i.category === c.value) })).filter((g) => g.items.length > 0);

  return (
    <div className="paper-card p-6">
      <form onSubmit={(e) => { e.preventDefault(); if (label.trim()) add.mutate(); }} className="flex flex-wrap gap-2 mb-5">
        <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Mini cupcakes, fairy lights..." className="flex-1 min-w-[200px]"/>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-[180px]"><SelectValue/></SelectTrigger>
          <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
        </Select>
        <Button type="submit" className="rounded-full"><Plus className="w-4 h-4"/></Button>
      </form>
      {grouped.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">Start a checklist — catering, decor, A/V 🎀</p>}
      <div className="space-y-5">
        {grouped.map((g) => (
          <div key={g.value}>
            <div className="text-sm font-bold mb-2">{g.label}</div>
            <ul className="space-y-1.5">
              {g.items.map((it) => (
                <li key={it.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted/50 group">
                  <Checkbox checked={it.done} onCheckedChange={(v) => toggle.mutate({ id: it.id, done: !!v })}/>
                  <span className={`flex-1 ${it.done ? "line-through text-muted-foreground" : ""}`}>{it.label}</span>
                  <button onClick={() => remove.mutate(it.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4"/></button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

function GuestList({ eventId }: { eventId: string; onChanged: () => void }) {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const key = ["guests", eventId];
  const { data: guests = [] } = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await supabase.from("guests").select("*").eq("event_id", eventId).order("created_at");
      if (error) throw error;
      return data;
    },
  });
  const add = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("guests").insert({ event_id: eventId, name, email: email || null });
      if (error) throw error;
    },
    onSuccess: () => { setName(""); setEmail(""); qc.invalidateQueries({ queryKey: key }); },
  });
  const update = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: { rsvp_status?: string; attended?: boolean } }) => { await supabase.from("guests").update(patch).eq("id", id); },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });
  const remove = useMutation({
    mutationFn: async (id: string) => { await supabase.from("guests").delete().eq("id", id); },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });

  const attended = guests.filter((g) => g.attended).length;
  const invited = guests.length;

  return (
    <div className="paper-card p-6">
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="sticker bg-mint text-mint-ink">👥 {invited} invited</div>
        <div className="sticker bg-rose text-rose-ink">🎀 {attended} attended</div>
      </div>
      <form onSubmit={(e) => { e.preventDefault(); if (name.trim()) add.mutate(); }} className="flex flex-wrap gap-2 mb-5">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Guest name" className="flex-1 min-w-[140px]"/>
        <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="email@..." className="flex-1 min-w-[180px]"/>
        <Button type="submit" className="rounded-full"><Plus className="w-4 h-4 mr-1"/>Invite</Button>
      </form>
      <div className="space-y-2">
        {guests.map((g) => (
          <div key={g.id} className="flex flex-wrap items-center gap-3 p-3 rounded-2xl hover:bg-muted/50 group">
            <div className="flex-1 min-w-0">
              <div className="font-semibold truncate">{g.name}</div>
              {g.email && <div className="text-xs text-muted-foreground truncate">{g.email}</div>}
            </div>
            <Select value={g.rsvp_status} onValueChange={(v) => update.mutate({ id: g.id, patch: { rsvp_status: v } })}>
              <SelectTrigger className="w-[130px] h-8"><SelectValue/></SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">⏳ Pending</SelectItem>
                <SelectItem value="yes">💚 Going</SelectItem>
                <SelectItem value="maybe">🤔 Maybe</SelectItem>
                <SelectItem value="no">💔 No</SelectItem>
              </SelectContent>
            </Select>
            <label className="flex items-center gap-2 text-xs font-semibold">
              <Checkbox checked={g.attended} onCheckedChange={(v) => update.mutate({ id: g.id, patch: { attended: !!v } })} />
              Attended
            </label>
            <button onClick={() => remove.mutate(g.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4"/></button>
          </div>
        ))}
        {guests.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">No guests yet. Add some friends 💌</p>}
      </div>
    </div>
  );
}

function EventAgenda({ eventId }: { eventId: string }) {
  const qc = useQueryClient();
  const [time, setTime] = useState("");
  const [activity, setActivity] = useState("");

  const { data: agenda = [] } = useQuery({
    queryKey: ["agenda", eventId],
    queryFn: async () => {
      const { data, error } = await supabase.from("event_agenda").select("*").eq("event_id", eventId).order("time");
      if (error) throw error;
      return data || [];
    },
  });

  const add = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("event_agenda").insert({ event_id: eventId, time, activity });
      if (error) throw error;
    },
    onSuccess: () => { setTime(""); setActivity(""); qc.invalidateQueries({ queryKey: ["agenda", eventId] }); },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => { await supabase.from("event_agenda").delete().eq("id", id); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["agenda", eventId] }),
  });

  return (
    <div className="paper-card p-6">
      <form onSubmit={(e) => { e.preventDefault(); if (time && activity) add.mutate(); }} className="flex gap-2 mb-5 flex-wrap">
        <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} placeholder="10:00 AM" />
        <Input value={activity} onChange={(e) => setActivity(e.target.value)} placeholder="Activity or session..." className="flex-1 min-w-[200px]" />
        <Button type="submit" className="rounded-full"><Plus className="w-4 h-4"/></Button>
      </form>
      <div className="space-y-2">
        {agenda.map((item) => (
          <div key={item.id} className="flex items-center justify-between p-3 rounded-2xl hover:bg-muted/50 group">
            <div>
              <span className="font-bold text-primary">{item.time}</span>
              <span className="ml-3">{item.activity}</span>
            </div>
            <button onClick={() => remove.mutate(item.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive">
              <Trash2 className="w-4 h-4"/>
            </button>
          </div>
        ))}
        {agenda.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">No agenda items yet. Build the schedule! 📅</p>}
      </div>
    </div>
  );
}

function EventSpeakers({ eventId }: { eventId: string }) {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [bio, setBio] = useState("");

  const { data: speakers = [] } = useQuery({
    queryKey: ["speakers", eventId],
    queryFn: async () => {
      const { data, error } = await supabase.from("event_speakers").select("*").eq("event_id", eventId).order("created_at");
      if (error) throw error;
      return data || [];
    },
  });

  const add = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("event_speakers").insert({ event_id: eventId, name, title, bio: bio || null });
      if (error) throw error;
    },
    onSuccess: () => { setName(""); setTitle(""); setBio(""); qc.invalidateQueries({ queryKey: ["speakers", eventId] }); },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => { await supabase.from("event_speakers").delete().eq("id", id); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["speakers", eventId] }),
  });

  return (
    <div className="paper-card p-6">
      <form onSubmit={(e) => { e.preventDefault(); if (name && title) add.mutate(); }} className="space-y-3 mb-5">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Speaker name" />
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title / Company" />
        <Textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Bio (optional)" rows={2}/>
        <Button type="submit" className="rounded-full w-full"><Plus className="w-4 h-4 mr-1"/>Add speaker</Button>
      </form>
      <div className="grid sm:grid-cols-2 gap-3">
        {speakers.map((speaker) => (
          <div key={speaker.id} className="p-4 rounded-2xl bg-muted/50 group hover:bg-muted transition">
            <div className="flex justify-between items-start mb-1">
              <h3 className="font-bold">{speaker.name}</h3>
              <button onClick={() => remove.mutate(speaker.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive">
                <Trash2 className="w-4 h-4"/>
              </button>
            </div>
            <div className="text-sm text-muted-foreground mb-2">{speaker.title}</div>
            {speaker.bio && <p className="text-xs text-muted-foreground">{speaker.bio}</p>}
          </div>
        ))}
        {speakers.length === 0 && <p className="text-sm text-muted-foreground text-center py-6 col-span-full">No speakers added yet. Add some! 🎤</p>}
      </div>
    </div>
  );
}

function EventMedia({ eventId }: { eventId: string }) {
  const qc = useQueryClient();
  const [description, setDescription] = useState("");

  const { data: media = [] } = useQuery({
    queryKey: ["event-media", eventId],
    queryFn: async () => {
      const { data, error } = await supabase.from("event_media").select("*").eq("event_id", eventId).order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => { await supabase.from("event_media").delete().eq("id", id); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["event-media", eventId] }),
  });

  return (
    <div className="paper-card p-6">
      <div className="mb-6 p-4 rounded-2xl bg-muted/50 border-2 border-dashed border-border text-center">
        <div className="text-3xl mb-2">📸</div>
        <p className="text-sm text-muted-foreground">Media upload integration coming soon!</p>
        <p className="text-xs text-muted-foreground mt-1">You'll be able to upload photos, videos, and documents here to build a rich event gallery.</p>
      </div>
      {media.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-5xl mb-3">🎬</div>
          <p className="text-muted-foreground">No media added yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {media.map((item) => (
            <div key={item.id} className="relative group cursor-pointer">
              <div className="bg-muted rounded-2xl p-4 text-center">
                <div className="text-2xl">📄</div>
              </div>
              <button onClick={() => remove.mutate(item.id)} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 bg-destructive text-destructive-foreground rounded-full p-1 transition">
                <Trash2 className="w-3 h-3"/>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EventAnalytics({ eventId, event }: { eventId: string; event: any }) {
  const { data: guests = [] } = useQuery({
    queryKey: ["guests", eventId],
    queryFn: async () => {
      const { data, error } = await supabase.from("guests").select("*").eq("event_id", eventId);
      if (error) throw error;
      return data || [];
    },
  });

  const attended = guests.filter((g) => g.attended).length;
  const rsvpYes = guests.filter((g) => g.rsvp_status === "yes").length;
  const attendanceRate = guests.length > 0 ? Math.round((attended / guests.length) * 100) : 0;

  const stats = [
    { label: "Total invited", value: guests.length, color: "bg-lavender text-lavender-ink" },
    { label: "Confirmed attending", value: rsvpYes, color: "bg-mint text-mint-ink" },
    { label: "Actually attended", value: attended, color: "bg-peach text-peach-ink" },
    { label: "Attendance rate", value: `${attendanceRate}%`, color: "bg-rose text-rose-ink" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((stat, i) => (
          <div key={i} className={`${stat.color} p-4 rounded-2xl text-center shadow-sticker`}>
            <div className="text-2xl font-bold">{stat.value}</div>
            <div className="text-xs font-semibold opacity-80 mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="paper-card p-6">
        <h3 className="text-lg font-bold mb-4">📊 Event Performance Summary</h3>
        <div className="space-y-3">
          <div className="p-4 rounded-2xl bg-primary/10">
            <h4 className="font-semibold text-primary mb-2">Event highlights</h4>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>✓ {event?.title} successfully completed</li>
              <li>✓ {guests.length} total guests invited</li>
              <li>✓ {attended} guests attended ({attendanceRate}%)</li>
              <li>✓ Event date: {format(parseISO(event?.start_at), "MMMM d, yyyy")}</li>
            </ul>
          </div>
          <div className="p-4 rounded-2xl bg-secondary/50">
            <h4 className="font-semibold mb-2">💡 Insights</h4>
            <p className="text-sm text-muted-foreground">
              This event was a great opportunity to engage with your community. With {rsvpYes} confirmations and {attended} actual attendees, you built meaningful connections.
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-accent/50">
            <h4 className="font-semibold mb-2">🎯 Next steps</h4>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• Review and select media highlights for social posting</li>
              <li>• Generate post-event content for LinkedIn and social media</li>
              <li>• Send thank you emails to attendees</li>
              <li>• Update community engagement metrics</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="paper-card p-6">
        <h3 className="text-lg font-bold mb-4">📝 Post-event content ready to publish</h3>
        <div className="space-y-3">
          <div className="p-3 rounded-2xl bg-sky/20 border border-sky/30">
            <div className="text-sm font-semibold mb-1">LinkedIn Post</div>
            <p className="text-xs text-muted-foreground">A great event! Thanks to all {attended} attendees who joined us for {event?.title}. Looking forward to the next one! 🎉</p>
          </div>
          <div className="p-3 rounded-2xl bg-rose/20 border border-rose/30">
            <div className="text-sm font-semibold mb-1">Instagram Caption</div>
            <p className="text-xs text-muted-foreground">What a wonderful gathering! 🌸 Thanks everyone who made {event?.title} special. Can't wait to see you all again!</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Notes({ eventId }: { eventId: string }) {
  const qc = useQueryClient();
  const [body, setBody] = useState("");
  const key = ["notes", eventId];
  const { data: notes = [] } = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await supabase.from("notes").select("*, profiles:author_id(display_name)").eq("event_id", eventId).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  const add = useMutation({
    mutationFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      const { error } = await supabase.from("notes").insert({ event_id: eventId, body, author_id: u.user?.id ?? null });
      if (error) throw error;
    },
    onSuccess: () => { setBody(""); qc.invalidateQueries({ queryKey: key }); },
  });

  return (
    <div className="paper-card p-6">
      <form onSubmit={(e) => { e.preventDefault(); if (body.trim()) add.mutate(); }} className="mb-5">
        <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Jot down a thought, a vibe, a reminder..." rows={3}/>
        <div className="flex justify-end mt-2"><Button type="submit" className="rounded-full">Post note</Button></div>
      </form>
      <div className="grid sm:grid-cols-2 gap-4">
        {notes.map((n, i) => {
          const colors = ["bg-butter", "bg-peach", "bg-mint", "bg-sky", "bg-rose", "bg-lavender"];
          const c = colors[i % colors.length];
          const author = (n.profiles as { display_name?: string } | null)?.display_name ?? "Someone";
          return (
            <div key={n.id} className={`${c} p-4 rounded-2xl shadow-sticker ${i % 2 ? "cute-tilt-right" : "cute-tilt-left"}`}>
              <p className="whitespace-pre-wrap text-sm">{n.body}</p>
              <div className="text-[11px] mt-3 opacity-70 font-semibold">— {author} · {format(parseISO(n.created_at), "MMM d, h:mm a")}</div>
            </div>
          );
        })}
        {notes.length === 0 && <p className="text-sm text-muted-foreground text-center py-6 col-span-full">No notes yet 📝</p>}
      </div>
    </div>
  );
}

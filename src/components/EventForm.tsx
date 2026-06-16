import { useState } from "react";
import * as React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { PASTELS } from "@/lib/pastel";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";

interface EventFormProps {
  eventId?: string;
  initialData?: any;
  onSuccess: () => void;
}

export function EventForm({ eventId, initialData, onSuccess }: EventFormProps) {
  const qc = useQueryClient();
  const isEdit = !!eventId;

  // Helper function to parse dates correctly
  const parseDateTime = (isoString: string | null | undefined) => {
    if (!isoString) return { date: format(new Date(), "yyyy-MM-dd"), time: "18:00" };
    try {
      const parsed = parseISO(isoString);
      return {
        date: format(parsed, "yyyy-MM-dd"),
        time: format(parsed, "HH:mm"),
      };
    } catch {
      return { date: format(new Date(), "yyyy-MM-dd"), time: "18:00" };
    }
  };

  const startDateTimeObj = parseDateTime(initialData?.start_at);
  const endDateTimeObj = parseDateTime(initialData?.end_at);

  // Event basics
  const [title, setTitle] = useState(initialData?.title || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [location, setLocation] = useState(initialData?.location || "");
  const [startDate, setStartDate] = useState(startDateTimeObj.date);
  const [startTime, setStartTime] = useState(startDateTimeObj.time);
  const [endDate, setEndDate] = useState(initialData?.end_at ? endDateTimeObj.date : "");
  const [endTime, setEndTime] = useState(initialData?.end_at ? endDateTimeObj.time : "");
  const [color, setColor] = useState(initialData?.color || "lavender");
  const [lumaUrl, setLumaUrl] = useState(initialData?.luma_url || "");

  // Catering
  const [cateringNeeds, setCateringNeeds] = useState<{ id?: string; item: string; quantity: string; notes: string }[]>([]);
  const [cateringInput, setCateringInput] = useState({ item: "", quantity: "", notes: "" });

  // Speakers/Panelists
  const [speakers, setSpeakers] = useState<{ id?: string; name: string; title: string; bio: string }[]>([]);
  const [speakerInput, setSpeakerInput] = useState({ name: "", title: "", bio: "" });

  // Agenda
  const [agenda, setAgenda] = useState<{ id?: string; time: string; activity: string }[]>([]);
  const [agendaInput, setAgendaInput] = useState({ time: "", activity: "" });

  // Tasks/Responsibilities
  const [tasks, setTasks] = useState<{ id?: string; task: string; assignee: string; deadline: string; completed: boolean }[]>([]);
  const [taskInput, setTaskInput] = useState({ task: "", assignee: "", deadline: "" });

  // Load related data on edit
  React.useEffect(() => {
    if (isEdit && eventId) {
      const loadRelatedData = async () => {
        const [agendaRes, speakersRes, essentialsRes, requirementsRes] = await Promise.all([
          supabase.from("event_agenda").select("*").eq("event_id", eventId),
          supabase.from("event_speakers").select("*").eq("event_id", eventId),
          supabase.from("essentials").select("*").eq("event_id", eventId).eq("category", "catering"),
          supabase.from("requirements").select("*").eq("event_id", eventId),
        ]);

        if (agendaRes.data) setAgenda(agendaRes.data);
        if (speakersRes.data) setSpeakers(speakersRes.data);
        if (essentialsRes.data) {
          setCateringNeeds(
            essentialsRes.data.map((e) => ({
              id: e.id,
              item: e.label.split("(")[0].trim(),
              quantity: e.label.match(/\(([^)]+)\)/)?.[1] || "",
              notes: "",
            }))
          );
        }
        if (requirementsRes.data) {
          setTasks(
            requirementsRes.data.map((r) => {
              const match = r.label.match(/^(.+?)\s*-\s*(.+?)\s*\(Due:\s*(.+?)\)$/);
              return {
                id: r.id,
                task: match?.[1] || r.label,
                assignee: match?.[2] || "",
                deadline: match?.[3] || "",
                completed: r.done,
              };
            })
          );
        }
      };
      loadRelatedData();
    }
  }, [isEdit, eventId]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { data: u } = await supabase.auth.getUser();

      // Create proper ISO strings with timezone
      const startDateTime = `${startDate}T${startTime}:00`;
      const startAt = new Date(startDateTime).toISOString();

      const endAt = endDate && endTime
        ? new Date(`${endDate}T${endTime}:00`).toISOString()
        : null;

      console.log("Saving event with dates:", { startAt, endAt, startDate, startTime, endDate, endTime });

      const eventData = {
        title,
        description: description || null,
        location: location || null,
        start_at: startAt,
        end_at: endAt,
        color,
        luma_url: lumaUrl || null,
        ...(isEdit ? {} : { created_by: u.user?.id ?? null }),
      };

      if (isEdit) {
        console.log("Updating event", eventId, "with data:", eventData);
        const { data, error } = await supabase.from("events").update(eventData).eq("id", eventId).select();
        console.log("Update response:", { data, error });
        if (error) throw error;

        // Delete and re-insert related data for edit
        await supabase.from("event_speakers").delete().eq("event_id", eventId);
        await supabase.from("event_agenda").delete().eq("event_id", eventId);
        await supabase.from("essentials").delete().eq("event_id", eventId).eq("category", "catering");
        await supabase.from("requirements").delete().eq("event_id", eventId);

        // Re-insert updated related data
        if (speakers.length > 0) {
          await supabase.from("event_speakers").insert(
            speakers.map((s) => ({ event_id: eventId, name: s.name, title: s.title, bio: s.bio || null }))
          );
        }
        if (agenda.length > 0) {
          await supabase.from("event_agenda").insert(
            agenda.map((a) => ({ event_id: eventId, time: a.time, activity: a.activity }))
          );
        }
        if (cateringNeeds.length > 0) {
          await supabase.from("essentials").insert(
            cateringNeeds.map((c) => ({
              event_id: eventId,
              label: `${c.item} (${c.quantity})`,
              category: "catering",
              done: false,
            }))
          );
        }
        if (tasks.length > 0) {
          await supabase.from("requirements").insert(
            tasks.map((t) => ({
              event_id: eventId,
              label: `${t.task} - ${t.assignee} (Due: ${t.deadline})`,
              done: t.completed,
            }))
          );
        }
      } else {
        const { data: event, error } = await supabase.from("events").insert(eventData).select().single();
        if (error) throw error;

        // Save related data
        if (speakers.length > 0) {
          await supabase.from("event_speakers").insert(
            speakers.map((s) => ({ event_id: event.id, name: s.name, title: s.title, bio: s.bio || null }))
          );
        }
        if (agenda.length > 0) {
          await supabase.from("event_agenda").insert(
            agenda.map((a) => ({ event_id: event.id, time: a.time, activity: a.activity }))
          );
        }
        if (cateringNeeds.length > 0) {
          await supabase.from("essentials").insert(
            cateringNeeds.map((c) => ({
              event_id: event.id,
              label: `${c.item} (${c.quantity})`,
              category: "catering",
              done: false,
            }))
          );
        }
        if (tasks.length > 0) {
          await supabase.from("requirements").insert(
            tasks.map((t) => ({
              event_id: event.id,
              label: `${t.task} - ${t.assignee} (Due: ${t.deadline})`,
              done: t.completed,
            }))
          );
        }
      }
    },
    onSuccess: async () => {
      // First invalidate the specific event query
      if (isEdit && eventId) {
        await qc.invalidateQueries({ queryKey: ["event", eventId] });
      }
      // Then invalidate broader queries
      await qc.invalidateQueries({ queryKey: ["events"] });
      await qc.invalidateQueries({ queryKey: ["dashboard-events"] });

      toast.success(isEdit ? "Event updated! 🎉" : "Event created! 🎉");
      onSuccess();
    },
    onError: (e) => {
      console.error("Save error:", e);
      toast.error(e instanceof Error ? e.message : "Could not save event");
    },
  });

  return (
    <div className="space-y-6 max-h-[80vh] overflow-y-auto pr-4">
      {/* Event Basics */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold">📋 Event Details</h3>
        <div className="space-y-3">
          <div>
            <Label>Event Title *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Spring Launch Party"
              required
            />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell us about this event..."
              rows={3}
            />
          </div>
          <div>
            <Label>Venue/Location</Label>
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g., Brooklyn Studio Loft"
            />
          </div>
        </div>
      </div>

      {/* Date & Time */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold">📅 Dates & Timeline</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Start Date *</Label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </div>
          <div>
            <Label>Start Time *</Label>
            <Input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
            />
          </div>
          <div>
            <Label>End Date</Label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <div>
            <Label>End Time</Label>
            <Input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Agenda */}
      <div className="space-y-4 p-4 rounded-2xl bg-muted/30">
        <h3 className="text-lg font-bold">📅 Agenda & Schedule</h3>
        <div className="space-y-2">
          {agenda.length > 0 && (
            <div className="space-y-2 mb-4">
              {agenda.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-background">
                  <div className="flex-1">
                    <span className="font-semibold text-primary text-sm">{item.time}</span>
                    <span className="text-sm"> - {item.activity}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAgenda(agenda.filter((_, i) => i !== idx))}
                    className="text-destructive hover:bg-destructive/10 p-2 rounded ml-2 flex-shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="space-y-2">
            <Label className="text-sm">Add Agenda Item</Label>
            <div className="flex gap-2">
              <Input
                type="text"
                value={agendaInput.time}
                onChange={(e) => setAgendaInput({ ...agendaInput, time: e.target.value })}
                placeholder="e.g., 10:00 or 2:30 PM"
                className="w-32"
              />
              <Input
                value={agendaInput.activity}
                onChange={(e) => setAgendaInput({ ...agendaInput, activity: e.target.value })}
                placeholder="Activity / Session"
                className="flex-1"
              />
            </div>
            <Button
              type="button"
              onClick={() => {
                if (agendaInput.time.trim() && agendaInput.activity.trim()) {
                  setAgenda([...agenda, { time: agendaInput.time, activity: agendaInput.activity }]);
                  setAgendaInput({ time: "", activity: "" });
                  toast.success("Agenda item added! ✅");
                } else {
                  toast.error("Please fill time and activity");
                }
              }}
              className="w-full rounded-full"
            >
              <Plus className="w-4 h-4 mr-2" /> Add Agenda Item
            </Button>
          </div>
        </div>
      </div>

      {/* Speakers */}
      <div className="space-y-4 p-4 rounded-2xl bg-muted/30">
        <h3 className="text-lg font-bold">🎤 Speakers & Panelists</h3>
        <div className="space-y-2">
          {speakers.length > 0 && (
            <div className="space-y-2 mb-4">
              {speakers.map((speaker, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-background">
                  <div className="flex justify-between items-start mb-1">
                    <div className="font-semibold">{speaker.name}</div>
                    <button
                      type="button"
                      onClick={() => setSpeakers(speakers.filter((_, i) => i !== idx))}
                      className="text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="text-sm text-muted-foreground">{speaker.title}</div>
                  {speaker.bio && <div className="text-xs text-muted-foreground mt-1">{speaker.bio}</div>}
                </div>
              ))}
            </div>
          )}
          <div className="space-y-2 pt-2">
            <Input
              value={speakerInput.name}
              onChange={(e) => setSpeakerInput({ ...speakerInput, name: e.target.value })}
              placeholder="Speaker name"
            />
            <Input
              value={speakerInput.title}
              onChange={(e) => setSpeakerInput({ ...speakerInput, title: e.target.value })}
              placeholder="Title / Company"
            />
            <Input
              value={speakerInput.bio}
              onChange={(e) => setSpeakerInput({ ...speakerInput, bio: e.target.value })}
              placeholder="Bio (optional)"
            />
            <Button
              type="button"
              onClick={() => {
                if (speakerInput.name && speakerInput.title) {
                  setSpeakers([...speakers, { ...speakerInput }]);
                  setSpeakerInput({ name: "", title: "", bio: "" });
                } else {
                  toast.error("Please fill name and title");
                }
              }}
              className="w-full rounded-full"
            >
              <Plus className="w-4 h-4 mr-1" /> Add Speaker
            </Button>
          </div>
        </div>
      </div>

      {/* Catering */}
      <div className="space-y-4 p-4 rounded-2xl bg-muted/30">
        <h3 className="text-lg font-bold">🍰 Catering Requirements</h3>
        <div className="space-y-2">
          {cateringNeeds.length > 0 && (
            <div className="space-y-2 mb-4">
              {cateringNeeds.map((item, idx) => (
                <div key={idx} className="p-2 rounded-lg bg-background flex justify-between items-center">
                  <div>
                    <div className="font-semibold">{item.item}</div>
                    <div className="text-sm text-muted-foreground">Qty: {item.quantity}</div>
                    {item.notes && <div className="text-xs text-muted-foreground">{item.notes}</div>}
                  </div>
                  <button
                    type="button"
                    onClick={() => setCateringNeeds(cateringNeeds.filter((_, i) => i !== idx))}
                    className="text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="grid grid-cols-2 gap-2 pt-2">
            <Input
              value={cateringInput.item}
              onChange={(e) => setCateringInput({ ...cateringInput, item: e.target.value })}
              placeholder="Item"
            />
            <Input
              value={cateringInput.quantity}
              onChange={(e) => setCateringInput({ ...cateringInput, quantity: e.target.value })}
              placeholder="Qty"
            />
            <Input
              value={cateringInput.notes}
              onChange={(e) => setCateringInput({ ...cateringInput, notes: e.target.value })}
              placeholder="Notes"
              className="col-span-2"
            />
            <Button
              type="button"
              onClick={() => {
                if (cateringInput.item && cateringInput.quantity) {
                  setCateringNeeds([...cateringNeeds, { ...cateringInput }]);
                  setCateringInput({ item: "", quantity: "", notes: "" });
                } else {
                  toast.error("Please fill item and quantity");
                }
              }}
              className="col-span-2 rounded-full"
            >
              <Plus className="w-4 h-4 mr-1" /> Add Item
            </Button>
          </div>
        </div>
      </div>

      {/* Tasks & Responsibilities */}
      <div className="space-y-4 p-4 rounded-2xl bg-muted/30">
        <h3 className="text-lg font-bold">✅ Tasks & Responsibilities</h3>
        <div className="space-y-2">
          {tasks.length > 0 && (
            <div className="space-y-2 mb-4">
              {tasks.map((task, idx) => (
                <div key={idx} className="p-2 rounded-lg bg-background">
                  <div className="flex justify-between items-start mb-1">
                    <div className="font-semibold">{task.task}</div>
                    <button
                      type="button"
                      onClick={() => setTasks(tasks.filter((_, i) => i !== idx))}
                      className="text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {task.assignee} • Due: {task.deadline}
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="space-y-2 pt-2">
            <Input
              value={taskInput.task}
              onChange={(e) => setTaskInput({ ...taskInput, task: e.target.value })}
              placeholder="Task / Responsibility"
            />
            <Input
              value={taskInput.assignee}
              onChange={(e) => setTaskInput({ ...taskInput, assignee: e.target.value })}
              placeholder="Assigned to (person/team)"
            />
            <Input
              type="date"
              value={taskInput.deadline}
              onChange={(e) => setTaskInput({ ...taskInput, deadline: e.target.value })}
              placeholder="Deadline"
            />
            <Button
              type="button"
              onClick={() => {
                if (taskInput.task && taskInput.assignee && taskInput.deadline) {
                  setTasks([...tasks, { ...taskInput, completed: false }]);
                  setTaskInput({ task: "", assignee: "", deadline: "" });
                } else {
                  toast.error("Please fill task, assignee, and deadline");
                }
              }}
              className="w-full rounded-full"
            >
              <Plus className="w-4 h-4 mr-1" /> Add Task
            </Button>
          </div>
        </div>
      </div>

      {/* Color & Other */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold">🎨 Event Color & Links</h3>
        <div>
          <Label>Event Color</Label>
          <div className="flex gap-2 flex-wrap mt-2">
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
        <div>
          <Label>Luma URL (optional)</Label>
          <Input
            value={lumaUrl}
            onChange={(e) => setLumaUrl(e.target.value)}
            placeholder="https://lu.ma/..."
          />
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex gap-2 pt-4 pb-4">
        <Button
          type="button"
          onClick={() => {
            console.log("Submit clicked, current state:", { title, startDate, startTime, endDate, endTime });
            saveMutation.mutate();
          }}
          disabled={saveMutation.isPending || !title || !startDate || !startTime}
          className="flex-1 rounded-full"
          size="lg"
        >
          {saveMutation.isPending ? "Saving..." : isEdit ? "Update Event" : "Create Event"}
        </Button>
      </div>
    </div>
  );
}

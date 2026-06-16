import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO, isFuture, isPast, startOfMonth, endOfMonth } from "date-fns";
import { pastel } from "@/lib/pastel";
import { Button } from "@/components/ui/button";

// Lives under the _authenticated layout, so the AppShell (sidebar + sign out)
// wraps it and the layout's beforeLoad already redirects guests to /auth.
export const Route = createFileRoute("/_authenticated/")({
  component: DashboardPage,
});

function DashboardPage() {
  const { data: events = [] } = useQuery({
    queryKey: ["dashboard-events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .order("start_at")
        .limit(6);
      if (error) throw error;
      return (data || []).filter((e) => isFuture(parseISO(e.start_at)));
    },
  });

  const { data: guests = [] } = useQuery({
    queryKey: ["dashboard-guests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("guests")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data || [];
    },
  });

  const { data: posts = [] } = useQuery({
    queryKey: ["dashboard-posts"],
    queryFn: async () => {
      const now = new Date();
      const start = startOfMonth(now);
      const end = endOfMonth(now);
      const { data, error } = await supabase
        .from("content_posts")
        .select("*")
        .gte("scheduled_at", start.toISOString())
        .lte("scheduled_at", end.toISOString())
        .limit(4);
      if (error) throw error;
      return data || [];
    },
  });

  const { data: ideas = [] } = useQuery({
    queryKey: ["dashboard-ideas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ideas")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(3);
      if (error) throw error;
      return data || [];
    },
  });

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto">
      <header className="mb-10">
        <div className="sticker bg-primary text-primary-foreground mb-3">🌸 Welcome to Bloom</div>
        <h1 className="text-5xl md:text-6xl font-bold mb-2">Your event & content hub</h1>
        <p className="text-lg text-muted-foreground">Unified platform for events, content, and community management.</p>
      </header>

      <div className="grid md:grid-cols-4 gap-4 mb-10">
        <StatCard label="Upcoming events" value={events.length} color="bg-lavender text-lavender-ink" />
        <StatCard label="Community members" value={guests.length} color="bg-mint text-mint-ink" />
        <StatCard label="Scheduled posts" value={posts.length} color="bg-peach text-peach-ink" />
        <StatCard label="Ideas in jar" value={ideas.length} color="bg-butter text-butter-ink" />
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-10">
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Upcoming events</h2>
            <Link to="/events">
              <Button variant="outline" className="rounded-full">View all</Button>
            </Link>
          </div>
          {events.length === 0 ? (
            <div className="paper-card p-6 text-center">
              <div className="text-4xl mb-2">📅</div>
              <p className="text-muted-foreground">No upcoming events</p>
            </div>
          ) : (
            <div className="space-y-3">
              {events.slice(0, 3).map((e) => {
                const p = pastel(e.color);
                return (
                  <Link key={e.id} to="/events/$id" params={{ id: e.id }}
                    className={`${p.bg} ${p.text} p-4 rounded-2xl hover:shadow-md transition cursor-pointer block`}>
                    <div className="text-sm font-bold opacity-80 mb-1">{format(parseISO(e.start_at), "MMM d")}</div>
                    <div className="font-bold">{e.title}</div>
                    {e.location && <div className="text-xs opacity-70 mt-1">📍 {e.location}</div>}
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Content this month</h2>
            <Link to="/content">
              <Button variant="outline" className="rounded-full">View calendar</Button>
            </Link>
          </div>
          {posts.length === 0 ? (
            <div className="paper-card p-6 text-center">
              <div className="text-4xl mb-2">📝</div>
              <p className="text-muted-foreground">No scheduled posts</p>
            </div>
          ) : (
            <div className="space-y-3">
              {posts.slice(0, 3).map((post) => (
                <div key={post.id} className="p-4 rounded-2xl bg-muted/50 hover:bg-muted transition">
                  <div className="text-xs font-bold text-primary mb-1">{format(parseISO(post.scheduled_at), "MMM d, h:mm a")}</div>
                  <p className="text-sm line-clamp-2">{post.content}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Recent guests</h2>
            <Link to="/guests">
              <Button variant="outline" className="rounded-full">View all</Button>
            </Link>
          </div>
          {guests.length === 0 ? (
            <div className="paper-card p-6 text-center">
              <div className="text-4xl mb-2">👥</div>
              <p className="text-muted-foreground">No guests yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {guests.slice(0, 4).map((g) => (
                <div key={g.id} className="p-3 rounded-xl bg-muted/50 hover:bg-muted transition">
                  <div className="font-semibold text-sm">{g.name}</div>
                  {g.email && <div className="text-xs text-muted-foreground">{g.email}</div>}
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Brainstorm jar</h2>
            <Link to="/ideas">
              <Button variant="outline" className="rounded-full">View all</Button>
            </Link>
          </div>
          {ideas.length === 0 ? (
            <div className="paper-card p-6 text-center">
              <div className="text-4xl mb-2">💡</div>
              <p className="text-muted-foreground">No ideas yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {ideas.slice(0, 3).map((idea, i) => {
                const p = pastel(idea.color);
                return (
                  <div key={idea.id} className={`${p.bg} ${p.text} p-3 rounded-xl`}>
                    <div className="font-bold text-sm">{idea.title}</div>
                    {idea.description && <p className="text-xs opacity-80 mt-1 line-clamp-2">{idea.description}</p>}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      <section className="mt-10 paper-card p-8 text-center">
        <div className="text-5xl mb-3">✨</div>
        <h2 className="text-2xl font-bold mb-2">Let's build amazing things together</h2>
        <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
          Bloom is your unified workspace for events, content, and community. Start planning your next event, schedule content, and grow your community all in one place.
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          <Link to="/events">
            <Button className="rounded-full">🗓️ Create Event</Button>
          </Link>
          <Link to="/content">
            <Button variant="outline" className="rounded-full">📝 Plan Content</Button>
          </Link>
          <Link to="/guests">
            <Button variant="outline" className="rounded-full">👥 Manage Guests</Button>
          </Link>
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <div className={`${color} p-6 rounded-3xl shadow-sticker text-center`}>
      <div className="text-3xl font-bold mb-1">{value}</div>
      <div className="text-xs font-semibold opacity-80">{label}</div>
    </div>
  );
}

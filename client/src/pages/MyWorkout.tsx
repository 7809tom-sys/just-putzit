import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, Trash2, CheckCircle2, Dumbbell, ChevronLeft, Pencil } from "lucide-react";
import { useLocation } from "wouter";
import { normalizeWorkoutDay } from "../../../shared/workoutDay";

// ─── Day order & colours ──────────────────────────────────────────────────────
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
type Day = typeof DAYS[number];

const DAY_COLORS: Record<Day, string> = {
  Mon: "bg-blue-500/15 border-blue-500/30 text-blue-400",
  Tue: "bg-purple-500/15 border-purple-500/30 text-purple-400",
  Wed: "bg-orange-500/15 border-orange-500/30 text-orange-400",
  Thu: "bg-pink-500/15 border-pink-500/30 text-pink-400",
  Fri: "bg-emerald-500/15 border-emerald-500/30 text-emerald-400",
  Sat: "bg-yellow-500/15 border-yellow-500/30 text-yellow-400",
  Sun: "bg-red-500/15 border-red-500/30 text-red-400",
};

const MUSCLE_GROUPS = [
  "Full Body", "Chest", "Back", "Shoulders", "Arms", "Core & Stability",
  "Legs & Glutes", "Legs & Core", "Posterior Chain", "Cardio", "Flexibility",
  "Chest, Shoulders, Triceps", "Other",
];

// ─── Add Exercise Dialog ──────────────────────────────────────────────────────
function AddExerciseDialog({ onAdded }: { onAdded: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    muscleGroup: "Full Body",
    sets: "3",
    reps: "10",
    dayOfWeek: "" as Day | "",
    notes: "",
  });

  const utils = trpc.useUtils();
  const addMutation = trpc.workout.addExercise.useMutation({
    onSuccess: () => {
      toast.success("Exercise added to your program! 💪");
      utils.workout.listExercises.invalidate();
      setOpen(false);
      setForm({ name: "", muscleGroup: "Full Body", sets: "3", reps: "10", dayOfWeek: "", notes: "" });
      onAdded();
    },
    onError: (e) => toast.error(e.message),
  });

  const handleSubmit = () => {
    if (!form.name.trim()) { toast.error("Exercise name is required"); return; }
    addMutation.mutate({
      name: form.name.trim(),
      muscleGroup: form.muscleGroup,
      sets: parseInt(form.sets) || 3,
      reps: form.reps || "10",
      notes: form.notes || undefined,
      dayOfWeek: normalizeWorkoutDay(form.dayOfWeek),
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-full gap-2">
          <Plus className="w-4 h-4" /> Add Exercise
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Add Your Own Exercise</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div>
            <Label>Exercise Name *</Label>
            <Input
              placeholder="e.g. Barbell Row, Jump Rope, Yoga Flow…"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="mt-1"
            />
          </div>
          <div>
            <Label>Muscle Group</Label>
            <Select value={form.muscleGroup} onValueChange={v => setForm(f => ({ ...f, muscleGroup: v }))}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MUSCLE_GROUPS.map(g => (
                  <SelectItem key={g} value={g}>{g}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Sets</Label>
              <Input
                type="number" min={1} max={20}
                value={form.sets}
                onChange={e => setForm(f => ({ ...f, sets: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Reps / Duration</Label>
              <Input
                placeholder="10, 8-12, 30s…"
                value={form.reps}
                onChange={e => setForm(f => ({ ...f, reps: e.target.value }))}
                className="mt-1"
              />
            </div>
          </div>
          <div>
            <Label>Day of Week (optional)</Label>
            <Select value={form.dayOfWeek || "any"} onValueChange={v => setForm(f => ({ ...f, dayOfWeek: v === "any" ? "" : v as Day }))}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Any day" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any day</SelectItem>
                {DAYS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Notes (optional)</Label>
            <Textarea
              placeholder="Form tips, equipment needed…"
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              className="mt-1 resize-none"
              rows={2}
            />
          </div>
          <Button
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white"
            onClick={handleSubmit}
            disabled={addMutation.isPending}
          >
            {addMutation.isPending ? "Adding…" : "Add to My Program"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Exercise Card ────────────────────────────────────────────────────────────
function ExerciseCard({
  exercise,
  onDelete,
  onLog,
}: {
  exercise: {
    id: number; name: string; muscleGroup: string; sets: number; reps: string;
    notes: string | null; isCustom: boolean; dayOfWeek: string | null;
  };
  onDelete: (id: number) => void;
  onLog: (id: number) => void;
}) {
  const [logged, setLogged] = useState(false);
  const day = exercise.dayOfWeek as Day | null;

  const handleLog = () => {
    setLogged(true);
    onLog(exercise.id);
    setTimeout(() => setLogged(false), 2000);
  };

  return (
    <div className={`group relative flex overflow-hidden rounded-2xl border bg-card transition-all duration-200
      hover:-translate-y-0.5 hover:shadow-md
      ${logged ? "border-emerald-500/60 shadow-[0_4px_16px_rgba(16,185,129,0.2)]" : "border-border"}`}
    >
      {/* Day accent bar */}
      {day && (
        <div className={`w-1 flex-shrink-0 rounded-l-2xl ${
          day === "Mon" ? "bg-blue-500" :
          day === "Tue" ? "bg-purple-500" :
          day === "Wed" ? "bg-orange-500" :
          day === "Thu" ? "bg-pink-500" :
          day === "Fri" ? "bg-emerald-500" :
          day === "Sat" ? "bg-yellow-500" : "bg-red-500"
        }`} />
      )}

      <div className="flex-1 p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-[15px] text-foreground leading-snug">{exercise.name}</h3>
              {exercise.isCustom && (
                <Badge className="text-[10px] bg-emerald-500/15 text-emerald-400 border-emerald-500/30">Custom</Badge>
              )}
            </div>
            <p className="text-xs text-orange-400 mt-0.5 font-medium">{exercise.muscleGroup}</p>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {day && (
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${DAY_COLORS[day]}`}>{day}</span>
            )}
          </div>
        </div>

        {/* Sets × Reps */}
        <div className="flex items-center gap-3 mb-3">
          <span className="text-sm font-semibold text-foreground">{exercise.sets} sets</span>
          <span className="text-muted-foreground text-xs">×</span>
          <span className="text-sm font-semibold text-foreground">{exercise.reps} reps</span>
        </div>

        {exercise.notes && (
          <p className="text-xs text-muted-foreground mb-3 italic">{exercise.notes}</p>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          <Button
            size="sm"
            variant="ghost"
            className={`text-xs gap-1.5 transition-colors ${
              logged
                ? "text-emerald-400 bg-emerald-500/10"
                : "text-muted-foreground hover:text-emerald-400 hover:bg-emerald-500/10"
            }`}
            onClick={handleLog}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            {logged ? "Logged!" : "Log Set"}
          </Button>
          {exercise.isCustom && (
            <Button
              size="sm"
              variant="ghost"
              className="text-xs text-muted-foreground hover:text-red-400 hover:bg-red-500/10 gap-1"
              onClick={() => onDelete(exercise.id)}
            >
              <Trash2 className="w-3.5 h-3.5" /> Remove
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function MyWorkout() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [activeDay, setActiveDay] = useState<Day | "all">("all");

  const { data: exercises, isLoading, refetch } = trpc.workout.listExercises.useQuery();
  const utils = trpc.useUtils();

  const deleteMutation = trpc.workout.deleteExercise.useMutation({
    onSuccess: () => {
      toast.success("Exercise removed");
      utils.workout.listExercises.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const logMutation = trpc.workout.logSet.useMutation({
    onSuccess: () => toast.success("Set logged! Keep it up 🔥"),
    onError: (e) => toast.error(e.message),
  });

  const handleLog = (exerciseId: number) => {
    const ex = exercises?.find(e => e.id === exerciseId);
    if (!ex) return;
    logMutation.mutate({ exerciseId, setsCompleted: ex.sets });
  };

  const filtered = exercises?.filter(ex =>
    activeDay === "all" ? true : ex.dayOfWeek === activeDay
  ) ?? [];

  // Count exercises per day for the day pills
  const dayCounts = DAYS.reduce((acc, d) => {
    acc[d] = exercises?.filter(e => e.dayOfWeek === d).length ?? 0;
    return acc;
  }, {} as Record<Day, number>);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div
        className="relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #064e3b 0%, #065f46 60%, #047857 100%)" }}
      >
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(circle at 70% 50%, #34d399 0%, transparent 60%)" }} />
        <div className="relative px-4 pt-6 pb-8 max-w-lg mx-auto">
          {/* Back */}
          <button
            onClick={() => navigate("/community")}
            className="flex items-center gap-1 text-emerald-300 text-sm mb-4 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Community
          </button>

          <span className="text-emerald-300 text-[11px] font-bold uppercase tracking-widest block mb-1">Solo Fitness</span>
          <h1 className="text-3xl font-extrabold text-white mb-2">
            My Workout<br />
            <span className="text-emerald-300">Program.</span>
          </h1>
          <p className="text-white/75 text-sm mb-5">
            Your personal exercise library. Follow the starter plan or build your own.
          </p>

          {/* Stats */}
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-xl font-extrabold text-white">{exercises?.length ?? 0}</div>
              <div className="text-[11px] text-emerald-200 uppercase tracking-wide">Exercises</div>
            </div>
            <div className="w-px h-6 bg-white/20" />
            <div className="text-center">
              <div className="text-xl font-extrabold text-white">
                {DAYS.filter(d => dayCounts[d] > 0).length}
              </div>
              <div className="text-[11px] text-emerald-200 uppercase tracking-wide">Active Days</div>
            </div>
            <div className="w-px h-6 bg-white/20" />
            <div className="text-center">
              <div className="text-xl font-extrabold text-white">
                {exercises?.filter(e => e.isCustom).length ?? 0}
              </div>
              <div className="text-[11px] text-emerald-200 uppercase tracking-wide">Custom</div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6 max-w-lg mx-auto">
        {/* Day filter + Add button */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-1.5 overflow-x-auto pb-1 flex-1 mr-3">
            <button
              onClick={() => setActiveDay("all")}
              className={`flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
                activeDay === "all"
                  ? "bg-emerald-500 text-white border-emerald-500"
                  : "bg-card border-border text-muted-foreground hover:border-emerald-500/40"
              }`}
            >
              All
            </button>
            {DAYS.map(d => (
              <button
                key={d}
                onClick={() => setActiveDay(d)}
                className={`flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
                  activeDay === d
                    ? `${DAY_COLORS[d]} border-current`
                    : "bg-card border-border text-muted-foreground hover:border-emerald-500/40"
                }`}
              >
                {d}
                {dayCounts[d] > 0 && (
                  <span className="ml-1 text-[10px] opacity-70">{dayCounts[d]}</span>
                )}
              </button>
            ))}
          </div>
          <AddExerciseDialog onAdded={refetch} />
        </div>

        {/* Exercise list */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-28 bg-muted/30 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-3">🏋️</div>
            <h3 className="font-bold text-lg mb-1">
              {activeDay === "all" ? "No exercises yet" : `No exercises on ${activeDay}`}
            </h3>
            <p className="text-muted-foreground text-sm mb-4">
              {activeDay === "all"
                ? "Add your first exercise to get started."
                : `Add an exercise and assign it to ${activeDay}.`}
            </p>
            <AddExerciseDialog onAdded={refetch} />
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(ex => (
              <ExerciseCard
                key={ex.id}
                exercise={ex}
                onDelete={(id) => deleteMutation.mutate({ id })}
                onLog={handleLog}
              />
            ))}
          </div>
        )}

        {/* Gym Buddy upsell */}
        {exercises && exercises.length > 0 && (
          <div
            className="mt-8 rounded-2xl overflow-hidden cursor-pointer group border border-orange-500/30"
            onClick={() => navigate("/gym-buddy")}
            style={{ background: "linear-gradient(135deg, #431407 0%, #7c2d12 100%)" }}
          >
            <div className="px-5 py-4 flex items-center gap-4">
              <div className="text-3xl">🏋️</div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-white text-sm">Ready for a Gym Buddy?</h3>
                <p className="text-white/70 text-xs mt-0.5">
                  Find a workout partner at your gym and crush these exercises together.
                </p>
              </div>
              <span className="text-orange-400 text-xs font-semibold flex-shrink-0">Find One →</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

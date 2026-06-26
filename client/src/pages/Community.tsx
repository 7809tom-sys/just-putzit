import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Users, Plus, Search, BookOpen, Mountain, ChefHat, Music, Palette, Dumbbell, Globe, Gamepad2 } from "lucide-react";
import Navbar from "@/components/Navbar";

const GROUP_CATEGORIES = [
  { id: "all", label: "All Groups", icon: <Users className="w-4 h-4" /> },
  { id: "book_club", label: "Book Club", icon: <BookOpen className="w-4 h-4" /> },
  { id: "hiking", label: "Hiking", icon: <Mountain className="w-4 h-4" /> },
  { id: "cooking", label: "Cooking", icon: <ChefHat className="w-4 h-4" /> },
  { id: "music", label: "Music", icon: <Music className="w-4 h-4" /> },
  { id: "arts", label: "Arts", icon: <Palette className="w-4 h-4" /> },
  { id: "fitness", label: "Fitness", icon: <Dumbbell className="w-4 h-4" /> },
  { id: "travel", label: "Travel", icon: <Globe className="w-4 h-4" /> },
  { id: "gaming", label: "Gaming", icon: <Gamepad2 className="w-4 h-4" /> },
];

const CATEGORY_EMOJIS: Record<string, string> = {
  book_club: "📚", hiking: "🥾", cooking: "👨‍🍳", sports: "⚽",
  arts: "🎨", music: "🎵", gaming: "🎮", travel: "✈️",
  fitness: "💪", social: "🤝", other: "🌟",
};

export default function Community() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [newGroup, setNewGroup] = useState({ name: "", description: "", category: "social", city: "" });

  const { data: groups, refetch } = trpc.community.getGroups.useQuery({
    // category filter not supported server-side yet, filter client-side
  });

  const joinMutation = trpc.community.joinGroup.useMutation({
    onSuccess: () => {
      toast.success("You've joined the group! Sally will introduce you to the other members. 🎉");
      refetch();
    },
  });

  const createMutation = trpc.community.createGroup.useMutation({
    onSuccess: () => {
      toast.success("Group created! Sally will help find members for you. ✨");
      setCreateOpen(false);
      setNewGroup({ name: "", description: "", category: "social", city: "" });
      refetch();
    },
  });

  const filteredGroups = groups?.filter(g =>
    searchQuery === "" ||
    g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (g.description ?? "").toLowerCase().includes(searchQuery.toLowerCase())
  ) ?? [];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Header */}
      <div className="bg-gradient-to-br from-secondary/10 via-accent/10 to-primary/10 py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 font-display mb-2">Community Groups</h1>
              <p className="text-gray-600">
                Find your people. Join a group, show up, and stop putzing around alone.
              </p>
            </div>
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90 text-white rounded-full flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Start a Group
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle className="font-display">Start a New Community Group</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Group Name</label>
                    <Input
                      placeholder="e.g. Saturday Morning Hikers"
                      value={newGroup.name}
                      onChange={e => setNewGroup(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Description</label>
                    <Textarea
                      placeholder="What is this group about? What will you do together?"
                      value={newGroup.description}
                      onChange={e => setNewGroup(prev => ({ ...prev, description: e.target.value }))}
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Category</label>
                    <select
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                      value={newGroup.category}
                      onChange={e => setNewGroup(prev => ({ ...prev, category: e.target.value }))}
                    >
                      {["book_club","hiking","cooking","sports","arts","music","gaming","travel","fitness","social","other"].map(cat => (
                        <option key={cat} value={cat}>{cat.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase())}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">City</label>
                    <Input
                      placeholder="e.g. Austin, TX"
                      value={newGroup.city}
                      onChange={e => setNewGroup(prev => ({ ...prev, city: e.target.value }))}
                    />
                  </div>
                  <Button
                    className="w-full bg-primary hover:bg-primary/90 text-white rounded-full"
                    onClick={() => createMutation.mutate({
                      name: newGroup.name,
                      description: newGroup.description,
                      category: newGroup.category as "book_club" | "hiking" | "cooking" | "sports" | "arts" | "music" | "gaming" | "travel" | "fitness" | "social" | "other",
                      city: newGroup.city,
                    })}
                    disabled={!newGroup.name || createMutation.isPending}
                  >
                    {createMutation.isPending ? "Creating..." : "Create Group 🎉"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            placeholder="Search groups..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10 h-12 rounded-xl border-gray-200"
          />
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-8">
          {GROUP_CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                selectedCategory === cat.id
                  ? "bg-secondary text-white shadow-md"
                  : "bg-white text-gray-600 border border-gray-200 hover:border-secondary/40"
              }`}
            >
              {cat.icon}
              {cat.label}
            </button>
          ))}
        </div>

        {/* Groups Grid */}
        {filteredGroups.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
            <div className="text-6xl mb-4">👥</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">No Groups Yet in Your Area</h3>
            <p className="text-gray-500 mb-6 max-w-sm mx-auto">
              Be the first to start a community group! Sally will help find members who share your interests.
            </p>
            <Button
              className="bg-primary hover:bg-primary/90 text-white rounded-full"
              onClick={() => setCreateOpen(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Start the First Group
            </Button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredGroups.map(group => (
              <Card key={group.id} className="border border-gray-100 hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="text-3xl">{CATEGORY_EMOJIS[group.category] ?? "🌟"}</div>
                    <Badge variant="secondary" className="text-xs">
                      {group.category.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase())}
                    </Badge>
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">{group.name}</h3>
                  {group.description && (
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">{group.description}</p>
                  )}
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <Users className="w-4 h-4" />
                      <span>Community Group</span>
                    </div>
                    {group.city && (
                      <span className="text-xs text-gray-400">📍 {group.city}</span>
                    )}
                  </div>
                  <Button
                    className="w-full mt-4 bg-secondary hover:bg-secondary/90 text-white rounded-full"
                    size="sm"
                    onClick={() => joinMutation.mutate({ groupId: group.id })}
                    disabled={joinMutation.isPending}
                  >
                    Join Group →
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

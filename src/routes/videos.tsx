import { createFileRoute } from "@/lib/router-compat";
import { useEffect, useState } from "react";
import { Loader2, PlayCircle, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/supabaseClient";
import { getCategory } from "@/lib/categories";

export const Route = createFileRoute("/videos")({
  head: () => ({ meta: [{ title: "Videos — GuideMe" }] }),
  component: VideosPage,
});

const CATEGORIES = [
  "all",
  "academic",
  "career",
  "business",
  "technology",
  "health",
  "personal",
  "creative",
  "finance",
  "legal",
  "leadership",
  "language",
  "engineering",
];

interface VideoItem {
  id: string;
  embed_url: string;
  title: string | null;
  video_type: string;
  created_at: string;
  mentor_profiles: {
    id: string;
    category: string | null;
    profiles: {
      full_name: string;
      is_verified: boolean | null;
    };
  };
}

function VideosPage() {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchVideos();
  }, []);

  async function fetchVideos() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("mentor_videos")
        .select(`
          *,
          mentor_profiles (
            id,
            category,
            profiles (
              full_name,
              is_verified
            )
          )
        `)
        .order("created_at", { ascending: false });

      if (!error) {
        setVideos(data || []);
      }
    } catch (err) {
      console.error("Error fetching videos:", err);
    } finally {
      setLoading(false);
    }
  }

  const filtered = videos.filter((v) => {
    const matchesCategory =
      selectedCategory === "all" ||
      v.mentor_profiles?.category === selectedCategory;

    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      (v.title ?? "").toLowerCase().includes(query) ||
      (v.mentor_profiles?.profiles?.full_name ?? "")
        .toLowerCase()
        .includes(query) ||
      (v.mentor_profiles?.category ?? "").toLowerCase().includes(query);

    return matchesCategory && matchesSearch;
  });

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Videos</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Learn from our verified mentors through their curated video content.
        </p>
      </div>

      {/* Search Bar */}
      <div className="mb-4 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search videos by title, mentor name, or category..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-xl border bg-background py-2.5 pl-9 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
          >
            Clear
          </button>
        )}
      </div>

      {/* Category Filter */}
      <div className="mb-6 flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => {
          const category = getCategory(cat);
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium capitalize transition ${
                selectedCategory === cat
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {cat === "all" ? "All Categories" : category?.label ?? cat}
            </button>
          );
        })}
      </div>

      {/* Videos Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <PlayCircle className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-sm font-medium">No videos yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            {searchQuery
              ? `No videos found for "${searchQuery}". Try a different search.`
              : selectedCategory === "all"
              ? "Verified mentors haven't added any videos yet. Check back soon."
              : `No videos in the ${selectedCategory} category yet.`}
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((v) => {
            const mentorName =
              v.mentor_profiles?.profiles?.full_name ?? "Mentor";
            const category = getCategory(
              v.mentor_profiles?.category ?? ""
            );
            const CatIcon = category?.icon;

            return (
              <div
                key={v.id}
                className="rounded-xl border bg-card overflow-hidden shadow-sm hover:shadow-md transition"
              >
                {/* Embedded Video */}
                <div className="aspect-video">
                  <iframe
                    src={v.embed_url}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title={v.title ?? `Video by ${mentorName}`}
                  />
                </div>

                {/* Video Info */}
                <div className="p-3">
                  {v.title && (
                    <p className="text-sm font-semibold line-clamp-2 mb-1">
                      {v.title}
                    </p>
                  )}
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs text-muted-foreground">
                      {mentorName}
                    </p>
                    {category && (
                      <Badge
                        variant="secondary"
                        className="gap-1 text-[10px]"
                      >
                        {CatIcon && <CatIcon className="h-2.5 w-2.5" />}
                        {category.label}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
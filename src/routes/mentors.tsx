import { createFileRoute, Link } from "@/lib/router-compat";
import { useMemo, useState, useEffect } from "react";
import { Search, Star, Users, BadgeCheck, Loader2 } from "lucide-react";
import { z } from "zod";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MENTOR_CATEGORIES, getCategory } from "@/lib/categories";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/supabaseClient";

const searchSchema = z.object({
  category: z.string().optional(),
});

export const Route = createFileRoute("/mentors")({
  head: () => ({ meta: [{ title: "Mentors — GuideMe" }] }),
  validateSearch: searchSchema,
  component: MentorsPage,
});

interface MentorData {
  id: string;
  user_id: string;
  bio: string | null;
  category: string | null;
  expertise_areas: string[] | null;
  initial_session_price: number | null;
  followup_session_price: number | null;
  is_free_first_session: boolean | null;
  average_rating: number | null;
  is_available: boolean | null;
  years_of_experience: number | null;
  session_language: string | null;
  portfolio_url: string | null;
  profiles: {
    full_name: string;
    profile_picture_url: string | null;
    is_verified: boolean | null;
  };
}

function MentorsPage() {
  const { category: initialCategory } = Route.useSearch();
  const { user } = useAuth();
  const isMentor = user?.role === "mentor";

  const [mentors, setMentors] = useState<MentorData[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [maxPrice, setMaxPrice] = useState<number[]>([1000]);
  const [minRating, setMinRating] = useState(0);
  const [selectedCats, setSelectedCats] = useState<string[]>(
    initialCategory ? [initialCategory] : [],
  );

  useEffect(() => {
    fetchMentors();
  }, []);

  useEffect(() => {
    if (initialCategory && !selectedCats.includes(initialCategory)) {
      setSelectedCats([initialCategory]);
    }
  }, [initialCategory]);

  async function fetchMentors() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("mentor_profiles")
        .select(`
          *,
          profiles (
            full_name,
            profile_picture_url,
            is_verified
          )
        `)
        .eq("is_available", true)
        .order("average_rating", { ascending: false });

      if (error) {
        console.error("Error fetching mentors:", error);
      } else {
        setMentors(data || []);
      }
    } catch (err) {
      console.error("Failed to fetch mentors:", err);
    } finally {
      setLoading(false);
    }
  }

  const toggleCat = (c: string) =>
    setSelectedCats((s) =>
      s.includes(c) ? s.filter((x) => x !== c) : [...s, c],
    );

  const filtered = useMemo(() => {
    return mentors.filter((m) => {
      const price = m.initial_session_price ?? 0;
      const rating = m.average_rating ?? 0;

      if (price > maxPrice[0]) return false;
      if (rating < minRating) return false;
      if (selectedCats.length > 0 && !selectedCats.includes(m.category ?? "")) return false;

      if (query.trim()) {
        const q = query.toLowerCase();
        const nameMatch = m.profiles.full_name.toLowerCase().includes(q);
        const bioMatch = (m.bio ?? "").toLowerCase().includes(q);
        const catMatch = (m.category ?? "").toLowerCase().includes(q);
        const expertiseMatch = (m.expertise_areas ?? []).some(
          (e) => e.toLowerCase().includes(q)
        );
        if (!nameMatch && !bioMatch && !catMatch && !expertiseMatch) return false;
      }

      return true;
    });
  }, [mentors, query, maxPrice, minRating, selectedCats]);

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
          Mentor directory
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {isMentor
            ? "Browse fellow mentors — useful for pricing benchmarks and referrals."
            : "Browse vetted mentors and find the right fit."}
        </p>
      </div>

      {/* Category pills */}
      <div className="mb-8">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCats([])}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
              selectedCats.length === 0
                ? "border-primary bg-gradient-primary text-primary-foreground"
                : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
            }`}
          >
            All
          </button>
          {MENTOR_CATEGORIES.map((c) => {
            const Icon = c.icon;
            const active = selectedCats.includes(c.slug);
            return (
              <button
                key={c.slug}
                onClick={() => toggleCat(c.slug)}
                title={c.description}
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                  active
                    ? "border-primary bg-gradient-primary text-primary-foreground"
                    : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {c.shortLabel}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
        {/* Sidebar filters */}
        <aside className="space-y-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search mentors…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <Card className="p-5">
            <h3 className="mb-3 text-sm font-semibold">Rating</h3>
            <div className="flex flex-wrap gap-2">
              {[0, 3, 4, 4.5].map((r) => (
                <button
                  key={r}
                  onClick={() => setMinRating(r)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                    minRating === r
                      ? "border-primary bg-accent text-accent-foreground"
                      : "border-border text-muted-foreground hover:border-primary/50"
                  }`}
                >
                  {r === 0 ? "Any" : `${r}+`}
                </button>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold">Max price (PKR)</h3>
              <span className="text-sm font-medium text-primary">
                {maxPrice[0] === 1000 ? "Any" : `PKR ${maxPrice[0]}`}
              </span>
            </div>
            <Slider
              value={maxPrice}
              onValueChange={setMaxPrice}
              max={1000}
              step={50}
            />
          </Card>
        </aside>

        {/* Mentor list */}
        <section>
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <p className="mb-4 text-sm text-muted-foreground">
                Showing{" "}
                <span className="font-medium text-foreground">
                  {filtered.length}
                </span>{" "}
                mentors
              </p>

              {filtered.length === 0 ? (
                <Card className="flex flex-col items-center justify-center gap-2 border-dashed py-20 text-center">
                  <Users className="h-7 w-7 text-muted-foreground" />
                  <p className="text-sm font-medium">
                    No mentors match your filters
                  </p>
                  <p className="max-w-sm text-xs text-muted-foreground">
                    Try adjusting your search, category, rating, or price filters.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => {
                      setSelectedCats([]);
                      setQuery("");
                      setMinRating(0);
                      setMaxPrice([1000]);
                    }}
                  >
                    Clear filters
                  </Button>
                </Card>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {filtered.map((m) => {
                    const cat = getCategory(m.category ?? "");
                    const CatIcon = cat?.icon;
                    const initials = m.profiles.full_name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2);

                    return (
                      <Card
                        key={m.id}
                        className="flex flex-col gap-4 p-5 transition hover:shadow-elegant"
                      >
                        <div className="flex items-start gap-3">
                          {m.profiles.profile_picture_url ? (
                            <img
                              src={m.profiles.profile_picture_url}
                              alt={m.profiles.full_name}
                              className="h-12 w-12 rounded-full border bg-muted object-cover"
                            />
                          ) : (
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-primary text-sm font-bold text-primary-foreground">
                              {initials}
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <h3 className="truncate font-semibold">
                                {m.profiles.full_name}
                              </h3>
                              {m.profiles.is_verified && (
                                <BadgeCheck
                                  className="h-4 w-4 shrink-0 text-primary"
                                  aria-label="Verified mentor"
                                />
                              )}
                            </div>
                            <p className="truncate text-xs text-muted-foreground capitalize">
                              {m.category} Mentor
                            </p>
                          </div>
                          <div className="flex items-center gap-1 text-xs">
                            <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                            <span className="font-medium">
                              {m.average_rating?.toFixed(1) ?? "New"}
                            </span>
                          </div>
                        </div>

                        {cat && (
                          <div className="flex items-center gap-1.5">
                            <Badge
                              variant="secondary"
                              className="gap-1 text-[10px]"
                            >
                              {CatIcon && <CatIcon className="h-3 w-3" />}
                              {cat.shortLabel}
                            </Badge>
                            {m.is_free_first_session && (
                              <Badge className="bg-gradient-primary text-[10px] text-primary-foreground">
                                Free 1st session
                              </Badge>
                            )}
                            {m.session_language && (
                              <Badge
                                variant="outline"
                                className="text-[10px] capitalize"
                              >
                                {m.session_language}
                              </Badge>
                            )}
                          </div>
                        )}

                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {m.bio ?? "No bio available."}
                        </p>

                        {m.expertise_areas && m.expertise_areas.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {m.expertise_areas.slice(0, 3).map((tag) => (
                              <Badge
                                key={tag}
                                variant="outline"
                                className="text-[10px] font-medium"
                              >
                                {tag}
                              </Badge>
                            ))}
                            {m.expertise_areas.length > 3 && (
                              <Badge
                                variant="outline"
                                className="text-[10px] font-medium"
                              >
                                +{m.expertise_areas.length - 3} more
                              </Badge>
                            )}
                          </div>
                        )}

                        <div className="mt-auto flex items-center justify-between gap-2 border-t pt-3">
                          <p className="text-sm">
                            {m.is_free_first_session ? (
                              <span className="font-semibold text-green-600">
                                Free First Session
                              </span>
                            ) : (
                              <>
                                <span className="font-semibold text-gradient-primary">
                                  PKR {m.initial_session_price}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {" "}/ session
                                </span>
                              </>
                            )}
                          </p>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" asChild>
                              <Link
                                to="/mentors/$id"
                                params={{ id: m.id }}
                              >
                                View profile
                              </Link>
                            </Button>
                            {!isMentor && (
                              <Button
                                size="sm"
                                asChild
                                className="bg-gradient-primary text-primary-foreground hover:opacity-90"
                              >
                                <Link
                                  to="/book/$mentorId"
                                  params={{ mentorId: m.id }}
                                >
                                  Book
                                </Link>
                              </Button>
                            )}
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
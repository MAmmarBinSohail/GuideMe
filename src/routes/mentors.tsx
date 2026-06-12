import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { Search, Star, Users, BadgeCheck } from "lucide-react";
import { z } from "zod";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MOCK_MENTORS } from "@/lib/mock-data";
import { MENTOR_CATEGORIES, getCategory } from "@/lib/categories";
import { useAuth } from "@/contexts/AuthContext";

const searchSchema = z.object({
  category: z.string().optional(),
});

export const Route = createFileRoute("/mentors")({
  head: () => ({ meta: [{ title: "Mentors — GuideMe" }] }),
  validateSearch: searchSchema,
  component: MentorsPage,
});

function MentorsPage() {
  const { category: initialCategory } = Route.useSearch();
  const { user } = useAuth();
  const isMentor = user?.role === "mentor";

  const [query, setQuery] = useState("");
  const [price, setPrice] = useState<number[]>([200]);
  const [minRating, setMinRating] = useState(0);
  const [selectedCats, setSelectedCats] = useState<string[]>(
    initialCategory ? [initialCategory] : [],
  );

  useEffect(() => {
    if (initialCategory && !selectedCats.includes(initialCategory)) {
      setSelectedCats([initialCategory]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialCategory]);

  const toggleCat = (c: string) =>
    setSelectedCats((s) =>
      s.includes(c) ? s.filter((x) => x !== c) : [...s, c],
    );

  const mentors = useMemo(() => {
    return MOCK_MENTORS.filter((m) => {
      if (m.pricePerHour > price[0]) return false;
      if (m.rating < minRating) return false;
      if (selectedCats.length > 0 && !selectedCats.includes(m.category)) return false;
      if (query.trim()) {
        const q = query.toLowerCase();
        if (
          !m.name.toLowerCase().includes(q) &&
          !m.title.toLowerCase().includes(q) &&
          !m.tags.some((t) => t.toLowerCase().includes(q))
        )
          return false;
      }
      return true;
    });
  }, [query, price, minRating, selectedCats]);

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Mentor directory</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {isMentor
            ? "Browse fellow mentors — useful for pricing benchmarks and referrals."
            : "Browse vetted mentors and find the right fit."}
        </p>
      </div>

      {/* Category pills with icons */}
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
              <h3 className="text-sm font-semibold">Max price / hr</h3>
              <span className="text-sm font-medium text-primary">${price[0]}</span>
            </div>
            <Slider value={price} onValueChange={setPrice} max={500} step={10} />
          </Card>
        </aside>

        {/* Mentor list */}
        <section>
          <p className="mb-4 text-sm text-muted-foreground">
            Showing <span className="font-medium text-foreground">{mentors.length}</span> mentors
          </p>

          {mentors.length === 0 ? (
            <Card className="flex flex-col items-center justify-center gap-2 border-dashed py-20 text-center">
              <Users className="h-7 w-7 text-muted-foreground" />
              <p className="text-sm font-medium">No mentors match your filters</p>
              <p className="max-w-sm text-xs text-muted-foreground">
                Try adjusting your search, category, rating, or price filters.
              </p>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {mentors.map((m) => {
                const cat = getCategory(m.category);
                const CatIcon = cat?.icon;
                return (
                  <Card key={m.id} className="flex flex-col gap-4 p-5 transition hover:shadow-elegant">
                    <div className="flex items-start gap-3">
                      <img
                        src={m.avatar}
                        alt={m.name}
                        className="h-12 w-12 rounded-full border bg-muted"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <h3 className="truncate font-semibold">{m.name}</h3>
                          {m.verified && (
                            <BadgeCheck className="h-4 w-4 shrink-0 text-primary" aria-label="Verified mentor" />
                          )}
                        </div>
                        <p className="truncate text-xs text-muted-foreground">{m.title}</p>
                      </div>
                      <div className="flex items-center gap-1 text-xs">
                        <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                        <span className="font-medium">{m.rating}</span>
                        <span className="text-muted-foreground">({m.reviews})</span>
                      </div>
                    </div>

                    {cat && (
                      <div className="flex items-center gap-1.5">
                        <Badge variant="secondary" className="gap-1 text-[10px]">
                          {CatIcon && <CatIcon className="h-3 w-3" />}
                          {cat.shortLabel}
                        </Badge>
                        {m.freeFirstSession && (
                          <Badge className="bg-gradient-primary text-[10px] text-primary-foreground">
                            Free 1st session
                          </Badge>
                        )}
                      </div>
                    )}

                    <p className="text-sm text-muted-foreground line-clamp-2">{m.bio}</p>

                    <div className="flex flex-wrap gap-1.5">
                      {m.tags.map((t) => (
                        <Badge key={t} variant="outline" className="text-[10px] font-medium">
                          {t}
                        </Badge>
                      ))}
                    </div>

                    <div className="mt-auto flex items-center justify-between gap-2 border-t pt-3">
                      <p className="text-sm">
                        <span className="font-semibold text-gradient-primary">${m.pricePerHour}</span>
                        <span className="text-xs text-muted-foreground"> / hr</span>
                      </p>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" asChild>
                          <Link to="/mentors/$id" params={{ id: m.id }}>
                            View profile
                          </Link>
                        </Button>
                        {!isMentor && (
                          <Button
                            size="sm"
                            asChild
                            className="bg-gradient-primary text-primary-foreground hover:opacity-90"
                          >
                            <Link to="/mentors/$id" params={{ id: m.id }}>
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
        </section>
      </div>
    </div>
  );
}

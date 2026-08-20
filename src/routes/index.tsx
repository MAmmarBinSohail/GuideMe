import { createFileRoute, Link } from "@/lib/router-compat";
import { getCategory } from "@/lib/categories";
import { useEffect, useState, useCallback } from "react";
import {
  BadgeCheck,
  Sparkles,
  Star,
  TrendingUp,
  ArrowRight,
  Users,
  Bot,
  LayoutGrid,
  Wallet,
  Award,
  Clock,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Autoplay from "embla-carousel-autoplay";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import heroBg from "@/assets/hero-bg.jpg";
import { MENTOR_CATEGORIES } from "@/lib/categories";
import { supabase } from "@/supabaseClient";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "GuideMe — Find Your Mentor" },
      { 
        name: "description",
        content:
          "Browse expert mentors across academics, career, tech, design, business and more. Book a session in minutes.",
      },
    ],
  }),
  component: Home,
});

const FEATURES = [
  {
    icon: Users,
    headline: "500+",
    subheadline: "People Guided",
    description: "Towards a better future through personalized mentorship.",
  },
  {
    icon: Bot,
    headline: "AI Powered",
    subheadline: "Mr.Guy-de Chatbot",
    description: "Smart 24/7 assistance to match you with the perfect mentor.",
  },
  {
    icon: LayoutGrid,
    headline: "12",
    subheadline: "Mentorship Categories",
    description: "From academics to engineering — find your niche.",
  },
  {
    icon: Wallet,
    headline: "Affordable",
    subheadline: "Pricing for Everyone",
    description: "Flexible plans that fit every budget across the platform.",
  },
  {
    icon: Award,
    headline: "Vetted",
    subheadline: "Expert Mentors",
    description: "Every mentor is carefully screened and reviewed.",
  },
  {
    icon: Clock,
    headline: "On-Demand",
    subheadline: "Session Booking",
    description: "Book sessions instantly that fit your schedule.",
  },
  {
    icon: ShieldCheck,
    headline: "Secure",
    subheadline: "& Private",
    description: "End-to-end encrypted calls and confidential guidance.",
  },
];

function FeatureCard({
  feature,
}: {
  feature: (typeof FEATURES)[number];
}) {
  const Icon = feature.icon;
  return (
    <Card className="flex h-full flex-col items-center gap-4 border bg-card/80 p-6 text-center backdrop-blur-sm transition hover:border-primary/50 hover:shadow-elegant">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-primary text-primary-foreground shadow-elegant">
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <h3 className="text-2xl font-bold tracking-tight text-gradient-primary">
          {feature.headline}
        </h3>
        <p className="mt-0.5 text-sm font-semibold">{feature.subheadline}</p>
      </div>
      <p className="text-xs leading-relaxed text-muted-foreground">
        {feature.description}
      </p>
    </Card>
  );
}

function Home() {
  const [query, setQuery] = useState("");

  const [api, setApi] = useState<CarouselApi>();

  const scrollPrev = useCallback(() => api?.scrollPrev(), [api]);
  const scrollNext = useCallback(() => api?.scrollNext(), [api]);
  const [trendingMentors, setTrendingMentors] = useState<any[]>([]);

  useEffect(() => {
    fetchTrendingMentors();
  }, []);

  async function fetchTrendingMentors() {
    try {
      // Get all confirmed/completed bookings
      const { data: bookingData, error: bookingError } = await supabase
        .from("bookings")
        .select("mentor_id")
        .in("status", ["confirmed", "completed"]);

      if (bookingError || !bookingData || bookingData.length === 0) return;

      // Count bookings per mentor
      const countMap: Record<string, number> = {};
      bookingData.forEach((b: any) => {
        countMap[b.mentor_id] = (countMap[b.mentor_id] || 0) + 1;
      });

      // Get top mentor IDs sorted by booking count
      const topMentorIds = Object.entries(countMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([id]) => id);

      if (topMentorIds.length === 0) return;

      // Fetch mentor details for those IDs
      const { data: mentorData, error: mentorError } = await supabase
        .from("mentor_profiles")
        .select(`
          id,
          category,
          average_rating,
          is_free_first_session,
          initial_session_price,
          is_available,
          is_hibernating,
          profiles (
            full_name,
            profile_picture_url,
            is_verified
          )
        `)
        .in("id", topMentorIds)
        .eq("is_available", true)
        .not("category", "is", null);

      if (mentorError || !mentorData) return;

      // Add booking counts and sort
      const mentorsWithCount = mentorData
        .filter((m) => !m.is_hibernating)
        .map((m) => ({
          ...m,
          booking_count: countMap[m.id] || 0,
        }))
        .sort((a, b) => b.booking_count - a.booking_count);

      setTrendingMentors(mentorsWithCount);
    } catch (err) {
      console.error("Error fetching trending mentors:", err);
    }
  }

  return (
    <div>
      {/* Background image */}
      <section className="relative min-h-[520px] overflow-hidden md:min-h-[600px]">
        <img
          src={heroBg}
          alt="Mentorship background"
          className="absolute inset-0 h-full w-full object-cover"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/80 to-background/40 dark:from-background/95 dark:via-background/85 dark:to-background/50" />

        <div className="relative container mx-auto px-4 py-20 md:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border bg-background/60 px-4 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Smart mentorship, powered by Mr.Guy-de AI
            </div>
            <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
              Find the right{" "}
              <span className="text-gradient-primary">mentor</span> for your next chapter.
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-base text-muted-foreground md:text-lg">
              GuideMe connects you with vetted mentors and counselors across academics, career, tech, business and more — on your schedule.
            </p>

            {/* <form
              onSubmit={(e) => e.preventDefault()}
              className="mx-auto mt-8 flex max-w-xl items-center gap-2 rounded-full border bg-card p-1.5 shadow-elegant"
            >
              <Search className="ml-3 h-5 w-5 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by skill, role or goal…"
                className="border-0 bg-transparent shadow-none focus-visible:ring-0"
              />
              <Button
                type="submit"
                className="rounded-full bg-gradient-primary text-primary-foreground hover:opacity-90"
              >
                Search
              </Button>
            </form> */}
          </div>
        </div>
      </section>

      {/* Features carousel */}
      <section className="bg-gradient-soft py-16">
        <div className="container mx-auto px-4">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
              Why <span className="text-gradient-primary">GuideMe</span>?
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Everything you need to grow, in one place.
            </p>
          </div>

          <Carousel
            setApi={setApi}
            opts={{
              align: "start",
              loop: true,
            }}
            plugins={[Autoplay({ delay: 3000, stopOnInteraction: false })]}
            className="w-full"
          >
            <CarouselContent className="-ml-4">
              {FEATURES.map((feature, i) => (
                <CarouselItem
                  key={i}
                  className="pl-4 md:basis-1/2 lg:basis-1/3 xl:basis-1/4"
                >
                  <FeatureCard feature={feature} />
                </CarouselItem>
              ))}
            </CarouselContent>
            <div className="mt-6 flex items-center justify-center gap-3">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-full"
                onClick={scrollPrev}
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="sr-only">Previous</span>
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-full"
                onClick={scrollNext}
              >
                <ChevronRight className="h-4 w-4" />
                <span className="sr-only">Next</span>
              </Button>
            </div>
          </Carousel>
        </div>
      </section>

      {/* Categories */}
      <section className="container mx-auto px-4 py-16">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
              Browse by category
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              12 universal areas — find the right kind of guidance.
            </p>
          </div>
          <Button variant="ghost" asChild className="hidden sm:inline-flex">
            <Link to="/mentors">
              All mentors <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {MENTOR_CATEGORIES.map((c) => {
            const Icon = c.icon;
            return (
              <Link
                key={c.slug}
                to="/mentors"
                search={{ category: c.slug }}
                className="group flex items-start gap-3 rounded-xl border bg-card p-4 transition hover:border-primary hover:shadow-elegant"
              >
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-accent text-primary transition group-hover:bg-gradient-primary group-hover:text-primary-foreground">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{c.shortLabel}</p>
                  <p className="line-clamp-2 text-xs text-muted-foreground">
                    {c.description}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Mock Trending mentors */}
      <section className="container mx-auto px-4 pb-20">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-2xl font-bold tracking-tight md:text-3xl">
              <TrendingUp className="h-6 w-6 text-primary" />
              Trending mentors
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              The most-booked mentors this week.
            </p>
          </div>
          <Button variant="ghost" asChild className="hidden sm:inline-flex">
            <Link to="/mentors">
              View all <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>

        {trendingMentors.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-sm text-muted-foreground">
              No trending mentors yet. Be the first to book a session!
            </p>
          </div>
        ) : (
          <Carousel
            opts={{ align: "start", loop: true }}
            plugins={[Autoplay({ delay: 3000, stopOnInteraction: true })]}
            className="w-full"
          >
            <CarouselContent className="-ml-3">
              {trendingMentors.map((mentor) => {
                const name = mentor.profiles?.full_name ?? "Mentor";
                const isVerified = mentor.profiles?.is_verified ?? false;
                const avatar = mentor.profiles?.profile_picture_url;
                const initials = name
                  .split(" ")
                  .map((n: string) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2);
                const category = getCategory(mentor.category ?? "");
                const CatIcon = category?.icon;

                return (
                  <CarouselItem
                    key={mentor.id}
                    className="pl-3 basis-full sm:basis-1/2 lg:basis-1/4"
                  >
                    <Link
                      to={`/mentors/${mentor.id}`}
                      className="block rounded-2xl border bg-card p-4 shadow-sm transition hover:shadow-md hover:border-primary/30 h-full"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        {avatar ? (
                          <img
                            src={avatar}
                            alt={name}
                            className="h-11 w-11 rounded-full border object-cover shrink-0"
                          />
                        ) : (
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-primary text-sm font-bold text-primary-foreground">
                            {initials}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="flex items-center gap-1">
                            <p className="text-sm font-semibold truncate">
                              {name}
                            </p>
                            {isVerified && (
                              <BadgeCheck className="h-3.5 w-3.5 text-primary shrink-0" />
                            )}
                          </div>
                          {category && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              {CatIcon && <CatIcon className="h-3 w-3 shrink-0" />}
                              <span className="truncate">{category.label}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs mt-auto pt-2 border-t">
                        <div className="flex items-center gap-1">
                          <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                          <span className="font-medium">
                            {mentor.average_rating
                              ? Number(mentor.average_rating).toFixed(1)
                              : "New"}
                          </span>
                        </div>
                        <span className="text-muted-foreground">
                          {mentor.booking_count} session{mentor.booking_count !== 1 ? "s" : ""}
                        </span>
                        <span className="font-semibold text-gradient-primary">
                          {mentor.is_free_first_session
                            ? "Free 1st"
                            : mentor.initial_session_price > 0
                            ? `PKR ${mentor.initial_session_price}`
                            : "Free"}
                        </span>
                      </div>
                    </Link>
                  </CarouselItem>
                );
              })}
            </CarouselContent>
          </Carousel>
          )}
        </section>
    </div>
  );
}

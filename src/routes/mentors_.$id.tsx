import { createFileRoute, Link } from "@/lib/router-compat";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Star,
  CheckCircle2,
  CalendarPlus,
  Loader2,
  Globe,
  Clock,
  BadgeCheck,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { getCategory } from "@/lib/categories";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/supabaseClient";

export const Route = createFileRoute("/mentors_/$id")({
  head: () => ({
    meta: [{ title: `Mentor profile — GuideMe` }],
  }),
  component: MentorProfilePage,
  notFoundComponent: () => (
    <div className="container mx-auto px-4 py-20 text-center">
      <h1 className="text-2xl font-semibold">Mentor not found</h1>
      <Button asChild className="mt-4">
        <Link to="/mentors">Back to mentors</Link>
      </Button>
    </div>
  ),
});

interface MentorProfile {
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

interface Review {
  id: string;
  rating: number;
  review_text: string | null;
  created_at: string;
  profiles: {
    full_name: string;
    profile_picture_url: string | null;
  };
}

function MentorProfilePage() {
  const { id } = Route.useParams();
  const { user, isAuthenticated } = useAuth();
  const [mentor, setMentor] = useState<MentorProfile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isFreeEligible, setIsFreeEligible] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMentorProfile();
  }, [id]);

  useEffect(() => {
    if (user && mentor) checkFreeEligibility();
  }, [user, mentor]);

  async function checkFreeEligibility() {
    try {
      const { data, error } = await supabase.rpc(
        "is_eligible_for_free_session",
        {
          p_mentee_id: user!.id,
          p_mentor_id: mentor!.id,
        }
      );

      if (!error) {
        setIsFreeEligible(data === true);
      }
    } catch (err) {
      console.error("Eligibility check failed:", err);
    }
  }

  async function fetchMentorProfile() {
    setLoading(true);
    try {
      // Fetch mentor profile
      const { data: mentorData, error: mentorError } = await supabase
        .from("mentor_profiles")
        .select(`
          *,
          profiles (
            full_name,
            profile_picture_url,
            is_verified
          )
        `)
        .eq("id", id)
        .single();

      if (mentorError || !mentorData) {
        console.error("Mentor not found:", mentorError);
        setLoading(false);
        return;
      }

      setMentor(mentorData);

      // Fetch reviews for this mentor
      const { data: reviewsData } = await supabase
        .from("reviews")
        .select(`
          *,
          profiles!reviews_mentee_id_fkey (
            full_name,
            profile_picture_url
          )
        `)
        .eq("mentor_id", id)
        .order("created_at", { ascending: false });

      setReviews(reviewsData || []);

    } catch (err) {
      console.error("Error fetching mentor:", err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!mentor) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-semibold">Mentor not found</h1>
        <Button asChild className="mt-4">
          <Link to="/mentors">Back to mentors</Link>
        </Button>
      </div>
    );
  }

  const category = getCategory(mentor.category ?? "");
  const CatIcon = category?.icon;
  const isMentor = user?.role === "mentor";

  const initials = mentor.profiles.full_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="container mx-auto px-4 py-8">
      <Button variant="ghost" size="sm" asChild className="mb-4">
        <Link to="/mentors">
          <ArrowLeft className="mr-1 h-4 w-4" /> Back to mentors
        </Link>
      </Button>

      <div className="grid gap-6 lg:grid-cols-3">

        {/* Profile Card */}
        <Card className="p-6 lg:col-span-2">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">

            {mentor.profiles.profile_picture_url ? (
              <img
                src={mentor.profiles.profile_picture_url}
                alt={mentor.profiles.full_name}
                className="h-24 w-24 rounded-2xl border bg-muted object-cover"
              />
            ) : (
              <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl bg-gradient-primary text-2xl font-bold text-primary-foreground">
                {initials}
              </div>
            )}

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight">
                  {mentor.profiles.full_name}
                </h1>
                {mentor.profiles.is_verified && (
                  <Badge className="gap-1 bg-gradient-primary text-primary-foreground">
                    <CheckCircle2 className="h-3 w-3" /> Verified
                  </Badge>
                )}
              </div>

              <p className="text-sm text-muted-foreground capitalize">
                {mentor.category} Mentor
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-primary text-primary" />
                  <span className="font-semibold">
                    {mentor.average_rating?.toFixed(1) ?? "New"}
                  </span>
                  <span className="text-muted-foreground">
                    ({reviews.length} reviews)
                  </span>
                </div>

                {category && (
                  <Badge variant="secondary" className="gap-1">
                    {CatIcon && <CatIcon className="h-3 w-3" />}
                    {category.label}
                  </Badge>
                )}

                {mentor.is_free_first_session && isMentor && (
                  <Badge className="bg-gradient-primary text-primary-foreground">
                    Free first session policy
                  </Badge>
                )}
                {!isMentor && isFreeEligible && (
                  <Badge className="bg-gradient-primary text-primary-foreground">
                    Free for you
                  </Badge>
                )}
              </div>

              <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
                {mentor.years_of_experience !== null && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {mentor.years_of_experience} years experience
                  </span>
                )}
                {mentor.session_language && (
                  <span className="flex items-center gap-1 capitalize">
                    <Globe className="h-3.5 w-3.5" />
                    {mentor.session_language}
                  </span>
                )}
                {mentor.portfolio_url && (
                  <a
                    href={mentor.portfolio_url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-primary underline"
                  >
                    <BadgeCheck className="h-3.5 w-3.5" />
                    Portfolio
                  </a>
                )}
              </div>
            </div>
          </div>

          <Separator className="my-6" />

          {/* About */}
          <section>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              About
            </h2>
            <p className="text-sm leading-relaxed">
              {mentor.bio ?? "No bio available."}
            </p>
          </section>

          {/* Expertise Areas */}
          {mentor.expertise_areas && mentor.expertise_areas.length > 0 && (
            <section className="mt-6">
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Expertise Areas
              </h2>
              <div className="flex flex-wrap gap-2">
                {mentor.expertise_areas.map((e) => (
                  <Badge key={e} variant="outline" className="text-xs">
                    {e}
                  </Badge>
                ))}
              </div>
            </section>
          )}

          {/* Reviews */}
          <section className="mt-6">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Reviews ({reviews.length})
            </h2>

            {reviews.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No reviews yet. Be the first to review!
              </p>
            ) : (
              <div className="space-y-4">
                {reviews.map((r) => {
                  const reviewerInitials = r.profiles.full_name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2);

                  return (
                    <Card key={r.id} className="p-4">
                      <div className="flex items-start gap-3">
                        {r.profiles.profile_picture_url ? (
                          <img
                            src={r.profiles.profile_picture_url}
                            alt={r.profiles.full_name}
                            className="h-8 w-8 rounded-full border bg-muted object-cover"
                          />
                        ) : (
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-primary text-xs font-bold text-primary-foreground">
                            {reviewerInitials}
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold">
                              {r.profiles.full_name}
                            </p>
                            <div className="flex items-center gap-1">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-3.5 w-3.5 ${
                                    i < r.rating
                                      ? "fill-primary text-primary"
                                      : "text-muted-foreground"
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          {r.review_text && (
                            <p className="mt-1 text-sm text-muted-foreground">
                              {r.review_text}
                            </p>
                          )}
                          <p className="mt-1 text-xs text-muted-foreground">
                            {new Date(r.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </section>
        </Card>

        {/* Booking Sidebar */}
        <Card className="h-fit p-6">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Initial session
            </p>
            {isMentor ? (
              // Mentor viewing — always show static configured price
              mentor.is_free_first_session ? (
                <p className="mt-1 text-3xl font-bold text-green-600">
                  Free <span className="text-sm font-normal text-muted-foreground">(for new mentees)</span>
                </p>
              ) : (
                <p className="mt-1 text-3xl font-bold text-gradient-primary">
                  PKR {mentor.initial_session_price}
                  <span className="ml-1 text-sm font-normal text-muted-foreground">
                    / session
                  </span>
                </p>
              )
            ) : isFreeEligible ? (
              // Mentee viewing, eligible for free
              <p className="mt-1 text-3xl font-bold text-green-600">
                Free
              </p>
            ) : (
              // Mentee viewing, not eligible (already used free session)
              <p className="mt-1 text-3xl font-bold text-gradient-primary">
                PKR {mentor.initial_session_price}
                <span className="ml-1 text-sm font-normal text-muted-foreground">
                  / session
                </span>
              </p>
            )}
            {mentor.followup_session_price !== null && (
              <p className="mt-1 text-xs text-muted-foreground">
                Follow-up: PKR {mentor.followup_session_price} / session
              </p>
            )}
            {mentor.session_language && (
              <p className="mt-1 text-xs text-muted-foreground capitalize">
                Language: {mentor.session_language}
              </p>
            )}
          </div>

          {isMentor ? (
            <div className="mt-5 rounded-lg border border-dashed bg-muted/30 p-4 text-center">
              <p className="text-sm font-medium">
                Mentors cannot book sessions
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                You are viewing this profile as a mentor.
              </p>
            </div>
          ) : (
            <>
              <Separator className="my-5" />
              {isAuthenticated ? (
                <Button
                  asChild
                  className="w-full bg-gradient-primary text-primary-foreground hover:opacity-90"
                >
                  <Link
                    to="/book/$mentorId"
                    params={{ mentorId: mentor.id }}
                  >
                    <CalendarPlus className="mr-2 h-4 w-4" />
                    Book Session
                  </Link>
                </Button>
              ) : (
                <>
                  <Button
                    asChild
                    className="w-full bg-gradient-primary text-primary-foreground hover:opacity-90"
                  >
                    <Link to="/login">Log in to Book</Link>
                  </Button>
                  <p className="mt-3 text-center text-xs text-muted-foreground">
                    You need to sign in before booking a session.
                  </p>
                </>
              )}

              <div className="mt-4 rounded-lg border bg-muted/30 p-3">
                <p className="text-xs font-medium text-muted-foreground">
                  Session includes
                </p>
                <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                  <li>✓ 60 minute session</li>
                  <li>✓ Secure meeting link</li>
                  <li>✓ Session recording available</li>
                  <li>✓ Follow up support</li>
                </ul>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
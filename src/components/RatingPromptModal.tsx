import { useEffect, useState } from "react";
import { Star, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import type { Session } from "@/lib/mock-data";

interface RatingPromptModalProps {
  session: Session | null;
  open: boolean;
  onClose: () => void;
  onSubmit: (sessionId: string, rating: number, comment: string) => void;
}

export function RatingPromptModal({
  session,
  open,
  onClose,
  onSubmit,
}: RatingPromptModalProps) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");

  useEffect(() => {
    if (open) {
      setRating(0);
      setHover(0);
      setComment("");
    }
  }, [open]);

  if (!session) return null;

  const handleSubmit = () => {
    if (rating === 0) {
      toast.error("Please pick a star rating before submitting.");
      return;
    }
    onSubmit(session.id, rating, comment);
    toast.success("Thanks for your feedback!");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md p-0 overflow-hidden sm:rounded-2xl">
        <div className="bg-gradient-primary p-6 text-primary-foreground">
          <button
            onClick={onClose}
            className="absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-full bg-white/15 hover:bg-white/25"
            aria-label="Skip"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-3">
            <img
              src={session.mentorAvatar}
              alt={session.mentorName}
              className="h-12 w-12 rounded-full border-2 border-white/40 bg-muted"
            />
            <div>
              <DialogHeader className="space-y-0 text-left">
                <DialogTitle className="text-lg text-primary-foreground">
                  Rate your session
                </DialogTitle>
                <DialogDescription className="text-primary-foreground/80">
                  with {session.mentorName}
                </DialogDescription>
              </DialogHeader>
            </div>
          </div>
        </div>

        <div className="space-y-5 p-6">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Topic
            </p>
            <p className="mt-1 text-sm font-medium">{session.topic}</p>
            <p className="text-xs text-muted-foreground">
              {session.date} · {session.time}
            </p>
          </div>

          {/* Stars */}
          <div className="flex flex-col items-center gap-2">
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5].map((star) => {
                const filled = (hover || rating) >= star;
                return (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHover(star)}
                    onMouseLeave={() => setHover(0)}
                    className="transition-transform hover:scale-110"
                    aria-label={`${star} stars`}
                  >
                    <Star
                      className={`h-9 w-9 ${
                        filled
                          ? "fill-primary text-primary"
                          : "fill-transparent text-muted-foreground"
                      }`}
                    />
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              {rating === 0
                ? "Tap a star to rate"
                : ["", "Poor", "Fair", "Good", "Great", "Excellent"][rating]}
            </p>
          </div>

          <Textarea
            placeholder="Share what worked well (optional)…"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
          />

          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Skip
            </Button>
            <Button
              onClick={handleSubmit}
              className="flex-1 bg-gradient-primary text-primary-foreground hover:opacity-90"
            >
              Submit review
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

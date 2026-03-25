import { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useUpdateQuestion } from "@/hooks/use-questions";
import { DIFFICULTY_COLORS } from "@/lib/constants";
import type { Question } from "@shared/schema";
import { ArrowLeft, ArrowRight, X, Check, RotateCcw, BookOpen } from "lucide-react";

interface FlashcardModeProps {
  questions: Question[];
  filter: "all" | "important" | "review";
  onExit: () => void;
}

export function FlashcardMode({ questions, filter, onExit }: FlashcardModeProps) {
  const updateQuestion = useUpdateQuestion();

  const cards = useMemo(() => {
    switch (filter) {
      case "important":
        return questions.filter((q) => q.isImportant);
      case "review":
        return questions.filter((q) => q.reviewAgain);
      default:
        return questions;
    }
  }, [questions, filter]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const card = cards[currentIndex];

  const goNext = useCallback(() => {
    if (currentIndex < cards.length - 1) {
      setCurrentIndex((i) => i + 1);
      setIsFlipped(false);
    }
  }, [currentIndex, cards.length]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
      setIsFlipped(false);
    }
  }, [currentIndex]);

  const flip = useCallback(() => {
    setIsFlipped((f) => !f);
  }, []);

  const handleGotIt = () => {
    if (!card) return;
    updateQuestion.mutate({
      id: card.id,
      data: {
        reviewAgain: false,
        lastReviewed: new Date().toISOString(),
      },
    });
    goNext();
  };

  const handleReviewAgain = () => {
    if (!card) return;
    updateQuestion.mutate({
      id: card.id,
      data: {
        reviewAgain: true,
        lastReviewed: new Date().toISOString(),
      },
    });
    goNext();
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") goNext();
      else if (e.key === "ArrowLeft") goPrev();
      else if (e.key === " ") {
        e.preventDefault();
        flip();
      } else if (e.key === "Escape") onExit();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [goNext, goPrev, flip, onExit]);

  if (cards.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <BookOpen className="w-12 h-12 text-muted-foreground mb-4" />
        <p className="text-lg font-medium mb-2">No cards to review</p>
        <p className="text-sm text-muted-foreground mb-6">
          {filter === "important"
            ? "Star some questions to review them here."
            : filter === "review"
            ? "No questions marked for review."
            : "Add some questions first."}
        </p>
        <Button onClick={onExit} data-testid="button-back-empty">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
      </div>
    );
  }

  // Build back content from flashcard or combine fields
  const backContent = card.flashcard ||
    [
      card.pattern && `Pattern: ${card.pattern}`,
      card.hint && `Hint: ${card.hint}`,
      card.patternNotes && `Notes: ${card.patternNotes}`,
      card.codeSnippet,
    ]
      .filter(Boolean)
      .join("\n\n");

  return (
    <div className="min-h-screen bg-background flex flex-col" data-testid="flashcard-mode">
      {/* Header */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b">
        <Button variant="ghost" size="sm" onClick={onExit} data-testid="button-exit-review">
          <X className="w-4 h-4 mr-1.5" />
          Exit Review
        </Button>
        <span className="text-sm text-muted-foreground">
          {currentIndex + 1} / {cards.length}
          <span className="ml-2 text-xs">
            ({filter === "all" ? "All" : filter === "important" ? "Important" : "Review Again"})
          </span>
        </span>
        <div className="text-xs text-muted-foreground">
          Space = flip · Arrows = navigate · Esc = exit
        </div>
      </div>

      {/* Card area */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div
          className="perspective w-full max-w-2xl"
          style={{ minHeight: "400px" }}
        >
          <div
            className={`relative w-full min-h-[400px] cursor-pointer preserve-3d transition-transform duration-500 ${
              isFlipped ? "rotate-y-180" : ""
            }`}
            onClick={flip}
            data-testid="flashcard-container"
          >
            {/* Front */}
            <div className="absolute inset-0 backface-hidden rounded-xl border bg-card p-6 sm:p-8 flex flex-col items-center justify-center text-center">
              <Badge
                variant="outline"
                className={`mb-4 text-xs ${DIFFICULTY_COLORS[card.difficulty] ?? ""}`}
              >
                {card.difficulty}
              </Badge>
              <h2 className="text-xl font-bold mb-3" data-testid="text-card-front">
                {card.name}
              </h2>
              <span className="text-sm text-primary font-medium">{card.pattern}</span>
              {card.isImportant && (
                <span className="mt-3 text-amber-400 text-sm">★ Important</span>
              )}
              <p className="mt-6 text-xs text-muted-foreground">Click or press Space to flip</p>
            </div>

            {/* Back */}
            <div className="absolute inset-0 backface-hidden rotate-y-180 rounded-xl border bg-card p-6 sm:p-8 overflow-y-auto">
              <div className="space-y-4">
                {card.hint && (
                  <div>
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                      Hint
                    </h3>
                    <p className="text-sm leading-relaxed">{card.hint}</p>
                  </div>
                )}
                {card.patternNotes && (
                  <div>
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                      Pattern Notes
                    </h3>
                    <p className="text-sm leading-relaxed">{card.patternNotes}</p>
                  </div>
                )}
                {card.codeSnippet && (
                  <div>
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                      Code
                    </h3>
                    <pre className="code-block bg-muted/50 rounded-lg p-3 text-sm overflow-x-auto">
                      {card.codeSnippet}
                    </pre>
                  </div>
                )}
                {!card.hint && !card.patternNotes && !card.codeSnippet && card.flashcard && (
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{card.flashcard}</p>
                )}
                {!card.hint && !card.patternNotes && !card.codeSnippet && !card.flashcard && (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No notes yet. Edit this question to add hints, pattern notes, or code.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3 px-4 pb-6">
        <Button
          variant="secondary"
          size="sm"
          onClick={goPrev}
          disabled={currentIndex === 0}
          data-testid="button-prev"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Prev
        </Button>
        <Button
          variant="default"
          size="sm"
          onClick={handleGotIt}
          className="bg-emerald-600 hover:bg-emerald-700 text-white"
          data-testid="button-got-it"
        >
          <Check className="w-4 h-4 mr-1.5" />
          Got It
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleReviewAgain}
          data-testid="button-review-again-action"
        >
          <RotateCcw className="w-4 h-4 mr-1.5" />
          Review Again
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={goNext}
          disabled={currentIndex === cards.length - 1}
          data-testid="button-next"
        >
          Next
          <ArrowRight className="w-4 h-4 ml-1.5" />
        </Button>
      </div>
    </div>
  );
}

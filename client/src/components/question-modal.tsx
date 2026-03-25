import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateQuestion, useUpdateQuestion } from "@/hooks/use-questions";
import { useToast } from "@/hooks/use-toast";
import { DIFFICULTIES, STATUSES, PATTERNS } from "@/lib/constants";
import type { Question } from "@shared/schema";

interface QuestionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  question: Question | null;
  allPatterns: string[];
}

export function QuestionModal({ open, onOpenChange, question, allPatterns }: QuestionModalProps) {
  const createQuestion = useCreateQuestion();
  const updateQuestion = useUpdateQuestion();
  const { toast } = useToast();
  const isEdit = !!question;

  const [name, setName] = useState("");
  const [link, setLink] = useState("");
  const [difficulty, setDifficulty] = useState("Medium");
  const [pattern, setPattern] = useState("Arrays");
  const [customPattern, setCustomPattern] = useState("");
  const [status, setStatus] = useState("Not Started");
  const [isImportant, setIsImportant] = useState(false);
  const [hint, setHint] = useState("");
  const [patternNotes, setPatternNotes] = useState("");
  const [codeSnippet, setCodeSnippet] = useState("");
  const [flashcard, setFlashcard] = useState("");
  const [reviewAgain, setReviewAgain] = useState(false);

  useEffect(() => {
    if (question) {
      setName(question.name);
      setLink(question.link);
      setDifficulty(question.difficulty);
      setPattern(question.pattern);
      setCustomPattern("");
      setStatus(question.status);
      setIsImportant(question.isImportant);
      setHint(question.hint);
      setPatternNotes(question.patternNotes);
      setCodeSnippet(question.codeSnippet);
      setFlashcard(question.flashcard);
      setReviewAgain(question.reviewAgain);
    } else {
      setName("");
      setLink("");
      setDifficulty("Medium");
      setPattern("Arrays");
      setCustomPattern("");
      setStatus("Not Started");
      setIsImportant(false);
      setHint("");
      setPatternNotes("");
      setCodeSnippet("");
      setFlashcard("");
      setReviewAgain(false);
    }
  }, [question, open]);

  // Auto-populate flashcard
  const autoFlashcard = [
    pattern !== "__custom__" ? pattern : customPattern,
    hint,
    patternNotes,
    codeSnippet ? `\`\`\`\n${codeSnippet}\n\`\`\`` : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  const handleSubmit = () => {
    if (!name.trim()) {
      toast({ title: "Name required", variant: "destructive" });
      return;
    }

    const resolvedPattern = pattern === "__custom__" ? customPattern.trim() || "Other" : pattern;
    const finalFlashcard = flashcard.trim() || autoFlashcard;

    const data = {
      name: name.trim(),
      link: link.trim(),
      difficulty,
      pattern: resolvedPattern,
      status,
      isImportant,
      hint,
      patternNotes,
      codeSnippet,
      flashcard: finalFlashcard,
      reviewAgain,
      lastReviewed: question?.lastReviewed || null,
    };

    if (isEdit) {
      updateQuestion.mutate(
        { id: question.id, data },
        {
          onSuccess: () => {
            toast({ title: "Updated", description: `"${name}" saved.` });
            onOpenChange(false);
          },
        }
      );
    } else {
      createQuestion.mutate(data, {
        onSuccess: () => {
          toast({ title: "Added", description: `"${name}" added.` });
          onOpenChange(false);
        },
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle data-testid="text-modal-title">
            {isEdit ? "Edit Question" : "Add Question"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="q-name">Name</Label>
            <Input
              id="q-name"
              placeholder="e.g., Two Sum"
              value={name}
              onChange={(e) => setName(e.target.value)}
              data-testid="input-name"
            />
          </div>

          {/* Link */}
          <div className="space-y-1.5">
            <Label htmlFor="q-link">Link</Label>
            <Input
              id="q-link"
              placeholder="https://leetcode.com/problems/two-sum"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              data-testid="input-link"
            />
          </div>

          {/* Row: Difficulty / Pattern / Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>Difficulty</Label>
              <Select value={difficulty} onValueChange={setDifficulty}>
                <SelectTrigger data-testid="select-modal-difficulty">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DIFFICULTIES.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Pattern</Label>
              <Select value={pattern} onValueChange={setPattern}>
                <SelectTrigger data-testid="select-modal-pattern">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {allPatterns.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                  <SelectItem value="__custom__">+ Custom Pattern</SelectItem>
                </SelectContent>
              </Select>
              {pattern === "__custom__" && (
                <Input
                  placeholder="Custom pattern name"
                  value={customPattern}
                  onChange={(e) => setCustomPattern(e.target.value)}
                  className="mt-1.5"
                  data-testid="input-custom-pattern"
                />
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger data-testid="select-modal-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Toggles */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Switch
                checked={isImportant}
                onCheckedChange={setIsImportant}
                data-testid="switch-important"
              />
              <Label className="text-sm">Important</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={reviewAgain}
                onCheckedChange={setReviewAgain}
                data-testid="switch-review"
              />
              <Label className="text-sm">Review Again</Label>
            </div>
          </div>

          {/* Tabs: Hints / Pattern Notes / Code Snippet / Flashcard */}
          <Tabs defaultValue="hint" className="w-full">
            <TabsList className="w-full grid grid-cols-4" data-testid="tabs-content">
              <TabsTrigger value="hint">Hints</TabsTrigger>
              <TabsTrigger value="notes">Pattern Notes</TabsTrigger>
              <TabsTrigger value="code">Code</TabsTrigger>
              <TabsTrigger value="flashcard">Flashcard</TabsTrigger>
            </TabsList>

            <TabsContent value="hint" className="mt-3">
              <Textarea
                placeholder="Write your own hint for this problem..."
                value={hint}
                onChange={(e) => setHint(e.target.value)}
                rows={5}
                data-testid="textarea-hint"
              />
            </TabsContent>

            <TabsContent value="notes" className="mt-3">
              <Textarea
                placeholder="Explain the pattern and why it applies here..."
                value={patternNotes}
                onChange={(e) => setPatternNotes(e.target.value)}
                rows={5}
                data-testid="textarea-notes"
              />
            </TabsContent>

            <TabsContent value="code" className="mt-3">
              <Textarea
                placeholder="Key solution template or skeleton..."
                value={codeSnippet}
                onChange={(e) => setCodeSnippet(e.target.value)}
                rows={8}
                className="font-mono text-sm"
                data-testid="textarea-code"
              />
            </TabsContent>

            <TabsContent value="flashcard" className="mt-3">
              <p className="text-xs text-muted-foreground mb-2">
                Auto-populated from pattern, hint, notes, and code. Edit to customize.
              </p>
              <Textarea
                placeholder="Flashcard content (auto-generated if left empty)"
                value={flashcard || autoFlashcard}
                onChange={(e) => setFlashcard(e.target.value)}
                rows={8}
                data-testid="textarea-flashcard"
              />
            </TabsContent>
          </Tabs>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createQuestion.isPending || updateQuestion.isPending}
              data-testid="button-save"
            >
              {isEdit ? "Save Changes" : "Add Question"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

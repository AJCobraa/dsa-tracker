import { useState, useMemo } from "react";
import { useQuestions, useDeleteQuestion, useUpdateQuestion, useImportQuestions } from "@/hooks/use-questions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Search,
  Star,
  ExternalLink,
  Pencil,
  Trash2,
  CreditCard,
  Download,
  Upload,
  ArrowUpDown,
  BookOpen,
} from "lucide-react";
import { PATTERNS, DIFFICULTIES, STATUSES, DIFFICULTY_COLORS, STATUS_COLORS } from "@/lib/constants";
import type { Question } from "@shared/schema";
import { QuestionModal } from "@/components/question-modal";
import { FlashcardMode } from "@/components/flashcard-mode";
import { PerplexityAttribution } from "@/components/PerplexityAttribution";
import { apiRequest } from "@/lib/queryClient";

type SortField = "name" | "difficulty" | "pattern" | "status" | "lastReviewed";
type SortDir = "asc" | "desc";

const DIFF_ORDER: Record<string, number> = { Easy: 0, Medium: 1, Hard: 2 };
const STATUS_ORDER: Record<string, number> = { "Not Started": 0, Attempted: 1, Solved: 2 };

export default function Dashboard() {
  const { data: questions = [], isLoading } = useQuestions();
  const deleteQuestion = useDeleteQuestion();
  const updateQuestion = useUpdateQuestion();
  const importQuestions = useImportQuestions();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [filterPattern, setFilterPattern] = useState("all");
  const [filterDifficulty, setFilterDifficulty] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterImportant, setFilterImportant] = useState(false);
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [flashcardMode, setFlashcardMode] = useState(false);
  const [flashcardFilter, setFlashcardFilter] = useState<"all" | "important" | "review">("all");

  // Get unique patterns including any custom ones
  const allPatterns = useMemo(() => {
    const custom = questions.map((q) => q.pattern).filter((p) => !PATTERNS.includes(p as any));
    return [...PATTERNS, ...new Set(custom)];
  }, [questions]);

  // Filter & sort
  const filtered = useMemo(() => {
    let result = [...questions];

    if (search) {
      const s = search.toLowerCase();
      result = result.filter((q) => q.name.toLowerCase().includes(s));
    }
    if (filterPattern !== "all") {
      result = result.filter((q) => q.pattern === filterPattern);
    }
    if (filterDifficulty !== "all") {
      result = result.filter((q) => q.difficulty === filterDifficulty);
    }
    if (filterStatus !== "all") {
      result = result.filter((q) => q.status === filterStatus);
    }
    if (filterImportant) {
      result = result.filter((q) => q.isImportant);
    }

    result.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "name":
          cmp = a.name.localeCompare(b.name);
          break;
        case "difficulty":
          cmp = (DIFF_ORDER[a.difficulty] ?? 0) - (DIFF_ORDER[b.difficulty] ?? 0);
          break;
        case "pattern":
          cmp = a.pattern.localeCompare(b.pattern);
          break;
        case "status":
          cmp = (STATUS_ORDER[a.status] ?? 0) - (STATUS_ORDER[b.status] ?? 0);
          break;
        case "lastReviewed":
          cmp = (a.lastReviewed ?? "").localeCompare(b.lastReviewed ?? "");
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return result;
  }, [questions, search, filterPattern, filterDifficulty, filterStatus, filterImportant, sortField, sortDir]);

  // Stats
  const stats = useMemo(() => {
    const total = questions.length;
    const solved = questions.filter((q) => q.status === "Solved").length;
    const attempted = questions.filter((q) => q.status === "Attempted").length;

    const byPattern: Record<string, { total: number; solved: number }> = {};
    for (const q of questions) {
      if (!byPattern[q.pattern]) byPattern[q.pattern] = { total: 0, solved: 0 };
      byPattern[q.pattern].total++;
      if (q.status === "Solved") byPattern[q.pattern].solved++;
    }

    return { total, solved, attempted, byPattern };
  }, [questions]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const handleToggleImportant = (q: Question) => {
    updateQuestion.mutate({ id: q.id, data: { isImportant: !q.isImportant } });
  };

  const handleDelete = (q: Question) => {
    deleteQuestion.mutate(q.id, {
      onSuccess: () => {
        toast({ title: "Deleted", description: `"${q.name}" removed.` });
      },
    });
  };

  const handleExport = async () => {
    try {
      const res = await apiRequest("GET", "/api/export");
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `dsa-tracker-backup-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "Exported", description: `${data.length} questions exported.` });
    } catch {
      toast({ title: "Export failed", variant: "destructive" });
    }
  };

  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        importQuestions.mutate(data, {
          onSuccess: (result: any) => {
            toast({ title: "Imported", description: `${result.count} questions imported.` });
          },
        });
      } catch {
        toast({ title: "Import failed", description: "Invalid JSON file.", variant: "destructive" });
      }
    };
    input.click();
  };

  const openFlashcardMode = (filter: "all" | "important" | "review") => {
    setFlashcardFilter(filter);
    setFlashcardMode(true);
  };

  if (flashcardMode) {
    return (
      <FlashcardMode
        questions={questions}
        filter={flashcardFilter}
        onExit={() => setFlashcardMode(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl font-bold tracking-tight flex items-center gap-2" data-testid="text-title">
              <BookOpen className="w-5 h-5 text-primary" />
              NeetCode 250 Tracker
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {stats.solved}/{stats.total > 0 ? stats.total : 250} solved
              {stats.attempted > 0 && ` · ${stats.attempted} attempted`}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button size="sm" variant="secondary" onClick={handleExport} data-testid="button-export">
              <Download className="w-3.5 h-3.5 mr-1.5" />
              Export
            </Button>
            <Button size="sm" variant="secondary" onClick={handleImport} data-testid="button-import">
              <Upload className="w-3.5 h-3.5 mr-1.5" />
              Import
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => openFlashcardMode("all")}
              data-testid="button-review-all"
            >
              <CreditCard className="w-3.5 h-3.5 mr-1.5" />
              Review All
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => openFlashcardMode("important")}
              data-testid="button-review-important"
            >
              <Star className="w-3.5 h-3.5 mr-1.5" />
              Important
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => openFlashcardMode("review")}
              data-testid="button-review-again"
            >
              <ArrowUpDown className="w-3.5 h-3.5 mr-1.5" />
              Review Again
            </Button>
            <Button size="sm" onClick={() => { setEditingQuestion(null); setModalOpen(true); }} data-testid="button-add">
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              Add Question
            </Button>
          </div>
        </div>

        {/* Progress Bar */}
        {stats.total > 0 && (
          <Card className="p-4 mb-6" data-testid="card-progress">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Overall Progress</span>
              <span className="text-sm text-muted-foreground">
                {stats.solved}/{stats.total} ({Math.round((stats.solved / stats.total) * 100)}%)
              </span>
            </div>
            <Progress value={(stats.solved / stats.total) * 100} className="h-2" />

            {/* Pattern Breakdown */}
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
              {Object.entries(stats.byPattern)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([pattern, { total, solved }]) => (
                  <div
                    key={pattern}
                    className="text-xs px-2 py-1.5 rounded bg-muted/50 flex items-center justify-between gap-2"
                  >
                    <span className="truncate text-muted-foreground">{pattern}</span>
                    <span className="font-mono font-medium text-foreground whitespace-nowrap">
                      {solved}/{total}
                    </span>
                  </div>
                ))}
            </div>
          </Card>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              placeholder="Search questions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-9"
              data-testid="input-search"
            />
          </div>
          <Select value={filterPattern} onValueChange={setFilterPattern}>
            <SelectTrigger className="w-[160px] h-9" data-testid="select-pattern">
              <SelectValue placeholder="Pattern" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Patterns</SelectItem>
              {allPatterns.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterDifficulty} onValueChange={setFilterDifficulty}>
            <SelectTrigger className="w-[130px] h-9" data-testid="select-difficulty">
              <SelectValue placeholder="Difficulty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              {DIFFICULTIES.map((d) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[140px] h-9" data-testid="select-status">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            size="sm"
            variant={filterImportant ? "default" : "secondary"}
            onClick={() => setFilterImportant((v) => !v)}
            className="h-9"
            data-testid="button-filter-important"
          >
            <Star className={`w-3.5 h-3.5 mr-1.5 ${filterImportant ? "fill-current" : ""}`} />
            Important
          </Button>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 bg-muted/30 rounded animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <Card className="flex flex-col items-center justify-center py-16 text-center">
            <BookOpen className="w-10 h-10 text-muted-foreground mb-3" />
            <p className="text-sm font-medium mb-1">
              {questions.length === 0 ? "No questions yet" : "No matching questions"}
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              {questions.length === 0
                ? "Add your first question to get started."
                : "Try adjusting your filters."}
            </p>
            {questions.length === 0 && (
              <Button size="sm" onClick={() => { setEditingQuestion(null); setModalOpen(true); }}>
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                Add Question
              </Button>
            )}
          </Card>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" data-testid="table-questions">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="pb-2 pr-3 w-8"></th>
                  <th
                    className="pb-2 pr-3 cursor-pointer select-none"
                    onClick={() => handleSort("name")}
                  >
                    <span className="flex items-center gap-1">
                      Name
                      {sortField === "name" && (
                        <ArrowUpDown className="w-3 h-3" />
                      )}
                    </span>
                  </th>
                  <th
                    className="pb-2 pr-3 cursor-pointer select-none"
                    onClick={() => handleSort("difficulty")}
                  >
                    <span className="flex items-center gap-1">
                      Difficulty
                      {sortField === "difficulty" && (
                        <ArrowUpDown className="w-3 h-3" />
                      )}
                    </span>
                  </th>
                  <th
                    className="pb-2 pr-3 cursor-pointer select-none"
                    onClick={() => handleSort("pattern")}
                  >
                    <span className="flex items-center gap-1">
                      Pattern
                      {sortField === "pattern" && (
                        <ArrowUpDown className="w-3 h-3" />
                      )}
                    </span>
                  </th>
                  <th
                    className="pb-2 pr-3 cursor-pointer select-none"
                    onClick={() => handleSort("status")}
                  >
                    <span className="flex items-center gap-1">
                      Status
                      {sortField === "status" && (
                        <ArrowUpDown className="w-3 h-3" />
                      )}
                    </span>
                  </th>
                  <th className="pb-2 pr-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((q) => (
                  <tr
                    key={q.id}
                    className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                    data-testid={`row-question-${q.id}`}
                  >
                    <td className="py-2.5 pr-2">
                      <button
                        onClick={() => handleToggleImportant(q)}
                        className="p-1 rounded hover:bg-muted/50 transition-colors"
                        data-testid={`button-star-${q.id}`}
                      >
                        <Star
                          className={`w-3.5 h-3.5 ${
                            q.isImportant
                              ? "fill-amber-400 text-amber-400"
                              : "text-muted-foreground"
                          }`}
                        />
                      </button>
                    </td>
                    <td className="py-2.5 pr-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{q.name}</span>
                        {q.link && (
                          <a
                            href={q.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-primary transition-colors"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                        {q.reviewAgain && (
                          <span className="text-[10px] bg-orange-500/15 text-orange-400 px-1.5 py-0.5 rounded">
                            Review
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 pr-3">
                      <Badge variant="outline" className={`text-xs ${DIFFICULTY_COLORS[q.difficulty] ?? ""}`}>
                        {q.difficulty}
                      </Badge>
                    </td>
                    <td className="py-2.5 pr-3">
                      <span className="text-xs text-muted-foreground">{q.pattern}</span>
                    </td>
                    <td className="py-2.5 pr-3">
                      <Badge variant="outline" className={`text-xs ${STATUS_COLORS[q.status] ?? ""}`}>
                        {q.status}
                      </Badge>
                    </td>
                    <td className="py-2.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="w-7 h-7"
                              onClick={() => {
                                setEditingQuestion(q);
                                setModalOpen(true);
                              }}
                              data-testid={`button-edit-${q.id}`}
                            >
                              <Pencil className="w-3 h-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Edit</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="w-7 h-7"
                              onClick={() => {
                                setEditingQuestion(q);
                                setFlashcardFilter("all");
                                setFlashcardMode(true);
                              }}
                              data-testid={`button-flashcard-${q.id}`}
                            >
                              <CreditCard className="w-3 h-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Flashcard</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="w-7 h-7 text-destructive"
                              onClick={() => handleDelete(q)}
                              data-testid={`button-delete-${q.id}`}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Delete</TooltipContent>
                        </Tooltip>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-8 text-xs text-muted-foreground text-center">
          {filtered.length > 0 && (
            <span>
              Showing {filtered.length} of {questions.length} questions
            </span>
          )}
        </div>

        <div className="mt-4">
          <PerplexityAttribution />
        </div>
      </div>

      {/* Modal */}
      <QuestionModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        question={editingQuestion}
        allPatterns={allPatterns}
      />
    </div>
  );
}

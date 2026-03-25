export const PATTERNS = [
  "Arrays",
  "Hashing",
  "Two Pointers",
  "Sliding Window",
  "Stack",
  "Binary Search",
  "Linked List",
  "Trees",
  "Tries",
  "Heap / Priority Queue",
  "Backtracking",
  "Graphs",
  "Dynamic Programming",
  "Greedy",
  "Intervals",
  "Math & Geometry",
  "Bit Manipulation",
] as const;

export const DIFFICULTIES = ["Easy", "Medium", "Hard"] as const;
export const STATUSES = ["Not Started", "Attempted", "Solved"] as const;

export type Difficulty = (typeof DIFFICULTIES)[number];
export type Status = (typeof STATUSES)[number];
export type Pattern = string;

export const DIFFICULTY_COLORS: Record<string, string> = {
  Easy: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  Medium: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  Hard: "bg-red-500/15 text-red-400 border-red-500/20",
};

export const STATUS_COLORS: Record<string, string> = {
  "Not Started": "bg-zinc-500/15 text-zinc-400 border-zinc-500/20",
  Attempted: "bg-orange-500/15 text-orange-400 border-orange-500/20",
  Solved: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
};

import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const questions = sqliteTable("questions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  link: text("link").notNull().default(""),
  difficulty: text("difficulty").notNull().default("Medium"),
  pattern: text("pattern").notNull().default("Arrays"),
  status: text("status").notNull().default("Not Started"),
  isImportant: integer("is_important", { mode: "boolean" }).notNull().default(false),
  hint: text("hint").notNull().default(""),
  patternNotes: text("pattern_notes").notNull().default(""),
  codeSnippet: text("code_snippet").notNull().default(""),
  flashcard: text("flashcard").notNull().default(""),
  lastReviewed: text("last_reviewed"),
  reviewAgain: integer("review_again", { mode: "boolean" }).notNull().default(false),
});

export const insertQuestionSchema = createInsertSchema(questions).omit({
  id: true,
});

export type InsertQuestion = z.infer<typeof insertQuestionSchema>;
export type Question = typeof questions.$inferSelect;

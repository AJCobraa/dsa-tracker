import { questions, type Question, type InsertQuestion } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  getAllQuestions(): Question[];
  getQuestion(id: number): Question | undefined;
  createQuestion(data: InsertQuestion): Question;
  updateQuestion(id: number, data: Partial<InsertQuestion>): Question | undefined;
  deleteQuestion(id: number): boolean;
  importQuestions(data: InsertQuestion[]): Question[];
}

export class DatabaseStorage implements IStorage {
  getAllQuestions(): Question[] {
    return db.select().from(questions).all();
  }

  getQuestion(id: number): Question | undefined {
    return db.select().from(questions).where(eq(questions.id, id)).get();
  }

  createQuestion(data: InsertQuestion): Question {
    return db.insert(questions).values(data).returning().get();
  }

  updateQuestion(id: number, data: Partial<InsertQuestion>): Question | undefined {
    const existing = this.getQuestion(id);
    if (!existing) return undefined;
    return db.update(questions).set(data).where(eq(questions.id, id)).returning().get();
  }

  deleteQuestion(id: number): boolean {
    const result = db.delete(questions).where(eq(questions.id, id)).run();
    return result.changes > 0;
  }

  importQuestions(data: InsertQuestion[]): Question[] {
    // Clear existing data then insert all
    db.delete(questions).run();
    const results: Question[] = [];
    for (const q of data) {
      const inserted = db.insert(questions).values(q).returning().get();
      results.push(inserted);
    }
    return results;
  }
}

export const storage = new DatabaseStorage();

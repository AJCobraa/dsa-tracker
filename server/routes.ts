import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { insertQuestionSchema } from "@shared/schema";

export async function registerRoutes(server: Server, app: Express) {
  // Get all questions
  app.get("/api/questions", (_req, res) => {
    const questions = storage.getAllQuestions();
    res.json(questions);
  });

  // Get a single question
  app.get("/api/questions/:id", (req, res) => {
    const id = parseInt(req.params.id);
    const question = storage.getQuestion(id);
    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }
    res.json(question);
  });

  // Create a question
  app.post("/api/questions", (req, res) => {
    const result = insertQuestionSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ message: "Invalid data", errors: result.error.flatten() });
    }
    const question = storage.createQuestion(result.data);
    res.status(201).json(question);
  });

  // Update a question
  app.patch("/api/questions/:id", (req, res) => {
    const id = parseInt(req.params.id);
    const partial = insertQuestionSchema.partial().safeParse(req.body);
    if (!partial.success) {
      return res.status(400).json({ message: "Invalid data", errors: partial.error.flatten() });
    }
    const question = storage.updateQuestion(id, partial.data);
    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }
    res.json(question);
  });

  // Delete a question
  app.delete("/api/questions/:id", (req, res) => {
    const id = parseInt(req.params.id);
    const deleted = storage.deleteQuestion(id);
    if (!deleted) {
      return res.status(404).json({ message: "Question not found" });
    }
    res.json({ success: true });
  });

  // Export all questions
  app.get("/api/export", (_req, res) => {
    const questions = storage.getAllQuestions();
    res.json(questions);
  });

  // Import questions (replaces all existing data)
  app.post("/api/import", (req, res) => {
    const data = req.body;
    if (!Array.isArray(data)) {
      return res.status(400).json({ message: "Expected an array of questions" });
    }
    try {
      const imported = storage.importQuestions(data);
      res.json({ count: imported.length, questions: imported });
    } catch (e: any) {
      return res.status(400).json({ message: e.message || "Import failed" });
    }
  });
}

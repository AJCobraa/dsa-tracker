import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Question } from "@shared/schema";

export function useQuestions() {
  return useQuery<Question[]>({
    queryKey: ["/api/questions"],
  });
}

export function useCreateQuestion() {
  return useMutation({
    mutationFn: async (data: Partial<Question>) => {
      const res = await apiRequest("POST", "/api/questions", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/questions"] });
    },
  });
}

export function useUpdateQuestion() {
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Question> }) => {
      const res = await apiRequest("PATCH", `/api/questions/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/questions"] });
    },
  });
}

export function useDeleteQuestion() {
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/questions/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/questions"] });
    },
  });
}

export function useImportQuestions() {
  return useMutation({
    mutationFn: async (data: any[]) => {
      const res = await apiRequest("POST", "/api/import", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/questions"] });
    },
  });
}

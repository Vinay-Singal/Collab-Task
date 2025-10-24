"use client";

import { useState } from "react";

export default function TaskCard({ task }: { task: any }) {
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);

  const getAISuggestion = async () => {
    const res = await fetch("/api/ai/suggest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description: task.description }),
    });

    const data = await res.json();
    setAiSuggestion(data.suggestion);
  };

  return (
    <div className="p-4 border rounded shadow">
      <h3 className="font-bold">{task.title}</h3>
      <p>{task.description}</p>

      <button
        onClick={getAISuggestion}
        className="mt-2 px-3 py-1 bg-blue-500 text-white rounded"
      >
        Get AI Suggestion
      </button>

      {aiSuggestion && (
        <p className="mt-2 text-sm text-gray-700 italic">{aiSuggestion}</p>
      )}
    </div>
  );
}

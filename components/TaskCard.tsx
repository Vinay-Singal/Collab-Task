"use client";

import { useState } from "react";
// Import the ITask interface for strong typing
import { ITask } from "@/lib/models/Task";

// Define the Props interface for clarity and type safety
interface TaskCardProps {
  task: ITask; // Use the imported ITask interface here!
}

// Update the function signature to use the TaskCardProps interface
export default function TaskCard({ task }: TaskCardProps) {
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const getAISuggestion = async () => {
    setIsLoading(true);
    setAiSuggestion(null); // Clear previous suggestion

    try {
      // NOTE: You used /api/ai/suggest in the original, but based on the
      // file we fixed, the route should be /api/tasks/suggest. I'm updating it here.
      const res = await fetch("/api/tasks/suggest", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Add Authorization header if needed, but for now, we rely on the backend check.
        },
        // We need to send the title too, as the AI prompt uses both.
        body: JSON.stringify({ title: task.title, description: task.description }),
      });

      if (!res.ok) {
        throw new Error(`AI suggestion failed: ${res.statusText}`);
      }

      const data: { suggestions?: string[] } = await res.json();
      
      // Update the suggestion with the first item, or an error message
      if (data.suggestions && data.suggestions.length > 0) {
        // Join the suggestions for display
        setAiSuggestion(data.suggestions.join(" | "));
      } else {
        setAiSuggestion("No suggestions could be generated. Try again.");
      }

    } catch (error) {
      const message = error instanceof Error ? error.message : "An unknown error occurred.";
      console.error("Error fetching AI suggestion:", message);
      setAiSuggestion(`Error: ${message.substring(0, 50)}...`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 border border-gray-200 rounded-xl shadow-lg bg-white transition hover:shadow-xl">
      <h3 className="text-xl font-semibold text-gray-800 truncate">{task.title}</h3>
      <p className="mt-1 text-gray-600 line-clamp-2">{task.description}</p>
      
      {/* Action buttons (e.g., Edit/Delete, usually passed as props) would go here */}
      <div className="flex justify-end pt-3">
        {/* Placeholder for Edit/Delete actions */}
        <button
          className="text-sm font-medium text-red-600 hover:text-red-800 transition mr-4"
          onClick={() => console.log("Delete Task:", task._id)}
        >
          Delete
        </button>
        <button
          className="text-sm font-medium text-indigo-600 hover:text-indigo-800 transition"
          onClick={() => console.log("Edit Task:", task._id)}
        >
          Edit
        </button>
      </div>

      <button
        onClick={getAISuggestion}
        disabled={isLoading}
        className={`mt-4 w-full px-3 py-2 text-sm font-semibold rounded-lg transition duration-200 
          ${isLoading 
            ? 'bg-gray-400 text-gray-700 cursor-not-allowed' 
            : 'bg-indigo-500 text-white hover:bg-indigo-600 shadow-md hover:shadow-lg'
          }`}
      >
        {isLoading ? 'Generating...' : 'Get AI Suggestion'}
      </button>

      {aiSuggestion && (
        <div className="mt-3 p-3 bg-indigo-50 border-l-4 border-indigo-400 rounded-md">
          <p className="text-sm font-medium text-indigo-800">
            AI Suggestions:
          </p>
          <p className="mt-1 text-xs text-indigo-700 italic">
            {aiSuggestion}
          </p>
        </div>
      )}
    </div>
  );
}

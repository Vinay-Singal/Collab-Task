import { GoogleGenAI } from "@google/genai"; // Import the GoogleGenAI client

// Use a global variable to cache the client, improving performance
let client: GoogleGenAI;

// Initialize the client once and reuse it
function getAIClient(): GoogleGenAI | null {
  if (process.env.GEMINI_API_KEY) {
    if (!client) {
      // Use the GEMINI_API_KEY environment variable
      client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    }
    return client;
  }
  return null;
}

/**
 * Ask the model to return 3-5 short suggestion lines for a task.
 * Returns an array of suggestion strings.
 */
export async function getTaskSuggestions(
  title: string,
  description: string
): Promise<string[]> {
  const safeTitle = (title || "").trim().slice(0, 300);
  const safeDesc = (description || "").trim().slice(0, 1200);

  const aiClient = getAIClient();

  if (!aiClient) {
    // Fallback if no GEMINI_API_KEY is provided
    return [
      `Consider breaking "${safeTitle}" into smaller subtasks.`,
      `Add a deadline for "${safeTitle}" to improve tracking.`,
      `Clarify prerequisites or dependencies for "${safeTitle}".`,
      `💡 Set GEMINI_API_KEY in Vercel to enable real AI features.`,
    ];
  }

  const systemInstruction = `You are a helpful task assistant. Given a task title and description, return 3 concise, actionable suggestions (one per line) to improve, clarify, or expand the task. Keep each suggestion short (max 100 characters). Return ONLY the bulleted suggestions, nothing else.`;

  const userPrompt = `Title: ${safeTitle}\nDescription: ${safeDesc}`;

  try {
    const response = await aiClient.models.generateContent({
      model: "gemini-2.5-flash", // Use the powerful and fast flash model
      contents: [{ role: "user", parts: [{ text: userPrompt }] }],
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.6,
        maxOutputTokens: 200,
      },
    });

    const raw = response.text || "";

    // Normalize the output into an array of clean strings
    const lines = raw
      .split(/\r?\n/)
      .map((l) => l.replace(/^[\-\*\d\.\)\s]+/, "").trim()) // strip bullet markers
      .filter(Boolean)
      .slice(0, 5); // take up to 5 suggestions

    if (lines.length === 0) {
      return [
        `Add a deadline to "${safeTitle}".`,
        `Break it into smaller subtasks.`,
        `Specify acceptance criteria.`,
      ];
    }

    return lines;
  } catch (err) {
    console.error("Gemini AI error:", err);
    // Fallback suggestions on error
    return [
      `Error fetching live suggestions. Review dependencies.`,
      `💡 Ensure your GEMINI_API_KEY is valid and deployed.`,
    ];
  }
}

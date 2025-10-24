// lib/ai.ts
const OpenAI = require("openai");

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Ask the model to return 3-5 short suggestion lines for a task.
 * Returns an array of suggestion strings.
 */
export async function getTaskSuggestions(title: string, description: string) {
  // Basic sanitization
  const safeTitle = (title || "").trim().slice(0, 300);
  const safeDesc = (description || "").trim().slice(0, 1200);

  if (!process.env.OPENAI_API_KEY) {
    // If no key, return a helpful fallback suggestion list (mock)
    return [
      `Consider breaking "${safeTitle}" into smaller subtasks.`,
      `Add a deadline for "${safeTitle}" to improve tracking.`,
      `Clarify prerequisites or dependencies for "${safeTitle}".`,
    ];
  }

  const prompt = [
    `You are a helpful task assistant.`,
    `Given a task title and description, return 3 concise, actionable suggestions (one per line) to improve/clarify/expand the task. Keep each suggestion short (max 100 characters).`,
    ``,
    `Title: ${safeTitle}`,
    `Description: ${safeDesc}`,
    ``,
    `Return only the suggestions as bullet lines or numbered lines.`
  ].join("\n");

  try {
    const response = await client.chat.completions.create({
      model: "gpt-3.5-turbo", // or "gpt-4" if you have access
      messages: [{ role: "user", content: prompt }],
      temperature: 0.6,
      max_tokens: 200,
      n: 1,
    });

    const raw = response.choices?.[0]?.message?.content || "";

    // Normalize the output into an array of clean strings
    const lines = raw
      .split(/\r?\n/)
      .map((l) => l.replace(/^[\-\*\d\.\)\s]+/, "").trim()) // strip bullet markers
      .filter(Boolean)
      .slice(0, 5); // take up to 5 suggestions

    if (lines.length === 0) {
      // fallback if model responded unexpectedly
      return [
        `Add a deadline to "${safeTitle}".`,
        `Break it into smaller subtasks.`,
        `Specify acceptance criteria.`,
      ];
    }

    return lines;
  } catch (err) {
    console.error("AI error:", err);
    // Fallback suggestions on error
    return [
      `Consider breaking "${safeTitle}" into smaller subtasks.`,
      `Add a deadline for "${safeTitle}".`,
      `Review dependencies before starting "${safeTitle}".`,
      `💡 To get real AI suggestions, use your own OpenAI API key.`,
    ];
  }
}

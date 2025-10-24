// app/api/tasks/suggest/route.ts
import { NextResponse } from "next/server";
import { getTaskSuggestions } from "../../../../../lib/ai";
const jwt = require("jsonwebtoken");

// Optional: helper to verify JWT (if your app uses bearer tokens)
function getUserIdFromReq(req: Request) {
  const auth = req.headers.get("authorization") || "";
  if (!auth.startsWith("Bearer ")) return null;
  const token = auth.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id?: string };
    return decoded?.id ?? null;
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  try {
    // If you want only authenticated users to use AI, check JWT:
    const userId = getUserIdFromReq(req);
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { title, description } = await req.json();

    if (!title || !description) {
      return NextResponse.json({ message: "Title and description required" }, { status: 400 });
    }

    const suggestions = await getTaskSuggestions(title, description);
    return NextResponse.json({ suggestions }, { status: 200 });
  } catch (error: any) {
  console.error("AI route error:", error.message, error.stack);
  return NextResponse.json({ message: "Error generating suggestions" }, { status: 500 });
}
}

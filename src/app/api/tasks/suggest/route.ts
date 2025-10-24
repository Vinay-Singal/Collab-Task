import { NextResponse } from "next/server";
import { getTaskSuggestions } from "../../../../../lib/ai";
import jwt from "jsonwebtoken"; // Corrected to use ES Module import

// Optional: helper to verify JWT (if your app uses bearer tokens)
// Type the Request object explicitly to ensure compatibility with Next.js route handlers
function getUserIdFromReq(req: Request): string | null {
  const auth = req.headers.get("authorization") || "";
  if (!auth.startsWith("Bearer ")) return null;
  const token = auth.split(" ")[1];
  try {
    // Ensure jwt.verify returns a consistent object shape
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string, iat: number, exp: number };
    return decoded.id ?? null;
  } catch (e) {
    // If token verification fails, return null
    return null;
  }
}

export async function POST(req: Request) {
  try {
    // If you want only authenticated users to use AI, check JWT:
    const userId = getUserIdFromReq(req);
    // NOTE: If you are using NextAuth, the authentication approach will be different.
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Define the type for the request body for type safety
    interface SuggestionRequestBody {
      title: string;
      description: string;
    }

    const { title, description } = await req.json() as SuggestionRequestBody;

    if (!title || !description) {
      return NextResponse.json({ message: "Title and description required" }, { status: 400 });
    }

    const suggestions = await getTaskSuggestions(title, description);
    return NextResponse.json({ suggestions }, { status: 200 });
  } catch (error) { // Removed 'any' here, using the default 'unknown' type
    // If you need access to the error properties (like .message), you must check the type:
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    console.error("AI route error:", errorMessage);
    return NextResponse.json({ message: "Error generating suggestions" }, { status: 500 });
  }
}

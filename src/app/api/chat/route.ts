import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

/**
 * ✅ Utility function to extract and verify JWT token
 */
async function verifyToken(req: Request): Promise<{ id: string } | null> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;

  const token = authHeader.split(" ")[1];
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };
    return decoded;
  } catch (error) {
    console.error("Invalid token:", (error as Error).message);
    return null;
  }
}

/**
 * ✅ POST /api/chat
 * Handles user chat requests securely with user verification
 */
export async function POST(req: Request) {
  try {
    // 🔒 Step 1: Validate token
    const decoded = await verifyToken(req);
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized - Invalid Token" }, { status: 401 });
    }

    // 🔍 Step 2: Parse request body
    const body = await req.json();
    const { userId, message } = body;

    if (!userId || !message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 🔐 Step 3: Ensure userId from body matches decoded token
    if (userId !== decoded.id) {
      return NextResponse.json({ error: "Unauthorized - User mismatch" }, { status: 401 });
    }

    // 💬 Step 4: Process chat logic (replace with your logic)
    // Example: you could save to DB or call OpenAI API
    const chatResponse = {
      reply: `Received your message: "${message}"`,
      timestamp: new Date().toISOString(),
    };

    // ✅ Step 5: Return safe response
    return NextResponse.json({ success: true, data: chatResponse }, { status: 200 });
  } catch (err) {
    console.error("Error in /api/chat:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/**
 * (Optional) ✅ GET /api/chat - for testing endpoint
 */
export async function GET() {
  return NextResponse.json({ message: "Chat API is working fine ✅" });
}

import { NextResponse } from "next/server";
import { connectDB } from "../../../../lib/db";
import Task from "../../../../lib/models/Task";
import jwt from "jsonwebtoken";

// Define the JWTPayload structure
interface JWTPayload {
  id: string;
}

// Helper function to extract and verify the token (used in both GET and POST)
async function getUserIdFromToken(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;

  const token = authHeader.split(" ")[1];
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
    return decoded.id;
  } catch (_err) { // Renamed to _err to fix unused variable warning
    return null;
  }
}

// GET /api/tasks (READ all tasks for the authenticated user)
export async function GET(req: Request) {
  try {
    await connectDB();
    const userId = await getUserIdFromToken(req);
    if (!userId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    // Fetch tasks belonging only to the authenticated user
    const tasks = await Task.find({ user: userId }); 
    return NextResponse.json(tasks);
  } catch (_err) { // Renamed to _err to fix unused variable warning
    console.error(_err);
    return NextResponse.json({ message: "Error fetching tasks" }, { status: 500 });
  }
}

// POST /api/tasks (CREATE a new task)
export async function POST(req: Request) {
  try {
    await connectDB();
    const userId = await getUserIdFromToken(req);
    if (!userId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { title, description } = await req.json();
    
    if (!title || !description) return NextResponse.json({ message: "Title and description required" }, { status: 400 });

    const newTask = await Task.create({ title, description, user: userId });
    return NextResponse.json(newTask, { status: 201 });
  } catch (_err) { // Renamed to _err to fix unused variable warning
    console.error(_err);
    return NextResponse.json({ message: "Error creating task" }, { status: 500 });
  }
}

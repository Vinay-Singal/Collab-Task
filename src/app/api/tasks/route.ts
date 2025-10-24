import { NextResponse } from "next/server";
import { connectDB } from "../../../../lib/db";
import Task from "../../../../lib/models/Task";
import jwt from "jsonwebtoken";

async function getUserIdFromToken(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;

  const token = authHeader.split(" ")[1];
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };
    return decoded.id;
  } catch (err) {
    return null;
  }
}

// GET /api/tasks
export async function GET(req: Request) {
  try {
    await connectDB();
    const userId = await getUserIdFromToken(req);
    if (!userId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const tasks = await Task.find({ user: userId });
    return NextResponse.json(tasks);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: "Error fetching tasks" }, { status: 500 });
  }
}

// POST /api/tasks
export async function POST(req: Request) {
  try {
    await connectDB();
    const userId = await getUserIdFromToken(req);
    if (!userId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { title, description } = await req.json();
    const newTask = await Task.create({ title, description, user: userId });
    return NextResponse.json(newTask);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: "Error creating task" }, { status: 500 });
  }
}

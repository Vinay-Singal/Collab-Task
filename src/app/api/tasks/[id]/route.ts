
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "../../../../../lib/db";
import Task, { ITask } from "../../../../../lib/models/Task";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

// Interface to define the expected structure of the decoded JWT payload
interface JWTPayload {
  id: string;
  iat: number;
  exp: number;
}

// Helper function to extract and verify the token
function getUserIdFromRequest(req: NextRequest): string | null {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;

  const token = authHeader.split(" ")[1];
  try {
    // Explicitly type the result of jwt.verify with JWTPayload
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
    return decoded.id;
  } catch (_e) { // Suppress unused variable warning
    return null;
  }
}

// **CRITICAL FINAL FIX:** Use inline intersection typing for the second argument
// This is required to satisfy the strict Next.js App Router compiler
type RouteContext = { params: { id: string } };

// PUT handler (UPDATE)
export async function PUT(
  req: NextRequest, 
  { params }: RouteContext // Use the destructured type definition
) { 
  try {
    await connectDB();
    const { id } = params;

    const userId = getUserIdFromRequest(req);
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized: Invalid or missing token" }, { status: 401 });
    }
    
    // Validate if the ID is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return NextResponse.json({ message: "Invalid Task ID" }, { status: 400 });
    }

    // Define type for request body
    interface UpdateTaskBody {
        title: string;
        description: string;
    }
    
    const { title, description } = await req.json() as UpdateTaskBody;
    
    if (!title || !description) {
        return NextResponse.json({ message: "Title and description are required" }, { status: 400 });
    }
    
    // Find and update the task, ensuring the user owns it
    const task = await Task.findOneAndUpdate(
      { _id: id, user: userId },
      { title, description },
      { new: true }
    ) as ITask | null; // Cast the result to the expected ITask type

    if (!task) return NextResponse.json({ message: "Task not found or unauthorized access" }, { status: 404 });
    return NextResponse.json(task);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    console.error(`PUT /api/tasks/${params.id} error:`, errorMessage); 
    return NextResponse.json({ message: "Error updating task", error: errorMessage }, { status: 500 });
  }
}

// DELETE handler (DELETE)
export async function DELETE(
  req: NextRequest, 
  { params }: RouteContext // Use the destructured type definition
) {
  try {
    await connectDB();
    const { id } = params;

    const userId = getUserIdFromRequest(req);
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized: Invalid or missing token" }, { status: 401 });
    }

    // Validate if the ID is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return NextResponse.json({ message: "Invalid Task ID" }, { status: 400 });
    }
    
    // Find and delete the task, ensuring the user owns it
    const deleted = await Task.findOneAndDelete({ _id: id, user: userId });
    
    if (!deleted) return NextResponse.json({ message: "Task not found or unauthorized access" }, { status: 404 });

    return NextResponse.json({ message: "Task deleted successfully" });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    console.error(`DELETE /api/tasks/${params.id} error:`, errorMessage);
    return NextResponse.json({ message: "Error deleting task", error: errorMessage }, { status: 500 });
  }
}

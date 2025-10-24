
import { NextResponse } from "next/server";
import { connectDB } from "../../../../../lib/db";
import Task from "../../../../../lib/models/Task";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

// Helper function to extract and verify the token
function getUserIdFromRequest(req) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded.id;
  } catch (_e) {
    return null;
  }
}

// PUT handler (UPDATE)
export async function PUT(req, context) {
  try {
    await connectDB();
    const id = context.params.id; // Access params directly from context

    const userId = getUserIdFromRequest(req);
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized: Invalid or missing token" }, { status: 401 });
    }
    
    // Validate if the ID is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return NextResponse.json({ message: "Invalid Task ID" }, { status: 400 });
    }

    const { title, description } = await req.json();
    
    if (!title || !description) {
        return NextResponse.json({ message: "Title and description are required" }, { status: 400 });
    }
    
    // Find and update the task, ensuring the user owns it
    const task = await Task.findOneAndUpdate(
      { _id: id, user: userId },
      { title, description },
      { new: true }
    );

    if (!task) return NextResponse.json({ message: "Task not found or unauthorized access" }, { status: 404 });
    return NextResponse.json(task);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    console.error(`PUT /api/tasks/${context.params.id} error:`, errorMessage); 
    return NextResponse.json({ message: "Error updating task", error: errorMessage }, { status: 500 });
  }
}

// DELETE handler (DELETE)
export async function DELETE(req, context) {
  try {
    await connectDB();
    const id = context.params.id; // Access params directly from context

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
    console.error(`DELETE /api/tasks/${context.params.id} error:`, errorMessage);
    return NextResponse.json({ message: "Error deleting task", error: errorMessage }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "../../../../../lib/db";
import Task from "../../../../../lib/models/Task";
import jwt from "jsonwebtoken";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    const { id } = params;

    // Get token from headers
    const authHeader = req.headers.get("authorization");
    if (!authHeader) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const token = authHeader.split(" ")[1];
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
    const userId = decoded.id;

    const { title, description } = await req.json();
    const task = await Task.findOneAndUpdate(
      { _id: id, user: userId },
      { title, description },
      { new: true }
    );

    if (!task) return NextResponse.json({ message: "Task not found" }, { status: 404 });
    return NextResponse.json(task);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Error updating task" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    const { id } = params;

    const authHeader = req.headers.get("authorization");
    if (!authHeader) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const token = authHeader.split(" ")[1];
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
    const userId = decoded.id;

    const deleted = await Task.findOneAndDelete({ _id: id, user: userId });
    if (!deleted) return NextResponse.json({ message: "Task not found" }, { status: 404 });

    return NextResponse.json({ message: "Task deleted" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Error deleting task" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "../../../../../lib/db";
import User from "../../../../../lib/models/User";

export async function POST(req: Request) {
  try {
    await connectDB();
    const { username, email, password } = await req.json();

    if (!username || !email || !password) {
      return NextResponse.json({ message: "All fields are required" }, { status: 400 });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ message: "Email already registered" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ username, email, password: hashedPassword });

    // Exclude password in response
    const { password: _password, ...userWithoutPassword } = user.toObject();

    return NextResponse.json({ message: "User registered", user: userWithoutPassword }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Error registering user" }, { status: 500 });
  }
}

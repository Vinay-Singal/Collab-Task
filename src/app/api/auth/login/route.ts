import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "../../../../../lib/db";
import User from "../../../../../lib/models/User";
import jwt from "jsonwebtoken";

export async function POST(req: Request) {
  try {
    await connectDB();
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ message: "Email and password are required" }, { status: 400 });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({ message: "Invalid email or password" }, { status: 401 });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return NextResponse.json({ message: "Invalid email or password" }, { status: 401 });
    }

    // Ensure JWT_SECRET is available at runtime
    if (!process.env.JWT_SECRET) {
      // Throw an error here since this is a critical configuration failure
      throw new Error("JWT_SECRET environment variable is not defined.");
    }

    // Create JWT token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" });

    // Exclude password from response (Fixes TypeScript/ESLint warnings)
    const { password: _password, ...userWithoutPassword } = user.toObject();

    return NextResponse.json({ message: "Login successful", user: userWithoutPassword, token });
  } catch (error) {
    // Standardized error response for API stability
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    console.error("Login Error:", errorMessage);
    return NextResponse.json({ message: "Internal server error during login", error: errorMessage }, { status: 500 });
  }
}

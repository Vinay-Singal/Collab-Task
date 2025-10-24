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

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not defined in .env.local");
    }

    // Create JWT token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" });

    // Exclude password from response
    const { password: _password, ...userWithoutPassword } = user.toObject();

    // Optionally set token as httpOnly cookie
    // const response = NextResponse.json({ message: "Login successful", user: userWithoutPassword });
    // response.cookies.set("token", token, { httpOnly: true, secure: true, maxAge: 60*60*24 });
    // return response;

    return NextResponse.json({ message: "Login successful", user: userWithoutPassword, token });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Error logging in" }, { status: 500 });
  }
}

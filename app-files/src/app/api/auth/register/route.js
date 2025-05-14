// src/app/api/auth/register/route.js
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs'; // Use bcryptjs as 'bcrypt' can have native binding issues

const prisma = new PrismaClient();
const SALT_ROUNDS = 10; // For bcrypt hashing

export async function POST(request) {
  try {
    const { name, email, password, role = 'user' } = await request.json(); // Default role to 'user'

    // --- Input Validation ---
    if (!name || !email || !password) {
      return NextResponse.json({ message: 'Name, email, and password are required.' }, { status: 400 });
    }
    // Basic email validation (more robust validation can be added)
    if (!/\S+@\S+\.\S+/.test(email)) {
      return NextResponse.json({ message: 'Invalid email format.' }, { status: 400 });
    }
    // Password strength (example: min 8 chars, can be more complex)
    if (password.length < 8) {
      return NextResponse.json({ message: 'Password must be at least 8 characters long.' }, { status: 400 });
    }
    // Role validation
    const validRoles = ['user', 'admin', 'team_leader', 'director']; // Reflects your schema idea
    if (!validRoles.includes(role)) {
        return NextResponse.json({ message: 'Invalid role specified.' }, { status: 400 });
    }
    // Official email domain check (example - customize or remove)
    // const officialDomain = "example.gov"; // Configure this
    // if (!email.endsWith(`@${officialDomain}`)) {
    //   return NextResponse.json({ message: `Registration requires an official @${officialDomain} email.` }, { status: 400 });
    // }


    // --- Check if user already exists ---
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json({ message: 'User with this email already exists.' }, { status: 409 }); // 409 Conflict
    }

    // --- Hash password ---
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // --- Create user ---
    const newUser = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(), // Store email in lowercase for consistency
        passwordHash: hashedPassword,
        role: role,
        // personnelId could be linked later or via an admin process
      },
    });

    // Don't return passwordHash in the response
    const { passwordHash, ...userWithoutPassword } = newUser;

    return NextResponse.json({
      message: 'User registered successfully!',
      user: userWithoutPassword,
    }, { status: 201 });

  } catch (error) {
    console.error('Registration error:', error);
    // Check for Prisma specific errors if needed, e.g., unique constraint violation if not caught above
    return NextResponse.json({ message: 'An error occurred during registration.' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
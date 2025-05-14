// src/app/api/auth/register/route.js
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

export async function POST(request) {
  try {
    // Destructure 'role' here and provide a default if not sent by client
    const { name, email, password, employeeId, role: requestedRole } = await request.json(); 

    // --- Input Validation ---
    if (!name || !email || !password || !employeeId) {
      return NextResponse.json({ message: 'Name, email, password, and Employee ID are required.' }, { status: 400 });
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

    // --- Validate Employee ID and find corresponding Personnel record ---
    const personnelRecord = await prisma.personnel.findUnique({
      where: { personnelId: employeeId }, // Assuming your Personnel model's ID field is 'personnelId'
    });

    if (!personnelRecord) {
      return NextResponse.json({ message: 'Invalid Employee ID. Personnel record not found.' }, { status: 400 });
    }

    // --- Check if this Personnel record is already linked to another User ---
    const existingUserByPersonnelId = await prisma.user.findUnique({
      where: { personnelId: employeeId }, // Assuming User.personnelId is unique
    });
    if (existingUserByPersonnelId) {
      return NextResponse.json({ message: 'This Employee ID is already linked to another user account.' }, { status: 409 });
    }

    // --- Hash password ---
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // --- Create user and link to personnelId ---
    const newUser = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        passwordHash: hashedPassword,
        role: 'user', // New registrations are always 'user' role by default
        personnelId: employeeId, // Link to the validated personnelId
      },
    });

    // Don't return passwordHash in the response
    const { passwordHash, ...userWithoutPassword } = newUser;

    return NextResponse.json({
      message: 'User registered successfully and linked to Employee ID!',
      user: userWithoutPassword,
    }, { status: 201 });

  } catch (error) {
    console.error('Registration error:', error);
    // Handle Prisma unique constraint errors if any weren't caught above, e.g. if email somehow still conflicts
    if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
         return NextResponse.json({ message: 'Email address is already in use.' }, { status: 409 });
    }
    if (error.code === 'P2002' && error.meta?.target?.includes('personnelId')) {
         // This should have been caught by existingUserByPersonnelId check, but as a fallback
         return NextResponse.json({ message: 'This Employee ID is already linked by another user (concurrent registration attempt).' }, { status: 409 });
    }
    return NextResponse.json({ message: 'An error occurred during registration.' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
// src/app/api/auth/login/route.js
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken'; // Used for SIGNING the token

const prisma = new PrismaClient();
const JWT_EXPIRES_IN = '1h'; // Token expiry time

export async function POST(request) {
  // Define and check JWT_SECRET INSIDE the POST handler
  // This ensures it checks process.env on each request, though it's usually loaded once on server start
  const JWT_SECRET_FOR_SIGNING = process.env.JWT_SECRET;

  if (!JWT_SECRET_FOR_SIGNING || JWT_SECRET_FOR_SIGNING.length < 32) {
      const errorMsg = "FATAL ERROR: JWT_SECRET is not defined or is too short in .env.local (from login API). Must be at least 32 characters.";
      console.error(errorMsg);
      return NextResponse.json({ message: 'Server configuration error: JWT secret missing or too short.' }, { status: 500 });
  }

  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ message: 'Email and password are required.' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return NextResponse.json({ message: 'Invalid email or password.' }, { status: 401 });
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      return NextResponse.json({ message: 'Invalid email or password.' }, { status: 401 });
    }

    const tokenPayload = {
      userId: user.userId,
      email: user.email,
      name: user.name,
      role: user.role,
      // personnelId: user.personnelId, // Optional
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET_FOR_SIGNING, {
      expiresIn: JWT_EXPIRES_IN,
      // algorithm: 'HS256' // jsonwebtoken defaults to HS256 with string secret
    });

    const { passwordHash, ...userWithoutPassword } = user;

    const response = NextResponse.json({
      message: 'Login successful!',
      user: userWithoutPassword,
    }, { status: 200 });

    console.log('Login API: Generated token successfully. Setting cookie.');
    response.cookies.set('authToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60, // 1 hour in seconds
      path: '/',
    });
    
    return response;

  } catch (error) {
    console.error('Login API error:', error);
    if (error.message && error.message.includes('secretOrPrivateKey must have a value')) {
        // This error from jwt.sign indicates JWT_SECRET_FOR_SIGNING was problematic
        return NextResponse.json({ message: 'Server JWT configuration error during token signing (secret issue).' }, { status: 500 });
    }
    return NextResponse.json({ message: 'An error occurred during login.' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
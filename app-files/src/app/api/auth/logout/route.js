// src/app/api/auth/logout/route.js
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const response = NextResponse.json({ message: 'Logout successful' }, { status: 200 });
    
    // Clear the authToken cookie
    response.cookies.set('authToken', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: -1, // Expire immediately
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ message: 'An error occurred during logout.' }, { status: 500 });
  }
}
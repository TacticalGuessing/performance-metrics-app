// src/app/api/auth/me/route.js
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
// Assuming your jsconfig.json is set up for path aliases like @/lib
// If not, use the correct relative path: '../../../../lib/authUtils.js'
import { getTokenFromRequest, verifyToken } from '@/lib/authUtils.js'; 

const prisma = new PrismaClient();

export async function GET(request) {
  console.log("--- /api/auth/me GET request received ---");
  try {
    const token = getTokenFromRequest(request);
    console.log('/api/auth/me: Received token from cookie via getTokenFromRequest:', token ? `Exists (length ${token.length})` : "MISSING");

    if (!token) {
      console.warn('/api/auth/me: No token found in request. Returning 401.');
      return NextResponse.json({ message: 'Not authenticated: No token provided' }, { status: 401 });
    }

    // ***** CRUCIAL: Call verifyToken and AWAIT its result *****
    const decodedToken = await verifyToken(token); 
    // **********************************************************
    
    console.log('/api/auth/me: Full Decoded token object from verifyToken:', JSON.stringify(decodedToken, null, 2));
    console.log('/api/auth/me: Checking decodedToken.userId:', decodedToken ? decodedToken.userId : "decodedToken is null/undefined");

    if (!decodedToken || !decodedToken.userId) {
      console.warn('/api/auth/me: Decoded token is invalid or missing userId. Returning 401.');
      // Optionally log why it might be invalid if verifyToken returned null due to specific error
      // (though verifyToken itself logs details)
      return NextResponse.json({ message: 'Not authenticated: Invalid token or missing userId' }, { status: 401 });
    }

    // If we reach here, decodedToken and decodedToken.userId are valid
    console.log(`/api/auth/me: Token valid for userId: ${decodedToken.userId}. Fetching user from DB.`);
    const user = await prisma.user.findUnique({
      where: { userId: decodedToken.userId },
      select: { 
        userId: true,
        name: true,
        email: true,
        role: true,
        personnelId: true,
        createdAt: true,
      },
    });

    if (!user) {
      console.warn(`/api/auth/me: User not found in DB for userId: ${decodedToken.userId}. Returning 404.`);
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    console.log('/api/auth/me: User found. Returning user data.');
    return NextResponse.json({ user }, { status: 200 });

  } catch (error) {
    console.error('/api/auth/me: Unexpected error:', error);
    return NextResponse.json({ message: 'An error occurred while fetching user data.' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
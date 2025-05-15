// src/app/api/filters/teams/route.js
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
// Assuming your authUtils.js and middleware handle authentication
// For simplicity, this endpoint will assume the user is authenticated
// as middleware should protect /api/filters/* if it's not public

const prisma = new PrismaClient();

export async function GET(request) {
  // Optional: Add further role checks if only certain roles can see certain teams,
  // but for now, any authenticated user can get the list of all teams for filtering.
  try {
    const teams = await prisma.team.findMany({
      orderBy: {
        teamName: 'asc',
      },
      select: {
        teamId: true,
        teamName: true,
      },
    });
    return NextResponse.json(teams, { status: 200 });
  } catch (error) {
    console.error("Error fetching teams for filters:", error);
    return NextResponse.json({ message: "Failed to fetch teams.", error: error.message }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
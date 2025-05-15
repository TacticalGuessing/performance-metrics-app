// src/app/api/filters/subteams/route.js
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const teamId = searchParams.get('teamId');

  if (!teamId) {
    return NextResponse.json({ message: "teamId query parameter is required." }, { status: 400 });
  }

  try {
    const subTeams = await prisma.subTeam.findMany({
      where: {
        teamId: teamId,
      },
      orderBy: {
        subTeamName: 'asc',
      },
      select: {
        subTeamId: true,
        subTeamName: true,
      },
    });
    return NextResponse.json(subTeams, { status: 200 });
  } catch (error) {
    console.error(`Error fetching sub-teams for team ${teamId}:`, error);
    return NextResponse.json({ message: "Failed to fetch sub-teams.", error: error.message }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
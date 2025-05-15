// src/app/api/filters/personnel/route.js
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const subTeamId = searchParams.get('subTeamId');

  if (!subTeamId) {
    return NextResponse.json({ message: "subTeamId query parameter is required." }, { status: 400 });
  }

  try {
    const personnel = await prisma.personnel.findMany({
      where: {
        subTeamId: subTeamId,
      },
      orderBy: {
        personnelName: 'asc',
      },
      select: {
        personnelId: true,
        personnelName: true,
      },
    });
    return NextResponse.json(personnel, { status: 200 });
  } catch (error) {
    console.error(`Error fetching personnel for sub-team ${subTeamId}:`, error);
    return NextResponse.json({ message: "Failed to fetch personnel.", error: error.message }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
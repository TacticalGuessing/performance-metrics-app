// src/app/api/filters/snapshots/route.js
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getTokenFromRequest, verifyToken } from '@/lib/authUtils'; // Adjust path as needed

const prisma = new PrismaClient();

export async function GET(request) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
    }
    const decodedToken = await verifyToken(token);
    if (!decodedToken || !decodedToken.userId) {
      return NextResponse.json({ message: 'Invalid or expired token' }, { status: 401 });
    }

    // Fetch distinct snapshot months from the Contract table (or a dedicated Snapshot table if you have one)
    // Assuming snapshotMonth is stored as a string like "YYYY-MM" or a parsable date string.
    const snapshots = await prisma.contract.groupBy({
      by: ['snapshotMonth'],
      orderBy: {
        snapshotMonth: 'desc', // Show most recent first
      },
      // where: { metricName: { not: null } } // Optional: ensure only snapshots with some data
    });

    // The result from groupBy is an array of objects like [{ snapshotMonth: "2023-04" }, ...]
    // We want to return an array of strings or objects suitable for a dropdown.
    // Let's format them as { value: "YYYY-MM", label: "Month Year" }
    const formattedSnapshots = snapshots.map(s => {
        const date = new Date(s.snapshotMonth + "-01"); // Add day for parsing
        return {
            value: s.snapshotMonth, // e.g., "2023-04"
            label: date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) // e.g., "April 2023"
        };
    });
    
    return NextResponse.json(formattedSnapshots, { status: 200 });

  } catch (error) {
    console.error('Error fetching snapshot months:', error);
    return NextResponse.json({ message: 'Failed to fetch snapshot months', error: error.message }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
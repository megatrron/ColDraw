import { prisma } from "@repo/db/config";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import { NextRequest, NextResponse } from "next/server";

type StrokeResponse =
  | { error: string }
  | { strokeData: unknown[] };

export async function PUT(
  request: NextRequest
): Promise<NextResponse<StrokeResponse>> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { roomId, strokeData } = body;

  if (!roomId || !Array.isArray(strokeData)) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const userId = session.user.id;

  try {
    // Check room access
    const room = await prisma.room.findFirst({
      where: {
        id: roomId,
        OR: [
          { adminId: userId },
          { users: { some: { userId } } },
        ],
      },
    });

    if (!room) {
      return NextResponse.json({ error: "Forbidden: Not a member of this room" }, { status: 403 });
    }

    const drawing = await prisma.roomDrawing.upsert({
      where: { roomId },
      create: { roomId, strokeData },
      update: { strokeData },
    });

    return NextResponse.json(
      { strokeData: (drawing.strokeData as unknown[]) || [] },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error saving drawing:", error);
    return NextResponse.json({ error: "Error saving drawing" }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest
): Promise<NextResponse<StrokeResponse>> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const roomId = searchParams.get("roomId");

  if (!roomId) {
    return NextResponse.json({ error: "Missing roomId" }, { status: 400 });
  }

  const userId = session.user.id;

  try {
    const room = await prisma.room.findFirst({
      where: {
        id: roomId,
        OR: [
          { adminId: userId },
          { users: { some: { userId } } },
        ],
      },
    });

    if (!room) {
      return NextResponse.json({ error: "Forbidden: Not a member of this room" }, { status: 403 });
    }

    const drawing = await prisma.roomDrawing.findUnique({
      where: { roomId },
    });

    return NextResponse.json(
      { strokeData: Array.isArray(drawing?.strokeData) ? (drawing.strokeData as unknown[]) : [] },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error loading drawing:", error);
    return NextResponse.json({ error: "Error loading drawing" }, { status: 500 });
  }
}

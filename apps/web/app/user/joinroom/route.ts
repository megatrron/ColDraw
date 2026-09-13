import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/db/config";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { roomId, password } = await req.json();

    if (!roomId) {
      return NextResponse.json({ error: "Missing roomId" }, { status: 400 });
    }

    const userId = session.user.id;

    const room = await prisma.room.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    if (room.password && room.password !== password) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }

    // Add user as room member if not already joined
    await prisma.roomUser.upsert({
      where: {
        userId_roomId: {
          userId,
          roomId,
        },
      },
      create: {
        userId,
        roomId,
      },
      update: {},
    });

    return NextResponse.json(
      { success: true, message: "Joined room successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error joining room:", error);
    return NextResponse.json({ error: "Failed to join room" }, { status: 500 });
  }
}

import { prisma } from "@repo/db/config";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const limitParam = request.nextUrl.searchParams.get("limit");
  const roomId = request.nextUrl.searchParams.get("roomId");

  if (!roomId) {
    return NextResponse.json({ message: "Missing roomId" }, { status: 400 });
  }

  const userId = session.user.id;

  try {
    // Verify room access
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
      return NextResponse.json({ message: "Room not found or access denied" }, { status: 403 });
    }

    const limit = Math.min(Math.max(parseInt(limitParam || "50", 10) || 50, 1), 100);

    const chats = await prisma.chat.findMany({
      where: {
        roomId,
      },
      orderBy: {
        time: "desc",
      },
      take: limit,
      include: {
        sender: {
          select: { name: true },
        },
      },
    });

    chats.reverse(); // Oldest first for chat window display

    const shaped = chats.map((c) => ({
      id: c.id,
      message: c.message,
      time: c.time,
      senderId: c.senderId,
      senderName: c.sender?.name ?? null,
      roomId: c.roomId,
    }));

    return NextResponse.json({ chats: shaped }, { status: 200 });
  } catch (error) {
    console.error("Error fetching chats:", error);
    return NextResponse.json({ message: "Error fetching chats" }, { status: 500 });
  }
}

import { prisma } from "@repo/db/config";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const message = typeof body.message === "string" ? body.message.trim() : "";
    const roomId = typeof body.roomId === "string" ? body.roomId.trim() : "";

    if (!message || !roomId) {
      return NextResponse.json({ message: "Message and roomId are required" }, { status: 400 });
    }

    const userId = session.user.id;

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

    const chatData = await prisma.chat.create({
      data: {
        message,
        roomId,
        senderId: userId,
      },
      include: {
        sender: {
          select: { name: true },
        },
      },
    });

    return NextResponse.json({
      chat: {
        id: chatData.id,
        message: chatData.message,
        roomId: chatData.roomId,
        senderId: chatData.senderId,
        senderName: chatData.sender?.name ?? null,
        time: chatData.time,
      },
    }, { status: 200 });
  } catch (error) {
    console.error("Error creating chat:", error);
    return NextResponse.json({ message: "Error creating chat" }, { status: 500 });
  }
}

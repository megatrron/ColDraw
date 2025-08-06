import { prisma } from "@repo/db/config";
import type { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.json();
  try {
    const roomData = await prisma.chat.create({
      data: {
        message: body.message,
        roomId: body.roomId,
        senderId: body.senderId,
      },
    });
    return new Response(JSON.stringify({ chat: roomData }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error creating chat:", error);
    return new Response(JSON.stringify({ message: "Error creating chat" }), {
      status: 500,
    });
  }
}

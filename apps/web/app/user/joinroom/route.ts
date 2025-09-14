// app/api/room/join/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/db/config";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import WebSocket from "ws";

interface messagePayload {
  type: string;
  payload: {
    roomId: string;
    userId: string;
    message?: string;
  };
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  const { roomId, password } = await req.json();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
  try {
    const existing = await prisma.roomUser.findFirst({
      where: {
        userId,
        roomId,
      },
    });
    // console.log("Existing room user:", existing);
    if (!existing) {
      await prisma.roomUser.create({
        data: { userId, roomId },
      });
    }
    const messageData: messagePayload = {
      type: "join",
      payload: {
        roomId: room.id,
        userId: userId,
      },
    };
    console.log(messageData);
    const ws = new WebSocket(`ws://localhost:8080`);
    ws.onopen = () => {
      console.log("WebSocket connection established");
    };
    ws.onmessage = (event) => {
      console.log("Message from server:", event.data);
      const payload = JSON.stringify(messageData);
      console.log(payload);
      ws.send(payload);
    };

    return NextResponse.json(
      { success: true, message: "Joined room successfully" },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json({ error: error }, { status: 500 });
  }
}

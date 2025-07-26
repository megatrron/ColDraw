import { prisma } from "@repo/db/config";
import type { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.json();
  try {
    const roomData = await prisma.room.create({
      data: {
        name: body.name,
        password: body.password || null,
        admin: {
          connect: { id: body.adminId },
        },
      },
    });
    return new Response(JSON.stringify({ room: roomData }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error creating room:", error);
    return new Response(JSON.stringify({ message: "Error creating room" }), {
      status: 500,
    });
  }
}

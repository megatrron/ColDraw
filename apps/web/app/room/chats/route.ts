import { prisma } from "@repo/db/config";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const limit = request.nextUrl.searchParams.get("limit");
  const roomId = request.nextUrl.searchParams.get("roomId");
  if (!roomId)
    return new Response(JSON.stringify({ message: "Missing roomId" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  if (!limit) {
    return new Response(JSON.stringify({ message: "Missing limit" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const chats = await prisma.chat.findMany({
      where: {
        roomId: roomId,
      },
      orderBy: {
        time: "desc", // Get latest chats first
      },
      take: 10, // Only get 10
    });
    chats.reverse(); // Reverse to show oldest first

    return new Response(JSON.stringify({ chats }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching chats:", error);
    return new Response(JSON.stringify({ message: "Error fetching chats" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

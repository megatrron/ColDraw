import { prisma } from "@repo/db/config";
import { NextRequest } from "next/server";

export async function DELETE(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");

  if (!id) {
    return new Response(JSON.stringify({ error: "Missing room ID" }), {
      status: 400,
    });
  }

  try {
    await prisma.room.delete({ where: { id } });
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    console.error("Error deleting room:", error);
    return new Response(JSON.stringify({ error: "Delete failed" }), {
      status: 500,
    });
  }
}
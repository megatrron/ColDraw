import { prisma } from "@repo/db/config";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing room ID" }, { status: 400 });
  }

  try {
    const room = await prisma.room.findUnique({
      where: { id },
      select: { adminId: true },
    });

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    if (room.adminId !== session.user.id) {
      return NextResponse.json(
        { error: "Forbidden: Only the workspace admin can delete this workspace" },
        { status: 403 }
      );
    }

    await prisma.room.delete({ where: { id } });
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error deleting room:", error);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}

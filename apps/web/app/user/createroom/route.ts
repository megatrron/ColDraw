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
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name) {
      return NextResponse.json({ message: "Workspace name is required" }, { status: 400 });
    }

    const roomData = await prisma.room.create({
      data: {
        name,
        password: body.password ? String(body.password) : null,
        adminId: session.user.id,
        users: {
          create: {
            userId: session.user.id,
          },
        },
      },
    });

    return NextResponse.json({ room: roomData }, { status: 201 });
  } catch (error) {
    console.error("Error creating room:", error);
    return NextResponse.json({ message: "Error creating room" }, { status: 500 });
  }
}

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
    const { image } = body;

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        image: typeof image === "string" && image.trim().length > 0 ? image : null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
      },
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error("Error updating profile picture:", error);
    return NextResponse.json(
      { message: "Failed to update profile picture" },
      { status: 500 }
    );
  }
}

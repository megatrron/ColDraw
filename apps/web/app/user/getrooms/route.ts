import { prisma } from "@repo/db/config";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    const rooms = await prisma.room.findMany({
      where: {
        OR: [
          { adminId: userId },
          { users: { some: { userId } } },
        ],
      },
      select: {
        id: true,
        name: true,
        adminId: true,
        password: true,
      },
      orderBy: {
        id: "desc",
      },
    });

    return NextResponse.json({ rooms }, { status: 200 });
  } catch (error) {
    console.error("Error fetching rooms:", error);
    return NextResponse.json({ message: "Error fetching rooms" }, { status: 500 });
  }
}

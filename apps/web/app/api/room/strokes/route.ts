import { prisma } from "@repo/db/config";
import { NextRequest, NextResponse } from "next/server";

type StrokeResponse =
  | { error: string }
  | { strokeData: any[] };

export async function PUT(
  request: NextRequest
): Promise<NextResponse<StrokeResponse>> {
  const body = await request.json();
  const { roomId, strokeData } = body;

  if (!roomId || !Array.isArray(strokeData)) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  try {
    const drawing = await prisma.roomDrawing.upsert({
      where: { roomId },
      create: { roomId, strokeData },
      update: { strokeData },
    });

    return NextResponse.json(
      { strokeData: drawing.strokeData as any[] },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error saving drawing:", error);
    return NextResponse.json({ error: "Error saving drawing" }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest
): Promise<NextResponse<StrokeResponse>> {
  const { searchParams } = new URL(request.url);
  const roomId = searchParams.get("roomId");

  if (!roomId) {
    return NextResponse.json({ error: "Missing roomId" }, { status: 400 });
  }

  try {
    const drawing = await prisma.roomDrawing.findUnique({
      where: { roomId },
    });
    return NextResponse.json(
      { strokeData: Array.isArray(drawing?.strokeData) ? drawing.strokeData : [] },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error loading drawing:", error);
    return NextResponse.json({ error: "Error loading drawing" }, { status: 500 });
  }
}
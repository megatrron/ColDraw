// user/getrooms/route.ts
import { prisma } from "@repo/db/config";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
    const id = request.nextUrl.searchParams.get("id");

    if (!id) {
        return new Response(JSON.stringify({ message: "Missing user ID" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
        });
    }

    try {
        const rooms = await prisma.room.findMany({
            where: {
                adminId: id,
            },
        });

        return new Response(JSON.stringify({ rooms }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (error) {
        console.error("Error fetching rooms:", error);
        return new Response(JSON.stringify({ message: "Error fetching rooms" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
}

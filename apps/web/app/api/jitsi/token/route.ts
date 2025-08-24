/* eslint-disable turbo/no-undeclared-env-vars */
import jwt from "jsonwebtoken";
import { NextRequest, NextResponse } from "next/server";

const JAAS_APP_ID = process.env.NEXT_PUBLIC_JAAS_APP_ID!; // Your App ID
const JAAS_API_SECRET = process.env.NEXT_PUBLIC_JAAS_API_SECRET!.replace(
  /\\n/g,
  "\n"
); // Your API Secret

export async function POST(request: NextRequest) {
  const { id, email, name, roomName } = await request.json();
  console.log("Received data:", { id, email, name, roomName });

  try {
    const now = Math.floor(Date.now() / 1000);
    
    const payload = {
      iss: "chat", // Must be 'chat' for JaaS
      sub: JAAS_APP_ID, // Use your actual App ID from env variable
      aud: "jitsi",
      exp: now + 2 * 60 * 60, // 2 hours from now
      nbf: now - 10, // Not before (10 seconds ago for clock skew)
      room: roomName, // Use dynamic room name
      context: {
        user: {
          id: id,
          name: name,
          email: email,
        },
        features: {
          livestreaming: false,
          recording: false,
          transcription: false,
          'outbound-call': false,
        },
      },
    };

    console.log("Payload for JWT:", payload);

    const token = jwt.sign(payload, JAAS_API_SECRET, {
      algorithm: "RS256",
      header: {
        kid: `${JAAS_APP_ID}/a54816`, // Your actual kid
        typ: "JWT",
        alg: "RS256",
      },
    });

    return NextResponse.json({ token });
  } catch (error) {
    console.log("JWT generation failed:", error);
    return NextResponse.json(
      { error: "Failed to generate token" },
      { status: 500 }
    );
  }
}
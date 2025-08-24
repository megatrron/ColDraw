"use client";
// import { JaaSMeeting } from '@jitsi/react-sdk';
import { useEffect, useState } from 'react';
import { useJaas } from '../../../lib/useJaas';
import { useSession } from 'next-auth/react';
import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
const JaaSMeeting = dynamic(
  () => import("@jitsi/react-sdk").then((mod) => mod.JaaSMeeting),
  { ssr: false }
);
export default function JitsiEmbed({ session }: { session: any }) {


  if (session.status === "loading") return <div>Loading...</div>;
  if (session.status === "unauthenticated") return <div>Redirecting...</div>;

  return (
    <div>
      <JitsiEmbedContent session={session} />
    </div>
  );
}

function JitsiEmbedContent({ session }: { session: any }) {
  const params = useParams();
  const roomId = params.roomId as string;

  const id = session?.user?.id;
  const name = session?.user?.name;
  const email = session?.user?.email;
  console.log("User info:", { id, name, email });
  // ✅ Call your hook at the top level, not inside useEffect
  const { isLoaded, token, error } = useJaas({ session, roomId });

  if (error) return <div>Error: {error}</div>;
  if (!token) return <div>Loading Jitsi...</div>;
  console.log("Jitsi token:", token);
  const audioOnlyConfig = {
    startWithVideoMuted: true,
    startWithAudioMuted: false,
    startAudioOnly: true,
    disableVideoBg: true,
    disableSelfView: true,
    constraints: {
      video: false,
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    },
    p2p: {
      enabled: true,
    },
    enableLayerSuspension: true,
  };

  const interfaceConfig = {
    // TOOLBAR_BUTTONS: [], // Hide all default buttons
    SHOW_JITSI_WATERMARK: false,
    SHOW_BRAND_WATERMARK: false,
    FILM_STRIP_MAX_HEIGHT: 0,
    DISABLE_VIDEO_BACKGROUND: true,
  };
  return (
    <div>
      <JaaSMeeting
        appId={process.env.NEXT_PUBLIC_JAAS_APP_ID!}
        roomName={roomId}
        jwt={token}
        configOverwrite={audioOnlyConfig}
        interfaceConfigOverwrite={interfaceConfig}
        // configOverwrite={{
        //   startWithAudioMuted: true,
        //   disableModeratorIndicator: true,
        //   startScreenSharing: true,
        //   enableEmailInStats: false,
        //   prejoinPageEnabled: false,
        //   hideConferenceSubject: true,
        //   startAudioOnly: true,
        //   disableVideoBg: true,
        //   disableSelfView: true,
        //   TOOLBAR_BUTTONS: [], // Hide all default buttons
        //   SHOW_JITSI_WATERMARK: false,
        //   SHOW_BRAND_WATERMARK: false,
        //   FILM_STRIP_MAX_HEIGHT: 0,
        //   DISABLE_VIDEO_BACKGROUND: true,
        //   constraints: {
        //     video: false,
        //     audio: {
        //       echoCancellation: true,
        //       noiseSuppression: true,
        //       autoGainControl: true,
        //     },
        //   },
        //   p2p: {
        //     enabled: true,
        //   },
        //   enableLayerSuspension: true,
        //   toolbarButtons: [
        //     'camera',
        //     'microphone',
        //     'settings',
        //     'select-background'
        //   ]
        // }}
        // interfaceConfigOverwrite={{
        //   DISABLE_JOIN_LEAVE_NOTIFICATIONS: true
        // }}
        userInfo={{
          displayName: name || 'default',
          email: email || 'default@email.com'
        }}
        getIFrameRef={(iframeRef) => {
          iframeRef.style.height = '50vh';
        }}
      />
    </div>
  );
}

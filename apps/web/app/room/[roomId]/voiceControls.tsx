"use client";
// import { JaaSMeeting } from '@jitsi/react-sdk';
import { useEffect, useRef, useState } from 'react';
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
  const apiRef = useRef<any>(null);
  const [micMuted, setMicMuted] = useState(false);
  const [othersMuted, setOthersMuted] = useState(false);

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
    prejoinPageEnabled: false,
    prejoinConfig: { enabled: false },
    disableDeepLinking: true,
    disableInviteFunctions: true,
    disableModeratorIndicator: true,
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
    TOOLBAR_BUTTONS: [], // Hide all default buttons
    SHOW_JITSI_WATERMARK: false,
    SHOW_BRAND_WATERMARK: false,
    SHOW_WATERMARK_FOR_GUESTS: false,
    SHOW_POWERED_BY: false,
    MOBILE_APP_PROMO: false,
    DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
    VIDEO_QUALITY_LABEL_DISABLED: true,
    FILM_STRIP_MAX_HEIGHT: 0,
    DISABLE_VIDEO_BACKGROUND: true,
  };

  const toggleMic = async () => {
    if (!apiRef.current) return;
    try {
      const isMuted = await apiRef.current.isAudioMuted();
      if (isMuted) {
        await apiRef.current.executeCommand('toggleAudio');
        setMicMuted(false);
      } else {
        await apiRef.current.executeCommand('toggleAudio');
        setMicMuted(true);
      }
    } catch (e) {
      console.error('Mic toggle failed', e);
    }
  };

  const toggleOthers = async () => {
    if (!apiRef.current) return;
    try {
      if (!othersMuted) {
        // Try moderator mute everyone
        try {
          await apiRef.current.executeCommand('muteEveryone');
          setOthersMuted(true);
          return;
        } catch (error) {
          console.warn('Failed to mute all participants:', error);
        }
        // Fallback: reduce volume of all to 0 (if supported)
        const participants = await apiRef.current.getParticipantsInfo();
        for (const p of participants) {
          if (p.participantId) {
            try { await apiRef.current.setParticipantVolume(p.participantId, 0); } catch (error) {
              console.warn('Failed to set participant volume:', error);
            }
          }
        }
        setOthersMuted(true);
      } else {
        // Cannot force unmute others' microphones due to privacy constraints.
        // Best-effort: restore volume to 1 for all participants.
        const participants = await apiRef.current.getParticipantsInfo();
        for (const p of participants) {
          if (p.participantId) {
            try { await apiRef.current.setParticipantVolume(p.participantId, 1); } catch (error) {
              console.warn('Failed to set participant volume:', error);
            }
          }
        }
        setOthersMuted(false);
      }
    } catch (e) {
      console.error('Others toggle failed', e);
    }
  };
  return (
    <div className="relative">
      <div className="absolute top-2 right-2 z-10 flex items-center gap-2">
        <button
          className={`px-3 py-1 rounded ${micMuted ? 'bg-red-600 text-white' : 'bg-gray-200'}`}
          onClick={toggleMic}
          aria-label={micMuted ? 'Unmute microphone' : 'Mute microphone'}
        >
          {micMuted ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 9v3a3 3 0 0 0 5.12 2.12"/>
              <path d="M15 9v3a3 3 0 0 1-3 3"/>
              <path d="M12 19v3"/>
              <path d="M8 23h8"/>
              <path d="M19 11a7 7 0 0 1-14 0"/>
              <path d="M1 1l22 22"/>
              <rect x="9" y="2" width="6" height="10" rx="3"/>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="2" width="6" height="10" rx="3"/>
              <path d="M19 11a7 7 0 0 1-14 0"/>
              <path d="M12 19v3"/>
              <path d="M8 23h8"/>
            </svg>
          )}
        </button>
        <button
          className={`px-3 py-1 rounded ${othersMuted ? 'bg-red-600 text-white' : 'bg-gray-200'}`}
          onClick={toggleOthers}
          aria-label={othersMuted ? 'Unmute others' : 'Mute others'}
        >
          {othersMuted ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
              <line x1="23" y1="9" x2="17" y2="15"/>
              <line x1="17" y1="9" x2="23" y2="15"/>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
            </svg>
          )}
        </button>
      </div>
      <div className="hidden">
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
            iframeRef.style.width = '100%';
          }}
          onApiReady={(api) => {
            apiRef.current = api;
            // Hide filmstrip if visible (in addition to interface config)
            try { api.executeCommand('toggleFilmStrip'); } catch (error) {
              console.warn('Failed to toggle filmstrip:', error);
            }
            // start in audio-only, microphone unmuted per config
          }}
        />
      </div>
    </div>
  );
}

"use client";

import { useRef, useState, useEffect } from "react";
import { useJaas } from "../../../lib/useJaas";
import { useParams } from "next/navigation";
import dynamic from "next/dynamic";

const JaaSMeeting = dynamic(
  () => import("@jitsi/react-sdk").then((mod) => mod.JaaSMeeting),
  { ssr: false }
);

interface Session {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

interface ParticipantInfo {
  id?: string;
  participantId?: string;
  displayName?: string;
  formattedDisplayName?: string;
  avatarURL?: string;
}

export default function JitsiEmbed({ session }: { session: Session }) {
  if (!session) return <div>Loading...</div>;
  if (!session.user) return <div>Redirecting...</div>;

  return (
    <div>
      <JitsiEmbedContent session={session} />
    </div>
  );
}

function JitsiEmbedContent({ session }: { session: Session }) {
  const params = useParams();
  const roomId = params.roomId as string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const apiRef = useRef<any>(null);
  const participantsDropdownRef = useRef<HTMLDivElement | null>(null);

  const [micMuted, setMicMuted] = useState(false);
  const [othersMuted, setOthersMuted] = useState(false);
  const [participantsOpen, setParticipantsOpen] = useState(false);
  const [participants, setParticipants] = useState<ParticipantInfo[]>([]);

  const name = session?.user?.name;
  const email = session?.user?.email;

  const { token, error } = useJaas({ session, roomId });

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        participantsDropdownRef.current &&
        !participantsDropdownRef.current.contains(e.target as Node)
      ) {
        setParticipantsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  if (error) return <div>Error: {error}</div>;
  if (!token) return <div>Loading Jitsi...</div>;

  const audioOnlyConfig = {
    startWithVideoMuted: true,
    startWithAudioMuted: false,
    startAudioOnly: true,
    enableGravatar: false,
    disableThirdPartyRequests: true,
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
        await apiRef.current.executeCommand("toggleAudio");
        setMicMuted(false);
      } else {
        await apiRef.current.executeCommand("toggleAudio");
        setMicMuted(true);
      }
    } catch (e) {
      console.error("Mic toggle failed", e);
    }
  };

  const toggleOthers = async () => {
    if (!apiRef.current) return;
    try {
      if (!othersMuted) {
        try {
          await apiRef.current.executeCommand("muteEveryone");
          setOthersMuted(true);
          return;
        } catch (error) {
          console.warn("Failed to mute all participants:", error);
        }
        const participantsList = await apiRef.current.getParticipantsInfo();
        for (const p of participantsList) {
          if (p.participantId) {
            try {
              await apiRef.current.setParticipantVolume(p.participantId, 0);
            } catch (error) {
              console.warn("Failed to set participant volume:", error);
            }
          }
        }
        setOthersMuted(true);
      } else {
        const participantsList = await apiRef.current.getParticipantsInfo();
        for (const p of participantsList) {
          if (p.participantId) {
            try {
              await apiRef.current.setParticipantVolume(p.participantId, 1);
            } catch (error) {
              console.warn("Failed to set participant volume:", error);
            }
          }
        }
        setOthersMuted(false);
      }
    } catch (e) {
      console.error("Others toggle failed", e);
    }
  };

  const refreshParticipants = async () => {
    if (!apiRef.current) return;
    try {
      const list = await apiRef.current.getParticipantsInfo();
      if (Array.isArray(list)) {
        setParticipants(list);
      }
    } catch (e) {
      console.error("Failed to fetch participants:", e);
    }
  };

  const toggleParticipantsDropdown = () => {
    setParticipantsOpen((prev) => !prev);
    refreshParticipants();
  };

  const remoteParticipants = participants.filter((p) => {
    if (p.id === "local" || p.participantId === "local") return false;
    if (name && (p.displayName === name || p.formattedDisplayName === name)) {
      return false;
    }
    return true;
  });

  const totalCount = remoteParticipants.length + 1;

  return (
    <div className="flex flex-col items-end gap-2 relative">
      {/* Mute and Voice Options Bar */}
      <div className="flex items-center gap-2 bg-white/95 backdrop-blur-md p-1.5 rounded-xl shadow-lg border border-gray-200">
        {/* User profile picture */}
        {session.user?.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={session.user.image}
            alt={name || "User"}
            className="w-7 h-7 rounded-full object-cover border border-gray-300 shrink-0"
            title={`${name || "User"} (${email || ""})`}
          />
        ) : (
          <div
            className="w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0 shadow-sm"
            title={`${name || "User"} (${email || ""})`}
          >
            {name?.[0]?.toUpperCase() || "U"}
          </div>
        )}

        {/* Mic Toggle Button */}
        <button
          className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition flex items-center gap-1.5 shadow-sm ${
            micMuted
              ? "bg-red-600 hover:bg-red-700 text-white"
              : "bg-gray-100 hover:bg-gray-200 text-gray-800"
          }`}
          onClick={toggleMic}
          aria-label={micMuted ? "Unmute microphone" : "Mute microphone"}
          title={micMuted ? "Unmute microphone" : "Mute microphone"}
        >
          {micMuted ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 9v3a3 3 0 0 0 5.12 2.12" />
              <path d="M15 9v3a3 3 0 0 1-3 3" />
              <path d="M12 19v3" />
              <path d="M8 23h8" />
              <path d="M19 11a7 7 0 0 1-14 0" />
              <path d="M1 1l22 22" />
              <rect x="9" y="2" width="6" height="10" rx="3" />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="9" y="2" width="6" height="10" rx="3" />
              <path d="M19 11a7 7 0 0 1-14 0" />
              <path d="M12 19v3" />
              <path d="M8 23h8" />
            </svg>
          )}
          <span>{micMuted ? "Muted" : "Mute"}</span>
        </button>

        {/* Deafen / Mute Others Button */}
        <button
          className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition flex items-center gap-1.5 shadow-sm ${
            othersMuted
              ? "bg-red-600 hover:bg-red-700 text-white"
              : "bg-gray-100 hover:bg-gray-200 text-gray-800"
          }`}
          onClick={toggleOthers}
          aria-label={othersMuted ? "Unmute others" : "Mute others"}
          title={othersMuted ? "Unmute others" : "Mute others"}
        >
          {othersMuted ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <line x1="23" y1="9" x2="17" y2="15" />
              <line x1="17" y1="9" x2="23" y2="15" />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
            </svg>
          )}
          <span>{othersMuted ? "Deafened" : "Deafen"}</span>
        </button>
      </div>

      {/* Button just below mute options */}
      <div className="relative" ref={participantsDropdownRef}>
        <button
          onClick={toggleParticipantsDropdown}
          className="bg-white/95 hover:bg-white backdrop-blur-md px-3 py-1.5 rounded-xl shadow-md border border-gray-200 text-xs font-medium text-gray-700 hover:text-gray-900 flex items-center gap-2 cursor-pointer transition"
          title="Show joined participants"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          <span>Participants ({totalCount})</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`transition-transform duration-200 ${
              participantsOpen ? "rotate-180" : ""
            }`}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {/* Dropdown to show joined participants list */}
        {participantsOpen && (
          <div className="absolute right-0 top-9 w-64 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
            <div className="px-3.5 py-1.5 border-b border-gray-100 flex items-center justify-between">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                Joined Participants ({totalCount})
              </span>
              <span className="text-[10px] bg-emerald-50 text-emerald-600 font-semibold px-2 py-0.5 rounded-full border border-emerald-100">
                Live
              </span>
            </div>

            <div className="max-h-60 overflow-y-auto divide-y divide-gray-50 py-1">
              {/* Local user */}
              <div className="px-3.5 py-2 flex items-center justify-between hover:bg-gray-50/80 transition">
                <div className="flex items-center gap-2.5 truncate">
                  {session.user?.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={session.user.image}
                      alt={name || "You"}
                      className="w-7 h-7 rounded-full object-cover border border-gray-200 shrink-0"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
                      {name?.[0]?.toUpperCase() || "U"}
                    </div>
                  )}
                  <div className="truncate">
                    <p className="text-xs font-medium text-gray-900 truncate">
                      {name || "User"}{" "}
                      <span className="text-[10px] text-blue-600 font-semibold">
                        (You)
                      </span>
                    </p>
                    <p className="text-[10px] text-gray-400 truncate">
                      {email || "Connected"}
                    </p>
                  </div>
                </div>
                <span
                  className="text-xs shrink-0"
                  title={micMuted ? "Mic muted" : "Mic active"}
                >
                  {micMuted ? "🔇" : "🎙️"}
                </span>
              </div>

              {/* Remote participants */}
              {remoteParticipants.length === 0 ? (
                <div className="px-3.5 py-2.5 text-center text-xs text-gray-400">
                  Waiting for others to join...
                </div>
              ) : (
                remoteParticipants.map((p, idx) => {
                  const displayName =
                    p.displayName ||
                    p.formattedDisplayName ||
                    `Participant ${idx + 1}`;
                  return (
                    <div
                      key={p.id || p.participantId || idx}
                      className="px-3.5 py-2 flex items-center justify-between hover:bg-gray-50/80 transition"
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        {p.avatarURL ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={p.avatarURL}
                            alt={displayName}
                            className="w-7 h-7 rounded-full object-cover border border-gray-200 shrink-0"
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-purple-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
                            {displayName?.[0]?.toUpperCase() || "P"}
                          </div>
                        )}
                        <div className="truncate">
                          <p className="text-xs font-medium text-gray-900 truncate">
                            {displayName}
                          </p>
                          <p className="text-[10px] text-emerald-600 font-medium">
                            In room
                          </p>
                        </div>
                      </div>
                      <span
                        className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"
                        title="Connected"
                      />
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* Hidden JaaS / Jitsi Meeting */}
      <div className="hidden">
        <JaaSMeeting
          appId={process.env.NEXT_PUBLIC_JAAS_APP_ID!}
          roomName={roomId}
          jwt={token}
          configOverwrite={audioOnlyConfig}
          interfaceConfigOverwrite={interfaceConfig}
          userInfo={{
            displayName: name || "default",
            email: email || "default@email.com",
            ...(session.user?.image ? { avatarUrl: session.user.image } : {}),
          }}
          getIFrameRef={(iframeRef) => {
            iframeRef.style.height = "50vh";
            iframeRef.style.width = "100%";
          }}
          onApiReady={(api) => {
            apiRef.current = api;
            try {
              api.executeCommand("toggleFilmStrip");
            } catch (error) {
              console.warn("Failed to toggle filmstrip:", error);
            }

            const updateList = async () => {
              try {
                const list = await api.getParticipantsInfo();
                if (Array.isArray(list)) {
                  setParticipants(list);
                }
              } catch (err) {
                console.error("Error fetching participants:", err);
              }
            };

            api.addListener("videoConferenceJoined", updateList);
            api.addListener("participantJoined", updateList);
            api.addListener("participantLeft", updateList);
            api.addListener("displayNameChange", updateList);

            updateList();
          }}
        />
      </div>
    </div>
  );
}

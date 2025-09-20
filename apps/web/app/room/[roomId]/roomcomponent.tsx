"use client";

import axios from "axios";
import { Session } from "next-auth";
import { useParams } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import "js-draw/styles";
import JaasVoiceControls from "./voiceControls";
import dynamic from "next/dynamic";
import JitsiEmbed from "./voiceControls";
type ChatMessage = {
  senderId: string;
  senderName?: string | null;
  message: string;
  roomId: string;
};
const DrawingEditor = dynamic(() => import('./drawingeditor'), {
  ssr: false, // Disable SSR
});
export default function RoomAuth({ session }: { session: any }) {
  if (!session || session.status === 'loading') return <div>Loading...</div>;
  if (session.status === 'unauthenticated') return <div>Redirecting...</div>;
  if (!session.user) return <div>Invalid session</div>;
  return (
    <RoomComponent session={session} />
  );
}
function RoomComponent({ session }: { session: any }) {
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  // const containerRef = useRef<HTMLDivElement>(null);
  // const editorRef = useRef<HTMLDivElement>(null);
  const params = useParams();
  // Fetch chat messages when opened
  useEffect(() => {
    const roomId = params.roomId as string;
    if (!chatOpen || !roomId) return;

    const fetchMessages = async () => {
      try {
        const response = await axios.get(`/room/chats?limit=10&roomId=${roomId}`);
        setMessages(response.data.chats || []);
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    };

    fetchMessages();
  }, [chatOpen, params.roomId]);
  useEffect(() => {
    const ws = new WebSocket(process.env.NEXT_PUBLIC_WS_URL as string);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("Connected to WS server");

      // Join room after connect
      ws.send(
        JSON.stringify({
          type: "join",
          payload: { roomId: params.roomId },
        })
      );
    };

    ws.onmessage = (event) => {
      // server sends plain message string for chat

      try {
        const parsed = JSON.parse(event.data);
        // This could be a stroke or something else
        if (parsed.message && parsed.roomId) {
          setMessages((prev) => [...prev, parsed]);
        } else {
          // handle stroke or other payloads
          console.log("Stroke or custom:", parsed);
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }

    };

    ws.onclose = () => console.log("Disconnected from WS server");

    return () => {
      ws.close();
    };
  }, [params.roomId]);
  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // const handleSend = () => {
  //   if (inputMessage.trim() === "") return;

  //   const newMessage: ChatMessage = {
  //     senderId: session.user.id,
  //     message: inputMessage,
  //     roomId: params.roomId as string,
  //   };

    // axios.post("/room/sendmessage", newMessage).catch(console.error);
  //   setMessages((prev) => [...prev, newMessage]);
  //   setInputMessage("");
  // };
  const handleSend = () => {
    if (!inputMessage.trim()) return;
    if (!session?.user?.id) return;

    const newMessage: ChatMessage = {
      senderId: String(session.user.id),
      senderName: session.user.name ? String(session.user.name) : null,
      message: String(inputMessage),
      roomId: String(params.roomId),
    };

    wsRef.current?.send(
      JSON.stringify({
        type: "chat",
        payload: { message: JSON.stringify(newMessage) },
      })
    );
    axios.post("/room/sendmessage", newMessage).catch(console.error);

    setInputMessage("");
  };

  return (
    <div>
      <DrawingEditor user={session.user.id} />
      {/* Whiteboard */}
      {/* <div
        ref={editorRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
        }}
      ></div> */}

      {/* Chat Toggle Button */}
      <div
        className="fixed top-4 left-4 z-50 mt-8 rounded-full text-white bg-black p-2 w-10 h-10 flex items-center justify-center cursor-pointer"
        onClick={() => setChatOpen(true)}
      >
        C
      </div>
      <div className="absolute top-4 right-4 flex gap-2 z-10">
        <JitsiEmbed session={session} />
      </div>
      {/* Overlay */}
      {chatOpen && (
        <div
          className="fixed inset-0 bg-opacity-30 z-40"
          onClick={() => setChatOpen(false)}
        />
      )}

      {/* Chat Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full w-80 bg-white shadow-lg z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${chatOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 font-bold border-b">Chat Window</div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-2">
          <div className="flex flex-col justify-end space-y-2 min-h-full">
            {messages.map((msg, index) => (
              <div key={index} className="bg-gray-200 p-2 rounded text-sm">
                <div className="text-[10px] text-gray-600 mb-1">{msg.senderName || "Unknown"}</div>
                <div>{String(msg.message || "")}</div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
        </div>

        {/* Input */}
        <div className="border-t p-2 flex items-center">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 border border-gray-300 rounded px-2 py-1 mr-2 focus:outline-none"
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSend();
            }}
          />
          <button
            onClick={handleSend}
            className="bg-black text-white px-4 py-1 rounded"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

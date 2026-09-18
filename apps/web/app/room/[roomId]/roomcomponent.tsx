"use client";

import { useEffect, useState, useRef } from "react";
import DrawingBoard from "./drawingeditor";
import { useParams } from "next/navigation";
import axios from "axios";
import JitsiEmbed from "./voiceControls";

interface ChatMessage {
  id?: string;
  message: string;
  senderId?: string;
  senderName?: string;
  time?: string;
  roomId?: string;
}

interface Session {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

function getWsUrl(): string {
  if (process.env.NEXT_PUBLIC_WS_URL) {
    if (typeof window !== "undefined") {
      try {
        const parsed = new URL(process.env.NEXT_PUBLIC_WS_URL);
        if (parsed.hostname === "localhost" && window.location.hostname !== "localhost") {
          parsed.hostname = window.location.hostname;
          return parsed.toString();
        }
      } catch {
        // use default
      }
    }
    return process.env.NEXT_PUBLIC_WS_URL;
  }
  const host = typeof window !== "undefined" ? window.location.hostname : "localhost";
  return `ws://${host}:3001`;
}

export default function RoomComponent({ session }: { session: Session }) {
  const params = useParams();
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Fetch initial messages
  useEffect(() => {
    const fetchChatMessages = async () => {
      try {
        const res = await axios.get(`/room/chats?roomId=${params.roomId}`);
        const formattedMessages = (res.data.chats || []).map(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (chat: any) => ({
            id: chat.id,
            message: chat.message,
            senderId: chat.senderId,
            senderName: chat.sender?.name || "User",
            time: chat.time,
            roomId: chat.roomId,
          })
        );
        setMessages(formattedMessages);
      } catch (err) {
        console.error("Failed to fetch chats:", err);
      }
    };

    fetchChatMessages();
  }, [params.roomId]);

  // Connect WebSocket for chat
  useEffect(() => {
    let isCleanedUp = false;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    const connectChatWs = () => {
      if (isCleanedUp) return;
      try {
        const wsUrl = getWsUrl();
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          console.log("Chat WS connection established");
          ws.send(
            JSON.stringify({
              type: "join",
              payload: { roomId: params.roomId },
            })
          );
        };

        ws.onmessage = (event) => {
          try {
            const parsed = JSON.parse(event.data);
            // Ignore any non-chat messages (like stroke broadcasts)
            if (parsed.type && parsed.type !== "chat") {
              return;
            }

            if (parsed.type === "chat" && parsed.payload) {
              const rawPayload = parsed.payload;
              // Guard against rawPayload being an object or stroke payload
              const text =
                typeof rawPayload.message === "string"
                  ? rawPayload.message
                  : typeof rawPayload === "string"
                  ? rawPayload
                  : null;

              if (!text) return;

              const chatPayload: ChatMessage = {
                id: rawPayload.id,
                message: text,
                senderId: rawPayload.senderId,
                senderName: rawPayload.senderName,
                time: rawPayload.time,
                roomId: rawPayload.roomId,
              };
              setMessages((prev) => [...prev, chatPayload]);
            } else if (
              typeof parsed.message === "string" &&
              parsed.roomId &&
              !parsed.type
            ) {
              setMessages((prev) => [...prev, parsed as ChatMessage]);
            }
          } catch (error) {
            console.error("Error parsing WebSocket chat message:", error);
          }
        };

        ws.onclose = () => {
          if (!isCleanedUp) {
            reconnectTimer = setTimeout(connectChatWs, 2000);
          }
        };

        ws.onerror = () => {
          if (ws && ws.readyState === WebSocket.OPEN) {
            ws.close();
          }
        };
      } catch {
        if (!isCleanedUp) {
          reconnectTimer = setTimeout(connectChatWs, 2000);
        }
      }
    };

    connectChatWs();

    return () => {
      isCleanedUp = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (
        wsRef.current &&
        (wsRef.current.readyState === WebSocket.OPEN ||
          wsRef.current.readyState === WebSocket.CONNECTING)
      ) {
        wsRef.current.close();
      }
      wsRef.current = null;
    };
  }, [params.roomId]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const messageData: ChatMessage = {
      message: inputMessage.trim(),
      roomId: params.roomId as string,
      senderId: session.user.id,
      senderName: session.user.name || "User",
      time: new Date().toISOString(),
    };

    // Optimistically update UI
    setMessages((prev) => [...prev, messageData]);
    setInputMessage("");

    // Send via WebSocket for live broadcast
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: "chat",
          payload: messageData,
        })
      );
    }

    // Persist to database
    try {
      await axios.post("/room/sendmessage", {
        message: messageData.message,
        roomId: messageData.roomId,
      });
    } catch (err) {
      console.error("Failed to persist message:", err);
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-white">
      {/* Drawing Canvas */}
      <DrawingBoard userId={session.user.id} />

      {/* Top Controls */}
      <div
        className="fixed top-4 left-4 z-50 mt-8 rounded-full text-white bg-black p-2 w-10 h-10 flex items-center justify-center cursor-pointer shadow-md hover:bg-gray-800 transition"
        onClick={() => setChatOpen(true)}
        title="Open Chat"
      >
        💬
      </div>
      <div className="absolute top-4 right-4 flex gap-2 z-10">
        <JitsiEmbed session={session} />
      </div>

      {/* Overlay */}
      {chatOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40"
          onClick={() => setChatOpen(false)}
        />
      )}

      {/* Chat Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full w-80 bg-white shadow-2xl z-50 transform transition-transform duration-300 flex flex-col ${
          chatOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
          <h2 className="text-lg font-bold text-gray-800">Room Chat</h2>
          <button
            onClick={() => setChatOpen(false)}
            className="text-gray-500 hover:text-gray-800 text-xl font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Message List */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3">
          {messages.length === 0 ? (
            <p className="text-gray-400 text-sm text-center mt-10">
              No messages yet. Say hello!
            </p>
          ) : (
            messages.map((msg, index) => {
              const isMe = msg.senderId === session.user.id;
              const textContent =
                typeof msg.message === "string"
                  ? msg.message
                  : JSON.stringify(msg.message);

              return (
                <div
                  key={msg.id || index}
                  className={`flex flex-col ${
                    isMe ? "items-end" : "items-start"
                  }`}
                >
                  <span className="text-[11px] text-gray-400 mb-0.5 px-1">
                    {isMe ? "You" : msg.senderName || "Unknown"}
                  </span>
                  <div
                    className={`max-w-[80%] rounded-xl px-3.5 py-2 text-sm shadow-sm ${
                      isMe
                        ? "bg-blue-600 text-white rounded-br-none"
                        : "bg-gray-100 text-gray-800 rounded-bl-none"
                    }`}
                  >
                    {textContent}
                  </div>
                </div>
              );
            })
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input */}
        <div className="border-t p-2 flex items-center gap-2 bg-gray-50">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSendMessage();
              }
            }}
          />
          <button
            onClick={handleSendMessage}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md text-sm font-medium cursor-pointer transition"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

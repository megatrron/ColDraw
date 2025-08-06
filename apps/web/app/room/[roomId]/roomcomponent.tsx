"use client";
import axios from "axios";
import { Session } from "next-auth";
import { useParams } from "next/navigation";
import { useState, useEffect, useRef } from "react";

type ChatMessage = {
  senderId: string;
  message: string;
  roomId: string;
};

export default function RoomComponent({ user }: { user: Session["user"] }) {
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);
  const params = useParams();
  // Simulate fetching the latest 10 messages (you'll replace this with real data)
  useEffect(() => {
    const roomId = params.roomId as string;
    const fetchMessages = async () => {
      try {
        const response = await axios.get(`/room/chats?limit=10&roomId=${roomId}`);
        setMessages(response.data.chats || []);
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    };
    if (chatOpen) {
      fetchMessages();
    }
  }, [chatOpen, params.roomId]);

  // Scroll to bottom when messages update
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSend = () => {
    if (inputMessage.trim() === "") return;

    const newMessage: ChatMessage = {
      senderId: user.id,
      message: inputMessage,
      roomId: params.roomId as string,
    };
    const sendMessage = async () => {
      try {
        await axios.post("/room/sendmessage", newMessage);
      } catch (error) {
        console.error("Error sending message:", error);
      }
    };
    sendMessage();

    setMessages((prev) => [...prev, newMessage]);
    setInputMessage("");
  };

  return (
    <div className="relative h-screen">
      {/* Chat Icon */}
      <div
        className="rounded-full text-white bg-black p-2 pl-3 cursor-pointer w-10 m-2 z-50"
        onClick={() => setChatOpen(true)}
      >
        C
      </div>

      {/* Overlay */}
      {chatOpen && (
        <div
          className="fixed inset-0 bg-opacity-30 z-40"
          onClick={() => setChatOpen(false)}
        />
      )}

      {/* Sidebar Chat Window */}
      <div
        className={`
          fixed top-0 left-0 h-full w-80 bg-white shadow-lg z-50
          transform transition-transform duration-300 ease-in-out flex flex-col
          ${chatOpen ? "translate-x-0" : "-translate-x-full"}
        `}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 font-bold border-b">Chat Window</div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-2">
          <div className="flex flex-col justify-end space-y-2 min-h-full">
            {messages.map((msg, index) => (
              <div key={index} className="bg-gray-200 p-2 rounded text-sm">
                {msg.message}
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
        </div>


        {/* Input Box */}
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

/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Session } from "next-auth";
import { signOut } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { SettingsIcon } from "../../public/icons/settings";
import { useRouter } from "next/navigation";
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

interface Room {
  id: string;
  name: string;
  password?: string;
}

export const Dashboard = ({ user }: { user: Session["user"] }) => {
  const [open, setOpen] = useState(false);
  const [workspaces, setWorkspaces] = useState(false);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [joinname, setJoinName] = useState("");
  const [joinpassword, setJoinPassword] = useState("");
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomDropdownOpen, setRoomDropdownOpen] = useState<string | null>(null);
  const [joinWorkspace, setJoinWorkspace] = useState(false);
  const [joinRoomId, setJoinRoomId] = useState<string | null>(null);
  const [joinRoomPassword, setJoinRoomPassword] = useState<string | null>(null);
  const router = useRouter();

  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const workspaceRef = useRef<HTMLDivElement | null>(null);
  const joinworkspaceRef = useRef<HTMLDivElement | null>(null);

  const handleCreate = async () => {
    try {
      const response = await axios.post("/user/createroom", {
        name,
        password,
        adminId: user.id,
      });
      const newRoom = response.data.room;
      setRooms((prev) => [...prev, newRoom]);
      setName("");
      setPassword("");
      setWorkspaces(false);
    } catch (error: any) {
      console.error("Error creating room:", error);
    }
  };
  const handleJoin = async (id: string, pass: string) => {
    setJoinRoomId(id);
    setJoinRoomPassword(pass);
    try {
      console.log("Joining room with ID:", id, "and password:", pass);
      console.log("Joining room with ID:", joinRoomId, "and password:", joinRoomPassword);
      const res = await axios.post("/user/joinroom", {
        roomId: id,
        password: pass
      });
      setJoinRoomId(null);
      setJoinRoomPassword(null);
      
      if (res.status === 200) {
        router.push(`/room/${id}`);
      }
    } catch (error) {
      alert("Invalid room or password.");
    }
  };
  const handleJoinAsAdmin = () => {
    // Join workspace as admin logic here
  }

  const handleDeleteRoom = async (roomId: string) => {
    try {
      await axios.delete(`/user/deleteroom?id=${roomId}`);
      setRooms((prev) => prev.filter((room) => room.id !== roomId));
      setRoomDropdownOpen(null);
    } catch (error) {
      console.error("Failed to delete room:", error);
    }
  };

  const handleCopyRoomURL = (roomId: string) => {
    const url = roomId;
    navigator.clipboard.writeText(url);
    alert("Workspace URL copied!");
    setRoomDropdownOpen(null);
  };

  const handleCopyRoomPassword = (roomPassword: string) => {
    navigator.clipboard.writeText(roomPassword);
    alert("Workspace password copied!");
    setRoomDropdownOpen(null);
  };

  useEffect(() => {
    const fetchRooms = async () => {
      const res = await axios.get(`/user/getrooms?id=${user.id}`);
      setRooms(res.data.rooms);
    };
    fetchRooms();
  }, [user.id]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (workspaceRef.current && !workspaceRef.current.contains(event.target as Node)) {
        setWorkspaces(false);
      }
    };
    if (workspaces) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [workspaces]);

  return (
    <div className="relative z-0">
      {/* Header */}
      <div className="w-screen h-16 rounded-b-md bg-gray-800 flex items-center justify-between px-4 z-10">
        <div className="text-white text-2xl mx-10">ColDraw</div>
        <div className="flex items-center gap-4 relative" ref={dropdownRef}>
          <div className="text-white">Hello, {user?.name}</div>
          <div
            className="rounded-full bg-gray-200 px-4.5 py-3 cursor-pointer"
            onClick={() => setOpen((prev) => !prev)}
          >
            U
          </div>

          {open && (
            <div className="absolute right-0 top-14 mt-1 w-48 bg-white shadow-lg rounded-md z-50 border">
              <ul className="py-2 text-sm text-gray-700">
                <li>
                  <button className="w-full text-left px-4 py-2 hover:bg-gray-100">Profile</button>
                </li>
                <li>
                  <button className="w-full text-left px-4 py-2 hover:bg-gray-100">Settings</button>
                </li>
                <li>
                  <button
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600"
                    onClick={() => signOut()}
                  >
                    Sign Out
                  </button>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Dashboard Body */}
      <div className="h-screen pl-4">
        <div className="text-3xl text-gray-650 font-bold italic ml-4 mt-4">Dashboard</div>

        <div className="flex items-center mt-6">
          <div className="ml-4 text-2xl">Your workspaces</div>
          <div className="translate-y-2 translate-x-60 relative z-30">
            <button
              onClick={() => setWorkspaces((prev) => !prev)}
              className="bg-blue-600 text-white hover:bg-blue-700 cursor-pointer px-4 py-2 text-base rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none"
            >
              Create New Workspace
            </button>

            {workspaces && (
              <div
                ref={workspaceRef}
                className="absolute top-14 left-0 w-96 bg-white shadow-lg rounded-xl p-6 border border-gray-200 z-50"
              >
                <h2 className="text-lg font-semibold mb-4">Create New Workspace</h2>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Workspace Name
                  </label>
                  <input
                    type="text"
                    placeholder="Enter workspace name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full border border-gray-300 rounded-md p-2"
                  />
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Workspace Password (optional)
                  </label>
                  <input
                    type="password"
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full border border-gray-300 rounded-md p-2"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={handleCreate}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                  >
                    Create
                  </button>
                  <button
                    onClick={() => {
                      setName("");
                      setPassword("");
                      setWorkspaces(false);
                    }}
                    className="border px-4 py-2 rounded-md text-gray-700 hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
            <button onClick={() => setJoinWorkspace((prev) => !prev)}
            className="mx-4 cursor-pointer rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none border border-gray-300 text-gray-800 hover:bg-gray-100 px-4 py-2 text-base">
              Join Workspace
            </button>
            {joinWorkspace && (
              <div
                ref={joinworkspaceRef}
                className="absolute top-14 left-0 w-96 bg-white shadow-lg rounded-xl p-6 border border-gray-200 z-50"
              >
                <h2 className="text-lg font-semibold mb-4">Join a Workspace</h2>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Workspace Id
                  </label>
                  <input
                    type="text"
                    placeholder="Enter workspace id"
                    value={joinname}
                    onChange={(e) => setJoinName(e.target.value)}
                    className="w-full border border-gray-300 rounded-md p-2"
                  />
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Workspace Password (optional)
                  </label>
                  <input
                    type="password"
                    placeholder="Enter password"
                    value={joinpassword}
                    onChange={(e) => setJoinPassword(e.target.value)}
                    className="w-full border border-gray-300 rounded-md p-2"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => handleJoin(joinname, joinpassword)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                  >
                    Join
                  </button>
                  <button
                    onClick={() => {
                      setJoinName("");
                      setJoinPassword("");
                      setJoinWorkspace(false);
                    }}
                    className="border px-4 py-2 rounded-md text-gray-700 hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-6 p-4 mt-8">
          {rooms.map((room) => (
            <div
              key={room.id}
              className="w-64 h-32 bg-gray-100 p-4 rounded shadow hover:bg-gray-200 relative z-10"
              onClick={() => {
                handleJoin(room.id, room.password || "");
              }}
            >
              <div className="flex justify-end">
                <div className="relative z-20">
                  <div
                    className="cursor-pointer"
                    onClick={() =>
                      setRoomDropdownOpen((prev) => (prev === room.id ? null : room.id))
                    }
                  >
                    <SettingsIcon />
                  </div>

                  {roomDropdownOpen === room.id && (
                    <div className="absolute right-0 top-8 mt-1 w-40 bg-white shadow-lg rounded-md z-50 border">
                      <ul className="py-2 text-sm text-gray-700">
                        <li>
                          <button
                            className="w-full text-left px-4 py-2 hover:bg-gray-100"
                            onClick={() => handleDeleteRoom(room.id)}
                          >
                            Delete Workspace
                          </button>
                        </li>
                        <li>
                          <button
                            className="w-full text-left px-4 py-2 hover:bg-gray-100"
                            onClick={() => handleCopyRoomURL(room.id)}
                          >
                            Copy Workspace URL
                          </button>
                        </li>
                        {room.password && (
                          <li>
                            <button
                              className="w-full text-left px-4 py-2 hover:bg-gray-100"
                              onClick={() => handleCopyRoomPassword(room.password!)}
                            >
                              Copy Workspace Password
                            </button>
                          </li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
              <h3 className="mx-auto mt-4 text-xl font-semibold text-center">
                {room.name}
              </h3>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

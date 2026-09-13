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
  password?: string | null;
  adminId?: string;
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
  const [profilePic, setProfilePic] = useState<string | null>(user.image || null);
  const [uploadingPic, setUploadingPic] = useState(false);
  const router = useRouter();

  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const workspaceRef = useRef<HTMLDivElement | null>(null);
  const joinworkspaceRef = useRef<HTMLDivElement | null>(null);
  const roomDropdownRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleCreate = async () => {
    if (!name.trim()) {
      alert("Please enter a workspace name");
      return;
    }

    try {
      const response = await axios.post("/user/createroom", {
        name: name.trim(),
        password: password.trim() || undefined,
      });
      const newRoom = response.data.room;
      setRooms((prev) => [newRoom, ...prev]);
      setName("");
      setPassword("");
      setWorkspaces(false);
    } catch (error) {
      console.error("Error creating room:", error);
      alert("Failed to create workspace. Please try again.");
    }
  };

  const handleJoin = async (id: string, pass: string) => {
    const trimmedId = id.trim();
    if (!trimmedId) {
      alert("Please enter a workspace ID");
      return;
    }

    try {
      const res = await axios.post("/user/joinroom", {
        roomId: trimmedId,
        password: pass.trim() || undefined,
      });

      if (res.status === 200) {
        router.push(`/room/${trimmedId}`);
      }
    } catch {
      alert("Invalid room ID or password.");
    }
  };

  const handleDeleteRoom = async (roomId: string) => {
    if (!confirm("Are you sure you want to delete this workspace?")) return;
    try {
      await axios.delete(`/user/deleteroom?id=${roomId}`);
      setRooms((prev) => prev.filter((room) => room.id !== roomId));
      setRoomDropdownOpen(null);
    } catch (error) {
      console.error("Failed to delete room:", error);
      alert("Failed to delete workspace. You must be the admin.");
    }
  };

  const handleCopyRoomId = (roomId: string) => {
    navigator.clipboard.writeText(roomId);
    alert("Workspace ID copied to clipboard!");
    setRoomDropdownOpen(null);
  };

  const handleCopyRoomPassword = (roomPassword?: string | null) => {
    if (!roomPassword) {
      alert("This workspace does not have a password.");
      setRoomDropdownOpen(null);
      return;
    }
    navigator.clipboard.writeText(roomPassword);
    alert("Workspace password copied to clipboard!");
    setRoomDropdownOpen(null);
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image file.");
      return;
    }

    setUploadingPic(true);

    try {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = async () => {
          const canvas = document.createElement("canvas");
          const size = 256;
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            setUploadingPic(false);
            return;
          }

          const minDim = Math.min(img.width, img.height);
          const sx = (img.width - minDim) / 2;
          const sy = (img.height - minDim) / 2;
          ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);

          const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.85);

          try {
            await axios.post("/user/updateprofile", { image: compressedDataUrl });
            setProfilePic(compressedDataUrl);
            router.refresh();
          } catch (err) {
            console.error("Failed to update profile picture:", err);
            alert("Failed to update profile picture. Please try again.");
          } finally {
            setUploadingPic(false);
          }
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    } catch {
      setUploadingPic(false);
      alert("Error reading image file.");
    }

    e.target.value = "";
  };

  const handleRemoveProfilePic = async () => {
    if (!confirm("Are you sure you want to remove your profile picture?")) return;
    try {
      setUploadingPic(true);
      await axios.post("/user/updateprofile", { image: null });
      setProfilePic(null);
      router.refresh();
    } catch (err) {
      console.error("Failed to remove profile picture:", err);
      alert("Failed to remove profile picture.");
    } finally {
      setUploadingPic(false);
    }
  };

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const res = await axios.get("/user/getrooms");
        setRooms(res.data.rooms || []);
      } catch (err) {
        console.error("Failed to fetch rooms:", err);
      }
    };
    fetchRooms();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
      if (
        workspaceRef.current &&
        !workspaceRef.current.contains(e.target as Node)
      ) {
        setWorkspaces(false);
      }
      if (
        joinworkspaceRef.current &&
        !joinworkspaceRef.current.contains(e.target as Node)
      ) {
        setJoinWorkspace(false);
      }
      if (
        roomDropdownRef.current &&
        !roomDropdownRef.current.contains(e.target as Node)
      ) {
        setRoomDropdownOpen(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Navbar */}
      <header className="flex justify-between items-center px-8 py-4 bg-white border-b border-gray-200 shadow-sm">
        <div
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => router.push("/dashboard")}
        >
          <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-sm">
            C
          </div>
          <span className="text-xl font-bold text-gray-800 tracking-tight">
            ColDraw
          </span>
        </div>

        <div className="relative">
          <button
            onClick={() => setOpen((prev) => !prev)}
            className="flex items-center gap-2 focus:outline-none cursor-pointer"
            title={user.name || "User profile"}
          >
            {profilePic ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profilePic}
                alt={user.name || "User"}
                className="w-9 h-9 rounded-full object-cover border border-gray-300 shadow-sm"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-semibold flex items-center justify-center border border-blue-700 shadow-sm">
                {user.name?.[0]?.toUpperCase() || "U"}
              </div>
            )}
          </button>

          {open && (
            <div
              ref={dropdownRef}
              className="absolute right-0 mt-3 w-64 bg-white shadow-xl rounded-xl p-2 border border-gray-100 z-50 animate-in fade-in zoom-in-95 duration-100"
            >
              <div className="px-3 py-2 border-b border-gray-100 flex items-center gap-3">
                {profilePic ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profilePic}
                    alt={user.name || "User"}
                    className="w-10 h-10 rounded-full object-cover border border-gray-200 shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-semibold flex items-center justify-center shrink-0">
                    {user.name?.[0]?.toUpperCase() || "U"}
                  </div>
                )}
                <div className="truncate">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {user.name}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                </div>
              </div>

              {/* Profile Photo Update / Remove Options */}
              <div className="py-1 border-b border-gray-100">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleImageFileChange}
                  className="hidden"
                />
                <button
                  type="button"
                  disabled={uploadingPic}
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                  <span>{uploadingPic ? "Updating photo..." : "Update Profile Picture"}</span>
                </button>

                {profilePic && (
                  <button
                    type="button"
                    disabled={uploadingPic}
                    onClick={handleRemoveProfilePic}
                    className="w-full text-left px-3 py-1.5 text-xs text-red-500 hover:bg-red-50 rounded-lg transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                    <span>Remove Custom Photo</span>
                  </button>
                )}
              </div>

              <button
                onClick={() => signOut({ callbackUrl: "/auth/login" })}
                className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition mt-1 font-medium cursor-pointer"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-200">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome back, {user.name?.split(" ")[0]} 👋
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Create, join, and manage your real-time collaborative workspaces.
            </p>
          </div>

          <div className="flex items-center gap-3 relative">
            <button
              onClick={() => setWorkspaces((prev) => !prev)}
              className="bg-blue-600 text-white hover:bg-blue-700 cursor-pointer px-4 py-2 text-sm rounded-lg font-medium shadow-sm transition"
            >
              + Create Workspace
            </button>

            {workspaces && (
              <div
                ref={workspaceRef}
                className="absolute top-12 right-0 w-96 bg-white shadow-xl rounded-xl p-6 border border-gray-200 z-50"
              >
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Create a Workspace
                </h2>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Workspace Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Brainstorming Project"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Workspace Password (optional)
                  </label>
                  <input
                    type="password"
                    placeholder="Optional password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => {
                      setName("");
                      setPassword("");
                      setWorkspaces(false);
                    }}
                    className="border border-gray-300 px-4 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-100 cursor-pointer transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreate}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 cursor-pointer font-medium transition"
                  >
                    Create
                  </button>
                </div>
              </div>
            )}

            <button
              onClick={() => setJoinWorkspace((prev) => !prev)}
              className="border border-gray-300 text-gray-700 hover:bg-gray-100 cursor-pointer px-4 py-2 text-sm rounded-lg font-medium transition"
            >
              Join Workspace
            </button>

            {joinWorkspace && (
              <div
                ref={joinworkspaceRef}
                className="absolute top-12 right-0 w-96 bg-white shadow-xl rounded-xl p-6 border border-gray-200 z-50"
              >
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Join a Workspace</h2>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Workspace ID
                  </label>
                  <input
                    type="text"
                    placeholder="Enter workspace ID"
                    value={joinname}
                    onChange={(e) => setJoinName(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => {
                      setJoinName("");
                      setJoinPassword("");
                      setJoinWorkspace(false);
                    }}
                    className="border border-gray-300 px-4 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-100 cursor-pointer transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleJoin(joinname, joinpassword)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 cursor-pointer font-medium transition"
                  >
                    Join
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Workspaces list */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Your Workspaces</h2>
          {rooms.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
              <p className="text-gray-500 text-sm">You don&apos;t have any workspaces yet.</p>
              <button
                onClick={() => setWorkspaces(true)}
                className="mt-3 text-blue-600 hover:underline text-sm font-medium cursor-pointer"
              >
                Create your first workspace
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6" ref={roomDropdownRef}>
              {rooms.map((room) => (
                <div
                  key={room.id}
                  className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition flex flex-col justify-between h-40 relative group"
                >
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-medium px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                      {room.adminId === user.id ? "Admin" : "Member"}
                    </span>

                    <div className="relative">
                      <button
                        className="p-1 rounded-md hover:bg-gray-100 text-gray-500 cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          setRoomDropdownOpen((prev) => (prev === room.id ? null : room.id));
                        }}
                        title="Workspace options"
                      >
                        <SettingsIcon />
                      </button>

                      {roomDropdownOpen === room.id && (
                        <div className="absolute right-0 top-8 w-56 bg-white shadow-xl rounded-lg z-50 border border-gray-100 py-1 text-sm text-gray-700">
                          <button
                            className="w-full text-left px-4 py-2 hover:bg-gray-50 cursor-pointer flex items-center gap-2"
                            onClick={() => handleCopyRoomId(room.id)}
                          >
                            📋 Copy Workspace ID
                          </button>
                          <button
                            className="w-full text-left px-4 py-2 hover:bg-gray-50 cursor-pointer flex items-center gap-2"
                            onClick={() => handleCopyRoomPassword(room.password)}
                          >
                            🔑 Copy Workspace Password
                          </button>
                          {room.adminId === user.id && (
                            <button
                              className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 cursor-pointer flex items-center gap-2 border-t border-gray-100 mt-1"
                              onClick={() => handleDeleteRoom(room.id)}
                            >
                              🗑️ Delete Workspace
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div
                    className="cursor-pointer flex-1 flex flex-col justify-center"
                    onClick={() => handleJoin(room.id, room.password || "")}
                  >
                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition truncate">
                      {room.name}
                    </h3>
                    {room.password && (
                      <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                        🔒 Password protected
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => handleJoin(room.id, room.password || "")}
                    className="w-full mt-2 bg-gray-50 group-hover:bg-blue-50 text-gray-700 group-hover:text-blue-600 py-1.5 rounded-lg text-xs font-semibold text-center transition"
                  >
                    Open Canvas →
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

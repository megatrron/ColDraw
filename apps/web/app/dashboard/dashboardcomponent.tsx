"use client";

import { Session } from "next-auth";
import { signOut } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import axios from "axios";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import NextAuth from "next-auth";


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
  // add other fields as needed (e.g., adminId?)
}


export const Dashboard = ({ user }: { user: Session["user"] }) => {
  const [open, setOpen] = useState(false);
  const [workspaces, setWorkspaces] = useState(false);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [rooms, setRooms] = useState<Room[]>([]);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const workspaceRef = useRef<HTMLDivElement | null>(null);

  const handleCreate = async () => {
    try {
      const response = await axios.post("/user/createroom", {
        name: name,
        password: password,
        adminId: user.id,
      });
      const newRoom = response.data.room;
      setRooms((prev) => [...prev, newRoom]);
      console.log("Room created:", response.data);
      // Clear form and close modal if needed
      setName("");
      setPassword("");
      setWorkspaces(false);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
    } catch (error: any) {
      console.log("error");
    }
  };
  useEffect(() => {
    const fetchRooms = async () => {
      const res = await axios.get(`/user/getrooms?id=${user.id}`);
      setRooms(res.data.rooms); // depends on your route
    };

    fetchRooms();
  }, [user.id]);



  // Close profile dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close workspace card
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        workspaceRef.current &&
        !workspaceRef.current.contains(event.target as Node)
      ) {
        setWorkspaces(false);
      }
    };

    if (workspaces) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [workspaces]);

  return (
    <div>
      <div className="w-screen h-16 rounded-b-md bg-gray-800 flex items-center justify-between px-4">
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
                  <button className="w-full text-left px-4 py-2 hover:bg-gray-100">
                    Profile
                  </button>
                </li>
                <li>
                  <button className="w-full text-left px-4 py-2 hover:bg-gray-100">
                    Settings
                  </button>
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

      <div className="h-screen">
        <div className="text-3xl text-gray-650 font-bold italic ml-4 mt-4">
          Dashboard
        </div>
        <div className="flex items-center mt-6">
          <div className="ml-4 text-2xl">Your workspaces</div>
          <div className="translate-y-2 translate-x-60 relative">
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
                <h2 className="text-lg font-semibold mb-4">
                  Create New Workspace
                </h2>

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

            <button className="mx-4 cursor-pointer rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none border border-gray-300 text-gray-800 hover:bg-gray-100 px-4 py-2 text-base">
              Join Workspace
            </button>
          </div>
        </div>
        <div className="flex flex-wrap gap-6 p-4 mt-4">
          {rooms.map((room) => (
            <div
              key={room.id}
              className="w-64 h-32 bg-gray-100 p-4 rounded shadow cursor-pointer hover:bg-gray-200"
              onClick={() => {}}
            >
              <h3 className="text-xl font-semibold">{room.name}</h3>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

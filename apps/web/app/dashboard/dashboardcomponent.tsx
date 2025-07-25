"use client";

import { Session } from "next-auth";
import { signOut } from "next-auth/react";
import { useEffect, useRef, useState } from "react";

export const Dashboard = ({ user }: { user: Session["user"] }) => {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
                  <button className="w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600" onClick={() => signOut()}>
                    Sign Out
                  </button>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>

      <div className="h-screen">
        <div className="text-3xl text-gray-650 font-bold italic ml-4 mt-4">Dashboard</div>
        <div className="flex items-center mt-6">
          <div className="ml-4 text-2xl">Your workspaces</div>
          <div className="translate-y-2 translate-x-60">
            <button className="bg-blue-600 text-white hover:bg-blue-700 cursor-pointer px-4 py-2 text-base rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none">
              Create New Workspace
            </button>
            <button className="mx-4 cursor-pointer rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none border border-gray-300 text-gray-800 hover:bg-gray-100 px-4 py-2 text-base">
              Join Workspace
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

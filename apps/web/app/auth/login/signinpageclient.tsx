"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface Provider {
  id: string;
  name: string;
}

interface SignInPageClientProps {
  providers: Record<string, Provider> | null;
}

export default function SignInPageClient({ providers }: SignInPageClientProps) {
  const router = useRouter();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const name = formData.get("name") as string;

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email,
        password,
        name,
        callbackUrl: "/dashboard",
      });

      if (res?.error) {
        setErrorMsg("Invalid email or password. Please try again.");
      } else if (res?.ok) {
        router.push("/dashboard");
      }
    } catch {
      setErrorMsg("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Background image */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url("/login_pattern.svg")`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      />

      {/* Dark gray trapezoid on desktop */}
      <div
        className="absolute top-0 left-0 h-full z-10 hidden lg:block"
        style={{
          width: "48%",
          backgroundColor: "#2f3640",
          clipPath: "polygon(0 0, 97% 0, 90% 100%, 0 100%)",
        }}
      />

      {/* Mobile overlay */}
      <div className="absolute inset-0 z-10 bg-gray-800/90 lg:hidden" />

      {/* Foreground content */}
      <div className="relative z-20 p-6 lg:p-10 text-white h-full flex flex-col justify-center lg:justify-start">
        {/* Header */}
        <div className="mb-6 lg:mb-12">
          <h1 className="text-3xl lg:text-4xl font-bold">ColDraw</h1>
          <p className="text-sm lg:text-base text-gray-300 mt-1">
            A platform for collaborative realtime drawing with communication.
          </p>
        </div>

        <div className="w-full max-w-sm lg:ml-12">
          <h2 className="text-2xl font-bold mb-4">Join today!</h2>

          {providers &&
            Object.values(providers).map((provider) => {
              if (provider.id === "google") {
                return (
                  <button
                    key={provider.name}
                    className="w-full bg-white text-black font-medium text-base rounded-lg py-2.5 px-4 cursor-pointer hover:bg-gray-100 transition shadow-sm mb-4 flex items-center justify-center gap-2"
                    onClick={() => {
                      signIn("google", { callbackUrl: "/dashboard" });
                    }}
                  >
                    Sign in with {provider.name}
                  </button>
                );
              }
              return null;
            })}

          {providers?.credentials && (
            <div>
              {providers.google && (
                <div className="text-center text-xs text-gray-400 my-4 tracking-wider uppercase">
                  — or continue with email —
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <input
                    className="w-full bg-white/10 border border-gray-600 focus:border-blue-400 focus:bg-white/20 rounded-lg p-2.5 text-white placeholder-gray-400 text-sm focus:outline-none transition"
                    name="email"
                    type="email"
                    placeholder="Email address"
                    required
                  />
                </div>
                <div>
                  <input
                    className="w-full bg-white/10 border border-gray-600 focus:border-blue-400 focus:bg-white/20 rounded-lg p-2.5 text-white placeholder-gray-400 text-sm focus:outline-none transition"
                    name="password"
                    type="password"
                    placeholder="Password"
                    required
                  />
                </div>
                <div>
                  <input
                    className="w-full bg-white/10 border border-gray-600 focus:border-blue-400 focus:bg-white/20 rounded-lg p-2.5 text-white placeholder-gray-400 text-sm focus:outline-none transition"
                    name="name"
                    type="text"
                    placeholder="Your Name (for new sign-ups)"
                  />
                </div>

                {errorMsg && (
                  <div className="p-2.5 bg-red-900/60 border border-red-500 text-red-200 text-xs rounded-lg">
                    {errorMsg}
                  </div>
                )}

                <button
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium p-2.5 rounded-lg text-sm transition cursor-pointer shadow disabled:opacity-50"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? "Signing in..." : "Sign in / Register"}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// app/auth/login/SignInPageClient.tsx
"use client";
import { signIn } from "next-auth/react";

interface Provider {
  id: string;
  name: string;
}

interface SignInPageClientProps {
  providers: Record<string, Provider> | null;
}

export default function SignInPageClient({ providers }: SignInPageClientProps) {
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

      {/* Dark gray trapezoid */}
      <div
        className="absolute top-0 left-0 h-full z-10"
        style={{
          width: "46%",
          backgroundColor: "#2f3640",
          clipPath: "polygon(0 0, 97% 0, 90% 100%, 0 100%)",
        }}
      />

      {/* Foreground content */}
      <div className="relative z-20 p-10 text-white">
        <div>
          <h1 className="text-4xl font-bold">ColDraw</h1>
          <p>A platform for collaborative realtime drawing with communication.</p>
          <div className="mt-36 ml-46 w-80 h-120 ">
            <div className="text-3xl font-bold ml-18 mt-2">Join today!</div>
            <div>
              {providers &&
                Object.values(providers).map((provider) => {
                  if (provider.id === "credentials") {
                    return (
                      <div key="credentials">
                        <div className="text-center my-4 -translate-x-2 tracking-wide">
                          -----or-----
                        </div>
                        <form
                          onSubmit={async (e) => {
                            e.preventDefault();
                            const formData = new FormData(e.currentTarget);
                            const email = formData.get("email");
                            const password = formData.get("password");
                            const name = formData.get("name");

                            await signIn("credentials", {
                              redirect: true,
                              email,
                              password,
                              name,
                              callbackUrl: "/dashboard",
                            });
                          }}
                        >
                          <input
                            className="ml-10 border border-gray-300 rounded-md p-2 w-fit"
                            name="email"
                            type="text"
                            placeholder="Email"
                            required
                          />
                          <input
                            className="ml-10 border border-gray-300 rounded-md p-2 w-fit mt-4"
                            name="password"
                            type="password"
                            placeholder="Password"
                            required
                          />
                          <input
                            className="ml-10 border border-gray-300 rounded-md p-2 w-fit mt-4"
                            name="name"
                            type="text"
                            placeholder="Name"
                            required
                          />
                          <button
                            className="bg-white text-black p-2 w-fit mt-4 rounded-md ml-10 px-5 cursor-pointer"
                            type="submit"
                          >
                            Sign in with Credentials
                          </button>
                        </form>
                      </div>
                    );
                  }

                  return (
                    <div key={provider.name}>
                      <button
                        className="bg-white text-black text-lg rounded-3xl mt-4 ml-11 cursor-pointer px-6 py-2"
                        onClick={() => {
                          signIn("google", {
                            callbackUrl: "/dashboard", // 👈 This ensures redirection
                          })
                        }}
                      >
                        Sign in with {provider.name}
                      </button>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

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

      {/* Dark gray trapezoid - only on desktop */}
      <div
        className="absolute top-0 left-0 h-full z-10 hidden lg:block"
        style={{
          width: "46%",
          backgroundColor: "#2f3640",
          clipPath: "polygon(0 0, 97% 0, 90% 100%, 0 100%)",
        }}
      />

      {/* Mobile overlay for smaller screens */}
      <div className="absolute inset-0 z-10 bg-gray-800 bg-opacity-90 lg:hidden" />

      {/* Foreground content */}
      <div className="relative z-20 p-6 lg:p-10 text-white h-full flex flex-col lg:block">
        {/* Mobile: Header at top */}
        <div className="lg:hidden text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">ColDraw</h1>
          <p className="text-sm text-gray-300">
            A platform for collaborative realtime drawing with communication.
          </p>
        </div>

        {/* Desktop: Original layout */}
        <div className="hidden lg:block">
          <h1 className="text-4xl font-bold">ColDraw</h1>
          <p>A platform for collaborative realtime drawing with communication.</p>
          <div className="mt-36 ml-46 w-80 h-120">
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
                            callbackUrl: "/dashboard",
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

        {/* Mobile: Centered content */}
        <div className="flex-1 flex items-center justify-center lg:hidden">
          <div className="w-full max-w-sm">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-8 text-white">Join today!</h2>
              
              <div className="space-y-6">
                {providers &&
                  Object.values(providers).map((provider) => {
                    if (provider.id === "credentials") {
                      return (
                        <div key="credentials" className="space-y-4">
                          <div className="text-center text-gray-300 tracking-wide">
                            -----or-----
                          </div>
                          <form
                            className="space-y-4"
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
                              className="w-full border border-gray-300 rounded-md p-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              name="email"
                              type="email"
                              placeholder="Email"
                              required
                            />
                            <input
                              className="w-full border border-gray-300 rounded-md p-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              name="password"
                              type="password"
                              placeholder="Password"
                              required
                            />
                            <input
                              className="w-full border border-gray-300 rounded-md p-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              name="name"
                              type="text"
                              placeholder="Name"
                              required
                            />
                            <button
                              className="w-full bg-white text-black p-3 rounded-md font-medium hover:bg-gray-100 transition-colors duration-200"
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
                          className="w-full bg-white text-black text-lg rounded-3xl py-3 px-6 font-medium hover:bg-gray-100 transition-colors duration-200"
                          onClick={() => {
                            signIn("google", {
                              callbackUrl: "/dashboard",
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
    </div>
  );
}

// app/auth/login/page.tsx
import { getProviders } from "next-auth/react";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import { redirect } from "next/navigation";
import SignInPageClient from "./signinpageclient";

export default async function SignInPage() {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect("/dashboard");
  }

  const providers = await getProviders();

  return <SignInPageClient providers={providers} />;
}

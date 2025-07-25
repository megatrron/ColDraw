
import { getServerSession } from "next-auth";
import { authOptions } from "../../lib/auth"; // adjust path as needed
import { redirect } from "next/navigation";
import { Dashboard } from "./dashboardcomponent"
export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  console.log("Session:", session);

  if (!session) {
    redirect("/auth/login"); // 👈 if you're doing this
  }

  return (
    <Dashboard user={session.user} />
  )
}

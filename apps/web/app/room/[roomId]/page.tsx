import { redirect } from "next/dist/client/components/navigation.react-server";
import RoomComponent from "./roomcomponent";
import { getServerSession } from 'next-auth';
import { authOptions } from "../../../lib/auth";

export default async function Room() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/auth/login");
  }
  return <div>
    <RoomComponent user={session.user} />
  </div>;
}
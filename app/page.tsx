import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

export default async function Home() {
  const { userId } = await auth();

  if (userId) {
    // Authenticated users go to the dashboard
    redirect("/");
  }

  // Unauthenticated users see a landing page or get redirected to sign-in
  redirect("/sign-in");
}

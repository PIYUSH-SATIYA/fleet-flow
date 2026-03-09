import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { LandingPage } from "@/components/landing";

export default async function Home() {
  const { userId } = await auth();

  if (userId) {
    redirect("/vehicles");
  }

  return <LandingPage />;
}

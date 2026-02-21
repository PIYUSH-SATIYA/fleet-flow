import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

export default async function Home() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  // Authenticated users go to the dashboard (which is the (dashboard) route group root)
  // Since (dashboard)/page.tsx is the actual dashboard page at "/",
  // and this page.tsx is at the root too, we need this to just pass through.
  // The (dashboard) layout will wrap the content.
  redirect("/vehicles");
}

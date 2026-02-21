/**
 * Next.js Instrumentation Hook
 * Runs ONCE on server startup (not on every request).
 * We use this to verify the MongoDB connection before the app starts serving traffic.
 * Docs: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */
export async function register() {
  // Only run on the Node.js runtime (not on the Edge runtime)
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const connectDB = (await import("./lib/db")).default;

    try {
      await connectDB();
      console.log("🚀 [Startup] Server is ready — MongoDB connection verified.");
    } catch (error) {
      console.error("💥 [Startup] Failed to connect to MongoDB:", error);
      console.error(
        "💥 [Startup] Please ensure MONGODB_URI is set correctly in .env.local and that your MongoDB server is reachable."
      );
      // Exit the process so the server does not start with a broken DB connection.
      process.exit(1);
    }
  }
}

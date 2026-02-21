import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <SignUp
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "bg-gray-900 border-gray-800",
          },
        }}
      />
    </div>
  );
}

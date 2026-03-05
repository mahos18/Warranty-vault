import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { SignUp } from "@clerk/nextjs";

export default async function SignUpPage() {
  const { userId } = await auth();
  if (userId) redirect("/dashboard"); // ← already signed in

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <SignUp />
    </div>
  );
}

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { SignIn } from "@clerk/nextjs";

export default async function SignInPage() {
  const { userId } = await auth();
  if (userId) redirect("/dashboard"); // ← already signed in, go to dashboard

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <SignIn />
    </div>
  );
}
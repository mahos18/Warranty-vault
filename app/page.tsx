import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function HomePage() {
  const { userId } = await auth();
  if (userId) redirect("/dashboard");

  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen relative overflow-hidden"
      style={{ background: "linear-gradient(160deg, #4F46E5 0%, #3730A3 50%, #1E1B6E 100%)" }}
    >
      {/* Background circles */}
      <div className="absolute w-96 h-96 rounded-full top-[-8rem] right-[-6rem]"
        style={{ background: "rgba(255,255,255,0.04)" }} />
      <div className="absolute w-64 h-64 rounded-full bottom-[-4rem] left-[-4rem]"
        style={{ background: "rgba(255,255,255,0.04)" }} />

      {/* Content */}
      <div className="flex flex-col items-center gap-5 z-10 animate-fade-up px-8 text-center">
        {/* Logo */}
        <div
          className="w-20 h-20 rounded-3xl flex items-center justify-center text-4xl"
          style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.2)", backdropFilter: "blur(10px)" }}
        >
          🛡️
        </div>

        {/* Title */}
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Warranty Vault
          </h1>
          <p className="text-sm mt-2 font-medium" style={{ color: "rgba(255,255,255,0.65)" }}>
            Smart Warranty Management
          </p>
        </div>

        {/* Dot loader */}
        <div className="flex gap-1.5 mt-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full"
              style={{
                background: "rgba(255,255,255,0.4)",
                animation: `dotPulse 1.4s ease-in-out ${i * 0.2}s infinite`,
              }}
            />
          ))}
        </div>

        {/* CTA buttons */}
        <div className="flex flex-col gap-3 w-full mt-12">
          <Link
            href="/sign-up"
            className="w-full py-4 rounded-full text-center font-bold text-base bg-white transition-transform active:scale-95"
            style={{ color: "#4F46E5", boxShadow: "0 8px 32px rgba(0,0,0,0.2)" }}
          >
            Get Started — Free
          </Link>
          <Link
            href="/sign-in"
            className="w-full py-4 rounded-full text-center font-bold text-base transition-transform active:scale-95"
            style={{ background: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.9)", border: "1px solid rgba(255,255,255,0.2)" }}
          >
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
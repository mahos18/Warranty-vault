import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Routes that require the user to be authenticated
const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/add-product(.*)",
  "/product(.*)",
  "/service(.*)",
  "/assistant(.*)",
  "/profile(.*)",
  "/api/products(.*)",
  "/api/user(.*)",
]);

// Routes only for unauthenticated users (redirect away if already signed in)
const isAuthRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();

  // If signed in and trying to access auth pages → send to dashboard
  if (userId && isAuthRoute(req)) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // If NOT signed in and trying to access protected routes → send to home page
  if (!userId && isProtectedRoute(req)) {
    return NextResponse.redirect(new URL("/", req.url));
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
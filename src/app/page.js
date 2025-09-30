"use client";
import Link from "next/link";
import { SignedIn, SignedOut, SignInButton, UserButton, useUser } from "@clerk/nextjs";

const ALLOWED_EMAIL = process.env.NEXT_PUBLIC_ALLOWED_EMAIL?.trim();
const ALLOWED_PHONE = process.env.NEXT_PUBLIC_ALLOWED_PHONE?.trim();

export default function Home() {
  const { user } = useUser();
  const userEmail = user?.primaryEmailAddress?.emailAddress;
  const userPhone = user?.primaryPhoneNumber?.phoneNumber;
  const emailAllowed = ALLOWED_EMAIL ? userEmail === ALLOWED_EMAIL : true;
  const phoneAllowed = ALLOWED_PHONE ? userPhone === ALLOWED_PHONE : true;
  const isAdmin = !!user && emailAllowed && phoneAllowed;

  return (
    <div className="min-h-screen flex flex-col items-center gap-8 p-12">
      <h1 className="text-4xl font-bold">Ticket Generator Admin</h1>

      <SignedOut>
        <div className="flex flex-col items-center gap-4">
          <p className="text-sm text-gray-400">Admin access required. Only designated credentials may sign in.</p>
          {/* SignInButton opens Clerk's sign-in (NOT sign-up). Sign-up is disabled via instance settings. */}
          <SignInButton mode="modal" signUpForceRedirectUrl="/" fallbackRedirectUrl="/">
            <button className="px-4 py-2 bg-black text-white rounded-md border border-gray-700 hover:bg-gray-900">Sign In</button>
          </SignInButton>
        </div>
      </SignedOut>

      <SignedIn>
        {!isAdmin && (
          <div className="text-red-500 font-medium max-w-md text-center">
            Your account is not authorized. Only the configured admin email{ALLOWED_PHONE ? ' and phone number' : ''} may access.
          </div>
        )}
        {isAdmin && (
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-4">
              <UserButton afterSignOutUrl="/" />
              <span className="text-sm text-gray-500">{user?.primaryEmailAddress?.emailAddress}</span>
            </div>
            <nav className="flex gap-6 text-blue-500 underline">
              <Link href="/dashboard">Dashboard</Link>
              <Link href="/payment">Payment Page</Link>
            </nav>
          </div>
        )}
      </SignedIn>
    </div>
  );
}

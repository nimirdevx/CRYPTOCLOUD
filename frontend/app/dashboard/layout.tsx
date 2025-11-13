"use client"; // This layout *must* be a client component to check auth state

import React, { useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { jwt, encryptionKey } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // This is the gatekeeper logic
    if (!jwt || !encryptionKey) {
      router.push("/auth/login");
    }
  }, [jwt, encryptionKey, router]);

  // If the user is not authenticated, show a loading state
  // while the redirect happens.
  if (!jwt || !encryptionKey) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-xl">Redirecting to login...</p>
      </div>
    );
  }

  // If authenticated, show the dashboard page
  return <>{children}</>;
}

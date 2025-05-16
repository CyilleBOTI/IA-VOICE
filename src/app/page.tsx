"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the home page
    router.push("/home");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-pulse">
        <h1 className="text-2xl font-bold">Redirecting to Zandosh E-Commerce...</h1>
      </div>
    </div>
  );
}

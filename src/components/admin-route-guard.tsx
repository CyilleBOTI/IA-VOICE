"use client";

import { useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Loader2 } from "lucide-react";

interface AdminRouteGuardProps {
  children: ReactNode;
}

export function AdminRouteGuard({ children }: AdminRouteGuardProps) {
  const { user, userData, hasRole, loading } = useAuth();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        // User is not logged in, redirect to login
        router.push("/auth/login");
      } else if (userData && !hasRole("root")) {
        // User is logged in but doesn't have root role
        router.push("/home");
      } else if (userData && hasRole("root")) {
        // User is authorized
        setIsAuthorized(true);
      }
      setIsChecking(false);
    }
  }, [user, userData, hasRole, loading, router]);

  if (isChecking || loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Checking authorization...</p>
        </div>
      </div>
    );
  }

  return isAuthorized ? <>{children}</> : null;
}

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Input } from "@/components/ui/input";
import {
  Search,
  ShoppingBag,
  ShoppingCart,
  User,
  LogIn,
  LayoutDashboard
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

interface HeaderProps {
  showSearch?: boolean;
}

export function Header({ showSearch = true }: HeaderProps) {
  const { user, userData, hasRole } = useAuth();
  const isAdmin = hasRole('root');
  const [cartCount, setCartCount] = useState(0);

  // Fetch cart count (active checkouts) when user is logged in
  useEffect(() => {
    async function fetchCartCount() {
      if (!user) return;

      try {
        const checkoutsQuery = query(
          collection(db, "checkouts"),
          where("user_id", "==", user.uid),
          where("is_done", "==", false)
        );

        const checkoutsSnapshot = await getDocs(checkoutsQuery);
        setCartCount(checkoutsSnapshot.size);
      } catch (error) {
        console.error("Error fetching cart count:", error);
      }
    }

    fetchCartCount();
  }, [user]);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between">
        <Link href="/home" className="flex items-center space-x-2">
          <ShoppingBag className="h-6 w-6" />
          <span className="text-xl font-bold">Zandosh</span>
        </Link>
        <div className="flex items-center space-x-4">
          {showSearch && (
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search products..."
                className="w-full bg-background pl-8 rounded-full md:w-[300px] lg:w-[400px]"
              />
            </div>
          )}

          {user ? (
            <>
              <Link href="/cart">
                <Button variant="ghost" size="icon" className="relative">
                  <ShoppingCart className="h-5 w-5" />
                  <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {cartCount}
                  </span>
                </Button>
              </Link>

              {isAdmin && (
                <Link href="/admin">
                  <Button variant="outline" className="flex items-center gap-2">
                    <LayoutDashboard className="h-4 w-4" />
                    <span className="hidden sm:inline">Admin Dashboard</span>
                  </Button>
                </Link>
              )}

              <Link href="/profile">
                <Button variant="ghost" size="icon">
                  <User className="h-5 w-5" />
                </Button>
              </Link>
            </>
          ) : (
            <>
              <Link href="/auth/login">
                <Button variant="ghost" className="flex items-center gap-1">
                  <LogIn className="h-4 w-4" />
                  <span className="hidden sm:inline">Login</span>
                </Button>
              </Link>
              <Link href="/auth/register">
                <Button variant="default" size="sm" className="hidden sm:flex">
                  Register
                </Button>
              </Link>
            </>
          )}

          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

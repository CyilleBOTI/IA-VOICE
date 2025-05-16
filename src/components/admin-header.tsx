"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  ShoppingBag,
  User,
  LogOut,
  Home
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export function AdminHeader() {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between">
        <div className="flex items-center space-x-2">
          <ShoppingBag className="h-6 w-6" />
          <span className="text-xl font-bold">Zandosh Admin</span>
        </div>
        
        <div className="flex items-center space-x-4">
          <Link href="/home">
            <Button variant="outline" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              <span>Back to Store</span>
            </Button>
          </Link>
          
          {user && (
            <>
              <Link href="/profile">
                <Button variant="ghost" size="icon">
                  <User className="h-5 w-5" />
                </Button>
              </Link>
              
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => logout()}
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </>
          )}
          
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

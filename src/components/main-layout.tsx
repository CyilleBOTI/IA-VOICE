"use client";

import { ReactNode } from "react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

interface MainLayoutProps {
  children: ReactNode;
  showSearch?: boolean;
  showHeader?: boolean;
  showFooter?: boolean;
}

export function MainLayout({
  children,
  showSearch = true,
  showHeader = true,
  showFooter = true
}: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {showHeader && <Header showSearch={showSearch} />}

      <main className="flex-1">
        {children}
      </main>

      {showFooter && <Footer />}
    </div>
  );
}

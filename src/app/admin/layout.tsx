"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  ShoppingBag,
  FolderTree,
  ShieldCheck,
  CreditCard,
  Settings,
  LogOut,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { AdminHeader } from "@/components/admin-header";
import { AdminRouteGuard } from "@/components/admin-route-guard";

interface SidebarItemProps {
  icon: ReactNode;
  label: string;
  href: string;
  active?: boolean;
}

function SidebarItem({ icon, label, href, active }: SidebarItemProps) {
  return (
    <Link href={href} className="w-full">
      <Button
        variant={active ? "secondary" : "ghost"}
        className={cn(
          "w-full justify-start gap-2 mb-1",
          active ? "bg-secondary" : "hover:bg-secondary/50"
        )}
      >
        {icon}
        <span>{label}</span>
        {active && <ChevronRight className="ml-auto h-4 w-4" />}
      </Button>
    </Link>
  );
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { logout } = useAuth();

  const sidebarItems = [
    {
      icon: <LayoutDashboard className="h-5 w-5" />,
      label: "Dashboard",
      href: "/admin",
    },
    {
      icon: <Users className="h-5 w-5" />,
      label: "Users",
      href: "/admin/users",
    },
    {
      icon: <ShoppingBag className="h-5 w-5" />,
      label: "Items",
      href: "/admin/items",
    },
    {
      icon: <FolderTree className="h-5 w-5" />,
      label: "Categories",
      href: "/admin/categories",
    },
    {
      icon: <ShieldCheck className="h-5 w-5" />,
      label: "Roles",
      href: "/admin/roles",
    },
    {
      icon: <CreditCard className="h-5 w-5" />,
      label: "Orders",
      href: "/admin/orders",
    },
    {
      icon: <Settings className="h-5 w-5" />,
      label: "Settings",
      href: "/admin/settings",
    },
  ];

  return (
    <AdminRouteGuard>
      <div className="min-h-screen bg-background">
        <AdminHeader />

        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Sidebar */}
            <aside className="w-full md:w-64 shrink-0">
              <div className="bg-card rounded-lg shadow-sm p-4">
                <h2 className="font-semibold text-lg mb-4 px-2">Admin Panel</h2>
                <nav className="space-y-1">
                  {sidebarItems.map((item) => (
                    <SidebarItem
                      key={item.href}
                      icon={item.icon}
                      label={item.label}
                      href={item.href}
                      active={pathname === item.href}
                    />
                  ))}
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-2 text-destructive hover:text-destructive hover:bg-destructive/10 mt-4"
                    onClick={() => logout()}
                  >
                    <LogOut className="h-5 w-5" />
                    <span>Logout</span>
                  </Button>
                </nav>
              </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 bg-card rounded-lg shadow-sm p-6">
              {children}
            </main>
          </div>
        </div>
      </div>
    </AdminRouteGuard>
  );
}

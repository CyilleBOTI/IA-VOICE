"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Users, 
  ShoppingBag, 
  FolderTree, 
  CreditCard,
  TrendingUp,
  ArrowUpRight
} from "lucide-react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
}

function StatCard({ title, value, icon, description, trend, trendValue }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <div className="flex items-center text-sm text-muted-foreground mt-1">
            {trend === "up" && (
              <ArrowUpRight className="mr-1 h-4 w-4 text-green-500" />
            )}
            {trend === "down" && (
              <ArrowUpRight className="mr-1 h-4 w-4 text-red-500 rotate-180" />
            )}
            {trendValue && <span className={trend === "up" ? "text-green-500" : trend === "down" ? "text-red-500" : ""}>
              {trendValue}
            </span>}
            <span className="ml-1">{description}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    users: 0,
    items: 0,
    categories: 0,
    orders: 0,
  });

  useEffect(() => {
    async function fetchStats() {
      try {
        // Fetch users count
        const usersSnapshot = await getDocs(collection(db, "users"));
        
        // Fetch items count
        const itemsSnapshot = await getDocs(collection(db, "items"));
        
        // Fetch categories count
        const categoriesSnapshot = await getDocs(collection(db, "categories"));
        
        // Fetch orders count (completed checkouts)
        const ordersQuery = query(
          collection(db, "checkouts"),
          where("is_done", "==", true)
        );
        const ordersSnapshot = await getDocs(ordersQuery);

        setStats({
          users: usersSnapshot.size,
          items: itemsSnapshot.size,
          categories: categoriesSnapshot.size,
          orders: ordersSnapshot.size,
        });
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      }
    }

    fetchStats();
  }, []);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Total Users"
          value={stats.users}
          icon={<Users className="h-5 w-5" />}
          description="Active accounts"
          trend="up"
          trendValue="+12%"
        />
        
        <StatCard
          title="Products"
          value={stats.items}
          icon={<ShoppingBag className="h-5 w-5" />}
          description="In inventory"
        />
        
        <StatCard
          title="Categories"
          value={stats.categories}
          icon={<FolderTree className="h-5 w-5" />}
        />
        
        <StatCard
          title="Orders"
          value={stats.orders}
          icon={<CreditCard className="h-5 w-5" />}
          description="Completed"
          trend="up"
          trendValue="+5%"
        />
      </div>
      
      <div className="bg-primary/5 rounded-lg p-6 border border-primary/10">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Quick Actions</h2>
        </div>
        
        <p className="text-muted-foreground mb-4">
          Welcome to the admin dashboard. From here, you can manage all aspects of your e-commerce platform.
          Use the sidebar to navigate to different sections.
        </p>
        
        <ul className="list-disc list-inside text-muted-foreground space-y-1">
          <li>Manage users and their roles</li>
          <li>Add, edit, or remove products</li>
          <li>Organize product categories</li>
          <li>View and process orders</li>
          <li>Configure system settings</li>
        </ul>
      </div>
    </div>
  );
}

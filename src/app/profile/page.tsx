"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MainLayout } from "@/components/main-layout";
import {
  LogOut,
  User,
  ShoppingBag,
  ShoppingCart,
  ArrowUpDown,
  X
} from "lucide-react";

interface Order {
  id: string;
  items: {
    id: string;
    name: string;
    price: number;
    quantity: number;
  }[];
  total: number;
  date: string;
  status: string;
}

const profileSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  phone: z.string().min(10, { message: "Phone number must be at least 10 characters" }),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const router = useRouter();
  const { user, userData, loading, logout } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
    },
  });

  useEffect(() => {
    if (loading) return;

    // Pre-fill form with user data if available
    if (userData) {
      form.setValue("name", userData.name || "");
      form.setValue("email", userData.email || "");
      form.setValue("phone", userData.phone || "");
    }

    // Fetch cart count
    async function fetchCartCount() {
      if (!user) return;

      try {
        const cartQuery = query(
          collection(db, "checkouts"),
          where("user_id", "==", user.uid),
          where("is_done", "==", false)
        );

        const cartSnapshot = await getDocs(cartQuery);
        setCartCount(cartSnapshot.size);
      } catch (error) {
        console.error("Error fetching cart count:", error);
      }
    }

    async function fetchOrders() {
      setIsLoading(true);
      try {
        if (!user) return;

        const checkoutsQuery = query(
          collection(db, "checkouts"),
          where("user_id", "==", user.uid),
          where("is_done", "==", true)
        );

        const checkoutsSnapshot = await getDocs(checkoutsQuery);

        if (checkoutsSnapshot.empty) {
          setOrders([]);
          setIsLoading(false);
          return;
        }

        const checkouts = checkoutsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Group checkouts by date to create orders
        const groupedCheckouts = checkouts.reduce((acc, checkout) => {
          const date = new Date(checkout.updatedAt).toLocaleDateString();

          if (!acc[date]) {
            acc[date] = [];
          }

          acc[date].push(checkout);
          return acc;
        }, {});

        // Fetch item details for each checkout
        const ordersWithItems = await Promise.all(
          Object.entries(groupedCheckouts).map(async ([date, checkouts]) => {
            const items = await Promise.all(
              checkouts.map(async (checkout) => {
                const itemDoc = await getDoc(doc(db, "items", checkout.item_id));

                if (itemDoc.exists()) {
                  return {
                    id: itemDoc.id,
                    ...itemDoc.data(),
                    quantity: checkout.quantity || 1,
                  };
                }

                return null;
              })
            );

            const validItems = items.filter(Boolean);

            const total = validItems.reduce(
              (sum, item) => sum + item.price * item.quantity,
              0
            );

            return {
              id: date,
              items: validItems,
              total,
              date,
              status: "Completed",
            };
          })
        );

        setOrders(ordersWithItems);
      } catch (error) {
        console.error("Error fetching orders:", error);
        toast.error("Failed to load order history");
      } finally {
        setIsLoading(false);
      }
    }

    fetchOrders();
    fetchCartCount();
  }, [user, userData, loading, router, form]);

  const onSubmit = async (data: ProfileFormValues) => {
    if (!user) return;

    setIsUpdating(true);
    try {
      await updateDoc(doc(db, "users", user.uid), {
        name: data.name,
        phone: data.phone,
        updatedAt: new Date().toISOString(),
      });

      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Logged out successfully");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Failed to logout");
    }
  };

  return (
    <MainLayout showSearch={false}>
      {/* Main Content */}
      <main className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {!user ? (
          <div className="flex flex-col items-center justify-center h-64 space-y-6">
            <h1 className="text-3xl font-bold">My Account</h1>
            <p className="text-xl">Please login to view your account</p>
            <div className="flex gap-4">
              <Link href="/auth/login">
                <Button size="lg">Login</Button>
              </Link>
              <Link href="/auth/register">
                <Button variant="outline" size="lg">Register</Button>
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
              <h1 className="text-3xl font-bold">My Account</h1>
              <Button variant="outline" onClick={handleLogout} className="flex items-center">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>

            <Tabs defaultValue="profile" className="space-y-6">
              <TabsList>
                <TabsTrigger value="profile" className="flex items-center">
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </TabsTrigger>
                <TabsTrigger value="orders" className="flex items-center">
                  <ShoppingBag className="mr-2 h-4 w-4" />
                  Order History
                </TabsTrigger>
              </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <div className="rounded-lg border bg-card p-6">
              <h2 className="text-xl font-semibold mb-4">Personal Information</h2>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input placeholder="John Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="you@example.com"
                              {...field}
                              disabled
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone</FormLabel>
                          <FormControl>
                            <Input placeholder="+1234567890" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={isUpdating}
                  >
                    {isUpdating ? "Updating..." : "Update Profile"}
                  </Button>
                </form>
              </Form>
            </div>
          </TabsContent>

          <TabsContent value="orders" className="space-y-6">
            <div className="rounded-lg border bg-card p-6">
              <h2 className="text-xl font-semibold mb-4">Order History</h2>

              {isLoading ? (
                <div className="flex items-center justify-center h-32">
                  <p>Loading orders...</p>
                </div>
              ) : orders.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 space-y-4">
                  <p>You haven&apos;t placed any orders yet</p>
                  <Link href="/items">
                    <Button>Start Shopping</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-6">
                  {orders.map((order) => (
                    <div
                      key={order.id}
                      className="rounded-lg border p-4 space-y-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                        <div>
                          <p className="font-medium">Order Date: {order.date}</p>
                          <p className="text-sm text-muted-foreground">
                            Status: {order.status}
                          </p>
                        </div>
                        <p className="font-semibold">
                          Total: ${order.total.toFixed(2)}
                        </p>
                      </div>
                      <div className="border-t pt-4">
                        <h3 className="font-medium mb-2">Items</h3>
                        <div className="space-y-2">
                          {order.items.map((item) => (
                            <div
                              key={item.id}
                              className="flex justify-between"
                            >
                              <div>
                                <p>{item.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  Qty: {item.quantity}
                                </p>
                              </div>
                              <p>
                                ${(item.price * item.quantity).toFixed(2)}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
          </>
        )}
      </main>

      {/* Footer */}

    </MainLayout>
  );
}

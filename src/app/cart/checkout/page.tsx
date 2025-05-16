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
import { CreditCard, CheckCircle } from "lucide-react";

interface CartItem {
  id: string;
  item_id: string;
  quantity: number;
  item: {
    id: string;
    name: string;
    price: number;
  };
}

const checkoutSchema = z.object({
  fullName: z.string().min(2, { message: "Full name is required" }),
  email: z.string().email({ message: "Valid email is required" }),
  address: z.string().min(5, { message: "Address is required" }),
  city: z.string().min(2, { message: "City is required" }),
  postalCode: z.string().min(3, { message: "Postal code is required" }),
  country: z.string().min(2, { message: "Country is required" }),
  cardNumber: z.string().min(16, { message: "Valid card number is required" }),
  cardExpiry: z.string().min(5, { message: "Valid expiry date is required" }),
  cardCvc: z.string().min(3, { message: "Valid CVC is required" }),
});

type CheckoutFormValues = z.infer<typeof checkoutSchema>;

export default function CheckoutPage() {
  const router = useRouter();
  const { user, userData, loading } = useAuth();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      fullName: "",
      email: "",
      address: "",
      city: "",
      postalCode: "",
      country: "",
      cardNumber: "",
      cardExpiry: "",
      cardCvc: "",
    },
  });

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.push("/auth/login");
      return;
    }

    // Pre-fill form with user data if available
    if (userData) {
      form.setValue("fullName", userData.name || "");
      form.setValue("email", userData.email || "");
    }

    async function fetchCartItems() {
      setIsLoading(true);
      try {
        const checkoutsQuery = query(
          collection(db, "checkouts"),
          where("user_id", "==", user.uid),
          where("is_done", "==", false),
          where("last_step", "==", "payment")
        );

        const checkoutsSnapshot = await getDocs(checkoutsQuery);

        if (checkoutsSnapshot.empty) {
          router.push("/cart");
          return;
        }

        const checkouts = checkoutsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Fetch item details for each checkout
        const cartItemsWithDetails = await Promise.all(
          checkouts.map(async (checkout) => {
            const itemDoc = await getDoc(doc(db, "items", checkout.item_id));

            if (itemDoc.exists()) {
              return {
                id: checkout.id,
                item_id: checkout.item_id,
                quantity: checkout.quantity || 1,
                item: {
                  id: itemDoc.id,
                  ...itemDoc.data(),
                },
              } as CartItem;
            }

            return null;
          })
        );

        setCartItems(cartItemsWithDetails.filter(Boolean) as CartItem[]);
      } catch (error) {
        console.error("Error fetching cart items:", error);
        toast.error("Failed to load checkout items");
      } finally {
        setIsLoading(false);
      }
    }

    fetchCartItems();
  }, [user, userData, loading, router, form]);

  const calculateTotal = () => {
    return cartItems.reduce(
      (total, item) => total + item.item.price * item.quantity,
      0
    );
  };

  const onSubmit = async (data: CheckoutFormValues) => {
    setIsProcessing(true);
    try {
      // Simulate payment processing
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Update all cart items to completed
      await Promise.all(
        cartItems.map((item) =>
          updateDoc(doc(db, "checkouts", item.id), {
            is_done: true,
            last_step: "completed",
            updatedAt: new Date().toISOString(),
          })
        )
      );

      setIsSuccess(true);
      toast.success("Order placed successfully!");
    } catch (error) {
      console.error("Error processing payment:", error);
      toast.error("Failed to process payment");
    } finally {
      setIsProcessing(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-16 items-center justify-between">
            <Link href="/home" className="flex items-center space-x-2">
              <span className="text-xl font-bold">Zandosh</span>
            </Link>
            <div className="flex items-center space-x-4">
              <ThemeToggle />
            </div>
          </div>
        </header>

        <main className="container py-10">
          <div className="flex flex-col items-center justify-center space-y-6 py-12">
            <div className="rounded-full bg-primary/10 p-6">
              <CheckCircle className="h-12 w-12 text-primary" />
            </div>
            <h1 className="text-3xl font-bold">Order Confirmed!</h1>
            <p className="text-center text-muted-foreground max-w-md">
              Thank you for your order. We&apos;ve received your payment and will
              process your order shortly.
            </p>
            <div className="flex space-x-4">
              <Link href="/home">
                <Button variant="outline">Continue Shopping</Button>
              </Link>
              <Link href="/profile">
                <Button>View Order History</Button>
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/home" className="flex items-center space-x-2">
            <span className="text-xl font-bold">Zandosh</span>
          </Link>
          <div className="flex items-center space-x-4">
            <Link href="/cart">
              <Button variant="outline">Back to Cart</Button>
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-10">
        <h1 className="text-3xl font-bold mb-6">Checkout</h1>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <p>Loading checkout...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="md:col-span-2">
              <div className="rounded-lg border bg-card p-6">
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-6"
                  >
                    <div>
                      <h2 className="text-xl font-semibold mb-4">
                        Shipping Information
                      </h2>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="fullName"
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
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="address"
                          render={({ field }) => (
                            <FormItem className="sm:col-span-2">
                              <FormLabel>Address</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="123 Main St"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="city"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>City</FormLabel>
                              <FormControl>
                                <Input placeholder="New York" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="postalCode"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Postal Code</FormLabel>
                              <FormControl>
                                <Input placeholder="10001" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="country"
                          render={({ field }) => (
                            <FormItem className="sm:col-span-2">
                              <FormLabel>Country</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="United States"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <div>
                      <h2 className="text-xl font-semibold mb-4">
                        Payment Information
                      </h2>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="cardNumber"
                          render={({ field }) => (
                            <FormItem className="sm:col-span-2">
                              <FormLabel>Card Number</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="4242 4242 4242 4242"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="cardExpiry"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Expiry Date</FormLabel>
                              <FormControl>
                                <Input placeholder="MM/YY" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="cardCvc"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>CVC</FormLabel>
                              <FormControl>
                                <Input placeholder="123" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isProcessing}
                    >
                      <CreditCard className="mr-2 h-4 w-4" />
                      {isProcessing
                        ? "Processing Payment..."
                        : "Complete Payment"}
                    </Button>
                  </form>
                </Form>
              </div>
            </div>
            <div>
              <div className="rounded-lg border bg-card p-6 sticky top-24">
                <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
                <div className="space-y-4">
                  {cartItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between border-b pb-2"
                    >
                      <div>
                        <p className="font-medium">{item.item.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Qty: {item.quantity}
                        </p>
                      </div>
                      <p className="font-medium">
                        ${(item.item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  ))}
                  <div className="space-y-2 pt-2">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>${calculateTotal().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Shipping</span>
                      <span>Free</span>
                    </div>
                    <div className="border-t pt-2 mt-2">
                      <div className="flex justify-between font-semibold">
                        <span>Total</span>
                        <span>${calculateTotal().toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t bg-background">
        <div className="container flex flex-col items-center justify-between gap-4 py-10 md:h-24 md:flex-row md:py-0">
          <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
            <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
              © 2024 Zandosh. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

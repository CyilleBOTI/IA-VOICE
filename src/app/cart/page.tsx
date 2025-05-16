"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { toast } from "sonner";
import { MainLayout } from "@/components/main-layout";
import {
  Trash2,
  Minus,
  Plus,
  CreditCard,
  ShoppingBag,
  ShoppingCart,
  User,
  ArrowUpDown,
  X
} from "lucide-react";
import {
  getCartItems,
  getItemById,
  updateCartItemQuantity,
  removeFromCart,
  updateCheckoutStep,
  Item,
  Checkout
} from "@/lib/firebase-service";

interface CartItem {
  id: string;
  item_id: string;
  quantity: number;
  item: Item;
}

export default function CartPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (loading) return;

    async function fetchCartItems() {
      setIsLoading(true);
      try {
        if (!user) {
          setCartItems([]);
          return;
        }

        const checkouts = await getCartItems(user.uid);

        if (checkouts.length === 0) {
          setCartItems([]);
          return;
        }

        // Fetch item details for each checkout
        const cartItemsWithDetails = await Promise.all(
          checkouts.map(async (checkout) => {
            const item = await getItemById(checkout.item_id);

            if (item) {
              return {
                id: checkout.id,
                item_id: checkout.item_id,
                quantity: checkout.quantity || 1,
                item: item,
              } as CartItem;
            }

            return null;
          })
        );

        setCartItems(cartItemsWithDetails.filter(Boolean) as CartItem[]);
      } catch (error) {
        console.error("Error fetching cart items:", error);
        toast.error("Failed to load cart items");
      } finally {
        setIsLoading(false);
      }
    }

    fetchCartItems();
  }, [user, loading, router]);

  const handleQuantityChange = async (cartItemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;

    setIsUpdating(true);
    try {
      await updateCartItemQuantity(cartItemId, newQuantity);

      setCartItems(
        cartItems.map((item) =>
          item.id === cartItemId ? { ...item, quantity: newQuantity } : item
        )
      );

      toast.success("Cart updated");
    } catch (error) {
      console.error("Error updating quantity:", error);
      toast.error("Failed to update quantity");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemoveItem = async (cartItemId: string) => {
    setIsUpdating(true);
    try {
      await removeFromCart(cartItemId);

      setCartItems(cartItems.filter((item) => item.id !== cartItemId));

      toast.success("Item removed from cart");
    } catch (error) {
      console.error("Error removing item:", error);
      toast.error("Failed to remove item");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleProceedToCheckout = async () => {
    setIsUpdating(true);
    try {
      // Update all cart items to the next step
      await Promise.all(
        cartItems.map((item) =>
          updateCheckoutStep(item.id, "payment")
        )
      );

      router.push("/cart/checkout");
    } catch (error) {
      console.error("Error proceeding to checkout:", error);
      toast.error("Failed to proceed to checkout");
    } finally {
      setIsUpdating(false);
    }
  };

  const calculateTotal = () => {
    return cartItems.reduce(
      (total, item) => total + item.item.price * item.quantity,
      0
    );
  };

  return (
    <MainLayout showSearch={false}>
      {/* Main Content */}
      <main className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-3xl font-bold mb-6">Your Cart</h1>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <p>Loading cart items...</p>
          </div>
        ) : !user ? (
          <div className="flex flex-col items-center justify-center h-64 space-y-4">
            <p className="text-xl">Please login to view your cart</p>
            <div className="flex gap-4">
              <Link href="/auth/login">
                <Button>Login</Button>
              </Link>
              <Link href="/items">
                <Button variant="outline">Continue Shopping</Button>
              </Link>
            </div>
          </div>
        ) : cartItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 space-y-4">
            <p className="text-xl">Your cart is empty</p>
            <Link href="/items">
              <Button>Start Shopping</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="md:col-span-2">
              <div className="rounded-lg border bg-card">
                <div className="p-6 space-y-6">
                  {cartItems.map((cartItem) => (
                    <div
                      key={cartItem.id}
                      className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4 pb-6 border-b last:border-0 last:pb-0"
                    >
                      <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-md border">
                        <img
                          src={cartItem.item.bannerImage}
                          alt={cartItem.item.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <Link
                          href={`/items/${cartItem.item.id}`}
                          className="text-lg font-medium hover:underline"
                        >
                          {cartItem.item.name}
                        </Link>
                        <p className="text-muted-foreground">
                          ${cartItem.item.price.toFixed(2)}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() =>
                            handleQuantityChange(
                              cartItem.id,
                              cartItem.quantity - 1
                            )
                          }
                          disabled={cartItem.quantity <= 1 || isUpdating}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-8 text-center">
                          {cartItem.quantity}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() =>
                            handleQuantityChange(
                              cartItem.id,
                              cartItem.quantity + 1
                            )
                          }
                          disabled={isUpdating}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          ${(cartItem.item.price * cartItem.quantity).toFixed(2)}
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive/90 mt-2"
                          onClick={() => handleRemoveItem(cartItem.id)}
                          disabled={isUpdating}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div>
              <div className="rounded-lg border bg-card p-6 sticky top-24">
                <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
                <div className="space-y-2">
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
                <Button
                  className="w-full mt-6"
                  onClick={handleProceedToCheckout}
                  disabled={isUpdating || cartItems.length === 0}
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  Proceed to Checkout
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      
    </MainLayout>
  );
}

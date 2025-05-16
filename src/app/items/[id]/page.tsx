"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { MainLayout } from "@/components/main-layout";
import {
  ChevronLeft,
  Minus,
  Plus,
  ShoppingCart,
  ShoppingBag,
  User,
  ArrowUpDown,
  X,
  LogIn
} from "lucide-react";
import {
  getItemById,
  getCategoryById,
  addToCart,
  Item,
  Category
} from "@/lib/firebase-service";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

export default function ItemDetailPage() {
  const params = useParams();
  const router = useRouter();

  // Get auth context directly
  const auth = useAuth();
  const { user } = auth;

  const [item, setItem] = useState<Item | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  // Fetch cart count
  useEffect(() => {
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

    fetchCartCount();
  }, [user, isAddingToCart]); // Re-fetch when adding to cart

  useEffect(() => {
    async function fetchItemDetails() {
      if (!params.id) return;

      setIsLoading(true);
      try {
        const itemData = await getItemById(params.id as string);

        if (itemData) {
          setItem(itemData);
          setSelectedImage(itemData.bannerImage);

          // Fetch category
          if (itemData.category_id) {
            const categoryData = await getCategoryById(itemData.category_id);
            if (categoryData) {
              setCategory(categoryData);
            }
          }
        } else {
          toast.error("Item not found");
          router.push("/items");
        }
      } catch (error) {
        console.error("Error fetching item details:", error);
        toast.error("Failed to load item details");
      } finally {
        setIsLoading(false);
      }
    }

    fetchItemDetails();
  }, [params.id, router]);

  const handleQuantityChange = (value: number) => {
    if (value < 1) return;
    setQuantity(value);
  };

  const handleAddToCart = async () => {
    if (!user) {
      toast.error("Please login to add items to cart");
      router.push("/auth/login");
      return;
    }

    if (!item) return;

    setIsAddingToCart(true);
    try {
      await addToCart(user.uid, item.id, quantity);
      toast.success("Added to cart successfully");
    } catch (error) {
      console.error("Error adding to cart:", error);
      toast.error("Failed to add to cart");
    } finally {
      setIsAddingToCart(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p>Loading item details...</p>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p>Item not found</p>
      </div>
    );
  }

  return (
    <MainLayout>
      {/* Main Content */}
      <main className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-6">
          <Button
            variant="ghost"
            className="flex items-center hover:bg-muted/50"
            onClick={() => router.back()}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Products
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="overflow-hidden rounded-lg border">
              <img
                src={selectedImage || item.bannerImage}
                alt={item.name}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="grid grid-cols-4 gap-2">
              {item.images?.map((image, index) => (
                <div
                  key={index}
                  className={`cursor-pointer overflow-hidden rounded-md border ${
                    selectedImage === image ? "ring-2 ring-primary" : ""
                  }`}
                  onClick={() => setSelectedImage(image)}
                >
                  <img
                    src={image}
                    alt={`${item.name} - Image ${index + 1}`}
                    className="h-20 w-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            {category && (
              <Link
                href={`/items?category=${category.id}`}
                className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <span className="px-2 py-1 bg-muted rounded-full">{category.name}</span>
              </Link>
            )}
            <h1 className="text-3xl font-bold tracking-tight">{item.name}</h1>
            <p className="text-2xl font-semibold text-primary">${item.price.toFixed(2)}</p>
            <div className="prose max-w-none dark:prose-invert">
              <p>{item.description}</p>
            </div>

            <div className="pt-4 border-t">
              <h3 className="text-sm font-medium mb-3">Quantity</h3>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleQuantityChange(quantity - 1)}
                    disabled={quantity <= 1}
                    className="rounded-full h-8 w-8"
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-8 text-center font-medium">{quantity}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleQuantityChange(quantity + 1)}
                    className="rounded-full h-8 w-8"
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
                {user ? (
                  <Button
                    className="flex-1 rounded-full"
                    onClick={handleAddToCart}
                    disabled={isAddingToCart}
                  >
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    {isAddingToCart ? "Adding..." : "Add to Cart"}
                  </Button>
                ) : (
                  <Link href="/auth/login" className="flex-1">
                    <Button
                      className="w-full rounded-full"
                      variant="secondary"
                    >
                      <LogIn className="mr-2 h-4 w-4" />
                      Login to Add to Cart
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      
    </MainLayout>
  );
}

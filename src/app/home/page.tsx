"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

import { toast } from "sonner";
import { CategoryCarousel } from "@/components/category-carousel";
import { MainLayout } from "@/components/main-layout";
import {
  getAllItems,
  getParentCategories,
  Category,
  Item
} from "@/lib/firebase-service";

export default function HomePage() {
  const [featuredItems, setFeaturedItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch featured items
        const result = await getAllItems(null, "newest", 4);
        setFeaturedItems(result.items);

        // Fetch parent categories
        const parentCategories = await getParentCategories();
        setCategories(parentCategories);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load homepage data");
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="py-12 md:py-24 lg:py-32 xl:py-48 bg-gradient-to-b from-background to-muted/30">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center space-y-6 text-center">
            <div className="space-y-4">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                Welcome to Zandosh E-Commerce
              </h1>
              <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                Discover the best products at the best prices.
              </p>
            </div>
            <div className="space-x-4 pt-4">
              <Link href="/items">
                <Button size="lg" className="rounded-full px-8">Shop Now</Button>
              </Link>
              <Link href="/items">
                <Button variant="outline" size="lg" className="rounded-full px-8">Browse Categories</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 md:py-24 bg-muted/40">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                Featured Products
              </h2>
              <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                Check out our latest products and special offers.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {isLoading ? (
              <div className="col-span-full flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : (
              featuredItems.map((item) => (
                <Link key={item.id} href={`/items/${item.id}`}>
                  <div className="group relative overflow-hidden rounded-lg border bg-background shadow-sm transition-all hover:shadow-md">
                    <div className="aspect-square overflow-hidden">
                      <img
                        src={item.bannerImage}
                        alt={item.name}
                        className="object-cover transition-all group-hover:scale-105 h-full w-full"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold">{item.name}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {item.description}
                      </p>
                      <div className="mt-2 flex items-center justify-between">
                        <p className="font-medium">${item.price.toFixed(2)}</p>
                        <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                          View
                        </Button>
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
          <div className="flex justify-center mt-12">
            <Link href="/items">
              <Button size="lg" className="rounded-full px-8">View All Products</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 md:py-24">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                Shop by Category
              </h2>
              <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                Browse our wide range of categories.
              </p>
            </div>
          </div>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : (
            <CategoryCarousel categories={categories} />
          )}
        </div>
      </section>


    </MainLayout>
  );
}

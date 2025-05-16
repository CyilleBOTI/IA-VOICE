"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { DocumentData, QueryDocumentSnapshot } from "firebase/firestore";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Input } from "@/components/ui/input";
import { MainLayout } from "@/components/main-layout";
import {
  Search,
  Filter,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
  ShoppingCart,
  User,
  ArrowUpDown,
  X,
  LogIn
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { toast } from "sonner";
import {
  getAllCategories,
  getAllItems,
  searchItems,
  Category,
  Item
} from "@/lib/firebase-service";

// Loading component for Suspense fallback
function ItemsLoading() {
  return (
    <MainLayout>
      <main className="py-10">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col space-y-8">
            <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-xl p-6 mb-8">
              <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
                <div>
                  <h1 className="text-4xl font-bold tracking-tight">Products</h1>
                  <p className="text-muted-foreground mt-2 text-lg">
                    Browse our collection of products
                  </p>
                </div>
              </div>
            </div>
            <div className="flex justify-center items-center py-12">
              <div className="flex flex-col items-center space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                <p className="text-muted-foreground">Loading products...</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </MainLayout>
  );
}

// Main component with search params
function ItemsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoryId = searchParams.get("category");
  const { user } = useAuth();

  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(categoryId);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"price_asc" | "price_desc" | "newest">("newest");
  const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const ITEMS_PER_PAGE = 8;

  useEffect(() => {
    async function fetchCategories() {
      try {
        const categoriesData = await getAllCategories();
        setCategories(categoriesData);
      } catch (error) {
        console.error("Error fetching categories:", error);
        toast.error("Failed to load categories");
      }
    }

    fetchCategories();
  }, []);

  // Update URL when category changes
  useEffect(() => {
    const updateUrl = () => {
      try {
        if (selectedCategory) {
          router.push(`/items?category=${selectedCategory}`);
        } else {
          router.push('/items');
        }
      } catch (error) {
        console.error("Error updating URL:", error);
        // Don't show toast for navigation errors
      }
    };

    // Use setTimeout to avoid navigation during render
    const timeoutId = setTimeout(updateUrl, 0);
    return () => clearTimeout(timeoutId);
  }, [selectedCategory, router]);

  // Reset pagination when category or sort changes
  useEffect(() => {
    setCurrentPage(1);
    setLastVisible(null);
    setItems([]); // Clear items when filter changes
  }, [selectedCategory, sortBy]);

  // Fetch items when category, sort, or page changes
  useEffect(() => {
    let isMounted = true;

    async function fetchItems() {
      setIsLoading(true);
      try {
        console.log(`Fetching items with category: ${selectedCategory}, sort: ${sortBy}, page: ${currentPage}`);

        // Only use lastVisible for pages > 1
        const result = await getAllItems(
          selectedCategory,
          sortBy,
          ITEMS_PER_PAGE,
          currentPage > 1 ? lastVisible : null
        );

        if (!isMounted) return;

        if (result.items.length === 0) {
          setItems([]);
          setHasMore(false);
          if (currentPage === 1 && selectedCategory) {
            // Only show this message when a category is selected and no items are found
            toast.info("No products found in this category");
          }
        } else {
          // If it's the first page, replace items; otherwise append
          setItems(currentPage === 1 ? result.items : [...items, ...result.items]);
          setLastVisible(result.lastVisible);
          setHasMore(result.items.length === ITEMS_PER_PAGE);

          // If we found items in a category, show a success message
          if (currentPage === 1 && selectedCategory) {
            toast.success(`Found ${result.items.length} products in this category`);
          }
        }
      } catch (error: any) {
        console.error("Error fetching items:", error);

        if (!isMounted) return;

        // Show more specific error message
        if (error.code === 'failed-precondition') {
          toast.error("This query requires a database index. Please check the console for details.");
        } else {
          toast.error("Failed to load products. Please try again.");
        }

        // Reset to all items if there's an error with category filtering
        if (selectedCategory) {
          setSelectedCategory(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchItems();

    return () => {
      isMounted = false;
    };
  }, [selectedCategory, sortBy, currentPage]);

  const loadNextPage = () => {
    if (hasMore) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const loadPreviousPage = () => {
    if (currentPage > 1) {
      // We need to reset and reload from the beginning since Firestore doesn't support backward pagination easily
      setCurrentPage(1);
      setLastVisible(null);
    }
  };

  const goToPage = (page: number) => {
    if (page === 1) {
      setCurrentPage(1);
      setLastVisible(null);
    } else if (page > currentPage) {
      // Can only go forward one page at a time with Firestore pagination
      setCurrentPage(prev => prev + 1);
    } else {
      // Going backward requires resetting to page 1
      setCurrentPage(1);
      setLastVisible(null);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    try {
      // Reset pagination and category filter when searching
      setCurrentPage(1);
      setSelectedCategory(null);

      const searchResults = await searchItems(searchQuery, ITEMS_PER_PAGE);

      if (searchResults.length === 0) {
        setItems([]);
        setHasMore(false);
        toast.info("No products found matching your search");
      } else {
        setItems(searchResults);
        setHasMore(false); // Disable pagination for search results
      }
    } catch (error) {
      console.error("Error searching items:", error);
      toast.error("Failed to search products");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <MainLayout>
      {/* Main Content */}
      <main className="py-10">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col space-y-8">
            {/* Header Section with Background */}
            <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-xl p-6 mb-8">
              <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
                <div>
                  <h1 className="text-4xl font-bold tracking-tight">Products</h1>
                  <p className="text-muted-foreground mt-2 text-lg">
                    Browse our collection of products
                  </p>
                </div>
                <div className="flex flex-col space-y-2 md:flex-row md:space-x-3 md:space-y-0">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="w-full md:w-auto bg-background/80 backdrop-blur-sm border-primary/20 hover:bg-primary/5">
                        <Filter className="mr-2 h-4 w-4" />
                        Categories
                        <ChevronDown className="ml-2 h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuItem
                        onClick={() => {
                          console.log("Selecting: All Categories");
                          setSelectedCategory(null);
                          setItems([]);
                          setLastVisible(null);
                          setCurrentPage(1);
                        }}
                        className={!selectedCategory ? "bg-accent" : ""}
                      >
                        All Categories
                      </DropdownMenuItem>
                      {categories.map((category) => (
                        <DropdownMenuItem
                          key={category.id}
                          onClick={() => {
                            console.log(`Selecting category: ${category.name} (${category.id})`);
                            setSelectedCategory(category.id);
                            setItems([]);
                            setLastVisible(null);
                            setCurrentPage(1);

                            // Debug: Log category details
                            console.log("Category details:", {
                              id: category.id,
                              name: category.name,
                              description: category.description,
                              parent_id: category.parent_category_id
                            });
                          }}
                          className={
                            selectedCategory === category.id ? "bg-accent" : ""
                          }
                        >
                          {category.name}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="w-full md:w-auto bg-background/80 backdrop-blur-sm border-primary/20 hover:bg-primary/5">
                        <ArrowUpDown className="mr-2 h-4 w-4" />
                        Sort By
                        <ChevronDown className="ml-2 h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuItem
                        onClick={() => setSortBy("newest")}
                        className={sortBy === "newest" ? "bg-accent" : ""}
                      >
                        Newest
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setSortBy("price_asc")}
                        className={sortBy === "price_asc" ? "bg-accent" : ""}
                      >
                        Price: Low to High
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setSortBy("price_desc")}
                        className={sortBy === "price_desc" ? "bg-accent" : ""}
                      >
                        Price: High to Low
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>

            {/* Active Filters Display */}
            {selectedCategory && (
              <div className="flex items-center space-x-2 mb-4">
                <span className="text-sm text-muted-foreground">Active filters:</span>
                <div className="flex items-center bg-accent/30 text-accent-foreground rounded-full px-3 py-1 text-sm">
                  <span>Category: {categories.find(c => c.id === selectedCategory)?.name || 'Selected'}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 ml-1 p-0 hover:bg-accent/50"
                    onClick={() => {
                      setSelectedCategory(null);
                      setItems([]);
                      setLastVisible(null);
                      setCurrentPage(1);
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}

            {/* Loading State */}
            {isLoading && items.length === 0 && (
              <div className="flex justify-center items-center py-12">
                <div className="flex flex-col items-center space-y-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                  <p className="text-muted-foreground">Loading products...</p>
                </div>
              </div>
            )}

            {/* Empty State */}
            {!isLoading && items.length === 0 && (
              <div className="flex justify-center items-center py-16 bg-muted/20 rounded-lg">
                <div className="flex flex-col items-center space-y-4 max-w-md text-center px-4">
                  <ShoppingBag className="h-12 w-12 text-muted-foreground/50" />
                  <h3 className="text-xl font-semibold">No products found</h3>
                  <p className="text-muted-foreground">
                    {selectedCategory
                      ? "We couldn't find any products in this category. Try selecting a different category or check back later."
                      : "We couldn't find any products matching your criteria. Try adjusting your filters or check back later."}
                  </p>
                  {selectedCategory && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedCategory(null);
                        setItems([]);
                        setLastVisible(null);
                        setCurrentPage(1);
                      }}
                    >
                      View all products
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Products Grid */}
            {items.length > 0 && (
              <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {items.map((item) => (
                  <Link key={item.id} href={`/items/${item.id}`}>
                    <div className="group relative overflow-hidden rounded-xl border bg-background shadow-sm transition-all hover:shadow-md">
                      <div className="aspect-square overflow-hidden bg-muted/10">
                        <img
                          src={item.bannerImage}
                          alt={item.name}
                          className="object-cover transition-all group-hover:scale-105 h-full w-full"
                          loading="lazy"
                        />
                      </div>
                      <div className="p-5">
                        <h3 className="font-semibold text-lg truncate">{item.name}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1 min-h-[2.5rem]">
                          {item.description}
                        </p>
                        <div className="mt-4 flex items-center justify-between">
                          <p className="font-medium text-lg">${item.price.toFixed(2)}</p>
                          <Button size="sm" variant="secondary" className="opacity-0 group-hover:opacity-100 transition-opacity">
                            View
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* Pagination */}
            {items.length > 0 && (
              <div className="flex justify-center mt-12">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={loadPreviousPage}
                        className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer hover:bg-accent/20"}
                      />
                    </PaginationItem>

                    <PaginationItem>
                      <PaginationLink
                        isActive={currentPage === 1}
                        onClick={() => goToPage(1)}
                        className={currentPage === 1 ? "bg-primary text-primary-foreground hover:bg-primary/90" : "hover:bg-accent/20"}
                      >
                        1
                      </PaginationLink>
                    </PaginationItem>

                    {currentPage > 3 && (
                      <PaginationItem>
                        <PaginationEllipsis />
                      </PaginationItem>
                    )}

                    {currentPage > 2 && (
                      <PaginationItem>
                        <PaginationLink
                          onClick={() => goToPage(currentPage - 1)}
                          className="hover:bg-accent/20"
                        >
                          {currentPage - 1}
                        </PaginationLink>
                      </PaginationItem>
                    )}

                    {currentPage > 1 && currentPage < 3 && (
                      <PaginationItem>
                        <PaginationLink
                          onClick={() => goToPage(2)}
                          className={currentPage === 2 ? "bg-primary text-primary-foreground hover:bg-primary/90" : "hover:bg-accent/20"}
                        >
                          2
                        </PaginationLink>
                      </PaginationItem>
                    )}

                    {currentPage > 2 && (
                      <PaginationItem>
                        <PaginationLink
                          isActive
                          className="bg-primary text-primary-foreground hover:bg-primary/90"
                        >
                          {currentPage}
                        </PaginationLink>
                      </PaginationItem>
                    )}

                    {hasMore && (
                      <PaginationItem>
                        <PaginationLink
                          onClick={() => goToPage(currentPage + 1)}
                          className="hover:bg-accent/20"
                        >
                          {currentPage + 1}
                        </PaginationLink>
                      </PaginationItem>
                    )}

                    <PaginationItem>
                      <PaginationNext
                        onClick={loadNextPage}
                        className={!hasMore ? "pointer-events-none opacity-50" : "cursor-pointer hover:bg-accent/20"}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-background mt-16">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-12 md:py-16">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <ShoppingBag className="h-6 w-6" />
                  <span className="text-xl font-bold tracking-tight">Zandosh</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Your premium e-commerce destination for quality products.
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-medium">Shop</h3>
                <ul className="space-y-2">
                  <li>
                    <Link href="/items" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                      All Products
                    </Link>
                  </li>
                  <li>
                    <Link href="/items?category=featured" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                      Featured Items
                    </Link>
                  </li>
                  <li>
                    <Link href="/items?sort=newest" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                      New Arrivals
                    </Link>
                  </li>
                </ul>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-medium">Account</h3>
                <ul className="space-y-2">
                  <li>
                    <Link href="/profile" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                      My Account
                    </Link>
                  </li>
                  <li>
                    <Link href="/cart" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                      Shopping Cart
                    </Link>
                  </li>
                  <li>
                    <Link href="/orders" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                      Order History
                    </Link>
                  </li>
                </ul>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-medium">Contact</h3>
                <ul className="space-y-2">
                  <li className="text-sm text-muted-foreground">
                    Email: support@zandosh.com
                  </li>
                  <li className="text-sm text-muted-foreground">
                    Phone: +1 (555) 123-4567
                  </li>
                  <li className="text-sm text-muted-foreground">
                    Hours: Mon-Fri, 9am-5pm
                  </li>
                </ul>
              </div>
            </div>

            <div className="border-t mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
              <p className="text-sm text-muted-foreground">
                © {new Date().getFullYear()} Zandosh. All rights reserved.
              </p>
              <div className="flex space-x-6 mt-4 md:mt-0">
                <Link href="#" className="text-muted-foreground hover:text-foreground">
                  <span className="sr-only">Facebook</span>
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                  </svg>
                </Link>
                <Link href="#" className="text-muted-foreground hover:text-foreground">
                  <span className="sr-only">Instagram</span>
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                  </svg>
                </Link>
                <Link href="#" className="text-muted-foreground hover:text-foreground">
                  <span className="sr-only">Twitter</span>
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </MainLayout>
  );
}

// Export the main component wrapped in Suspense
export default function ItemsPage() {
  return (
    <Suspense fallback={<ItemsLoading />}>
      <ItemsPageContent />
    </Suspense>
  );
}
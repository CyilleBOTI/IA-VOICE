import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  addDoc,
  updateDoc,
  deleteDoc,
  DocumentData,
  QueryDocumentSnapshot,
  Timestamp,
  OrderByDirection,
} from "firebase/firestore";
import { db } from "./firebase";

// User types
export interface User {
  uid: string;
  email: string | null;
  name: string;
  phone: string;
  createdAt: string;
}

// Role types
export interface Role {
  uid: string;
  name: string;
  slug: string;
  createdAt: string;
}

// UserRole types
export interface UserRole {
  uid: string;
  user_id: string;
  role_id: string;
  createdAt: string;
}

// Category types
export interface Category {
  id: string;
  name: string;
  description: string;
  image: string;
  parent_category_id: string | null;
  createdAt: string;
}

// Item types
export interface Item {
  id: string;
  name: string;
  description: string;
  price: number;
  bannerImage: string;
  images: string[];
  category_id: string;
  createdAt: string;
}

// Checkout types
export interface Checkout {
  id: string;
  user_id: string;
  item_id: string;
  quantity: number;
  is_done: boolean;
  last_step: string;
  reason: string;
  createdAt: string;
  updatedAt: string;
}

// User services
export const getUserById = async (userId: string): Promise<User | null> => {
  try {
    const userDoc = await getDoc(doc(db, "users", userId));
    if (userDoc.exists()) {
      return { uid: userDoc.id, ...userDoc.data() } as User;
    }
    return null;
  } catch (error) {
    console.error("Error fetching user:", error);
    throw error;
  }
};

// Role services
export const getRoleById = async (roleId: string): Promise<Role | null> => {
  try {
    const roleDoc = await getDoc(doc(db, "roles", roleId));
    if (roleDoc.exists()) {
      return { uid: roleDoc.id, ...roleDoc.data() } as Role;
    }
    return null;
  } catch (error) {
    console.error("Error fetching role:", error);
    throw error;
  }
};

export const getRoleBySlug = async (slug: string): Promise<Role | null> => {
  try {
    const roleQuery = query(collection(db, "roles"), where("slug", "==", slug));
    const roleSnapshot = await getDocs(roleQuery);

    if (!roleSnapshot.empty) {
      const roleDoc = roleSnapshot.docs[0];
      return { uid: roleDoc.id, ...roleDoc.data() } as Role;
    }
    return null;
  } catch (error) {
    console.error("Error fetching role by slug:", error);
    throw error;
  }
};

// UserRole services
export const getUserRolesByUserId = async (userId: string): Promise<UserRole[]> => {
  try {
    const userRolesQuery = query(
      collection(db, "userRoles"),
      where("user_id", "==", userId)
    );
    const userRolesSnapshot = await getDocs(userRolesQuery);

    return userRolesSnapshot.docs.map(
      (doc) => ({ uid: doc.id, ...doc.data() } as UserRole)
    );
  } catch (error) {
    console.error("Error fetching user roles:", error);
    throw error;
  }
};

// Category services
export const getAllCategories = async (): Promise<Category[]> => {
  try {
    const categoriesQuery = query(
      collection(db, "categories"),
      orderBy("name")
    );
    const categoriesSnapshot = await getDocs(categoriesQuery);

    return categoriesSnapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() } as Category)
    );
  } catch (error) {
    console.error("Error fetching categories:", error);
    throw error;
  }
};

export const getParentCategories = async (): Promise<Category[]> => {
  try {
    // Fetch all categories without filtering by parent_category_id
    const categoriesQuery = query(
      collection(db, "categories"),
      orderBy("name")
    );
    const categoriesSnapshot = await getDocs(categoriesQuery);

    console.log(`Found ${categoriesSnapshot.docs.length} categories`);

    // Debug: Log the first few categories if any
    if (categoriesSnapshot.docs.length > 0) {
      const sampleCategories = categoriesSnapshot.docs.slice(0, Math.min(3, categoriesSnapshot.docs.length));
      sampleCategories.forEach((doc, index) => {
        const data = doc.data();
        console.log(`Category ${index + 1}:`, {
          id: doc.id,
          name: data.name,
          parent_category_id: data.parent_category_id,
          image: data.image
        });
      });
    }

    return categoriesSnapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() } as Category)
    );
  } catch (error) {
    console.error("Error fetching categories:", error);
    throw error;
  }
};

export const getSubcategoriesByParentId = async (parentId: string): Promise<Category[]> => {
  try {
    const categoriesQuery = query(
      collection(db, "categories"),
      where("parent_category_id", "==", parentId),
      orderBy("name")
    );
    const categoriesSnapshot = await getDocs(categoriesQuery);

    return categoriesSnapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() } as Category)
    );
  } catch (error) {
    console.error("Error fetching subcategories:", error);
    throw error;
  }
};

export const getCategoryById = async (categoryId: string): Promise<Category | null> => {
  try {
    const categoryDoc = await getDoc(doc(db, "categories", categoryId));
    if (categoryDoc.exists()) {
      return { id: categoryDoc.id, ...categoryDoc.data() } as Category;
    }
    return null;
  } catch (error) {
    console.error("Error fetching category:", error);
    throw error;
  }
};

// Item services
export const getAllItems = async (
  categoryId?: string | null,
  sortBy: "price_asc" | "price_desc" | "newest" = "newest",
  limitCount: number = 8,
  lastVisible?: QueryDocumentSnapshot<DocumentData> | null
): Promise<{ items: Item[]; lastVisible: QueryDocumentSnapshot<DocumentData> | null }> => {
  try {
    console.log("Getting items with categoryId:", categoryId, "sortBy:", sortBy);

    // If we're filtering by category, use the simpler approach to avoid index issues
    if (categoryId) {
      return await getItemsByCategory(categoryId, sortBy, limitCount, lastVisible);
    }

    // For non-filtered queries, use the standard approach
    let orderByField = "createdAt";
    let orderByDirection: OrderByDirection = "desc";

    // Set up sorting
    if (sortBy === "price_asc") {
      orderByField = "price";
      orderByDirection = "asc";
    } else if (sortBy === "price_desc") {
      orderByField = "price";
      orderByDirection = "desc";
    }

    // Create the base query
    let itemsQuery = query(
      collection(db, "items"),
      orderBy(orderByField, orderByDirection)
    );

    // Add pagination if needed
    if (lastVisible) {
      itemsQuery = query(itemsQuery, startAfter(lastVisible));
    }

    // Add limit
    itemsQuery = query(itemsQuery, limit(limitCount));

    // Execute query
    const itemsSnapshot = await getDocs(itemsQuery);

    console.log(`Retrieved ${itemsSnapshot.docs.length} items`);

    const items = itemsSnapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() } as Item)
    );

    const newLastVisible = itemsSnapshot.docs.length > 0
      ? itemsSnapshot.docs[itemsSnapshot.docs.length - 1]
      : null;

    return { items, lastVisible: newLastVisible };
  } catch (error: any) {
    console.error("Error fetching items:", error);
    // Log more details about the error
    if (error.code === 'failed-precondition') {
      console.error("This query requires an index. Follow the link in the error message to create it:");
      console.error(error.message);
    }
    throw error;
  }
};

// Get items by category without requiring a composite index
export const getItemsByCategory = async (
  categoryId: string,
  sortBy: "price_asc" | "price_desc" | "newest" = "newest",
  limitCount: number = 8,
  lastVisible?: QueryDocumentSnapshot<DocumentData> | null
): Promise<{ items: Item[]; lastVisible: QueryDocumentSnapshot<DocumentData> | null }> => {
  try {
    console.log(`Getting items for category: ${categoryId}`);

    // First, get all items with the specified category
    const categoryQuery = query(
      collection(db, "items"),
      where("category_id", "==", categoryId)
    );

    const categorySnapshot = await getDocs(categoryQuery);
    console.log(`Found ${categorySnapshot.docs.length} items in category ${categoryId}`);

    // Debug: Log the first few items if any
    if (categorySnapshot.docs.length > 0) {
      const sampleItems = categorySnapshot.docs.slice(0, Math.min(3, categorySnapshot.docs.length));
      sampleItems.forEach((doc, index) => {
        const data = doc.data();
        console.log(`Item ${index + 1}:`, {
          id: doc.id,
          name: data.name,
          category_id: data.category_id,
          price: data.price
        });
      });
    } else {
      // If no items found, let's check if the category exists
      try {
        const categoryDoc = await getDoc(doc(db, "categories", categoryId));
        if (categoryDoc.exists()) {
          console.log("Category exists but has no items:", categoryDoc.data());
        } else {
          console.log("Category does not exist with ID:", categoryId);
        }
      } catch (err) {
        console.error("Error checking category:", err);
      }
    }

    // Convert to items
    let items = categorySnapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() } as Item)
    );

    // Sort items in memory based on the sortBy parameter
    if (sortBy === "price_asc") {
      items.sort((a, b) => a.price - b.price);
    } else if (sortBy === "price_desc") {
      items.sort((a, b) => b.price - a.price);
    } else {
      // Sort by newest (createdAt)
      items.sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateB - dateA;
      });
    }

    // Handle pagination
    let startIndex = 0;
    if (lastVisible) {
      // Find the index of the last visible item
      const lastVisibleId = lastVisible.id;
      const lastVisibleIndex = items.findIndex(item => item.id === lastVisibleId);
      if (lastVisibleIndex !== -1) {
        startIndex = lastVisibleIndex + 1;
      }
    }

    // Apply limit
    const paginatedItems = items.slice(startIndex, startIndex + limitCount);

    // Determine the new last visible item
    const newLastVisible = paginatedItems.length > 0
      ? categorySnapshot.docs.find(doc => doc.id === paginatedItems[paginatedItems.length - 1].id) || null
      : null;

    return {
      items: paginatedItems,
      lastVisible: newLastVisible
    };
  } catch (error) {
    console.error("Error fetching items by category:", error);
    throw error;
  }
};

export const searchItems = async (searchQuery: string, limitCount: number = 8): Promise<Item[]> => {
  try {
    const itemsQuery = query(
      collection(db, "items"),
      orderBy("name"),
      where("name", ">=", searchQuery),
      where("name", "<=", searchQuery + "\uf8ff"),
      limit(limitCount)
    );

    const itemsSnapshot = await getDocs(itemsQuery);

    return itemsSnapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() } as Item)
    );
  } catch (error) {
    console.error("Error searching items:", error);
    throw error;
  }
};

export const getItemById = async (itemId: string): Promise<Item | null> => {
  try {
    const itemDoc = await getDoc(doc(db, "items", itemId));
    if (itemDoc.exists()) {
      return { id: itemDoc.id, ...itemDoc.data() } as Item;
    }
    return null;
  } catch (error) {
    console.error("Error fetching item:", error);
    throw error;
  }
};

// Checkout services
export const getCartItems = async (userId: string): Promise<Checkout[]> => {
  try {
    const checkoutsQuery = query(
      collection(db, "checkouts"),
      where("user_id", "==", userId),
      where("is_done", "==", false)
    );

    const checkoutsSnapshot = await getDocs(checkoutsQuery);

    return checkoutsSnapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() } as Checkout)
    );
  } catch (error) {
    console.error("Error fetching cart items:", error);
    throw error;
  }
};

export const addToCart = async (
  userId: string,
  itemId: string,
  quantity: number
): Promise<string> => {
  try {
    const checkoutData = {
      user_id: userId,
      item_id: itemId,
      quantity,
      is_done: false,
      last_step: "added_to_cart",
      reason: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const docRef = await addDoc(collection(db, "checkouts"), checkoutData);
    return docRef.id;
  } catch (error) {
    console.error("Error adding to cart:", error);
    throw error;
  }
};

export const updateCartItemQuantity = async (
  checkoutId: string,
  quantity: number
): Promise<void> => {
  try {
    await updateDoc(doc(db, "checkouts", checkoutId), {
      quantity,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error updating cart item quantity:", error);
    throw error;
  }
};

export const removeFromCart = async (checkoutId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, "checkouts", checkoutId));
  } catch (error) {
    console.error("Error removing from cart:", error);
    throw error;
  }
};

export const updateCheckoutStep = async (
  checkoutId: string,
  lastStep: string
): Promise<void> => {
  try {
    await updateDoc(doc(db, "checkouts", checkoutId), {
      last_step: lastStep,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error updating checkout step:", error);
    throw error;
  }
};

export const completeCheckout = async (checkoutId: string): Promise<void> => {
  try {
    await updateDoc(doc(db, "checkouts", checkoutId), {
      is_done: true,
      last_step: "completed",
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error completing checkout:", error);
    throw error;
  }
};

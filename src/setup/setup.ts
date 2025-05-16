import dotenv from "dotenv";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from "firebase/auth";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  addDoc,
  getDocs,
  query,
  where
} from "firebase/firestore";

dotenv.config();

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Helper function to create a user with role
async function createUserWithRole(email: string, password: string, name: string, phone: string, roleName: string) {
  try {
    let uid: string;
    let userCredential;

    try {
      // Try to create user in Firebase Auth
      userCredential = await createUserWithEmailAndPassword(auth, email, password);
      uid = userCredential.user.uid;
      console.log(`User created with email: ${email}`);
    } catch (authError: any) {
      // If user already exists, try to sign in
      if (authError.code === 'auth/email-already-in-use') {
        console.log(`User with email ${email} already exists, trying to sign in...`);
        try {
          userCredential = await signInWithEmailAndPassword(auth, email, password);
          uid = userCredential.user.uid;
          console.log(`Signed in as existing user: ${email}`);

          // If we got here, we have the UID, so we can return it
          return uid;
        } catch (signInError) {
          console.error(`Could not sign in as existing user ${email}:`, signInError);
          console.log("Continuing with setup process...");
          return null; // Return null to indicate we couldn't get the user
        }
      } else {
        // If it's a different error, rethrow it
        throw authError;
      }
    }

    // Get role ID
    const roleQuery = query(collection(db, "roles"), where("slug", "==", roleName));
    const roleSnapshot = await getDocs(roleQuery);

    if (roleSnapshot.empty) {
      throw new Error(`Role with slug ${roleName} not found`);
    }

    const roleId = roleSnapshot.docs[0].id;

    // Create user document
    await setDoc(doc(db, "users", uid), {
      uid,
      email,
      name,
      phone,
      createdAt: new Date().toISOString()
    });

    // Create user role association
    await addDoc(collection(db, "userRoles"), {
      user_id: uid,
      role_id: roleId,
      createdAt: new Date().toISOString()
    });

    console.log(`User setup completed for ${email} with role: ${roleName}`);
    return uid;
  } catch (error) {
    console.error("Error in createUserWithRole:", error);
    return null; // Return null instead of throwing to allow the setup to continue
  }
}

// Create roles
async function createRoles() {
  try {
    // Check if roles already exist
    const rolesQuery = query(collection(db, "roles"));
    const rolesSnapshot = await getDocs(rolesQuery);

    if (!rolesSnapshot.empty) {
      console.log("Roles already exist, skipping creation");
      return;
    }

    // Create root role
    await addDoc(collection(db, "roles"), {
      name: "Administrator",
      slug: "root",
      createdAt: new Date().toISOString()
    });

    // Create client role
    await addDoc(collection(db, "roles"), {
      name: "Client",
      slug: "client",
      createdAt: new Date().toISOString()
    });

    console.log("Roles created successfully");
  } catch (error) {
    console.error("Error creating roles:", error);
    throw error;
  }
}

// Create categories
async function createCategories() {
  try {
    // Check if categories already exist
    const categoriesQuery = query(collection(db, "categories"));
    const categoriesSnapshot = await getDocs(categoriesQuery);

    if (!categoriesSnapshot.empty) {
      console.log("Categories already exist, skipping creation");
      return;
    }

    // Create parent categories
    const itCategoryRef = await addDoc(collection(db, "categories"), {
      name: "IT",
      description: "Information Technology products",
      image: "https://picsum.photos/id/0/800/600",
      parent_category_id: null,
      createdAt: new Date().toISOString()
    });

    const fashionCategoryRef = await addDoc(collection(db, "categories"), {
      name: "Fashion",
      description: "Clothing and accessories",
      image: "https://picsum.photos/id/999/800/600",
      parent_category_id: null,
      createdAt: new Date().toISOString()
    });

    // Create IT subcategories
    await addDoc(collection(db, "categories"), {
      name: "Phones",
      description: "Mobile phones and accessories",
      image: "https://picsum.photos/id/1/800/600",
      parent_category_id: itCategoryRef.id,
      createdAt: new Date().toISOString()
    });

    await addDoc(collection(db, "categories"), {
      name: "Laptops",
      description: "Portable computers",
      image: "https://picsum.photos/id/2/800/600",
      parent_category_id: itCategoryRef.id,
      createdAt: new Date().toISOString()
    });

    await addDoc(collection(db, "categories"), {
      name: "Tablets",
      description: "Tablet computers",
      image: "https://picsum.photos/id/3/800/600",
      parent_category_id: itCategoryRef.id,
      createdAt: new Date().toISOString()
    });

    await addDoc(collection(db, "categories"), {
      name: "Desktops",
      description: "Desktop computers",
      image: "https://picsum.photos/id/4/800/600",
      parent_category_id: itCategoryRef.id,
      createdAt: new Date().toISOString()
    });

    // Create Fashion subcategories
    await addDoc(collection(db, "categories"), {
      name: "Men",
      description: "Men's clothing",
      image: "https://picsum.photos/id/1005/800/600",
      parent_category_id: fashionCategoryRef.id,
      createdAt: new Date().toISOString()
    });

    await addDoc(collection(db, "categories"), {
      name: "Women",
      description: "Women's clothing",
      image: "https://picsum.photos/id/1011/800/600",
      parent_category_id: fashionCategoryRef.id,
      createdAt: new Date().toISOString()
    });

    console.log("Categories created successfully");
  } catch (error) {
    console.error("Error creating categories:", error);
    throw error;
  }
}

// Define category type
interface Category {
  id: string;
  name: string;
  description: string;
  image: string;
  parent_category_id: string | null;
  createdAt: string;
}

// Create sample items
async function createItems() {
  try {
    // Check if items already exist
    const itemsQuery = query(collection(db, "items"));
    const itemsSnapshot = await getDocs(itemsQuery);

    if (!itemsSnapshot.empty) {
      console.log("Items already exist, skipping creation");
      return;
    }

    // Get categories
    const categoriesQuery = query(collection(db, "categories"));
    const categoriesSnapshot = await getDocs(categoriesQuery);
    const categories = categoriesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Category[];

    // Find category IDs
    const phonesCategory = categories.find(cat => cat.name === "Phones");
    const laptopsCategory = categories.find(cat => cat.name === "Laptops");
    const tabletsCategory = categories.find(cat => cat.name === "Tablets");
    const menCategory = categories.find(cat => cat.name === "Men");
    const womenCategory = categories.find(cat => cat.name === "Women");

    // Create items
    if (phonesCategory) {
      await addDoc(collection(db, "items"), {
        name: "iPhone 15 Pro",
        description: "Latest iPhone with advanced features",
        price: 999.99,
        bannerImage: "https://picsum.photos/id/160/800/600",
        images: [
          "https://picsum.photos/id/160/800/600",
          "https://picsum.photos/id/250/800/600"
        ],
        category_id: phonesCategory.id,
        createdAt: new Date().toISOString()
      });

      await addDoc(collection(db, "items"), {
        name: "Samsung Galaxy S24",
        description: "Flagship Android smartphone",
        price: 899.99,
        bannerImage: "https://picsum.photos/id/161/800/600",
        images: [
          "https://picsum.photos/id/161/800/600",
          "https://picsum.photos/id/251/800/600"
        ],
        category_id: phonesCategory.id,
        createdAt: new Date().toISOString()
      });
    }

    if (laptopsCategory) {
      await addDoc(collection(db, "items"), {
        name: "MacBook Pro 16",
        description: "Powerful laptop for professionals",
        price: 2499.99,
        bannerImage: "https://picsum.photos/id/119/800/600",
        images: [
          "https://picsum.photos/id/119/800/600",
          "https://picsum.photos/id/180/800/600"
        ],
        category_id: laptopsCategory.id,
        createdAt: new Date().toISOString()
      });

      await addDoc(collection(db, "items"), {
        name: "Dell XPS 15",
        description: "Premium Windows laptop",
        price: 1899.99,
        bannerImage: "https://picsum.photos/id/201/800/600",
        images: [
          "https://picsum.photos/id/201/800/600",
          "https://picsum.photos/id/202/800/600"
        ],
        category_id: laptopsCategory.id,
        createdAt: new Date().toISOString()
      });
    }

    if (tabletsCategory) {
      await addDoc(collection(db, "items"), {
        name: "iPad Pro",
        description: "Apple's premium tablet",
        price: 799.99,
        bannerImage: "https://picsum.photos/id/40/800/600",
        images: [
          "https://picsum.photos/id/40/800/600",
          "https://picsum.photos/id/41/800/600"
        ],
        category_id: tabletsCategory.id,
        createdAt: new Date().toISOString()
      });
    }

    if (menCategory) {
      await addDoc(collection(db, "items"), {
        name: "Men's Casual Shirt",
        description: "Comfortable cotton shirt",
        price: 49.99,
        bannerImage: "https://picsum.photos/id/1005/800/600",
        images: [
          "https://picsum.photos/id/1005/800/600",
          "https://picsum.photos/id/1006/800/600"
        ],
        category_id: menCategory.id,
        createdAt: new Date().toISOString()
      });
    }

    if (womenCategory) {
      await addDoc(collection(db, "items"), {
        name: "Women's Summer Dress",
        description: "Elegant summer dress",
        price: 59.99,
        bannerImage: "https://picsum.photos/id/1011/800/600",
        images: [
          "https://picsum.photos/id/1011/800/600",
          "https://picsum.photos/id/1013/800/600"
        ],
        category_id: womenCategory.id,
        createdAt: new Date().toISOString()
      });
    }

    console.log("Items created successfully");
  } catch (error) {
    console.error("Error creating items:", error);
    throw error;
  }
}

// Main setup function
async function setup() {
  let setupSuccess = true;

  try {
    console.log("Starting setup process...");

    // Create roles
    await createRoles();

    // Create categories
    await createCategories();

    // Create items
    await createItems();

    // Create admin user
    const adminUid = await createUserWithRole(
      "admin@example.com",
      "Admin@123",
      "Admin User",
      "+33745626622",
      "root"
    );

    if (adminUid) {
      console.log(`Admin user setup complete with UID: ${adminUid}`);
    } else {
      console.log("Admin user setup could not be completed, but continuing...");
      setupSuccess = false;
    }

    // Create client user
    const clientUid = await createUserWithRole(
      "client@example.com",
      "Client@123",
      "Client User",
      "+33758376058",
      "client"
    );

    if (clientUid) {
      console.log(`Client user setup complete with UID: ${clientUid}`);
    } else {
      console.log("Client user setup could not be completed, but continuing...");
      setupSuccess = false;
    }

    if (setupSuccess) {
      console.log("Setup completed successfully!");
    } else {
      console.log("Setup completed with some warnings or errors.");
    }
  } catch (error) {
    console.error("Setup encountered an error:", error);
    setupSuccess = false;
  } finally {
    try {
      // Sign out any signed in user
      await auth.signOut();
      console.log("Signed out successfully");
    } catch (signOutError) {
      console.error("Error signing out:", signOutError);
    }

    console.log("Setup process finished");
    process.exit(setupSuccess ? 0 : 1);
  }
}

// Run the setup
setup();

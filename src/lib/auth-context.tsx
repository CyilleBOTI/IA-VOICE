"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  User,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { auth, db } from "./firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  setDoc,
  addDoc
} from "firebase/firestore";
import { useRouter } from "next/navigation";

type UserRole = {
  id: string;
  name: string;
  slug: string;
};

type UserData = {
  uid: string;
  email: string | null;
  name: string;
  phone: string;
  roles: UserRole[];
};

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, phone: string) => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (roleSlug: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      console.log("Auth state changed:", currentUser ? "User logged in" : "No user");
      setUser(currentUser);

      if (currentUser) {
        try {
          // Get user data from Firestore
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));

          // Create a base userData object with empty roles array
          const baseUserData = {
            uid: currentUser.uid,
            email: currentUser.email,
            name: userDoc.exists() ? userDoc.data().name || '' : '',
            phone: userDoc.exists() ? userDoc.data().phone || '' : '',
            roles: []
          };

          // Set initial user data even before roles are loaded
          setUserData(baseUserData);

          // Get user roles
          try {
            const userRolesQuery = query(
              collection(db, "userRoles"),
              where("user_id", "==", currentUser.uid)
            );

            const userRolesSnapshot = await getDocs(userRolesQuery);
            console.log(`Found ${userRolesSnapshot.size} user roles for user ${currentUser.uid}`);

            if (!userRolesSnapshot.empty) {
              const roles: UserRole[] = [];
              const roleIds = userRolesSnapshot.docs.map(doc => doc.data().role_id);

              console.log("Role IDs:", roleIds);

              // Fetch all roles
              for (const userRoleDoc of userRolesSnapshot.docs) {
                const userRole = userRoleDoc.data();
                console.log("Processing user role:", userRole);

                const roleDoc = await getDoc(doc(db, "roles", userRole.role_id));

                if (roleDoc.exists()) {
                  const roleData = roleDoc.data();
                  console.log("Found role:", roleData);

                  roles.push({
                    id: roleDoc.id,
                    name: roleData.name,
                    slug: roleData.slug
                  });
                } else {
                  console.log(`Role ${userRole.role_id} not found`);
                }
              }

              console.log("Final roles array:", roles);

              // Update user data with roles
              setUserData(prevData => {
                const updatedData = prevData ? { ...prevData, roles } : null;
                console.log("Updated user data:", updatedData);
                return updatedData;
              });
            } else {
              console.log("No user roles found for this user");
            }
          } catch (roleError) {
            console.error("Error fetching user roles:", roleError);
            // Continue with base user data
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          // Still set the user with basic data from Firebase Auth
          setUserData({
            uid: currentUser.uid,
            email: currentUser.email,
            name: '',
            phone: '',
            roles: []
          });
        }
      } else {
        setUserData(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);

      // Set a token cookie for middleware authentication
      // This is a simple approach - in a production app, you'd use a proper JWT
      document.cookie = `token=${userCredential.user.uid}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Strict`;

      router.push("/home");
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  const register = async (email: string, password: string, name: string, phone: string) => {
    try {
      // Create the user account
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Save user data to Firestore
      await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        name,
        phone,
        createdAt: new Date().toISOString()
      });

      // Assign default client role
      const clientRoleQuery = query(
        collection(db, "roles"),
        where("slug", "==", "client")
      );

      const roleSnapshot = await getDocs(clientRoleQuery);

      if (!roleSnapshot.empty) {
        const roleId = roleSnapshot.docs[0].id;

        // Create user role assignment
        await addDoc(collection(db, "userRoles"), {
          user_id: user.uid,
          role_id: roleId,
          createdAt: new Date().toISOString()
        });
      }

      // Set a token cookie for middleware authentication
      document.cookie = `token=${user.uid}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Strict`;

      router.push("/home");
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);

      // Clear the token cookie
      document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict";

      router.push("/");
    } catch (error) {
      console.error("Logout error:", error);
      throw error;
    }
  };

  // Function to check if user has a specific role
  const hasRole = (roleSlug: string): boolean => {
    console.log("Checking role:", roleSlug);
    console.log("User data:", userData);
    console.log("User roles:", userData?.roles);

    if (!userData || !userData.roles || userData.roles.length === 0) {
      console.log("No user data or roles found");
      return false;
    }

    const hasTheRole = userData.roles.some(role => role.slug === roleSlug);
    console.log(`User has role '${roleSlug}':`, hasTheRole);

    return hasTheRole;
  };

  return (
    <AuthContext.Provider value={{ user, userData, loading, login, register, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

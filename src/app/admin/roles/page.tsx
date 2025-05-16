"use client";

import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  MoreHorizontal,
  Trash,
  Edit,
  Plus,
  Search,
  RefreshCw,
  ShieldCheck
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

interface Role {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  userCount?: number;
}

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    slug: ""
  });

  useEffect(() => {
    fetchRoles();
  }, []);

  async function fetchRoles() {
    setLoading(true);
    try {
      const rolesSnapshot = await getDocs(collection(db, "roles"));
      const rolesData: Role[] = [];

      for (const roleDoc of rolesSnapshot.docs) {
        const role = roleDoc.data();

        // Count users with this role
        const userRolesQuery = query(
          collection(db, "userRoles"),
          where("role_id", "==", roleDoc.id)
        );
        const userRolesSnapshot = await getDocs(userRolesQuery);

        rolesData.push({
          id: roleDoc.id,
          name: role.name || "",
          slug: role.slug || "",
          createdAt: role.createdAt || "",
          userCount: userRolesSnapshot.size
        });
      }

      setRoles(rolesData);
    } catch (error) {
      console.error("Error fetching roles:", error);
      toast.error("Failed to load roles");
    } finally {
      setLoading(false);
    }
  }

  function handleOpenDialog(role?: Role) {
    if (role) {
      setSelectedRole(role);
      setFormData({
        name: role.name,
        slug: role.slug
      });
    } else {
      setSelectedRole(null);
      setFormData({
        name: "",
        slug: ""
      });
    }
    setIsDialogOpen(true);
  }

  function handleOpenDeleteDialog(role: Role) {
    setSelectedRole(role);
    setIsDeleteDialogOpen(true);
  }

  async function handleSaveRole() {
    try {
      if (!formData.name || !formData.slug) {
        toast.error("Name and slug are required");
        return;
      }

      // Validate slug format (lowercase, no spaces, only alphanumeric and hyphens)
      const slugRegex = /^[a-z0-9-]+$/;
      if (!slugRegex.test(formData.slug)) {
        toast.error("Slug must contain only lowercase letters, numbers, and hyphens");
        return;
      }

      // Check if slug is unique
      if (!selectedRole || selectedRole.slug !== formData.slug) {
        const slugQuery = query(
          collection(db, "roles"),
          where("slug", "==", formData.slug)
        );
        const slugSnapshot = await getDocs(slugQuery);

        if (!slugSnapshot.empty) {
          toast.error("A role with this slug already exists");
          return;
        }
      }

      const roleData = {
        name: formData.name,
        slug: formData.slug,
        createdAt: new Date().toISOString()
      };

      if (selectedRole) {
        // Update existing role
        await updateDoc(doc(db, "roles", selectedRole.id), roleData);
        toast.success("Role updated successfully");
      } else {
        // Create new role
        await addDoc(collection(db, "roles"), roleData);
        toast.success("Role created successfully");
      }

      setIsDialogOpen(false);
      fetchRoles();
    } catch (error) {
      console.error("Error saving role:", error);
      toast.error("Failed to save role");
    }
  }

  async function handleDeleteRole() {
    if (!selectedRole) return;

    try {
      // Check if role is assigned to any users
      if (selectedRole.userCount && selectedRole.userCount > 0) {
        toast.error("Cannot delete role that is assigned to users");
        setIsDeleteDialogOpen(false);
        return;
      }

      // Prevent deleting root or client roles
      if (selectedRole.slug === "root" || selectedRole.slug === "client") {
        toast.error("Cannot delete system roles (root, client)");
        setIsDeleteDialogOpen(false);
        return;
      }

      // Delete role
      await deleteDoc(doc(db, "roles", selectedRole.id));
      toast.success("Role deleted successfully");
      setIsDeleteDialogOpen(false);
      fetchRoles();
    } catch (error) {
      console.error("Error deleting role:", error);
      toast.error("Failed to delete role");
    }
  }

  const filteredRoles = roles.filter(role =>
    role.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    role.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Roles Management</h1>
        <div className="flex gap-2">
          <Button onClick={fetchRoles} variant="outline" size="icon">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            Add Role
          </Button>
        </div>
      </div>

      <div className="flex items-center mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search roles..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Users</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead className="w-[80px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <div className="flex justify-center">
                    <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredRoles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No roles found
                </TableCell>
              </TableRow>
            ) : (
              filteredRoles.map((role) => (
                <TableRow key={role.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className={`h-4 w-4 ${role.slug === "root" ? "text-destructive" : "text-primary"}`} />
                      {role.name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm">
                      {role.slug}
                    </code>
                  </TableCell>
                  <TableCell>{role.userCount || 0}</TableCell>
                  <TableCell>{new Date(role.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleOpenDialog(role)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleOpenDeleteDialog(role)}
                          className="text-destructive focus:text-destructive"
                          disabled={role.slug === "root" || role.slug === "client"}
                        >
                          <Trash className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Role Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedRole ? "Edit Role" : "Add Role"}</DialogTitle>
            <DialogDescription>
              {selectedRole
                ? "Update the role details below."
                : "Fill in the details to create a new role."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Role name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") })}
                placeholder="role-slug"
                disabled={selectedRole?.slug === "root" || selectedRole?.slug === "client"}
              />
              <p className="text-sm text-muted-foreground">
                Unique identifier for the role. Use lowercase letters, numbers, and hyphens only.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveRole}>
              {selectedRole ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Role</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the role &quot;{selectedRole?.name}&quot;?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteRole}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

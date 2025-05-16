"use client";

import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  MoreHorizontal,
  Trash,
  Edit,
  Plus,
  Search,
  RefreshCw,
  FolderTree
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

interface Category {
  id: string;
  name: string;
  description: string;
  image: string;
  parent_category_id: string | null;
  createdAt: string;
  parentName?: string;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    image: "",
    parent_category_id: ""
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories() {
    setLoading(true);
    try {
      const categoriesSnapshot = await getDocs(collection(db, "categories"));
      const categoriesData: Category[] = [];

      for (const categoryDoc of categoriesSnapshot.docs) {
        const category = categoryDoc.data();
        let parentName = "";

        if (category.parent_category_id) {
          const parentDoc = await getDoc(doc(db, "categories", category.parent_category_id));
          if (parentDoc.exists()) {
            parentName = parentDoc.data().name;
          }
        }

        categoriesData.push({
          id: categoryDoc.id,
          name: category.name || "",
          description: category.description || "",
          image: category.image || "",
          parent_category_id: category.parent_category_id || null,
          createdAt: category.createdAt || "",
          parentName
        });
      }

      setCategories(categoriesData);
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast.error("Failed to load categories");
    } finally {
      setLoading(false);
    }
  }

  function handleOpenDialog(category?: Category) {
    if (category) {
      setSelectedCategory(category);
      setFormData({
        name: category.name,
        description: category.description,
        image: category.image,
        parent_category_id: category.parent_category_id || ""
      });
    } else {
      setSelectedCategory(null);
      setFormData({
        name: "",
        description: "",
        image: "",
        parent_category_id: ""
      });
    }
    setIsDialogOpen(true);
  }

  function handleOpenDeleteDialog(category: Category) {
    setSelectedCategory(category);
    setIsDeleteDialogOpen(true);
  }

  async function handleSaveCategory() {
    try {
      if (!formData.name) {
        toast.error("Category name is required");
        return;
      }

      const categoryData = {
        name: formData.name,
        description: formData.description,
        image: formData.image || "https://picsum.photos/800/600", // Default image if none provided
        parent_category_id: formData.parent_category_id || null,
        createdAt: new Date().toISOString()
      };

      if (selectedCategory) {
        // Update existing category
        await updateDoc(doc(db, "categories", selectedCategory.id), categoryData);
        toast.success("Category updated successfully");
      } else {
        // Create new category
        await addDoc(collection(db, "categories"), categoryData);
        toast.success("Category created successfully");
      }

      setIsDialogOpen(false);
      fetchCategories();
    } catch (error) {
      console.error("Error saving category:", error);
      toast.error("Failed to save category");
    }
  }

  async function handleDeleteCategory() {
    if (!selectedCategory) return;

    try {
      // Check if category has items
      const itemsQuery = query(
        collection(db, "items"),
        where("category_id", "==", selectedCategory.id)
      );
      const itemsSnapshot = await getDocs(itemsQuery);

      if (!itemsSnapshot.empty) {
        toast.error("Cannot delete category with associated items");
        setIsDeleteDialogOpen(false);
        return;
      }

      // Check if category has subcategories
      const subcategoriesQuery = query(
        collection(db, "categories"),
        where("parent_category_id", "==", selectedCategory.id)
      );
      const subcategoriesSnapshot = await getDocs(subcategoriesQuery);

      if (!subcategoriesSnapshot.empty) {
        toast.error("Cannot delete category with subcategories");
        setIsDeleteDialogOpen(false);
        return;
      }

      // Delete category
      await deleteDoc(doc(db, "categories", selectedCategory.id));
      toast.success("Category deleted successfully");
      setIsDeleteDialogOpen(false);
      fetchCategories();
    } catch (error) {
      console.error("Error deleting category:", error);
      toast.error("Failed to delete category");
    }
  }

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    category.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Categories Management</h1>
        <div className="flex gap-2">
          <Button onClick={fetchCategories} variant="outline" size="icon">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            Add Category
          </Button>
        </div>
      </div>

      <div className="flex items-center mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search categories..."
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
              <TableHead>Description</TableHead>
              <TableHead>Parent Category</TableHead>
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
            ) : filteredCategories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No categories found
                </TableCell>
              </TableRow>
            ) : (
              filteredCategories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-md overflow-hidden">
                        <img
                          src={category.image}
                          alt={category.name}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "https://picsum.photos/800/600";
                          }}
                        />
                      </div>
                      {category.name}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[300px] truncate">{category.description}</TableCell>
                  <TableCell>
                    {category.parentName ? (
                      <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                        <FolderTree className="h-3 w-3 mr-1" />
                        {category.parentName}
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-sm">None</span>
                    )}
                  </TableCell>
                  <TableCell>{new Date(category.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleOpenDialog(category)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleOpenDeleteDialog(category)}
                          className="text-destructive focus:text-destructive"
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

      {/* Category Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedCategory ? "Edit Category" : "Add Category"}</DialogTitle>
            <DialogDescription>
              {selectedCategory
                ? "Update the category details below."
                : "Fill in the details to create a new category."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Category name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Category description"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="image">Image URL</Label>
              <Input
                id="image"
                value={formData.image}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                placeholder="https://example.com/image.jpg"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="parent">Parent Category</Label>
              <Select
                value={formData.parent_category_id}
                onValueChange={(value) => setFormData({ ...formData, parent_category_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a parent category (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {categories
                    .filter(cat => cat.id !== selectedCategory?.id) // Prevent selecting self as parent
                    .map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))
                  }
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveCategory}>
              {selectedCategory ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Category</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the category &quot;{selectedCategory?.name}&quot;?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteCategory}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

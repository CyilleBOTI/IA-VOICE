"use client";

import { useEffect, useState } from "react";
import { 
  collection, 
  getDocs, 
  doc, 
  getDoc, 
  updateDoc,
  query,
  where,
  orderBy
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
  Eye, 
  Search, 
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Package
} from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

interface Order {
  id: string;
  user_id: string;
  item_id: string;
  quantity: number;
  is_done: boolean;
  last_step: string;
  reason: string;
  createdAt: string;
  updatedAt: string;
  userName?: string;
  itemName?: string;
  itemPrice?: number;
  totalPrice?: number;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "completed" | "pending">("all");
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  async function fetchOrders() {
    setLoading(true);
    try {
      // Create query based on status filter
      let checkoutsQuery;
      if (statusFilter === "completed") {
        checkoutsQuery = query(
          collection(db, "checkouts"),
          where("is_done", "==", true),
          orderBy("updatedAt", "desc")
        );
      } else if (statusFilter === "pending") {
        checkoutsQuery = query(
          collection(db, "checkouts"),
          where("is_done", "==", false),
          orderBy("createdAt", "desc")
        );
      } else {
        checkoutsQuery = query(
          collection(db, "checkouts"),
          orderBy("createdAt", "desc")
        );
      }

      const checkoutsSnapshot = await getDocs(checkoutsQuery);
      const ordersData: Order[] = [];

      for (const orderDoc of checkoutsSnapshot.docs) {
        const order = orderDoc.data() as Order;
        
        // Get user info
        let userName = "Unknown";
        try {
          const userDoc = await getDoc(doc(db, "users", order.user_id));
          if (userDoc.exists()) {
            userName = userDoc.data().name || userDoc.data().email || "Unknown";
          }
        } catch (error) {
          console.error("Error fetching user:", error);
        }
        
        // Get item info
        let itemName = "Unknown";
        let itemPrice = 0;
        try {
          const itemDoc = await getDoc(doc(db, "items", order.item_id));
          if (itemDoc.exists()) {
            itemName = itemDoc.data().name || "Unknown";
            itemPrice = itemDoc.data().price || 0;
          }
        } catch (error) {
          console.error("Error fetching item:", error);
        }

        ordersData.push({
          id: orderDoc.id,
          ...order,
          userName,
          itemName,
          itemPrice,
          totalPrice: itemPrice * order.quantity
        });
      }

      setOrders(ordersData);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  }

  function handleViewOrder(order: Order) {
    setSelectedOrder(order);
    setIsViewDialogOpen(true);
  }

  async function handleUpdateOrderStatus(orderId: string, isDone: boolean) {
    try {
      await updateDoc(doc(db, "checkouts", orderId), {
        is_done: isDone,
        last_step: isDone ? "completed" : "processing",
        updatedAt: new Date().toISOString()
      });
      
      toast.success(`Order ${isDone ? "completed" : "marked as pending"} successfully`);
      fetchOrders();
      setIsViewDialogOpen(false);
    } catch (error) {
      console.error("Error updating order status:", error);
      toast.error("Failed to update order status");
    }
  }

  // Apply filters
  const filteredOrders = orders.filter(order => {
    // Apply search filter
    const searchMatch = 
      order.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.itemName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Apply status filter
    const statusMatch = 
      statusFilter === "all" ||
      (statusFilter === "completed" && order.is_done) ||
      (statusFilter === "pending" && !order.is_done);
    
    return searchMatch && statusMatch;
  });

  function getStatusBadge(order: Order) {
    if (order.is_done) {
      return (
        <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
          <CheckCircle className="h-3 w-3 mr-1" />
          Completed
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline" className="bg-orange-500/10 text-orange-500 border-orange-500/20">
          <Clock className="h-3 w-3 mr-1" />
          Pending
        </Badge>
      );
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Orders Management</h1>
        <Button onClick={fetchOrders} variant="outline" size="icon">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex items-center gap-4 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search orders..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={(value: "all" | "completed" | "pending") => setStatusFilter(value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Orders</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="w-[80px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  <div className="flex justify-center">
                    <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No orders found
                </TableCell>
              </TableRow>
            ) : (
              filteredOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-mono text-xs">
                    {order.id.substring(0, 8)}...
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      {order.userName}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      {order.itemName}
                    </div>
                  </TableCell>
                  <TableCell>{order.quantity}</TableCell>
                  <TableCell>${order.totalPrice?.toFixed(2)}</TableCell>
                  <TableCell>{getStatusBadge(order)}</TableCell>
                  <TableCell>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewOrder(order)}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        {order.is_done ? (
                          <DropdownMenuItem onClick={() => handleUpdateOrderStatus(order.id, false)}>
                            <Clock className="mr-2 h-4 w-4" />
                            Mark as Pending
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => handleUpdateOrderStatus(order.id, true)}>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Mark as Completed
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Order Details Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
            <DialogDescription>
              View complete information about this order.
            </DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="font-medium">Order ID:</div>
                <div className="font-mono">{selectedOrder.id}</div>
                
                <div className="font-medium">Status:</div>
                <div>{getStatusBadge(selectedOrder)}</div>
                
                <div className="font-medium">Customer:</div>
                <div>{selectedOrder.userName}</div>
                
                <div className="font-medium">Product:</div>
                <div>{selectedOrder.itemName}</div>
                
                <div className="font-medium">Quantity:</div>
                <div>{selectedOrder.quantity}</div>
                
                <div className="font-medium">Price per unit:</div>
                <div>${selectedOrder.itemPrice?.toFixed(2)}</div>
                
                <div className="font-medium">Total:</div>
                <div className="font-bold">${selectedOrder.totalPrice?.toFixed(2)}</div>
                
                <div className="font-medium">Created:</div>
                <div>{new Date(selectedOrder.createdAt).toLocaleString()}</div>
                
                <div className="font-medium">Last Updated:</div>
                <div>{new Date(selectedOrder.updatedAt).toLocaleString()}</div>
                
                <div className="font-medium">Last Step:</div>
                <div>{selectedOrder.last_step}</div>
                
                {selectedOrder.reason && (
                  <>
                    <div className="font-medium">Reason:</div>
                    <div>{selectedOrder.reason}</div>
                  </>
                )}
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                {selectedOrder.is_done ? (
                  <Button 
                    variant="outline" 
                    onClick={() => handleUpdateOrderStatus(selectedOrder.id, false)}
                  >
                    <Clock className="mr-2 h-4 w-4" />
                    Mark as Pending
                  </Button>
                ) : (
                  <Button 
                    onClick={() => handleUpdateOrderStatus(selectedOrder.id, true)}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Mark as Completed
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

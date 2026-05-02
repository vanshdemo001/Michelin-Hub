"use client";

import { useAuthState } from "react-firebase-hooks/auth";
import { useCollection } from "react-firebase-hooks/firestore";
import { auth, db } from "@/lib/firebaseConfig";
import { collection, query, updateDoc, doc, where } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2, ChefHat, Clock, AlertCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { AdminHeader } from "@/components/AdminHeader";
import { PreparationTimer } from "@/components/PreparationTimer";

const STATUS_OPTIONS = [
  { value: "pending", label: "Order Received" },
  { value: "preparing", label: "Preparing" },
  { value: "out_for_delivery", label: "Out for Delivery" },
  { value: "delivered", label: "Delivered" }
];

const STATUS_COLORS = {
  pending: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-900",
  preparing: "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-900",
  out_for_delivery: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-900",
  delivered: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-900",
};

export default function KitchenDashboard() {
  const [user, userLoading] = useAuthState(auth);
  const router = useRouter();

  // Query for all active orders (not delivered)
  const q = query(
    collection(db, "orders"),
    where("status", "!=", "delivered")
  );
  
  const [snapshot, loading, error] = useCollection(q);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    if (!userLoading) {
      if (!user || user.email?.trim().toLowerCase() !== "1234sample@sample.com") {
        toast.error("Unauthorized admin access. Redirecting to home.");
        router.push("/");
      }
    }
  }, [user, userLoading, router]);

  if (userLoading || loading) {
    return (
      <div className="min-h-screen bg-muted/20 flex flex-col items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground font-medium">Loading Kitchen Dashboard...</p>
      </div>
    );
  }

  if (!user || user.email?.trim().toLowerCase() !== "1234sample@sample.com") return null; // Wait for redirect

  const orders = snapshot?.docs.map(doc => ({ id: doc.id, ...doc.data() })) || [];
  
  // Sort by createdAt client-side since Firestore requires a composite index for where+orderBy
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sortedOrders = [...orders].sort((a: any, b: any) => {
    const timeA = a.createdAt?.toMillis() || 0;
    const timeB = b.createdAt?.toMillis() || 0;
    return timeA - timeB; // Oldest first
  });

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setUpdatingId(orderId);
    try {
      await updateDoc(doc(db, "orders", orderId), {
        status: newStatus
      });
      toast.success("Order status updated!");
    } catch (err: unknown) {
      toast.error("Failed to update order", { description: err instanceof Error ? err.message : "Unknown error" });
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-muted/10 pb-20">
      <AdminHeader userEmail={user.email || ''} />

      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight">Active Orders</h1>
          <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-bold flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            Live Updates
          </div>
        </div>

        {error && (
          <div className="bg-destructive/10 text-destructive p-4 rounded-xl flex items-center gap-3 mb-6">
            <AlertCircle className="h-5 w-5" />
            <p className="font-medium">Failed to load orders: {error.message}</p>
          </div>
        )}

        {sortedOrders.length === 0 ? (
          <div className="bg-card border border-dashed rounded-2xl p-12 text-center shadow-sm">
            <ChefHat className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-30" />
            <h3 className="text-2xl font-bold text-muted-foreground mb-2">No Active Orders</h3>
            <p className="text-muted-foreground">The kitchen is clear. Waiting for new hungry customers!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {sortedOrders.map((order: any) => (
              <div key={order.id} className="bg-card border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col">
                {/* Ticket Header */}
                <div className={`p-4 border-b flex justify-between items-start ${STATUS_COLORS[order.status as keyof typeof STATUS_COLORS]}`}>
                  <div>
                    <span className="font-mono font-bold text-lg">#{order.id.slice(0, 6).toUpperCase()}</span>
                    <div className="flex items-center gap-1 mt-1 opacity-80 text-xs font-medium">
                      <Clock className="h-3 w-3" />
                      {order.createdAt ? formatDistanceToNow(order.createdAt.toDate(), { addSuffix: true }) : "Just now"}
                    </div>
                  </div>
                  
                  {/* Status Dropdown */}
                  <div className="relative">
                    {updatingId === order.id ? (
                      <div className="px-3 py-1 rounded-md bg-background/50 text-xs font-medium flex items-center gap-2">
                        <Loader2 className="h-3 w-3 animate-spin" /> Updating
                      </div>
                    ) : (
                      <select 
                        className="appearance-none bg-background/60 backdrop-blur border-none text-sm font-bold rounded-lg px-3 py-1.5 pr-8 focus:ring-2 focus:ring-primary/50 cursor-pointer shadow-sm"
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                        style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.25rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}
                      >
                        {STATUS_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value} className="text-foreground bg-background">{opt.label}</option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>

                {/* Ticket Body */}
                <div className="p-4 flex-1 flex flex-col">
                  <div className="text-sm font-medium text-muted-foreground mb-3 pb-3 border-b space-y-1">
                    <div>Customer: <span className="text-foreground">{order.userEmail}</span></div>
                    {order.address && (
                      <div className="flex items-start gap-1.5 mt-2 text-xs bg-muted/30 p-2 rounded-md">
                        <span className="shrink-0">📍</span>
                        <span className="text-foreground/80 leading-snug">{order.address}</span>
                      </div>
                    )}
                    
                    <PreparationTimer 
                      createdAt={order.createdAt} 
                      estimatedTimeMinutes={order.estimated_time || 30} 
                      size="sm" 
                    />
                  </div>
                  
                  <div className="space-y-3 mb-4 flex-1">
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {order.items.map((item: any, i: number) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className="bg-primary/10 text-primary font-bold px-2 py-0.5 rounded text-xs min-w-[1.5rem] text-center">
                          {item.quantity}x
                        </span>
                        <span className="font-medium text-sm leading-tight">{item.name}</span>
                      </div>
                    ))}
                  </div>

                  {/* Total */}
                  <div className="pt-3 border-t mt-auto flex justify-between items-center">
                    <span className="text-sm text-muted-foreground font-medium">Total</span>
                    <span className="font-extrabold text-lg">₹{order.total?.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

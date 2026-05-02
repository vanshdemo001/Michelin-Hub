"use client";

import { useDocumentData } from "react-firebase-hooks/firestore";
import { doc } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";
import { useParams } from "next/navigation";
import { GlobalNavigation } from "@/components/GlobalNavigation";
import { PreparationTimer } from "@/components/PreparationTimer";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { CheckCircle2, Clock, Truck, Home, Loader2, Package } from "lucide-react";
import { format } from "date-fns";
import Image from "next/image";

const STAGES = [
  { id: "pending", label: "Order Received", icon: Clock },
  { id: "preparing", label: "Preparing", icon: Package },
  { id: "out_for_delivery", label: "Out for Delivery", icon: Truck },
  { id: "delivered", label: "Delivered", icon: Home }
];

export default function OrderTrackingPage() {
  const params = useParams();
  const orderId = params.id as string;
  const [order, loading, error] = useDocumentData(doc(db, "orders", orderId));
  const prevStatusRef = useRef<string | null>(null);

  useEffect(() => {
    if (order?.status && prevStatusRef.current !== order.status) {
      if (order.status === "out_for_delivery") {
        toast("🚀 Out for Delivery!", {
          description: "Your food is on its way. Keep an eye on the map!",
          duration: 5000,
        });
      } else if (order.status === "delivered") {
        toast.success("Order Delivered!", {
          description: "Enjoy your crispy meal!",
          duration: 5000,
        });
      }
      prevStatusRef.current = order.status;
    }
  }, [order?.status]);

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/20 flex flex-col items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground font-medium">Loading tracking data...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-muted/20">
        <GlobalNavigation />
        <div className="container mx-auto px-4 py-16 text-center">
          <h2 className="text-2xl font-bold text-destructive">Order Not Found</h2>
          <p className="text-muted-foreground mt-2">We couldn&apos;t find the tracking details for this order.</p>
        </div>
      </div>
    );
  }

  const currentStageIndex = STAGES.findIndex(s => s.id === order.status);
  
  return (
    <div className="min-h-screen bg-muted/20 pb-20">
      <GlobalNavigation />
      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Track Your Order</h1>
            <div className="flex items-center gap-3 mt-1">
              <p className="text-muted-foreground font-medium">Order #{orderId.slice(0, 8).toUpperCase()}</p>
              {order.paymentStatus === "paid" && (
                <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-0.5 rounded-full dark:bg-green-900/30 dark:text-green-400">
                  Paid via Razorpay
                </span>
              )}
            </div>
          </div>
          {order.createdAt && (
            <div className="bg-card px-4 py-2 rounded-lg border shadow-sm text-sm font-medium">
              Placed at: {format(order.createdAt.toDate(), "h:mm a, MMM do")}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Tracking Status & Stepper */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-card border rounded-2xl p-6 shadow-sm">
              <h2 className="text-xl font-bold mb-8">Delivery Status</h2>
              
              <div className="relative">
                {/* Progress Line */}
                <div className="absolute top-6 left-[10%] right-[10%] h-1 bg-muted rounded-full -z-10" />
                <div 
                  className="absolute top-6 left-[10%] h-1 bg-primary rounded-full -z-10 transition-all duration-500"
                  style={{ width: `${(Math.max(0, currentStageIndex) / (STAGES.length - 1)) * 80}%` }}
                />

                <div className="flex justify-between relative z-0">
                  {STAGES.map((stage, index) => {
                    const isCompleted = index <= currentStageIndex;
                    const isCurrent = index === currentStageIndex;
                    const Icon = stage.icon;
                    
                    return (
                      <div key={stage.id} className="flex flex-col items-center w-1/4">
                        <div 
                          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                            isCurrent ? "bg-primary text-primary-foreground scale-110 shadow-lg shadow-primary/30" 
                            : isCompleted ? "bg-primary text-primary-foreground" 
                            : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {isCompleted && !isCurrent ? <CheckCircle2 className="w-6 h-6" /> : <Icon className="w-6 h-6" />}
                        </div>
                        <p className={`mt-3 text-sm font-bold text-center ${isCurrent ? "text-primary" : isCompleted ? "text-foreground" : "text-muted-foreground"}`}>
                          {stage.label}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Timer Integration */}
            <div className="bg-card border rounded-2xl p-2 shadow-sm h-[400px]">
              <PreparationTimer createdAt={order.createdAt} estimatedTimeMinutes={order.estimated_time} />
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-card border rounded-2xl p-6 shadow-sm sticky top-24">
              <h3 className="text-xl font-bold mb-4">Order Details</h3>
              <div className="space-y-4 mb-6">
                {order.items.map((item: { name: string; quantity: number; price: number; image: string }, i: number) => (
                  <div key={i} className="flex gap-3 items-center">
                    <div className="relative w-12 h-12 bg-muted rounded-md overflow-hidden flex-shrink-0">
                      <Image src={item.image} alt={item.name} fill className="object-cover" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm leading-tight">{item.name}</h4>
                      <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm">₹{(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between items-center text-sm text-muted-foreground">
                  <span>Subtotal</span>
                  <span>₹{order.subtotal?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-sm text-muted-foreground">
                  <span>Taxes & Fees</span>
                  <span>₹{order.tax?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-lg font-extrabold pt-2">
                  <span>Total</span>
                  <span className="text-primary">₹{order.total?.toFixed(2)}</span>
                </div>
              </div>
              
              {order.address && (
                <div className="border-t mt-6 pt-6">
                  <h4 className="text-sm font-bold mb-2 flex items-center gap-2">
                    <Home className="w-4 h-4 text-muted-foreground" />
                    Delivery Address
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {order.address}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

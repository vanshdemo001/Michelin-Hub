"use client";

import { useEffect, useState, use } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";
import { useRouter } from "next/navigation";
import { GlobalNavigation } from "@/components/GlobalNavigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, CreditCard, ShieldCheck } from "lucide-react";
import { useRazorpay } from "react-razorpay";
import { createRazorpayOrder } from "@/lib/PaymentService";

interface PaymentPageProps {
  params: Promise<{ id: string }>;
}

export default function PaymentPage({ params }: PaymentPageProps) {
  // Use React.use() to unwrap the params Promise in Next.js 15
  const unwrappedParams = use(params);
  const orderId = unwrappedParams.id;
  const router = useRouter();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const { Razorpay } = useRazorpay();

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const orderDoc = await getDoc(doc(db, "orders", orderId));
        if (orderDoc.exists()) {
          setOrder(orderDoc.data());
          // If already paid, redirect to tracking
          if (orderDoc.data().paymentStatus === "paid") {
            router.replace(`/order-tracking/${orderId}`);
          }
        } else {
          toast.error("Order not found.");
          router.replace("/");
        }
      } catch (error) {
        console.error("Error fetching order:", error);
        toast.error("Failed to load order details.");
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [orderId, router]);

  const handlePayment = async () => {
    if (!order) return;
    setIsProcessing(true);

    try {
      const razorpayOrder = await createRazorpayOrder(order.total, orderId);

      if (!razorpayOrder.success) {
        throw new Error(razorpayOrder.error || "Failed to initialize payment");
      }

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "",
        amount: Number(razorpayOrder.amount),
        currency: String(razorpayOrder.currency) as "INR" | "USD" | "EUR",
        name: "Michelin Hub",
        description: "Delicious Food Order",
        order_id: String(razorpayOrder.orderId),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        handler: async function (response: any) {
          try {
            await updateDoc(doc(db, "orders", orderId), {
              paymentStatus: "paid",
              razorpayPaymentId: response.razorpay_payment_id || "unknown",
              razorpayOrderId: response.razorpay_order_id || razorpayOrder.orderId,
              razorpaySignature: response.razorpay_signature || "unknown"
            });

            toast.success("Payment Successful!", {
              description: "Your order is confirmed."
            });
            router.replace(`/order-tracking/${orderId}`);
          } catch (err: unknown) {
            toast.error("Failed to update order status", {
              description: err instanceof Error ? err.message : "Unknown error"
            });
            setIsProcessing(false);
          }
        },
        prefill: {
          name: order.userEmail?.split('@')[0] || "Customer",
          email: order.userEmail || "",
          contact: "9999999999" // Dummy
        },
        theme: {
          color: "#ef4444", // Primary color (red)
        },
      };

      const rzp = new Razorpay(options);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      rzp.on("payment.failed", function (response: any) {
        toast.error("Payment Failed", {
          description: response.error.description
        });
        setIsProcessing(false);
      });
      rzp.open();

    } catch (error: unknown) {
      toast.error("Payment setup failed.", {
        description: error instanceof Error ? error.message : "Unknown error occurred"
      });
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/20 flex flex-col items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground font-medium">Loading payment details...</p>
      </div>
    );
  }

  if (!order) return null;

  return (
    <div className="min-h-screen bg-muted/20 pb-20 flex flex-col">
      <GlobalNavigation />
      
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-card rounded-2xl shadow-xl border overflow-hidden animate-in fade-in zoom-in-95 duration-300">
          <div className="p-8 text-center bg-primary text-primary-foreground relative overflow-hidden">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,white_0%,transparent_100%)]" />
            <h1 className="text-2xl font-bold relative z-10">Complete Payment</h1>
            <p className="opacity-90 mt-1 relative z-10 text-sm">Order #{orderId.slice(0, 8).toUpperCase()}</p>
          </div>
          
          <div className="p-8">
            <div className="flex justify-between items-center py-4 border-b">
              <span className="text-muted-foreground font-medium">Total Amount</span>
              <span className="text-3xl font-extrabold text-primary">₹{order.total.toFixed(2)}</span>
            </div>
            
            <div className="flex items-center gap-2 mt-6 mb-8 text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg">
              <ShieldCheck className="h-5 w-5 text-green-500" />
              <span>100% Secure payments via Razorpay</span>
            </div>

            <Button 
              onClick={handlePayment} 
              disabled={isProcessing}
              className="w-full h-14 text-lg font-bold shadow-lg hover:shadow-xl transition-all"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 h-5 w-5" />
                  Pay Now
                </>
              )}
            </Button>
            
            <div className="mt-6 text-center">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => router.back()}
                disabled={isProcessing}
                className="text-muted-foreground"
              >
                Cancel and return
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

"use client";

import { useCartStore } from "@/store/useCartStore";
import { GlobalNavigation } from "@/components/GlobalNavigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "@/lib/firebaseConfig";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useState } from "react";
import { Loader2 } from "lucide-react";

export default function CheckoutPage() {
  const { items, subtotal, clearCart, totalItems } = useCartStore();
  const [user] = useAuthState(auth);
  const router = useRouter();
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [address, setAddress] = useState({
    street: "",
    apt: "",
    city: "",
    zip: "",
  });

  const tax = subtotal * 0.05;
  const grandTotal = subtotal + tax;

  const handlePlaceOrder = async () => {
    if (!user) {
      toast.error("Please log in to place an order.");
      return;
    }
    if (items.length === 0) {
      toast.error("Your cart is empty.");
      return;
    }
    if (!address.street || !address.city || !address.zip) {
      toast.error("Please fill out your complete delivery address.");
      return;
    }

    setIsPlacingOrder(true);
    try {
      const fullAddress = `${address.street}${address.apt ? ` ${address.apt}` : ""}, ${address.city}, ${address.zip}`;

      // 1. Create a pending order in Firestore first
      const orderData = {
        userId: user.uid,
        userEmail: user.email,
        items: items,
        subtotal: subtotal,
        tax: tax,
        total: grandTotal,
        address: fullAddress,
        status: "pending", // Will update to 'paid' after successful payment
        paymentStatus: "pending",
        estimated_time: 30,
        createdAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, "orders"), orderData);
      
      clearCart();
      toast.success("Order Created!", {
        description: "Redirecting to payment..."
      });
      router.push(`/payment/${docRef.id}`);

    } catch (error: unknown) {
      toast.error("Failed to place order.", {
        description: error instanceof Error ? error.message : "Unknown error occurred"
      });
      setIsPlacingOrder(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/20 pb-20">
      <GlobalNavigation />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-4xl font-extrabold mb-8 tracking-tight">Checkout</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            <div className="bg-card border rounded-2xl p-6 shadow-sm">
              <h2 className="text-2xl font-bold mb-4">Order Summary</h2>
              
              {items.length === 0 ? (
                <div className="text-muted-foreground py-8 text-center">
                  Your cart is empty. Go add some delicious food!
                  <div className="mt-4">
                    <Button onClick={() => router.push("/")}>Back to Menu</Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {items.map((item) => (
                    <div key={item.id} className="flex gap-4 p-4 bg-muted/30 border rounded-xl items-center">
                      <div className="relative w-16 h-16 bg-muted rounded-md overflow-hidden flex-shrink-0">
                        <Image src={item.image} alt={item.name} fill className="object-cover" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-lg leading-tight">{item.name}</h4>
                        <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">₹{(item.price * item.quantity).toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="bg-card border rounded-2xl p-6 shadow-sm">
              <h2 className="text-2xl font-bold mb-4">Delivery Details</h2>
              {user ? (
                <div className="space-y-4">
                  <div className="text-muted-foreground pb-4 border-b">
                    <p>Ordering as: <strong>{user.email}</strong></p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="text-sm font-medium mb-1 block">Street Address</label>
                      <input 
                        type="text" 
                        value={address.street}
                        onChange={(e) => setAddress({...address, street: e.target.value})}
                        placeholder="123 Main St" 
                        className="w-full h-10 px-3 rounded-md border bg-background focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-sm font-medium mb-1 block">Apt/Suite (Optional)</label>
                      <input 
                        type="text" 
                        value={address.apt}
                        onChange={(e) => setAddress({...address, apt: e.target.value})}
                        placeholder="Apt 4B" 
                        className="w-full h-10 px-3 rounded-md border bg-background focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">City</label>
                      <input 
                        type="text" 
                        value={address.city}
                        onChange={(e) => setAddress({...address, city: e.target.value})}
                        placeholder="New York" 
                        className="w-full h-10 px-3 rounded-md border bg-background focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">ZIP Code</label>
                      <input 
                        type="text" 
                        value={address.zip}
                        onChange={(e) => setAddress({...address, zip: e.target.value})}
                        placeholder="10001" 
                        className="w-full h-10 px-3 rounded-md border bg-background focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-destructive font-medium p-4 bg-destructive/10 rounded-lg">
                  You must be logged in to place an order. Please log in using the button in the navigation bar.
                </div>
              )}
            </div>
          </div>

          <div className="md:col-span-1">
            <div className="bg-card border rounded-2xl p-6 shadow-sm sticky top-24">
              <h3 className="text-xl font-bold mb-4">Payment Summary</h3>
              <div className="space-y-3 mb-6">
                <div className="flex justify-between items-center text-muted-foreground">
                  <span>Subtotal ({totalItems} items)</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-muted-foreground">
                  <span>GST (5%)</span>
                  <span>₹{tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-muted-foreground">
                  <span>Delivery Fee</span>
                  <span className="text-green-600 font-medium">Free</span>
                </div>
                <div className="border-t pt-3 mt-3">
                  <div className="flex justify-between items-center font-extrabold text-2xl">
                    <span>Total</span>
                    <span className="text-primary">₹{grandTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              
              <Button 
                className="w-full h-14 text-lg font-bold rounded-xl" 
                onClick={handlePlaceOrder}
                disabled={items.length === 0 || !user || isPlacingOrder}
              >
                {isPlacingOrder ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Placing Order...
                  </>
                ) : (
                  "Place Order"
                )}
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

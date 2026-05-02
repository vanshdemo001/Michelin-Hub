"use client";

import { useCartStore } from "@/store/useCartStore";
import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Plus, Minus, Trash2 } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";

export function CartSidebar() {
  const { items, totalItems, subtotal, addItem, decreaseQuantity, removeItem, clearCart } = useCartStore();
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const handleCheckout = () => {
    setOpen(false);
    router.push("/checkout");
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button variant="ghost" size="icon" className="relative" />}>
        <ShoppingCart className="h-6 w-6" />
        {totalItems > 0 && (
          <span className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs bg-primary text-primary-foreground rounded-full">
            {totalItems}
          </span>
        )}
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md flex flex-col h-full bg-background">
        <SheetHeader>
          <SheetTitle className="text-left font-bold text-2xl">Your Order</SheetTitle>
        </SheetHeader>
        
        <div className="flex-1 overflow-y-auto py-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <ShoppingCart className="h-12 w-12 mb-4 opacity-20" />
              <p>Your cart is empty.</p>
              <p className="text-sm">Add some crispy goodness!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="flex gap-4 p-2 bg-card border rounded-lg shadow-sm">
                  <div className="relative w-20 h-20 bg-muted rounded-md overflow-hidden flex-shrink-0">
                    <Image src={item.image} alt={item.name} fill className="object-cover" />
                  </div>
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="font-semibold text-sm line-clamp-2">{item.name}</h4>
                      <p className="text-sm font-bold text-primary">₹{item.price.toFixed(2)}</p>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => decreaseQuantity(item.id)}>
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="text-sm font-medium w-4 text-center">{item.quantity}</span>
                      <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => addItem(item)}>
                        <Plus className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 ml-auto text-destructive hover:text-destructive/90 hover:bg-destructive/10" onClick={() => removeItem(item.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t pt-4 mt-auto">
          <div className="space-y-1 mb-4">
            <div className="flex justify-between items-center text-sm text-muted-foreground">
              <span>Subtotal</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-sm text-muted-foreground">
              <span>GST (5%)</span>
              <span>₹{(subtotal * 0.05).toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-lg font-bold pt-2 border-t mt-2">
              <span>Grand Total</span>
              <span>₹{(subtotal * 1.05).toFixed(2)}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="h-12 px-3" 
              onClick={clearCart} 
              disabled={items.length === 0}
              aria-label="Clear Cart"
            >
              <Trash2 className="h-5 w-5" />
            </Button>
            <Button 
              className="flex-1 font-bold text-lg h-12" 
              disabled={items.length === 0}
              onClick={handleCheckout}
            >
              Go to Checkout
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

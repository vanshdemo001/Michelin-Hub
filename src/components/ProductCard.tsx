"use client";

import { useCartStore, Product } from "@/store/useCartStore";
import { Button } from "./ui/button";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem);

  const handleAdd = () => {
    addItem(product);
    toast.success(`${product.name} added to cart!`);
  };

  return (
    <div className="group bg-card rounded-xl border overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 flex flex-col">
      <div className="relative aspect-square w-full bg-muted overflow-hidden">
        {/* Using Next.js Image for optimization */}
        <Image 
          src={product.image} 
          alt={product.name} 
          fill
          className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-2 left-2 bg-background/90 backdrop-blur text-xs font-bold px-2 py-1 rounded-md shadow-sm">
          🔥 {product.calories} Cal
        </div>
      </div>
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-bold text-lg mb-1 leading-tight">{product.name}</h3>
        <p className="text-muted-foreground text-sm mb-4 line-clamp-2 flex-1">
          Crispy, golden, and delicious. Prepared fresh every day.
        </p>
        
        <div className="flex items-center justify-between mt-auto">
          <span className="font-extrabold text-xl">₹{product.price.toFixed(2)}</span>
          <Button 
            size="sm" 
            onClick={handleAdd}
            className="font-bold rounded-full px-4"
          >
            <Plus className="w-4 h-4 mr-1" /> Add
          </Button>
        </div>
      </div>
    </div>
  );
}

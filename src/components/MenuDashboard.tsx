"use client";

import { useState } from "react";
import { ProductCard } from "./ProductCard";
import { Button } from "./ui/button";
import { collection, doc, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";
import { useCollection } from "react-firebase-hooks/firestore";
import { Product } from "@/store/useCartStore";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const CATEGORIES = ["All", "Buckets", "Burgers", "Sides", "Drinks"];

const MOCK_PRODUCTS = [
  {
    id: "1",
    name: "8-Piece Crispy Bucket",
    price: 899.00,
    image: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=500&q=80",
    calories: 2400,
    category: "Buckets"
  },
  {
    id: "1b",
    name: "12-Piece Family Feast Bucket",
    price: 1199.00,
    image: "https://images.unsplash.com/photo-1569691899455-88464f6d3ab1?w=500&q=80",
    calories: 3600,
    category: "Buckets"
  },
  {
    id: "2",
    name: "Spicy Zinger Burger",
    price: 199.00,
    image: "https://images.unsplash.com/photo-1610440042657-612c34d95e9f?w=500&q=80",
    calories: 550,
    category: "Burgers"
  },
  {
    id: "3",
    name: "Classic Chicken Sandwich",
    price: 149.00,
    image: "https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=500&q=80",
    calories: 480,
    category: "Burgers"
  },
  {
    id: "4",
    name: "Large Seasoned Fries",
    price: 129.00,
    image: "https://images.unsplash.com/photo-1576107232684-1279f390859f?w=500&q=80",
    calories: 380,
    category: "Sides"
  },
  {
    id: "5",
    name: "Creamy Coleslaw",
    price: 99.00,
    image: "https://images.unsplash.com/photo-1625938146369-adc83368bda7?w=500&q=80",
    calories: 170,
    category: "Sides"
  },
  {
    id: "6",
    name: "Refreshing Cola (Large)",
    price: 79.00,
    image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&q=80",
    calories: 210,
    category: "Drinks"
  }
];

export function MenuDashboard() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [snapshot, loading, error] = useCollection(collection(db, "products"));
  const [isSeeding, setIsSeeding] = useState(false);

  const products: Product[] = snapshot?.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as Product)) || [];

  const filteredProducts = activeCategory === "All" 
    ? products 
    : products.filter(p => p.category === activeCategory);

  const handleSeedData = async () => {
    setIsSeeding(true);
    try {
      const batch = writeBatch(db);
      MOCK_PRODUCTS.forEach((product) => {
        const docRef = doc(collection(db, "products"), product.id);
        batch.set(docRef, product);
      });
      await batch.commit();
      toast.success("Successfully seeded products to Firestore!");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to seed data.");
    } finally {
      setIsSeeding(false);
    }
  };

  if (error) {
    return <div className="text-center py-12 text-red-500">Error loading products: {error.message}</div>;
  }

  return (
    <div className="w-full">
      {/* Category Filter */}
      <div className="sticky top-16 z-40 bg-background/95 backdrop-blur py-4 border-b">
        <div className="container mx-auto px-4 overflow-x-auto no-scrollbar">
          <div className="flex gap-2 min-w-max">
            {CATEGORIES.map(category => (
              <Button
                key={category}
                variant={activeCategory === category ? "default" : "outline"}
                className="rounded-full px-6 font-bold"
                onClick={() => setActiveCategory(category)}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Product Grid */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-extrabold">
            {activeCategory === "All" ? "Full Menu" : activeCategory}
          </h2>
          {!loading && (
            <Button onClick={handleSeedData} disabled={isSeeding} variant="outline" size="sm">
              {isSeeding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Seed Initial Data
            </Button>
          )}
        </div>
        
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-80 bg-muted animate-pulse rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
        
        {!loading && filteredProducts.length === 0 && products.length > 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No products found for this category.
          </div>
        )}
        
        {!loading && products.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No products available. Please click &quot;Seed Initial Data&quot; to populate Firestore.
          </div>
        )}
      </div>
    </div>
  );
}

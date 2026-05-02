"use client";

import { useAuthState } from "react-firebase-hooks/auth";
import { useCollection } from "react-firebase-hooks/firestore";
import { auth, db } from "@/lib/firebaseConfig";
import { collection, query, orderBy, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2, Plus, Edit, Trash2, LayoutGrid, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AdminHeader } from "@/components/AdminHeader";
import Image from "next/image";

interface Product {
  id?: string;
  name?: string;
  description?: string;
  price?: number;
  category?: string;
  image?: string;
  calories?: number;
  time?: string;
  popular?: boolean;
}

// Simple Modal Component
function ProductModal({ 
  isOpen, 
  onClose, 
  product, 
  onSave 
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  product: Product | null, 
  onSave: (data: Product) => Promise<void> 
}) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "Burgers",
    image: "",
    calories: "",
    time: "10-15 min",
    popular: false
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || "",
        description: product.description || "",
        price: product.price?.toString() || "",
        category: product.category || "Burgers",
        image: product.image || "",
        calories: product.calories?.toString() || "",
        time: product.time || "10-15 min",
        popular: product.popular || false
      });
    } else {
      setFormData({
        name: "",
        description: "",
        price: "",
        category: "Burgers",
        image: "",
        calories: "",
        time: "10-15 min",
        popular: false
      });
    }
  }, [product, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave({
        ...formData,
        price: parseFloat(formData.price) || 0,
        calories: parseInt(formData.calories) || 0,
      });
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="bg-card w-full max-w-lg rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold">{product ? "Edit Product" : "Add New Product"}</h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <label className="text-sm font-medium mb-1 block">Name</label>
            <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full h-10 px-3 rounded-md border bg-background focus:ring-2 outline-none" />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Description</label>
            <textarea required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full p-3 rounded-md border bg-background min-h-[80px] focus:ring-2 outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Price ($)</label>
              <input required type="number" step="0.01" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full h-10 px-3 rounded-md border bg-background focus:ring-2 outline-none" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Category</label>
              <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full h-10 px-3 rounded-md border bg-background focus:ring-2 outline-none">
                <option value="Buckets">Buckets</option>
                <option value="Burgers">Burgers</option>
                <option value="Sides">Sides</option>
                <option value="Drinks">Drinks</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Calories</label>
              <input type="number" value={formData.calories} onChange={e => setFormData({...formData, calories: e.target.value})} className="w-full h-10 px-3 rounded-md border bg-background focus:ring-2 outline-none" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Prep Time</label>
              <input type="text" value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} className="w-full h-10 px-3 rounded-md border bg-background focus:ring-2 outline-none" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Image URL</label>
            <input required type="url" value={formData.image} onChange={e => setFormData({...formData, image: e.target.value})} placeholder="https://..." className="w-full h-10 px-3 rounded-md border bg-background focus:ring-2 outline-none" />
          </div>
          <div className="flex items-center gap-2 pt-2">
            <input type="checkbox" id="popular" checked={formData.popular} onChange={e => setFormData({...formData, popular: e.target.checked})} className="w-4 h-4 rounded border-gray-300" />
            <label htmlFor="popular" className="text-sm font-medium cursor-pointer">Mark as Popular (Fire Icon)</label>
          </div>
        </form>
        <div className="p-4 border-t bg-muted/30 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSaving}>Cancel</Button>
          <Button type="button" onClick={handleSubmit} disabled={isSaving}>
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            {product ? "Save Changes" : "Create Product"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function MenuManagement() {
  const [user, userLoading] = useAuthState(auth);
  const router = useRouter();

  const q = query(collection(db, "products"), orderBy("category"));
  const [snapshot, loading, error] = useCollection(q);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

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
        <p className="mt-4 text-muted-foreground font-medium">Loading Menu Management...</p>
      </div>
    );
  }

  if (!user || user.email?.trim().toLowerCase() !== "1234sample@sample.com") return null;

  const products = snapshot?.docs.map(doc => ({ id: doc.id, ...doc.data() })) || [];

  const handleSaveProduct = async (data: Product) => {
    try {
      if (editingProduct && editingProduct.id) {
        await updateDoc(doc(db, "products", editingProduct.id), data as { [x: string]: unknown });
        toast.success("Product updated successfully!");
      } else {
        await addDoc(collection(db, "products"), data);
        toast.success("New product added to menu!");
      }
    } catch (err: unknown) {
      toast.error("Failed to save product", { description: err instanceof Error ? err.message : "Unknown error" });
      throw err;
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Are you absolutely sure you want to delete "${name}"? This will remove it from the live menu immediately.`)) {
      try {
        await deleteDoc(doc(db, "products", id));
        toast.success("Product deleted.");
      } catch (err: unknown) {
        toast.error("Failed to delete", { description: err instanceof Error ? err.message : "Unknown error" });
      }
    }
  };

  const openAddModal = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-muted/10 pb-20">
      <AdminHeader userEmail={user.email || ''} />

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
              <LayoutGrid className="h-8 w-8 text-primary" />
              Menu Management
            </h1>
            <p className="text-muted-foreground mt-1">Add, edit, or remove items from the live customer menu.</p>
          </div>
          <Button onClick={openAddModal} className="shrink-0 shadow-sm hover:shadow-md transition-all">
            <Plus className="mr-2 h-4 w-4" /> Add New Item
          </Button>
        </div>

        {error && (
          <div className="bg-destructive/10 text-destructive p-4 rounded-xl mb-6 flex items-center gap-2 font-medium">
            Failed to load products: {error.message}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {products.map((product: any) => (
            <div key={product.id} className="bg-card border rounded-2xl overflow-hidden shadow-sm flex flex-col group transition-all hover:shadow-md">
              <div className="relative h-48 w-full bg-muted overflow-hidden">
                {product.image ? (
                  <Image src={product.image} alt={product.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <ImageIcon className="h-10 w-10 text-muted-foreground/30" />
                  </div>
                )}
                <div className="absolute top-2 left-2 bg-background/90 backdrop-blur px-2 py-1 rounded-md text-xs font-bold shadow-sm border border-white/10">
                  {product.category}
                </div>
                {product.popular && (
                  <div className="absolute top-2 right-2 bg-orange-500/90 text-white backdrop-blur px-2 py-1 rounded-md text-xs font-bold shadow-sm">
                    🔥 Popular
                  </div>
                )}
              </div>
              <div className="p-4 flex-1 flex flex-col">
                <div className="flex justify-between items-start gap-2 mb-2">
                  <h3 className="font-bold text-lg leading-tight">{product.name}</h3>
                  <span className="font-extrabold text-primary shrink-0">₹{product.price?.toFixed(2)}</span>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1">{product.description}</p>
                
                <div className="grid grid-cols-2 gap-2 pt-4 border-t mt-auto">
                  <Button variant="outline" size="sm" onClick={() => openEditModal(product)} className="hover:bg-primary/10 hover:text-primary hover:border-primary/50 transition-colors">
                    <Edit className="h-4 w-4 mr-2" /> Edit
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDelete(product.id, product.name)} className="text-destructive hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50 transition-colors">
                    <Trash2 className="h-4 w-4 mr-2" /> Delete
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {products.length === 0 && !error && (
          <div className="text-center py-20 bg-card border border-dashed rounded-2xl shadow-sm">
            <LayoutGrid className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
            <h3 className="text-lg font-bold text-muted-foreground">No menu items found</h3>
            <p className="text-sm text-muted-foreground mt-1 mb-6">Click &quot;Add New Item&quot; to start building your menu.</p>
            <Button onClick={openAddModal}>
              <Plus className="mr-2 h-4 w-4" /> Add New Item
            </Button>
          </div>
        )}
      </main>

      <ProductModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        product={editingProduct}
        onSave={handleSaveProduct}
      />
    </div>
  );
}

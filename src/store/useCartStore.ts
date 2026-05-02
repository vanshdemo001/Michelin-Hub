import { create } from 'zustand';

export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  calories: number;
  category: string;
}

export interface CartItem extends Product {
  quantity: number;
}

interface CartStore {
  items: CartItem[];
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  decreaseQuantity: (productId: string) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
}

export const useCartStore = create<CartStore>((set) => ({
  items: [],
  totalItems: 0,
  subtotal: 0,
  clearCart: () => set({ items: [], totalItems: 0, subtotal: 0 }),
  addItem: (product) => set((state) => {
    const existingItem = state.items.find(item => item.id === product.id);
    let newItems;
    if (existingItem) {
      newItems = state.items.map(item =>
        item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      );
    } else {
      newItems = [...state.items, { ...product, quantity: 1 }];
    }
    return {
      items: newItems,
      totalItems: state.totalItems + 1,
      subtotal: state.subtotal + product.price
    };
  }),
  removeItem: (productId) => set((state) => {
    const itemToRemove = state.items.find(item => item.id === productId);
    if (!itemToRemove) return state;
    return {
      items: state.items.filter(item => item.id !== productId),
      totalItems: state.totalItems - itemToRemove.quantity,
      subtotal: state.subtotal - (itemToRemove.price * itemToRemove.quantity)
    };
  }),
  decreaseQuantity: (productId) => set((state) => {
    const existingItem = state.items.find(item => item.id === productId);
    if (!existingItem) return state;
    if (existingItem.quantity === 1) {
      return {
        items: state.items.filter(item => item.id !== productId),
        totalItems: state.totalItems - 1,
        subtotal: state.subtotal - existingItem.price
      };
    }
    return {
      items: state.items.map(item =>
        item.id === productId ? { ...item, quantity: item.quantity - 1 } : item
      ),
      totalItems: state.totalItems - 1,
      subtotal: state.subtotal - existingItem.price
    };
  })
}));

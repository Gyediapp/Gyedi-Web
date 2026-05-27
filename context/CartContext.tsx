'use client';

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

export interface CartItem {
  id:         string; // listingId
  title:      string;
  price:      number;
  image:      string | null;
  sellerName: string;
  sellerId:   string;
  condition?: string;
}

interface CartCtx {
  items:      CartItem[];
  addItem:    (item: CartItem) => void;
  removeItem: (id: string) => void;
  clearCart:  () => void;
  isInCart:   (id: string) => boolean;
  totalItems: number;
  subtotal:   number;
}

const Ctx = createContext<CartCtx | null>(null);

const KEY = 'gyedi_cart';
function load(): CartItem[]  { try { return JSON.parse(localStorage.getItem(KEY) ?? '[]'); } catch { return []; } }
function save(v: CartItem[]) { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch {} }

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => { setItems(load()); }, []);

  const addItem = useCallback((item: CartItem) => {
    setItems(prev => {
      if (prev.some(i => i.id === item.id)) return prev;
      const next = [...prev, item];
      save(next);
      return next;
    });
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems(prev => { const next = prev.filter(i => i.id !== id); save(next); return next; });
  }, []);

  const clearCart = useCallback(() => { setItems([]); save([]); }, []);
  const isInCart  = useCallback((id: string) => items.some(i => i.id === id), [items]);

  return (
    <Ctx.Provider value={{
      items,
      addItem,
      removeItem,
      clearCart,
      isInCart,
      totalItems: items.length,
      subtotal:   items.reduce((s, i) => s + i.price, 0),
    }}>
      {children}
    </Ctx.Provider>
  );
}

export function useCart() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}

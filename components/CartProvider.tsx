"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type PhotoShape = "square" | "rounded" | "circle" | "heart";

export interface UploadedPhoto {
  id: string;
  url: string; // the photo actually shown/printed — cropped version if the customer cropped it, otherwise same as originalUrl
  x: number;
  y: number;
  size: number; // percent, e.g. 100 = 100%
  // NEW FEATURE: crop / shape / flip / rotate, all optional so carts saved
  // before this update still read back correctly (older items just fall
  // back to square, uncropped, unflipped, unrotated).
  originalUrl?: string; // the untouched upload, kept so "Recadrer" can restart from scratch
  cropped?: boolean;
  shape?: PhotoShape;
  flipH?: boolean;
  flipV?: boolean;
  rotate?: number; // degrees, 0/90/180/270
}

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  image: string;
  price: number;
  color: string | null;
  size: string | null;
  qty: number;
  // Flattened composite image (product + positioned photos + positioned
  // text) captured at add-to-cart time, so the cart shows exactly what
  // will be printed. Base64 data URL; null if capture failed or nothing
  // was customized.
  finalPreview: string | null;
  // Personalization captured from the product page, if any. A product
  // can carry several customer photos (e.g. a 3-piece set), each with
  // its own position and size.
  uploadedPhotos: UploadedPhoto[];
  // Legacy single-photo fields, kept so carts saved before the
  // multi-photo update still read back correctly.
  uploadedPhotoUrl: string | null;
  photoSize: number | null;
  photoPos: { x: number; y: number } | null;
  customText: string | null;
  selectedFont: string | null;
  selectedFontName: string | null;
  textColor: string | null;
  textPosition: string | null;
  textSize: number | null;
  textPos: { x: number; y: number } | null;
}

type CustomizationKeys =
  | "finalPreview"
  | "uploadedPhotos"
  | "uploadedPhotoUrl"
  | "photoSize"
  | "photoPos"
  | "customText"
  | "selectedFont"
  | "selectedFontName"
  | "textColor"
  | "textPosition"
  | "textSize"
  | "textPos";

type NewCartItem = Omit<CartItem, "id" | "qty" | CustomizationKeys> &
  Partial<Pick<CartItem, CustomizationKeys>>;

interface CartContextValue {
  items: CartItem[];
  addToCart: (item: NewCartItem, qty: number) => void;
  updateQty: (id: string, qty: number) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  totalCount: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "boldtouch_cart";
const LEGACY_STORAGE_KEY = "bt-cart";

const CUSTOMIZATION_DEFAULTS = {
  finalPreview: null,
  uploadedPhotos: [] as UploadedPhoto[],
  uploadedPhotoUrl: null,
  photoSize: null,
  photoPos: null,
  customText: null,
  selectedFont: null,
  selectedFontName: null,
  textColor: null,
  textPosition: null,
  textSize: null,
  textPos: null,
} as const;

// Customized items (photo/text) are never merged with another line —
// each personalization is unique to that order.
function lineId(
  productId: string,
  color: string | null,
  size: string | null,
  customized: boolean
) {
  if (customized) {
    return `${productId}__custom__${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  }
  return `${productId}__${color ?? "-"}__${size ?? "-"}`;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored =
        window.localStorage.getItem(STORAGE_KEY) ||
        window.localStorage.getItem(LEGACY_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setItems(parsed.map((l) => ({ ...CUSTOMIZATION_DEFAULTS, ...l })));
        }
      }
    } catch {
      /* ignore */
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* ignore */
    }
  }, [items, hydrated]);

  const addToCart = useCallback((item: NewCartItem, qty: number) => {
    const customized = Boolean(
      (item.uploadedPhotos && item.uploadedPhotos.length > 0) ||
        item.uploadedPhotoUrl ||
        item.customText
    );
    const id = lineId(item.productId, item.color, item.size, customized);
    const full: CartItem = {
      ...CUSTOMIZATION_DEFAULTS,
      ...item,
      id,
      qty,
    };
    setItems((prev) => {
      if (!customized) {
        const existing = prev.find((l) => l.id === id);
        if (existing) {
          return prev.map((l) => (l.id === id ? { ...l, qty: l.qty + qty } : l));
        }
      }
      return [...prev, full];
    });
  }, []);

  const updateQty = useCallback((id: string, qty: number) => {
    setItems((prev) =>
      qty <= 0
        ? prev.filter((l) => l.id !== id)
        : prev.map((l) => (l.id === id ? { ...l, qty } : l))
    );
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((l) => l.id !== id));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const totalCount = useMemo(
    () => items.reduce((sum, l) => sum + l.qty, 0),
    [items]
  );
  const totalPrice = useMemo(
    () => items.reduce((sum, l) => sum + l.qty * l.price, 0),
    [items]
  );

  const value = useMemo(
    () => ({
      items,
      addToCart,
      updateQty,
      removeItem,
      clearCart,
      totalCount,
      totalPrice,
    }),
    [items, addToCart, updateQty, removeItem, clearCart, totalCount, totalPrice]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return ctx;
}

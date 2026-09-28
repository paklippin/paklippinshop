import type { Product } from '@/components/shop/ProductCard';

export const FALLBACK_PRODUCTS: Product[] = [
  { id: 1, name: 'Wireless Headphones', category: 'Electronics', price: 2500, originalPrice: 3000, rating: 4.5, reviews: 128, badge: 'Sale', emoji: '🎧' },
  { id: 2, name: 'Smart Watch Pro',     category: 'Electronics', price: 8999, originalPrice: 12000, rating: 4.8, reviews: 256, badge: 'New',  emoji: '⌚' },
  { id: 3, name: 'Premium T-Shirt',     category: 'Clothing',    price: 1299, originalPrice: 1500, rating: 4.3, reviews: 89,  badge: '',     emoji: '👕' },
  { id: 4, name: 'Running Shoes',       category: 'Sports',      price: 4599, originalPrice: 5500, rating: 4.7, reviews: 167, badge: 'Hot',  emoji: '👟' },
  { id: 5, name: 'Bluetooth Speaker',   category: 'Electronics', price: 3499, originalPrice: 4000, rating: 4.4, reviews: 203, badge: '',     emoji: '🔊' },
  { id: 6, name: 'Backpack Pro',        category: 'Accessories', price: 2199, originalPrice: 2500, rating: 4.6, reviews: 145, badge: 'New',  emoji: '🎒' },
  { id: 7, name: 'Skincare Set',        category: 'Beauty',      price: 1899, originalPrice: 2200, rating: 4.2, reviews: 98,  badge: '',     emoji: '💄' },
  { id: 8, name: 'Gaming Mouse',        category: 'Electronics', price: 1799, originalPrice: 2000, rating: 4.5, reviews: 312, badge: 'Sale', emoji: '🖱️' },
];

function normalize(raw: any, idx: number): Product {
  const price         = Number(raw.price ?? raw.sale_price ?? 0);
  const originalPrice = Number(raw.originalPrice ?? raw.original_price ?? raw.old_price ?? raw.compare_price ?? price);
  return {
    id:            Number(raw.id ?? idx + 1),
    name:          String(raw.name ?? 'Unnamed'),
    category:      String(raw.category ?? raw.category_id ?? 'General'),
    price,
    originalPrice: originalPrice > price ? originalPrice : price,
    rating:        Number(raw.rating ?? 4.5),
    reviews:       Number(raw.reviews ?? 0),
    badge:         String(raw.badge ?? ''),
    emoji:         String(raw.emoji ?? '📦'),
    imageUrl:      String(raw.imageUrl ?? raw.image_url ?? ''),
  };
}

/**
 * Fetch products from our OWN Next.js API route.
 * Always uses a RELATIVE url — never cross-origin, never CORS-blocked.
 */
export async function fetchProducts(): Promise<Product[]> {
  try {
    const res = await fetch('/api/products', { cache: 'no-store' });
    if (res.ok) {
      const json = await res.json();
      const list: any[] = Array.isArray(json) ? json : (json.products ?? []);
      if (list.length) {
        console.log('[api] Products from D1:', list.length);
        return list.map(normalize);
      }
    }
  } catch (e) {
    console.warn('[api] fetch failed:', (e as Error).message);
  }

  console.log('[api] Using hardcoded products');
  return FALLBACK_PRODUCTS;
}

export const getProducts = fetchProducts;

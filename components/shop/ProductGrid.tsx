'use client';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import ProductCard, { type Product } from './ProductCard';
import ProductModal from '@/components/ui/ProductModal';
import Toast from '@/components/ui/Toast';
import ProductFilters, { DEFAULT_FILTERS, type FilterState } from './ProductFilters';
import { fetchProducts } from '@/lib/api';

type Props = {
  limit?: number;
  filter?: 'sale' | 'new' | 'all';
  categoryFilter?: string;
};

export default function ProductGrid({ limit, filter = 'all', categoryFilter }: Props) {
  const params = useSearchParams();
  const urlCategory = params?.get('category') || '';
  const activeCategory = categoryFilter || urlCategory;

  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [modalProduct, setModalProduct] = useState<Product | null>(null);
  const [toast, setToast] = useState({ show: false, msg: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts().then((all) => { setAllProducts(all); setLoading(false); });
  }, []);

  const products = useMemo(() => {
    let list = allProducts;

    // Filter: sale
    if (filter === 'sale') list = list.filter((p: any) => String(p.badge || '').toLowerCase() === 'sale');
    // Filter: new
    if (filter === 'new')  list = list.filter((p) => p.badge?.toLowerCase() === 'new');
    // Filter: category
    if (activeCategory) list = list.filter((p) => p.category.toLowerCase() === activeCategory.toLowerCase());

    // Price range
    list = list.filter((p) => p.price >= filters.minPrice && p.price <= filters.maxPrice);

    // Stock
    if (filters.inStockOnly) list = list.filter((p) => (p.stock ?? 999) > 0);

    // Sort
    switch (filters.sort) {
      case 'price-low':  list = [...list].sort((a, b) => a.price - b.price); break;
      case 'price-high': list = [...list].sort((a, b) => b.price - a.price); break;
      case 'rating':     list = [...list].sort((a, b) => (b.rating || 0) - (a.rating || 0)); break;
      case 'name':       list = [...list].sort((a, b) => a.name.localeCompare(b.name)); break;
      case 'newest':
      default:           list = [...list].sort((a, b) => b.id - a.id); break;
    }

    if (limit) list = list.slice(0, limit);
    return list;
  }, [allProducts, filters, filter, activeCategory, limit]);

  const showToast = (msg: string) => {
    setToast({ show: true, msg });
    setTimeout(() => setToast({ show: false, msg: '' }), 2500);
  };

  const addToCart = (id: number) => {
    const p = allProducts.find((x) => x.id === id);
    if (!p) return;
    if ((p.stock ?? 999) <= 0) { showToast('This product is out of stock'); return; }
    try {
      const raw = localStorage.getItem('cart-storage') || '{}';
      const data = JSON.parse(raw);
      const items = data?.state?.items || [];
      const existing = items.find((x: any) => x.id === id);
      const next = existing
        ? items.map((x: any) => x.id === id ? { ...x, quantity: x.quantity + 1 } : x)
        : [...items, { ...p, quantity: 1 }];
      localStorage.setItem('cart-storage', JSON.stringify({ state: { items: next }, version: 0 }));
      window.dispatchEvent(new Event('storage'));
    } catch {}
    showToast('Item added to cart!');
  };

  const toggleWishlist = (id: number) => {
    try {
      const raw = localStorage.getItem('wishlist');
      const ids: number[] = raw ? JSON.parse(raw).map(Number) : [];
      const next = ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id];
      localStorage.setItem('wishlist', JSON.stringify(next));
      window.dispatchEvent(new Event('storage'));
      showToast(ids.includes(id) ? 'Removed from wishlist' : 'Added to wishlist!');
    } catch {}
  };

  if (loading) {
    return <div className="text-center py-16 text-text-secondary text-sm">Loading products...</div>;
  }

  return (
    <>
      <ProductFilters filters={filters} onChange={setFilters} totalResults={products.length} />

      {activeCategory && (
        <div className="mb-4 text-center">
          <p className="text-xs text-text-secondary">
            Category: <strong className="text-brand-accent">{activeCategory}</strong>
            {' · '}
            <a href="/shop" className="text-brand-accent hover:underline">Clear</a>
          </p>
        </div>
      )}

      {products.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-text-secondary mb-4">No products match your filters.</p>
          <button onClick={() => setFilters(DEFAULT_FILTERS)} className="text-brand-accent hover:underline text-sm font-semibold">
            Reset all filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-7">
          {products.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              onOpen={(id) => setModalProduct(products.find((x) => x.id === id) || null)}
              onAdd={addToCart}
              onWish={toggleWishlist}
            />
          ))}
        </div>
      )}

      <ProductModal
        product={modalProduct}
        onClose={() => setModalProduct(null)}
        onAdd={(id) => { addToCart(id); setModalProduct(null); }}
        allProducts={products}
        onOpenProduct={(id) => setModalProduct(products.find((x) => x.id === id) || null)}
      />

      <Toast message={toast.msg} show={toast.show} />
    </>
  );
}
// cache bust 1790620215

// build: 2026-09-28 sale filter v2

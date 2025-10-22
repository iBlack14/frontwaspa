'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface WooCommerceProduct {
  id: number;
  name: string;
  description: string;
  permalink: string;
  price: string;
  images: { src: string }[];
}

// ProductCard Component
function ProductCard({ product }: { product: WooCommerceProduct }) {
  const { data: session } = useSession();

  const checkoutUrl = `https://wazilrest.com/?clear_cart_and_add=${product.id}&email=${encodeURIComponent(
    session?.email ?? ''
  )}`;
  const imageUrl = product.images && product.images.length > 0 ? product.images[0].src : '/images/placeholder-image.jpg';

  return (
    <div className="p-4 border border-zinc-700 rounded-lg shadow-md shadow-cyan-800 bg-zinc-900/50 transition-all duration-300 hover:shadow-cyan-600 hover:scale-105 flex flex-col">
      <div className="flex flex-row items-center gap-4">
        <div className="w-32 h-32 flex-shrink-0 relative">
          <img
            src={imageUrl}
            alt={product.name}
            className="w-full h-full object-contain rounded-md"
            onError={(e) => (e.currentTarget.src = '/images/placeholder-image.jpg')}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/70 to-transparent rounded-md"></div>
        </div>
        <div className="flex-1 grid grid-cols-3 gap-2 items-center">
          <div className="flex flex-col">
            <span className="text-xs text-zinc-400 font-semibold">Nombre</span>
            <span className="text-md font-bold text-white truncate">{product.name}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-zinc-400 font-semibold">Precio</span>
            <span className="text-md font-semibold text-cyan-400">${product.price}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-zinc-400 font-semibold">Acción</span>
            <a
              href={checkoutUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 bg-cyan-600 text-white px-3 py-1 rounded-lg hover:bg-cyan-700 transition-all duration-200 text-center font-medium"
            >
              Comprar
            </a>
          </div>
        </div>
      </div>
      <div className="text-xs text-zinc-400 mt-2 line-clamp-2">{product.description}</div>
    </div>
  );
}

interface SidebarComponentProps {
  isOpen: boolean;
  onToggle: () => void;
  initialFilter: 'all' | 'plan' | 'no-plan';
}

export default function SidebarComponent({ isOpen, onToggle }: SidebarComponentProps) {
  const [products, setProducts] = useState<WooCommerceProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch products when sidebar opens
  useEffect(() => {
    if (!isOpen) return;

    const fetchProducts = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/woocommerce', {
          headers: {
            'Content-Type': 'application/json',
          },
        });
        if (!res.ok) {
          throw new Error(`Error fetching products: ${res.status}`);
        }
        const data = await res.json();
        const transformedProducts = data.map((item: any) => ({
          id: item.id,
          name: item.name,
          description: item.description.replace(/<[^>]+>/g, ''),
          permalink: item.permalink,
          price: item.price,
          images: item.images || [],
        }));
        setProducts(transformedProducts);
      } catch (err: any) {
        setError(err.message || 'Error al cargar productos.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [isOpen]);

  return (
    <div
      className={`fixed top-0 right-0 h-full w-xl bg-zinc-900/95 backdrop-blur-md p-8 shadow-lg transform transition-transform duration-500 ease-in-out ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      } overflow-y-auto`}
      onMouseLeave={() => isOpen && onToggle()}
    >
      <button
        onClick={onToggle}
        className="absolute top-4 right-4 text-zinc-300 hover:text-white transition-colors"
      >
        <svg
          className="w-8 h-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      <h2 className="text-2xl font-bold text-white mb-6 tracking-tight">Productos Disponibles</h2>

      {isLoading ? (
        <p className="text-zinc-400">Cargando productos...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : products.length > 0 ? (
        <div className="space-y-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <p className="text-zinc-400">No hay productos disponibles.</p>
      )}
    </div>
  );
}

import { useAuth } from "@/features/auth/useAuth";
import { useEffect, useState } from "react";
import { getProducts } from "@/features/products/productService";
import { Card } from "@/shared/components/Card";
import { Button } from "@/shared/components/Button";
import { ProductResponseDto } from "@/shared/types/api";

const placeholder = "https://placehold.co/400x300?text=No+Image";

export function AdminProductsPage() {
  const { token } = useAuth();
  const [products, setProducts] = useState<ProductResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  async function fetchProducts(currentPage: number) {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const result = await getProducts({ pageNumber: currentPage }, token);
      setProducts(result.items);
      setTotalPages(result.totalPages);
    } catch (e: any) {
      setError(e.message || "Failed to load products");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchProducts(page);
  }, [page, token]);

  return (
    <div className="space-y-6">
      <h1 className="text-headline-large font-bold text-on-surface">Products</h1>
      <p className="text-body-large text-outline-variant">Manage product catalog.</p>

      {loading && products.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary-600 border-t-transparent"></div>
        </div>
      ) : error ? (
        <div className="p-4 rounded-md bg-error-container text-on-error-container">{error}</div>
      ) : products.length === 0 ? (
        <div className="p-8 text-center text-body-medium text-outline-variant">No products found.</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((product) => (
              <Card key={product.id} className="p-4">
                <img src={product.images?.[0]?.imageUrl ?? placeholder} alt={product.name} className="w-full h-32 object-cover rounded mb-2" />
                <h3 className="font-medium text-on-surface mb-1 line-clamp-2">{product.name}</h3>
                <p className="text-body-small text-outline-variant">{product.sku} · Stock: {product.stockQuantity}</p>
                <p className="text-body-medium font-medium text-on-surface">${product.price.toFixed(2)}</p>
              </Card>
            ))}
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <Button
                variant="outlined"
                size="small"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <span className="text-body-medium text-on-surface">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outlined"
                size="small"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default AdminProductsPage;

import { useState, useEffect } from "react";
import { useAuth } from "@/features/auth/useAuth";
import { getProducts } from "@/features/products/productService";
import { ProductResponseDto, ProductFilterRequestDto } from "@/shared/types/api";

export interface ProductFilterState {
  searchTerm: string;
  categoryId: number | null;
  minPrice: number;
  maxPrice: number;
  inStock: boolean;
  sortBy: string;
  pageNumber: number;
  pageSize: number;
}

export interface UseProductsReturn {
  products: ProductResponseDto[];
  loading: boolean;
  error: string | null;
  filter: ProductFilterState;
  setFilter: (
    filter:
      | Partial<ProductFilterState>
      | ((prev: ProductFilterState) => ProductFilterState)
  ) => void;
  totalCount: number;
  totalPages: number;
  hasNext: boolean;
}

export function useProducts(initialFilter?: Partial<ProductFilterState>): UseProductsReturn {
  const [filter, setFilterState] = useState<ProductFilterState>({
    searchTerm: initialFilter?.searchTerm ?? "",
    categoryId: initialFilter?.categoryId ?? null,
    minPrice: initialFilter?.minPrice ?? 0,
    maxPrice: initialFilter?.maxPrice ?? 10000,
    inStock: initialFilter?.inStock ?? false,
    sortBy: initialFilter?.sortBy ?? "name",
    pageNumber: initialFilter?.pageNumber ?? 1,
    pageSize: initialFilter?.pageSize ?? 10,
  });
  const [products, setProducts] = useState<ProductResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const { user, isAuthenticated, token } = useAuth();

  useEffect(() => {
    let cancelled = false;

    async function loadProducts() {
      setLoading(true);
      setError(null);
      try {
        const result = await getProducts(filter as ProductFilterRequestDto, token ?? undefined);
        if (!cancelled) {
          setProducts(result.items);
          setTotalCount(result.totalCount);
          setTotalPages(result.totalPages || 1);
          setError(null);
        }
      } catch (e: any) {
        if (!cancelled) {
          setError(e.message || "Failed to load products");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadProducts();

    return () => {
      cancelled = true;
    };
  }, [filter, token]);

  const setFilter = (
    updates: Partial<ProductFilterState> | ((prev: ProductFilterState) => ProductFilterState)
  ) => {
    setFilterState((prev) => {
      if (typeof updates === "function") {
        return (updates as (p: ProductFilterState) => ProductFilterState)(prev);
      }
      return { ...prev, ...updates };
    });
  };

  const hasNext = filter.pageNumber < totalPages;

  return {
    products,
    loading,
    error,
    filter,
    setFilter,
    totalCount,
    totalPages,
    hasNext,
  };
}

import { useEffect, useState } from "react";
import { useProducts } from "@/features/products/useProducts";
import { ProductCard } from "@/features/products/ProductCard";
import { getCategories } from "@/features/categories/categoryService";
import { CategoryResponseDto } from "@/shared/types/api";
import { Card } from "@/shared/components/Card";
import { Button } from "@/shared/components/Button";
import { useSearchParams } from "react-router-dom";

export function ProductsPage() {
  const [searchParams] = useSearchParams();
  const categoryParam = searchParams.get("category");
  const searchParam = searchParams.get("search");

  const {
    products,
    loading,
    error,
    filter,
    setFilter,
    totalCount,
    totalPages,
  } = useProducts({
    categoryId: categoryParam ? Number(categoryParam) : null,
    searchTerm: searchParam ?? "",
  });

  const [selectedView, setSelectedView] = useState<"grid" | "list">("grid");
  const [categories, setCategories] = useState<CategoryResponseDto[]>([]);

  // Categories power the "filter by category" select.
  useEffect(() => {
    let cancelled = false;

    async function loadCategories() {
      try {
        const result = await getCategories();
        if (!cancelled) setCategories(result);
      } catch {
        // The filter still works without the list, so this is not fatal.
      }
    }

    loadCategories();

    return () => {
      cancelled = true;
    };
  }, []);

  // Keep the filter in sync with the ?category= / ?search= query parameters so
  // the category pages can link straight into a filtered product list.
  useEffect(() => {
    setFilter((prev) => {
      const nextCategoryId = categoryParam ? Number(categoryParam) : null;
      const nextSearchTerm = searchParam ?? "";

      if (
        prev.categoryId === nextCategoryId &&
        prev.searchTerm === nextSearchTerm
      ) {
        return prev;
      }

      return {
        ...prev,
        categoryId: nextCategoryId,
        searchTerm: nextSearchTerm,
        pageNumber: 1,
      };
    });
  }, [categoryParam, searchParam]);

  return (
    <div className="min-h-[80vh] bg-surface-bright">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-8 mb-8">
          <Card className="w-full md:w-1/4 p-6">
            <h3 className="text-title-large font-bold text-on-surface mb-4">
              Filters
            </h3>
            <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
              <div className="space-y-2">
                <label className="block text-label-small font-medium text-on-surface-variant">
                  Search
                </label>
                <input
                  type="text"
                  placeholder="Search products..."
                  value={filter.searchTerm}
                  onChange={(e) =>
                    setFilter({ searchTerm: e.target.value, pageNumber: 1 })
                  }
                  className="w-full px-4 py-2 border border-outline rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-label-small font-medium text-on-surface-variant">
                  Category
                </label>
                <select
                  value={filter.categoryId ?? ""}
                  onChange={(e) =>
                    setFilter({
                      categoryId: e.target.value
                        ? parseInt(e.target.value)
                        : null,
                      pageNumber: 1,
                    })
                  }
                  className="w-full px-4 py-2 border border-outline rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">All Categories</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-label-small font-medium text-on-surface-variant">
                  Price Range
                </label>
                <div className="flex gap-2 w-full min-w-0">
                  <input
                    type="number"
                    placeholder="Min"
                    value={filter.minPrice}
                    onChange={(e) =>
                      setFilter({
                        minPrice: e.target.value
                          ? parseFloat(e.target.value)
                          : 0,
                        pageNumber: 1,
                      })
                    }
                    className="flex-1 min-w-0 px-4 py-2 border border-outline rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={filter.maxPrice}
                    onChange={(e) =>
                      setFilter({
                        maxPrice: e.target.value
                          ? parseFloat(e.target.value)
                          : 10000,
                        pageNumber: 1,
                      })
                    }
                    className="flex-1 min-w-0 px-4 py-2 border border-outline rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-label-small font-medium text-on-surface-variant">
                  <input
                    type="checkbox"
                    checked={filter.inStock}
                    onChange={(e) =>
                      setFilter({
                        inStock: e.target.checked,
                        pageNumber: 1,
                      })
                    }
                    className="h-4 w-4 text-primary-600 rounded focus:ring-primary-500"
                  />
                  In Stock Only
                </label>
              </div>

              <div className="space-y-2">
                <label className="block text-label-small font-medium text-on-surface-variant">
                  Sort By
                </label>
                <select
                  value={filter.sortBy}
                  onChange={(e) =>
                    setFilter({ sortBy: e.target.value, pageNumber: 1 })
                  }
                  className="w-full px-4 py-2 border border-outline rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="name">Name (A-Z)</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                </select>
              </div>

              <Button
                variant="filled"
                size="medium"
                type="submit"
                className="w-full"
              >
                Apply Filters
              </Button>
            </form>
          </Card>

          <Card className="w-full md:w-3/4 p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-headline-small font-bold text-on-surface">
                Products
              </h3>
              <div className="flex gap-2">
                <Button
                  variant="filled-tonal"
                  size="small"
                  onClick={() => setSelectedView("grid")}
                  disabled={selectedView === "grid"}
                >
                  Grid
                </Button>
                <Button
                  variant="filled-tonal"
                  size="small"
                  onClick={() => setSelectedView("list")}
                  disabled={selectedView === "list"}
                >
                  List
                </Button>
              </div>
            </div>

            {loading && !products.length && (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary-600 border-t-transparent"></div>
                <span className="ml-2 text-sm text-outline">
                  Loading products...
                </span>
              </div>
            )}

            {error && (
              <div className="mb-4 p-4 rounded-md bg-error-container text-on-error-container">
                {error}
              </div>
            )}

            {products.length > 0 ? (
              <>
                {selectedView === "grid" ? (
                  <div className="grid gap-6">
                    <div className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {products.map((product) => (
                        <ProductCard key={product.id} product={product} />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="divide-y divide-outline-variant">
                    {products.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        className="p-4 hover:bg-surface-container-high"
                      />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-body-small text-outline">
                  No products found matching your filters.
                </p>
              </div>
            )}

            {products.length > 0 && (
              <div className="flex justify-between items-center mt-6 pt-4 border-t border-outline">
                <div className="text-body-small text-outline">
                  Showing {products.length} of {totalCount} products
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() =>
                      setFilter({
                        ...filter,
                        pageNumber: Math.max(1, filter.pageNumber - 1),
                      })
                    }
                    disabled={filter.pageNumber <= 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() =>
                      setFilter({
                        ...filter,
                        pageNumber: Math.min(totalPages, filter.pageNumber + 1),
                      })
                    }
                    disabled={filter.pageNumber >= totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

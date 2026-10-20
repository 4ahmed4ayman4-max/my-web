import { useAuth } from "@/features/auth/useAuth";
import { useEffect, useState } from "react";
import { getCategories } from "@/features/categories/categoryService";
import { CategoryResponseDto } from "@/shared/types/api";
import { Link } from "react-router-dom";
import { Card } from "@/shared/components/Card";

const placeholderImage =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2RkZCIgc3Ryb2tlPSIjNjY2IiBzdHJva2Utd2lkdGg9IjIiLz4KICA8dGV4dCB4PSI1MCUiIHk9IjUwJSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSIjNjY2Ij5ObyBJtWFnZTwvdGV4dD4KPC9zdmc+";

export function CategoriesPage() {
  const { user, isAuthenticated } = useAuth();
  const [categories, setCategories] = useState<CategoryResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadCategories() {
      setLoading(true);
      setError(null);
      try {
        const result = await getCategories();
        if (!cancelled) {
          setCategories(result);
          setError(null);
        }
      } catch (e: any) {
        if (!cancelled) {
          setError(e.message || "Failed to load categories");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadCategories();

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading && categories.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary-600 border-t-transparent"></div>
        <span className="ml-2 text-sm text-outline">
          Loading categories...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mb-4 p-4 rounded-md bg-error-container text-on-error-container">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-headline-large font-bold text-on-surface">
        Categories
      </h1>
      <p className="text-body-large text-outline-variant">
        {isAuthenticated
          ? `${user?.firstName}'s categories`
          : "Browse our categories"}
      </p>

      {categories.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <Link
              to={`/products?category=${category.id}`}
              key={category.id}
              className="block"
            >
              <Card className="overflow-hidden transition-shadow duration-150 hover:shadow-md">
                <div className="aspect-w-16 aspect-h-9 w-full">
                  <img
                    src={category.imageUrl ?? placeholderImage}
                    alt={category.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-5">
                  <h3 className="text-title-large font-medium text-on-surface mb-2">
                    {category.name}
                  </h3>
                  {category.description && (
                    <p className="text-body-small text-outline-variant line-clamp-2">
                      {category.description}
                    </p>
                  )}
                  <div className="mt-3 text-body-small text-outline-variant">
                    <span className="font-medium text-on-surface">
                      {category.productCount} products
                    </span>
                    {category.subCategories.length > 0 && (
                      <span className="ml-2">
                        ({category.subCategories.length} subcategories)
                      </span>
                    )}
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-body-small text-outline">No categories found.</p>
        </div>
      )}
    </div>
  );
}

export default CategoriesPage;
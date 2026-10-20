import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCategories } from "@/features/categories/categoryService";
import { CategoryResponseDto } from "@/shared/types/api";
import { Card } from "@/shared/components/Card";
import { Button } from "@/shared/components/Button";

export function AdminCategoriesPage() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<CategoryResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchCategories() {
      setLoading(true);
      setError(null);
      try {
        const result = await getCategories();
        if (!cancelled) setCategories(result);
      } catch (e: any) {
        if (!cancelled) setError(e.message || 'Failed to load categories');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchCategories();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary-600 border-t-transparent"></div>
        <span className="ml-2 text-sm text-outline">Loading categories...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-headline-large font-bold text-on-surface">Categories</h1>
        <div className="p-4 rounded-md bg-error-container text-on-error-container">{error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-headline-large font-bold text-on-surface">Categories</h1>
      <p className="text-body-large text-outline-variant">Manage category tree.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((category) => (
          <Card key={category.id} className="p-5 flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-on-surface">{category.name}</h3>
              {category.description && (
                <p className="text-body-small text-outline-variant mt-1">{category.description}</p>
              )}
              <p className="text-body-small text-outline-variant mt-2">{category.productCount} products</p>
            </div>
            {category.subCategories?.length > 0 && (
              <ul className="space-y-1">
                {category.subCategories.map((sub) => (
                  <li key={sub.id} className="text-body-small text-outline-variant">
                    - {sub.name} ({sub.productCount})
                  </li>
                ))}
              </ul>
            )}
          </Card>
        ))}
      </div>

      <Card className="p-6">
        <Button variant="filled" size="medium" onClick={() => navigate('/categories')}>
          Manage Categories
        </Button>
      </Card>
    </div>
  );
}

export default AdminCategoriesPage;
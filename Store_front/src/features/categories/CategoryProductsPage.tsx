import { Navigate, useParams } from "react-router-dom";

/**
 * /categories/:id is just a shortcut for the product list filtered by that
 * category, so it redirects to the products page with the filter applied.
 */
export function CategoryProductsPage() {
  const { id } = useParams<{ id: string }>();

  return <Navigate to={`/products?category=${id ?? ""}`} replace />;
}

export default CategoryProductsPage;

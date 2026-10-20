import { Link, useParams } from "react-router-dom";
import { ProductResponseDto } from "@/shared/types/api";
import { useAuth } from "@/features/auth/useAuth";
import { useEffect, useState } from "react";
import { getProductById } from "@/features/products/productService";
import { addToCart } from "@/features/cart/cartService";
import { Card } from "@/shared/components/Card";
import { Button } from "@/shared/components/Button";

const placeholderImage =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2RkZCIgc3Ryb2tlPSIjNjY2IiBzdHJva2Utd2lkdGg9IjIiLz4KICA8dGV4dCB4PSI1MCUiIHk9IjUwJSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSIjNjY2Ij5ObyBJbWFnZTwvdGV4dD4KPC9zdmc+";

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, isAuthenticated, token } = useAuth();
  const [product, setProduct] = useState<ProductResponseDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [adding, setAdding] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadProduct() {
      if (!id) {
        setError("Product ID not provided");
        setLoading(false);
        return;
      }

      try {
        const result = await getProductById(Number(id));
        if (!cancelled) {
          setProduct(result);
          setError(null);
        }
      } catch (e: any) {
        if (!cancelled) {
          setError(e.message || "Failed to load product");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadProduct();

    return () => {
      cancelled = true;
    };
  }, [id]);

  async function handleAddToCart() {
    if (!isAuthenticated) {
      setMessage({ type: "error", text: "Please sign in to add items to cart" });
      return;
    }
    if (!product) return;

    setAdding(true);
    setMessage(null);
    try {
      await addToCart({ productId: product.id, quantity: 1 }, token ?? undefined);
      setMessage({
        type: "success",
        text: `Added ${product.name} to cart`,
      });
    } catch (e: any) {
      setMessage({ type: "error", text: e?.message || "Failed to add to cart" });
    } finally {
      setAdding(false);
    }
  }

  if (!loading && !product) {
    return (
      <div className="space-y-6">
        <h1 className="text-headline-large font-bold text-on-surface">
          Product Detail
        </h1>
        <p className="text-body-large text-outline">
          {isAuthenticated ? `${user?.firstName},` : "Unavailable"}
        </p>
        {error && (
          <div className="mb-4 p-4 rounded-md bg-error-container text-on-error-container">
            {error}
          </div>
        )}
      </div>
    );
  }

  if (!product) return null;

  const imageUrl = product.images?.[0]?.imageUrl ?? placeholderImage;
  const hasDiscount =
    product.discountPrice != null && product.discountPrice < product.price;
  const effectivePrice = hasDiscount ? product.discountPrice! : product.price;

  return (
    <div className="space-y-6">
      <h1 className="text-headline-large font-bold text-on-surface">
        Product Detail: {product.name}
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="h-full flex flex-col justify-center">
          <img
            src={imageUrl}
            alt={product.name}
            className="w-full h-64 object-cover rounded-lg"
          />
        </Card>
        <Card className="h-full p-6">
          <h2 className="text-headline-small font-bold text-on-surface mb-4">
            {product.name}
          </h2>
          <p className="text-body-medium text-outline-variant mb-4">
            {product.description ?? "No description available"}
          </p>
          <div className="mb-4">
            <span className="text-headline-small font-bold text-on-surface">
              ${effectivePrice.toFixed(2)}
              {hasDiscount && (
                <span className="ml-2 text-body-medium line-through text-outline">
                  ${product.price.toFixed(2)}
                </span>
              )}
            </span>
            {hasDiscount && (
              <span className="ml-1 text-body-small font-medium text-error">
                ${product.discountPrice!.toFixed(2)}
              </span>
            )}
          </div>
          <p className="text-body-small text-outline-variant">
            <strong className="text-on-surface">SKU:</strong> {product.sku}
          </p>
          <p className="text-body-small text-outline-variant">
            <strong className="text-on-surface">Stock:</strong>{" "}
            {product.stockQuantity}
          </p>
          <p className="text-body-small text-outline-variant">
            <strong className="text-on-surface">Category:</strong>{" "}
            {product.categoryName}
          </p>
          <Button
            variant="filled"
            size="large"
            onClick={handleAddToCart}
            disabled={!isAuthenticated || adding}
            loading={adding}
            className="mt-4 w-full"
          >
            {isAuthenticated ? "Add to Cart" : "Sign in to Add"}
          </Button>
        </Card>
      </div>

      {message && (
        <div
          className={`text-body-small px-4 py-3 rounded-md ${
            message.type === "success"
              ? "bg-primary-container text-on-primary-container"
              : "bg-error-container text-on-error-container"
          }`}
        >
          {message.text}
          {message.type === "success" && (
            <Link to="/cart" className="underline ml-2">
              View cart
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

export default ProductDetailPage;

import { useState } from "react";
import { Link } from "react-router-dom";
import { ProductResponseDto } from "@/shared/types/api";
import { useAuth } from "@/features/auth/useAuth";
import { addToCart } from "@/features/cart/cartService";
import { Card } from "@/shared/components/Card";
import { Button } from "@/shared/components/Button";

interface ProductCardProps {
  product: ProductResponseDto;
  className?: string;
}

const placeholderImage =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2RkZCIgc3Ryb2tlPSIjNjY2IiBzdHJva2Utd2lkdGg9IjIiLz4KICA8dGV4dCB4PSI1MCUiIHk9IjUwJSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSIjNjY2Ij5ObyBJbWFnZTwvdGV4dD4KPC9zdmc+";

export function ProductCard({ product, className }: ProductCardProps) {
  const { isAuthenticated, token } = useAuth();
  const [adding, setAdding] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const primaryImage =
    product.images?.find((img) => img.isPrimary) ?? product.images?.[0];
  const imageUrl = primaryImage?.imageUrl ?? placeholderImage;

  // The effective price is the discount price when one is set, the regular
  // price otherwise.
  const hasDiscount =
    product.discountPrice != null && product.discountPrice < product.price;
  const effectivePrice = hasDiscount ? product.discountPrice! : product.price;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      setMessage({ type: "error", text: "Please sign in to add items to cart" });
      return;
    }

    setAdding(true);
    setMessage(null);
    try {
      await addToCart({ productId: product.id, quantity: 1 }, token ?? undefined);
      setMessage({ type: "success", text: `Added ${product.name} to cart` });
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error?.message || "Failed to add to cart",
      });
    } finally {
      setAdding(false);
    }
  };

  return (
    <Card
      className={`overflow-hidden transition-transform duration-200 hover:shadow-md ${className ?? ""}`}
      elevated
    >
      <div className="aspect-w-16 aspect-h-9 w-full">
        <img
          src={imageUrl}
          alt={product.name}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="p-5">
        <Link to={`/products/${product.id}`} className="block">
          <h3 className="text-title-large font-medium text-on-surface mb-2">
            {product.name}
          </h3>
        </Link>
        <p className="text-body-small text-outline-variant line-clamp-2 mb-4">
          {product.description ?? "No description available"}
        </p>
        <div className="flex justify-between items-baseline mb-4">
          <span className="text-headline-small font-bold text-on-surface">
            ${effectivePrice.toFixed(2)}
            {hasDiscount && (
              <span className="ml-2 text-body-small line-through text-outline">
                ${product.price.toFixed(2)}
              </span>
            )}
          </span>
          <Button
            variant="outlined"
            size="small"
            onClick={handleAddToCart}
            disabled={!isAuthenticated}
            loading={adding}
          >
            Add to Cart
          </Button>
        </div>
        {message && (
          <p
            className={`text-body-small ${
              message.type === "success"
                ? "text-primary-600 dark:text-primary-400"
                : "text-error"
            }`}
          >
            {message.text}{" "}
            {message.type === "success" && (
              <Link to="/cart" className="underline">
                View cart
              </Link>
            )}
          </p>
        )}
        {!isAuthenticated && (
          <p className="text-body-small text-outline-variant">
            <Link to="/login" className="underline">
              Sign in
            </Link>{" "}
            to add this product to your cart.
          </p>
        )}
      </div>
    </Card>
  );
}

/**
 * Standardized API response format from backend
 */
export interface ApiResponseDto<T> {
  success: boolean;
  message: string;
  data?: T;
  errors?: string[];
}

/**
 * Auth-related types (from backend DTOs)
 */
export interface RegisterRequestDto {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phoneNumber?: string;
}

export interface LoginRequestDto {
  email: string;
  password: string;
}

export interface RefreshTokenRequestDto {
  accessToken: string;
  refreshToken: string;
}

export interface UserDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
}

export interface AccessTokenDto {
  token: string;
  expiresAt: string;
}

export interface RefreshTokenDto {
  token: string;
  expiresAt: string;
}

export interface AuthResponseDto {
  success: boolean;
  message: string;
  accessToken?: AccessTokenDto;
  refreshToken?: RefreshTokenDto;
  user?: UserDto;
  errors?: string[];
}

export interface RegisterResponseDto {
  success: boolean;
  message: string;
  accessToken?: AccessTokenDto;
  refreshToken?: RefreshTokenDto;
  user?: UserDto;
  errors?: string[];
}

/**
 * Product types
 */
export interface ProductImageDto {
  imageUrl: string;
  altText?: string;
  isPrimary: boolean;
  displayOrder: number;
}

export interface ProductImageResponseDto {
  id: number;
  imageUrl: string;
  altText?: string;
  isPrimary: boolean;
  displayOrder: number;
}

export interface ProductResponseDto {
  id: number;
  name: string;
  description?: string;
  sku: string;
  price: number;
  discountPrice?: number;
  stockQuantity: number;
  isActive: boolean;
  categoryName: string;
  categoryId: number;
  images: ProductImageResponseDto[];
  createdAt: string;
}

export interface ProductFilterRequestDto {
  searchTerm?: string;
  categoryId?: number;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  sortBy?: string;
  pageNumber?: number;
  pageSize?: number;
}

export interface ProductCreateRequestDto {
  name: string;
  description?: string;
  sku: string;
  price: number;
  discountPrice?: number;
  stockQuantity: number;
  categoryId: number;
  images?: ProductImageDto[];
}

export interface ProductUpdateRequestDto {
  name: string;
  description?: string;
  price: number;
  discountPrice?: number;
  stockQuantity: number;
  categoryId: number;
  isActive: boolean;
}

/**
 * Category types
 */
export interface CategoryResponseDto {
  id: number;
  name: string;
  description?: string;
  imageUrl?: string;
  parentCategoryId?: number;
  parentCategoryName?: string;
  productCount: number;
  subCategories: CategoryResponseDto[];
  createdAt: string;
}

export interface CategoryCreateRequestDto {
  name: string;
  description?: string;
  imageUrl?: string;
  parentCategoryId?: number;
}

export interface CategoryUpdateRequestDto {
  name: string;
  description?: string;
  imageUrl?: string;
  parentCategoryId?: number;
}

/**
 * Cart types
 */
export interface CartItemResponseDto {
  id: number;
  productId: number;
  productName: string;
  productImageUrl?: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  availableStock: number;
}

export interface CartResponseDto {
  id: number;
  items: CartItemResponseDto[];
  subTotal: number;
  totalItems: number;
  createdAt: string;
}

export interface AddToCartRequestDto {
  productId: number;
  quantity?: number;
}

export interface UpdateCartItemRequestDto {
  cartItemId: number;
  quantity: number;
}

/**
 * Order types
 */
export enum OrderStatus {
  Pending = "Pending",
  Confirmed = "Confirmed",
  Processing = "Processing",
  Shipped = "Shipped",
  Delivered = "Delivered",
  Cancelled = "Cancelled",
  Refunded = "Refunded",
}

export interface OrderItemResponseDto {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface OrderResponseDto {
  id: number;
  orderNumber: string;
  status: string;
  subTotal: number;
  shippingCost: number;
  taxAmount: number;
  totalAmount: number;
  shippingAddress: string;
  notes?: string;
  createdAt: string;
  shippedAt?: string;
  deliveredAt?: string;
  customerName: string;
  customerEmail: string;
  items: OrderItemResponseDto[];
}

export interface CreateOrderRequestDto {
  shippingAddress: string;
  notes?: string;
  paymentMethod: string;
}

export interface UpdateOrderStatusRequestDto {
  status: string;
}

/**
 * User types
 */
export interface UserProfileResponseDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  profileImageUrl?: string;
  roles: string[];
  createdAt: string;
}

export interface UpdateProfileRequestDto {
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  profileImageUrl?: string;
}

/**
 * Delivery types
 */
export interface DeliveryResponseDto {
  id: number;
  fullName: string;
  phoneNumber: string;
  email?: string;
  vehicleType?: string;
  vehicleNumber?: string;
  isAvailable: boolean;
  isActive: boolean;
  rating: number;
  totalDeliveries: number;
  currentLatitude?: number;
  currentLongitude?: number;
  notes?: string;
  createdAt: string;
}

export interface DeliveryFilterRequestDto {
  searchTerm?: string;
  isAvailable?: boolean;
  isActive?: boolean;
  vehicleType?: string;
  minRating?: number;
  sortBy?: string;
  pageNumber?: number;
  pageSize?: number;
}

export interface DeliveryCreateRequestDto {
  fullName: string;
  phoneNumber: string;
  email?: string;
  vehicleType?: string;
  vehicleNumber?: string;
  notes?: string;
}

export interface DeliveryUpdateRequestDto {
  fullName: string;
  phoneNumber: string;
  email?: string;
  vehicleType?: string;
  vehicleNumber?: string;
  isAvailable: boolean;
  isActive: boolean;
  notes?: string;
}

export interface UpdateLocationRequestDto {
  latitude: number;
  longitude: number;
}

/**
 * Audit types
 */
export interface AuditLogResponseDto {
  id: number;
  userId: string;
  action: string;
  entityName: string;
  entityId?: string;
  ipAddress?: string;
  createdAt: string;
}

/**
 * Pagination
 */
export interface PagedResultDto<T> {
  items: T[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
}
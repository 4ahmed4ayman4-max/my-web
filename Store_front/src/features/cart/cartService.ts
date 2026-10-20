import { createApiClient, apiFetch } from "@/api/apiClient";
import { API_ENDPOINTS } from "@/api/api-endpoints";
import { CartResponseDto, AddToCartRequestDto, UpdateCartItemRequestDto } from "@/shared/types/api";

const client = createApiClient();

export async function getCart(token?: string): Promise<CartResponseDto> {
  return apiFetch<CartResponseDto>(client, "get", API_ENDPOINTS.CART.GET_CART, undefined, token);
}

export async function addToCart(item: AddToCartRequestDto, token?: string): Promise<CartResponseDto> {
  return apiFetch<CartResponseDto>(client, "post", API_ENDPOINTS.CART.ADD_ITEM, item, token);
}

export async function updateCartItem(item: UpdateCartItemRequestDto, token?: string): Promise<CartResponseDto> {
  return apiFetch<CartResponseDto>(client, "put", API_ENDPOINTS.CART.UPDATE_ITEM, item, token);
}

export async function removeCartItem(cartItemId: number, token?: string): Promise<CartResponseDto> {
  return apiFetch<CartResponseDto>(client, "delete", API_ENDPOINTS.CART.REMOVE_ITEM(cartItemId), undefined, token);
}

export async function clearCart(token?: string): Promise<void> {
  return apiFetch<void>(client, "delete", API_ENDPOINTS.CART.CLEAR_CART, undefined, token);
}
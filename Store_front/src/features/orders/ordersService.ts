import { createApiClient, apiFetch } from "@/api/apiClient";
import { API_ENDPOINTS } from "@/api/api-endpoints";
import {
  OrderResponseDto,
  CreateOrderRequestDto,
  UpdateOrderStatusRequestDto,
  PagedResultDto,
} from "@/shared/types/api";

const client = createApiClient();

export async function getMyOrders(token?: string): Promise<OrderResponseDto[]> {
  return apiFetch<OrderResponseDto[]>(
    client,
    "get",
    API_ENDPOINTS.ORDERS.MY_ORDERS,
    undefined,
    token
  );
}

export async function getOrderById(
  id: number,
  token?: string
): Promise<OrderResponseDto> {
  return apiFetch<OrderResponseDto>(
    client,
    "get",
    API_ENDPOINTS.ORDERS.DETAIL(id),
    undefined,
    token
  );
}

export async function getAllOrders(token?: string): Promise<OrderResponseDto[]> {
  return apiFetch<OrderResponseDto[]>(
    client,
    "get",
    API_ENDPOINTS.ORDERS.ALL,
    undefined,
    token
  );
}

export async function createOrder(
  request: CreateOrderRequestDto,
  token?: string
): Promise<OrderResponseDto> {
  return apiFetch<OrderResponseDto>(
    client,
    "post",
    API_ENDPOINTS.ORDERS.CREATE,
    request,
    token
  );
}

export async function updateOrderStatus(
  id: number,
  status: string,
  token?: string
): Promise<OrderResponseDto> {
  return apiFetch<OrderResponseDto>(
    client,
    "patch",
    API_ENDPOINTS.ORDERS.UPDATE_STATUS(id),
    { status } as UpdateOrderStatusRequestDto,
    token
  );
}

export async function cancelOrder(
  id: number,
  token?: string
): Promise<OrderResponseDto> {
  return apiFetch<OrderResponseDto>(
    client,
    "post",
    API_ENDPOINTS.ORDERS.CANCEL(id),
    undefined,
    token
  );
}

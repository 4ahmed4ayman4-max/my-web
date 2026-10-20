import { createApiClient, apiFetch } from "@/api/apiClient";
import { API_ENDPOINTS } from "@/api/api-endpoints";
import {
  DeliveryResponseDto,
  DeliveryFilterRequestDto,
  DeliveryCreateRequestDto,
  DeliveryUpdateRequestDto,
  UpdateLocationRequestDto,
  PagedResultDto,
} from "@/shared/types/api";

const client = createApiClient();

export async function getDeliveries(
  filter?: DeliveryFilterRequestDto,
  token?: string
): Promise<PagedResultDto<DeliveryResponseDto>> {
  const params = new URLSearchParams();
  if (filter?.searchTerm) params.set("SearchTerm", filter.searchTerm);
  if (filter?.isAvailable !== undefined)
    params.set("IsAvailable", String(filter.isAvailable));
  if (filter?.isActive !== undefined)
    params.set("IsActive", String(filter.isActive));
  if (filter?.vehicleType) params.set("VehicleType", filter.vehicleType);
  if (filter?.minRating !== undefined)
    params.set("MinRating", String(filter.minRating));
  if (filter?.sortBy) params.set("SortBy", filter.sortBy);
  if (filter?.pageNumber !== undefined)
    params.set("PageNumber", String(filter.pageNumber));
  if (filter?.pageSize !== undefined)
    params.set("PageSize", String(filter.pageSize));

  const endpoint = `${API_ENDPOINTS.DELIVERIES.BASE}?${params.toString()}`;
  return apiFetch<PagedResultDto<DeliveryResponseDto>>(
    client,
    "get",
    endpoint,
    undefined,
    token
  );
}

export async function getDeliveryById(
  id: number,
  token?: string
): Promise<DeliveryResponseDto> {
  return apiFetch<DeliveryResponseDto>(
    client,
    "get",
    API_ENDPOINTS.DELIVERIES.DETAIL(id),
    undefined,
    token
  );
}

export async function createDelivery(
  request: DeliveryCreateRequestDto,
  token?: string
): Promise<DeliveryResponseDto> {
  return apiFetch<DeliveryResponseDto>(
    client,
    "post",
    API_ENDPOINTS.DELIVERIES.CREATE,
    request,
    token
  );
}

export async function updateDelivery(
  id: number,
  request: DeliveryUpdateRequestDto,
  token?: string
): Promise<DeliveryResponseDto> {
  return apiFetch<DeliveryResponseDto>(
    client,
    "put",
    API_ENDPOINTS.DELIVERIES.UPDATE(id),
    request,
    token
  );
}

export async function deleteDelivery(
  id: number,
  token?: string
): Promise<void> {
  return apiFetch<void>(
    client,
    "delete",
    API_ENDPOINTS.DELIVERIES.DELETE(id),
    undefined,
    token
  );
}

export async function toggleDeliveryActive(
  id: number,
  token?: string
): Promise<void> {
  return apiFetch<void>(
    client,
    "patch",
    API_ENDPOINTS.DELIVERIES.TOGGLE_ACTIVE(id),
    undefined,
    token
  );
}

export async function toggleDeliveryAvailability(
  id: number,
  token?: string
): Promise<void> {
  return apiFetch<void>(
    client,
    "patch",
    API_ENDPOINTS.DELIVERIES.TOGGLE_AVAILABILITY(id),
    undefined,
    token
  );
}

export async function updateDeliveryLocation(
  id: number,
  location: UpdateLocationRequestDto,
  token?: string
): Promise<void> {
  return apiFetch<void>(
    client,
    "patch",
    API_ENDPOINTS.DELIVERIES.UPDATE_LOCATION(id),
    location,
    token
  );
}
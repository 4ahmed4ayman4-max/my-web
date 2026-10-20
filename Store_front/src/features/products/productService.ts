import { createApiClient, apiFetch } from "@/api/apiClient";
import { API_ENDPOINTS } from "@/api/api-endpoints";
import {
  ProductResponseDto,
  ProductFilterRequestDto,
  ProductCreateRequestDto,
  ProductUpdateRequestDto,
  PagedResultDto,
} from "@/shared/types/api";

const client = createApiClient();

export async function getProducts(filter?: ProductFilterRequestDto, token?: string): Promise<PagedResultDto<ProductResponseDto>> {
  const params = new URLSearchParams();
  if (filter?.searchTerm) params.set("SearchTerm", filter.searchTerm);
  if (filter?.categoryId !== undefined && filter?.categoryId !== null) params.set("CategoryId", String(filter.categoryId));
  if (filter?.minPrice !== undefined) params.set("MinPrice", String(filter.minPrice));
  if (filter?.maxPrice !== undefined) params.set("MaxPrice", String(filter.maxPrice));
  if (filter?.inStock !== undefined) params.set("InStock", String(filter.inStock));
  if (filter?.sortBy) params.set("SortBy", filter.sortBy);
  if (filter?.pageNumber !== undefined && filter?.pageNumber !== null) params.set("PageNumber", String(filter.pageNumber));
  if (filter?.pageSize !== undefined) params.set("PageSize", String(filter.pageSize));

  const endpoint = `${API_ENDPOINTS.PRODUCTS.LIST}?${params.toString()}`;
  return apiFetch<PagedResultDto<ProductResponseDto>>(client, "get", endpoint, undefined, token ?? undefined);
}

export async function getProductById(id: number): Promise<ProductResponseDto> {
  const client = createApiClient();
  return apiFetch<ProductResponseDto>(client, "get", API_ENDPOINTS.PRODUCTS.DETAIL(id));
}

export async function createProduct(
  request: ProductCreateRequestDto,
  token?: string
): Promise<ProductResponseDto> {
  return apiFetch<ProductResponseDto>(
    client,
    "post",
    API_ENDPOINTS.PRODUCTS.CREATE,
    request,
    token
  );
}

export async function updateProduct(
  id: number,
  request: ProductUpdateRequestDto,
  token?: string
): Promise<ProductResponseDto> {
  return apiFetch<ProductResponseDto>(
    client,
    "put",
    API_ENDPOINTS.PRODUCTS.UPDATE(id),
    request,
    token
  );
}

export async function deleteProduct(
  id: number,
  token?: string
): Promise<void> {
  return apiFetch<void>(
    client,
    "delete",
    API_ENDPOINTS.PRODUCTS.DELETE(id),
    undefined,
    token
  );
}

export async function toggleProductActive(
  id: number,
  token?: string
): Promise<void> {
  return apiFetch<void>(
    client,
    "patch",
    API_ENDPOINTS.PRODUCTS.TOGGLE_ACTIVE(id),
    undefined,
    token
  );
}
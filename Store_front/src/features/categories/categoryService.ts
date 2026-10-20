import { createApiClient, apiFetch } from "@/api/apiClient";
import { API_ENDPOINTS } from "@/api/api-endpoints";
import {
  CategoryResponseDto,
  CategoryCreateRequestDto,
  CategoryUpdateRequestDto,
} from "@/shared/types/api";

const client = createApiClient();

export async function getCategories(): Promise<CategoryResponseDto[]> {
  return apiFetch<CategoryResponseDto[]>(client, "get", API_ENDPOINTS.CATEGORIES.LIST);
}

export async function getRootCategories(): Promise<CategoryResponseDto[]> {
  return apiFetch<CategoryResponseDto[]>(client, "get", API_ENDPOINTS.CATEGORIES.ROOTS);
}

export async function getCategoryById(id: number): Promise<CategoryResponseDto> {
  const client = createApiClient();
  return apiFetch<CategoryResponseDto>(client, "get", API_ENDPOINTS.CATEGORIES.DETAIL(id));
}

export async function createCategory(
  request: CategoryCreateRequestDto,
  token?: string
): Promise<CategoryResponseDto> {
  return apiFetch<CategoryResponseDto>(
    client,
    "post",
    API_ENDPOINTS.CATEGORIES.CREATE,
    request,
    token
  );
}

export async function updateCategory(
  id: number,
  request: CategoryUpdateRequestDto,
  token?: string
): Promise<CategoryResponseDto> {
  return apiFetch<CategoryResponseDto>(
    client,
    "put",
    API_ENDPOINTS.CATEGORIES.UPDATE(id),
    request,
    token
  );
}

export async function deleteCategory(
  id: number,
  token?: string
): Promise<void> {
  return apiFetch<void>(
    client,
    "delete",
    API_ENDPOINTS.CATEGORIES.DELETE(id),
    undefined,
    token
  );
}
import { createApiClient, apiFetch } from "@/api/apiClient";
import { API_ENDPOINTS } from "@/api/api-endpoints";
import {
  UserProfileResponseDto,
  UpdateProfileRequestDto,
  PagedResultDto,
} from "@/shared/types/api";

const client = createApiClient();

export async function getMyProfile(
  token?: string
): Promise<UserProfileResponseDto> {
  return apiFetch<UserProfileResponseDto>(
    client,
    "get",
    API_ENDPOINTS.USERS.ME,
    undefined,
    token
  );
}

export async function updateMyProfile(
  request: UpdateProfileRequestDto,
  token?: string
): Promise<UserProfileResponseDto> {
  return apiFetch<UserProfileResponseDto>(
    client,
    "put",
    API_ENDPOINTS.USERS.UPDATE_PROFILE,
    request,
    token
  );
}

export async function getAllUsers(
  token?: string
): Promise<UserProfileResponseDto[]> {
  return apiFetch<UserProfileResponseDto[]>(
    client,
    "get",
    API_ENDPOINTS.USERS.LIST,
    undefined,
    token
  );
}

export async function getUserById(
  id: string,
  token?: string
): Promise<UserProfileResponseDto> {
  return apiFetch<UserProfileResponseDto>(
    client,
    "get",
    API_ENDPOINTS.USERS.DETAIL(id),
    undefined,
    token
  );
}

export async function deleteUser(
  id: string,
  token?: string
): Promise<void> {
  return apiFetch<void>(
    client,
    "delete",
    API_ENDPOINTS.USERS.DETAIL(id),
    undefined,
    token
  );
}

export async function assignRole(
  id: string,
  role: string,
  token?: string
): Promise<void> {
  return apiFetch<void>(
    client,
    "post",
    API_ENDPOINTS.USERS.ASSIGN_ROLE(id, role),
    undefined,
    token
  );
}
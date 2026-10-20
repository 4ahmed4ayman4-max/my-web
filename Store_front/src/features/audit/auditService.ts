import { createApiClient, apiFetch } from "@/api/apiClient";
import { API_ENDPOINTS } from "@/api/api-endpoints";
import { AuditLogResponseDto } from "@/shared/types/api";

const client = createApiClient();

export async function getAuditLogs(token?: string): Promise<AuditLogResponseDto[]> {
  return apiFetch<AuditLogResponseDto[]>(
    client,
    "get",
    API_ENDPOINTS.AUDIT.GET_ALL,
    undefined,
    token
  );
}

export async function getAuditLogsByUser(
  userId: string,
  token?: string
): Promise<AuditLogResponseDto[]> {
  return apiFetch<AuditLogResponseDto[]>(
    client,
    "get",
    API_ENDPOINTS.AUDIT.GET_BY_USER(userId),
    undefined,
    token
  );
}

export async function getAuditLogsByEntity(
  entityName: string,
  entityId?: string,
  token?: string
): Promise<AuditLogResponseDto[]> {
  return apiFetch<AuditLogResponseDto[]>(
    client,
    "get",
    API_ENDPOINTS.AUDIT.GET_BY_ENTITY(entityName, entityId),
    undefined,
    token
  );
}
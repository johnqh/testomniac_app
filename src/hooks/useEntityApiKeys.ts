import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { NetworkClient, BaseResponse } from '@sudobility/types';
import type { ApiKeyResponse } from '@sudobility/testomniac_types';

export interface EntityApiKeyResponse extends ApiKeyResponse {
  entitySlug: string;
  associatedPersonalEntityId: string | null;
}

export interface CreateEntityApiKeyRequest {
  title: string;
  associatedPersonalEntityId?: string | null;
}

interface UseEntityApiKeysConfig {
  networkClient: NetworkClient;
  baseUrl: string;
  entitySlug: string;
  token: string;
  enabled?: boolean;
}

const API_KEY_QUERY_KEY = 'entity-api-keys';

export function useEntityApiKeys(config: UseEntityApiKeysConfig) {
  const { networkClient, baseUrl, entitySlug, token, enabled = true } = config;

  const query = useQuery<BaseResponse<EntityApiKeyResponse[]>>({
    queryKey: [API_KEY_QUERY_KEY, entitySlug],
    queryFn: async () => {
      const res = await networkClient.get<BaseResponse<EntityApiKeyResponse[]>>(
        `${baseUrl}/api/v1/entities/${entitySlug}/api-keys`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return res.data as BaseResponse<EntityApiKeyResponse[]>;
    },
    enabled: enabled && !!entitySlug && !!token,
  });

  return {
    apiKeys: query.data?.data ?? [],
    isLoading: query.isLoading,
    error: query.error?.message ?? null,
    refetch: query.refetch,
  };
}

export function useCreateEntityApiKey(config: Omit<UseEntityApiKeysConfig, 'enabled'>) {
  const { networkClient, baseUrl, entitySlug, token } = config;
  const queryClient = useQueryClient();

  const mutation = useMutation<
    BaseResponse<EntityApiKeyResponse>,
    Error,
    CreateEntityApiKeyRequest
  >({
    mutationFn: async data => {
      const res = await networkClient.post<BaseResponse<EntityApiKeyResponse>>(
        `${baseUrl}/api/v1/entities/${entitySlug}/api-keys`,
        data,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return res.data as BaseResponse<EntityApiKeyResponse>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_KEY_QUERY_KEY, entitySlug] });
    },
  });

  return {
    createApiKey: mutation.mutateAsync,
    isCreating: mutation.isPending,
    error: mutation.error?.message ?? null,
  };
}

export function useDeleteEntityApiKey(config: Omit<UseEntityApiKeysConfig, 'enabled'>) {
  const { networkClient, baseUrl, entitySlug, token } = config;
  const queryClient = useQueryClient();

  const mutation = useMutation<BaseResponse<null>, Error, number>({
    mutationFn: async apiKeyId => {
      const res = await networkClient.delete<BaseResponse<null>>(
        `${baseUrl}/api/v1/entities/${entitySlug}/api-keys/${apiKeyId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return res.data as BaseResponse<null>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_KEY_QUERY_KEY, entitySlug] });
    },
  });

  return {
    deleteApiKey: mutation.mutateAsync,
    isDeleting: mutation.isPending,
    error: mutation.error?.message ?? null,
  };
}

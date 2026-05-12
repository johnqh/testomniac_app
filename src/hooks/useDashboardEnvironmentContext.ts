import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useQueries } from '@tanstack/react-query';
import { useApi } from '@sudobility/building_blocks/firebase';
import {
  TestomniacClient,
  useEntityProducts,
  useProductRuns,
  useProductRunners,
} from '@sudobility/testomniac_client';
import { CONSTANTS } from '../config/constants';

export function useDashboardEnvironmentContext() {
  const { entitySlug, envId } = useParams<{ entitySlug: string; envId: string }>();
  const { networkClient, token } = useApi();
  const numericEnvId = Number(envId);
  const client = useMemo(
    () => new TestomniacClient({ baseUrl: CONSTANTS.API_URL, networkClient }),
    [networkClient]
  );

  const {
    products,
    isLoading: productsLoading,
    error: productsError,
  } = useEntityProducts({
    networkClient,
    baseUrl: CONSTANTS.API_URL,
    entitySlug: entitySlug ?? '',
    token: token ?? '',
    enabled: !!entitySlug && !!token,
  });

  const environmentQueries = useQueries({
    queries: products.map(product => ({
      queryKey: ['dashboard-environment-context', 'product-environments', product.id],
      queryFn: async () => {
        const response = await client.getProductEnvironments(product.id, token ?? '');
        return response.data ?? [];
      },
      enabled: !!token,
      staleTime: 60_000,
    })),
  });

  const matchingProduct = useMemo(() => {
    for (let index = 0; index < products.length; index += 1) {
      const product = products[index];
      const environments = environmentQueries[index]?.data ?? [];
      if (environments.some(environment => environment.id === numericEnvId)) {
        return product;
      }
    }
    return null;
  }, [environmentQueries, numericEnvId, products]);

  const matchingEnvironment = useMemo(() => {
    for (const query of environmentQueries) {
      const environment = query.data?.find(item => item.id === numericEnvId);
      if (environment) return environment;
    }
    return null;
  }, [environmentQueries, numericEnvId]);

  const productId = matchingProduct?.id ?? matchingEnvironment?.productId ?? 0;

  const {
    runs,
    isLoading: runsLoading,
    error: runsError,
  } = useProductRuns({
    networkClient,
    baseUrl: CONSTANTS.API_URL,
    productId,
    token: token ?? '',
    enabled: !!productId && !!token,
  });

  const {
    runners,
    isLoading: runnersLoading,
    error: runnersError,
  } = useProductRunners({
    networkClient,
    baseUrl: CONSTANTS.API_URL,
    productId,
    token: token ?? '',
    enabled: !!productId && !!token,
  });

  const environmentRuns = useMemo(
    () =>
      runs
        .filter(run => run.testEnvironmentId === numericEnvId)
        .sort((left, right) => right.id - left.id),
    [numericEnvId, runs]
  );

  const latestRun = environmentRuns[0] ?? null;

  const primaryRunner = useMemo(() => {
    if (latestRun) {
      return runners.find(runner => runner.id === latestRun.runnerId) ?? null;
    }
    return runners[0] ?? null;
  }, [latestRun, runners]);

  const environmentsLoading = productsLoading || environmentQueries.some(query => query.isLoading);
  const environmentsError =
    productsError || environmentQueries.find(query => query.error)?.error?.message || null;

  return {
    entitySlug: entitySlug ?? '',
    envId: numericEnvId,
    environment: matchingEnvironment,
    product: matchingProduct,
    productId,
    latestRun,
    environmentRuns,
    primaryRunner,
    token: token ?? '',
    networkClient,
    isLoading: environmentsLoading || runsLoading || runnersLoading,
    error: environmentsError || runsError || runnersError || null,
  };
}

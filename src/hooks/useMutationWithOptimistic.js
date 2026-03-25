import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

/**
 * Standardized hook for optimistic UI mutations.
 * Handles both entity updates and custom server operations with automatic state rollback.
 *
 * Usage:
 *   const mutation = useMutationWithOptimistic(
 *     () => ProfileEntity.update(id, data),
 *     { queryKey: ['profile', id], updateFn: (old, new) => ({...old, ...new}) }
 *   );
 *   mutation.mutate(newData);
 */
export function useMutationWithOptimistic(mutationFn, options = {}) {
  const queryClient = useQueryClient();
  const { queryKey, updateFn, onSuccess, onError } = options;

  const mutation = useMutation({
    mutationFn,
    onMutate: async (newData) => {
      // Cancel outgoing queries to prevent race conditions
      if (queryKey) {
        await queryClient.cancelQueries({ queryKey });
      }

      // Snapshot previous data for rollback
      const previous = queryKey ? queryClient.getQueryData(queryKey) : null;

      // Optimistic update: merge new data into cached query
      if (queryKey && previous && updateFn) {
        const optimistic = updateFn(previous, newData);
        queryClient.setQueryData(queryKey, optimistic);
      }

      return { previous, queryKey };
    },
    onSuccess: (data, variables, context) => {
      // Invalidate and refetch to sync with server
      if (queryKey) {
        queryClient.invalidateQueries({ queryKey });
      }
      onSuccess?.(data, variables, context);
    },
    onError: (error, variables, context) => {
      // Rollback to previous data on error
      if (context?.queryKey && context?.previous) {
        queryClient.setQueryData(context.queryKey, context.previous);
      }
      onError?.(error, variables, context);
    },
  });

  return mutation;
}

/**
 * Hook for batch mutations (e.g., multiple entity creates/updates).
 * Ensures all mutations complete before invalidating query.
 */
export function useBatchMutations(operations = []) {
  const queryClient = useQueryClient();

  const executeBatch = useCallback(async () => {
    try {
      const results = await Promise.all(
        operations.map(op => op.mutationFn())
      );
      // Invalidate all affected queries
      const uniqueKeys = [...new Set(operations.map(op => JSON.stringify(op.queryKey)))];
      for (const keyStr of uniqueKeys) {
        const key = JSON.parse(keyStr);
        queryClient.invalidateQueries({ queryKey: key });
      }
      return results;
    } catch (error) {
      console.error('Batch mutation failed:', error);
      throw error;
    }
  }, [operations, queryClient]);

  return { executeBatch };
}
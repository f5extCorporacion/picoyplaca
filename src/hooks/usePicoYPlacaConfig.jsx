import { useQuery } from '@tanstack/react-query';
import { fetchPicoYPlacaConfig } from '../api/picoYPlacaApi';

export const usePicoYPlacaConfig = () => {
  return useQuery({
    queryKey: ['picoYPlacaConfig'],
    queryFn: fetchPicoYPlacaConfig,
    staleTime: 1000 * 60 * 5, // Data considered fresh for 5 minutes
  });
};

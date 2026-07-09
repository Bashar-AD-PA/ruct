import { useQuery } from '@tanstack/react-query';
import axiosClient from '../../core/api/axiosClient';
import { ENDPOINTS } from '../../core/api/endpoints';

export const useGovernorates = () => {
  return useQuery({
    queryKey: ['governorates'],
    queryFn: async () => {
      const res = await axiosClient.get(ENDPOINTS.LOOKUPS.GOVERNORATES);
      return res.data?.data || res.data || [];
    },
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
  });
};

export const useScreenTypes = () => {
  return useQuery({
    queryKey: ['screenTypes'],
    queryFn: async () => {
      const res = await axiosClient.get(ENDPOINTS.LOOKUPS.SCREEN_TYPES);
      return res.data?.data || res.data || [];
    },
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
  });
};

export const useStreets = () => {
  return useQuery({
    queryKey: ['streets'],
    queryFn: async () => {
      const res = await axiosClient.get(ENDPOINTS.LOOKUPS.STREETS);
      return res.data?.data || res.data || [];
    },
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
  });
};

export const useRoles = () => {
  return useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const res = await axiosClient.get(ENDPOINTS.LOOKUPS.ROLES);
      return res.data?.data || res.data || [];
    },
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
  });
};

export const useUsersByRole = (roleName) => {
  return useQuery({
    queryKey: ['users', 'role', roleName],
    queryFn: async () => {
      const res = await axiosClient.get(ENDPOINTS.LOOKUPS.USERS_BY_ROLE(roleName));
      return res.data?.data || res.data || [];
    },
    enabled: !!roleName,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
};

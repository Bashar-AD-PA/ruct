import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosClient from '../../core/api/axiosClient';
import { ENDPOINTS } from '../../core/api/endpoints';
import useToastStore from '../../store/useToastStore';

export const useLedger = () => {
  return useQuery({
    queryKey: ['ledger'],
    queryFn: async () => {
      const res = await axiosClient.get(ENDPOINTS.FINANCIAL.LEDGER);
      return res.data?.data || res.data || {};
    },
  });
};

export const useApprovePayment = () => {
  const queryClient = useQueryClient();
  const addToast = useToastStore(state => state.addToast);

  return useMutation({
    mutationFn: async ({ id, payload }) => {
      const res = await axiosClient.put(ENDPOINTS.FINANCIAL.APPROVE(id), payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ledger'] });
      addToast('تم اتخاذ الإجراء بنجاح', 'success');
    },
    onError: (err) => {
      addToast(err.response?.data?.message || 'تعذر إتمام الإجراء', 'error');
    }
  });
};

export const useRecordPayment = () => {
  const queryClient = useQueryClient();
  const addToast = useToastStore(state => state.addToast);

  return useMutation({
    mutationFn: async (payload) => {
      const res = await axiosClient.post(ENDPOINTS.FINANCIAL.RECORD_PAYMENT, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ledger'] });
      addToast('تم تسجيل الدفعة بنجاح', 'success');
    },
    onError: (err) => {
      addToast(err.response?.data?.message || 'تعذر تسجيل الدفعة', 'error');
    }
  });
};

export const useOwnerEarnings = () => {
  return useQuery({
    queryKey: ['ownerEarnings'],
    queryFn: async () => {
      const res = await axiosClient.get(ENDPOINTS.FINANCIAL.MY_EARNINGS);
      return res.data?.data || res.data;
    },
  });
};

export const useRequestPayout = () => {
  const queryClient = useQueryClient();
  const addToast = useToastStore(state => state.addToast);

  return useMutation({
    mutationFn: async (payload) => {
      const res = await axiosClient.post(ENDPOINTS.FINANCIAL.REQUEST_PAYOUT, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ownerEarnings'] });
      addToast('تم إرسال طلب السحب بنجاح!', 'success');
    },
    onError: (err) => {
      addToast(err.response?.data?.message || 'فشلت العملية', 'error');
    }
  });
};

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { paymentServices } from "@/api/services/paymentServices";


export const useCreatePaymentOrder = () =>
  useMutation({
    mutationFn: (payload) => paymentServices.createOrder(payload),
  });
export const useVerifyPayment = () =>
  useMutation({
    mutationFn: (payload) => paymentServices.verifyOrder(payload),
  });
export const useGetAllPayments = ({
  page = 1,
  limit = 10,
  search = "",
  status = "all",
}) =>
  useQuery({
    queryKey: ["payments", page, limit, search, status],
    queryFn: () =>
      paymentServices.getAllPayments({
        page,
        limit,
        search,
        status,
      }),
    keepPreviousData: true,
  });

export const useGetPaymentByCardOrderId = (cardOrderId) =>
  useQuery({
    queryKey: ["payment", cardOrderId],
    queryFn: () => paymentServices.getPaymentByCardOrderId(cardOrderId),
    enabled: !!cardOrderId,
    keepPreviousData: true,
  });
export const useSendWhatsappPayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => paymentServices.sendWhatsappPayment(payload),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["payments"],
      });
    },
  });
};
import axiosInstance from "../axiosConfig";
import { API_ENDPOINTS } from "../apiEndpoints";

export const paymentServices = {
  createOrder: async (payload) => {
    const { data } = await axiosInstance.post(
      API_ENDPOINTS.PAYMENT.CREATE_ORDER,
      payload
    );
    return data;
  },

  verifyOrder: async (payload) => {
    const { data } = await axiosInstance.post(
      API_ENDPOINTS.PAYMENT.VERIFY_PAYMENT,
      payload
    );
    return data;
  },

  getAllPayments: async ({ page, limit, search, status }) => {
    const { data } = await axiosInstance.get(API_ENDPOINTS.PAYMENT.GET_ALL, {
      params: {
        page,
        limit,
        search,
        status,
      },
    });

    return data;
  },

  getPaymentByCardOrderId: async (cardOrderId) => {
    const { data } = await axiosInstance.get(
      `${API_ENDPOINTS.PAYMENT.GET_ONE}/${cardOrderId}`
    );
    return data;
  },

  sendWhatsappPayment: async (payload) => {
    const { data } = await axiosInstance.post(
      API_ENDPOINTS.PAYMENT.SEND_WHATSAPP,
      payload
    );
    return data;
  },
};

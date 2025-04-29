// hooks/useMpesaPayment.ts
import { useState } from 'react';
import axios from 'axios';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SERVER_URI } from './uri';

const useMpesaPayment = () => {
  const [isProcessing, setIsProcessing] = useState(false);

  const initiateSTKPush = async (phoneNumber: string, amount: number) => {
    setIsProcessing(true);

    try {
      const accessToken = await AsyncStorage.getItem('access_token');
      const refreshToken = await AsyncStorage.getItem('refresh_token');

      const response = await axios.post(
        `${SERVER_URI}/initiate-stkpush`,
        { phoneNumber, amount },
        {
          headers: {
            'access-token': accessToken,
            'refresh-token': refreshToken,
          },
          timeout: 15000,
        }
      );

      return {
        success: true,
        checkoutRequestId: response.data.data.CheckoutRequestID,
        merchantRequestId: response.data.data.MerchantRequestID,
      };
    } catch (error: any) {
      console.error('Payment initiation error:', error);
      const errorMessage =
        error.response?.data?.errorMessage ||
        error.message ||
        'Failed to initiate payment';
      Alert.alert('Payment Error', errorMessage);
      return { success: false };
    } finally {
      setIsProcessing(false);
    }
  };

  const checkPaymentStatus = async (
    checkoutRequestId: string,
    merchantRequestId: string,
    maxRetries = 10,
    initialDelay = 3000
  ) => {
    let retryCount = 0;
    let delay = initialDelay;

    while (retryCount < maxRetries) {
      try {
        const accessToken = await AsyncStorage.getItem('access_token');
        const refreshToken = await AsyncStorage.getItem('refresh_token');

        const response = await axios.post(
          `${SERVER_URI}/verify-payment`,
          {
            CheckoutRequestID: checkoutRequestId,
            MerchantRequestID: merchantRequestId,
          },
          {
            headers: {
              'access-token': accessToken,
              'refresh-token': refreshToken,
            },
            timeout: 10000,
          }
        );

        // Handle API saying it's still processing
        if (
          response.data.errorCode === '500.001.1001' ||
          response.data.status === 'processing'
        ) {
          retryCount++;
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= 2; // exponential backoff
          continue;
        }

        // Handle successful payment
        if (response.data.status === 'completed') {
          return {
            success: true,
            data: response.data.paymentInfo,
          };
        }

        // Fallback return if status is unexpected
        return response.data;
      } catch (error: any) {
        // Retry if status still "processing"
        if (error.response?.data?.status === 'processing') {
          retryCount++;
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= 2;
        } else {
          console.error('Verification attempt failed:', error);
          break;
        }
      }
    }

    return {
      success: false,
      message: 'Payment verification timeout. Please check your M-Pesa messages.',
    };
  };

  return {
    isProcessing,
    initiateSTKPush,
    checkPaymentStatus,
  };
};

export default useMpesaPayment;

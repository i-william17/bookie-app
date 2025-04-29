import { Request, Response } from "express";
import Payment from "../models/payment.model";
import Order from "../models/order.Model";
import axios from "axios";

// M-Pesa credentials from environment variables
const MPESA_CONSUMER_KEY = process.env.MPESA_CONSUMER_KEY!;
const MPESA_CONSUMER_SECRET = process.env.MPESA_CONSUMER_SECRET!;
const MPESA_BUSINESS_SHORTCODE = process.env.MPESA_SHORTCODE || "174379";
const MPESA_PASSKEY = process.env.MPESA_PASSKEY!;
const MPESA_CALLBACK_URL = process.env.MPESA_CALLBACK_URL!;
const MPESA_AUTH_URL = "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials";
const MPESA_STK_PUSH_URL = "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest";

// Generate M-Pesa access token
const getMpesaAccessToken = async () => {
  const auth = Buffer.from(`${MPESA_CONSUMER_KEY}:${MPESA_CONSUMER_SECRET}`).toString("base64");
  const response = await axios.get(MPESA_AUTH_URL, {
    headers: { Authorization: `Basic ${auth}` },
  });
  return response.data.access_token;
};

// Generate timestamp (YYYYMMDDHHmmss)
const getTimestamp = () => {
  const date = new Date();
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
    String(date.getHours()).padStart(2, '0'),
    String(date.getMinutes()).padStart(2, '0'),
    String(date.getSeconds()).padStart(2, '0')
  ].join('');
};

// Generate password for STK push
const generatePassword = () => {
  const timestamp = getTimestamp();
  return {
    password: Buffer.from(`${MPESA_BUSINESS_SHORTCODE}${MPESA_PASSKEY}${timestamp}`).toString("base64"),
    timestamp
  };
};

// Format phone number to 254XXXXXXXXX
const formatPhoneNumber = (phone: string): string => {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('0')) return `254${digits.substring(1)}`;
  if (digits.startsWith('7')) return `254${digits}`;
  if (digits.startsWith('254')) return digits;
  return `254${digits}`;
};


export const initiatePayment = async (req: Request, res: Response) => {
  try {
    const { phoneNumber, amount, courses } = req.body;
    const userId = req.user?._id;
    console.log("User ID:", userId); // Log userId for debugging
    console.log("Request Body:", req.body); // Log entire request body for debugging
    console.log("User ID from request:", req.user); // Log userId from request for debugging

    // // Validate inputs including userId
    // if (!userId || !phoneNumber || !amount || !courses?.length) {
    //   return res.status(400).json({ 
    //     success: false,
    //     message: "User authentication, phone number, amount and courses are required" 
    //   });
    // }

    // Format inputs
    const formattedPhone = formatPhoneNumber(phoneNumber);
    const formattedAmount = Math.ceil(Number(amount));

    // Get M-Pesa credentials
    const accessToken = await getMpesaAccessToken();
    const { password, timestamp } = generatePassword();

    // Prepare STK push payload
    const stkPushPayload = {
      BusinessShortCode: MPESA_BUSINESS_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: formattedAmount,
      PartyA: formattedPhone,
      PartyB: MPESA_BUSINESS_SHORTCODE,
      PhoneNumber: formattedPhone,
      CallBackURL: MPESA_CALLBACK_URL,
      AccountReference: "Bookie Courses",
      TransactionDesc: "Payment for courses",
    };

    // Initiate STK push
    const response = await axios.post(MPESA_STK_PUSH_URL, stkPushPayload, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    // Save payment to database with correct status
    const payment = new Payment({
      merchantRequestID: response.data.MerchantRequestID,
      checkoutRequestID: response.data.CheckoutRequestID,
      user: userId, // Make sure this is included
      amount: formattedAmount,
      phoneNumber: formattedPhone,
      status: "pending", // Changed from "success" to "pending"
      courses: courses
    });

    await payment.save();

    return res.status(200).json({
      success: true,
      message: "Payment initiated successfully",
      data: {
        merchantRequestID: payment.merchantRequestID,
        checkoutRequestID: payment.checkoutRequestID,
        paymentId: payment._id
      }
    });

  } catch (error: any) {
    console.error("Payment initiation error:", error);
    return res.status(500).json({
      success: false,
      message: error.response?.data?.errorMessage || "Failed to initiate payment",
      error: error.message
    });
  }
};

export const verifyPayment = async (req: Request, res: Response) => {
  try {
    const { merchantRequestID, checkoutRequestID } = req.body;
    const userId = req.user?._id;

    // Find the payment record
    const payment = await Payment.findOne({
      merchantRequestID,
      checkoutRequestID,
      user: userId
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment record not found"
      });
    }

    // Check if payment is already completed
    if (payment.status === 'completed') {
      // Check if order already exists
      const existingOrder = await Order.findOne({
        payment: payment._id
      });

      if (existingOrder) {
        return res.status(200).json({
          success: true,
          message: "Payment already verified and order created",
          data: {
            orderId: existingOrder._id,
            paymentStatus: 'completed'
          }
        });
      }

      // Create order if payment is complete but no order exists
      const order = await createOrderFromPayment(payment);
      return res.status(200).json({
        success: true,
        message: "Payment verified successfully",
        data: {
          orderId: order._id,
          paymentStatus: 'completed'
        }
      });
    }

    // If payment is still pending, check with M-Pesa API
    const accessToken = await getMpesaAccessToken();
    const { password, timestamp } = generatePassword();

    const queryResponse = await axios.post(
      'https://sandbox.safaricom.co.ke/mpesa/stkpushquery/v1/query',
      {
        BusinessShortCode: MPESA_BUSINESS_SHORTCODE,
        Password: password,
        Timestamp: timestamp,
        CheckoutRequestID: checkoutRequestID
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // Check payment status
    if (queryResponse.data.ResultCode === '0') {
      // Payment successful
      payment.status = 'completed';
      payment.mpesaReceiptNumber = queryResponse.data.MpesaReceiptNumber;
      payment.transactionDate = new Date();
      await payment.save();

      // Create order
      const order = await createOrderFromPayment(payment);

      return res.status(200).json({
        success: true,
        message: "Payment verified successfully",
        data: {
          orderId: order._id,
          paymentStatus: 'completed'
        }
      });
    } else {
      // Payment failed
      payment.status = 'failed';
      payment.errorCode = queryResponse.data.ResultCode;
      payment.errorMessage = queryResponse.data.ResultDesc;
      await payment.save();

      return res.status(400).json({
        success: false,
        message: queryResponse.data.ResultDesc,
        errorCode: queryResponse.data.ResultCode
      });
    }

  } catch (error: any) {
    console.error("Payment verification error:", error);
    return res.status(500).json({
      success: false,
      message: error.response?.data?.errorMessage || "Failed to verify payment",
      error: error.message
    });
  }
};

// Helper function to create order from payment
const createOrderFromPayment = async (payment: any) => {
  const order = new Order({
    user: payment.user,
    courses: payment.courses,
    payment: payment._id,
    amount: payment.amount,
    status: 'completed'
  });

  await order.save();
  return order;
};

// M-Pesa callback handler
export const mpesaCallback = async (req: Request, res: Response) => {
  try {
    const callbackData = req.body;
    
    if (!callbackData.Body.stkCallback) {
      return res.status(400).json({ success: false, message: "Invalid callback" });
    }

    const { CheckoutRequestID, ResultCode, CallbackMetadata } = callbackData.Body.stkCallback;
    
    // Find the payment record
    const payment = await Payment.findOne({ checkoutRequestID: CheckoutRequestID });
    
    if (!payment) {
      return res.status(404).json({ success: false, message: "Payment not found" });
    }

    if (ResultCode === '0') {
      // Payment was successful
      const metadata = CallbackMetadata.Item.reduce((acc: any, item: any) => {
        acc[item.Name] = item.Value;
        return acc;
      }, {});

      payment.status = 'completed';
      payment.mpesaReceiptNumber = metadata.MpesaReceiptNumber;
      payment.transactionDate = new Date(metadata.TransactionDate);
      await payment.save();

      // Create order
      await createOrderFromPayment(payment);
    } else {
      // Payment failed
      payment.status = 'failed';
      payment.errorCode = ResultCode;
      payment.errorMessage = callbackData.Body.stkCallback.ResultDesc;
      await payment.save();
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Callback error:", error);
    return res.status(500).json({ success: false, message: "Error processing callback" });
  }
};
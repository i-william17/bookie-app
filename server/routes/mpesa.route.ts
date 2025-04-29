import express from "express";
import {
  initiatePayment,
  verifyPayment,
  mpesaCallback,
} from "../controllers/mpesa.controller";
import { isAutheticated } from "../middleware/auth";

const mpesaRouter = express.Router();

// Initiate M-Pesa STK push
mpesaRouter.post('/initiate-stkpush', isAutheticated, initiatePayment)

// Verify payment status
mpesaRouter.post("/verify-payment", isAutheticated, verifyPayment);

mpesaRouter.post('/callback', mpesaCallback)


export default mpesaRouter;
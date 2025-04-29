import express from "express";
import { authorizeRoles, isAutheticated } from "../middleware/auth";
import {
  createOrder,
  getAllOrders,
} from "../controllers/order.controller";

const orderRouter = express.Router();

// Create new order with M-Pesa payment
orderRouter.post(
  "/create-order", 
  isAutheticated,
  createOrder
);

// Get all orders (admin only)
orderRouter.get(
  "/get-orders",
  isAutheticated,
  authorizeRoles("admin"),
  getAllOrders
);

export default orderRouter;
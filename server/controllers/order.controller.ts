import { NextFunction, Request, Response } from "express";
import { CatchAsyncError } from "../middleware/catchAsyncErrors";
import ErrorHandler from "../utils/ErrorHandler";
import { IOrder } from "../models/order.Model";
import userModel from "../models/user.model";
import CourseModel from "../models/course.model";
import path from "path";
import ejs from "ejs";
import sendMail from "../utils/sendMail";
import NotificationModel from "../models/notification.Model";
import { getAllOrdersService, newOrder } from "../services/order.service";
import { redis } from "../utils/redis";

// Create order with M-Pesa payment
export const createOrder = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { courseId, payment_info } = req.body as IOrder;
      const user = await userModel.findById(req.user?._id);

      if (!user) {
        return next(new ErrorHandler("User not found", 404));
      }

      // Validate course exists
      const course = await CourseModel.findById(courseId);
      if (!course) {
        return next(new ErrorHandler("Course not found", 404));
      }

      // Check if user already purchased the course
      const courseExistInUser = user.courses.some(
        (c: any) => c._id.toString() === courseId
      );
      if (courseExistInUser) {
        return next(
          new ErrorHandler("You have already purchased this course", 400)
        );
      }

      // Validate M-Pesa payment info
      if (!payment_info?.MerchantRequestID || !payment_info?.CheckoutRequestID) {
        return next(new ErrorHandler("Invalid M-Pesa payment information", 400));
      }

      // Prepare order data
      const data: any = {
        courseId: course._id,
        userId: user._id,
        payment_info,
      };

      // Send confirmation email
      try {
        const mailData = {
          order: {
            _id: course._id.toString().slice(0, 6),
            name: course.name,
            price: course.price,
            date: new Date().toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            }),
          },
        };

        const html = await ejs.renderFile(
          path.join(__dirname, "../mails/order-confirmation.ejs"),
          { order: mailData }
        );

        await sendMail({
          email: user.email,
          subject: "Order Confirmation",
          template: "order-confirmation.ejs",
          data: mailData,
        });
      } catch (error: any) {
        console.error("Failed to send email:", error.message);
      }

      // Update user courses
      user.courses.push(course._id);
      await redis.set(user._id, JSON.stringify(user));
      await user.save();

      // Create notification
      await NotificationModel.create({
        user: user._id,
        title: "New Order",
        message: `You have a new order from ${course.name}`,
      });

      // Update course purchase count
      course.purchased += 1;
      await course.save();

      // Create the order
      newOrder(data, res, next);

    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// Get all orders (admin only)
export const getAllOrders = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      getAllOrdersService(res);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);
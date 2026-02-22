import express from "express";
import dotenv from "dotenv";
dotenv.config({ quiet: true });
import cors from 'cors';
import userRoutes from "./src/routes/user/user.routes.js";
import { errorMiddleware } from "./src/middlewares/error.middleware.js";
import cookieParser from "cookie-parser";
import productRoutes from "./src/routes/shop/product.route.js";
import adminRoutes from "./src/routes/admin/product.route.js";
import adminCategoryRoutes from "./src/routes/admin/category.route.js";
import adminSubCategoryRoutes from "./src/routes/admin/subCategory.route.js";
import adminDeliveryAgentRoutes from "./src/routes/admin/deliveryAgent.route.js";
import adminUserRoutes from "./src/routes/admin/user.route.js";
import addressRoutes from "./src/routes/user/address.route.js";
import cartRouter from "./src/routes/user/cart.route.js";
import orderRoutes from "./src/routes/user/order.route.js";
import adminOrderRoutes from "./src/routes/admin/order.route.js";
import locationRoutes from "./src/routes/location.route.js";
import deliveryRoutes from "./src/routes/agent/delivery.route.js";
import reviewRoutes from "./src/routes/user/review.route.js";
import helpTicketRoutes from "./src/routes/user/helpTicket.route.js";
import adminHelpTicketRoutes from "./src/routes/admin/helpTicket.route.js";
import adminDashboardRoutes from "./src/routes/admin/dashboard.route.js";

const app = express();
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:5174"],
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use("/api/v1/admin/product",adminRoutes);
app.use("/api/v1/admin/category", adminCategoryRoutes);
app.use("/api/v1/admin/subcategory", adminSubCategoryRoutes);
app.use("/api/v1/admin/delivery-agent", adminDeliveryAgentRoutes);
app.use("/api/v1/admin/user", adminUserRoutes);
app.use("/api/v1/shop/product",productRoutes);
app.use("/api/v1/user", userRoutes);
app.use("/api/v1/user/address", addressRoutes);
app.use("/api/v1/cart",cartRouter)
app.use("/api/v1/user/order", orderRoutes)
app.use("/api/v1/admin/order", adminOrderRoutes)
app.use("/api/v1/admin/help-tickets", adminHelpTicketRoutes);
app.use("/api/v1/admin/dashboard", adminDashboardRoutes);
app.use("/api/v1/user/review", reviewRoutes);
app.use("/api/v1/user/help", helpTicketRoutes);
app.use("/api/v1/delivery", deliveryRoutes);
app.use("/api/location", locationRoutes);
app.use("/api/v1/location", locationRoutes);

app.use(errorMiddleware);
export default app;

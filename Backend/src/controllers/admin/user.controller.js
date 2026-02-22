import expressAsyncHandler from "express-async-handler";
import ApiResponse from "../../utils/ApiResponse.util.js";
import UserModel from "../../models/user.model.js";
import AddressModel from "../../models/address.model.js";
import OrderModel from "../../models/order.model.js";

export const getAllUsersWithOrders = expressAsyncHandler(
  async (req, res, next) => {
    const users = await UserModel.find({ role: "user" })
      .select(
        "-password -passwordVerificationToken -passwordVerificationTokenExpire -emailVerificationToken -emailVerificationTokenExpire",
      )
      .lean();

    if (!users || users.length === 0) {
      return new ApiResponse(200, "No users found", []).send(res);
    }

    const userIds = users.map((user) => user._id);
    const [addresses, orders] = await Promise.all([
      AddressModel.find({ user: { $in: userIds } }).lean(),
      OrderModel.find({ user: { $in: userIds } })
        .sort({ createdAt: -1 })
        .lean(),
    ]);

    const addressMap = new Map();
    for (const address of addresses) {
      const key = String(address.user);
      if (!addressMap.has(key)) addressMap.set(key, []);
      addressMap.get(key).push(address);
    }

    const orderMap = new Map();
    for (const order of orders) {
      const key = String(order.user);
      if (!orderMap.has(key)) orderMap.set(key, []);
      orderMap.get(key).push(order);
    }

    const payload = users.map((user) => {
      const id = String(user._id);
      return {
        ...user,
        id: user._id,
        addresses: addressMap.get(id) || [],
        orders: orderMap.get(id) || [],
      };
    });

    new ApiResponse(200, "Fetched users successfully", payload).send(res);
  },
);

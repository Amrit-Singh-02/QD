import expressAsyncHandler from "express-async-handler";
import CategoryModel from "../../models/category.model.js";
import ApiResponse from "../../utils/ApiResponse.util.js";

export const fetchCategories = expressAsyncHandler(async (req, res) => {
  const categories = await CategoryModel.find()
    .sort({ createdAt: -1 })
    .select("-__v")
    .lean();

  new ApiResponse(200, "Categories fetched successfully", categories).send(res);
});

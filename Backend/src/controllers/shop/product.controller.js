import expressAsyncHandler from "express-async-handler";
import ProductModel from "../../models/product.model.js";
import ApiResponse from "../../utils/ApiResponse.util.js";
import CustomError from "../../utils/customError.util.js";

const escapeRegex = (value = "") =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const buildKeywordFilter = (keywords = []) => {
  if (!keywords.length) return null;
  const keywordOr = [];
  keywords.forEach((keyword) => {
    const trimmed = keyword.trim();
    if (!trimmed) return;
    const regex = new RegExp(escapeRegex(trimmed), "i");
    keywordOr.push(
      { name: { $regex: regex } },
      { brand: { $regex: regex } },
      { description: { $regex: regex } },
    );
  });
  if (!keywordOr.length) return null;
  return { $or: keywordOr };
};

export const fetchProducts = expressAsyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 12, 1), 50);
  const query = (req.query.q || "").trim();
  const keywordsParam = (req.query.keywords || "").trim();
  const quick = (req.query.quick || "all").trim();
  const sort = (req.query.sort || "featured").trim();

  const andFilters = [];
  const keywordFilter = buildKeywordFilter(
    keywordsParam.split(",").map((item) => item.trim()).filter(Boolean),
  );
  if (keywordFilter) {
    andFilters.push(keywordFilter);
  }

  if (query) {
    const queryRegex = new RegExp(escapeRegex(query), "i");
    andFilters.push({
      $or: [
        { name: { $regex: queryRegex } },
        { brand: { $regex: queryRegex } },
        { description: { $regex: queryRegex } },
      ],
    });
  }

  if (quick === "deals") {
    andFilters.push({ discount: { $gt: 0 } });
  } else if (quick === "under-99") {
    andFilters.push({ price: { $lte: 99 } });
  }

  const filter = andFilters.length ? { $and: andFilters } : {};
  const totalItems = await ProductModel.countDocuments(filter);
  const totalPages = Math.max(Math.ceil(totalItems / limit), 1);
  const currentPage = Math.min(page, totalPages);
  const skip = (currentPage - 1) * limit;

  let sortOption = { createdAt: -1 };
  if (sort === "price-asc") {
    sortOption = { price: 1 };
  } else if (sort === "price-desc") {
    sortOption = { price: -1 };
  } else if (sort === "discount") {
    sortOption = { discount: -1 };
  }

  const products = await ProductModel.find(filter)
    .sort(sortOption)
    .skip(skip)
    .limit(limit)
    .select("-__v")
    .lean({ virtuals: true });

  const meta = {
    page: currentPage,
    limit,
    totalItems,
    totalPages,
    hasNext: currentPage < totalPages,
    hasPrev: currentPage > 1,
  };

  new ApiResponse(200, "Products Fetched Successfully", products, meta).send(
    res,
  );
});

export const fetchProduct = expressAsyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const product = await ProductModel.findById(id)
    .select("-__v")
    .lean({ virtuals: true });
  if (!product) next(new CustomError(404, "Product Not Found"));
  new ApiResponse(200, "Product Fetched Successfully", product).send(res);
});

export const searchProducts = expressAsyncHandler(async (req, res, next) => {
  const { keyword } = req.query;
  const searchRegex = new RegExp(keyword, "i");

  const products = await ProductModel.find({
    $or: [
      { name: { $regex: searchRegex } },
      { description: { $regex: searchRegex } },
      { category: { $regex: searchRegex } },
      { brand: { $regex: searchRegex } },
    ],
  })
    .select("-__v")
    .lean({ virtuals: true });

  if (!products.length) {
    return next(new CustomError(404, "No products found"));
  }

  new ApiResponse(200, "Products fetched successfully", products).send(
    res
  );
});

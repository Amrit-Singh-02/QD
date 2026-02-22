import CustomError from "../utils/customError.util.js";

export const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
    });

    if (error) {
      next(new CustomError(400, `${error.details.map((ele) => ele.message)}`));
    }
    req.body = value;
    next();
  };
};

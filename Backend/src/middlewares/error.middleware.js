//! Global Error Middleware 
export const errorMiddleware = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Something went wrong";

  if (err.name === "ValidationError") {
    statusCode = 400;
    message = `${Object.values(err.errors).map((ele) => ele.message)}`;
  }

  if (err.code == 11000) {
    statusCode = 409;
    message = `${Object.keys(err.keyValue)[0]} already exists`;
  }

  if (err.name === "CastError") {
    statusCode = 400;
    message = "Invalid MongoDB ID";
  }

  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid session, Please login again";
  }

  res
    .status(statusCode)
    .json({ success: false, message, errObj: err, errLine: err.stack });
};


// ! More error case for my notes

//?   ==============================
// ?   JWT / AUTH ERRORS (except JsonWebTokenError)
//? ================================ 

// if (err.name === "TokenExpiredError") {
//   statusCode = 401;
//   message = "Session expired, please login again";
// }

// if (err.message === "jwt must be provided") {
//   statusCode = 401;
//   message = "Authentication token missing";
// }

// if (err.message === "jwt malformed") {
//   statusCode = 401;
//   message = "Invalid token format";
// }

// if (err.message === "invalid signature") {
//   statusCode = 401;
//   message = "Invalid token signature";
// }

// ?==============================
// ?   MONGOOSE / DATABASE ERRORS
// ?================================ */

// if (err.name === "DocumentNotFoundError") {
//   statusCode = 404;
//   message = "Document not found";
// }

// if (err.name === "StrictPopulateError") {
//   statusCode = 400;
//   message = "Invalid populate field";
// }

// if (err.name === "ValidatorError") {
//   statusCode = 400;
//   message = err.message;
// }

// if (err.name === "OverwriteModelError") {
//   statusCode = 500;
//   message = "Model already compiled";
// }

// if (err.name === "MongoServerError") {
//   statusCode = 500;
//   message = "Database error occurred";
// }

// if (err.name === "ParallelSaveError") {
//   statusCode = 400;
//   message = "Multiple saves detected on same document";
// }

// ? ==============================
// ?   EXPRESS / REQUEST ERRORS
// ?================================ */

// if (err.type === "entity.too.large") {
//   statusCode = 413;
//   message = "Request payload too large";
// }

// if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
//   statusCode = 400;
//   message = "Invalid JSON format";
// }

// if (err.status === 429) {
//   statusCode = 429;
//   message = "Too many requests, please try again later";
// }

// if (err.code === "EBADCSRFTOKEN") {
//   statusCode = 403;
//   message = "Invalid CSRF token";
// }

// ? ==============================
// ?   FILE UPLOAD (MULTER)
// ?================================ */

// if (err.code === "LIMIT_FILE_SIZE") {
//   statusCode = 413;
//   message = "Uploaded file is too large";
// }

// if (err.code === "LIMIT_FILE_COUNT") {
//   statusCode = 400;
//   message = "Too many files uploaded";
// }

// if (err.code === "LIMIT_UNEXPECTED_FILE") {
//   statusCode = 400;
//   message = "Unexpected file field";
// }

// ? ==============================
// ?   NODE / SYSTEM ERRORS
// ?================================ */

// if (err.code === "ENOENT") {
//   statusCode = 404;
//   message = "File not found";
// }

// if (err.code === "ECONNREFUSED") {
//   statusCode = 503;
//   message = "Service unavailable";
// }

// if (err.code === "ETIMEDOUT") {
//   statusCode = 504;
//   message = "Request timed out";
// }

// if (err.code === "EPIPE") {
//   statusCode = 500;
//   message = "Broken pipe error";
// }

// if (err.code === "ENOMEM") {
//   statusCode = 500;
//   message = "Server out of memory";
// }

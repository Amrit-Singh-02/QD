import express from "express";
import stripe from "../../config/stripe.config.js";
import CustomError from "../../utils/customError.util.js";

const router = express.Router();

router.post("/create-payment-intent", async (req, res, next) => {

  const { amount } = req.body;
  const parsedAmount = Number(amount);

  if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
    return next(new CustomError(400, "Valid amount is required"));
  }

  try {

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(parsedAmount * 100),
      currency: "inr",
      automatic_payment_methods: {
        enabled: true,
      },
    });

    res.send({
      clientSecret: paymentIntent.client_secret
    });

  } catch (error) {
    return next(new CustomError(500, error?.message || "Payment intent failed"));
  }

});

export default router;

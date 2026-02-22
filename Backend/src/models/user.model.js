import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    phone: {
      type: String,
      required: true,
      unique: true,
    },
    role: {
      type: String,
      enum: ["user", "admin", "delivery"],
      default: "user",
    },
    isVerified: {
      type: Boolean,
      default: false,
    },

    // ! for email verification
    emailVerificationToken: {
      type: String,
    },
    emailVerificationTokenExpire: {
      type: Date,
    },

    // ! for reset password
    passwordVerificationToken: {
      type: String,
    },
    passwordVerificationTokenExpire: {
      type: Date,
    },
  },
  {
    timestamps: true,

    toJSON: {
      transform(doc, ret) {
        // delete ret.password,
        delete ret.__v;
        ret.id = ret._id;
        delete ret._id;
      },
    },
    toObject: {
      transform(doc, ret) {
        // delete ret.password;
        delete ret.__v;
        ret.id = ret._id;
        delete ret._id;
      },
    },
  },
);

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  //? this function will only execute when the modified field is  password
  let salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.generateEmailVerificationToken = function () {
  let randomByte = crypto.randomBytes(32).toString("hex");
  this.emailVerificationToken = crypto
    .createHash("sha256")
    .update(randomByte)
    .digest("hex");

  this.emailVerificationTokenExpire = Date.now() + 15 * 60 * 1000;
  return randomByte;
};

userSchema.methods.generatePasswordVerificationToken = function () {
  let randomByte = crypto.randomBytes(32).toString("hex");
  this.passwordVerificationToken = crypto
    .createHash("sha256")
    .update(randomByte)
    .digest("hex");
  this.passwordVerificationTokenExpire = Date.now() + 5 * 60 * 1000;
  return randomByte;
};
const userModel = new mongoose.model("User", userSchema);

export default userModel;
const mongoose = require("mongoose");
const { Schema } = mongoose;
const { ObjectId } = Schema;

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: true,
    },
    email: {
      type: String,
      trim: true,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
      minliength: 8,
      maxlength: 32,
    },
    picture: {
      type: String,
      default: "/avatar.png",
    },
    role: {
      type: [String],
      default: ["Subscriber"],
      enum: ["Subscriber", "Instructor", "Admin"],
    },
    stripe_account_id: "",
    stripe_seller: {},
    stripeSession: {},
    passwordResetCode: {
      data: String,
      default: "",
    },
    courses: [{ type: ObjectId, ref: "Course" }],
  },
  { timestamp: true }
);

module.exports = mongoose.model("User", userSchema);

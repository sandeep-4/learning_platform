const Course = require("../models/course");
const User = require("../models/user");
const stripe = require("stripe")(process.env.STRIPE_SECRET);
const queryString = require("query-string");

exports.makeInstructor = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).exec();
    if (!user.stripe_account_id) {
      const account = await stripe.accounts.create({ type: "express" });
      user.stripe_account_id = account.id;
      user.save();
    }

    let accountLink = await stripe.accountLinks.create({
      account: user.stripe_account_id,
      refresh_url: process.env.STRIPE_REDIRECT_URL,
      return_url: process.env.STRIPE_REDIRECT_URL,
      type: "account_onboarding",
    });
    //prefill info
    accountLink = Object.assign(accountLink, {
      "stripe_user[email]": user.email,
    });
    res.send(`${accountLink.url}?${queryString.stringify(accountLink)}`);
  } catch (error) {
    console.log(error);
  }
};

exports.getAccountStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).exec();
    const account = await stripe.accounts.retrieve(user.stripe_account_id);

    if (!account.charges_enabled) {
      return res.status(401).send("Unauthorized");
    } else {
      const statusUpdated = await User.findByIdAndUpdate(
        user._id,
        {
          stripe_seller: account,
          $addToSet: { role: "Instructor" },
        },
        { new: true }
      )
        .select("-password")
        .exec();
      res.json(statusUpdated);
    }
  } catch (error) {
    console.log(error);
  }
};

exports.currentInstructor = async (req, res) => {
  try {
    let user = await User.findById(req.user._id).select("-password").exec();
    if (!user.role.includes("Instructor")) {
      return res.sendStatus(403);
    } else {
      res.json({ ok: true });
    }
  } catch (error) {
    console.log(err);
  }
};

exports.instructorCourses = async (req, res) => {
  try {
    const courses = await Course.find({ instructor: req.user._id })
      .sort({ createdAt: -1 })
      .exec();
    res.json(courses);
  } catch (err) {
    console.log(err);
  }
};

exports.studentCount = async (req, res) => {
  try {
    const users = await User.find({ courses: req.body.courseId })
      .select("_id")
      .exec();
    res.json(users);
  } catch (error) {
    console.log(err);
  }
};

exports.instructorBalance = async (req, res) => {
  try {
    let user = await User.findById(req.user._id);
    const loginLink = await stripe.accounts.createLoginLink(
      user.stripe_seller.id,
      { redirect_url: process.env.STRIPE_SETTINGS_REDIRECT }
    );
    res.json(loginLink.url);
  } catch (error) {
    console.log("stripe login", err);
  }
};

exports.instructorPayoutSettings = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).exec();
    const loginLink = await stripe.accounts.createLoginLink(
      user.stripe_seller.id,
      {
        redirect_url: process.env.STRIPE_SETTINGS_REDIRECT,
      }
    );
    res.json(loginLink.url);
  } catch (error) {
    console.log("stripe not processed");
  }
};

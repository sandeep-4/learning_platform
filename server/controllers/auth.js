const User = require("../models/user");
const jwt = require("jsonwebtoken");
const { nanoid } = require("nanoid");
const AWS = require("aws-sdk");
// const { comparePassword, hashPassword } = require("../utils/auth");
// const { use } = require("bcrypt/promises");

const bcrypt = require("bcrypt");
//hasing and passwords
// const hashPassword = (password) => {
//   return new Promise((resolve, reject) => {
//     bcrypt.genSalt(12, (err, salt) => {
//       if (err) {
//         reject(err);
//       }
//       bcrypt.hash(password, salt, (err, hash) => {
//         if (err) {
//           reject(err);
//         }
//         resolve(hash);
//       });
//     });
//   });
// };

// const comparePassword = (password, hashed) => {
//   return bcrypt.compare(password, hashed);
// };
//hasing and password complete
const awsConfig = {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
  apiVersion: process.env.AWS_API_VERSION,
};

const SES = new AWS.SES(awsConfig);

exports.register = async (req, res) => {
  try {
    const { email, name, password } = req.body;
    if (!name) return res.status(400).send("Name is required");
    if (!password || password.lenhth < 8) {
      return res.status(400).send("Password must be 8 or more");
    }
    let userExists = await User.findOne({ email }).exec();
    if (userExists) return res.status(400).send("Email is already used");

    const salt = await bcrypt.genSalt(10);
    const hashedpw = await bcrypt.hash(password, salt);
    const hashedPassword = hashedpw;

    const user = new User({
      name,
      email,
      password: hashedPassword,
    });
    await user.save();
    return res.json({ ok: true });
  } catch (err) {
    console.log(err);
    return res.status(400).send(`Try again`);
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).exec();
    if (!user) return res.status(400).send("No user found");

    // const match = await comparePassword(password, user.password);
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).send("Invalid credientials");

    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });
    user.password = undefined;
    res.cookie("token", token, {
      httpOnly: true,
    });

    res.json(user);
  } catch (err) {
    return res.status(400).send("Error login");
  }
};

exports.logout = async (req, res) => {
  try {
    res.clearCookie("token");
    return res.json({ message: "Logged out" });
  } catch (err) {
    console.log(err);
  }
};

exports.currentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password").exec();
    console.log(user);
    return res.json({ ok: true });
  } catch (err) {
    console.log(err);
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const shortCode = nanoid(6).toUpperCase();
    const user = await User.findOneAndUpdate(
      {
        email,
      },
      { passwordResetCode: shortCode }
    );

    if (!user) return res.status(400).send("User not found");

    const params = {
      Source: process.env.EMAIL_FROM,
      Destination: {
        ToAddresses: [email],
      },
      Message: {
        Body: {
          Html: {
            Charset: "UTF-8",
            Data: `
                    <html>
                    <h1>Reset your Password</h1>
                    <p>this code is one time code to reset your password</p>
                    <h2>${shortCode}</h2>
                    <i>eudemy</i>
                    </html>
                    `,
          },
        },
        Subject: {
          Charset: "UTF-8",
          Data: "Reset your password",
        },
      },
    };
    const emailSent = SES.sendEmail(params).promise();

    emailSent
      .then((data) => {
        res.json({ ok: true });
      })
      .catch((err) => {
        console.log(err);
      });
  } catch (err) {
    console.log(err);
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;
    const hashedPassword = await hashPassword(newPassword);

    const user = await User.findOneAndUpdate(
      {
        email,
        passowordResetCode: code,
      },
      {
        passoword: hashPassword,
        passowordResetCode: "",
      }
    ).exec();
    res.json({ ok: true });
  } catch (error) {
    return res.status(400).send("Error reset password");
  }
};

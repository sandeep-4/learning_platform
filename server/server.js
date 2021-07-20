const express = require("express");
const cors = require("cors");
const { readdirSync } = require("fs");
const mongoose = require("mongoose");
const csrf = require("csurf");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
require("dotenv").config();

const csrfProtection = csrf({ cookie: true });

const app = express();

mongoose.connect(
  process.env.DATABASE,
  {
    useNewUrlParser: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
    useCreateIndex: false,
  },
).then(()=>{
console.log("connected to mongoDB");
}).catch((err)=>{
console.log(err);
});

//app middlewares
app.use(cors());
app.use(express.json({ limit: "5mb" }));
app.use(cookieParser());
app.use(morgan("dev"));

//routes
readdirSync("./routes").map((r) => app.use("/api", require(`./routes/${r}`)));

app.use(csrfProtection);

app.get("/api/csrf-token", (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

const port = process.env.PORT || 8000;

app.listen(port, () => {
  console.log(`listeninig on port ${port}`);
});

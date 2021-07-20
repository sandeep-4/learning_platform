const AWS = require("aws-sdk");
const { nanoid } = require("nanoid");
const Course = require("../models/course");
const Completed = require("../models/completed");
const slugify = require("slugify");
const { readFileSync } = require("fs");
const User = require("../models/user");
const stripe = require("stripe")(process.env.STRIPE_SECRET);

const awsConfig = {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
  apiVersion: process.env.AWS_API_VERSION,
};

const S3 = new AWS.S3(awsConfig);

exports.uploadImage = async (req, res) => {
  try {
    const { image } = req.body;
    if (!image) return require.status(400).send("No image");

    const base64Data = new Buffer.from(
      image.replace(/^data:image\/\w+;base64,/, ""),
      "base64"
    );
    const type = image.split(";")[0].split("/")[1];

    //params
    const params = {
      Bucket: "eudemy-bucket",
      Key: `${nanoid()}.${type}`,
      Body: base64Data,
      ACL: "public-read",
      contentEncoding: "base64",
      contentType: `image/${type}`,
    };
    //upload to S3
    S3.upload(params, (err, data) => {
      if (err) {
        console.log(err);
        return res.sendStatus(400);
      }
      res.send(data);
    });
  } catch (error) {
    console.log(error);
  }
};

exports.removeImage = async (req, res) => {
  try {
    const { image } = req.body;
    const params = {
      Bucket: image.Bucket,
      Key: image.Key,
    };
    S3.deleteObject(params, (err, data) => {
      if (err) {
        res.sendStatus(400);
      }
      res.send({ ok: true });
    });
  } catch (error) {
    console.log(err);
  }
};

exports.create = async (req, res) => {
  try {
    const alreadyExist = await Course.findOne({
      slug: slugify(req.body.name.toLowerCase()),
    });
    if (alreadyExist) return res.status(400).send("Try anither title");

    const course = await new course({
      slug: slugify(req.body.name),
      instructor: req.user._id,
      ...req.body,
    }).save();
    res.json(course);
  } catch (error) {
    return res.status(400).send("Unable to create course");
  }
};

exports.read = async (req, res) => {
  try {
    const course = await Course.findOne({ slug: req.params.slug })
      .populate("instuctor", "_id name")
      .exec();
    res.json(course);
  } catch (error) {
    console.log(error);
  }
};

exports.uploadVideo = async (req, res) => {
  try {
    if (req.user._id != req.params.instructorId) {
      return res.status(400).send("Unauthorized");
    }

    const { video } = req;
    if (!video) return res.status(400).send("No video");

    const params = {
      Bucket: "eudemy-bucket",
      Key: `${nanoid()}.${video.type.split("/")[1]}`,
      Body: readFileSync(video.path),
      ACL: "public-read",
      ContentType: video.type,
    };

    S3.upload(params, (err, data) => {
      if (err) {
        console.log(err);
        res.sendStatus(400);
      }
      res.send(data);
    });
  } catch (error) {
    console.log(error);
  }
};

exports.removeVideo = async (req, res) => {
  try {
    if (req.user._id != req.params.instructorId) {
      return res.status(400).send("Unauthorized");
    }

    const { Bucket, Key } = req.body;
    const params = {
      Bucket,
      Key,
    };

    S3.deleteObject(params, (err, data) => {
      if (err) {
        res.sendStatus(400);
      }
      res.send({ ok: true });
    });
  } catch (error) {
    console.log(error);
  }
};

exports.addLesson = async (req, res) => {
  try {
    const { slug, instructorId } = req.params;
    const { title, content, video } = req.body;

    if (req.user._id != instructorId) {
      return res.status(400).send("Unauthorized");
    }

    const updated = await Course.findOneAndUpdate(
      { slug },
      {
        $push: { lessons: { title, content, video, slug: slugify(title) } },
      },
      { new: true }
    )
      .populate("instructor", "_id name")
      .exec();
    res.json(updated);
  } catch (error) {
    return res.status(400).send("Unaable to add lessons");
  }
};

exports.update = async (req, res) => {
  try {
    const { slug } = req.params;
    const course = await Course.findOne({ slug }).exec();
    if (req.user._id != course.instructorId) {
      return res.status(400).send("Unauthorized");
    }

    const updated = await Course.findOneAndUpdate({ slug }, req.body, {
      new: true,
    }).exec();

    res.json(updated);
  } catch (err) {
    console.log(err);
    return res.status(400).send(err.message);
  }
};

exports.removeLesson = async (req, res) => {
  const { slug, lessionId } = req.params;
  const course = await Course.findOne({ slug }).exec();
  if (req.user._id != course.instructorId) {
    return res.status(400).send("Unauthorized");
  }
  const deleteCourse = await Course.findByIdAndUpdate(course_id, {
    $pull: { lesson: { _id: lessonId } },
  }).exec();

  res.json({ ok: true });
};

exports.updateLesson = async (req, res) => {
  try {
    const { slug } = req.params;
    const { _id, title, content, video, free_preview } = req.body;
    const course = await Course.findOne({ slug }).select("instructor").exec();

    if (course.instructor._id != req.user._id) {
      return res.status(400).send("Unauthorized");
    }

    const updated = await Course.updateOne(
      { "lessons._id": _id },
      {
        $set: {
          "lesson.$.title": title,
          "lesson.$.content": content,
          "lesson.$.video": video,
          "lesson.$.free_preview": free_preview,
        },
      },
      { new: true }
    ).exec();

    res.json({ ok: true });
  } catch (error) {
    return res.status(400).send("couldnt update");
  }
};

exports.publishCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const course = await Course.findById(couseId).select("instructor").exec();
    if (course.instructor._id != req.user._id) {
      return res.status(400).send("Unauthorized");
    }

    const updated = await Course.findByIdAndUpdate(
      courseId,
      { published: true },
      { new: true }
    ).exec();

    res.json(updated);
  } catch (error) {
    return res.status(400).send("couldnt publish");
  }
};

exports.unpublishCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const course = await Course.findById(couseId).select("instructor").exec();
    if (course.instructor._id != req.user._id) {
      return res.status(400).send("Unauthorized");
    }

    const updated = await Course.findByIdAndUpdate(
      courseId,
      { published: false },
      { new: true }
    ).exec();

    res.json(updated);
  } catch (error) {
    return res.status(400).send("couldnt unpublish");
  }
};

exports.courses = async (req, res) => {
  try {
    const all = await Course.find({ published: true })
      .populate("instructor", "_id name")
      .exec();
    res.json(all);
  } catch (error) {
    console.log(error);
  }
};

exports.checkEnrollment = async (req, res) => {
  const { courseId } = req.params;

  const user = await User.findById(req.user._id).exec();

  let ids = [];
  let length = user.courses && user.courses.length;

  for (let i = 0; i < length; i++) {
    ids.push(user.courses[i].toString());
  }
  res.json({
    status: ids.includes(courseId),
    course: await Course.findById(courseId).exec(),
  });
};

exports.freeEnrollment = async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId).exec();
    if (course.paid) return;

    const result = await User.findByIdAndUpdate(
      req.user._id,
      {
        $addToSet: { courses: course._id },
      },
      { new: true }
    ).exec();

    res.json({
      message: "Congratulation !You are enrolled",
      course,
    });
  } catch (error) {
    return res.status(400).send("couldnt enroll");
  }
};

exports.paidEnrollment = async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId)
      .populate("instructor")
      .exec();
    if (!course.paid) {
      return;
    }
    const fee = (course.price * 30) / 100;

    const session = await stripe.checkout.sessions.create({
      payment_method_type: ["card"],
      line_items: [
        {
          name: course.name,
          amount: Math.round(course.price.toFixed(2) * 100),
          currency: "usd",
          quantity: 1,
        },
      ],

      payment_intent_data: {
        application_fee_amount: Math.round(fee.toFixed(2) * 100),
        transfer_data: {
          destination: course.instructor.stripe_account_id,
        },
      },
      success_url: `${process.env.STRIPE_SUCCESS_URL}/${course._id}`,
      cancel_url: process.env.STRIPE_CANCEL_URL,
    });

    await User.findByIdAndUpdate(req.user._id, {
      stripeSession: session,
    }).exec();

    res.send(session.id);
  } catch (error) {
    return res.status(400).send("couldnt enroll paid");
  }
};

exports.stripeSuccess = async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId).exec();

    const user = await User.findById(req.user._id).exec();

    if (!user.stripeSession.id) return res.sendStatus(400);

    const session = await stripe.checkout.sessions.retrieve(
      user.stripeSession.id
    );

    if (session.payment_status === "paid") {
      await User.findByIdAndUpdate(user._id, {
        $addToSet: { courses: course._id },
        $set: { stripeSession: {} },
      }).exec();
    }
    res.json({ success: true, course });
  } catch (error) {
    res.json({ success: false });
  }
};

exports.userCourses = async (req, res) => {
  const user = await User.findById(req.user._id).exec();
  const courses = await Course.find({ _id: { $in: user.courses } })
    .populate("instructor", "_id name")
    .exec();
  res.json(courses);
};

exports.markCompleted = async (req, res) => {
  const { courseId, lessonId } = req.body;
  const existing = await Completed.findOne({
    user: req.user._id,
    course: courseId,
  }).exec();
  if (existing) {
    const updated = await Completed.findOneAndUpdate(
      {
        user: req.user._id,
        course: courseId,
      },
      {
        $addToSet: { lessons: lessonId },
      }
    ).exec();
    res.json({ ok: true });
  } else {
    const created = await new Completed({
      user: req.user._id,
      course: courseId,
      lessons: lessonId,
    }).save();
    res.json({ ok: true });
  }
};

exports.listCompleted = async (req, res) => {
  try {
    const list = await Completed.findOne({
      user: req.user._id,
      course: req.body.courseId,
    }).exec();
    list && res.json(list.lessons);
  } catch (error) {
    console.log(error);
  }
};

exports.markInComplete = async (req, res) => {
  try {
    const { courseId, lessonId } = req.body;
    const updated = await Completed.findOneAndUpdate(
      {
        user: req.user._id,
        course: req.body.courseId,
      },
      {
        $pull: { lessons: lessonId },
      }
    ).exec();

    res.json({ ok: true });
  } catch (error) {
    console.log(error);
  }
};

import express from "express";
import mongoose from "mongoose";
import bodyParser from "body-parser";
import ejs from "ejs";
import morgan from "morgan";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import Question from "./models/question.js";
import Answer from "./models/answer.js";
import User from "./models/user.js";

const app = express();

const URLdb = 'mongodb+srv://amar:password1234@stackoverflowdb.4qfrmio.mongodb.net/stackoverflowdb?retryWrites=true&w=majority&appName=stackoverflowdb';

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(morgan('dev'));
app.use(cookieParser());


mongoose.connect(URLdb, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("Connected to MongoDB");
    app.listen(4000, () => {
      console.log("Server is running on port 3000");
    });
  })
  .catch((err) => console.log("Failed to connect to the database: ", err));

const requireAuth = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).send("Unauthorized");
  }
  try {
    const decoded = jwt.verify(token, "your_jwt_secret");
    req.userId = decoded.userId;
    next();
  } catch (err) {
    res.status(401).send("Unauthorized");
  }
};

// Login route
app.get("/", (req, res) => {
  res.render("login");
});
//login post route 
app.post("/", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).send("Invalid email or password");
    }

    const token = jwt.sign({ userId: user._id }, "your_jwt_secret", { expiresIn: "1h" });
    res.cookie("token", token, { httpOnly: true });
    res.redirect("/home");
  } catch (err) {
    console.error("Error during login:", err);
    res.status(500).send("Error during login");
  }
});

// Signup route
app.get("/signup", (req, res) => {
  res.render("signup");
});
// signup post route which redirects to login get route
app.post("/signup", async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const user = new User({ username, email, password });
    await user.save();
    res.redirect("/");
  } catch (err) {
    console.error("Error during sign up:", err);
    res.status(500).send("Error during sign up");
  }
});

// Protected routes start from here 
//home page route 
app.get("/home", requireAuth, async (req, res) => {
  try {
    const questions = await Question.find();
    res.render("home", { questions });
  } catch (err) {
    console.error("Error fetching questions:", err);
    res.status(500).send("Error fetching questions");
  }
});
//home page route which will submit questions and display them on home page
app.post("/questions", requireAuth, async (req, res) => {
  try {
    const q = new Question({
      title: req.body.title,
      body: req.body.body,
      userId: req.userId
    });
    await q.save();
    res.redirect("/home");
  } catch (err) {
    console.error("Error saving question:", err);
    res.status(500).send("Error saving question");
  }
});
//questions page route where the answer will get submitted and be displayed
app.post("/questions/:id/answers", requireAuth, async (req, res) => {
  try {
    const answer = new Answer({
      body: req.body.body,
      questionId: req.params.id,
      userId: req.userId
    });
    await answer.save();
    res.redirect(`/questions/${req.params.id}`);
  } catch (err) {
    console.error("Error saving answer:", err);
    res.status(500).send("Error saving answer");
  }
});
//question page route
app.get("/questions/:id", requireAuth, async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    const answers = await Answer.find({ questionId: req.params.id });
    res.render("qna", { question, answers });
  } catch (err) {
    console.error("Error fetching question and answers:", err);
    res.status(500).send("Error fetching question and answers");
  } 
});

//logout button
app.get("/logout", (req, res) => {
    res.clearCookie("token"); 
    res.redirect("/"); 
  });
 
// profile route 
app.get("/profile", requireAuth, async (req, res) => {
    try {
      const user = await User.findById(req.userId);
      if (!user) {
        throw new Error('User not found');
      }
  
     
      const questions = await Question.find({ userId: req.userId });
      const answers = await Answer.find({ userId: req.userId });
  
     
      res.render("profile", { 
        username: user.username, 
        questions,
        answers
      });
    } catch (err) {
      console.error("Error fetching user, questions, or answers:", err);
      res.status(500).send("Error fetching user, questions, or answers");
    }
  });
  
  










 








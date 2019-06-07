const bodyParser = require("body-parser");
const express = require("express");

const router = express.Router();

router.use(bodyParser.json());

const thoughts = [
  { _id: 123, message: "I love peppa pig", author: "unknown" },
  { _id: 456, message: "I can't stand peppa pig", author: "unknown" },
];

router.get("/api/thoughts", (req, res) => {
  const orderedThoughts = thoughts.sort((t1, t2) => t2._id - t1._id);
  res.send(orderedThoughts);
});

router.post("/api/thoughts", ensureAuthenticated, (req, res) => {
  const { message } = req.body;
  const newThought = {
    _id: new Date().getTime(),
    message,
    author: req.user.displayName,
  };
  thoughts.push(newThought);
  res.send({ message: "Thanks!" });
});

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.send(401);
}

module.exports = router;

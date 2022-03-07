const express = require("express");
const bodyParser = require("body-parser");
const { randomBytes } = require("crypto");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(bodyParser.json());
app.use(cors());

const commentsByPostId = {
  1: [
    { id: "945a5e4b", content: "Word", status: "approved" },
    { id: "7dc58f5b", content: "hi", status: "approved" },
    { id: "5da2e461", content: "ah", status: "approved" },
  ],
  2: [
    { id: "a1def4cb", content: "weee", status: "approved" },
    { id: "60083e05", content: "woops", status: "approved" },
  ],
};

app.get("/posts/commentsbyids", (req, res) => {
  const requestedPostIds = Array.isArray(req.query.post)
    ? req.query.post
    : [req.query.post];

  const comments = {};
  Object.keys(commentsByPostId).forEach((post) => {
    if (requestedPostIds.includes(post)) {
      comments[post] = commentsByPostId[post];
    }
  });
  res.status(200).send(comments);
});

app.get("/posts/:id/comments", (req, res) => {
  res.send(commentsByPostId[req.params.id] || []);
});

app.post("/posts/:id/comments", async (req, res) => {
  const id = randomBytes(4).toString("hex");
  const { content } = req.body;

  const comments = commentsByPostId[req.params.id] || [];
  comments.push({ id: id, content, status: "pending" });

  await axios
    .post("http://event-bus-srv:4005/events", {
      type: "CommentCreated",
      data: {
        id,
        content,
        postId: req.params.id,
        status: "pending",
      },
    })
    .catch((err) => console.log(err.message));

  commentsByPostId[req.params.id] = comments;

  res.status(201).send(comments);
});

app.post("/events", async (req, res) => {
  console.log("received", req.body.type);

  const { type, data } = req.body;

  if (type === "CommentModerated") {
    const { postId, id, status, content } = data;

    const comments = commentsByPostId[postId];
    const comment = comments.find((comm) => comm.id === id);

    comment.status = status;

    await axios
      .post("http://event-bus-srv:4005/events", {
        type: "CommentUpdated",
        data: {
          id,
          content,
          postId,
          status,
        },
      })
      .catch((err) => console.log(err.message));
  }

  res.send({});
});

app.listen(4001, () => console.log("listening on 4001"));

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const {
  connectDb,
  collections,
  ensureSeedData,
  hashPassword,
} = require("./data/store");

const app = express();
const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || "replace-with-env-secret";

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

function authMiddleware(req, res, next) {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";

  if (!token) {
    return res.status(401).json({ message: "Missing auth token" });
  }

  try {
    req.admin = jwt.verify(token, JWT_SECRET);
    return next();
  } catch (_err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

function asyncHandler(handler) {
  return async (req, res, next) => {
    try {
      await handler(req, res, next);
    } catch (err) {
      next(err);
    }
  };
}

function getUserMap(users) {
  return Object.fromEntries(users.map((u) => [u.id, u]));
}

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "social-hub-admin-backend", db: "mongodb" });
});

app.post(
  "/api/admin/login",
  asyncHandler(async (req, res) => {
    const { username, password } = req.body || {};
    const c = collections();
    const admin = await c.admins.findOne({ username });

    if (!admin) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const suppliedHash = hashPassword(password || "", admin.passwordSalt);
    if (suppliedHash !== admin.passwordHash) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: "8h" });
    return res.json({ token, username });
  }),
);

app.get(
  "/api/admin/dashboard",
  authMiddleware,
  asyncHandler(async (_req, res) => {
    const c = collections();
    const [
      totalUsers,
      totalPosts,
      pendingRequests,
      openReports,
      todayActivity,
    ] = await Promise.all([
      c.users.countDocuments(),
      c.posts.countDocuments(),
      c.friendRequests.countDocuments({ status: "pending" }),
      c.reports.countDocuments({ status: "open" }),
      c.activity.find().sort({ date: -1 }).limit(1).next(),
    ]);

    res.json({
      totalUsers,
      totalPosts,
      pendingRequests,
      openReports,
      dailyActiveUsers: todayActivity?.dailyActiveUsers || 0,
      newUsersToday: todayActivity?.newUsers || 0,
    });
  }),
);

app.get(
  "/api/admin/users",
  authMiddleware,
  asyncHandler(async (_req, res) => {
    const c = collections();
    const users = await c.users.find({}, { projection: { _id: 0 } }).toArray();
    res.json(users);
  }),
);

app.put(
  "/api/admin/users/:id",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const { name, email, profilePicture, status } = req.body || {};
    const updates = {};

    if (name) updates.name = name;
    if (email) updates.email = email;
    if (profilePicture !== undefined) updates.profilePicture = profilePicture;
    if (status) updates.status = status;

    const c = collections();
    const result = await c.users.findOneAndUpdate(
      { id: req.params.id },
      { $set: updates },
      { returnDocument: "after", projection: { _id: 0 } },
    );

    if (!result) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json(result);
  }),
);

app.delete(
  "/api/admin/users/:id",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const userId = req.params.id;
    const c = collections();

    const user = await c.users.findOne({ id: userId });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await Promise.all([
      c.users.deleteOne({ id: userId }),
      c.posts.deleteMany({ userId }),
      c.friendRequests.deleteMany({
        $or: [{ fromUserId: userId }, { toUserId: userId }],
      }),
      c.friendships.deleteMany({ $or: [{ userId }, { friendId: userId }] }),
      c.reports.deleteMany({ reportedUserId: userId }),
    ]);

    return res.json({ message: "User deleted" });
  }),
);

app.get(
  "/api/admin/posts",
  authMiddleware,
  asyncHandler(async (_req, res) => {
    const c = collections();
    const posts = await c.posts
      .find({}, { projection: { _id: 0 } })
      .sort({ createdAt: -1 })
      .toArray();
    res.json(posts);
  }),
);

app.post(
  "/api/admin/posts",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const c = collections();
    const payload = req.body || {};

    if (!payload.content || !String(payload.content).trim()) {
      return res.status(400).json({ message: "Post content is required" });
    }

    const post = {
      id: uuidv4(),
      userId: payload.userId || null,
      userName: payload.userName || "Unknown",
      content: String(payload.content).trim(),
      mediaType: payload.mediaType || "none",
      mediaUrl: payload.mediaUrl || "",
      likes: Number(payload.likes || 0),
      comments: Number(payload.comments || 0),
      shares: Number(payload.shares || 0),
      commentItems: Array.isArray(payload.commentItems)
        ? payload.commentItems
        : [],
      flagged: Boolean(payload.flagged || false),
      createdAt: new Date().toISOString(),
    };

    await c.posts.insertOne(post);
    return res.status(201).json(post);
  }),
);

app.put(
  "/api/admin/posts/:id",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const {
      content,
      mediaUrl,
      mediaType,
      flagged,
      likes,
      comments,
      shares,
      commentItems,
    } = req.body || {};
    const updates = {};

    if (content !== undefined) updates.content = content;
    if (mediaUrl !== undefined) updates.mediaUrl = mediaUrl;
    if (mediaType !== undefined) updates.mediaType = mediaType;
    if (flagged !== undefined) updates.flagged = Boolean(flagged);
    if (likes !== undefined) updates.likes = Number(likes);
    if (comments !== undefined) updates.comments = Number(comments);
    if (shares !== undefined) updates.shares = Number(shares);
    if (commentItems !== undefined && Array.isArray(commentItems)) {
      updates.commentItems = commentItems;
      updates.comments = commentItems.length;
    }

    const c = collections();
    const post = await c.posts.findOneAndUpdate(
      { id: req.params.id },
      { $set: updates },
      { returnDocument: "after", projection: { _id: 0 } },
    );

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    return res.json(post);
  }),
);

app.delete(
  "/api/admin/posts/:id",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const c = collections();
    const result = await c.posts.deleteOne({ id: req.params.id });
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Post not found" });
    }

    return res.json({ message: "Post deleted" });
  }),
);

app.get(
  "/api/admin/friendships/requests",
  authMiddleware,
  asyncHandler(async (_req, res) => {
    const c = collections();
    const [requests, users] = await Promise.all([
      c.friendRequests
        .find({ status: "pending" }, { projection: { _id: 0 } })
        .toArray(),
      c.users.find({}, { projection: { _id: 0 } }).toArray(),
    ]);

    const usersMap = getUserMap(users);

    const enriched = requests.map((r) => ({
      ...r,
      fromUserName: usersMap[r.fromUserId]?.name || "Unknown",
      toUserName: usersMap[r.toUserId]?.name || "Unknown",
    }));

    res.json(enriched);
  }),
);

app.post(
  "/api/admin/friendships/requests/:id",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const { action } = req.body || {};
    if (!["accept", "deny"].includes(action)) {
      return res.status(400).json({ message: "Action must be accept or deny" });
    }

    const c = collections();
    const request = await c.friendRequests.findOne(
      { id: req.params.id },
      { projection: { _id: 0 } },
    );
    if (!request) {
      return res.status(404).json({ message: "Friend request not found" });
    }

    const status = action === "accept" ? "accepted" : "denied";
    await c.friendRequests.updateOne(
      { id: req.params.id },
      { $set: { status } },
    );

    if (action === "accept") {
      await c.friendships.insertMany([
        {
          id: uuidv4(),
          userId: request.fromUserId,
          friendId: request.toUserId,
          createdAt: new Date().toISOString(),
        },
        {
          id: uuidv4(),
          userId: request.toUserId,
          friendId: request.fromUserId,
          createdAt: new Date().toISOString(),
        },
      ]);
    }

    return res.json({ ...request, status });
  }),
);

app.get(
  "/api/admin/friendships",
  authMiddleware,
  asyncHandler(async (_req, res) => {
    const c = collections();
    const [users, friendships] = await Promise.all([
      c.users.find({}, { projection: { _id: 0 } }).toArray(),
      c.friendships.find({}, { projection: { _id: 0 } }).toArray(),
    ]);

    const usersMap = getUserMap(users);

    const overview = users.map((user) => {
      const links = friendships.filter((f) => f.userId === user.id);
      return {
        userId: user.id,
        userName: user.name,
        friendsCount: links.length,
        friends: links.map((f) => ({
          id: f.friendId,
          name: usersMap[f.friendId]?.name || "Unknown",
        })),
      };
    });

    res.json(overview);
  }),
);

app.get(
  "/api/admin/reports",
  authMiddleware,
  asyncHandler(async (_req, res) => {
    const c = collections();
    const [reports, users] = await Promise.all([
      c.reports.find({}, { projection: { _id: 0 } }).toArray(),
      c.users.find({}, { projection: { _id: 0 } }).toArray(),
    ]);

    const usersMap = getUserMap(users);
    const enriched = reports.map((r) => ({
      ...r,
      reportedUserName: usersMap[r.reportedUserId]?.name || "Unknown",
    }));

    res.json(enriched);
  }),
);

app.post(
  "/api/admin/reports/:id/action",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const { action } = req.body || {};
    if (!["warn", "ban", "delete"].includes(action)) {
      return res
        .status(400)
        .json({ message: "Action must be warn, ban, or delete" });
    }

    const c = collections();
    const report = await c.reports.findOne(
      { id: req.params.id },
      { projection: { _id: 0 } },
    );
    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    const user = await c.users.findOne(
      { id: report.reportedUserId },
      { projection: { _id: 0 } },
    );
    if (user) {
      if (action === "warn") {
        await c.users.updateOne(
          { id: user.id },
          { $set: { warnings: (user.warnings || 0) + 1 } },
        );
      }

      if (action === "ban") {
        await c.users.updateOne(
          { id: user.id },
          { $set: { status: "banned" } },
        );
      }

      if (action === "delete") {
        await Promise.all([
          c.users.deleteOne({ id: user.id }),
          c.posts.deleteMany({ userId: user.id }),
          c.friendships.deleteMany({
            $or: [{ userId: user.id }, { friendId: user.id }],
          }),
          c.friendRequests.deleteMany({
            $or: [{ fromUserId: user.id }, { toUserId: user.id }],
          }),
        ]);
      }
    }

    const actionEntry = {
      action,
      at: new Date().toISOString(),
      by: req.admin.username,
    };

    await c.reports.updateOne(
      { id: req.params.id },
      {
        $set: { status: "closed" },
        $push: { actionHistory: actionEntry },
      },
    );

    return res.json({
      ...report,
      status: "closed",
      actionHistory: [...(report.actionHistory || []), actionEntry],
    });
  }),
);

app.get(
  "/api/admin/analytics/engagement",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const days = Number(req.query.days || 7);
    const limit = Math.max(1, Math.min(days, 30));
    const c = collections();
    const activity = await c.activity
      .find({}, { projection: { _id: 0 } })
      .sort({ date: -1 })
      .limit(limit)
      .toArray();

    res.json(activity.reverse());
  }),
);

app.get(
  "/api/admin/analytics/growth",
  authMiddleware,
  asyncHandler(async (_req, res) => {
    const c = collections();
    const users = await c.users.find({}, { projection: { _id: 0 } }).toArray();
    const byMonth = {};

    users.forEach((user) => {
      const month = String(user.createdAt || "").slice(0, 7);
      if (month) {
        byMonth[month] = (byMonth[month] || 0) + 1;
      }
    });

    const growth = Object.keys(byMonth)
      .sort()
      .map((month) => ({ month, newUsers: byMonth[month] }));

    res.json(growth);
  }),
);

app.get("/admin", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin.html"));
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: "Internal server error" });
});

(async () => {
  await connectDb();
  await ensureSeedData();
  app.listen(PORT, () => {
    console.log(`Admin backend running on http://localhost:${PORT}`);
  });
})().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});

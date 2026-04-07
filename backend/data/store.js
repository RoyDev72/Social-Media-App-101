const crypto = require("crypto");
const { MongoClient } = require("mongodb");
const { v4: uuidv4 } = require("uuid");

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/social_hub";

let client;
let db;

function hashPassword(password, salt) {
  return crypto
    .createHash("sha256")
    .update(`${salt}:${password}`)
    .digest("hex");
}

function isoDateDaysAgo(daysAgo) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString();
}

function buildInitialData() {
  const users = [
    {
      id: uuidv4(),
      name: "Ayesha Khan",
      email: "ayesha@example.com",
      profilePicture: "https://i.pravatar.cc/150?img=47",
      status: "active",
      warnings: 0,
      createdAt: isoDateDaysAgo(30),
      lastActive: isoDateDaysAgo(0),
    },
    {
      id: uuidv4(),
      name: "Nora Patel",
      email: "nora@example.com",
      profilePicture: "https://i.pravatar.cc/150?img=32",
      status: "active",
      warnings: 0,
      createdAt: isoDateDaysAgo(24),
      lastActive: isoDateDaysAgo(1),
    },
    {
      id: uuidv4(),
      name: "Sam Lee",
      email: "sam@example.com",
      profilePicture: "https://i.pravatar.cc/150?img=18",
      status: "active",
      warnings: 0,
      createdAt: isoDateDaysAgo(20),
      lastActive: isoDateDaysAgo(0),
    },
    {
      id: uuidv4(),
      name: "Carl Diaz",
      email: "carl@example.com",
      profilePicture: "https://i.pravatar.cc/150?img=12",
      status: "active",
      warnings: 1,
      createdAt: isoDateDaysAgo(18),
      lastActive: isoDateDaysAgo(2),
    },
    {
      id: uuidv4(),
      name: "Nisha Roy",
      email: "nisha@example.com",
      profilePicture: "https://i.pravatar.cc/150?img=25",
      status: "active",
      warnings: 0,
      createdAt: isoDateDaysAgo(9),
      lastActive: isoDateDaysAgo(1),
    },
  ];

  const posts = [
    {
      id: uuidv4(),
      userId: users[0].id,
      userName: users[0].name,
      content: "Weekend trek photos uploaded!",
      mediaUrl:
        "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1200",
      createdAt: isoDateDaysAgo(2),
      flagged: false,
    },
    {
      id: uuidv4(),
      userId: users[1].id,
      userName: users[1].name,
      content: "JavaScript meetup starts tonight at 8 PM.",
      mediaUrl: "",
      createdAt: isoDateDaysAgo(1),
      flagged: false,
    },
    {
      id: uuidv4(),
      userId: users[3].id,
      userName: users[3].name,
      content: "Some random spam message.",
      mediaUrl: "",
      createdAt: isoDateDaysAgo(0),
      flagged: true,
    },
  ];

  const friendRequests = [
    {
      id: uuidv4(),
      fromUserId: users[4].id,
      toUserId: users[2].id,
      status: "pending",
      createdAt: isoDateDaysAgo(1),
    },
    {
      id: uuidv4(),
      fromUserId: users[3].id,
      toUserId: users[0].id,
      status: "pending",
      createdAt: isoDateDaysAgo(0),
    },
  ];

  const friendships = [
    {
      id: uuidv4(),
      userId: users[0].id,
      friendId: users[1].id,
      createdAt: isoDateDaysAgo(15),
    },
    {
      id: uuidv4(),
      userId: users[1].id,
      friendId: users[0].id,
      createdAt: isoDateDaysAgo(15),
    },
    {
      id: uuidv4(),
      userId: users[0].id,
      friendId: users[2].id,
      createdAt: isoDateDaysAgo(11),
    },
    {
      id: uuidv4(),
      userId: users[2].id,
      friendId: users[0].id,
      createdAt: isoDateDaysAgo(11),
    },
    {
      id: uuidv4(),
      userId: users[2].id,
      friendId: users[1].id,
      createdAt: isoDateDaysAgo(8),
    },
    {
      id: uuidv4(),
      userId: users[1].id,
      friendId: users[2].id,
      createdAt: isoDateDaysAgo(8),
    },
  ];

  const reports = [
    {
      id: uuidv4(),
      reportedUserId: users[3].id,
      postId: posts[2].id,
      reason: "Spam / inappropriate post",
      status: "open",
      createdAt: isoDateDaysAgo(0),
      actionHistory: [],
    },
  ];

  const activity = [];
  for (let i = 13; i >= 0; i -= 1) {
    const day = new Date();
    day.setDate(day.getDate() - i);
    activity.push({
      date: day.toISOString().split("T")[0],
      dailyActiveUsers: 40 + Math.floor(Math.random() * 35),
      totalPosts: 200 + Math.floor(Math.random() * 120),
      newUsers: 2 + Math.floor(Math.random() * 8),
    });
  }

  const password = process.env.ADMIN_PASSWORD || "Admin@123";
  const salt = crypto.randomBytes(16).toString("hex");

  const admin = {
    username: process.env.ADMIN_USER || "admin",
    passwordSalt: salt,
    passwordHash: hashPassword(password, salt),
  };

  return {
    admin,
    users,
    posts,
    friendRequests,
    friendships,
    reports,
    activity,
  };
}

async function connectDb() {
  if (db) {
    return db;
  }

  client = new MongoClient(MONGODB_URI);
  await client.connect();
  db = client.db();
  return db;
}

function collections() {
  if (!db) {
    throw new Error("Database not connected");
  }

  return {
    admins: db.collection("admins"),
    users: db.collection("users"),
    posts: db.collection("posts"),
    friendRequests: db.collection("friendRequests"),
    friendships: db.collection("friendships"),
    reports: db.collection("reports"),
    activity: db.collection("activity"),
  };
}

async function ensureSeedData() {
  await connectDb();
  const c = collections();

  const adminCount = await c.admins.countDocuments();
  if (adminCount > 0) {
    return;
  }

  const initial = buildInitialData();

  await c.admins.insertOne(initial.admin);
  await c.users.insertMany(initial.users);
  await c.posts.insertMany(initial.posts);
  await c.friendRequests.insertMany(initial.friendRequests);
  await c.friendships.insertMany(initial.friendships);
  await c.reports.insertMany(initial.reports);
  await c.activity.insertMany(initial.activity);
}

module.exports = {
  connectDb,
  collections,
  ensureSeedData,
  hashPassword,
};

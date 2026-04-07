const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";
const ADMIN_USER = import.meta.env.VITE_ADMIN_USER || "admin";
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || "Admin@123";

let tokenCache = "";

function inferMediaType(mediaUrl) {
  if (!mediaUrl) return "none";
  return /\.mp4($|\?)/i.test(mediaUrl) ? "video" : "image";
}

function mapPost(post) {
  const commentItems = Array.isArray(post.commentItems)
    ? post.commentItems
    : [];
  return {
    id: post.id,
    user: post.userName || "Unknown",
    userId: post.userId || null,
    content: post.content || "",
    mediaType: post.mediaType || inferMediaType(post.mediaUrl),
    mediaUrl: post.mediaUrl || "",
    likes: Number(post.likes || 0),
    comments: Number(post.comments || 0),
    shares: Number(post.shares || 0),
    commentItems,
    createdAt: post.createdAt
      ? new Date(post.createdAt).toLocaleString()
      : new Date().toLocaleString(),
  };
}

async function ensureToken() {
  if (tokenCache) {
    return tokenCache;
  }

  const stored = localStorage.getItem("social_hub_admin_token");
  if (stored) {
    tokenCache = stored;
    return stored;
  }

  const response = await fetch(`${API_BASE}/api/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: ADMIN_USER, password: ADMIN_PASSWORD }),
  });

  if (!response.ok) {
    throw new Error("Failed to authenticate frontend with backend admin API");
  }

  const data = await response.json();
  tokenCache = data.token;
  localStorage.setItem("social_hub_admin_token", tokenCache);
  return tokenCache;
}

async function apiRequest(path, options = {}) {
  const token = await ensureToken();
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.message || `Request failed: ${path}`);
  }

  return response.json();
}

export async function fetchBackendSnapshot() {
  const [users, posts, friendships, requests] = await Promise.all([
    apiRequest("/api/admin/users"),
    apiRequest("/api/admin/posts"),
    apiRequest("/api/admin/friendships"),
    apiRequest("/api/admin/friendships/requests"),
  ]);

  const meUser = users[0] || {
    id: "local-me",
    name: "Admin Student",
    profilePicture: "https://i.pravatar.cc/200?img=13",
  };

  const myFriendEntry = friendships.find((f) => f.userId === meUser.id);
  const friendNames = (myFriendEntry?.friends || []).map((f) => f.name);
  const friends = users
    .filter((u) => friendNames.includes(u.name))
    .map((u) => ({
      id: u.id,
      name: u.name,
      avatar: u.profilePicture || `https://i.pravatar.cc/150?u=${u.name}`,
    }));

  const requestItems = requests
    .filter((r) => r.toUserId === meUser.id)
    .map((r) => ({ id: r.id, name: r.fromUserName }));

  return {
    me: {
      id: meUser.id,
      name: meUser.name,
      bio: "Connected to live MongoDB backend",
      avatar: meUser.profilePicture || "https://i.pravatar.cc/200?img=13",
      cover:
        "linear-gradient(130deg, rgba(14,107,137,1) 0%, rgba(20,188,177,1) 35%, rgba(255,119,85,1) 100%)",
    },
    posts: posts.map(mapPost),
    friends,
    friendRequests: requestItems,
  };
}

export async function createBackendPost(payload) {
  const created = await apiRequest("/api/admin/posts", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return mapPost(created);
}

export async function updateBackendPost(postId, updates) {
  const updated = await apiRequest(`/api/admin/posts/${postId}`, {
    method: "PUT",
    body: JSON.stringify(updates),
  });
  return mapPost(updated);
}

export async function updateBackendUser(userId, updates) {
  return apiRequest(`/api/admin/users/${userId}`, {
    method: "PUT",
    body: JSON.stringify(updates),
  });
}

export async function actOnFriendRequest(requestId, action) {
  return apiRequest(`/api/admin/friendships/requests/${requestId}`, {
    method: "POST",
    body: JSON.stringify({ action }),
  });
}

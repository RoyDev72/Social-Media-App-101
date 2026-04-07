import { Navigate, Route, Routes } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import NavBar from "./components/NavBar";
import Footer from "./components/Footer";
import HomePage from "./pages/HomePage";
import ProfilePage from "./pages/ProfilePage";
import FriendsPage from "./pages/FriendsPage";
import MessagesPage from "./pages/MessagesPage";
import NotificationsPage from "./pages/NotificationsPage";
import { seedState } from "./data/seed";
import {
  actOnFriendRequest,
  createBackendPost,
  fetchBackendSnapshot,
  updateBackendPost,
  updateBackendUser,
} from "./api";

function App() {
  const initial = useMemo(() => seedState(), []);
  const [state, setState] = useState(initial);

  const addNotification = (type, text) => {
    setState((prev) => ({
      ...prev,
      notifications: [
        {
          id: crypto.randomUUID(),
          type,
          text,
          at: new Date().toLocaleString(),
        },
        ...prev.notifications,
      ],
    }));
  };

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const live = await fetchBackendSnapshot();
        if (!active) return;

        setState((prev) => ({
          ...prev,
          ...live,
        }));
      } catch (_err) {
        addNotification(
          "system",
          "Backend sync unavailable. Showing local demo data.",
        );
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const createPost = async ({ content, mediaType, mediaUrl }) => {
    const created = await createBackendPost({
      userId: state.me.id,
      userName: state.me.name,
      content,
      mediaType,
      mediaUrl,
      likes: 0,
      comments: 0,
      shares: 0,
      flagged: false,
    });

    setState((prev) => ({
      ...prev,
      posts: [created, ...prev.posts],
    }));
  };

  const updatePostCounters = async (postId, updates) => {
    const updated = await updateBackendPost(postId, updates);
    setState((prev) => ({
      ...prev,
      posts: prev.posts.map((p) => (p.id === postId ? updated : p)),
    }));
  };

  const addPostComment = async (postId, text) => {
    const existing = state.posts.find((p) => p.id === postId);
    if (!existing) return;

    const nextItems = [
      ...(existing.commentItems || []),
      {
        id: crypto.randomUUID(),
        user: state.me.name,
        text,
        at: new Date().toLocaleString(),
      },
    ];

    const updated = await updateBackendPost(postId, {
      comments: nextItems.length,
      commentItems: nextItems,
    });

    setState((prev) => ({
      ...prev,
      posts: prev.posts.map((p) => (p.id === postId ? updated : p)),
    }));
  };

  const saveProfile = async ({ name, bio, avatar, cover }) => {
    if (state.me.id) {
      const user = await updateBackendUser(state.me.id, {
        name,
        profilePicture: avatar,
      });

      setState((prev) => ({
        ...prev,
        me: {
          ...prev.me,
          name: user.name,
          bio,
          avatar: user.profilePicture || prev.me.avatar,
          cover: cover || prev.me.cover,
        },
      }));
      return;
    }

    setState((prev) => ({
      ...prev,
      me: {
        ...prev.me,
        name,
        bio,
        avatar,
        cover,
      },
    }));
  };

  const handleFriendRequest = async (requestId, action) => {
    await actOnFriendRequest(requestId, action);
    const live = await fetchBackendSnapshot();
    setState((prev) => ({ ...prev, ...live }));
  };

  return (
    <div className="app-shell">
      <div className="ambient ambient-a" />
      <div className="ambient ambient-b" />
      <NavBar state={state} />
      <main className="main-wrap">
        <Routes>
          <Route
            path="/"
            element={
              <HomePage
                state={state}
                setState={setState}
                addNotification={addNotification}
                createPost={createPost}
                updatePostCounters={updatePostCounters}
                addPostComment={addPostComment}
              />
            }
          />
          <Route
            path="/profile"
            element={
              <ProfilePage
                state={state}
                setState={setState}
                addNotification={addNotification}
                saveProfile={saveProfile}
              />
            }
          />
          <Route
            path="/friends"
            element={
              <FriendsPage
                state={state}
                setState={setState}
                addNotification={addNotification}
                handleFriendRequest={handleFriendRequest}
              />
            }
          />
          <Route
            path="/messages"
            element={
              <MessagesPage
                state={state}
                setState={setState}
                addNotification={addNotification}
              />
            }
          />
          <Route
            path="/notifications"
            element={<NotificationsPage state={state} setState={setState} />}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;

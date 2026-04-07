import { useMemo, useState } from "react";

function HomePage({
  state,
  setState,
  addNotification,
  createPost,
  updatePostCounters,
  addPostComment,
}) {
  const [slide, setSlide] = useState(0);
  const [content, setContent] = useState("");
  const [mediaType, setMediaType] = useState("none");
  const [mediaUrl, setMediaUrl] = useState("");
  const [imageDataUrl, setImageDataUrl] = useState("");
  const [imageName, setImageName] = useState("");
  const [openComments, setOpenComments] = useState({});
  const [commentDrafts, setCommentDrafts] = useState({});

  const slideData = useMemo(
    () => state.slides[slide % state.slides.length],
    [slide, state.slides],
  );

  const createNewPost = async () => {
    if (!content.trim()) {
      return;
    }

    const finalMediaType = mediaType;
    const finalMediaUrl =
      mediaType === "image"
        ? imageDataUrl
        : mediaType === "video"
          ? mediaUrl
          : "";

    if (mediaType === "image" && !imageDataUrl) {
      addNotification("error", "Please upload an image before posting");
      return;
    }

    if (mediaType === "video" && !mediaUrl.trim()) {
      addNotification("error", "Please add a video URL before posting");
      return;
    }

    try {
      if (createPost) {
        await createPost({
          content: content.trim(),
          mediaType: finalMediaType,
          mediaUrl: finalMediaUrl,
        });
      } else {
        setState((prev) => ({
          ...prev,
          posts: [
            {
              id: crypto.randomUUID(),
              user: prev.me.name,
              content: content.trim(),
              mediaType: finalMediaType,
              mediaUrl: finalMediaUrl,
              likes: 0,
              comments: 0,
              shares: 0,
              createdAt: new Date().toLocaleString(),
            },
            ...prev.posts,
          ],
        }));
      }
    } catch (_err) {
      addNotification("error", "Failed to create post on backend");
      return;
    }

    setContent("");
    setMediaType("none");
    setMediaUrl("");
    setImageDataUrl("");
    setImageName("");
    addNotification("post", "You created a new post");
  };

  const onimagePicked = (event) => {
    const file = event.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setImageDataUrl(String(reader.result || ""));
      setImageName(file.name);
    };
    reader.readAsDataURL(file);
  };



  const bump = async (postId, field) => {
    const current = state.posts.find((p) => p.id === postId);
    if (!current) return;

    const next = { ...current, [field]: (current[field] || 0) + 1 };
    setState((prev) => ({
      ...prev,
      posts: prev.posts.map((post) => (post.id === postId ? next : post)),
    }));

    try {
      if (updatePostCounters) {
        await updatePostCounters(postId, {
          likes: next.likes,
          comments: next.comments,
          shares: next.shares,
        });
      }
    } catch (_err) {
      addNotification("error", "Failed to sync post reaction");
    }
  };

  const toggleCommentBox = (postId) => {
    setOpenComments((prev) => ({ ...prev, [postId]: !prev[postId] }));
  };

  const submitComment = async (post) => {
    const text = (commentDrafts[post.id] || "").trim();
    if (!text) return;

    const nextItems = [
      ...(post.commentItems || []),
      {
        id: crypto.randomUUID(),
        user: state.me.name,
        text,
        at: new Date().toLocaleString(),
      },
    ];

    setState((prev) => ({
      ...prev,
      posts: prev.posts.map((p) =>
        p.id === post.id
          ? {
              ...p,
              commentItems: nextItems,
              comments: nextItems.length,
            }
          : p,
      ),
    }));

    setCommentDrafts((prev) => ({ ...prev, [post.id]: "" }));

    try {
      if (addPostComment) {
        await addPostComment(post.id, text);
      } else if (updatePostCounters) {
        await updatePostCounters(post.id, {
          comments: nextItems.length,
          commentItems: nextItems,
        });
      }
      addNotification("comment", "Comment added");
    } catch (_err) {
      addNotification("error", "Failed to sync comment");
    }
  };

  return (
    <section className="page home-grid home-redesign">
      <div className="stack">
        <article className="panel hero hero-home">
          <div className="hero-content">
            <small className="hero-kicker">Featured Broadcast</small>
            <h2>{slideData.title}</h2>
            <p>{slideData.text}</p>
            <div className="hero-metrics">
              <span>{state.posts.length} posts live</span>
              <span>{state.friends.length} active friends</span>
              <span>{state.trending.length} trending tags</span>
            </div>
          </div>
          <div className="hero-actions">
            <button
              onClick={() =>
                setSlide(
                  (s) => (s - 1 + state.slides.length) % state.slides.length,
                )
              }
            >
              Previous
            </button>
            <button
              onClick={() => setSlide((s) => (s + 1) % state.slides.length)}
            >
              Next
            </button>
          </div>
        </article>

        <article className="panel composer-panel">
          <div className="composer-head">
            <img
              className="composer-avatar"
              src={state.me.avatar}
              alt={state.me.name}
            />
            <div>
              <h3>Create New Post</h3>
              <small>Share updates with text, image, or video</small>
            </div>
          </div>
          <textarea
            rows={4}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What do you want to share?"
          />
          <div className="row">
            <select
              value={mediaType}
              onChange={(e) => setMediaType(e.target.value)}
            >
              <option value="none">No media</option>
              <option value="image">Upload image</option>
              <option value="video">Video URL</option>
            </select>
            {mediaType === "video" ? (
              <input
                value={mediaUrl}
                onChange={(e) => setMediaUrl(e.target.value)}
                placeholder="Paste video URL"
              />
            ) : (
              <div className="media-upload-box">
                <input
                  type="file"
                  accept="image/*"
                  onChange={onimagePicked}
                  disabled={mediaType !== "image"}
                />
              </div>
            )}
          </div>
          {mediaType === "image" && imageDataUrl && (
            <div className="upload-preview">
              <img src={imageDataUrl} alt="Uploaded preview" />
              <div>
                <strong>{imageName || "image"}</strong>
                <button
                  type="button"
                  onClick={() => {
                    setImageDataUrl("");
                    setImageName("");
                  }}
                >
                  Remove
                </button>
              </div>
            </div>
          )}
          <div className="composer-actions">
            <small>Tip: Keep it concise for better engagement</small>
            <button className="primary" onClick={createNewPost}>
              Publish Post
            </button>
          </div>
        </article>

        <article className="panel feed-panel">
          <div className="feed-title-row">
            <h3>User Feed</h3>
            <div className="feed-filters">
              <span>Friends</span>
              <span>Groups</span>
              <span>Following</span>
            </div>
          </div>
          <div className="feed">
            {state.posts.map((post) => (
              <div className="post post-elevated" key={post.id}>
                <div className="post-head">
                  <div className="post-author-wrap">
                    <span className="author-dot">
                      {String(post.user || "U")
                        .slice(0, 1)
                        .toUpperCase()}
                    </span>
                    <div>
                      <strong>{post.user}</strong>
                      <small>{post.createdAt}</small>
                    </div>
                  </div>
                </div>
                <p>{post.content}</p>
                {post.mediaType === "image" && post.mediaUrl && (
                  <img className="media" src={post.mediaUrl} alt="Post media" />
                )}
                {post.mediaType === "video" && post.mediaUrl && (
                  <video className="media" src={post.mediaUrl} controls />
                )}
                <div className="post-actions">
                  <button onClick={() => bump(post.id, "likes")}>
                    Like ({post.likes})
                  </button>
                  <button onClick={() => toggleCommentBox(post.id)}>
                    Comment ({post.comments})
                  </button>
                  <button onClick={() => bump(post.id, "shares")}>
                    Share ({post.shares})
                  </button>
                </div>
                {openComments[post.id] && (
                  <div className="comment-box">
                    <div className="comment-list">
                      {(post.commentItems || []).length === 0 && (
                        <small>No comments yet. Start the conversation.</small>
                      )}
                      {(post.commentItems || []).map((item) => (
                        <div key={item.id} className="comment-item">
                          <strong>{item.user}</strong>
                          <p>{item.text}</p>
                          <small>{item.at}</small>
                        </div>
                      ))}
                    </div>
                    <div className="comment-compose">
                      <input
                        value={commentDrafts[post.id] || ""}
                        onChange={(e) =>
                          setCommentDrafts((prev) => ({
                            ...prev,
                            [post.id]: e.target.value,
                          }))
                        }
                        placeholder="Write a comment..."
                      />
                      <button
                        className="primary"
                        onClick={() => submitComment(post)}
                      >
                        Post
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </article>
      </div>

      <aside className="panel trending trending-panel">
        <h3>Trending Topics</h3>
        <div className="chips">
          {state.trending.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
        <div className="trending-divider" />
        <h4>Suggested Creators</h4>
        <div className="suggested-list">
          {state.friends.slice(0, 3).map((friend) => (
            <div className="suggested-item" key={friend.id}>
              <img src={friend.avatar} alt={friend.name} />
              <div>
                <strong>{friend.name}</strong>
                <small>Popular in your network</small>
              </div>
            </div>
          ))}
        </div>
      </aside>
    </section>
  );
}

export default HomePage;

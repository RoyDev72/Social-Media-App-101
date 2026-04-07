import { useState } from "react";

function ProfilePage({ state, setState, addNotification, saveProfile }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(state.me.name);
  const [bio, setBio] = useState(state.me.bio);
  const [avatar, setAvatar] = useState(state.me.avatar);
  const [cover, setCover] = useState(state.me.cover);
  const [coverFileName, setCoverFileName] = useState("");

  const myPosts = state.posts.filter((p) => p.user === state.me.name);
  const totalReactions = myPosts.reduce(
    (sum, p) => sum + (p.likes || 0) + (p.comments || 0) + (p.shares || 0),
    0,
  );

  const save = async () => {
    const payload = {
      name: name.trim() || state.me.name,
      bio: bio.trim() || state.me.bio,
      avatar: avatar.trim() || state.me.avatar,
      cover: cover || state.me.cover,
    };

    try {
      if (saveProfile) {
        await saveProfile(payload);
      } else {
        setState((prev) => ({
          ...prev,
          me: {
            ...prev.me,
            ...payload,
          },
        }));
      }
      setEditing(false);
      addNotification("profile", "Profile updated successfully");
    } catch (_err) {
      addNotification("error", "Failed to update profile on backend");
    }
  };

  const onAvatarPicked = (event) => {
    const file = event.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setAvatar(String(reader.result || ""));
    };
    reader.readAsDataURL(file);
  };

  const onCoverPicked = (event) => {
    const file = event.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const data = String(reader.result || "");
      setCover(`url(${data}) center/cover no-repeat`);
      setCoverFileName(file.name);
    };
    reader.readAsDataURL(file);
  };

  return (
    <section className="page profile-stack profile-redesign">
      <article className="panel profile-card profile-hero-card">
        <div className="cover" style={{ background: state.me.cover }} />
        <div className="profile-head">
          <img
            src={state.me.avatar}
            alt={state.me.name}
            className="profile-main-avatar"
          />
          <div className="profile-main-copy">
            <h2>{state.me.name}</h2>
            <p>{state.me.bio}</p>
            <div className="profile-badges">
              <span>Creator</span>
              <span>Active this week</span>
            </div>
          </div>
          <div className="profile-quick-stats">
            <div>
              <strong>{state.friends.length}</strong>
              <small>Friends</small>
            </div>
            <div>
              <strong>{myPosts.length}</strong>
              <small>Posts</small>
            </div>
            <div>
              <strong>{totalReactions}</strong>
              <small>Engagement</small>
            </div>
          </div>
          <button
            className="primary profile-edit-btn"
            onClick={() => setEditing((e) => !e)}
          >
            Edit Profile
          </button>
        </div>
      </article>

      {editing && (
        <article className="panel profile-editor-card">
          <h3>Update Personal Information</h3>
          <div className="row">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name"
            />
            <input
              value={avatar}
              onChange={(e) => setAvatar(e.target.value)}
              placeholder="Avatar URL"
            />
          </div>
          <div className="row">
            <div className="media-upload-box">
              <small>Upload Avatar</small>
              <input type="file" accept="image/*" onChange={onAvatarPicked} />
            </div>
            <div className="media-upload-box">
              <small>Upload Cover Photo</small>
              <input type="file" accept="image/*" onChange={onCoverPicked} />
            </div>
          </div>
          {coverFileName && <small>Selected cover: {coverFileName}</small>}
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            placeholder="Bio"
          />
          <button className="primary" onClick={save}>
            Save Changes
          </button>
        </article>
      )}

      <section className="home-grid profile-content-grid">
        <article className="panel friends-card">
          <h3>Friends List</h3>
          {state.friends.map((friend) => (
            <div key={friend.id} className="list-item">
              <div className="list-user">
                <img src={friend.avatar} alt={friend.name} />
                <strong>{friend.name}</strong>
              </div>
            </div>
          ))}
        </article>

        <article className="panel posts-card">
          <h3>Posts</h3>
          {myPosts.length === 0 && (
            <small>No posts yet. Create one from Home.</small>
          )}
          {myPosts.map((post) => (
            <div key={post.id} className="post profile-post-card">
              <div className="post-head">
                <strong>{post.createdAt}</strong>
                <small>
                  {post.likes || 0} likes • {post.comments || 0} comments
                </small>
              </div>
              <p>{post.content}</p>
            </div>
          ))}
        </article>
      </section>
    </section>
  );
}

export default ProfilePage;

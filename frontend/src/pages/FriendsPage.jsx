function FriendsPage({
  state,
  setState,
  addNotification,
  handleFriendRequest,
}) {
  const accept = async (request) => {
    const name = typeof request === "string" ? request : request.name;
    const requestId = typeof request === "string" ? null : request.id;

    try {
      if (handleFriendRequest && requestId) {
        await handleFriendRequest(requestId, "accept");
      } else {
        setState((prev) => ({
          ...prev,
          friends: [
            ...prev.friends,
            {
              id: crypto.randomUUID(),
              name,
              avatar: `https://i.pravatar.cc/150?u=${name}`,
            },
          ],
          friendRequests: prev.friendRequests.filter((n) =>
            typeof n === "string" ? n !== name : n.id !== requestId,
          ),
        }));
      }
      addNotification("request", `You accepted ${name}'s friend request`);
    } catch (_err) {
      addNotification("error", "Failed to accept friend request");
    }
  };

  const deny = async (request) => {
    const name = typeof request === "string" ? request : request.name;
    const requestId = typeof request === "string" ? null : request.id;

    try {
      if (handleFriendRequest && requestId) {
        await handleFriendRequest(requestId, "deny");
      } else {
        setState((prev) => ({
          ...prev,
          friendRequests: prev.friendRequests.filter((n) =>
            typeof n === "string" ? n !== name : n.id !== requestId,
          ),
        }));
      }
      addNotification("request", `You denied ${name}'s friend request`);
    } catch (_err) {
      addNotification("error", "Failed to deny friend request");
    }
  };

  return (
    <section className="page home-grid">
      <article className="panel">
        <h3>Your Friends</h3>
        {state.friends.map((friend) => (
          <div className="list-item" key={friend.id}>
            <div className="list-user">
              <img src={friend.avatar} alt={friend.name} />
              <strong>{friend.name}</strong>
            </div>
            <button>Message</button>
          </div>
        ))}
      </article>

      <aside className="panel">
        <h3>Pending Friend Requests</h3>
        {state.friendRequests.length === 0 && (
          <small>No pending requests.</small>
        )}
        {state.friendRequests.map((item) => {
          const key = typeof item === "string" ? item : item.id;
          const name = typeof item === "string" ? item : item.name;
          return (
            <div className="list-item" key={key}>
              <strong>{name}</strong>
              <div className="action-row">
                <button className="primary" onClick={() => accept(item)}>
                  Accept
                </button>
                <button onClick={() => deny(item)}>Deny</button>
              </div>
            </div>
          );
        })}
      </aside>
    </section>
  );
}

export default FriendsPage;

import { useMemo, useState } from "react";

function MessagesPage({ state, setState, addNotification }) {
  const names = useMemo(
    () => Object.keys(state.conversations),
    [state.conversations],
  );
  const [active, setActive] = useState(names[0] || "");
  const [text, setText] = useState("");
  const [groupName, setGroupName] = useState("");

  const thread = state.conversations[active] || [];

  const send = (event) => {
    event.preventDefault();
    const message = text.trim();
    if (!message || !active) {
      return;
    }

    setState((prev) => ({
      ...prev,
      conversations: {
        ...prev.conversations,
        [active]: [
          ...(prev.conversations[active] || []),
          { id: crypto.randomUUID(), from: "me", text: message },
        ],
      },
    }));

    setText("");
    addNotification("message", `Message sent to ${active}`);
  };

  const createGroup = (event) => {
    event.preventDefault();
    const name = groupName.trim();
    if (!name) return;
    if (state.conversations[name]) {
      addNotification("error", "Group already exists");
      return;
    }

    setState((prev) => ({
      ...prev,
      conversations: {
        ...prev.conversations,
        [name]: [
          {
            id: crypto.randomUUID(),
            from: "System",
            text: `${name} group created. Start chatting!`,
          },
        ],
      },
    }));
    setActive(name);
    setGroupName("");
    addNotification("message", `Group chat ${name} created`);
  };

  return (
    <section className="page message-layout">
      <aside className="panel">
        <h3>Conversations</h3>
        <form className="group-create" onSubmit={createGroup}>
          <input
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="Create group chat"
          />
          <button className="primary" type="submit">
            Create
          </button>
        </form>
        {names.map((name) => (
          <button
            key={name}
            className={`chat-pick ${active === name ? "active" : ""}`}
            onClick={() => setActive(name)}
          >
            {name}
          </button>
        ))}
      </aside>

      <article className="panel chat-room">
        <h3>{active || "Select a conversation"}</h3>
        <div className="chat-thread">
          {thread.map((msg) => (
            <div
              key={msg.id}
              className={`bubble ${msg.from === "me" ? "sent" : "received"}`}
            >
              <strong>{msg.from === "me" ? "You" : msg.from}:</strong>{" "}
              {msg.text}
            </div>
          ))}
        </div>
        <form onSubmit={send} className="chat-compose">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type your message"
          />
          <button className="primary" type="submit">
            Send
          </button>
        </form>
      </article>
    </section>
  );
}

export default MessagesPage;

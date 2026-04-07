import { NavLink, useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";

function NavBar({ state }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const navigate = useNavigate();

  const searchable = useMemo(() => {
    const users = [state.me.name, ...state.friends.map((f) => f.name)];
    const posts = state.posts.map((p) => p.content);
    const groups = ["Dev Group", "Campus News", "Photography Circle"];
    return { users, posts, groups };
  }, [state]);

  const onSearch = (event) => {
    event.preventDefault();
    const q = query.trim().toLowerCase();
    if (!q) {
      setResults([]);
      return;
    }

    const hits = [
      ...searchable.users.filter((u) => u.toLowerCase().includes(q)).map((u) => `User: ${u}`),
      ...searchable.posts.filter((p) => p.toLowerCase().includes(q)).map((p) => `Post: ${p.slice(0, 36)}...`),
      ...searchable.groups.filter((g) => g.toLowerCase().includes(q)).map((g) => `Group: ${g}`)
    ].slice(0, 6);

    setResults(hits.length ? hits : ["No users, posts, or groups found."]);
  };

  const logout = () => {
    navigate("/");
    alert("Logged out (demo)");
  };

  return (
    <header className="topbar">
      <div className="topbar-row">
        <div className="logo" onClick={() => navigate("/")}>
          <span className="logo-mark">S</span>
          <span>Social Hub</span>
        </div>

        <nav className="nav-links">
          <NavLink to="/" end>
            Home
          </NavLink>
          <NavLink to="/profile">Profile</NavLink>
          <NavLink to="/friends">Friends</NavLink>
          <NavLink to="/messages">Messages</NavLink>
          <NavLink to="/notifications">Notifications</NavLink>
        </nav>

        <div className="right-actions">
          <form className="search" onSubmit={onSearch}>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search users, posts, groups"
            />
            <button type="submit">Go</button>
          </form>
          <button className="danger" onClick={logout}>
            Logout
          </button>
        </div>
      </div>

      {!!results.length && (
        <div className="search-results">
          {results.map((item, idx) => (
            <div key={`${item}-${idx}`}>{item}</div>
          ))}
        </div>
      )}
    </header>
  );
}

export default NavBar;

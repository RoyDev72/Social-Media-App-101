function NotificationsPage({ state, setState }) {
  const clearAll = () => setState((prev) => ({ ...prev, notifications: [] }));

  return (
    <section className="page single-column">
      <article className="panel">
        <div className="space-between">
          <h3>Notifications</h3>
          <button onClick={clearAll}>Clear All</button>
        </div>
        {state.notifications.length === 0 && <small>No notifications to show.</small>}
        {state.notifications.map((item) => (
          <div key={item.id} className="list-item column">
            <strong>{item.type}</strong>
            <span>{item.text}</span>
            <small>{item.at}</small>
          </div>
        ))}
      </article>
    </section>
  );
}

export default NotificationsPage;

const API = {
  login: "/api/admin/login",
  dashboard: "/api/admin/dashboard",
  users: "/api/admin/users",
  posts: "/api/admin/posts",
  requestList: "/api/admin/friendships/requests",
  friendships: "/api/admin/friendships",
  reports: "/api/admin/reports",
  engagement: "/api/admin/analytics/engagement?days=14",
  growth: "/api/admin/analytics/growth",
};

let engagementChart;
let growthChart;

function token() {
  return localStorage.getItem("admin_token") || "";
}

async function req(url, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token()) {
    headers.Authorization = `Bearer ${token()}`;
  }

  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    const message =
      (await res.json().catch(() => ({}))).message || "Request failed";
    throw new Error(message);
  }

  return res.json();
}

function el(id) {
  return document.getElementById(id);
}

function showApp(authenticated) {
  el("login-card").classList.toggle("hidden", authenticated);
  el("admin-app").classList.toggle("hidden", !authenticated);
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString();
}

function destroyChart(chartRef) {
  if (chartRef) {
    chartRef.destroy();
  }
}

async function login() {
  const username = el("username").value.trim();
  const password = el("password").value;

  try {
    const data = await req(API.login, {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });

    localStorage.setItem("admin_token", data.token);
    showApp(true);
    await loadAll();
  } catch (err) {
    el("login-msg").textContent = err.message;
  }
}

async function loadDashboard() {
  const data = await req(API.dashboard);
  const items = [
    ["Total Users", data.totalUsers],
    ["Total Posts", data.totalPosts],
    ["Pending Requests", data.pendingRequests],
    ["Open Reports", data.openReports],
    ["Daily Active Users", data.dailyActiveUsers],
    ["New Users Today", data.newUsersToday],
  ];

  el("dashboard-stats").innerHTML = items
    .map(
      ([label, value]) =>
        `<div class="stat"><small>${label}</small><h3>${formatNumber(value)}</h3></div>`,
    )
    .join("");
}

async function loadUsers() {
  const users = await req(API.users);

  el("users-body").innerHTML = users
    .map(
      (u) => `
      <tr>
        <td><input data-field="name" data-id="${u.id}" value="${u.name}" /></td>
        <td><input data-field="email" data-id="${u.id}" value="${u.email}" /></td>
        <td>
          <select data-field="status" data-id="${u.id}">
            <option value="active" ${u.status === "active" ? "selected" : ""}>active</option>
            <option value="banned" ${u.status === "banned" ? "selected" : ""}>banned</option>
          </select>
        </td>
        <td>${u.warnings || 0}</td>
        <td class="actions">
          <button class="btn-primary save-user" data-id="${u.id}">Save</button>
          <button class="btn-danger del-user" data-id="${u.id}">Delete</button>
        </td>
      </tr>
    `,
    )
    .join("");
}

async function loadPosts() {
  const posts = await req(API.posts);

  el("posts-body").innerHTML = posts
    .map(
      (p) => `
      <tr>
        <td>${p.userName}</td>
        <td><textarea data-id="${p.id}" rows="2" style="width:100%">${p.content}</textarea></td>
        <td>${p.flagged ? "Yes" : "No"}</td>
        <td class="actions">
          <button class="btn-primary save-post" data-id="${p.id}">Save</button>
          <button class="btn-danger del-post" data-id="${p.id}">Delete</button>
        </td>
      </tr>
    `,
    )
    .join("");
}

async function loadFriendships() {
  const [requests, overview] = await Promise.all([
    req(API.requestList),
    req(API.friendships),
  ]);

  el("requests-box").innerHTML = requests.length
    ? requests
        .map(
          (r) => `
      <div class="logline">
        <div><strong>${r.fromUserName}</strong> -> <strong>${r.toUserName}</strong></div>
        <div style="margin-top:6px;display:flex;gap:8px;">
          <button class="btn-primary req-act" data-id="${r.id}" data-action="accept">Accept</button>
          <button class="btn-muted req-act" data-id="${r.id}" data-action="deny">Deny</button>
        </div>
      </div>
    `,
        )
        .join("")
    : "No pending requests.";

  el("friends-overview").innerHTML = overview
    .map(
      (item) => `
      <div class="logline">
        <strong>${item.userName}</strong> (${item.friendsCount} friends)
      </div>
    `,
    )
    .join("");
}

async function loadReports() {
  const reports = await req(API.reports);

  el("reports-box").innerHTML = reports.length
    ? reports
        .map(
          (r) => `
      <div class="logline">
        <div><strong>${r.reason}</strong></div>
        <div>Reported user: ${r.reportedUserName}</div>
        <div>Status: ${r.status}</div>
        <div style="margin-top:6px;display:flex;gap:8px;flex-wrap:wrap;">
          <button class="btn-muted rpt-act" data-id="${r.id}" data-action="warn">Warn</button>
          <button class="btn-danger rpt-act" data-id="${r.id}" data-action="ban">Ban</button>
          <button class="btn-danger rpt-act" data-id="${r.id}" data-action="delete">Delete User</button>
        </div>
      </div>
    `,
        )
        .join("")
    : "No reports available.";
}

async function loadAnalytics() {
  const [engagement, growth] = await Promise.all([
    req(API.engagement),
    req(API.growth),
  ]);

  const totalDau = engagement.reduce(
    (s, d) => s + (d.dailyActiveUsers || 0),
    0,
  );
  const avgDau = engagement.length
    ? Math.round(totalDau / engagement.length)
    : 0;
  const totalPosts = engagement.reduce((s, d) => s + (d.totalPosts || 0), 0);
  const avgPosts = engagement.length
    ? Math.round(totalPosts / engagement.length)
    : 0;
  const totalNewUsers = growth.reduce((s, g) => s + (g.newUsers || 0), 0);
  const growthRate =
    growth.length > 1
      ? Math.round(
          (((growth[growth.length - 1].newUsers || 0) -
            (growth[0].newUsers || 0)) /
            Math.max(1, growth[0].newUsers || 1)) *
            100,
        )
      : 0;

  el("analytics-kpis").innerHTML = `
    <div class="stat"><small>Average DAU (14 days)</small><h3>${formatNumber(avgDau)}</h3></div>
    <div class="stat"><small>Average Daily Posts</small><h3>${formatNumber(avgPosts)}</h3></div>
    <div class="stat"><small>Total New Users</small><h3>${formatNumber(totalNewUsers)}</h3></div>
    <div class="stat"><small>Growth Momentum</small><h3>${growthRate}%</h3></div>
  `;

  const engagementCtx = el("engagement-chart");
  const growthCtx = el("growth-chart");

  if (window.Chart && engagementCtx && growthCtx) {
    destroyChart(engagementChart);
    destroyChart(growthChart);

    engagementChart = new Chart(engagementCtx, {
      type: "line",
      data: {
        labels: engagement.map((d) => d.date),
        datasets: [
          {
            label: "Daily Active Users",
            data: engagement.map((d) => d.dailyActiveUsers || 0),
            borderColor: "#0f9d8a",
            backgroundColor: "rgba(15, 157, 138, 0.12)",
            fill: true,
            tension: 0.35,
            pointRadius: 3,
          },
          {
            label: "Total Posts",
            data: engagement.map((d) => d.totalPosts || 0),
            borderColor: "#ff7f50",
            backgroundColor: "rgba(255, 127, 80, 0.12)",
            fill: false,
            tension: 0.35,
            pointRadius: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: "top" },
        },
        scales: {
          y: { beginAtZero: true },
        },
      },
    });

    growthChart = new Chart(growthCtx, {
      type: "bar",
      data: {
        labels: growth.map((g) => g.month),
        datasets: [
          {
            label: "New Users",
            data: growth.map((g) => g.newUsers || 0),
            backgroundColor: "rgba(61, 139, 255, 0.78)",
            borderRadius: 8,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
        },
        scales: {
          y: { beginAtZero: true },
        },
      },
    });
  }

  el("activity-summary").innerHTML = `
    <div class="logline"><strong>Executive Summary:</strong> Engagement is averaging ${formatNumber(avgDau)} daily active users with ${formatNumber(avgPosts)} posts per day.</div>
    <div class="logline"><strong>Growth Outlook:</strong> Net user growth is ${formatNumber(totalNewUsers)} users across tracked periods with momentum at ${growthRate}%.</div>
  `;

  const reportRows = engagement
    .map((d) => {
      const monthItem = growth.find((g) => d.date.startsWith(g.month));
      return `
        <tr>
          <td>${d.date}</td>
          <td>${formatNumber(d.dailyActiveUsers)}</td>
          <td>${formatNumber(d.totalPosts)}</td>
          <td>${formatNumber(monthItem ? monthItem.newUsers : d.newUsers || 0)}</td>
        </tr>
      `;
    })
    .join("");

  el("analytics-report-body").innerHTML =
    reportRows || '<tr><td colspan="4">No analytics data available.</td></tr>';
}

async function loadAll() {
  await loadDashboard();
  await loadUsers();
  await loadPosts();
  await loadFriendships();
  await loadReports();
  await loadAnalytics();
}

function bindEvents() {
  el("login-btn").addEventListener("click", login);

  el("logout-btn").addEventListener("click", () => {
    localStorage.removeItem("admin_token");
    showApp(false);
  });

  el("tab-nav").addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement) || !target.dataset.tab) {
      return;
    }

    document
      .querySelectorAll("#tab-nav button")
      .forEach((btn) => btn.classList.remove("active"));
    target.classList.add("active");

    [
      "dashboard",
      "users",
      "posts",
      "friendships",
      "reports",
      "analytics",
    ].forEach((id) => {
      el(id).classList.toggle("hidden", id !== target.dataset.tab);
    });
  });

  const refreshButton = el("refresh-analytics");
  if (refreshButton) {
    refreshButton.addEventListener("click", async () => {
      await loadAnalytics();
    });
  }

  document.body.addEventListener("click", async (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    if (target.classList.contains("save-user")) {
      const id = target.dataset.id;
      const name = document.querySelector(
        `input[data-field="name"][data-id="${id}"]`,
      ).value;
      const email = document.querySelector(
        `input[data-field="email"][data-id="${id}"]`,
      ).value;
      const status = document.querySelector(
        `select[data-field="status"][data-id="${id}"]`,
      ).value;
      await req(`${API.users}/${id}`, {
        method: "PUT",
        body: JSON.stringify({ name, email, status }),
      });
      await loadUsers();
      await loadDashboard();
    }

    if (target.classList.contains("del-user")) {
      const id = target.dataset.id;
      await req(`${API.users}/${id}`, { method: "DELETE" });
      await loadAll();
    }

    if (target.classList.contains("save-post")) {
      const id = target.dataset.id;
      const content = document.querySelector(`textarea[data-id="${id}"]`).value;
      await req(`${API.posts}/${id}`, {
        method: "PUT",
        body: JSON.stringify({ content }),
      });
      await loadPosts();
    }

    if (target.classList.contains("del-post")) {
      const id = target.dataset.id;
      await req(`${API.posts}/${id}`, { method: "DELETE" });
      await loadPosts();
      await loadDashboard();
    }

    if (target.classList.contains("req-act")) {
      const id = target.dataset.id;
      const action = target.dataset.action;
      await req(`${API.requestList}/${id}`, {
        method: "POST",
        body: JSON.stringify({ action }),
      });
      await loadFriendships();
      await loadDashboard();
    }

    if (target.classList.contains("rpt-act")) {
      const id = target.dataset.id;
      const action = target.dataset.action;
      await req(`${API.reports}/${id}/action`, {
        method: "POST",
        body: JSON.stringify({ action }),
      });
      await loadAll();
    }
  });
}

(async function init() {
  bindEvents();
  if (token()) {
    showApp(true);
    try {
      await loadAll();
    } catch (_err) {
      localStorage.removeItem("admin_token");
      showApp(false);
    }
  }
})();

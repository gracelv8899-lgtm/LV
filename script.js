const STORAGE_KEY = "xiaohongshu_hot_posts";

const form = document.getElementById("record-form");
const body = document.getElementById("records-body");
const exportBtn = document.getElementById("export-btn");
const today = document.getElementById("today");

const filters = {
  priority: document.getElementById("filter-priority"),
  stage: document.getElementById("filter-stage"),
  hot: document.getElementById("filter-hot"),
  small: document.getElementById("filter-small"),
  commented: document.getElementById("filter-commented"),
};

today.textContent = `日期：${new Date().toLocaleDateString("zh-CN")}`;

function loadRecords() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
}

function saveRecords(records) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

function toNumber(v) {
  return Number(v || 0);
}

function getScore(r) {
  return toNumber(r.likes) + toNumber(r.favorites) + toNumber(r.comments);
}

function escapeCsv(value) {
  const str = String(value ?? "").replaceAll('"', '""');
  return `"${str}"`;
}

function render() {
  const records = loadRecords();
  const priority = filters.priority.value;
  const stage = filters.stage.value;

  const list = records.filter((r) => {
    if (priority !== "全部" && r.priority !== priority) return false;
    if (stage !== "全部" && r.stage !== stage) return false;
    if (filters.hot.checked && getScore(r) < 1000) return false;
    if (filters.small.checked && toNumber(r.followers) > 1000) return false;
    if (filters.commented.checked && toNumber(r.comments) <= 0) return false;
    return true;
  });

  body.innerHTML = list
    .map(
      (r) => `
      <tr>
        <td>${r.date}</td>
        <td><a href="${r.url || "#"}" target="_blank" rel="noopener noreferrer">${r.title}</a><br/><span class="muted">${r.logic || ""}</span></td>
        <td>${r.followers}</td>
        <td>${r.likes}</td>
        <td>${r.favorites}</td>
        <td>${r.comments}</td>
        <td>${getScore(r)}</td>
        <td>${r.priority}</td>
        <td>${r.stage}</td>
      </tr>`
    )
    .join("");
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const fd = new FormData(form);
  const record = {
    date: new Date().toLocaleDateString("zh-CN"),
    title: fd.get("title"),
    url: fd.get("url"),
    followers: toNumber(fd.get("followers")),
    likes: toNumber(fd.get("likes")),
    favorites: toNumber(fd.get("favorites")),
    comments: toNumber(fd.get("comments")),
    priority: fd.get("priority"),
    stage: fd.get("stage"),
    logic: fd.get("logic"),
  };

  const records = loadRecords();
  records.unshift(record);
  saveRecords(records);
  form.reset();
  render();
});

Object.values(filters).forEach((el) => {
  el.addEventListener("change", render);
});

exportBtn.addEventListener("click", () => {
  const records = loadRecords();
  const header = ["date", "title", "url", "followers", "likes", "favorites", "comments", "score", "priority", "stage", "logic"];
  const rows = records.map((r) => [
    r.date,
    r.title,
    r.url,
    r.followers,
    r.likes,
    r.favorites,
    r.comments,
    getScore(r),
    r.priority,
    r.stage,
    r.logic,
  ]);

  const csv = [header, ...rows].map((row) => row.map(escapeCsv).join(",")).join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `xiaohongshu_records_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
});

render();

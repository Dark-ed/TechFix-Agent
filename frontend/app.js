const chatBox = document.getElementById("chatBox");
const form = document.getElementById("chatForm");
const input = document.getElementById("userInput");

function append(text, cls = "bot") {
  const d = document.createElement("div");
  d.className = cls;
  d.innerText = text;
  chatBox.appendChild(d);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function showSpinner() {
  const d = document.createElement("div");
  d.className = "bot-temp";
  d.innerHTML = 'Thinking <span class="spinner"></span>';
  chatBox.appendChild(d);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function clearSpinner() {
  document.querySelector(".bot-temp")?.remove();
}

const API_BASE = "http://127.0.0.1:5000/agent";

async function safeFetch(url, options = {}, timeoutMs = 20000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: ctrl.signal });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`HTTP ${res.status}: ${text || res.statusText}`);
    }
    return await res.json();
  } finally {
    clearTimeout(t);
  }
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) return;
  append(text, "user");
  input.value = "";
  showSpinner();
  try {
    const data = await safeFetch(`${API_BASE}/plan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text })
    });

    clearSpinner();

// Always show the raw JSON response
append("Response:\n" + JSON.stringify(data, null, 2), "bot");

if (data.needs_permission) {
  append(data.permission_prompt || "Approve actions?", "bot");
  const toolsDiv = document.createElement("div");
  toolsDiv.className = "bot";
  const pingBtn = document.createElement("button");
  pingBtn.innerText = "Run Ping";
  pingBtn.onclick = () => runTool("ping", { host: "8.8.8.8" });
  const taskBtn = document.createElement("button");
  taskBtn.innerText = "Show Processes";
  taskBtn.onclick = () => runTool("tasklist");
  const dnsBtn = document.createElement("button");
  dnsBtn.innerText = "DNS Lookup";
  dnsBtn.onclick = () => runTool("nslookup", { domain: "example.com" });
  const diagBtn = document.createElement("button");
  diagBtn.innerText = "Run Diagnostics";
  diagBtn.onclick = () => runTool("diagnostics", { port: 5000 });
  toolsDiv.append(pingBtn, taskBtn, dnsBtn, diagBtn);
  chatBox.appendChild(toolsDiv);
}

  } catch (err) {
    clearSpinner();
    append(`⚠️ Error contacting server: ${err.message}`, "bot");
  }
});

async function runTool(tool, args = {}) {
  showSpinner();
  try {
    const data = await safeFetch(`${API_BASE}/execute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ permission: true, tool, args })
    });

    clearSpinner();
    append(JSON.stringify(data, null, 2), "bot");
  } catch (err) {
    clearSpinner();
    append(`⚠️ Error running tool: ${err.message}`, "bot");
  }
}

window.runDiagnostics = async function runDiagnostics() {
  showSpinner();
  try {
    const data = await safeFetch(`${API_BASE}/diagnostics`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ port: 5000 })
    });

    clearSpinner();
    append(JSON.stringify(data, null, 2), "bot");
  } catch (err) {
    clearSpinner();
    append(`⚠️ Error running diagnostics: ${err.message}`, "bot");
  }
};

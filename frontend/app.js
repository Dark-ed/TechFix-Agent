// app.js
const chatBox = document.getElementById("chatBox");
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");

chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const message = userInput.value.trim();
  if (!message) return;

  // Show user message
  appendMessage("user", message);
  userInput.value = "";

  try {
    // Call backend Watson Assistant API
    const response = await fetch("/api/message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message })
    });

    const data = await response.json();
    // Show bot reply
    appendMessage("bot", data.reply || "Sorry, I didn't understand that.");

  } catch (err) {
    console.error(err);
    appendMessage("bot", "Error connecting to backend.");
  }
});

function appendMessage(sender, text) {
  const msgDiv = document.createElement("div");
  msgDiv.className = sender === "bot" ? "bot-message" : "user-message";
  msgDiv.innerText = text;
  chatBox.appendChild(msgDiv);
  chatBox.scrollTop = chatBox.scrollHeight;
}

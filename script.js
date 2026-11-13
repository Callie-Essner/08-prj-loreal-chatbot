/* DOM elements */
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatWindow = document.getElementById("chatWindow");
const sendBtn = document.getElementById("sendBtn");
const workerUrl = "https://orange-shadow-3359.essnercg.workers.dev/";
const messages = [
  {
    role: "system",
    content:
      "You are a L'Oréal beauty assistant. Answer questions about L'Oréal products and beauty topics, including skincare, makeup, haircare, fragrances, routines, and recommendations. If asked about unrelated topics, politely explain that you can only help with L'Oréal and beauty-related questions, then invite a relevant question. Do not invent product details.",
  },
];

// Set initial message
addMessage("👋 Hello! How can I help you today?", "ai");

// Add a message as text so user input is displayed safely.
function addMessage(text, sender) {
  const messageElement = document.createElement("div");
  messageElement.className = `msg ${sender}`;
  messageElement.textContent = text;
  chatWindow.appendChild(messageElement);
  chatWindow.scrollTop = chatWindow.scrollHeight;
  return messageElement;
}

// Send the conversation to the Cloudflare Worker when the form is submitted.
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const message = userInput.value.trim();
  if (!message) return;

  // Show only the latest question and its response in the chat window.
  chatWindow.replaceChildren();
  addMessage(message, "user");
  const loadingMessage = addMessage("Curating your beauty answer", "ai");
  loadingMessage.classList.add("loading");
  loadingMessage.setAttribute("role", "status");
  userInput.value = "";
  sendBtn.disabled = true;

  try {
    const response = await fetch(workerUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [...messages, { role: "user", content: message }],
      }),
    });

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content;
    if (!reply) {
      throw new Error("The Worker response did not include a reply.");
    }

    messages.push(
      { role: "user", content: message },
      { role: "assistant", content: reply },
    );
    loadingMessage.textContent = reply;
    loadingMessage.classList.remove("loading");
  } catch (error) {
    console.error("Could not get a reply from the Cloudflare Worker:", error);
    loadingMessage.textContent =
      "Sorry, I couldn't connect right now. Please try again.";
    loadingMessage.classList.remove("loading");
  } finally {
    sendBtn.disabled = false;
    userInput.focus();
  }
});

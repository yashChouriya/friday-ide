class ChatManager {
  constructor() {
    this.setupWebSocket();
    this.setupUI();
    this.setupEventListeners();
    this.sessionId = null;
    this.isConnected = false;
  }

  setupWebSocket() {
    // Create WebSocket connection
    this.ws = new window.ReconnectingWebSocket("ws://localhost:6661/ws", null, {
      debug: true,
      reconnectInterval: 4000,
    });

    console.info("Creating WebSocket wrapper", this.ws);

    this.ws.addEventListener("open", () => {
      console.log("WebSocket Connected");
      this.connect();
    });

    this.ws.addEventListener("message", (event) => {
      console.log("DATA FROM SERVER: ", event);
      const response = JSON.parse(event.data);
      this.handleWebSocketMessage(response);
    });

    this.ws.addEventListener("close", () => {
      console.log("WebSocket Disconnected");
      this.isConnected = false;
    });

    this.ws.addEventListener("error", (error) => {
      console.error("WebSocket Error:", error);
    });

    // if (this.ws?.ws) {
    //   this.ws.ws.onmessage = (e) => {
    //     console.log("CUSTOM MESSAGE EVENT: ", e);
    //   };
    // }
    console.log("WS: ", this.ws.ws);
  }

  setupUI() {
    // Create chat panel container
    this.chatPanel = document.createElement("div");
    this.chatPanel.className = "chat-panel hidden";
    this.chatPanel.innerHTML = `
            <div class="chat-panel-header">
                <h3>AI Assistant</h3>
                <button class="close-chat-button">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="chat-messages"></div>
            <div class="chat-input-container">
                <textarea class="chat-input" placeholder="Ask me anything..." rows="3"></textarea>
                <button class="send-message-button">
                    <i class="fas fa-paper-plane"></i>
                </button>
            </div>
        `;

    // Add resize handle
    const resizeHandle = document.createElement("div");
    resizeHandle.className = "chat-panel-resize-handle";
    this.chatPanel.appendChild(resizeHandle);

    // Add to DOM
    document.querySelector(".container").appendChild(this.chatPanel);

    // Store references to UI elements
    this.messagesContainer = this.chatPanel.querySelector(".chat-messages");
    this.inputField = this.chatPanel.querySelector(".chat-input");
    this.sendButton = this.chatPanel.querySelector(".send-message-button");
    this.closeButton = this.chatPanel.querySelector(".close-chat-button");
    this.resizeHandle = resizeHandle;

    // Add AI button to activity bar
    const aiButton = document.createElement("button");
    aiButton.className = "activity-button";
    aiButton.title = "AI Assistant";
    aiButton.innerHTML = '<i class="fas fa-robot"></i>';
    aiButton.id = "toggle-ai";

    // Insert before terminal button
    const terminalButton = document.querySelector("#toggle-terminal");
    terminalButton.parentNode.insertBefore(aiButton, terminalButton);
  }

  setupEventListeners() {
    // Toggle chat panel
    document.getElementById("toggle-ai").addEventListener("click", () => {
      this.toggleChatPanel();
    });

    // Close button
    this.closeButton.addEventListener("click", () => {
      this.toggleChatPanel();
    });

    // Send message
    this.sendButton.addEventListener("click", () => {
      console.log("SEND BUTTON TRIGGERED!");
      this.sendMessage();
    });

    // Send message on Enter (Shift+Enter for new line)
    this.inputField.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });

    // Resize functionality
    let isResizing = false;
    let startX;
    let startWidth;

    this.resizeHandle.addEventListener("mousedown", (e) => {
      isResizing = true;
      startX = e.pageX;
      startWidth = parseInt(
        document.defaultView.getComputedStyle(this.chatPanel).width,
        10
      );

      document.documentElement.classList.add("resizing");
    });

    document.addEventListener("mousemove", (e) => {
      if (!isResizing) return;

      const width = startWidth - (e.pageX - startX);
      if (width > 200 && width < window.innerWidth * 0.8) {
        this.chatPanel.style.width = width + "px";
      }
    });

    document.addEventListener("mouseup", () => {
      isResizing = false;
      document.documentElement.classList.remove("resizing");
    });
  }

  toggleChatPanel() {
    this.chatPanel.classList.toggle("hidden");
    document.getElementById("toggle-ai").classList.toggle("active");
  }

  async connect() {
    if (this.isConnected) return;

    const command = {
      command: "connect",
    };

    try {
      this.ws.send(JSON.stringify(command));
    } catch (error) {
      console.error("Error connecting:", error);
      this.addSystemMessage("Failed to connect to AI service");
    }
  }

  async sendMessage() {
    const content = this.inputField.value.trim();
    if (!content || !this.sessionId) return;

    // Add user message to UI
    this.addMessage("user", content);

    // Clear input
    this.inputField.value = "";

    console.log("INPUT FIELD VALUE: ", content);

    // Send to WebSocket
    const command = {
      command: "message",
      session_id: this.sessionId,
      data: { content },
    };

    try {
      this.ws.send(JSON.stringify(command));
    } catch (error) {
      console.error("Error sending message:", error);
      this.addSystemMessage("Failed to send message");
    }
  }

  handleWebSocketMessage(response) {
    if (response.status === "connected" && response.session_id) {
      this.sessionId = response.session_id;
      this.isConnected = true;
      console.log("Connected with session ID:", this.sessionId);
      return;
    }

    if (response.type === "assistant_message") {
      this.addMessage("assistant", response.data.content);
    } else if (response.type === "tool_result") {
      this.handleToolResult(response.data);
    } else if (response.type === "error") {
      this.addSystemMessage(`Error: ${response.data.content}`);
    }
  }

  handleToolResult(result) {
    let content = "";
    
    if (result?.base64_image) {
      // Add image to message
      const img = document.createElement("img");
      img.src = `data:image/png;base64,${result.base64_image}`;
      console.log("src", img.src);
      img.className = "chat-image";
      this.addMessage("tool", content, img);
      return;
    }

    if (result?.output) {
      content += result.output;
    }
    if (result?.error) {
      content += `\nError: ${result.error}`;
    }

    if (content) {
      this.addMessage("tool", content);
    }
  }

  addMessage(type, content, extraElement = null) {
    const messageDiv = document.createElement("div");
    messageDiv.className = `chat-message ${type}-message`;

    const icon = document.createElement("div");
    icon.className = "message-icon";
    icon.innerHTML = this.getIconForType(type);
    messageDiv.appendChild(icon);

    const contentDiv = document.createElement("div");
    contentDiv.className = "message-content";

    // Add text content
    if (content) {
      const textDiv = document.createElement("div");
      textDiv.className = "message-text";
      textDiv.textContent = content;
      contentDiv.appendChild(textDiv);
    }

    // Add extra element (like images)
    if (extraElement) {
      contentDiv.appendChild(extraElement);
    }

    messageDiv.appendChild(contentDiv);
    this.messagesContainer.appendChild(messageDiv);
    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
  }

  addSystemMessage(content) {
    this.addMessage("system", content);
  }

  getIconForType(type) {
    switch (type) {
      case "user":
        return '<i class="fas fa-user"></i>';
      case "assistant":
        return '<i class="fas fa-robot"></i>';
      case "system":
        return '<i class="fas fa-info-circle"></i>';
      case "tool":
        return '<i class="fas fa-tools"></i>';
      default:
        return '<i class="fas fa-comment"></i>';
    }
  }
}

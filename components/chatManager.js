window.ChatManager = class ChatManager {
  constructor() {
    this.setupWebSocket();
    this.setupUI();
    this.setupEventListeners();
    this.sessionId = null;
    this.isConnected = false;
  }

  setupWebSocket() {
    this.ws = new window.ReconnectingWebSocket("ws://localhost:6661/ws", null, {
      debug: true,
      reconnectInterval: 4000,
    });

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
  }

  setupUI() {
    // Create chat panel container
    this.chatPanel = document.createElement("div");
    this.chatPanel.className = "chat-panel hidden";
    this.chatPanel.innerHTML = `
      <div class="chat-panel-header">
        <h3>Friday AI Assistant</h3>
        <button class="close-chat-button">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <div class="chat-messages"></div>
      <div class="chat-input-container">
        <textarea class="chat-input" placeholder="Ask me anything..." rows="3"></textarea>
        <button class="send-message-button">
          <i class="fas fa-paper-plane"></i>
          <span>Send</span>
          <div class="loading-spinner"></div>
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

    // Show loading state
    this.sendButton.classList.add('loading');
    this.sendButton.disabled = true;

    // Add user message to UI
    this.addMessage("user", content);

    // Clear input
    this.inputField.value = "";

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
      this.sendButton.classList.remove('loading');
      this.sendButton.disabled = false;
    }
  }

  handleWebSocketMessage(response) {
    // Reset loading state
    this.sendButton.classList.remove('loading');
    this.sendButton.disabled = false;

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

    if (content) {
      try {
        const textDiv = document.createElement("div");
        textDiv.className = "message-text markdown";
        
        // Handle different message types
        if (type === "user") {
          // For user messages, just escape HTML and preserve line breaks
          textDiv.innerHTML = this.escapeHTML(content).replace(/\n/g, '<br>');
        } else {
          // For other messages, try to use markdown if available
          if (typeof window.md !== 'undefined' && typeof window.md.render === 'function') {
            console.log('Rendering markdown for message:', content.substring(0, 100) + '...');
            try {
              // Render markdown using markdown-it
              const rendered = window.md.render(content);
              console.log('Markdown rendered successfully:', rendered.substring(0, 100) + '...');
              textDiv.innerHTML = rendered;

              // Apply syntax highlighting to any code blocks
              if (window.hljs) {
                textDiv.querySelectorAll('pre code').forEach((block) => {
                  window.hljs.highlightElement(block);
                });
              }
            } catch (markdownError) {
              console.error('Error rendering markdown:', markdownError);
              textDiv.innerHTML = this.escapeHTML(content).replace(/\n/g, '<br>');
            }
          } else {
            console.warn('Markdown-it not available, falling back to plain text');
            textDiv.innerHTML = this.escapeHTML(content).replace(/\n/g, '<br>');
          }
        }

        // Make links open in new tab
        textDiv.querySelectorAll('a').forEach(link => {
          link.target = '_blank';
          link.rel = 'noopener noreferrer';
        });

        // Apply syntax highlighting to code blocks
        if (window.hljs) {
          textDiv.querySelectorAll('pre code').forEach((block) => {
            window.hljs.highlightBlock(block);
          });
        }

        contentDiv.appendChild(textDiv);
      } catch (error) {
        console.error('Error rendering message:', error);
        // Fallback to plain text
        const textDiv = document.createElement("div");
        textDiv.className = "message-text";
        textDiv.textContent = content;
        contentDiv.appendChild(textDiv);
      }
    }

    if (extraElement) {
      contentDiv.appendChild(extraElement);
    }

    messageDiv.appendChild(contentDiv);
    this.messagesContainer.appendChild(messageDiv);
    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
  }

  escapeHTML(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
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
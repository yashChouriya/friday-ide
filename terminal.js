class TerminalManager {
  constructor() {
    this.terminal = null;
    this.webLinkAddon = null;
    this.terminalElement = document.getElementById("terminal");
    this.toggleButton = document.getElementById("toggle-terminal");
    this.terminalId = null;
    this.removeDataListener = null;
    this.initialize();
  }

  async initialize() {
    // Initialize xterm.js
    this.terminal = new Terminal({
      cursorBlink: true,
      theme: {
        background: "#1e1e1e",
        foreground: "#cccccc",
      },
      fontSize: 14,
      fontFamily: "Consolas, monospace",
    });

    // Open terminal in container
    this.terminal.open(this.terminalElement);

    // Create pty process
    this.terminalId = await window.electronAPI.terminal.create();

    // Handle terminal input
    this.terminal.onData((data) => {
      window.electronAPI.terminal.write(this.terminalId, data);
    });

    // Handle terminal resize
    this.terminal.onResize(({ cols, rows }) => {
      window.electronAPI.terminal.resize(this.terminalId, cols, rows);
    });

    // Handle terminal output
    this.removeDataListener = window.electronAPI.terminal.onData(({ id, data }) => {
      if (id === this.terminalId) {
        this.terminal.write(data);
      }
    });

    // Initial terminal size
    const dimensions = { cols: this.terminal.cols, rows: this.terminal.rows };
    window.electronAPI.terminal.resize(this.terminalId, dimensions.cols, dimensions.rows);

    // Add toggle button handler
    this.toggleButton.addEventListener("click", () => this.toggleTerminal());
  }

  toggleTerminal() {
    const isHidden = this.terminalElement.classList.contains("hidden");

    if (isHidden) {
      this.terminalElement.classList.remove("hidden");
      this.toggleButton.classList.add("active");
      this.terminal.focus();
    } else {
      this.terminalElement.classList.add("hidden");
      this.toggleButton.classList.remove("active");
    }
  }

  async destroy() {
    if (this.terminalId) {
      await window.electronAPI.terminal.destroy(this.terminalId);
      this.terminalId = null;
    }
    if (this.removeDataListener) {
      this.removeDataListener();
      this.removeDataListener = null;
    }
    if (this.terminal) {
      this.terminal.dispose();
      this.terminal = null;
    }
  }
}

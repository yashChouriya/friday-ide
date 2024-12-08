class TerminalManager {
  constructor() {
    this.terminal = null;
    this.webLinkAddon = null;
    this.terminalElement = document.getElementById("terminal");
    this.toggleButton = document.getElementById("toggle-terminal");
    this.initialize();
  }

  initialize() {
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

    // Write initial text
    this.terminal.write("Welcome to Friday IDE Terminal\\r\\n$ ");
    this.terminal.onData((data) => this.terminal.write(data));

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
}

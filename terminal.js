class TerminalManager {
  constructor() {
    // Initialize properties
    this.terminal = null;
    this.terminalId = null;
    this.removeDataListener = null;
    this.isInitialized = false;

    // Get DOM elements
    this.terminalElement = document.getElementById("terminal");
    this.toggleButton = document.getElementById("toggle-terminal");

    // Bind methods to maintain 'this' context
    this.handleInput = this.handleInput.bind(this);
    this.handleResize = this.handleResize.bind(this);
    this.handleOutput = this.handleOutput.bind(this);

    // Set up event listener for toggle button
    if (this.toggleButton) {
      this.toggleButton.addEventListener("click", () => this.toggleTerminal());
    }
  }

  handleInput(data) {
    if (this.terminalId) {
      window.electronAPI.terminal.write(this.terminalId, data);
    }
  }

  handleResize({ cols, rows }) {
    if (this.terminalId) {
      window.electronAPI.terminal.resize(this.terminalId, cols, rows);
    }
  }

  handleOutput({ id, data }) {
    if (id === this.terminalId && this.terminal) {
      this.terminal.write(data);
    }
  }

  async initializeTerminal() {
    try {
      // Only initialize once
      if (this.isInitialized) return;

      // Create terminal instance if it doesn't exist
      if (!this.terminal) {
        this.terminal = new Terminal({
          cursorBlink: true,
          theme: {
            background: "#1e1e1e",
            foreground: "#cccccc",
          },
          fontSize: 14,
          fontFamily: "Consolas, monospace",
          rows: 24,
          cols: 80
        });
      }

      // Open terminal in container if not already opened
      if (this.terminalElement && !this.terminalElement.querySelector('.xterm')) {
        this.terminal.open(this.terminalElement);
      }

      // Set up event handlers
      this.terminal.onData(this.handleInput);
      this.terminal.onResize(this.handleResize);
      
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize terminal:', error);
      throw error;
    }
  }

  async createTerminal() {
    try {
      // Initialize terminal UI if needed
      await this.initializeTerminal();

      // Clean up existing terminal process if any
      await this.destroyProcess();

      // Get working directory
      const homeDir = await window.electronAPI.path.getHomeDir();
      const projectDir = window.fileExplorer?.currentPath || homeDir;

      // Create new terminal process
      this.terminalId = await window.electronAPI.terminal.create(projectDir);

      // Set up output handler
      this.removeDataListener = window.electronAPI.terminal.onData(this.handleOutput);

      // Set initial size
      if (this.terminal && this.terminalId) {
        await window.electronAPI.terminal.resize(
          this.terminalId,
          this.terminal.cols,
          this.terminal.rows
        );
      }
    } catch (error) {
      console.error('Failed to create terminal:', error);
      throw error;
    }
  }

  async toggleTerminal() {
    try {
      if (!this.terminalElement) return;

      const isHidden = this.terminalElement.classList.contains("hidden");

      if (isHidden) {
        // Create new terminal if needed
        if (!this.terminalId) {
          await this.createTerminal();
        }
        this.terminalElement.classList.remove("hidden");
        this.toggleButton?.classList.add("active");
        this.terminal?.focus();
      } else {
        this.terminalElement.classList.add("hidden");
        this.toggleButton?.classList.remove("active");
      }
    } catch (error) {
      console.error('Failed to toggle terminal:', error);
    }
  }

  async destroyProcess() {
    try {
      // Clean up terminal process
      if (this.terminalId) {
        await window.electronAPI.terminal.destroy(this.terminalId);
        this.terminalId = null;
      }

      // Remove data listener
      if (this.removeDataListener) {
        this.removeDataListener();
        this.removeDataListener = null;
      }
    } catch (error) {
      console.error('Failed to destroy terminal process:', error);
    }
  }

  async destroy() {
    try {
      // Clean up terminal process
      await this.destroyProcess();

      // Clean up terminal UI
      if (this.terminal) {
        this.terminal.dispose();
        this.terminal = null;
      }

      this.isInitialized = false;
    } catch (error) {
      console.error('Failed to destroy terminal:', error);
    }
  }
}

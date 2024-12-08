class TerminalManager {
  constructor() {
    // Initialize properties
    this.terminal = null;
    this.terminalId = null;
    this.removeDataListener = null;
    this.isInitialized = false;
    this.isResizing = false;
    this.startY = 0;
    this.startHeight = 0;

    // Get DOM elements
    this.terminalElement = document.getElementById("terminal");
    this.toggleButton = document.getElementById("toggle-terminal");

    // Bind methods to maintain 'this' context
    this.handleInput = this.handleInput.bind(this);
    this.handleResize = this.handleResize.bind(this);
    this.handleOutput = this.handleOutput.bind(this);
    this.startResizing = this.startResizing.bind(this);
    this.stopResizing = this.stopResizing.bind(this);
    this.resize = this.resize.bind(this);
    this.updateTerminalSize = this.updateTerminalSize.bind(this);

    // Set up event listeners
    if (this.toggleButton) {
      this.toggleButton.addEventListener("click", () => this.toggleTerminal());
    }
    if (this.terminalElement) {
      // Add resize event listeners
      this.terminalElement.addEventListener("mousedown", (e) => {
        // Only start resize if clicking the top border area
        if (e.offsetY <= 4) {
          this.startResizing(e);
        }
      });

      window.addEventListener("mousemove", this.resize);
      window.addEventListener("mouseup", this.stopResizing);

      // Add mutation observer to handle terminal container resizing
      const resizeObserver = new ResizeObserver(() => {
        if (this.terminal) {
          this.updateTerminalSize();
        }
      });
      resizeObserver.observe(this.terminalElement);
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

      // Get saved theme or use default
      let theme = "vs-dark";
      try {
        theme = (await window.electronAPI.store.get("theme")) || "vs-dark";
        console.log("Loaded theme for terminal:", theme);
      } catch (error) {
        console.warn("Failed to load terminal theme:", error);
      }

      // Create terminal instance if it doesn't exist
      if (!this.terminal) {
        this.terminal = new Terminal({
          cursorBlink: true,
          theme:
            window.terminalThemes[theme] || window.terminalThemes["vs-dark"],
          fontSize: 14,
          fontFamily: "'Fira Code', Consolas, 'Courier New', monospace",
          rows: 24,
          cols: 80,
          allowTransparency: true,
        });

        // Initialize web links addon
        try {
          const webLinksAddon = new window.WebLinksAddon.WebLinksAddon((event, uri) => {
            event.preventDefault();
            // Open the URL in default browser
            window.electronAPI.shell.openExternal(uri);
          });
          this.terminal.loadAddon(webLinksAddon);
          console.log('Web links addon loaded successfully');
        } catch (error) {
          console.warn('Failed to load web links addon:', error);
        }
      }

      // Open terminal in container if not already opened
      if (
        this.terminalElement &&
        !this.terminalElement.querySelector(".xterm")
      ) {
        this.terminal.open(this.terminalElement);
      }

      // Set up event handlers
      this.terminal.onData(this.handleInput);
      this.terminal.onResize(this.handleResize);

      this.isInitialized = true;
    } catch (error) {
      console.error("Failed to initialize terminal:", error);
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
      this.removeDataListener = window.electronAPI.terminal.onData(
        this.handleOutput
      );

      // Set initial size
      if (this.terminal && this.terminalId) {
        await window.electronAPI.terminal.resize(
          this.terminalId,
          this.terminal.cols,
          this.terminal.rows
        );
      }
    } catch (error) {
      console.error("Failed to create terminal:", error);
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
      console.error("Failed to toggle terminal:", error);
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
      console.error("Failed to destroy terminal process:", error);
    }
  }

  startResizing(e) {
    if (!this.terminalElement) return;

    this.isResizing = true;
    this.startY = e.clientY;
    this.startHeight = this.terminalElement.offsetHeight;

    // Add temporary overlay to prevent text selection during resize
    const overlay = document.createElement("div");
    overlay.style.position = "fixed";
    overlay.style.top = "0";
    overlay.style.left = "0";
    overlay.style.right = "0";
    overlay.style.bottom = "0";
    overlay.style.cursor = "row-resize";
    overlay.style.zIndex = "9999";
    overlay.id = "resize-overlay";
    document.body.appendChild(overlay);
  }

  resize(e) {
    if (!this.isResizing) return;

    const delta = this.startY - e.clientY;
    const newHeight = Math.max(
      100,
      Math.min(window.innerHeight * 0.8, this.startHeight + delta)
    );
    this.terminalElement.style.height = `${newHeight}px`;
    this.updateTerminalSize();
  }

  stopResizing() {
    if (!this.isResizing) return;

    this.isResizing = false;
    // Remove the overlay
    const overlay = document.getElementById("resize-overlay");
    if (overlay) {
      overlay.remove();
    }
  }

  updateTerminalSize() {
    if (!this.terminal || !this.terminalElement) return;

    try {
      // Get the dimensions of the container
      const terminalElementStyle = window.getComputedStyle(
        this.terminalElement
      );
      const padding = {
        left: parseInt(terminalElementStyle.paddingLeft) || 0,
        right: parseInt(terminalElementStyle.paddingRight) || 0,
        top: parseInt(terminalElementStyle.paddingTop) || 0,
        bottom: parseInt(terminalElementStyle.paddingBottom) || 0,
      };

      // Calculate available space
      const availableWidth = Math.max(
        0,
        this.terminalElement.clientWidth - padding.left - padding.right
      );
      const availableHeight = Math.max(
        0,
        this.terminalElement.clientHeight - padding.top - padding.bottom
      );

      // Get the size of a single character
      const dimensions = this.terminal._core._renderService.dimensions;
      const charMeasure = dimensions?.actualCellWidth || 9; // fallback to 9 pixels if undefined
      const lineMeasure = dimensions?.actualCellHeight || 17; // fallback to 17 pixels if undefined

      // Calculate cols and rows, ensure minimum values
      const cols = Math.max(2, Math.floor(availableWidth / charMeasure));
      const rows = Math.max(1, Math.floor(availableHeight / lineMeasure));

      // Update terminal size if it has changed and values are valid
      if (
        cols > 0 &&
        rows > 0 &&
        (cols !== this.terminal.cols || rows !== this.terminal.rows)
      ) {
        // Ensure integer values
        const finalCols = Math.floor(cols);
        const finalRows = Math.floor(rows);

        this.terminal.resize(finalCols, finalRows);
        if (this.terminalId) {
          window.electronAPI.terminal.resize(
            this.terminalId,
            finalCols,
            finalRows
          );
        }
      }
    } catch (error) {
      console.warn("Terminal resize calculation error:", error);
    }
  }

  async destroy() {
    try {
      // Clean up terminal process
      await this.destroyProcess();

      // Remove event listeners
      if (this.terminalElement) {
        window.removeEventListener("mousemove", this.resize);
        window.removeEventListener("mouseup", this.stopResizing);
      }

      // Clean up terminal UI
      if (this.terminal) {
        this.terminal.dispose();
        this.terminal = null;
      }

      this.isInitialized = false;
    } catch (error) {
      console.error("Failed to destroy terminal:", error);
    }
  }

  updateTheme(themeName) {
    if (this.terminal && window.terminalThemes[themeName]) {
      try {
        this.terminal.options.theme = window.terminalThemes[themeName];
        console.log("Terminal theme updated to:", themeName);
      } catch (error) {
        console.error("Failed to update terminal theme:", error);
      }
    }
  }
}

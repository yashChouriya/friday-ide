// Make FileExplorer and TerminalManager instances available globally
window.fileExplorer = null;
window.terminalManager = null;

class FileExplorer {
  constructor() {
    // Ensure Monaco is available
    if (typeof window.monaco === 'undefined') {
      console.error('Monaco is not loaded');
      return;
    }

    console.log('Initializing FileExplorer...');
    
    this.currentPath = "";
    this.fileTree = document.getElementById("file-tree");
    this.editorContainer = document.getElementById("monaco-editor");
    this.tabsContainer = document.querySelector(".tabs-container");
    this.emptyEditor = document.getElementById("empty-editor");
    this.recentFiles = new Set(); // Track recent files
    
    if (!this.fileTree || !this.editorContainer || !this.tabsContainer) {
      console.error('Required DOM elements not found');
      return;
    }

    this.expandedDirs = new Set();
    this.lastOpenedFile = null;
    this.editor = null;
    this.openedFiles = new Map(); // Map<filePath, {model, viewState}>
    
    // Initialize async
    this.initializeAsync().catch(error => {
      console.error('Error during initialization:', error);
    });
  }

  async initializeAsync() {
    try {
      await this.initialize();
      console.log('FileExplorer initialization complete');
    } catch (error) {
      console.error('FileExplorer initialization failed:', error);
      throw error;
    }
  }

  async initialize() {
    await this.initializeMonaco();
    this.addTreeEventListeners();
    this.setupOpenFolderButton();
    await this.loadSavedState();
    this.setupStateHandlers();
    this.setupEmptyEditorHandlers();
    this.setupContextMenu();
  }

  async initializeMonaco() {
    return new Promise(async (resolve) => {
      try {
        // Set up keyboard shortcuts
        this.setupKeyboardShortcuts();

        // Initialize managers
        this.configManager = new EditorConfigManager();
        
        // Get saved theme before creating editor
        let theme = "vs-dark";
        try {
          const savedTheme = await window.electronAPI.store.get("selectedTheme");
          if (savedTheme) {
            theme = savedTheme;
            console.log("Loaded saved theme for editor:", theme);
          }
        } catch (error) {
          console.warn("Failed to load theme for editor:", error);
        }

        // Ensure monaco is available
        if (typeof monaco === 'undefined' || !monaco.editor) {
          throw new Error('Monaco editor not properly loaded');
        }

        console.log('Creating Monaco editor instance...');
        
        // Get initial configuration with theme-specific settings
        const initialConfig = this.configManager.getConfigForTheme(theme);
        
        // Initialize Monaco Editor with configuration
        this.editor = monaco.editor.create(this.editorContainer, {
          ...initialConfig,
          value: "", // Empty initial content
          language: "plaintext",
          theme: theme,
        });

        // Initialize other managers after editor creation
        this.performanceManager = new EditorPerformanceManager(this.editor);
        this.themeManager = new EditorThemeManager(this.editor, this.configManager);
        this.intelligenceManager = new EditorIntelligenceManager(this.editor);

        // Setup manager features
        await this.themeManager.setTheme(theme);
        const cleanupPerformance = this.performanceManager.setupPerformanceOptimizations();

        // Wait for editor to be fully ready
        await new Promise(resolve => setTimeout(resolve, 100));

        // Setup cleanup on window unload
        window.addEventListener('beforeunload', () => {
          this.intelligenceManager.dispose();
          cleanupPerformance();
          if (this.editor) {
            this.editor.dispose();
          }
        });

        console.log('Editor initialization complete');
      } catch (error) {
        console.error('Error initializing Monaco editor:', error);
      }
      
      resolve();
    });
  }

  setupStateHandlers() {
    // Save state periodically (every 30 seconds)
    setInterval(() => {
      this.saveState();
    }, 30000);

    // Save state when switching files
    this.editor.onDidChangeModel(() => {
      this.saveState();
    });

    // Save state when closing
    window.addEventListener("beforeunload", () => {
      this.saveState();
    });
  }

  MAX_OPEN_FILES = 10;

  async saveState() {
    try {
      // Only save if we have opened files
      if (this.openedFiles.size > 0 && this.currentPath) {
        const state = {
          lastOpenedDir: this.currentPath,
          lastOpenedFile: this.lastOpenedFile,
          openedFiles: Array.from(this.openedFiles.keys()),
          expandedDirs: Array.from(this.expandedDirs),
          selectedTheme: await await window.electronAPI.store.get("selectedTheme")
        };
        console.log("Saving state:", state);
        const result = await window.electronAPI.fileSystem.saveState(state);
        console.log("State saved:", result);
      }
    } catch (error) {
      console.error("Error saving state:", error);
    }
  }

  async loadSavedState() {
    try {
      console.log("Starting state restoration...");
      const state = await window.electronAPI.fileSystem.loadState();
      console.log("Loaded state:", state);

      if (!state || !state.lastOpenedDir) {
        console.log("No state to restore");
        return;
      }

      // First open the directory
      await this.openDirectory(state.lastOpenedDir);
      console.log("Directory opened:", state.lastOpenedDir);

      // Then restore opened files
      if (Array.isArray(state.openedFiles)) {
        console.log("Restoring files:", state.openedFiles);
        for (const filePath of state.openedFiles.slice(
          0,
          this.MAX_OPEN_FILES
        )) {
          try {
            await this.loadFile(filePath, false); // Don't switch to file yet
          } catch (error) {
            console.warn(`Couldn't restore file: ${filePath}`, error);
          }
        }
      }

      // Finally switch to last opened file
      if (state.lastOpenedFile) {
        console.log("Switching to last file:", state.lastOpenedFile);
        await this.switchToFile(state.lastOpenedFile);
      }

      // Restore expanded state after files are loaded
      if (Array.isArray(state.expandedDirs)) {
        this.expandedDirs = new Set(state.expandedDirs);
        for (const dir of state.expandedDirs) {
          const dirElement = this.fileTree.querySelector(
            `[data-path="${dir}"]`
          );
          if (dirElement) {
            dirElement.classList.add("expanded");
            await this.expandDirectory(dirElement);
          }
        }
      }
    } catch (error) {
      console.error("Failed to restore state:", error);
    }
  }

  setupOpenFolderButton() {
    const openFolderBtn = document.getElementById("open-folder");
    openFolderBtn.addEventListener("click", async () => {
      const folderPath = await window.electronAPI.fileSystem.selectFolder();
      if (folderPath) {
        // Reset state for new folder
        this.expandedDirs.clear();
        this.lastOpenedFile = null;
        this.recentFiles.clear(); // Clear recent files for new directory

        // Clear all tabs and models
        this.openedFiles.forEach(({ model }) => model.dispose());
        this.openedFiles.clear();
        this.tabsContainer.innerHTML = "";
        this.editor.setModel(null);

        // Remove any previous file selection
        const previousSelected = this.fileTree.querySelector(
          ".tree-item-content.selected"
        );
        if (previousSelected) {
          previousSelected.classList.remove("selected");
        }

        await this.openDirectory(folderPath);

        // Create new terminal in the new directory if terminal is visible
        const terminalElement = document.getElementById("terminal");
        if (
          terminalElement &&
          !terminalElement.classList.contains("hidden") &&
          window.terminalManager
        ) {
          await window.terminalManager.createTerminal();
        }

        await this.saveState();
      }
    });
  }

  async loadDirectory(dirPath) {
    try {
      const items = await window.electronAPI.fileSystem.readDirectory(dirPath);
      return items;
    } catch (error) {
      console.error("Error loading directory:", error);
      return [];
    }
  }

  createTreeItem(item) {
    const itemDiv = document.createElement("div");
    itemDiv.className = "tree-item";
    itemDiv.dataset.path = item.path;

    // Create content wrapper
    const contentDiv = document.createElement("div");
    contentDiv.className = "tree-item-content";

    if (item.isDirectory) {
      const angleIcon = document.createElement("i");
      angleIcon.className = "fas fa-angle-right arrow-icon";
      contentDiv.appendChild(angleIcon);
    } else {
      // Add spacing for files to align with folders
      const spacer = document.createElement("span");
      spacer.className = "arrow-spacer";
      contentDiv.appendChild(spacer);
    }

    const iconSpan = document.createElement("i");
    if (item.isDirectory) {
      iconSpan.className = "icon fas fa-folder";
    } else {
      const fileInfo = FileTypeHelper.getFileInfo(item.path);
      iconSpan.className = `icon ${fileInfo.icon}`;
      iconSpan.style.color = fileInfo.color;
    }

    const nameSpan = document.createElement("span");
    nameSpan.className = "name";
    nameSpan.textContent = item.name;

    contentDiv.appendChild(iconSpan);
    contentDiv.appendChild(nameSpan);
    itemDiv.appendChild(contentDiv);

    if (item.isDirectory) {
      itemDiv.classList.add("directory");
      const childrenDiv = document.createElement("div");
      childrenDiv.className = "children";
      itemDiv.appendChild(childrenDiv);
    }

    return itemDiv;
  }

  async expandDirectory(dirElement) {
    const childrenDiv = dirElement.querySelector(".children");
    if (!childrenDiv) return;

    // Clear existing children
    childrenDiv.innerHTML = "";

    const items = await this.loadDirectory(dirElement.dataset.path);
    items.sort((a, b) => {
      // Directories first, then files
      if (a.isDirectory && !b.isDirectory) return -1;
      if (!a.isDirectory && b.isDirectory) return 1;
      return a.name.localeCompare(b.name);
    });

    for (const item of items) {
      const itemElement = this.createTreeItem(item);
      childrenDiv.appendChild(itemElement);
    }
  }

  createTab(filePath, fileName) {
    const tab = document.createElement("div");
    tab.className = "tab";
    tab.dataset.path = filePath;

    const icon = document.createElement("i");
    const fileInfo = FileTypeHelper.getFileInfo(filePath);
    icon.className = `tab-icon ${fileInfo.icon}`;
    icon.style.color = fileInfo.color;

    const title = document.createElement("span");
    title.className = "tab-title";
    title.textContent = fileName;

    const closeBtn = document.createElement("div");
    closeBtn.className = "tab-close";
    closeBtn.innerHTML = "&times;";
    closeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      this.closeFile(filePath);
    });

    tab.appendChild(icon);
    tab.appendChild(title);
    tab.appendChild(closeBtn);

    tab.addEventListener("click", () => this.switchToFile(filePath));

    return tab;
  }

  async closeFile(filePath) {
    try {
      const fileData = this.openedFiles.get(filePath);
      if (fileData) {
        // Clear any markers before disposing
        monaco.editor.setModelMarkers(fileData.model, 'links', []);
        
        // Dispose of any event listeners or decorations
        if (fileData.disposables) {
          fileData.disposables.forEach(d => {
            try {
              d.dispose();
            } catch (e) {
              console.warn('Error disposing of editor decoration:', e);
            }
          });
        }

        // Set editor model to null before disposing if this is the active file
        if (this.lastOpenedFile === filePath) {
          this.editor.setModel(null);
        }

        // Dispose of the model
        try {
          fileData.model.dispose();
        } catch (e) {
          console.warn('Error disposing model:', e);
        }

        this.openedFiles.delete(filePath);

        // Remove tab
        const tab = this.tabsContainer.querySelector(`[data-path="${filePath}"]`);
        if (tab) {
          tab.remove();
        }

        // If this was the active file, switch to another file
        if (this.lastOpenedFile === filePath) {
          const remainingFiles = Array.from(this.openedFiles.keys());
          if (remainingFiles.length > 0) {
            await this.switchToFile(remainingFiles[remainingFiles.length - 1]);
          } else {
            this.lastOpenedFile = null;
            this.editor.setModel(null);
            if (this.currentPath) {
              this.showEmptyEditor();
            }
          }
        }
      }
      await this.saveState();
    } catch (error) {
      console.error('Error closing file:', error);
    }
  }

  async switchToFile(filePath) {
    if (!this.openedFiles.has(filePath)) {
      await this.loadFile(filePath);
      return;
    }

    // Hide empty editor state
    this.hideEmptyEditor();

    // Save current file's view state
    if (this.lastOpenedFile) {
      const currentFileData = this.openedFiles.get(this.lastOpenedFile);
      if (currentFileData) {
        currentFileData.viewState = this.editor.saveViewState();
      }
    }
    
    // Add to recent files
    this.addToRecentFiles(filePath);

    // Update active tab
    const tabs = this.tabsContainer.querySelectorAll(".tab");
    tabs.forEach((tab) => tab.classList.remove("active"));
    const newTab = this.tabsContainer.querySelector(
      `[data-path="${filePath}"]`
    );
    if (newTab) {
      newTab.classList.add("active");
    }

    // Switch to new file
    const fileData = this.openedFiles.get(filePath);
    this.editor.setModel(fileData.model);
    if (fileData.viewState) {
      this.editor.restoreViewState(fileData.viewState);
    }
    this.editor.focus();

    // Update tree selection
    const treeItems = this.fileTree.querySelectorAll(".tree-item-content");
    treeItems.forEach((item) => item.classList.remove("selected"));
    const treeItem = this.fileTree.querySelector(`[data-path="${filePath}"]`);
    if (treeItem) {
      treeItem.querySelector(".tree-item-content").classList.add("selected");
    }

    this.lastOpenedFile = filePath;
    await this.saveState();
  }

  setupKeyboardShortcuts() {
    window.addEventListener("keydown", async (e) => {
      // Ctrl/Cmd + S for save
      if (e.ctrlKey && e.key === "s") {
        e.preventDefault();
        if (this.lastOpenedFile) {
          await this.saveFile(this.lastOpenedFile);
        }
      }
      
      // Ctrl/Cmd + O for open folder
      if ((e.ctrlKey || e.metaKey) && e.key === "o") {
        e.preventDefault();
        const openFolderBtn = document.getElementById("open-folder");
        if (openFolderBtn) {
          // Add a subtle flash effect to the button
          openFolderBtn.style.transition = "background-color 0.2s ease";
          openFolderBtn.style.backgroundColor = "var(--button-bg)";
          setTimeout(() => {
            openFolderBtn.style.backgroundColor = "";
          }, 200);
          
          openFolderBtn.click();
        }
      }

      // File creation shortcuts
      if (this.currentPath) {
        const handleCreationShortcut = async (type) => {
          await this.ensureFileExplorerExpanded();
          this.showFileCreationUI(this.currentPath, type);
        };

        // Ctrl + N: New File
        if (e.ctrlKey && !e.shiftKey && e.key === "n") {
          e.preventDefault();
          handleCreationShortcut("file");
        }
        
        // Ctrl + Shift + N: New Folder
        if (e.ctrlKey && e.shiftKey && e.key === "N") {
          e.preventDefault();
          handleCreationShortcut("folder");
        }
      }

      // Delete: Delete selected item
      if (e.key === "Delete") {
        const selectedItem = this.fileTree.querySelector(".tree-item-content.selected");
        if (selectedItem) {
          e.preventDefault();
          const itemPath = selectedItem.parentElement.dataset.path;
          await this.deleteItem(itemPath);
        }
      }
    });
  }

  setupContextMenu() {
    // Prevent default context menu
    this.fileTree.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      
      // Get clicked item
      const treeItem = e.target.closest(".tree-item");
      if (!treeItem) return;

      // Select the item that was right-clicked
      const treeItemContent = treeItem.querySelector(".tree-item-content");
      this.selectTreeItem(treeItemContent);

      // Show context menu with position adjustment
      const contextMenu = document.querySelector(".context-menu");
      const rect = contextMenu.getBoundingClientRect();
      
      // Calculate initial position
      let left = e.pageX;
      let top = e.pageY;
      
      // Check right edge
      if (left + rect.width > window.innerWidth) {
        left = e.pageX - rect.width;
      }
      
      // Check bottom edge
      if (top + rect.height > window.innerHeight) {
        top = e.pageY - rect.height;
      }
      
      // Ensure minimum distance from edges
      left = Math.max(0, Math.min(left, window.innerWidth - rect.width));
      top = Math.max(0, Math.min(top, window.innerHeight - rect.height));
      
      contextMenu.style.left = left + "px";
      contextMenu.style.top = top + "px";
      contextMenu.classList.add("visible");

      // Handle menu item clicks
      const handleMenuClick = async (e) => {
        const action = e.target.closest(".context-menu-item")?.dataset.action;
        if (!action) return;

        const itemPath = treeItem.dataset.path;
        switch (action) {
          case "new-file":
            this.showFileCreationUI(itemPath, "file");
            break;
          case "new-folder":
            this.showFileCreationUI(itemPath, "folder");
            break;
          case "delete":
            await this.deleteItem(itemPath);
            break;
          case "rename":
            // TODO: Implement rename functionality
            break;
        }
        contextMenu.classList.remove("visible");
      };

      // Add one-time click handler
      contextMenu.addEventListener("click", handleMenuClick, { once: true });
    });

    // Hide context menu when clicking outside
    document.addEventListener("click", () => {
      document.querySelector(".context-menu").classList.remove("visible");
    });
  }

  selectTreeItem(itemContent) {
    // Remove previous selection
    const previousSelected = this.fileTree.querySelector(".tree-item-content.selected");
    if (previousSelected) {
      previousSelected.classList.remove("selected");
    }
    // Add selection to clicked item
    itemContent.classList.add("selected");
  }

  async showFileCreationUI(parentPath, type = "file") {
    const overlay = document.querySelector(".file-creation-overlay");
    const input = overlay.querySelector(".file-creation-input");
    const createButton = overlay.querySelector(".file-creation-button");
    const error = overlay.querySelector(".file-creation-error");
    
    // Get target directory
    const stats = await window.electronAPI.fileSystem.isDirectory(parentPath);
    const targetDir = stats ? parentPath : window.electronAPI.path.dirname(parentPath);
    
    // Position the overlay
    const treeItem = this.fileTree.querySelector(`[data-path="${targetDir}"]`);
    if (treeItem) {
      const rect = treeItem.getBoundingClientRect();
      overlay.style.left = rect.left + "px";
      overlay.style.top = (rect.bottom + 5) + "px";
    }

    // Show overlay and focus input
    overlay.classList.add("visible");
    input.value = "";
    input.placeholder = type === "file" ? "filename" : "foldername";
    input.focus();

    // Create function for handling file/folder creation
    const handleCreation = async () => {
      const name = input.value.trim();
      if (!name) return;

      try {
        // Parse path for nested creation
        const parts = name.split("/");
        let currentPath = targetDir;

        for (let i = 0; i < parts.length; i++) {
          const part = parts[i].trim();
          if (!part) continue;

          const isLast = i === parts.length - 1;
          currentPath = window.electronAPI.path.join(currentPath, part);

          if (isLast) {
            if (type === "file") {
              await window.electronAPI.fileSystem.createFile(currentPath);
              // Open the new file
              await this.loadFile(currentPath);
            } else {
              await window.electronAPI.fileSystem.createFolder(currentPath);
            }
          } else {
            // Create intermediate directories
            await window.electronAPI.fileSystem.createFolder(currentPath);
          }
        }

        // Refresh the tree view
        if (treeItem.classList.contains("directory")) {
          await this.expandDirectory(treeItem);
        } else {
          await this.expandDirectory(treeItem.parentElement.closest(".tree-item"));
        }

        overlay.classList.remove("visible");
      } catch (err) {
        error.textContent = err.message;
        error.style.display = "block";
        setTimeout(() => {
          error.style.display = "none";
        }, 3000);
      }
    };

    // Handle Enter key
    const handleKeyDown = async (e) => {
      if (e.key === "Escape") {
        overlay.classList.remove("visible");
        cleanup();
        return;
      }

      if (e.key === "Enter") {
        await handleCreation();
        cleanup();
      }
    };

    // Handle create button click
    const handleClick = async () => {
      await handleCreation();
      cleanup();
    };

    // Cleanup function to remove event listeners
    const cleanup = () => {
      input.removeEventListener("keydown", handleKeyDown);
      createButton.removeEventListener("click", handleClick);
      document.removeEventListener("click", handleOutsideClick);
    };

    // Handle clicking outside the overlay
    const handleOutsideClick = (e) => {
      if (!overlay.contains(e.target)) {
        overlay.classList.remove("visible");
        cleanup();
      }
    };

    // Add event listeners
    input.addEventListener("keydown", handleKeyDown);
    createButton.addEventListener("click", handleClick);
    document.addEventListener("click", handleOutsideClick);
  }

  async deleteItem(itemPath) {
    try {
      const stats = await window.electronAPI.fileSystem.isDirectory(itemPath);
      const itemType = stats ? "folder" : "file";
      
      // Show confirmation dialog
      const result = await window.electronAPI.fileSystem.showMessage({
        type: 'warning',
        title: 'Confirm Delete',
        message: `Are you sure you want to delete this ${itemType}?\n${itemPath}`,
        buttons: ['Delete', 'Cancel'],
        defaultId: 1,
        cancelId: 1,
      });

      if (result.response === 0) { // User clicked Delete
        // Close file if it's open
        if (this.openedFiles.has(itemPath)) {
          await this.closeFile(itemPath);
        }

        // Delete the item
        await window.electronAPI.fileSystem.deleteItem(itemPath);

        // Refresh parent directory
        const parentDir = window.electronAPI.path.dirname(itemPath);
        const parentItem = this.fileTree.querySelector(`[data-path="${parentDir}"]`);
        if (parentItem) {
          await this.expandDirectory(parentItem);
        }
      }
    } catch (error) {
      console.error('Error deleting item:', error);
      window.electronAPI.fileSystem.showMessage({
        type: 'error',
        title: 'Delete Error',
        message: `Error deleting item: ${error.message}`,
        buttons: ['OK']
      });
    }
  }

  async setupLinkProviders() {
    try {
      if (!this.editor) {
        console.warn('Editor not available for link providers');
        return;
      }

      if (typeof monaco === 'undefined' || !monaco.languages) {
        console.warn('Monaco languages API not available');
        return;
      }

      console.log('Setting up link providers...');

      // Define provider registration function
      const registerProvider = (language, regex, prefixLength = 0) => {
        try {
          monaco.languages.registerLinkProvider(language, {
            provideLinks: (model) => {
              try {
                const links = [];
                const text = model.getValue();
                let match;

                while ((match = regex.exec(text))) {
                  const path = match[2];
                  if (!path) continue;

                  try {
                    const startPos = model.getPositionAt(match.index + match[1].length + prefixLength);
                    const endPos = model.getPositionAt(match.index + match[1].length + prefixLength + path.length);

                    if (startPos && endPos) {
                      links.push({
                        range: {
                          startLineNumber: startPos.lineNumber,
                          startColumn: startPos.column,
                          endLineNumber: endPos.lineNumber,
                          endColumn: endPos.column
                        },
                        url: path,
                        tooltip: 'Follow link (Ctrl+Click)'
                      });
                    }
                  } catch (error) {
                    console.error('Error creating link range:', error);
                  }
                }
                return { links };
              } catch (error) {
                console.error('Error in provideLinks:', error);
                return { links: [] };
              }
            }
          });
          console.log(`Registered link provider for ${language}`);
        } catch (error) {
          console.error(`Error registering ${language} provider:`, error);
        }
      };

      // Register HTML provider
      const htmlRegex = /(src|href)=["']([^"']+)["']/g;
      registerProvider('html', htmlRegex, 2); // +2 for =" characters

      // Register JavaScript provider
      const jsRegex = /(require\s*\(\s*["']|from\s+["']|import\s+["'])([^"']+)["']/g;
      registerProvider('javascript', jsRegex);

      console.log('Link providers setup completed');
    } catch (error) {
      console.error('Error in setupLinkProviders:', error);
    }

    // Add click handler for links
    console.log('Setting up mouse handler...');
    try {
      const editor = this.editor; // Store reference to avoid any potential context issues
      if (!editor) {
        console.warn('Editor not available for mouse handler');
        return;
      }

      editor.onMouseDown((e) => {
        try {
          if (e.event.ctrlKey) {
            const linkDetail = editor.getModel()?.getWordAtPosition(e.target.position);
            console.log('Position:', e.target.position, 'Word detail:', linkDetail);
            
            // Get the line of text where the click occurred
            const lineContent = editor.getModel()?.getLineContent(e.target.position.lineNumber);
            console.log('Line content:', lineContent);

            // Try to extract the path from the line
            let path = null;
            if (lineContent) {
              // For HTML src/href attributes
              const srcMatch = lineContent.match(/(src|href)=["']([^"']+)["']/);
              if (srcMatch && this.isPositionInMatch(e.target.position.column, srcMatch.index + srcMatch[1].length + 2, srcMatch[2].length)) {
                path = srcMatch[2];
              } else {
                // For JavaScript requires/imports
                const importMatch = lineContent.match(/(require\s*\(\s*["']|from\s+["']|import\s+["'])([^"']+)["']/);
                if (importMatch && this.isPositionInMatch(e.target.position.column, importMatch.index + importMatch[1].length, importMatch[2].length)) {
                  path = importMatch[2];
                }
              }
            }

            if (path) {
              console.log('Found path:', path);
              this.handleLinkClick(path).catch(error => {
                console.error('Error handling link click:', error);
              });
            }
          }
        } catch (error) {
          console.error('Error in mouse down handler:', error);
        }
      });
      console.log('Mouse handler setup complete');
    } catch (error) {
      console.error('Error setting up mouse down handler:', error);
    }
  }

  isPositionInMatch(column, matchStart, matchLength) {
    // Convert from 1-based to 0-based indexing for column
    const col0 = column - 1;
    return col0 >= matchStart && col0 < (matchStart + matchLength);
  }

  async handleLinkClick(path) {
    try {
      console.log('Handling link click for path:', path);
      
      if (!this.lastOpenedFile) {
        console.warn('No file currently open');
        return;
      }

      // Get current file's directory
      const currentDir = window.electronAPI.path.dirname(this.lastOpenedFile);
      console.log('Current directory:', currentDir);
      
      // Create an array of possible paths to try
      const pathsToTry = [];
      
      if (path.startsWith('./') || path.startsWith('../')) {
        // Relative path
        pathsToTry.push(window.electronAPI.path.join(currentDir, path));
      } else if (path.startsWith('/')) {
        // Absolute path from project root
        pathsToTry.push(window.electronAPI.path.join(this.currentPath, path));
      } else {
        // Try multiple possible locations
        pathsToTry.push(
          window.electronAPI.path.join(currentDir, path),                    // Relative to current file
          window.electronAPI.path.join(this.currentPath, path),             // Relative to project root
          window.electronAPI.path.join(this.currentPath, 'node_modules', path) // In node_modules
        );
      }

      console.log('Paths to try:', pathsToTry);
      let resolvedPath = null;

      // Try each path with each possible extension
      for (const basePath of pathsToTry) {
        // Try without extension first
        if (await window.electronAPI.fileSystem.exists(basePath)) {
          resolvedPath = basePath;
          break;
        }

        // Try with common extensions
        const extensions = ['.js', '.jsx', '.ts', '.tsx', '.json', '.html', '.css'];
        for (const ext of extensions) {
          const pathWithExt = basePath + ext;
          console.log('Trying path:', pathWithExt);
          if (await window.electronAPI.fileSystem.exists(pathWithExt)) {
            resolvedPath = pathWithExt;
            break;
          }
        }

        if (resolvedPath) break;
      }

      if (resolvedPath) {
        console.log('Loading resolved path:', resolvedPath);
        // Load the file in a new tab
        await this.loadFile(resolvedPath, true);
        
        // Show success message
        monaco.editor.setModelMarkers(this.editor.getModel(), 'links', [{
          message: `Opened file: ${resolvedPath}`,
          severity: monaco.MarkerSeverity.Info,
          startLineNumber: 1,
          startColumn: 1,
          endLineNumber: 1,
          endColumn: 1
        }]);
      } else {
        console.error('File not found:', path);
        // Show error using Monaco's markers
        monaco.editor.setModelMarkers(this.editor.getModel(), 'links', [{
          message: `File not found: ${path}`,
          severity: monaco.MarkerSeverity.Error,
          startLineNumber: this.editor.getPosition().lineNumber,
          startColumn: 1,
          endLineNumber: this.editor.getPosition().lineNumber,
          endColumn: 1
        }]);
      }
    } catch (error) {
      console.error('Error handling link click:', error);
      // Show error using Monaco's markers
      monaco.editor.setModelMarkers(this.editor.getModel(), 'links', [{
        message: `Error: ${error.message}`,
        severity: monaco.MarkerSeverity.Error,
        startLineNumber: this.editor.getPosition().lineNumber,
        startColumn: 1,
        endLineNumber: this.editor.getPosition().lineNumber,
        endColumn: 1
      }]);
    }
  }

  async saveFile(filePath) {
    try {
      const fileData = this.openedFiles.get(filePath);
      if (fileData && fileData.isModified) {
        const content = fileData.model.getValue();
        await window.electronAPI.fileSystem.saveFile(filePath, content);
        fileData.isModified = false;
        fileData.originalContent = content;
        this.updateTabState(filePath);
      }
    } catch (error) {
      console.error("Error saving file:", error);
    }
  }

  updateTabState(filePath) {
    const tab = this.tabsContainer.querySelector(`[data-path="${filePath}"]`);
    const fileData = this.openedFiles.get(filePath);
    if (tab && fileData) {
      if (fileData.isModified) {
        tab.classList.add("modified");
      } else {
        tab.classList.remove("modified");
      }
    }
  }

  hasUnsavedChanges() {
    for (const [_, fileData] of this.openedFiles) {
      if (fileData.isModified) {
        return true;
      }
    }
    return false;
  }

  async saveAllModifiedFiles() {
    const modifiedFiles = Array.from(this.openedFiles.entries()).filter(
      ([_, data]) => data.isModified
    );

    for (const [filePath, _] of modifiedFiles) {
      try {
        await this.saveFile(filePath);
      } catch (error) {
        console.error(`Failed to save file: ${filePath}`, error);
        return false;
      }
    }
    return true;
  }

  async loadFile(filePath, switchToFile = true) {
    try {
      console.log(`Loading file: ${filePath}`);
      
      // Check if file is already open
      if (this.openedFiles.has(filePath)) {
        if (switchToFile) {
          await this.switchToFile(filePath);
        }
        return;
      }

      // Check if we've reached the file limit
      if (this.openedFiles.size >= this.MAX_OPEN_FILES) {
        // Find the oldest file that isn't the current file and close it
        const filesArray = Array.from(this.openedFiles.entries())
          .sort(([, a], [, b]) => a.lastModified - b.lastModified)
          .map(([path]) => path);
        const oldestFile = filesArray[0];
        await this.closeFile(oldestFile);
      }

      // Load file content
      const content = await window.electronAPI.fileSystem.readFile(filePath);
      
      // Check if it's a large file and apply optimizations if needed
      const isLargeFile = await this.performanceManager.handleLargeFile(content, filePath);
      if (isLargeFile) {
        console.log('Large file optimizations applied');
      }

      // Get language and create model
      const language = this.getLanguageFromPath(filePath);
      const model = monaco.editor.createModel(content, language);

      // Apply language-specific theme rules
      this.themeManager.applyLanguageSpecificRules(language);

      // Array to store disposables (event listeners, decorations, etc.)
      const disposables = [];

      // Set up change tracking
      disposables.push(
        model.onDidChangeContent(() => {
          const fileData = this.openedFiles.get(filePath);
          if (fileData && !fileData.isModified) {
            fileData.isModified = true;
            this.updateTabState(filePath);
          }
        })
      );

      // Create and add tab
      const fileName = window.electronAPI.path.basename(filePath);
      const tab = this.createTab(filePath, fileName);
      this.tabsContainer.appendChild(tab);

      // Store file data
      this.openedFiles.set(filePath, {
        model,
        viewState: null,
        isModified: false,
        originalContent: content,
        disposables: disposables, // Store the disposables array
      });

      // Switch to this file if requested
      if (switchToFile) {
        await this.switchToFile(filePath);
      }
    } catch (error) {
      console.error("Error loading file:", error);
    }
  }

  getLanguageFromPath(filePath) {
    return FileTypeHelper.getLanguage(filePath);
  }

  setupEmptyEditorHandlers() {
    // Setup new file button handler
    const emptyNewFileButton = document.getElementById('empty-new-file-button');
    
    if (emptyNewFileButton) {
      emptyNewFileButton.addEventListener('click', async () => {
        if (this.currentPath) {
          await this.ensureFileExplorerExpanded();
          this.showFileCreationUI(this.currentPath, 'file');
        }
      });
    }

    // Initial state check
    this.checkEmptyEditorState();
  }

  showEmptyEditor() {
    if (this.emptyEditor) {
      this.emptyEditor.classList.add('visible');
      this.updateRecentFilesList();
    }
  }

  hideEmptyEditor() {
    if (this.emptyEditor) {
      this.emptyEditor.classList.remove('visible');
    }
  }

  checkEmptyEditorState() {
    if (this.currentPath && this.openedFiles.size === 0) {
      this.showEmptyEditor();
    } else {
      this.hideEmptyEditor();
    }
  }

  addToRecentFiles(filePath) {
    // Add to recent files and maintain max size
    this.recentFiles.delete(filePath); // Remove if exists
    this.recentFiles.add(filePath);
    
    // Keep only last 5 files
    if (this.recentFiles.size > 5) {
      const firstItem = this.recentFiles.values().next().value;
      this.recentFiles.delete(firstItem);
    }

    this.updateRecentFilesList();
  }

  updateRecentFilesList() {
    const recentFilesSection = this.emptyEditor?.querySelector('.recent-files');
    const recentFilesList = recentFilesSection?.querySelector('.recent-files-list');
    if (!recentFilesList || !recentFilesSection) return;

    // Clear the list
    recentFilesList.innerHTML = '';

    // Get recent files that still exist in the current directory
    const validRecentFiles = Array.from(this.recentFiles)
      .filter(filePath => filePath.startsWith(this.currentPath));

    // Hide the entire section if no recent files
    if (validRecentFiles.length === 0) {
      recentFilesSection.style.display = 'none';
      return;
    }

    // Show section and populate list
    recentFilesSection.style.display = 'block';
    validRecentFiles
      .reverse()
      .forEach(filePath => {
        const item = document.createElement('div');
        item.className = 'recent-file-item';
        
        const fileName = window.electronAPI.path.basename(filePath);
        const relativePath = this.getRelativePath(filePath);
        const fileInfo = FileTypeHelper.getFileInfo(filePath);

        item.innerHTML = `
          <i class="${fileInfo.icon}" style="color: ${fileInfo.color}"></i>
          <span class="file-name">${fileName}</span>
          <span class="file-path">${relativePath}</span>
        `;

        item.addEventListener('click', () => this.loadFile(filePath));
        recentFilesList.appendChild(item);
      });
  }

  getRelativePath(filePath) {
    if (!this.currentPath || !filePath.startsWith(this.currentPath)) {
      return filePath;
    }
    return filePath.substring(this.currentPath.length + 1);
  }

  async ensureFileExplorerExpanded() {
    const sidebarPanel = document.querySelector('.sidebar-panel');
    if (sidebarPanel.classList.contains('collapsed')) {
      // Find and click the collapse button
      const collapseButton = document.querySelector('.collapse-button');
      if (collapseButton) {
        collapseButton.click();
        // Wait for animation
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }
  }

  async openDirectory(dirPath) {
    try {
      if (!dirPath) return;

      this.currentPath = dirPath;
      this.fileTree.innerHTML = "";

      // Check if directory exists and is readable
      const isDir = await window.electronAPI.fileSystem.isDirectory(dirPath);
      if (!isDir) {
        console.error("Not a valid directory:", dirPath);
        return;
      }

      const rootItem = this.createTreeItem({
        name: window.electronAPI.path.basename(dirPath),
        path: dirPath,
        isDirectory: true,
      });

      this.fileTree.appendChild(rootItem);
      rootItem.classList.add("expanded");
      await this.expandDirectory(rootItem);

      // Show empty editor state when directory is first opened
      this.checkEmptyEditorState();
    } catch (error) {
      console.error("Error opening directory:", error);
    }
  }

  addTreeEventListeners() {
    this.fileTree.addEventListener("click", async (e) => {
      const treeItemContent = e.target.closest(".tree-item-content");
      if (!treeItemContent) return;

      const treeItem = treeItemContent.parentElement;
      const path = treeItem.dataset.path;
      const isDirectory = treeItem.classList.contains("directory");

      if (isDirectory) {
        treeItem.classList.toggle("expanded");
        if (treeItem.classList.contains("expanded")) {
          this.expandedDirs.add(path);
          await this.expandDirectory(treeItem);
        } else {
          this.expandedDirs.delete(path);
        }
        await this.saveState();
      } else {
        // Handle file click
        await this.loadFile(path);
      }
    });
  }
}

// Initialize when DOM and Monaco are loaded
function initializeApp() {
  console.log('Initializing application...');
  try {
    // Check if Monaco is available
    if (typeof window.monaco === 'undefined' || !window.monaco.editor) {
      console.warn('Monaco not yet available, waiting...');
      setTimeout(initializeApp, 100);
      return;
    }

    console.log('Monaco is available, creating FileExplorer...');
    window.fileExplorer = new FileExplorer();
    window.terminalManager = new TerminalManager();
  } catch (error) {
    console.error('Error during app initialization:', error);
  }
}

// Start initialization when the script loads
console.log('Setting up initialization...');
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    console.log('DOM loaded, starting initialization...');
    initializeApp();
  });
} else {
  console.log('DOM already loaded, starting initialization...');
  initializeApp();
}

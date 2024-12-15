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
  }

  async initializeMonaco() {
    return new Promise(async (resolve) => {
      // Set up keyboard shortcuts
      this.setupKeyboardShortcuts();

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

      try {
        // Ensure monaco is available
        if (typeof monaco === 'undefined' || !monaco.editor) {
          throw new Error('Monaco editor not properly loaded');
        }

        console.log('Creating Monaco editor instance...');
        
        // Initialize Monaco Editor with saved theme
        this.editor = monaco.editor.create(this.editorContainer, {
          value: "", // Empty initial content
          language: "plaintext",
          theme: theme,
          suggest: {
            snippetsPreventQuickSuggestions: false,
          },
          automaticLayout: true,
          minimap: {
            enabled: true,
          },
          scrollBeyondLastLine: false,
          renderWhitespace: "selection",
          fontFamily: "'Fira Code', 'Consolas', 'Monaco', monospace",
          fontSize: 14,
          lineNumbers: "on",
          roundedSelection: false,
          
          scrollbar: {
            useShadows: true,
            verticalHasArrows: false,
            horizontalHasArrows: false,
            vertical: "visible",
            horizontal: "visible",
            verticalScrollbarSize: 10,
            horizontalScrollbarSize: 10,
            arrowSize: 30,
          },
        });

        // Wait a bit to ensure editor is fully initialized
        await new Promise(resolve => setTimeout(resolve, 100));

        // Add window resize handler
        window.addEventListener("resize", () => {
          if (this.editor) {
            this.editor.layout();
          }
        });

        // Only setup link providers if editor is properly initialized
        if (this.editor) {
          console.log('Editor initialized, setting up link providers...');
          await this.setupLinkProviders();
        } else {
          console.warn('Editor not properly initialized');
        }

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

    // Save current file's view state
    if (this.lastOpenedFile) {
      const currentFileData = this.openedFiles.get(this.lastOpenedFile);
      if (currentFileData) {
        currentFileData.viewState = this.editor.saveViewState();
      }
    }

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
    });
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
        const filesArray = Array.from(this.openedFiles.keys());
        const oldestFile = filesArray[0];
        await this.closeFile(oldestFile);
      }

      const content = await window.electronAPI.fileSystem.readFile(filePath);
      const language = this.getLanguageFromPath(filePath);

      // Create new model
      const model = monaco.editor.createModel(content, language);

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

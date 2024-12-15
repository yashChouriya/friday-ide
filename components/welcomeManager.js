class WelcomeManager {
  constructor() {
    this.welcomeScreen = document.getElementById('welcome-screen');
    this.monacoEditor = document.getElementById('monaco-editor');
    this.editorTabs = document.querySelector('.editor-tabs');
    this.welcomeOpenFolderButton = document.getElementById('welcome-open-folder');
    this.mainOpenFolderButton = document.getElementById('open-folder');
    this.fileTree = document.getElementById('file-tree');

    // Bind methods
    this.handleFileTreeChange = this.handleFileTreeChange.bind(this);
    this.handleTabsChange = this.handleTabsChange.bind(this);

    this.initialize();
  }

  initialize() {
    // Initially show welcome screen
    this.showWelcomeScreen();

    // Add click handler for welcome screen's open folder button
    if (this.welcomeOpenFolderButton) {
      this.welcomeOpenFolderButton.addEventListener('click', () => {
        if (this.mainOpenFolderButton) {
          this.mainOpenFolderButton.click();
        }
      });
    }

    // Observe file tree for changes
    this.setupFileTreeObserver();

    // Observe tabs container for changes
    this.setupTabsObserver();
  }

  setupFileTreeObserver() {
    const observer = new MutationObserver(this.handleFileTreeChange);
    observer.observe(this.fileTree, { 
      childList: true,
      subtree: true,
      attributes: true
    });

    // Initial check
    this.handleFileTreeChange();
  }

  setupTabsObserver() {
    const tabsContainer = document.querySelector('.tabs-container');
    if (tabsContainer) {
      const observer = new MutationObserver(this.handleTabsChange);
      observer.observe(tabsContainer, { 
        childList: true,
        subtree: true
      });
    }
  }

  handleFileTreeChange() {
    // Check if file tree has any content
    const hasContent = this.fileTree && this.fileTree.children.length > 0;
    
    if (hasContent) {
      this.hideWelcomeScreen();
    } else if (!document.querySelector('.tabs-container')?.children.length) {
      // Only show welcome screen if there are no open tabs
      this.showWelcomeScreen();
    }
  }

  handleTabsChange(mutations) {
    const tabsContainer = document.querySelector('.tabs-container');
    const hasOpenTabs = tabsContainer && tabsContainer.children.length > 0;
    const hasFileTreeContent = this.fileTree && this.fileTree.children.length > 0;

    if (!hasOpenTabs && !hasFileTreeContent) {
      this.showWelcomeScreen();
    } else if (hasOpenTabs) {
      this.hideWelcomeScreen();
    }
  }

  showWelcomeScreen() {
    requestAnimationFrame(() => {
      if (this.welcomeScreen) {
        this.welcomeScreen.classList.remove('hidden');
        if (this.monacoEditor) {
          this.monacoEditor.style.visibility = 'hidden';
        }
        if (this.editorTabs) {
          this.editorTabs.style.visibility = 'hidden';
        }
      }
    });
  }

  hideWelcomeScreen() {
    requestAnimationFrame(() => {
      if (this.welcomeScreen) {
        this.welcomeScreen.classList.add('hidden');
        if (this.monacoEditor) {
          this.monacoEditor.style.visibility = 'visible';
        }
        if (this.editorTabs) {
          this.editorTabs.style.visibility = 'visible';
        }
      }
    });
  }
}
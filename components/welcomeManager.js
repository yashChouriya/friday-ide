class WelcomeManager {
  constructor() {
    this.welcomeScreen = document.getElementById('welcome-screen');
    this.monacoEditor = document.getElementById('monaco-editor');
    this.editorTabs = document.querySelector('.editor-tabs');
    this.welcomeOpenFolderButton = document.getElementById('welcome-open-folder');
    this.mainOpenFolderButton = document.getElementById('open-folder');
    this.fileTree = document.getElementById('file-tree');
    this.logo = this.welcomeScreen?.querySelector('.logo-container i');

    // Bind methods
    this.handleFileTreeChange = this.handleFileTreeChange.bind(this);
    this.handleTabsChange = this.handleTabsChange.bind(this);
    this.applyTheme = this.applyTheme.bind(this);

    // Register with theme manager
    if (window.themeManager) {
      window.themeManager.registerComponent('welcomeScreen', this);
    }

    // Listen for theme changes
    window.addEventListener('themeChanged', (event) => {
      this.applyTheme(event.detail.theme);
    });

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

        // Apply current theme when showing
        const currentTheme = window.themeManager?.themeState.current || 'vs-dark';
        this.applyTheme(currentTheme);
      }
    });
  }

  async applyTheme(themeName) {
    if (!this.welcomeScreen) return;

    try {
      const themeColors = window.themeColors[themeName];
      if (!themeColors) return;

      // Update keyframe animations for the logo
      const keyframes = `
        @keyframes pulse {
          0% {
            text-shadow: 0 0 10px ${themeColors['--button-bg']}33;
            transform: scale(1);
          }
          50% {
            text-shadow: 0 0 20px ${themeColors['--button-bg']}66;
            transform: scale(1.05);
          }
          100% {
            text-shadow: 0 0 10px ${themeColors['--button-bg']}33;
            transform: scale(1);
          }
        }
      `;

      // Update or create style element for animations
      let styleEl = document.getElementById('welcome-animations');
      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = 'welcome-animations';
        document.head.appendChild(styleEl);
      }
      styleEl.textContent = keyframes;

      // Update button shadow color
      const button = this.welcomeScreen.querySelector('.welcome-button');
      if (button) {
        const buttonColor = themeColors['--button-bg'];
        button.style.boxShadow = `0 2px 6px ${buttonColor}33`;
      }

      // Force animation restart on logo
      if (this.logo) {
        this.logo.style.animation = 'none';
        this.logo.offsetHeight; // Trigger reflow
        this.logo.style.animation = null;
      }

    } catch (error) {
      console.error('Error applying theme to welcome screen:', error);
    }
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
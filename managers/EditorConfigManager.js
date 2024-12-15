class EditorConfigManager {
  constructor() {
    this.baseConfig = {
      // Core Editor Settings
      wordWrap: 'on',
      fontSize: 14,
      fontFamily: "'Fira Code', 'Consolas', 'Monaco', monospace",
      fontLigatures: true,
      lineHeight: 1.5,
      lineNumbers: "on",
      renderWhitespace: "selection",
      
      // Enhanced Features
      cursorBlinking: "smooth",
      cursorSmoothCaretAnimation: "on",
      smoothScrolling: true,
      mouseWheelZoom: true,
      multiCursorModifier: 'alt',
      
      // Code Intelligence
      formatOnPaste: true,
      formatOnType: true,
      quickSuggestions: {
        other: true,
        comments: false,
        strings: false
      },
      parameterHints: {
        enabled: true,
        cycle: true
      },
      
      // Visual Enhancements
      bracketPairColorization: {
        enabled: true,
        independentColorPoolPerBracketType: true,
      },
      guides: {
        bracketPairs: true,
        indentation: true,
        highlightActiveIndentation: true,
      },
      
      // Minimap Configuration
      minimap: {
        enabled: true,
        maxColumn: 120,
        renderCharacters: false,
        showSlider: "always",
        scale: 1
      },
      
      // Performance Settings
      maxTokenizationLineLength: 20000,
      renderValidationDecorations: 'editable',
      hover: {
        delay: 300,
        enabled: true,
        sticky: true
      },
      
      // Accessibility
      accessibilitySupport: 'auto',
      ariaLabel: 'Editor content',
      
      // Scrolling
      scrollBeyondLastLine: false,
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

      // Additional Editor Features
      find: {
        addExtraSpaceOnTop: false,
        autoFindInSelection: 'always',
        seedSearchStringFromSelection: 'always'
      },
      
      // Suggestions
      suggestSelection: 'first',
      suggestOnTriggerCharacters: true,
      suggestLineHeight: 24,
      suggest: {
        insertMode: 'insert',
        filterGraceful: true,
        localityBonus: true,
        shareSuggestSelections: true,
        showIcons: true,
        maxVisibleSuggestions: 12,
        showMethods: true,
        showFunctions: true,
        showConstructors: true,
        showFields: true,
        showVariables: true,
        showClasses: true,
        showStructs: true,
        showInterfaces: true,
        showModules: true,
        showProperties: true,
        showEvents: true,
        showOperators: true,
        showUnits: true,
        showValues: true,
        showConstants: true,
        showEnums: true,
        showEnumMembers: true,
        showKeywords: true,
        showWords: true,
        showColors: true,
        showFiles: true,
        showReferences: true,
        showFolders: true,
        showTypeParameters: true,
        showSnippets: true,
      }
    };

    // Theme-specific configurations
    this.themeConfigs = {
      'vs-dark': {
        fontSize: 14,
        lineHeight: 1.5,
      },
      'synthwave-84': {
        fontSize: 15,
        lineHeight: 1.6,
        cursorBlinking: "phase",
        fontLigatures: true,
      },
      'github-dark': {
        fontSize: 14,
        lineHeight: 1.5,
        renderWhitespace: "boundary",
      },
      'monokai': {
        fontSize: 14,
        lineHeight: 1.5,
        cursorBlinking: "smooth",
      },
      'dracula': {
        fontSize: 14,
        lineHeight: 1.6,
        fontLigatures: true,
      },
      'night-owl': {
        fontSize: 15,
        lineHeight: 1.6,
        cursorBlinking: "smooth",
        fontLigatures: true,
      },
      'material-palenight': {
        fontSize: 14,
        lineHeight: 1.5,
        fontLigatures: true,
      },
      'solarized-dark': {
        fontSize: 14,
        lineHeight: 1.5,
        renderWhitespace: "boundary",
      },
      'hc-black': {
        fontSize: 15,
        lineHeight: 1.6,
        cursorBlinking: "solid",
        accessibilitySupport: "on",
      }
    };
  }

  getConfigForTheme(themeName) {
    // Deep clone the base config
    const config = JSON.parse(JSON.stringify(this.baseConfig));
    
    // Merge with theme-specific config if it exists
    if (this.themeConfigs[themeName]) {
      Object.assign(config, this.themeConfigs[themeName]);
    }

    return config;
  }

  // Get a config optimized for large files
  getLargeFileConfig() {
    return {
      ...this.baseConfig,
      wordWrap: 'on',
      minimap: { enabled: false },
      folding: false,
      largeFileOptimizations: true,
      bracketPairColorization: { enabled: false },
      renderValidationDecorations: 'editable',
      suggest: {
        ...this.baseConfig.suggest,
        maxVisibleSuggestions: 6,
      },
      hover: {
        ...this.baseConfig.hover,
        delay: 500,
      }
    };
  }

  // Get config with specific overrides
  getCustomConfig(themeName, overrides = {}) {
    const baseConfig = this.getConfigForTheme(themeName);
    return {
      ...baseConfig,
      ...overrides
    };
  }
}

// Make it available globally
window.EditorConfigManager = EditorConfigManager;
class EditorThemeManager {
  constructor(editor, configManager) {
    this.editor = editor;
    this.configManager = configManager;
    this.currentTheme = 'vs-dark';
    this.setupThemeDefinitions();
  }

  setupThemeDefinitions() {
    // Theme-specific syntax highlighting rules
    this.tokenizationRules = {
      'synthwave-84': {
        rules: [
          { token: 'keyword', foreground: '#ff7edb', fontStyle: 'bold' },
          { token: 'string', foreground: '#ff8b39' },
          { token: 'number', foreground: '#f97e72' },
          { token: 'comment', foreground: '#848bbd', fontStyle: 'italic' },
          { token: 'type', foreground: '#36f9f6' },
          { token: 'function', foreground: '#fede5d' },
          { token: 'variable', foreground: '#ff7edb' },
          { token: 'operator', foreground: '#ff7edb' },
        ],
        colors: {
          'editor.background': '#262335',
          'editor.foreground': '#ffffff',
          'editor.lineHighlightBackground': '#34294f50',
          'editor.selectionBackground': '#463465',
          'editor.inactiveSelectionBackground': '#34294f',
        }
      },
      'dracula': {
        rules: [
          { token: 'keyword', foreground: '#ff79c6', fontStyle: 'bold' },
          { token: 'string', foreground: '#f1fa8c' },
          { token: 'number', foreground: '#bd93f9' },
          { token: 'comment', foreground: '#6272a4', fontStyle: 'italic' },
          { token: 'type', foreground: '#8be9fd' },
          { token: 'function', foreground: '#50fa7b' },
          { token: 'variable', foreground: '#f8f8f2' },
          { token: 'operator', foreground: '#ff79c6' },
        ],
        colors: {
          'editor.background': '#282a36',
          'editor.foreground': '#f8f8f2',
          'editor.lineHighlightBackground': '#44475a50',
          'editor.selectionBackground': '#44475a',
          'editor.inactiveSelectionBackground': '#383a46',
        }
      },
      // Add more theme definitions as needed
    };
  }

  async setTheme(themeName) {
    try {
      console.log('Setting editor theme:', themeName);

      // Define theme if it has custom rules
      if (this.tokenizationRules[themeName]) {
        this.defineCustomTheme(themeName);
      }

      // Set Monaco editor theme
      await monaco.editor.setTheme(themeName);
      
      // Apply theme-specific configurations
      const config = this.configManager.getConfigForTheme(themeName);
      this.editor.updateOptions(config);

      // Save theme preference
      await window.electronAPI.store.set("selectedTheme", themeName);
      
      // Update current theme
      this.currentTheme = themeName;

      // Emit theme change event
      window.dispatchEvent(new CustomEvent('editorThemeChanged', {
        detail: { theme: themeName }
      }));

      return true;
    } catch (error) {
      console.error('Error setting theme:', error);
      return false;
    }
  }

  defineCustomTheme(themeName) {
    const themeData = this.tokenizationRules[themeName];
    if (!themeData) return;

    try {
      monaco.editor.defineTheme(themeName, {
        base: 'vs-dark',
        inherit: true,
        rules: themeData.rules,
        colors: themeData.colors
      });
      console.log(`Custom theme defined: ${themeName}`);
    } catch (e) {
      console.warn(`Theme ${themeName} already defined:`, e);
    }
  }

  getThemeData(themeName) {
    return this.tokenizationRules[themeName] || null;
  }

  getCurrentTheme() {
    return this.currentTheme;
  }

  // Apply specific syntax highlighting rules for a language
  applyLanguageSpecificRules(language) {
    const currentThemeRules = this.tokenizationRules[this.currentTheme];
    if (!currentThemeRules) return;

    // You can extend this with language-specific rules
    const languageSpecificRules = {
      javascript: [
        { token: 'keyword.js', foreground: currentThemeRules.rules.find(r => r.token === 'keyword')?.foreground },
        // Add more language-specific rules
      ],
      // Add more languages
    };

    if (languageSpecificRules[language]) {
      monaco.editor.defineTheme(`${this.currentTheme}-${language}`, {
        base: this.currentTheme,
        inherit: true,
        rules: languageSpecificRules[language]
      });
      monaco.editor.setTheme(`${this.currentTheme}-${language}`);
    }
  }
}

// Make it available globally
window.EditorThemeManager = EditorThemeManager;
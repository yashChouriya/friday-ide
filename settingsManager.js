class SettingsManager {
    constructor() {
        this.settingsPopup = document.getElementById('settings-popup');
        this.toggleButton = document.getElementById('toggle-settings');
        this.closeButton = document.getElementById('close-settings');
        this.themeSelect = document.getElementById('theme-select');
        this.resetButton = document.getElementById('reset-all');
        
        // Initialize theme manager
        this.themeManager = new ThemeManager();
        window.themeManager = this.themeManager; // Make it globally available

        this.initialize();
    }

    async initialize() {
        // Set up event listeners
        this.setupEventListeners();

        // Wait for Monaco to be available
        await this.waitForMonaco();
        
        // Register components with theme manager
        this.registerComponents();
        
        // Load and apply saved theme
        await this.loadAndApplyTheme();
    }

    registerComponents() {
        // Register Monaco editor component
        this.themeManager.registerComponent('editor', {
            applyTheme: async (themeName) => {
                if (window.fileExplorer?.editor) {
                    window.fileExplorer.editor.updateOptions({ theme: themeName });
                }
            }
        });

        // Register terminal component
        this.themeManager.registerComponent('terminal', {
            applyTheme: async (themeName) => {
                if (window.terminalManager) {
                    window.terminalManager.updateTheme(themeName);
                }
            }
        });

        // Register UI component
        this.themeManager.registerComponent('ui', {
            applyTheme: async (themeName) => {
                const colors = window.themeColors[themeName];
                if (colors) {
                    const root = document.documentElement;
                    Object.entries(colors).forEach(([property, value]) => {
                        root.style.setProperty(property, value);
                    });
                }
            }
        });

        // Register welcome screen component
        this.themeManager.registerComponent('welcome', {
            applyTheme: async (themeName) => {
                const welcomeScreen = document.getElementById('welcome-screen');
                const colors = window.themeColors[themeName];
                if (welcomeScreen && colors) {
                    welcomeScreen.style.backgroundColor = colors['--bg-primary'];
                    welcomeScreen.style.color = colors['--text-primary'];
                }
            }
        });
    }

    setupEventListeners() {
        // Settings popup controls
        this.toggleButton.addEventListener('click', () => this.toggleSettings());
        this.closeButton.addEventListener('click', () => this.hideSettings());
        this.themeSelect.addEventListener('change', (e) => this.handleThemeChange(e));
        this.resetButton.addEventListener('click', () => this.handleReset());

        // Close on click outside
        this.settingsPopup.addEventListener('click', (e) => {
            if (e.target === this.settingsPopup) {
                this.hideSettings();
            }
        });

        // Handle escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !this.settingsPopup.classList.contains('hidden')) {
                this.hideSettings();
            }
        });
    }

    async loadAndApplyTheme() {
        try {
            const savedTheme = await this.themeManager.loadSavedTheme();
            this.themeSelect.value = savedTheme;
            await this.themeManager.applyTheme(savedTheme);
        } catch (error) {
            console.error('Failed to load/apply theme:', error);
            // ThemeManager will handle fallback to default theme
        }
    }

    toggleSettings() {
        if (this.settingsPopup.classList.contains('hidden')) {
            this.showSettings();
        } else {
            this.hideSettings();
        }
    }

    showSettings() {
        this.settingsPopup.classList.remove('hidden');
        this.toggleButton.classList.add('active');
    }

    hideSettings() {
        this.settingsPopup.classList.add('hidden');
        this.toggleButton.classList.remove('active');
    }

    async handleThemeChange(event) {
        const theme = event.target.value;
        const success = await this.themeManager.applyTheme(theme);
        
        if (!success) {
            // ThemeManager will handle the error and revert to previous theme
            // Just update the select element to match
            this.themeSelect.value = this.themeManager.themeState.current;
        }
    }

    waitForMonaco() {
        return new Promise((resolve, reject) => {
            if (typeof monaco !== 'undefined' && monaco.editor) {
                resolve();
                return;
            }

            const checkMonaco = setInterval(() => {
                if (typeof monaco !== 'undefined' && monaco.editor) {
                    clearInterval(checkMonaco);
                    clearTimeout(timeout);
                    resolve();
                }
            }, 100);

            const timeout = setTimeout(() => {
                clearInterval(checkMonaco);
                reject(new Error('Monaco editor failed to load'));
            }, 5000);
        });
    }

    async applyTheme(themeName) {
        try {
            await this.waitForMonaco();

            // Handle built-in themes
            if (['vs-dark', 'hc-black'].includes(themeName)) {
                monaco.editor.setTheme(themeName);
                return;
            }

            // Apply custom theme
            const customTheme = window.editorThemes?.[themeName];
            if (customTheme) {
                // Define the theme if it hasn't been defined yet
                try {
                    monaco.editor.defineTheme(themeName, customTheme);
                } catch (e) {
                    console.warn('Theme already defined:', themeName);
                }
                monaco.editor.setTheme(themeName);
            } else {
                console.warn(`Theme ${themeName} not found, falling back to vs-dark`);
                monaco.editor.setTheme('vs-dark');
            }
        } catch (error) {
            console.error('Error applying theme:', error);
            monaco.editor.setTheme('vs-dark');
        }
    }

    updateUITheme(theme) {
        // Get theme colors
        const colors = window.themeColors[theme];
        if (!colors) return;

        // Apply theme colors to root element
        const root = document.documentElement;
        Object.entries(colors).forEach(([property, value]) => {
            root.style.setProperty(property, value);
        });
    }

    async handleReset() {
        const confirmReset = confirm('Are you sure you want to reset all settings? This will clear all saved data and restart the application.');
        
        if (confirmReset) {
            try {
                // Clean up theme manager
                await this.themeManager.cleanup();
                
                // Clear electron store
                await window.electronAPI.store.clear();
                
                // Show loading message with current theme colors
                const currentTheme = this.themeManager.themeState.current || 'vs-dark';
                const colors = window.themeColors[currentTheme];
                
                const loadingMessage = document.createElement('div');
                loadingMessage.style.cssText = `
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background: ${colors['--bg-primary']};
                    color: ${colors['--text-primary']};
                    padding: 20px 40px;
                    border-radius: 8px;
                    font-size: 14px;
                    z-index: 10000;
                    border: 1px solid ${colors['--border-color']};
                `;
                loadingMessage.textContent = 'Resetting application...';
                document.body.appendChild(loadingMessage);

                // Wait a brief moment to show the message
                await new Promise(resolve => setTimeout(resolve, 1000));

                // Restart the application
                await window.electronAPI.app.restart();
            } catch (error) {
                console.error('Failed to reset settings:', error);
                await window.electronAPI.fileSystem.showMessage({
                    type: 'error',
                    title: 'Reset Failed',
                    message: 'Failed to reset settings. Please try again.',
                    buttons: ['OK']
                });
            }
        }
    }
}
class SettingsManager {
    constructor() {
        this.settingsPopup = document.getElementById('settings-popup');
        this.toggleButton = document.getElementById('toggle-settings');
        this.closeButton = document.getElementById('close-settings');
        this.themeSelect = document.getElementById('theme-select');
        this.resetButton = document.getElementById('reset-all');
        this.currentTheme = 'vs-dark'; // Default theme

        this.initialize();
    }

    async initialize() {
        // Set up event listeners first
        this.setupEventListeners();

        // Wait for Monaco to be available
        await this.waitForMonaco();
        
        // Load and apply saved theme
        await this.loadAndApplyTheme();
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
            console.log('Loading saved theme...');
            const savedTheme = await window.electronAPI.store.get('theme');
            console.log('Saved theme loaded:', savedTheme);
            
            const themeToApply = savedTheme || 'vs-dark';
            this.currentTheme = themeToApply;
            this.themeSelect.value = themeToApply;

            // Apply theme to all components
            await this.applyTheme(themeToApply);
            this.updateUITheme(themeToApply);
            
            // Update editor if available
            if (window.fileExplorer?.editor) {
                window.fileExplorer.editor.updateOptions({ theme: themeToApply });
            }
            
            // Update terminal if available
            if (window.terminalManager) {
                window.terminalManager.updateTheme(themeToApply);
            }

            // If no theme was saved, save the default
            if (!savedTheme) {
                await window.electronAPI.store.set('theme', 'vs-dark');
                console.log('Default theme saved');
            }
        } catch (error) {
            console.error('Failed to load/apply theme:', error);
            this.currentTheme = 'vs-dark';
            this.themeSelect.value = 'vs-dark';
            
            // Apply default theme as fallback
            try {
                await this.applyTheme('vs-dark');
                this.updateUITheme('vs-dark');
                await window.electronAPI.store.set('theme', 'vs-dark');
            } catch (e) {
                console.error('Failed to apply fallback theme:', e);
            }
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
        const previousTheme = this.currentTheme;
        
        try {
            // Save theme first to ensure persistence
            await window.electronAPI.store.set('theme', theme);
            console.log('Theme saved:', theme);
            
            // Apply the theme
            await this.applyTheme(theme);
            this.currentTheme = theme;
            
            // Update UI elements
            this.updateUITheme(theme);

            // Update Monaco editor instance if it exists
            if (window.fileExplorer?.editor) {
                window.fileExplorer.editor.updateOptions({ theme });
                console.log('Updated editor theme:', theme);
            }

            // Update terminal theme if terminal exists
            if (window.terminalManager) {
                window.terminalManager.updateTheme(theme);
            }

            // Double-check theme was saved
            const savedTheme = await window.electronAPI.store.get('theme');
            if (savedTheme !== theme) {
                throw new Error('Theme save verification failed');
            }
        } catch (error) {
            console.error('Failed to change theme:', error);
            // Revert theme selection if there's an error
            this.themeSelect.value = previousTheme;
            this.currentTheme = previousTheme;
            await this.applyTheme(previousTheme);
            this.updateUITheme(previousTheme);
            
            // Revert editor theme
            if (window.fileExplorer?.editor) {
                window.fileExplorer.editor.updateOptions({ theme: previousTheme });
            }

            // Revert terminal theme
            if (window.terminalManager) {
                window.terminalManager.updateTheme(previousTheme);
            }

            // Ensure the previous theme is still saved
            try {
                await window.electronAPI.store.set('theme', previousTheme);
            } catch (e) {
                console.error('Failed to restore previous theme:', e);
            }
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
                // Clear electron store
                await window.electronAPI.store.clear();
                
                // Show loading message
                const loadingMessage = document.createElement('div');
                loadingMessage.style.cssText = `
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background: rgba(0, 0, 0, 0.9);
                    color: white;
                    padding: 20px 40px;
                    border-radius: 8px;
                    font-size: 14px;
                    z-index: 10000;
                `;
                loadingMessage.textContent = 'Resetting application...';
                document.body.appendChild(loadingMessage);

                // Wait a brief moment to show the message
                await new Promise(resolve => setTimeout(resolve, 1000));

                // Restart the application
                await window.electronAPI.app.restart();
            } catch (error) {
                console.error('Failed to reset settings:', error);
                alert('Failed to reset settings. Please try again.');
            }
        }
    }
}
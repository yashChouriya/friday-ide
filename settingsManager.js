class SettingsManager {
    constructor() {
        this.settingsPopup = document.getElementById('settings-popup');
        this.toggleButton = document.getElementById('toggle-settings');
        this.closeButton = document.getElementById('close-settings');
        this.themeSelect = document.getElementById('theme-select');
        this.resetButton = document.getElementById('reset-all');

        this.initialize();
    }

    initialize() {
        // Set up event listeners
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

        // Load saved theme
        this.loadSavedTheme();

        // Handle escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !this.settingsPopup.classList.contains('hidden')) {
                this.hideSettings();
            }
        });
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
        
        try {
            // Save theme preference first
            await window.electronAPI.store.set('theme', theme);
            
            // Apply the theme
            await this.applyTheme(theme);
            
            // Update UI elements
            this.updateUITheme(theme);
        } catch (error) {
            console.error('Failed to change theme:', error);
            // Revert theme selection if there's an error
            this.themeSelect.value = await window.electronAPI.store.get('theme') || 'vs-dark';
        }
    }

    async loadSavedTheme() {
        try {
            // Get saved theme or use default
            const savedTheme = await window.electronAPI.store.get('theme') || 'vs-dark';
            
            // Update dropdown
            this.themeSelect.value = savedTheme;
            
            // Wait for Monaco to be available
            await this.waitForMonaco();
            
            // Apply the theme
            await this.applyTheme(savedTheme);
            
            // Update UI
            this.updateUITheme(savedTheme);
        } catch (error) {
            console.error('Failed to load saved theme:', error);
            // Set to default theme if there's an error
            this.themeSelect.value = 'vs-dark';
            this.updateUITheme('vs-dark');
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
        // Add any UI theme updates here
        // For example, updating specific elements based on the theme
        const isDark = theme.includes('dark') || theme.includes('black');
        document.body.classList.toggle('theme-dark', isDark);
        document.body.classList.toggle('theme-light', !isDark);
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
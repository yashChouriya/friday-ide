class ThemeManager {
    constructor() {
        this.themeState = {
            current: null,
            previous: null,
            isApplying: false
        };
        this.components = new Map();
        this.loadedThemes = new Map();
        this.maxRetries = 3;
        this.themeChangeListeners = new Set();

        // Initialize editor container theme observer
        this.initializeEditorContainerObserver();
    }

    initializeEditorContainerObserver() {
        // Monitor the monaco-editor container for visibility changes
        const editorContainer = document.getElementById('monaco-editor');
        const welcomeScreen = document.getElementById('welcome-screen');

        if (editorContainer && welcomeScreen) {
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.attributeName === 'style' || 
                        mutation.attributeName === 'class') {
                        this.updateBackgroundBasedOnEditorVisibility();
                    }
                });
            });

            observer.observe(editorContainer, {
                attributes: true,
                attributeFilter: ['style', 'class']
            });

            observer.observe(welcomeScreen, {
                attributes: true,
                attributeFilter: ['style', 'class']
            });
        }
    }

    updateBackgroundBasedOnEditorVisibility() {
        const editorContainer = document.getElementById('monaco-editor');
        const welcomeScreen = document.getElementById('welcome-screen');
        const currentTheme = this.themeState.current || 'vs-dark';
        const themeColors = window.themeColors[currentTheme];

        if (editorContainer && welcomeScreen) {
            // If editor is hidden or empty, apply theme background
            if (welcomeScreen.style.display !== 'none' || 
                editorContainer.style.display === 'none') {
                editorContainer.style.backgroundColor = themeColors['--bg-primary'];
            }
        }
    }

    registerComponent(id, component) {
        if (!component.applyTheme || typeof component.applyTheme !== 'function') {
            throw new Error(`Component ${id} must implement applyTheme method`);
        }
        this.components.set(id, component);
        
        // Apply current theme if exists
        if (this.themeState.current) {
            this.applyThemeToComponent(id, this.themeState.current);
        }
    }

    unregisterComponent(id) {
        this.components.delete(id);
    }

    addThemeChangeListener(listener) {
        this.themeChangeListeners.add(listener);
    }

    removeThemeChangeListener(listener) {
        this.themeChangeListeners.delete(listener);
    }

    isValidTheme(themeName) {
        return themeName in window.themeColors && 
               (themeName in window.editorThemes || ['vs-dark', 'hc-black'].includes(themeName));
    }

    async applyTheme(themeName, options = { preview: false }) {
        if (this.themeState.isApplying) {
            throw new Error('Theme change already in progress');
        }

        this.themeState.isApplying = true;

        try {
            if (!this.isValidTheme(themeName)) {
                throw new Error(`Invalid theme: ${themeName}`);
            }

            // Store previous theme for potential rollback
            this.themeState.previous = this.themeState.current;

            // Apply theme to all components
            await this.applyThemeToAllComponents(themeName, options);

            // Update editor container background
            this.updateBackgroundBasedOnEditorVisibility();

            if (!options.preview) {
                await this.saveTheme(themeName);
                this.themeState.current = themeName;
            }

            this.notifyThemeChange(themeName);
            return true;

        } catch (error) {
            console.error('Theme application error:', error);
            await this.handleThemeError(error);
            return false;

        } finally {
            this.themeState.isApplying = false;
        }
    }

    async applyThemeToAllComponents(themeName, options) {
        const applyPromises = Array.from(this.components.entries()).map(
            ([id, component]) => this.applyThemeToComponent(id, themeName, options)
        );

        await Promise.all(applyPromises);
    }

    async applyThemeToComponent(id, themeName, options = {}) {
        const component = this.components.get(id);
        if (!component) return;

        let retries = 0;
        while (retries < this.maxRetries) {
            try {
                await component.applyTheme(themeName, options);
                break;
            } catch (error) {
                retries++;
                if (retries === this.maxRetries) {
                    throw new Error(`Failed to apply theme to component ${id}: ${error.message}`);
                }
                await new Promise(resolve => setTimeout(resolve, 1000 * retries));
            }
        }
    }

    async saveTheme(themeName) {
        try {
            await window.electronAPI.store.set('selectedTheme', themeName);
            console.log(`THEME '${themeName}' SAVED SUCCESSFULLY`)
        } catch (error) {
            console.error('Failed to save theme:', error);
            throw new Error('Failed to persist theme setting');
        }
    }

    async loadSavedTheme() {
        try {
            const savedTheme = await window.electronAPI.store.get('selectedTheme');
            console.log("LOAD THEME FUNCTION TRIGGERED!",savedTheme)
            return savedTheme || 'vs-dark';
        } catch (error) {
            console.error('Failed to load saved theme:', error);
            return 'vs-dark';
        }
    }

    async handleThemeError(error) {
        console.error('Theme error:', error);
        
        // Show error to user
        if (window.electronAPI.fileSystem.showMessage) {
            await window.electronAPI.fileSystem.showMessage({
                type: 'error',
                title: 'Theme Error',
                message: `Failed to apply theme: ${error.message}`,
                buttons: ['OK']
            });
        }

        // Attempt rollback if possible
        if (this.themeState.previous) {
            try {
                await this.applyTheme(this.themeState.previous);
            } catch (rollbackError) {
                console.error('Theme rollback failed:', rollbackError);
                // If rollback fails, try to apply default theme
                if (this.themeState.previous !== 'vs-dark') {
                    await this.applyTheme('vs-dark');
                }
            }
        }
    }

    notifyThemeChange(themeName) {
        // Notify all registered listeners
        this.themeChangeListeners.forEach(listener => {
            try {
                listener(themeName);
            } catch (error) {
                console.error('Theme change listener error:', error);
            }
        });

        // Dispatch global event
        const event = new CustomEvent('themeChanged', {
            detail: { theme: themeName }
        });
        window.dispatchEvent(event);
    }

    async cleanup() {
        // Remove all theme-related CSS variables
        const root = document.documentElement;
        const computedStyle = getComputedStyle(root);
        Array.from(computedStyle).forEach(property => {
            if (property.startsWith('--')) {
                root.style.removeProperty(property);
            }
        });

        // Clear registrations and state
        this.components.clear();
        this.loadedThemes.clear();
        this.themeChangeListeners.clear();
        
        this.themeState = {
            current: null,
            previous: null,
            isApplying: false
        };
    }
}

// Export for use in other files
window.ThemeManager = ThemeManager;
class EditorPerformanceManager {
  constructor(editor) {
    this.editor = editor;
    this.layoutDebounceTimeout = null;
    this.saveDebounceTimeout = null;
    this.isLayoutPaused = false;
    this.disposables = new Set();
    this.intervals = new Set();
    
    // Configuration
    this.LARGE_FILE_THRESHOLD = 500000; // 500KB
    this.VERY_LARGE_FILE_THRESHOLD = 2000000; // 2MB
    this.LAYOUT_DEBOUNCE_TIME = 100; // ms
    this.SAVE_DEBOUNCE_TIME = 1000; // ms
    this.MEMORY_CHECK_INTERVAL = 300000; // 5 minutes
    this.MODEL_CLEANUP_INTERVAL = 600000; // 10 minutes
  }

  setupPerformanceOptimizations() {
    this.setupLayoutOptimization();
    this.setupMemoryOptimization();
    this.setupEventListeners();
    return () => this.cleanup();
  }

  setupLayoutOptimization() {
    const debounceLayout = () => {
      if (this.layoutDebounceTimeout) {
        clearTimeout(this.layoutDebounceTimeout);
      }
      if (!this.isLayoutPaused) {
        this.layoutDebounceTimeout = setTimeout(() => {
          if (this.editor) {
            this.editor.layout();
          }
        }, this.LAYOUT_DEBOUNCE_TIME);
      }
    };

    window.addEventListener('resize', debounceLayout);
    this.disposables.add(() => window.removeEventListener('resize', debounceLayout));
  }

  setupMemoryOptimization() {
    // Clear undo stack periodically for large files
    const undoInterval = setInterval(() => {
      if (this.editor) {
        const model = this.editor.getModel();
        if (model && model.getAlternativeVersionId() > 1000) {
          model.pushStackElement();
          model.pushEOL("LF");
        }
      }
    }, this.MEMORY_CHECK_INTERVAL);
    this.intervals.add(undoInterval);

    // Dispose unused models
    const disposedModels = new Set();
    const cleanupInterval = setInterval(() => {
      monaco.editor.getModels().forEach(model => {
        if (!model.isAttachedToEditor() && !disposedModels.has(model.uri.toString())) {
          model.dispose();
          disposedModels.add(model.uri.toString());
        }
      });
    }, this.MODEL_CLEANUP_INTERVAL);
    this.intervals.add(cleanupInterval);
  }

  setupEventListeners() {
    // Monitor for memory-intensive operations
    const visibilityHandler = () => {
      if (document.hidden) {
        this.pauseNonEssentialOperations();
      } else {
        this.resumeNonEssentialOperations();
      }
    };

    document.addEventListener('visibilitychange', visibilityHandler);
    this.disposables.add(() => document.removeEventListener('visibilitychange', visibilityHandler));
  }

  pauseNonEssentialOperations() {
    this.isLayoutPaused = true;
    if (this.editor) {
      // Disable features that consume resources
      this.editor.updateOptions({
        minimap: { enabled: false },
        renderValidationDecorations: 'editable',
        hover: { enabled: false },
        parameterHints: { enabled: false },
        folding: false
      });
    }
  }

  resumeNonEssentialOperations() {
    this.isLayoutPaused = false;
    if (this.editor) {
      // Re-enable features
      const config = window.fileExplorer.configManager.getConfigForTheme(
        window.fileExplorer.themeManager.currentTheme
      );
      this.editor.updateOptions(config);
    }
  }

  async handleLargeFile(content, filepath) {
    const fileSize = content.length;
    const isLargeFile = fileSize > this.LARGE_FILE_THRESHOLD;
    const isVeryLargeFile = fileSize > this.VERY_LARGE_FILE_THRESHOLD;

    if (isLargeFile) {
      console.log(`Optimizing editor for large file: ${filepath} (${fileSize} bytes)`);
      
      // Basic optimizations for large files
      const config = {
        wordWrap: 'on',
        minimap: { enabled: false },
        folding: false,
        largeFileOptimizations: true,
        bracketPairColorization: { enabled: false },
        renderValidationDecorations: 'editable'
      };

      // Additional optimizations for very large files
      if (isVeryLargeFile) {
        Object.assign(config, {
          suggest: { enabled: false },
          parameterHints: { enabled: false },
          hover: { enabled: false },
          links: false,
          quickSuggestions: false,
        });
      }

      if (this.editor) {
        this.editor.updateOptions(config);
      }

      // Show warning for very large files
      if (isVeryLargeFile) {
        // You might want to implement a UI warning here
        console.warn('Very large file opened. Some features have been disabled for better performance.');
      }

      return true;
    }
    return false;
  }

  debounceSave(saveFunction) {
    if (this.saveDebounceTimeout) {
      clearTimeout(this.saveDebounceTimeout);
    }
    this.saveDebounceTimeout = setTimeout(() => {
      saveFunction();
    }, this.SAVE_DEBOUNCE_TIME);
  }

  cleanup() {
    // Clear timeouts
    if (this.layoutDebounceTimeout) {
      clearTimeout(this.layoutDebounceTimeout);
    }
    if (this.saveDebounceTimeout) {
      clearTimeout(this.saveDebounceTimeout);
    }

    // Clear intervals
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals.clear();

    // Remove event listeners
    this.disposables.forEach(dispose => dispose());
    this.disposables.clear();

    // Reset flags
    this.isLayoutPaused = false;
  }

  getMemoryUsage() {
    return {
      models: monaco.editor.getModels().length,
      isLayoutPaused: this.isLayoutPaused,
      // Add more memory-related stats here
    };
  }
}

// Make it available globally
window.EditorPerformanceManager = EditorPerformanceManager;
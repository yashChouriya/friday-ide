class FileExplorer {
    constructor() {
        this.currentPath = '';
        this.fileTree = document.getElementById('file-tree');
        this.editorContainer = document.getElementById('monaco-editor');
        this.tabsContainer = document.querySelector('.tabs-container');
        this.expandedDirs = new Set();
        this.lastOpenedFile = null;
        this.editor = null;
        this.openedFiles = new Map(); // Map<filePath, {model, viewState}>
        this.initialize();
    }

    async initialize() {
        await this.initializeMonaco();
        this.addTreeEventListeners();
        this.setupOpenFolderButton();
        await this.loadSavedState();
        this.setupStateHandlers();
    }

    async initializeMonaco() {
        return new Promise((resolve) => {
            // Monaco is already loaded by the time this code runs
            // Initialize Monaco Editor
            this.editor = monaco.editor.create(this.editorContainer, {
                value: '', // Empty initial content
                language: 'plaintext',
                theme: 'vs-dark',
                automaticLayout: true,
                minimap: {
                    enabled: true
                },
                scrollBeyondLastLine: false,
                renderWhitespace: 'selection',
                fontFamily: "'Fira Code', 'Consolas', 'Monaco', monospace",
                fontSize: 14,
                lineNumbers: 'on',
                roundedSelection: false,
                scrollbar: {
                    useShadows: true,
                    verticalHasArrows: false,
                    horizontalHasArrows: false,
                    vertical: 'visible',
                    horizontal: 'visible',
                    verticalScrollbarSize: 10,
                    horizontalScrollbarSize: 10,
                    arrowSize: 30
                }
            });

            // Add window resize handler
            window.addEventListener('resize', () => {
                this.editor.layout();
            });

            resolve();
        });
    }

    setupStateHandlers() {
        // Save state when window is about to close
        window.addEventListener('beforeunload', () => {
            this.saveState();
        });
    }

    async saveState() {
        try {
            const state = {
                expandedDirs: Array.from(this.expandedDirs),
                lastOpenedFile: this.lastOpenedFile
            };
            await window.fileSystem.saveState(state);
        } catch (error) {
            console.error('Error saving state:', error);
        }
    }

    async loadSavedState() {
        try {
            const state = await window.fileSystem.loadState();
            if (!state) return;

            // Initialize expanded directories set
            this.expandedDirs = new Set(Array.isArray(state.expandedDirs) ? state.expandedDirs : []);
            
            // Check if last opened directory exists and is accessible
            if (state.lastOpenedDir) {
                try {
                    const isDir = await window.fileSystem.isDirectory(state.lastOpenedDir);
                    if (isDir) {
                        await this.openDirectory(state.lastOpenedDir);
                        
                        // Restore expanded directories
                        for (const dir of this.expandedDirs) {
                            try {
                                const dirElement = this.fileTree.querySelector(`[data-path="${dir}"]`);
                                const exists = await window.fileSystem.isDirectory(dir);
                                if (dirElement && exists) {
                                    dirElement.classList.add('expanded');
                                    await this.expandDirectory(dirElement);
                                }
                            } catch (error) {
                                console.warn(`Failed to restore expanded state for directory: ${dir}`, error);
                            }
                        }
                        
                        // Restore last opened file if it exists
                        if (state.lastOpenedFile) {
                            try {
                                await window.fileSystem.readFile(state.lastOpenedFile);
                                await this.loadFile(state.lastOpenedFile);
                            } catch (error) {
                                console.warn('Failed to restore last opened file:', error);
                            }
                        }
                    }
                } catch (error) {
                    console.warn('Last opened directory is no longer accessible:', error);
                }
            }
        } catch (error) {
            console.error('Error loading saved state:', error);
        }
    }

    setupOpenFolderButton() {
        const openFolderBtn = document.getElementById('open-folder');
        openFolderBtn.addEventListener('click', async () => {
            const folderPath = await window.fileSystem.selectFolder();
            if (folderPath) {
                // Reset state for new folder
                this.expandedDirs.clear();
                this.lastOpenedFile = null;
                
                // Clear all tabs and models
                this.openedFiles.forEach(({model}) => model.dispose());
                this.openedFiles.clear();
                this.tabsContainer.innerHTML = '';
                this.editor.setModel(null);
                
                // Remove any previous file selection
                const previousSelected = this.fileTree.querySelector('.tree-item-content.selected');
                if (previousSelected) {
                    previousSelected.classList.remove('selected');
                }
                
                await this.openDirectory(folderPath);
                await this.saveState();
            }
        });
    }

    async loadDirectory(dirPath) {
        try {
            const items = await window.fileSystem.readDirectory(dirPath);
            return items;
        } catch (error) {
            console.error('Error loading directory:', error);
            return [];
        }
    }

    createTreeItem(item) {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'tree-item';
        itemDiv.dataset.path = item.path;
        
        // Create content wrapper
        const contentDiv = document.createElement('div');
        contentDiv.className = 'tree-item-content';

        if (item.isDirectory) {
            const angleIcon = document.createElement('i');
            angleIcon.className = 'fas fa-angle-right arrow-icon';
            contentDiv.appendChild(angleIcon);
        } else {
            // Add spacing for files to align with folders
            const spacer = document.createElement('span');
            spacer.className = 'arrow-spacer';
            contentDiv.appendChild(spacer);
        }
        
        const iconSpan = document.createElement('i');
        iconSpan.className = `icon ${item.isDirectory ? 'fas fa-folder' : 'fas fa-file'}`;
        
        const nameSpan = document.createElement('span');
        nameSpan.className = 'name';
        nameSpan.textContent = item.name;
        
        contentDiv.appendChild(iconSpan);
        contentDiv.appendChild(nameSpan);
        itemDiv.appendChild(contentDiv);
        
        if (item.isDirectory) {
            itemDiv.classList.add('directory');
            const childrenDiv = document.createElement('div');
            childrenDiv.className = 'children';
            itemDiv.appendChild(childrenDiv);
        }
        
        return itemDiv;
    }

    async expandDirectory(dirElement) {
        const childrenDiv = dirElement.querySelector('.children');
        if (!childrenDiv) return;

        // Clear existing children
        childrenDiv.innerHTML = '';
        
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
        const tab = document.createElement('div');
        tab.className = 'tab';
        tab.dataset.path = filePath;
        
        const icon = document.createElement('i');
        icon.className = 'tab-icon fas fa-file';
        
        const title = document.createElement('span');
        title.className = 'tab-title';
        title.textContent = fileName;
        
        const closeBtn = document.createElement('div');
        closeBtn.className = 'tab-close';
        closeBtn.innerHTML = '&times;';
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.closeFile(filePath);
        });
        
        tab.appendChild(icon);
        tab.appendChild(title);
        tab.appendChild(closeBtn);
        
        tab.addEventListener('click', () => this.switchToFile(filePath));
        
        return tab;
    }

    async closeFile(filePath) {
        const fileData = this.openedFiles.get(filePath);
        if (fileData) {
            fileData.model.dispose();
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
                    this.editor.setModel(null);
                }
            }
        }
        await this.saveState();
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
        const tabs = this.tabsContainer.querySelectorAll('.tab');
        tabs.forEach(tab => tab.classList.remove('active'));
        const newTab = this.tabsContainer.querySelector(`[data-path="${filePath}"]`);
        if (newTab) {
            newTab.classList.add('active');
        }

        // Switch to new file
        const fileData = this.openedFiles.get(filePath);
        this.editor.setModel(fileData.model);
        if (fileData.viewState) {
            this.editor.restoreViewState(fileData.viewState);
        }
        this.editor.focus();

        // Update tree selection
        const treeItems = this.fileTree.querySelectorAll('.tree-item-content');
        treeItems.forEach(item => item.classList.remove('selected'));
        const treeItem = this.fileTree.querySelector(`[data-path="${filePath}"]`);
        if (treeItem) {
            treeItem.querySelector('.tree-item-content').classList.add('selected');
        }

        this.lastOpenedFile = filePath;
        await this.saveState();
    }

    async loadFile(filePath) {
        try {
            // Check if file is already open
            if (this.openedFiles.has(filePath)) {
                await this.switchToFile(filePath);
                return;
            }

            const content = await window.fileSystem.readFile(filePath);
            const language = this.getLanguageFromPath(filePath);
            
            // Create new model
            const model = monaco.editor.createModel(content, language);
            
            // Create and add tab
            const fileName = window.path.basename(filePath);
            const tab = this.createTab(filePath, fileName);
            this.tabsContainer.appendChild(tab);
            
            // Store file data
            this.openedFiles.set(filePath, { model, viewState: null });
            
            // Switch to this file
            await this.switchToFile(filePath);
        } catch (error) {
            console.error('Error loading file:', error);
        }
    }

    getLanguageFromPath(filePath) {
        const extension = filePath.split('.').pop().toLowerCase();
        const languageMap = {
            'js': 'javascript',
            'ts': 'typescript',
            'py': 'python',
            'html': 'html',
            'css': 'css',
            'json': 'json',
            'md': 'markdown',
            'xml': 'xml',
            'yaml': 'yaml',
            'yml': 'yaml',
            'sh': 'shell',
            'bash': 'shell',
            'txt': 'plaintext',
            'dockerfile': 'dockerfile'
            // Add more mappings as needed
        };
        return languageMap[extension] || 'plaintext';
    }

    async openDirectory(dirPath) {
        this.currentPath = dirPath;
        this.fileTree.innerHTML = '';
        const rootItem = this.createTreeItem({
            name: window.path.basename(dirPath),
            path: dirPath,
            isDirectory: true
        });
        this.fileTree.appendChild(rootItem);
        rootItem.classList.add('expanded');
        await this.expandDirectory(rootItem);
    }

    addTreeEventListeners() {
        this.fileTree.addEventListener('click', async (e) => {
            const treeItemContent = e.target.closest('.tree-item-content');
            if (!treeItemContent) return;

            const treeItem = treeItemContent.parentElement;
            const path = treeItem.dataset.path;
            const isDirectory = treeItem.classList.contains('directory');

            if (isDirectory) {
                treeItem.classList.toggle('expanded');
                if (treeItem.classList.contains('expanded')) {
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
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}

function initializeApp() {
    // Ensure monaco is available
    if (window.monaco) {
        new FileExplorer();
    } else {
        console.error('Monaco editor not initialized');
    }
}
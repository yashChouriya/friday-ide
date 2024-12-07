class FileExplorer {
    constructor() {
        this.currentPath = '';
        this.fileTree = document.getElementById('file-tree');
        this.editorContent = document.getElementById('editor-content');
        this.expandedDirs = new Set();
        this.lastOpenedFile = null;
        this.initialize();
    }

    async initialize() {
        this.addTreeEventListeners();
        this.setupOpenFolderButton();
        await this.loadSavedState();
        this.setupStateHandlers();
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

    async loadFile(filePath) {
        try {
            // Remove previous selection
            const previousSelected = this.fileTree.querySelector('.tree-item-content.selected');
            if (previousSelected) {
                previousSelected.classList.remove('selected');
            }

            // Add selection to current file
            const currentItem = this.fileTree.querySelector(`[data-path="${filePath}"]`);
            if (currentItem) {
                currentItem.querySelector('.tree-item-content').classList.add('selected');
            }

            const content = await window.fileSystem.readFile(filePath);
            this.editorContent.textContent = content;
            
            // Update last opened file and save state
            this.lastOpenedFile = filePath;
            await this.saveState();
        } catch (error) {
            console.error('Error loading file:', error);
        }
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

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const explorer = new FileExplorer();
});
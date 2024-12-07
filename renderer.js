class FileExplorer {
    constructor() {
        this.currentPath = '';
        this.fileTree = document.getElementById('file-tree');
        this.editorContent = document.getElementById('editor-content');
        this.initialize();
    }

    async initialize() {
        this.addTreeEventListeners();
        this.setupOpenFolderButton();
    }

    setupOpenFolderButton() {
        const openFolderBtn = document.getElementById('open-folder');
        openFolderBtn.addEventListener('click', async () => {
            const folderPath = await window.fileSystem.selectFolder();
            if (folderPath) {
                this.currentPath = folderPath;
                this.fileTree.innerHTML = '';
                const rootItem = this.createTreeItem({
                    name: window.path.basename(folderPath),
                    path: folderPath,
                    isDirectory: true
                });
                this.fileTree.appendChild(rootItem);
                rootItem.classList.add('expanded');
                await this.expandDirectory(rootItem);
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
        
        const iconSpan = document.createElement('i');
        iconSpan.className = `icon ${item.isDirectory ? 'fas fa-folder' : 'fas fa-file'}`;
        
        const nameSpan = document.createElement('span');
        nameSpan.className = 'name';
        nameSpan.textContent = item.name;
        
        itemDiv.appendChild(iconSpan);
        itemDiv.appendChild(nameSpan);
        
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
            const content = await window.fileSystem.readFile(filePath);
            this.editorContent.textContent = content;
        } catch (error) {
            console.error('Error loading file:', error);
        }
    }

    addTreeEventListeners() {
        this.fileTree.addEventListener('click', async (e) => {
            const treeItem = e.target.closest('.tree-item');
            if (!treeItem) return;

            const path = treeItem.dataset.path;
            const isDirectory = treeItem.classList.contains('directory');

            if (isDirectory) {
                treeItem.classList.toggle('expanded');
                if (treeItem.classList.contains('expanded')) {
                    await this.expandDirectory(treeItem);
                }
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
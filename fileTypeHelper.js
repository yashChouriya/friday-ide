class FileTypeHelper {
    // File type definitions with icons and colors
    static fileTypes = {
        // Web Development
        'html': { icon: 'fab fa-html5', color: '#E34F26', language: 'html' },
        'css': { icon: 'fab fa-css3-alt', color: '#1572B6', language: 'css' },
        'scss': { icon: 'fab fa-sass', color: '#CC6699', language: 'scss' },
        'less': { icon: 'fab fa-less', color: '#1D365D', language: 'less' },
        'js': { icon: 'fab fa-js-square', color: '#F7DF1E', language: 'javascript' },
        'jsx': { icon: 'fab fa-react', color: '#61DAFB', language: 'javascript' },
        'ts': { icon: 'fas fa-code', color: '#3178C6', language: 'typescript' },
        'tsx': { icon: 'fab fa-react', color: '#61DAFB', language: 'typescript' },
        'vue': { icon: 'fab fa-vuejs', color: '#4FC08D', language: 'vue' },
        'svelte': { icon: 'fas fa-code', color: '#FF3E00', language: 'svelte' },

        // Programming Languages
        'py': { icon: 'fab fa-python', color: '#3776AB', language: 'python' },
        'java': { icon: 'fab fa-java', color: '#007396', language: 'java' },
        'cpp': { icon: 'fas fa-code', color: '#00599C', language: 'cpp' },
        'c': { icon: 'fas fa-code', color: '#A8B9CC', language: 'c' },
        'cs': { icon: 'fas fa-code', color: '#239120', language: 'csharp' },
        'php': { icon: 'fab fa-php', color: '#777BB4', language: 'php' },
        'rb': { icon: 'fas fa-gem', color: '#CC342D', language: 'ruby' },
        'go': { icon: 'fas fa-code', color: '#00ADD8', language: 'go' },
        'rs': { icon: 'fas fa-cog', color: '#000000', language: 'rust' },
        'swift': { icon: 'fas fa-code', color: '#FA7343', language: 'swift' },
        'kt': { icon: 'fas fa-code', color: '#A97BFF', language: 'kotlin' },

        // Data & Config
        'json': { icon: 'fas fa-brackets-curly', color: '#000000', language: 'json' },
        'yaml': { icon: 'fas fa-file-code', color: '#CB171E', language: 'yaml' },
        'yml': { icon: 'fas fa-file-code', color: '#CB171E', language: 'yaml' },
        'xml': { icon: 'fas fa-file-code', color: '#0060AC', language: 'xml' },
        'toml': { icon: 'fas fa-file-code', color: '#9C4121', language: 'toml' },
        'ini': { icon: 'fas fa-cog', color: '#6B6B6B', language: 'ini' },
        'env': { icon: 'fas fa-key', color: '#509941', language: 'plaintext' },
        'sql': { icon: 'fas fa-database', color: '#336791', language: 'sql' },
        'graphql': { icon: 'fas fa-project-diagram', color: '#E535AB', language: 'graphql' },

        // Documentation
        'md': { icon: 'fas fa-file-alt', color: '#083FA6', language: 'markdown' },
        'mdx': { icon: 'fas fa-file-alt', color: '#1B1F24', language: 'markdown' },
        'txt': { icon: 'fas fa-file-alt', color: '#6B6B6B', language: 'plaintext' },
        'pdf': { icon: 'fas fa-file-pdf', color: '#F40F02', language: 'plaintext' },
        'doc': { icon: 'fas fa-file-word', color: '#2B579A', language: 'plaintext' },
        'docx': { icon: 'fas fa-file-word', color: '#2B579A', language: 'plaintext' },
        'rtf': { icon: 'fas fa-file-alt', color: '#6B6B6B', language: 'plaintext' },

        // Images
        'jpg': { icon: 'fas fa-file-image', color: '#FFB13B', language: 'plaintext' },
        'jpeg': { icon: 'fas fa-file-image', color: '#FFB13B', language: 'plaintext' },
        'png': { icon: 'fas fa-file-image', color: '#FFB13B', language: 'plaintext' },
        'gif': { icon: 'fas fa-file-image', color: '#FFB13B', language: 'plaintext' },
        'svg': { icon: 'fas fa-file-image', color: '#FFB13B', language: 'xml' },
        'webp': { icon: 'fas fa-file-image', color: '#FFB13B', language: 'plaintext' },

        // DevOps & Config
        'dockerfile': { icon: 'fab fa-docker', color: '#2496ED', language: 'dockerfile' },
        'docker-compose.yml': { icon: 'fab fa-docker', color: '#2496ED', language: 'yaml' },
        'jenkinsfile': { icon: 'fab fa-jenkins', color: '#D24939', language: 'groovy' },
        'terraform': { icon: 'fas fa-cloud', color: '#7B42BC', language: 'hcl' },
        'tf': { icon: 'fas fa-cloud', color: '#7B42BC', language: 'hcl' },
        
        // Package Files
        'package.json': { icon: 'fab fa-npm', color: '#CB3837', language: 'json' },
        'package-lock.json': { icon: 'fab fa-npm', color: '#CB3837', language: 'json' },
        'composer.json': { icon: 'fab fa-php', color: '#777BB4', language: 'json' },
        'yarn.lock': { icon: 'fab fa-yarn', color: '#2C8EBB', language: 'yaml' },
        'gemfile': { icon: 'fas fa-gem', color: '#CC342D', language: 'ruby' },
        'requirements.txt': { icon: 'fab fa-python', color: '#3776AB', language: 'plaintext' },

        // Build & Compile
        'webpack.config.js': { icon: 'fas fa-box', color: '#8DD6F9', language: 'javascript' },
        'babel.config.js': { icon: 'fas fa-box', color: '#F9DC3E', language: 'javascript' },
        'tsconfig.json': { icon: 'fas fa-code', color: '#3178C6', language: 'json' },
        'makefile': { icon: 'fas fa-cogs', color: '#9B9B9B', language: 'makefile' },
        'cmake': { icon: 'fas fa-cogs', color: '#064F8C', language: 'cmake' },

        // Shell & Scripts
        'sh': { icon: 'fas fa-terminal', color: '#4EAA25', language: 'shell' },
        'bash': { icon: 'fas fa-terminal', color: '#4EAA25', language: 'shell' },
        'zsh': { icon: 'fas fa-terminal', color: '#4EAA25', language: 'shell' },
        'fish': { icon: 'fas fa-terminal', color: '#4EAA25', language: 'shell' },
        'ps1': { icon: 'fas fa-terminal', color: '#012456', language: 'powershell' },

        // Version Control
        '.gitignore': { icon: 'fab fa-git-alt', color: '#F05032', language: 'plaintext' },
        '.gitmodules': { icon: 'fab fa-git-alt', color: '#F05032', language: 'plaintext' },
        '.gitattributes': { icon: 'fab fa-git-alt', color: '#F05032', language: 'plaintext' },

        // Default
        'default': { icon: 'fas fa-file', color: '#6B6B6B', language: 'plaintext' }
    };

    // Methods to get file information
    static getFileInfo(filePath) {
        const fileName = filePath.split('/').pop().toLowerCase();
        const extension = fileName.split('.').pop().toLowerCase();
        
        // Check for exact filename matches first (like package.json)
        if (this.fileTypes[fileName]) {
            return this.fileTypes[fileName];
        }
        
        // Then check by extension
        return this.fileTypes[extension] || this.fileTypes['default'];
    }

    static getIcon(filePath) {
        return this.getFileInfo(filePath).icon;
    }

    static getColor(filePath) {
        return this.getFileInfo(filePath).color;
    }

    static getLanguage(filePath) {
        return this.getFileInfo(filePath).language;
    }

    static isSpecialFile(fileName) {
        return !!this.fileTypes[fileName.toLowerCase()];
    }
}
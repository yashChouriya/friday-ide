class FileTypeHelper {
    // File type definitions with icons and colors
    static fileTypes = {
        // Web Development
        'html': { icon: 'fab fa-html5', color: '#E34F26', language: 'html' },
        'css': { icon: 'fab fa-css3-alt', color: '#1572B6', language: 'css' },
        'scss': { icon: 'fab fa-sass', color: '#CC6699', language: 'scss' },
        'sass': { icon: 'fab fa-sass', color: '#CC6699', language: 'scss' },
        'less': { icon: 'fab fa-less', color: '#1D365D', language: 'less' },
        'js': { icon: 'fab fa-js-square', color: '#F7DF1E', language: 'javascript' },
        'jsx': { icon: 'fab fa-react', color: '#61DAFB', language: 'javascript' },
        'ts': { icon: 'fab fa-js-square', color: '#3178C6', language: 'typescript' },
        'tsx': { icon: 'fab fa-react', color: '#61DAFB', language: 'typescript' },
        'vue': { icon: 'fab fa-vuejs', color: '#4FC08D', language: 'vue' },
        'svelte': { icon: 'fas fa-circle', color: '#FF3E00', language: 'svelte' },
        'astro': { icon: 'fas fa-star', color: '#FF5D01', language: 'astro' },
        'angular': { icon: 'fab fa-angular', color: '#DD0031', language: 'typescript' },

        // Programming Languages
        'py': { icon: 'fab fa-python', color: '#3776AB', language: 'python' },
        'java': { icon: 'fab fa-java', color: '#007396', language: 'java' },
        'cpp': { icon: 'fas fa-file-code', color: '#00599C', language: 'cpp' },
        'hpp': { icon: 'fas fa-file-code', color: '#00599C', language: 'cpp' },
        'c': { icon: 'fas fa-file-code', color: '#A8B9CC', language: 'c' },
        'h': { icon: 'fas fa-file-code', color: '#A8B9CC', language: 'c' },
        'cs': { icon: 'fas fa-file-code', color: '#239120', language: 'csharp' },
        'php': { icon: 'fab fa-php', color: '#777BB4', language: 'php' },
        'rb': { icon: 'fas fa-gem', color: '#CC342D', language: 'ruby' },
        'go': { icon: 'fas fa-file-code', color: '#00ADD8', language: 'go' },
        'rs': { icon: 'fas fa-gear', color: '#DEA584', language: 'rust' },
        'swift': { icon: 'fas fa-bolt', color: '#FA7343', language: 'swift' },
        'kt': { icon: 'fas fa-file-code', color: '#A97BFF', language: 'kotlin' },
        'scala': { icon: 'fas fa-file-code', color: '#DC322F', language: 'scala' },
        'dart': { icon: 'fas fa-file-code', color: '#0175C2', language: 'dart' },

        // Data & Config
        'json': { icon: 'fas fa-code', color: 'red', language: 'json' },
        'yaml': { icon: 'fas fa-file-code', color: '#CB171E', language: 'yaml' },
        'yml': { icon: 'fas fa-file-code', color: '#CB171E', language: 'yaml' },
        'xml': { icon: 'fas fa-code', color: '#0060AC', language: 'xml' },
        'toml': { icon: 'fas fa-cog', color: '#9C4121', language: 'toml' },
        'ini': { icon: 'fas fa-sliders-h', color: '#6B6B6B', language: 'ini' },
        'env': { icon: 'fas fa-key', color: '#509941', language: 'plaintext' },
        'sql': { icon: 'fas fa-database', color: '#336791', language: 'sql' },
        'graphql': { icon: 'fas fa-project-diagram', color: '#E535AB', language: 'graphql' },
        'prisma': { icon: 'fas fa-database', color: '#2D3748', language: 'prisma' },

        // Documentation
        'md': { icon: 'fab fa-markdown', color: '#083FA6', language: 'markdown' },
        'mdx': { icon: 'fab fa-markdown', color: '#1B1F24', language: 'markdown' },
        'txt': { icon: 'fas fa-file-alt', color: '#6B6B6B', language: 'plaintext' },
        'pdf': { icon: 'fas fa-file-pdf', color: '#F40F02', language: 'plaintext' },
        'doc': { icon: 'fas fa-file-word', color: '#2B579A', language: 'plaintext' },
        'docx': { icon: 'fas fa-file-word', color: '#2B579A', language: 'plaintext' },
        'rtf': { icon: 'fas fa-file-alt', color: '#6B6B6B', language: 'plaintext' },
        'csv': { icon: 'fas fa-file-csv', color: '#217346', language: 'plaintext' },
        'xls': { icon: 'fas fa-file-excel', color: '#217346', language: 'plaintext' },
        'xlsx': { icon: 'fas fa-file-excel', color: '#217346', language: 'plaintext' },
        'ppt': { icon: 'fas fa-file-powerpoint', color: '#D24726', language: 'plaintext' },
        'pptx': { icon: 'fas fa-file-powerpoint', color: '#D24726', language: 'plaintext' },

        // Images
        'jpg': { icon: 'fas fa-file-image', color: '#FFB13B', language: 'plaintext' },
        'jpeg': { icon: 'fas fa-file-image', color: '#FFB13B', language: 'plaintext' },
        'png': { icon: 'fas fa-file-image', color: '#FFB13B', language: 'plaintext' },
        'gif': { icon: 'fas fa-file-image', color: '#FFB13B', language: 'plaintext' },
        'svg': { icon: 'fas fa-bezier-curve', color: '#FFB13B', language: 'xml' },
        'webp': { icon: 'fas fa-file-image', color: '#FFB13B', language: 'plaintext' },
        'ico': { icon: 'fas fa-file-image', color: '#FFB13B', language: 'plaintext' },
        'psd': { icon: 'fas fa-layer-group', color: '#31A8FF', language: 'plaintext' },
        'ai': { icon: 'fas fa-bezier-curve', color: '#FF9A00', language: 'plaintext' },
        'fig': { icon: 'fas fa-vector-square', color: '#A259FF', language: 'plaintext' },

        // Audio & Video
        'mp3': { icon: 'fas fa-file-audio', color: '#1ED760', language: 'plaintext' },
        'wav': { icon: 'fas fa-file-audio', color: '#1ED760', language: 'plaintext' },
        'mp4': { icon: 'fas fa-file-video', color: '#FF0000', language: 'plaintext' },
        'mov': { icon: 'fas fa-file-video', color: '#FF0000', language: 'plaintext' },
        'avi': { icon: 'fas fa-file-video', color: '#FF0000', language: 'plaintext' },
        'webm': { icon: 'fas fa-file-video', color: '#FF0000', language: 'plaintext' },

        // DevOps & Config
        'dockerfile': { icon: 'fab fa-docker', color: '#2496ED', language: 'dockerfile' },
        'docker-compose.yml': { icon: 'fab fa-docker', color: '#2496ED', language: 'yaml' },
        'docker-compose.yaml': { icon: 'fab fa-docker', color: '#2496ED', language: 'yaml' },
        'jenkinsfile': { icon: 'fab fa-jenkins', color: '#D24939', language: 'groovy' },
        'terraform': { icon: 'fas fa-cloud', color: '#7B42BC', language: 'hcl' },
        'tf': { icon: 'fas fa-cloud', color: '#7B42BC', language: 'hcl' },
        'kubernetes': { icon: 'fas fa-dharmachakra', color: '#326CE5', language: 'yaml' },
        'k8s': { icon: 'fas fa-dharmachakra', color: '#326CE5', language: 'yaml' },
        
        // Package Files
        'package.json': { icon: 'fab fa-npm', color: '#CB3837', language: 'json' },
        'package-lock.json': { icon: 'fab fa-npm', color: '#CB3837', language: 'json' },
        'composer.json': { icon: 'fab fa-php', color: '#777BB4', language: 'json' },
        'yarn.lock': { icon: 'fab fa-yarn', color: '#2C8EBB', language: 'yaml' },
        'pnpm-lock.yaml': { icon: 'fas fa-box', color: '#F69220', language: 'yaml' },
        'gemfile': { icon: 'fas fa-gem', color: '#CC342D', language: 'ruby' },
        'requirements.txt': { icon: 'fab fa-python', color: '#3776AB', language: 'plaintext' },
        'cargo.toml': { icon: 'fas fa-cube', color: '#DEA584', language: 'toml' },
        'mix.exs': { icon: 'fas fa-cube', color: '#A100FF', language: 'elixir' },

        // Build & Compile
        'webpack.config.js': { icon: 'fas fa-cube', color: '#8DD6F9', language: 'javascript' },
        'babel.config.js': { icon: 'fas fa-bolt', color: '#F9DC3E', language: 'javascript' },
        'tsconfig.json': { icon: 'fab fa-js-square', color: '#3178C6', language: 'json' },
        'vite.config.js': { icon: 'fas fa-bolt', color: '#646CFF', language: 'javascript' },
        'rollup.config.js': { icon: 'fas fa-scroll', color: '#FF3333', language: 'javascript' },
        'next.config.js': { icon: 'fas fa-file-code', color: '#000000', language: 'javascript' },
        'nuxt.config.js': { icon: 'fas fa-file-code', color: '#00DC82', language: 'javascript' },
        'svelte.config.js': { icon: 'fas fa-fire-alt', color: '#FF3E00', language: 'javascript' },
        'makefile': { icon: 'fas fa-cogs', color: '#9B9B9B', language: 'makefile' },
        'cmake': { icon: 'fas fa-cogs', color: '#064F8C', language: 'cmake' },
        'gulpfile.js': { icon: 'fas fa-glass-whiskey', color: '#CF4647', language: 'javascript' },
        'gruntfile.js': { icon: 'fas fa-grunt', color: '#FAA918', language: 'javascript' },

        // Shell & Scripts
        'sh': { icon: 'fas fa-terminal', color: '#4EAA25', language: 'shell' },
        'bash': { icon: 'fas fa-terminal', color: '#4EAA25', language: 'shell' },
        'zsh': { icon: 'fas fa-terminal', color: '#4EAA25', language: 'shell' },
        'fish': { icon: 'fas fa-terminal', color: '#4EAA25', language: 'shell' },
        'ps1': { icon: 'fas fa-terminal', color: '#012456', language: 'powershell' },
        'bat': { icon: 'fas fa-terminal', color: '#C1F12E', language: 'bat' },
        'cmd': { icon: 'fas fa-terminal', color: '#C1F12E', language: 'bat' },

        // Version Control
        '.gitignore': { icon: 'fab fa-git-alt', color: '#F05032', language: 'plaintext' },
        '.gitmodules': { icon: 'fab fa-git-alt', color: '#F05032', language: 'plaintext' },
        '.gitattributes': { icon: 'fab fa-git-alt', color: '#F05032', language: 'plaintext' },
        '.gitlab-ci.yml': { icon: 'fab fa-gitlab', color: '#FC6D26', language: 'yaml' },
        '.travis.yml': { icon: 'fas fa-fire', color: '#3EAAAF', language: 'yaml' },
        '.github': { icon: 'fab fa-github', color: '#181717', language: 'plaintext' },

        // Security & Auth
        'cert': { icon: 'fas fa-certificate', color: '#009688', language: 'plaintext' },
        'crt': { icon: 'fas fa-certificate', color: '#009688', language: 'plaintext' },
        'key': { icon: 'fas fa-key', color: '#FFA000', language: 'plaintext' },
        'pub': { icon: 'fas fa-key', color: '#FFA000', language: 'plaintext' },
        'pem': { icon: 'fas fa-certificate', color: '#009688', language: 'plaintext' },

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
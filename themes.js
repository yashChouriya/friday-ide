// Monaco Editor theme definitions
window.editorThemes = {
    'synthwave-84': {
        base: 'vs-dark',
        inherit: true,
        rules: [
            { token: 'comment', foreground: '495495', fontStyle: 'italic' },
            { token: 'keyword', foreground: 'ff7edb' },
            { token: 'string', foreground: 'ff8b39' },
            { token: 'number', foreground: 'f97e72' },
            { token: 'type', foreground: '36f9f6' },
            { token: 'class', foreground: 'ff7edb' },
            { token: 'function', foreground: 'fede5d' },
            { token: 'variable', foreground: 'f97e72' },
            { token: 'constant', foreground: 'ff8b39' },
            { token: 'string.escape.js', foreground: '36f9f6' }
        ],
        colors: {
            'editor.background': '#262335',
            'editor.foreground': '#ffffff',
            'editor.lineHighlightBackground': '#2a2139',
            'editor.selectionBackground': '#34294f88',
            'editor.inactiveSelectionBackground': '#34294f44',
            'editorCursor.foreground': '#f97e72',
            'editorWhitespace.foreground': '#2a2139',
            'editorIndentGuide.background': '#2a2139',
            'editorLineNumber.foreground': '#495495',
            'editorLineNumber.activeForeground': '#ff7edb',
            'editor.findMatchBackground': '#34294f88',
            'editor.findMatchHighlightBackground': '#34294f88'
        }
    },
    'github-dark': {
        base: 'vs-dark',
        inherit: true,
        rules: [
            { token: 'comment', foreground: '6a737d' },
            { token: 'keyword', foreground: 'ff79c6' },
            { token: 'string', foreground: '9ecbff' },
            { token: 'number', foreground: '79b8ff' },
            { token: 'type', foreground: 'b392f0' }
        ],
        colors: {
            'editor.background': '#24292e',
            'editor.foreground': '#e1e4e8',
            'editor.lineHighlightBackground': '#2b3036',
            'editorCursor.foreground': '#c8e1ff',
            'editor.selectionBackground': '#444d56',
            'editor.inactiveSelectionBackground': '#373e47'
        }
    },
    'monokai': {
        base: 'vs-dark',
        inherit: true,
        rules: [
            { token: 'comment', foreground: '88846f' },
            { token: 'keyword', foreground: 'f92672' },
            { token: 'string', foreground: 'e6db74' },
            { token: 'number', foreground: 'ae81ff' },
            { token: 'type', foreground: '66d9ef' }
        ],
        colors: {
            'editor.background': '#272822',
            'editor.foreground': '#f8f8f2',
            'editor.lineHighlightBackground': '#3e3d32',
            'editorCursor.foreground': '#f8f8f0',
            'editor.selectionBackground': '#49483e',
            'editor.inactiveSelectionBackground': '#3e3d32'
        }
    },
    'dracula': {
        base: 'vs-dark',
        inherit: true,
        rules: [
            { token: 'comment', foreground: '6272a4' },
            { token: 'keyword', foreground: 'ff79c6' },
            { token: 'string', foreground: 'f1fa8c' },
            { token: 'number', foreground: 'bd93f9' },
            { token: 'type', foreground: '8be9fd' }
        ],
        colors: {
            'editor.background': '#282a36',
            'editor.foreground': '#f8f8f2',
            'editor.lineHighlightBackground': '#44475a',
            'editorCursor.foreground': '#f8f8f0',
            'editor.selectionBackground': '#44475a',
            'editor.inactiveSelectionBackground': '#373948'
        }
    },
    'night-owl': {
        base: 'vs-dark',
        inherit: true,
        rules: [
            { token: 'comment', foreground: '637777' },
            { token: 'keyword', foreground: 'c792ea' },
            { token: 'string', foreground: 'ecc48d' },
            { token: 'number', foreground: 'f78c6c' },
            { token: 'type', foreground: '82aaff' }
        ],
        colors: {
            'editor.background': '#011627',
            'editor.foreground': '#d6deeb',
            'editor.lineHighlightBackground': '#0b2942',
            'editorCursor.foreground': '#80a4c2',
            'editor.selectionBackground': '#1d3b53',
            'editor.inactiveSelectionBackground': '#152c40'
        }
    },
    'material-palenight': {
        base: 'vs-dark',
        inherit: true,
        rules: [
            { token: 'comment', foreground: '676e95' },
            { token: 'keyword', foreground: 'c792ea' },
            { token: 'string', foreground: 'c3e88d' },
            { token: 'number', foreground: 'f78c6c' },
            { token: 'type', foreground: '82aaff' }
        ],
        colors: {
            'editor.background': '#292d3e',
            'editor.foreground': '#a6accd',
            'editor.lineHighlightBackground': '#32374c',
            'editorCursor.foreground': '#82aaff',
            'editor.selectionBackground': '#3c435e',
            'editor.inactiveSelectionBackground': '#2c3251'
        }
    },
    'solarized-dark': {
        base: 'vs-dark',
        inherit: true,
        rules: [
            { token: 'comment', foreground: '657b83' },
            { token: 'keyword', foreground: '859900' },
            { token: 'string', foreground: '2aa198' },
            { token: 'number', foreground: 'd33682' },
            { token: 'type', foreground: 'b58900' }
        ],
        colors: {
            'editor.background': '#002b36',
            'editor.foreground': '#839496',
            'editor.lineHighlightBackground': '#073642',
            'editorCursor.foreground': '#819090',
            'editor.selectionBackground': '#073642',
            'editor.inactiveSelectionBackground': '#073642'
        }
    }
};
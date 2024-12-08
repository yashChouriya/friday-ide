// Terminal theme definitions
window.terminalThemes = {
    'vs-dark': {
        foreground: '#cccccc',
        background: '#1e1e1e',
        cursor: '#cccccc',
        selection: '#444444',
        black: '#1e1e1e',
        brightBlack: '#808080',
        red: '#f44747',
        brightRed: '#f55757',
        green: '#6a9955',
        brightGreen: '#7ab665',
        yellow: '#d7ba7d',
        brightYellow: '#e7ca8d',
        blue: '#569cd6',
        brightBlue: '#66ace6',
        magenta: '#c586c0',
        brightMagenta: '#d596d0',
        cyan: '#4dc9b0',
        brightCyan: '#5ddbc0',
        white: '#d4d4d4',
        brightWhite: '#ffffff'
    },
    'synthwave-84': {
        foreground: '#ffffff',
        background: '#262335',
        cursor: '#ff7edb',
        selection: '#463465',
        black: '#262335',
        brightBlack: '#495495',
        red: '#f97e72',
        brightRed: '#ff8b82',
        green: '#72f1b8',
        brightGreen: '#82ffc8',
        yellow: '#fede5d',
        brightYellow: '#ffee6d',
        blue: '#36f9f6',
        brightBlue: '#46ffff',
        magenta: '#ff7edb',
        brightMagenta: '#ff8eeb',
        cyan: '#36f9f6',
        brightCyan: '#46ffff',
        white: '#ffffff',
        brightWhite: '#ffffff'
    },
    'github-dark': {
        foreground: '#d1d5da',
        background: '#24292e',
        cursor: '#c8e1ff',
        selection: '#284566',
        black: '#24292e',
        brightBlack: '#959da5',
        red: '#f97583',
        brightRed: '#ff9da9',
        green: '#85e89d',
        brightGreen: '#9bf8b3',
        yellow: '#ffea7f',
        brightYellow: '#ffff8f',
        blue: '#79b8ff',
        brightBlue: '#89c8ff',
        magenta: '#b392f0',
        brightMagenta: '#c3a2ff',
        cyan: '#39c5cf',
        brightCyan: '#49d5df',
        white: '#d1d5da',
        brightWhite: '#ffffff'
    },
    'monokai': {
        foreground: '#f8f8f2',
        background: '#272822',
        cursor: '#f8f8f0',
        selection: '#49483e',
        black: '#272822',
        brightBlack: '#75715e',
        red: '#f92672',
        brightRed: '#ff3c82',
        green: '#a6e22e',
        brightGreen: '#b6f23e',
        yellow: '#f4bf75',
        brightYellow: '#ffcf85',
        blue: '#66d9ef',
        brightBlue: '#76e9ff',
        magenta: '#ae81ff',
        brightMagenta: '#be91ff',
        cyan: '#a1efe4',
        brightCyan: '#b1fff4',
        white: '#f8f8f2',
        brightWhite: '#ffffff'
    },
    'dracula': {
        foreground: '#f8f8f2',
        background: '#282a36',
        cursor: '#f8f8f2',
        selection: '#44475a',
        black: '#282a36',
        brightBlack: '#6272a4',
        red: '#ff5555',
        brightRed: '#ff6e6e',
        green: '#50fa7b',
        brightGreen: '#69ff94',
        yellow: '#f1fa8c',
        brightYellow: '#ffffa5',
        blue: '#bd93f9',
        brightBlue: '#d6acff',
        magenta: '#ff79c6',
        brightMagenta: '#ff92df',
        cyan: '#8be9fd',
        brightCyan: '#a4ffff',
        white: '#f8f8f2',
        brightWhite: '#ffffff'
    },
    'night-owl': {
        foreground: '#d6deeb',
        background: '#011627',
        cursor: '#80a4c2',
        selection: '#1d3b53',
        black: '#011627',
        brightBlack: '#637777',
        red: '#ef5350',
        brightRed: '#ff6060',
        green: '#22da6e',
        brightGreen: '#32ea7e',
        yellow: '#ecc48d',
        brightYellow: '#fcd49d',
        blue: '#82aaff',
        brightBlue: '#92baff',
        magenta: '#c792ea',
        brightMagenta: '#d7a2fa',
        cyan: '#21c7a8',
        brightCyan: '#31d7b8',
        white: '#d6deeb',
        brightWhite: '#ffffff'
    },
    'material-palenight': {
        foreground: '#a6accd',
        background: '#292d3e',
        cursor: '#82aaff',
        selection: '#3c435e',
        black: '#292d3e',
        brightBlack: '#676e95',
        red: '#f07178',
        brightRed: '#ff8188',
        green: '#c3e88d',
        brightGreen: '#d3f89d',
        yellow: '#ffcb6b',
        brightYellow: '#ffdb7b',
        blue: '#82aaff',
        brightBlue: '#92baff',
        magenta: '#c792ea',
        brightMagenta: '#d7a2fa',
        cyan: '#89ddff',
        brightCyan: '#99edff',
        white: '#a6accd',
        brightWhite: '#ffffff'
    },
    'solarized-dark': {
        foreground: '#839496',
        background: '#002b36',
        cursor: '#819090',
        selection: '#073642',
        black: '#002b36',
        brightBlack: '#657b83',
        red: '#dc322f',
        brightRed: '#ec432f',
        green: '#859900',
        brightGreen: '#95a900',
        yellow: '#b58900',
        brightYellow: '#c59900',
        blue: '#268bd2',
        brightBlue: '#369be2',
        magenta: '#d33682',
        brightMagenta: '#e34692',
        cyan: '#2aa198',
        brightCyan: '#3ab1a8',
        white: '#839496',
        brightWhite: '#93a1a1'
    },
    'hc-black': {
        foreground: '#ffffff',
        background: '#000000',
        cursor: '#ffffff',
        selection: '#010101',
        black: '#000000',
        brightBlack: '#808080',
        red: '#ff0000',
        brightRed: '#ff0000',
        green: '#00ff00',
        brightGreen: '#00ff00',
        yellow: '#ffff00',
        brightYellow: '#ffff00',
        blue: '#0000ff',
        brightBlue: '#0000ff',
        magenta: '#ff00ff',
        brightMagenta: '#ff00ff',
        cyan: '#00ffff',
        brightCyan: '#00ffff',
        white: '#ffffff',
        brightWhite: '#ffffff'
    }
};

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
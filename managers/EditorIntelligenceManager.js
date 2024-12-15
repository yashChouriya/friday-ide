class EditorIntelligenceManager {
  constructor(editor) {
    this.editor = editor;
    this.disposables = new Set();
    this.setupIntelligenceFeatures();
  }

  setupIntelligenceFeatures() {
    this.setupCompletionProviders();
    this.setupHoverProviders();
    this.setupCodeActionProviders();
    this.setupFormatProviders();
    this.setupLinkProviders();
    this.setupValidationProviders();
  }

  setupCompletionProviders() {
    // Common programming languages
    const languages = [
      'javascript', 'typescript', 'html', 'css', 'json', 'python',
      'java', 'cpp', 'csharp', 'php', 'ruby', 'go', 'rust'
    ];

    languages.forEach(language => {
      const provider = monaco.languages.registerCompletionItemProvider(language, {
        triggerCharacters: ['.', '(', '"', "'", '{', '[', '<'],
        provideCompletionItems: (model, position) => {
          return this.getContextualSuggestions(model, position, language);
        }
      });
      this.disposables.add(provider);
    });
  }

  setupHoverProviders() {
    const hoverProvider = monaco.languages.registerHoverProvider('*', {
      provideHover: (model, position) => {
        return this.getHoverInfo(model, position);
      }
    });
    this.disposables.add(hoverProvider);
  }

  setupCodeActionProviders() {
    const actionProvider = monaco.languages.registerCodeActionProvider('*', {
      provideCodeActions: (model, range, context) => {
        return this.getCodeActions(model, range, context);
      }
    });
    this.disposables.add(actionProvider);
  }

  setupFormatProviders() {
    const formatProvider = monaco.languages.registerDocumentFormattingEditProvider('*', {
      provideDocumentFormattingEdits: (model) => {
        return this.getFormattingEdits(model);
      }
    });
    this.disposables.add(formatProvider);
  }

  setupLinkProviders() {
    const linkProvider = monaco.languages.registerLinkProvider('*', {
      provideLinks: (model) => {
        return this.getLinks(model);
      }
    });
    this.disposables.add(linkProvider);
  }

  setupValidationProviders() {
    // Set up basic validators for common languages
    const validators = {
      javascript: this.validateJavaScript.bind(this),
      typescript: this.validateTypeScript.bind(this),
      json: this.validateJSON.bind(this),
      // Add more language validators as needed
    };

    // Add a single listener for model content changes
    const disposable = this.editor.onDidChangeModelContent((e) => {
      const model = this.editor.getModel();
      if (model) {
        const language = model.getLanguageId();
        if (validators[language]) {
          validators[language](model);
        }
      }
    });
    this.disposables.add(disposable);
  }

  getContextualSuggestions(model, position, language) {
    const textUntilPosition = model.getValueInRange({
      startLineNumber: position.lineNumber,
      startColumn: 1,
      endLineNumber: position.lineNumber,
      endColumn: position.column
    });

    // Basic suggestions based on context
    const suggestions = [];

    // Add language-specific suggestions
    switch (language) {
      case 'javascript':
      case 'typescript':
        this.addJavaScriptSuggestions(suggestions, textUntilPosition);
        break;
      case 'html':
        this.addHTMLSuggestions(suggestions, textUntilPosition);
        break;
      case 'css':
        this.addCSSSuggestions(suggestions, textUntilPosition);
        break;
      // Add more language-specific suggestions
    }

    return { suggestions };
  }

  addJavaScriptSuggestions(suggestions, text) {
    // Common JavaScript/TypeScript patterns
    if (text.endsWith('const ')) {
      suggestions.push({
        label: 'newConst',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: '${1:name} = ${2:value};',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Create a new constant'
      });
    }

    if (text.endsWith('function ')) {
      suggestions.push({
        label: 'newFunction',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: '${1:name}(${2:params}) {\n\t${3}\n}',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Create a new function'
      });
    }

    // Add more JavaScript/TypeScript suggestions
  }

  addHTMLSuggestions(suggestions, text) {
    // HTML-specific suggestions
    if (text.endsWith('<')) {
      const commonTags = ['div', 'span', 'p', 'a', 'button', 'input', 'form'];
      commonTags.forEach(tag => {
        suggestions.push({
          label: tag,
          kind: monaco.languages.CompletionItemKind.Property,
          insertText: `${tag}$0></${tag}>`,
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: `Create a new ${tag} element`
        });
      });
    }
  }

  addCSSSuggestions(suggestions, text) {
    // CSS-specific suggestions
    const properties = ['color', 'background-color', 'margin', 'padding', 'display', 'flex'];
    properties.forEach(prop => {
      suggestions.push({
        label: prop,
        kind: monaco.languages.CompletionItemKind.Property,
        insertText: `${prop}: $0;`,
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: `Add ${prop} property`
      });
    });
  }

  getHoverInfo(model, position) {
    const word = model.getWordAtPosition(position);
    if (!word) return null;

    // Example hover info for JavaScript keywords
    const jsKeywords = {
      'const': 'Declares a constant variable that cannot be reassigned.',
      'let': 'Declares a block-scoped variable that can be reassigned.',
      'function': 'Declares a new function.',
      // Add more keywords
    };

    if (jsKeywords[word.word]) {
      return {
        contents: [
          { value: '**' + word.word + '**' },
          { value: jsKeywords[word.word] }
        ]
      };
    }

    return null;
  }

  getCodeActions(model, range, context) {
    const actions = [];

    // Example: suggest converting var to const/let
    const text = model.getValueInRange(range);
    if (text.includes('var ')) {
      actions.push({
        title: "Convert 'var' to 'const'",
        kind: "quickfix",
        edit: {
          edits: [{
            resource: model.uri,
            edit: {
              range: range,
              text: text.replace('var ', 'const ')
            }
          }]
        }
      });
    }

    return {
      actions: actions,
      dispose: () => {}
    };
  }

  getFormattingEdits(model) {
    // Basic formatting example
    const edits = [];
    const text = model.getValue();
    const formatted = this.formatCode(text, model.getLanguageId());
    
    if (formatted !== text) {
      edits.push({
        range: model.getFullModelRange(),
        text: formatted
      });
    }

    return edits;
  }

  formatCode(text, language) {
    // Add formatting logic based on language
    // This is a simple example, you might want to use dedicated formatters
    switch (language) {
      case 'json':
        try {
          return JSON.stringify(JSON.parse(text), null, 2);
        } catch {
          return text;
        }
      default:
        return text;
    }
  }

  getLinks(model) {
    const links = [];
    const text = model.getValue();
    
    // URL detection regex
    const urlRegex = /https?:\/\/[^\s)}"']+/g;
    let match;
    
    while ((match = urlRegex.exec(text)) !== null) {
      const startPos = model.getPositionAt(match.index);
      const endPos = model.getPositionAt(match.index + match[0].length);
      
      links.push({
        range: {
          startLineNumber: startPos.lineNumber,
          startColumn: startPos.column,
          endLineNumber: endPos.lineNumber,
          endColumn: endPos.column
        },
        url: match[0]
      });
    }

    return { links };
  }

  validateJavaScript(model) {
    const markers = [];
    const text = model.getValue();

    // Simple validation examples
    const lines = text.split('\n');
    lines.forEach((line, i) => {
      // Check for console.log
      if (line.includes('console.log')) {
        markers.push({
          severity: monaco.MarkerSeverity.Warning,
          message: 'Consider removing console.log before production',
          startLineNumber: i + 1,
          startColumn: line.indexOf('console.log') + 1,
          endLineNumber: i + 1,
          endColumn: line.indexOf('console.log') + 'console.log'.length + 1
        });
      }

      // Check for var usage
      if (line.includes('var ')) {
        markers.push({
          severity: monaco.MarkerSeverity.Warning,
          message: 'Consider using const or let instead of var',
          startLineNumber: i + 1,
          startColumn: line.indexOf('var ') + 1,
          endLineNumber: i + 1,
          endColumn: line.indexOf('var ') + 4
        });
      }
    });

    monaco.editor.setModelMarkers(model, 'javascript', markers);
  }

  validateTypeScript(model) {
    // Add TypeScript-specific validation
  }

  validateJSON(model) {
    const markers = [];
    try {
      JSON.parse(model.getValue());
    } catch (e) {
      markers.push({
        severity: monaco.MarkerSeverity.Error,
        message: e.message,
        startLineNumber: 1,
        startColumn: 1,
        endLineNumber: model.getLineCount(),
        endColumn: model.getLineMaxColumn(model.getLineCount())
      });
    }
    monaco.editor.setModelMarkers(model, 'json', markers);
  }

  dispose() {
    this.disposables.forEach(d => d.dispose());
    this.disposables.clear();
  }
}

// Make it available globally
window.EditorIntelligenceManager = EditorIntelligenceManager;
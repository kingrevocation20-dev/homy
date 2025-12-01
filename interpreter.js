/**
 * homy - A Comprehensive JavaScript Interpreter for a Mini Web Application Language.
 *
 * This interpreter is designed to parse and execute 'homy' language source code.
 * Homy is a language focused on defining mini web applications, specifying properties
 * like app name, version, icon, and the structure of its web body, including styles
 * and the main HTML file.
 *
 * The interpreter is structured into the following core components:
 * 1. Lexer (Tokenizer): Breaks down source code into a stream of tokens.
 * 2. AST (Abstract Syntax Tree) Node Classes: Defines the structure of the parsed code.
 * 3. Parser: Constructs the AST from the token stream, handling syntax and precedence.
 * 4. Environment/Scope Management: Manages variable scopes and bindings during execution.
 * 5. Evaluator/Interpreter: Recursively traverses the AST to execute the program logic.
 * 6. Main Execution Logic: Orchestrates the entire process from source code to evaluation.
 *
 * It also includes support for general-purpose programming constructs like variables,
 * control flow (if/else, loops), functions, and built-in features, making it robust
 * and extensible for future language enhancements.
 */

/**
 * -----------------------------------------------------------------------------
 * 1. Lexer (Tokenizer)
 * -----------------------------------------------------------------------------
 * The Lexer is responsible for converting the raw source code string into a
 * sequence of meaningful tokens. Each token represents a basic unit of the
 * language, such as keywords, identifiers, operators, and literals.
 */

/**
 * @typedef {'IDENTIFIER' | 'KEYWORD' | 'NUMBER' | 'STRING' | 'OPERATOR' | 'PUNCTUATOR' | 'EOF' | 'COMMENT'} TokenType
 */

/**
 * Token holds information about a single lexical unit.
 */
class Token {
    /**
     * Creates an instance of Token.
     * @param {TokenType} type - The type of the token (e.g., 'KEYWORD', 'IDENTIFIER').
     * @param {string} value - The raw string value of the token.
     * @param {number} line - The line number where the token starts in the source code.
     * @param {number} column - The column number where the token starts in the source code.
     */
    constructor(type, value, line, column) {
        this.type = type;
        this.value = value;
        this.line = line;
        this.column = column;
    }

    /**
     * Returns a string representation of the token.
     * @returns {string}
     */
    toString() {
        return `Token {type: '${this.type}', value: '${this.value}', line: ${this.line}, column: ${this.column}}`;
    }
}

/**
 * Defines all possible token types and keywords in the homy language.
 */
const TokenType = Object.freeze({
    // End of File
    EOF: 'EOF',

    // Literals
    IDENTIFIER: 'IDENTIFIER',
    NUMBER: 'NUMBER',
    STRING: 'STRING',
    BOOLEAN: 'BOOLEAN', // true, false
    NULL: 'NULL',       // null

    // Keywords for homy application configuration
    NAME_APP_MINI: 'name_app_mini',
    WEB_PACKAGE_MINI: 'web_package_mini',
    WEB_MINI_VERSION: 'web_mini_version',
    MINI_VERSION: 'mini_version',
    MINI_APP_ICON: 'mini_app_icon',

    // Keywords for the homy web body structure
    BODY: 'body',
    STYLE: 'style',
    CALL: 'Call',

    // General-purpose keywords (for control flow, functions, variables)
    FUNC: 'func',
    RETURN: 'return',
    IF: 'if',
    ELSE: 'else',
    FOR: 'for',
    WHILE: 'while',
    BREAK: 'break',
    CONTINUE: 'continue',
    LET: 'let',
    CONST: 'const',

    // Operators
    ASSIGN: '=',
    PLUS: '+',
    MINUS: '-',
    MULTIPLY: '*',
    DIVIDE: '/',
    MODULO: '%',
    EQ: '==', // Equality
    NEQ: '!=', // Inequality
    LT: '<',   // Less than
    GT: '>',   // Greater than
    LE: '<=',  // Less than or equal
    GE: '>=',  // Greater than or equal
    AND: '&&', // Logical AND
    OR: '||',  // Logical OR
    NOT: '!',  // Logical NOT

    // Punctuators
    LPAREN: '(',        // Left parenthesis
    RPAREN: ')',        // Right parenthesis
    LBRACE: '{',        // Left curly brace
    RBRACE: '}',        // Right curly brace
    LBRACKET: '[',
    RBRACKET: ']',
    COMMA: ',',         // Comma
    SEMICOLON: ';',     // Semicolon
    COLON: ':',         // Colon
    DOT: '.',           // Dot
    AT: '@',            // At symbol (specific to .body@)
    SLASH: '/'          // Slash (specific to /body)
});

/**
 * Maps string keywords to their TokenType.
 */
const KEYWORDS = Object.freeze({
    'name_app_mini': TokenType.NAME_APP_MINI,
    'web_package_mini': TokenType.WEB_PACKAGE_MINI,
    'web_mini_version': TokenType.WEB_MINI_VERSION,
    'mini_version': TokenType.MINI_VERSION,
    'mini_app_icon': TokenType.MINI_APP_ICON,
    'body': TokenType.BODY,
    'style': TokenType.STYLE,
    'Call': TokenType.CALL,
    'func': TokenType.FUNC,
    'return': TokenType.RETURN,
    'if': TokenType.IF,
    'else': TokenType.ELSE,
    'for': TokenType.FOR,
    'while': TokenType.WHILE,
    'break': TokenType.BREAK,
    'continue': TokenType.CONTINUE,
    'let': TokenType.LET,
    'const': TokenType.CONST,
    'true': TokenType.BOOLEAN,
    'false': TokenType.BOOLEAN,
    'null': TokenType.NULL
});

/**
 * Represents a lexical analysis error.
 */
class LexerError extends Error {
    /**
     * Creates an instance of LexerError.
     * @param {string} message - The error message.
     * @param {number} line - The line number where the error occurred.
     * @param {number} column - The column number where the error occurred.
     */
    constructor(message, line, column) {
        super(`Lexer Error (${line}:${column}): ${message}`);
        this.name = 'LexerError';
        this.line = line;
        this.column = column;
    }
}

/**
 * The Lexer class tokenizes the input source code.
 */
class Lexer {
    /**
     * Creates an instance of Lexer.
     * @param {string} source - The source code string to tokenize.
     */
    constructor(source) {
        this.source = source;
        this.currentPos = 0;
        this.line = 1;
        this.column = 1;
        this.tokens = [];
    }

    /**
     * Peeks at the character at the current position without advancing.
     * @returns {string} The character at the current position, or null if at EOF.
     */
    peek() {
        return this.currentPos < this.source.length ? this.source[this.currentPos] : null;
    }

    /**
     * Advances the current position and returns the consumed character.
     * Updates line and column numbers accordingly.
     * @returns {string} The consumed character, or null if at EOF.
     */
    advance() {
        if (this.currentPos >= this.source.length) {
            return null;
        }
        const char = this.source[this.currentPos];
        this.currentPos++;
        if (char === '\n') {
            this.line++;
            this.column = 1;
        } else {
            this.column++;
        }
        return char;
    }

    /**
     * Creates and stores a new token.
     * @param {TokenType} type - The token type.
     * @param {string} value - The token value.
     * @param {number} startLine - The starting line of the token.
     * @param {number} startColumn - The starting column of the token.
     */
    addToken(type, value, startLine, startColumn) {
        this.tokens.push(new Token(type, value, startLine, startColumn));
    }

    /**
     * Checks if a character is whitespace.
     * @param {string} char - The character to check.
     * @returns {boolean}
     */
    isWhitespace(char) {
        return char === ' ' || char === '\t' || char === '\n' || char === '\r';
    }

    /**
     * Checks if a character is a digit.
     * @param {string} char - The character to check.
     * @returns {boolean}
     */
    isDigit(char) {
        return char >= '0' && char <= '9';
    }

    /**
     * Checks if a character is an alphabet character (a-z, A-Z).
     * @param {string} char - The character to check.
     * @returns {boolean}
     */
    isAlpha(char) {
        return (char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z');
    }

    /**
     * Checks if a character is alphanumeric (a-z, A-Z, 0-9) or an underscore.
     * @param {string} char - The character to check.
     * @returns {boolean}
     */
    isAlphaNumeric(char) {
        return this.isAlpha(char) || this.isDigit(char) || char === '_';
    }

    /**
     * Skips whitespace characters.
     */
    skipWhitespace() {
        while (this.isWhitespace(this.peek())) {
            this.advance();
        }
    }

    /**
     * Reads a multi-line comment (/* ... */) or single-line comment (// ...).
     * @returns {boolean} True if a comment was successfully read, false otherwise.
     */
    readComment() {
        const startLine = this.line;
        const startColumn = this.column;

        if (this.peek() === '/') {
            this.advance(); // Consume '/'
            if (this.peek() === '/') {
                this.advance(); // Consume second '/'
                // Single-line comment
                while (this.peek() !== null && this.peek() !== '\n') {
                    this.advance();
                }
                // Optionally, store comment tokens if needed for documentation tools, etc.
                // this.addToken(TokenType.COMMENT, '//' + commentContent, startLine, startColumn);
                return true;
            } else if (this.peek() === '*') {
                this.advance(); // Consume '*'
                // Multi-line comment
                while (this.peek() !== null) {
                    const char = this.advance();
                    if (char === '*' && this.peek() === '/') {
                        this.advance(); // Consume '*'
                        this.advance(); // Consume '/'
                        // Optionally, store comment tokens
                        // this.addToken(TokenType.COMMENT, '/*' + commentContent + '*/', startLine, startColumn);
                        return true;
                    }
                }
                throw new LexerError('Unterminated multi-line comment', startLine, startColumn);
            } else {
                // It was just a single '/', not a comment, so put it back
                this.currentPos--;
                if (startColumn === 1 && this.line > 1) this.line--;
                else this.column--;
                return false;
            }
        }
        return false;
    }

    /**
     * Reads a string literal (enclosed in double quotes).
     * @returns {void}
     * @throws {LexerError} If the string is unterminated.
     */
    readString() {
        const startLine = this.line;
        const startColumn = this.column;
        let value = '';

        // Assuming strings are always double-quoted based on homy syntax examples
        const quoteChar = this.advance(); // Consume the opening quote
        if (quoteChar !== '"') {
             throw new LexerError(`Unexpected character '${quoteChar}', expected '"'`, startLine, startColumn);
        }

        while (this.peek() !== null && this.peek() !== '"') {
            // Handle escape sequences if necessary, for simplicity, not implementing complex ones here.
            // If we needed to handle \n, \t, \\, \", etc., this is where it would go.
            value += this.advance();
        }

        if (this.peek() === null) {
            throw new LexerError('Unterminated string literal', startLine, startColumn);
        }

        this.advance(); // Consume the closing quote
        this.addToken(TokenType.STRING, value, startLine, startColumn);
    }

    /**
     * Reads a number literal (integers and floats).
     * @returns {void}
     */
    readNumber() {
        const startLine = this.line;
        const startColumn = this.column;
        let value = '';

        while (this.isDigit(this.peek())) {
            value += this.advance();
        }

        if (this.peek() === '.' && this.isDigit(this.source[this.currentPos + 1])) {
            value += this.advance(); // Consume '.'
            while (this.isDigit(this.peek())) {
                value += this.advance();
            }
        }

        this.addToken(TokenType.NUMBER, value, startLine, startColumn);
    }

    /**
     * Reads an identifier or a keyword.
     * @returns {void}
     */
    readIdentifierOrKeyword() {
        const startLine = this.line;
        const startColumn = this.column;
        let value = '';

        while (this.isAlphaNumeric(this.peek()) || this.peek() === '-') {
            // Allow hyphen in identifiers, particularly for CSS-like properties like 'background-color'
            value += this.advance();
        }

        // Check if the identifier is a reserved keyword or boolean/null literal.
        const tokenType = KEYWORDS[value] || TokenType.IDENTIFIER;
        this.addToken(tokenType, value, startLine, startColumn);
    }

    /**
     * Reads the next token from the source code.
     * This is the core logic of the lexer.
     * @returns {void}
     * @throws {LexerError} For unexpected characters.
     */
    nextToken() {
        this.skipWhitespace();

        const startLine = this.line;
        const startColumn = this.column;

        if (this.currentPos >= this.source.length) {
            this.addToken(TokenType.EOF, 'EOF', startLine, startColumn);
            return;
        }

        const char = this.peek();

        if (this.readComment()) {
            // If a comment was read, recursively call nextToken to get the actual next token
            // This effectively skips comments without creating tokens for them (unless desired).
            return this.nextToken();
        }

        if (char === '"') {
            this.readString();
            return;
        }

        if (this.isDigit(char)) {
            this.readNumber();
            return;
        }

        if (this.isAlpha(char) || char === '_') {
            this.readIdentifierOrKeyword();
            return;
        }

        // Handle operators and punctuators (multi-character ones first to avoid greedy matching)
        switch (char) {
            case '=':
                this.advance();
                if (this.peek() === '=') {
                    this.advance();
                    this.addToken(TokenType.EQ, '==', startLine, startColumn);
                } else {
                    this.addToken(TokenType.ASSIGN, '=', startLine, startColumn);
                }
                return;
            case '!':
                this.advance();
                if (this.peek() === '=') {
                    this.advance();
                    this.addToken(TokenType.NEQ, '!=', startLine, startColumn);
                } else {
                    this.addToken(TokenType.NOT, '!', startLine, startColumn);
                }
                return;
            case '<':
                this.advance();
                if (this.peek() === '=') {
                    this.advance();
                    this.addToken(TokenType.LE, '<=', startLine, startColumn);
                } else {
                    this.addToken(TokenType.LT, '<', startLine, startColumn);
                }
                return;
            case '>':
                this.advance();
                if (this.peek() === '=') {
                    this.advance();
                    this.addToken(TokenType.GE, '>=', startLine, startColumn);
                } else {
                    this.addToken(TokenType.GT, '>', startLine, startColumn);
                }
                return;
            case '&':
                this.advance();
                if (this.peek() === '&') {
                    this.advance();
                    this.addToken(TokenType.AND, '&&', startLine, startColumn);
                } else {
                    throw new LexerError(`Unexpected character '${char}'`, startLine, startColumn);
                }
                return;
            case '|':
                this.advance();
                if (this.peek() === '|') {
                    this.advance();
                    this.addToken(TokenType.OR, '||', startLine, startColumn);
                } else {
                    throw new LexerError(`Unexpected character '${char}'`, startLine, startColumn);
                }
                return;
            case '+': this.addToken(TokenType.PLUS, this.advance(), startLine, startColumn); return;
            case '-': this.addToken(TokenType.MINUS, this.advance(), startLine, startColumn); return;
            case '*': this.addToken(TokenType.MULTIPLY, this.advance(), startLine, startColumn); return;
            case '%': this.addToken(TokenType.MODULO, this.advance(), startLine, startColumn); return;

            // Punctuators
            case '(': this.addToken(TokenType.LPAREN, this.advance(), startLine, startColumn); return;
            case ')': this.addToken(TokenType.RPAREN, this.advance(), startLine, startColumn); return;
            case '{': this.addToken(TokenType.LBRACE, this.advance(), startLine, startColumn); return;
            case '}': this.addToken(TokenType.RBRACE, this.advance(), startLine, startColumn); return;
            case '[': this.addToken(TokenType.LBRACKET, this.advance(), startLine, startColumn); return;
            case ']': this.addToken(TokenType.RBRACKET, this.advance(), startLine, startColumn); return;
            case ',': this.addToken(TokenType.COMMA, this.advance(), startLine, startColumn); return;
            case ';': this.addToken(TokenType.SEMICOLON, this.advance(), startLine, startColumn); return;
            case ':': this.addToken(TokenType.COLON, this.advance(), startLine, startColumn); return;
            case '.': this.addToken(TokenType.DOT, this.advance(), startLine, startColumn); return;
            case '@': this.addToken(TokenType.AT, this.advance(), startLine, startColumn); return;
            case '/': 
                // If not a comment, then it's a division operator or part of '/body'
                this.addToken(TokenType.SLASH, this.advance(), startLine, startColumn); 
                return;
        }

        throw new LexerError(`Unexpected character '${char}'`, startLine, startColumn);
    }

    /**
     * Tokenizes the entire source code and returns an array of tokens.
     * @returns {Token[]} An array of tokens.
     */
    tokenize() {
        while (this.currentPos < this.source.length) {
            this.nextToken();
        }
        this.addToken(TokenType.EOF, 'EOF', this.line, this.column); // Ensure EOF token is always added
        return this.tokens;
    }
}

/**
 * -----------------------------------------------------------------------------
 * 2. AST (Abstract Syntax Tree) Node Classes
 * -----------------------------------------------------------------------------
 * These classes define the structure of the Abstract Syntax Tree (AST).
 * Each class represents a different type of node in the tree, corresponding
 * to a syntactic construct in the homy language.
 */

class ASTNode {
    /**
     * Base class for all AST nodes.
     * @param {string} type - The type of the AST node.
     * @param {number} line - The starting line number in source code.
     * @param {number} column - The starting column number in source code.
     */
    constructor(type, line, column) {
        this.type = type;
        this.line = line;
        this.column = column;
    }
}

// --- Program and Blocks ---

class Program extends ASTNode {
    /**
     * Represents the root of the AST, containing a list of statements.
     * @param {ASTNode[]} body - A list of statements/declarations in the program.
     * @param {number} line - The starting line number.
     * @param {number} column - The starting column number.
     */
    constructor(body, line, column) {
        super('Program', line, column);
        this.body = body;
    }
}

class BlockStatement extends ASTNode {
    /**
     * Represents a block of statements, typically enclosed in curly braces.
     * @param {ASTNode[]} body - A list of statements within the block.
     * @param {number} line - The starting line number.
     * @param {number} column - The starting column number.
     */
    constructor(body, line, column) {
        super('BlockStatement', line, column);
        this.body = body;
    }
}

// --- Declarations ---

class VariableDeclaration extends ASTNode {
    /**
     * Represents a variable declaration (e.g., `let x = 10;`, `const PI = 3.14;`).
     * @param {string} kind - The kind of declaration ('let' or 'const').
     * @param {Identifier} id - The identifier being declared.
     * @param {ASTNode} init - The initializer expression (can be null for uninitialized).
     * @param {number} line - The starting line number.
     * @param {number} column - The starting column number.
     */
    constructor(kind, id, init, line, column) {
        super('VariableDeclaration', line, column);
        this.kind = kind;
        this.id = id;
        this.init = init;
    }
}

class FunctionDeclaration extends ASTNode {
    /**
     * Represents a function declaration (e.g., `func myFunc(a, b) { ... }`).
     * @param {Identifier} id - The identifier representing the function's name.
     * @param {Identifier[]} params - An array of Identifier nodes for parameters.
     * @param {BlockStatement} body - The body of the function.
     * @param {number} line - The starting line number.
     * @param {number} column - The starting column number.
     */
    constructor(id, params, body, line, column) {
        super('FunctionDeclaration', line, column);
        this.id = id;
        this.params = params;
        this.body = body;
    }
}

// --- Homy-specific Declarations/Statements ---

class MiniAppPropertyDeclaration extends ASTNode {
    /**
     * Represents a mini-app property declaration (e.g., `name_app_mini(
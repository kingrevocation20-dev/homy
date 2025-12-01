#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Define linting rules
const rules = [
    // Rule 1: Line Length Check
    {
        id: 'line-length',
        description: 'Enforce maximum line length.',
        check: (line, lineNumber, fileName) => {
            const issues = [];
            const MAX_LINE_LENGTH = 80;
            if (line.length > MAX_LINE_LENGTH) {
                issues.push({
                    line: lineNumber,
                    column: MAX_LINE_LENGTH + 1,
                    rule: 'line-length',
                    message: `Line exceeds maximum length of ${MAX_LINE_LENGTH} characters.`,
                    filePath: fileName
                });
            }
            return issues;
        }
    },
    // Rule 2: Trailing Whitespace
    {
        id: 'trailing-whitespace',
        description: 'Disallow trailing whitespace at the end of lines.',
        check: (line, lineNumber, fileName) => {
            const issues = [];
            if (line.length > 0 && /\s+$/.test(line)) {
                issues.push({
                    line: lineNumber,
                    column: line.length - line.match(/\s+$/)[0].length + 1,
                    rule: 'trailing-whitespace',
                    message: 'Trailing whitespace found.',
                    filePath: fileName
                });
            }
            return issues;
        }
    },
    // Rule 3: Homy specific: Validate `body@ (style:)` syntax
    {
        id: 'homy-body-style-syntax',
        description: 'Enforce correct syntax for `body@ (style:)`.',
        check: (line, lineNumber, fileName) => {
            const issues = [];
            const bodyAtMatch = line.indexOf('body@');
            if (bodyAtMatch !== -1) {
                // Check if it's immediately followed by (style:) on the same line
                if (!line.includes('body@ (style:')) {
                    issues.push({
                        line: lineNumber,
                        column: bodyAtMatch + 1,
                        rule: 'homy-body-style-syntax',
                        message: '`body@` must be immediately followed by ` (style:)` on the same line.',
                        filePath: fileName
                    });
                }
            }
            return issues;
        }
    }
];

// File-level rules (these will run after all line-level checks)
const fileRules = [
    // Rule 4: Homy specific: Enforce `web_mini_version()` when `web_package_mini()` is used
    {
        id: 'homy-web-package-version-sync',
        description: 'Ensure `web_mini_version()` is used when `web_package_mini()` is present.',
        check: (fileContent, fileName) => {
            const issues = [];
            const hasWebPackage = fileContent.includes('web_package_mini()');
            const hasWebVersion = fileContent.includes('web_mini_version()');

            if (hasWebPackage && !hasWebVersion) {
                // Find the first occurrence of web_package_mini() to report a location
                const lines = fileContent.split('\n');
                let lineNumber = 1;
                let column = 1;
                for (let i = 0; i < lines.length; i++) {
                    const match = lines[i].indexOf('web_package_mini()');
                    if (match !== -1) {
                        lineNumber = i + 1;
                        column = match + 1;
                        break;
                    }
                }
                issues.push({
                    line: lineNumber,
                    column: column,
                    rule: 'homy-web-package-version-sync',
                    message: '`web_mini_version()` must be present when `web_package_mini()` is used.',
                    filePath: fileName
                });
            }
            return issues;
        }
    }
];

function lintFile(filePath) {
    let fileContent;
    try {
        fileContent = fs.readFileSync(filePath, 'utf8');
    } catch (error) {
        console.error(`Error: Could not read file "${filePath}". ${error.message}`);
        process.exit(1);
    }

    const lines = fileContent.split('\n');
    let issues = [];

    // Apply line-level rules
    lines.forEach((line, index) => {
        const lineNumber = index + 1;
        rules.forEach(rule => {
            issues = issues.concat(rule.check(line, lineNumber, filePath));
        });
    });

    // Apply file-level rules
    fileRules.forEach(rule => {
        issues = issues.concat(rule.check(fileContent, filePath));
    });

    return issues;
}

// Main execution
const args = process.argv.slice(2);
if (args.length === 0) {
    console.log('Usage: node linter.js <file_path>');
    process.exit(1);
}

const filePath = args[0];
const fileName = path.basename(filePath);

const issues = lintFile(filePath);

if (issues.length === 0) {
    console.log(`No issues found in "${fileName}".`);
} else {
    console.log(`Issues found in "${fileName}":`);
    issues.forEach(issue => {
        // Format: File.homy:line:col: [RuleName] Message
        console.log(`${issue.filePath}:${issue.line}:${issue.column}: [${issue.rule}] ${issue.message}`);
    });
    process.exit(1); // Exit with a non-zero code to indicate errors
}

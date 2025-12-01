#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';
import { run } from './interpreter.js';

const args = process.argv.slice(2);
const filePath = args[0];
const languageName = 'homy';
const fileExtension = '.homy';

// 1. Handle missing file path
if (!filePath) {
  console.error(`Usage: ${languageName} <file_path>`);
  process.exit(1);
}

// 2. Check if file exists
if (!fs.existsSync(filePath)) {
  console.error(`Error: File not found at ${filePath}`);
  process.exit(1);
}

// 3. Verify file extension
if (path.extname(filePath) !== fileExtension) {
  console.error(`Error: Invalid file extension. Expected ${fileExtension}`);
  process.exit(1);
}

try {
  // 4. Read the content of the source file
  const sourceCode = fs.readFileSync(filePath, 'utf8');

  // 5. Call the imported 'run' function with the file's content
  run(sourceCode);
} catch (error) {
  // 6. Handle any potential errors from the interpreter
  console.error(`Runtime Error in ${languageName} program:\n${error.message || error}`);
  process.exit(1);
}

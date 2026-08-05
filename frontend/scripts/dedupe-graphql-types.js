#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const graphqlFile = path.join(__dirname, '../src/app/api/generated/graphql.ts');

// Read the file
let content = fs.readFileSync(graphqlFile, 'utf-8');

// Remove duplicate type definitions by keeping only the first occurrence
const seenTypes = new Set();
const replacements = [];

// Find all type definitions
let match;
const typeRegex = /export type (\w+) =[\s\S]*?(?=\nexport|$)/g;

while ((match = typeRegex.exec(content)) !== null) {
  const typeName = match[1];
  const fullMatch = match[0];

  if (seenTypes.has(typeName)) {
    // Mark this for removal
    replacements.push({
      original: fullMatch,
      replacement: ''
    });
  } else {
    seenTypes.add(typeName);
  }
}

// Apply replacements in reverse order to maintain positions
replacements.reverse().forEach(rep => {
  content = content.replace(rep.original, rep.replacement);
});

// Clean up extra blank lines
content = content.replace(/\n\n\n+/g, '\n\n');

// Write the file back
fs.writeFileSync(graphqlFile, content, 'utf-8');
console.log('Removed duplicate type definitions from', graphqlFile);

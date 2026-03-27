import * as fs from 'fs';
const text = fs.readFileSync('smtp-error.txt', 'utf16le');
console.log(text);

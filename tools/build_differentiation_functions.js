'use strict';

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const sourceRoot = path.join(root, 'js', 'differentiation', '08-diff-extract-src');
const entryName = 'main.js.src';
const outputPath = path.join(root, 'js', 'differentiation', '08-diff-extract.js');
const includePattern = /^[\t ]*\/\* @include: ([A-Za-z0-9_.-]+\.js\.part) \*\/[\t ]*\r?\n/gm;

function expandFile(name, stack) {
    if (stack.indexOf(name) !== -1) {
        throw new Error('فعلی حصوں میں بار بار شامل ہونے کا چکر: ' + stack.concat(name).join(' ← '));
    }
    const filePath = path.join(sourceRoot, name);
    if (!filePath.startsWith(sourceRoot + path.sep)) {
        throw new Error('فعلی حصے کا راستہ درست نہیں: ' + name);
    }
    if (!fs.existsSync(filePath)) {
        throw new Error('فعلی حصہ نہیں ملا: ' + name);
    }
    const source = fs.readFileSync(filePath, 'utf8');
    const nextStack = stack.concat(name);
    return source.replace(includePattern, function (_match, childName) {
        return expandFile(childName, nextStack);
    });
}

try {
    const generated = expandFile(entryName, []);
    const current = fs.readFileSync(outputPath, 'utf8');
    if (process.argv.includes('--check')) {
        if (current !== generated) {
            console.error('تفریق و نکاسی کی تیار فائل ماخذ حصوں سے مختلف ہے؛ دوبارہ جوڑنے کا حکم چلائیں');
            process.exitCode = 1;
        } else {
            console.log('تفریق و نکاسی کے ماخذ حصے اور تیار فائل یکساں ہیں');
        }
    } else if (current !== generated) {
        fs.writeFileSync(outputPath, generated, 'utf8');
        console.log('تفریق و نکاسی کے فعلی حصے تیار فائل میں جوڑ دیے گئے');
    } else {
        console.log('تفریق و نکاسی کی تیار فائل پہلے ہی تازہ ہے');
    }
} catch (error) {
    console.error(error.message || error);
    process.exitCode = 1;
}

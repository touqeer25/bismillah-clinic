'use strict';

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const sourceRoot = path.join(root, 'css', 'repertory-tabs-src');
const entryPath = path.join(sourceRoot, 'main.css.src');
const outputPath = path.join(root, 'css', 'repertory-tabs.css');
const includePattern = /^[\t ]*\/\* @include: ([A-Za-z0-9_.-]+\.css\.part) \*\/[\t ]*\r?\n/gm;

function expandFile(name, stack) {
    if (stack.indexOf(name) !== -1) {
        throw new Error('طرزنامہ حصوں میں بار بار شامل ہونے کا چکر: ' + stack.concat(name).join(' ← '));
    }
    const filePath = path.join(sourceRoot, name);
    if (!filePath.startsWith(sourceRoot + path.sep)) {
        throw new Error('طرزنامہ حصے کا راستہ درست نہیں: ' + name);
    }
    if (!fs.existsSync(filePath)) {
        throw new Error('طرزنامہ حصہ نہیں ملا: ' + name);
    }
    const source = fs.readFileSync(filePath, 'utf8');
    const nextStack = stack.concat(name);
    return source.replace(includePattern, function (_match, childName) {
        return expandFile(childName, nextStack);
    });
}

try {
    const generated = expandFile(path.basename(entryPath), []);
    const current = fs.readFileSync(outputPath, 'utf8');
    if (process.argv.includes('--check')) {
        if (current !== generated) {
            console.error('طرزنامہ حصوں کا تیار متن مختلف ہے؛ دوبارہ جوڑنے کا حکم چلائیں');
            process.exitCode = 1;
        } else {
            console.log('طرزنامہ حصوں اور تیار فائل کا متن یکساں ہے');
        }
    } else if (current !== generated) {
        fs.writeFileSync(outputPath, generated, 'utf8');
        console.log('الگ طرزنامہ حصے ایک فائل میں جوڑ دیے گئے');
    } else {
        console.log('طرزنامہ حصے پہلے ہی تازہ ہیں');
    }
} catch (error) {
    console.error(error.message || error);
    process.exitCode = 1;
}

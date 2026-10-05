'use strict';

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const sourceRoot = path.join(root, 'ui', 'repertory');
const indexPath = path.join(root, 'index.html');
const beginMarker = '<!-- BEGIN GENERATED REPERTORY STRUCTURE -->';
const endMarker = '<!-- END GENERATED REPERTORY STRUCTURE -->';
const includePattern = /^[\t ]*<!-- @include: ([A-Za-z0-9_.-]+\.html) -->[\t ]*$/gm;

function expandFile(name, stack) {
    if (stack.indexOf(name) !== -1) {
        throw new Error('ریپرٹری کے ساختی اجزا میں بار بار شامل ہونے کا چکر: ' + stack.concat(name).join(' ← '));
    }
    const filePath = path.join(sourceRoot, name);
    if (!filePath.startsWith(sourceRoot + path.sep)) {
        throw new Error('ساختی فائل کا راستہ درست نہیں: ' + name);
    }
    if (!fs.existsSync(filePath)) {
        throw new Error('ساختی فائل نہیں ملی: ' + name);
    }
    const source = fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');
    const nextStack = stack.concat(name);
    return source.replace(includePattern, function (_match, childName) {
        return expandFile(childName, nextStack);
    });
}

function build() {
    const index = fs.readFileSync(indexPath, 'utf8').replace(/\r\n/g, '\n');
    const beginAt = index.indexOf(beginMarker);
    const endAt = index.indexOf(endMarker);
    if (beginAt < 0 || endAt < 0 || endAt < beginAt) {
        throw new Error('مرکزی صفحے میں ساختی حد کے نشان غائب ہیں یا غلط ترتیب میں ہیں');
    }
    if (index.indexOf(beginMarker, beginAt + beginMarker.length) >= 0 ||
        index.indexOf(endMarker, endAt + endMarker.length) >= 0) {
        throw new Error('ساختی حد کے دونوں نشان صرف ایک ایک مرتبہ ہونے چاہئیں');
    }
    const expanded = expandFile('index.html', []);
    const built = index.slice(0, beginAt) + beginMarker + '\n' + expanded.trimEnd() + '\n' +
        index.slice(endAt);
    return { index, built };
}

try {
    const result = build();
    if (process.argv.includes('--check')) {
        if (result.index !== result.built) {
            console.error('مرکزی صفحے کا ساختی حصہ پرانا ہے؛ اسے دوبارہ جوڑنے کے لیے مقررہ حکم چلائیں');
            process.exitCode = 1;
        } else {
            console.log('مرکزی صفحے کا ساختی حصہ تازہ ہے');
        }
    } else if (result.index !== result.built) {
        fs.writeFileSync(indexPath, result.built, 'utf8');
        console.log('ریپرٹری کا ساختی حصہ مرکزی صفحے میں شامل کردیا گیا');
    } else {
        console.log('ریپرٹری کا ساختی حصہ پہلے ہی تازہ ہے');
    }
} catch (error) {
    console.error(error.message || error);
    process.exitCode = 1;
}

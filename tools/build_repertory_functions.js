'use strict';

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const includePattern = /^[\t ]*\/\* @include: ([A-Za-z0-9_.-]+\.js\.part) \*\/[\t ]*\r?\n/gm;
const targets = [
    {
        label: 'بیرونی خول',
        sourceDir: path.join(root, 'js', 'repertory', 'rep-tabs-src'),
        entry: 'main.js.src',
        output: path.join(root, 'js', 'repertory', 'rep-tabs.js')
    },
    {
        label: 'ورک بینچ',
        sourceDir: path.join(root, 'js', 'repertory', 'rep-workbench-src'),
        entry: 'main.js.src',
        output: path.join(root, 'js', 'repertory', 'rep-workbench.js')
    },
    {
        label: 'تجزیہ و موازنہ',
        sourceDir: path.join(root, 'js', 'repertory', 'rep-analysis-src'),
        entry: 'main.js.src',
        output: path.join(root, 'js', 'repertory', 'rep-analysis.js')
    },
    {
        label: 'تلاش',
        sourceDir: path.join(root, 'js', 'repertory', 'rep-search-src'),
        entry: 'main.js.src',
        output: path.join(root, 'js', 'repertory', 'rep-search.js')
    },
    {
        label: 'کلپ بورڈ',
        sourceDir: path.join(root, 'js', 'repertory', 'rep-clipboards-src'),
        entry: 'main.js.src',
        output: path.join(root, 'js', 'repertory', 'rep-clipboards.js')
    },
    {
        label: 'موازنہ موڈ',
        sourceDir: path.join(root, 'js', 'repertory', 'rep-compare-mode-src'),
        entry: 'main.js.src',
        output: path.join(root, 'js', 'repertory', 'rep-compare-mode.js')
    },
    {
        label: 'درختی نمائش',
        sourceDir: path.join(root, 'js', 'repertory', 'rep-tree-src'),
        entry: 'main.js.src',
        output: path.join(root, 'js', 'repertory', 'rep-tree.js')
    }
];

function expandFile(target, name, stack) {
    if (stack.indexOf(name) !== -1) {
        throw new Error('فعلی حصوں میں بار بار شامل ہونے کا چکر: ' + stack.concat(name).join(' ← '));
    }
    const filePath = path.join(target.sourceDir, name);
    if (!filePath.startsWith(target.sourceDir + path.sep)) {
        throw new Error('فعلی حصے کا راستہ درست نہیں: ' + name);
    }
    if (!fs.existsSync(filePath)) {
        throw new Error('فعلی حصہ نہیں ملا: ' + name);
    }
    const source = fs.readFileSync(filePath, 'utf8');
    const nextStack = stack.concat(name);
    return source.replace(includePattern, function (_match, childName) {
        return expandFile(target, childName, nextStack);
    });
}

let failed = false;
for (const target of targets) {
    try {
        const entryPath = path.join(target.sourceDir, target.entry);
        if (!fs.existsSync(entryPath)) throw new Error('مرکزی ماخذ نہیں ملا: ' + target.entry);
        const generated = expandFile(target, target.entry, []);
        const current = fs.readFileSync(target.output, 'utf8');
        if (process.argv.includes('--check')) {
            if (current !== generated) {
                console.error(target.label + ': تیار کوڈ الگ ماخذ حصوں سے مختلف ہے؛ دوبارہ جوڑنے کا حکم چلائیں');
                failed = true;
            } else {
                console.log(target.label + ': ماخذ حصے اور تیار کوڈ یکساں ہیں');
            }
        } else if (current !== generated) {
            fs.writeFileSync(target.output, generated, 'utf8');
            console.log(target.label + ': الگ فعلی حصوں کو تیار فائل میں جوڑ دیا گیا');
        } else {
            console.log(target.label + ': تیار فائل پہلے ہی تازہ ہے');
        }
    } catch (error) {
        console.error(target.label + ': ' + (error.message || error));
        failed = true;
    }
}
if (failed) process.exitCode = 1;

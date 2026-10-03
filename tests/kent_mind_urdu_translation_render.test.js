'use strict';

// Verify the app loader renders re-keyed Kent MIND Urdu entries and leaves the 117 gaps blank.
// Run: node tests/kent_mind_urdu_translation_render.test.js
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.resolve(__dirname, '..');
const chapter = JSON.parse(fs.readFileSync(path.join(ROOT, 'kent_chapters/mind.json'), 'utf8'));
const translations = JSON.parse(fs.readFileSync(path.join(ROOT, 'ur/rubrics/kent/mind.json'), 'utf8'));
const context = {
    localStorage: { getItem: () => null, setItem: () => {} },
    escapeHtml: value => String(value == null ? '' : value).replace(/[&<>"']/g, ch => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[ch])),
    repCurrentBook: 'kent',
    repCurrentChapter: 'mind'
};
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/18-rubrics-ur.js'), 'utf8'), context,
    { filename: 'js/18-rubrics-ur.js' });
context.repRubUrStore('kent', 'mind', translations);

const anger = chapter.r39;
const angerHtml = context.repRubUrRowHtml({
    label: anger.t, labels: [anger.t], full: anger.t, depth: 0
});
assert(angerHtml.includes(translations.rubrics['anger, irascibility']));
assert(angerHtml.includes('lang="ur"'));
assert(!angerHtml.includes('(See Irritability and Quarrelsome)'),
    'the authored Urdu string is independent of the hidden English cross-reference');

const gap = chapter.h0036;
assert.strictEqual(context.repRubUrGet('kent', 'mind', gap.t), null,
    'the source does not contain an old translation for this new rubric');
assert.strictEqual(context.repRubUrRowHtml({ label: gap.t, labels: [gap.t], full: gap.t, depth: 0 }), '');
assert.strictEqual(Object.keys(translations.rubrics).length, 4239);
assert.strictEqual(translations.meta.untranslated_count, 117);
console.log('PASS Urdu loader renders matched Kent MIND translations and leaves new source rubrics untranslated.');

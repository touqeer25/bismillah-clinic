'use strict';

// Verify the app loader renders re-keyed Kent MIND Urdu entries — v150: سب 4,356 ربرکس
// کے اردو جملے موجود ہیں (117 نئے ربرکس بھی مکمل)۔
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

const onGoingTo = chapter.r286;
const onGoingToHtml = context.repRubUrRowHtml({
    label: 'on going to',
    labels: ['ANXIETY', 'sleep', 'on going to'],
    full: 'ANXIETY, sleep, on going to',
    translationFull: onGoingTo.t,
    depth: 2
});
assert(onGoingToHtml.includes(translations.rubrics['anxiety, sleep, before, on going to']),
    'the corrected display breadcrumb still uses the existing translation keyed by its unchanged source title');

const filled = chapter.h0036;
assert.strictEqual(context.repRubUrGet('kent', 'mind', filled.t), 'حوصلے کا فقدان، کسی بڑے کام کی خواہش نہ رہے',
    'v150: نئے ماخذی ربرک کا اردو جملہ لوڈر سے ملتا ہے (جڑ کا «(See …)» حصہ کلید سے ہٹتا ہے)');
assert(context.repRubUrRowHtml({ label: filled.t, labels: [filled.t], full: filled.t, depth: 0 })
    .includes('حوصلے کا فقدان'), 'the row renders the Urdu sentence for the newly translated rubric');
assert.strictEqual(Object.keys(translations.rubrics).length, 4356);
assert.strictEqual(translations.meta.untranslated_count, 0);
assert.strictEqual(translations.meta.source_rubric_count, 4356);
console.log('PASS Urdu loader renders all 4,356 Kent MIND translations (117 نئے ربرکس بھی شامل)۔');

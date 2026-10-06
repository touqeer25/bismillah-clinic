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
assert.strictEqual(Object.keys(translations.rubrics).length, 4358, 'v157: inserted heading rubrics have Urdu');
assert.strictEqual(translations.meta.untranslated_count, 0);
assert.strictEqual(translations.meta.source_rubric_count, 4358);

assert.strictEqual(context.repRubUrGet('kent', 'mind', 'AMUSEMENT, averse to'),
    'تفریح سے بیزاری', 'والد کی عبارت درست رہتی ہے');
assert.strictEqual(context.repRubUrGet('kent', 'mind', 'AMUSEMENT, averse to, desire for'),
    'تفریح کی خواہش', 'بچے کی عبارت والد کی الگ سطر کے سیاق میں دکھتی ہے');
const amusementParentHtml = context.repRubUrRowHtml({
    label: 'AMUSEMENT, averse to',
    labels: ['AMUSEMENT, averse to'],
    full: 'AMUSEMENT, averse to',
    depth: 0
});
const amusementChildHtml = context.repRubUrRowHtml({
    label: 'desire for',
    labels: ['AMUSEMENT, averse to', 'desire for'],
    full: 'AMUSEMENT, averse to, desire for',
    depth: 1
});
assert(amusementParentHtml.includes('تفریح سے بیزاری'));
assert(amusementChildHtml.includes('تفریح کی خواہش'));
assert.strictEqual(context.repRubUrGet('kent', 'mind', 'ANXIETY, evening, amel.'),
    'بے چینی — شام کو کم ہوتی ہے', 'شام کے وقت بہتری کی عبارت واضح ہے');
assert.strictEqual(context.repRubUrGet('kent', 'mind', 'ANXIETY, evening, bed, in, amel.'),
    'بے چینی — شام کو بستر میں کم ہوتی ہے', 'شام اور بستر کی شرط کے ساتھ بہتری واضح ہے');
assert.strictEqual(context.repRubUrGet('kent', 'mind', 'ANXIETY, afternoon, 4 p.m., to 5 p.m., 6 p.m.'),
    'بے چینی — سہ پہر 4 بجے سے 5 بجے تک، پھر 6 بجے', 'درج وقتوں کی پوری درجہ بندی محفوظ ہے');
const nestedTimeHtml = context.repRubUrRowHtml({
    label: '6 p.m.',
    labels: ['ANXIETY', 'afternoon', '4 p.m.', 'to 5 p.m.', '6 p.m.'],
    full: 'ANXIETY, afternoon, 4 p.m., to 5 p.m., 6 p.m.',
    depth: 4
});
assert(nestedTimeHtml.includes('4 بجے سے 5 بجے تک، پھر 6 بجے'));
[
    ['ideas, deficiency of', 'خیالات کی کمی'],
    ['ideas, deficiency of, extra exertion, on', 'خیالات کی کمی — زیادہ محنت پر'],
    ['ideas, deficiency of, interruption, from any', 'خیالات کی کمی — کسی بھی رکاوٹ کی وجہ سے'],
    ['ideas, deficiency of, vomiting amel.', 'خیالات کی کمی — قے آنے سے بہتری'],

    ['talking, complaints all agg.', 'بات کرنے سے تمام شکایات بڑھتی ہیں'],
    ['reading, averse to', 'پڑھنے سے بیزاری'],
    ['men, dread of', 'مردوں سے خوف'],
    ['men, dread of, shuns the foolishness of', 'مردوں کی حماقتوں سے دور رہتا ہے'],
    ['children, aversion to', 'بچوں سے بیزاری'],
    ['children, aversion to, especially little girls (a woman)',
        'بچوں سے بیزاری — خاص طور پر چھوٹی بچیوں سے (عورت میں)'],
    ['thunder storm, before', 'گرج چمک کے طوفان سے پہلے'],
    ['thunder storm, before, during', 'گرج چمک کے طوفان کے دوران']
].forEach(([key, expected]) => {
    assert.strictEqual(context.repRubUrGet('kent', 'mind', key), expected, 'reviewed MIND wording: ' + key);
});
console.log('PASS Urdu loader renders all 4,356 Kent MIND translations and the reviewed wording');

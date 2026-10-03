'use strict';

// Offline integrity test for the committed Kent MIND/Homeoint build.
// The committed parsed source snapshot is checked row-by-row, including parent, medicine and grade.
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const ROOT = path.resolve(__dirname, '..');
const readJson = file => JSON.parse(fs.readFileSync(path.join(ROOT, file), 'utf8'));
const mind = readJson('kent_chapters/mind.json');
const master = readJson('kent_repertory.json');
const index = readJson('kent_chapters/_index.json');
const remedies = readJson('remedy_names.json');
const paths = readJson('kent_search_paths/mind.json');
const manifest = readJson('kent_sources/homeoint_mind_source_manifest.json');
const candidateSnapshotPath = path.join(ROOT, 'kent_sources/homeoint_mind_candidates.json');
const abbreviationSnapshotPath = path.join(ROOT, 'kent_sources/homeoint_remedy_abbreviations.json');
const candidateSnapshotBytes = fs.readFileSync(candidateSnapshotPath);
const abbreviationSnapshotBytes = fs.readFileSync(abbreviationSnapshotPath);
assert.strictEqual(crypto.createHash('sha256').update(candidateSnapshotBytes).digest('hex'), manifest.candidate_snapshot_sha256);
assert.strictEqual(crypto.createHash('sha256').update(abbreviationSnapshotBytes).digest('hex'), manifest.remedy_abbreviations_snapshot_sha256);
const sourceRows = JSON.parse(candidateSnapshotBytes.toString('utf8'));
const sourceAbbreviations = JSON.parse(abbreviationSnapshotBytes.toString('utf8'));
const rids = Object.keys(mind);
const byOrder = new Map();
const pageCounts = {};
const gradeCounts = {1: 0, 2: 0, 3: 0};
let withRemedies = 0;
let remedyEntries = 0;

assert.strictEqual(manifest.candidate_count, 4356, 'approved Homeoint snapshot rubric count');
assert.strictEqual(sourceRows.length, manifest.candidate_count);
assert.strictEqual(Object.keys(sourceAbbreviations).length, manifest.remedy_abbreviation_count);
assert.strictEqual(manifest.page_count, 95, 'all printed pages are represented');
assert.strictEqual(rids.length, manifest.candidate_count);
assert.deepStrictEqual(master.mind, mind, 'master MIND and chapter MIND are identical');
const mindIndex = index.filter(row => row.key === 'mind');
assert.strictEqual(mindIndex.length, 1);
assert.strictEqual(mindIndex[0].rubrics, rids.length);
assert.strictEqual(paths.source_record_count, rids.length);
assert.strictEqual(paths.visible_rubric_count, rids.length);
assert.strictEqual(paths.hidden_anchor_count, 0, 'no source rubric is hidden');
assert.strictEqual(Object.keys(paths.entries).length, rids.length);

rids.forEach((rid, arrayIndex) => {
    const row = mind[rid];
    assert.strictEqual(typeof row.t, 'string');
    assert(row.t.length > 0);
    assert.strictEqual(typeof row.source_label, 'string');
    assert(row.source_label.length > 0);
    assert.strictEqual(row.source_order, arrayIndex, 'file order follows printed page order');
    assert.strictEqual(Number.isInteger(row.source_page), true);
    assert(row.source_page >= 1 && row.source_page <= 95);
    assert.strictEqual(byOrder.has(row.source_order), false, 'source_order is unique');
    byOrder.set(row.source_order, rid);
    pageCounts[row.source_page] = (pageCounts[row.source_page] || 0) + 1;

    if (row.source_parent_id === null) {
        assert.strictEqual(row.t, row.source_label, 'a root title is its source label');
    } else {
        const parent = mind[row.source_parent_id];
        assert(parent, 'source parent exists for ' + rid);
        assert(parent.source_order < row.source_order, 'parent precedes child for ' + rid);
        assert.strictEqual(row.t, parent.t + ', ' + row.source_label, 'full title follows explicit parent for ' + rid);
    }

    const codes = Object.keys(row.r || {});
    if (codes.length) withRemedies++;
    codes.forEach(code => {
        const grade = row.r[code];
        assert(Object.prototype.hasOwnProperty.call(remedies, code), 'remedy display name exists for ' + code);
        assert(grade === 1 || grade === 2 || grade === 3, 'valid source grade for ' + rid + '/' + code);
        gradeCounts[grade]++;
        remedyEntries++;
    });

    const entry = paths.entries[rid];
    assert(entry, 'search breadcrumb exists for ' + rid);
    const auditedDisplayPaths = {
        r284: ['ANXIETY', 'sleep', 'before'],
        r285: ['ANXIETY', 'sleep', 'before', 'evening'],
        r286: ['ANXIETY', 'sleep', 'on going to'],
        r287: ['ANXIETY', 'sleep', 'during (See Dreams)'],
        r288: ['ANXIETY', 'sleep', 'loss of sleep'],
        r289: ['ANXIETY', 'sleep', 'menses, after'],
        r290: ['ANXIETY', 'sleep', 'on starting from'],
        r291: ['ANXIETY', 'sleep', 'partial slumbering in the morning, during']
    };
    let expectedPath = auditedDisplayPaths[rid];
    if (!expectedPath) {
        expectedPath = [];
        let current = row;
        while (current) {
            expectedPath.unshift(current.source_label);
            current = current.source_parent_id === null ? null : mind[current.source_parent_id];
        }
    }
    assert.deepStrictEqual(entry.path, expectedPath, 'search path follows audited Homeoint display hierarchy for ' + rid);
    assert.strictEqual(entry.order, row.source_order + 1, 'search order follows printed order for ' + rid);
});

assert.deepStrictEqual(Object.keys(pageCounts).map(Number).sort((a, b) => a - b),
    Array.from({length: 95}, (_, i) => i + 1));
Object.keys(manifest.page_counts).forEach(page => {
    assert.strictEqual(pageCounts[page], manifest.page_counts[page], 'page count ' + page);
});
assert.strictEqual(withRemedies, manifest.candidate_with_remedies);
assert.strictEqual(rids.length - withRemedies, manifest.candidate_empty);
assert.strictEqual(remedyEntries, 30787);
assert.deepStrictEqual(gradeCounts, {1: 20931, 2: 7745, 3: 2111});
assert.deepStrictEqual(gradeCounts, {
    1: manifest.remedy_grade_counts['1'],
    2: manifest.remedy_grade_counts['2'],
    3: manifest.remedy_grade_counts['3']
});
assert.strictEqual(remedies['nux-j'], 'Nux Juglans');
assert.strictEqual(remedies.cocaine, 'Cocaine');

// Verify the browser tree when jsdom is available; source integrity itself is offline.
let JSDOM;
try {
    const jsdomModule = require(process.env.JSDOM_PATH || 'jsdom');
    JSDOM = jsdomModule.JSDOM || jsdomModule;
} catch (_) {
    JSDOM = null;
}
if (JSDOM) {
    const dom = new JSDOM('<!doctype html><html><body></body></html>', {
        url: 'http://localhost/', runScripts: 'outside-only'
    });
    const w = dom.window;
    w.escapeHtml = String;
    w.currentLang = 'ur';
    w.repUrLabelsOn = () => false;
    w.repCurrentBook = 'kent';
    w.repCurrentChapter = 'mind';
    w.REP_BOOK_INFO = {kent: {tree: 'prefix'}};
    for (const file of ['rep-chapters.js', 'rep-tree.js', 'rep-folders.js']) {
        w.eval(fs.readFileSync(path.join(ROOT, 'js/repertory', file), 'utf8'));
    }
    w.eval(fs.readFileSync(path.join(ROOT, 'js/repertory/kent-tree-fix.js'), 'utf8'));
    assert.strictEqual(w.KENT_TREE_FIX.v, '146');
    assert.deepStrictEqual(Array.from(w.KENT_TREE_FIX.ch.mind.h), []);
    const tree = w.buildRubricTree(mind);
    const flat = [];
    w.repTreeFlatten(tree, [], '', 0, flat, '');
    const shown = flat.filter(row => row.node.hasRubric && row.node.rid);
    assert.deepStrictEqual(shown.map(row => row.node.rid), rids, 'browser tree is a source-order preorder');
    const shownById = new Map(shown.map(row => [row.node.rid, row]));
    w.buildRidPathMap(tree);
    assert.deepStrictEqual(Array.from(w.repRidPathMap.r286.path), ['ANXIETY', 'sleep', 'on going to']);
    assert.strictEqual(w.repRidPathMap.r286.fullPath, 'ANXIETY, sleep, on going to');
    assert.strictEqual(w.repRidPathMap.r286.translationFull, mind.r286.t);
    const sleepFolder = flat.find(row => row.node.syntheticMindPath);
    assert(sleepFolder, 'the audited sleep path has one non-record folder');
    assert.deepStrictEqual(sleepFolder.labels, ['ANXIETY', 'sleep']);
    assert.strictEqual(sleepFolder.node.hasRubric, false);
    const correctedDisplayPaths = {
        r284: ['ANXIETY', 'sleep', 'before'],
        r285: ['ANXIETY', 'sleep', 'before', 'evening'],
        r286: ['ANXIETY', 'sleep', 'on going to'],
        r287: ['ANXIETY', 'sleep', 'during (See Dreams)'],
        r288: ['ANXIETY', 'sleep', 'loss of sleep'],
        r289: ['ANXIETY', 'sleep', 'menses, after'],
        r290: ['ANXIETY', 'sleep', 'on starting from'],
        r291: ['ANXIETY', 'sleep', 'partial slumbering in the morning, during']
    };
    shown.forEach(row => {
        const rid = row.node.rid, source = mind[rid];
        assert.strictEqual(row.translationFull || row.full, source.t,
            'the saved translation key remains the original source title at ' + rid);
        if (correctedDisplayPaths[rid]) {
            assert.deepStrictEqual(row.labels, correctedDisplayPaths[rid], 'audited display path at ' + rid);
            if (rid === 'r284') {
                assert.deepStrictEqual(shownById.get('r121').labels, ['ANXIETY']);
                assert.strictEqual(source.source_parent_id, 'r121');
            } else if (rid === 'r285') {
                assert.deepStrictEqual(shownById.get('r284').labels, row.labels.slice(0, -1));
            } else {
                assert.deepStrictEqual(row.labels.slice(0, -1), sleepFolder.labels);
                assert.strictEqual(source.source_parent_id, 'r284', 'raw extracted parent remains preserved');
            }
        } else if (source.source_parent_id === null) {
            assert.strictEqual(row.labels.length, 1);
        } else {
            const parentRow = shownById.get(source.source_parent_id);
            assert(parentRow, 'parent row is visible in browser tree');
            assert.deepStrictEqual(parentRow.labels, row.labels.slice(0, -1));
        }
    });
    console.log('PASS browser tree preserves source rows/order and applies the audited page-8 sleep hierarchy.');
} else {
    console.log('SKIP browser tree build; jsdom is not installed.');
}

// Exact row-by-row comparison against the committed extraction snapshot.
sourceRows.forEach(source => {
    const rid = byOrder.get(source.source_order);
    const row = mind[rid];
    assert.strictEqual(row.source_page, source.page);
    assert.strictEqual(row.source_label, source.label);
    assert.strictEqual(row.t, source.source_path_labels.join(', '));
    const expectedParent = source.parent_source_order === null ? null : byOrder.get(source.parent_source_order);
    assert.strictEqual(row.source_parent_id, expectedParent);
    const expectedRemedies = {};
    source.remedies.forEach(remedy => {
        const code = String(remedy.name).toLowerCase().replace(/æ/g, 'ae').replace(/œ/g, 'oe').replace(/[^a-z0-9-]/g, '');
        expectedRemedies[code] = remedy.grade;
    });
    assert.deepStrictEqual(row.r, expectedRemedies, 'source medicine/grade map at order ' + source.source_order);
});
console.log('PASS exact comparison of all ' + sourceRows.length + ' Homeoint source rows.');

console.log('PASS Kent MIND: ' + rids.length + ' visible source rubrics; ' + withRemedies +
    ' with remedies, ' + (rids.length - withRemedies) + ' empty; ' + remedyEntries + ' remedy-grade entries.');

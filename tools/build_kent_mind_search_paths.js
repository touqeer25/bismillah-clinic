#!/usr/bin/env node
'use strict';

// Build a search-only breadcrumb index for Kent MIND from the same parser and
// book-order fixes used by the repertory browser. The chapter JSON remains the
// source of remedies/grades; this sidecar stores only rubric paths and order.
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const SOURCE_REL = 'kent_chapters/mind.json';
const SOURCE_PATH = path.join(ROOT, SOURCE_REL);
const CHAPTERS_PATH = path.join(ROOT, 'js/repertory/rep-chapters.js');
const TREE_FIX_PATH = path.join(ROOT, 'js/repertory/kent-tree-fix.js');
const OUTPUT_PATH = path.join(ROOT, 'kent_search_paths/mind.json');

function sha256(value) {
    return crypto.createHash('sha256').update(value).digest('hex');
}

function buildKentMindSearchPaths() {
    const sourceText = fs.readFileSync(SOURCE_PATH, 'utf8');
    const chaptersCode = fs.readFileSync(CHAPTERS_PATH, 'utf8');
    const treeFixCode = fs.readFileSync(TREE_FIX_PATH, 'utf8');
    const source = JSON.parse(sourceText);
    const context = {
        window: {},
        REP_BOOK_INFO: { kent: { tree: 'prefix' } },
        repCurrentBook: 'kent',
        repCurrentChapter: 'mind'
    };
    vm.createContext(context);
    vm.runInContext(chaptersCode, context, { filename: 'js/repertory/rep-chapters.js' });
    vm.runInContext(treeFixCode, context, { filename: 'js/repertory/kent-tree-fix.js' });

    const treeFix = context.window.KENT_TREE_FIX;
    const mindFix = treeFix && treeFix.ch && treeFix.ch.mind;
    if (!mindFix || typeof context.buildRubricTree !== 'function') {
        throw new Error('Could not load the Kent MIND tree builder/fix.');
    }

    // buildRubricTree filters synthetic/twin anchors, restores book hierarchy,
    // and applies Kent's saved book order. Do not touch the source JSON.
    const tree = context.buildRubricTree(source);
    const entries = {};
    let order = 0;
    (function walk(node, ancestors) {
        (node.order || []).forEach(function (label) {
            const child = node.children && node.children[label];
            if (!child) return;
            const labels = ancestors.concat([label]);
            if (child.hasRubric && child.rid) {
                const rid = String(child.rid);
                if (entries[rid]) throw new Error('Duplicate visible rubric id: ' + rid);
                entries[rid] = { path: labels, order: ++order };
            }
            walk(child, labels);
        });
    })(tree, []);

    const hidden = new Set((mindFix.h || []).map(String));
    const expected = Object.keys(source).filter(function (rid) {
        return !hidden.has(String(rid));
    });
    const actual = Object.keys(entries);
    if (actual.length !== expected.length) {
        throw new Error('Path coverage mismatch: expected ' + expected.length + ', got ' + actual.length);
    }
    const actualSet = new Set(actual);
    const missing = expected.filter(function (rid) { return !actualSet.has(String(rid)); });
    const unexpected = actual.filter(function (rid) { return !expected.includes(String(rid)); });
    if (missing.length || unexpected.length) {
        throw new Error('Path IDs do not match visible source IDs; missing=' + missing.slice(0, 5).join(',') +
            ', unexpected=' + unexpected.slice(0, 5).join(','));
    }

    return {
        schema: 'kent-search-paths-v1',
        book: 'kent',
        chapter: 'mind',
        chapter_label: 'MIND',
        order_definition: 'depth-first preorder of the v143 Kent book-style tree',
        source: SOURCE_REL,
        tree_builder: 'js/repertory/rep-chapters.js',
        tree_fix_version: String(treeFix.v || ''),
        source_record_count: Object.keys(source).length,
        hidden_anchor_count: hidden.size,
        visible_rubric_count: actual.length,
        source_sha256: sha256(sourceText),
        build_sha256: sha256(sourceText + '\n' + chaptersCode + '\n' + treeFixCode),
        entries: entries
    };
}

function stableJson(value) {
    return JSON.stringify(value, null, 2) + '\n';
}

function main(argv) {
    const output = stableJson(buildKentMindSearchPaths());
    if (argv.includes('--stdout')) {
        process.stdout.write(output);
        return;
    }
    if (argv.includes('--check')) {
        if (!fs.existsSync(OUTPUT_PATH)) {
            throw new Error('Missing generated file: ' + path.relative(ROOT, OUTPUT_PATH));
        }
        const current = fs.readFileSync(OUTPUT_PATH, 'utf8');
        if (current !== output) {
            throw new Error('Generated MIND search paths are stale; run node tools/build_kent_mind_search_paths.js');
        }
        console.log('Kent MIND search path sidecar is current.');
        return;
    }
    fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
    fs.writeFileSync(OUTPUT_PATH, output, 'utf8');
    const data = JSON.parse(output);
    console.log('Wrote ' + path.relative(ROOT, OUTPUT_PATH) + ': ' +
        data.visible_rubric_count + ' visible MIND rubrics, ' + data.hidden_anchor_count +
        ' hidden anchors; remedies/grades are not copied.');
}

if (require.main === module) {
    try {
        main(process.argv.slice(2));
    } catch (error) {
        console.error(error.message || error);
        process.exitCode = 1;
    }
}

module.exports = { buildKentMindSearchPaths: buildKentMindSearchPaths };

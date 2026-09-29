// v107: ربرک-سطح کے ترجمے کی کوریج — باب بہ باب
// Usage: node tools/coverage_rubrics_ur.js kent
const L=require('./rubrics_ur_lib.js'); const book=process.argv[2]||'kent';
const w=L.appWindow(); let T=0,N=0,K=0;
console.log('باب'.padEnd(20)+'ربرک'.padStart(7)+'جملے'.padStart(8)+'قفل'.padStart(7)+'کوریج'.padStart(9));
L.chapters(w,book).forEach(ch=>{ const rows=L.chapterRows(w,book,ch); const D=L.readUr(book,ch); const n=rows.filter(r=>D.rubrics[r.key]).length;
  T+=rows.length; N+=n; K+=D.locked.length; console.log(ch.padEnd(20)+String(rows.length).padStart(7)+String(n).padStart(8)+String(D.locked.length).padStart(7)+(100*n/rows.length).toFixed(1).padStart(8)+'%'); });
console.log('کل'.padEnd(20)+String(T).padStart(7)+String(N).padStart(8)+String(K).padStart(7)+(100*N/T).toFixed(1).padStart(8)+'%');

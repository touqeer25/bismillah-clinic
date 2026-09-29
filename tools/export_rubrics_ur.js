// v107: ترجمے کے لیے باب کے ربرک نکالیں (ٹری کی ترتیب میں) — TSV
// Usage: node tools/export_rubrics_ur.js kent mind [start] [count] > /tmp/mind_1.tsv
//   کالم:  key · depth · انگریزی (پورا) · والد کا اردو (اگر ہے) · پرانا نظام کیا دکھاتا · اردو (خالی = لکھنا ہے)
//   اردو کے خانے میں صرف **اضافہ** لکھیں (والد کے جملے کے بعد کا حصہ)؛ پورا جملہ خود لکھنا ہو تو شروع میں «=» لگائیں۔
const L=require('./rubrics_ur_lib.js');
const book=process.argv[2]||'kent', ch=process.argv[3]||'mind', start=+process.argv[4]||0, count=+process.argv[5]||1e9;
const w=L.appWindow(); const rows=L.chapterRows(w,book,ch); const U=L.readUr(book,ch).rubrics;
console.log(['key','depth','en','parent_ur','legacy','ur'].join('\t'));
rows.slice(start,start+count).forEach(r=>{
  console.log([r.key,r.depth,r.full,r.parentKey?(U[r.parentKey]||''):'',L.legacyRow(w,r),U[r.key]||''].join('\t'));
});
console.error(`${book}/${ch}: کل ${rows.length} ربرک · نکالے ${Math.min(count,rows.length-start)} (شروع ${start})`);

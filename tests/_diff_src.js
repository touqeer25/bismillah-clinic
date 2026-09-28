// v93: differentiation code is split into js/differentiation/*.js (order: LOAD_ORDER.txt).
// Tests read the same files in the same order — exactly like tests/_rep_src.js does for the repertory.
const fs=require('fs'),path=require('path');
const DIR=path.join(__dirname,'..','js','differentiation');
module.exports=function(){return fs.readFileSync(path.join(DIR,'LOAD_ORDER.txt'),'utf8').split(/\s+/).filter(Boolean).map(f=>fs.readFileSync(path.join(DIR,f),'utf8')).join('\n');};

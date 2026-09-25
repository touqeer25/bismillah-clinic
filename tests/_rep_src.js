// v78: repertory code is split into js/repertory/*.js (order: LOAD_ORDER.txt). Tests read the same files in the same order.
const fs=require('fs'),path=require('path');
const DIR=path.join(__dirname,'..','js','repertory');
module.exports=function(){return fs.readFileSync(path.join(DIR,'LOAD_ORDER.txt'),'utf8').split(/\s+/).filter(Boolean).map(f=>fs.readFileSync(path.join(DIR,f),'utf8')).join('\n');};

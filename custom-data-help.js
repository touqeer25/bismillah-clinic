// ==========================================
// Bismillah Clinic - Help System v3
// Complete Fixed Version
// ==========================================

(function() {
    'use strict';

    // ==========================================
    // ALL CONTENT
    // ==========================================
    var HELP_CONTENT = {
        buttons: {
            category: {
                tooltip: { ur: 'نئی کیٹگری بنائیں', en: 'Add new category', roman: 'Nayi Category banayen' },
                modal: {
                    ur: { title: 'کیٹگری کے بارے میں', icon: '🏷️', content: 'کیٹگری ایک "خانہ" ہوتا ہے جس میں بیماریوں کو ترتیب سے رکھا جاتا ہے۔\n\n<b>مثال:</b>\nکیٹگری: "دل کی بیماریاں" 💗\n• ہارٹ اٹیک\n• انجائنا\n• کولیسٹرول\n\n<b>کب استعمال کریں:</b>\nجب کوئی نئی "ترتیب" بنانی ہو۔\n\n<b>فائدہ:</b>\nتشخیصی صفحے پر ٹیبز بنیں گے۔' },
                    en: { title: 'About Category', icon: '🏷️', content: 'A Category is a group used to organize related diseases.\n\n<b>Example:</b>\nCategory: "Heart Care" 💗\n• Heart Attack\n• Angina\n\n<b>When to use:</b>\nWhen creating a new grouping.' },
                    roman: { title: 'Category ke baray mein', icon: '🏷️', content: 'Category ek group hai jo bemariyon ko organize karta hai.\n\n<b>Example:</b>\n"Dil ki Bemariyan" 💗' }
                }
            },
            symptom: {
                tooltip: { ur: 'نئی علامت شامل کریں', en: 'Add new symptom', roman: 'Nayi alamat' },
                modal: {
                    ur: { title: 'علامت کے بارے میں', icon: '💡', content: 'علامت مریض کی "شکایت" ہوتی ہے۔\n\n<b>مثالیں:</b>\n• سر درد\n• بخار\n• کھانسی\n\n<b>⚠️ خطرناک علامت:</b>\nخطرناک ہو تو "خطرناک علامت" پر ٹک لگا دیں۔' },
                    en: { title: 'About Symptom', icon: '💡', content: 'A Symptom is a patient complaint.\n\n<b>Examples:</b>\n• Headache\n• Fever\n• Cough' },
                    roman: { title: 'Symptom', icon: '💡', content: 'Mareez ki shikayat.\nExamples: Sar dard, bukhar, khansi' }
                }
            },
            disease: {
                tooltip: { ur: 'نئی بیماری کا پروٹوکول', en: 'Add complete disease', roman: 'Nayi bimari' },
                modal: {
                    ur: { title: 'بیماری کے بارے میں', icon: '🔬', content: 'بیماری میں مکمل معلومات شامل ہوتی ہیں:\n\n✓ نام (3 زبانوں میں)\n✓ آئکن\n✓ کیٹگری\n✓ علامات\n✓ اہم علامات\n✓ ٹیسٹ\n✓ خطرے کی علامات\n✓ ادویات\n✓ مشورہ' },
                    en: { title: 'About Disease', icon: '🔬', content: 'A Disease contains complete protocol:\n\n✓ Name\n✓ Icon\n✓ Category\n✓ Symptoms\n✓ Tests\n✓ Remedies\n✓ Advice' },
                    roman: { title: 'Disease', icon: '🔬', content: 'Poori medical protocol.' }
                }

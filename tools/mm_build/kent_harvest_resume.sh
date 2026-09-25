#!/usr/bin/env bash
# v79: Kent ← OOREP «text» harvest باقیقاعدہ مکمل کرنے کا helper۔
#   oorep.com کی WAF تقریباً 5MB/وائنڈو کے بعد IP بلاک کرتی ہے (بندش کے بعد واپس)۔
#   یہ اسکرپت: (1) ہر 10 منٹ probe کرتا ہے، (2) بلاک ختم ہوتے ہی harvest-text دوبارہ چلاتا ہے
#   (مکمل word-files اور محفوظ `_pages/` صفحات skip — ہر fetch ایک بار ہی ہوتا ہے)،
#   (3) 36/36 `*.text.json` ہوتے ہی ختم ہو جاتا ہے۔
#   ادویات کے دادہ کے لیے کوئی network نہیں — وہ ایپ کی kent_de فائلیں (oorep_id + r) سے آتے ہیں۔
#   استعمال: bash tools/mm_build/kent_harvest_resume.sh [workdir]
set -u
cd "$(dirname "$0")/../.."
WORK="${1:-/home/user/oorep_work}"
PROBE="https://www.oorep.com/api/lookup_rep?symptom=Chill&repertory=kent&page=0&remedyString=&minWeight=0&getRemedies=0"
mkdir -p "$WORK"
log(){ echo "[$(date '+%H:%M:%S')] $*"; }
while true; do
  n=$(ls "$WORK"/*.text.json 2>/dev/null | wc -l)
  if [ "$n" -ge 36 ]; then log "ALL 36 TEXT FILES DONE — text harvest complete"; exit 0; fi
  code=$(curl -s -m 15 -A "Mozilla/5.0" -o /dev/null -w "%{http_code}" "$PROBE" || true)
  if [ "$code" = "200" ]; then
    log "oorep.com reachable — resuming text harvest ($n/36 words done)"
    python3 tools/mm_build/kent_from_oorep.py harvest-text "$WORK" && log "harvest-text exited OK"
    sleep 45
  else
    log "blocked/unreachable (http=$code) — waiting… ($n/36 words done)"
    sleep 600
  fi
done

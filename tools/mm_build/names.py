# -*- coding: utf-8 -*-
"""Remedy-name → app abbreviation matcher (shared by all book parsers)."""
import json, re, os
APP='/home/user/bismillah-clinic'
_names=json.load(open(os.path.join(APP,'remedy_names.json')))
# extra names for abbreviations that exist in the app's Kent but have no entry in remedy_names.json
EXTRA={'cina':'Cina','sec':'Secale cornutum','act-r':'Actaea racemosa'}
for k,v in EXTRA.items(): _names.setdefault(k,v)
# app Kent abbreviations (to know which are real remedies in the app)
try:
    _kent=json.load(open(os.path.join(APP,'kent_repertory.json')))
    KENT_ABBRS=set(a for ch in _kent.values() for v in ch.values() for a in v['r'])
except Exception:
    KENT_ABBRS=set()
ALIASES={   # normalized book name -> app abbr
 'asa foetida':'asaf','asafoetida':'asaf','asafetida':'asaf','bor':'bor','borax':'bor','biborate of soda':'bor','lyssin':'lyss','hydrophobinum':'lyss','lyssinum':'lyss',
 'magm':'mag-m','phyt':'phyt','mercurius proto iodide':'merc-i-f','mercurius biniodide':'merc-i-r','mercurius protoiodide':'merc-i-f','mercurius iodatus':'merc-i-f',
 'acetac':'acet-ac','gratiola':'grat','ambra':'ambr','arnica radix':'arn','berberis':'berb','cepa':'all-c','kobaltum':'cob','mercurius bi iod':'merc-i-r','mercurius prot iod':'merc-i-f','mercurius sublimatus corrosivus':'merc-c','thuya':'thuj','thuya occidentalis':'thuj','pothos fcetidus':'poth','pothos foetidus':'poth','ipecacuanha':'ip','colocynthis cucumis':'coloc','coffea arabicum':'coff','coffea arabica':'coff','s a bin a juniperus':'sabin','sabina juniperus':'sabin','arsenicum met':'ars-m','caebo vegetabilis':'carb-v','actea racemosa':'cimic','gelsemium sbmpbrvirens':'gels','tilia europe a':'til','tilia europaea':'til','tilia europea':'til','cimicifuga or actaea racemosa':'cimic','woorari':'cur','curare':'cur','ferrum aceticum':'ferr-acet','kali permanganicum':'kali-perm','hydrocotyle':'hydrc','hydrocotyle asiatica':'hydrc','cinnamomum':'cinnm','alumen':'alumn','alumen alum':'alumn','aurum foliatum':'aur','balsam of peru':'bals-p','balsamum peruvianum':'bals-p','apocynum cannab':'apoc','calcarea acetica':'calc-acet','marum verum':'teucr','china cinchona officinalis':'chin','jodium':'iod','kali hydriodicum':'kali-i','lachnanthes':'lachn','lachnanthes tinctoria':'lachn','nitrum':'kali-n','marum verum teucrium':'teucr','teucrium marum':'teucr','arsenic metallicum':'ars-m','guajacum':'guai','guajacum officinale':'guai','mercurius sublimatus':'merc-c','ranunculus scleratus':'ran-s','apocynum':'apoc','tartar emet':'ant-t','coca erythroxylon coca':'coca','podophyllinum':'podo','rheum palmatum':'rheum','melilotus officinalis':'meli','petroselinum sativum':'petros','saccharum officinale':'sacc','mercurius sulphuricus drarg oxyd sub sulph':'merc-sul','pulex irritans':'pulx','kalium permanganatum':'kali-perm','naphthalinum':'naphtin','diphtherinum':'diph','insulinum':'ins','mentholum':'menthol','mentha piperita':'menth','chromicum acidum':'chr-ac','coccinella septempunctata':'cocc-s','fragaria vesca':'frag','iberis amara':'iber','kaolinum':'kaol','kola':'kola','lappa arctium':'lappa','liatris spicata':'liat','ostrya virginica':'ost','pertussinum':'pert','quercus e glandibus':'querc','ficus religiosa':'fic-r','erechthites hieracifolia':'erech','epiphegus virginiana':'epiph','duboisia myoporoides':'dubo-m','amygdalus persica':'amyg-p','anthracokali':'anthraco','cinnamomum ceylanicum':'cinnm','hippozaeninum':'hippoz','nitromuriaticum acidum':'nit-m-ac','rhodium metallicum':'rhodi','strychnos gaultheriana':'stry-g','thymus serpyllum':'thym','gratiola officinalis':'grat','acetic acid ':'acet-ac','graphites':'graph','cadmium sulph':'cadm','carboneum sulph':'carb-s',
 'actaea racemosa':'cimic','cimicifuga':'cimic','actea racemosa':'cimic',
 'calcarea ostrearum':'calc','calcarea carbonica ostrearum':'calc','calcarea':'calc',
 'cinchona officinalis':'chin','cinchona':'chin','china':'chin','china officinalis':'chin',
 'platina':'plat','platinum':'plat','platinum metallicum':'plat',
 'squilla maritima':'squil','squilla':'squil','scilla':'squil','scilla maritima':'squil',
 'mercurius':'merc','mercurius vivus':'merc-v','mercurius solubilis':'merc','mercurius solubilis hahnemanni':'merc',
 'hepar sulphur':'hep','hepar sulphuris':'hep','hepar sulphuris calcareum':'hep','hepar':'hep',
 'antimonium tartaricum':'ant-t','tartarus emeticus':'ant-t','tartar emetic':'ant-t',
 'antimonium crudum':'ant-c','apis mellifica':'apis','apis':'apis',
 'baryta carbonica':'bar-c','barium carbonicum':'bar-c','baryta muriatica':'bar-m',
 'magnesia carbonica':'mag-c','magnesium carbonicum':'mag-c','magnesia muriatica':'mag-m','magnesia phosphorica':'mag-p','magnesia sulphurica':'mag-s',
 'natrum carbonicum':'nat-c','natrium carbonicum':'nat-c','natrum muriaticum':'nat-m','natrium muriaticum':'nat-m','natrum sulphuricum':'nat-s','natrum phosphoricum':'nat-p','natrum arsenicosum':'nat-a','natrum arsenicicum':'nat-a',
 'kali carbonicum':'kali-c','kalium carbonicum':'kali-c','kali bichromicum':'kali-bi','kali bromatum':'kali-br','kali iodatum':'kali-i','kali muriaticum':'kali-m','kali phosphoricum':'kali-p','kali sulphuricum':'kali-s','kali nitricum':'kali-n','kali arsenicosum':'kali-ar','kali chloricum':'kali-chl','kali cyanatum':'kali-cy',
 'arsenicum album':'ars','arsenicum':'ars','arsenicum iodatum':'ars-i','arsenicum metallicum':'ars-m',
 'nux vomica':'nux-v','nux moschata':'nux-m','rhus toxicodendron':'rhus-t','rhus tox':'rhus-t','rhus venenata':'rhus-v','rhus radicans':'rhus-r',
 'lycopodium clavatum':'lyc','lycopodium':'lyc','pulsatilla nigricans':'puls','pulsatilla pratensis':'puls','pulsatilla':'puls',
 'sepia officinalis':'sep','sepia':'sep','silicea terra':'sil','silicea':'sil','silica':'sil','sulphur':'sulph','sulfur':'sulph','sulphur iodatum':'sulph-i',
 'tarentula hispana':'tarent','tarentula hispanica':'tarent','tarentula':'tarent','tarentula cubensis':'tarent-c',
 'tuberculinum':'tub','tuberculinum bovinum':'tub','bacillinum':'bac','medorrhinum':'med','psorinum':'psor','syphilinum':'syph','carcinosinum':'carc','carcinosin':'carc',
 'lachesis':'lach','lachesis mutus':'lach','lachesis muta':'lach','crotalus horridus':'crot-h','naja tripudians':'naja','naja':'naja',
 'belladonna':'bell','atropa belladonna':'bell','bryonia alba':'bry','bryonia':'bry','chamomilla':'cham','matricaria chamomilla':'cham',
 'coffea cruda':'coff','coffea':'coff','colocynthis':'coloc','citrullus colocynthis':'coloc','drosera rotundifolia':'dros','drosera':'dros',
 'dulcamara':'dulc','solanum dulcamara':'dulc','ferrum metallicum':'ferr','ferrum':'ferr','gelsemium sempervirens':'gels','gelsemium':'gels',
 'helleborus niger':'hell','helleborus':'hell','hyoscyamus niger':'hyos','hyoscyamus':'hyos','ipecacuanha':'ip','ipecac':'ip','cephaelis ipecacuanha':'ip',
 'ledum palustre':'led','ledum':'led','mezereum':'mez','daphne mezereum':'mez','nitricum acidum':'nit-ac','nitric acid':'nit-ac','acidum nitricum':'nit-ac',
 'opium':'op','papaver somniferum':'op','petroleum':'petr','phosphoricum acidum':'ph-ac','phosphoric acid':'ph-ac','acidum phosphoricum':'ph-ac',
 'plumbum metallicum':'plb','plumbum':'plb','rhododendron chrysanthum':'rhod','rhododendron':'rhod','ruta graveolens':'ruta','ruta':'ruta',
 'sabadilla':'sabad','sanguinaria canadensis':'sang','sanguinaria':'sang','secale cornutum':'sec','secale':'sec','spigelia anthelmia':'spig','spigelia':'spig',
 'spongia tosta':'spong','spongia':'spong','stannum metallicum':'stann','stannum':'stann','stramonium':'stram','datura stramonium':'stram','thuja occidentalis':'thuj','thuja':'thuj',
 'veratrum album':'verat','veratrum viride':'verat-v','zincum metallicum':'zinc','zincum':'zinc','cuprum metallicum':'cupr','cuprum':'cupr',
 'argentum nitricum':'arg-n','argentum metallicum':'arg-m','argentum':'arg-m','aurum metallicum':'aur','aurum':'aur','aurum muriaticum':'aur-m','aurum muriaticum natronatum':'aur-m-n',
 'ignatia amara':'ign','ignatia':'ign','cina':'cina','cina maritima':'cina','graphites':'graph','causticum':'caust','causticum hahnemanni':'caust','staphisagria':'staph','staphysagria':'staph','delphinium staphisagria':'staph',
 'phosphorus':'phos','anacardium orientale':'anac','anacardium':'anac','ambra grisea':'ambr','ammonium carbonicum':'am-c','ammonium muriaticum':'am-m','allium cepa':'all-c','allium sativum':'all-s',
 'aesculus hippocastanum':'aesc','aethusa cynapium':'aeth','agnus castus':'agn','agaricus muscarius':'agar','ailanthus glandulosa':'ail','ailanthus':'ail','alumina':'alum','aloe socotrina':'aloe','aloe':'aloe',
 'abrotanum':'abrot','aceticum acidum':'acet-ac','acetic acid':'acet-ac','aconitum napellus':'acon','aconite':'acon','aconitum':'acon','amyl nitrosum':'aml-n','amyl nitrite':'aml-n','amylenum nitrosum':'aml-n',
 'apocynum cannabinum':'apoc','argentum nitricum ':'arg-n','arnica montana':'arn','arnica':'arn','arum triphyllum':'arum-t','asafoetida':'asaf','asarum europaeum':'asar','asterias rubens':'aster',
 'aurum arsenicum':'aur-ar','baptisia tinctoria':'bapt','baptisia':'bapt','benzoicum acidum':'benz-ac','benzoic acid':'benz-ac','berberis vulgaris':'berb','bismuthum':'bism','bismuth':'bism','borax':'borx','borax veneta':'borx',
 'bovista':'bov','bromium':'brom','bromum':'brom','bufo rana':'bufo','bufo':'bufo','cactus grandiflorus':'cact','cadmium sulphuratum':'cadm-s','cadmium sulphuricum':'cadm-s','caladium seguinum':'calad','calcarea phosphorica':'calc-p','calcarea fluorica':'calc-f','calcarea sulphurica':'calc-s','calcarea arsenicosa':'calc-ar','calcarea iodata':'calc-i',
 'camphora':'camph','camphor':'camph','cannabis indica':'cann-i','cannabis sativa':'cann-s','cantharis':'canth','cantharis vesicatoria':'canth','capsicum annuum':'caps','capsicum':'caps','carbo animalis':'carb-an','carbo vegetabilis':'carb-v','carbolicum acidum':'carb-ac','carbolic acid':'carb-ac','carboneum sulphuratum':'carbn-s',
 'castoreum':'cast','caulophyllum thalictroides':'caul','caulophyllum':'caul','ceanothus americanus':'cean','cedron':'cedr','chelidonium majus':'chel','chelidonium':'chel','chininum arsenicosum':'chin-a','chininum sulphuricum':'chin-s','chloralum':'chlol','chloral hydrate':'chlol','cicuta virosa':'cic','cicuta':'cic',
 'cistus canadensis':'cist','clematis erecta':'clem','clematis':'clem','cobaltum':'cob','coca':'coca','cocculus indicus':'cocc','cocculus':'cocc','coccus cacti':'coc-c','colchicum autumnale':'colch','colchicum':'colch','collinsonia canadensis':'coll','conium maculatum':'con','conium':'con','convallaria majalis':'conv',
 'corallium rubrum':'cor-r','crocus sativus':'croc','crocus sativa':'croc','croton tiglium':'crot-t','cyclamen europaeum':'cycl','cyclamen':'cycl','digitalis purpurea':'dig','digitalis':'dig','dioscorea villosa':'dios','elaps corallinus':'elaps','equisetum hyemale':'equis','eupatorium perfoliatum':'eup-per','eupatorium purpureum':'eup-pur','euphrasia officinalis':'euphr','euphrasia':'euphr',
 'ferrum phosphoricum':'ferr-p','fluoricum acidum':'fl-ac','fluoric acid':'fl-ac','formica rufa':'form','glonoinum':'glon','glonoine':'glon','gnaphalium':'gnaph','guaiacum':'guai','hamamelis virginica':'ham','hamamelis virginiana':'ham','hydrastis canadensis':'hydr','hydrastis':'hydr','hydrocyanicum acidum':'hydr-ac','hydrocyanic acid':'hydr-ac',
 'hypericum perforatum':'hyper','hypericum':'hyper','iodium':'iod','iodum':'iod','iris versicolor':'iris','jaborandi':'jab','kalmia latifolia':'kalm','kreosotum':'kreos','kreosote':'kreos','lac caninum':'lac-c','lac defloratum':'lac-d','lacticum acidum':'lac-ac','lactic acid':'lac-ac','laurocerasus':'laur','lilium tigrinum':'lil-t','lithium carbonicum':'lith',
 'lobelia inflata':'lob','magnesia carb':'mag-c','manganum aceticum':'mang','manganum':'mang','melilotus':'meli','menyanthes':'meny','mercurius corrosivus':'merc-c','mercurius cyanatus':'merc-cy','mercurius dulcis':'merc-d','mercurius iodatus flavus':'merc-i-f','mercurius iodatus ruber':'merc-i-r','mercurius sulphuricus':'merc-sul','mercurius protoiodatus':'merc-i-f','mercurius biniodatus':'merc-i-r',
 'millefolium':'mill','moschus':'mosch','murex purpurea':'murx','murex':'murx','muriaticum acidum':'mur-ac','muriatic acid':'mur-ac','myrica cerifera':'myric','natrum arsenicatum':'nat-a','niccolum':'nicc','nuphar luteum':'nuph','oleander':'olnd','onosmodium virginianum':'onos','onosmodium':'onos','origanum majorana':'orig','oxalicum acidum':'ox-ac','oxalic acid':'ox-ac',
 'paeonia officinalis':'paeon','palladium':'pall','pareira brava':'pareir','paris quadrifolia':'par','petroselinum':'petros','phytolacca decandra':'phyt','phytolacca':'phyt','picricum acidum':'pic-ac','picric acid':'pic-ac','plantago major':'plan','podophyllum peltatum':'podo','podophyllum':'podo','prunus spinosa':'prun','psorinum ':'psor','ptelea trifoliata':'ptel','pyrogenium':'pyrog','pyrogen':'pyrog',
 'ranunculus bulbosus':'ran-b','ranunculus sceleratus':'ran-s','raphanus sativus':'raph','ratanhia':'rat','rheum':'rheum','robinia':'rob','rumex crispus':'rumx','rumex':'rumx','sabal serrulata':'sabal','sabina':'sabin','salicylicum acidum':'sal-ac','sambucus nigra':'samb','sambucus':'samb','sanicula':'sanic','sarsaparilla':'sars','selenium':'sel','senecio aureus':'senec','senega':'seneg','sepia ':'sep','silicea ':'sil','sinapis nigra':'sin-n','solanum nigrum':'sol-n','spongia ':'spong','stannum ':'stann','sticta pulmonaria':'stict','stillingia silvatica':'still','strontium carbonicum':'stront','strontiana carbonica':'stront','strophanthus hispidus':'stroph','sulphuricum acidum':'sul-ac','sulphuric acid':'sul-ac','sumbul':'sumb','symphytum officinale':'symph','symphytum':'symph',
 'tabacum':'tab','tanacetum vulgare':'tanac','taraxacum':'tarax','tellurium':'tell','terebinthina':'ter','terebinth':'ter','teucrium marum verum':'teucr','theridion':'ther','thlaspi bursa pastoris':'thlas','trillium pendulum':'tril','urtica urens':'urt-u','ustilago maydis':'ust','uranium nitricum':'uran','valeriana officinalis':'valer','valeriana':'valer','veratrum ':'verat','verbascum thapsus':'verb','verbascum':'verb','viburnum opulus':'vib','viola odorata':'viol-o','viola tricolor':'viol-t','vipera':'vip','wyethia helenoides':'wye','xanthoxylum fraxineum':'xan','zincum phosphoratum':'zinc-p','zincum valerianicum':'zinc-val','zizia aurea':'ziz',
}
def norm(name):
    s=str(name or '').lower()
    s=s.split('--')[0] if '--' in s else s     # "CHINA--Cinchona Officinalis" → "china"
    s=re.sub(r'\(.*?\)','',s)
    s=s.replace('œ','oe').replace('æ','ae').replace('-',' ')
    s=re.sub(r'[^a-z ]',' ',s)
    s=re.sub(r'\s+',' ',s).strip()
    return s
def _tokens(n):
    t=n.split()
    # "acidum nitricum" / "nitric acid" → ['nitr','ac']
    if 'acidum' in t or 'acid' in t:
        other=[x for x in t if x not in ('acidum','acid')]
        return [other[0][:4] if other else 'acid','ac']
    out=[]
    for x in t[:2]:
        out.append(x[:4])
    return out
_by_norm={}
_by_tok={}
_by_tok3={}
for abbr,name in _names.items():
    n=norm(name); _by_norm.setdefault(n,abbr)
    tk=tuple(_tokens(n)); _by_tok.setdefault(tk,[]).append(abbr)
    _by_tok3.setdefault(tuple(x[:3] for x in tk),[]).append(abbr)
    if len(tk)==1: _by_tok.setdefault((tk[0],),[]).append(abbr)
def match(name):
    """returns (abbr or None, how)"""
    n=norm(name)
    if not n: return None,'empty'
    if n in ALIASES: return ALIASES[n],'alias'
    if n in _by_norm: return _by_norm[n],'exact'
    tk=tuple(_tokens(n))
    c=_by_tok.get(tk,[])
    c=list(dict.fromkeys(c))
    if len(c)==1: return c[0],'tokens'
    if len(c)>1:
        # prefer abbr without hyphen (the plain remedy), then the one in Kent, then shortest
        c.sort(key=lambda a:('-' in a, a not in KENT_ABBRS, len(a)))
        return c[0],'tokens-multi'
    if len(tk)==2:
        c=list(dict.fromkeys(_by_tok3.get(tuple(x[:3] for x in tk),[])))
        if len(c)==1: return c[0],'tokens3'
    if len(tk)==2:
        # book has 2 tokens, app has single-token name with same first token (e.g. Lycopodium clavatum → Lycopodium)
        c=_by_tok.get((tk[0],),[])
        c=[a for a in dict.fromkeys(c) if len(_tokens(norm(_names[a])))==1]
        if len(c)==1: return c[0],'first-token'
    if len(tk)==1:
        c=[a for k,v in _by_tok.items() if k and k[0]==tk[0] for a in v]
        c=list(dict.fromkeys(c))
        if len(c)==1: return c[0],'single→only'
        if c:
            c.sort(key=lambda a:('-' in a, a not in KENT_ABBRS, len(a)))
            return c[0],'single→best'
    return None,'unmatched'
MODERN_TO_CLASSIC={'carbn-s':'carb-s','nat-ar':'nat-a','croto-t':'crot-t','stront-c':'stront','chin-ar':'chin-a','euph':'eupho','prun':'prun-s','lac-ac':'lact-ac','lith-c':'lith','cadm-s':'cadm','ars-met':'ars-m','merc-s':'merc-sul','carbn-o':'carb-o','uran-n':'uran','polyg':'polyg-h','carbn-h':'carb-h','amyg-am':'amyg','cupr-acet':'cupr-ac','sac-alb':'sacc','ictod':'poth','both-l':'both','helo':'helod','iris-foe':'ir-foe','m-arct':'mag-arct','anis':'ill','myrt-c':'myrt','guare':'guar','borx':'bor','arg':'arg-m','bar-acet':'bar-ac','kali-fcy':'kali-fer'}
_match_raw=match
def match(name):
    abbr,how=_match_raw(name)
    if abbr and abbr not in KENT_ABBRS and MODERN_TO_CLASSIC.get(abbr) in KENT_ABBRS: return MODERN_TO_CLASSIC[abbr],how+'→classic'
    return abbr,how
def full_name(abbr): return _names.get(abbr,abbr)

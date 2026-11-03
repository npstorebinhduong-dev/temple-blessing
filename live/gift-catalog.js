// Gift identity (TikTok) and the game's ritual are deliberately separate.
// null IDs are pending verification, never matched by price or a guessed ID.
// The local atlas is the original, unmodified public catalog image; 64px cells.
export const ICON_ATLAS='/assets/ganesha/gifts/catalog-jp-2026-10-22.png';
const icon=name=>`/assets/ganesha/gifts/${name}.webp`;
const oldDefaultIcons={
  mushika:'https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/148eef0884fdb12058d1c6897d1e02b9~tplv-obj.webp',
  galaxy:'https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/resource/79a02148079526539f7599150da9fd28.png~tplv-obj.webp',
};
export const GIFTS=Object.freeze([
  {kind:'lotus',name:'Rose',thai:'กุหลาบ',coins:1,id:'5655',effect:'ดอกบัว',icon:icon('rose_0001'),cell:12,source:'catalog-two'},
  {kind:'lamp',name:'Lamp',thai:'โคมไฟ',coins:1,id:null,effect:'จุดประทีป',source:'reference-pending'},
  {kind:'fragrance',name:'Love Perfume',thai:'กลิ่นแห่งรัก',coins:5,id:null,effect:'กำยาน',icon:icon('love_perfume_candidate_0005'),cell:58,candidateId:'919386',source:'JP-candidate'},
  {kind:'prayer',name:'Doughnut',thai:'โดนัท',coins:30,id:'5879',effect:'กดแล้วส่งข้อความ',icon:icon('doughnut_0030'),cell:93,source:'catalog-two'},
  {kind:'incense',name:'Peach',thai:'ลูกพีช',coins:5,id:'14786',effect:'กำยาน',icon:icon('peach_0005'),source:'catalog'},
  {kind:'marigold',name:'Bouquet',thai:'ช่อดอกไม้',coins:100,id:'10994',effect:'ดาวเรือง',icon:icon('bouquet_0100'),cell:129,legacy:true,source:'catalog-JP'},
  {kind:'royal',name:'Love Balloon',thai:'บอลลูนรัก',coins:500,id:null,effect:'มหาบูชา',legacy:true,source:'existing-name'},
  {kind:'mushika',name:'Corgi',thai:'คอร์กี้',coins:299,id:'6267',effect:'ส่งคำขอ',icon:icon('corgi_0299'),cell:221,source:'catalog-two'},
  {kind:'galaxy',name:'Galaxy',thai:'กาแล็กซี',coins:1000,id:'11046',effect:'รับพร',icon:icon('galaxy_1000'),cell:458,source:'catalog-two'},
]);
export const giftByKind=kind=>GIFTS.find(g=>g.kind===kind);
export const demoId=kind=>`demo:${kind}`;
export function configuredGift(g,settings={}) {
  const metadata=settings.giftCatalog?.[g.kind]||{};
  const binding=String(settings.giftMap||'').split(/\r?\n/).map(s=>s.trim().split(/\s*=\s*/)).find(([,kind])=>kind===g.kind)?.[0];
  const special=['mushika','galaxy'].includes(g.kind);
  const id=binding||(special?settings[`${g.kind}GiftId`]:null)||metadata.id||g.id;
  const sameCatalog=String(id||'')===String(g.id||'');
  const matchingMetadata=String(metadata.id||'')===String(id||'')?metadata:{};
  const specialIcon=special&&(!binding||binding===String(settings[`${g.kind}GiftId`]||g.id))?settings[`${g.kind}GiftIcon`]:null;
  const selectedIcon=matchingMetadata.icon||specialIcon;
  return {...g,id,liveReady:!!id||!!g.legacy,thai:matchingMetadata.thai||(special?settings[`${g.kind}GiftName`]:null)||g.thai,
    // Older saved settings contain the exact CDN URL now bundled locally.
    icon:sameCatalog&&(!selectedIcon||selectedIcon===oldDefaultIcons[g.kind])?g.icon:selectedIcon||undefined,
    cell:sameCatalog?g.cell:undefined};
}

export const SMALL_KINDS=Object.freeze(['lotus','lamp','fragrance','prayer','incense']);
export const LARGE_KINDS=Object.freeze(['marigold','royal','mushika','galaxy']);
export const isSmall=kind=>SMALL_KINDS.includes(kind);

const segmenter=new Intl.Segmenter('th',{granularity:'grapheme'});
export const PRAYER_WINDOW_MS=30000;
export const DEFAULT_PRAYER='ขอให้มีสติ สุขภาพแข็งแรง และพบแต่ความสุขความเจริญ';
export function prayerText(value) {
  const text=String(value??'').normalize('NFC').replace(/[\u0000-\u001f\u007f-\u009f\u200e\u200f\u202a-\u202e\u2066-\u2069]/g,' ').replace(/\s+/g,' ').trim();
  if(!text || /^(?:[12๑๒]|หญิง|ชาย|female|male)$/iu.test(text))return null;
  return [...segmenter.segment(text)].slice(0,100).map(g=>g.segment).join('');
}
export class PrayerQueue {
  constructor(saved={}) { this.users=new Map(saved.users||[]);this.sequence=saved.sequence||0; }
  grant(message,now=Date.now()) {
    const id=String(message.id), queue=this.users.get(id)||[];
    // Store an aggregate count; a 9,999-gift streak must not allocate 9,999 objects.
    queue.push({message:{...message},remaining:message.count,openedAt:queue.length?null:now,deadline:queue.length?null:now+PRAYER_WINDOW_MS,grant:`prayer-${++this.sequence}`});
    this.users.set(id,queue);return this.current(id);
  }
  current(id) { const head=this.users.get(String(id))?.[0];return head?{id:String(id),name:head.message.name,grant:head.grant,openedAt:head.openedAt,deadline:head.deadline}:null; }
  finish(id,text,now,fallback=false) {
    const queue=this.users.get(id),head=queue[0];
    const result={...head.message,count:1,prayer:{text,fallback,grant:head.grant,openedAt:head.openedAt,receivedAt:now}};
    if(--head.remaining<=0)queue.shift();
    if(queue.length)Object.assign(queue[0],{grant:`prayer-${++this.sequence}`,openedAt:now,deadline:now+PRAYER_WINDOW_MS});
    else this.users.delete(id);
    return result;
  }
  comment(id,text,{now=Date.now(),sentAt=now}={}) {
    id=String(id);const head=this.users.get(id)?.[0],clean=prayerText(text);
    // Same millisecond is allowed for the first grant, but a single callback can
    // consume only one right. The event normalizer rejects replayed message IDs.
    if(!head||!clean||now>=head.deadline||sentAt<head.openedAt||sentAt>now+5000)return null;
    return this.finish(id,clean,now);
  }
  expire(now=Date.now()) {
    const ready=[];
    for(const [id,queue] of this.users)if(now>=queue[0].deadline)ready.push(this.finish(id,DEFAULT_PRAYER,now,true));
    return ready;
  }
  clear(){this.users.clear();}
  serialize(){return{sequence:this.sequence,users:[...this.users]};}
}

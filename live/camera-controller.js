import { ceremonyCamera } from './ceremony-camera.js';
import { specialCamera } from './special-rituals.js';
import { SCENE_VIEW, sceneCamera } from './scene-layout.js';
import { isSmall } from './gift-catalog.js';
const identity=()=>({scale:1,x:0,y:0});
const keyOf=a=>a?`${a.turn}:${a.serverBeganAt??a.beganAt}`:null;
const point=p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y);
const valid=c=>point(c)&&Number.isFinite(c.scale)&&c.scale>0;
const smooth=n=>{n=Math.max(0,Math.min(1,n));return n*n*(3-2*n)};
const mix=(a,b,t)=>Object.fromEntries(['scale','x','y'].map(k=>[k,a[k]+(b[k]-a[k])*t]));
// The aisle axis is always x=540. One root transform moves all world layers.
export const AISLE_CAMERA=Object.freeze({scale:1.2,x:-108,y:-292});
export const CAMERA_TRANSITION_MS=350;
export class CameraController {
  constructor(base=SCENE_VIEW){this.home={...base};this.reset();}
  reset(){
    this.current={...this.home};this.before=null;this.owner=null;this.target='';this.blocked=null;
    this.relative=identity();this.reason='reset';this.transition=null;this.pending=0;this.lease=0;this.idleSince=null;this.seenTurn=null;
    return this.current;
  }
  release(reason='wide'){
    this.current={...this.home};this.before=null;this.owner=null;this.target='';this.relative=identity();this.reason=reason;this.transition=null;
    return this.current;
  }
  cancel(reason='cancelled'){
    this.blocked=this.seenTurn;this.lease=0;this.pending=0;return this.release(reason);
  }
  notifySmall(id,now){if(!this.owner)this.transfer('aisle',now);this.lease=Math.max(this.lease,now+750);if(!this.owner||this.owner==='aisle')this.target=id;}
  queue(count){this.pending=count;}
  accept(active,target){
    const key=keyOf(active);
    if(!key){this.seenTurn=null;return false;}
    if(this.blocked===key)return false;
    if(!target||target.id!==active.id||!point(target)||!target.seat){
      if(this.seenTurn===key)this.cancel('missing-target');
      return false;
    }
    this.seenTurn=key;return true;
  }
  transfer(owner,now){
    if(this.owner===owner)return;
    this.transition={from:{...this.current},at:now};this.owner=owner;
    this.before=owner?{...this.home}:null;
  }
  sample(active,now,pose,options={}){
    const key=keyOf(active),small=active&&isSmall(active.ritual.kind);
    const large=active&&!small&&key!==this.blocked;
    const demand=!options.largeWaiting&&(small||this.pending>0||now<this.lease);
    if(demand)this.idleSince=null;
    else if(this.idleSince===null)this.idleSince=now;
    // A quarter-second server tick must not cause an out/in between FIFO turns.
    const hold=!options.largeWaiting&&this.owner==='aisle'&&now-this.idleSince<350;
    let wanted=large?key:demand||hold?'aisle':null;
    if(key&&key===this.blocked&&!this.pending)wanted=null;
    const previous=this.owner;this.transfer(wanted,now);
    this.target=active?.id||(wanted==='aisle'?this.target:'');
    let relative=identity();
    try{
      if(large){
        if(!point(pose))return this.cancel('invalid-focus');
        const special=['mushika','galaxy'].includes(active.ritual.kind);
        relative=special?specialCamera():ceremonyCamera(active.ritual.kind,now-active.beganAt,pose,{...options,durationMs:active.until-active.beganAt});
        this.reason=special?'special-wide':'legacy-focus';
        // Preserve the premium curve exactly when it starts at the overview.
        if(previous!==wanted&&previous!=='aisle')this.transition=null;
      }else{relative=wanted==='aisle'?AISLE_CAMERA:identity();this.reason=wanted?'small-aisle':'wide';}
      if(options.enabled===false||options.reduced)relative=identity();
      if(!valid(relative))return this.cancel('invalid-camera');
      const destination=sceneCamera(relative,this.home);
      if(this.transition){
        const t=smooth((now-this.transition.at)/CAMERA_TRANSITION_MS);
        this.current=mix(this.transition.from,destination,t);
        if(t===1)this.transition=null;
      }else this.current=destination;
      this.relative={scale:this.current.scale/this.home.scale,x:(this.current.x-this.home.x)/this.home.scale,y:(this.current.y-this.home.y)/this.home.scale};
      if(!this.transition){this.current={...destination};this.relative={...relative};}
      return this.current;
    }catch{return this.cancel('camera-error');}
  }
}

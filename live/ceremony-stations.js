// Fixed world anchors. Never attach these fixtures to a donor or camera shot.
export const OFFERING = Object.freeze({ x: 805, y: 1158 });
export const LOTUS_OFFERING = Object.freeze({ x: 718, y: 1158 });
export const LAMP = Object.freeze({ x: 871, y: 1144 });
export const INCENSE = Object.freeze({ x: 752, y: 1151 });
export function drawStations(p, t, { lamp = 0, incense = 0 } = {}) {
  p.save();
  // Low bronze table; its top is the resting plane for every deposited object.
  p.fillStyle='#07132388'; p.beginPath();p.ellipse(805,1240,105,14,0,0,Math.PI*2);p.fill();
  // Burnished gold: shaded legs, a carved apron and a shallow reflecting top.
  // All dimensions stay in world space; this fixture never follows a donor.
  for(const x of [730,880]) {
    const gold=p.createLinearGradient(x-8,0,x+8,0);gold.addColorStop(0,'#492b0c');gold.addColorStop(.35,'#ca8d32');gold.addColorStop(.57,'#ffe3a0');gold.addColorStop(1,'#6b3c0e');
    p.fillStyle=gold;p.beginPath();p.moveTo(x-8,1170);p.bezierCurveTo(x-3,1192,x-10,1212,x-9,1232);p.lineTo(x+9,1232);p.bezierCurveTo(x+5,1210,x+4,1190,x+8,1170);p.fill();
    p.fillStyle='#d49d45';p.beginPath();p.ellipse(x,1234,12,4,0,0,7);p.fill();
  }
  const apron=p.createLinearGradient(0,1168,0,1198);apron.addColorStop(0,'#dfac56');apron.addColorStop(.24,'#795019');apron.addColorStop(.75,'#3d250e');apron.addColorStop(1,'#b47d2b');
  p.fillStyle=apron;p.fillRect(721,1168,168,29);p.strokeStyle='#e0b361';p.lineWidth=1;
  for(let i=0;i<9;i++){const x=731+i*18;p.beginPath();p.moveTo(x,1193);p.bezierCurveTo(x-10,1181,x,1173,x+7,1183);p.bezierCurveTo(x+11,1188,x+2,1196,x,1193);p.stroke();}
  const rim=p.createLinearGradient(0,1158,0,1176);rim.addColorStop(0,'#f4d185');rim.addColorStop(.45,'#825215');rim.addColorStop(.8,'#dbac57');rim.addColorStop(1,'#38200c');
  p.fillStyle=rim;p.beginPath();p.ellipse(805,1164,102,18,0,0,7);p.fill();
  const top=p.createRadialGradient(779,1151,3,805,1158,102);top.addColorStop(0,'#f5d99d');top.addColorStop(.4,'#b78132');top.addColorStop(.82,'#734515');top.addColorStop(1,'#e4bc70');
  p.fillStyle=top;p.beginPath();p.ellipse(805,1158,100,14,0,0,7);p.fill();
  p.strokeStyle='#ffdf91';p.lineWidth=1.5;p.beginPath();p.ellipse(805,1158,100,14,0,0,7);p.stroke();
  const bowl=p.createLinearGradient(INCENSE.x-21,0,INCENSE.x+21,0);bowl.addColorStop(0,'#493010');bowl.addColorStop(.4,'#e2b966');bowl.addColorStop(1,'#76511f');
  p.fillStyle=bowl;p.beginPath();p.ellipse(INCENSE.x,1150,19,10,0,0,Math.PI);p.fill();
  p.fillStyle='#352719';p.beginPath();p.ellipse(INCENSE.x,1150,19,5,0,0,7);p.fill();p.strokeStyle='#d3ad64';p.lineWidth=1.5;p.stroke();
  p.lineWidth=2;p.lineCap='round';
  for(let i=-1;i<=1;i++) {
    const x=INCENSE.x+i*6, y=1117+Math.abs(i)*4;
    p.strokeStyle='#b88b53';p.beginPath();p.moveTo(x,1151);p.lineTo(x,y);p.stroke();
    p.fillStyle=incense?'#ffc885':'#9f704c';p.beginPath();p.arc(x,y,incense?2:1,0,7);p.fill();
    p.strokeStyle=`rgba(220,230,236,${.10+.22*incense})`;p.lineWidth=1.3;
    p.beginPath();p.moveTo(x,y);p.bezierCurveTo(x+Math.sin(t+i)*9,y-25,x-12,y-51,x+Math.sin(t*.65+i)*17,y-85);p.stroke();
  }
  p.fillStyle='#cbab61';p.beginPath();p.ellipse(LAMP.x,LAMP.y+7,18,5,0,0,7);p.fill();p.fillRect(LAMP.x-3,LAMP.y-17,6,23);
  p.beginPath();p.ellipse(LAMP.x,LAMP.y-18,16,5,0,0,7);p.fill();
  const strength=.2+.8*lamp;
  const glow=p.createRadialGradient(LAMP.x,LAMP.y-31,1,LAMP.x,LAMP.y-31,36);glow.addColorStop(0,`rgba(255,209,109,${strength*.35})`);glow.addColorStop(1,'#ffbd5100');p.fillStyle=glow;p.fillRect(LAMP.x-36,LAMP.y-67,72,72);
  p.fillStyle=`rgba(255,225,155,${.5+.5*lamp})`;p.beginPath();p.ellipse(LAMP.x,LAMP.y-28,3.5,8+Math.sin(t*5)*1.3,0,0,7);p.fill();
  p.restore();
}

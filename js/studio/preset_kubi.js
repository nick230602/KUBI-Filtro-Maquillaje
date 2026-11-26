// Composición propia para el motor TextureStudio incluido en la base.
// Las capas se añaden mediante addRegionLayer/addImageLayer del Studio.
import { uvToCanvas } from '../base/face_uv.js';

function canvas(size) { const c = document.createElement('canvas'); c.width = c.height = size; return c; }
function blush() {
  const c = canvas(256), ctx = c.getContext('2d');
  const gradient = ctx.createRadialGradient(128, 128, 10, 128, 128, 124);
  gradient.addColorStop(0, '#ff5277dd'); gradient.addColorStop(.45, '#ff527790'); gradient.addColorStop(1, '#ff527700');
  ctx.fillStyle = gradient; ctx.fillRect(0, 0, 256, 256); return c;
}
function seeds() {
  const c = canvas(256), ctx = c.getContext('2d');
  ctx.fillStyle = '#ffca55';
  for (const [x,y,r] of [[58,80,-.3],[126,58,.1],[192,86,.3],[91,150,-.2],[160,158,.2]]) {
    ctx.beginPath(); ctx.ellipse(x,y,6.5,11,r,0,Math.PI*2); ctx.fill();
  }
  return c;
}
function leaves() {
  const c = canvas(256), ctx = c.getContext('2d'); ctx.fillStyle = '#4fc5a2';
  for (const rotation of [-.9,0,.9]) {
    ctx.save();ctx.translate(128,190);ctx.rotate(rotation);ctx.beginPath();
    ctx.moveTo(0,0);ctx.bezierCurveTo(-62,-49,-32,-117,0,-144);ctx.bezierCurveTo(32,-117,62,-49,0,0);ctx.fill();
    ctx.strokeStyle = '#258866';ctx.lineWidth = 4;ctx.beginPath();ctx.moveTo(0,-12);ctx.lineTo(0,-104);ctx.stroke();ctx.restore();
  }
  return c;
}
function sparkle() {
  const c = canvas(128), ctx = c.getContext('2d');ctx.fillStyle='#9670ef';ctx.beginPath();
  for(let k=0;k<8;k++){const r=k%2?12:50,a=k*Math.PI/4;ctx.lineTo(64+Math.cos(a)*r,64+Math.sin(a)*r);}ctx.closePath();ctx.fill();return c;
}
export function applyKubiPreset(studio) {
  studio.layers=[]; studio.selected=null;studio.undoStack=[];
  const cheek=uvToCanvas(50,1), forehead=uvToCanvas(151,1);
  studio.addImageLayer(blush(), {name:'01 · Rubor de fresa',x:cheek.x,y:cheek.y,width:.21,mirror:true,opacity:.78});
  studio.addImageLayer(seeds(), {name:'02 · Semillas doradas',x:cheek.x,y:cheek.y,width:.18,mirror:true,opacity:.95});
  studio.addRegionLayer('lips', {name:'03 · Tinte de labios',color:'#e34469',opacity:.48,mode:'fill',blur:.0015});
  studio.addImageLayer(leaves(), {name:'04 · Hojas en la frente',x:.5,y:forehead.y-.005,width:.17,opacity:.92});
  studio.addImageLayer(sparkle(), {name:'05 · Destellos frutales',x:cheek.x-.055,y:cheek.y-.065,width:.043,mirror:true,opacity:.85});
  studio.selected=null;studio.changed();
  return studio;
}

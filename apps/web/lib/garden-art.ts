// @ts-nocheck — a verbatim port of the landing mockup's garden art (tmp/tutor-roster-mockups/plants28.js +
// garden-fill.js), itself the same art as the app's GardenPlantGlyphs.swift. It builds SVG strings; kept as-is
// so it stays diffable against the mockup and the app rather than retyped.
/* eslint-disable */
// 28 garden glyphs, copied from plants-widget.html (same art as GardenPlantGlyphs.swift)
const ACC=['#A4D8FE','#FDC39C','#C4CEFC','#E5D183','#FFBFB8','#C2DD94','#7AE6E5'];
function shade(h,k){const n=parseInt(h.slice(1),16);const f=v=>Math.max(0,Math.min(255,Math.round(v*k)));return '#'+[(n>>16)&255,(n>>8)&255,n&255].map(f).map(v=>v.toString(16).padStart(2,'0')).join('');}
function sat(h,k){const n=parseInt(h.slice(1),16);let r=(n>>16)&255,g=(n>>8)&255,b=n&255;const m=(r+g+b)/3;const f=v=>Math.max(0,Math.min(255,Math.round(m+(v-m)*k)));return '#'+[f(r),f(g),f(b)].map(v=>v.toString(16).padStart(2,'0')).join('');}
function jit(hex,s){const n=parseInt(hex.slice(1),16);let r=((n>>16)&255)/255,g=((n>>8)&255)/255,b=(n&255)/255;
 const mx=Math.max(r,g,b),mn=Math.min(r,g,b);let h=0,sa=0,l=(mx+mn)/2;
 if(mx!==mn){const d=mx-mn;sa=l>.5?d/(2-mx-mn):d/(mx+mn);h=mx===r?(g-b)/d+(g<b?6:0):mx===g?(b-r)/d+2:(r-g)/d+4;h/=6;}
 h=(h+((s%25)-12)/360+1)%1;l=Math.max(0,Math.min(1,l*(1+(((s>>5)%17)-8)/100)));
 const q=l<.5?l*(1+sa):l+sa-l*sa,p=2*l-q;const t=x=>{x=(x+1)%1;return x<1/6?p+(q-p)*6*x:x<.5?q:x<2/3?p+(q-p)*(2/3-x)*6:p;};
 return '#'+[t(h+1/3),t(h),t(h-1/3)].map(v=>Math.round(v*255).toString(16).padStart(2,'0')).join('');}
const ST='#4f9a5a',LF='#5fb36c',LD='#3f8a4c',TR='#8a5a3b';
const stem=h=>`<path d="M0 0 v-${h}" stroke="${ST}" stroke-width="2.5" stroke-linecap="round"/>`;
const trunk=(h,c=TR)=>`<path d="M-2.5 0 v-${h} h5 v${h} z" fill="${c}"/>`;
const leaf=(x,y,r,c=LF,rx=6,ry=3)=>`<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${c}" transform="rotate(${r} ${x} ${y})"/>`;
const ring=(n,rad,cy,f)=>Array.from({length:n},(_,i)=>{const t=360*i/n,a=t*Math.PI/180;return f(Math.cos(a)*rad,cy+Math.sin(a)*rad,t);}).join('');
const C=(x,y,r,f,o='')=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${f}" ${o}/>`;
const E=(x,y,rx,ry,f)=>`<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${f}"/>`;
const P={
daisy(a){return stem(24)+leaf(-6,-12,-30)+ring(6,7,-28,(x,y)=>C(x,y,4.5,a))+C(0,-28,4,shade(a,.8));},
aster(a){const d=shade(a,.75);return stem(40)+leaf(-5,-14,-35)+ring(8,9,-42,(x,y,t)=>`<ellipse cx="${x}" cy="${y}" rx="5" ry="3" fill="${a}" transform="rotate(${t} ${x} ${y})"/>`)+C(0,-42,5,d);},
tulip(a){const d=shade(a,.78);return stem(22)+leaf(-5,-8,-60,LF,8,3)+leaf(5,-10,60,LF,8,3)+`<path d="M-7 -24 Q-8 -36 -5 -38 L-2 -31 L0 -39 L2 -31 L5 -38 Q8 -36 7 -24 Q0 -19 -7 -24 z" fill="${a}"/><path d="M-2 -31 L0 -39 L2 -31 Q0 -24 -2 -31z" fill="${d}"/>`;},
rose(a){const d=shade(a,.72);return stem(22)+leaf(-6,-10,-30)+leaf(6,-15,30)+C(0,-28,8.5,d)+C(-1,-29,6.5,a)+`<path d="M-1 -29 m-3 0 a3 3 0 1 1 3 3 a1.6 1.6 0 1 1 -1 -2" stroke="${d}" stroke-width="1.3" fill="none"/>`;},
sunflower(a){return stem(34)+leaf(-6,-14,-30,LF,7,3.5)+leaf(6,-22,30,LF,7,3.5)+ring(12,8,-38,(x,y,t)=>`<ellipse cx="${x}" cy="${y}" rx="5" ry="2.4" fill="${a}" transform="rotate(${t} ${x} ${y})"/>`)+C(0,-38,5.5,'#6b4a2b');},
foxglove(a){const l=shade(a,1.1);return stem(42)+leaf(-5,-4,-20,LF,7,3)+leaf(5,-6,20,LF,7,3)+[0,1,2,3,4,5].map(i=>E(i%2?3:-3,-18-i*5,4.6-i*.5,3.2-i*.3,i%2?a:l)).join('');},
poppy(a){return `<path d="M0 0 q-3 -10 0 -18 q3 -8 1 -12" stroke="${ST}" stroke-width="2" fill="none"/>`+leaf(-5,-6,-40)+ring(4,4,-33,(x,y)=>C(x+1,y,5.5,a))+C(1,-33,2.6,'#2b2b2b');},
lily(a){const d=shade(a,.7),l=shade(a,1.12);return stem(26)+leaf(-6,-10,-40,LF,8,2.5)+`<g transform="translate(0 -30)">`+[0,1,2,3,4,5].map(i=>`<path d="M0 0 Q-4.5 -6 0 -13 Q4.5 -6 0 0z" fill="${i%2?a:l}" transform="rotate(${i*60})"/>`).join('')+C(0,0,2.2,d)+`</g>`;},
lotus(a){const d=shade(a,.82),l=shade(a,1.12);return E(0,-1,16,7,'#3c7fa0')+E(-7,-2,7,3.2,LD)+E(8,0,5,2.4,LF)+`<g transform="translate(1 -5)">`+[[-55,d],[55,d],[-28,a],[28,a],[0,l]].map(([t,c])=>`<path d="M0 0 Q-5 -7 0 -15 Q5 -7 0 0z" fill="${c}" transform="rotate(${t})"/>`).join('')+`</g>`;},
tree(a){const d=shade(a,.78),l=shade(a,1.08);return trunk(16)+C(0,-22,13,d)+C(-6,-28,10,a)+C(6,-30,10,a)+C(0,-36,9,l);},
pine(a){const d=shade(a,.8),l=shade(a,1.08);return trunk(10)+`<path d="M-14 -8 L0 -24 L14 -8 z" fill="${d}"/><path d="M-11 -18 L0 -34 L11 -18 z" fill="${a}"/><path d="M-8 -28 L0 -44 L8 -28 z" fill="${l}"/>`;},
fruit(a){return trunk(14)+C(0,-22,13,LD)+C(-6,-28,10,LF)+C(6,-29,10,LF)+C(0,-34,8,'#72c27e')+[[-7,-22],[5,-20],[8,-31],[-3,-32],[0,-15],[-9,-30]].map(([x,y])=>C(x,y,2.7,a)+C(x-.8,y-.9,.8,'#fff','opacity=".7"')).join('');},
blossom(a){const l=shade(a,1.12);return `<path d="M-1 0 v-14 l-7 -8 M-1 -14 l6 -10" stroke="#6e4a35" stroke-width="3" fill="none" stroke-linecap="round"/>`+C(-8,-26,8,a)+C(6,-28,9,a)+C(-1,-34,8,l)+C(-12,-20,5,l)+C(10,-21,5,l)+E(13,-6,1.8,1,a)+E(-14,-3,1.8,1,l)+E(9,-2,1.6,.9,a);},
palm(a){const d=shade(a,.78);return `<path d="M0 0 q-2 -18 4 -34" stroke="${TR}" stroke-width="4" fill="none" stroke-linecap="round"/>`+[['M4 -34 q-10 -6 -18 3',d],['M4 -34 q10 -6 18 3',d],['M4 -34 q-8 -10 -15 -8',a],['M4 -34 q8 -10 15 -8',a],['M4 -34 q1 -8 -2 -13',a]].map(([p,c])=>`<path d="${p}" stroke="${c}" stroke-width="4.5" fill="none" stroke-linecap="round"/>`).join('')+C(2,-31,2.4,'#8a5a3b')+C(6,-31,2.4,'#7a4e33');},
bonsai(a){const d=shade(a,.78),l=shade(a,1.1);return `<path d="M-10 0 h20 l2 -6 h-24 z" fill="#b5654a"/><path d="M0 -6 q-7 -6 0 -12 q6 -5 -2 -13" stroke="${TR}" stroke-width="3" fill="none" stroke-linecap="round"/>`+E(-7,-18,8,4,d)+E(7,-24,7,3.5,a)+E(-2,-31,8,4,l);},
poplar(a){const d=shade(a,.78),l=shade(a,1.1);return trunk(24)+E(0,-34,10,13,d)+E(-3,-37,7,10,a)+E(2,-41,5,7,l);},
bush(a){const l=shade(a,1.08);return E(0,-5,15,7,LD)+E(-6,-10,9,6.5,LF)+E(6,-11,9,6.5,LF)+E(-4,-15,5,4,a)+E(5,-16,5,4,a)+E(0,-19,4.5,3.5,l);},
berry(a){return E(0,-7,15,8.5,LD)+E(-6,-11,9,7,LF)+E(6,-12,9,7,LF)+[[-9,-9],[-3,-14],[4,-9],[9,-14],[1,-17],[-6,-5],[11,-7]].map(([x,y])=>C(x,y,2.2,a)).join('');},
grass(a){return ['M0 0 q-2 -14 -8 -24','M0 0 q0 -16 1 -30','M0 0 q3 -12 9 -22','M-3 0 q-6 -8 -12 -12','M3 0 q6 -8 12 -12'].map((p,i)=>`<path d="${p}" stroke="${i%2?LD:LF}" stroke-width="2.2" fill="none" stroke-linecap="round"/>`).join('')+`<ellipse cx="-8" cy="-26" rx="2" ry="4" fill="${a}" transform="rotate(-25 -8 -26)"/>`+E(1,-32,2,4.5,a)+`<ellipse cx="9" cy="-24" rx="2" ry="4" fill="${a}" transform="rotate(25 9 -24)"/>`;},
fern(a){return [[-62,LD],[62,LD],[-32,LF],[32,LF],[0,LF]].map(([t,c])=>`<g transform="rotate(${t})"><ellipse cx="0" cy="-14" rx="4" ry="13" fill="${c}"/><path d="M0 -3 v-22" stroke="${ST}" stroke-width="1"/>${C(0,-28,2.6,a)}</g>`).join('');},
cactus(a){const g='#5aa866';return `<rect x="-5" y="-30" width="10" height="30" rx="5" fill="${g}"/><path d="M-5 -12 h-4 a3 3 0 0 1 -3 -3 v-6 M5 -17 h4 a3 3 0 0 0 3 -3 v-5" stroke="${g}" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M-1.5 -26 v20 M1.8 -24 v18" stroke="#4a9257" stroke-width="1"/>`+ring(5,3.2,-32,(x,y)=>C(x,y,2.8,a))+C(0,-32,1.8,shade(a,.7));},
clover(a){const l=shade(a,1.12);return `<path d="M1 0 q1 -10 1 -19" stroke="${ST}" stroke-width="2" fill="none"/>`+[[-8,-6],[7,-8],[-1,-12]].map(([x,y])=>ring(3,3,y,(u,v)=>C(x+u,v,3.4,LF))+C(x,y,1.4,LD)).join('')+C(2,-22,5,a)+C(0,-24,1.8,l)+C(4,-23,1.6,l)+C(2,-19.5,1.6,l);},
mush(a){const d=shade(a,.8);return `<path d="M-4 0 v-12 h8 v12 z" fill="#efe6d6"/><path d="M-13 -12 a13 11 0 0 1 26 0 z" fill="${d}"/><path d="M-13 -12 a13 11 0 0 1 26 0 q-13 4 -26 0 z" fill="${a}"/>`+C(-5,-19,2,'#fff')+C(4,-16,1.6,'#fff');},
glow(a){return `<path d="M0 0 q-4 -12 2 -26" stroke="${ST}" stroke-width="2.5" fill="none" stroke-linecap="round"/>`+leaf(-5,-8,-35)+leaf(4,-14,35)+`<circle cx="2" cy="-30" r="11" fill="${a}" opacity=".25"><animate attributeName="opacity" values=".1;.4;.1" dur="2.4s" repeatCount="indefinite"/></circle>`+C(2,-30,6,a)+C(0,-32,2,'#fff','opacity=".75"');},
pumpkin(a){const d=shade(a,.8);return E(-6,-8,7,8,d)+E(6,-8,7,8,d)+E(0,-8,7.5,9,a)+`<path d="M0 -16 q1 -4 3 -6" stroke="#5b7a3a" stroke-width="2.5" fill="none" stroke-linecap="round"/>`+leaf(7,-18,20,LF,5,2.5)+`<path d="M-2 -16 q-5 -3 -3 -7" stroke="${ST}" stroke-width="1" fill="none"/>`;},
strawberry(a){const b=(x,y)=>`<path d="M${x-3.5} ${y-3} q3.5 -2 7 0 q-.5 5 -3.5 7 q-3 -2 -3.5 -7z" fill="${a}"/>`+E(x,y-3.4,3,1.2,LF);return ring(3,6,-12,(x,y)=>C(x,y,5,LF))+C(0,-12,3,LD)+b(-7,-3)+b(5,-2)+b(12,-7);},
bamboo(a){const d=shade(a,.75);return [[-7,30],[-1,40],[5,24]].map(([x,h])=>`<rect x="${x}" y="${-h}" width="4" height="${h}" rx="1.5" fill="${LF}"/>`+Array.from({length:Math.floor(h/8)},(_,i)=>`<path d="M${x} ${-8-i*8} h4" stroke="${LD}" stroke-width="1.2"/>`).join('')).join('')+leaf(-11,-30,-30,a,7,2.5)+leaf(4,-40,30,a,7,2.5)+leaf(10,-24,30,d,7,2.5);},
flytrap(a){const d=shade(a,.75);const trap=(x,y,r)=>`<g transform="translate(${x} ${y}) rotate(${r})"><path d="M0 0 Q7 -10 14 -2z" fill="${LF}"/><path d="M1.5 -.6 Q7 -7 12.5 -2z" fill="${a}"/><path d="M0 0 Q7 8 14 1z" fill="${LD}"/><path d="M1.5 .4 Q7 5 12.5 1z" fill="${d}"/></g>`;return `<path d="M-1 0 q-4 -8 -6 -16 M1 0 q3 -10 4 -22" stroke="${ST}" stroke-width="2" fill="none"/>`+trap(-7,-16,-150)+trap(5,-22,-40);},
};

// The streak bed + 1 → 30 fill, lifted from tmp/mesh-mockups/streak-goal.html (the HTML twin of
// StreakIncrementScreen.pickGoal: days pop in left to right on soil, rows fade in as they're needed).
// Plants come from plants28.js (same art as GardenPlantGlyphs.swift). Here the plants are full colour, not the dulled preview.
const GF = (() => {
  const SOIL = { top: '#2F6B45', grid: '#3A7A50', sideR: ['#1C4530', '#153626'], satK: 1.3 };
  const FUTG = { top: '#1E4530', grid: '#2A5A3E', sideR: ['#122D22', '#0E241B'] };
  const TODAYP = { top: '#3E8558', grid: '#52A06D', sideR: ['#265B3D', '#1E4B32'] };
  const ROSE = '#FFBFB8';
  const T = 48, DEP = 42, D = 10, GZ = 1.1, HEAD = 48, f1 = v => v.toFixed(1);
  const cl = v => Math.max(0, Math.min(1, v)), eo = t => 1 - Math.pow(1 - cl(t), 3);
  const back = v => { v = cl(v); const a = 1.9, b = a + 1; return 1 + b * Math.pow(v - 1, 3) + a * Math.pow(v - 1, 2); };
  const KINDS = ['tulip', 'daisy', 'sunflower', 'aster', 'lily', 'poppy', 'blossom', 'foxglove', 'bush', 'tree', 'lotus', 'berry', 'pine', 'fruit', 'clover', 'palm', 'glow', 'strawberry', 'rose', 'poplar'];
  function block(q, pal) {
    const m = D * .55, p = q[3], o = q[2];
    return `<path d="M${f1(p[0])} ${f1(p[1])} L${f1(o[0])} ${f1(o[1])} L${f1(o[0])} ${f1(o[1] + m)} L${f1(p[0])} ${f1(p[1] + m)}Z" fill="${pal.sideR[0]}"/>`
      + `<path d="M${f1(p[0])} ${f1(p[1] + m - .3)} L${f1(o[0])} ${f1(o[1] + m - .3)} L${f1(o[0])} ${f1(o[1] + D)} L${f1(p[0])} ${f1(p[1] + D)}Z" fill="${pal.sideR[1]}"/>`
      + `<path d="M${q.map(p => f1(p[0]) + ' ' + f1(p[1])).join(' L')}Z" fill="${pal.top}" stroke="${pal.grid}" stroke-width=".7"/>`;
  }
  function cells(g) { const rows = Math.ceil(g / 7), out = []; for (let r = 0; r < rows; r++) for (let c = 0; c < 7; c++) { const k = r * 7 + c; if (k < g) out.push({ c, r, k }); } return { rows, cells: out }; }
  const height = rows => (HEAD + rows * DEP + D) * GZ + 6;
  // shown = how many days have a plant (1 … g), as a float so the newest one springs in; rowA(r) 0..1
  function bed(g, t, o = {}) {
    const { rows, cells: cs } = cells(g); let tiles = '', plants = '';
    for (const x of cs) {
      const cx = (x.c + .5) * T, cy = x.r * DEP + DEP / 2, q = [[cx - T / 2, cy - DEP / 2], [cx + T / 2, cy - DEP / 2], [cx + T / 2, cy + DEP / 2], [cx - T / 2, cy + DEP / 2]];
      const ra = o.tileA ? o.tileA(x.k, t) : o.rowA ? o.rowA(x.r, t) : 1; if (ra <= 0) continue;  // tileA: each tile appears with its plant
      const gk = x.k === 0 && !o.growsToday ? 1 : o.growth(x.k, t);  // growsToday: day 1 grows in too
      const pal = x.k === 0 && !o.growsToday ? TODAYP : gk > 0 || o.soilAlways ? SOIL : FUTG;  // growsToday: no bright today patch; soilAlways: an empty patch is plain soil, not the dim future tile
      tiles += `<g opacity="${ra.toFixed(2)}" transform="translate(0 ${f1((1 - ra) * 14)})">${block(q, pal)}</g>`;
      if (gk > 0) {
        const kind = x.k === 0 ? 'rose' : KINDS[(x.k * 7) % KINDS.length], acc = x.k === 0 ? ROSE : ACC[(x.k * 3) % ACC.length];
        plants += `<g opacity="${ra.toFixed(2)}"><g transform="translate(${f1(cx)} ${f1(cy + 3)}) scale(${(gk * (x.k === 0 ? 1.1 : 1)).toFixed(3)})">${P[kind](sat(acc, SOIL.satK))}</g></g>`;
      }
    }
    const w = 7 * T * GZ;
    return `<svg viewBox="0 0 ${f1(w + 20)} ${f1(height(rows) + 10)}" style="width:100%;display:block;overflow:visible"><g transform="translate(10 ${f1(HEAD * GZ + 4)}) scale(${GZ})">${tiles}${plants}</g></svg>`;
  }
  return { bed, height };
})();

/** The garden bed SVG: g days, c = plants grown so far (float), opts as in the mockup (growth, tileA, …). */
export const garden_bed = GF.bed;

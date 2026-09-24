const FL={b:{n:'Basement',v:'Car',p:'B',c:36,r:40,t:'Cars'},g:{n:'Ground floor',v:'EV',p:'G',c:24,r:30,t:'Electric vehicles'},f:{n:'First floor',v:'Bike',p:'F',c:24,r:15,t:'Bikes'}};
const LOCS=['City Center','Central Station','Airport Road','Riverside Mall'],PRICE={1:499,3:1299,12:4499};
let S={name:'',phone:'',loc:LOCS[0],member:null,hist:[]},T={tab:0,slot:null,fl:null,hrs:1,plan:3,veh:'Car',last:null};
try{Object.assign(S,JSON.parse(localStorage.getItem('pk')||'{}'))}catch(e){}
const save=()=>{try{localStorage.setItem('pk',JSON.stringify(S))}catch(e){}};
const $=s=>document.querySelector(s),inr=n=>'₹'+n.toLocaleString('en-IN'),esc=s=>String(s||'').replace(/[&<>"']/g,c=>'&#'+c.charCodeAt(0)+';');
const dateF=t=>new Date(t).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}),timeF=t=>new Date(t).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'});
const isMember=()=>S.member&&S.member.until>Date.now();
const busy=(f,i)=>{const n=FL[f].p+i;return (i*7+f.charCodeAt(0))%5===0||S.hist.some(h=>h.slot===n&&Date.now()<h.at+h.hours*36e5)};
const free=f=>Array.from({length:FL[f].c},(_,i)=>i+1).filter(i=>!busy(f,i)).length;
const bill=()=>{const sub=FL[T.fl].r*T.hrs,d=isMember()?Math.round(sub*.2):0;return{sub,d,total:sub-d}};
const IC={home:'<path d="M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',hist:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',user:'<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>',pin:'<path d="M12 21s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12z"/><circle cx="12" cy="9" r="2.5"/>',back:'<path d="M15 5l-7 7 7 7"/>',check:'<path d="M5 12l5 5 9-10"/>'};
const ic=n=>`<svg class="i" viewBox="0 0 24 24" aria-hidden="true">${IC[n]}</svg>`;
const back=h=>`<button class="back" data-go="${h}">${ic('back')}Back</button>`;
const tick=`<div class="tick">${ic('check')}</div>`;
function qr(seed){let h=0;for(const c of seed)h=(h*31+c.charCodeAt(0))>>>0;const rnd=()=>(h=(h*1664525+1013904223)>>>0)/4294967296;let o='';
 for(let y=0;y<21;y++)for(let x=0;x<21;x++){const fx=x<7?0:x>13?14:-1,fy=y<7?0:y>13?14:-1;let v;
  if(fx>=0&&fy>=0&&!(fx&&fy)){const dx=x-fx,dy=y-fy;v=dx%6==0||dy%6==0||(dx>1&&dx<5&&dy>1&&dy<5)}else v=rnd()>.5;
  if(v)o+=`<rect x="${x}" y="${y}" width="1.02" height="1.02"/>`}
 return `<svg class="qr" viewBox="0 0 21 21" role="img" aria-label="Entry QR code">${o}</svg>`}
const card=m=>`<div class="pcard"><b>ParkEase Premium</b><span>${esc(S.name)||'Member'}</span><small>ID ${m.id} · Valid till ${dateF(m.until)}</small></div>`;

const V={
splash(){setTimeout(()=>{if(!location.hash||location.hash==='#/splash')location.hash='#/home'},2300);
 return `<section class="splash"><div class="top"><span>${timeF(Date.now())}</span><span>Parking made easy</span></div><div class="mid"><div class="logo">P</div><h1>ParkEase</h1><p class="mute">Find a spot. Park stress-free.</p></div><div class="load"><i></i></div></section>`},
home(){return `<div class="row"><label class="loc">${ic('pin')}<select id="loc" aria-label="Location">${LOCS.map(l=>`<option${l==S.loc?' selected':''}>${l}</option>`).join('')}</select></label></div>
 <h1>Find the best parking in your locality.</h1><p class="mute">Pick a floor to see open slots near ${esc(S.loc)}.</p>
 <div class="grid3">${Object.entries(FL).map(([k,f])=>`<button class="card" data-go="#/floor/${k}"><span class="tile">${f.p}</span><span><b>${f.n}</b><small>${f.t} · ${inr(f.r)}/hr</small></span><em>${free(k)} free</em></button>`).join('')}</div>
 ${isMember()?'':`<button class="banner" data-go="#/member"><b>Be a member</b><small>Save 20% on every parking</small></button>`}`},
floor(k){const f=FL[k];if(!f)return V.home();if(T.fl!==k){T.fl=k;T.tab=0;T.slot=null}
 let s='';for(let i=T.tab*12+1;i<=T.tab*12+12;i++){const n=f.p+i;s+=`<button class="slot${T.slot===n?' sel':''}" ${busy(k,i)?'disabled':''} data-act="pick" data-i="${n}" aria-label="Slot ${n}">${n}</button>`}
 return `${back('#/home')}<h1>${f.n}</h1><p class="mute">${f.t} · ${inr(f.r)}/hr. Choose slot</p>
 <div class="tabs">${Array.from({length:f.c/12},(_,t)=>`<button class="tab${T.tab==t?' sel':''}" data-act="tab" data-i="${t}">${t*12+1}–${t*12+12}</button>`).join('')}</div>
 <div class="legend"><span><i></i>Free</span><span><i style="background:var(--soft)"></i>Taken</span><span><i style="background:var(--acc);border-color:var(--acc)"></i>Yours</span></div>
 <div class="slots">${s}</div>
 <div class="bar2"><span>${T.slot?`Slot <b>${T.slot}</b>`:'Select a slot'}</span><button class="btn" ${T.slot?'':'disabled'} data-go="#/book">Book now</button></div>`},
book(){if(!T.slot)return V.home();const f=FL[T.fl],b=bill();
 return `${back('#/floor/'+T.fl)}<h1>Book your slot</h1>
 <div class="list"><div class="r"><span>Vehicle type</span><b>${f.v}</b></div><div class="r"><span>Slot no.</span><b>${T.slot}</b></div>
 <div class="r"><span>No. of hours</span><span class="step"><button data-act="hrs" data-d="-1" aria-label="Fewer hours">−</button><b>${T.hrs}</b><button data-act="hrs" data-d="1" aria-label="More hours">+</button></span></div></div>
 <h2>Your bill</h2><div class="list"><div class="r"><span>${inr(f.r)} × ${T.hrs} hr</span><b>${inr(b.sub)}</b></div>${b.d?`<div class="r ok"><span>Member discount (20%)</span><b>−${inr(b.d)}</b></div>`:''}<div class="r tot"><span>Total</span><b>${inr(b.total)}</b></div></div>
 ${isMember()?'':'<button class="link" data-go="#/member">Members save 20%. See plans</button>'}
 <div class="bar2"><button class="btn full" data-act="payBook">Pay using UPI</button></div>`},
paid(){const h=T.last;if(!h)return V.home();
 return `<div class="done">${tick}<h1>Payment successful</h1><p class="mute">Show this QR at the gate.</p></div>
 <div class="ticket">${qr(h.id)}<div class="list"><div class="r"><span>Booking ID</span><b>${h.id}</b></div><div class="r"><span>Vehicle type</span><b>${h.vehicle}</b></div><div class="r"><span>Slot no.</span><b>${h.slot}</b></div><div class="r"><span>No. of hours</span><b>${h.hours}</b></div><div class="r"><span>Paid</span><b>${inr(h.amount)}</b></div></div></div>
 <button class="btn full" data-go="#/home">Thanks for choosing us</button>`},
profile(){const m=isMember();
 return `<div class="who"><span class="av">${esc((S.name||'G')[0].toUpperCase())}</span><div><h1>${esc(S.name)||'Guest'}</h1><p class="mute">Profile settings</p></div></div>
 <details><summary>Account</summary><div class="pad"><label>Name<input id="nm" value="${esc(S.name)}" autocomplete="name"></label><label>Phone<input id="ph" inputmode="tel" value="${esc(S.phone)}" autocomplete="tel"></label><button class="btn" data-act="saveP">Save changes</button></div></details>
 <details><summary>Membership</summary><div class="pad"><p>${m?`Premium member until ${dateF(S.member.until)}.`:'You are not a member yet.'}</p><button class="btn" data-go="#/member">${m?'View membership':'Be a member'}</button></div></details>
 <details><summary>About us</summary><div class="pad"><p class="mute">ParkEase helps drivers find and book a parking slot before they arrive. Choose a floor, pick a slot, pay by UPI and walk in with a QR code.</p></div></details>
 <details><summary>Legal and policies</summary><div class="pad"><p class="mute"><b>Terms.</b> A booking holds your slot for the hours you paid for. Overstays are charged at the hourly rate.</p><p class="mute"><b>Privacy.</b> Your details stay on this device and are never sold.</p><p class="mute"><b>Refunds.</b> Cancel before your booking starts for a full refund.</p></div></details>
 <footer><p>© ParkEase. Park smarter.</p><button data-act="clear">Clear all data on this device</button></footer>`},
member(){const m=isMember();
 return `${back('#/profile')}<h1>Be a member</h1><p class="mute">A member pays less on every daily parking: 20% off all parkings, for as long as the plan runs.</p>
 ${m?card(S.member):''}<h2>${m?'Extend your plan':'Choose a plan'}</h2>
 <div class="plans">${[1,3,12].map(n=>`<button class="plan${T.plan==n?' sel':''}" data-act="plan" data-m="${n}"><b>${n==1?'1 month':n+' months'}</b><small>${inr(PRICE[n])}</small></button>`).join('')}</div>
 <h2>Vehicle type</h2><div class="chips">${['Car','EV','Bike'].map(v=>`<button class="chip${T.veh==v?' sel':''}" data-act="veh" data-v="${v}">${v}</button>`).join('')}</div>
 <div class="bar2"><span><b>${inr(PRICE[T.plan])}</b></span><button class="btn" data-act="payMem">Pay using UPI</button></div>`},
mpaid(){const m=S.member;if(!m)return V.home();
 return `<div class="done">${tick}<h1>Payment successful</h1><p class="mute">Welcome to Premium.</p></div>
 <div class="list"><div class="r"><span>Vehicle type</span><b>${m.vehicle}</b></div><div class="r"><span>Slot no.</span><b>Any available</b></div><div class="r"><span>Validity</span><b>${dateF(m.until)}</b></div></div>
 ${card(m)}<button class="btn full" data-go="#/home">Thanks for choosing us</button>`},
history(){const l=S.hist;
 return `<h1>Parking history</h1><p class="mute">Your past and current bookings.</p>`+(l.length?l.map(h=>{const on=Date.now()<h.at+h.hours*36e5;
  return `<div class="hcard"><div class="r"><b>${h.slot}</b><span class="pill${on?' on':''}">${on?'Active':'Completed'}</span></div><div class="r"><span>Date</span><b>${dateF(h.at)}</b></div><div class="r"><span>Time</span><b>${timeF(h.at)}, ${h.hours} hr</b></div><div class="r"><span>Vehicle type</span><b>${h.vehicle}</b></div><div class="r"><span>Paid</span><b>${inr(h.amount)}</b></div></div>`}).join(''):`<div class="empty"><p>No parking yet. Your bookings will show up here.</p><button class="btn" data-go="#/home">Find parking</button></div>`)}
};

function render(keep){const [,r,a]=location.hash.split('/'),route=V[r]?r:'splash';
 $('#app').innerHTML=V[route](a);const nav=$('#nav');nav.hidden=route==='splash';
 const cur=({floor:'home',book:'home',paid:'home',member:'profile',mpaid:'profile'})[route]||route;
 nav.innerHTML=[['home','Home'],['history','History'],['profile','Profile']].map(([k,l])=>`<a href="#/${k}" class="${cur==k?'on':''}"${cur==k?' aria-current="page"':''}>${ic(k=='history'?'hist':k=='profile'?'user':'home')}${l}</a>`).join('');
 if(!keep)scrollTo(0,0)}

function sheet(amount,title,done){const o=document.createElement('div');o.className='ov';
 o.innerHTML=`<div class="sheet" role="dialog" aria-label="Pay using UPI"><h2 style="margin:0">Pay using UPI</h2><p class="mute" style="margin:0">${title} · <b>${inr(amount)}</b></p><input id="upi" placeholder="yourname@bank" autocomplete="off" autocapitalize="none"><div class="chips">${['@okaxis','@ybl','@paytm','@upi'].map(s=>`<button class="chip" data-s="${s}">${s}</button>`).join('')}</div><p class="err" id="err" role="alert"></p><button class="btn full" id="go">Pay ${inr(amount)}</button><button class="ghost" id="cx">Cancel</button></div>`;
 document.body.appendChild(o);const u=o.querySelector('#upi'),go=o.querySelector('#go'),er=o.querySelector('#err');u.focus();
 o.onclick=e=>{if(e.target===o||e.target.id==='cx')o.remove();const s=e.target.dataset.s;if(s){u.value=u.value.split('@')[0]+s;u.focus()}};
 go.onclick=()=>{if(!/^[\w.\-]{2,}@[a-zA-Z]{2,}$/.test(u.value.trim())){er.textContent='Enter a valid UPI ID, like name@bank.';u.focus();return}
  er.textContent='';go.disabled=true;go.textContent='Waiting for approval…';setTimeout(()=>{o.remove();done()},1500)}}

const A={
 tab:e=>{T.tab=+e.dataset.i;render(1)},
 pick:e=>{T.slot=T.slot===e.dataset.i?null:e.dataset.i;render(1)},
 hrs:e=>{T.hrs=Math.min(12,Math.max(1,T.hrs+ +e.dataset.d));render(1)},
 plan:e=>{T.plan=+e.dataset.m;render(1)},
 veh:e=>{T.veh=e.dataset.v;render(1)},
 payBook:()=>{const b=bill(),f=FL[T.fl];sheet(b.total,`Slot ${T.slot}, ${T.hrs} hr`,()=>{
  const h={id:'PK'+Date.now().toString(36).toUpperCase().slice(-6),slot:T.slot,vehicle:f.v,hours:T.hrs,amount:b.total,at:Date.now()};
  S.hist.unshift(h);save();T.last=h;T.slot=null;T.hrs=1;location.hash='#/paid'})},
 payMem:()=>sheet(PRICE[T.plan],'Premium membership',()=>{
  const base=isMember()?S.member.until:Date.now();
  S.member={id:'PR'+Date.now().toString(36).toUpperCase().slice(-5),plan:T.plan,vehicle:T.veh,until:base+T.plan*30*864e5};save();location.hash='#/mpaid'}),
 saveP:()=>{S.name=$('#nm').value.trim();S.phone=$('#ph').value.trim();save();render(1);document.querySelector('details').open=true},
 clear:()=>{if(confirm('Clear your profile, membership and history?')){S={name:'',phone:'',loc:LOCS[0],member:null,hist:[]};save();T.slot=null;location.hash='#/home';render()}}
};
document.addEventListener('click',e=>{const el=e.target.closest('[data-go],[data-act]');if(!el)return;el.dataset.go?location.hash=el.dataset.go:A[el.dataset.act](el)});
document.addEventListener('change',e=>{if(e.target.id==='loc'){S.loc=e.target.value;save();render(1)}});
addEventListener('hashchange',()=>render());
render();

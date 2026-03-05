// ════════ NOTIFICATIONS ════════
function buildNotifications(){
  if(!D.settings.alertsEnabled){D.notifications=[];return}
  const notifs=[];
  const now=new Date();
  const md=getME();
  const ge=md.filter(e=>e.type==='gider');

  // Budget alerts
  D.budgets.forEach(b=>{
    const spent=ge.filter(e=>e.category===b.cat).reduce((s,e)=>s+e.amount,0);
    const pct=(spent/b.limit)*100;
    if(pct>=100)notifs.push({id:'bgt_'+b.id,type:'red',icon:'📊',title:`${b.cat} limiti aşıldı`,sub:`${fc(spent)} harcandı / ${fc(b.limit)} limit`});
    else if(pct>=80)notifs.push({id:'bgt_warn_'+b.id,type:'amber',icon:'📊',title:`${b.cat} limite yaklaşıyor`,sub:`%${Math.round(pct)} kullanıldı`});
  });

  // Debt due alerts
  D.debts.filter(d=>d.type==='borc'&&d.paid<d.total).forEach(d=>{
    if(!d.due)return;
    const due=new Date(d.due);
    const diff=Math.ceil((due-now)/(1000*60*60*24));
    if(diff<0)notifs.push({id:'debt_ov_'+d.id,type:'red',icon:'⚠',title:`Vadesi geçmiş: ${d.name}`,sub:`${Math.abs(diff)} gün gecikmiş · ${fc(d.total-d.paid)} kaldı`});
    else if(diff<=7)notifs.push({id:'debt_due_'+d.id,type:'amber',icon:'⚠',title:`Vade yaklaşıyor: ${d.name}`,sub:`${diff} gün kaldı · ${fc(d.total-d.paid)}`});
  });

  // Goal completions
  D.goals.filter(g=>g.current>=g.target).forEach(g=>{
    notifs.push({id:'goal_done_'+g.id,type:'green',icon:'🎯',title:`Hedef tamamlandı: ${g.name}`,sub:'Tebrikler!'});
  });

  D.notifications=notifs;
}
function renderNotifications(){
  buildNotifications();
  const n=D.notifications;
  const badge=el('notifBadge');
  if(n.length){badge.textContent=n.length;badge.style.display='block'}
  else{badge.style.display='none'}
  const list=el('notifList');
  if(!n.length){list.innerHTML=`<div class="notif-empty">Bildirim yok ✓</div>`;return}
  list.innerHTML=n.map(x=>`
    <div class="notif-item">
      <div class="notif-ico ${x.type==='red'?'bg-red':x.type==='amber'?'bg-amber':'bg-green'}">${x.icon}</div>
      <div class="notif-body"><div class="notif-t">${x.title}</div><div class="notif-s">${x.sub}</div></div>
    </div>`).join('');
}
function toggleNotif(){
  const p=el('notifPanel');
  p.classList.toggle('off');
}
function clearNotifs(){D.notifications=[];renderNotifications();el('notifPanel').classList.add('off')}

// ════════ RENDER ALL ════════
function renderAll(){
  document.getElementById('mnLabel').textContent=MONTHS[vDate.getMonth()]+' '+vDate.getFullYear();
  populateSels();
  renderOzet();renderTxPage();renderAnaliz();renderCalendar();
  renderAccounts();renderDebts();renderHedefler();renderTekrarlayan();
  renderSettings();renderSummaryPanel();renderNotifications();renderTemplates();renderCustomCats();
}

// ════════ ÖZET ════════
function renderOzet(){
  const md=getME();
  const tG=md.filter(e=>e.type==='gelir').reduce((s,e)=>s+e.amount,0);
  const tR=md.filter(e=>e.type==='gider').reduce((s,e)=>s+e.amount,0);
  const net=tG-tR;const pct=tG>0?Math.min((tR/tG)*100,100):0;
  el('ozetSub').textContent=MONTHS[vDate.getMonth()]+' '+vDate.getFullYear()+' · '+md.length+' işlem';
  const totalDebt=D.debts.filter(d=>d.type==='borc').reduce((s,d)=>s+(d.total-d.paid),0);
  el('kpiRow').innerHTML=`
    <div class="card kpi"><div class="kpi-glow" style="background:var(--green-d)"></div>
      <div class="kpi-top"><div class="kpi-icon ic-green">↑</div><span class="chip bg-green c-green">${md.filter(e=>e.type==='gelir').length} kayıt</span></div>
      <div class="kpi-lbl">Toplam Gelir</div><div class="kpi-val c-green">${fc(tG)}</div></div>
    <div class="card kpi"><div class="kpi-glow" style="background:var(--red-d)"></div>
      <div class="kpi-top"><div class="kpi-icon ic-red">↓</div><span class="chip bg-red c-red">${md.filter(e=>e.type==='gider').length} kayıt</span></div>
      <div class="kpi-lbl">Toplam Gider</div><div class="kpi-val c-red">${fc(tR)}</div></div>
    <div class="card kpi"><div class="kpi-glow" style="background:var(--violet-d)"></div>
      <div class="kpi-top"><div class="kpi-icon ic-violet">◈</div><span class="chip bg-violet c-violet">${net>=0?'▲ Fazla':'▼ Açık'}</span></div>
      <div class="kpi-lbl">Net Bakiye</div><div class="kpi-val" style="color:${net>=0?'var(--green2)':'var(--red2)'}">${fc(Math.abs(net))}</div></div>
    <div class="card kpi"><div class="kpi-glow" style="background:var(--amber-d)"></div>
      <div class="kpi-top"><div class="kpi-icon ic-amber">⚠</div><span class="chip bg-amber c-amber">${D.debts.filter(d=>d.type==='borc'&&d.paid<d.total).length} aktif</span></div>
      <div class="kpi-lbl">Toplam Borç</div><div class="kpi-val c-amber">${fc(totalDebt)}</div></div>`;
  const C=2*Math.PI*42;
  if(tG+tR===0){
    el('dG').setAttribute('stroke-dasharray',`0 ${C}`);el('dR').setAttribute('stroke-dasharray',`0 ${C}`);el('donutV').textContent='—';
  } else {
    const gS=(tG/(tG+tR))*C,rS=(tR/(tG+tR))*C,gap=3;
    el('dG').setAttribute('stroke-dasharray',`${Math.max(0,gS-gap)} ${C}`);el('dG').setAttribute('stroke-dashoffset','0');
    el('dR').setAttribute('stroke-dasharray',`${Math.max(0,rS-gap)} ${C}`);el('dR').setAttribute('stroke-dashoffset',`-${gS}`);
    el('donutV').textContent='%'+Math.round(pct);
  }
  el('lgG').textContent=fc(tG);el('lgR').textContent=fc(tR);
  el('lgN').textContent=(net>=0?'+':'-')+fc(Math.abs(net));el('lgN').style.color=net>=0?'var(--green2)':'var(--red2)';
  el('progF').style.width=pct+'%';el('progPct').textContent='%'+Math.round(pct);el('progLbl').textContent='%'+Math.round(pct)+' harcandı';
  renderLineChart();
  const r=md.slice(0,7);
  el('ozetTx').innerHTML=r.length?r.map((e,i)=>txRow(e,i)).join(''):`<div class="empty"><div class="empty-i">∅</div><div class="empty-t">Kayıt yok</div></div>`;
  renderOzetBudget(md);
}
function renderOzetBudget(md){
  if(!D.budgets.length){el('ozetBudget').innerHTML=`<div style="font-size:.7rem;color:var(--t3);padding:8px 0">Henüz limit yok</div>`;return}
  const ge=md.filter(e=>e.type==='gider');
  el('ozetBudget').innerHTML=D.budgets.slice(0,4).map(b=>{
    const s=ge.filter(e=>e.category===b.cat).reduce((x,e)=>x+e.amount,0);
    const p=Math.min((s/b.limit)*100,100);const ov=s>b.limit;
    return `<div class="goal-item"><div class="goal-top"><div class="goal-name">${ICONS[b.cat]||'◈'} ${b.cat}</div><div class="goal-pct" style="color:${ov?'var(--red2)':p>80?'var(--amber2)':'var(--green2)'}">${Math.round(p)}%</div></div>
      <div class="goal-sub">${fc(s)} / ${fc(b.limit)}</div>
      <div class="prog"><div class="pf" style="width:${p}%;background:${ov?'var(--red)':p>80?'var(--amber)':'var(--green)'}"></div></div></div>`;
  }).join('');
}

// ════════ LINE CHART ════════
function renderLineChart(){
  const svg=el('lineChart');
  const W=580,H=160,pad={t:16,b:28,l:36,r:16};
  const months=[];
  for(let i=5;i>=0;i--){
    const d=new Date(vDate.getFullYear(),vDate.getMonth()-i,1);
    const me=D.entries.filter(e=>{const ed=new Date(e.date);return ed.getMonth()===d.getMonth()&&ed.getFullYear()===d.getFullYear()});
    const g=me.filter(e=>e.type==='gelir').reduce((s,e)=>s+e.amount,0);
    const r=me.filter(e=>e.type==='gider').reduce((s,e)=>s+e.amount,0);
    months.push({l:MONTHS[d.getMonth()].slice(0,3),g,r,n:g-r});
  }
  const maxV=Math.max(...months.flatMap(m=>[m.g,m.r,Math.abs(m.n)]),1);
  const iW=(W-pad.l-pad.r)/(months.length-1);
  const iH=H-pad.t-pad.b;
  const px=i=>pad.l+i*iW;
  const py=v=>pad.t+iH-Math.max(0,v)/maxV*iH;
  const gPts=months.map((m,i)=>`${px(i)},${py(m.g)}`).join(' ');
  const rPts=months.map((m,i)=>`${px(i)},${py(m.r)}`).join(' ');
  const nPts=months.map((m,i)=>`${px(i)},${py(m.n)}`).join(' ');
  const grids=[0,.25,.5,.75,1].map(r=>`<polyline points="${pad.l},${pad.t+iH-r*iH} ${W-pad.r},${pad.t+iH-r*iH}" class="cg"/>`).join('');
  svg.innerHTML=`<defs>
    <linearGradient id="gG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#34d399" stop-opacity=".35"/><stop offset="100%" stop-color="#34d399" stop-opacity="0"/></linearGradient>
    <linearGradient id="rG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#f87171" stop-opacity=".25"/><stop offset="100%" stop-color="#f87171" stop-opacity="0"/></linearGradient>
  </defs>${grids}
  <polygon points="${px(0)},${pad.t+iH} ${gPts} ${px(5)},${pad.t+iH}" fill="url(#gG)"/>
  <polygon points="${px(0)},${pad.t+iH} ${rPts} ${px(5)},${pad.t+iH}" fill="url(#rG)"/>
  <polyline points="${gPts}" class="lp" stroke="var(--green2)"/>
  <polyline points="${rPts}" class="lp" stroke="var(--red2)"/>
  <polyline points="${nPts}" class="lp" stroke="var(--violet2)" stroke-dasharray="4 3"/>
  ${months.map((m,i)=>`<circle cx="${px(i)}" cy="${py(m.g)}" r="3.5" fill="var(--green2)"/>
    <circle cx="${px(i)}" cy="${py(m.r)}" r="3.5" fill="var(--red2)"/>
    <text x="${px(i)}" y="${H-4}" class="cl" text-anchor="middle">${m.l}</text>`).join('')}`;
}

// ════════ TX PAGE ════════
function renderTxPage(){
  const md=getME();let f=txF==='all'?md:md.filter(e=>e.type===txF);
  const s=(el('txSearch')||{}).value||'';
  if(s)f=f.filter(e=>e.desc.toLowerCase().includes(s.toLowerCase())||(e.category||'').toLowerCase().includes(s.toLowerCase())||(e.tag||'').toLowerCase().includes(s.toLowerCase()));
  el('txSub').textContent=f.length+' kayıt · '+MONTHS[vDate.getMonth()]+' '+vDate.getFullYear();
  el('txList').innerHTML=f.length?f.map((e,i)=>txRow(e,i)).join(''):`<div class="empty"><div class="empty-i">∅</div><div class="empty-t">Kayıt bulunamadı</div></div>`;
  const cats=[...new Set(md.map(e=>e.category))];
  el('catChips').innerHTML=cats.map(c=>`<button class="fc btn-sm" data-action="filter-cat" data-cat="${eH(c)}">${ICONS[c]||'◈'} ${eH(c)}</button>`).join('');
}
function setTxF(f,btn){txF=f;document.querySelectorAll('#page-islemler .fc').forEach(b=>b.classList.remove('on'));btn.classList.add('on');renderTxPage()}
function filterCat(c){el('txSearch').value=c;renderTxPage()}

// ════════ CALENDAR ════════
function renderCalendar(){
  const y=vDate.getFullYear(),m=vDate.getMonth();
  el('calTitle').textContent=MONTHS[m]+' '+y;
  const grid=el('calGrid');if(!grid)return;
  // Day headers
  let html=DAYS_TR.map(d=>`<div class="cal-hd-cell">${d}</div>`).join('');
  const firstDay=new Date(y,m,1);
  let startDow=firstDay.getDay()-1;if(startDow<0)startDow=6; // Mon=0
  const daysInMonth=new Date(y,m+1,0).getDate();
  const today=new Date();
  // Prev month fill
  const prevDays=new Date(y,m,0).getDate();
  for(let i=startDow-1;i>=0;i--){
    html+=`<div class="cal-cell other-month"><div class="cal-day">${prevDays-i}</div></div>`;
  }
  // This month
  for(let d=1;d<=daysInMonth;d++){
    const dateStr=`${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const dayEntries=D.entries.filter(e=>e.date&&e.date.startsWith(dateStr));
    const isToday=today.getDate()===d&&today.getMonth()===m&&today.getFullYear()===y;
    const dayG=dayEntries.filter(e=>e.type==='gelir').reduce((s,e)=>s+e.amount,0);
    const dayR=dayEntries.filter(e=>e.type==='gider').reduce((s,e)=>s+e.amount,0);
    const txPreview=dayEntries.slice(0,2).map(e=>`<div class="cal-tx-dot"><span style="width:4px;height:4px;border-radius:50%;background:${e.type==='gelir'?'var(--green2)':'var(--red2)'};flex-shrink:0;display:inline-block;margin-right:2px"></span><span class="cal-tx-amt" style="color:${e.type==='gelir'?'var(--green2)':'var(--red2)'}">${e.type==='gelir'?'+':'-'}${fc(e.amount)}</span></div>`).join('');
    const more=dayEntries.length>2?`<div style="font-size:.48rem;color:var(--t4);font-family:'JetBrains Mono',monospace">+${dayEntries.length-2}</div>`:'';
    html+=`<div class="cal-cell${isToday?' today':''}" data-action="select-day" data-date="${dateStr}" data-day="${d}">
      <div class="cal-day">${d}</div>
      ${txPreview}${more}
      ${dayEntries.length?`<div class="cal-day-total" style="color:${dayG-dayR>=0?'var(--green2)':'var(--red2)'}">${dayG-dayR>=0?'+':'-'}${fc(Math.abs(dayG-dayR))}</div>`:''}
    </div>`;
  }
  // Next month fill
  const totalCells=Math.ceil((startDow+daysInMonth)/7)*7;
  for(let i=1;i<=totalCells-startDow-daysInMonth;i++){
    html+=`<div class="cal-cell other-month"><div class="cal-day">${i}</div></div>`;
  }
  grid.innerHTML=html;
}
function selectCalDay(dateStr,dayNum){
  calSelDay=dateStr;
  const detail=el('calDayDetail');const dayTx=el('calDayTx');const dayTitle=el('calDayTitle');
  const entries=D.entries.filter(e=>e.date&&e.date.startsWith(dateStr));
  detail.style.display='block';
  dayTitle.textContent=dayNum+' '+MONTHS[vDate.getMonth()]+' '+vDate.getFullYear();
  dayTx.innerHTML=entries.length?entries.map((e,i)=>txRow(e,i)).join(''):`<div class="empty"><div class="empty-i">∅</div><div class="empty-t">Bu gün işlem yok</div></div>`;
  detail.scrollIntoView({behavior:'smooth',block:'nearest'});
}

// ════════ ANALIZ ════════
function renderAnaliz(){
  const md=getME();
  const ge=md.filter(e=>e.type==='gider');const gi=md.filter(e=>e.type==='gelir');
  const catR={},catI={};
  ge.forEach(e=>{catR[e.category]=(catR[e.category]||0)+e.amount});
  gi.forEach(e=>{catI[e.category]=(catI[e.category]||0)+e.amount});
  const totR=Object.values(catR).reduce((s,v)=>s+v,0)||1;
  const totI=Object.values(catI).reduce((s,v)=>s+v,0)||1;
  const catBlock=(obj,tot,colorVar)=>Object.entries(obj).sort((a,b)=>b[1]-a[1]).map(([cat,val])=>{
    const p=(val/tot)*100;
    return `<div style="margin-bottom:10px"><div class="leg-row" style="margin-bottom:3px"><div class="leg-l">${ICONS[cat]||'◈'} ${eH(cat)}</div><div class="leg-r">${fc(val)}</div></div>
      <div class="prog"><div class="pf" style="width:${p}%;background:${colorVar}"></div></div></div>`;
  }).join('')||`<div class="empty-t" style="padding:16px 0">Kayıt yok</div>`;
  el('catGider').innerHTML=catBlock(catR,totR,'var(--red)');
  el('catGelir').innerHTML=catBlock(catI,totI,'var(--green)');
  const months=[];
  for(let i=5;i>=0;i--){
    const d=new Date(vDate.getFullYear(),vDate.getMonth()-i,1);
    const me=D.entries.filter(e=>{const ed=new Date(e.date);return ed.getMonth()===d.getMonth()&&ed.getFullYear()===d.getFullYear()});
    months.push({l:MONTHS[d.getMonth()].slice(0,3),g:me.filter(e=>e.type==='gelir').reduce((s,e)=>s+e.amount,0),r:me.filter(e=>e.type==='gider').reduce((s,e)=>s+e.amount,0)});
  }
  const maxV=Math.max(...months.flatMap(m=>[m.g,m.r]),1);
  el('barChart').innerHTML=months.map(m=>{
    const gH=Math.max(2,(m.g/maxV)*90),rH=Math.max(2,(m.r/maxV)*90);
    return `<div class="bc"><div class="bp"><div class="b bg" style="height:${gH}px" data-v="${fc(m.g)}"></div><div class="b br" style="height:${rH}px" data-v="${fc(m.r)}"></div></div><div class="bl">${m.l}</div></div>`;
  }).join('');
  const tG=gi.reduce((s,e)=>s+e.amount,0),tR=ge.reduce((s,e)=>s+e.amount,0),net=tG-tR;
  el('monthlySummary').innerHTML=`
    <div class="leg-row"><div class="leg-l"><div class="leg-dot" style="background:var(--green2)"></div>Gelir</div><div class="leg-r c-green">${fc(tG)}</div></div>
    <div class="leg-row"><div class="leg-l"><div class="leg-dot" style="background:var(--red2)"></div>Gider</div><div class="leg-r c-red">${fc(tR)}</div></div>
    <div class="divider"></div>
    <div class="leg-row"><div class="leg-l"><div class="leg-dot" style="background:var(--violet2)"></div>Net</div><div class="leg-r" style="color:${net>=0?'var(--green2)':'var(--red2)'}">${net>=0?'+':'-'}${fc(Math.abs(net))}</div></div>
    <div class="divider"></div>
    <div style="font-size:.72rem;color:var(--t2)">İşlem: <strong>${md.length}</strong></div>
    <div style="font-size:.72rem;color:var(--t2);margin-top:4px">En büyük gider: <strong>${eH(Object.entries(catR).sort((a,b)=>b[1]-a[1])[0]?.[0]||'—')}</strong></div>`;
}

// ════════ ACCOUNTS ════════
function renderAccounts(){
  el('accGrid').innerHTML=D.accounts.map(a=>{
    const bal=D.entries.filter(e=>e.accountId==a.id).reduce((s,e)=>e.type==='gelir'?s+e.amount:s-e.amount,a.balance);
    return `<div class="acc-card ${selAcc===a.id?'sel':''}" data-action="select-account" data-id="${eH(a.id)}" style="${selAcc===a.id?`border-color:${a.color};background:${a.color}18`:'background:var(--s1)'}">
      <div class="acc-stripe" style="background:${a.color}"></div>
      <div class="acc-type">${ACC_TYPE_L[a.type]||a.type}</div>
      <div class="acc-name">${eH(a.name)}</div>
      <div class="acc-bal" style="color:${a.color}">${fc(bal)}</div>
      ${a.num?`<div class="acc-num">•••• ${eH(a.num)}</div>`:''}
      <div class="acc-foot">
        <span style="font-size:.65rem;color:var(--t3)">${D.entries.filter(e=>e.accountId==a.id).length} işlem</span>
        <button class="btn btn-ghost btn-xs" data-action="delete-account" data-id="${eH(a.id)}">Sil</button>
      </div>
    </div>`;
  }).join('');
  const accEs=selAcc?D.entries.filter(e=>e.accountId==selAcc):getME();
  const acc=selAcc?D.accounts.find(a=>a.id===selAcc):null;
  el('accTxTitle').textContent=acc?`— ${acc.name}`:'';
  el('accTxList').innerHTML=accEs.slice(0,15).length?accEs.slice(0,15).map((e,i)=>txRow(e,i)).join(''):`<div class="empty"><div class="empty-i">∅</div><div class="empty-t">İşlem yok</div></div>`;
}

// ════════ DEBTS ════════
function renderDebts(){
  const borcs=D.debts.filter(d=>d.type==='borc');
  const alacaks=D.debts.filter(d=>d.type==='alacak');
  const totalB=borcs.reduce((s,d)=>s+(d.total-d.paid),0);
  const totalA=alacaks.reduce((s,d)=>s+(d.total-d.paid),0);
  const overdueB=borcs.filter(d=>d.due&&new Date(d.due)<new Date()&&d.paid<d.total).length;
  el('debtBadge').style.display=overdueB?'block':'none';
  el('debtKpi').innerHTML=`
    <div class="card kpi"><div class="kpi-glow" style="background:var(--red-d)"></div><div class="kpi-icon ic-red">↑</div><div class="kpi-lbl">Toplam Borç</div><div class="kpi-val c-red">${fc(totalB)}</div></div>
    <div class="card kpi"><div class="kpi-glow" style="background:var(--green-d)"></div><div class="kpi-icon ic-green">↓</div><div class="kpi-lbl">Toplam Alacak</div><div class="kpi-val c-green">${fc(totalA)}</div></div>
    <div class="card kpi"><div class="kpi-glow" style="background:var(--amber-d)"></div><div class="kpi-icon ic-amber">⚠</div><div class="kpi-lbl">Vadesi Geçmiş</div><div class="kpi-val c-amber">${overdueB} borç</div></div>
    <div class="card kpi"><div class="kpi-glow" style="background:var(--violet-d)"></div><div class="kpi-icon ic-violet">◈</div><div class="kpi-lbl">Toplam Aktif</div><div class="kpi-val c-violet">${D.debts.filter(d=>d.paid<d.total).length} kayıt</div></div>`;
  const debtBlock=(items)=>items.length?items.map(d=>{
    const rem=d.total-d.paid;const pct=Math.min((d.paid/d.total)*100,100);
    const overdue=d.due&&new Date(d.due)<new Date()&&rem>0;
    const dueDate=d.due?new Date(d.due).toLocaleDateString('tr-TR'):'—';
    return `<div class="debt-item">
      <div class="debt-top"><div class="debt-name">${ICONS[d.cat]||'◈'} ${eH(d.name)}<span class="debt-type ${overdue?'bg-red c-red':'bg-amber c-amber'}">${eH(d.cat)}</span>${rem<=0?`<span class="chip bg-green c-green">✓</span>`:''}</div><button class="tx-del" data-action="delete-debt" data-id="${eH(d.id)}">×</button></div>
      <div class="debt-nums"><span class="debt-total">${fc(rem)} kaldı</span><span class="debt-paid">/ ${fc(d.total)} · ${fc(d.paid)} ödendi</span></div>
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px"><span class="debt-due ${overdue?'bg-red c-red':'bg-amber c-amber'}">${dueDate}</span>${d.note?`<span style="font-size:.65rem;color:var(--t3)">${eH(d.note)}</span>`:''}</div>
      <div class="prog"><div class="pf" style="width:${pct}%;background:${pct>=100?'var(--green)':overdue?'var(--red)':'var(--amber)'}"></div></div>
      ${rem>0?`<button class="btn btn-ghost btn-xs" style="margin-top:8px" data-action="pay-debt" data-id="${eH(d.id)}">Ödeme Ekle</button>`:''}
    </div>`;
  }).join(''):`<div class="empty"><div class="empty-i">∅</div><div class="empty-t">Kayıt yok</div></div>`;
  el('debtList').innerHTML=debtBlock(borcs);
  el('alacakList').innerHTML=debtBlock(alacaks);
}

// ════════ HEDEFLER ════════
function renderHedefler(){
  const md=getME();const ge=md.filter(e=>e.type==='gider');
  el('budgetList').innerHTML=D.budgets.length?D.budgets.map(b=>{
    const s=ge.filter(e=>e.category===b.cat).reduce((x,e)=>x+e.amount,0);
    const p=Math.min((s/b.limit)*100,100);const ov=s>b.limit;
    return `<div class="goal-item"><div class="goal-top"><div class="goal-name">${ICONS[b.cat]||'◈'} ${eH(b.cat)}</div><div style="display:flex;align-items:center;gap:6px"><div class="goal-pct" style="color:${ov?'var(--red2)':p>80?'var(--amber2)':'var(--green2)'}">${Math.round(p)}%</div><button class="tx-del" data-action="delete-budget" data-id="${eH(b.id)}">×</button></div></div>
      <div class="goal-sub">${fc(s)} harcandı / ${fc(b.limit)} limit ${ov?'<span class="chip bg-red c-red">AŞILDI</span>':''}</div>
      <div class="prog"><div class="pf" style="width:${p}%;background:${ov?'var(--red)':p>80?'var(--amber)':'var(--green)'}"></div></div></div>`;
  }).join(''):`<div class="empty"><div class="empty-i">◇</div><div class="empty-t">Limit yok</div></div>`;
  el('goalList').innerHTML=D.goals.length?D.goals.map(g=>{
    const p=Math.min((g.current/g.target)*100,100);const done=p>=100;
    const rem=g.target-g.current;
    const dDate=g.date?new Date(g.date).toLocaleDateString('tr-TR'):'—';
    return `<div class="goal-item"><div class="goal-top"><div class="goal-name">${eH(g.name)} ${done?'🎉':''}</div><div style="display:flex;align-items:center;gap:6px"><div class="goal-pct" style="color:${done?'var(--green2)':'var(--violet2)'}">${Math.round(p)}%</div><button class="tx-del" data-action="delete-goal" data-id="${eH(g.id)}">×</button></div></div>
      <div class="goal-sub">${fc(g.current)} / ${fc(g.target)} · Son: ${dDate}</div>
      <div class="prog"><div class="pf" style="width:${p}%;background:${done?'var(--green)':'var(--violet)'}"></div></div>
      ${!done?`<div style="display:flex;align-items:center;justify-content:space-between;margin-top:6px"><span style="font-size:.65rem;color:var(--t3)">${fc(rem)} kaldı</span><button class="btn btn-ghost btn-xs" data-action="contribute-goal" data-id="${eH(g.id)}">+ Ekle</button></div>`:''}
    </div>`;
  }).join(''):`<div class="empty"><div class="empty-i">◇</div><div class="empty-t">Hedef yok</div></div>`;
  const ok=D.budgets.filter(b=>{const s=ge.filter(e=>e.category===b.cat).reduce((x,e)=>x+e.amount,0);return s<=b.limit}).length;
  el('budgetPerf').innerHTML=D.budgets.length?`<div style="display:flex;align-items:center;gap:20px;flex-wrap:wrap"><div><div style="font-family:'Instrument Serif',serif;font-size:2.2rem">${ok}<span style="font-size:1rem;color:var(--t3)">/${D.budgets.length}</span></div><div style="font-size:.72rem;color:var(--t3)">limit uyumlu</div></div><div class="prog" style="flex:1;min-width:100px"><div class="pf" style="width:${D.budgets.length?(ok/D.budgets.length)*100:0}%;background:var(--green)"></div></div></div><div class="divider"></div>${D.budgets.map(b=>{const s=ge.filter(e=>e.category===b.cat).reduce((x,e)=>x+e.amount,0);const ok2=s<=b.limit;return`<div class="leg-row"><div class="leg-l"><div class="leg-dot" style="background:${ok2?'var(--green2)':'var(--red2)'}"></div>${eH(b.cat)}</div><div style="font-family:'JetBrains Mono',monospace;font-size:.62rem;color:${ok2?'var(--green2)':'var(--red2)'}">${ok2?'✓ OK':'✗ AŞILDI'}</div></div>`}).join('')}`:`<div class="empty-t" style="padding:16px 0">Limit eklenmemiş</div>`;
}

// ════════ TEKRARLAYAN ════════
function renderTekrarlayan(){
  el('recList').innerHTML=D.recurring.length?D.recurring.map(r=>`
    <div class="debt-item"><div class="debt-top"><div class="debt-name"><div style="width:6px;height:6px;border-radius:1px;background:${r.type==='gelir'?'var(--green2)':'var(--red2)'};flex-shrink:0"></div>${eH(r.desc)}</div><button class="tx-del" data-action="delete-recurring" data-id="${eH(r.id)}">×</button></div>
      <div class="debt-nums"><span class="${r.type==='gelir'?'c-green':'c-red'}">${r.type==='gelir'?'+':'-'}${fc(r.amount)}</span></div>
      <div style="font-family:'JetBrains Mono',monospace;font-size:.57rem;color:var(--t3)">${FREQ_L[r.freq]} · Gün ${r.day} · ${eH(r.category)}</div>
    </div>`).join(''):`<div class="empty"><div class="empty-i">↻</div><div class="empty-t">Tekrarlayan yok</div></div>`;
  const exp=D.recurring.filter(r=>r.freq==='monthly');
  el('recExpected').innerHTML=exp.length?exp.map(r=>`<div class="leg-row"><div class="leg-l"><div class="leg-dot" style="background:${r.type==='gelir'?'var(--green2)':'var(--red2)'}"></div>${eH(r.desc)} (${r.day}. gün)</div><div class="leg-r ${r.type==='gelir'?'c-green':'c-red'}">${r.type==='gelir'?'+':'-'}${fc(r.amount)}</div></div>`).join(''):`<div class="empty-t" style="padding:12px 0">Aylık tekrarlayan yok</div>`;
}

// ════════ SETTINGS ════════
function renderSettings(){
  el('cxSelect').innerHTML=CURRENCIES.map(c=>`<div onclick="setCx('${c.c}')" style="padding:6px 12px;border-radius:7px;border:1px solid ${D.settings.currency===c.c?'var(--violet)':'var(--b2)'};background:${D.settings.currency===c.c?'var(--violet-d)':'var(--s2)'};color:${D.settings.currency===c.c?'var(--violet2)':'var(--t2)'};cursor:pointer;font-family:'JetBrains Mono',monospace;font-size:.62rem;letter-spacing:.06em">${c.s} ${c.c}</div>`).join('');
  el('ratesList').innerHTML=`
    <div class="leg-row"><div class="leg-l">USD/TRY</div><div class="leg-r">₺${D.rates.USD?.toFixed(2)||'—'}</div></div>
    <div class="leg-row"><div class="leg-l">EUR/TRY</div><div class="leg-r">₺${D.rates.EUR?.toFixed(2)||'—'}</div></div>
    <div class="leg-row"><div class="leg-l">GBP/TRY</div><div class="leg-r">₺${D.rates.GBP?.toFixed(2)||'—'}</div></div>
    <div class="leg-row"><div class="leg-l">Altın/gr</div><div class="leg-r">₺${D.rates.XAU?.toFixed(0)||'—'}</div></div>
    <div class="leg-row"><div class="leg-l">BTC/TRY</div><div class="leg-r">₺${D.rates.BTC?.toLocaleString('tr-TR')||'—'}</div></div>
    ${D.ratesUpdated?`<div style="font-size:.6rem;color:var(--t3);margin-top:8px;font-family:'JetBrains Mono',monospace">Son: ${new Date(D.ratesUpdated).toLocaleString('tr-TR')}</div>`:''}`;
  el('tog-autoRate').className='tog'+(D.settings.autoRate?' on':'');
  el('tog-alerts').className='tog'+(D.settings.alertsEnabled!==false?' on':'');
  el('tog-recNotif').className='tog'+(D.settings.recNotif?' on':'');
}

// ════════ SUMMARY PANEL ════════
function renderSummaryPanel(){
  const md=getME();
  const tG=md.filter(e=>e.type==='gelir').reduce((s,e)=>s+e.amount,0);
  const tR=md.filter(e=>e.type==='gider').reduce((s,e)=>s+e.amount,0);
  const net=tG-tR;
  el('spNet').textContent=fc(Math.abs(net));el('spNet').style.color=net>=0?'var(--green2)':'var(--red2)';
  el('spNetS').textContent=net>=0?'▲ Pozitif':'▼ Negatif';el('spNetS').style.color=net>=0?'var(--green2)':'var(--red2)';
  el('spGelir').textContent=fc(tG);el('spGider').textContent=fc(tR);
  el('spAccounts').innerHTML=D.accounts.map(a=>{
    const bal=D.entries.filter(e=>e.accountId==a.id).reduce((s,e)=>e.type==='gelir'?s+e.amount:s-e.amount,a.balance);
    return `<div class="sp-row"><div class="sp-row-l"><div class="sp-dot" style="background:${a.color}"></div>${a.name}</div><div class="sp-row-r" style="color:${bal>=0?'var(--t1)':'var(--red2)'}">${fc(bal)}</div></div>`;
  }).join('');
  const ge=md.filter(e=>e.type==='gider');
  el('spBudget').innerHTML=D.budgets.slice(0,4).map(b=>{
    const s=ge.filter(e=>e.category===b.cat).reduce((x,e)=>x+e.amount,0);const ov=s>b.limit;
    return `<div class="sp-row"><div class="sp-row-l"><div class="sp-dot" style="background:${ov?'var(--red)':'var(--green)'}"></div>${b.cat}</div><div class="sp-row-r" style="color:${ov?'var(--red2)':'var(--t2)'}">${Math.round((s/b.limit)*100)}%</div></div>`;
  }).join('')||`<div style="font-size:.65rem;color:var(--t3);padding:6px 0">Limit yok</div>`;
  el('spDebts').innerHTML=D.debts.filter(d=>d.paid<d.total).slice(0,3).map(d=>{
    const overdue=d.due&&new Date(d.due)<new Date();
    return `<div class="sp-row"><div class="sp-row-l"><div class="sp-dot" style="background:${overdue?'var(--red)':'var(--amber)'}"></div>${d.name}</div><div class="sp-row-r" style="color:${overdue?'var(--red2)':'var(--amber2)'}">${fc(d.total-d.paid)}</div></div>`;
  }).join('')||`<div style="font-size:.65rem;color:var(--t3);padding:6px 0">Borç yok</div>`;
  el('spRates').innerHTML=`<div style="font-family:'JetBrains Mono',monospace;font-size:.5rem;letter-spacing:.14em;text-transform:uppercase;color:var(--t4);margin-bottom:6px">Döviz</div>
    <div class="cx-mini-row"><span class="cx-label">USD</span><span class="cx-value">₺${D.rates.USD?.toFixed(2)}</span></div>
    <div class="cx-mini-row"><span class="cx-label">EUR</span><span class="cx-value">₺${D.rates.EUR?.toFixed(2)}</span></div>
    <div class="cx-mini-row"><span class="cx-label">GBP</span><span class="cx-value">₺${D.rates.GBP?.toFixed(2)}</span></div>`;
}

// ════════ PDF EXPORT ════════
async function exportPDF(){
  try{
    const {jsPDF}=window.jspdf;
    const doc=new jsPDF({orientation:'portrait',unit:'mm',format:'a4'});
    const W=210,margin=18;let y=margin;
    const md=getME();
    const tG=md.filter(e=>e.type==='gelir').reduce((s,e)=>s+e.amount,0);
    const tR=md.filter(e=>e.type==='gider').reduce((s,e)=>s+e.amount,0);
    const net=tG-tR;
    // Header
    doc.setFillColor(139,92,246);doc.roundedRect(margin,y,W-margin*2,14,3,3,'F');
    doc.setTextColor(255,255,255);doc.setFontSize(16);doc.setFont('helvetica','bold');
    doc.text('FinVault — Aylik Rapor',margin+6,y+9);
    y+=20;
    // Period
    doc.setTextColor(120,120,140);doc.setFontSize(9);doc.setFont('helvetica','normal');
    doc.text(`${MONTHS[vDate.getMonth()]} ${vDate.getFullYear()}  ·  Olusturuldu: ${new Date().toLocaleDateString('tr-TR')}`,margin,y);
    y+=8;
    // KPI row
    const kpis=[{l:'Toplam Gelir',v:fc(tG),c:[52,211,153]},{l:'Toplam Gider',v:fc(tR),c:[248,113,113]},{l:'Net Bakiye',v:fc(Math.abs(net)),c:[167,139,250]},{l:'Islem Sayisi',v:md.length+'',c:[251,191,36]}];
    const kpiW=(W-margin*2-9)/4;
    kpis.forEach((k,i)=>{
      const x=margin+i*(kpiW+3);
      doc.setFillColor(30,31,42);doc.roundedRect(x,y,kpiW,16,2,2,'F');
      doc.setTextColor(...k.c);doc.setFontSize(7);doc.text(k.l.toUpperCase(),x+3,y+6);
      doc.setFontSize(11);doc.setFont('helvetica','bold');doc.text(k.v,x+3,y+13);
    });
    y+=22;
    // Transactions table
    doc.setFont('helvetica','bold');doc.setFontSize(10);doc.setTextColor(240,238,255);
    doc.text('Islemler',margin,y);y+=5;
    doc.setFillColor(30,31,42);doc.rect(margin,y,W-margin*2,7,'F');
    doc.setTextColor(92,89,112);doc.setFontSize(7);doc.setFont('helvetica','normal');
    doc.text('Tarih',margin+2,y+4.5);doc.text('Aciklama',margin+22,y+4.5);
    doc.text('Kategori',margin+90,y+4.5);doc.text('Tutar',margin+130,y+4.5);doc.text('Tur',margin+160,y+4.5);
    y+=7;
    const slice=md.slice(0,30);
    slice.forEach((e,i)=>{
      if(y>270){doc.addPage();y=margin}
      if(i%2===0){doc.setFillColor(20,23,32);doc.rect(margin,y,W-margin*2,6,'F')}
      const d=new Date(e.date);
      doc.setTextColor(240,238,255);doc.setFontSize(7);
      doc.text(`${d.getDate()}.${d.getMonth()+1}`,margin+2,y+4.3);
      doc.text((e.desc||'').slice(0,28),margin+22,y+4.3);
      doc.text((e.category||'').slice(0,18),margin+90,y+4.3);
      if(e.type==='gelir')doc.setTextColor(52,211,153);else doc.setTextColor(248,113,113);
      doc.text(`${e.type==='gelir'?'+':'-'}${fc(e.amount)}`,margin+130,y+4.3);
      doc.setTextColor(155,152,176);
      doc.text(e.type==='gelir'?'Gelir':'Gider',margin+160,y+4.3);
      y+=6;
    });
    if(md.length>30){doc.setTextColor(92,89,112);doc.setFontSize(7);doc.text(`... ve ${md.length-30} islem daha`,margin,y+4);y+=8}
    y+=6;
    // Budget section
    if(D.budgets.length){
      if(y>240)doc.addPage(),y=margin;
      doc.setFont('helvetica','bold');doc.setFontSize(10);doc.setTextColor(240,238,255);doc.text('Butce Durum',margin,y);y+=5;
      const ge=md.filter(e=>e.type==='gider');
      D.budgets.forEach(b=>{
        if(y>275){doc.addPage();y=margin}
        const s=ge.filter(e=>e.category===b.cat).reduce((x,e)=>x+e.amount,0);
        const p=Math.min((s/b.limit)*100,100);const ov=s>b.limit;
        doc.setFont('helvetica','normal');doc.setFontSize(8);doc.setTextColor(240,238,255);
        doc.text(`${b.cat}: ${fc(s)} / ${fc(b.limit)} (${Math.round(p)}%)`,margin,y+4);
        doc.setFillColor(36,40,56);doc.roundedRect(margin+80,y+1,80,4,1,1,'F');
        doc.setFillColor(...(ov?[239,68,68]:p>80?[245,158,11]:[16,185,129]));
        doc.roundedRect(margin+80,y+1,Math.max(1,p*0.8),4,1,1,'F');
        y+=8;
      });
    }
    // Footer
    doc.setFontSize(7);doc.setTextColor(58,56,80);
    doc.text(`FinVault — Kisisel Finans Takip · ${new Date().toLocaleString('tr-TR')}`,margin,292);
    doc.save(`finvault-${MONTHS[vDate.getMonth()]}-${vDate.getFullYear()}.pdf`);
    toast('PDF indirildi ✓','green');el('expDd').classList.add('off');
  }catch(e){
    toast('PDF oluşturulamadı','red');console.error(e);
  }
}

// ════════ HELPERS ════════
function txRow(e,i){
  const isG=e.type==='gelir';
  const acc=D.accounts.find(a=>a.id==e.accountId);
  const d=new Date(e.date);
  const fd=d.getDate()+' '+MONTHS[d.getMonth()].slice(0,3);
  const cxTag=e.txCurrency&&e.txCurrency!=='TRY'?`<span class="tx-cx">${eH(e.txAmount)} ${eH(e.txCurrency)}</span>`:'';
  return `<div class="tx-item" style="animation-delay:${i*.03}s">
    <div class="tx-ico ${isG?'bg-green':'bg-red'}">${ICONS[e.category]||'◈'}</div>
    <div class="tx-body">
      <div class="tx-d">${eH(e.desc)}</div>
      <div class="tx-m">${eH(e.category)} · ${fd}${acc?` · ${eH(acc.name)}`:''}${cxTag}${e.tag?`<span class="tx-tag">${eH(e.tag)}</span>`:''}${e.note?`<span class="tx-note">${eH((e.note+'').slice(0,28))}${(e.note+'').length>28?'…':''}</span>`:''}</div>
    </div>
    <div class="tx-amt ${isG?'c-green':'c-red'}">${isG?'+':'-'}${fc(e.amount)}</div>
    <button class="tx-del" data-action="delete-entry" data-id="${eH(e.id)}">×</button>
  </div>`;
}
function el(id){return document.getElementById(id)}
function v(id){return(document.getElementById(id)||{}).value||''}
function set(id,val){const e=document.getElementById(id);if(e)e.value=val}

// ════════ POPULATE SELECTS ════════
function populateSels(){
  const cats=inlineT==='gelir'?getCatsI():getCatsG();
  const mcats=modalT==='gelir'?getCatsI():getCatsG();
  const rcats=recT==='gelir'?getCatsI():getCatsG();
  const catOpts=cs=>cs.map(c=>`<option>${c}</option>`).join('');
  const accOpts=D.accounts.map(a=>`<option value="${a.id}">${a.name}</option>`).join('');
  const cxOpts=CURRENCIES.map(c=>`<option value="${c.c}">${c.s} ${c.c}</option>`).join('');
  ['fCat'].forEach(id=>{const e=el(id);if(e)e.innerHTML=catOpts(cats)});
  ['mCat'].forEach(id=>{const e=el(id);if(e)e.innerHTML=catOpts(mcats)});
  ['rCat'].forEach(id=>{const e=el(id);if(e)e.innerHTML=catOpts(rcats)});
  ['bCat'].forEach(id=>{const e=el(id);if(e)e.innerHTML=catOpts(getCatsG())});
  ['fAcc','mAcc'].forEach(id=>{const e=el(id);if(e)e.innerHTML=accOpts});
  ['fTxCx','mTxCx'].forEach(id=>{const e=el(id);if(e)e.innerHTML=cxOpts});
  // Color picker
  const cp=el('accColorPicker');
  if(cp)cp.innerHTML=ACC_COLORS.map(c=>`<div onclick="selColor('${c}')" style="width:22px;height:22px;border-radius:5px;background:${c};cursor:pointer;border:2px solid ${selAccColor===c?'white':'transparent'};transition:all .15s"></div>`).join('');
}
function selColor(c){selAccColor=c;populateSels()}

// ════════ TYPE SETTERS ════════
function setFT(t){inlineT=t;populateSels();
  el('fG').className='seg-b'+(t==='gelir'?' ag':'');el('fR').className='seg-b'+(t==='gider'?' ar':'');
  el('fBtn').className='btn '+(t==='gelir'?'btn-g':'btn-r');}
function setMT(t){modalT=t;populateSels();
  el('mG').className='seg-b'+(t==='gelir'?' ag':'');el('mR').className='seg-b'+(t==='gider'?' ar':'');
  el('mBtn').className='btn '+(t==='gelir'?'btn-g':'btn-r');}
function setRT(t){recT=t;populateSels();
  el('rG').className='seg-b'+(t==='gelir'?' ag':'');el('rR').className='seg-b'+(t==='gider'?' ar':'');}
function setDebtType(t){debtT=t;
  el('dTypB').className='seg-b'+(t==='borc'?' ar':'');el('dTypA').className='seg-b'+(t==='alacak'?' ag':'');}

// ════════ NAVIGATION ════════
const PAGE_NAMES={ozet:'Özet',islemler:'İşlemler',analiz:'Analiz',takvim:'Takvim',hesaplar:'Hesaplar',borclar:'Borç Takibi',hedefler:'Hedefler',tekrarlayan:'Tekrarlayan',ayarlar:'Ayarlar'};
const MOB_BAR_PAGES=['ozet','islemler','hesaplar','hedefler'];
function nav(page,niEl){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.getElementById('page-'+page).classList.add('active');
  document.querySelectorAll('.ni').forEach(n=>n.classList.remove('active'));
  if(niEl)niEl.classList.add('active');
  document.querySelectorAll('.mob-ni').forEach(n=>n.classList.remove('active'));
  document.querySelectorAll('.mob-drawer-item').forEach(n=>n.classList.remove('active'));
  if(MOB_BAR_PAGES.includes(page)){const mn=el('mob-'+page);if(mn)mn.classList.add('active');}
  else{const mdi=el('mdi-'+page);if(mdi)mdi.classList.add('active');el('mob-more').classList.add('active');}
  el('tbPage').textContent=PAGE_NAMES[page]||page;
  // Close notif panel
  el('notifPanel').classList.add('off');
}
function mobNav(page){nav(page,el('ni-'+page))}

// ════════ DRAWER ════════
function toggleDrawer(){const d=el('mobDrawer'),o=el('mobOverlay');d.classList.contains('open')?closeDrawer():(d.classList.add('open'),o.classList.add('open'),document.body.style.overflow='hidden')}
function closeDrawer(){el('mobDrawer').classList.remove('open');el('mobOverlay').classList.remove('open');document.body.style.overflow=''}

// ════════ MODAL ════════
function openModal(id){
  populateSels();
  document.getElementById(id).classList.remove('off');
  // Reset receipt area
  if(id==='addModal'){
    el('receiptPreview').style.display='none';el('receiptSub').textContent='Fotoğraf yükle → AI otomatik doldurur';
    el('receiptInput').value='';el('receiptArea').classList.remove('loading');
  }
}
function closeModal(id){document.getElementById(id).classList.add('off')}
document.querySelectorAll('.overlay').forEach(m=>m.addEventListener('click',e=>{if(e.target===m)m.classList.add('off')}));

// ════════ EXPORT ════════
function toggleExp(){el('expDd').classList.toggle('off')}
document.addEventListener('click',e=>{
  if(!e.target.closest('[onclick="toggleExp()"]')&&!e.target.closest('#expDd'))el('expDd').classList.add('off');
  if(!e.target.closest('.notif-wrap'))el('notifPanel').classList.add('off');

  const actEl=e.target.closest('[data-action]');
  if(!actEl)return;
  const action=actEl.dataset.action;
  const id=actEl.dataset.id;
  if(action==='delete-entry')deleteEntry(id);
  if(action==='delete-template')deleteTemplate(id);
  if(action==='apply-template')applyTemplate(actEl.dataset.id,actEl.dataset.prefix);
  if(action==='remove-cat')removeCustomCat(actEl.dataset.type,actEl.dataset.cat);
  if(action==='filter-cat')filterCat(actEl.dataset.cat);
  if(action==='select-day')selectCalDay(actEl.dataset.date,parseInt(actEl.dataset.day));
  if(action==='select-account')selectAcc(id);
  if(action==='delete-account'){e.stopPropagation();deleteAccount(id)}
  if(action==='delete-debt')deleteDebt(id);
  if(action==='pay-debt')payDebt(id);
  if(action==='delete-budget')deleteBudget(id);
  if(action==='delete-goal')deleteGoal(id);
  if(action==='contribute-goal')contributeGoal(id);
  if(action==='delete-recurring')deleteRecurring(id);
});
function exportCSV(){
  const rows=[['Tarih','Açıklama','Kategori','Tür','Tutar(TRY)','Orijinal Tutar','Orijinal Para Birimi','Hesap','Etiket','Not']];
  D.entries.forEach(e=>{const acc=D.accounts.find(a=>a.id==e.accountId);rows.push([new Date(e.date).toLocaleDateString('tr-TR'),e.desc,e.category,e.type,e.amount,e.txAmount||e.amount,e.txCurrency||'TRY',acc?.name||'',e.tag||'',e.note||''])});
  dl('\uFEFF'+rows.map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n'),'finvault.csv','text/csv');
  toast('CSV indirildi ✓','green');el('expDd').classList.add('off');
}
function exportJSON(){dl(JSON.stringify(D,null,2),'finvault.json','application/json');toast('JSON indirildi ✓','green');el('expDd').classList.add('off')}
function dl(c,n,t){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([c],{type:t}));a.download=n;a.click()}
function clearData(){if(!confirm('Tüm veriler silinecek!'))return;D.entries=[];D.debts=[];D.budgets=[];D.goals=[];D.recurring=[];D.templates=[];D.customCatsG=[];D.customCatsI=[];D.accounts=[{id:createId(),name:'Nakit',type:'nakit',balance:0,num:'',color:'#10b981'}];save();renderAll();toast('Veriler silindi','amber')}

// ════════ TOAST ════════
const TC={green:'var(--green)',red:'var(--red2)',amber:'var(--amber2)',violet:'var(--violet2)'};
let toastT;
function toast(msg,type='violet'){
  clearTimeout(toastT);const t=el('toast');
  t.innerHTML=`<div class="t-dot" style="background:${TC[type]||TC.violet}"></div>${msg}`;
  t.classList.add('show');toastT=setTimeout(()=>t.classList.remove('show'),2400);
}

// ════════ GLOBAL SEARCH ════════
function globalSearchFn(){const s=el('globalSearch').value.trim();if(s){nav('islemler',el('ni-islemler'));el('txSearch').value=s;renderTxPage()}}

// ════════ KEYBOARD ════════
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){document.querySelectorAll('.overlay:not(.off)').forEach(m=>m.classList.add('off'));closeDrawer();el('notifPanel').classList.add('off')}
  if((e.ctrlKey||e.metaKey)&&e.key==='k'){openModal('addModal');e.preventDefault()}
  if(e.key==='Enter'&&['fDesc','fAmt'].includes(e.target.id))addEntry();
  if(e.key==='Enter'&&['mDesc','mAmt'].includes(e.target.id))addEntryModal();
});

// ════════ INIT ════════
(function(){
  if(D.settings.theme)document.documentElement.dataset.theme=D.settings.theme;
  const t=D.settings.theme||'dark';
  document.querySelectorAll('.swatch').forEach(s=>s.classList.remove('on'));
  const sw=el(`sw-${t||'dark'}`);if(sw)sw.classList.add('on');
  applyRecurring();
  if(D.settings.autoRate)fetchRates();
  populateSels();renderAll();
})();

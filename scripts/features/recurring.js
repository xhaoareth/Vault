// ════════ RECURRING ════════
function applyRecurring(){
  const now=new Date();
  D.recurring.forEach(r=>{
    const day=Math.min(Math.max(parseInt(r.day)||1,1),28);
    const startDate=r.startDate?new Date(`${r.startDate}T00:00:00`):new Date(r.createdAt||Date.now());
    const startMonth=startDate.getMonth();
    const monthlyDue=now.getDate()>=day;
    const weeklyDue=now.getDay()===(day%7);
    const yearlyDue=(now.getMonth()===startMonth&&now.getDate()>=day);
    const periodKey=r.freq==='weekly'?`${now.getFullYear()}_w${Math.ceil((((now - new Date(now.getFullYear(),0,1))/86400000)+new Date(now.getFullYear(),0,1).getDay()+1)/7)}`:r.freq==='yearly'?`${now.getFullYear()}`:`${now.getFullYear()}_${now.getMonth()}`;
    const key=`rec_${r.id}_${periodKey}`;
    if(localStorage.getItem(key))return;
    const shouldApply=(r.freq==='monthly'&&monthlyDue)||(r.freq==='weekly'&&weeklyDue)||(r.freq==='yearly'&&yearlyDue);
    if(shouldApply){
      D.entries.unshift({id:createId(),desc:r.desc+' (Oto)',amount:r.amount,category:r.category,type:r.type,date:new Date().toISOString(),tag:'tekrarlayan',note:'Otomatik'});
      localStorage.setItem(key,'1');
    }
  });save();
}

// ════════ RECURRING ════════
function addRecurring(){
  const desc=cleanText(v('rDesc')),amt=parsePositiveAmount(v('rAmt')),cat=v('rCat'),freq=v('rFreq'),day=parseInt(v('rDay'))||1;
  if(!desc||amt==null){toast('Bilgileri doldurun','red');return}
  D.recurring.push({id:createId(),desc,amount:amt,category:cat,type:recT,freq,day,startDate:new Date().toISOString().slice(0,10),createdAt:new Date().toISOString()});
  save();closeModal('recModal');renderAll();toast('Tekrarlayan eklendi ✓','green');
}
function deleteRecurring(id){D.recurring=D.recurring.filter(r=>r.id!==id);save();renderAll()}

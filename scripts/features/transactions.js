// ════════ ENTRY ════════
function addEntry(){_addE('fDesc','fAmt','fCat','fAcc','fTag','fNote',inlineT,'fTxCx')}
function addEntryModal(){_addE('mDesc','mAmt','mCat','mAcc','mTag','mNote',modalT,'mTxCx');closeModal('addModal')}
function _addE(dI,aI,cI,acI,tI,nI,type,cxI){
  const desc=cleanText(v(dI)),amt=parsePositiveAmount(v(aI)),cat=v(cI),acc=v(acI),tag=cleanText(v(tI)),note=cleanText(v(nI));
  const txCx=v(cxI)||'TRY';
  if(!desc){toast('Açıklama girin','red');return}
  if(amt==null){toast('Geçerli tutar girin','red');return}
  const amtTRY=txToTRY(amt,txCx);
  D.entries.unshift({id:createId(),desc,amount:amtTRY,txAmount:amt,txCurrency:txCx,category:cat,type,date:new Date().toISOString(),accountId:acc?String(acc):null,tag,note});
  save();renderAll();
  set(dI,'');set(aI,'');set(tI,'');set(nI,'');
  toast(type==='gelir'?'Gelir eklendi ✓':'Gider eklendi ✓',type==='gelir'?'green':'red');
}
function deleteEntry(id){D.entries=D.entries.filter(e=>e.id!==id);save();renderAll();toast('Silindi','amber')}

// ════════ TEMPLATES ════════
function saveTemplate(){
  const desc=v('fDesc'),amt=parseFloat(v('fAmt')),cat=v('fCat'),type=inlineT,txCx=v('fTxCx')||'TRY';
  if(!desc||!amt)return toast('Açıklama ve tutar gerekli','red');
  D.templates.push({id:createId(),desc,amount:amt,category:cat,type,txCurrency:txCx});
  save();renderAll();toast('Şablon kaydedildi ⚡','violet');
}
function saveTemplateModal(){
  const desc=v('mDesc'),amt=parseFloat(v('mAmt')),cat=v('mCat'),type=modalT,txCx=v('mTxCx')||'TRY';
  if(!desc||!amt)return toast('Açıklama ve tutar gerekli','red');
  D.templates.push({id:createId(),desc,amount:amt,category:cat,type,txCurrency:txCx});
  save();renderAll();toast('Şablon kaydedildi ⚡','violet');
}
function applyTemplate(id,prefix){
  const t=D.templates.find(x=>x.id===id);if(!t)return;
  if(prefix==='f'){
    set('fDesc',t.desc);set('fAmt',t.amount);inlineT=t.type;setFT(t.type);
    const fCat=el('fCat');if(fCat){for(let o of fCat.options)if(o.value===t.category){o.selected=true;break}}
    const fTxCx=el('fTxCx');if(fTxCx){for(let o of fTxCx.options)if(o.value===t.txCurrency){o.selected=true;break}}
  } else {
    set('mDesc',t.desc);set('mAmt',t.amount);modalT=t.type;setMT(t.type);
    const mCat=el('mCat');if(mCat){for(let o of mCat.options)if(o.value===t.category){o.selected=true;break}}
    const mTxCx=el('mTxCx');if(mTxCx){for(let o of mTxCx.options)if(o.value===t.txCurrency){o.selected=true;break}}
  }
  toast('Şablon uygulandı','violet');
}
function deleteTemplate(id){D.templates=D.templates.filter(t=>t.id!==id);save();renderAll()}
function renderTemplates(){
  const make=(containerId,prefix)=>{
    const c=el(containerId);if(!c)return;
    const wrap=c.closest('[id$="TmplWrap"]')||c.parentElement;
    if(!D.templates.length){if(wrap)wrap.style.display='none';return}
    if(wrap)wrap.style.display='block';
    c.innerHTML=D.templates.map(t=>`
      <div class="tmpl-card" data-action="apply-template" data-id="${eH(t.id)}" data-prefix="${prefix}">
        <button class="tmpl-del" data-action="delete-template" data-id="${eH(t.id)}">×</button>
        <div class="tmpl-name">${eH(t.desc)}</div>
        <div class="tmpl-amt" style="color:${t.type==='gelir'?'var(--green2)':'var(--red2)'}">${t.type==='gelir'?'+':'-'}${t.txCurrency!=='TRY'?t.amount+' '+t.txCurrency:fc(t.amount)}</div>
      </div>`).join('');
  };
  make('inlineTmplGrid','f');
  make('modalTmplGrid','m');
  // Settings list
  const sl=el('tmplSettingsList');
  if(sl)sl.innerHTML=D.templates.length?D.templates.map(t=>`
    <div class="leg-row">
      <div class="leg-l">${t.type==='gelir'?'↑':'↓'} ${eH(t.desc)}</div>
      <div style="display:flex;align-items:center;gap:6px">
        <span class="leg-r ${t.type==='gelir'?'c-green':'c-red'}">${t.amount} ${t.txCurrency}</span>
        <button class="tx-del" data-action="delete-template" data-id="${eH(t.id)}">×</button>
      </div>
    </div>`).join(''):`<div class="empty-t" style="padding:8px 0">Şablon yok</div>`;
}

// ════════ CUSTOM CATS ════════
function addCustomCat(type){
  const inputId=type==='G'?'newCatG':'newCatI';
  const val=v(inputId).trim();
  if(!val)return;
  const key=type==='G'?'customCatsG':'customCatsI';
  if(!D[key])D[key]=[];
  if(D[key].includes(val))return toast('Kategori zaten var','amber');
  D[key].push(val);set(inputId,'');save();renderAll();toast('Kategori eklendi ✓','green');
}
function removeCustomCat(type,cat){
  const key=type==='G'?'customCatsG':'customCatsI';
  D[key]=(D[key]||[]).filter(c=>c!==cat);save();renderAll();
}
function renderCustomCats(){
  const makeList=(containerId,type,cats)=>{
    const c=el(containerId);if(!c)return;
    c.innerHTML=(cats||[]).map(cat=>`
      <span class="cat-pill">${eH(cat)}<button class="cat-pill-del" data-action="remove-cat" data-type="${type}" data-cat="${eH(cat)}">×</button></span>`).join('');
  };
  makeList('customCatsGList','G',D.customCatsG);
  makeList('customCatsIList','I',D.customCatsI);
}

// ════════ RECEIPT OCR ════════
function triggerReceiptUpload(){el('receiptInput').click()}
async function handleReceiptUpload(event){
  const file=event.target.files[0];if(!file)return;
  if(!D.consent?.receiptAi){
    const ok=confirm('Fiş görseli AI servisine gönderilerek analiz edilecek. Devam etmek istiyor musunuz?');
    if(!ok){event.target.value='';return}
    D.consent.receiptAi=true;save();
  }
  if(!/^image\//.test(file.type)||file.size>5*1024*1024){
    toast('Yalnızca görsel dosyası (max 5MB)','amber');
    event.target.value='';
    return;
  }
  const preview=el('receiptPreview');
  const area=el('receiptArea');
  const sub=el('receiptSub');

  // Show preview
  const reader=new FileReader();
  reader.onload=async(e)=>{
    preview.src=e.target.result;preview.style.display='block';
    area.classList.add('loading');
    sub.innerHTML=`<span class="receipt-spinner"></span>AI analiz ediyor…`;

    try{
      const fd=new FormData();
      fd.append('receipt',file);
      const ctrl=new AbortController();
      const t=setTimeout(()=>ctrl.abort(),15000);
      const resp=await fetch(RECEIPT_PARSE_ENDPOINT,{
        method:'POST',
        body:fd,
        signal:ctrl.signal
      });
      clearTimeout(t);
      if(!resp.ok)throw new Error('parse-failed');
      const parsed=await resp.json();
      set('mDesc',parsed.desc||'');
      set('mAmt',parsed.amount||'');
      set('mNote',parsed.note||'');
      // Set category
      const mCat=el('mCat');
      if(mCat&&parsed.category){for(let o of mCat.options)if(o.value===parsed.category){o.selected=true;break}}
      // Set to expense
      setMT('gider');
      sub.textContent='✓ Otomatik dolduruldu';
      toast('Fiş başarıyla okundu ✓','green');
    }catch(err){
      sub.textContent='Okunamadı — sunucu proxy endpoint gerekli';
      toast('Fiş okunamadı (backend proxy yok olabilir)','amber');
    }
    area.classList.remove('loading');
  };
  reader.readAsDataURL(file);
}

// ════════ ACCOUNT ════════
function addAccount(){
  const name=cleanText(v('aN')),type=v('aT'),balance=parseFloat(v('aBal'))||0,num=cleanText(v('aNum'));
  if(!name){toast('Hesap adı girin','red');return}
  D.accounts.push({id:createId(),name,type,balance,num,color:selAccColor});
  save();closeModal('accModal');renderAll();toast('Hesap eklendi ✓','green');
  set('aN','');set('aBal','');set('aNum','');
}
function deleteAccount(id){
  if(D.accounts.length<=1){toast('En az 1 hesap olmalı','red');return}
  const fallbackAcc=D.accounts.find(a=>a.id!==id);
  D.entries.forEach(e=>{if(e.accountId===id)e.accountId=fallbackAcc?fallbackAcc.id:null});
  D.accounts=D.accounts.filter(a=>a.id!==id);save();renderAll();toast('Silindi','amber');
}
function selectAcc(id){selAcc=selAcc===id?null:id;renderAccounts()}

// ════════ BUDGET ════════
function addBudget(){
  const cat=v('bCat'),limit=parsePositiveAmount(v('bLim'));
  if(limit==null){toast('Geçerli limit girin','red');return}
  const ex=D.budgets.find(b=>b.cat===cat);
  if(ex)ex.limit=limit;else D.budgets.push({id:createId(),cat,limit});
  save();closeModal('budgetModal');renderAll();toast('Limit eklendi ✓','green');
}
function deleteBudget(id){D.budgets=D.budgets.filter(b=>b.id!==id);save();renderAll()}

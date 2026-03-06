// ════════ CONSTANTS ════════
const MONTHS=['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
const DAYS_TR=['Pzt','Sal','Çar','Per','Cum','Cmt','Paz'];
const BASE_CATS_G=['Genel','Kira','Market','Fatura','Sağlık','Ulaşım','Yemek','Eğitim','Eğlence','Giyim','Sigorta','Diğer'];
const BASE_CATS_I=['Genel','Maaş','Ek Gelir','Kira Geliri','Yatırım','İkramiye','Diğer'];
const ICONS={'Genel':'◈','Maaş':'◎','Kira':'⌂','Kira Geliri':'⌂','Market':'◇','Fatura':'△','Sağlık':'♥','Ulaşım':'◉','Yemek':'◆','Eğitim':'◐','Eğlence':'◑','Giyim':'◻','Sigorta':'◱','Ek Gelir':'✦','Yatırım':'◆','İkramiye':'★','Diğer':'○'};
const ACC_COLORS=['#8b5cf6','#10b981','#ef4444','#f59e0b','#3b82f6','#ec4899','#14b8a6','#f97316'];
const CURRENCIES=[{c:'TRY',s:'₺',n:'Türk Lirası'},{c:'USD',s:'$',n:'Dolar'},{c:'EUR',s:'€',n:'Euro'},{c:'GBP',s:'£',n:'Sterlin'},{c:'XAU',s:'g',n:'Altın (gr)'},{c:'BTC',s:'₿',n:'Bitcoin'}];
const FREQ_L={monthly:'Aylık',weekly:'Haftalık',yearly:'Yıllık'};
const ACC_TYPE_L={banka:'Banka',kredi:'Kredi Kartı',nakit:'Nakit',yatirim:'Yatırım',dijital:'Dijital'};
const RECEIPT_PARSE_ENDPOINT='/api/receipt-parse';

// ════════ DATA ════════
let D=loadD();
function loadD(){
  const def={
    entries:[],
    accounts:[{id:createId(),name:'Nakit',type:'nakit',balance:0,num:'',color:'#10b981'}],
    debts:[],budgets:[],goals:[],recurring:[],
    templates:[],
    customCatsG:[],customCatsI:[],
    notifications:[],
    settings:{currency:'TRY',theme:'',autoRate:true,recNotif:false,alertsEnabled:true},
    rates:{USD:38.5,EUR:42.1,GBP:49.0,XAU:3200,BTC:3500000},
    ratesUpdated:null,
    ratesMeta:{fx:null,gold:null},
    consent:{receiptAi:false}
  };
  try{
    const s=JSON.parse(localStorage.getItem('fv5')||'{}');
    const merged={...def,...s,settings:{...def.settings,...(s.settings||{})},rates:{...def.rates,...(s.rates||{})},ratesMeta:{...def.ratesMeta,...(s.ratesMeta||{})},consent:{...def.consent,...(s.consent||{})}};
    normalizeIds(merged);
    return merged;
  }catch{return def}
}
function save(){localStorage.setItem('fv5',JSON.stringify(D))}

function createId(){
  if(window.crypto&&typeof window.crypto.randomUUID==='function')return window.crypto.randomUUID();
  return `id_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}
function normalizeIds(data){
  const keys=['entries','accounts','debts','budgets','goals','recurring','templates'];
  keys.forEach(k=>{
    (data[k]||[]).forEach(item=>{if(item&&item.id!=null)item.id=String(item.id)});
  });
}

// ════════ HELPERS ════════
function getCatsG(){return [...BASE_CATS_G,...(D.customCatsG||[])]}
function getCatsI(){return [...BASE_CATS_I,...(D.customCatsI||[])]}
function eH(v){
  return String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
function cleanText(v){return String(v??'').trim()}
function parsePositiveAmount(raw,{allowZero=false}={}){
  const n=typeof raw==='number'?raw:parseFloat(raw);
  if(!Number.isFinite(n))return null;
  if(allowZero&&n===0)return 0;
  return n>0?n:null;
}
function isValidInputDate(dateStr){
  if(!dateStr)return true;
  if(!/^\d{4}-\d{2}-\d{2}$/.test(dateStr))return false;
  const d=new Date(`${dateStr}T00:00:00`);
  return Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===dateStr;
}

// ════════ CURRENCY ════════
const CX=()=>CURRENCIES.find(c=>c.c===D.settings.currency)||CURRENCIES[0];
function fc(n){
  n=Math.abs(n);const cx=CX();
  if(cx.c==='TRY')return '₺'+n.toLocaleString('tr-TR',{minimumFractionDigits:2,maximumFractionDigits:2});
  if(cx.c==='USD')return '$'+(n/D.rates.USD).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
  if(cx.c==='EUR')return '€'+(n/D.rates.EUR).toFixed(2);
  if(cx.c==='GBP')return '£'+(n/D.rates.GBP).toFixed(2);
  if(cx.c==='XAU')return (n/D.rates.XAU).toFixed(4)+'g';
  if(cx.c==='BTC')return '₿'+(n/D.rates.BTC).toFixed(6);
  return n.toFixed(2);
}
function txToTRY(amt,cxCode){
  if(!cxCode||cxCode==='TRY')return amt;
  const rate=D.rates[cxCode];
  if(!rate)return amt;
  return amt*rate;
}

async function fetchRates(){
  toast('Kurlar alınıyor…','amber');
  const now=new Date().toISOString();
  let fxOk=false,goldOk=false;

  try{
    const r=await fetch('https://api.exchangerate-api.com/v4/latest/TRY');
    if(!r.ok)throw 0;
    const d=await r.json();
    D.rates.USD=1/d.rates.USD;
    D.rates.EUR=1/d.rates.EUR;
    if(d.rates.GBP)D.rates.GBP=1/d.rates.GBP;
    fxOk=true;
    D.ratesMeta.fx={source:'exchangerate-api (TRY base)',updatedAt:now};
  }catch{
    D.ratesMeta.fx={...(D.ratesMeta.fx||{}),status:'fallback'};
  }

  try{
    const directRes=await fetch('https://api.exchangerate.host/latest?base=XAU&symbols=TRY');
    if(!directRes.ok)throw 0;
    const directData=await directRes.json();
    const directRate=Number(directData?.rates?.TRY);
    if(!directRate||!Number.isFinite(directRate))throw 0;
    D.rates.XAU=directRate;
    goldOk=true;
    D.ratesMeta.gold={source:'exchangerate.host (XAU/TRY)',updatedAt:now};
  }catch{
    try{
      const xauUsdRes=await fetch('https://api.exchangerate.host/latest?base=XAU&symbols=USD');
      if(!xauUsdRes.ok)throw 0;
      const xauUsdData=await xauUsdRes.json();
      const xauUsd=Number(xauUsdData?.rates?.USD);
      const usdTry=D.rates.USD;
      if(!xauUsd||!usdTry||!Number.isFinite(xauUsd)||!Number.isFinite(usdTry))throw 0;
      D.rates.XAU=xauUsd*usdTry;
      goldOk=true;
      D.ratesMeta.gold={source:'exchangerate.host (XAU/USD × USD/TRY)',updatedAt:now};
    }catch{
      D.ratesMeta.gold={...(D.ratesMeta.gold||{}),status:'fallback'};
    }
  }

  if(fxOk||goldOk){
    D.ratesUpdated=now;
    save();
    renderAll();
    if(fxOk&&goldOk)toast('Kurlar güncellendi ✓','green');
    else toast('Kısmi kur güncellemesi yapıldı','amber');
    return;
  }

  save();
  toast('Kur alınamadı, manuel değerler kullanılıyor','amber');
}

// ════════ STATE ════════
let vDate=new Date();
let txF='all',inlineT='gelir',modalT='gelir',recT='gelir',debtT='borc';
let selAcc=null,selAccColor=ACC_COLORS[0];
let calSelDay=null;

function getME(){
  return D.entries.filter(e=>{const d=new Date(e.date);return d.getMonth()===vDate.getMonth()&&d.getFullYear()===vDate.getFullYear()});
}
function changeMonth(d){vDate.setMonth(vDate.getMonth()+d);renderAll()}

// ════════ DEBT ════════
function addDebt(){
  const name=cleanText(v('dN')),total=parsePositiveAmount(v('dTotal')),paid=parsePositiveAmount(v('dPaid'),{allowZero:true})||0,due=v('dDue'),cat=v('dCat'),note=cleanText(v('dNote'));
  if(!name||total==null){toast('Bilgileri doldurun','red');return}
  if(paid<0||paid>total){toast('Ödenen tutar geçersiz','red');return}
  if(!isValidInputDate(due)){toast('Geçerli bir tarih girin','red');return}
  D.debts.push({id:createId(),name,total,paid,due,cat,note,type:debtT});
  save();closeModal('debtModal');renderAll();toast('Borç eklendi ✓','green');
  set('dN','');set('dTotal','');set('dPaid','');set('dDue','');set('dNote','');
}
function deleteDebt(id){D.debts=D.debts.filter(d=>d.id!==id);save();renderAll()}
function payDebt(id){
  openAmountModal({kind:'debt',id,title:'Borç Ödemesi',label:'Ödeme tutarı'});
}

// ════════ DEBT ════════
function addDebt(){
  const name=v('dN'),total=parseFloat(v('dTotal')),paid=parseFloat(v('dPaid'))||0,due=v('dDue'),cat=v('dCat'),note=v('dNote');
  if(!name||!total||total<=0){toast('Bilgileri doldurun','red');return}
  D.debts.push({id:createId(),name,total,paid,due,cat,note,type:debtT});
  save();closeModal('debtModal');renderAll();toast('Borç eklendi ✓','green');
  set('dN','');set('dTotal','');set('dPaid','');set('dDue','');set('dNote','');
}
function deleteDebt(id){D.debts=D.debts.filter(d=>d.id!==id);save();renderAll()}
function payDebt(id){
  const d=D.debts.find(x=>x.id===id);if(!d)return;
  const amt=parseFloat(prompt('Ödeme tutarı:'));if(!amt||amt<=0)return;
  d.paid=Math.min(d.total,d.paid+amt);save();renderAll();toast('Ödeme kaydedildi ✓','green');
}

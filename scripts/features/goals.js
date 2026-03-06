// ════════ GOAL ════════
function addGoal(){
  const name=cleanText(v('gName')),target=parsePositiveAmount(v('gTarget')),current=parsePositiveAmount(v('gCurrent'),{allowZero:true})||0,date=v('gDate');
  if(!name||target==null){toast('Bilgileri doldurun','red');return}
  if(current>target){toast('Mevcut birikim hedefi aşamaz','red');return}
  if(!isValidInputDate(date)){toast('Geçerli bir tarih girin','red');return}
  D.goals.push({id:createId(),name,target,current,date});
  save();closeModal('goalModal');renderAll();toast('Hedef eklendi ✓','green');
  set('gName','');set('gTarget','');set('gCurrent','');set('gDate','');
}
function deleteGoal(id){D.goals=D.goals.filter(g=>g.id!==id);save();renderAll()}
function contributeGoal(id){
  openAmountModal({kind:'goal',id,title:'Birikim Ekle',label:'Eklenecek tutar'});
}

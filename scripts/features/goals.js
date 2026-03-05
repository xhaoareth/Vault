// ════════ GOAL ════════
function addGoal(){
  const name=v('gName'),target=parseFloat(v('gTarget')),current=parseFloat(v('gCurrent'))||0,date=v('gDate');
  if(!name||!target||target<=0){toast('Bilgileri doldurun','red');return}
  D.goals.push({id:createId(),name,target,current,date});
  save();closeModal('goalModal');renderAll();toast('Hedef eklendi ✓','green');
  set('gName','');set('gTarget','');set('gCurrent','');set('gDate','');
}
function deleteGoal(id){D.goals=D.goals.filter(g=>g.id!==id);save();renderAll()}
function contributeGoal(id){
  const g=D.goals.find(x=>x.id===id);if(!g)return;
  const amt=parseFloat(prompt('Eklenecek tutar:'));if(!amt||amt<=0)return;
  g.current=Math.min(g.target,g.current+amt);save();renderAll();toast('Birikim güncellendi ✓','green');
}

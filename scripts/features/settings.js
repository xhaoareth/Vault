// ════════ SETTINGS ACTIONS ════════
function setCx(c){D.settings.currency=c;save();renderAll();toast('Para birimi: '+c,'violet')}
function setTheme(t,btn){
  document.documentElement.dataset.theme=t==='dark'?'':t;D.settings.theme=t==='dark'?'':t;save();
  document.querySelectorAll('.swatch').forEach(s=>s.classList.remove('on'));btn.classList.add('on');
  toast('Tema değiştirildi','violet');
}
function togglePref(k,btn){D.settings[k]=!D.settings[k];btn.className='tog'+(D.settings[k]?' on':'');save();renderNotifications()}

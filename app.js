const PIX_KEY = '64712625000169';
const STORAGE_HISTORY = 'pitstop_pix_history_v1';
const STORAGE_SETTINGS = 'pitstop_pix_settings_v1';

const $ = (id) => document.getElementById(id);
const amountEl = $('amount'), payloadEl = $('pixPayload'), qrEl = $('qrcode'), qrShell = document.querySelector('.qr-shell'), emptyQr = $('emptyQr');
let currentPayload = '', currentValue = 0, qrInstance = null;

function sanitizeText(text, max){
  return (text || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[^A-Z0-9 .-]/g,'').trim().slice(0,max);
}
function tlv(id, value){ return id + String(value.length).padStart(2,'0') + value; }
function crc16(payload){
  let crc = 0xFFFF;
  for(let c=0;c<payload.length;c++){
    crc ^= payload.charCodeAt(c) << 8;
    for(let i=0;i<8;i++) crc = (crc & 0x8000) ? ((crc << 1) ^ 0x1021) & 0xFFFF : (crc << 1) & 0xFFFF;
  }
  return crc.toString(16).toUpperCase().padStart(4,'0');
}
function getSettings(){
  try { return JSON.parse(localStorage.getItem(STORAGE_SETTINGS)) || {name:'',city:''}; } catch { return {name:'',city:''}; }
}
function saveSettingsObj(s){ localStorage.setItem(STORAGE_SETTINGS, JSON.stringify(s)); }
function buildPix(value){
  const s = getSettings();
  if(!s.name || !s.city) return null;
  const merchantAccount = tlv('00','BR.GOV.BCB.PIX') + tlv('01',PIX_KEY);
  let payload = tlv('00','01') + tlv('26',merchantAccount) + tlv('52','0000') + tlv('53','986') + tlv('54',value.toFixed(2)) + tlv('58','BR') + tlv('59',sanitizeText(s.name,25)) + tlv('60',sanitizeText(s.city,15)) + tlv('62',tlv('05','***')) + '6304';
  return payload + crc16(payload);
}
function parseMoney(raw){
  raw = String(raw || '').replace(/[^0-9,\.]/g,'').replace(/\./g,'').replace(',','.');
  const n = Number(raw); return Number.isFinite(n) ? n : 0;
}
function money(v){ return v.toLocaleString('pt-BR',{style:'currency',currency:'BRL'}); }
function formatInput(v){ return Number(v).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2}); }
function toast(msg){ const t=$('toast'); t.textContent=msg; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'),1800); }
function refreshReceiver(){ const s=getSettings(); $('receiverNameView').textContent=s.name || 'Configure o titular'; $('receiverCityView').textContent=s.city || 'Configure a cidade'; }
function openSettings(){ const s=getSettings(); $('receiverName').value=s.name || ''; $('receiverCity').value=s.city || ''; $('settingsDialog').showModal(); }

function renderQr(){
  currentValue = parseMoney(amountEl.value);
  if(currentValue <= 0){ clearQr(); return; }
  const payload = buildPix(currentValue);
  if(!payload){ clearQr(); openSettings(); return; }
  currentPayload = payload; payloadEl.value = payload; emptyQr.style.display='none'; qrShell.style.display='grid'; qrEl.innerHTML='';
  if(typeof QRCode === 'undefined'){
    qrShell.style.display='none'; emptyQr.style.display='grid'; emptyQr.textContent='Não foi possível carregar o gerador de QR. Verifique sua internet.'; return;
  }
  qrInstance = new QRCode(qrEl,{text:payload,width:246,height:246,colorDark:'#000000',colorLight:'#ffffff',correctLevel:QRCode.CorrectLevel.M});
}
function clearQr(){ currentPayload=''; currentValue=0; payloadEl.value=''; qrEl.innerHTML=''; qrShell.style.display='none'; emptyQr.style.display='grid'; emptyQr.textContent='Digite um valor para gerar o PIX'; }
function clearForm(){ amountEl.value=''; clearQr(); amountEl.focus(); }
function getHistory(){ try{return JSON.parse(localStorage.getItem(STORAGE_HISTORY))||[]}catch{return []} }
function setHistory(items){ localStorage.setItem(STORAGE_HISTORY,JSON.stringify(items)); renderHistory(); }
function makeId(){ return Date.now().toString(36).slice(-6).toUpperCase()+Math.random().toString(36).slice(2,5).toUpperCase(); }
function saveCurrent(silent=false){
  if(currentValue<=0 || !currentPayload){ if(!silent) toast('Digite um valor primeiro'); return false; }
  const list=getHistory();
  list.unshift({id:makeId(),value:currentValue,payload:currentPayload,status:'pending',createdAt:new Date().toISOString()});
  setHistory(list);
  if(!silent) toast('Pagamento salvo');
  return true;
}
function newPayment(){ if(currentValue>0 && currentPayload) saveCurrent(true); clearForm(); toast('Novo pagamento'); }
function updateStatus(id){ const list=getHistory(); const item=list.find(x=>x.id===id); if(item){item.status=item.status==='paid'?'pending':'paid'; setHistory(list);} }
function removePayment(id){ if(!confirm('Excluir este pagamento do histórico?')) return; setHistory(getHistory().filter(x=>x.id!==id)); }
function copyText(text){ navigator.clipboard?.writeText(text).then(()=>toast('PIX copiado')).catch(()=>{ const ta=document.createElement('textarea'); ta.value=text; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove(); toast('PIX copiado'); }); }
function renderHistory(){
  const q=$('search').value.trim().toLowerCase();
  const list=getHistory().filter(x=> !q || money(x.value).toLowerCase().includes(q) || x.id.toLowerCase().includes(q) || (x.status==='paid'?'pago':'aguardando').includes(q));
  const box=$('historyList'), empty=$('historyEmpty'); box.innerHTML=''; empty.style.display=list.length?'none':'grid';
  list.forEach(item=>{
    const d=new Date(item.createdAt); const div=document.createElement('div'); div.className='history-item';
    div.innerHTML=`<div class="history-top"><div class="history-value">${money(item.value)}</div><span class="status ${item.status}">${item.status==='paid'?'PAGO':'AGUARDANDO'}</span></div><div class="history-meta">${d.toLocaleString('pt-BR')}<br>ID: ${item.id}</div><div class="history-buttons"><button class="btn btn-dark" data-action="status">${item.status==='paid'?'↶ Marcar aguardando':'✓ Marcar pago'}</button><button class="btn btn-dark" data-action="copy">Copiar PIX</button><button class="btn btn-dark delete-btn" data-action="delete">Excluir</button></div>`;
    div.querySelector('[data-action=status]').onclick=()=>updateStatus(item.id);
    div.querySelector('[data-action=copy]').onclick=()=>copyText(item.payload);
    div.querySelector('[data-action=delete]').onclick=()=>removePayment(item.id);
    box.appendChild(div);
  });
}
function exportCsv(){
  const list=getHistory(); if(!list.length){toast('Nenhum pagamento para exportar');return;}
  const rows=[['ID','Valor','Status','Data'],...list.map(x=>[x.id,x.value.toFixed(2).replace('.',','),x.status==='paid'?'Pago':'Aguardando',new Date(x.createdAt).toLocaleString('pt-BR')])];
  const csv='\uFEFF'+rows.map(r=>r.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(';')).join('\n');
  const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'})); a.download='pagamentos-pitstop.csv'; a.click(); URL.revokeObjectURL(a.href);
}

let typingTimer;
amountEl.addEventListener('input',()=>{ clearTimeout(typingTimer); typingTimer=setTimeout(renderQr,220); });
amountEl.addEventListener('blur',()=>{ const v=parseMoney(amountEl.value); if(v>0) amountEl.value=formatInput(v); });
document.querySelectorAll('.presets button').forEach(b=>b.onclick=()=>{amountEl.value=formatInput(Number(b.dataset.value));renderQr();});
$('copyBtn').onclick=()=> currentPayload?copyText(currentPayload):toast('Gere um PIX primeiro');
$('saveBtn').onclick=()=>saveCurrent(); $('clearBtn').onclick=clearForm; $('newPaymentBtn').onclick=newPayment; $('settingsBtn').onclick=openSettings; $('search').oninput=renderHistory; $('exportBtn').onclick=exportCsv;
$('saveSettings').onclick=(e)=>{
  e.preventDefault(); const name=sanitizeText($('receiverName').value,25), city=sanitizeText($('receiverCity').value,15);
  if(!name||!city){toast('Preencha titular e cidade');return;} saveSettingsObj({name,city}); $('settingsDialog').close(); refreshReceiver(); renderQr(); toast('Configuração salva');
};

refreshReceiver(); renderHistory();
if(!getSettings().name || !getSettings().city) setTimeout(openSettings,250);

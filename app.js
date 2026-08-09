// ===== CONFIGURAÇÃO =====
const PIX_KEY = '64712625000169';
// IMPORTANTE: altere os dois campos abaixo para os dados do titular da chave PIX.
// Use apenas letras/números, sem acentos. Máximo: 25 caracteres no nome e 15 na cidade.
const RECEIVER_NAME = 'PIT STOP COHAB';
const RECEIVER_CITY = 'SAO PAULO';
// ========================

const amountInput = document.getElementById('amount');
const result = document.getElementById('result');
const qrcodeEl = document.getElementById('qrcode');
const displayAmount = document.getElementById('displayAmount');
const pixCode = document.getElementById('pixCode');
const copyBtn = document.getElementById('copyBtn');
const clearBtn = document.getElementById('clearBtn');
const copyStatus = document.getElementById('copyStatus');

function sanitizeText(text, max) {
  return text
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toUpperCase().replace(/[^A-Z0-9 .\-]/g, '')
    .trim().slice(0, max);
}

function field(id, value) {
  return id + String(value.length).padStart(2, '0') + value;
}

function crc16(payload) {
  let crc = 0xFFFF;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = (crc & 0x8000) ? ((crc << 1) ^ 0x1021) : (crc << 1);
      crc &= 0xFFFF;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

function generatePixPayload(amount) {
  const name = sanitizeText(RECEIVER_NAME, 25);
  const city = sanitizeText(RECEIVER_CITY, 15);

  const merchantAccount = field('00', 'BR.GOV.BCB.PIX') + field('01', PIX_KEY);

  let payload = '';
  payload += field('00', '01');
  payload += field('26', merchantAccount);
  payload += field('52', '0000');
  payload += field('53', '986');
  payload += field('54', amount.toFixed(2));
  payload += field('58', 'BR');
  payload += field('59', name);
  payload += field('60', city);
  payload += field('62', field('05', '***'));
  payload += '6304';
  return payload + crc16(payload);
}

function parseAmount(raw) {
  let text = raw.replace(/[^0-9,\.]/g, '').replace(',', '.');
  const parts = text.split('.');
  if (parts.length > 2) text = parts.shift() + '.' + parts.join('');
  const value = Number(text);
  return Number.isFinite(value) ? value : 0;
}

function formatBRL(value) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function render() {
  const amount = parseAmount(amountInput.value);
  copyStatus.textContent = '';
  if (amount <= 0) {
    result.classList.add('hidden');
    qrcodeEl.innerHTML = '';
    pixCode.value = '';
    return;
  }

  const payload = generatePixPayload(amount);
  displayAmount.textContent = formatBRL(amount);
  pixCode.value = payload;
  qrcodeEl.innerHTML = '';
  new QRCode(qrcodeEl, {
    text: payload,
    width: 240,
    height: 240,
    correctLevel: QRCode.CorrectLevel.M
  });
  result.classList.remove('hidden');
}

amountInput.addEventListener('input', render);

document.querySelectorAll('[data-value]').forEach(btn => {
  btn.addEventListener('click', () => {
    amountInput.value = Number(btn.dataset.value).toFixed(2).replace('.', ',');
    render();
  });
});

copyBtn.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(pixCode.value);
    copyStatus.textContent = 'PIX Copia e Cola copiado.';
  } catch {
    pixCode.select();
    document.execCommand('copy');
    copyStatus.textContent = 'PIX Copia e Cola copiado.';
  }
});

clearBtn.addEventListener('click', () => {
  amountInput.value = '';
  render();
  amountInput.focus();
});

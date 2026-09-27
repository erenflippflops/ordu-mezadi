// Demo UI - tek cihazda oyun
// Module imports için dosyaları yükle

let durum = null;
let simdi = Date.now();
let timerInterval = null;
let currentPlayerIndex = 0;

// Rastgele tohum üret
function generateSeed() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let seed = '';
  const arr = new Uint8Array(12);
  crypto.getRandomValues(arr);
  for (let i = 0; i < 12; i++) {
    seed += alphabet[arr[i] % alphabet.length];
  }
  return seed;
}

// Ekranları göster/gizle
function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
  document.getElementById(screenId).classList.remove('hidden');
}

// Oyuncu şeridini güncelle
function updatePlayerStrip() {
  const strip = document.getElementById('player-strip');
  strip.innerHTML = '';

  Object.keys(durum.durumlar).forEach((uid, i) => {
    const oyuncu = durum.durumlar[uid];
    const isCurrent = i === currentPlayerIndex;

    const card = document.createElement('div');
    card.className = 'player-card';
    if (isCurrent) card.style.border = '2px solid #667eea';

    const header = document.createElement('div');
    header.className = 'player-header';

    const name = document.createElement('div');
    name.className = 'player-name';
    name.textContent = `Oyuncu ${i + 1}`;

    const gold = document.createElement('div');
    gold.className = 'player-gold';
    gold.textContent = `${oyuncu.butce} 💰`;

    header.appendChild(name);
    header.appendChild(gold);

    const slots = document.createElement('div');
    slots.className = 'slots';

    for (let j = 0; j < 5; j++) {
      const slot = document.createElement('div');
      slot.className = 'slot';

      if (j < oyuncu.birlikler.length) {
        const birlik = birlikler.find(b => b.id === oyuncu.birlikler[j].id);
        slot.textContent = birlik.ikon;
        slot.classList.add('filled');
        slot.title = birlik.ad;
      }

      slots.appendChild(slot);
    }

    card.appendChild(header);
    card.appendChild(slots);
    strip.appendChild(card);
  });
}

// Kartı güncelle
function updateCard() {
  const tur = durum.turlar[durum.turIndex];

  if (tur.tip === 'kaos') {
    document.getElementById('unit-card').innerHTML = `
      <div class="card-icon">🎴</div>
      <div class="card-name">Kaos Kartı</div>
      <div class="card-count">${tur.id}</div>
      <div class="card-desc">Özel güç kartı</div>
    `;
    return;
  }

  const birlik = birlikler.find(b => b.id === tur.id);
  const isBlind = tur.olay === 'KOR_ARTIRMA' || durum.mod === 'kor';

  if (isBlind) {
    document.getElementById('unit-card').innerHTML = `
      <div class="card-icon">❓</div>
      <div class="card-name">Gizli Birlik</div>
      <div class="card-count">???</div>
      <div class="card-desc">Ne aldığını bilmiyorsun!</div>
    `;
  } else {
    document.getElementById('unit-card').innerHTML = `
      <div class="card-icon">${birlik.ikon}</div>
      <div class="card-name">${birlik.ad}</div>
      <div class="card-count">${birlik.adet} adet</div>
      <div class="card-desc">${birlik.aciklama}</div>
    `;
  }
}

// Teklif bilgilerini güncelle
function updateBidInfo() {
  const amountEl = document.getElementById('bid-amount');
  const ownerEl = document.getElementById('bid-owner');

  if (!durum.teklif) {
    amountEl.textContent = 'Henüz teklif yok';
    ownerEl.textContent = '';
  } else {
    amountEl.textContent = `${durum.teklif.miktar} 💰`;
    const bidderIndex = Object.keys(durum.durumlar).indexOf(durum.teklif.uid);
    ownerEl.textContent = `Oyuncu ${bidderIndex + 1}`;
  }
}

// Zamanlayıcıyı güncelle
function updateTimer() {
  const kalan = Math.max(0, Math.ceil((durum.fazBitis - simdi) / 1000));
  const timerEl = document.getElementById('timer');
  timerEl.textContent = kalan;

  if (kalan <= 3) {
    timerEl.classList.add('critical');
  } else {
    timerEl.classList.remove('critical');
  }

  if (kalan === 0 && durum.faz === 'TEKLIF') {
    // Fazı ilerlet
    clearInterval(timerInterval);
    setTimeout(() => {
      simdi = durum.fazBitis + 100;
      durum = ilerle(durum, simdi);

      if (durum.faz === 'SONUC') {
        showResult();
      } else if (durum.faz === 'SAVAS') {
        showFinalResult();
      } else {
        startTurn();
      }
    }, 1000);
  }
}

// Teklif butonlarını güncelle
function updateBidButtons() {
  const uid = Object.keys(durum.durumlar)[currentPlayerIndex];
  const oyuncu = durum.durumlar[uid];
  const tur = durum.turlar[durum.turIndex];

  const bos = 5 - oyuncu.birlikler.length;
  const maxBid = tur.tip === 'birlik'
    ? oyuncu.butce - (bos - 1)
    : oyuncu.butce - bos;

  const currentBid = durum.teklif ? durum.teklif.miktar : 0;

  [1, 5, 10].forEach(amount => {
    const btn = document.getElementById(`bid-${amount}`);
    const newBid = currentBid + amount;

    const canBid = durum.teklif?.uid !== uid && newBid <= maxBid && simdi < durum.fazBitis;

    btn.disabled = !canBid;
  });
}

// Tur sonucunu göster
function showResult() {
  const log = durum.log[durum.turIndex];

  if (log.sonuc === 'ALINMADI' || log.sonuc === 'KIMSE_ALAMAZ') {
    alert('Bu tur kimseye gitmedi.');
  } else {
    const kazananIndex = Object.keys(durum.durumlar).indexOf(log.kazanan);
    const tur = durum.turlar[durum.turIndex];
    const birlik = birlikler.find(b => b.id === tur.id);

    let msg = `Oyuncu ${kazananIndex + 1} kazandı!\n`;
    if (birlik) {
      msg += `${birlik.ad} - ${log.fiyat} altın`;
    }

    if (log.damgalar.length > 0) {
      msg += `\n\n${log.damgalar.join(', ')}`;
    }

    alert(msg);
  }

  // Sonraki tura geç
  setTimeout(() => {
    simdi = durum.fazBitis + 100;
    durum = ilerle(durum, simdi);

    if (durum.faz === 'SAVAS') {
      showFinalResult();
    } else {
      startTurn();
    }
  }, 1000);
}

// Turu başlat
function startTurn() {
  updateCard();
  updateBidInfo();
  updatePlayerStrip();
  updateBidButtons();

  const tur = durum.turlar[durum.turIndex];
  document.getElementById('turn-info').textContent =
    `Tur ${durum.turIndex + 1} / ${durum.turlar.length} • ${durum.mod}`;

  // Olay bandı
  const banner = document.getElementById('event-banner');
  if (tur.olay) {
    const olayMetni = {
      'KOR_ARTIRMA': '🎭 Kör artırma: ne aldığını bilmiyorsun!',
      'ZORUNLU_HEDIYE': '🎁 Zorunlu hediye: en fakire gidiyor!',
      'CIFT_YA_DA_HIC': '🎲 Çift ya da hiç: kazanan yazı-tura atacak!'
    };
    banner.textContent = olayMetni[tur.olay] || tur.olay;
    banner.classList.remove('hidden');
  } else {
    banner.classList.add('hidden');
  }

  // Zamanlayıcıyı başlat
  if (timerInterval) clearInterval(timerInterval);

  if (durum.faz === 'TEKLIF') {
    timerInterval = setInterval(() => {
      simdi += 100;
      updateTimer();
      updateBidButtons();
    }, 100);
  }
}

// Final sonuçları göster
function showFinalResult() {
  showScreen('result-screen');

  const ranking = document.getElementById('ranking');
  ranking.innerHTML = '';

  durum.savas.siralama.forEach((item, i) => {
    const oyuncuIndex = Object.keys(durum.durumlar).indexOf(item.uid);

    const rankItem = document.createElement('div');
    rankItem.className = 'rank-item';

    const pos = document.createElement('div');
    pos.className = 'rank-pos';
    pos.textContent = `#${item.derece}`;

    const info = document.createElement('div');
    info.className = 'rank-info';

    const name = document.createElement('div');
    name.className = 'rank-name';
    name.textContent = `Oyuncu ${oyuncuIndex + 1}`;

    const score = document.createElement('div');
    score.className = 'rank-score';
    score.textContent = `${item.puan} puan • ${item.hasar} hasar • ${item.butce} 💰`;

    info.appendChild(name);
    info.appendChild(score);

    rankItem.appendChild(pos);
    rankItem.appendChild(info);

    ranking.appendChild(rankItem);
  });
}

// Oyunu başlat
document.getElementById('start-btn').addEventListener('click', () => {
  const playerCount = parseInt(document.getElementById('player-count').value);
  const mod = document.querySelector('.mode-btn.active').dataset.mode;

  const seed = generateSeed();
  const uids = [];
  for (let i = 0; i < playerCount; i++) {
    uids.push(`p${i + 1}`);
  }

  durum = oyunKur(seed, mod, null, uids);
  currentPlayerIndex = 0;
  simdi = Date.now();

  // İlk faza başla
  durum = ilerle(durum, simdi);

  showScreen('auction-screen');
  startTurn();
});

// Mod seçimi
document.querySelectorAll('.mode-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  });
});

// Teklif butonları
[1, 5, 10].forEach(amount => {
  document.getElementById(`bid-${amount}`).addEventListener('click', () => {
    const uid = Object.keys(durum.durumlar)[currentPlayerIndex];
    const sonuc = teklifVer(durum, uid, amount, simdi);

    if (sonuc.hata) {
      alert(sonuc.hata);
    } else {
      updateBidInfo();
      updateBidButtons();
      updatePlayerStrip();
    }
  });
});

// Oyuncu değiştir
document.getElementById('player-strip').addEventListener('click', (e) => {
  const card = e.target.closest('.player-card');
  if (card) {
    const index = Array.from(card.parentElement.children).indexOf(card);
    currentPlayerIndex = index;

    document.getElementById('current-player').textContent =
      `Şimdi oynayan: Oyuncu ${index + 1}`;

    updatePlayerStrip();
    updateBidButtons();
  }
});

// Yeniden oyna
document.getElementById('restart-btn').addEventListener('click', () => {
  if (timerInterval) clearInterval(timerInterval);
  durum = null;
  currentPlayerIndex = 0;
  showScreen('setup-screen');
});

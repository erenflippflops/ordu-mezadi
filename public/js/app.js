// ==================== ORDU MEZADI - PHASE 2 (FIXED) ====================

let gameState = null;
let timerInterval = null;
let playerNames = [];
let playerCount = 4;
let currentSeat = 0; // Which player is currently playing

// ==================== INITIALIZATION ====================

document.addEventListener('DOMContentLoaded', () => {
  initializeApp();
});

function initializeApp() {
  console.log('App initialized');

  // Entry screen
  document.getElementById('btn-new-game')?.addEventListener('click', () => {
    showScreen('setup-screen');
    setupPlayerInputs();
  });

  document.getElementById('btn-resume')?.addEventListener('click', () => {
    const saved = localStorage.getItem('ordu-mezadi-save');
    if (saved) {
      gameState = JSON.parse(saved);
      playerNames = JSON.parse(localStorage.getItem('ordu-mezadi-names') || '[]');
      showScreen('auction-screen');
      updateAuctionUI();
      startMainTimer();
    } else {
      showToast('Kaydedilmiş oyun bulunamadı');
    }
  });

  // Setup screen
  document.querySelectorAll('input[name="player-count"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      playerCount = parseInt(e.target.value);
      setupPlayerInputs();
    });
  });

  document.getElementById('game-mode')?.addEventListener('change', (e) => {
    const eraGroup = document.getElementById('era-group');
    if (e.target.value === 'donem') {
      eraGroup?.classList.remove('hidden');
    } else {
      eraGroup?.classList.add('hidden');
    }
  });

  document.getElementById('btn-start-game')?.addEventListener('click', startNewGame);

  // Battle buttons
  document.getElementById('btn-skip-battle')?.addEventListener('click', () => {
    battleAnimating = false;
  });

  document.getElementById('btn-next-duel')?.addEventListener('click', () => {
    currentDuelIndex++;
    showNextDuel();
  });

  document.getElementById('btn-new-game-results')?.addEventListener('click', () => {
    gameState = null;
    localStorage.removeItem('ordu-mezadi-save');
    localStorage.removeItem('ordu-mezadi-names');
    showScreen('entry-screen');
  });

  // Initialize
  setupPlayerInputs();
  window.addEventListener('resize', handleResize);
}

// ==================== SETUP ====================

function setupPlayerInputs() {
  const container = document.getElementById('player-names-container');
  if (!container) return;

  container.innerHTML = '';

  const colors = ['#3A7BD5', '#F2A33A', '#2FA897', '#E07AB8'];
  const defaultNames = ['Ali', 'Zeynep', 'Mehmet', 'Ayşe'];

  for (let i = 0; i < playerCount; i++) {
    const div = document.createElement('div');
    div.className = 'player-name-input';

    const indicator = document.createElement('div');
    indicator.className = 'player-color-indicator';
    indicator.style.background = colors[i];

    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = `Oyuncu ${i + 1}`;
    input.value = defaultNames[i] || `Oyuncu ${i + 1}`;
    input.dataset.seat = i;
    input.maxLength = 12;

    div.appendChild(indicator);
    div.appendChild(input);
    container.appendChild(div);
  }
}

function startNewGame() {
  // Get player names
  playerNames = [];
  const seenNames = new Set();
  document.querySelectorAll('.player-name-input input').forEach((input, i) => {
    let name = input.value.trim() || `Oyuncu ${i + 1}`;

    // Handle duplicates
    let finalName = name;
    let suffix = 2;
    while (seenNames.has(finalName)) {
      finalName = name + suffix;
      suffix++;
    }
    seenNames.add(finalName);
    playerNames.push(finalName);
  });

  const mode = document.getElementById('game-mode').value;
  const era = mode === 'donem' ? document.getElementById('era-select').value : null;

  // Check Dönem + 4 players
  if (mode === 'donem' && playerCount === 4) {
    showToast('Dönem Düellosu modu 2 veya 3 oyunculu oynanabilir');
    return;
  }

  // Check if engine is loaded
  if (!window.GameEngine || !window.GameEngine.oyunKur) {
    showToast('Oyun motoru yüklenemedi!');
    console.error('GameEngine not found or incomplete');
    return;
  }

  // Check if data is loaded
  if (!window.GameData || !window.GameData.birlikler) {
    showToast('Oyun verileri yüklenemedi!');
    console.error('GameData not found or incomplete');
    return;
  }

  console.log('GameData loaded:', {
    birlikler: window.GameData.birlikler?.length,
    yedekler: window.GameData.yedekler?.length,
    kaosKartlari: window.GameData.kaosKartlari?.length,
    modlar: window.GameData.modlar?.length
  });

  const seed = generateSeed();
  const uids = [];
  for (let i = 0; i < playerCount; i++) {
    uids.push(`player_${i}`);
  }

  try {
    gameState = window.GameEngine.oyunKur(seed, mode, era, uids);

    console.log('Game state after oyunKur:', {
      turlar: gameState.turlar?.length,
      faz: gameState.faz,
      players: Object.keys(gameState.durumlar).length
    });

    uids.forEach((uid, i) => {
      gameState.durumlar[uid].name = playerNames[i];
      gameState.durumlar[uid].seat = i;
    });

    saveGame();

    // Don't call ilerle immediately - show HAZIRLIK phase first
    // The engine starts in HAZIRLIK with fazBitis set

    console.log('Game started:', gameState);

    showScreen('auction-screen');
    createSeatSelector();
    updateAuctionUI();
    startMainTimer();
  } catch (error) {
    console.error('Game start error:', error);
    showToast('Oyun başlatılamadı: ' + error.message);
  }
}

// ==================== SEAT SELECTOR ====================

function createSeatSelector() {
  const container = document.getElementById('seat-buttons');
  if (!container) return;

  container.innerHTML = '';

  const colors = ['#3A7BD5', '#F2A33A', '#2FA897', '#E07AB8'];

  for (let i = 0; i < playerCount; i++) {
    const btn = document.createElement('button');
    btn.className = 'seat-btn';
    btn.dataset.seat = i;
    btn.textContent = playerNames[i][0].toUpperCase();
    btn.style.background = colors[i];

    if (i === currentSeat) {
      btn.classList.add('active');
    }

    btn.addEventListener('click', () => {
      currentSeat = i;
      updateSeatSelector();
      updateAuctionUI();
    });

    container.appendChild(btn);
  }
}

function updateSeatSelector() {
  document.querySelectorAll('.seat-btn').forEach((btn, i) => {
    if (i === currentSeat) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

// ==================== MAIN TIMER (USING ENGINE CLOCK) ====================

function startMainTimer() {
  if (timerInterval) clearInterval(timerInterval);

  timerInterval = setInterval(() => {
    if (!gameState) return;

    const now = Date.now();

    // Check if phase should advance
    if (now >= gameState.fazBitis) {
      advancePhase();
    } else {
      // Just update UI
      updateTimerDisplay();
    }
  }, 100);
}

function advancePhase() {
  if (!gameState) return;

  const now = Date.now();
  const oldPhase = gameState.faz;

  console.log('Advancing phase from:', oldPhase);

  gameState = window.GameEngine.ilerle(gameState, now);

  console.log('New phase:', gameState.faz);

  saveGame();

  // Check if we reached battle
  if (gameState.faz === 'SAVAS') {
    clearInterval(timerInterval);
    showToast('Açık artırma bitti! Savaş başlıyor...');
    setTimeout(() => {
      startBattle();
    }, 1500);
    return;
  }

  // Update UI for new phase
  updateAuctionUI();
}

function updateTimerDisplay() {
  if (!gameState) return;

  const now = Date.now();
  const remaining = Math.max(0, Math.ceil((gameState.fazBitis - now) / 1000));

  // Mobile timer
  const mobileCountdown = document.getElementById('mobile-countdown');
  if (mobileCountdown && gameState.faz === 'TEKLIF') {
    if (remaining === 0) {
      mobileCountdown.textContent = 'Süre doldu...';
      mobileCountdown.classList.add('warning');
    } else {
      mobileCountdown.textContent = remaining;
      if (remaining <= 5) {
        mobileCountdown.classList.add('warning');
      } else {
        mobileCountdown.classList.remove('warning');
      }
    }
  }

  // Desktop timer
  const desktopCountdown = document.getElementById('desktop-countdown');
  if (desktopCountdown && gameState.faz === 'TEKLIF') {
    if (remaining === 0) {
      desktopCountdown.textContent = 'Süre doldu...';
      desktopCountdown.classList.add('warning');
    } else {
      desktopCountdown.textContent = remaining;
      if (remaining <= 5) {
        desktopCountdown.classList.add('warning');
      } else {
        desktopCountdown.classList.remove('warning');
      }
    }
  }

  // Last 5 seconds: red border on card
  const cards = document.querySelectorAll('.item-card');
  cards.forEach(card => {
    if (gameState.faz === 'TEKLIF' && remaining <= 5 && remaining > 0) {
      card.classList.add('last-seconds');
    } else {
      card.classList.remove('last-seconds');
    }
  });
}

// ==================== AUCTION UI ====================

function updateAuctionUI() {
  if (!gameState) return;

  const isMobile = window.innerWidth < 900;

  // Show HAZIRLIK phase overlay
  if (gameState.faz === 'HAZIRLIK') {
    showHazirlikPhase();
  }

  // Show stamps during SONUC phase
  if (gameState.faz === 'SONUC') {
    showSonucPhase();
  }

  if (isMobile) {
    updateMobileAuction();
  } else {
    updateDesktopAuction();
  }

  updateTimerDisplay();
  setupBidButtons();
}

function showHazirlikPhase() {
  const tur = gameState.turlar[gameState.turIndex];
  const message = `Tur ${gameState.turIndex + 1} - Hazırlanıyor...`;

  // Show a prominent toast for HAZIRLIK
  showToast(message, 5000);
}

function showSonucPhase() {
  const turLog = gameState.log[gameState.turIndex];
  if (!turLog) return;

  const tur = gameState.turlar[gameState.turIndex];

  // Show event banner if present
  if (tur.olay && tur.olay !== 'YOK') {
    const eventMessages = {
      'KOR_ARTIRMA': '🔒 Kör Artırma',
      'ZORUNLU_HEDIYE': '🎁 Zorunlu Hediye',
      'CIFT_YA_DA_HIC': '🪙 Çift ya da Hiç',
      'GAZ': '🔥 Gaz Kullanıldı'
    };
    const message = eventMessages[tur.olay] || tur.olay;
    showToast(message, 2500);
  }

  // Show stamps
  if (turLog.damgalar && turLog.damgalar.length > 0) {
    const stampMessages = {
      'TROLLENDİN': '🤡 TROLLENDİN!',
      'SOYULDUN': '💸 SOYULDUN!',
      'KELEPİR': '💰 KELEPİR!',
      'KAPTIN_KAÇTIN': '⚡ KAPTIN KAÇTIN!'
    };

    turLog.damgalar.forEach((damga, i) => {
      setTimeout(() => {
        const message = stampMessages[damga] || damga;
        showToast(message, 2000);
      }, i * 500);
    });
  }

  // Show result message
  const resultMessages = {
    'ALINMADI': 'Kimse almadı',
    'KIMSE_ALAMAZ': 'Kimse alamaz'
  };

  if (turLog.sonuc && resultMessages[turLog.sonuc]) {
    showToast(resultMessages[turLog.sonuc], 2000);
  } else if (turLog.kazanan) {
    const kazanan = gameState.durumlar[turLog.kazanan];
    if (kazanan) {
      showToast(`${kazanan.name} kazandı - ${turLog.fiyat}💰`, 2000);
    }
  }
}

function updateMobileAuction() {
  // Turn header
  const turnCurrent = document.getElementById('mobile-turn-current');
  const turnTotal = document.getElementById('mobile-turn-total');
  if (turnCurrent) turnCurrent.textContent = gameState.turIndex + 1;
  if (turnTotal) turnTotal.textContent = gameState.turlar.length;

  // Current bid
  const bidAmount = gameState.teklif ? gameState.teklif.miktar : 0;
  const bidEl = document.getElementById('mobile-current-bid');
  if (bidEl) bidEl.textContent = bidAmount > 0 ? bidAmount : '-';

  // Item card
  updateItemCard('mobile-item-card');

  // Player info
  const myState = gameState.durumlar[`player_${currentSeat}`];
  if (myState) {
    const budgetEl = document.getElementById('mobile-budget');
    const unitsEl = document.getElementById('mobile-units');
    if (budgetEl) budgetEl.textContent = myState.butce;
    if (unitsEl) unitsEl.textContent = `${myState.birlikler.length}/5`;
  }

  // Player pills
  updatePlayerPills();
}

function updateDesktopAuction() {
  // Turn info
  const turnCurrent = document.getElementById('desktop-turn-current');
  const turnTotal = document.getElementById('desktop-turn-total');
  if (turnCurrent) turnCurrent.textContent = gameState.turIndex + 1;
  if (turnTotal) turnTotal.textContent = gameState.turlar.length;

  // Item card
  updateItemCard('desktop-item-card');

  // Current bid
  const bidAmount = gameState.teklif ? gameState.teklif.miktar : 0;
  const bidEl = document.getElementById('desktop-current-bid');
  if (bidEl) bidEl.textContent = bidAmount > 0 ? bidAmount : '-';

  if (gameState.teklif) {
    const bidder = gameState.durumlar[gameState.teklif.uid];
    const ownerEl = document.getElementById('desktop-bid-owner');
    if (ownerEl) ownerEl.textContent = bidder ? bidder.name : '';
  } else {
    const ownerEl = document.getElementById('desktop-bid-owner');
    if (ownerEl) ownerEl.textContent = '';
  }

  // Player status
  const myState = gameState.durumlar[`player_${currentSeat}`];
  if (myState) {
    const budgetEl = document.getElementById('desktop-budget');
    const unitsEl = document.getElementById('desktop-units');
    if (budgetEl) budgetEl.textContent = myState.butce;
    if (unitsEl) unitsEl.textContent = `${myState.birlikler.length}/5`;
  }

  // Update armies
  updateDesktopArmies();

  // Update history
  updateDesktopHistory();
}

function updateItemCard(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const tur = gameState.turlar[gameState.turIndex];
  const isKorMod = gameState.mod === 'kor';

  if (tur.olay === 'KOR_ARTIRMA' && gameState.faz === 'TEKLIF') {
    container.innerHTML = `
      <div class="item-card card-back">
        <div class="card-back-content">
          <div class="card-seal">🔒</div>
          <div class="card-question">?</div>
        </div>
      </div>
    `;
    return;
  }

  if (tur.tip === 'birlik') {
    const birlik = window.GameData.birlikler.find(b => b.id === tur.id) ||
                   window.GameData.yedekler.find(b => b.id === tur.id);

    if (!birlik) {
      console.error('Unit not found:', tur.id);
      return;
    }

    // HIDE SECRET INFO: Never show güç or kademe during auction
    // In Kör mod, only show name and adet (no icon, era, type, description)
    if (isKorMod) {
      container.innerHTML = `
        <div class="item-card">
          <div class="card-name">${birlik.ad}</div>
          <div class="card-stats">
            <div class="stat-item">
              <span class="stat-label">Adet</span>
              <span class="stat-value">${birlik.adet}</span>
            </div>
          </div>
        </div>
      `;
    } else {
      // Map era and type codes to readable labels
      const eraLabels = {
        'antik': 'Antik',
        'orta': 'Orta Çağ',
        'modern': 'Modern'
      };
      const typeLabels = {
        'piyade': 'Piyade',
        'suvari': 'Süvari',
        'menzilli': 'Menzilli',
        'nisanci': 'Nişancı'
      };

      const eraLabel = eraLabels[birlik.cag] || birlik.cag || '-';
      const typeLabel = typeLabels[birlik.tip] || birlik.tip;

      container.innerHTML = `
        <div class="item-card">
          <div class="card-icon">${birlik.ikon}</div>
          <div class="card-name">${birlik.ad}</div>
          <div class="card-description">${birlik.aciklama}</div>
          <div class="card-stats">
            <div class="stat-item">
              <span class="stat-label">Adet</span>
              <span class="stat-value">${birlik.adet}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Çağ</span>
              <span class="stat-value">${eraLabel}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Tip</span>
              <span class="stat-value">${typeLabel}</span>
            </div>
          </div>
        </div>
      `;
    }
  } else {
    // Chaos card
    const kaos = window.GameData.kaosKartlari.find(k => k.id === tur.id);
    if (!kaos) {
      console.error('Chaos card not found:', tur.id);
      return;
    }

    container.innerHTML = `
      <div class="item-card chaos-card">
        <div class="card-type">KAOS KARTI</div>
        <div class="card-icon">⚡</div>
        <div class="card-name">${kaos.ad}</div>
        <div class="card-description">${kaos.aciklama}</div>
      </div>
    `;
  }
}

function setupBidButtons() {
  // Remove old listeners by cloning
  const mobileBtns = document.querySelectorAll('.bid-btn');
  mobileBtns.forEach(btn => {
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);
  });

  const desktopBtns = document.querySelectorAll('.bid-btn-desktop');
  desktopBtns.forEach(btn => {
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);
  });

  // Add new listeners
  document.querySelectorAll('.bid-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const amount = parseInt(btn.dataset.amount);
      makeBid(amount);
    });
  });

  document.querySelectorAll('.bid-btn-desktop').forEach(btn => {
    btn.addEventListener('click', () => {
      const amount = parseInt(btn.dataset.amount);
      makeBid(amount);
    });
  });

  // Gas buttons
  const mobileGas = document.getElementById('mobile-gas-btn');
  if (mobileGas) {
    const newMobileGas = mobileGas.cloneNode(true);
    mobileGas.parentNode.replaceChild(newMobileGas, mobileGas);
    newMobileGas.addEventListener('click', useGas);
  }

  const desktopGas = document.getElementById('desktop-gas-btn');
  if (desktopGas) {
    const newDesktopGas = desktopGas.cloneNode(true);
    desktopGas.parentNode.replaceChild(newDesktopGas, desktopGas);
    newDesktopGas.addEventListener('click', useGas);
  }

  updateBidButtonStates();
}

function updateBidButtonStates() {
  const myUid = `player_${currentSeat}`;
  const myState = gameState.durumlar[myUid];
  if (!myState) return;

  const tur = gameState.turlar[gameState.turIndex];
  const currentBid = gameState.teklif?.miktar || 0;
  const isMyBid = gameState.teklif?.uid === myUid;
  const canBid = gameState.faz === 'TEKLIF';

  // Check if player is eligible using engine's uygunMu
  const isEligible = window.GameEngine.uygunMu ? window.GameEngine.uygunMu(gameState, myUid, tur) : true;

  // Calculate max bid correctly
  const bos = 5 - myState.birlikler.length;
  const maks = tur.tip === 'birlik' ? myState.butce - (bos - 1) : myState.butce - bos;

  // Show ineligibility message
  if (!isEligible && canBid) {
    showToast('Bu turda teklif veremezsin', 3000);
  }

  // Update all bid buttons
  const allBidBtns = [...document.querySelectorAll('.bid-btn'), ...document.querySelectorAll('.bid-btn-desktop')];
  allBidBtns.forEach(btn => {
    const amount = parseInt(btn.dataset.amount);
    const newBid = currentBid + amount;
    btn.disabled = !canBid || isMyBid || newBid > maks || !isEligible;
  });

  // Gas buttons
  const allGasBtns = [document.getElementById('mobile-gas-btn'), document.getElementById('desktop-gas-btn')];
  allGasBtns.forEach(btn => {
    if (btn) {
      btn.disabled = myState.gazKullanildi || gameState.gaz || gameState.faz !== 'TEKLIF' ||
                     tur.tip !== 'birlik' || tur.olay === 'ZORUNLU_HEDIYE' || !isEligible;
    }
  });
}

function updatePlayerPills() {
  const pills = document.querySelectorAll('.player-pill');

  pills.forEach((pill, i) => {
    if (i >= playerCount) {
      pill.style.display = 'none';
      return;
    }

    const uid = `player_${i}`;
    const player = gameState.durumlar[uid];
    if (!player) return;

    const initial = pill.querySelector('.player-initial');
    const budget = pill.querySelector('.player-budget');

    if (initial) initial.textContent = player.name[0].toUpperCase();
    if (budget) budget.textContent = player.butce;

    if (gameState.teklif && gameState.teklif.uid === uid) {
      pill.classList.add('current-bidder');
    } else {
      pill.classList.remove('current-bidder');
    }

    // Add click handler to show army/chaos details
    pill.onclick = () => showMobilePlayerDetails(uid);
    pill.style.cursor = 'pointer';
  });
}

function showMobilePlayerDetails(uid) {
  const state = gameState.durumlar[uid];
  if (!state) return;

  let details = `<strong>${state.name}</strong><br>`;
  details += `Bütçe: ${state.butce}💰<br><br>`;

  // Show army
  details += `<strong>Ordu (${state.birlikler.length}/5):</strong><br>`;
  if (state.birlikler.length === 0) {
    details += 'Boş<br>';
  } else {
    state.birlikler.forEach((birimId, index) => {
      const birim = window.GameData.birlikler.find(b => b.id === birimId) ||
                    window.GameData.yedekler.find(b => b.id === birimId);
      if (birim) {
        details += `${index + 1}. ${birim.emoji} ${birim.ad}<br>`;
      }
    });
  }

  // Show chaos cards
  if (state.kaoslar.length > 0) {
    details += `<br><strong>Kaos (${state.kaoslar.length}):</strong><br>`;
    state.kaoslar.forEach((kaosId, index) => {
      const kaos = window.GameData.kaosKartlari.find(k => k.id === kaosId);
      if (kaos) {
        details += `${index + 1}. ⚡ ${kaos.ad}<br>`;
      }
    });
  }

  // Show in a toast popup with HTML support
  showToast(details, 5000, true);
}

function updateDesktopArmies() {
  const container = document.getElementById('desktop-armies');
  if (!container) return;

  container.innerHTML = '';

  const colors = ['#3A7BD5', '#F2A33A', '#2FA897', '#E07AB8'];

  Object.entries(gameState.durumlar).forEach(([uid, player]) => {
    const seat = parseInt(uid.split('_')[1]);
    if (seat >= playerCount) return;

    const div = document.createElement('div');
    div.className = 'army-player';

    const header = document.createElement('div');
    header.className = 'player-header';

    const avatar = document.createElement('div');
    avatar.className = 'player-avatar';
    avatar.style.background = colors[seat];
    avatar.textContent = player.name[0].toUpperCase();

    const name = document.createElement('div');
    name.className = 'player-name';
    name.textContent = player.name;

    const budget = document.createElement('div');
    budget.className = 'player-budget-desktop';
    budget.textContent = player.butce;

    header.appendChild(avatar);
    header.appendChild(name);
    header.appendChild(budget);

    const units = document.createElement('div');
    units.className = 'army-units';

    for (let i = 0; i < 5; i++) {
      const box = document.createElement('div');
      box.className = 'unit-box';

      if (i < player.birlikler.length) {
        const birlikData = player.birlikler[i];
        const birlik = window.GameData.birlikler.find(b => b.id === birlikData.id) ||
                       window.GameData.yedekler.find(b => b.id === birlikData.id);

        if (birlik) {
          box.classList.add('filled');
          box.textContent = birlik.ikon;

          const tooltip = document.createElement('div');
          tooltip.className = 'unit-tooltip';
          tooltip.textContent = `${birlik.ad} (${birlikData.fiyat}💰)`;
          box.appendChild(tooltip);
        }
      }

      units.appendChild(box);
    }

    div.appendChild(header);
    div.appendChild(units);
    container.appendChild(div);
  });
}

function updateDesktopHistory() {
  const container = document.getElementById('desktop-history');
  if (!container) return;

  container.innerHTML = '';

  const entries = Object.entries(gameState.log).reverse().slice(0, 10);

  entries.forEach(([turIndex, log]) => {
    const tur = gameState.turlar[parseInt(turIndex)];
    const div = document.createElement('div');
    div.className = 'history-entry';

    const turnLabel = document.createElement('div');
    turnLabel.className = 'history-turn';
    turnLabel.textContent = `TUR ${parseInt(turIndex) + 1}`;

    const result = document.createElement('div');
    result.className = 'history-result';

    if (log.sonuc === 'SATILDI') {
      const winner = gameState.durumlar[log.kazanan];
      const itemName = tur.tip === 'birlik' ?
        (window.GameData.birlikler.find(b => b.id === tur.id) || window.GameData.yedekler.find(b => b.id === tur.id))?.ad :
        window.GameData.kaosKartlari.find(k => k.id === tur.id)?.ad;

      result.innerHTML = `<span class="winner">${winner?.name || '?'}</span> aldı: ${itemName} (<span class="price">${log.fiyat}💰</span>)`;
    } else if (log.sonuc === 'HEDİYE') {
      const winner = gameState.durumlar[log.kazanan];
      const itemName = tur.tip === 'birlik' ?
        (window.GameData.birlikler.find(b => b.id === tur.id) || window.GameData.yedekler.find(b => b.id === tur.id))?.ad :
        window.GameData.kaosKartlari.find(k => k.id === tur.id)?.ad;

      result.innerHTML = `<span class="winner">${winner?.name || '?'}</span> hediye aldı: ${itemName}`;
    } else if (log.sonuc === 'KIMSE_ALAMAZ') {
      result.textContent = 'Kimse alamadı';
    } else {
      result.textContent = 'Alınmadı';
    }

    div.appendChild(turnLabel);
    div.appendChild(result);
    container.appendChild(div);
  });
}

// ==================== BID ACTIONS ====================

function makeBid(amount) {
  if (!gameState || gameState.faz !== 'TEKLIF') {
    return;
  }

  const myUid = `player_${currentSeat}`;
  const now = Date.now();

  console.log('Making bid:', amount, 'uid:', myUid);

  const result = window.GameEngine.teklifVer(gameState, myUid, amount, now);

  if (result.hata) {
    showToast(result.hata);
    return;
  }

  // teklifVer mutates state in place, don't assign result.durum
  saveGame();
  updateAuctionUI();
}

function useGas() {
  if (!gameState || gameState.faz !== 'TEKLIF') return;

  const myUid = `player_${currentSeat}`;
  const result = window.GameEngine.gazVer(gameState, myUid);

  if (result.hata) {
    showToast(result.hata);
    return;
  }

  // gazVer mutates state in place, don't assign result.durum
  saveGame();
  updateAuctionUI();
}

// ==================== BATTLE ====================

let currentDuelIndex = 0;
let battleAnimating = false;

function startBattle() {
  showScreen('battle-screen');
  currentDuelIndex = 0;
  showNextDuel();
}

function showNextDuel() {
  if (!gameState.savas || currentDuelIndex >= gameState.savas.duellolar.length) {
    showResults();
    return;
  }

  const duel = gameState.savas.duellolar[currentDuelIndex];
  const playerA = gameState.durumlar[duel.uidA];
  const playerB = gameState.durumlar[duel.uidB];

  const container = document.getElementById('battle-duel');
  if (!container) return;

  container.innerHTML = `
    <div class="battle-header">
      <div class="battle-player">
        <div class="battle-player-name">${playerA.name}</div>
        <div class="hp-bar-container">
          <div class="hp-bar" id="hp-bar-a" style="width: 100%">100</div>
        </div>
      </div>
      <div class="battle-vs">⚔️</div>
      <div class="battle-player">
        <div class="battle-player-name">${playerB.name}</div>
        <div class="hp-bar-container">
          <div class="hp-bar" id="hp-bar-b" style="width: 100%">100</div>
        </div>
      </div>
    </div>

    <div class="battle-narration" id="battle-narration"></div>
  `;

  animateBattle(duel);

  const nextBtn = document.getElementById('btn-next-duel');
  const skipBtn = document.getElementById('btn-skip-battle');
  if (nextBtn) nextBtn.classList.add('hidden');
  if (skipBtn) skipBtn.classList.remove('hidden');
}

async function animateBattle(duel) {
  battleAnimating = true;

  const narration = document.getElementById('battle-narration');
  const hpBarA = document.getElementById('hp-bar-a');
  const hpBarB = document.getElementById('hp-bar-b');

  if (!narration || !hpBarA || !hpBarB) return;

  const isKorMod = gameState.mod === 'kor';

  for (let i = 0; i < duel.raundlar.length; i++) {
    if (!battleAnimating) break;

    const raund = duel.raundlar[i];

    // Use sablonAnlati for narration text
    if (window.GameEngine && window.GameEngine.sablonAnlati) {
      const narrative = window.GameEngine.sablonAnlati(
        gameState,
        duel.uidA,
        duel.uidB,
        i,
        raund
      );
      narration.textContent = `Raund ${i + 1}: ${narrative}`;
    } else {
      // Fallback if sablonAnlati not available
      if (isKorMod) {
        narration.textContent = `Raund ${i + 1}: Saldırılar devam ediyor...`;
      } else {
        narration.textContent = `Raund ${i + 1}: ${raund.gA} vs ${raund.gB} hasar...`;
      }
    }

    await sleep(800);

    hpBarA.style.width = `${raund.canA}%`;
    hpBarA.textContent = raund.canA;
    if (raund.canA < 30) hpBarA.classList.add('low');

    hpBarB.style.width = `${raund.canB}%`;
    hpBarB.textContent = raund.canB;
    if (raund.canB < 30) hpBarB.classList.add('low');

    await sleep(1000);

    if (raund.canA === 0 || raund.canB === 0) break;
  }

  const winner = duel.kazanan === 'A' ? duel.uidA : duel.kazanan === 'B' ? duel.uidB : null;
  if (winner) {
    const winnerName = gameState.durumlar[winner].name;
    narration.textContent += `\n\n${winnerName} kazandı!`;
  } else {
    narration.textContent += '\n\nBerabere!';
  }

  battleAnimating = false;
  const nextBtn = document.getElementById('btn-next-duel');
  const skipBtn = document.getElementById('btn-skip-battle');
  if (nextBtn) nextBtn.classList.remove('hidden');
  if (skipBtn) skipBtn.classList.add('hidden');
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ==================== RESULTS ====================

function showResults() {
  showScreen('results-screen');

  const container = document.getElementById('final-ranking');
  if (!container) return;

  container.innerHTML = '';

  if (!gameState.savas) return;

  // Show duel-by-duel results
  if (gameState.savas.duellolar && gameState.savas.duellolar.length > 0) {
    const duelsSection = document.createElement('div');
    duelsSection.className = 'duels-summary';
    duelsSection.innerHTML = '<h3>Düello Sonuçları</h3>';

    gameState.savas.duellolar.forEach((duel, index) => {
      const playerA = gameState.durumlar[duel.uidA];
      const playerB = gameState.durumlar[duel.uidB];
      const winnerUid = duel.kazanan === 'A' ? duel.uidA : duel.kazanan === 'B' ? duel.uidB : null;
      const winnerName = winnerUid ? gameState.durumlar[winnerUid].name : 'Berabere';

      const duelDiv = document.createElement('div');
      duelDiv.className = 'duel-result';
      duelDiv.innerHTML = `
        <span class="duel-number">Düello ${index + 1}:</span>
        <span class="duel-players">${playerA.name} vs ${playerB.name}</span>
        <span class="duel-winner">→ ${winnerName}</span>
      `;
      duelsSection.appendChild(duelDiv);
    });

    container.appendChild(duelsSection);
  }

  // Show ifşa list (revealed cards during Kör auctions)
  if (gameState.savas.ifsa && gameState.savas.ifsa.length > 0) {
    const ifsaSection = document.createElement('div');
    ifsaSection.className = 'ifsa-summary';
    ifsaSection.innerHTML = '<h3>İfşa Edilen Kartlar</h3>';

    gameState.savas.ifsa.forEach(item => {
      const player = gameState.durumlar[item.uid];
      const card = window.GameData.birlikler.find(b => b.id === item.kartId) ||
                   window.GameData.yedekler.find(b => b.id === item.kartId);

      if (card) {
        const ifsaDiv = document.createElement('div');
        ifsaDiv.className = 'ifsa-item';
        ifsaDiv.innerHTML = `
          <span class="ifsa-player">${player.name}:</span>
          <span class="ifsa-card">${card.ad} (${card.kademe}, Güç ${card.guc})</span>
        `;
        ifsaSection.appendChild(ifsaDiv);
      }
    });

    container.appendChild(ifsaSection);
  }

  // Show final ranking
  const rankingSection = document.createElement('div');
  rankingSection.className = 'final-ranking-section';
  rankingSection.innerHTML = '<h3>Son Sıralama</h3>';

  gameState.savas.siralama.forEach((item, index) => {
    const player = gameState.durumlar[item.uid];
    const titles = gameState.savas.unvanlar[item.uid] || [];

    const div = document.createElement('div');
    div.className = 'rank-item';
    if (index === 0) div.classList.add('first');

    const rankName = document.createElement('div');
    rankName.className = 'rank-name';
    rankName.textContent = player.name;

    div.innerHTML = `
      <div class="rank-position">${item.derece}</div>
      <div class="rank-info">
        <div class="rank-stats">${item.puan} puan • ${item.hasar} hasar • ${item.butce}💰</div>
        ${titles.length > 0 ? `<div class="rank-titles">🏆 ${titles.join(', ')}</div>` : ''}
      </div>
    `;

    div.querySelector('.rank-info').prepend(rankName);
    rankingSection.appendChild(div);
  });

  container.appendChild(rankingSection);
}

// ==================== UTILITIES ====================

function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
  const screen = document.getElementById(screenId);
  if (screen) screen.classList.remove('hidden');
}

function generateSeed() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let seed = '';
  for (let i = 0; i < 12; i++) {
    seed += chars[Math.floor(Math.random() * chars.length)];
  }
  return seed;
}

function saveGame() {
  localStorage.setItem('ordu-mezadi-save', JSON.stringify(gameState));
  localStorage.setItem('ordu-mezadi-names', JSON.stringify(playerNames));
}

function showToast(message, duration = 3000, isHtml = false) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast';

  if (isHtml) {
    toast.innerHTML = message;
  } else {
    toast.textContent = message;
  }

  container.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, duration);
}

function handleResize() {
  if (gameState && !document.getElementById('auction-screen')?.classList.contains('hidden')) {
    updateAuctionUI();
  }
}

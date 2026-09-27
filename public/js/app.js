// ==================== SINGLE-DEVICE ORDU MEZADI - PHASE 2 ====================

let gameState = null;
let currentTurnStartTime = 0;
let timerInterval = null;
let playerNames = [];
let playerCount = 4;
let currentSeat = 0;

// ==================== WAIT FOR DOM ====================

document.addEventListener('DOMContentLoaded', () => {
  initializeApp();
});

function initializeApp() {
  console.log('App initialized');

  // Entry screen
  document.getElementById('btn-new-game').addEventListener('click', () => {
    showScreen('setup-screen');
    setupPlayerInputs();
  });

  document.getElementById('btn-resume').addEventListener('click', () => {
    const saved = localStorage.getItem('ordu-mezadi-save');
    if (saved) {
      gameState = JSON.parse(saved);
      playerNames = JSON.parse(localStorage.getItem('ordu-mezadi-names') || '[]');
      showScreen('auction-screen');
      currentTurnStartTime = Date.now();
      updateAuctionUI();
      startTimer();
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

  document.getElementById('game-mode').addEventListener('change', (e) => {
    const eraGroup = document.getElementById('era-group');
    if (e.target.value === 'donem') {
      eraGroup.classList.remove('hidden');
    } else {
      eraGroup.classList.add('hidden');
    }
  });

  document.getElementById('btn-start-game').addEventListener('click', startNewGame);

  // Bid buttons
  setupBidButtons();

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

  // Initialize player inputs
  setupPlayerInputs();

  // Responsive handling
  window.addEventListener('resize', handleResize);

  // Admin panel toggle (Press ~ key)
  document.addEventListener('keydown', (e) => {
    if (e.key === '`' || e.key === '~') {
      toggleAdminPanel();
    }
  });

  setupAdminPanel();
}

// ==================== ADMIN PANEL ====================

function setupAdminPanel() {
  const closeBtn = document.getElementById('admin-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      document.getElementById('admin-panel').classList.add('hidden');
    });
  }

  const quickStart = document.getElementById('admin-quick-start');
  if (quickStart) {
    quickStart.addEventListener('click', () => {
      adminQuickStart();
    });
  }

  const skipTurn = document.getElementById('admin-skip-turn');
  if (skipTurn) {
    skipTurn.addEventListener('click', () => {
      if (gameState) {
        progressTurn();
        updateAdminInfo();
      }
    });
  }

  const autoBid = document.getElementById('admin-auto-bid');
  if (autoBid) {
    autoBid.addEventListener('click', () => {
      if (gameState && gameState.faz === 'TEKLIF') {
        makeBid(5);
        updateAdminInfo();
      }
    });
  }

  const skipToBattle = document.getElementById('admin-skip-to-battle');
  if (skipToBattle) {
    skipToBattle.addEventListener('click', () => {
      adminSkipToBattle();
    });
  }

  const setBudget = document.getElementById('admin-set-budget');
  if (setBudget) {
    setBudget.addEventListener('click', () => {
      const playerIndex = parseInt(document.getElementById('admin-player-select').value);
      const newBudget = parseInt(document.getElementById('admin-budget').value);

      if (gameState) {
        const uid = `player_${playerIndex}`;
        if (gameState.durumlar[uid]) {
          gameState.durumlar[uid].butce = newBudget;
          saveGame();
          updateAuctionUI();
          updateAdminInfo();
          showToast(`Oyuncu ${playerIndex + 1} bütçesi ${newBudget} olarak ayarlandı`);
        }
      }
    });
  }

  const setTimer = document.getElementById('admin-set-timer');
  if (setTimer) {
    setTimer.addEventListener('click', () => {
      const seconds = parseInt(document.getElementById('admin-timer').value);
      if (gameState && gameState.faz === 'TEKLIF') {
        currentTurnStartTime = Date.now() - (15000 - seconds * 1000);
        showToast(`Süre ${seconds} saniyeye ayarlandı`);
      }
    });
  }
}

function toggleAdminPanel() {
  const panel = document.getElementById('admin-panel');
  if (panel) {
    panel.classList.toggle('hidden');
    if (!panel.classList.contains('hidden')) {
      updateAdminInfo();
    }
  }
}

function updateAdminInfo() {
  if (!gameState) return;

  const turnInfo = document.getElementById('admin-turn-info');
  const phaseInfo = document.getElementById('admin-phase-info');
  const bidInfo = document.getElementById('admin-bid-info');

  if (turnInfo) {
    turnInfo.textContent = `${gameState.turIndex + 1}/${gameState.turlar.length}`;
  }

  if (phaseInfo) {
    phaseInfo.textContent = gameState.faz;
  }

  if (bidInfo) {
    if (gameState.teklif) {
      const bidder = gameState.durumlar[gameState.teklif.uid];
      bidInfo.textContent = `${gameState.teklif.miktar}💰 (${bidder?.name || '?'})`;
    } else {
      bidInfo.textContent = 'Yok';
    }
  }
}

function adminQuickStart() {
  playerCount = 2;
  playerNames = ['Test1', 'Test2'];

  if (!window.GameEngine) {
    showToast('Oyun motoru yüklenemedi!');
    return;
  }

  const seed = generateSeed();
  const uids = ['player_0', 'player_1'];

  try {
    gameState = window.GameEngine.oyunKur(seed, 'klasik', null, uids);

    uids.forEach((uid, i) => {
      gameState.durumlar[uid].name = playerNames[i];
      gameState.durumlar[uid].seat = i;
    });

    saveGame();

    const now = Date.now();
    gameState = window.GameEngine.ilerle(gameState, now);
    currentTurnStartTime = now;

    showScreen('auction-screen');
    updateAuctionUI();
    startTimer();
    updateAdminInfo();

    showToast('Hızlı test başlatıldı!');
  } catch (error) {
    showToast('Hata: ' + error.message);
    console.error(error);
  }
}

function adminSkipToBattle() {
  if (!gameState) {
    showToast('Oyun başlatılmamış!');
    return;
  }

  // Give each player some units
  Object.keys(gameState.durumlar).forEach((uid, index) => {
    const player = gameState.durumlar[uid];
    player.birlikler = [];

    // Give 5 random units
    for (let i = 0; i < 5; i++) {
      const randomUnit = window.GameData.birlikler[Math.floor(Math.random() * window.GameData.birlikler.length)];
      player.birlikler.push({
        id: randomUnit.id,
        fiyat: 10,
        kaynak: 'admin'
      });
    }
  });

  // Jump to end
  gameState.turIndex = gameState.turlar.length - 1;
  gameState.artirmaBitti = true;

  // Trigger battle
  const savasData = window.GameEngine.savas ? window.GameEngine.savas(gameState) : null;

  if (!savasData) {
    showToast('Savaş sistemi bulunamadı!');
    return;
  }

  gameState.savas = savasData;
  gameState.faz = 'SAVAS';

  saveGame();
  clearInterval(timerInterval);
  startBattle();

  showToast('Savaşa atlandı!');
}

function setupBidButtons() {
  // Mobile bid buttons
  document.querySelectorAll('.bid-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const amount = parseInt(btn.dataset.amount);
      makeBid(amount);
    });
  });

  // Desktop bid buttons
  document.querySelectorAll('.bid-btn-desktop').forEach(btn => {
    btn.addEventListener('click', () => {
      const amount = parseInt(btn.dataset.amount);
      makeBid(amount);
    });
  });

  // Gas buttons
  const mobileGas = document.getElementById('mobile-gas-btn');
  if (mobileGas) {
    mobileGas.addEventListener('click', useGas);
  }

  const desktopGas = document.getElementById('desktop-gas-btn');
  if (desktopGas) {
    desktopGas.addEventListener('click', useGas);
  }
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

    div.appendChild(indicator);
    div.appendChild(input);
    container.appendChild(div);
  }
}

function startNewGame() {
  // Get player names
  playerNames = [];
  document.querySelectorAll('.player-name-input input').forEach(input => {
    playerNames.push(input.value.trim() || `Oyuncu ${parseInt(input.dataset.seat) + 1}`);
  });

  // Get game settings
  const mode = document.getElementById('game-mode').value;
  const era = mode === 'donem' ? document.getElementById('era-select').value : null;

  // Check if GameEngine exists
  if (!window.GameEngine) {
    showToast('Oyun motoru yüklenemedi!');
    console.error('GameEngine not found');
    return;
  }

  // Generate seed
  const seed = generateSeed();

  // Create UIDs for players
  const uids = [];
  for (let i = 0; i < playerCount; i++) {
    uids.push(`player_${i}`);
  }

  // Initialize game
  try {
    gameState = window.GameEngine.oyunKur(seed, mode, era, uids);

    // Add player names to state
    uids.forEach((uid, i) => {
      gameState.durumlar[uid].name = playerNames[i];
      gameState.durumlar[uid].seat = i;
    });

    // Save to localStorage
    saveGame();

    // Start first turn
    const now = Date.now();
    gameState = window.GameEngine.ilerle(gameState, now);
    currentTurnStartTime = now;

    console.log('Game started:', gameState);

    showScreen('auction-screen');
    updateAuctionUI();
    startTimer();
  } catch (error) {
    console.error('Game start error:', error);
    showToast('Oyun başlatılamadı: ' + error.message);
  }
}

// ==================== AUCTION UI ====================

function updateAuctionUI() {
  if (!gameState) return;

  const isMobile = window.innerWidth < 900;

  console.log('Updating UI, phase:', gameState.faz, 'turn:', gameState.turIndex);

  if (isMobile) {
    updateMobileAuction();
  } else {
    updateDesktopAuction();
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

  // Update bid buttons
  updateBidButtons(true);

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

  // Update bid buttons
  updateBidButtons(false);

  // Update armies
  updateDesktopArmies();

  // Update history
  updateDesktopHistory();
}

function updateItemCard(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const tur = gameState.turlar[gameState.turIndex];

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

    const kademeMap = {
      'efsane': 'EFSANE',
      'elit': 'ELİT',
      'orta': 'ORTA',
      'siradan': 'SIRADAN',
      'troll_gizli': 'TROLL',
      'troll_sahte': 'TROLL',
      'yedek': 'YEDEK'
    };

    container.innerHTML = `
      <div class="item-card">
        <div class="card-type">${kademeMap[birlik.kademe] || 'BİRLİK'}</div>
        <div class="card-icon">${birlik.ikon}</div>
        <div class="card-name">${birlik.ad}</div>
        <div class="card-description">${birlik.aciklama}</div>
        <div class="card-stats">
          <div class="stat-item">
            <span class="stat-label">Adet</span>
            <span class="stat-value">${birlik.adet}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Güç</span>
            <span class="stat-value">${birlik.guc}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Tip</span>
            <span class="stat-value">${birlik.tip}</span>
          </div>
        </div>
      </div>
    `;
  } else {
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

function updateBidButtons(isMobile) {
  const prefix = isMobile ? 'mobile' : 'desktop';
  const buttonClass = isMobile ? '.bid-btn' : '.bid-btn-desktop';
  const buttons = document.querySelectorAll(buttonClass);
  const gasBtn = document.getElementById(`${prefix}-gas-btn`);

  const myUid = `player_${currentSeat}`;
  const myState = gameState.durumlar[myUid];
  if (!myState) return;

  const tur = gameState.turlar[gameState.turIndex];

  // Calculate max bid using game engine
  const maks = calculateMaxBid(myState, tur);

  const currentBid = gameState.teklif?.miktar || 0;
  const isMyBid = gameState.teklif?.uid === myUid;
  const canBid = gameState.faz === 'TEKLIF';

  buttons.forEach(btn => {
    const amount = parseInt(btn.dataset.amount);
    const newBid = currentBid + amount;
    const disabled = !canBid || isMyBid || newBid > maks;
    btn.disabled = disabled;
  });

  if (gasBtn) {
    const disabled = myState.gazKullanildi || gameState.gaz || gameState.faz !== 'TEKLIF' ||
                     tur.tip !== 'birlik' || tur.olay === 'ZORUNLU_HEDIYE';
    gasBtn.disabled = disabled;
  }
}

function calculateMaxBid(player, tur) {
  const bos = 5 - player.birlikler.length;
  if (tur.tip === 'birlik') {
    return player.butce - (bos - 1);
  } else {
    return player.butce - bos;
  }
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
  });
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

    if (log.sonuc === 'SATILDI' || log.sonuc === 'HEDİYE') {
      const winner = gameState.durumlar[log.kazanan];
      const itemName = tur.tip === 'birlik' ?
        (window.GameData.birlikler.find(b => b.id === tur.id) || window.GameData.yedekler.find(b => b.id === tur.id))?.ad :
        window.GameData.kaosKartlari.find(k => k.id === tur.id)?.ad;

      result.innerHTML = `<span class="winner">${winner?.name || '?'}</span> aldı: ${itemName} (<span class="price">${log.fiyat}💰</span>)`;
    } else {
      result.textContent = 'Alınmadı';
    }

    div.appendChild(turnLabel);
    div.appendChild(result);
    container.appendChild(div);
  });
}

// ==================== TIMER ====================

function startTimer() {
  if (timerInterval) clearInterval(timerInterval);

  timerInterval = setInterval(() => {
    updateTimer();

    if (gameState && gameState.faz === 'TEKLIF') {
      const elapsed = Date.now() - currentTurnStartTime;
      if (elapsed >= 15000) {
        progressTurn();
      }
    }
  }, 100);
}

function updateTimer() {
  if (!gameState || gameState.faz !== 'TEKLIF') return;

  const elapsed = Date.now() - currentTurnStartTime;
  const remaining = Math.max(0, Math.ceil((15000 - elapsed) / 1000));

  // Mobile timer
  const mobileCountdown = document.getElementById('mobile-countdown');
  if (mobileCountdown) {
    mobileCountdown.textContent = remaining;
    if (remaining <= 5) {
      mobileCountdown.classList.add('warning');
    } else {
      mobileCountdown.classList.remove('warning');
    }
  }

  // Desktop timer
  const desktopCountdown = document.getElementById('desktop-countdown');
  if (desktopCountdown) {
    desktopCountdown.textContent = remaining;
    if (remaining <= 5) {
      desktopCountdown.classList.add('warning');
    } else {
      desktopCountdown.classList.remove('warning');
    }
  }

  // Last 5 seconds: red border on card
  const cards = document.querySelectorAll('.item-card');
  cards.forEach(card => {
    if (remaining <= 5 && remaining > 0) {
      card.classList.add('last-seconds');
    } else {
      card.classList.remove('last-seconds');
    }
  });
}

// ==================== BID ACTIONS ====================

function makeBid(amount) {
  if (!gameState || gameState.faz !== 'TEKLIF') {
    console.log('Cannot bid: wrong phase');
    return;
  }

  const myUid = `player_${currentSeat}`;
  const now = Date.now();

  console.log('Making bid:', amount, 'uid:', myUid);

  const result = window.GameEngine.teklifVer(gameState, myUid, amount, now);

  if (result.hata) {
    showToast(result.hata);
    console.error('Bid error:', result.hata);
    return;
  }

  gameState = result.durum;

  // Extend timer if bid in last 5 seconds
  const elapsed = now - currentTurnStartTime;
  if (elapsed > 10000) {
    currentTurnStartTime = now - 10000; // Reset to 5 seconds remaining
  }

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

  gameState = result.durum;
  saveGame();
  updateAuctionUI();
}

function progressTurn() {
  if (!gameState) return;

  console.log('Progressing turn, current phase:', gameState.faz);

  const now = Date.now();

  try {
    gameState = window.GameEngine.ilerle(gameState, now);
    currentTurnStartTime = now; // Reset timer for next turn

    console.log('After ilerle, new phase:', gameState.faz, 'turn:', gameState.turIndex);

    saveGame();

    // Check if game ended
    if (gameState.faz === 'SAVAS') {
      clearInterval(timerInterval);
      showToast('Açık artırma bitti! Savaş başlıyor...');
      setTimeout(() => {
        startBattle();
      }, 2000);
      return;
    }

    // If still in SONUC phase, wait and progress again
    if (gameState.faz === 'SONUC') {
      console.log('In SONUC phase, waiting 2 seconds...');
      setTimeout(() => {
        gameState = window.GameEngine.ilerle(gameState, Date.now());
        currentTurnStartTime = Date.now();
        saveGame();
        updateAuctionUI();
        updateAdminInfo();
      }, 2000);
    } else {
      // Normal turn progression
      updateAuctionUI();
      updateAdminInfo();
    }
  } catch (error) {
    console.error('Error in progressTurn:', error);
    showToast('Tur ilerletme hatası: ' + error.message);
  }
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

  for (let i = 0; i < duel.raundlar.length; i++) {
    if (!battleAnimating) break;

    const raund = duel.raundlar[i];

    narration.textContent = `Raund ${i + 1}: ${raund.gA} vs ${raund.gB} hasar...`;
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

  gameState.savas.siralama.forEach((item, index) => {
    const player = gameState.durumlar[item.uid];
    const titles = gameState.savas.unvanlar[item.uid] || [];

    const div = document.createElement('div');
    div.className = 'rank-item';
    if (index === 0) div.classList.add('first');

    div.innerHTML = `
      <div class="rank-position">${item.derece}</div>
      <div class="rank-info">
        <div class="rank-name">${player.name}</div>
        <div class="rank-stats">${item.puan} puan • ${item.hasar} hasar • ${item.butce}💰</div>
        ${titles.length > 0 ? `<div class="rank-titles">🏆 ${titles.join(', ')}</div>` : ''}
      </div>
    `;

    container.appendChild(div);
  });
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

function showToast(message) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 3000);
}

function handleResize() {
  if (gameState && document.getElementById('auction-screen') && !document.getElementById('auction-screen').classList.contains('hidden')) {
    updateAuctionUI();
  }
}

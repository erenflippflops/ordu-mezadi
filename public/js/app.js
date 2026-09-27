// ==================== SINGLE-DEVICE ORDU MEZADI - PHASE 2 ====================

let gameState = null;
let currentTurnStartTime = 0;
let timerInterval = null;
let playerNames = [];
let playerCount = 4;
let currentSeat = 0; // Which player's turn/view

// ==================== ENTRY SCREEN ====================

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
    updateAuctionUI();
  } else {
    showToast('Kaydedilmiş oyun bulunamadı');
  }
});

// ==================== SETUP SCREEN ====================

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

function setupPlayerInputs() {
  const container = document.getElementById('player-names-container');
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
    input.value = defaultNames[i];
    input.dataset.seat = i;

    div.appendChild(indicator);
    div.appendChild(input);
    container.appendChild(div);
  }
}

document.getElementById('btn-start-game').addEventListener('click', () => {
  // Get player names
  playerNames = [];
  document.querySelectorAll('.player-name-input input').forEach(input => {
    playerNames.push(input.value.trim() || `Oyuncu ${input.dataset.seat}`);
  });

  // Get game settings
  const mode = document.getElementById('game-mode').value;
  const era = mode === 'donem' ? document.getElementById('era-select').value : null;

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

    showScreen('auction-screen');
    updateAuctionUI();
    startTimer();
  } catch (error) {
    console.error('Game start error:', error);
    showToast('Oyun başlatılamadı');
  }
});

// ==================== AUCTION SCREEN ====================

function updateAuctionUI() {
  if (!gameState) return;

  const isMobile = window.innerWidth < 900;

  if (isMobile) {
    updateMobileAuction();
  } else {
    updateDesktopAuction();
  }

  // Update timer
  updateTimer();
}

function updateMobileAuction() {
  // Turn header
  document.getElementById('mobile-turn-current').textContent = gameState.turIndex + 1;
  document.getElementById('mobile-turn-total').textContent = gameState.turlar.length;

  // Current bid
  const bidAmount = gameState.teklif ? gameState.teklif.miktar : 0;
  document.getElementById('mobile-current-bid').textContent = bidAmount > 0 ? bidAmount : '-';

  // Item card
  updateItemCard('mobile-item-card');

  // Player info
  const myState = gameState.durumlar[`player_${currentSeat}`];
  if (myState) {
    document.getElementById('mobile-budget').textContent = myState.butce;
    document.getElementById('mobile-units').textContent = `${myState.birlikler.length}/5`;
  }

  // Update bid buttons
  updateBidButtons(true);

  // Player pills
  updatePlayerPills();
}

function updateDesktopAuction() {
  // Turn info
  document.getElementById('desktop-turn-current').textContent = gameState.turIndex + 1;
  document.getElementById('desktop-turn-total').textContent = gameState.turlar.length;

  // Item card
  updateItemCard('desktop-item-card');

  // Current bid
  const bidAmount = gameState.teklif ? gameState.teklif.miktar : 0;
  document.getElementById('desktop-current-bid').textContent = bidAmount > 0 ? bidAmount : '-';

  if (gameState.teklif) {
    const bidder = gameState.durumlar[gameState.teklif.uid];
    document.getElementById('desktop-bid-owner').textContent = bidder ? bidder.name : '';
  } else {
    document.getElementById('desktop-bid-owner').textContent = '';
  }

  // Player status
  const myState = gameState.durumlar[`player_${currentSeat}`];
  if (myState) {
    document.getElementById('desktop-budget').textContent = myState.butce;
    document.getElementById('desktop-units').textContent = `${myState.birlikler.length}/5`;
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
  const tur = gameState.turlar[gameState.turIndex];

  if (tur.olay === 'KOR_ARTIRMA' && gameState.faz === 'TEKLIF') {
    // Blind auction - show card back
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

    if (!birlik) return;

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
    // Chaos card
    const kaos = window.GameData.kaosKartlari.find(k => k.id === tur.id);
    if (!kaos) return;

    container.innerHTML = `
      <div class="item-card chaos-card">
        <div class="card-type">KAOS KARTI</div>
        <div class="card-icon">⚡</div>
        <div class="card-name">${kaos.ad}</div>
        <div class="card-description">${kaos.aciklama}</div>
      </div>
    `;
  }

  // Add event label if any
  if (tur.olay && gameState.faz === 'TEKLIF') {
    const eventNames = {
      'CIFT_YA_DA_HIC': '⚠️ Çift ya da Hiç',
      'ZORUNLU_HEDIYE': '🎁 Zorunlu Hediye',
      'KOR_ARTIRMA': '🙈 Kör Artırma'
    };
    const card = container.querySelector('.item-card');
    if (card && eventNames[tur.olay]) {
      const banner = document.createElement('div');
      banner.style.cssText = 'margin-top: 12px; padding: 8px; background: rgba(224, 83, 61, 0.2); border-radius: 4px; text-align: center; font-weight: 600; font-size: 14px; color: #E0533D;';
      banner.textContent = eventNames[tur.olay];
      card.appendChild(banner);
    }
  }
}

function updateBidButtons(isMobile) {
  const prefix = isMobile ? 'mobile' : 'desktop';
  const buttons = document.querySelectorAll(isMobile ? '.bid-btn' : '.bid-btn-desktop');
  const gasBtn = document.getElementById(`${prefix}-gas-btn`);

  const myUid = `player_${currentSeat}`;
  const myState = gameState.durumlar[myUid];
  if (!myState) return;

  const tur = gameState.turlar[gameState.turIndex];
  const bos = 5 - myState.birlikler.length;
  const maks = tur.tip === 'birlik' ? myState.butce - (bos - 1) : myState.butce - bos;
  const currentBid = gameState.teklif?.miktar || 0;
  const isMyBid = gameState.teklif?.uid === myUid;
  const canBid = gameState.faz === 'TEKLIF';

  buttons.forEach(btn => {
    const amount = parseInt(btn.dataset.amount);
    const newBid = currentBid + amount;
    btn.disabled = !canBid || isMyBid || newBid > maks;
  });

  gasBtn.disabled = myState.gazKullanildi || gameState.gaz || gameState.faz !== 'TEKLIF' ||
                   tur.tip !== 'birlik' || tur.olay === 'ZORUNLU_HEDIYE';
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

    initial.textContent = player.name[0].toUpperCase();
    budget.textContent = player.butce;

    // Highlight current bidder
    if (gameState.teklif && gameState.teklif.uid === uid) {
      pill.classList.add('current-bidder');
    } else {
      pill.classList.remove('current-bidder');
    }
  });
}

function updateDesktopArmies() {
  const container = document.getElementById('desktop-armies');
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
  container.innerHTML = '';

  // Show last 10 turns in reverse order
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

    // Auto-progress when time runs out
    if (gameState.faz === 'TEKLIF') {
      const elapsed = Date.now() - currentTurnStartTime;
      if (elapsed >= 15000) {
        progressTurn();
      }
    }
  }, 100);
}

function updateTimer() {
  if (gameState.faz !== 'TEKLIF') return;

  const elapsed = Date.now() - currentTurnStartTime;
  const remaining = Math.max(0, Math.ceil((15000 - elapsed) / 1000));

  // Update mobile timer
  const mobileCountdown = document.getElementById('mobile-countdown');
  if (mobileCountdown) {
    mobileCountdown.textContent = remaining;
    if (remaining <= 5) {
      mobileCountdown.classList.add('warning');
    } else {
      mobileCountdown.classList.remove('warning');
    }
  }

  // Update desktop timer
  const desktopCountdown = document.getElementById('desktop-countdown');
  if (desktopCountdown) {
    desktopCountdown.textContent = remaining;
    if (remaining <= 5) {
      desktopCountdown.classList.add('warning');
    } else {
      desktopCountdown.classList.remove('warning');
    }
  }

  // Last 5 seconds: add red border animation to card
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

document.querySelectorAll('.bid-btn, .bid-btn-desktop').forEach(btn => {
  btn.addEventListener('click', () => {
    const amount = parseInt(btn.dataset.amount);
    makeBid(amount);
  });
});

document.getElementById('mobile-gas-btn').addEventListener('click', () => {
  useGas();
});

document.getElementById('desktop-gas-btn').addEventListener('click', () => {
  useGas();
});

function makeBid(amount) {
  if (!gameState || gameState.faz !== 'TEKLIF') return;

  const myUid = `player_${currentSeat}`;
  const now = Date.now();

  const result = window.GameEngine.teklifVer(gameState, myUid, amount, now);

  if (result.hata) {
    showToast(result.hata);
    return;
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

  saveGame();
  updateAuctionUI();
}

function progressTurn() {
  if (!gameState) return;

  const now = Date.now();
  gameState = window.GameEngine.ilerle(gameState, now);
  currentTurnStartTime = now;

  saveGame();

  // Check if game ended
  if (gameState.faz === 'SAVAS') {
    clearInterval(timerInterval);
    startBattle();
  } else {
    updateAuctionUI();
  }
}

// ==================== BATTLE SCREEN ====================

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

    <div class="battle-armies">
      <div class="battle-army" id="army-a"></div>
      <div class="battle-army" id="army-b"></div>
    </div>

    <div class="battle-narration" id="battle-narration"></div>
  `;

  // Show armies
  showBattleArmies(duel, playerA, playerB);

  // Animate rounds
  animateBattle(duel);

  document.getElementById('btn-next-duel').classList.add('hidden');
  document.getElementById('btn-skip-battle').classList.remove('hidden');
}

function showBattleArmies(duel, playerA, playerB) {
  const armyAContainer = document.getElementById('army-a');
  const armyBContainer = document.getElementById('army-b');

  duel.orduA.forEach(unitName => {
    const div = document.createElement('div');
    div.className = 'battle-unit';

    const birlik = window.GameData.birlikler.find(b => b.ad === unitName) ||
                   window.GameData.yedekler.find(b => b.ad === unitName);

    div.innerHTML = `
      <span class="battle-unit-icon">${birlik?.ikon || '⚔️'}</span>
      <span class="battle-unit-name">${unitName}</span>
    `;

    armyAContainer.appendChild(div);
  });

  duel.orduB.forEach(unitName => {
    const div = document.createElement('div');
    div.className = 'battle-unit';

    const birlik = window.GameData.birlikler.find(b => b.ad === unitName) ||
                   window.GameData.yedekler.find(b => b.ad === unitName);

    div.innerHTML = `
      <span class="battle-unit-icon">${birlik?.ikon || '⚔️'}</span>
      <span class="battle-unit-name">${unitName}</span>
    `;

    armyBContainer.appendChild(div);
  });
}

async function animateBattle(duel) {
  battleAnimating = true;

  const narration = document.getElementById('battle-narration');
  const hpBarA = document.getElementById('hp-bar-a');
  const hpBarB = document.getElementById('hp-bar-b');

  for (let i = 0; i < duel.raundlar.length; i++) {
    if (!battleAnimating) break;

    const raund = duel.raundlar[i];

    // Type out narration
    await typeText(narration, `Raund ${i + 1}: ${raund.gA} vs ${raund.gB} hasar...`);
    await sleep(800);

    // Update HP bars
    hpBarA.style.width = `${raund.canA}%`;
    hpBarA.textContent = raund.canA;
    if (raund.canA < 30) hpBarA.classList.add('low');

    hpBarB.style.width = `${raund.canB}%`;
    hpBarB.textContent = raund.canB;
    if (raund.canB < 30) hpBarB.classList.add('low');

    await sleep(1000);

    if (raund.canA === 0 || raund.canB === 0) break;
  }

  // Show winner
  const winner = duel.kazanan === 'A' ? duel.uidA : duel.kazanan === 'B' ? duel.uidB : null;
  if (winner) {
    const winnerName = gameState.durumlar[winner].name;
    await typeText(narration, `\n\n${winnerName} kazandı!`);
  } else {
    await typeText(narration, '\n\nBerabere!');
  }

  battleAnimating = false;
  document.getElementById('btn-next-duel').classList.remove('hidden');
  document.getElementById('btn-skip-battle').classList.add('hidden');
}

async function typeText(element, text) {
  for (const char of text) {
    if (!battleAnimating) break;
    element.textContent += char;
    await sleep(30);
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

document.getElementById('btn-skip-battle').addEventListener('click', () => {
  battleAnimating = false;
});

document.getElementById('btn-next-duel').addEventListener('click', () => {
  currentDuelIndex++;
  showNextDuel();
});

// ==================== RESULTS SCREEN ====================

function showResults() {
  showScreen('results-screen');

  const container = document.getElementById('final-ranking');
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

document.getElementById('btn-new-game-results').addEventListener('click', () => {
  gameState = null;
  localStorage.removeItem('ordu-mezadi-save');
  localStorage.removeItem('ordu-mezadi-names');
  showScreen('entry-screen');
});

// ==================== UTILITIES ====================

function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
  document.getElementById(screenId).classList.remove('hidden');
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
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 3000);
}

// ==================== RESPONSIVE HANDLING ====================

window.addEventListener('resize', () => {
  if (gameState && document.getElementById('auction-screen').classList.contains('screen') && !document.getElementById('auction-screen').classList.contains('hidden')) {
    updateAuctionUI();
  }
});

// ==================== INITIALIZATION ====================

setupPlayerInputs();

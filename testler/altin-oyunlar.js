// Altın oyunlar - Bölüm 16
import { test } from 'node:test';
import assert from 'node:assert';
import { oyunKur, ilerle, teklifVer } from '../public/js/motor.js';

// Altın oyun 1: Section 16 exact golden values
test('Altın Oyun 1 - ALTIN1 seed exact match', () => {
  const seed = 'ALTIN1';
  const uids = ['u1', 'u2'];
  let durum = oyunKur(seed, 'klasik', null, uids);
  let simdi = 1000000000;

  // Skip HAZIRLIK
  durum.fazBitis = simdi;
  durum = ilerle(durum, simdi + 100);

  assert.strictEqual(durum.faz, 'TEKLIF', 'Should start in TEKLIF');
  assert.strictEqual(durum.turIndex, 0);

  // Play through all 16 turns with section 16 bidding pattern:
  // u1 bids +5 on even turIndex, u2 bids +5 on odd turIndex
  // Only turn 3 is critical (both bid)
  // No bid on Zorunlu hediye turn

  for (let i = 0; i < 16; i++) {
    if (durum.faz === 'TEKLIF') {
      const tur = durum.turlar[durum.turIndex];

      // Skip Zorunlu hediye
      if (tur.olay !== 'ZORUNLU_HEDIYE') {
        const bidderUid = (durum.turIndex % 2 === 0) ? 'u1' : 'u2';
        simdi += 1000;
        teklifVer(durum, bidderUid, 5, simdi);
      }

      // Close turn
      durum.fazBitis = simdi;
      simdi += 100;
      durum = ilerle(durum, simdi);
    }

    // Skip SONUC
    if (durum.faz === 'SONUC') {
      simdi += 4000;
      durum.fazBitis = simdi;
      durum = ilerle(durum, simdi);
    }
  }

  // Assert final state
  assert.strictEqual(durum.faz, 'SAVAS', 'Should reach SAVAS');
  assert.strictEqual(durum.durumlar.u1.butce, 80, 'u1 budget should be 80');
  assert.strictEqual(durum.durumlar.u2.butce, 80, 'u2 budget should be 80');
  assert.strictEqual(durum.durumlar.u1.birlikler.length, 5);
  assert.strictEqual(durum.durumlar.u2.birlikler.length, 5);

  // Check exact deck order (first 5 units)
  const expectedDeck = ['A04', 'A08', 'A05', 'A07', 'A06'];
  for (let i = 0; i < 5; i++) {
    const tur = durum.turlar[i];
    if (tur.tip === 'birlik') {
      assert.strictEqual(tur.id, expectedDeck[i], `Turn ${i} should be ${expectedDeck[i]}`);
    }
  }

  // Check battle rounds exist
  assert.ok(durum.savas, 'Battle data should exist');
  assert.ok(durum.savas.duellolar, 'Duels should exist');
  assert.strictEqual(durum.savas.duellolar.length, 3, 'Should have 3 battle rounds');

  console.log('✓ Altın Oyun 1 - Section 16 exact match passed');
});

// Altın oyun 2: Section 16 Osmanlı mode
test('Altın Oyun 2 - ALTIN2 osmanli mode', () => {
  const seed = 'ALTIN2';
  const uids = ['a', 'b', 'c'];
  let durum = oyunKur(seed, 'osmanli', null, uids);
  let simdi = 2000000000;

  // Skip HAZIRLIK
  durum.fazBitis = simdi;
  durum = ilerle(durum, simdi + 100);

  // Check that one player is Osmanlı
  const osmanliPlayers = uids.filter(uid => durum.durumlar[uid].takim === 'osmanli');
  assert.strictEqual(osmanliPlayers.length, 1, 'Exactly one player should be Osmanlı');
  assert.strictEqual(osmanliPlayers[0], 'a', 'Player "a" should be Osmanlı in this seed');

  // Play through to battle
  let turCount = 0;
  const maxTurns = 100;

  while (durum.faz !== 'SAVAS' && turCount < maxTurns) {
    turCount++;

    if (durum.faz === 'TEKLIF') {
      const tur = durum.turlar[durum.turIndex];
      const bidderUid = uids[turCount % 3];
      const oyuncu = durum.durumlar[bidderUid];

      const bos = 5 - oyuncu.birlikler.length;
      const maks = tur.tip === 'birlik' ? oyuncu.butce - (bos - 1) : oyuncu.butce - bos;

      if (maks >= 5) {
        simdi += 1000;
        teklifVer(durum, bidderUid, 5, simdi);
      }

      durum.fazBitis = simdi;
      simdi += 100;
      durum = ilerle(durum, simdi);
    }

    if (durum.faz === 'SONUC') {
      simdi += 4000;
      durum.fazBitis = simdi;
      durum = ilerle(durum, simdi);
    }
  }

  assert.strictEqual(durum.faz, 'SAVAS', 'Should reach SAVAS');
  assert.strictEqual(durum.durumlar.a.birlikler.length, 5);
  assert.strictEqual(durum.durumlar.b.birlikler.length, 5);
  assert.strictEqual(durum.durumlar.c.birlikler.length, 5);

  console.log('✓ Altın Oyun 2 - Osmanlı mode passed');
});

console.log('✓ All golden tests passed');

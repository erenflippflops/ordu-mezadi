// Altın oyunlar - Section 16 exact golden values
import { test } from 'node:test';
import assert from 'node:assert';
import { oyunKur, ilerle, teklifVer } from '../public/js/motor.js';

// Golden Game 1: ALTIN1, klasik, 2 players
test('Altın Oyun 1 - ALTIN1 klasik exact match', () => {
  const seed = 'ALTIN1';
  const uids = ['u1', 'u2'];
  let durum = oyunKur(seed, 'klasik', null, uids);
  let simdi = 1000000000;

  // Verify deck (turlar[i].id and olay)
  const expectedDeck = [
    { id: 'M06', olay: null },
    { id: 'O09', olay: null },
    { id: 'T01', olay: 'ZORUNLU_HEDIYE' },
    { id: 'T09', olay: null },
    { id: 'O13', olay: null },
    { id: 'K02', olay: null },
    { id: 'O02', olay: null },
    { id: 'O05', olay: 'KOR_ARTIRMA' },
    { id: 'T12', olay: null },
    { id: 'O08', olay: null },
    { id: 'O12', olay: null },
    { id: 'O01', olay: null },
    { id: 'A12', olay: null },
    { id: 'A15', olay: null },
    { id: 'A09', olay: null },
    { id: 'K06', olay: null }
  ];

  expectedDeck.forEach((expected, i) => {
    assert.strictEqual(durum.turlar[i].id, expected.id, `Turn ${i} id should be ${expected.id}`);
    const actualOlay = durum.turlar[i].olay || null;
    assert.strictEqual(actualOlay, expected.olay, `Turn ${i} olay should be ${expected.olay}`);
  });

  // Play through turns with bidding
  // u1 bids on even turIndex, u2 on odd
  // Bid when more than 5000ms remain, except turn 3: bid with 2000ms left
  while (durum.faz !== 'SAVAS') {
    // Advance to next phase
    simdi = durum.fazBitis + 100;
    durum = ilerle(durum, simdi);

    if (durum.faz === 'TEKLIF') {
      const bidderUid = (durum.turIndex % 2 === 0) ? 'u1' : 'u2';

      // Turn 3 - critical bid (2000ms left)
      if (durum.turIndex === 3) {
        simdi = durum.fazBitis - 2000;
      } else {
        // Non-critical - more than 5000ms remain
        simdi = durum.fazBitis - 10000;
      }

      teklifVer(durum, bidderUid, 5, simdi);
    }
  }

  // Verify turn logs
  const expectedLogs = [
    { sonuc: 'SATILDI', kazanan: 'u1', fiyat: 5, damgalar: ['KELEPİR'] },
    { sonuc: 'SATILDI', kazanan: 'u2', fiyat: 5, damgalar: ['KELEPİR'] },
    { sonuc: 'HEDİYE', kazanan: 'u1', fiyat: 0, damgalar: [] },
    { sonuc: 'SATILDI', kazanan: 'u2', fiyat: 5, damgalar: ['TROLLENDİN', 'KAPTIN_KAÇTIN'] },
    { sonuc: 'SATILDI', kazanan: 'u1', fiyat: 5, damgalar: ['KELEPİR'] },
    { sonuc: 'SATILDI', kazanan: 'u2', fiyat: 5, damgalar: [] },
    { sonuc: 'SATILDI', kazanan: 'u1', fiyat: 5, damgalar: ['KELEPİR'] },
    { sonuc: 'SATILDI', kazanan: 'u2', fiyat: 5, damgalar: ['KELEPİR'] },
    { sonuc: 'SATILDI', kazanan: 'u1', fiyat: 5, damgalar: [] }
  ];

  expectedLogs.forEach((expected, i) => {
    const log = durum.log[i];
    assert.strictEqual(log.sonuc, expected.sonuc, `Turn ${i} sonuc`);
    assert.strictEqual(log.kazanan, expected.kazanan, `Turn ${i} kazanan`);
    assert.strictEqual(log.fiyat, expected.fiyat, `Turn ${i} fiyat`);
    assert.deepStrictEqual(log.damgalar, expected.damgalar, `Turn ${i} damgalar`);
  });

  // Verify final state
  assert.strictEqual(durum.durumlar.u1.butce, 80, 'u1 budget should be 80');
  assert.strictEqual(durum.durumlar.u2.butce, 80, 'u2 budget should be 80');

  const u1Army = durum.durumlar.u1.birlikler.map(b => b.id);
  const u2Army = durum.durumlar.u2.birlikler.map(b => b.id);
  assert.deepStrictEqual(u1Army, ['M06', 'T01', 'O13', 'O02', 'T12'], 'u1 army');
  assert.deepStrictEqual(u2Army, ['O09', 'T09', 'O05', 'O08', 'O12'], 'u2 army');

  const u1Chaos = durum.durumlar.u1.kaos;
  const u2Chaos = durum.durumlar.u2.kaos;
  assert.deepStrictEqual(u1Chaos, [], 'u1 chaos should be empty');
  assert.deepStrictEqual(u2Chaos, ['K02'], 'u2 chaos should have K02');

  // Verify battle
  assert.strictEqual(durum.savas.duellolar.length, 1, 'Should have 1 duel');
  const duel = durum.savas.duellolar[0];

  // Hain Casus (K02) moves T01 from u1 to u2
  assert.strictEqual(duel.hainLog.length, 1, 'Should have 1 hain effect');
  assert.strictEqual(duel.hainLog[0].taraf, 'B', 'Hain should move to taraf B');
  assert.strictEqual(duel.hainLog[0].birlik, 'Türk Annesi', 'Hain should move Türk Annesi (T01)');
  assert.strictEqual(duel.orduB.length, 6, 'u2 should have 6 units after hain');
  assert.strictEqual(duel.orduA.length, 4, 'u1 should have 4 units after hain');
  assert.ok(duel.orduB.includes('Türk Annesi'), 'u2 army should include Türk Annesi');

  // Verify rounds
  const expectedRounds = [
    { PA: 219, PB: 291, dA: 21, dB: 29, canA: 71, canB: 79 },
    { PA: 182, PB: 173, dA: 26, dB: 24, canA: 47, canB: 53 },
    { PA: 158, PB: 176, dA: 24, dB: 26, canA: 21, canB: 29 }
  ];

  assert.strictEqual(duel.raundlar.length, 3, 'Should have 3 rounds');
  expectedRounds.forEach((expected, i) => {
    const round = duel.raundlar[i];
    assert.strictEqual(round.PA, expected.PA, `Round ${i} PA`);
    assert.strictEqual(round.PB, expected.PB, `Round ${i} PB`);
    assert.strictEqual(round.dA, expected.dA, `Round ${i} dA`);
    assert.strictEqual(round.dB, expected.dB, `Round ${i} dB`);
    assert.strictEqual(round.canA, expected.canA, `Round ${i} canA`);
    assert.strictEqual(round.canB, expected.canB, `Round ${i} canB`);
  });

  // Verify winner
  const winner = durum.savas.siralama[0];
  assert.strictEqual(winner.uid, 'u2', 'u2 should win');
  assert.strictEqual(winner.puan, 3, 'Winner should have 3 points');

  // Verify titles
  const unvanlar = durum.savas.unvanlar;
  assert.ok(unvanlar.u2.includes('Başkomutan'), 'u2 should have Başkomutan');
  assert.ok(unvanlar.u1.includes('Cimri'), 'u1 should have Cimri');
  assert.ok(unvanlar.u2.includes('Cimri'), 'u2 should have Cimri');
  assert.ok(unvanlar.u1.includes('Müsrif'), 'u1 should have Müsrif');
  assert.ok(unvanlar.u2.includes('Müsrif'), 'u2 should have Müsrif');
  assert.ok(unvanlar.u1.includes('Kelepirci'), 'u1 should have Kelepirci');
  assert.ok(unvanlar.u1.includes('Troll Kurbanı'), 'u1 should have Troll Kurbanı');
  assert.ok(unvanlar.u2.includes('Troll Kurbanı'), 'u2 should have Troll Kurbanı');

  console.log('✓ Altın Oyun 1 passed');
});

// Golden Game 2: ALTIN2, osmanli, 3 players
test('Altın Oyun 2 - ALTIN2 osmanli exact match', () => {
  const seed = 'ALTIN2';
  const uids = ['a', 'b', 'c'];
  let durum = oyunKur(seed, 'osmanli', null, uids);

  // Verify Osmanlı player
  assert.strictEqual(durum.osmanliUid, 'a', 'osmanliUid should be "a"');

  // Verify turn order (deck)
  const expectedDeck = [
    'A12', 'M02', 'A13', 'O03', 'K03', 'O04', 'T07', 'O07',
    'M10', 'T09', 'O15', 'M04', 'T05', 'O06', 'O11', 'O08',
    'K04', 'O09', 'T06', 'K05', 'A11', 'A03'
  ];

  expectedDeck.forEach((expected, i) => {
    assert.strictEqual(durum.turlar[i].id, expected, `Turn ${i} should be ${expected}`);
  });

  console.log('✓ Altın Oyun 2 passed');
});

console.log('✓ All golden tests completed');

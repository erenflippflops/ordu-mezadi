// Altın oyunlar - Bölüm 16
import { test } from 'node:test';
import assert from 'node:assert';
import { oyunKur, ilerle, teklifVer, savas, unvanlar } from '../motor.js';

// Altın oyun 1: 2 oyuncu, klasik mod
test('Altın Oyun 1 - 2 oyuncu klasik', () => {
  const seed = 'ALTIN1234567';
  const uids = ['alice', 'bob'];
  let durum = oyunKur(seed, 'klasik', null, uids);
  let simdi = 1000000000;

  // HAZIRLIK -> ilk tur
  durum.fazBitis = simdi;
  durum = ilerle(durum, simdi + 100);

  assert.strictEqual(durum.faz, 'TEKLIF', 'İlk tur TEKLIF fazında başlamalı');
  assert.strictEqual(durum.turIndex, 0);

  // İlk turda Alice teklif verir
  simdi += 1000;
  teklifVer(durum, 'alice', 10, simdi);
  assert.strictEqual(durum.teklif.miktar, 10);

  // Turu kapat
  durum.fazBitis = simdi;
  simdi += 100;
  durum = ilerle(durum, simdi);
  assert.strictEqual(durum.faz, 'SONUC');

  // Oyunu sonuna kadar oynat
  let turSayisi = 0;
  const maxTur = 100; // Sonsuz döngü koruması

  while (durum.faz !== 'SAVAS' && turSayisi < maxTur) {
    turSayisi++;

    // SONUC'tan sonra
    if (durum.faz === 'SONUC') {
      simdi += 4000;
      durum.fazBitis = simdi;
      durum = ilerle(durum, simdi + 100);
    }

    // TEKLIF'te rastgele teklif ver
    if (durum.faz === 'TEKLIF') {
      const tur = durum.turlar[durum.turIndex];
      const oyuncuUid = turSayisi % 2 === 0 ? 'alice' : 'bob';
      const oyuncu = durum.durumlar[oyuncuUid];

      // Uygunsa teklif ver
      const bos = 5 - oyuncu.birlikler.length;
      const maks = tur.tip === 'birlik' ? oyuncu.butce - (bos - 1) : oyuncu.butce - bos;

      if (maks >= 1) {
        simdi += 1000;
        teklifVer(durum, oyuncuUid, 1, simdi);
      }

      // Turu kapat
      durum.fazBitis = simdi;
      simdi += 100;
      durum = ilerle(durum, simdi);
    }
  }

  assert.strictEqual(durum.faz, 'SAVAS', 'Oyun SAVAS fazına ulaşmalı');
  assert.strictEqual(durum.durumlar.alice.birlikler.length, 5);
  assert.strictEqual(durum.durumlar.bob.birlikler.length, 5);
  assert.ok(durum.savas, 'Savaş verisi hesaplanmalı');
  assert.ok(durum.savas.siralama, 'Sıralama olmalı');
  assert.ok(durum.savas.unvanlar, 'Unvanlar olmalı');

  // Altın değerler
  console.log('Altın Oyun 1 sonuçları:');
  console.log('Alice bütçe:', durum.durumlar.alice.butce);
  console.log('Bob bütçe:', durum.durumlar.bob.butce);
  console.log('Sıralama:', durum.savas.siralama.map(s => ({ uid: s.uid, derece: s.derece, puan: s.puan })));
});

// Altın oyun 2: 3 oyuncu, troll gecesi
test('Altın Oyun 2 - 3 oyuncu troll gecesi', () => {
  const seed = 'TROLL2345678';
  const uids = ['p1', 'p2', 'p3'];
  let durum = oyunKur(seed, 'troll', null, uids);
  let simdi = 2000000000;

  // Oyunu sonuna kadar oynat
  durum.fazBitis = simdi;
  durum = ilerle(durum, simdi + 100);

  let turSayisi = 0;
  const maxTur = 150;

  while (durum.faz !== 'SAVAS' && turSayisi < maxTur) {
    turSayisi++;

    if (durum.faz === 'SONUC') {
      simdi += 4000;
      durum.fazBitis = simdi;
      durum = ilerle(durum, simdi + 100);
    }

    if (durum.faz === 'TEKLIF') {
      const tur = durum.turlar[durum.turIndex];
      const oyuncuIndex = turSayisi % 3;
      const oyuncuUid = uids[oyuncuIndex];
      const oyuncu = durum.durumlar[oyuncuUid];

      const bos = 5 - oyuncu.birlikler.length;
      const maks = tur.tip === 'birlik' ? oyuncu.butce - (bos - 1) : oyuncu.butce - bos;

      if (maks >= 1) {
        simdi += 500;
        teklifVer(durum, oyuncuUid, 1, simdi);
      }

      durum.fazBitis = simdi;
      simdi += 100;
      durum = ilerle(durum, simdi);
    }
  }

  assert.strictEqual(durum.faz, 'SAVAS');
  assert.strictEqual(durum.durumlar.p1.birlikler.length, 5);
  assert.strictEqual(durum.durumlar.p2.birlikler.length, 5);
  assert.strictEqual(durum.durumlar.p3.birlikler.length, 5);

  // Troll gecesinde 2 kaos kartı limiti
  uids.forEach(uid => {
    assert.ok(durum.durumlar[uid].kaos.length <= 2, `${uid} en fazla 2 kaos kartına sahip olmalı`);
  });

  console.log('Altın Oyun 2 sonuçları:');
  console.log('P1 bütçe:', durum.durumlar.p1.butce);
  console.log('P2 bütçe:', durum.durumlar.p2.butce);
  console.log('P3 bütçe:', durum.durumlar.p3.butce);
  console.log('Sıralama:', durum.savas.siralama.map(s => ({ uid: s.uid, derece: s.derece, puan: s.puan })));
});

console.log('✓ Altın oyunlar tamamlandı');

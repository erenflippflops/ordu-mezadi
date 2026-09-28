// Temel birim testleri
import { test } from 'node:test';
import assert from 'node:assert';
import { fnv1a, mulberry32, rngFor, shuffle } from '../public/js/rastgele.js';
import { birlikler, yedekler, kaosKartlari, modlar } from '../public/js/veri.js';
import {
  normalize,
  dogrula,
  oyunKur,
  maksTeklif,
  uygunMu,
  teklifVer,
  gazVer,
  hesaplaDeger,
  ilerle,
  dagit,
  savas,
  unvanlar,
  YETENEK_CARPANLARI,
  KARSI_KOYMA
} from '../public/js/motor.js';

test('RNG - fnv1a hash', () => {
  const h1 = fnv1a('test');
  const h2 = fnv1a('test');
  const h3 = fnv1a('test2');

  assert.strictEqual(h1, h2, 'Same input should give same hash');
  assert.notStrictEqual(h1, h3, 'Different input should give different hash');
  assert.strictEqual(typeof h1, 'number');
});

test('RNG - mulberry32 determinism', () => {
  const r1 = mulberry32(12345);
  const r2 = mulberry32(12345);

  const v1a = r1();
  const v1b = r1();
  const v2a = r2();
  const v2b = r2();

  assert.strictEqual(v1a, v2a, 'Same seed should produce same sequence');
  assert.strictEqual(v1b, v2b, 'Same seed should produce same sequence');
  assert.notStrictEqual(v1a, v1b, 'Should produce different values');
});

test('RNG - shuffle determinism', () => {
  const arr = [1, 2, 3, 4, 5];
  const r1 = rngFor('TESTSEED', 'shuffle1');
  const r2 = rngFor('TESTSEED', 'shuffle1');

  const s1 = shuffle(arr, r1);
  const s2 = shuffle(arr, r2);

  assert.deepStrictEqual(s1, s2, 'Same seed should shuffle identically');
  assert.strictEqual(s1.length, arr.length, 'Length should be preserved');
});

test('Veri - birlikler listesi', () => {
  assert.strictEqual(birlikler.length, 59, '59 oyun birliği olmalı');
  assert.strictEqual(yedekler.length, 4, '4 yedek birlik olmalı');
  assert.strictEqual(kaosKartlari.length, 6, '6 kaos kartı olmalı');
  assert.strictEqual(modlar.length, 6, '6 mod olmalı');

  // İlk birlik kontrolü
  assert.strictEqual(birlikler[0].id, 'A01');
  assert.strictEqual(birlikler[0].ad, 'Geçidin Kralı');

  // Yedek birlik kontrolü
  assert.strictEqual(yedekler[0].id, 'Y01');
  assert.strictEqual(yedekler[0].kademe, 'yedek');
});

test('Motor - normalize', () => {
  const durum = normalize({
    durumlar: {
      'uid1': {}
    }
  });

  assert.ok(durum.uids);
  assert.ok(Array.isArray(durum.durumlar.uid1.birlikler));
  assert.ok(Array.isArray(durum.durumlar.uid1.kaos));
  assert.strictEqual(durum.durumlar.uid1.butce, 0);
  assert.strictEqual(durum.durumlar.uid1.dayiAktif, false);
});

test('Motor - oyunKur temel', () => {
  const seed = 'TEST1234ABCD';
  const uids = ['p1', 'p2'];
  const durum = oyunKur(seed, 'klasik', null, uids);

  assert.strictEqual(durum.seed, seed);
  assert.strictEqual(durum.mod, 'klasik');
  assert.strictEqual(durum.N, 2);
  assert.strictEqual(durum.faz, 'HAZIRLIK');
  assert.strictEqual(durum.durumlar.p1.butce, 100);
  assert.strictEqual(durum.durumlar.p2.butce, 100);
  assert.ok(durum.turlar.length > 0);
});

test('Motor - oyunKur Fakir mod', () => {
  const durum = oyunKur('SEED12345678', 'fakir', null, ['p1', 'p2']);

  assert.strictEqual(durum.durumlar.p1.butce, 30);
  assert.strictEqual(durum.durumlar.p2.butce, 30);
});

test('Motor - oyunKur Osmanlı mod', () => {
  const durum = oyunKur('SEED12345678', 'osmanli', null, ['p1', 'p2', 'p3']);

  assert.ok(durum.osmanliUid !== null, 'Osmanlı oyuncusu seçilmeli');
  assert.ok(['p1', 'p2', 'p3'].includes(durum.osmanliUid));
});

test('Motor - oyunKur Dönem düellosu', () => {
  const durum = oyunKur('SEED12345678', 'donem', 'antik', ['p1', 'p2']);

  assert.strictEqual(durum.cag, 'antik');

  // Destede sadece antik çağdan birlikler olmalı
  durum.turlar.forEach(tur => {
    if (tur.tip === 'birlik') {
      const birlik = birlikler.find(b => b.id === tur.id);
      if (birlik && !birlik.kademe.startsWith('troll')) {
        assert.strictEqual(birlik.cag, 'antik', `${birlik.id} antik çağdan olmalı`);
      }
    }
  });
});

test('Motor - maksTeklif birlik', () => {
  const oyuncu = { butce: 100, birlikler: [] };
  const maks = maksTeklif(oyuncu, 'birlik');
  assert.strictEqual(maks, 96, 'Boş slot 5, maks = 100 - (5-1) = 96');
});

test('Motor - maksTeklif kaos', () => {
  const oyuncu = { butce: 100, birlikler: [] };
  const maks = maksTeklif(oyuncu, 'kaos');
  assert.strictEqual(maks, 95, 'Boş slot 5, maks = 100 - 5 = 95');
});

test('Motor - teklifVer geçerli', () => {
  const durum = oyunKur('SEED12345678', 'klasik', null, ['p1', 'p2']);
  durum.faz = 'TEKLIF';
  durum.fazBitis = Date.now() + 10000;

  const sonuc = teklifVer(durum, 'p1', 5, Date.now());

  assert.ok(sonuc.basarili);
  assert.strictEqual(durum.teklif.uid, 'p1');
  assert.strictEqual(durum.teklif.miktar, 5);
});

test('Motor - teklifVer aynı oyuncu iki kez', () => {
  const durum = oyunKur('SEED12345678', 'klasik', null, ['p1', 'p2']);
  durum.faz = 'TEKLIF';
  const simdi = Date.now();
  durum.fazBitis = simdi + 10000;

  teklifVer(durum, 'p1', 5, simdi);
  const sonuc2 = teklifVer(durum, 'p1', 1, simdi);

  assert.strictEqual(sonuc2.hata, 'Zaten en yüksek teklif senin');
});

test('Motor - teklifVer maksimum aşımı', () => {
  const durum = oyunKur('SEED12345678', 'klasik', null, ['p1', 'p2']);
  durum.faz = 'TEKLIF';
  const simdi = Date.now();
  durum.fazBitis = simdi + 10000;

  const sonuc = teklifVer(durum, 'p1', 200, simdi);

  assert.ok(sonuc.hata);
  assert.ok(sonuc.hata.includes('en fazla'));
});

test('Motor - son saniye uzatması', () => {
  const durum = oyunKur('SEED12345678', 'klasik', null, ['p1', 'p2']);
  durum.faz = 'TEKLIF';
  const simdi = Date.now();
  durum.fazBitis = simdi + 3000; // 3 saniye kala

  teklifVer(durum, 'p1', 5, simdi);

  assert.ok(durum.fazBitis >= simdi + 5000, 'Süre 5 saniyeye uzamalı');
});

test('Motor - kritik teklif işareti', () => {
  const durum = oyunKur('SEED12345678', 'klasik', null, ['p1', 'p2']);
  durum.faz = 'TEKLIF';
  const simdi = Date.now();
  durum.fazBitis = simdi + 2000; // 2 saniye kala

  teklifVer(durum, 'p1', 5, simdi);

  assert.strictEqual(durum.teklif.kritik, true);
});

test('Motor - gazVer geçerli', () => {
  const durum = oyunKur('SEED12345678', 'klasik', null, ['p1', 'p2']);
  durum.faz = 'TEKLIF';

  const sonuc = gazVer(durum, 'p1');

  assert.ok(sonuc.basarili);
  assert.strictEqual(durum.gaz.uid, 'p1');
  assert.strictEqual(durum.durumlar.p1.gazKullanildi, true);
});

test('Motor - gazVer ikinci kullanım', () => {
  const durum = oyunKur('SEED12345678', 'klasik', null, ['p1', 'p2']);
  durum.faz = 'TEKLIF';

  gazVer(durum, 'p1');
  const sonuc2 = gazVer(durum, 'p1');

  assert.strictEqual(sonuc2.hata, 'Gaz hakkını kullandın');
});

test('Motor - hesaplaDeger', () => {
  const deger = hesaplaDeger('A01', 100); // Geçidin Kralı, güç 66
  const beklenen = Math.max(1, Math.round(Math.max(1, Math.round(66 * 0.45)) * 100 / 100));
  assert.strictEqual(deger, beklenen);
});

test('Motor - dogrula geçerli', () => {
  const durum = oyunKur('SEED12345678', 'klasik', null, ['p1', 'p2']);
  const errors = dogrula(durum);

  assert.strictEqual(errors.length, 0, 'Yeni oyun geçerli olmalı');
});

test('Motor - dogrula bütçe < boş slot', () => {
  const durum = oyunKur('SEED12345678', 'klasik', null, ['p1', 'p2']);
  durum.durumlar.p1.butce = 3; // 5 boş slot, 3 altın -> geçersiz

  const errors = dogrula(durum);

  assert.ok(errors.length > 0);
  assert.ok(errors[0].includes('bütçe'));
});

test('Motor - YETENEK_CARPANLARI toplamları', () => {
  const yetenekler = ['YOK', 'ILK_DARBE', 'SON_NEFES', 'ISINMA'];

  yetenekler.forEach(yetenek => {
    const carpanlar = YETENEK_CARPANLARI[yetenek];
    const toplam = carpanlar[0] + carpanlar[1] + carpanlar[2];
    assert.strictEqual(toplam, 3, `${yetenek} toplamı 3 olmalı`);
  });

  // KORKAK'ın toplamı farklı
  const korkakToplam = YETENEK_CARPANLARI.KORKAK[0] + YETENEK_CARPANLARI.KORKAK[1] + YETENEK_CARPANLARI.KORKAK[2];
  assert.ok(korkakToplam < 3, 'KORKAK toplamı 3\'ten az olmalı');
});

test('Motor - KARSI_KOYMA simetri', () => {
  assert.strictEqual(KARSI_KOYMA.piyade.yendigi, 'suvari');
  assert.strictEqual(KARSI_KOYMA.piyade.yenildigi, 'menzilli');

  assert.strictEqual(KARSI_KOYMA.suvari.yendigi, 'menzilli');
  assert.strictEqual(KARSI_KOYMA.suvari.yenildigi, 'piyade');

  assert.strictEqual(KARSI_KOYMA.menzilli.yendigi, 'piyade');
  assert.strictEqual(KARSI_KOYMA.menzilli.yenildigi, 'suvari');
});

test('Motor - ilerle HAZIRLIK -> TEKLIF', () => {
  const durum = oyunKur('SEED12345678', 'klasik', null, ['p1', 'p2']);
  const simdi = Date.now();
  durum.fazBitis = simdi;

  const yeniDurum = ilerle(durum, simdi + 100);

  assert.strictEqual(yeniDurum.faz, 'TEKLIF');
  assert.strictEqual(yeniDurum.turIndex, 0);
});

test('Motor - tam oyun akışı (mini)', () => {
  const durum = oyunKur('TESTSEED1234', 'klasik', null, ['p1', 'p2']);
  let simdi = Date.now();

  // HAZIRLIK -> TEKLIF
  durum.fazBitis = simdi;
  let guncel = ilerle(durum, simdi + 100);
  assert.strictEqual(guncel.faz, 'TEKLIF');

  // Teklif ver
  simdi += 1000;
  teklifVer(guncel, 'p1', 5, simdi);

  // TEKLIF -> SONUC
  guncel.fazBitis = simdi;
  guncel = ilerle(guncel, simdi + 100);
  assert.strictEqual(guncel.faz, 'SONUC');
  assert.ok(guncel.log[0]);

  // SONUC -> sonraki tur veya SAVAS
  simdi += 4000;
  guncel.fazBitis = simdi;
  guncel = ilerle(guncel, simdi + 100);

  // Daha fazla tur varsa TEKLIF, yoksa SAVAS
  assert.ok(guncel.faz === 'TEKLIF' || guncel.faz === 'SAVAS');
});

console.log('✓ Tüm birim testler tamamlandı');

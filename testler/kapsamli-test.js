// Kapsamlı test - tüm senaryolar
import { oyunKur, ilerle, teklifVer, gazVer, dogrula } from '../motor.js';
import { birlikler } from '../veri.js';

console.log('🔍 KAPSAMLI TEST BAŞLIYOR...\n');

let testSayisi = 0;
let basarili = 0;
let hatalar = [];

function test(isim, fn) {
  testSayisi++;
  try {
    fn();
    basarili++;
    console.log(`✓ ${isim}`);
  } catch (e) {
    hatalar.push({ isim, hata: e.message });
    console.log(`✗ ${isim}: ${e.message}`);
  }
}

// 1. TÜM MODLARDA OYUN KURULUMU
test('Klasik mod kurulum', () => {
  const d = oyunKur('TEST1', 'klasik', null, ['p1', 'p2']);
  if (d.durumlar.p1.butce !== 100) throw new Error('Bütçe yanlış');
  if (d.turlar.length === 0) throw new Error('Tur yok');
});

test('Fakir mod düşük bütçe', () => {
  const d = oyunKur('TEST2', 'fakir', null, ['p1', 'p2']);
  if (d.durumlar.p1.butce !== 30) throw new Error('Fakir mod bütçesi 30 olmalı');
});

test('Osmanlı mod - oyuncu seçimi', () => {
  const d = oyunKur('TEST3', 'osmanli', null, ['p1', 'p2', 'p3']);
  if (!d.osmanliUid) throw new Error('Osmanlı oyuncusu seçilmedi');
  if (!['p1', 'p2', 'p3'].includes(d.osmanliUid)) throw new Error('Geçersiz Osmanlı oyuncusu');
});

test('Troll gecesi - yüksek troll oranı', () => {
  const d = oyunKur('TEST4', 'troll', null, ['p1', 'p2']);
  const trollSayisi = d.turlar.filter(t => {
    if (t.tip !== 'birlik') return false;
    const birlik = birlikler.find(b => b.id === t.id);
    return birlik && birlik.kademe.startsWith('troll');
  }).length;
  if (trollSayisi < 5) throw new Error('Troll gecesinde az troll var');
});

test('Dönem düellosu - sadece antik birlikleri', () => {
  const d = oyunKur('TEST5', 'donem', 'antik', ['p1', 'p2']);
  const yanlisCag = d.turlar.find(t => {
    if (t.tip !== 'birlik') return false;
    const birlik = birlikler.find(b => b.id === t.id);
    return birlik && birlik.cag !== 'antik' && birlik.cag !== 'tum';
  });
  if (yanlisCag) throw new Error('Antik dönemde başka çağdan birlik var');
});

// 2. TEKLİF MEKANİKLERİ
test('Geçerli teklif', () => {
  const d = oyunKur('TEST6', 'klasik', null, ['p1', 'p2']);
  d.faz = 'TEKLIF';
  d.fazBitis = Date.now() + 10000;
  const sonuc = teklifVer(d, 'p1', 5, Date.now());
  if (!sonuc.basarili) throw new Error('Geçerli teklif reddedildi');
});

test('Maksimum teklif aşımı engelleniyor', () => {
  const d = oyunKur('TEST7', 'klasik', null, ['p1', 'p2']);
  d.faz = 'TEKLIF';
  d.fazBitis = Date.now() + 10000;
  const sonuc = teklifVer(d, 'p1', 500, Date.now());
  if (!sonuc.hata) throw new Error('Aşırı teklif kabul edildi');
});

test('Aynı oyuncu iki kez teklif veremiyor', () => {
  const d = oyunKur('TEST8', 'klasik', null, ['p1', 'p2']);
  d.faz = 'TEKLIF';
  const simdi = Date.now();
  d.fazBitis = simdi + 10000;
  teklifVer(d, 'p1', 5, simdi);
  const sonuc2 = teklifVer(d, 'p1', 1, simdi + 100);
  if (!sonuc2.hata) throw new Error('Aynı oyuncu iki kez teklif verdi');
});

test('Son saniye uzatması çalışıyor', () => {
  const d = oyunKur('TEST9', 'klasik', null, ['p1', 'p2']);
  d.faz = 'TEKLIF';
  const simdi = Date.now();
  d.fazBitis = simdi + 3000;
  teklifVer(d, 'p1', 5, simdi);
  if (d.fazBitis < simdi + 5000) throw new Error('Süre uzatılmadı');
});

test('Kritik teklif işaretleniyor', () => {
  const d = oyunKur('TEST10', 'klasik', null, ['p1', 'p2']);
  d.faz = 'TEKLIF';
  const simdi = Date.now();
  d.fazBitis = simdi + 2000;
  teklifVer(d, 'p1', 5, simdi);
  if (!d.teklif.kritik) throw new Error('Kritik teklif işaretlenmedi');
});

// 3. GAZ MEKANİĞİ
test('Gaz verme başarılı', () => {
  const d = oyunKur('TEST11', 'klasik', null, ['p1', 'p2']);
  d.faz = 'TEKLIF';
  const sonuc = gazVer(d, 'p1');
  if (!sonuc.basarili) throw new Error('Gaz verilemedi');
  if (!d.gaz) throw new Error('Gaz kaydedilmedi');
});

test('Gaz iki kez kullanılamıyor', () => {
  const d = oyunKur('TEST12', 'klasik', null, ['p1', 'p2']);
  d.faz = 'TEKLIF';
  gazVer(d, 'p1');
  const sonuc2 = gazVer(d, 'p1');
  if (!sonuc2.hata) throw new Error('Gaz iki kez kullanıldı');
});

test('Aynı turda iki oyuncu gaz veremiyor', () => {
  const d = oyunKur('TEST13', 'klasik', null, ['p1', 'p2']);
  d.faz = 'TEKLIF';
  gazVer(d, 'p1');
  const sonuc = gazVer(d, 'p2');
  if (!sonuc.hata) throw new Error('İki oyuncu gaz verdi');
});

// 4. ÖZEL OLAYLAR
test('Çift ya da hiç - TURA (bedava)', () => {
  const d = oyunKur('TURA00000000', 'klasik', null, ['p1', 'p2']);

  // İlk birlik turunu bulup çift ya da hiç olayı ekle
  for (let i = 0; i < d.turlar.length; i++) {
    if (d.turlar[i].tip === 'birlik') {
      d.turlar[i].olay = 'CIFT_YA_DA_HIC';
      d.turIndex = i;
      break;
    }
  }

  d.faz = 'TEKLIF';
  const simdi = Date.now();
  d.fazBitis = simdi + 10000;

  teklifVer(d, 'p1', 10, simdi);
  d.fazBitis = simdi;

  const oncekiButce = d.durumlar.p1.butce;
  ilerle(d, simdi + 100);

  // TURA ise fiyat 0 olmalı
  if (d.log[d.turIndex] && d.log[d.turIndex].yaziTura === 'TURA') {
    if (d.durumlar.p1.butce !== oncekiButce) throw new Error('TURA bedava değil');
  }
});

test('Zorunlu hediye - en fakire gidiyor', () => {
  const d = oyunKur('TEST14', 'klasik', null, ['p1', 'p2']);
  d.durumlar.p1.butce = 50;
  d.durumlar.p2.butce = 80;

  for (let i = 0; i < d.turlar.length; i++) {
    if (d.turlar[i].tip === 'birlik') {
      d.turlar[i].olay = 'ZORUNLU_HEDIYE';
      d.turIndex = i;
      break;
    }
  }

  d.faz = 'TEKLIF';
  const simdi = Date.now();
  d.fazBitis = simdi;

  ilerle(d, simdi + 100);

  if (d.durumlar.p1.birlikler.length === 0) throw new Error('En fakir oyuncu hediye almadı');
});

// 5. KAOS KARTLARI
test('Pazarlıkçı Teyze - iade veriyor', () => {
  const d = oyunKur('TEST15', 'klasik', null, ['p1', 'p2']);

  // p1'e önce bir birlik ver
  d.durumlar.p1.birlikler.push({ id: 'A01', fiyat: 20, tur: 0, kaynak: 'artirma' });
  d.durumlar.p1.butce -= 20;

  // Kaos turu bul ve K03 yap
  for (let i = 0; i < d.turlar.length; i++) {
    if (d.turlar[i].tip === 'kaos') {
      d.turlar[i].id = 'K03';
      d.turIndex = i;
      break;
    }
  }

  d.faz = 'TEKLIF';
  const simdi = Date.now();
  d.fazBitis = simdi + 10000;

  const oncekiButce = d.durumlar.p1.butce;
  teklifVer(d, 'p1', 5, simdi);
  d.fazBitis = simdi;
  ilerle(d, simdi + 100);

  const iade = Math.floor(20 / 2);
  const beklenen = oncekiButce - 5 + iade;

  if (d.durumlar.p1.butce !== beklenen) throw new Error('Pazarlıkçı Teyze iadesi yanlış');
});

test('Dayı Torpili - aktif oluyor', () => {
  const d = oyunKur('TEST16', 'klasik', null, ['p1', 'p2']);

  for (let i = 0; i < d.turlar.length; i++) {
    if (d.turlar[i].tip === 'kaos') {
      d.turlar[i].id = 'K04';
      d.turIndex = i;
      break;
    }
  }

  d.faz = 'TEKLIF';
  const simdi = Date.now();
  d.fazBitis = simdi + 10000;

  teklifVer(d, 'p1', 5, simdi);
  d.fazBitis = simdi;
  ilerle(d, simdi + 100);

  if (!d.durumlar.p1.dayiAktif) throw new Error('Dayı Torpili aktif olmadı');
});

// 6. TAM OYUN AKIŞI
test('2 oyuncu tam oyun - SAVAS\'a ulaşıyor', () => {
  let d = oyunKur('FULLGAME12345', 'klasik', null, ['p1', 'p2']);
  let simdi = 1000000000;
  let turSayisi = 0;

  d.fazBitis = simdi;
  d = ilerle(d, simdi + 100);

  while (d.faz !== 'SAVAS' && turSayisi < 100) {
    turSayisi++;

    if (d.faz === 'SONUC') {
      simdi += 4000;
      d.fazBitis = simdi;
      d = ilerle(d, simdi + 100);
    }

    if (d.faz === 'TEKLIF') {
      const uid = turSayisi % 2 === 0 ? 'p1' : 'p2';
      const oyuncu = d.durumlar[uid];
      const bos = 5 - oyuncu.birlikler.length;
      const tur = d.turlar[d.turIndex];
      const maks = tur.tip === 'birlik' ? oyuncu.butce - (bos - 1) : oyuncu.butce - bos;

      if (maks >= 1) {
        simdi += 500;
        teklifVer(d, uid, 1, simdi);
      }

      d.fazBitis = simdi;
      simdi += 100;
      d = ilerle(d, simdi);
    }
  }

  if (d.faz !== 'SAVAS') throw new Error('Oyun SAVAS fazına ulaşamadı');
  if (d.durumlar.p1.birlikler.length !== 5) throw new Error('p1 5 birliğe ulaşamadı');
  if (d.durumlar.p2.birlikler.length !== 5) throw new Error('p2 5 birliğe ulaşamadı');
  if (!d.savas) throw new Error('Savaş hesaplanmadı');
});

test('4 oyuncu tam oyun - tüm düellolar', () => {
  let d = oyunKur('FULLGAME4P567', 'klasik', null, ['p1', 'p2', 'p3', 'p4']);
  let simdi = 2000000000;
  let turSayisi = 0;

  d.fazBitis = simdi;
  d = ilerle(d, simdi + 100);

  while (d.faz !== 'SAVAS' && turSayisi < 150) {
    turSayisi++;

    if (d.faz === 'SONUC') {
      simdi += 4000;
      d.fazBitis = simdi;
      d = ilerle(d, simdi + 100);
    }

    if (d.faz === 'TEKLIF') {
      const uid = ['p1', 'p2', 'p3', 'p4'][turSayisi % 4];
      simdi += 500;
      teklifVer(d, uid, 1, simdi);
      d.fazBitis = simdi;
      simdi += 100;
      d = ilerle(d, simdi);
    }
  }

  if (d.faz !== 'SAVAS') throw new Error('4 oyuncu oyunu SAVAS fazına ulaşamadı');
  if (d.savas.duellolar.length !== 6) throw new Error('6 düello olmalı (4 oyuncu)');
});

// 7. OSMANLI MODU ÖZEL TESTLER
test('Osmanlı modu - izin kontrolü', () => {
  const d = oyunKur('OSMANLI12345', 'osmanli', null, ['p1', 'p2']);

  // Osmanlı birliği bul
  let osmanliBirlikTur = null;
  for (let i = 0; i < d.turlar.length; i++) {
    if (d.turlar[i].tip === 'birlik') {
      const birlik = birlikler.find(b => b.id === d.turlar[i].id);
      if (birlik && birlik.osmanli === 'E' && !birlik.kademe.startsWith('troll')) {
        osmanliBirlikTur = i;
        break;
      }
    }
  }

  if (osmanliBirlikTur !== null) {
    d.turIndex = osmanliBirlikTur;
    d.faz = 'TEKLIF';
    d.fazBitis = Date.now() + 10000;

    // Osmanlı olmayan oyuncu Osmanlı birliğine teklif verememeli
    const osmanliOlmayan = d.osmanliUid === 'p1' ? 'p2' : 'p1';
    const sonuc = teklifVer(d, osmanliOlmayan, 5, Date.now());

    if (!sonuc.hata) throw new Error('Osmanlı olmayan Osmanlı birliğine teklif verebildi');
  }
});

// 8. BÜTÇE DEĞİŞMEZ KURALI
test('Bütçe değişmez kuralı korunuyor', () => {
  let d = oyunKur('BUDGET789012', 'klasik', null, ['p1', 'p2']);
  let simdi = 3000000000;

  d.fazBitis = simdi;
  d = ilerle(d, simdi + 100);

  for (let i = 0; i < 30 && d.faz !== 'SAVAS'; i++) {
    // Her adımda doğrula
    const errors = dogrula(d);
    if (errors.length > 0) {
      throw new Error(`Doğrulama hatası (adım ${i}): ${errors.join(', ')}`);
    }

    if (d.faz === 'SONUC') {
      simdi += 4000;
      d.fazBitis = simdi;
      d = ilerle(d, simdi + 100);
    }

    if (d.faz === 'TEKLIF') {
      simdi += 500;
      teklifVer(d, i % 2 === 0 ? 'p1' : 'p2', 1, simdi);
      d.fazBitis = simdi;
      simdi += 100;
      d = ilerle(d, simdi);
    }
  }
});

console.log('\n' + '='.repeat(60));
console.log(`SONUÇ: ${basarili}/${testSayisi} test başarılı`);

if (hatalar.length > 0) {
  console.log('\n❌ HATALAR:');
  hatalar.forEach(h => {
    console.log(`  - ${h.isim}: ${h.hata}`);
  });
  process.exit(1);
} else {
  console.log('\n✅ TÜM TESTLER BAŞARILI!');
  process.exit(0);
}

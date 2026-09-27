// Test - Altın Oyun 1 - Bölüm 16
const { oyunKur, teklifVer, normalize, dogrula } = require('./game-logic');
const { ilerle } = require('./faz');
const { birlikler } = require('./data');

console.log('=== ALTIN OYUN 1 TEST ===\n');

const seed = 'ALTIN1';
const uids = ['u1', 'u2'];
let durum = oyunKur(seed, 'klasik', null, uids);

console.log('Tohum:', seed);
console.log('Oyuncu sayısı:', durum.N);
console.log('Deste uzunluğu:', durum.turlar.length);
console.log('\nDeste sırası:');

durum.turlar.forEach((tur, i) => {
  if (tur.tip === 'birlik') {
    const birlik = birlikler.find(b => b.id === tur.id);
    const olayStr = tur.olay ? ` (${tur.olay})` : '';
    console.log(`  ${i}: ${tur.id} - ${birlik.ad}${olayStr}`);
  } else {
    console.log(`  ${i}: ${tur.id} (Kaos)`);
  }
});

// Beklenen deste
const beklenen = ['M06', 'O09', 'T01', 'T09', 'O13', 'K02', 'O02', 'O05', 'T12', 'O08', 'O12', 'O01', 'A12', 'A15', 'A09', 'K06'];
console.log('\nBeklenen deste:', beklenen.join(' · '));

const gercek = durum.turlar.map(t => t.id).join(' · ');
console.log('Gerçek deste:  ', gercek);

const desteDogru = JSON.stringify(durum.turlar.map(t => t.id)) === JSON.stringify(beklenen);
console.log('✓ Deste eşleşti mi?', desteDogru);

// Olayları kontrol et
console.log('\nOlaylar:');
durum.turlar.forEach((tur, i) => {
  if (tur.olay) {
    console.log(`  Tur ${i} (${tur.id}): ${tur.olay}`);
  }
});

// Simülasyon: çift turlarda u1, tek turlarda u2 teklif verir
console.log('\n=== Simülasyon Başlıyor ===\n');

let simdi = Date.now();
durum = ilerle(durum, simdi);

let turSayaci = 0;

while (durum.faz !== 'SAVAS' && turSayaci < 50) {
  turSayaci++;

  if (durum.faz === 'TEKLIF') {
    const turIndex = durum.turIndex;
    const tur = durum.turlar[turIndex];

    // Tur 3'te kritik teklif (son 2 saniyede)
    if (turIndex === 3) {
      simdi = durum.fazBitis - 2000;
    }

    const teklifVeren = turIndex % 2 === 0 ? 'u1' : 'u2';

    if (tur.olay !== 'ZORUNLU_HEDIYE') {
      const sonuc = teklifVer(durum, teklifVeren, 5, simdi);
      if (sonuc.hata) {
        console.log(`Tur ${turIndex}: ${teklifVeren} teklif veremedi - ${sonuc.hata}`);
      } else {
        console.log(`Tur ${turIndex} (${tur.id}): ${teklifVeren} → 5 altın teklif verdi`);
      }
    }
  }

  // Fazı ilerlet
  simdi = durum.fazBitis + 100;
  durum = ilerle(durum, simdi);

  // Doğrulama
  const hatalar = dogrula(durum);
  if (hatalar.length > 0) {
    console.error('DOĞRULAMA HATASI:', hatalar);
    break;
  }
}

console.log('\n=== Oyun Sonu ===\n');

console.log('u1 Ordu:');
durum.durumlar.u1.birlikler.forEach(b => {
  const birlik = birlikler.find(br => br.id === b.id);
  console.log(`  ${b.id} - ${birlik.ad} (${b.fiyat} altın, kaynak: ${b.kaynak})`);
});
console.log('u1 Kalan altın:', durum.durumlar.u1.butce);
console.log('u1 Kaos kartları:', durum.durumlar.u1.kaos);

console.log('\nu2 Ordu:');
durum.durumlar.u2.birlikler.forEach(b => {
  const birlik = birlikler.find(br => br.id === b.id);
  console.log(`  ${b.id} - ${birlik.ad} (${b.fiyat} altın, kaynak: ${b.kaynak})`);
});
console.log('u2 Kalan altın:', durum.durumlar.u2.butce);
console.log('u2 Kaos kartları:', durum.durumlar.u2.kaos);

// Beklenen sonuçlar
console.log('\n=== Beklenen Sonuçlar ===');
console.log('u1: M06, T01, O13, O02, T12 | 80 altın | Kaos: yok');
console.log('u2: O09, T09, O05, O08, O12 | 80 altın | Kaos: K02');

// Damgalar
console.log('\n=== Damgalar ===');
console.log('u1:', durum.durumlar.u1.damgalar);
console.log('u2:', durum.durumlar.u2.damgalar);

// Düello 0 sonucu
if (durum.savas) {
  console.log('\n=== Düello 0 (u1 vs u2) ===');
  const duello = durum.savas.duellolar[0];
  console.log('Hain:', duello.hainLog);
  duello.raundlar.forEach((r, i) => {
    console.log(`Raund ${i + 1}: PA=${r.PA} PB=${r.PB} dA=${r.dA} dB=${r.dB} CanA=${r.canA} CanB=${r.canB}`);
  });
  console.log('Kazanan:', duello.kazanan);

  console.log('\nBeklenen:');
  console.log('Raund 1: PA=219 PB=291 dA=21 dB=29 CanA=71 CanB=79');
  console.log('Raund 2: PA=182 PB=173 dA=26 dB=24 CanA=47 CanB=53');
  console.log('Raund 3: PA=158 PB=176 dA=24 dB=26 CanA=21 CanB=29');
  console.log('Kazanan: B (u2)');

  console.log('\n=== Unvanlar ===');
  console.log(durum.savas.unvanlar);
}

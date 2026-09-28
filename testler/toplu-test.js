// Toplu test - Bölüm 16: 6 mod × 3 oyuncu sayısı × 1000 oyun
import { oyunKur, ilerle, teklifVer, dogrula } from '../public/js/motor.js';

const MODLAR = ['klasik', 'osmanli', 'troll', 'kor', 'fakir', 'donem'];
const OYUNCU_SAYILARI = [2, 3, 4];
const OYUN_PER_CONFIG = 1000; // Her konfigürasyon için oyun sayısı

function randomSeed(index) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let seed = '';
  let n = index;
  for (let i = 0; i < 12; i++) {
    seed += alphabet[n % alphabet.length];
    n = Math.floor(n / alphabet.length);
  }
  return seed.padEnd(12, 'A');
}

function otomatikOyna(durum) {
  let simdi = 1000000000;
  let turSayisi = 0;
  const maxTur = 200;

  // HAZIRLIK -> ilk tur
  durum.fazBitis = simdi;
  durum = ilerle(durum, simdi + 100);

  const uids = [];
  for (let i = 0; i < durum.N; i++) {
    uids.push(durum.uids[i]);
  }

  while (durum.faz !== 'SAVAS' && turSayisi < maxTur) {
    turSayisi++;

    if (durum.faz === 'SONUC') {
      simdi += 4000;
      durum.fazBitis = simdi;
      durum = ilerle(durum, simdi + 100);
    }

    if (durum.faz === 'TEKLIF') {
      const tur = durum.turlar[durum.turIndex];

      // Rastgele bir oyuncu teklif versin
      const oyuncuIndex = turSayisi % uids.length;
      const oyuncuUid = uids[oyuncuIndex];
      const oyuncu = durum.durumlar[oyuncuUid];

      const bos = 5 - oyuncu.birlikler.length;
      const maks = tur.tip === 'birlik' ? oyuncu.butce - (bos - 1) : oyuncu.butce - bos;

      if (maks >= 1) {
        simdi += 500;
        const artis = Math.min(1 + (turSayisi % 3), maks - (durum.teklif?.miktar || 0));
        if (artis > 0) {
          teklifVer(durum, oyuncuUid, artis, simdi);
        }
      }

      durum.fazBitis = simdi;
      simdi += 100;
      durum = ilerle(durum, simdi);
    }
  }

  return durum;
}

console.log('Toplu test başlıyor...\n');

let toplamOyun = 0;
let toplamIhlal = 0;
const sonuclar = {};

MODLAR.forEach(mod => {
  OYUNCU_SAYILARI.forEach(N => {
    // Dönem düellosu 4 kişiyle oynanmaz
    if (mod === 'donem' && N === 4) return;

    const anahtar = `${mod}-${N}`;
    sonuclar[anahtar] = { oyunSayisi: 0, ihlalSayisi: 0 };

    for (let i = 0; i < OYUN_PER_CONFIG; i++) {
      const seed = randomSeed(toplamOyun);
      const uids = [];
      for (let j = 0; j < N; j++) {
        uids.push(`p${j + 1}`);
      }

      const cag = mod === 'donem' ? ['antik', 'orta', 'modern'][i % 3] : null;

      try {
        let durum = oyunKur(seed, mod, cag, uids);
        durum = otomatikOyna(durum);

        // Oyun sonu doğrulama
        const errors = dogrula(durum);

        if (errors.length > 0) {
          console.log(`❌ İhlal: ${mod} ${N} oyuncu, seed ${seed}`);
          console.log('  Hatalar:', errors);
          toplamIhlal++;
          sonuclar[anahtar].ihlalSayisi++;
        }

        // Ek kontroller
        if (durum.faz !== 'SAVAS') {
          console.log(`❌ Oyun SAVAS fazına ulaşamadı: ${mod} ${N} oyuncu`);
          toplamIhlal++;
          sonuclar[anahtar].ihlalSayisi++;
        }

        uids.forEach(uid => {
          if (durum.durumlar[uid].birlikler.length !== 5) {
            console.log(`❌ Oyuncu ${uid} 5 birliğe ulaşamadı: ${durum.durumlar[uid].birlikler.length}`);
            toplamIhlal++;
            sonuclar[anahtar].ihlalSayisi++;
          }
        });

        toplamOyun++;
        sonuclar[anahtar].oyunSayisi++;

      } catch (e) {
        console.log(`❌ Hata: ${mod} ${N} oyuncu, seed ${seed}`);
        console.log('  ', e.message);
        toplamIhlal++;
        sonuclar[anahtar].ihlalSayisi++;
        toplamOyun++;
        sonuclar[anahtar].oyunSayisi++;
      }
    }
  });
});

console.log('\n=== TOPLU TEST SONUÇLARI ===\n');
console.log('Konfigürasyon başına oyun sayısı:');
Object.keys(sonuclar).sort().forEach(anahtar => {
  const { oyunSayisi, ihlalSayisi } = sonuclar[anahtar];
  const durum = ihlalSayisi === 0 ? '✓' : '✗';
  console.log(`  ${durum} ${anahtar.padEnd(15)} : ${oyunSayisi} oyun, ${ihlalSayisi} ihlal`);
});

console.log(`\nToplam: ${toplamOyun} oyun`);
console.log(`Toplam ihlal: ${toplamIhlal}`);

if (toplamIhlal === 0) {
  console.log('\n✓ Tüm oyunlar geçerli!');
  process.exit(0);
} else {
  console.log('\n✗ İhlaller tespit edildi');
  process.exit(1);
}

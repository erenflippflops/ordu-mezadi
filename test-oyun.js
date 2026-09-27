// İnteraktif oyun testi
import { oyunKur, ilerle, teklifVer, gazVer } from './motor.js';
import { birlikler, yedekler } from './veri.js';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function soru(prompt) {
  return new Promise(resolve => {
    rl.question(prompt, resolve);
  });
}

function birlikBul(id) {
  let birlik = birlikler.find(b => b.id === id);
  if (!birlik) birlik = yedekler.find(b => b.id === id);
  return birlik;
}

function durumGoster(durum) {
  console.log('\n' + '='.repeat(60));
  console.log(`FĂZ: ${durum.faz} | TUR: ${durum.turIndex + 1}/${durum.turlar.length}`);

  if (durum.faz === 'TEKLIF' || durum.faz === 'SONUC') {
    const tur = durum.turlar[durum.turIndex];
    console.log(`\nTUR TİPİ: ${tur.tip}`);

    if (tur.tip === 'birlik') {
      const birlik = birlikBul(tur.id);
      console.log(`BİRLİK: ${birlik.ikon} ${birlik.ad} (${birlik.adet} adet, ${birlik.tip})`);
      console.log(`AÇIKLAMA: ${birlik.aciklama}`);
      if (tur.olay) console.log(`⚠️  OLAY: ${tur.olay}`);
    } else {
      console.log(`KAOS KARTI: ${tur.id}`);
    }

    if (durum.teklif) {
      console.log(`\n💰 Mevcut teklif: ${durum.teklif.miktar} altın (${durum.teklif.uid})`);
    } else {
      console.log('\n💰 Henüz teklif yok');
    }

    if (durum.gaz) {
      console.log(`🔥 GAZ VERİLDİ: ${durum.gaz.uid}`);
    }
  }

  console.log('\nOYUNCULAR:');
  Object.keys(durum.durumlar).forEach(uid => {
    const oyuncu = durum.durumlar[uid];
    const bos = 5 - oyuncu.birlikler.length;
    console.log(`\n  ${uid}:`);
    console.log(`    💰 Bütçe: ${oyuncu.butce} altın`);
    console.log(`    🎴 Birlikler: ${oyuncu.birlikler.length}/5`);
    if (oyuncu.birlikler.length > 0) {
      oyuncu.birlikler.forEach(b => {
        const birlik = birlikBul(b.id);
        console.log(`       - ${birlik.ikon} ${birlik.ad} (${b.fiyat} altın, ${b.kaynak})`);
      });
    }
    if (oyuncu.kaos.length > 0) {
      console.log(`    🃏 Kaos: ${oyuncu.kaos.join(', ')}`);
    }
    if (oyuncu.damgalar.length > 0) {
      console.log(`    🏷️  Damgalar: ${oyuncu.damgalar.map(d => d.damga).join(', ')}`);
    }
    if (oyuncu.dayiAktif) {
      console.log(`    ✨ Dayı Torpili AKTİF`);
    }
  });

  if (durum.faz === 'SONUC' && durum.log[durum.turIndex]) {
    const log = durum.log[durum.turIndex];
    console.log(`\n📋 TUR SONUCU: ${log.sonuc}`);
    if (log.kazanan) {
      console.log(`   Kazanan: ${log.kazanan} (${log.fiyat} altın)`);
      if (log.damgalar.length > 0) {
        console.log(`   Damgalar: ${log.damgalar.join(', ')}`);
      }
      if (log.yaziTura) {
        console.log(`   Yazı-Tura: ${log.yaziTura}`);
      }
      if (log.iade > 0) {
        console.log(`   İade: ${log.iade} altın`);
      }
    }
  }

  if (durum.faz === 'SAVAS' && durum.savas) {
    console.log('\n🏆 SAVAŞ SONUÇLARI:');
    durum.savas.siralama.forEach((s, i) => {
      console.log(`  ${i + 1}. ${s.uid} - ${s.puan} puan, ${s.hasar} hasar, ${s.butce} altın`);
      if (durum.savas.unvanlar[s.uid].length > 0) {
        console.log(`     Unvanlar: ${durum.savas.unvanlar[s.uid].join(', ')}`);
      }
    });
  }

  console.log('='.repeat(60));
}

async function oyunOyna() {
  console.log('🎮 ORDU MEZADI - İNTERAKTİF TEST\n');

  const mod = await soru('Mod seçin (klasik/osmanli/troll/kor/fakir/donem): ');
  let cag = null;
  if (mod === 'donem') {
    cag = await soru('Çağ seçin (antik/orta/modern): ');
  }

  const oyuncuSayisi = parseInt(await soru('Oyuncu sayısı (2-4): '));
  const uids = [];
  for (let i = 0; i < oyuncuSayisi; i++) {
    uids.push(`p${i + 1}`);
  }

  const seed = 'TESTOYUN' + Date.now().toString().slice(-4);
  let durum = oyunKur(seed, mod, cag, uids);
  let simdi = Date.now();

  console.log(`\n✅ Oyun kuruldu! Seed: ${seed}`);

  // HAZIRLIK fazını atla
  durum.fazBitis = simdi;
  durum = ilerle(durum, simdi + 100);

  while (durum.faz !== 'SAVAS') {
    durumGoster(durum);

    if (durum.faz === 'TEKLIF') {
      const komut = await soru('\nKomut (t=teklif, g=gaz, s=sonraki tur, q=çık): ');

      if (komut === 'q') {
        console.log('Oyun sonlandırıldı.');
        break;
      }

      if (komut === 's') {
        // Turu teklifsiz kapat
        durum.fazBitis = simdi;
        simdi += 100;
        durum = ilerle(durum, simdi);
        continue;
      }

      if (komut === 't') {
        const uid = await soru('Oyuncu (p1/p2/...): ');
        const artis = parseInt(await soru('Artış miktarı: '));

        simdi += 1000;
        const sonuc = teklifVer(durum, uid, artis, simdi);

        if (sonuc.hata) {
          console.log(`❌ ${sonuc.hata}`);
        } else {
          console.log('✅ Teklif kabul edildi');
        }
        continue;
      }

      if (komut === 'g') {
        const uid = await soru('Oyuncu (p1/p2/...): ');
        const sonuc = gazVer(durum, uid);

        if (sonuc.hata) {
          console.log(`❌ ${sonuc.hata}`);
        } else {
          console.log('✅ Gaz verildi');
        }
        continue;
      }
    }

    if (durum.faz === 'SONUC') {
      await soru('\n[Enter] ile devam...');
      simdi += 4000;
      durum.fazBitis = simdi;
      durum = ilerle(durum, simdi + 100);
    }
  }

  durumGoster(durum);
  console.log('\n🎉 Oyun bitti!\n');
  rl.close();
}

oyunOyna().catch(console.error);

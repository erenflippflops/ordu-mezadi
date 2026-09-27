// Savaş hesabı - Bölüm 7
const { rngFor } = require('./rng');
const { birlikler, kaosKartlari } = require('./data');
const { YETENEK_CARPANLARI, KARSI_KOYMA } = require('./game-logic');

// Hain Casus seçimi - Bölüm 6 ve 7
function hainSec(ordu, r) {
  if (ordu.length === 0) return null;
  const index = Math.floor(r() * ordu.length);
  return index;
}

// Karşı çarpanı hesapla - Bölüm 7
function karsiCarpani(birlik, rakipOrdu) {
  let c = 1;

  const rakipTipler = new Set();
  rakipOrdu.forEach(b => rakipTipler.add(b.tip));

  if (birlik.tip === 'nisanci') {
    // Nişancı: adet=1 birlikleri yener, adet>=10 birliklere yenilir
    const adet1Var = rakipOrdu.some(b => b.adet === 1);
    const adet10Var = rakipOrdu.some(b => b.adet >= 10);
    if (adet1Var) c *= 1.3;
    if (adet10Var) c *= 0.8;
  } else {
    const kural = KARSI_KOYMA[birlik.tip];
    if (rakipTipler.has(kural.yendiği)) c *= 1.3;
    if (rakipTipler.has(kural.yenildiği)) c *= 0.8;
  }

  return c;
}

// Birliğin temel gücünü hesapla - Bölüm 7
function temelGuc(birlik, sahipKaos, rakipKaos, rakipOrdu) {
  let m = karsiCarpani(birlik, rakipOrdu);

  // Moral Konuşması
  if (sahipKaos.includes('K05')) {
    m *= 1.1;
  }

  // Yağmur
  if (rakipKaos.includes('K01') && (birlik.tip === 'menzilli' || birlik.tip === 'nisanci')) {
    m *= 0.5;
  }

  // Kıtlık
  if (rakipKaos.includes('K06') && birlik.adet >= 10) {
    m *= 0.8;
  }

  return birlik.guc * m;
}

// Düello hesapla - Bölüm 7
function duelloHesapla(seed, duelloIndex, oyuncuA, oyuncuB, durumA, durumB) {
  const r = rngFor(seed, "duello:" + duelloIndex);

  // Ordular
  let orduA = oyuncuA.birlikler.map(b => {
    const birlik = birlikler.find(br => br.id === b.id);
    return { ...birlik, sahip: 'A' };
  });

  let orduB = oyuncuB.birlikler.map(b => {
    const birlik = birlikler.find(br => br.id === b.id);
    return { ...birlik, sahip: 'B' };
  });

  const hainLog = [];

  // Hain Casus - A'nın Haini
  if (oyuncuA.kaos.includes('K02')) {
    const index = hainSec(orduB, r);
    if (index !== null) {
      const calinان = orduB[index];
      orduB.splice(index, 1);
      calinان.sahip = 'A';
      orduA.push(calinان);
      hainLog.push({ taraf: 'A', birlik: calinان.ad });
    }
  }

  // Hain Casus - B'nin Haini
  if (oyuncuB.kaos.includes('K02')) {
    const index = hainSec(orduA, r);
    if (index !== null) {
      const calinan = orduA[index];
      orduA.splice(index, 1);
      calinan.sahip = 'B';
      orduB.push(calinan);
      hainLog.push({ taraf: 'B', birlik: calinan.ad });
    }
  }

  // Temel güçleri hesapla
  const temelA = orduA.map(b => temelGuc(b, oyuncuA.kaos, oyuncuB.kaos, orduB));
  const temelB = orduB.map(b => temelGuc(b, oyuncuB.kaos, oyuncuA.kaos, orduA));

  // Raundlar
  let canA = 100;
  let canB = 100;
  const raundlar = [];
  let toplamPA = 0;
  let toplamPB = 0;
  let toplamHasarA = 0;
  let toplamHasarB = 0;

  for (let k = 1; k <= 3; k++) {
    const fA = 0.9 + 0.2 * r();
    const fB = 0.9 + 0.2 * r();

    let PA = 0;
    for (let i = 0; i < orduA.length; i++) {
      const yetenek = YETENEK_CARPANLARI[orduA[i].yetenek];
      PA += temelA[i] * yetenek[k - 1];
    }
    PA = Math.round(PA * fA);

    let PB = 0;
    for (let i = 0; i < orduB.length; i++) {
      const yetenek = YETENEK_CARPANLARI[orduB[i].yetenek];
      PB += temelB[i] * yetenek[k - 1];
    }
    PB = Math.round(PB * fB);

    toplamPA += PA;
    toplamPB += PB;

    let dA = 0, dB = 0;
    if (PA + PB > 0) {
      dA = Math.round(50 * PA / (PA + PB));
      dB = 50 - dA;
    }

    const gA = Math.min(dA, canB);
    const gB = Math.min(dB, canA);

    canA -= gB;
    canB -= gA;

    toplamHasarA += gA;
    toplamHasarB += gB;

    raundlar.push({ PA, PB, dA, dB, gA, gB, canA, canB });

    if (canA <= 0 || canB <= 0) break;
  }

  // Kazananı belirle
  let kazanan = null;
  if (canA > canB) {
    kazanan = 'A';
  } else if (canB > canA) {
    kazanan = 'B';
  } else if (toplamPA > toplamPB) {
    kazanan = 'A';
  } else if (toplamPB > toplamPA) {
    kazanan = 'B';
  } else if (oyuncuA.butce > oyuncuB.butce) {
    kazanan = 'A';
  } else if (oyuncuB.butce > oyuncuA.butce) {
    kazanan = 'B';
  } else {
    kazanan = 'berabere';
  }

  return {
    kazanan,
    raundlar,
    hainLog,
    toplamHasarA,
    toplamHasarB,
    orduA: orduA.map(b => b.ad),
    orduB: orduB.map(b => b.ad)
  };
}

// Tüm savaşı hesapla - Bölüm 7
function savasHesapla(durum) {
  const uids = [];
  for (let i = 0; i < durum.N; i++) {
    uids.push(durum.uids[i]);
  }

  const duellolar = [];
  const puanlar = {};
  const hasarlar = {};

  uids.forEach(uid => {
    puanlar[uid] = 0;
    hasarlar[uid] = 0;
  });

  let duelloIndex = 0;

  for (let i = 0; i < uids.length; i++) {
    for (let j = i + 1; j < uids.length; j++) {
      const uidA = uids[i];
      const uidB = uids[j];

      const oyuncuA = durum.durumlar[uidA];
      const oyuncuB = durum.durumlar[uidB];

      const sonuc = duelloHesapla(durum.seed, duelloIndex, oyuncuA, oyuncuB, durum.durumlar[uidA], durum.durumlar[uidB]);

      duellolar.push({
        uidA,
        uidB,
        ...sonuc
      });

      if (sonuc.kazanan === 'A') {
        puanlar[uidA] += 3;
      } else if (sonuc.kazanan === 'B') {
        puanlar[uidB] += 3;
      } else {
        puanlar[uidA] += 1;
        puanlar[uidB] += 1;
      }

      hasarlar[uidA] += sonuc.toplamHasarA;
      hasarlar[uidB] += sonuc.toplamHasarB;

      duelloIndex++;
    }
  }

  // Sıralama - Bölüm 7
  const siralama = uids.map(uid => ({
    uid,
    puan: puanlar[uid],
    hasar: hasarlar[uid],
    butce: durum.durumlar[uid].butce
  }));

  siralama.sort((a, b) => {
    if (a.puan !== b.puan) return b.puan - a.puan;
    if (a.hasar !== b.hasar) return b.hasar - a.hasar;
    if (a.butce !== b.butce) return b.butce - a.butce;
    return 0;
  });

  // Derece belirle
  siralama.forEach((item, i) => {
    if (i === 0) {
      item.derece = 1;
    } else {
      const prev = siralama[i - 1];
      if (item.puan === prev.puan && item.hasar === prev.hasar && item.butce === prev.butce) {
        item.derece = prev.derece;
      } else {
        item.derece = i + 1;
      }
    }
  });

  return {
    duellolar,
    puanlar,
    hasarlar,
    siralama
  };
}

// Unvanlar - Bölüm 8
function unvanlarHesapla(durum, savas) {
  const mod = require('./data').modlar.find(m => m.id === durum.mod);
  const unvanlar = {};

  Object.keys(durum.durumlar).forEach(uid => {
    unvanlar[uid] = [];
  });

  // Başkomutan
  const enYuksekDerece = Math.min(...savas.siralama.map(s => s.derece));
  savas.siralama.forEach(s => {
    if (s.derece === enYuksekDerece) {
      unvanlar[s.uid].push('Başkomutan');
    }
  });

  // Cimri (en düşük harcama)
  const harcamalar = {};
  Object.keys(durum.durumlar).forEach(uid => {
    const oyuncu = durum.durumlar[uid];
    harcamalar[uid] = mod.butce - oyuncu.butce;
  });

  const enDusukHarcama = Math.min(...Object.values(harcamalar));
  Object.keys(harcamalar).forEach(uid => {
    if (harcamalar[uid] === enDusukHarcama) {
      unvanlar[uid].push('Cimri');
    }
  });

  // Müsrif (tek seferde en yüksek ödeme)
  const enYuksekOdemeler = {};
  Object.keys(durum.durumlar).forEach(uid => {
    const oyuncu = durum.durumlar[uid];
    let enYuksek = 0;

    oyuncu.birlikler.forEach(b => {
      if (b.fiyat > enYuksek) enYuksek = b.fiyat;
    });

    oyuncu.kaos.forEach(kaosId => {
      const logEntry = Object.values(durum.log).find(l => l.kazanan === uid && durum.turlar[l.tur] && durum.turlar[l.tur].id === kaosId);
      if (logEntry && logEntry.fiyat > enYuksek) {
        enYuksek = logEntry.fiyat;
      }
    });

    enYuksekOdemeler[uid] = enYuksek;
  });

  const enYuksekOdeme = Math.max(...Object.values(enYuksekOdemeler));
  if (enYuksekOdeme > 0) {
    Object.keys(enYuksekOdemeler).forEach(uid => {
      if (enYuksekOdemeler[uid] === enYuksekOdeme) {
        unvanlar[uid].push('Müsrif');
      }
    });
  }

  // Kelepirci (en yüksek değer - fiyat farkı)
  const kelepirDegerleri = {};
  Object.keys(durum.durumlar).forEach(uid => {
    const oyuncu = durum.durumlar[uid];
    let enYuksekFark = 0;

    oyuncu.birlikler.forEach(b => {
      if (b.kaynak === 'artirma') {
        const deger = require('./game-logic').hesaplaDeger(b.id, mod.butce);
        const fark = deger - b.fiyat;
        if (fark > enYuksekFark) enYuksekFark = fark;
      }
    });

    kelepirDegerleri[uid] = enYuksekFark;
  });

  const enYuksekKelepir = Math.max(...Object.values(kelepirDegerleri));
  if (enYuksekKelepir > 0) {
    Object.keys(kelepirDegerleri).forEach(uid => {
      if (kelepirDegerleri[uid] === enYuksekKelepir) {
        unvanlar[uid].push('Kelepirci');
      }
    });
  }

  // Troll Kurbanı
  const trollOdemeleri = {};
  Object.keys(durum.durumlar).forEach(uid => {
    const oyuncu = durum.durumlar[uid];
    let toplam = 0;

    oyuncu.birlikler.forEach(b => {
      const birlik = birlikler.find(br => br.id === b.id);
      if (birlik && birlik.kademe === 'troll_sahte') {
        toplam += b.fiyat;
      }
    });

    trollOdemeleri[uid] = toplam;
  });

  const enYuksekTroll = Math.max(...Object.values(trollOdemeleri));
  if (enYuksekTroll > 0) {
    Object.keys(trollOdemeleri).forEach(uid => {
      if (trollOdemeleri[uid] === enYuksekTroll) {
        unvanlar[uid].push('Troll Kurbanı');
      }
    });
  }

  return unvanlar;
}

// Şablon anlatı - Bölüm 13
function sablonAnlati(duello, raundIndex, kazananAd, kaybedenAd) {
  const sablonlar = [
    "{kazanan} ordusu ileri atıldı, {birlik} saflarda dehşet saçtı!",
    "{kaybeden} savunmayı kurmaya çalıştı ama {birlik} durdurulamadı.",
    "Toz bulutu dağıldığında {kazanan} bir adım öndeydi. Kahraman: {birlik}.",
    "{birlik} öyle bir hamle yaptı ki {kaybeden} ordusu şaşkına döndü!",
    "{kaybeden} geri çekildi, {kazanan} sancağı tepeye dikti.",
    "Savaş muhabirimiz bildiriyor: {birlik} bugün tarih yazıyor!"
  ];

  const berabere = "İki ordu da geri adım atmadı, raund berabere!";

  const raund = duello.raundlar[raundIndex - 1];

  if (raund.gA === raund.gB) {
    return berabere;
  }

  const kazananTaraf = raund.gA > raund.gB ? 'A' : 'B';
  const ordu = kazananTaraf === 'A' ? duello.orduA : duello.orduB;
  const temelGucler = []; // Bu hesaplanmalı ama şimdilik ilk birliği kullan

  const birlikAd = ordu[0] || "Bilinmeyen Birlik";

  const sablonIndex = (duello.duelloIndex + raundIndex) % 6;
  const sablon = sablonlar[sablonIndex];

  return sablon
    .replace('{kazanan}', kazananAd)
    .replace('{kaybeden}', kaybedenAd)
    .replace('{birlik}', birlikAd);
}

module.exports = {
  duelloHesapla,
  savasHesapla,
  unvanlarHesapla,
  sablonAnlati
};

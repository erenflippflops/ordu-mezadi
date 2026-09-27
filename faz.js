// Faz ilerletme - Bölüm 12
const { normalize, dogrula, turKapat, zorunluHediye, bitisKontrol, dagit, uygunMu } = require('./game-logic');
const { savasHesapla, unvanlarHesapla } = require('./savas');

function ilerle(durum, simdi) {
  durum = normalize(durum);

  if (durum.faz === 'HAZIRLIK') {
    // İlk tura başla
    return turBaslat(durum, simdi);
  }

  if (durum.faz === 'TEKLIF') {
    // Turu kapat
    const tur = durum.turlar[durum.turIndex];

    if (tur.olay === 'ZORUNLU_HEDIYE') {
      zorunluHediye(durum);
    } else {
      turKapat(durum, simdi);
    }

    durum.faz = 'SONUC';

    // SONUC süresi
    const log = durum.log[durum.turIndex];
    if (log && (log.sonuc === 'KIMSE_ALAMAZ' || log.sonuc === 'ALINMADI')) {
      durum.fazBitis = simdi + 2000;
    } else {
      durum.fazBitis = simdi + 4000;
    }

    durum.surum++;
    return durum;
  }

  if (durum.faz === 'SONUC') {
    // Bitiş kontrolü
    if (bitisKontrol(durum)) {
      durum.artirmaBitti = true;

      // Dağıtım
      dagit(durum);

      // Savaş hesapla
      const savas = savasHesapla(durum);
      const unvanlar = unvanlarHesapla(durum, savas);

      durum.savas = {
        ...savas,
        unvanlar
      };

      durum.faz = 'SAVAS';
      durum.fazBitis = simdi + 999999999; // Savaş ekranı kullanıcı kontrolünde
      durum.surum++;
      return durum;
    }

    // Sonraki tura geç
    durum.turIndex++;
    return turBaslat(durum, simdi);
  }

  return durum;
}

function turBaslat(durum, simdi) {
  const tur = durum.turlar[durum.turIndex];

  durum.teklif = null;
  durum.gaz = null;

  // Uygun oyuncu var mı?
  const uygunOyuncular = [];
  Object.keys(durum.durumlar).forEach(uid => {
    if (uygunMu(durum, uid, tur)) {
      uygunOyuncular.push(uid);
    }
  });

  if (uygunOyuncular.length === 0) {
    durum.log[durum.turIndex] = {
      sonuc: 'KIMSE_ALAMAZ',
      kazanan: null,
      fiyat: 0,
      damgalar: [],
      yaziTura: null,
      iade: 0
    };
    durum.faz = 'SONUC';
    durum.fazBitis = simdi + 2000;
    durum.surum++;
    return durum;
  }

  // Zorunlu hediye mi?
  if (tur.olay === 'ZORUNLU_HEDIYE') {
    zorunluHediye(durum);
    durum.faz = 'SONUC';
    durum.fazBitis = simdi + 4000;
    durum.surum++;
    return durum;
  }

  // Normal teklif fazı
  durum.faz = 'TEKLIF';
  durum.fazBitis = simdi + 15000;
  durum.surum++;
  return durum;
}

module.exports = { ilerle, turBaslat };

// Oyun mantığı motoru - Bölüm 3-8, 11
import { rngFor, shuffle } from './rastgele.js';
import { birlikler, yedekler, kaosKartlari, modlar } from './veri.js';

// Yetenek çarpanları - Bölüm 7
const YETENEK_CARPANLARI = {
  YOK: [1, 1, 1],
  ILK_DARBE: [1.6, 0.7, 0.7],
  SON_NEFES: [0.7, 0.7, 1.6],
  ISINMA: [0.6, 1.0, 1.4],
  KORKAK: [1.2, 0.6, 0]
};

// Karşı koyma tablosu - Bölüm 7
const KARSI_KOYMA = {
  piyade: { yendigi: 'suvari', yenildigi: 'menzilli' },
  suvari: { yendigi: 'menzilli', yenildigi: 'piyade' },
  menzilli: { yendigi: 'piyade', yenildigi: 'suvari' },
  nisanci: { yendigi: 'adet1', yenildigi: 'adet10' }
};

// Normalize - Bölüm 12
function normalize(durum) {
  if (!durum) return null;

  const d = { ...durum };

  // Oyuncular
  if (!d.uids) d.uids = {};
  if (!d.durumlar) d.durumlar = {};

  Object.keys(d.durumlar).forEach(uid => {
    const oyuncu = d.durumlar[uid];
    if (!oyuncu.birlikler) oyuncu.birlikler = [];
    if (!oyuncu.kaos) oyuncu.kaos = [];
    if (!oyuncu.damgalar) oyuncu.damgalar = [];
    if (oyuncu.butce === undefined) oyuncu.butce = 0;
    if (oyuncu.dayiAktif === undefined) oyuncu.dayiAktif = false;
    if (oyuncu.iflasVerildi === undefined) oyuncu.iflasVerildi = false;
    if (oyuncu.gazKullanildi === undefined) oyuncu.gazKullanildi = false;
  });

  if (!d.turlar) d.turlar = [];
  if (!d.log) d.log = {};

  return d;
}

// Doğrulama - Bölüm 14
function dogrula(durum) {
  const errors = [];

  if (!durum) return ['Durum null'];

  const mod = modlar.find(m => m.id === durum.mod);
  if (!mod) return ['Geçersiz mod'];

  // Her oyuncu için kontroller
  Object.keys(durum.durumlar).forEach(uid => {
    const oyuncu = durum.durumlar[uid];
    const bos = 5 - oyuncu.birlikler.length;

    // 1. Bütçe >= boş slot sayısı
    if (oyuncu.butce < bos) {
      errors.push(`${uid}: bütçe (${oyuncu.butce}) < boş slot (${bos})`);
    }

    // 2. Bütçe >= 0 ve tam sayı
    if (oyuncu.butce < 0 || !Number.isInteger(oyuncu.butce)) {
      errors.push(`${uid}: geçersiz bütçe ${oyuncu.butce}`);
    }

    // 3. Birlik sayısı <= 5
    if (oyuncu.birlikler.length > 5) {
      errors.push(`${uid}: ${oyuncu.birlikler.length} birlik (max 5)`);
    }

    // 4. Faz SAVAS ise tam 5 birlik
    if (durum.faz === 'SAVAS' && oyuncu.birlikler.length !== 5) {
      errors.push(`${uid}: SAVAS fazında ${oyuncu.birlikler.length} birlik (5 olmalı)`);
    }

    // 5. Kaos kartı sayısı <= üst sınır
    if (oyuncu.kaos.length > mod.kaosUstSinir) {
      errors.push(`${uid}: ${oyuncu.kaos.length} kaos (max ${mod.kaosUstSinir})`);
    }

    // 6. Aynı kaos kartı iki kez yok
    const kaosSet = new Set(oyuncu.kaos);
    if (kaosSet.size !== oyuncu.kaos.length) {
      errors.push(`${uid}: tekrarlayan kaos kartı`);
    }
  });

  // 7. Yedek olmayan birlik en fazla bir oyuncuda
  const birlikSayaci = {};
  Object.values(durum.durumlar).forEach(oyuncu => {
    oyuncu.birlikler.forEach(b => {
      const birlik = birlikler.find(br => br.id === b.id);
      if (birlik && birlik.kademe !== 'yedek') {
        birlikSayaci[b.id] = (birlikSayaci[b.id] || 0) + 1;
      }
    });
  });

  Object.entries(birlikSayaci).forEach(([id, sayi]) => {
    if (sayi > 1) {
      errors.push(`Birlik ${id} ${sayi} oyuncuda (max 1)`);
    }
  });

  // 8. turIndex aralıkta
  if (durum.turIndex < 0 || durum.turIndex >= durum.turlar.length) {
    if (!(durum.artirmaBitti && durum.turIndex === durum.turlar.length - 1)) {
      errors.push(`turIndex ${durum.turIndex} aralık dışı (max ${durum.turlar.length - 1})`);
    }
  }

  return errors;
}

// Deste kurulumu - Bölüm 4
function desteKur(seed, mod, cag, N, uids) {
  const modData = modlar.find(m => m.id === mod);

  const desteBirlik = N * 5 + 4;
  const trollSay = Math.round(desteBirlik * modData.trollOrani);
  const trollOlmayan = desteBirlik - trollSay;

  function cek(havuz, k, etiket) {
    if (havuz.length < k) {
      throw new Error(`Havuzda ${havuz.length} birlik var, ${k} istendi (${etiket})`);
    }
    const karisik = shuffle(havuz, rngFor(seed, "deste:" + etiket));
    return karisik.slice(0, k);
  }

  let secilenler = [];
  let osmanliUid = null;

  if (mod === 'osmanli') {
    // Osmanlı oyuncusu seç
    const r = rngFor(seed, "osmanli");
    osmanliUid = uids[Math.floor(r() * N)];

    const osmanliEfsane = birlikler.filter(b => b.osmanli === 'E' && b.kademe === 'efsane');
    const osmanliBirlikleri = birlikler.filter(b => b.osmanli === 'E' && b.kademe !== 'efsane' && !b.kademe.startsWith('troll'));
    const dunyaEfsane = birlikler.filter(b => b.osmanli === '-' && b.kademe === 'efsane');
    const dunyaBirlikleri = birlikler.filter(b => b.osmanli === '-' && b.kademe !== 'efsane' && !b.kademe.startsWith('troll'));
    const trollHavuz = birlikler.filter(b => b.kademe === 'troll_gizli' || b.kademe === 'troll_sahte');

    secilenler = [
      ...cek(osmanliEfsane, 1, "osmanli-efsane"),
      ...cek(osmanliBirlikleri, 6, "osmanli-diger"),
      ...cek(dunyaEfsane, N - 1, "dunya-efsane"),
      ...cek(dunyaBirlikleri, trollOlmayan - 7 - (N - 1), "dunya-diger"),
      ...cek(trollHavuz, trollSay, "troll")
    ];
  } else {
    // Normal modlar ve dönem düellosu
    let normalHavuz = birlikler.filter(b => {
      if (b.kademe.startsWith('troll') || b.kademe === 'yedek') return false;
      if (mod === 'donem') return b.cag === cag;
      return true;
    });

    const trollHavuz = birlikler.filter(b => b.kademe === 'troll_gizli' || b.kademe === 'troll_sahte');

    const efsaneler = normalHavuz.filter(b => b.kademe === 'efsane');
    const diger = normalHavuz.filter(b => b.kademe !== 'efsane');

    secilenler = [
      ...cek(efsaneler, N, "efsane"),
      ...cek(diger, trollOlmayan - N, "diger"),
      ...cek(trollHavuz, trollSay, "troll")
    ];
  }

  return { secilenler, osmanliUid };
}

// Olay ve kaos yerleştirme - Bölüm 4
function desteTamamla(seed, mod, secilenler, N) {
  const modData = modlar.find(m => m.id === mod);

  // Birlik sırasını karıştır
  const birlikSirasi = shuffle(secilenler, rngFor(seed, "deste:sira"));
  const u = birlikSirasi.length;

  // Olay yerleştirme
  const olaySay = (N === 2 ? 2 : 3) + modData.ekOlay;

  const adaylar = [];
  for (let i = 2; i < u; i++) adaylar.push(i);

  const olayYerleri = shuffle(adaylar, rngFor(seed, "olay:yer")).slice(0, olaySay).sort((a, b) => a - b);

  let olayTipleri = ["KOR_ARTIRMA", "ZORUNLU_HEDIYE", "CIFT_YA_DA_HIC"];
  if (mod === 'kor') {
    olayTipleri = olayTipleri.filter(t => t !== 'KOR_ARTIRMA');
  }

  const r = rngFor(seed, "olay:tip");
  const olaylar = {};
  olayYerleri.forEach(yer => {
    olaylar[yer] = olayTipleri[Math.floor(r() * olayTipleri.length)];
  });

  // Kaos kartı yerleştirme
  const kaosSay = Math.min(N * modData.kaosCarpani, 6);
  const karisikKaos = shuffle(kaosKartlari.map(k => k.id), rngFor(seed, "kaos:kart")).slice(0, kaosSay);

  const bosluklar = [];
  for (let i = 3; i <= u; i++) bosluklar.push(i);
  const kaosYerleri = shuffle(bosluklar, rngFor(seed, "kaos:yer")).slice(0, kaosSay).sort((a, b) => a - b);

  // Tur listesi oluştur
  const turlar = [];
  for (let i = 0; i <= u; i++) {
    // Kaos kartı ekle
    const kaosIndex = kaosYerleri.indexOf(i);
    if (kaosIndex !== -1) {
      turlar.push({ tip: 'kaos', id: karisikKaos[kaosIndex], olay: null });
    }

    // Birlik turu ekle
    if (i < u) {
      const tur = {
        tip: 'birlik',
        id: birlikSirasi[i].id,
        olay: olaylar[i] || null
      };
      turlar.push(tur);
    }
  }

  return turlar;
}

// Oyun kurulumu - Bölüm 4
function oyunKur(seed, mod, cag, uids) {
  const N = uids.length;
  const modData = modlar.find(m => m.id === mod);

  const { secilenler, osmanliUid } = desteKur(seed, mod, cag, N, uids);
  const turlar = desteTamamla(seed, mod, secilenler, N);

  const durumlar = {};
  uids.forEach(uid => {
    durumlar[uid] = {
      butce: modData.butce,
      birlikler: [],
      kaos: [],
      damgalar: [],
      dayiAktif: false,
      iflasVerildi: false,
      gazKullanildi: false
    };
  });

  const uidsObj = {};
  uids.forEach((uid, i) => {
    uidsObj[i] = uid;
  });

  return {
    surum: 0,
    seed,
    mod,
    cag: cag || null,
    N,
    osmanliUid,
    uids: uidsObj,
    turlar,
    turIndex: 0,
    faz: 'HAZIRLIK',
    fazBitis: 0,
    teklif: null,
    gaz: null,
    artirmaBitti: false,
    durumlar,
    log: {},
    savas: null
  };
}

// Maksimum teklif - Bölüm 3
function maksTeklif(oyuncu, turTipi) {
  const bos = 5 - oyuncu.birlikler.length;
  if (turTipi === 'birlik') {
    return oyuncu.butce - (bos - 1);
  } else {
    return oyuncu.butce - bos;
  }
}

// Oyuncunun tura uygun olup olmadığı - Bölüm 3
function uygunMu(durum, uid, tur) {
  const oyuncu = durum.durumlar[uid];
  const mod = modlar.find(m => m.id === durum.mod);
  const bos = 5 - oyuncu.birlikler.length;

  if (bos < 1) return false;

  if (tur.tip === 'birlik') {
    // Mod izni kontrolü (sadece Osmanlı vs. Dünya'da)
    if (durum.mod === 'osmanli') {
      const birlik = birlikler.find(b => b.id === tur.id);
      if (birlik.osmanli === 'E' && uid !== durum.osmanliUid) return false;
      if (birlik.osmanli === '-' && uid === durum.osmanliUid && !birlik.kademe.startsWith('troll')) return false;
    }
    return true;
  } else {
    // Kaos turu
    if (oyuncu.kaos.length >= mod.kaosUstSinir) return false;
    if (oyuncu.butce - bos < 1) return false;
    return true;
  }
}

// Teklif verme - Bölüm 3
function teklifVer(durum, uid, artis, simdi) {
  const tur = durum.turlar[durum.turIndex];
  const oyuncu = durum.durumlar[uid];

  // Kontroller
  if (!uygunMu(durum, uid, tur)) {
    return { hata: 'Bu turda teklif veremezsin' };
  }

  if (durum.teklif && durum.teklif.uid === uid) {
    return { hata: 'Zaten en yüksek teklif senin' };
  }

  if (simdi >= durum.fazBitis) {
    return { hata: 'Süre doldu' };
  }

  const mevcutTeklif = durum.teklif ? durum.teklif.miktar : 0;
  const yeniTeklif = mevcutTeklif + artis;
  const maks = maksTeklif(oyuncu, tur.tip);

  if (yeniTeklif > maks) {
    return { hata: `Teklif geçersiz: en fazla ${maks} verebilirsin` };
  }

  // Teklifi kabul et
  const kalan = durum.fazBitis - simdi;
  const kritik = kalan <= 3000;

  durum.teklif = { uid, miktar: yeniTeklif, kritik };

  // Son saniye uzatması
  if (kalan < 5000) {
    durum.fazBitis = simdi + 5000;
  }

  durum.surum++;
  return { basarili: true };
}

// Gaz ver - Bölüm 8
function gazVer(durum, uid) {
  const oyuncu = durum.durumlar[uid];

  if (oyuncu.gazKullanildi) {
    return { hata: 'Gaz hakkını kullandın' };
  }

  if (durum.gaz) {
    return { hata: 'Bu turda başkası gaz verdi' };
  }

  const tur = durum.turlar[durum.turIndex];
  if (tur.tip !== 'birlik' || tur.olay === 'ZORUNLU_HEDIYE') {
    return { hata: 'Bu turda gaz verilemez' };
  }

  if (durum.faz !== 'TEKLIF') {
    return { hata: 'Sadece teklif fazında gaz verilebilir' };
  }

  durum.gaz = { uid };
  oyuncu.gazKullanildi = true;
  durum.surum++;

  return { basarili: true };
}

// Değer hesaplama - Bölüm 8
function hesaplaDeger(birlikId, butce) {
  const birlik = birlikler.find(b => b.id === birlikId);
  const deger = Math.max(1, Math.round(birlik.guc * 0.45));
  const olcekli = Math.max(1, Math.round(deger * butce / 100));
  return olcekli;
}

// Damga hesaplama - Bölüm 8
function damgaHesapla(durum, birlikId, fiyat, kritik) {
  const mod = modlar.find(m => m.id === durum.mod);
  const deger = hesaplaDeger(birlikId, mod.butce);
  const birlik = birlikler.find(b => b.id === birlikId);

  const damgalar = [];

  // In Kör mode, skip price stamps but still give KAPTIN_KAÇTIN
  if (durum.mod !== 'kor') {
    // Fiyat damgaları (only in non-Kör modes)
    if (birlik.kademe === 'troll_sahte' && fiyat >= 1.5 * deger) {
      damgalar.push('TROLLENDİN');
    } else if (fiyat >= 1.5 * deger) {
      damgalar.push('SOYULDUN');
    } else if (fiyat <= 0.5 * deger) {
      damgalar.push('KELEPİR');
    }
  }

  // KAPTIN KAÇTIN (always, including Kör mode)
  if (kritik) {
    damgalar.push('KAPTIN_KAÇTIN');
  }

  return damgalar;
}

// İFLAS kontrolü - Bölüm 8
function iflasKontrol(durum, uid) {
  const oyuncu = durum.durumlar[uid];
  const bos = 5 - oyuncu.birlikler.length;

  if (bos >= 2 && oyuncu.butce === bos && !oyuncu.iflasVerildi) {
    oyuncu.damgalar.push({ tur: durum.turIndex, damga: 'İFLAS' });
    oyuncu.iflasVerildi = true;
  }
}

// Tur kapanışı - Bölüm 3
function turKapat(durum, simdi) {
  const tur = durum.turlar[durum.turIndex];
  const turLog = { sonuc: null, kazanan: null, fiyat: 0, damgalar: [], yaziTura: null, iade: 0 };

  if (!durum.teklif) {
    turLog.sonuc = 'ALINMADI';
    durum.log[durum.turIndex] = turLog;
    return;
  }

  const kazananUid = durum.teklif.uid;
  const oyuncu = durum.durumlar[kazananUid];
  let fiyat = durum.teklif.miktar;
  const kritik = durum.teklif.kritik;

  if (tur.tip === 'birlik') {
    // Çift ya da hiç kontrolü
    if (tur.olay === 'CIFT_YA_DA_HIC') {
      const r = rngFor(durum.seed, "yazitura:" + durum.turIndex);
      if (r() < 0.5) {
        turLog.yaziTura = 'TURA';
        fiyat = 0;
      } else {
        turLog.yaziTura = 'YAZI';
        const maks = maksTeklif(oyuncu, 'birlik');
        fiyat = Math.min(2 * fiyat, maks);
      }
    }

    // Birliği ekle
    oyuncu.butce -= fiyat;
    oyuncu.birlikler.push({
      id: tur.id,
      fiyat,
      tur: durum.turIndex,
      kaynak: 'artirma'
    });

    // Damgalar
    const damgalar = damgaHesapla(durum, tur.id, fiyat, kritik);
    damgalar.forEach(d => {
      oyuncu.damgalar.push({ tur: durum.turIndex, damga: d });
    });

    turLog.damgalar = damgalar;

    // Dayı Torpili iadesi
    if (oyuncu.dayiAktif) {
      const iade = Math.floor(fiyat / 2);
      oyuncu.butce += iade;
      oyuncu.dayiAktif = false;
      turLog.iade = iade;
    }

    // İFLAS kontrolü
    iflasKontrol(durum, kazananUid);

  } else {
    // Kaos kartı
    oyuncu.butce -= fiyat;
    oyuncu.kaos.push(tur.id);

    // Anında etki
    const kart = kaosKartlari.find(k => k.id === tur.id);
    if (kart.id === 'K03') {
      // Pazarlıkçı Teyze
      let enYuksek = 0;
      oyuncu.birlikler.forEach(b => {
        if (b.fiyat > enYuksek) enYuksek = b.fiyat;
      });
      const iade = Math.floor(enYuksek / 2);
      oyuncu.butce += iade;
      turLog.iade = iade;
    } else if (kart.id === 'K04') {
      // Dayı Torpili
      oyuncu.dayiAktif = true;
    }

    // İFLAS kontrolü
    iflasKontrol(durum, kazananUid);
  }

  turLog.sonuc = 'SATILDI';
  turLog.kazanan = kazananUid;
  turLog.fiyat = fiyat;
  durum.log[durum.turIndex] = turLog;
}

// Zorunlu hediye - Bölüm 5
function zorunluHediye(durum) {
  const tur = durum.turlar[durum.turIndex];
  const turLog = { sonuc: null, kazanan: null, fiyat: 0, damgalar: [], yaziTura: null, iade: 0 };

  // Uygun oyuncular
  const adaylar = [];
  Object.keys(durum.durumlar).forEach(uid => {
    if (uygunMu(durum, uid, tur)) {
      adaylar.push(uid);
    }
  });

  if (adaylar.length === 0) {
    turLog.sonuc = 'KIMSE_ALAMAZ';
    durum.log[durum.turIndex] = turLog;
    return;
  }

  // En fakiri bul
  let enDusukButce = Infinity;
  adaylar.forEach(uid => {
    if (durum.durumlar[uid].butce < enDusukButce) {
      enDusukButce = durum.durumlar[uid].butce;
    }
  });

  const esitler = adaylar.filter(uid => durum.durumlar[uid].butce === enDusukButce);

  // Eşitlikte rastgele seç
  let alici;
  if (esitler.length === 1) {
    alici = esitler[0];
  } else {
    const r = rngFor(durum.seed, "hediye:" + durum.turIndex);
    alici = esitler[Math.floor(r() * esitler.length)];
  }

  // Birliği ver
  const oyuncu = durum.durumlar[alici];
  oyuncu.birlikler.push({
    id: tur.id,
    fiyat: 0,
    tur: durum.turIndex,
    kaynak: 'hediye'
  });

  iflasKontrol(durum, alici);

  turLog.sonuc = 'HEDİYE';
  turLog.kazanan = alici;
  durum.log[durum.turIndex] = turLog;
}

// Bitiş kontrolü - Bölüm 3
function bitisKontrol(durum) {
  // Boş slotu olan oyuncu sayısı
  let bosOyuncu = 0;
  Object.values(durum.durumlar).forEach(oyuncu => {
    if (oyuncu.birlikler.length < 5) bosOyuncu++;
  });

  if (bosOyuncu <= 1) return true;
  if (durum.turIndex >= durum.turlar.length - 1) return true;

  return false;
}

// Dağıtım - Bölüm 3
function dagit(durum) {
  const koltukSirasi = [];
  for (let i = 0; i < durum.N; i++) {
    koltukSirasi.push(durum.uids[i]);
  }

  koltukSirasi.forEach(uid => {
    const oyuncu = durum.durumlar[uid];

    while (oyuncu.birlikler.length < 5) {
      // Önce desteden bak
      let verildi = false;

      for (let i = durum.turIndex + 1; i < durum.turlar.length; i++) {
        const tur = durum.turlar[i];
        if (tur.tip !== 'birlik') continue;

        // Bu birlik kimseye verilmemiş mi?
        let verilmis = false;
        Object.values(durum.durumlar).forEach(o => {
          if (o.birlikler.some(b => b.id === tur.id)) {
            verilmis = true;
          }
        });

        if (!verilmis && uygunMu(durum, uid, tur)) {
          oyuncu.birlikler.push({
            id: tur.id,
            fiyat: 0,
            tur: durum.turIndex,
            kaynak: 'dagitim'
          });
          verildi = true;
          break;
        }
      }

      // Yoksa yedekten ver
      if (!verildi) {
        const slotSirasi = oyuncu.birlikler.length;
        const r = rngFor(durum.seed, "yedek:" + uid + ":" + slotSirasi);
        const yedek = yedekler[Math.floor(r() * 4)];

        oyuncu.birlikler.push({
          id: yedek.id,
          fiyat: 0,
          tur: durum.turIndex,
          kaynak: 'yedek'
        });
      }
    }
  });
}

// Hain Casus seçimi - Bölüm 6, 7
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
  } else if (KARSI_KOYMA[birlik.tip]) {
    const kural = KARSI_KOYMA[birlik.tip];
    if (rakipTipler.has(kural.yendigi)) c *= 1.3;
    if (rakipTipler.has(kural.yenildigi)) c *= 0.8;
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
function duelloHesapla(seed, duelloIndex, oyuncuA, oyuncuB) {
  const r = rngFor(seed, "duello:" + duelloIndex);

  // Ordular
  let orduA = oyuncuA.birlikler.map(b => {
    let birlik = birlikler.find(br => br.id === b.id);
    if (!birlik) {
      birlik = yedekler.find(br => br.id === b.id);
    }
    if (!birlik) {
      throw new Error(`Birlik bulunamadı: ${b.id}`);
    }
    return { ...birlik, sahip: 'A' };
  });

  let orduB = oyuncuB.birlikler.map(b => {
    let birlik = birlikler.find(br => br.id === b.id);
    if (!birlik) {
      birlik = yedekler.find(br => br.id === b.id);
    }
    if (!birlik) {
      throw new Error(`Birlik bulunamadı: ${b.id}`);
    }
    return { ...birlik, sahip: 'B' };
  });

  const hainLog = [];

  // Hain Casus - A'nın Haini
  if (oyuncuA.kaos.includes('K02')) {
    const index = hainSec(orduB, r);
    if (index !== null) {
      const calinan = orduB[index];
      orduB.splice(index, 1);
      calinan.sahip = 'A';
      orduA.push(calinan);
      hainLog.push({ taraf: 'A', birlik: calinan.ad });
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
function savas(durum) {
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

      const sonuc = duelloHesapla(durum.seed, duelloIndex, oyuncuA, oyuncuB);

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
function unvanlar(durum, savasData) {
  const mod = modlar.find(m => m.id === durum.mod);
  const unvanlarMap = {};

  Object.keys(durum.durumlar).forEach(uid => {
    unvanlarMap[uid] = [];
  });

  // Başkomutan
  const enYuksekDerece = Math.min(...savasData.siralama.map(s => s.derece));
  savasData.siralama.forEach(s => {
    if (s.derece === enYuksekDerece) {
      unvanlarMap[s.uid].push('Başkomutan');
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
      unvanlarMap[uid].push('Cimri');
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
      const turIndex = Object.keys(durum.log).find(idx => {
        const log = durum.log[idx];
        return log.kazanan === uid && durum.turlar[idx] && durum.turlar[idx].id === kaosId;
      });
      if (turIndex !== undefined) {
        const log = durum.log[turIndex];
        if (log.fiyat > enYuksek) {
          enYuksek = log.fiyat;
        }
      }
    });

    enYuksekOdemeler[uid] = enYuksek;
  });

  const enYuksekOdeme = Math.max(...Object.values(enYuksekOdemeler));
  if (enYuksekOdeme > 0) {
    Object.keys(enYuksekOdemeler).forEach(uid => {
      if (enYuksekOdemeler[uid] === enYuksekOdeme) {
        unvanlarMap[uid].push('Müsrif');
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
        const deger = hesaplaDeger(b.id, mod.butce);
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
        unvanlarMap[uid].push('Kelepirci');
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
        unvanlarMap[uid].push('Troll Kurbanı');
      }
    });
  }

  return unvanlarMap;
}

// Şablon anlatı - Bölüm 13
function sablonAnlati(duello, raundIndex) {
  const sablonlar = [
    "{kazanan} ordusu ileri atıldı!",
    "{kaybeden} savunmayı kurmaya çalıştı ama durdurulamadı.",
    "Toz bulutu dağıldığında {kazanan} bir adım öndeydi.",
    "Öyle bir hamle yaptı ki {kaybeden} ordusu şaşkına döndü!",
    "{kaybeden} geri çekildi, {kazanan} sancağı tepeye dikti.",
    "Savaş muhabirimiz bildiriyor: Bugün tarih yazılıyor!"
  ];

  const berabere = "İki ordu da geri adım atmadı, raund berabere!";

  if (raundIndex < 1 || raundIndex > duello.raundlar.length) {
    return "Raund oynanmadı.";
  }

  const raund = duello.raundlar[raundIndex - 1];

  if (raund.gA === raund.gB) {
    return berabere;
  }

  const kazananTaraf = raund.gA > raund.gB ? 'A' : 'B';
  const kaybedenTaraf = kazananTaraf === 'A' ? 'B' : 'A';

  const sablonIndex = ((duello.duelloIndex || 0) + raundIndex) % sablonlar.length;
  let sablon = sablonlar[sablonIndex];

  sablon = sablon.replace('{kazanan}', kazananTaraf);
  sablon = sablon.replace('{kaybeden}', kaybedenTaraf);

  return sablon;
}

// Faz ilerletme - Bölüm 12
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

    // SONUC süresi: only KIMSE_ALAMAZ gets 2s, everything else gets 4s
    const log = durum.log[durum.turIndex];
    if (log && log.sonuc === 'KIMSE_ALAMAZ') {
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
      const savasData = savas(durum);
      const unvanlarData = unvanlar(durum, savasData);

      durum.savas = {
        ...savasData,
        unvanlar: unvanlarData
      };

      durum.faz = 'SAVAS';
      durum.fazBitis = simdi + 999999999;
      durum.surum++;
      return durum;
    }

    // Sonraki tura geç
    durum.turIndex++;
    return turBaslat(durum, simdi);
  }

  return durum;
}

// Tur başlatma
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

export {
  normalize,
  dogrula,
  oyunKur,
  maksTeklif,
  uygunMu,
  teklifVer,
  gazVer,
  hesaplaDeger,
  turKapat,
  zorunluHediye,
  bitisKontrol,
  dagit,
  savas,
  unvanlar,
  sablonAnlati,
  ilerle,
  turBaslat,
  YETENEK_CARPANLARI,
  KARSI_KOYMA
};

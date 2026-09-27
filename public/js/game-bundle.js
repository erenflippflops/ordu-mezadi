// ==================== ORDU MEZADI - GAME ENGINE BUNDLE ====================
// Browser-compatible version of Phase 1 engine

(function(window) {
  'use strict';

  // ==================== RNG (rastgele.js) ====================

  function hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const chr = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + chr;
      hash |= 0;
    }
    return hash;
  }

  function mulberry32(a) {
    return function() {
      let t = a += 0x6D2B79F5;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  function rngFor(seed, context) {
    const combined = seed + ":" + context;
    const h = hashString(combined);
    const positiveHash = h >>> 0;
    return mulberry32(positiveHash);
  }

  function shuffle(arr, rng) {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  // ==================== GAME DATA (veri.js) ====================

  const birlikler = window.GameData?.birlikler || [];
  const yedekler = window.GameData?.yedekler || [];
  const kaosKartlari = window.GameData?.kaosKartlari || [];
  const modlar = window.GameData?.modlar || [];

  // ==================== GAME ENGINE (motor.js) ====================

  const YETENEK_CARPANLARI = {
    YOK: [1, 1, 1],
    ILK_DARBE: [1.6, 0.7, 0.7],
    SON_NEFES: [0.7, 0.7, 1.6],
    ISINMA: [0.6, 1.0, 1.4],
    KORKAK: [1.2, 0.6, 0]
  };

  const KARSI_KOYMA = {
    piyade: { yendigi: 'suvari', yenildigi: 'menzilli' },
    suvari: { yendigi: 'menzilli', yenildigi: 'piyade' },
    menzilli: { yendigi: 'piyade', yenildigi: 'suvari' },
    nisanci: { yendigi: 'adet1', yenildigi: 'adet10' }
  };

  function normalize(durum) {
    if (!durum) return null;

    const d = { ...durum };

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

  function oyunKur(seed, mod, cag, uids) {
    const N = uids.length;
    const modData = modlar.find(m => m.id === mod);

    if (!modData) {
      throw new Error('Geçersiz mod: ' + mod);
    }

    const { secilenler, osmanliUid } = desteKur(seed, mod, cag, N, uids);
    const turlar = desteTamamla(seed, mod, secilenler, N);

    const durum = {
      seed,
      mod,
      cag: cag || null,
      uids: {},
      durumlar: {},
      turlar,
      turIndex: 0,
      faz: 'HAZIRLIK',
      fazBitis: 0,
      teklif: null,
      gaz: null,
      log: {},
      artirmaBitti: false,
      savas: null,
      surum: 0
    };

    uids.forEach(uid => {
      durum.uids[uid] = true;
      durum.durumlar[uid] = {
        butce: modData.butce,
        birlikler: [],
        kaos: [],
        damgalar: [],
        dayiAktif: false,
        iflasVerildi: false,
        gazKullanildi: false
      };
    });

    if (osmanliUid) {
      durum.durumlar[osmanliUid].damgalar.push('OSMANLI');
    }

    return normalize(durum);
  }

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

  function desteTamamla(seed, mod, secilenler, N) {
    const modData = modlar.find(m => m.id === mod);
    const birlikSirasi = shuffle(secilenler, rngFor(seed, "deste:sira"));
    const u = birlikSirasi.length;

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

    const kaosSay = Math.min(N * modData.kaosCarpani, 6);
    const karisikKaos = shuffle(kaosKartlari.map(k => k.id), rngFor(seed, "kaos:kart")).slice(0, kaosSay);

    const bosluklar = [];
    for (let i = 3; i <= u; i++) bosluklar.push(i);
    const kaosYerleri = shuffle(bosluklar, rngFor(seed, "kaos:yer")).slice(0, kaosSay).sort((a, b) => a - b);

    const turlar = [];
    for (let i = 0; i <= u; i++) {
      const kaosIndex = kaosYerleri.indexOf(i);
      if (kaosIndex !== -1) {
        turlar.push({ tip: 'kaos', id: karisikKaos[kaosIndex], olay: null });
      }

      if (i < u) {
        turlar.push({ tip: 'birlik', id: birlikSirasi[i].id, olay: olaylar[i] || null });
      }
    }

    return turlar;
  }

  function maksTeklif(durum, uid) {
    const oyuncu = durum.durumlar[uid];
    if (!oyuncu) return 0;

    const tur = durum.turlar[durum.turIndex];
    const bos = 5 - oyuncu.birlikler.length;

    if (tur.tip === 'birlik') {
      return oyuncu.butce - (bos - 1);
    } else {
      return oyuncu.butce - bos;
    }
  }

  function uygunMu(durum, uid, tur) {
    const maks = maksTeklif(durum, uid);
    return maks >= 1;
  }

  function teklifVer(durum, uid, artis, simdi) {
    if (durum.faz !== 'TEKLIF') {
      return { hata: 'Teklif fazı değil' };
    }

    const oyuncu = durum.durumlar[uid];
    if (!oyuncu) {
      return { hata: 'Oyuncu bulunamadı' };
    }

    const tur = durum.turlar[durum.turIndex];
    const mevcut = durum.teklif ? durum.teklif.miktar : 0;
    const yeni = mevcut + artis;

    const maks = maksTeklif(durum, uid);

    if (yeni > maks) {
      return { hata: `Geçersiz teklif: maksimum ${maks}` };
    }

    if (durum.teklif && durum.teklif.uid === uid) {
      return { hata: 'Zaten sizin teklifiniz' };
    }

    durum.teklif = { uid, miktar: yeni, zaman: simdi };

    // Uzatma kontrolü
    const kalan = durum.fazBitis - simdi;
    if (kalan < 5000) {
      durum.fazBitis = simdi + 5000;
    }

    durum.surum++;
    return { durum };
  }

  function gazVer(durum, uid) {
    if (durum.faz !== 'TEKLIF') {
      return { hata: 'Teklif fazı değil' };
    }

    const oyuncu = durum.durumlar[uid];
    if (!oyuncu) {
      return { hata: 'Oyuncu bulunamadı' };
    }

    if (oyuncu.gazKullanildi) {
      return { hata: 'Gaz zaten kullanıldı' };
    }

    if (durum.gaz) {
      return { hata: 'Gaz zaten aktif' };
    }

    const tur = durum.turlar[durum.turIndex];
    if (tur.tip !== 'birlik') {
      return { hata: 'Gaz sadece birlik turlarında kullanılabilir' };
    }

    if (tur.olay === 'ZORUNLU_HEDIYE') {
      return { hata: 'Zorunlu hediye turunda gaz kullanılamaz' };
    }

    durum.gaz = uid;
    oyuncu.gazKullanildi = true;
    durum.surum++;

    return { durum };
  }

  function hesaplaDeger(birlikId, butce) {
    const birlik = birlikler.find(b => b.id === birlikId) || yedekler.find(b => b.id === birlikId);
    if (!birlik) return 0;

    const baseValue = birlik.adet * birlik.guc;
    return Math.round(baseValue * butce / 100);
  }

  function turKapat(durum, simdi) {
    const tur = durum.turlar[durum.turIndex];

    if (!durum.teklif) {
      durum.log[durum.turIndex] = {
        sonuc: 'ALINMADI',
        kazanan: null,
        fiyat: 0,
        damgalar: [],
        yaziTura: null,
        iade: 0
      };
      return;
    }

    const kazanan = durum.teklif.uid;
    const fiyat = durum.teklif.miktar;
    const oyuncu = durum.durumlar[kazanan];

    oyuncu.butce -= fiyat;

    const damgalar = [];

    // Damga kontrolü
    if (tur.tip === 'birlik') {
      const deger = hesaplaDeger(tur.id, modlar.find(m => m.id === durum.mod).butce);

      if (fiyat <= Math.round(deger * 0.5)) {
        damgalar.push('KELEPİR');
      }
      if (fiyat >= Math.round(deger * 1.5)) {
        damgalar.push('SOYULDUN');
      }

      const birlik = birlikler.find(b => b.id === tur.id);
      if (birlik && birlik.kademe === 'troll_sahte') {
        damgalar.push('TROLLENDİN');
      }

      oyuncu.birlikler.push({ id: tur.id, fiyat, kaynak: 'artirma' });
    } else {
      oyuncu.kaos.push(tur.id);
    }

    oyuncu.damgalar.push(...damgalar);

    // Çift ya da Hiç
    let yaziTura = null;
    if (tur.olay === 'CIFT_YA_DA_HIC') {
      const r = rngFor(durum.seed, `yazi_tura:${durum.turIndex}`);
      yaziTura = r() < 0.5 ? 'YAZI' : 'TURA';

      if (yaziTura === 'YAZI') {
        oyuncu.butce += fiyat;
        if (tur.tip === 'birlik') {
          oyuncu.birlikler.push({ id: tur.id, fiyat: 0, kaynak: 'artirma' });
        } else {
          oyuncu.kaos.push(tur.id);
        }
      } else {
        if (tur.tip === 'birlik') {
          oyuncu.birlikler.pop();
        } else {
          oyuncu.kaos.pop();
        }
        oyuncu.butce += fiyat;
      }
    }

    // Gaz iadesi
    let iade = 0;
    if (durum.gaz && durum.gaz !== kazanan) {
      const gazVeren = durum.durumlar[durum.gaz];
      iade = Math.floor(fiyat * 0.5);
      gazVeren.butce += iade;
    }

    durum.log[durum.turIndex] = {
      sonuc: 'SATILDI',
      kazanan,
      fiyat,
      damgalar,
      yaziTura,
      iade
    };
  }

  function zorunluHediye(durum) {
    const tur = durum.turlar[durum.turIndex];
    const uygunlar = [];

    Object.keys(durum.durumlar).forEach(uid => {
      if (uygunMu(durum, uid, tur)) {
        uygunlar.push(uid);
      }
    });

    if (uygunlar.length === 0) {
      durum.log[durum.turIndex] = {
        sonuc: 'KIMSE_ALAMAZ',
        kazanan: null,
        fiyat: 0,
        damgalar: [],
        yaziTura: null,
        iade: 0
      };
      return;
    }

    const r = rngFor(durum.seed, `hediye:${durum.turIndex}`);
    const kazanan = uygunlar[Math.floor(r() * uygunlar.length)];
    const oyuncu = durum.durumlar[kazanan];

    if (tur.tip === 'birlik') {
      oyuncu.birlikler.push({ id: tur.id, fiyat: 0, kaynak: 'hediye' });
    } else {
      oyuncu.kaos.push(tur.id);
    }

    durum.log[durum.turIndex] = {
      sonuc: 'HEDİYE',
      kazanan,
      fiyat: 0,
      damgalar: [],
      yaziTura: null,
      iade: 0
    };
  }

  function bitisKontrol(durum) {
    return durum.turIndex >= durum.turlar.length - 1;
  }

  function dagit(durum) {
    const modData = modlar.find(m => m.id === durum.mod);

    Object.keys(durum.durumlar).forEach(uid => {
      const oyuncu = durum.durumlar[uid];
      const eksik = 5 - oyuncu.birlikler.length;

      if (eksik > 0) {
        for (let i = 0; i < eksik; i++) {
          const yedek = yedekler[i % yedekler.length];
          oyuncu.birlikler.push({ id: yedek.id, fiyat: 0, kaynak: 'dagitim' });
        }
      }

      if (oyuncu.butce >= modData.butce) {
        oyuncu.damgalar.push('CİMRİ');
      }
    });
  }

  function savas(durum) {
    const uids = Object.keys(durum.durumlar);
    const N = uids.length;

    const duellolar = [];
    let duelloIndex = 0;

    for (let i = 0; i < N; i++) {
      for (let j = i + 1; j < N; j++) {
        const duel = duello(durum, uids[i], uids[j], duelloIndex);
        duel.duelloIndex = duelloIndex++;
        duellolar.push(duel);
      }
    }

    const puanlar = {};
    const hasarlar = {};

    uids.forEach(uid => {
      puanlar[uid] = 0;
      hasarlar[uid] = 0;
    });

    duellolar.forEach(d => {
      if (d.kazanan === 'A') {
        puanlar[d.uidA] += 3;
      } else if (d.kazanan === 'B') {
        puanlar[d.uidB] += 3;
      } else {
        puanlar[d.uidA] += 1;
        puanlar[d.uidB] += 1;
      }

      hasarlar[d.uidA] += d.hasarA;
      hasarlar[d.uidB] += d.hasarB;
    });

    const siralama = uids.map(uid => {
      const oyuncu = durum.durumlar[uid];
      return {
        uid,
        puan: puanlar[uid],
        hasar: hasarlar[uid],
        butce: oyuncu.butce
      };
    }).sort((a, b) => {
      if (a.puan !== b.puan) return b.puan - a.puan;
      if (a.hasar !== b.hasar) return b.hasar - a.hasar;
      return b.butce - a.butce;
    });

    siralama.forEach((item, index) => {
      item.derece = index + 1;
    });

    return { duellolar, siralama };
  }

  function duello(durum, uidA, uidB, duelloIndex) {
    const oyuncuA = durum.durumlar[uidA];
    const oyuncuB = durum.durumlar[uidB];

    const orduA = oyuncuA.birlikler.map(b => birlikler.find(br => br.id === b.id) || yedekler.find(br => br.id === b.id)).filter(b => b).map(b => b.ad);
    const orduB = oyuncuB.birlikler.map(b => birlikler.find(br => br.id === b.id) || yedekler.find(br => br.id === b.id)).filter(b => b).map(b => b.ad);

    const raundlar = [];
    let canA = 100;
    let canB = 100;
    let hasarA = 0;
    let hasarB = 0;

    for (let r = 0; r < 3; r++) {
      if (canA === 0 || canB === 0) break;

      const gucA = orduGuc(durum, uidA, r);
      const gucB = orduGuc(durum, uidB, r);

      const netA = gucA - gucB;
      const netB = gucB - gucA;

      const gA = Math.max(0, netA);
      const gB = Math.max(0, netB);

      canA = Math.max(0, canA - gB);
      canB = Math.max(0, canB - gA);

      hasarA += gA;
      hasarB += gB;

      raundlar.push({ raund: r + 1, gucA, gucB, gA, gB, canA, canB });
    }

    let kazanan = null;
    if (canA > 0 && canB === 0) kazanan = 'A';
    else if (canB > 0 && canA === 0) kazanan = 'B';

    return {
      uidA,
      uidB,
      orduA,
      orduB,
      raundlar,
      kazanan,
      hasarA,
      hasarB
    };
  }

  function orduGuc(durum, uid, raundIndex) {
    const oyuncu = durum.durumlar[uid];
    let toplam = 0;

    oyuncu.birlikler.forEach(b => {
      const birlik = birlikler.find(br => br.id === b.id) || yedekler.find(br => br.id === b.id);
      if (!birlik) return;

      const carpanlar = YETENEK_CARPANLARI[birlik.yetenek || 'YOK'];
      const carpan = carpanlar[raundIndex] || 1;

      toplam += birlik.adet * birlik.guc * carpan;
    });

    return Math.round(toplam);
  }

  function ilerle(durum, simdi) {
    durum = normalize(durum);

    if (durum.faz === 'HAZIRLIK') {
      return turBaslat(durum, simdi);
    }

    if (durum.faz === 'TEKLIF') {
      const tur = durum.turlar[durum.turIndex];

      if (tur.olay === 'ZORUNLU_HEDIYE') {
        zorunluHediye(durum);
      } else {
        turKapat(durum, simdi);
      }

      durum.faz = 'SONUC';

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
      if (bitisKontrol(durum)) {
        durum.artirmaBitti = true;

        dagit(durum);

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

      durum.turIndex++;
      return turBaslat(durum, simdi);
    }

    return durum;
  }

  function turBaslat(durum, simdi) {
    const tur = durum.turlar[durum.turIndex];

    durum.teklif = null;
    durum.gaz = null;

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

    if (tur.olay === 'ZORUNLU_HEDIYE') {
      zorunluHediye(durum);
      durum.faz = 'SONUC';
      durum.fazBitis = simdi + 4000;
      durum.surum++;
      return durum;
    }

    durum.faz = 'TEKLIF';
    durum.fazBitis = simdi + 15000;
    durum.surum++;
    return durum;
  }

  function unvanlar(durum, savasData) {
    const mod = modlar.find(m => m.id === durum.mod);
    const unvanlarMap = {};

    Object.keys(durum.durumlar).forEach(uid => {
      unvanlarMap[uid] = [];
    });

    const enYuksekDerece = Math.min(...savasData.siralama.map(s => s.derece));
    savasData.siralama.forEach(s => {
      if (s.derece === enYuksekDerece) {
        unvanlarMap[s.uid].push('Başkomutan');
      }
    });

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

    return unvanlarMap;
  }

  // ==================== EXPORTS ====================

  window.GameEngine = {
    oyunKur,
    teklifVer,
    gazVer,
    ilerle,
    YETENEK_CARPANLARI,
    KARSI_KOYMA
  };

})(window);

// Tüm oyun mantığı tek dosyada - tarayıcı için

// ==================== RNG ====================
function fnv1a(str) {
  let h = 0x811c9dc5;
  for (const b of new TextEncoder().encode(str)) {
    h ^= b;
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

function mulberry32(a) {
  return function () {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rngFor = (seed, etiket) => mulberry32(fnv1a(seed + ":" + etiket));

function shuffle(dizi, r) {
  const a = dizi.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ==================== DATA ====================
const birlikler = [
  { id: "A01", ikon: "🛡️", ad: "Geçidin Kralı", adet: 1, cag: "antik", tip: "piyade", kademe: "efsane", guc: 66, yetenek: "SON_NEFES", osmanli: "-", aciklama: "Dar geçitte bir orduyu durduran efsane kral" },
  { id: "A02", ikon: "🐎", ad: "Makedon Fatih", adet: 1, cag: "antik", tip: "suvari", kademe: "efsane", guc: 70, yetenek: "ILK_DARBE", osmanli: "-", aciklama: "Dünyayı atıyla fetheden genç komutan" },
  { id: "A03", ikon: "🔱", ad: "Arenanın Efsanesi", adet: 1, cag: "antik", tip: "piyade", kademe: "efsane", guc: 64, yetenek: "ISINMA", osmanli: "-", aciklama: "Kölelikten isyana, arenadan efsaneye" },
  { id: "A04", ikon: "🦅", ad: "Roma Lejyoneri", adet: 10, cag: "antik", tip: "piyade", kademe: "elit", guc: 48, yetenek: "YOK", osmanli: "-", aciklama: "Disiplinin ve kalkan duvarının ustaları" },
  { id: "A05", ikon: "🛡️", ad: "Spartalı Hoplit", adet: 5, cag: "antik", tip: "piyade", kademe: "elit", guc: 46, yetenek: "YOK", osmanli: "-", aciklama: "Kalkanıyla dönmeyen Spartalı" },
  { id: "A06", ikon: "🏹", ad: "Pers Ölümsüzü", adet: 6, cag: "antik", tip: "menzilli", kademe: "elit", guc: 42, yetenek: "YOK", osmanli: "-", aciklama: "İmparatorluğun hiç eksilmeyen seçkin okçuları" },
  { id: "A07", ikon: "🐎", ad: "Hun Atlı Savaşçısı", adet: 4, cag: "antik", tip: "suvari", kademe: "elit", guc: 44, yetenek: "ILK_DARBE", osmanli: "-", aciklama: "Bozkırdan gelen hızlı atlılar" },
  { id: "A08", ikon: "🛞", ad: "Mısır Savaş Arabası", adet: 3, cag: "antik", tip: "suvari", kademe: "elit", guc: 40, yetenek: "YOK", osmanli: "-", aciklama: "Nil kıyısının hızlı savaş arabaları" },
  { id: "A09", ikon: "🪓", ad: "Kelt Savaşçısı", adet: 8, cag: "antik", tip: "piyade", kademe: "siradan", guc: 30, yetenek: "ILK_DARBE", osmanli: "-", aciklama: "Savaş boyası ve büyük baltalar" },
  { id: "A10", ikon: "🏹", ad: "Girit Okçusu", adet: 12, cag: "antik", tip: "menzilli", kademe: "siradan", guc: 28, yetenek: "YOK", osmanli: "-", aciklama: "Adanın ünlü keskin okçuları" },
  { id: "A11", ikon: "🪨", ad: "Balear Sapancısı", adet: 15, cag: "antik", tip: "menzilli", kademe: "siradan", guc: 24, yetenek: "YOK", osmanli: "-", aciklama: "Taşla adam deviren sapancılar" },
  { id: "A12", ikon: "🐘", ad: "Savaş Fili", adet: 2, cag: "antik", tip: "suvari", kademe: "elit", guc: 45, yetenek: "YOK", osmanli: "-", aciklama: "Düşmanı ezen iki dev fil" },
  { id: "A13", ikon: "🐎", ad: "Numidya Hafif Süvarisi", adet: 12, cag: "antik", tip: "suvari", kademe: "siradan", guc: 22, yetenek: "YOK", osmanli: "-", aciklama: "Çölün hafif ve hızlı atlıları" },
  { id: "A14", ikon: "🏇", ad: "İskit Kadın Savaşçısı", adet: 6, cag: "antik", tip: "suvari", kademe: "elit", guc: 41, yetenek: "YOK", osmanli: "-", aciklama: "Bozkırın korkusuz kadın atlıları" },
  { id: "A15", ikon: "🔱", ad: "Galya Mızrakçısı", adet: 10, cag: "antik", tip: "piyade", kademe: "siradan", guc: 26, yetenek: "YOK", osmanli: "-", aciklama: "Uzun mızraklı kabile savaşçıları" },
  { id: "O01", ikon: "🗡️", ad: "İki Kılıçlı Usta", adet: 1, cag: "orta", tip: "piyade", kademe: "efsane", guc: 67, yetenek: "ILK_DARBE", osmanli: "-", aciklama: "Tek bir düelloyu hiç kaybetmemiş kılıç ustası" },
  { id: "O02", ikon: "🐺", ad: "Bozkırın Hanı", adet: 1, cag: "orta", tip: "suvari", kademe: "efsane", guc: 72, yetenek: "YOK", osmanli: "-", aciklama: "Bozkırı tek bayrak altında toplayan han" },
  { id: "O03", ikon: "🌙", ad: "Kuşatmanın Sultanı", adet: 1, cag: "orta", tip: "suvari", kademe: "efsane", guc: 70, yetenek: "ISINMA", osmanli: "E", aciklama: "Surları deviren genç sultan" },
  { id: "O04", ikon: "🪖", ad: "Yeniçeri", adet: 5, cag: "orta", tip: "piyade", kademe: "elit", guc: 50, yetenek: "YOK", osmanli: "E", aciklama: "Ocağın seçkin piyadesi" },
  { id: "O05", ikon: "🐎", ad: "Sipahi", adet: 6, cag: "orta", tip: "suvari", kademe: "elit", guc: 47, yetenek: "YOK", osmanli: "E", aciklama: "Tımarlı ağır süvari" },
  { id: "O06", ikon: "🔥", ad: "Deli Süvarisi", adet: 4, cag: "orta", tip: "suvari", kademe: "elit", guc: 43, yetenek: "ILK_DARBE", osmanli: "E", aciklama: "Gözü kara, korku bilmez süvari" },
  { id: "O07", ikon: "🏇", ad: "Akıncı", adet: 10, cag: "orta", tip: "suvari", kademe: "siradan", guc: 30, yetenek: "YOK", osmanli: "E", aciklama: "Sınır boylarının akıncıları" },
  { id: "O08", ikon: "🏹", ad: "Azap Okçusu", adet: 12, cag: "orta", tip: "menzilli", kademe: "siradan", guc: 27, yetenek: "YOK", osmanli: "E", aciklama: "Ok yağmuru yağdıran azaplar" },
  { id: "O09", ikon: "💣", ad: "Humbaracı", adet: 3, cag: "orta", tip: "menzilli", kademe: "elit", guc: 41, yetenek: "YOK", osmanli: "E", aciklama: "El bombası atan Osmanlı uzmanları" },
  { id: "O10", ikon: "✝️", ad: "Haçlı Şövalyesi", adet: 4, cag: "orta", tip: "suvari", kademe: "elit", guc: 49, yetenek: "YOK", osmanli: "-", aciklama: "Ağır zırhlı şövalyeler" },
  { id: "O11", ikon: "⛩️", ad: "Samuray", adet: 6, cag: "orta", tip: "piyade", kademe: "elit", guc: 48, yetenek: "YOK", osmanli: "-", aciklama: "Bushido yolunun savaşçıları" },
  { id: "O12", ikon: "🏹", ad: "Moğol Atlı Okçusu", adet: 10, cag: "orta", tip: "menzilli", kademe: "elit", guc: 46, yetenek: "ILK_DARBE", osmanli: "-", aciklama: "Dörtnala giderken ok atan atlılar" },
  { id: "O13", ikon: "🪓", ad: "Viking Akıncısı", adet: 8, cag: "orta", tip: "piyade", kademe: "siradan", guc: 32, yetenek: "ILK_DARBE", osmanli: "-", aciklama: "Kuzeyden gelen baltalı akıncılar" },
  { id: "O14", ikon: "🎯", ad: "İngiliz Uzun Yaycısı", adet: 10, cag: "orta", tip: "menzilli", kademe: "elit", guc: 42, yetenek: "YOK", osmanli: "-", aciklama: "Uzun yayıyla ünlü okçular" },
  { id: "O15", ikon: "🌾", ad: "Köylü Mızrakçı", adet: 15, cag: "orta", tip: "piyade", kademe: "siradan", guc: 22, yetenek: "YOK", osmanli: "-", aciklama: "Tarlasını bırakıp mızrağı alan köylüler" },
  { id: "M01", ikon: "❄️", ad: "Kış Hayaleti", adet: 1, cag: "modern", tip: "nisanci", kademe: "efsane", guc: 71, yetenek: "SON_NEFES", osmanli: "-", aciklama: "Karlı ormanın görünmez keskin nişancısı" },
  { id: "M02", ikon: "🥷", ad: "Gölge Komando", adet: 1, cag: "modern", tip: "piyade", kademe: "efsane", guc: 69, yetenek: "ILK_DARBE", osmanli: "-", aciklama: "Gecenin içinden çıkan özel harekatçı" },
  { id: "M03", ikon: "🛡️", ad: "Efsane Tank Ası", adet: 1, cag: "modern", tip: "suvari", kademe: "efsane", guc: 70, yetenek: "ISINMA", osmanli: "-", aciklama: "Tek başına cepheyi yaran tank ası" },
  { id: "M04", ikon: "🇹🇷", ad: "Çanakkale Mehmetçiği", adet: 8, cag: "modern", tip: "piyade", kademe: "elit", guc: 50, yetenek: "SON_NEFES", osmanli: "E", aciklama: "Geçilmez denilen cephenin kahramanları" },
  { id: "M05", ikon: "🪖", ad: "Özel Kuvvet Askeri", adet: 4, cag: "modern", tip: "nisanci", kademe: "elit", guc: 52, yetenek: "YOK", osmanli: "-", aciklama: "Uzun menzilli tüfekli seçkin tim" },
  { id: "M06", ikon: "🎯", ad: "Keskin Nişancı Takımı", adet: 2, cag: "modern", tip: "nisanci", kademe: "elit", guc: 45, yetenek: "YOK", osmanli: "-", aciklama: "İki kişilik gözcü ve nişancı" },
  { id: "M07", ikon: "💂", ad: "Siper Tüfekçisi", adet: 10, cag: "modern", tip: "menzilli", kademe: "siradan", guc: 30, yetenek: "YOK", osmanli: "-", aciklama: "Siperden ateş eden tüfekçiler" },
  { id: "M08", ikon: "🐎", ad: "Kazak Süvarisi", adet: 6, cag: "modern", tip: "suvari", kademe: "elit", guc: 42, yetenek: "YOK", osmanli: "-", aciklama: "Kılıcı ve atıyla bozkır süvarisi" },
  { id: "M09", ikon: "🔪", ad: "Gurkha", adet: 3, cag: "modern", tip: "piyade", kademe: "elit", guc: 47, yetenek: "ILK_DARBE", osmanli: "-", aciklama: "Kıvrık bıçağıyla efsane dağ askerleri" },
  { id: "M10", ikon: "🔫", ad: "Milis Tüfekçi", adet: 12, cag: "modern", tip: "menzilli", kademe: "siradan", guc: 26, yetenek: "YOK", osmanli: "-", aciklama: "Gönüllü tüfekli halk birliği" },
  { id: "M11", ikon: "🪂", ad: "Paraşütçü", adet: 5, cag: "modern", tip: "piyade", kademe: "elit", guc: 44, yetenek: "ILK_DARBE", osmanli: "-", aciklama: "Gökten inen hızlı birlik" },
  { id: "M12", ikon: "🙃", ad: "Acemi Er", adet: 20, cag: "modern", tip: "menzilli", kademe: "siradan", guc: 16, yetenek: "YOK", osmanli: "-", aciklama: "Yirmi acemi er, tüfekleri yeni" },
  { id: "M13", ikon: "🏍️", ad: "Motosikletli Keşifçi", adet: 3, cag: "modern", tip: "suvari", kademe: "siradan", guc: 28, yetenek: "YOK", osmanli: "-", aciklama: "Hızlı keşif motosikletçileri" },
  { id: "M14", ikon: "💥", ad: "Makineli Tüfek Mangası", adet: 4, cag: "modern", tip: "menzilli", kademe: "elit", guc: 49, yetenek: "ISINMA", osmanli: "-", aciklama: "Durmadan ateş eden makineli tüfek ekibi" },
  { id: "M15", ikon: "🧨", ad: "Havan Ekibi", adet: 6, cag: "modern", tip: "menzilli", kademe: "elit", guc: 40, yetenek: "YOK", osmanli: "-", aciklama: "Uzaktan döven havan ekibi" },
  { id: "T01", ikon: "👡", ad: "Türk Annesi", adet: 1, cag: "tum", tip: "menzilli", kademe: "troll_gizli", guc: 62, yetenek: "ILK_DARBE", osmanli: "-", aciklama: "Bir anne ve terliği" },
  { id: "T02", ikon: "💃", ad: "Düğün Halaycısı", adet: 5, cag: "tum", tip: "piyade", kademe: "troll_gizli", guc: 55, yetenek: "ISINMA", osmanli: "-", aciklama: "Düğünden çıkıp gelmiş halaycılar" },
  { id: "T03", ikon: "🌯", ad: "Gece Kokoreççisi", adet: 3, cag: "tum", tip: "menzilli", kademe: "troll_gizli", guc: 50, yetenek: "SON_NEFES", osmanli: "-", aciklama: "Gece yarısı tezgahındaki kokoreççiler" },
  { id: "T04", ikon: "😎", ad: "Çinçinli Keko", adet: 5, cag: "tum", tip: "piyade", kademe: "troll_gizli", guc: 57, yetenek: "ILK_DARBE", osmanli: "-", aciklama: "Mahallenin çinçinli kekoları" },
  { id: "T05", ikon: "🥊", ad: "Kelebek Gibi Uçan Boksör", adet: 1, cag: "tum", tip: "piyade", kademe: "troll_gizli", guc: 60, yetenek: "ISINMA", osmanli: "-", aciklama: "Kelebek gibi uçan, arı gibi sokan boksör" },
  { id: "T06", ikon: "🍅", ad: "Pazar Esnafı", adet: 4, cag: "tum", tip: "menzilli", kademe: "troll_gizli", guc: 48, yetenek: "YOK", osmanli: "-", aciklama: "Pazar tezgahından esnaf" },
  { id: "T07", ikon: "🚕", ad: "Kornacı Taksici", adet: 2, cag: "tum", tip: "suvari", kademe: "troll_gizli", guc: 53, yetenek: "ILK_DARBE", osmanli: "-", aciklama: "Kornası hiç susmayan iki taksici" },
  { id: "T08", ikon: "⚽", ad: "Mahalle Maç Ekibi", adet: 7, cag: "tum", tip: "menzilli", kademe: "troll_gizli", guc: 49, yetenek: "ISINMA", osmanli: "-", aciklama: "Halı saha efsaneleri" },
  { id: "T09", ikon: "📱", ad: "Fenomen Asker", adet: 10, cag: "tum", tip: "nisanci", kademe: "troll_sahte", guc: 6, yetenek: "KORKAK", osmanli: "-", aciklama: "Kamuflajlı, teçhizatlı seçkin birlik" },
  { id: "T10", ikon: "🗺️", ad: "Haritayı Ters Tutan General", adet: 1, cag: "tum", tip: "piyade", kademe: "troll_sahte", guc: 5, yetenek: "YOK", osmanli: "-", aciklama: "Yüz savaş görmüş deneyimli general" },
  { id: "T11", ikon: "📦", ad: "Zırhlı Şövalye Birliği", adet: 5, cag: "tum", tip: "suvari", kademe: "troll_sahte", guc: 8, yetenek: "YOK", osmanli: "-", aciklama: "Tepeden tırnağa zırhlı beş şövalye" },
  { id: "T12", ikon: "🎮", ad: "Profesyonel Oyuncu", adet: 3, cag: "tum", tip: "nisanci", kademe: "troll_sahte", guc: 9, yetenek: "KORKAK", osmanli: "-", aciklama: "Binlerce savaş kazanmış profesyonel" },
  { id: "T13", ikon: "🎬", ad: "Destansı Ordu", adet: 20, cag: "tum", tip: "piyade", kademe: "troll_sahte", guc: 10, yetenek: "KORKAK", osmanli: "-", aciklama: "Yirmi kişilik destansı ordu" },
  { id: "T14", ikon: "🎤", ad: "Motivasyon Koçu", adet: 4, cag: "tum", tip: "piyade", kademe: "troll_sahte", guc: 4, yetenek: "YOK", osmanli: "-", aciklama: "Orduya güç veren özel danışman" },
];

const yedekler = [
  { id: "Y01", ikon: "🧑‍🌾", ad: "Köylü Milis", adet: 10, cag: "tum", tip: "piyade", kademe: "yedek", guc: 12, yetenek: "YOK", osmanli: "-", aciklama: "Köyden toplanmış gönüllüler" },
  { id: "Y02", ikon: "🐑", ad: "Sapanlı Çoban", adet: 8, cag: "tum", tip: "menzilli", kademe: "yedek", guc: 10, yetenek: "YOK", osmanli: "-", aciklama: "Sapanıyla sürüsünü koruyan çobanlar" },
  { id: "Y03", ikon: "✉️", ad: "Atlı Postacı", adet: 5, cag: "tum", tip: "suvari", kademe: "yedek", guc: 9, yetenek: "YOK", osmanli: "-", aciklama: "Mektup taşıyan atlılar" },
  { id: "Y04", ikon: "🔦", ad: "Gönüllü Bekçi", adet: 6, cag: "tum", tip: "piyade", kademe: "yedek", guc: 11, yetenek: "YOK", osmanli: "-", aciklama: "Fenerli mahalle bekçileri" },
];

const modlar = [
  { id: "klasik", ad: "Klasik", butce: 100, trollOrani: 0.2, kaosCarpani: 1, kaosUstSinir: 1, ekOlay: 0, oyuncuMin: 2, oyuncuMax: 4 },
  { id: "troll", ad: "Troll Gecesi", butce: 100, trollOrani: 0.5, kaosCarpani: 2, kaosUstSinir: 2, ekOlay: 1, oyuncuMin: 2, oyuncuMax: 4 },
  { id: "kor", ad: "Kör Mod", butce: 100, trollOrani: 0.2, kaosCarpani: 1, kaosUstSinir: 1, ekOlay: 0, oyuncuMin: 2, oyuncuMax: 4 },
  { id: "fakir", ad: "Fakir Mod", butce: 30, trollOrani: 0.2, kaosCarpani: 1, kaosUstSinir: 1, ekOlay: 0, oyuncuMin: 2, oyuncuMax: 4 },
];

// ==================== GAME LOGIC (simplified) ====================
const YETENEK_CARPANLARI = {
  YOK: [1, 1, 1],
  ILK_DARBE: [1.6, 0.7, 0.7],
  SON_NEFES: [0.7, 0.7, 1.6],
  ISINMA: [0.6, 1.0, 1.4],
  KORKAK: [1.2, 0.6, 0]
};

function normalize(durum) {
  if (!durum) return null;
  const d = { ...durum };
  if (!d.durumlar) d.durumlar = {};
  Object.keys(d.durumlar).forEach(uid => {
    const oyuncu = d.durumlar[uid];
    if (!oyuncu.birlikler) oyuncu.birlikler = [];
    if (!oyuncu.kaos) oyuncu.kaos = [];
    if (!oyuncu.damgalar) oyuncu.damgalar = [];
    if (oyuncu.butce === undefined) oyuncu.butce = 0;
  });
  if (!d.turlar) d.turlar = [];
  if (!d.log) d.log = {};
  return d;
}

function desteKur(seed, mod, N, uids) {
  const modData = modlar.find(m => m.id === mod);
  const desteBirlik = N * 5 + 4;
  const trollSay = Math.round(desteBirlik * modData.trollOrani);
  const trollOlmayan = desteBirlik - trollSay;

  function cek(havuz, k, etiket) {
    const karisik = shuffle(havuz, rngFor(seed, "deste:" + etiket));
    return karisik.slice(0, k);
  }

  let normalHavuz = birlikler.filter(b => !b.kademe.startsWith('troll') && b.kademe !== 'yedek');
  const trollHavuz = birlikler.filter(b => b.kademe === 'troll_gizli' || b.kademe === 'troll_sahte');
  const efsaneler = normalHavuz.filter(b => b.kademe === 'efsane');
  const diger = normalHavuz.filter(b => b.kademe !== 'efsane');

  const secilenler = [
    ...cek(efsaneler, N, "efsane"),
    ...cek(diger, trollOlmayan - N, "diger"),
    ...cek(trollHavuz, trollSay, "troll")
  ];

  return { secilenler, osmanliUid: null };
}

function desteTamamla(seed, mod, secilenler, N) {
  const modData = modlar.find(m => m.id === mod);
  const birlikSirasi = shuffle(secilenler, rngFor(seed, "deste:sira"));
  const u = birlikSirasi.length;

  const turlar = [];
  for (let i = 0; i < u; i++) {
    turlar.push({ tip: 'birlik', id: birlikSirasi[i].id, olay: null });
  }

  return turlar;
}

function oyunKurFunc(seed, mod, cag, uids) {
  const N = uids.length;
  const modData = modlar.find(m => m.id === mod);
  const { secilenler } = desteKur(seed, mod, N, uids);
  const turlar = desteTamamla(seed, mod, secilenler, N);

  const durumlar = {};
  uids.forEach(uid => {
    durumlar[uid] = {
      butce: modData.butce,
      birlikler: [],
      kaos: [],
      damgalar: []
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
    N,
    uids: uidsObj,
    turlar,
    turIndex: 0,
    faz: 'HAZIRLIK',
    fazBitis: 0,
    teklif: null,
    artirmaBitti: false,
    durumlar,
    log: {}
  };
}

function maksTeklif(oyuncu, turTipi) {
  const bos = 5 - oyuncu.birlikler.length;
  return turTipi === 'birlik' ? oyuncu.butce - (bos - 1) : oyuncu.butce - bos;
}

function teklifVer(durum, uid, artis, simdi) {
  const tur = durum.turlar[durum.turIndex];
  const oyuncu = durum.durumlar[uid];

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

  durum.teklif = { uid, miktar: yeniTeklif, kritik: false };

  const kalan = durum.fazBitis - simdi;
  if (kalan < 5000) {
    durum.fazBitis = simdi + 5000;
  }

  return { basarili: true };
}

function turKapat(durum) {
  const tur = durum.turlar[durum.turIndex];
  const turLog = { sonuc: null, kazanan: null, fiyat: 0, damgalar: [] };

  if (!durum.teklif) {
    turLog.sonuc = 'ALINMADI';
    durum.log[durum.turIndex] = turLog;
    return;
  }

  const kazananUid = durum.teklif.uid;
  const oyuncu = durum.durumlar[kazananUid];
  const fiyat = durum.teklif.miktar;

  if (tur.tip === 'birlik') {
    oyuncu.butce -= fiyat;
    oyuncu.birlikler.push({ id: tur.id, fiyat, tur: durum.turIndex, kaynak: 'artirma' });
  }

  turLog.sonuc = 'SATILDI';
  turLog.kazanan = kazananUid;
  turLog.fiyat = fiyat;
  durum.log[durum.turIndex] = turLog;
}

function dagit(durum) {
  Object.keys(durum.durumlar).forEach(uid => {
    const oyuncu = durum.durumlar[uid];
    while (oyuncu.birlikler.length < 5) {
      const yedek = yedekler[0];
      oyuncu.birlikler.push({ id: yedek.id, fiyat: 0, tur: durum.turIndex, kaynak: 'yedek' });
    }
  });
}

function ilerle(durum, simdi) {
  durum = normalize(durum);

  if (durum.faz === 'HAZIRLIK') {
    durum.faz = 'TEKLIF';
    durum.fazBitis = simdi + 15000;
    return durum;
  }

  if (durum.faz === 'TEKLIF') {
    turKapat(durum);
    durum.faz = 'SONUC';
    durum.fazBitis = simdi + 4000;
    return durum;
  }

  if (durum.faz === 'SONUC') {
    // Sonraki tur
    durum.turIndex++;

    if (durum.turIndex >= durum.turlar.length || Object.values(durum.durumlar).every(o => o.birlikler.length >= 5)) {
      dagit(durum);
      durum.faz = 'SAVAS';
      durum.artirmaBitti = true;
      return durum;
    }

    durum.teklif = null;
    durum.faz = 'TEKLIF';
    durum.fazBitis = simdi + 15000;
    return durum;
  }

  return durum;
}

// Export
window.OyunMotoru = {
  oyunKur: oyunKurFunc,
  teklifVer,
  ilerle,
  birlikler,
  modlar
};

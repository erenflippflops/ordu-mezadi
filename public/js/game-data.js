// Oyun verileri - Bölüm 6, 9, 10

// Birlikler - Bölüm 10, satır sırası korunmalı
const birlikler = [
  // Antik çağ
  { id: 'A01', ikon: '🛡️', ad: 'Geçidin Kralı', adet: 1, cag: 'antik', tip: 'piyade', kademe: 'efsane', guc: 66, yetenek: 'SON_NEFES', osmanli: '-', aciklama: 'Dar geçitte bir orduyu durduran efsane kral', ifsa: '-' },
  { id: 'A02', ikon: '🐎', ad: 'Makedon Fatih', adet: 1, cag: 'antik', tip: 'suvari', kademe: 'efsane', guc: 70, yetenek: 'ILK_DARBE', osmanli: '-', aciklama: 'Dünyayı atıyla fetheden genç komutan', ifsa: '-' },
  { id: 'A03', ikon: '🔱', ad: 'Arenanın Efsanesi', adet: 1, cag: 'antik', tip: 'piyade', kademe: 'efsane', guc: 64, yetenek: 'ISINMA', osmanli: '-', aciklama: 'Kölelikten isyana, arenadan efsaneye', ifsa: '-' },
  { id: 'A04', ikon: '🦅', ad: 'Roma Lejyoneri', adet: 10, cag: 'antik', tip: 'piyade', kademe: 'elit', guc: 48, yetenek: 'YOK', osmanli: '-', aciklama: 'Disiplinin ve kalkan duvarının ustaları', ifsa: '-' },
  { id: 'A05', ikon: '🛡️', ad: 'Spartalı Hoplit', adet: 5, cag: 'antik', tip: 'piyade', kademe: 'elit', guc: 46, yetenek: 'YOK', osmanli: '-', aciklama: 'Kalkanıyla dönmeyen Spartalı', ifsa: '-' },
  { id: 'A06', ikon: '🏹', ad: 'Pers Ölümsüzü', adet: 6, cag: 'antik', tip: 'menzilli', kademe: 'elit', guc: 42, yetenek: 'YOK', osmanli: '-', aciklama: 'İmparatorluğun hiç eksilmeyen seçkin okçuları', ifsa: '-' },
  { id: 'A07', ikon: '🐎', ad: 'Hun Atlı Savaşçısı', adet: 4, cag: 'antik', tip: 'suvari', kademe: 'elit', guc: 44, yetenek: 'ILK_DARBE', osmanli: '-', aciklama: 'Bozkırdan gelen hızlı atlılar', ifsa: '-' },
  { id: 'A08', ikon: '🛞', ad: 'Mısır Savaş Arabası', adet: 3, cag: 'antik', tip: 'suvari', kademe: 'elit', guc: 40, yetenek: 'YOK', osmanli: '-', aciklama: 'Nil kıyısının hızlı savaş arabaları', ifsa: '-' },
  { id: 'A09', ikon: '🪓', ad: 'Kelt Savaşçısı', adet: 8, cag: 'antik', tip: 'piyade', kademe: 'siradan', guc: 30, yetenek: 'ILK_DARBE', osmanli: '-', aciklama: 'Savaş boyası ve büyük baltalar', ifsa: '-' },
  { id: 'A10', ikon: '🏹', ad: 'Girit Okçusu', adet: 12, cag: 'antik', tip: 'menzilli', kademe: 'siradan', guc: 28, yetenek: 'YOK', osmanli: '-', aciklama: 'Adanın ünlü keskin okçuları', ifsa: '-' },
  { id: 'A11', ikon: '🪨', ad: 'Balear Sapancısı', adet: 15, cag: 'antik', tip: 'menzilli', kademe: 'siradan', guc: 24, yetenek: 'YOK', osmanli: '-', aciklama: 'Taşla adam deviren sapancılar', ifsa: '-' },
  { id: 'A12', ikon: '🐘', ad: 'Savaş Fili', adet: 2, cag: 'antik', tip: 'suvari', kademe: 'elit', guc: 45, yetenek: 'YOK', osmanli: '-', aciklama: 'Düşmanı ezen iki dev fil', ifsa: '-' },
  { id: 'A13', ikon: '🐎', ad: 'Numidya Hafif Süvarisi', adet: 12, cag: 'antik', tip: 'suvari', kademe: 'siradan', guc: 22, yetenek: 'YOK', osmanli: '-', aciklama: 'Çölün hafif ve hızlı atlıları', ifsa: '-' },
  { id: 'A14', ikon: '🏇', ad: 'İskit Kadın Savaşçısı', adet: 6, cag: 'antik', tip: 'suvari', kademe: 'elit', guc: 41, yetenek: 'YOK', osmanli: '-', aciklama: 'Bozkırın korkusuz kadın atlıları', ifsa: '-' },
  { id: 'A15', ikon: '🔱', ad: 'Galya Mızrakçısı', adet: 10, cag: 'antik', tip: 'piyade', kademe: 'siradan', guc: 26, yetenek: 'YOK', osmanli: '-', aciklama: 'Uzun mızraklı kabile savaşçıları', ifsa: '-' },

  // Orta çağ
  { id: 'O01', ikon: '🗡️', ad: 'İki Kılıçlı Usta', adet: 1, cag: 'orta', tip: 'piyade', kademe: 'efsane', guc: 67, yetenek: 'ILK_DARBE', osmanli: '-', aciklama: 'Tek bir düelloyu hiç kaybetmemiş kılıç ustası', ifsa: '-' },
  { id: 'O02', ikon: '🐺', ad: 'Bozkırın Hanı', adet: 1, cag: 'orta', tip: 'suvari', kademe: 'efsane', guc: 72, yetenek: 'YOK', osmanli: '-', aciklama: 'Bozkırı tek bayrak altında toplayan han', ifsa: '-' },
  { id: 'O03', ikon: '🌙', ad: 'Kuşatmanın Sultanı', adet: 1, cag: 'orta', tip: 'suvari', kademe: 'efsane', guc: 70, yetenek: 'ISINMA', osmanli: 'E', aciklama: 'Surları deviren genç sultan', ifsa: '-' },
  { id: 'O04', ikon: '🪖', ad: 'Yeniçeri', adet: 5, cag: 'orta', tip: 'piyade', kademe: 'elit', guc: 50, yetenek: 'YOK', osmanli: 'E', aciklama: 'Ocağın seçkin piyadesi', ifsa: '-' },
  { id: 'O05', ikon: '🐎', ad: 'Sipahi', adet: 6, cag: 'orta', tip: 'suvari', kademe: 'elit', guc: 47, yetenek: 'YOK', osmanli: 'E', aciklama: 'Tımarlı ağır süvari', ifsa: '-' },
  { id: 'O06', ikon: '🔥', ad: 'Deli Süvarisi', adet: 4, cag: 'orta', tip: 'suvari', kademe: 'elit', guc: 43, yetenek: 'ILK_DARBE', osmanli: 'E', aciklama: 'Gözü kara, korku bilmez süvari', ifsa: '-' },
  { id: 'O07', ikon: '🏇', ad: 'Akıncı', adet: 10, cag: 'orta', tip: 'suvari', kademe: 'siradan', guc: 30, yetenek: 'YOK', osmanli: 'E', aciklama: 'Sınır boylarının akıncıları', ifsa: '-' },
  { id: 'O08', ikon: '🏹', ad: 'Azap Okçusu', adet: 12, cag: 'orta', tip: 'menzilli', kademe: 'siradan', guc: 27, yetenek: 'YOK', osmanli: 'E', aciklama: 'Ok yağmuru yağdıran azaplar', ifsa: '-' },
  { id: 'O09', ikon: '💣', ad: 'Humbaracı', adet: 3, cag: 'orta', tip: 'menzilli', kademe: 'elit', guc: 41, yetenek: 'YOK', osmanli: 'E', aciklama: 'El bombası atan Osmanlı uzmanları', ifsa: '-' },
  { id: 'O10', ikon: '✝️', ad: 'Haçlı Şövalyesi', adet: 4, cag: 'orta', tip: 'suvari', kademe: 'elit', guc: 49, yetenek: 'YOK', osmanli: '-', aciklama: 'Ağır zırhlı şövalyeler', ifsa: '-' },
  { id: 'O11', ikon: '⛩️', ad: 'Samuray', adet: 6, cag: 'orta', tip: 'piyade', kademe: 'elit', guc: 48, yetenek: 'YOK', osmanli: '-', aciklama: 'Bushido yolunun savaşçıları', ifsa: '-' },
  { id: 'O12', ikon: '🏹', ad: 'Moğol Atlı Okçusu', adet: 10, cag: 'orta', tip: 'menzilli', kademe: 'elit', guc: 46, yetenek: 'ILK_DARBE', osmanli: '-', aciklama: 'Dörtnala giderken ok atan atlılar', ifsa: '-' },
  { id: 'O13', ikon: '🪓', ad: 'Viking Akıncısı', adet: 8, cag: 'orta', tip: 'piyade', kademe: 'siradan', guc: 32, yetenek: 'ILK_DARBE', osmanli: '-', aciklama: 'Kuzeyden gelen baltalı akıncılar', ifsa: '-' },
  { id: 'O14', ikon: '🎯', ad: 'İngiliz Uzun Yaycısı', adet: 10, cag: 'orta', tip: 'menzilli', kademe: 'elit', guc: 42, yetenek: 'YOK', osmanli: '-', aciklama: 'Uzun yayıyla ünlü okçular', ifsa: '-' },
  { id: 'O15', ikon: '🌾', ad: 'Köylü Mızrakçı', adet: 15, cag: 'orta', tip: 'piyade', kademe: 'siradan', guc: 22, yetenek: 'YOK', osmanli: '-', aciklama: 'Tarlasını bırakıp mızrağı alan köylüler', ifsa: '-' },

  // Modern çağ
  { id: 'M01', ikon: '❄️', ad: 'Kış Hayaleti', adet: 1, cag: 'modern', tip: 'nisanci', kademe: 'efsane', guc: 71, yetenek: 'SON_NEFES', osmanli: '-', aciklama: 'Karlı ormanın görünmez keskin nişancısı', ifsa: '-' },
  { id: 'M02', ikon: '🥷', ad: 'Gölge Komando', adet: 1, cag: 'modern', tip: 'piyade', kademe: 'efsane', guc: 69, yetenek: 'ILK_DARBE', osmanli: '-', aciklama: 'Gecenin içinden çıkan özel harekatçı', ifsa: '-' },
  { id: 'M03', ikon: '🛡️', ad: 'Efsane Tank Ası', adet: 1, cag: 'modern', tip: 'suvari', kademe: 'efsane', guc: 70, yetenek: 'ISINMA', osmanli: '-', aciklama: 'Tek başına cepheyi yaran tank ası', ifsa: '-' },
  { id: 'M04', ikon: '🇹🇷', ad: 'Çanakkale Mehmetçiği', adet: 8, cag: 'modern', tip: 'piyade', kademe: 'elit', guc: 50, yetenek: 'SON_NEFES', osmanli: 'E', aciklama: 'Geçilmez denilen cephenin kahramanları', ifsa: '-' },
  { id: 'M05', ikon: '🪖', ad: 'Özel Kuvvet Askeri', adet: 4, cag: 'modern', tip: 'nisanci', kademe: 'elit', guc: 52, yetenek: 'YOK', osmanli: '-', aciklama: 'Uzun menzilli tüfekli seçkin tim', ifsa: '-' },
  { id: 'M06', ikon: '🎯', ad: 'Keskin Nişancı Takımı', adet: 2, cag: 'modern', tip: 'nisanci', kademe: 'elit', guc: 45, yetenek: 'YOK', osmanli: '-', aciklama: 'İki kişilik gözcü ve nişancı', ifsa: '-' },
  { id: 'M07', ikon: '💂', ad: 'Siper Tüfekçisi', adet: 10, cag: 'modern', tip: 'menzilli', kademe: 'siradan', guc: 30, yetenek: 'YOK', osmanli: '-', aciklama: 'Siperden ateş eden tüfekçiler', ifsa: '-' },
  { id: 'M08', ikon: '🐎', ad: 'Kazak Süvarisi', adet: 6, cag: 'modern', tip: 'suvari', kademe: 'elit', guc: 42, yetenek: 'YOK', osmanli: '-', aciklama: 'Kılıcı ve atıyla bozkır süvarisi', ifsa: '-' },
  { id: 'M09', ikon: '🔪', ad: 'Gurkha', adet: 3, cag: 'modern', tip: 'piyade', kademe: 'elit', guc: 47, yetenek: 'ILK_DARBE', osmanli: '-', aciklama: 'Kıvrık bıçağıyla efsane dağ askerleri', ifsa: '-' },
  { id: 'M10', ikon: '🔫', ad: 'Milis Tüfekçi', adet: 12, cag: 'modern', tip: 'menzilli', kademe: 'siradan', guc: 26, yetenek: 'YOK', osmanli: '-', aciklama: 'Gönüllü tüfekli halk birliği', ifsa: '-' },
  { id: 'M11', ikon: '🪂', ad: 'Paraşütçü', adet: 5, cag: 'modern', tip: 'piyade', kademe: 'elit', guc: 44, yetenek: 'ILK_DARBE', osmanli: '-', aciklama: 'Gökten inen hızlı birlik', ifsa: '-' },
  { id: 'M12', ikon: '🙃', ad: 'Acemi Er', adet: 20, cag: 'modern', tip: 'menzilli', kademe: 'siradan', guc: 16, yetenek: 'YOK', osmanli: '-', aciklama: 'Yirmi acemi er, tüfekleri yeni', ifsa: '-' },
  { id: 'M13', ikon: '🏍️', ad: 'Motosikletli Keşifçi', adet: 3, cag: 'modern', tip: 'suvari', kademe: 'siradan', guc: 28, yetenek: 'YOK', osmanli: '-', aciklama: 'Hızlı keşif motosikletçileri', ifsa: '-' },
  { id: 'M14', ikon: '💥', ad: 'Makineli Tüfek Mangası', adet: 4, cag: 'modern', tip: 'menzilli', kademe: 'elit', guc: 49, yetenek: 'ISINMA', osmanli: '-', aciklama: 'Durmadan ateş eden makineli tüfek ekibi', ifsa: '-' },
  { id: 'M15', ikon: '🧨', ad: 'Havan Ekibi', adet: 6, cag: 'modern', tip: 'menzilli', kademe: 'elit', guc: 40, yetenek: 'YOK', osmanli: '-', aciklama: 'Uzaktan döven havan ekibi', ifsa: '-' },

  // Troll birlikler - gizli
  { id: 'T01', ikon: '👡', ad: 'Türk Annesi', adet: 1, cag: 'tum', tip: 'menzilli', kademe: 'troll_gizli', guc: 62, yetenek: 'ILK_DARBE', osmanli: '-', aciklama: 'Bir anne ve terliği', ifsa: 'Terlik menzili: sınırsız. Kimse kaçamadı.' },
  { id: 'T02', ikon: '💃', ad: 'Düğün Halaycısı', adet: 5, cag: 'tum', tip: 'piyade', kademe: 'troll_gizli', guc: 55, yetenek: 'ISINMA', osmanli: '-', aciklama: 'Düğünden çıkıp gelmiş halaycılar', ifsa: 'Üç gün üç gece halay çekip hiç yorulmadılar.' },
  { id: 'T03', ikon: '🌯', ad: 'Gece Kokoreççisi', adet: 3, cag: 'tum', tip: 'menzilli', kademe: 'troll_gizli', guc: 50, yetenek: 'SON_NEFES', osmanli: '-', aciklama: 'Gece yarısı tezgahındaki kokoreççiler', ifsa: 'Şişleri fırlatarak ön safları dağıttılar.' },
  { id: 'T04', ikon: '😎', ad: 'Çinçinli Keko', adet: 5, cag: 'tum', tip: 'piyade', kademe: 'troll_gizli', guc: 57, yetenek: 'ILK_DARBE', osmanli: '-', aciklama: 'Mahallenin çinçinli kekoları', ifsa: 'Sokak kavgasında yenilmezler, ordu da sokak sayılır.' },
  { id: 'T05', ikon: '🥊', ad: 'Kelebek Gibi Uçan Boksör', adet: 1, cag: 'tum', tip: 'piyade', kademe: 'troll_gizli', guc: 60, yetenek: 'ISINMA', osmanli: '-', aciklama: 'Kelebek gibi uçan, arı gibi sokan boksör', ifsa: 'Rakipler ringde sandı, tek tek devrildi.' },
  { id: 'T06', ikon: '🍅', ad: 'Pazar Esnafı', adet: 4, cag: 'tum', tip: 'menzilli', kademe: 'troll_gizli', guc: 48, yetenek: 'YOK', osmanli: '-', aciklama: 'Pazar tezgahından esnaf', ifsa: 'Domates yağmuru ve "üç kilo on lira" naraları.' },
  { id: 'T07', ikon: '🚕', ad: 'Kornacı Taksici', adet: 2, cag: 'tum', tip: 'suvari', kademe: 'troll_gizli', guc: 53, yetenek: 'ILK_DARBE', osmanli: '-', aciklama: 'Kornası hiç susmayan iki taksici', ifsa: 'Korna sesinden düşman birlikleri dağıldı.' },
  { id: 'T08', ikon: '⚽', ad: 'Mahalle Maç Ekibi', adet: 7, cag: 'tum', tip: 'menzilli', kademe: 'troll_gizli', guc: 49, yetenek: 'ISINMA', osmanli: '-', aciklama: 'Halı saha efsaneleri', ifsa: 'Şutlar kaleye değil düşmana gitti.' },

  // Troll birlikler - sahte
  { id: 'T09', ikon: '📱', ad: 'Fenomen Asker', adet: 10, cag: 'tum', tip: 'nisanci', kademe: 'troll_sahte', guc: 6, yetenek: 'KORKAK', osmanli: '-', aciklama: 'Kamuflajlı, teçhizatlı seçkin birlik', ifsa: 'Aslında fenomen: savaş yerine story çektiler.' },
  { id: 'T10', ikon: '🗺️', ad: 'Haritayı Ters Tutan General', adet: 1, cag: 'tum', tip: 'piyade', kademe: 'troll_sahte', guc: 5, yetenek: 'YOK', osmanli: '-', aciklama: 'Yüz savaş görmüş deneyimli general', ifsa: 'Haritayı ters tuttu, ordusunu kaybetti.' },
  { id: 'T11', ikon: '📦', ad: 'Zırhlı Şövalye Birliği', adet: 5, cag: 'tum', tip: 'suvari', kademe: 'troll_sahte', guc: 8, yetenek: 'YOK', osmanli: '-', aciklama: 'Tepeden tırnağa zırhlı beş şövalye', ifsa: 'Zırhlar kartondan çıktı, ilk yağmurda eridi.' },
  { id: 'T12', ikon: '🎮', ad: 'Profesyonel Oyuncu', adet: 3, cag: 'tum', tip: 'nisanci', kademe: 'troll_sahte', guc: 9, yetenek: 'KORKAK', osmanli: '-', aciklama: 'Binlerce savaş kazanmış profesyonel', ifsa: 'Hepsi oyundaydı, gerçek hayatta ilk savaşı.' },
  { id: 'T13', ikon: '🎬', ad: 'Destansı Ordu', adet: 20, cag: 'tum', tip: 'piyade', kademe: 'troll_sahte', guc: 10, yetenek: 'KORKAK', osmanli: '-', aciklama: 'Yirmi kişilik destansı ordu', ifsa: 'Film figüranıydılar, çekim bitince evlerine gittiler.' },
  { id: 'T14', ikon: '🎤', ad: 'Motivasyon Koçu', adet: 4, cag: 'tum', tip: 'piyade', kademe: 'troll_sahte', guc: 4, yetenek: 'YOK', osmanli: '-', aciklama: 'Orduya güç veren özel danışman', ifsa: 'Sadece konuştu, kimseyi motive edemedi.' },
];

// Yedek birlikler - Bölüm 10, sadece dağıtımda kullanılır
const yedekler = [
  { id: 'Y01', ikon: '🧑‍🌾', ad: 'Köylü Milis', adet: 10, cag: 'tum', tip: 'piyade', kademe: 'yedek', guc: 12, yetenek: 'YOK', osmanli: '-', aciklama: 'Köyden toplanmış gönüllüler', ifsa: '-' },
  { id: 'Y02', ikon: '🐑', ad: 'Sapanlı Çoban', adet: 8, cag: 'tum', tip: 'menzilli', kademe: 'yedek', guc: 10, yetenek: 'YOK', osmanli: '-', aciklama: 'Sapanıyla sürüsünü koruyan çobanlar', ifsa: '-' },
  { id: 'Y03', ikon: '✉️', ad: 'Atlı Postacı', adet: 5, cag: 'tum', tip: 'suvari', kademe: 'yedek', guc: 9, yetenek: 'YOK', osmanli: '-', aciklama: 'Mektup taşıyan atlılar', ifsa: '-' },
  { id: 'Y04', ikon: '🔦', ad: 'Gönüllü Bekçi', adet: 6, cag: 'tum', tip: 'piyade', kademe: 'yedek', guc: 11, yetenek: 'YOK', osmanli: '-', aciklama: 'Fenerli mahalle bekçileri', ifsa: '-' },
];

// Kaos kartları - Bölüm 6
const kaosKartlari = [
  { id: 'K01', ad: 'Yağmur', aciklama: 'Rakibin menzilli ve nişancı birliklerinin gücü × 0,5' },
  { id: 'K02', ad: 'Hain Casus', aciklama: 'Rakibin rastgele bir birliği o düello boyunca senin tarafında savaşır' },
  { id: 'K03', ad: 'Pazarlıkçı Teyze', aciklama: 'O ana kadar bir birliğe ödediğin en yüksek fiyatın yarısı iade edilir' },
  { id: 'K04', ad: 'Dayı Torpili', aciklama: 'Açık artırmayla kazandığın bir sonraki birliğin fiyatının yarısı iade edilir' },
  { id: 'K05', ad: 'Moral Konuşması', aciklama: 'Kendi tüm birliklerin × 1,1' },
  { id: 'K06', ad: 'Kıtlık', aciklama: 'Rakibin adeti ≥ 10 olan birliklerinin gücü × 0,8' },
];

// Oyun modları - Bölüm 9
const modlar = [
  { id: 'klasik', ad: 'Klasik', butce: 100, trollOrani: 0.2, kaosCarpani: 1, kaosUstSinir: 1, ekOlay: 0, minOyuncu: 2, maxOyuncu: 4 },
  { id: 'osmanli', ad: 'Osmanlı vs. Dünya', butce: 100, trollOrani: 0.2, kaosCarpani: 1, kaosUstSinir: 1, ekOlay: 0, minOyuncu: 2, maxOyuncu: 4 },
  { id: 'troll', ad: 'Troll Gecesi', butce: 100, trollOrani: 0.5, kaosCarpani: 2, kaosUstSinir: 2, ekOlay: 1, minOyuncu: 2, maxOyuncu: 4 },
  { id: 'kor', ad: 'Kör Mod', butce: 100, trollOrani: 0.2, kaosCarpani: 1, kaosUstSinir: 1, ekOlay: 0, minOyuncu: 2, maxOyuncu: 4 },
  { id: 'fakir', ad: 'Fakir Mod', butce: 30, trollOrani: 0.2, kaosCarpani: 1, kaosUstSinir: 1, ekOlay: 0, minOyuncu: 2, maxOyuncu: 4 },
  { id: 'donem', ad: 'Dönem Düellosu', butce: 100, trollOrani: 0.2, kaosCarpani: 1, kaosUstSinir: 1, ekOlay: 0, minOyuncu: 2, maxOyuncu: 3 },
];

// Exported as window.GameData

window.GameData = { birlikler, yedekler, kaosKartlari, modlar };

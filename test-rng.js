// Test dosyası - Bölüm 16 altın değerler
const { fnv1a, mulberry32, rngFor, shuffle } = require('./rng');

console.log('=== RNG Altın Değer Testleri ===\n');

// Test 1: fnv1a
console.log('fnv1a("abc"):', fnv1a("abc"));
console.log('Beklenen: 440920331');
console.log('✓ Eşleşti mi?', fnv1a("abc") === 440920331);

console.log('\nfnv1a("Türk"):', fnv1a("Türk"));
console.log('Beklenen: 1867021915');
console.log('✓ Eşleşti mi?', fnv1a("Türk") === 1867021915);

// Test 2: mulberry32
console.log('\n--- mulberry32(1) ilk 3 çıktı ---');
const m32 = mulberry32(1);
const vals = [m32(), m32(), m32()];
console.log('Çıktı:', vals.map(v => v.toFixed(10)));
console.log('Beklenen: 0.6270739406, 0.0027357212, 0.5274470400');
const match = Math.abs(vals[0] - 0.6270739406) < 0.0000000001 &&
              Math.abs(vals[1] - 0.0027357212) < 0.0000000001 &&
              Math.abs(vals[2] - 0.5274470400) < 0.0000000001;
console.log('✓ Eşleşti mi?', match);

// Test 3: rngFor
console.log('\n--- rngFor("TEST", "deste:sira") ilk 3 çıktı ---');
const rng = rngFor("TEST", "deste:sira");
const vals2 = [rng(), rng(), rng()];
console.log('Çıktı:', vals2.map(v => v.toFixed(10)));
console.log('Beklenen: 0.0091964076, 0.2318388096, 0.1699480067');
const match2 = Math.abs(vals2[0] - 0.0091964076) < 0.0000000001 &&
               Math.abs(vals2[1] - 0.2318388096) < 0.0000000001 &&
               Math.abs(vals2[2] - 0.1699480067) < 0.0000000001;
console.log('✓ Eşleşti mi?', match2);

// Test 4: shuffle
console.log('\n--- shuffle([1,2,3,4,5], mulberry32(7)) ---');
const shuffled = shuffle([1,2,3,4,5], mulberry32(7));
console.log('Çıktı:', shuffled);
console.log('Beklenen: [4, 2, 3, 5, 1]');
const match3 = JSON.stringify(shuffled) === JSON.stringify([4, 2, 3, 5, 1]);
console.log('✓ Eşleşti mi?', match3);

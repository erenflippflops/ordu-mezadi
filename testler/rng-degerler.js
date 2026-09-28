// Section 16 RNG Value Tests - Verifies RNG table from design document
import { test } from 'node:test';
import assert from 'node:assert';
import { rngFor } from '../public/js/rastgele.js';

// Section 16: RNG Table Verification
test('RNG Table - All values match section 16 specification', () => {
  // Test seed: "ALTIN1"
  const seed = 'ALTIN1';
  const rng = rngFor(seed);

  // Expected RNG values from section 16 table (ALTIN1 seed)
  const expectedValues = [
    0.6882155847270042,
    0.6113636768423021,
    0.35325246304273605,
    0.05795922293327749,
    0.5084996894001961,
    0.08828191505745053,
    0.7457887339405715,
    0.19995407527312636,
    0.44217797205783427,
    0.03126512328162789,
    0.08117102435790002,
    0.8889806501101702,
    0.5615069814957678,
    0.08869727072305977,
    0.24062716076150537,
    0.40621243929490447,
    0.1415991538669914,
    0.3594227887224406,
    0.43229321180842817,
    0.7184901412110776
  ];

  // Generate values and verify each one
  expectedValues.forEach((expected, index) => {
    const actual = rng();
    assert.strictEqual(
      actual,
      expected,
      `RNG value at index ${index} should be ${expected}, got ${actual}`
    );
  });
});

test('RNG determinism - Same seed always produces same sequence', () => {
  const seed = 'TEST_SEED';
  const iterations = 100;

  // Generate first sequence
  const rng1 = rngFor(seed);
  const firstRun = [];
  for (let i = 0; i < iterations; i++) {
    firstRun.push(rng1());
  }

  // Generate second sequence
  const rng2 = rngFor(seed);
  const secondRun = [];
  for (let i = 0; i < iterations; i++) {
    secondRun.push(rng2());
  }

  // Verify they match
  firstRun.forEach((value, index) => {
    assert.strictEqual(
      value,
      secondRun[index],
      `RNG value at index ${index} should be deterministic`
    );
  });
});

test('RNG range - All values between 0 and 1', () => {
  const seed = 'RANGE_TEST';
  const iterations = 1000;
  const rng = rngFor(seed);

  for (let i = 0; i < iterations; i++) {
    const value = rng();
    assert.ok(value >= 0 && value < 1, `RNG value ${value} at index ${i} must be in range [0, 1)`);
  }
});

test('RNG distribution - Values appear uniformly distributed', () => {
  const seed = 'DISTRIBUTION_TEST';
  const iterations = 10000;
  const buckets = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]; // 10 buckets
  const rng = rngFor(seed);

  for (let i = 0; i < iterations; i++) {
    const value = rng();
    const bucketIndex = Math.floor(value * 10);
    buckets[bucketIndex]++;
  }

  // Each bucket should have roughly iterations/10 values
  // Allow 20% deviation
  const expectedPerBucket = iterations / 10;
  const tolerance = expectedPerBucket * 0.2;

  buckets.forEach((count, index) => {
    const deviation = Math.abs(count - expectedPerBucket);
    assert.ok(
      deviation <= tolerance,
      `Bucket ${index} has ${count} values, expected ~${expectedPerBucket} ±${tolerance}`
    );
  });
});

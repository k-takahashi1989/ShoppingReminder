import { haversineDistance, generateId } from '../src/utils/helpers';

// ============================================================
// haversineDistance
// ============================================================
describe('haversineDistance', () => {
  it('同一地点なら 0 m を返す', () => {
    const dist = haversineDistance(35.6812, 139.7671, 35.6812, 139.7671);
    expect(dist).toBe(0);
  });

  it('東京駅 → 渋谷駅 の距離が約 6km になる', () => {
    // 東京駅: 35.6812, 139.7671
    // 渋谷駅: 35.6580, 139.7016
    const dist = haversineDistance(35.6812, 139.7671, 35.6580, 139.7016);
    // 実距離は約 6.3km。±500m の許容
    expect(dist).toBeGreaterThan(5000);
    expect(dist).toBeLessThan(7000);
  });

  it('200m 以内であることを検証できる', () => {
    // 基点から約 100m 離れた地点 (緯度を少しずらす)
    const baseLat = 35.0;
    const baseLon = 135.0;
    // 0.001度 ≈ 111m
    const nearLat = baseLat + 0.001;
    const nearLon = baseLon;
    const dist = haversineDistance(baseLat, baseLon, nearLat, nearLon);
    expect(dist).toBeLessThan(200);
  });

  it('1km 以上離れた地点を区別できる', () => {
    const baseLat = 35.0;
    const baseLon = 135.0;
    // 0.01度 ≈ 1.1km
    const farLat = baseLat + 0.01;
    const dist = haversineDistance(baseLat, baseLon, farLat, baseLon);
    expect(dist).toBeGreaterThan(1000);
  });
});

// ============================================================
// generateId
// ============================================================
describe('generateId', () => {
  it('文字列を返す', () => {
    expect(typeof generateId()).toBe('string');
  });

  it('空文字列ではない', () => {
    expect(generateId().length).toBeGreaterThan(0);
  });

  it('呼び出すたびに異なる ID を生成する', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateId()));
    expect(ids.size).toBe(100);
  });
});

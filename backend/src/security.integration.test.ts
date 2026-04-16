import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';

function loadAppWithEnv() {
  process.env.LOCATION_MAPPINGS_WRITE_API_KEY = 'test-write-key';
  process.env.LOCATION_WRITE_RATE_LIMIT_MAX = '2';
  process.env.LOCATION_BULK_MAX_ITEMS = '2';
  process.env.CORS_ORIGINS = 'https://trusted.example.com';
  process.env.TRUST_PROXY = '1';

  const indexPath = require.resolve('./index');
  const locationMappingsPath = require.resolve('./routes/locationMappings');

  delete require.cache[indexPath];
  delete require.cache[locationMappingsPath];

  const mod = require('./index') as { createApp: () => any };
  return mod.createApp();
}

test('POST location-mappings/upsert requires auth (401)', async () => {
  const app = loadAppWithEnv();

  const response = await request(app)
    .post('/api/location-mappings/upsert')
    .send({ locationName: 'หน้าบ้านหมายเลข 01', x: 10, y: 20 });

  assert.equal(response.status, 401);
  assert.equal(response.body.success, false);
});

test('CORS rejects unknown origin (403)', async () => {
  const app = loadAppWithEnv();

  const response = await request(app)
    .get('/api/health')
    .set('Origin', 'https://evil.example.com');

  assert.equal(response.status, 403);
  assert.equal(response.body.success, false);
  assert.equal(response.body.error, 'CORS origin is not allowed');
});

test('write routes are rate-limited (429)', async () => {
  const app = loadAppWithEnv();

  const sendWrite = () =>
    request(app)
      .post('/api/location-mappings/upsert')
      .set('x-api-key', 'test-write-key')
      .send({});

  const first = await sendWrite();
  const second = await sendWrite();
  const third = await sendWrite();

  assert.notEqual(first.status, 429);
  assert.notEqual(second.status, 429);
  assert.equal(third.status, 429);
  assert.equal(third.body.success, false);
});

test('upsert-many enforces max item cap (400)', async () => {
  const app = loadAppWithEnv();

  const response = await request(app)
    .post('/api/location-mappings/upsert-many')
    .set('x-api-key', 'test-write-key')
    .send([
      { locationName: 'หน้าบ้านหมายเลข 01', x: 10, y: 20 },
      { locationName: 'หน้าบ้านหมายเลข 02', x: 11, y: 21 },
      { locationName: 'หน้าบ้านหมายเลข 03', x: 12, y: 22 },
    ]);

  assert.equal(response.status, 400);
  assert.equal(response.body.success, false);
  assert.match(String(response.body.error), /maximum allowed items/i);
});

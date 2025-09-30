const request = require('supertest');
const app = require('../service');
const { DB } = require('../database/database.js');
const {registerDiner, registerAdmin, createStore, createFranchise} = require("../testing/testUtils");

let testAdminAuthToken;
let testDinerAuthToken;
let testDiner;

beforeAll(async () => {
  const { diner, dinerAuthToken } = await registerDiner();
  testDinerAuthToken = dinerAuthToken;
  testDiner = diner;

  const { adminAuthToken } = await registerAdmin();
  testAdminAuthToken = adminAuthToken;
})

afterAll(async () => {
  let franchises = await DB.getUserFranchises(testDiner.id);
  for (const franchise of franchises) {
    await DB.deleteFranchise(franchise.id);
  }
})

test('createFranchise', async () => {
  let result = await createFranchise(testDiner, testAdminAuthToken);
  delete result.id;

  expect(result.admins).toEqual([testDiner]);
});

test('getFranchises', async () => {
  await createFranchise(testDiner, testAdminAuthToken);
  await createFranchise(testDiner, testAdminAuthToken);
  await createFranchise(testDiner, testAdminAuthToken);

  const response = await request(app).get('/api/franchise').set({ Authorization: `Bearer ${testDinerAuthToken}` })
  expect(response.status).toBe(200);

  expect(response.body.franchises.length).toBeGreaterThanOrEqual(3);
})

test('getUserFranchises', async () => {
  await createFranchise(testDiner, testAdminAuthToken);
  await createFranchise(testDiner, testAdminAuthToken);
  await createFranchise(testDiner, testAdminAuthToken);

  const response = await request(app).get(`/api/franchise/${testDiner.id}`).set({ Authorization: `Bearer ${testAdminAuthToken}` });
  expect(response.status).toBe(200);

  expect(response.body.length).toBeGreaterThanOrEqual(3);
})

test('deleteFranchise', async () => {
  const franchise = await createFranchise(testDiner, testAdminAuthToken);

  const response = await request(app).delete(`/api/franchise/${franchise.id}`).set({ Authorization: `Bearer ${testAdminAuthToken}` });
  expect(response.status).toBe(200);
  expect(response.body.message).toBe(`franchise deleted`);
})

test('createStore', async () => {
  const franchise = await createFranchise(testDiner, testAdminAuthToken);
  const store = await createStore(franchise, testAdminAuthToken);

  expect(store).toEqual(expect.objectContaining({
    franchiseId: franchise.id,
    name: expect.any(String),
    id: expect.any(Number)
  }))
})

test('deleteStore', async () => {
  const franchise = await createFranchise(testDiner, testAdminAuthToken);
  const store = await createStore(franchise, testAdminAuthToken);

  const deleteResponse = await request(app).delete(`/api/franchise/${franchise.id}/store/${store.id}`).set({ Authorization: `Bearer ${testAdminAuthToken}` });
  expect(deleteResponse.status).toBe(200);
  expect(deleteResponse.body.message).toBe(`store deleted`);
})


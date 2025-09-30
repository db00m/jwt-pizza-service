const request = require('supertest');
const app = require('../service');
const { DB } = require('../database/database.js');
const {registerDiner, registerAdmin} = require("../testing/testUtils");

let testAdminAuthToken;
let testDinerAuthToken;
let testAdmin;
let testDiner;

beforeAll(async () => {
  const { diner, dinerAuthToken } = await registerDiner();
  testDinerAuthToken = dinerAuthToken;
  testDiner = diner;

  const { admin, adminAuthToken } = await registerAdmin();
  testAdminAuthToken = adminAuthToken;
  testAdmin = admin;
})

afterAll(async () => {
  let franchises = await DB.getUserFranchises(testDiner.id);
  for (const franchise of franchises) {
    await DB.deleteFranchise(franchise.id);
  }
})

const createFranchise = async () => {
  const franchise = { name: Math.random().toString(36).substring(2, 12), admins: [testDiner] }

  const createRes = await request(app).post('/api/franchise').set({ Authorization: `Bearer ${testAdminAuthToken}` }).send(franchise)
  expect(createRes.status).toBe(200)

  return createRes.body;
}

const createStore =  async (franchise) => {
  const store = { franchiseId: franchise.id, name: Math.random().toString(36).substring(2, 12) };

  const response = await request(app).post(`/api/franchise/${franchise.id}/store`)
    .set({ Authorization: `Bearer ${testAdminAuthToken}` })
    .send(store);
  expect(response.status).toBe(200);

  return response.body;
}

test('createFranchise', async () => {
  let result = await createFranchise();
  delete result.id;

  expect(result.admins).toEqual([testDiner]);
});

test('getFranchises', async () => {
  await createFranchise();
  await createFranchise();
  await createFranchise();

  const response = await request(app).get('/api/franchise').set({ Authorization: `Bearer ${testDinerAuthToken}` })
  expect(response.status).toBe(200);

  expect(response.body.franchises.length).toBeGreaterThanOrEqual(3);
})

test('getUserFranchises', async () => {
  await createFranchise();
  await createFranchise();
  await createFranchise();

  const response = await request(app).get(`/api/franchise/${testDiner.id}`).set({ Authorization: `Bearer ${testAdminAuthToken}` });
  expect(response.status).toBe(200);

  expect(response.body.length).toBeGreaterThanOrEqual(3);
})

test('deleteFranchise', async () => {
  const franchise = await createFranchise();

  const response = await request(app).delete(`/api/franchise/${franchise.id}`).set({ Authorization: `Bearer ${testAdminAuthToken}` });
  expect(response.status).toBe(200);
  expect(response.body.message).toBe(`franchise deleted`);
})

test('createStore', async () => {
  const franchise = await createFranchise();
  const store = await createStore(franchise);

  expect(store).toEqual(expect.objectContaining({
    franchiseId: franchise.id,
    name: expect.any(String),
    id: expect.any(Number)
  }))
})

test('deleteStore', async () => {
  const franchise = await createFranchise();
  const store = await createStore(franchise);

  const deleteResponse = await request(app).delete(`/api/franchise/${franchise.id}/store/${store.id}`).set({ Authorization: `Bearer ${testAdminAuthToken}` });
  expect(deleteResponse.status).toBe(200);
  expect(deleteResponse.body.message).toBe(`store deleted`);
})


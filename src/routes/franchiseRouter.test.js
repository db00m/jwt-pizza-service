const request = require('supertest');
const app = require('../service');
const { Role, DB } = require('../database/database.js');
const {response} = require("express");

let authToken = "fakeauth";
let testAdmin = { name: 'admin', email: 'reg@test.com', password: 'a' };
let testFranchisee = { name: 'franchisee', email: 'fran@test.com', password: 'a' };

beforeAll(async () => {
  testAdmin.email = Math.random().toString(36).substring(2, 12) + '@test.com';
  testAdmin.roles = [{ role: Role.Admin }]
  testAdmin = await DB.addUser(testAdmin);
  testAdmin = { ...testAdmin, password: 'a' };

  testFranchisee.email = Math.random().toString(36).substring(2, 12) + '@test.com';
  testFranchisee.roles = [{ role: Role.Diner }]
  testFranchisee = await DB.addUser(testFranchisee);
  testFranchisee = { ...testFranchisee, password: 'a' };

  const loginRes = await request(app).put('/api/auth').send(testAdmin);
  authToken = loginRes.body.token;
})

afterAll(async () => {
  let franchises = await DB.getUserFranchises(testFranchisee.id);
  franchises.forEach((franchise) => {
    DB.deleteFranchise(franchise.id)
  });
})

const createFranchise = async () => {
  const franchise = { name: Math.random().toString(36).substring(2, 12), admins: [testFranchisee] }

  const createRes = await request(app).post('/api/franchise').set({ Authorization: `Bearer ${authToken}` }).send(franchise)
  expect(createRes.status).toBe(200)

  return createRes.body;
}

const createStore =  async (franchise) => {
  const store = { franchiseId: franchise.id, name: Math.random().toString(36).substring(2, 12) };

  const response = await request(app).post(`/api/franchise/${franchise.id}/store`)
    .set({ Authorization: `Bearer ${authToken}` })
    .send(store);
  expect(response.status).toBe(200);

  return response.body;
}

test('createFranchise', async () => {
  let result = await createFranchise();
  delete result.id;

  expect(result.admins).toEqual([testFranchisee]);
});

test('getFranchises', async () => {
  await createFranchise();
  await createFranchise();
  await createFranchise();

  const response = await request(app).get('/api/franchise').set({ Authorization: `Bearer ${authToken}` })
  expect(response.status).toBe(200);

  expect(response.body.franchises.length).toBeGreaterThanOrEqual(3);
})

test('getUserFranchises', async () => {
  await createFranchise();
  await createFranchise();
  await createFranchise();

  const response = await request(app).get(`/api/franchise/${testFranchisee.id}`).set({ Authorization: `Bearer ${authToken}` });
  expect(response.status).toBe(200);

  expect(response.body.length).toBeGreaterThanOrEqual(3);
})

test('deleteFranchise', async () => {
  const franchise = await createFranchise();

  const response = await request(app).delete(`/api/franchise/${franchise.id}`).set({ Authorization: `Bearer ${authToken}` });
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

  const deleteResponse = await request(app).delete(`/api/franchise/${franchise.id}/store/${store.id}`).set({ Authorization: `Bearer ${authToken}` });
  expect(deleteResponse.status).toBe(200);
  expect(deleteResponse.body.message).toBe(`store deleted`);
})


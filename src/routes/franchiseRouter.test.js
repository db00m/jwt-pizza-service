const request = require('supertest');
const app = require('../service');
const { Role, DB } = require('../database/database.js');

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

  let result = createRes.body;
  delete result.id;

  return result;
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

  const response = await request(app).get(`/api/franchise`).set({ Authorization: `Bearer ${authToken}` })
  expect(response.status).toBe(200);

  expect(response.body.franchises.length).toBeGreaterThanOrEqual(3);
})

// TODO getUserFranchises

// TODO deleteFranchise

// TODO createStore

// TODO deleteStore


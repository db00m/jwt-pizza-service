const request = require("supertest");
const app = require("../service");
const {Role, DB} = require("../database/database");

const generateRandomString = () => {
  return Math.random().toString(36).substring(2, 12)
}

const registerDiner = async () => {
  let diner = { name: 'pizza diner', email: generateRandomString() + '@test.com', password: 'a' };
  const loginRes = await request(app).post('/api/auth').send(diner);
  expect(loginRes.status).toBe(200);

  const dinerAuthToken = loginRes.body.token;
  diner = loginRes.body.user;
  diner.password = 'a';

  return { diner, dinerAuthToken }
}

const registerAdmin = async () => {
  let admin = { name: 'pizza admin', email: generateRandomString() + '@admin.com', password: 'a' }
  admin.roles = [{ role: Role.Admin }]
  admin = await DB.addUser(admin);
  admin = { ...admin, password: 'a' };
  const loginRes = await request(app).put('/api/auth').send(admin);

  expect(loginRes.status).toBe(200);

  const adminAuthToken = loginRes.body.token;

  return { admin, adminAuthToken }
}

const createStore = async (franchise, authToken) => {
  let store = { franchiseId: franchise.id, name: generateRandomString() + 'test store' };

  const response = await request(app).post(`/api/franchise/${franchise.id}/store`)
    .set({ Authorization: `Bearer ${authToken}` })
    .send(store);
  expect(response.status).toBe(200);

  return response.body;
}

const createFranchise = async (admin, authToken) => {
  const franchise = { name: generateRandomString() + 'test franchise', admins: [admin] }

  const createRes = await request(app).post('/api/franchise').set({ Authorization: `Bearer ${authToken}` }).send(franchise)
  expect(createRes.status).toBe(200)

  return createRes.body;
}



module.exports = { registerDiner, registerAdmin, generateRandomString, createFranchise, createStore };
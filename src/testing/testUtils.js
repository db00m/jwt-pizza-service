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



module.exports = { registerDiner, registerAdmin, generateRandomString };
const request = require('supertest');
const app = require('../service');
const {registerAdmin} = require("../testing/testUtils");

let testAuthToken;
let testAdmin;

beforeAll(async () => {
  const { admin, adminAuthToken } = await registerAdmin();
  testAuthToken = adminAuthToken;
  testAdmin = admin;
})

test('list users unauthorized', async () => {
  const listUsersRes = await request(app).get('/api/user');
  expect(listUsersRes.status).toBe(401);
});

test('list users', async () => {
  const listUsersRes = await request(app)
    .get('/api/user')
    .set('Authorization', `Bearer ${testAuthToken}`);
  expect(listUsersRes.status).toBe(200);
  const users = listUsersRes.body[0];
  expect(users).toEqual(expect.arrayContaining([
    expect.objectContaining({
      id: expect.any(Number),
      name: expect.any(String),
      email: expect.any(String),
    })
  ]));
})
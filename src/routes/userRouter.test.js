const request = require('supertest');
const app = require('../service');
const {registerAdmin, registerDiner} = require("../testing/testUtils");

test('list users unauthorized', async () => {
  const listUsersRes = await request(app).get('/api/user');
  expect(listUsersRes.status).toBe(401);
});

test('list users diner', async () => {
  const { dinerAuthToken } = await registerDiner();

  const listUsersRes = await request(app)
    .get('/api/user')
    .set('Authorization', `Bearer ${dinerAuthToken}`);
  expect(listUsersRes.status).toBe(403);
});

test('list users admin', async () => {
  const { adminAuthToken } = await registerAdmin();

  const listUsersRes = await request(app)
    .get('/api/user')
    .set('Authorization', `Bearer ${adminAuthToken}`);
  expect(listUsersRes.status).toBe(200);
  const users = listUsersRes.body.users;
  expect(users).toEqual(expect.arrayContaining([
    expect.objectContaining({
      id: expect.any(Number),
      name: expect.any(String),
      email: expect.any(String),
    })
  ]));
})
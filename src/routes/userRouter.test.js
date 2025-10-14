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
});

test('delete user unauthorized', async () => {
  const deleteUserRes = await request(app)
    .delete('/api/user/1')
  expect(deleteUserRes.status).toBe(401);
})

test('delete user admin', async () => {
  const { adminAuthToken } = await registerAdmin();
  const { diner } = await registerDiner();

  const deleteUserRes = await request(app)
    .delete(`/api/user/${diner.id}`)
    .set('Authorization', `Bearer ${adminAuthToken}`);

  expect(deleteUserRes.status).toBe(200);

  const loginRes = await request(app).put('/api/auth').send(diner);
  expect(loginRes.status).toBe(404);
})
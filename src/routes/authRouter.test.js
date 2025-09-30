const request = require('supertest');
const app = require('../service');

const testUser = { name: 'pizza diner', email: 'reg@test.com', password: 'a' };
let testUserAuthToken;

const loginUser = async () => {
  const loginRes = await request(app).put('/api/auth').send(testUser);
  expect(loginRes.status).toBe(200);

  return loginRes.body;
}

beforeAll(async () => {
    testUser.email = Math.random().toString(36).substring(2, 12) + '@test.com';
    const registerRes = await request(app).post('/api/auth').send(testUser);
    testUserAuthToken = registerRes.body.token;
    expectValidJwt(testUserAuthToken);
});

test('login', async () => {
    const responseBody = await loginUser(testUser);
    expectValidJwt(responseBody.token);

    const expectedUser = { ...testUser, roles: [{ role: 'diner' }] };
    delete expectedUser.password;
    expect(responseBody.user).toMatchObject(expectedUser);
});

test('logout', async () => {
  const loginBody = await loginUser(testUser);
  const logoutRes = await request(app).delete('/api/auth').set({Authorization: `Bearer ${loginBody.token}`}).send(testUser);
  expect(logoutRes.status).toBe(200);

  expect(logoutRes.body.message).toEqual('logout successful');
})


function expectValidJwt(potentialJwt) {
    expect(potentialJwt).toMatch(/^[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*$/);
}
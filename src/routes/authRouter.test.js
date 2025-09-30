const request = require('supertest');
const app = require('../service');
const { registerDiner } = require('../testing/testUtils');

let testUser = { name: 'pizza diner', email: 'reg@test.com', password: 'a' };
let testUserAuthToken;

beforeAll(async () => {
    const { diner, dinerAuthToken } = await registerDiner();
    testUserAuthToken = dinerAuthToken;
    testUser = diner;
    expectValidJwt(dinerAuthToken);
});

test('login', async () => {
    const response = await request(app).put('/api/auth').send(testUser);

    expect(response.status).toBe(200);
    expectValidJwt(response.body.token);

    const responseUser = response.body.user;

    const expectedUser = { ...testUser, roles: [{ role: 'diner' }] };
    delete expectedUser.password;
    expect(responseUser).toMatchObject(expectedUser);
});

test('logout', async () => {
  const logoutRes = await request(app).delete('/api/auth').set({Authorization: `Bearer ${testUserAuthToken}`}).send(testUser);
  expect(logoutRes.status).toBe(200);

  expect(logoutRes.body.message).toEqual('logout successful');
})


function expectValidJwt(potentialJwt) {
    expect(potentialJwt).toMatch(/^[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*$/);
}
const request = require('supertest');
const app = require('../service');
const {Role, DB} = require("../database/database");
const { registerAdmin, generateRandomString} = require('../testing/testUtils');

let testAuthToken;
let testAdmin;

beforeAll(async () => {
  const { admin, adminAuthToken } = await registerAdmin();
  testAuthToken = adminAuthToken;
  testAdmin = admin;
})

test('getMenu', async () => {
  const response = await request(app).get('/api/order/menu').set({ Authorization: `Bearer ${testAuthToken}` });
  expect(response.status).toBe(200);

  const result = response.body;

  expect(result).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        id: expect.any(Number),
        title: expect.any(String),
        image: expect.any(String),
        price: expect.any(Number),
        description: expect.any(String),
      })
    ])
  )
})

test('createMenuItem', async () => {
  const testMenuItem = {
    title: generateRandomString() + ' test item',
    image: 'pizza1.png',
    price: 0.01,
    description: 'a pizza for tests'
  }

  const response = await request(app).put('/api/order/menu')
    .set({ Authorization: `Bearer ${testAuthToken}` })
    .send(testMenuItem);

  expect(response.status).toBe(200);
  expect(response.body).toEqual(expect.arrayContaining([
    expect.objectContaining(testMenuItem)
  ])
  );
})
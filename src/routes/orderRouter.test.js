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

const createMenuItem = async () => {
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
  const responseBody = response.body;

  return { responseBody, testMenuItem };
}

test('getMenu', async () => {
  const { testMenuItem } = await createMenuItem();

  const response = await request(app).get('/api/order/menu').set({ Authorization: `Bearer ${testAuthToken}` });
  expect(response.status).toBe(200);

  const result = response.body;

  expect(result).toEqual(
    expect.arrayContaining([
      expect.objectContaining(testMenuItem)
    ])
  );
});

test('createMenuItem', async () => {
  const { responseBody, testMenuItem } = await createMenuItem()

  expect(responseBody).toEqual(
    expect.arrayContaining([
      expect.objectContaining(testMenuItem)
    ])
  );
});
const request = require('supertest');
const app = require('../service');
const {Role, DB} = require("../database/database");
const { registerAdmin, generateRandomString, createFranchise, createStore} = require('../testing/testUtils');

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

const createOrder = async (menuItems) => {
  const testFranchise = await createFranchise(testAdmin, testAuthToken);
  const testStore = await createStore(testFranchise, testAuthToken);
  let order = {
    franchiseId: testFranchise.id,
    storeId: testStore.id,
    items: menuItems
  }

  const response = await request(app).post('/api/order')
    .set({ Authorization: `Bearer ${testAuthToken}` })
    .send(order);

  expect(response.status).toBe(200);

  return response.body.order;
}

test('getMenu', async () => {
  const { testMenuItem } = await createMenuItem();

  const response = await request(app).get('/api/order/menu').set({ Authorization: `Bearer ${testAuthToken}` });
  expect(response.status).toBe(200);

  expect(response.body).toEqual(
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

test('createOrder', async () => {
  const { responseBody } = await createMenuItem();
  const testMenuItem = responseBody[0];
  testMenuItem.menuId = testMenuItem.id;

  const resultOrder = await createOrder([testMenuItem]);

  expect(resultOrder).toMatchObject({
    franchiseId: expect.any(Number),
    storeId: expect.any(Number),
    items: expect.arrayContaining([
      expect.objectContaining({
        id: expect.any(Number),
        menuId: expect.any(Number),
        title: expect.any(String),
        description: expect.any(String),
        image: expect.any(String),
        price: expect.any(Number),
      }),
    ]),
  });
})
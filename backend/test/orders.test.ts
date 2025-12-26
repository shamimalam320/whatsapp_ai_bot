import mongoose from 'mongoose';
import { startInMemoryMongo, stopInMemoryMongo, clearDatabase } from './setup';
import Product from '../src/models/Product';
import { createOrder, updateOrderStatus } from '../src/controllers/order.controller';

// mock whatsapp to avoid external calls
jest.mock('../src/services/whatsapp.service', () => ({ whatsappService: { sendMessage: jest.fn() } }));

beforeAll(async () => await startInMemoryMongo());
afterAll(async () => await stopInMemoryMongo());
beforeEach(async () => await clearDatabase());

function makeReq(body: any, user: any = {}) {
  return { body, user } as any;
}

function makeRes() {
  const r: any = {};
  r.status = (code: number) => { r._status = code; return r; };
  r.json = (payload: any) => { r._json = payload; return r; };
  return r;
}

test('createOrder reduces stock when enough available', async () => {
  const businessId = new mongoose.Types.ObjectId();
  const product = await Product.create({ businessId, name: 'test', price: 100, category: 'cat', description: 'd', stock: 10, inStock: true });

  const req = makeReq({ customerPhone: '+911234567890', items: [{ productId: product._id.toString(), quantity: 5 }] }, { businessId });
  const res = makeRes();

  await createOrder(req, res);

  expect(res._status).toBe(201);
  const created = res._json?.data;
  expect(created).toBeDefined();

  const pAfter = await Product.findById(product._id);
  expect(pAfter?.stock).toBe(5);
});

test('createOrder fails when quantity exceeds stock', async () => {
  const businessId = new mongoose.Types.ObjectId();
  const product = await Product.create({ businessId, name: 'test', price: 100, category: 'cat', description: 'd', stock: 10, inStock: true });

  const req = makeReq({ customerPhone: '+911234567891', items: [{ productId: product._id.toString(), quantity: 11 }] }, { businessId });
  const res = makeRes();

  await createOrder(req, res);

  expect(res._status).toBe(400);
  const pAfter = await Product.findById(product._id);
  expect(pAfter?.stock).toBe(10);
});

test('cancelling order restores stock', async () => {
  const businessId = new mongoose.Types.ObjectId();
  const product = await Product.create({ businessId, name: 'test', price: 100, category: 'cat', description: 'd', stock: 10, inStock: true });

  const createReq = makeReq({ customerPhone: '+911234567892', items: [{ productId: product._id.toString(), quantity: 3 }] }, { businessId });
  const createRes = makeRes();
  await createOrder(createReq, createRes);
  expect(createRes._status).toBe(201);
  const created = createRes._json.data;

  // cancel the order
  const cancelReq = { params: { id: created._id }, body: { status: 'cancelled' }, user: { businessId } } as any;
  const cancelRes = makeRes();
  await updateOrderStatus(cancelReq, cancelRes);

  expect(cancelRes._status).toBe(200);
  const pAfter = await Product.findById(product._id);
  expect(pAfter?.stock).toBe(10);
});

test('double cancelling does not double-restore stock', async () => {
  const businessId = new mongoose.Types.ObjectId();
  const product = await Product.create({ businessId, name: 'test', price: 100, category: 'cat', description: 'd', stock: 10, inStock: true });

  const createReq = makeReq({ customerPhone: '+911234567893', items: [{ productId: product._id.toString(), quantity: 3 }] }, { businessId });
  const createRes = makeRes();
  await createOrder(createReq, createRes);
  expect(createRes._status).toBe(201);
  const created = createRes._json.data;

  // cancel the order twice
  const cancelReq = { params: { id: created._id }, body: { status: 'cancelled' }, user: { businessId } } as any;
  const cancelRes1 = makeRes();
  await updateOrderStatus(cancelReq, cancelRes1);
  expect(cancelRes1._status).toBe(200);

  const cancelRes2 = makeRes();
  await updateOrderStatus(cancelReq, cancelRes2);
  expect(cancelRes2._status).toBe(200);

  const pAfter = await Product.findById(product._id);
  // stock should have been restored exactly once (back to 10)
  expect(pAfter?.stock).toBe(10);
});

test('concurrent orders do not oversell (one wins)', async () => {
  const businessId = new mongoose.Types.ObjectId();
  const product = await Product.create({ businessId, name: 'concurrent', price: 50, category: 'cat', description: 'd', stock: 10, inStock: true });

  // two parallel attempts for qty 6 each
  const req1 = makeReq({ customerPhone: '+911234500001', items: [{ productId: product._id.toString(), quantity: 6 }] }, { businessId });
  const req2 = makeReq({ customerPhone: '+911234500002', items: [{ productId: product._id.toString(), quantity: 6 }] }, { businessId });
  const res1 = makeRes();
  const res2 = makeRes();

  // Run in parallel
  await Promise.all([createOrder(req1, res1), createOrder(req2, res2)]);

  const pAfter = await Product.findById(product._id);
  // stock should not be negative; should be either 4 if one succeeded or 10 if both failed
  expect(pAfter!.stock).toBeGreaterThanOrEqual(0);
  expect(pAfter!.stock).toBeLessThanOrEqual(10);
  // At most one request should succeed (so at least one of the two fails)
  const successCount = [res1, res2].filter((r)=>r._status === 201).length;
  expect(successCount).toBeLessThanOrEqual(1);
});

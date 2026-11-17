jest.mock('../src/config/database', () => ({ promisePool: { query: jest.fn() } }));
jest.mock('../src/models/Lead.model', () => ({
  LEAD_STATUSES: ['New', 'Contacted', 'Interested', 'Not Interested', 'Converted'],
  getById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
}));

const Lead = require('../src/models/Lead.model');
const { LeadController } = require('../src/controllers/lead.controller');

const run = async (method, { params = {}, body = {} } = {}) => {
  const res = { statusCode: 200, body: null };
  res.status = jest.fn((code) => { res.statusCode = code; return res; });
  res.json = jest.fn((payload) => { res.body = payload; return res; });
  const next = jest.fn();
  await LeadController[method]({ params, body, user: { id: 1 } }, res, next);
  return { res, next };
};

const lead = (over = {}) => ({ id: 7, name: 'Abhilasha Caterers', status: 'Interested', customerId: null, ...over });

beforeEach(() => jest.clearAllMocks());

describe('a lead becomes Converted only through Convert to Customer', () => {
  test('choosing Converted by hand on an unconverted lead is rejected and nothing is saved', async () => {
    Lead.getById.mockResolvedValue(lead());
    const { res } = await run('update', { params: { id: 7 }, body: { status: 'Converted' } });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/Convert to Customer/);
    expect(Lead.update).not.toHaveBeenCalled();
  });

  test('creating a lead with status Converted is rejected', async () => {
    const { res } = await run('create', { body: { name: 'X', status: 'Converted' } });
    expect(res.statusCode).toBe(400);
    expect(Lead.create).not.toHaveBeenCalled();
  });

  test.each(['New', 'Contacted', 'Interested', 'Not Interested'])(
    'an unconverted lead can still be moved to %s',
    async (status) => {
      Lead.getById.mockResolvedValue(lead());
      Lead.update.mockResolvedValue(true);
      const { res } = await run('update', { params: { id: 7 }, body: { status } });
      expect(res.statusCode).toBe(200);
      expect(Lead.update).toHaveBeenCalledWith(7, { status });
    }
  );

  test('a converted lead (linked customer) cannot be moved off Converted', async () => {
    Lead.getById.mockResolvedValue(lead({ status: 'Converted', customerId: 42 }));
    const { res } = await run('update', { params: { id: 7 }, body: { status: 'Interested' } });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/already a customer/);
    expect(Lead.update).not.toHaveBeenCalled();
  });

  test('editing other fields of a converted lead still works', async () => {
    Lead.update.mockResolvedValue(true);
    Lead.getById.mockResolvedValue(lead({ status: 'Converted', customerId: 42 }));
    const { res } = await run('update', { params: { id: 7 }, body: { notes: 'called back' } });
    expect(res.statusCode).toBe(200);
    expect(Lead.update).toHaveBeenCalled();
  });

  test('an older lead marked Converted by hand can be re-saved unchanged (edit form sends status)', async () => {
    Lead.getById.mockResolvedValue(lead({ status: 'Converted', customerId: null }));
    Lead.update.mockResolvedValue(true);
    const { res } = await run('update', { params: { id: 7 }, body: { status: 'Converted', notes: 'x' } });
    expect(res.statusCode).toBe(200);
  });

  test('a status change on a missing lead is 404', async () => {
    Lead.getById.mockResolvedValue(undefined);
    const { res } = await run('update', { params: { id: 999 }, body: { status: 'Contacted' } });
    expect(res.statusCode).toBe(404);
  });
});

const { describe, it, expect } = require('vitest');
const leaveService = require('../src/services/leaveService');
const Employee = require('../src/models/Employee');
const { seedEmployee } = require('./helpers');

const FULL = { annual: 5, sick: 12, casual: 6, compensatory: 0 };

describe('Leave correctness & concurrency (BUG-1 / PERF-5/6)', () => {
  it('validates a multi-day leave against the real span, not the default of 1', async () => {
    const { user, emp } = await seedEmployee({ leaveBalance: { ...FULL, annual: 2 } });
    await expect(
      leaveService.applyLeave(user, { leaveType: 'annual', startDate: '2026-09-01', endDate: '2026-09-05', reason: 'trip' })
    ).rejects.toMatchObject({ code: 'VALIDATION_ERROR' });
    const fresh = await Employee.findById(emp._id);
    expect(fresh.leaveBalance.annual).toBe(2);
  });

  it('reserves balance atomically and never goes negative under concurrent applies', async () => {
    const { user, emp } = await seedEmployee({ leaveBalance: { ...FULL, annual: 3 } });
    const applies = Array.from({ length: 10 }, (_, i) => {
      const day = String(i * 2 + 1).padStart(2, '0');
      return leaveService
        .applyLeave(user, { leaveType: 'annual', startDate: `2026-09-${day}`, endDate: `2026-09-${day}`, reason: 'x' })
        .then(() => 'ok')
        .catch(() => 'fail');
    });
    const results = await Promise.all(applies);
    const ok = results.filter((r) => r === 'ok').length;
    const fresh = await Employee.findById(emp._id);
    expect(fresh.leaveBalance.annual).toBeGreaterThanOrEqual(0);
    expect(ok).toBe(3);
    expect(fresh.leaveBalance.annual).toBe(0);
  });

  it('rejects overlapping leave requests', async () => {
    const { user } = await seedEmployee({ leaveBalance: FULL });
    await leaveService.applyLeave(user, { leaveType: 'annual', startDate: '2026-10-01', endDate: '2026-10-03', reason: 'a' });
    await expect(
      leaveService.applyLeave(user, { leaveType: 'annual', startDate: '2026-10-02', endDate: '2026-10-04', reason: 'b' })
    ).rejects.toMatchObject({ code: 'CONFLICT' });
  });

  it('restores the reserved balance exactly once on cancel', async () => {
    const { user, emp } = await seedEmployee({ leaveBalance: FULL });
    const { leave } = await leaveService.applyLeave(user, { leaveType: 'annual', startDate: '2026-11-01', endDate: '2026-11-02', reason: 'x' });
    let fresh = await Employee.findById(emp._id);
    expect(fresh.leaveBalance.annual).toBe(3); // 5 - 2
    await leaveService.cancelLeave(user, leave._id);
    fresh = await Employee.findById(emp._id);
    expect(fresh.leaveBalance.annual).toBe(5);
    await expect(leaveService.cancelLeave(user, leave._id)).rejects.toBeDefined();
    fresh = await Employee.findById(emp._id);
    expect(fresh.leaveBalance.annual).toBe(5); // not double-restored
  });

  it('approval does not alter the reserved balance', async () => {
    const approver = await seedEmployee({ role: 'hr' });
    const { user, emp } = await seedEmployee({ leaveBalance: FULL });
    const { leave } = await leaveService.applyLeave(user, { leaveType: 'sick', startDate: '2026-12-01', endDate: '2026-12-01', reason: 'x' });
    await leaveService.changeStatus(approver.user, leave._id, 'approved');
    const fresh = await Employee.findById(emp._id);
    expect(fresh.leaveBalance.sick).toBe(11); // reserved at apply, unchanged by approve
  });
});

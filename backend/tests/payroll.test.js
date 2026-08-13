const mongoose = require('mongoose');
const { describe, it, expect } = require('vitest');
const { calculatePayroll, computeTds, computeProfessionalTax } = require('../src/services/payrollService');

const emp = (salary) => ({ _id: new mongoose.Types.ObjectId(), salary });

describe('Payroll math (PAYROLL)', () => {
  it('computes ESI on gross earnings when within the ceiling', () => {
    const p = calculatePayroll(emp({ basic: 10000 }), 6, 2026, { holidays: 4 });
    expect(p.deductions.esi).toBeGreaterThan(0);
    expect(p.netSalary).toBeGreaterThanOrEqual(0);
  });

  it('applies no ESI above the gross ceiling', () => {
    const p = calculatePayroll(emp({ basic: 30000, hra: 5000 }), 6, 2026, { holidays: 0 });
    expect(p.deductions.esi).toBe(0);
  });

  it('applies professional-tax tiers correctly', () => {
    expect(computeProfessionalTax(8000)).toBe(0);
    expect(computeProfessionalTax(12000)).toBe(150);
    expect(computeProfessionalTax(20000)).toBe(200);
  });

  it('computes TDS as zero below the first slab and positive above', () => {
    expect(computeTds(10000)).toBe(0); // annualized 120k <= 300k
    expect(computeTds(100000)).toBeGreaterThan(0); // annualized 1.2M
  });

  it('never returns a negative net salary', () => {
    const p = calculatePayroll(emp({ basic: 1 }), 6, 2026, { holidays: 0 });
    expect(p.netSalary).toBeGreaterThanOrEqual(0);
  });
});

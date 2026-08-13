/**
 * Externalized payroll statutory rates and ceilings (PAYROLL).
 *
 * All values are overridable via PAYROLL_* environment variables so Finance can
 * tune them per jurisdiction without a code change.
 *
 * NOTE: the TDS slabs below are PLACEHOLDERS pending authoritative sign-off from
 * the Finance / Payroll SME (see SCRUM-80 Open Questions). They are structured so
 * only the numbers need to change once confirmed.
 */
const num = (value, fallback) => {
  const n = parseFloat(value);
  return Number.isFinite(n) ? n : fallback;
};

module.exports = {
  // Provident Fund: 12% of basic.
  pf: { rate: num(process.env.PAYROLL_PF_RATE, 0.12) },

  // Employee State Insurance: 0.75% of gross earnings, only up to the ceiling.
  esi: {
    rate: num(process.env.PAYROLL_ESI_RATE, 0.0075),
    grossCeiling: num(process.env.PAYROLL_ESI_CEILING, 21000),
  },

  // Professional Tax: monthly slabs on basic salary.
  professionalTax: {
    tiers: [
      { upTo: num(process.env.PAYROLL_PT_TIER1_UPTO, 10000), amount: num(process.env.PAYROLL_PT_TIER1_AMT, 0) },
      { upTo: num(process.env.PAYROLL_PT_TIER2_UPTO, 15000), amount: num(process.env.PAYROLL_PT_TIER2_AMT, 150) },
      { upTo: Infinity, amount: num(process.env.PAYROLL_PT_TIER3_AMT, 200) },
    ],
  },

  overtime: {
    multiplier: num(process.env.PAYROLL_OT_MULTIPLIER, 1.5),
    hoursPerDay: num(process.env.PAYROLL_OT_HOURS_PER_DAY, 8),
  },

  // TDS annual slabs (PLACEHOLDER — pending Finance sign-off).
  tds: {
    annualSlabs: [
      { upTo: 300000, rate: 0 },
      { upTo: 600000, rate: 0.05 },
      { upTo: 900000, rate: 0.1 },
      { upTo: 1200000, rate: 0.15 },
      { upTo: 1500000, rate: 0.2 },
      { upTo: Infinity, rate: 0.3 },
    ],
  },
};

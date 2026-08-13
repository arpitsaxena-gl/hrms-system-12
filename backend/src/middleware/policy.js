/**
 * Object-level authorization helpers (SEC-3, SEC-4).
 *
 * Centralizes "who may do what to whom" using the ROLES constant — never role
 * string literals — so controllers stay declarative and consistent.
 */
const { ROLES } = require('../config/constants');
const Employee = require('../models/Employee');

const PRIVILEGED = [ROLES.ADMIN, ROLES.HR];

/**
 * Can `actor` assign `targetRole` on create/update?
 * - admin may assign any role
 * - hr may assign only non-privileged roles (manager, employee)
 * - everyone else may not assign roles at all
 * Returns true when no role change is requested.
 */
function canAssignRole(actor, targetRole) {
  if (!targetRole) return true;
  if (actor.role === ROLES.ADMIN) return true;
  if (actor.role === ROLES.HR) return [ROLES.MANAGER, ROLES.EMPLOYEE].includes(targetRole);
  return false;
}

const idStr = (v) => (v && v._id ? v._id : v) && String(v && v._id ? v._id : v);

/**
 * May `actor` read this employee record?
 * - admin/hr: any
 * - self: the actor's own employee record
 * - manager: a direct report (employeeDoc.manager === actor's employee)
 */
async function canReadEmployee(actor, employeeDoc) {
  if (!employeeDoc) return false;
  if (PRIVILEGED.includes(actor.role)) return true;

  const actorEmpId = idStr(actor.employee);
  const targetId = idStr(employeeDoc);
  const targetUserId = idStr(employeeDoc.user);

  if (actorEmpId && actorEmpId === targetId) return true;
  if (targetUserId && targetUserId === String(actor._id)) return true;

  if (actor.role === ROLES.MANAGER && actorEmpId) {
    const mgr = idStr(employeeDoc.manager);
    if (mgr && mgr === actorEmpId) return true;
  }
  return false;
}

/**
 * Build a Mongo filter fragment ({ employee: ... }) that scopes list queries
 * (leaves, payroll) to what the actor is entitled to see:
 * - admin/hr: everything ({})
 * - manager: own record + direct reports
 * - employee: own record only
 * Where the `manager` relationship is absent, non-privileged users fall back to
 * self-only visibility.
 */
async function employeeScopeFilter(actor) {
  if (PRIVILEGED.includes(actor.role)) return {};

  const self = await Employee.findOne({ user: actor._id }).select('_id');
  if (!self) return { employee: { $in: [] } };

  if (actor.role === ROLES.MANAGER) {
    const reports = await Employee.find({ manager: self._id }).select('_id');
    const ids = reports.map((r) => r._id);
    ids.push(self._id);
    return { employee: { $in: ids } };
  }
  return { employee: self._id };
}

module.exports = { canAssignRole, canReadEmployee, employeeScopeFilter, PRIVILEGED };

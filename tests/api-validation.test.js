import assert from 'node:assert/strict';
import test from 'node:test';

import {
  validateAdminCreate,
  validateAdminUpdate,
  validateMember,
  validateSettings,
  validateTransaction,
} from '../src/lib/api-validation.js';

function expectValidationError(callback, message) {
  assert.throws(callback, (error) => error?.status === 400 && error.message === message);
}

test('member validation keeps only supported fields', () => {
  assert.deepEqual(validateMember({
    memberId: ' M001 ',
    name: ' Member One ',
    email: 'member@example.com',
    role: 'admin',
  }), {
    memberId: 'M001',
    name: 'Member One',
    email: 'member@example.com',
  });
});

test('member validation rejects invalid email and empty partial updates', () => {
  expectValidationError(
    () => validateMember({ memberId: 'M001', name: 'Member', email: 'invalid' }),
    'email is invalid',
  );
  expectValidationError(() => validateMember({ role: 'admin' }, { partial: true }), 'No supported fields were provided');
});

test('transaction validation accepts exactly one positive amount', () => {
  assert.deepEqual(validateTransaction({
    txId: 'TX-1',
    memberName: 'Member One',
    income: 500,
    expense: 0,
    note: 'Contribution',
    slipUrl: 'data:image/png;base64,AA==',
  }), {
    txId: 'TX-1',
    memberName: 'Member One',
    income: 500,
    expense: 0,
    note: 'Contribution',
    slipUrl: 'data:image/png;base64,AA==',
  });
});

test('transaction validation rejects ambiguous amounts', () => {
  const base = { txId: 'TX-1', memberName: 'Member', note: '', slipUrl: 'data:image/png;base64,AA==' };
  expectValidationError(
    () => validateTransaction({ ...base, income: 0, expense: 0 }),
    'Exactly one of income or expense must be greater than zero',
  );
  expectValidationError(
    () => validateTransaction({ ...base, income: 100, expense: 50 }),
    'Exactly one of income or expense must be greater than zero',
  );
});

test('settings and admin validation reject unsupported or weak input', () => {
  expectValidationError(() => validateSettings({ unsupported: true }), 'No supported fields were provided');
  expectValidationError(
    () => validateAdminCreate({ email: 'admin@example.com', password: 'short' }),
    'password must contain at least 8 characters',
  );
  expectValidationError(() => validateAdminUpdate({ email: 'ignored@example.com' }), 'No supported fields were provided');
});

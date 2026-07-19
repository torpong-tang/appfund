import { ApiError } from './api-error.js';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_IMAGE_DATA_LENGTH = 3 * 1024 * 1024;

function text(body, key, { required = false, max = 255, trim = true } = {}) {
  const value = body[key];
  if (value === undefined) {
    if (required) throw new ApiError(400, `${key} is required`);
    return undefined;
  }
  if (typeof value !== 'string') throw new ApiError(400, `${key} must be text`);
  const normalized = trim ? value.trim() : value;
  if (required && !normalized) throw new ApiError(400, `${key} is required`);
  if (normalized.length > max) throw new ApiError(400, `${key} is too long`);
  return normalized;
}

function number(body, key, { required = false, min = 0 } = {}) {
  const value = body[key];
  if (value === undefined || value === '') {
    if (required) throw new ApiError(400, `${key} is required`);
    return undefined;
  }
  const normalized = Number(value);
  if (!Number.isFinite(normalized) || normalized < min) {
    throw new ApiError(400, `${key} must be a number greater than or equal to ${min}`);
  }
  return normalized;
}

function boolean(body, key) {
  const value = body[key];
  if (value === undefined) return undefined;
  if (typeof value !== 'boolean') throw new ApiError(400, `${key} must be true or false`);
  return value;
}

function assignDefined(target, key, value) {
  if (value !== undefined) target[key] = value;
}

export function validateMember(body, { partial = false } = {}) {
  const data = {};
  assignDefined(data, 'memberId', text(body, 'memberId', { required: !partial, max: 50 }));
  assignDefined(data, 'name', text(body, 'name', { required: !partial, max: 200 }));
  assignDefined(data, 'email', text(body, 'email', { required: !partial, max: 254 }));
  assignDefined(data, 'phone', text(body, 'phone', { max: 50 }));
  assignDefined(data, 'address', text(body, 'address', { max: 1000 }));
  assignDefined(data, 'avatar', text(body, 'avatar', { max: MAX_IMAGE_DATA_LENGTH, trim: false }));
  assignDefined(data, 'canSpend', boolean(body, 'canSpend'));

  if (data.email && !EMAIL_PATTERN.test(data.email)) {
    throw new ApiError(400, 'email is invalid');
  }
  if (partial && Object.keys(data).length === 0) {
    throw new ApiError(400, 'No supported fields were provided');
  }
  return data;
}

export function validateTransaction(body) {
  const income = number(body, 'income', { required: true, min: 0 });
  const expense = number(body, 'expense', { required: true, min: 0 });
  if ((income > 0) === (expense > 0)) {
    throw new ApiError(400, 'Exactly one of income or expense must be greater than zero');
  }

  return {
    txId: text(body, 'txId', { required: true, max: 64 }),
    memberName: text(body, 'memberName', { required: true, max: 200 }),
    income,
    expense,
    note: text(body, 'note', { max: 1000 }) ?? '',
    slipUrl: text(body, 'slipUrl', { required: true, max: MAX_IMAGE_DATA_LENGTH, trim: false }),
  };
}

export function validateSettings(body) {
  const data = {};
  assignDefined(data, 'title', text(body, 'title', { max: 200 }));
  assignDefined(data, 'subtitle', text(body, 'subtitle', { max: 500 }));
  assignDefined(data, 'bankName', text(body, 'bankName', { max: 200 }));
  assignDefined(data, 'accountNumber', text(body, 'accountNumber', { max: 100 }));
  assignDefined(data, 'incomeTarget', number(body, 'incomeTarget', { min: 0 }));
  if (Object.keys(data).length === 0) throw new ApiError(400, 'No supported fields were provided');
  return data;
}

export function validateAdminCreate(body) {
  const email = text(body, 'email', { required: true, max: 254 }).toLowerCase();
  if (!EMAIL_PATTERN.test(email)) throw new ApiError(400, 'email is invalid');
  const password = text(body, 'password', { required: true, max: 256, trim: false });
  if (password.length < 8) throw new ApiError(400, 'password must contain at least 8 characters');
  return {
    email,
    name: text(body, 'name', { max: 200 }) ?? '',
    password,
  };
}

export function validateAdminUpdate(body) {
  const data = {};
  assignDefined(data, 'name', text(body, 'name', { max: 200 }));
  const password = text(body, 'password', { max: 256, trim: false });
  if (password !== undefined) {
    if (password.length < 8) throw new ApiError(400, 'password must contain at least 8 characters');
    data.password = password;
  }
  if (Object.keys(data).length === 0) throw new ApiError(400, 'No supported fields were provided');
  return data;
}

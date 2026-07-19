import { NextResponse } from 'next/server';
import { getSessionUser } from './auth';
import { ApiError } from './api-error.js';

export { ApiError } from './api-error.js';

export function requireSession(request) {
  const session = getSessionUser(request);
  if (!session) throw new ApiError(401, 'unauthenticated');
  return session;
}

export async function readJsonObject(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    throw new ApiError(400, 'Invalid JSON body');
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new ApiError(400, 'Request body must be a JSON object');
  }
  return body;
}

export function parseId(value) {
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new ApiError(400, 'Invalid record ID');
  }
  return id;
}

export function apiErrorResponse(error, context = 'API request') {
  if (error instanceof ApiError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  if (error?.code === 'P2002') {
    return NextResponse.json({ error: 'A record with this unique value already exists' }, { status: 409 });
  }
  if (error?.code === 'P2025') {
    return NextResponse.json({ error: 'Record not found' }, { status: 404 });
  }
  if (error?.code === 'P2003') {
    return NextResponse.json({ error: 'This record is still referenced by other data' }, { status: 409 });
  }

  console.error(`${context} failed`, error);
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
}

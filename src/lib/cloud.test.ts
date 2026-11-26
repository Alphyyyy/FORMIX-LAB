import { isStaleAuthError, mapCloudCatalog, mapCloudSession } from './cloud';

test('maps a cloud session into the local domain model', () => {
  const session = mapCloudSession({
    id: 'session-1',
    user_id: 'user-1',
    code: 'FX-ABC234',
    started_at: '2026-11-26T10:00:00.000Z',
    completed_at: '2026-11-26T10:03:00.000Z',
    state: 'completed',
    consent_version: '2026-11-demo-v1',
    foam_done: true,
    shape_id: 'shape-patita',
    color_id: 'color-rosa',
    scent_id: 'scent-fresa',
    purchase_intent: true,
    gift_intent: false,
    games: {
      bacteria: {
        gameType: 'bacteria',
        result: 'WIN',
        validatedAt: '2026-11-26T10:04:00.000Z',
        operatorInitials: 'OP',
      },
    },
    reward: {
      type: 'photo',
      issuedAt: '2026-11-26T10:05:00.000Z',
      redeemedAt: null,
      redeemedBy: null,
    },
  });

  expect(session.id).toBe('session-1');
  expect(session.state).toBe('completed');
  expect(session.code).toBe('FX-ABC234');
  expect(session.preferences).toMatchObject({
    shapeId: 'shape-patita',
    colorId: 'color-rosa',
    scentId: 'scent-fresa',
    purchaseIntent: true,
    giftIntent: false,
  });
  expect(session.games.bacteria).toMatchObject({ result: 'WIN', operatorInitials: 'OP' });
  expect(session.reward?.type).toBe('photo');
  expect(session.isSeed).toBe(false);
});

test('maps cloud catalog rows into catalog items', () => {
  const item = mapCloudCatalog({
    id: 'shape-patita',
    type: 'shape',
    name: 'Patita',
    notes: 'Una huella suave.',
    status: 'available',
    sort_order: 1,
    swatch: null,
    swatch_dark: null,
    created_at: '2026-11-26T10:00:00.000Z',
  });
  expect(item).toMatchObject({
    id: 'shape-patita',
    type: 'shape',
    name: 'Patita',
    status: 'available',
    sortOrder: 1,
    createdAt: '2026-11-26T10:00:00.000Z',
  });
});

test('detects a session owned by a deleted anonymous user', () => {
  expect(
    isStaleAuthError({
      code: '23503',
      message:
        'insert or update on table "sessions" violates foreign key constraint "sessions_user_id_fkey"',
    }),
  ).toBe(true);
  expect(isStaleAuthError({ message: 'not_authenticated' })).toBe(true);
  expect(isStaleAuthError({ code: '23505', message: 'duplicate key' })).toBe(false);
});

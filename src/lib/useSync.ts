/**
 * Firebase Realtime DB sync hook.
 * Each key in the trip room syncs independently (last-write-wins per key).
 * Falls back to localStorage-only when Firebase is not configured.
 */
import { useEffect, useRef, useCallback, useState } from 'react';
import { ref, onValue, set, off, serverTimestamp, update } from 'firebase/database';
import { db, isFirebaseConfigured } from './firebase';

export type SyncStatus = 'offline' | 'connecting' | 'synced' | 'syncing' | 'error';

// ─── Global sync context (tripCode + author shared across all hooks) ──────────
let _tripCode: string | null = null;
let _author = 'Viajero';
const _statusListeners: Set<(s: SyncStatus) => void> = new Set();
let _currentStatus: SyncStatus = isFirebaseConfigured ? 'connecting' : 'offline';

export function setTripCode(code: string | null) { _tripCode = code; }
export function setAuthor(name: string) { _author = name; }
export function getTripCode() { return _tripCode; }
export function getAuthor() { return _author; }

function emitStatus(s: SyncStatus) {
  _currentStatus = s;
  _statusListeners.forEach(fn => fn(s));
}

export function useSyncStatus() {
  const [status, setStatus] = useState<SyncStatus>(_currentStatus);
  useEffect(() => {
    _statusListeners.add(setStatus);
    return () => { _statusListeners.delete(setStatus); };
  }, []);
  return status;
}

/**
 * Wraps a piece of state so it syncs bidirectionally with Firebase
 * when a tripCode is active.
 */
export function useSyncedKey<T>(
  key: string,
  _localState: T,
  setLocal: (v: T | ((prev: T) => T)) => void,
): (value: T) => void {
  const suppressRef = useRef<string | null>(null);   // prevents echo
  const tripCodeRef = useRef(_tripCode);

  // Keep tripCode ref fresh (avoids stale closure in listener)
  useEffect(() => { tripCodeRef.current = _tripCode; });

  // Subscribe to Firebase path
  useEffect(() => {
    if (!db || !_tripCode) return;
    tripCodeRef.current = _tripCode;
    const path = `/trips/${_tripCode}/${key}`;
    const dbRef = ref(db, path);
    emitStatus('connecting');

    const unsub = onValue(dbRef, (snapshot) => {
      const remote = snapshot.val();
      if (remote === null) { emitStatus('synced'); return; }

      const serialized = JSON.stringify(remote);
      if (serialized === suppressRef.current) { emitStatus('synced'); return; }
      suppressRef.current = null;
      setLocal(remote);
      emitStatus('synced');
    }, () => emitStatus('error'));

    return () => off(dbRef, 'value', unsub as never);
  }, [key, setLocal, _tripCode]); // eslint-disable-line react-hooks/exhaustive-deps

  const push = useCallback((value: T) => {
    if (!db || !_tripCode) return;
    emitStatus('syncing');
    const serialized = JSON.stringify(value);
    suppressRef.current = serialized;
    const path = `/trips/${_tripCode}/${key}`;
    set(ref(db, path), value)
      .then(() => emitStatus('synced'))
      .catch(() => emitStatus('error'));
  }, [key]);

  return push;
}

/** Touch the trip metadata (lastEditedBy, lastEditedAt) */
export function touchTripMeta() {
  if (!db || !_tripCode) return;
  update(ref(db, `/trips/${_tripCode}/_meta`), {
    lastEditedBy: _author,
    lastEditedAt: serverTimestamp(),
  });
}

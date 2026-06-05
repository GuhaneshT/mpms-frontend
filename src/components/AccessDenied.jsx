import { ShieldAlert } from 'lucide-react';

import { formatPermission } from '../auth/permissions';

export default function AccessDenied({ permission }) {
  return (
    <div className="card" style={{ maxWidth: '720px', margin: '2rem auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
        <div
          style={{
            width: '3rem',
            height: '3rem',
            borderRadius: '999px',
            background: 'rgba(220, 38, 38, 0.12)',
            color: 'var(--error)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ShieldAlert size={20} />
        </div>
        <div>
          <h1 className="card-title" style={{ marginBottom: '0.25rem' }}>Access denied</h1>
          <p className="form-label" style={{ marginBottom: 0 }}>
            Your current role does not include this capability.
          </p>
        </div>
      </div>

      {permission ? (
        <div
          style={{
            fontSize: '0.875rem',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius)',
            background: 'var(--surface-hover)',
            color: 'var(--text-muted)',
          }}
        >
          Required permission: <strong>{formatPermission(permission)}</strong>
        </div>
      ) : null}
    </div>
  );
}

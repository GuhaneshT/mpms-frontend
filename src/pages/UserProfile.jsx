import { Mail, Shield, Smartphone, User } from 'lucide-react';

import { formatPermission, formatRole } from '../auth/permissions';
import { useAuth } from '../context/AuthContext';

export default function UserProfile() {
  const { profile, displayName, role, permissions, isDemoMode } = useAuth();

  if (!profile) {
    return <div className="page-content">Loading profile...</div>;
  }

  return (
    <div className="page-content">
      <div className="page-header">
        <h1 className="page-title">User Account</h1>
      </div>

      <div className="card" style={{ maxWidth: '720px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              background: 'var(--primary)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
            }}
          >
            <User size={32} />
          </div>
          <div>
            <h2 className="card-title" style={{ marginBottom: '0.25rem' }}>
              {displayName}
            </h2>
            <p className="form-label" style={{ marginBottom: 0 }}>{profile.email}</p>
          </div>
        </div>

        <hr style={{ border: 'none', height: '1px', background: 'var(--border)', margin: '1.5rem 0' }} />

        <div style={{ display: 'grid', gap: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Mail size={18} className="text-muted" />
            <div>
              <p className="form-label">Email Address</p>
              <p style={{ fontSize: '0.875rem' }}>{profile.email}</p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Shield size={18} className="text-muted" />
            <div>
              <p className="form-label">Role</p>
              <p style={{ fontSize: '0.875rem' }}>{formatRole(role)}</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                Source: {profile.role_source || 'default'}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Smartphone size={18} className="text-muted" />
            <div>
              <p className="form-label">User ID</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <p style={{ fontSize: '0.875rem', fontFamily: 'monospace', margin: 0 }}>{profile.sub}</p>
                <button
                  className="btn btn-sm btn-outline"
                  style={{ padding: '0.2rem 0.4rem', fontSize: '0.7rem' }}
                  onClick={() => {
                    navigator.clipboard.writeText(profile.sub);
                    alert('Copied to clipboard!');
                  }}
                >
                  Copy
                </button>
              </div>
            </div>
          </div>
        </div>

        <div style={{ marginTop: '2rem' }}>
          <p className="form-label" style={{ marginBottom: '0.75rem' }}>Permissions</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {permissions.map((permission) => (
              <span
                key={permission}
                style={{
                  fontSize: '0.75rem',
                  padding: '0.3rem 0.6rem',
                  borderRadius: '999px',
                  background: 'var(--surface-hover)',
                  color: 'var(--text-main)',
                  border: '1px solid var(--border)',
                }}
              >
                {formatPermission(permission)}
              </span>
            ))}
          </div>
        </div>

        {isDemoMode ? (
          <div
            style={{
              marginTop: '2rem',
              padding: '0.9rem 1rem',
              borderRadius: 'var(--radius)',
              background: 'rgba(59, 130, 246, 0.08)',
              color: 'var(--text-muted)',
              fontSize: '0.875rem',
            }}
          >
            Demo mode is active because Supabase environment variables are not configured.
          </div>
        ) : null}
      </div>
    </div>
  );
}

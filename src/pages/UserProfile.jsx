import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { User, Mail, Shield, Smartphone } from 'lucide-react';

export default function UserProfile() {
  const { user: authUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/users/me');
      setProfile(res.data);
    } catch (err) {
      console.error("Error fetching profile:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="page-content">Loading profile...</div>;

  return (
    <div className="page-content">
      <div className="page-header">
        <h1 className="page-title">User Account</h1>
      </div>

      <div className="card" style={{ maxWidth: '600px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem' }}>
          <div style={{ 
            width: '64px', 
            height: '64px', 
            background: 'var(--primary)', 
            borderRadius: '50%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: 'white'
          }}>
            <User size={32} />
          </div>
          <div>
            <h2 className="card-title" style={{ marginBottom: '0.25rem' }}>
              {profile?.user_metadata?.full_name || 'System User'}
            </h2>
            <p className="form-label" style={{ marginBottom: 0 }}>{profile?.email}</p>
          </div>
        </div>

        <hr style={{ border: 'none', height: '1px', background: 'var(--border)', margin: '1.5rem 0' }} />

        <div style={{ display: 'grid', gap: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Mail size={18} className="text-muted" />
            <div>
              <p className="form-label">Email Address</p>
              <p style={{ fontSize: '0.875rem' }}>{profile?.email}</p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Shield size={18} className="text-muted" />
            <div>
              <p className="form-label">Role</p>
              <p style={{ fontSize: '0.875rem' }}>{profile?.role || 'Administrator'}</p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Smartphone size={18} className="text-muted" />
            <div>
              <p className="form-label">Technician ID (UUID)</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                 <p style={{ fontSize: '0.875rem', fontFamily: 'monospace', margin: 0 }}>{profile?.sub}</p>
                 <button 
                   className="btn btn-sm btn-outline" 
                   style={{ padding: '0.2rem 0.4rem', fontSize: '0.7rem' }}
                   onClick={() => {
                     navigator.clipboard.writeText(profile?.sub);
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
            <button className="btn btn-outline" style={{ width: '100%' }} onClick={() => alert("Profile editing coming soon!")}>
              Edit User Details
            </button>
        </div>
      </div>
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import ReliabilityChart from '../components/ReliabilityChart';

export default function Dashboard() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState({
    open_service_calls_count: 0,
    machines_under_warranty_count: 0,
    machines_nearing_warranty_expiry_count: 0,
    machines_under_maintenance_count: 0
  });
  const [reliabilityData, setReliabilityData] = useState([]);

  useEffect(() => {
    // Fetch summary metrics
    api.get('/dashboard/summary')
      .then(res => setMetrics(res.data))
      .catch(err => console.error("Error fetching dashboard metrics:", err));

    // Fetch reliability data
    api.get('/dashboard/reliability')
      .then(res => setReliabilityData(res.data.stats))
      .catch(err => console.error("Error fetching reliability data:", err));
  }, []);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Dashboard Overview</h1>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        <div className="card">
          <h2 className="card-title">Welcome back, {user?.email?.split('@')[0] || 'User'}</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Your operational hub for knitting machinery lifecycle and service records.
          </p>
        </div>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
             <div>
                <p className="form-label" style={{ marginBottom: '0.25rem' }}>Open Calls</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--error)' }}>{metrics.open_service_calls_count}</p>
             </div>
             <div style={{ borderLeft: '1px solid var(--border)', paddingLeft: '1.5rem' }}>
                <p className="form-label" style={{ marginBottom: '0.25rem' }}>In Warranty</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--success)' }}>{metrics.machines_under_warranty_count}</p>
             </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        <div className="card">
          <h3 className="card-title">Machine Reliability (Failure Trends)</h3>
          <p className="form-label" style={{ marginBottom: '1.5rem' }}>Number of open/in-progress service calls aggregated by machine model.</p>
          <ReliabilityChart data={reliabilityData} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card">
             <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: '500' }}>Near Warranty Expiry</div>
             <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--warning)', marginTop: '0.5rem' }}>{metrics.machines_nearing_warranty_expiry_count}</div>
          </div>
          <div className="card">
             <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: '500' }}>Machines in Maintenance</div>
             <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--primary)', marginTop: '0.5rem' }}>{metrics.machines_under_maintenance_count}</div>
          </div>
          <div className="card" style={{ background: 'var(--primary)', color: 'white' }}>
             <h4 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Quick Actions</h4>
             <button className="btn" style={{ width: '100%', background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none' }} onClick={() => window.location.href='/service-calls'}>
               Log Service Call
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { ArrowLeft, CheckCircle, Circle } from 'lucide-react';

const STEPS = [
  { id: 'order_received', label: 'Order Received' },
  { id: 'production_chart', label: 'Production Chart' },
  { id: 'ancillary_prep', label: 'Ancillary Prep' },
  { id: 'site_verification', label: 'Site Verification' },
  { id: 'in_transit', label: 'In Transit' },
  { id: 'material_verified', label: 'Material Verified' },
  { id: 'installed', label: 'Installed' }
];

export default function OrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [machine, setMachine] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const oRes = await api.get(`/orders/${id}`);
      setOrder(oRes.data);

      // Fetch associated machine if it exists
      const mRes = await api.get('/machines').catch(() => ({ data: [] }));
      const associatedMachine = mRes.data.find(m => m.order_id === id);
      setMachine(associatedMachine);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (newStatus) => {
    try {
      await api.patch(`/orders/${id}`, { status: newStatus });
      fetchData();
    } catch (err) {
      alert("Failed to update status");
    }
  };

  if (loading) return <div className="page-content">Loading...</div>;
  if (!order) return <div className="page-content">Order not found.</div>;

  const currentStepIndex = STEPS.findIndex(s => s.id === order.status);

  return (
    <div>
      <div className="page-header">
        <Link to="/orders" className="btn btn-outline" style={{ border: 'none', padding: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ArrowLeft size={20} /> Back to Orders
        </Link>
        <h1 className="page-title">Order Lifecycle</h1>
      </div>

      <div className="card" style={{ marginBottom: '2rem' }}>
        <div className="order-header-flex">
          <div>
            <h2 className="card-title">Order #{order.id.split('-')[0]}</h2>
            <p className="form-label" style={{ marginBottom: 0 }}>Customer ID: {order.customer_id}</p>
          </div>
          <span className={`status-badge status-${order.status}`}>{order.status.replace('_', ' ').toUpperCase()}</span>
        </div>

        <div className="stepper-container">
          <div className="lifecycle-stepper">
            <div style={{ position: 'absolute', top: '15px', left: 0, right: 0, height: '2px', background: 'var(--border)', zIndex: 1 }}></div>
            {STEPS.map((step, index) => {
              const isCompleted = index < currentStepIndex || order.status === 'installed';
              const isCurrent = index === currentStepIndex;

              return (
                <div
                  key={step.id}
                  className={`step-item ${isCurrent ? 'active' : ''}`}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.5rem',
                    position: 'relative',
                    zIndex: 2,
                    flex: 1,
                    cursor: 'pointer'
                  }}
                  onClick={() => updateStatus(step.id)}
                >
                  <div style={{
                    background: isCompleted ? 'var(--success)' : isCurrent ? 'var(--primary)' : 'var(--surface)',
                    color: (isCompleted || isCurrent) ? 'white' : 'var(--text-muted)',
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: `2px solid ${isCompleted ? 'var(--success)' : isCurrent ? 'var(--primary)' : 'var(--border)'}`,
                    boxShadow: isCurrent ? '0 0 0 4px rgba(79, 70, 229, 0.1)' : 'none'
                  }}>
                    {isCompleted ? <CheckCircle size={18} /> : index + 1}
                  </div>
                  <span style={{
                    fontSize: '0.65rem',
                    textAlign: 'center',
                    fontWeight: isCurrent ? 600 : 400,
                    maxWidth: '70px',
                    color: isCurrent ? 'var(--primary)' : 'var(--text-muted)'
                  }}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="dashboard-grid-top">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', gridColumn: 'span 2' }}>
          <div className="card">
            <h3 className="card-title">Machine Information</h3>
            {machine ? (
              <div>
                <div className="form-group">
                  <label className="form-label">Serial Number</label>
                  <p style={{ fontWeight: 500 }}>{machine.serial_number}</p>
                </div>
                <div className="form-group">
                  <label className="form-label">Model</label>
                  <p>{machine.model}</p>
                </div>
                <Link to={`/machines/${machine.id}`} className="btn btn-primary" style={{ marginTop: '1rem', width: '100%', textAlign: 'center' }}>View Full Profile</Link>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '1rem' }}>
                <p className="form-label">No machine linked to this order yet.</p>
                <Link to="/machines" className="btn btn-outline" style={{ marginTop: '1rem' }}>Link Machine</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { Plus, Settings } from 'lucide-react';
import Modal from '../components/Modal';

export default function Machines() {
  const [machines, setMachines] = useState([]);
  const [orders, setOrders] = useState([]);
  const [serviceCalls, setServiceCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const initialFormState = {
    order_id: '',
    serial_number: '',
    model: '',
    vendor: '',
    status: 'in_transit',
    dia: '',
    gauge: '',
    feeders: '',
    commissioning_date: '',
    motor_hp: '',
    inverter_capacity: '',
    input_voltage: ''
  };
  const [formData, setFormData] = useState(initialFormState);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [mRes, oRes, sRes] = await Promise.all([
        api.get('/machines').catch(() => ({ data: [] })),
        api.get('/orders').catch(() => ({ data: [] })),
        api.get('/service-calls').catch(() => ({ data: [] }))
      ]);
      setMachines(mRes.data || []);
      setOrders(oRes.data || []);
      setServiceCalls(sRes.data || []);
    } finally {
      setLoading(false);
    }
  };

  const getMachineHealth = (machine) => {
    const hasOpenCall = serviceCalls.some(c => c.machine_id === machine.id && (c.status === 'open' || c.status === 'in_progress'));
    if (hasOpenCall) return 'red';
    if (machine.status === 'under_maintenance' || machine.status === 'in_transit') return 'yellow';
    if (machine.status === 'commissioned') return 'green';
    return 'gray';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = { ...formData };
      if (payload.commissioning_date) {
        payload.commissioning_date = new Date(payload.commissioning_date).toISOString();
      } else {
        payload.commissioning_date = null;
      }
      const cleanedData = Object.fromEntries(
        Object.entries(payload).map(([key, value]) => [key, value === '' ? null : value])
      );
      await api.post('/machines', cleanedData);
      setIsModalOpen(false);
      setFormData(initialFormState);
      fetchData();
    } catch (err) {
      console.error("Error adding machine:", err);
      alert("Failed to add machine. Ensure serial number is unique.");
    } finally {
      setSubmitting(false);
    }
  };

  const f = (field) => ({
    value: formData[field] || '',
    onChange: e => setFormData({ ...formData, [field]: e.target.value })
  });

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Machines</h1>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={16}/> Add Machine
        </button>
      </div>
      
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th style={{ width: '40px' }}></th>
              <th>Serial Number</th>
              <th>Model</th>
              <th>Status</th>
              <th>Warranty End</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" style={{ padding: '2rem', textAlign: 'center' }}>Loading machines...</td></tr>
            ) : machines.length === 0 ? (
              <tr><td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No machines found.</td></tr>
            ) : (
              machines.map(m => {
                const health = getMachineHealth(m);
                return (
                  <tr key={m.id}>
                    <td>
                      <div style={{ 
                        width: '12px', 
                        height: '12px', 
                        borderRadius: '50%', 
                        background: health === 'red' ? 'var(--error)' : health === 'yellow' ? 'var(--warning)' : health === 'green' ? 'var(--success)' : '#CBD5E1',
                        boxShadow: `0 0 8px ${health === 'red' ? 'rgba(239, 68, 68, 0.4)' : health === 'yellow' ? 'rgba(245, 158, 11, 0.4)' : health === 'green' ? 'rgba(16, 185, 129, 0.4)' : 'transparent'}`
                      }}></div>
                    </td>
                    <td style={{ fontWeight: 500 }}>{m.serial_number}</td>
                    <td>{m.model}</td>
                    <td><span className={`status-badge status-${m.status}`}>{m.status.replace('_', ' ').toUpperCase()}</span></td>
                    <td>{m.warranty_end ? new Date(m.warranty_end).toLocaleDateString() : '-'}</td>
                    <td>
                      <Link to={`/machines/${m.id}`} className="btn btn-outline" style={{ padding: '0.25rem 0.5rem' }}>
                        <Settings size={14} /> Profile
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Add New Machine"
      >
        <form onSubmit={handleSubmit} style={{ maxHeight: '75vh', overflowY: 'auto', paddingRight: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Link to Order</label>
            <select 
              className="form-input" 
              required 
              {...f('order_id')}
            >
              <option value="">-- Select Order --</option>
              {orders.map(o => (
                <option key={o.id} value={o.id}>Order {o.id.split('-')[0]} (Status: {o.status})</option>
              ))}
            </select>
          </div>
          
          <h4 style={{ margin: '1rem 0 0.5rem 0' }}>Basic Info</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Serial Number</label>
              <input type="text" className="form-input" required {...f('serial_number')} />
            </div>
            <div className="form-group">
              <label className="form-label">Model Name</label>
              <input type="text" className="form-input" required {...f('model')} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Vendor</label>
            <input type="text" className="form-input" {...f('vendor')} />
          </div>

          <h4 style={{ margin: '1rem 0 0.5rem 0' }}>Machine Specifications</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <div className="form-group"><label className="form-label">Dia</label><input type="text" className="form-input" {...f('dia')} /></div>
            <div className="form-group"><label className="form-label">Gauge</label><input type="text" className="form-input" {...f('gauge')} /></div>
            <div className="form-group"><label className="form-label">Feeders</label><input type="text" className="form-input" {...f('feeders')} /></div>
          </div>

          <h4 style={{ margin: '1rem 0 0.5rem 0' }}>Power Details</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <div className="form-group"><label className="form-label">Motor HP</label><input type="text" className="form-input" {...f('motor_hp')} /></div>
            <div className="form-group"><label className="form-label">Inverter Cap.</label><input type="text" className="form-input" {...f('inverter_capacity')} /></div>
            <div className="form-group"><label className="form-label">Input Voltage</label><input type="text" className="form-input" {...f('input_voltage')} /></div>
          </div>

          <div className="form-group">
            <label className="form-label">Commissioning Date</label>
            <input type="date" className="form-input" {...f('commissioning_date')} />
          </div>

          <div className="modal-footer" style={{ position: 'sticky', bottom: '-1rem', background: 'var(--bg)', padding: '1rem 0', borderTop: '1px solid var(--border)' }}>
            <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Adding...' : 'Add Machine'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

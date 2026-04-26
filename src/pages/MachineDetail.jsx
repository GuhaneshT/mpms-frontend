import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { ArrowLeft, Settings, Wrench, Shield, Calendar, Activity } from 'lucide-react';
import Modal from '../components/Modal';

export default function MachineDetail() {
  const { id } = useParams();
  const [machine, setMachine] = useState(null);
  const [serviceCalls, setServiceCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    status: '',
    installation_date: '',
    warranty_start: '',
    warranty_end: '',
    dia: '',
    gauge: '',
    feeders: '',
    commissioning_date: '',
    motor_hp: '',
    inverter_capacity: '',
    input_voltage: ''
  });
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const mRes = await api.get(`/machines/${id}`);
      setMachine(mRes.data);
      
      const sRes = await api.get('/service-calls').catch(() => ({ data: [] }));
      setServiceCalls(sRes.data.filter(c => c.machine_id === id));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="page-content">Loading...</div>;
  if (!machine) return <div className="page-content">Machine not found.</div>;

  const openEditModal = () => {
    setEditFormData({
      status: machine.status || 'in_transit',
      installation_date: machine.installation_date ? machine.installation_date.toString().split('T')[0] : '',
      warranty_start: machine.warranty_start ? machine.warranty_start.toString().split('T')[0] : '',
      warranty_end: machine.warranty_end ? machine.warranty_end.toString().split('T')[0] : '',
      dia: machine.dia || '',
      gauge: machine.gauge || '',
      feeders: machine.feeders || '',
      commissioning_date: machine.commissioning_date ? machine.commissioning_date.toString().split('T')[0] : '',
      motor_hp: machine.motor_hp || '',
      inverter_capacity: machine.inverter_capacity || '',
      input_voltage: machine.input_voltage || ''
    });
    setIsEditModalOpen(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      const payload = { ...editFormData };
      // clean empty strings to null or correct dates
      Object.keys(payload).forEach(k => { 
        if (payload[k] === '') {
          payload[k] = null;
        } else if (k.includes('date') || k.includes('warranty')) {
           payload[k] = new Date(payload[k]).toISOString();
        }
      });
      await api.patch(`/machines/${id}`, payload);
      setIsEditModalOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Failed to update machine.');
    } finally {
      setUpdating(false);
    }
  };

  const f = (field) => ({
    value: editFormData[field] || '',
    onChange: e => setEditFormData({ ...editFormData, [field]: e.target.value })
  });

  return (
    <div>
      <div className="page-header">
        <Link to="/orders" className="btn btn-outline" style={{ border: 'none', padding: 0 }}>
          <ArrowLeft size={20} /> Back
        </Link>
        <h1 className="page-title">Machine Profile</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
        <div className="card">
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <div style={{ 
              width: '80px', 
              height: '80px', 
              background: 'var(--surface-hover)', 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              margin: '0 auto 1rem'
            }}>
              <Settings size={40} className="text-primary" />
            </div>
            <h2 className="card-title" style={{ marginBottom: '0.25rem' }}>{machine.serial_number}</h2>
            <p className="form-label">{machine.model}</p>
            <span className={`status-badge status-${machine.status}`} style={{ marginTop: '0.5rem' }}>
              {machine.status.replace('_', ' ').toUpperCase()}
            </span>
          </div>

          <hr style={{ border: 'none', height: '1px', background: 'var(--border)', margin: '1.5rem 0' }} />

          <div style={{ display: 'grid', gridTemplateColumns: 'min-content 1fr', gap: '1rem', rowGap: '1rem' }}>
            <Shield size={18} className="text-muted" />
            <div>
              <p className="form-label mb-1">Vendor</p>
              <p style={{ fontSize: '0.875rem' }}>{machine.vendor || 'Unknown'}</p>
            </div>
            <Activity size={18} className="text-muted" />
            <div>
              <p className="form-label mb-1">Machine Specifications</p>
              <p style={{ fontSize: '0.875rem' }}>
                Dia: {machine.dia || '-'} | Gauge: {machine.gauge || '-'} | Feeders: {machine.feeders || '-'}
              </p>
            </div>
            <Activity size={18} className="text-muted" />
            <div>
              <p className="form-label mb-1">Power Details</p>
              <p style={{ fontSize: '0.875rem' }}>
                Motor HP: {machine.motor_hp || '-'} | Inverter: {machine.inverter_capacity || '-'} | Voltage: {machine.input_voltage || '-'}
              </p>
            </div>
            <Calendar size={18} className="text-muted" />
            <div>
              <p className="form-label mb-1">Commissioning Date</p>
              <p style={{ fontSize: '0.875rem' }}>
                {machine.commissioning_date ? new Date(machine.commissioning_date).toLocaleDateString() : 'Pending'}
              </p>
            </div>
            <Calendar size={18} className="text-muted" />
            <div>
              <p className="form-label mb-1">Warranty Period</p>
              <p style={{ fontSize: '0.875rem' }}>
                Start: {machine.warranty_start ? new Date(machine.warranty_start).toLocaleDateString() : '-'} <br/>
                End: {machine.warranty_end ? new Date(machine.warranty_end).toLocaleDateString() : 'No Warranty'}
              </p>
            </div>
          </div>
          
          <button className="btn btn-primary" style={{ width: '100%', marginTop: '2rem' }} onClick={openEditModal}>
            Edit Machine Details
          </button>
        </div>

        <div>
          <div className="card">
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
               <h3 className="card-title" style={{ marginBottom: 0 }}>Service History</h3>
               <Link to="/service-calls" className="btn btn-outline btn-sm" style={{ padding: '0.25rem 0.75rem' }}>
                 <Wrench size={14} /> Log New Call
               </Link>
             </div>
             
             {serviceCalls.length === 0 ? (
               <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                 No service history recorded for this machine.
               </div>
             ) : (
                <div className="table-container" style={{ border: 'none' }}>
                  <table style={{ width: '100%' }}>
                    <thead>
                      <tr>
                        <th style={{ background: 'none' }}>Date</th>
                        <th style={{ background: 'none' }}>Problem</th>
                        <th style={{ background: 'none' }}>Assignee</th>
                        <th style={{ background: 'none' }}>Solution Log</th>
                        <th style={{ background: 'none' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {serviceCalls.map(c => (
                        <tr key={c.id}>
                          <td>{new Date(c.created_at).toLocaleDateString()}</td>
                          <td>{c.error_description}</td>
                          <td style={{ fontSize: '0.8rem', color: 'var(--primary)' }}>{c.technician_id ? c.technician_id.split('-')[0] : '-'}</td>
                          <td style={{ fontSize: '0.8rem', whiteSpace: 'pre-wrap', maxWidth: '200px' }}>
                            {c.solution || '-'}
                          </td>
                          <td><span className={`status-badge status-${c.status}`}>{c.status.toUpperCase()}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
             )}
          </div>
        </div>
      </div>
      
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Machine">
        <form onSubmit={handleUpdate} style={{ maxHeight: '75vh', overflowY: 'auto', paddingRight: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Status</label>
            <select className="form-input" required {...f('status')}>
              <option value="in_transit">In Transit</option>
              <option value="commissioned">Commissioned</option>
              <option value="under_maintenance">Under Maintenance</option>
            </select>
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

          <h4 style={{ margin: '1rem 0 0.5rem 0' }}>Dates</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Commissioning Date</label>
              <input type="date" className="form-input" {...f('commissioning_date')} />
            </div>
            <div className="form-group">
              <label className="form-label">Installation Date</label>
              <input type="date" className="form-input" {...f('installation_date')} />
            </div>
            <div className="form-group">
              <label className="form-label">Warranty Start</label>
              <input type="date" className="form-input" {...f('warranty_start')} />
            </div>
            <div className="form-group">
              <label className="form-label">Warranty End</label>
              <input type="date" className="form-input" {...f('warranty_end')} />
            </div>
          </div>

          <div className="modal-footer" style={{ position: 'sticky', bottom: '-1rem', background: 'var(--bg)', padding: '1rem 0', borderTop: '1px solid var(--border)' }}>
            <button type="button" className="btn btn-outline" onClick={() => setIsEditModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={updating}>{updating ? 'Saving...' : 'Save Changes'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

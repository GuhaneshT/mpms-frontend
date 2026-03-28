import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Plus, Wrench } from 'lucide-react';
import Modal from '../components/Modal';

export default function ServiceCalls() {
  const { user } = useAuth();
  const [calls, setCalls] = useState([]);
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
  const [selectedCallId, setSelectedCallId] = useState(null);
  const [formData, setFormData] = useState({
    machine_id: '',
    department: 'mechanical',
    error_description: '',
    is_warranty: false,
    technician_id: ''
  });
  const [resolutionData, setResolutionData] = useState({
    solution: '',
    parts_used: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCalls();
    fetchMachines();
  }, []);

  const fetchCalls = async () => {
    try {
      const res = await api.get('/service-calls').catch(() => ({ data: [] }));
      setCalls(res.data || []);
    } finally {
      setLoading(false);
    }
  };

  const fetchMachines = async () => {
    const res = await api.get('/machines').catch(() => ({ data: [] }));
    setMachines(res.data || []);
  };

  const openResolveModal = (callId) => {
    setSelectedCallId(callId);
    setResolutionData({ solution: '', parts_used: '' });
    setIsResolveModalOpen(true);
  };

  const handleResolve = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // Include user and timestamp in the solution log
      const logHeader = `[Resolved by ${user?.email || 'Technician'} at ${new Date().toLocaleString()}]\n`;
      const fullSolution = logHeader + resolutionData.solution;
      
      await api.patch(`/service-calls/${selectedCallId}`, { 
        status: 'resolved',
        solution: fullSolution,
        parts_used: resolutionData.parts_used || null
      });
      
      setIsResolveModalOpen(false);
      fetchCalls();
    } catch (err) {
      console.error("Error resolving service call:", err);
      alert("Failed to resolve service call");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const cleanedData = Object.fromEntries(
        Object.entries(formData).map(([key, value]) => [key, value === '' ? null : value])
      );
      await api.post('/service-calls', cleanedData);
      setIsModalOpen(false);
      setFormData({ machine_id: '', department: 'mechanical', error_description: '', is_warranty: false, technician_id: '' });
      fetchCalls();
    } catch (err) {
      console.error("Error creating service call:", err);
      alert("Failed to create service call");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Service Calls</h1>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={16}/> New Call
        </button>
      </div>
      
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Machine (S/N)</th>
              <th>Department</th>
              <th>Status</th>
              <th>Date</th>
              <th>Assignee</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" style={{ padding: '2rem', textAlign: 'center' }}>Loading calls...</td></tr>
            ) : calls.length === 0 ? (
              <tr><td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No service calls found.</td></tr>
            ) : (
              calls.map(c => (
                <React.Fragment key={c.id}>
                <tr>
                  <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{c.id.split('-')[0]}</td>
                  <td>{machines.find(m => m.id === c.machine_id)?.serial_number || c.machine_id.split('-')[0]}</td>
                  <td style={{ textTransform: 'capitalize' }}>{c.department.replace('_', ' ')}</td>
                  <td><span className={`status-badge status-${c.status}`}>{c.status.toUpperCase()}</span></td>
                  <td>{new Date(c.created_at).toLocaleDateString()}</td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--primary)' }}>
                    {c.technician_id ? c.technician_id.split('-')[0] : 'Unassigned'}
                  </td>
                  <td>
                    {c.status !== 'resolved' && (
                      <button 
                        className="btn btn-outline" 
                        style={{ padding: '0.25rem 0.5rem' }}
                        onClick={() => openResolveModal(c.id)}
                      >
                        <Wrench size={14} /> Resolve
                      </button>
                    )}
                  </td>
                </tr>
                {c.solution && (
                  <tr>
                    <td colSpan="6" style={{ background: 'var(--surface)', padding: '0.5rem 1.5rem', fontSize: '0.8rem', borderTop: 'none' }}>
                      <div style={{ color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Resolution Log (Technician: {c.technician_id || 'Unknown'}):</div>
                      <div style={{ whiteSpace: 'pre-wrap' }}>{c.solution}</div>
                    </td>
                  </tr>
                )}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Raise New Service Call"
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Select Machine</label>
            <select 
              className="form-input" 
              required 
              value={formData.machine_id}
              onChange={e => setFormData({...formData, machine_id: e.target.value})}
            >
              <option value="">-- Choose Machine --</option>
              {machines.map(m => (
                <option key={m.id} value={m.id}>{m.serial_number} ({m.model})</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Department</label>
            <select 
              className="form-input" 
              value={formData.department}
              onChange={e => setFormData({...formData, department: e.target.value})}
            >
              <option value="mechanical">Mechanical</option>
              <option value="electrical">Electrical</option>
              <option value="software_plc">Software/PLC</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Error Description</label>
            <textarea 
              className="form-input" 
              rows="3" 
              required
              value={formData.error_description}
              onChange={e => setFormData({...formData, error_description: e.target.value})}
            ></textarea>
          </div>
          <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input 
              type="checkbox" 
              checked={formData.is_warranty}
              onChange={e => setFormData({...formData, is_warranty: e.target.checked})}
            />
            <label className="form-label" style={{ marginBottom: 0 }}>Under Warranty Call</label>
          </div>
          <div className="form-group">
            <label className="form-label">Assign Technician ID (Optional)</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="UUID of technician"
              value={formData.technician_id}
              onChange={e => setFormData({...formData, technician_id: e.target.value})}
            />
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Creating...' : 'Log Service Call'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal 
        isOpen={isResolveModalOpen} 
        onClose={() => setIsResolveModalOpen(false)} 
        title="Resolve Service Call"
      >
        <form onSubmit={handleResolve}>
          <div className="form-group">
            <label className="form-label">Resolution Description *</label>
            <textarea 
              className="form-input" 
              rows="4" 
              required
              placeholder="What was fixed? How was it resolved?"
              value={resolutionData.solution}
              onChange={e => setResolutionData({...resolutionData, solution: e.target.value})}
            ></textarea>
          </div>
          <div className="form-group">
            <label className="form-label">Parts Used (Optional)</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="e.g. 2x M8 Bolts, PLC Cable"
              value={resolutionData.parts_used}
              onChange={e => setResolutionData({...resolutionData, parts_used: e.target.value})}
            />
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={() => setIsResolveModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Resolving...' : 'Confirm Resolution'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

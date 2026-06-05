import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Plus, Wrench, Trash2 } from 'lucide-react';

import { PERMISSIONS } from '../auth/permissions';
import Modal from '../components/Modal';

export default function ServiceCalls() {
  const { user, can } = useAuth();
  const [calls, setCalls] = useState([]);
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
  const [selectedCallId, setSelectedCallId] = useState(null);
  
  const initialFormState = {
    machine_id: '',
    department: 'mechanical',
    error_description: '',
    is_warranty: false,
    technician_id: '',
    customer_name: '',
    visit_date: '',
    purpose_of_visit: 'Service call',
    observation: '',
    service_engg_name: '',
    to_be_attended_on: '',
    machine_reference: [{ mc_no: '', model: '', dia: '', gg: '', feeders: '' }]
  };

  const [formData, setFormData] = useState(initialFormState);

  const initialResolveState = {
    solution: '',
    parts_used: '',
    corrective_measures: '',
    remarks: '',
    attended_on: ''
  };

  const [resolutionData, setResolutionData] = useState(initialResolveState);
  const [submitting, setSubmitting] = useState(false);
  const canCreateServiceCalls = can(PERMISSIONS.SERVICE_CALLS_WRITE);
  const canResolveServiceCalls = can(PERMISSIONS.SERVICE_CALLS_RESOLVE);

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
    if (!canResolveServiceCalls) {
      return;
    }

    setSelectedCallId(callId);
    setResolutionData(initialResolveState);
    setIsResolveModalOpen(true);
  };

  const handleResolve = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const logHeader = `[Resolved by ${user?.email || 'Technician'} at ${new Date().toLocaleString()}]\n`;
      const fullSolution = logHeader + resolutionData.solution;
      
      const payload = { 
        status: 'resolved',
        solution: fullSolution,
        parts_used: resolutionData.parts_used || null,
        corrective_measures: resolutionData.corrective_measures || null,
        remarks: resolutionData.remarks || null,
        attended_on: resolutionData.attended_on ? new Date(resolutionData.attended_on).toISOString() : null
      };
      
      await api.patch(`/service-calls/${selectedCallId}`, payload);
      
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
      const payload = {
        ...formData,
        visit_date: formData.visit_date ? new Date(formData.visit_date).toISOString() : null,
        to_be_attended_on: formData.to_be_attended_on ? new Date(formData.to_be_attended_on).toISOString() : null,
      };
      
      const cleanedData = Object.fromEntries(
        Object.entries(payload).map(([key, value]) => [key, value === '' ? null : value])
      );
      
      await api.post('/service-calls', cleanedData);
      setIsModalOpen(false);
      setFormData(initialFormState);
      fetchCalls();
    } catch (err) {
      console.error("Error creating service call:", err);
      alert("Failed to create service call");
    } finally {
      setSubmitting(false);
    }
  };

  const handleMachineRefChange = (index, field, value) => {
    const newRefs = [...formData.machine_reference];
    newRefs[index][field] = value;
    setFormData({ ...formData, machine_reference: newRefs });
  };

  const addMachineRef = () => {
    setFormData({
      ...formData,
      machine_reference: [...formData.machine_reference, { mc_no: '', model: '', dia: '', gg: '', feeders: '' }]
    });
  };

  const removeMachineRef = (index) => {
    const newRefs = formData.machine_reference.filter((_, i) => i !== index);
    setFormData({ ...formData, machine_reference: newRefs });
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Service Calls</h1>
        {canCreateServiceCalls ? (
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={16}/> New Call
          </button>
        ) : null}
      </div>
      
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Customer</th>
              <th>Machine (S/N)</th>
              <th>Department</th>
              <th>Status</th>
              <th>Visit Date</th>
              <th>Assignee</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="8" style={{ padding: '2rem', textAlign: 'center' }}>Loading calls...</td></tr>
            ) : calls.length === 0 ? (
              <tr><td colSpan="8" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No service calls found.</td></tr>
            ) : (
              calls.map(c => (
                <React.Fragment key={c.id}>
                <tr>
                  <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{c.id.split('-')[0]}</td>
                  <td>{c.customer_name || 'N/A'}</td>
                  <td>{machines.find(m => m.id === c.machine_id)?.serial_number || c.machine_id.split('-')[0]}</td>
                  <td style={{ textTransform: 'capitalize' }}>{c.department.replace('_', ' ')}</td>
                  <td><span className={`status-badge status-${c.status}`}>{c.status.toUpperCase()}</span></td>
                  <td>{c.visit_date ? new Date(c.visit_date).toLocaleDateString() : 'N/A'}</td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--primary)' }}>
                    {c.service_engg_name || (c.technician_id ? c.technician_id.split('-')[0] : 'Unassigned')}
                  </td>
                  <td>
                    {canResolveServiceCalls && c.status !== 'resolved' && (
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
                    <td colSpan="8" style={{ background: 'var(--surface)', padding: '0.5rem 1.5rem', fontSize: '0.8rem', borderTop: 'none' }}>
                      <div style={{ color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Resolution Log:</div>
                      <div style={{ whiteSpace: 'pre-wrap' }}>{c.solution}</div>
                      {c.corrective_measures && <div><strong>Corrective Measures:</strong> {c.corrective_measures}</div>}
                      {c.remarks && <div><strong>Remarks:</strong> {c.remarks}</div>}
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
        isOpen={canCreateServiceCalls && isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Raise New Service Call Report"
      >
        <form onSubmit={handleSubmit} style={{ maxHeight: '70vh', overflowY: 'auto', paddingRight: '1rem' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Customer Name</label>
              <input 
                type="text" 
                className="form-input" 
                required
                value={formData.customer_name}
                onChange={e => setFormData({...formData, customer_name: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Date</label>
              <input 
                type="date" 
                className="form-input" 
                required
                value={formData.visit_date}
                onChange={e => setFormData({...formData, visit_date: e.target.value})}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Purpose of Visit</label>
            <select 
              className="form-input" 
              required
              value={formData.purpose_of_visit}
              onChange={e => setFormData({...formData, purpose_of_visit: e.target.value})}
            >
              <option value="Site verification">Site verification</option>
              <option value="Service call">Service call</option>
              <option value="Others">Others</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Linked Primary Machine</label>
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
            <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
              Machine Reference Details
              <button type="button" onClick={addMachineRef} style={{ fontSize: '0.8rem', color: 'var(--primary)', cursor: 'pointer', background: 'none', border: 'none' }}>+ Add Machine</button>
            </label>
            <div style={{ border: '1px solid var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
              <table style={{ margin: 0, fontSize: '0.85rem' }}>
                <thead style={{ background: 'var(--surface)' }}>
                  <tr>
                    <th style={{ padding: '0.5rem' }}>M/c No.</th>
                    <th style={{ padding: '0.5rem' }}>Model</th>
                    <th style={{ padding: '0.5rem' }}>Dia</th>
                    <th style={{ padding: '0.5rem' }}>GG</th>
                    <th style={{ padding: '0.5rem' }}>Feeders</th>
                    <th style={{ padding: '0.5rem', width: '30px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {formData.machine_reference.map((ref, idx) => (
                    <tr key={idx}>
                      <td style={{ padding: '0.2rem' }}><input type="text" style={{ width: '100%', padding: '0.25rem' }} value={ref.mc_no} onChange={e => handleMachineRefChange(idx, 'mc_no', e.target.value)} /></td>
                      <td style={{ padding: '0.2rem' }}><input type="text" style={{ width: '100%', padding: '0.25rem' }} value={ref.model} onChange={e => handleMachineRefChange(idx, 'model', e.target.value)} /></td>
                      <td style={{ padding: '0.2rem' }}><input type="text" style={{ width: '100%', padding: '0.25rem' }} value={ref.dia} onChange={e => handleMachineRefChange(idx, 'dia', e.target.value)} /></td>
                      <td style={{ padding: '0.2rem' }}><input type="text" style={{ width: '100%', padding: '0.25rem' }} value={ref.gg} onChange={e => handleMachineRefChange(idx, 'gg', e.target.value)} /></td>
                      <td style={{ padding: '0.2rem' }}><input type="text" style={{ width: '100%', padding: '0.25rem' }} value={ref.feeders} onChange={e => handleMachineRefChange(idx, 'feeders', e.target.value)} /></td>
                      <td style={{ padding: '0.2rem', textAlign: 'center' }}>
                        {idx > 0 && <Trash2 size={14} color="var(--error)" style={{ cursor: 'pointer' }} onClick={() => removeMachineRef(idx)} />}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Observation</label>
            <textarea 
              className="form-input" 
              rows="4" 
              placeholder="(Enclose separate sheet, if necessary)"
              value={formData.observation}
              onChange={e => setFormData({...formData, observation: e.target.value})}
            ></textarea>
          </div>

          <div className="form-group">
            <label className="form-label">Error Description / Basic Notes</label>
            <textarea 
              className="form-input" 
              rows="2" 
              required
              value={formData.error_description}
              onChange={e => setFormData({...formData, error_description: e.target.value})}
            ></textarea>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Service Dept. Name</label>
              <input 
                type="text" 
                className="form-input" 
                value={formData.service_engg_name}
                onChange={e => setFormData({...formData, service_engg_name: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label className="form-label">To be attended on</label>
              <input 
                type="date" 
                className="form-input" 
                value={formData.to_be_attended_on}
                onChange={e => setFormData({...formData, to_be_attended_on: e.target.value})}
              />
            </div>
          </div>

          <div className="modal-footer" style={{ position: 'sticky', bottom: '-1rem', background: 'var(--bg)', padding: '1rem 0', borderTop: '1px solid var(--border)', marginTop: '1rem' }}>
            <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Creating...' : 'Log Service Call'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal 
        isOpen={canResolveServiceCalls && isResolveModalOpen} 
        onClose={() => setIsResolveModalOpen(false)} 
        title="Resolve & Close Service Call"
      >
        <form onSubmit={handleResolve} style={{ maxHeight: '70vh', overflowY: 'auto', paddingRight: '1rem' }}>
          
          <div className="form-group">
            <label className="form-label">Attended On</label>
            <input 
              type="date" 
              className="form-input" 
              required
              value={resolutionData.attended_on}
              onChange={e => setResolutionData({...resolutionData, attended_on: e.target.value})}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Corrective Measures</label>
            <textarea 
              className="form-input" 
              rows="4" 
              required
              placeholder="Describe actions taken or recommended"
              value={resolutionData.corrective_measures}
              onChange={e => setResolutionData({...resolutionData, corrective_measures: e.target.value})}
            ></textarea>
          </div>

          <div className="form-group">
            <label className="form-label">Detailed Solution / Final Notes</label>
            <textarea 
              className="form-input" 
              rows="3" 
              value={resolutionData.solution}
              onChange={e => setResolutionData({...resolutionData, solution: e.target.value})}
            ></textarea>
          </div>

          <div className="form-group">
            <label className="form-label">Parts Used (Optional)</label>
            <input 
              type="text" 
              className="form-input" 
              value={resolutionData.parts_used}
              onChange={e => setResolutionData({...resolutionData, parts_used: e.target.value})}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Remarks</label>
            <textarea 
              className="form-input" 
              rows="2" 
              placeholder="Final comments or summary"
              value={resolutionData.remarks}
              onChange={e => setResolutionData({...resolutionData, remarks: e.target.value})}
            ></textarea>
          </div>

          <div className="modal-footer" style={{ position: 'sticky', bottom: '-1rem', background: 'var(--bg)', padding: '1rem 0', borderTop: '1px solid var(--border)', marginTop: '1rem' }}>
            <button type="button" className="btn btn-outline" onClick={() => setIsResolveModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Resolving...' : 'Close Service Call'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

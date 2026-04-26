import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { ArrowLeft, CheckCircle, Circle, Plus, X, Save, ClipboardCheck, Power } from 'lucide-react';

const STEPS = [
  { id: 'order_received', label: 'Order Received' },
  { id: 'production_chart', label: 'Production Chart' },
  { id: 'ancillary_prep', label: 'Ancillary Prep' },
  { id: 'site_verification', label: 'Site Verification' },
  { id: 'in_transit', label: 'In Transit' },
  { id: 'material_verified', label: 'Material Verified' },
  { id: 'commissioned', label: 'Commissioned' } // Renamed from Installed
];

const UNIT_OPTIONS = [
  { value: 'nos', label: 'Nos' },
  { value: 'g', label: 'g (grams)' },
  { value: 'l', label: 'L (litres)' },
];

function TagList({ label, items, onChange }) {
  const [inputVal, setInputVal] = useState('');
  const add = () => {
    const v = inputVal.trim();
    if (v) { onChange([...items, v]); setInputVal(''); }
  };
  const remove = (i) => onChange(items.filter((_, idx) => idx !== i));
  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
        <input
          type="text" className="form-input" style={{ margin: 0, flex: 1 }}
          placeholder={`Add ${label.toLowerCase()}…`}
          value={inputVal}
          onChange={e => setInputVal(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), add())}
        />
        <button type="button" className="btn btn-outline" style={{ padding: '0.4rem 0.7rem' }} onClick={add}>
          <Plus size={14} />
        </button>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
        {items.map((item, i) => (
          <span key={i} style={{
            background: 'var(--primary-light)', color: 'var(--primary)',
            borderRadius: '4px', padding: '0.2rem 0.6rem 0.2rem 0.8rem',
            fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px'
          }}>
            {item}
            <button type="button" onClick={() => remove(i)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: 0, lineHeight: 1 }}>
              <X size={12} />
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}

function ProductionChartCard({ orderId, onSaved }) {
  const [chart, setChart] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    chart_ref_no: '',
    machines: [{ machine_model: '', quantity: 1, machine_description: '' }],
    unit: 'nos', accessories: [], requirements: [], notes: ''
  });

  useEffect(() => {
    api.get(`/orders/${orderId}/production-chart`)
      .then(r => {
        setChart(r.data);
        const data = r.data;
        if (!data.machines || data.machines.length === 0) {
           data.machines = [{ machine_model: data.machine_model || '', quantity: data.quantity || 1, machine_description: data.machine_description || '' }];
        }
        setForm({ ...form, ...data });
      })
      .catch(() => { });
  }, [orderId]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form };
      // Fallback for older fields if needed backend side, though we updated schema
      const res = await api.post(`/orders/${orderId}/production-chart`, payload);
      setChart(res.data);
      onSaved?.();
      alert('Production chart saved!');
    } catch {
      alert('Failed to save production chart');
    } finally { setSaving(false); }
  };

  const f = (field) => ({ value: form[field], onChange: e => setForm({ ...form, [field]: e.target.value }) });

  const addMachineRow = () => {
    setForm({ ...form, machines: [...form.machines, { machine_model: '', quantity: 1, machine_description: '' }] });
  };
  const updateMachineRow = (index, field, val) => {
    const newMachines = [...form.machines];
    newMachines[index][field] = val;
    setForm({ ...form, machines: newMachines });
  };
  const removeMachineRow = (index) => {
    setForm({ ...form, machines: form.machines.filter((_, i) => i !== index) });
  };

  return (
    <div className="card" style={{ marginTop: '1.5rem' }}>
      <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <ClipboardCheck size={18} /> Production Chart Details
      </h3>
      <form onSubmit={handleSave}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Production Chart Ref No</label>
            <input type="text" className="form-input" placeholder="e.g. PC-2024-001" {...f('chart_ref_no')} />
          </div>
          <div className="form-group">
            <label className="form-label">Unit</label>
            <select className="form-input" {...f('unit')}>
              {UNIT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            Machines Required
            <button type="button" onClick={addMachineRow} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.85rem' }}>+ Add Machine Row</button>
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {form.machines.map((m, idx) => (
              <div key={idx} style={{ padding: '1rem', border: '1px solid var(--border)', borderRadius: '8px', position: 'relative' }}>
                {idx > 0 && <button type="button" onClick={() => removeMachineRow(idx)} style={{ position: 'absolute', top: '10px', right: '10px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--error)' }}><X size={16}/></button>}
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem', marginBottom: '0.75rem' }}>
                  <div>
                    <label className="form-label" style={{fontSize: '0.8rem'}}>Model</label>
                    <input type="text" className="form-input" required value={m.machine_model} onChange={e => updateMachineRow(idx, 'machine_model', e.target.value)} />
                  </div>
                  <div>
                    <label className="form-label" style={{fontSize: '0.8rem'}}>Quantity</label>
                    <input type="number" min="1" className="form-input" required value={m.quantity} onChange={e => updateMachineRow(idx, 'quantity', parseInt(e.target.value)||1)} />
                  </div>
                </div>
                <div>
                  <label className="form-label" style={{fontSize: '0.8rem'}}>Description/Specs</label>
                  <textarea className="form-input" rows={1} value={m.machine_description} onChange={e => updateMachineRow(idx, 'machine_description', e.target.value)}></textarea>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          <TagList label="Accessories" items={form.accessories} onChange={v => setForm({ ...form, accessories: v })} />
          <TagList label="Requirements" items={form.requirements} onChange={v => setForm({ ...form, requirements: v })} />
        </div>

        <div className="form-group">
          <label className="form-label">Notes</label>
          <textarea className="form-input" rows={2} {...f('notes')} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            <Save size={15} /> {saving ? 'Saving…' : chart ? 'Update Chart' : 'Save Chart'}
          </button>
        </div>
      </form>
    </div>
  );
}

function MaterialVerificationCard({ orderId }) {
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(null);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => { 
    api.get(`/orders/${orderId}/material-verification`)
      .then(r => setRecord(r.data))
      .catch(() => {
        api.post(`/orders/${orderId}/material-verification`, {}).then(r => setRecord(r.data)).catch(()=>{});
      }).finally(() => setLoading(false));
  }, [orderId]);

  const toggle = async (idx) => {
    setToggling(idx);
    try {
      const r = await api.patch(`/orders/${orderId}/material-verification/checklist/${idx}`);
      setRecord(r.data);
    } catch { alert('Could not update checklist item'); }
    finally { setToggling(null); }
  };

  const markVerified = async () => {
    setVerifying(true);
    try {
      const r = await api.patch(`/orders/${orderId}/material-verification`, { is_verified: true });
      setRecord(r.data);
    } catch { alert('Failed to mark as verified'); }
    finally { setVerifying(false); }
  };

  if (loading) return <div className="card" style={{ marginTop: '1.5rem' }}>Loading checklist…</div>;

  const checklist = record?.checklist || [];
  const accessories = checklist.filter(i => i.category === 'accessory');
  const requirements = checklist.filter(i => i.category === 'requirement');
  const allDone = checklist.length > 0 && checklist.every(i => i.checked);
  const isVerified = record?.is_verified;

  const CheckSection = ({ title, items, offset }) => (
    <div style={{ marginBottom: '1.25rem' }}>
      <p style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>{title}</p>
      {items.length === 0 ? <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>None specified.</p> : items.map((item, localIdx) => {
        const globalIdx = offset + localIdx;
        return (
          <div key={globalIdx}
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 0.5rem', borderRadius: '4px', cursor: 'pointer', background: item.checked ? '#d4edda' : 'transparent' }}
            onClick={() => !toggling && toggle(globalIdx)}
          >
            <span style={{ color: item.checked ? 'var(--success, #10b981)' : 'var(--text-muted)' }}>
              {item.checked ? <CheckCircle size={20} /> : <Circle size={20} />}
            </span>
            <span style={{ fontSize: '0.9rem', textDecoration: item.checked ? 'line-through' : 'none', color: item.checked ? 'var(--text-muted)' : 'inherit' }}>
              {item.item}
            </span>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="card" style={{ marginTop: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <h3 className="card-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ClipboardCheck size={18} /> Material Verification Checklist
        </h3>
        {isVerified
          ? <span style={{ background: '#28a745', color: '#fff', borderRadius: '4px', padding: '0.2rem 0.6rem', Math: '0.75rem', fontWeight: 'bold' }}>✓ Verified</span>
          : <span style={{ background: '#ffc107', color: '#000', borderRadius: '4px', padding: '0.2rem 0.6rem', fontSize: '0.75rem', fontWeight: 'bold' }}>Pending</span>
        }
      </div>
      {checklist.length === 0
        ? <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No items found. Fill in Production Chart first.</p>
        : <>
          <CheckSection title="Accessories" items={accessories} offset={0} />
          <CheckSection title="Requirements" items={requirements} offset={accessories.length} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem', paddingTop: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{checklist.filter(i => i.checked).length} / {checklist.length} checked</span>
            {!isVerified && (
              <button className="btn btn-primary" disabled={!allDone || verifying} onClick={markVerified}>
                <CheckCircle size={15} /> {verifying ? 'Verifying…' : 'Mark as Verified'}
              </button>
            )}
          </div>
        </>
      }
    </div>
  );
}

// ── Commissioning Card ────────────────────────────────────────────────────────
function CommissioningCard({ orderId, orderMachines }) {
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState([]);

  useEffect(() => {
    api.get(`/orders/${orderId}/installation-record`)
      .then(res => {
        setRecord(res.data);
        if (res.data?.commissioning_data) {
          setData(res.data.commissioning_data || []);
        } else {
          // Initialize empty forms for each machine if no data yet
          initData();
        }
        setLoading(false);
      })
      .catch(err => {
        if (err.response?.status === 404) {
          api.post(`/orders/${orderId}/installation-record`, {})
            .then(res => {
              setRecord(res.data);
              initData();
            })
            .finally(() => setLoading(false));
        } else {
          setLoading(false);
        }
      });
  }, [orderId, orderMachines]);

  const initData = () => {
    if (!orderMachines || orderMachines.length === 0) return;
    const initial = orderMachines.map(m => ({
      machine_id: m.id,
      serial_number: m.serial_number,
      count_of_yarn: '',
      type_of_yarn: '',
      speed: '',
      gsm_l_cm: '',
      running_noise_remarks: '',
      fabric_quality: ''
    }));
    setData(initial);
  };

  const handleChange = (idx, field, value) => {
    const newData = [...data];
    if (!newData[idx]) return;
    newData[idx][field] = value;
    setData(newData);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.patch(`/orders/${orderId}/installation-record`, {
        commissioning_data: data
      });
      setRecord(res.data);
      alert('Commissioning details saved successfully.');
    } catch (err) {
      alert('Failed to save commissioning details.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="card" style={{ marginTop: '1.5rem' }}>Loading commissioning data...</div>;

  return (
    <div className="card" style={{ marginTop: '1.5rem' }}>
      <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Power size={18} /> Commissioning Phase Sign-off
      </h3>
      {orderMachines.length === 0 ? (
        <p className="form-label">No machines attached to this order. Please attach machines to record commissioning details.</p>
      ) : (
        <form onSubmit={handleSave}>
          <p className="form-label" style={{ marginBottom: '1.5rem' }}>Provide commissioning properties for every machine attached to this order.</p>
          
          {data.map((mdata, idx) => (
            <div key={mdata.machine_id} style={{ marginBottom: '2rem', padding: '1rem', border: '1px solid var(--border)', borderRadius: '4px', background: 'var(--surface)' }}>
              <h4 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem' }}>
                Machine S/N: <span style={{ color: 'var(--primary)' }}>{mdata.serial_number}</span>
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Count of Yarn</label>
                  <input type="text" className="form-input" value={mdata.count_of_yarn || ''} onChange={e => handleChange(idx, 'count_of_yarn', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Type of Yarn</label>
                  <input type="text" className="form-input" value={mdata.type_of_yarn || ''} onChange={e => handleChange(idx, 'type_of_yarn', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Speed of the Machine</label>
                  <input type="text" className="form-input" value={mdata.speed || ''} onChange={e => handleChange(idx, 'speed', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">GSM / L.Cm</label>
                  <input type="text" className="form-input" value={mdata.gsm_l_cm || ''} onChange={e => handleChange(idx, 'gsm_l_cm', e.target.value)} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Running Noise and General Remarks</label>
                <textarea className="form-input" rows={2} value={mdata.running_noise_remarks || ''} onChange={e => handleChange(idx, 'running_noise_remarks', e.target.value)}></textarea>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Quality of Fabrics</label>
                <textarea className="form-input" rows={2} value={mdata.fabric_quality || ''} onChange={e => handleChange(idx, 'fabric_quality', e.target.value)}></textarea>
              </div>
            </div>
          ))}

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              <Save size={15} /> {saving ? 'Saving...' : 'Save All Commissioning Data'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default function OrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [orderMachines, setOrderMachines] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, [id]);

  const fetchData = async () => {
    try {
      const oRes = await api.get(`/orders/${id}`);
      setOrder(oRes.data);
      const mRes = await api.get('/machines').catch(() => ({ data: [] }));
      const machines = mRes.data.filter(m => m.order_id === id);
      setOrderMachines(machines);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const updateStatus = async (newStatus) => {
    try {
      await api.patch(`/orders/${id}`, { status: newStatus });
      fetchData();
    } catch { alert('Failed to update status'); }
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

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="order-header-flex">
          <div>
            <h2 className="card-title">Order #{order.id.split('-')[0]}</h2>
            <p className="form-label" style={{ marginBottom: 0 }}>Customer ID: {order.customer_id}</p>
          </div>
          <span className={`status-badge status-${order.status}`}>{order.status.replace(/_/g, ' ').toUpperCase()}</span>
        </div>

        <div className="stepper-container">
          <div className="lifecycle-stepper">
            <div style={{ position: 'absolute', top: '15px', left: 0, right: 0, height: '2px', background: 'var(--border)', zIndex: 1 }}></div>
            {STEPS.map((step, index) => {
              const isCompleted = index < currentStepIndex || order.status === 'commissioned';
              const isCurrent = index === currentStepIndex;
              return (
                <div key={step.id}
                  className={`step-item ${isCurrent ? 'active' : ''}`}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', position: 'relative', zIndex: 2, flex: 1, cursor: 'pointer' }}
                  onClick={() => updateStatus(step.id)}
                >
                  <div style={{
                    background: isCompleted ? 'var(--success)' : isCurrent ? 'var(--primary)' : 'var(--surface)',
                    color: (isCompleted || isCurrent) ? 'white' : 'var(--text-muted)',
                    width: '32px', height: '32px', borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: `2px solid ${isCompleted ? 'var(--success)' : isCurrent ? 'var(--primary)' : 'var(--border)'}`
                  }}>
                    {isCompleted ? <CheckCircle size={18} /> : index + 1}
                  </div>
                  <span style={{ fontSize: '0.65rem', textAlign: 'center', fontWeight: isCurrent ? 600 : 400, maxWidth: '70px', color: isCurrent ? 'var(--primary)' : 'var(--text-muted)' }}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {order.status === 'production_chart' && <ProductionChartCard orderId={id} onSaved={fetchData} />}
      {order.status === 'material_verified' && <MaterialVerificationCard orderId={id} />}
      {order.status === 'commissioned' && <CommissioningCard orderId={id} orderMachines={orderMachines} />}

      <div className="card" style={{ marginTop: '1.5rem' }}>
        <h3 className="card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Machine Information
          <Link to={`/machines`} className="btn btn-primary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.85rem' }}>+ Manage Machines</Link>
        </h3>
        {orderMachines.length > 0 ? (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {orderMachines.map(m => (
              <div key={m.id} style={{ padding: '1rem', border: '1px solid var(--border)', borderRadius: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: 600 }}>{m.serial_number}</span>
                  <Link to={`/machines/${m.id}`} style={{ fontSize: '0.8rem', color: 'var(--primary)', textDecoration: 'none' }}>View Profile →</Link>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.85rem' }}>
                  <div><span style={{ color: 'var(--text-muted)' }}>Model:</span> {m.model}</div>
                  <div><span style={{ color: 'var(--text-muted)' }}>Dia/Gauge:</span> {m.dia || '-'} / {m.gauge || '-'}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '1rem' }}>
            <p className="form-label">No machines linked to this order yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}

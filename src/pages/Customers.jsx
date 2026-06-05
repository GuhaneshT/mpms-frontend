import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Plus, Edit, X, ChevronDown, ChevronUp, Trash2, UserPlus } from 'lucide-react';

import { PERMISSIONS } from '../auth/permissions';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';

const emptyContact = { name: '', phone: '', designation: '' };

export default function Customers() {
  const { can } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [expandedRow, setExpandedRow] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const emptyForm = {
    name: '', company: '', address: '', city: '', state: '', pincode: '',
    phone: '', email: '', gst: '', contacts: [{ ...emptyContact }]
  };
  const [formData, setFormData] = useState(emptyForm);
  const canManageCustomers = can(PERMISSIONS.CUSTOMERS_WRITE);

  useEffect(() => { fetchCustomers(); }, []);

  const fetchCustomers = async () => {
    try {
      const res = await api.get('/customers').catch(() => ({ data: [] }));
      setCustomers(res.data || []);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name || '',
      company: customer.company || '',
      address: customer.address || '',
      city: customer.city || '',
      state: customer.state || '',
      pincode: customer.pincode || '',
      phone: customer.phone || '',
      email: customer.email || '',
      gst: customer.gst || '',
      contacts: customer.contacts?.length > 0
        ? customer.contacts.map(c => ({ _id: c.id, name: c.name, phone: c.phone || '', designation: c.designation || '' }))
        : [{ ...emptyContact }]
    });
    setIsModalOpen(true);
  };

  const openAddModal = () => {
    setEditingCustomer(null);
    setFormData(emptyForm);
    setIsModalOpen(true);
  };

  // Contact row helpers
  const updateContact = (idx, field, value) => {
    const contacts = [...formData.contacts];
    contacts[idx] = { ...contacts[idx], [field]: value };
    setFormData({ ...formData, contacts });
  };
  const addContactRow = () => setFormData({ ...formData, contacts: [...formData.contacts, { ...emptyContact }] });
  const removeContactRow = (idx) => {
    const contacts = formData.contacts.filter((_, i) => i !== idx);
    setFormData({ ...formData, contacts: contacts.length ? contacts : [{ ...emptyContact }] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { contacts, ...coreData } = formData;
      const cleanedCore = Object.fromEntries(
        Object.entries(coreData).map(([k, v]) => [k, v === '' ? null : v])
      );

      let customerId;
      if (editingCustomer) {
        await api.patch(`/customers/${editingCustomer.id}`, cleanedCore);
        customerId = editingCustomer.id;

        // Delete old contacts then re-add
        const existing = editingCustomer.contacts || [];
        for (const c of existing) {
          await api.delete(`/customers/${customerId}/contacts/${c.id}`).catch(() => {});
        }
      } else {
        const res = await api.post('/customers', cleanedCore);
        customerId = res.data.id;
      }

      // Add contacts (skip empty rows)
      for (const c of contacts) {
        if (c.name.trim()) {
          await api.post(`/customers/${customerId}/contacts`, {
            name: c.name,
            phone: c.phone || null,
            designation: c.designation || null
          });
        }
      }

      setIsModalOpen(false);
      fetchCustomers();
    } catch (err) {
      console.error('Error saving customer:', err);
      alert('Failed to save customer');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Customers</h1>
        {canManageCustomers ? (
          <button className="btn btn-primary" onClick={openAddModal}>
            <Plus size={16} /> Add Customer
          </button>
        ) : null}
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Company</th>
              <th>Location</th>
              <th>Phone</th>
              <th>Contacts</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" style={{ padding: '2rem', textAlign: 'center' }}>Loading customers...</td></tr>
            ) : customers.length === 0 ? (
              <tr><td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No customers found.</td></tr>
            ) : (
              customers.map(c => (
                <React.Fragment key={c.id}>
                  <tr>
                    <td style={{ fontWeight: 500 }}>{c.name}</td>
                    <td>{c.company || '-'}</td>
                    <td>
                      {[c.city, c.state, c.pincode].filter(Boolean).join(', ') || '-'}
                    </td>
                    <td>{c.phone || '-'}</td>
                    <td>
                      {c.contacts?.length > 0 ? (
                        <button
                          className="btn btn-outline"
                          style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                          onClick={() => setExpandedRow(expandedRow === c.id ? null : c.id)}
                        >
                          {c.contacts.length} contact{c.contacts.length > 1 ? 's' : ''}
                          {expandedRow === c.id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                        </button>
                      ) : <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>—</span>}
                    </td>
                    <td>
                      {canManageCustomers ? (
                        <button className="btn btn-outline" style={{ padding: '0.25rem 0.5rem' }} onClick={() => handleEdit(c)}>
                          <Edit size={14} /> Edit
                        </button>
                      ) : <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Read only</span>}
                    </td>
                  </tr>
                  {expandedRow === c.id && c.contacts?.length > 0 && (
                    <tr>
                      <td colSpan="6" style={{ padding: 0, background: 'var(--surface-hover, rgba(0,0,0,0.03))' }}>
                        <div style={{ padding: '0.75rem 1.5rem' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                            <span>Name</span><span>Phone</span><span>Designation</span>
                          </div>
                          {c.contacts.map(ct => (
                            <div key={ct.id} style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', padding: '0.35rem 0', borderTop: '1px solid var(--border)', fontSize: '0.85rem' }}>
                              <span style={{ fontWeight: 500 }}>{ct.name}</span>
                              <span>{ct.phone || '—'}</span>
                              <span style={{ color: 'var(--text-muted)' }}>{ct.designation || '—'}</span>
                            </div>
                          ))}
                        </div>
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
        isOpen={canManageCustomers && isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCustomer ? 'Edit Customer' : 'Add New Customer'}
      >
        <form onSubmit={handleSubmit}>
          {/* Core fields */}
          <div className="form-group">
            <label className="form-label">Full Name *</label>
            <input type="text" className="form-input" required value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Company</label>
            <input type="text" className="form-input" value={formData.company}
              onChange={e => setFormData({ ...formData, company: e.target.value })} />
          </div>

          {/* Address block */}
          <div className="form-group">
            <label className="form-label">Street Address</label>
            <input type="text" className="form-input" value={formData.address}
              onChange={e => setFormData({ ...formData, address: e.target.value })} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
            <div className="form-group">
              <label className="form-label">City</label>
              <input type="text" className="form-input" value={formData.city}
                onChange={e => setFormData({ ...formData, city: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">State</label>
              <input type="text" className="form-input" value={formData.state}
                onChange={e => setFormData({ ...formData, state: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Pincode</label>
              <input type="text" className="form-input" value={formData.pincode}
                onChange={e => setFormData({ ...formData, pincode: e.target.value })} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input type="text" className="form-input" value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input type="email" className="form-input" value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">GST Number</label>
            <input type="text" className="form-input" value={formData.gst}
              onChange={e => setFormData({ ...formData, gst: e.target.value })} />
          </div>

          {/* Contacts */}
          <div style={{ marginTop: '1.25rem', marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <label className="form-label" style={{ margin: 0, fontWeight: 600 }}>Contacts</label>
              <button type="button" className="btn btn-outline"
                style={{ padding: '0.2rem 0.6rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                onClick={addContactRow}>
                <UserPlus size={13} /> Add Contact
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1.5fr auto', gap: '0.4rem', marginBottom: '0.4rem' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>NAME</span>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>PHONE</span>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>DESIGNATION</span>
              <span />
            </div>

            {formData.contacts.map((ct, idx) => (
              <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1.5fr auto', gap: '0.4rem', marginBottom: '0.4rem', alignItems: 'center' }}>
                <input type="text" className="form-input" placeholder="Contact name"
                  style={{ margin: 0 }} value={ct.name}
                  onChange={e => updateContact(idx, 'name', e.target.value)} />
                <input type="text" className="form-input" placeholder="Phone"
                  style={{ margin: 0 }} value={ct.phone}
                  onChange={e => updateContact(idx, 'phone', e.target.value)} />
                <input type="text" className="form-input" placeholder="Designation"
                  style={{ margin: 0 }} value={ct.designation}
                  onChange={e => updateContact(idx, 'designation', e.target.value)} />
                <button type="button" onClick={() => removeContactRow(idx)}
                  style={{ background: 'none', border: 'none', color: 'var(--danger, #ef4444)', cursor: 'pointer', padding: '0.25rem' }}>
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : editingCustomer ? 'Update Customer' : 'Create Customer'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

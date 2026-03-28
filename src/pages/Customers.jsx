import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Plus, Edit, X } from 'lucide-react';
import Modal from '../components/Modal';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    address: '',
    city: '',
    state: '',
    phone: '',
    email: '',
    gst: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, []);

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
      phone: customer.phone || '',
      email: customer.email || '',
      gst: customer.gst || ''
    });
    setIsModalOpen(true);
  };

  const openAddModal = () => {
    setEditingCustomer(null);
    setFormData({ name: '', company: '', address: '', city: '', state: '', phone: '', email: '', gst: '' });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const cleanedData = Object.fromEntries(
        Object.entries(formData).map(([key, value]) => [key, value === '' ? null : value])
      );

      if (editingCustomer) {
        await api.patch(`/customers/${editingCustomer.id}`, cleanedData);
      } else {
        await api.post('/customers', cleanedData);
      }
      
      setIsModalOpen(false);
      fetchCustomers();
    } catch (err) {
      console.error("Error saving customer:", err);
      alert("Failed to save customer");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Customers</h1>
        <button className="btn btn-primary" onClick={openAddModal}>
          <Plus size={16}/> Add Customer
        </button>
      </div>
      
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Company</th>
              <th>Location</th>
              <th>Phone</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" style={{ padding: '2rem', textAlign: 'center' }}>Loading customers...</td></tr>
            ) : customers.length === 0 ? (
              <tr><td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No customers found.</td></tr>
            ) : (
              customers.map(c => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 500 }}>{c.name}</td>
                  <td>{c.company || '-'}</td>
                  <td>{c.city ? `${c.city}, ${c.state}` : '-'}</td>
                  <td>{c.phone || '-'}</td>
                  <td>
                    <button className="btn btn-outline" style={{ padding: '0.25rem 0.5rem' }} onClick={() => handleEdit(c)}>
                      <Edit size={14} /> Edit
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingCustomer ? "Edit Customer" : "Add New Customer"}
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name *</label>
            <input 
              type="text" 
              className="form-input" 
              required 
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Company</label>
            <input 
              type="text" 
              className="form-input" 
              value={formData.company}
              onChange={e => setFormData({...formData, company: e.target.value})}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">City</label>
              <input 
                type="text" 
                className="form-input" 
                value={formData.city}
                onChange={e => setFormData({...formData, city: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label className="form-label">State</label>
              <input 
                type="text" 
                className="form-input" 
                value={formData.state}
                onChange={e => setFormData({...formData, state: e.target.value})}
              />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Phone</label>
            <input 
              type="text" 
              className="form-input" 
              value={formData.phone}
              onChange={e => setFormData({...formData, phone: e.target.value})}
            />
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Customer'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

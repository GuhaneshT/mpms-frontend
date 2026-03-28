import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { Plus, ArrowRight } from 'lucide-react';
import Modal from '../components/Modal';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ customer_id: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchOrders();
    fetchCustomers();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await api.get('/orders').catch(() => ({ data: [] }));
      setOrders(res.data || []);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    const res = await api.get('/customers').catch(() => ({ data: [] }));
    setCustomers(res.data || []);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/orders', formData);
      setIsModalOpen(false);
      setFormData({ customer_id: '' });
      fetchOrders();
    } catch (err) {
      console.error("Error creating order:", err);
      alert("Failed to create order");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Orders</h1>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={16}/> Create Order
        </button>
      </div>
      
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Status</th>
              <th>Created Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" style={{ padding: '2rem', textAlign: 'center' }}>Loading orders...</td></tr>
            ) : orders.length === 0 ? (
              <tr><td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No orders found.</td></tr>
            ) : (
              orders.map(o => (
                <tr key={o.id}>
                  <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{o.id.split('-')[0]}</td>
                  <td>{customers.find(c => c.id === o.customer_id)?.name || o.customer_id.split('-')[0]}</td>
                  <td><span className={`status-badge status-${o.status}`}>{o.status.replace('_', ' ').toUpperCase()}</span></td>
                  <td>{new Date(o.created_at).toLocaleDateString()}</td>
                  <td>
                    <Link to={`/orders/${o.id}`} className="btn btn-outline" style={{ padding: '0.25rem 0.5rem' }}>
                      Lifecycle <ArrowRight size={14} />
                    </Link>
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
        title="Create New Order"
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Select Customer</label>
            <select 
              className="form-input" 
              required 
              value={formData.customer_id}
              onChange={e => setFormData({customer_id: e.target.value})}
            >
              <option value="">-- Choose a Customer --</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.company})</option>
              ))}
            </select>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Order'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

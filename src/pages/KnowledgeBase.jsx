import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Search, BookOpen, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function KnowledgeBase() {
  const [calls, setCalls] = useState([]);
  const [machines, setMachines] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [filterMachine, setFilterMachine] = useState('all');
  const [filterTechnician, setFilterTechnician] = useState('');
  const [sortOrder, setSortOrder] = useState('newest');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [cRes, mRes] = await Promise.all([
        api.get('/service-calls').catch(() => ({ data: [] })),
        api.get('/machines').catch(() => ({ data: [] }))
      ]);
      
      // Filter for only resolved or closed calls that have a solution
      const resolvedCalls = (cRes.data || []).filter(
        c => c.solution && (c.status === 'resolved' || c.status === 'closed')
      );
      
      setCalls(resolvedCalls);
      setMachines(mRes.data || []);
    } catch (error) {
      console.error("Error fetching knowledge base data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getMachineInfo = (machineId) => {
    return machines.find(m => m.id === machineId) || {};
  };

  // Get unique machine models for filter
  const uniqueMachineModels = [...new Set(machines.map(m => m.model).filter(Boolean))];

  // Filter and Sort based on criteria
  let filteredCalls = calls.filter(c => {
    const q = searchQuery.toLowerCase();
    const machine = getMachineInfo(c.machine_id);
    
    const matchesSearch = c.error_description?.toLowerCase().includes(q) ||
                          c.solution?.toLowerCase().includes(q) ||
                          machine.model?.toLowerCase().includes(q) ||
                          machine.serial_number?.toLowerCase().includes(q);
                          
    const matchesDept = filterDepartment === 'all' || c.department === filterDepartment;
    const matchesMachine = filterMachine === 'all' || machine.model === filterMachine;
    const matchesTech = !filterTechnician || (c.technician_id && c.technician_id.toLowerCase().includes(filterTechnician.toLowerCase()));
    
    return matchesSearch && matchesDept && matchesMachine && matchesTech;
  });

  filteredCalls.sort((a, b) => {
    const timestampA = new Date(a.updated_at || a.created_at).getTime();
    const timestampB = new Date(b.updated_at || b.created_at).getTime();
    return sortOrder === 'newest' ? timestampB - timestampA : timestampA - timestampB;
  });

  return (
    <div>
      <div className="page-header" style={{ marginBottom: '2rem' }}>
        <div>
           <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
             <BookOpen size={24} /> Issue Knowledge Base
           </h1>
           <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
             Search through past resolved service calls to find solutions for current problems.
           </p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '2rem', padding: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
          <div style={{ position: 'relative', flex: '1 1 100%' }}>
            <Search size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              className="form-input" 
              placeholder="Search by error description, solution, machine model, or serial number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '3rem', fontSize: '1.1rem', height: '3.5rem' }}
            />
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 200px' }}>
            <label className="form-label" style={{ fontSize: '0.8rem', marginBottom: '0.25rem' }}>Department</label>
            <select 
              className="form-input" 
              value={filterDepartment} 
              onChange={(e) => setFilterDepartment(e.target.value)}
            >
              <option value="all">All Departments</option>
              <option value="mechanical">Mechanical</option>
              <option value="electrical">Electrical</option>
              <option value="software_plc">Software / PLC</option>
            </select>
          </div>
          <div style={{ flex: '1 1 200px' }}>
            <label className="form-label" style={{ fontSize: '0.8rem', marginBottom: '0.25rem' }}>Machine Model</label>
            <select 
              className="form-input" 
              value={filterMachine} 
              onChange={(e) => setFilterMachine(e.target.value)}
            >
              <option value="all">All Models</option>
              {uniqueMachineModels.map(model => (
                <option key={model} value={model}>{model}</option>
              ))}
            </select>
          </div>
          <div style={{ flex: '1 1 200px' }}>
            <label className="form-label" style={{ fontSize: '0.8rem', marginBottom: '0.25rem' }}>Technician</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Filter by UUID..."
              value={filterTechnician}
              onChange={(e) => setFilterTechnician(e.target.value)}
            />
          </div>
          <div style={{ flex: '1 1 150px' }}>
            <label className="form-label" style={{ fontSize: '0.8rem', marginBottom: '0.25rem' }}>Sort By</label>
            <select 
              className="form-input" 
              value={sortOrder} 
              onChange={(e) => setSortOrder(e.target.value)}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Loading knowledge base...</div>
      ) : filteredCalls.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', background: 'var(--surface)', borderRadius: 'var(--radius)' }}>
          <Search size={32} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
          <h3>No solutions found</h3>
          <p>Try adjusting your search terms or checking active service calls.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {filteredCalls.map(call => {
            const machine = getMachineInfo(call.machine_id);
            return (
              <div key={call.id} className="card" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <div style={{ background: 'var(--error-light)', color: 'var(--error)', padding: '0.5rem', borderRadius: '50%', height: 'fit-content' }}>
                      <AlertCircle size={20} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.25rem' }}>{call.error_description}</h3>
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                        Machine: <strong>{machine.model || 'Unknown'}</strong> (S/N: {machine.serial_number || 'Unknown'}) &bull; Dept: {call.department.replace('_', ' ')}
                      </div>
                    </div>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Resolved: {new Date(call.updated_at || call.created_at).toLocaleDateString()}
                  </span>
                </div>
                
                <div style={{ background: 'var(--surface-hover)', borderLeft: '3px solid var(--success)', padding: '1rem', borderRadius: '0 var(--radius) var(--radius) 0', marginTop: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--success)', fontWeight: 500, fontSize: '0.875rem' }}>
                    <CheckCircle2 size={16} /> Solution Log
                  </div>
                  <div style={{ whiteSpace: 'pre-wrap', color: 'var(--text-main)', fontSize: '0.9rem', lineHeight: 1.5 }}>
                    {call.solution}
                  </div>
                  {call.parts_used && (
                    <div style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      <strong>Parts Used:</strong> {typeof call.parts_used === 'string' ? call.parts_used : JSON.stringify(call.parts_used)}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

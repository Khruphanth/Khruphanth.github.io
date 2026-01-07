import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { fetchSheetData, postAction } from '../../services/api';
import { SHEET_NAMES } from '../../config/config';

const UserTable = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRows, setSelectedRows] = useState(new Set());
  
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [currentUser, setCurrentUser] = useState({ id: '', pass: '', name: '', role: 'user' });

  const loadUsers = async () => {
    setLoading(true);
    try {
      const rows = await fetchSheetData(SHEET_NAMES.LOGIN || "LOGIN");
      const mapped = rows
        .filter(r => r[0] && String(r[0]).trim() !== "") // กรองแถวว่าง
        .map((r, i) => ({ 
          row: i + 2, 
          id: r[0], 
          pass: r[1], 
          role: r[2],
          name: r[3] 
        }));
      setData(mapped);
      setSelectedRows(new Set());
    } catch(e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { loadUsers(); }, []);

  const toggleSelect = (rowId) => {
    const newSet = new Set(selectedRows);
    if (newSet.has(rowId)) newSet.delete(rowId); else newSet.add(rowId);
    setSelectedRows(newSet);
  };

  const handleBulkDelete = async () => {
    if (selectedRows.size === 0) return;
    const res = await Swal.fire({ title: `ลบ ${selectedRows.size} รายการที่เลือก?`, icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33' });
    if (res.isConfirmed) {
      Swal.fire({ title: 'กำลังลบ...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
      const sortedRows = Array.from(selectedRows).sort((a, b) => b - a);
      for (const row of sortedRows) {
        await postAction("LOGIN", "delete", { row });
      }
      Swal.fire('สำเร็จ', 'ลบรายการที่เลือกแล้ว', 'success');
      loadUsers();
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setShowModal(false);
    Swal.fire({ title: 'กำลังบันทึก...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

    const payload = {
        "ID": currentUser.id,
        "Pass": currentUser.pass,
        "Status": currentUser.role, 
        "Name": currentUser.name
    };

    if (modalMode === 'add') {
        await postAction("LOGIN", "add", payload);
    } else {
        await postAction("LOGIN", "edit", { ...payload, row: currentUser.row });
    }

    Swal.fire('สำเร็จ', '', 'success');
    loadUsers();
  };

  const openEdit = (u) => {
    setCurrentUser(u);
    setModalMode('edit');
    setShowModal(true);
  };

  return (
    <div className="card border-0 shadow-sm rounded-4">
      <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
        <h5 className="fw-bold text-primary m-0">จัดการสมาชิก ({selectedRows.size})</h5>
        <div className="btn-group btn-group-sm">
            <button className="btn btn-outline-secondary" onClick={loadUsers}><i className="bi bi-arrow-clockwise"></i> รีเฟรช</button>
            {selectedRows.size > 0 && <button className="btn btn-danger" onClick={handleBulkDelete}><i className="bi bi-trash"></i> ลบที่เลือก</button>}
            <button className="btn btn-primary" onClick={() => { setCurrentUser({ id: '', pass: '', name: '', role: 'user' }); setModalMode('add'); setShowModal(true); }}>+ เพิ่มสมาชิก</button>
        </div>
      </div>
      <div className="table-responsive p-3">
        <table className="table table-hover align-middle">
          <thead className="table-light">
            <tr>
              <th width="40"><i className="bi bi-check2-square"></i></th>
              <th width="20%">ID (Username)</th>
              <th width="20%">Password</th>
              <th width="25%">Name (ชื่อ-สกุล)</th>
              <th width="15%">Role (สิทธิ์)</th>
              <th width="10%" className="text-center">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan="6" className="text-center p-4">กำลังโหลด...</td></tr> :
             data.map((u, i) => (
              <tr key={i} onClick={() => toggleSelect(u.row)} style={{cursor:'pointer'}}>
                <td onClick={e => e.stopPropagation()}>
                    <input type="checkbox" className="form-check-input" checked={selectedRows.has(u.row)} onChange={() => toggleSelect(u.row)} />
                </td>
                <td className="fw-bold text-primary">{u.id}</td>
                <td className="text-muted">{u.pass}</td>
                <td>{u.name}</td>
                <td><span className={`badge rounded-pill ${u.role==='admin'?'bg-danger':'bg-info text-dark'}`}>{u.role}</span></td>
                <td className="text-center" onClick={e => e.stopPropagation()}>
                    <button className="btn btn-warning btn-sm text-dark me-1" onClick={() => openEdit(u)}><i className="bi bi-pencil"></i></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Add/Edit โค้ดส่วนเดิมคงไว้ */}
      {showModal && (
        <div className="modal fade show d-block" style={{background: 'rgba(0,0,0,0.5)'}}>
            <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content">
                    <div className="modal-header"><h5 className="modal-title">{modalMode==='add'?'เพิ่มสมาชิก':'แก้ไขสมาชิก'}</h5></div>
                    <form onSubmit={handleSave}>
                        <div className="modal-body">
                            <div className="mb-3">
                                <label className="form-label">Username (ID)</label>
                                <input required className="form-control" value={currentUser.id} onChange={e=>setCurrentUser({...currentUser, id:e.target.value})} />
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Password</label>
                                <input required type="text" className="form-control" value={currentUser.pass} onChange={e=>setCurrentUser({...currentUser, pass:e.target.value})}/>
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Name (ชื่อ-สกุล)</label>
                                <input required className="form-control" value={currentUser.name} onChange={e=>setCurrentUser({...currentUser, name:e.target.value})}/>
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Role (สิทธิ์)</label>
                                <select className="form-select" value={currentUser.role} onChange={e=>setCurrentUser({...currentUser, role:e.target.value})}>
                                    <option value="user">User</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" onClick={()=>setShowModal(false)}>ปิด</button>
                            <button type="submit" className="btn btn-primary">บันทึก</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default UserTable;
import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { fetchSheetData, postAction } from '../../services/api';
import { SHEET_NAMES } from '../../config/config';

const InventoryTable = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const [currentItem, setCurrentItem] = useState({});

  const loadList = async () => {
    setLoading(true);
    try {
      const rows = await fetchSheetData(SHEET_NAMES.DATA || "DATA");
      const mapped = rows.map((r, i) => ({
        row: i + 2,
        code: r[0],
        name: r[1]
      }));
      setData(mapped);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => { loadList(); }, []);

  // ---------------- ACTIONS ----------------

  const handleAddItem = async (e) => {
    e.preventDefault();
    setShowAddModal(false);

    Swal.fire({ title: 'กำลังเพิ่ม...', didOpen: () => Swal.showLoading(), allowOutsideClick: false });

    await postAction("DATA", "add", {
      code: currentItem.code,
      name: currentItem.name
    });

    Swal.fire('สำเร็จ', 'เพิ่มรายการแล้ว', 'success');
    loadList();
  };

  const handleEditSave = async () => {
    setShowEditModal(false);

    Swal.fire({ title: 'กำลังบันทึก...', didOpen: () => Swal.showLoading(), allowOutsideClick: false });

    await postAction("DATA", "update", {
      row: currentItem.row,
      code: currentItem.code,
      name: currentItem.name
    });

    Swal.fire('บันทึกแล้ว', '', 'success');
    loadList();
  };

  const handleDelete = async (row) => {
    const res = await Swal.fire({
      title: 'ยืนยันลบ?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33'
    });

    if (!res.isConfirmed) return;

    Swal.fire({ title: 'กำลังลบ...', didOpen: () => Swal.showLoading(), allowOutsideClick: false });

    await postAction("DATA", "delete", { row });

    Swal.fire('ลบแล้ว', '', 'success');
    loadList();
  };

  // ---------------- UI ----------------

  return (
    <div className="card shadow-sm rounded-4">
      <div className="card-header bg-white d-flex justify-content-between">
        <h5 className="fw-bold text-primary m-0">ฐานข้อมูลครุภัณฑ์</h5>
        <button
          className="btn btn-primary btn-sm"
          onClick={() => { setCurrentItem({}); setShowAddModal(true); }}
        >
          + เพิ่ม
        </button>
      </div>

      <div className="table-responsive p-3">
        <table className="table table-hover align-middle">
          <thead className="table-light">
            <tr>
              <th>รหัส</th>
              <th>ชื่อ</th>
              <th className="text-center">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {loading
              ? <tr><td colSpan="3" className="text-center">กำลังโหลด...</td></tr>
              : data.map((item, i) => (
                <tr key={i}>
                  <td className="fw-bold">{item.code}</td>
                  <td>{item.name}</td>
                  <td className="text-center">
                    <button
                      className="btn btn-warning btn-sm me-1"
                      onClick={() => { setCurrentItem(item); setShowEditModal(true); }}
                    >
                      แก้ไข
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDelete(item.row)}
                    >
                      ลบ
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* ADD MODAL */}
      {showAddModal && (
        <div className="modal fade show d-block" style={{ background: 'rgba(0,0,0,.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <form onSubmit={handleAddItem}>
                <div className="modal-header">
                  <h5 className="modal-title">เพิ่มข้อมูล</h5>
                </div>
                <div className="modal-body">
                  <input
                    required
                    className="form-control mb-2"
                    placeholder="รหัส"
                    value={currentItem.code || ''}
                    onChange={e => setCurrentItem({ ...currentItem, code: e.target.value })}
                  />
                  <input
                    required
                    className="form-control"
                    placeholder="ชื่อ"
                    value={currentItem.name || ''}
                    onChange={e => setCurrentItem({ ...currentItem, name: e.target.value })}
                  />
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>ปิด</button>
                  <button type="submit" className="btn btn-primary">บันทึก</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {showEditModal && (
        <div className="modal fade show d-block" style={{ background: 'rgba(0,0,0,.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">แก้ไขข้อมูล</h5>
              </div>
              <div className="modal-body">
                <input
                  className="form-control mb-2"
                  value={currentItem.code || ''}
                  onChange={e => setCurrentItem({ ...currentItem, code: e.target.value })}
                />
                <input
                  className="form-control"
                  value={currentItem.name || ''}
                  onChange={e => setCurrentItem({ ...currentItem, name: e.target.value })}
                />
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowEditModal(false)}>ปิด</button>
                <button className="btn btn-primary" onClick={handleEditSave}>บันทึก</button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default InventoryTable;

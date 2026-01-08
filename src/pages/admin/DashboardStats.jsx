import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchSheetData } from '../../services/api';
import { SHEET_NAMES } from '../../config/config';

const DashboardStats = () => {
  const navigate = useNavigate();
  const [showData, setShowData] = useState([]); // สำหรับ 4 สถานะย่อย (ดึงจากชีท SHOW)
  const [stats, setStats] = useState({ total: 0, wait: 0, available: 0, broken: 0, repair: 0, expired: 0 });
  const [modalData, setModalData] = useState({ show: false, title: '', items: [] });

  useEffect(() => {
    const load = async () => {
      try {
        // ดึงข้อมูลจากทั้ง 3 ชีท
        const d = await fetchSheetData(SHEET_NAMES.DATA || "DATA");
        const w = await fetchSheetData(SHEET_NAMES.WAIT || "WAIT");
        const s = await fetchSheetData(SHEET_NAMES.SHOW || "SHOW"); // ดึงชีท SHOW
        
        setShowData(s);

        // คำนวณสถิติ
        setStats({
          total: d.length, // ทั้งหมดจาก DATA
          wait: w.length,  // รอตรวจจาก WAIT
          // 4 สถานะล่างนี้ กรองจากชีท SHOW (สมมติสถานะอยู่ index ที่ 5)
          available: s.filter(r => String(r[5] || "").trim() === "ใช้งานได้").length,
          broken: s.filter(r => String(r[5] || "").trim() === "ชำรุด").length,
          repair: s.filter(r => String(r[5] || "").trim() === "ส่งซ่อม").length,
          expired: s.filter(r => String(r[5] || "").trim() === "เสื่อมสภาพ").length,
        });
      } catch (err) {
        console.error("Load stats error:", err);
      }
    };
    load();
  }, []);

  const openModal = (status) => {
    // กรองข้อมูลจากชีท SHOW ตามสถานะที่คลิก
    const filtered = showData.filter(r => String(r[5] || "").trim() === status);
    setModalData({ show: true, title: `รายการ: ${status}`, items: filtered });
  };

  const Card = ({ title, count, color, onClick, isDark = false }) => (
    <div className="col-md-6 col-lg-4" onClick={onClick} style={{ cursor: 'pointer' }}>
      <div className={`card border-0 shadow-sm h-100 p-3 bg-${color} ${isDark ? 'text-dark' : 'text-white'}`}>
        <div className="card-body">
          <h5 className="card-title opacity-75">{title}</h5>
          <h2 className="display-4 fw-bold">{count}</h2>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <h3 className="fw-bold mb-4 text-primary">📊 แผงควบคุม (Dashboard)</h3>
      <div className="row g-4">
        {/* ดึงจาก DATA และ WAIT */}
        <Card title="📦 ครุภัณฑ์ทั้งหมด" count={stats.total} color="primary" onClick={() => navigate('/admin/inventory')} />
        <Card title="⏳ รอตรวจสอบ" count={stats.wait} color="warning" isDark onClick={() => navigate('/admin/wait')} />
        
        {/* ดึงจาก SHOW */}
        <Card title="✅ ใช้งานได้" count={stats.available} color="success" onClick={() => openModal("ใช้งานได้")} />
        <Card title="❌ ชำรุด" count={stats.broken} color="danger" onClick={() => openModal("ชำรุด")} />
        <Card title="🔧 ส่งซ่อม" count={stats.repair} color="info" onClick={() => openModal("ส่งซ่อม")} />
        <Card title="⚠️ เสื่อมสภาพ" count={stats.expired} color="secondary" onClick={() => openModal("เสื่อมสภาพ")} />
      </div>

      {/* Modal แสดงผลข้อมูลจากชีท SHOW */}
      {modalData.show && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-lg modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{modalData.title}</h5>
                <button type="button" className="btn-close" onClick={() => setModalData({ ...modalData, show: false })}></button>
              </div>
              <div className="modal-body">
                <table className="table table-striped table-bordered">
                  <thead className="table-light">
                    <tr>
                      <th>รหัส</th>
                      <th>ชื่อรายการ</th>
                      <th>สถานะ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {modalData.items.length > 0 ? modalData.items.map((item, idx) => (
                      <tr key={idx}>
                        <td>{item[1]}</td>
                        <td>{item[2]}</td>
                        <td>{item[5]}</td>
                      </tr>
                    )) : (
                      <tr><td colSpan="3" className="text-center">ไม่พบข้อมูลในชีท SHOW</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setModalData({ ...modalData, show: false })}>ปิด</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardStats;
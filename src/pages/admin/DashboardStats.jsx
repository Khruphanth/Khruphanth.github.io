import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchSheetData } from '../../services/api';
import { SHEET_NAMES } from '../../config/config';
import { Modal, Button, Table } from 'react-bootstrap';

const DashboardStats = () => {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [stats, setStats] = useState({ total: 0, wait: 0, available: 0, broken: 0, repair: 0, expired: 0 });
  const [showModal, setShowModal] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [filteredItems, setFilteredItems] = useState([]);

  useEffect(() => {
    const load = async () => {
      const d = await fetchSheetData(SHEET_NAMES.DATA || "DATA");
      const w = await fetchSheetData(SHEET_NAMES.WAIT || "WAIT");
      
      setData(d); // เก็บข้อมูลทั้งหมดไว้กรองใน Modal

      // สมมติว่าสถานะอยู่ที่ Column index ที่ 5 (ปรับตัวเลขตามโครงสร้าง Sheet ของคุณ)
      setStats({
        total: d.length,
        wait: w.length,
        available: d.filter(r => r[5] === "ใช้งานได้").length,
        broken: d.filter(r => r[5] === "ชำรุด").length,
        repair: d.filter(r => r[5] === "ส่งซ่อม").length,
        expired: d.filter(r => r[5] === "เสื่อมสภาพ").length,
      });
    };
    load();
  }, []);

  const openStatusModal = (status) => {
    const filtered = data.filter(r => r[5] === status);
    setFilteredItems(filtered);
    setModalTitle(`รายการครุภัณฑ์: ${status}`);
    setShowModal(true);
  };

  const CardItem = ({ title, count, bgColor, textColor = 'white', onClick }) => (
    <div className="col-md-6 col-lg-4" onClick={onClick} style={{ cursor: 'pointer' }}>
      <div className={`card border-0 shadow-sm h-100 p-3 bg-${bgColor} text-${textColor}`}>
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
        {/* คลิกแล้วไปหน้าอื่น */}
        <CardItem title="📦 ครุภัณฑ์ทั้งหมด" count={stats.total} bgColor="primary" onClick={() => navigate('/admin/inventory')} />
        <CardItem title="⏳ รอตรวจสอบ" count={stats.wait} bgColor="warning" textColor="dark" onClick={() => navigate('/admin/wait')} />
        
        {/* คลิกแล้วเปิด Modal */}
        <CardItem title="✅ ใช้งานได้" count={stats.available} bgColor="success" onClick={() => openStatusModal("ใช้งานได้")} />
        <CardItem title="❌ ชำรุด" count={stats.broken} bgColor="danger" onClick={() => openStatusModal("ชำรุด")} />
        <CardItem title="🔧 ส่งซ่อม" count={stats.repair} bgColor="info" onClick={() => openStatusModal("ส่งซ่อม")} />
        <CardItem title="⚠️ เสื่อมสภาพ" count={stats.expired} bgColor="secondary" onClick={() => openStatusModal("เสื่อมสภาพ")} />
      </div>

      {/* Modal แสดงรายละเอียด */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{modalTitle}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Table responsive striped bordered>
            <thead>
              <tr>
                <th>รหัส</th>
                <th>รายการ</th>
                <th>สถานะ</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item, idx) => (
                <tr key={idx}>
                  <td>{item[1]}</td>
                  <td>{item[2]}</td>
                  <td>{item[5]}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>ปิด</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default DashboardStats;
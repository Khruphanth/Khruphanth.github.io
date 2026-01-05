import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { fetchSheetData, postAction } from '../services/api';
import { SHEET_NAMES } from '../config/config';

const Report = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // โหลดข้อมูล
  const loadReport = async () => {
    setLoading(true);
    try {
      // ดึงจาก SHOW ตามที่แจ้ง
      const rows = await fetchSheetData(SHEET_NAMES.SHOW || "SHOW");
      
      // Mapping ข้อมูล [0:รหัส, 1:ชื่อ, 2:ที่อยู่, 3:สถานะ, 4:หมายเหตุ]
      const items = rows.map((r, i) => ({
        id: i + 1,
        code: r[1] || "-",
        name: r[2] || "-",
        location: r[3] || "-",
        status: r[4] || "-",
        note: r[5] || "-"
      }));
      setData(items);
    } catch (err) {
      console.error(err);
      Swal.fire('Error', 'โหลดข้อมูลไม่สำเร็จ', 'error');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadReport();
  }, []);

  // --- ฟังก์ชันดาวน์โหลด (แก้ไขใหม่) ---
  const handleExport = async (format) => {
    Swal.fire({
      title: `กำลังสร้างไฟล์ ${format.toUpperCase()}...`,
      text: 'กรุณารอสักครู่ (อาจใช้เวลา 5-10 วินาที)',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    try {
      const res = await postAction(SHEET_NAMES.SHOW || "SHOW", "generateReport", { format });

      if (res && res.fileData) {
        // 1. แปลง Base64 แบบ WebSafe (-) (_) ให้เป็น Standard (+) (/)
        const base64 = res.fileData.replace(/-/g, '+').replace(/_/g, '/');
        
        // 2. แปลง Base64 เป็น Blob Object (วิธีนี้รองรับไฟล์ใหญ่ได้ดีกว่า)
        const byteCharacters = atob(base64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: "application/octet-stream" });

        // 3. สร้าง Link ดาวน์โหลดจาก Blob
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = res.fileName || `report.${format === 'doc' ? 'docx' : 'pdf'}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        Swal.fire('สำเร็จ', 'ดาวน์โหลดเอกสารแล้ว', 'success');
      } else {
        Swal.fire('ผิดพลาด', 'ไม่ได้รับข้อมูลไฟล์จาก Server', 'error');
      }
    } catch (e) {
      console.error(e);
      Swal.fire('ผิดพลาด', 'เกิดข้อผิดพลาดในการเชื่อมต่อ', 'error');
    }
  };

  return (
    <div className="card border-0 shadow-sm rounded-4">
      {/* Header */}
      <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
        <h5 className="fw-bold text-primary m-0">📄 รายงานสรุป</h5>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-secondary btn-sm" onClick={loadReport}>
            <i className="bi bi-arrow-clockwise"></i> รีเฟรช
          </button>
          <button className="btn btn-danger btn-sm" onClick={() => handleExport('pdf')}>
            <i className="bi bi-file-earmark-pdf me-1"></i> PDF
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => handleExport('doc')}>
            <i className="bi bi-file-earmark-word me-1"></i> Word
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="table-responsive p-3">
        <table className="table table-hover align-middle table-bordered">
          <thead className="table-light text-center">
            <tr>
              <th width="5%">ลำดับ</th>
              <th width="15%">หมายเลขครุภัณฑ์</th>
              <th width="25%">รายการ</th>
              <th width="15%">สภาพ</th>
              <th width="15%">สถานที่เก็บ</th>
              <th width="25%">หมายเหตุ</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" className="text-center p-4">กำลังโหลดข้อมูล...</td></tr>
            ) : data.length === 0 ? (
              <tr><td colSpan="6" className="text-center p-4 text-muted">ไม่พบข้อมูลรายงาน</td></tr>
            ) : (
              data.map((item, idx) => (
                <tr key={idx}>
                  <td className="text-center">{item.id}</td>
                  <td className="fw-bold text-primary">{item.code}</td>
                  <td>{item.name}</td>
                  <td className="text-center">
                    <span className={`badge ${
                      item.status === 'ใช้งานได้' ? 'bg-success' : 
                      item.status === 'ชำรุด' ? 'bg-danger' : 
                      item.status === 'เสื่อมสภาพ' ? 'bg-warning text-dark' : 'bg-secondary'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  <td>{item.location}</td>
                  <td>{item.note}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Report;
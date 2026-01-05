import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { fetchSheetData, postAction } from '../services/api';
import { SHEET_NAMES } from '../config/config';

const Report = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // โหลดข้อมูลรายงาน
  const loadReport = async () => {
    setLoading(true);
    try {
      // ดึงข้อมูลจาก Sheet (ใช้ REPORT หรือ SHOW หรือ DATA ตามที่คุณใช้งานจริง)
      // แนะนำใช้ DATA หากต้องการข้อมูลทั้งหมดเหมือนหน้าฐานข้อมูล
      const rows = await fetchSheetData(SHEET_NAMES.REPORT || "REPORT");
      
      // Map ข้อมูลตามคอลัมน์ [0:Code, 1:Name, 2:Location, 3:Status, 4:Detail/Note]
      const items = rows.map((r, i) => ({
        id: i + 1,        // ลำดับ
        code: r[0] || "-", // หมายเลขครุภัณฑ์
        name: r[1] || "-", // รายการ
        location: r[2] || "-", // สถานที่เก็บ
        status: r[3] || "-",   // สภาพ
        note: r[4] || "-"      // หมายเหตุ
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

  // ฟังก์ชันสร้างเอกสาร (PDF/Word)
  const handleExport = async (format) => {
    Swal.fire({
      title: `กำลังสร้างไฟล์ ${format.toUpperCase()}...`,
      text: 'กรุณารอสักครู่',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    try {
      const res = await postAction(SHEET_NAMES.SHOW || "SHOW", "generateReport", { format });

      if (res && res.fileData) {
        const link = document.createElement('a');
        link.href = `data:application/octet-stream;base64,${res.fileData}`;
        link.download = res.fileName || `report.${format === 'doc' ? 'docx' : 'pdf'}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        Swal.fire('สำเร็จ', 'ดาวน์โหลดเอกสารแล้ว', 'success');
      } else {
        Swal.fire('ผิดพลาด', 'ไม่สามารถสร้างเอกสารได้', 'error');
      }
    } catch (e) {
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

      {/* Table Content */}
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
                      item.status === 'ชำรุด' ? 'bg-danger' : 'bg-warning text-dark'
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
import React, { useState, useEffect } from 'react';
import { fetchScriptData } from '../services/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const Report = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetchScriptData("SHOW");
      if (Array.isArray(res)) {
        // กรองค่า #N/A และแถวว่างออกตามตัวอย่าง PDF ที่คุณส่งมา 
        const cleanData = res.filter(row => {
          const id = String(row["รหัสครุภัณฑ์"] || "");
          return id && id !== "รหัสครุภัณฑ์" && !id.includes("#N/A");
        });
        setData(cleanData);
      }
    } catch (err) { console.error("Load Data Error:", err); }
    setLoading(false);
  };

  // ฟังก์ชันโหลดฟอนต์จากไฟล์ในเครื่อง (public folder)
  const loadFont = async () => {
    const response = await fetch('/fonts/Sarabun-Regular.ttf');
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result.split(',')[1]);
      reader.readAsDataURL(blob);
    });
  };

  const exportPDF = async () => {
    setLoading(true);
    try {
      const doc = new jsPDF('p', 'mm', 'a4');

      // 1. ติดตั้งฟอนต์ไทย Sarabun 
      const fontBase64 = await loadFont();
      doc.addFileToVFS("Sarabun.ttf", fontBase64);
      doc.addFont("Sarabun.ttf", "Sarabun", "normal");
      doc.setFont("Sarabun");

      // 2. จัดรูปแบบหัวกระดาษตามต้นฉบับมหาวิทยาลัย 
      doc.setFontSize(16);
      doc.text("ใบรายงานสรุปข้อมูลครุภัณฑ์", 105, 18, { align: "center" });
      doc.setFontSize(12);
      doc.text("มหาวิทยาลัยเทคโนโลยีราชมงคลอีสาน วิทยาเขตขอนแก่น", 105, 25, { align: "center" });
      doc.setFontSize(10);
      doc.text("คณะครุศาสตร์อุตสาหกรรม / สาขาเทคนิคครุศาสตร์อุตสาหกรรม คอมพิวเตอร์", 105, 31, { align: "center" });
      
      doc.setLineWidth(0.1);
      doc.line(20, 35, 190, 35); // เส้นคั่นหัวกระดาษ

      // 3. กำหนดหัวตาราง [cite: 77, 101]
      const columns = [
        { header: 'ลำดับ', dataKey: 'index' },
        { header: 'รหัสครุภัณฑ์', dataKey: 'code' },
        { header: 'รายการครุภัณฑ์', dataKey: 'name' },
        { header: 'สถานที่เก็บ', dataKey: 'location' },
        { header: 'สถานะ', dataKey: 'status' }
      ];

      const rows = data.map((item, idx) => ({
        index: idx + 1,
        code: item["รหัสครุภัณฑ์"],
        name: item["ชื่อครุภัณฑ์"],
        location: item["ที่เก็บ"] || "-",
        status: item["สถานะ"] || "ปกติ"
      }));

      // 4. วาดตาราง (รองรับการขึ้นหน้าใหม่และแสดงหัวตารางซ้ำอัตโนมัติ) 
      autoTable(doc, {
        startY: 40,
        columns: columns,
        body: rows,
        theme: 'grid',
        styles: { font: "Sarabun", fontSize: 9, cellPadding: 2 },
        headStyles: { 
          fillColor: [245, 245, 245], 
          textColor: 0, 
          font: "Sarabun", 
          halign: 'center',
          lineWidth: 0.1 
        },
        columnStyles: {
          index: { halign: 'center', cellWidth: 12 },
          code: { cellWidth: 45 },
          status: { halign: 'center', cellWidth: 20 }
        },
        didDrawPage: (d) => {
          // ใส่เลขหน้าด้านล่าง 
          doc.setFontSize(8);
          doc.text(`หน้า ${doc.internal.getNumberOfPages()}`, 190, 287, { align: 'right' });
        }
      });

      // 5. ส่วนลงนามท้ายรายงาน (วาดเฉพาะหน้าสุดท้าย) [cite: 71, 72]
      const finalY = doc.lastAutoTable.finalY + 15;
      if (finalY < 250) {
        doc.setFontSize(11);
        doc.text("ลงชื่อ......................................................ผู้รายงาน", 130, finalY);
        doc.text("(......................................................)", 130, finalY + 8);
      }

      doc.save(`Report_Asset_${Date.now()}.pdf`);
    } catch (error) {
      console.error("PDF Export Error:", error);
      alert("ไม่พบไฟล์ฟอนต์ใน public/fonts/ หรือเกิดข้อผิดพลาดในการสร้างไฟล์");
    }
    setLoading(false);
  };

  return (
    <div className="container mt-4">
      <div className="card shadow-sm border-0">
        <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
          <h5 className="mb-0 fw-bold text-primary">ระบบออกใบรายงานครุภัณฑ์</h5>
          <button 
            className="btn btn-success px-4 shadow-sm" 
            onClick={exportPDF} 
            disabled={loading || data.length === 0}
          >
            {loading ? (
              <><span className="spinner-border spinner-border-sm me-2"></span>กำลังเตรียมไฟล์...</>
            ) : 'ดาวน์โหลด PDF (ไทย)'}
          </button>
        </div>

        <div className="card-body">
          {/* ส่วนพรีวิวตารางบนเว็บ [cite: 77, 101] */}
          <div className="table-responsive" style={{ maxHeight: '550px' }}>
            <table className="table table-hover align-middle border">
              <thead className="table-light sticky-top">
                <tr className="text-center">
                  <th>ลำดับ</th>
                  <th>รหัสครุภัณฑ์</th>
                  <th>ชื่อครุภัณฑ์</th>
                  <th>สถานะ</th>
                </tr>
              </thead>
              <tbody>
                {data.length > 0 ? (
                  data.map((row, idx) => (
                    <tr key={idx}>
                      <td className="text-center text-muted">{idx + 1}</td>
                      <td className="fw-medium">{row["รหัสครุภัณฑ์"]}</td>
                      <td>{row["ชื่อครุภัณฑ์"]}</td>
                      <td className="text-center">
                        <span className={`badge ${row["สถานะ"] === 'ชำรุด' ? 'bg-danger' : 'bg-success'}`}>
                          {row["สถานะ"] || 'ปกติ'}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="4" className="text-center py-5 text-muted">กำลังดึงข้อมูลจากระบบ...</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Report;
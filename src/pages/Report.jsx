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
        // กรองแถวที่มีค่า #N/A หรือ รหัสว่างออก 
        const cleanData = res.filter(row => {
          const id = String(row["รหัสครุภัณฑ์"] || "");
          const name = String(row["ชื่อครุภัณฑ์"] || "");
          return id && id !== "รหัสครุภัณฑ์" && !id.includes("#") && !name.includes("#");
        });
        setData(cleanData);
      }
    } catch (err) { console.error(err); }
    setLoading(false);
  };

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
      const fontBase64 = await loadFont();

      // ลงทะเบียนฟอนต์
      doc.addFileToVFS("Sarabun.ttf", fontBase64);
      doc.addFont("Sarabun.ttf", "Sarabun", "normal");
      doc.setFont("Sarabun");

      // หัวกระดาษ (พิมพ์ภาษาไทย) [cite: 75, 76]
      doc.setFontSize(18);
      doc.text("ใบรายงานสรุปข้อมูลครุภัณฑ์", 105, 15, { align: "center" });
      doc.setFontSize(12);
      doc.text("มหาวิทยาลัยเทคโนโลยีราชมงคลอีสาน วิทยาเขตขอนแก่น", 105, 22, { align: "center" });
      doc.setFontSize(10);
      doc.text("คณะครุศาสตร์อุตสาหกรรม / สาขาเทคนิคครุศาสตร์อุตสาหกรรม คอมพิวเตอร์", 105, 28, { align: "center" });

      // ตาราง [cite: 77, 79, 81]
      autoTable(doc, {
        startY: 35,
        head: [['ลำดับ', 'รหัสครุภัณฑ์', 'รายการครุภัณฑ์', 'สถานที่เก็บ', 'สถานะ']],
        body: data.map((item, idx) => [
          idx + 1,
          item["รหัสครุภัณฑ์"],
          item["ชื่อครุภัณฑ์"],
          item["ที่เก็บ"] || "-",
          item["สถานะ"] || "ปกติ"
        ]),
        theme: 'grid',
        // ตั้งค่าฟอนต์ไทยให้ "ทั้งตาราง" (รวมหัวตาราง) 
        styles: { font: "Sarabun", fontSize: 10, cellPadding: 2 },
        headStyles: { 
          font: "Sarabun", // แก้ปัญหาเอเลี่ยนที่หัวตาราง
          fillColor: [240, 240, 240], 
          textColor: 0, 
          halign: 'center' 
        },
        columnStyles: {
          0: { halign: 'center', cellWidth: 12 },
          1: { cellWidth: 45 },
          4: { halign: 'center', cellWidth: 20 }
        },
        didDrawPage: (d) => {
          doc.setFontSize(8);
          doc.text(`หน้า ${doc.internal.getNumberOfPages()}`, 190, 285, { align: 'right' });
        }
      });

      // ส่วนลงนาม (ท้ายเอกสาร) 
      const finalY = doc.lastAutoTable.finalY + 15;
      if (finalY < 260) {
        doc.setFontSize(12);
        doc.text("ลงชื่อ......................................................ผู้รายงาน", 130, finalY);
        doc.text("(......................................................)", 130, finalY + 8);
      }

      doc.save(`รายงานครุภัณฑ์_${Date.now()}.pdf`);
    } catch (error) {
      alert("เกิดข้อผิดพลาด: " + error.message);
    }
    setLoading(false);
  };

  return (
    <div className="container mt-4">
      <div className="card shadow-sm border-0">
        <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
          <h5 className="mb-0 fw-bold">ใบรายงานสรุปข้อมูลครุภัณฑ์</h5>
          <button className="btn btn-primary px-4" onClick={exportPDF} disabled={loading}>
            {loading ? 'กำลังโหลดฟอนต์...' : 'ดาวน์โหลด PDF (ไทย)'}
          </button>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive" style={{ maxHeight: '600px' }}>
            <table className="table table-hover m-0">
              <thead className="table-light sticky-top">
                <tr className="text-center">
                  <th>ลำดับ</th>
                  <th>รหัสครุภัณฑ์</th>
                  <th>ชื่อครุภัณฑ์</th>
                  <th>สถานะ</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row, idx) => (
                  <tr key={idx}>
                    <td className="text-center">{idx + 1}</td>
                    <td>{row["รหัสครุภัณฑ์"]}</td>
                    <td>{row["ชื่อครุภัณฑ์"]}</td>
                    <td className="text-center">
                      <span className={`badge ${row["สถานะ"] === 'ชำรุด' ? 'bg-danger' : 'bg-success'}`}>
                        {row["สถานะ"] || 'ปกติ'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Report;
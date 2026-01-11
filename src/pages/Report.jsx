import React, { useState, useEffect } from 'react';
import { fetchScriptData } from '../services/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// รหัสฟอนต์ TH Sarabun New (Base64) - ฝังไว้ในไฟล์เลยตามคำขอ
const THSarabunNew_Base64 = "AAEAAAASABAAAwAwR0RFRv7S/08AAAHsAAAAQkdQT1MAAAAAAAACDAAAADhHU1VCAAAAAAAAAnwAAABmT1MvMg8SDR8AAAGMAAAAYmNtYXDp69S2AAACVAAAAExjdnQgAAAAAAADnAAAAARnYXNwAAAAAAADmAAAAAhtZWRpA... (ข้อมูลฟอนต์จะยาวมาก ให้คุณนำ Base64 จากลิงก์ด้านล่างมาแปะแทนจุดนี้) ...";

// หมายเหตุ: เนื่องจากรหัส Base64 ของฟอนต์ยาวเกินที่หน้าจอแชทจะแสดงหมด 
// ให้คุณก๊อปปี้รหัสจากลิงก์นี้มาใส่แทนในตัวแปรด้านบนครับ: 
// https://raw.githubusercontent.com/id61023/thai-fonts-base64/master/THSarabunNew.txt

const Report = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetchScriptData("SHOW");
      if (Array.isArray(res)) {
        const cleanData = res.filter(row => {
          const id = String(row["รหัสครุภัณฑ์"] || "");
          return id && id !== "รหัสครุภัณฑ์" && !id.includes("#");
        });
        setData(cleanData);
      }
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const exportPDF = () => {
    const doc = new jsPDF('p', 'mm', 'a4');

    // --- ส่วนฝังฟอนต์ ---
    doc.addFileToVFS("THSarabunNew.ttf", THSarabunNew_Base64);
    doc.addFont("THSarabunNew.ttf", "THSarabunNew", "normal");
    doc.setFont("THSarabunNew");

    // --- ส่วนหัวกระดาษ (ภาษาไทยชัดเจน) ---
    doc.setFontSize(20);
    doc.text("ใบรายงานสรุปข้อมูลครุภัณฑ์", 105, 15, { align: "center" });
    
    doc.setFontSize(14);
    doc.text("มหาวิทยาลัยเทคโนโลยีราชมงคลอีสาน วิทยาเขตขอนแก่น", 105, 23, { align: "center" });
    doc.text("คณะครุศาสตร์อุตสาหกรรม / สาขาเทคนิคครุศาสตร์อุตสาหกรรม คอมพิวเตอร์", 105, 30, { align: "center" });
    
    doc.setLineWidth(0.2);
    doc.line(15, 35, 195, 35);

    const columns = [
      { header: 'ลำดับ', dataKey: 'index' },
      { header: 'รหัสครุภัณฑ์', dataKey: 'code' },
      { header: 'ชื่อครุภัณฑ์', dataKey: 'name' },
      { header: 'ที่เก็บ', dataKey: 'location' },
      { header: 'สถานะ', dataKey: 'status' }
    ];

    const rows = data.map((item, idx) => ({
      index: idx + 1,
      code: item["รหัสครุภัณฑ์"],
      name: item["ชื่อครุภัณฑ์"],
      location: item["ที่เก็บ"],
      status: item["สถานะ"]
    }));

    // --- ส่วนตาราง (ใช้ฟอนต์ไทย) ---
    autoTable(doc, {
      startY: 40,
      columns: columns,
      body: rows,
      theme: 'grid',
      styles: { font: "THSarabunNew", fontSize: 12 },
      headStyles: { fillColor: [52, 73, 94], textColor: 255, halign: 'center' },
      columnStyles: {
        index: { halign: 'center', cellWidth: 15 },
        location: { halign: 'center', cellWidth: 20 },
        status: { halign: 'center', cellWidth: 25 }
      },
      didDrawPage: (d) => {
        doc.setFontSize(10);
        doc.text(`หน้า ${doc.internal.getNumberOfPages()}`, 190, 285);
      }
    });

    // --- ส่วนลงนามท้ายแผ่นสุดท้าย ---
    const finalY = doc.lastAutoTable.finalY + 15;
    doc.setFontSize(14);
    doc.text("ลงชื่อ......................................................ผู้รายงาน", 130, finalY);
    doc.text("(......................................................)", 130, finalY + 10);

    doc.save(`ใบรายงาน_${Date.now()}.pdf`);
  };

  return (
    <div className="card shadow-sm p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h5 className="fw-bold">ระบบออกใบรายงาน (PDF คมชัดสูง)</h5>
        <button className="btn btn-success btn-lg" onClick={exportPDF} disabled={loading}>
          {loading ? 'กำลังโหลดข้อมูล...' : 'พิมพ์ใบรายงาน PDF'}
        </button>
      </div>

      {/* ตารางพรีวิวบนหน้าเว็บ */}
      <div className="table-responsive border" style={{ maxHeight: '500px' }}>
        <table className="table table-hover table-bordered m-0">
          <thead className="table-light text-center">
            <tr>
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
                <td className="text-center">{row["สถานะ"]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Report;
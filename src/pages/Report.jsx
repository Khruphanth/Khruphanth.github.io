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
        // กรองข้อมูลขยะและค่า #N/A ออกให้หมด
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
    try {
      const response = await fetch('/fonts/Sarabun-Regular.ttf');
      if (!response.ok) throw new Error("File not found");
      const arrayBuffer = await response.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      let binary = '';
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      return window.btoa(binary);
    } catch (e) {
      console.error("Font loading failed", e);
      return null;
    }
  };

  const exportPDF = async () => {
    setLoading(true);
    const fontBase64 = await loadFont();
    
    if (!fontBase64) {
      alert("ไม่พบไฟล์ฟอนต์ใน public/fonts/Sarabun-Regular.ttf");
      setLoading(false);
      return;
    }

    try {
      const doc = new jsPDF('p', 'mm', 'a4');

      // 1. ลงทะเบียนฟอนต์และตั้งค่าเป็น Default ของทั้งเอกสาร
      doc.addFileToVFS("Sarabun.ttf", fontBase64);
      doc.addFont("Sarabun.ttf", "Sarabun", "normal");
      doc.setFont("Sarabun"); // บังคับใช้ฟอนต์นี้ทันที

      // 2. พิมพ์หัวข้อกระดาษ
      doc.setFontSize(18);
      doc.text("ใบรายงานสรุปข้อมูลครุภัณฑ์", 105, 15, { align: "center" });
      doc.setFontSize(12);
      doc.text("มหาวิทยาลัยเทคโนโลยีราชมงคลอีสาน วิทยาเขตขอนแก่น", 105, 22, { align: "center" });

      // 3. วาดตารางโดยใช้ฟังก์ชัน autoTable (วิธีนี้ชัวร์ที่สุด)
      autoTable(doc, {
        startY: 30,
        head: [['ลำดับ', 'รหัสครุภัณฑ์', 'รายการครุภัณฑ์', 'สถานที่เก็บ', 'สถานะ']],
        body: data.map((item, idx) => [
          idx + 1,
          item["รหัสครุภัณฑ์"],
          item["ชื่อครุภัณฑ์"],
          item["ที่เก็บ"] || "-",
          item["สถานะ"] || "ปกติ"
        ]),
        // บังคับฟอนต์ "Sarabun" ในทุกส่วนของตาราง
        styles: { 
          font: "Sarabun", 
          fontSize: 10,
          halign: 'left'
        },
        headStyles: { 
          font: "Sarabun", // บังคับฟอนต์ที่หัวตาราง
          fontStyle: 'normal', // ป้องกันมันเปลี่ยนเป็น Bold แล้วหาฟอนต์ไม่เจอ
          fillColor: [240, 240, 240], 
          textColor: 0,
          halign: 'center'
        },
        theme: 'grid',
        didDrawPage: (d) => {
          doc.setFontSize(8);
          doc.text(`หน้า ${doc.internal.getNumberOfPages()}`, 190, 285, { align: 'right' });
        }
      });

      doc.save(`Report_${Date.now()}.pdf`);
    } catch (error) {
      console.error(error);
      alert("เกิดข้อผิดพลาดในการสร้าง PDF");
    }
    setLoading(false);
  };

  return (
    <div className="p-5 text-center">
      <h4 className="mb-4">ออกรายงานครุภัณฑ์ (คมชัดสูง)</h4>
      <button className="btn btn-success btn-lg" onClick={exportPDF} disabled={loading || !data.length}>
        {loading ? 'กำลังประมวลผลฟอนต์...' : 'ดาวน์โหลด PDF'}
      </button>
    </div>
  );
};

export default Report;
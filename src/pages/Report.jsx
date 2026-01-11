import React, { useState, useEffect, useRef } from 'react';
import { fetchScriptData } from '../services/api'; 
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const Report = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const reportRef = useRef();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetchScriptData("SHOW"); 
      if (Array.isArray(res)) {
        // กรองค่า Error ออกจากระบบ
        const cleanData = res.filter(row => {
          const id = String(row["รหัสครุภัณฑ์"] || "");
          return id && id !== "รหัสครุภัณฑ์" && !id.includes("#");
        });
        setData(cleanData);
      }
    } catch (err) {
      console.error("Load data error:", err);
    }
    setLoading(false);
  };

  const exportPDF = async () => {
    setLoading(true);
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const itemsPerPage = 18; // กำหนดจำนวนแถวต่อหน้า (ปรับตัวเลขนี้เพื่อให้พอดีกับท้ายกระดาษ)
      const totalPages = Math.ceil(data.length / itemsPerPage);

      for (let i = 0; i < totalPages; i++) {
        // สร้างข้อมูลเฉพาะส่วนของหน้านั้นๆ
        const start = i * itemsPerPage;
        const end = start + itemsPerPage;
        const pageItems = data.slice(start, end);

        // สร้าง Element ชั่วคราวสำหรับแต่ละหน้าเพื่อความคมชัดและเส้นตารางไม่หาย
        const pageElement = document.createElement('div');
        pageElement.style.width = '210mm';
        pageElement.style.padding = '20mm';
        pageElement.style.background = 'white';
        pageElement.innerHTML = renderPageHTML(pageItems, i + 1, totalPages, start);
        
        document.body.appendChild(pageElement);
        
        const canvas = await html2canvas(pageElement, { 
          scale: 2,
          useCORS: true,
          logging: false 
        });
        
        const imgData = canvas.toDataURL('image/jpeg', 1.0);
        
        if (i > 0) pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297);
        
        document.body.removeChild(pageElement);
      }

      pdf.save(`ใบรายงานครุภัณฑ์_${new Date().getTime()}.pdf`);
    } catch (err) {
      console.error("PDF Export Error:", err);
    }
    setLoading(false);
  };

  // ฟังก์ชันสร้างโครงสร้าง HTML สำหรับแต่ละหน้า (ใบรายงานทางการ)
  const renderPageHTML = (items, pageNum, totalPages, startIndex) => {
    const rows = items.map((row, index) => `
      <tr>
        <td style="border: 1px solid black; text-align: center; padding: 5px;">${startIndex + index + 1}</td>
        <td style="border: 1px solid black; text-align: left; padding: 5px;">${row["รหัสครุภัณฑ์"] || ""}</td>
        <td style="border: 1px solid black; text-align: left; padding: 5px;">${row["ชื่อครุภัณฑ์"] || ""}</td>
        <td style="border: 1px solid black; text-align: center; padding: 5px;">${row["ที่เก็บ"] || ""}</td>
        <td style="border: 1px solid black; text-align: center; padding: 5px;">${row["สถานะ"] || ""}</td>
        <td style="border: 1px solid black; text-align: left; padding: 5px;">${row["รายละเอียดเพิ่มเติม"] || ""}</td>
      </tr>
    `).join('');

    return `
      <div style="font-family: 'Sarabun', sans-serif; color: black;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h3 style="margin: 0;">ใบรายงานสรุปข้อมูลครุภัณฑ์</h3>
          <p style="margin: 5px 0;">มหาวิทยาลัยเทคโนโลยีราชมงคลอีสาน วิทยาเขตขอนแก่น</p>
          <p style="margin: 5px 0;">คณะครุศาสตร์อุตสาหกรรม | สาขาเทคนิคครุศาสตร์อุตสาหกรรม คอมพิวเตอร์</p>
          <div style="border-bottom: 2px solid black; width: 100px; margin: 10px auto;"></div>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 14px;">
          <span>วันที่ออกเอกสาร: ${new Date().toLocaleDateString('th-TH')}</span>
          <span>หน้า ${pageNum} จาก ${totalPages}</span>
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <thead>
            <tr style="background-color: #eee;">
              <th style="border: 1px solid black; padding: 8px;">ลำดับ</th>
              <th style="border: 1px solid black; padding: 8px;">รหัสครุภัณฑ์</th>
              <th style="border: 1px solid black; padding: 8px;">รายการ / ชื่อครุภัณฑ์</th>
              <th style="border: 1px solid black; padding: 8px;">สถานที่เก็บ</th>
              <th style="border: 1px solid black; padding: 8px;">สถานะ</th>
              <th style="border: 1px solid black; padding: 8px;">หมายเหตุ</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
        ${pageNum === totalPages ? `
          <div style="margin-top: 30px; text-align: right; padding-right: 20px;">
            <p style="margin-bottom: 40px;">ลงชื่อ......................................................ผู้รายงาน</p>
            <p>(......................................................)</p>
            <p>ตำแหน่ง......................................................</p>
          </div>
        ` : ''}
      </div>
    `;
  };

  return (
    <div className="card shadow-sm p-4 text-center">
      <h5 className="mb-4">ออกใบรายงานครุภัณฑ์ (มทร.อีสาน)</h5>
      <div className="alert alert-info">พบข้อมูลที่พร้อมออกรายงานทั้งหมด {data.length} รายการ</div>
      <button className="btn btn-primary btn-lg" onClick={exportPDF} disabled={loading || data.length === 0}>
        {loading ? 'กำลังสร้างไฟล์ PDF...' : 'ดาวน์โหลดใบรายงาน PDF'}
      </button>
    </div>
  );
};

export default Report;
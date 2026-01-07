import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { AuthService } from '../services/auth';

const Login = () => {
  const navigate = useNavigate();
  const [inputs, setInputs] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const res = await AuthService.login(inputs.username, inputs.password);
    
    setLoading(false);

    if (res.success) {
      Swal.fire({
        icon: 'success',
        title: `ยินดีต้อนรับ ${res.user.name}`,
        timer: 1500,
        showConfirmButton: false
      }).then(() => {
        // 🔥 แก้ไขตรงนี้: ให้ทั้ง sadmin และ admin ไปที่หน้า /admin
        if (res.user.role === 'admin' || res.user.role === 'sadmin') {
          navigate('/admin');
        } else {
          navigate('/user');
        }
      });
    } else {
      Swal.fire('ผิดพลาด', res.message, 'error');
    }
  };

  return (
    <div className="d-flex align-items-center justify-content-center min-vh-100 bg-light">
      <div className="card shadow border-0" style={{ maxWidth: '400px', width: '100%' }}>
        <div className="card-header bg-primary text-white text-center py-4">
          <h4 className="mb-0"><i className="bi bi-shield-lock"></i> เข้าสู่ระบบ</h4>
        </div>
        <div className="card-body p-4">
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">ชื่อผู้ใช้งาน</label>
              <input 
                type="text" 
                className="form-control" 
                value={inputs.username}
                onChange={(e) => setInputs({...inputs, username: e.target.value})}
                required 
              />
            </div>
            <div className="mb-4">
              <label className="form-label">รหัสผ่าน</label>
              <input 
                type="password" 
                className="form-control" 
                value={inputs.password}
                onChange={(e) => setInputs({...inputs, password: e.target.value})}
                required 
              />
            </div>
            <button type="submit" className="btn btn-primary w-100 py-2" disabled={loading}>
              {loading ? 'กำลังตรวจสอบ...' : 'เข้าสู่ระบบ'}
            </button>
          </form>
          <div className="text-center mt-3">
            <button className="btn btn-link text-decoration-none text-muted" onClick={() => navigate('/')}>
              <i className="bi bi-arrow-left"></i> กลับหน้าหลัก
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
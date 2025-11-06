import React, { useState, useEffect } from 'react';
import { Calendar, Users, Building2, Plus, Trash2, UserCheck, Search, Lock, Unlock, Eye, Share2, Copy, CheckCircle, Zap } from 'lucide-react';
import './App.css';

export default function App() {
  const [branches, setBranches] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [viewMode, setViewMode] = useState('calendar');
  const [isLoading, setIsLoading] = useState(true);
  const [userMode, setUserMode] = useState('admin');
  const [currentEmployee, setCurrentEmployee] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);
  const [copiedEmployee, setCopiedEmployee] = useState('');
  
  const [newBranch, setNewBranch] = useState('');
  const [newEmployee, setNewEmployee] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedBranches, setSelectedBranches] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const loadData = () => {
      setIsLoading(true);
      
      const urlParams = new URLSearchParams(window.location.search);
      const empParam = urlParams.get('emp');
      
      try {
        const branchesData = localStorage.getItem('schedule_branches');
        const employeesData = localStorage.getItem('schedule_employees');
        const schedulesData = localStorage.getItem('schedule_data');

        if (branchesData) {
          setBranches(JSON.parse(branchesData));
        }
        if (employeesData) {
          const empList = JSON.parse(employeesData);
          setEmployees(empList);
          
          if (empParam && empList.includes(decodeURIComponent(empParam))) {
            setUserMode('employee');
            setCurrentEmployee(decodeURIComponent(empParam));
          }
        }
        if (schedulesData) {
          setSchedules(JSON.parse(schedulesData));
        }
      } catch (error) {
        console.log('เริ่มต้นใช้งานครั้งแรก');
      }
      setIsLoading(false);
    };

    loadData();
    const today = new Date().toISOString().split('T')[0];
    setSelectedDate(today);
  }, []);

  useEffect(() => {
    if (!isLoading && userMode === 'admin') {
      try {
        localStorage.setItem('schedule_branches', JSON.stringify(branches));
        localStorage.setItem('schedule_employees', JSON.stringify(employees));
        localStorage.setItem('schedule_data', JSON.stringify(schedules));
      } catch (error) {
        console.error('ข้อผิดพลาดในการบันทึก:', error);
      }
    }
  }, [branches, employees, schedules, isLoading, userMode]);

  const switchToEmployeeMode = () => {
    if (employees.length === 0) {
      alert('กรุณาเพิ่มพนักงานก่อน');
      return;
    }
    setUserMode('employee');
    setCurrentEmployee('');
  };

  const switchToAdminMode = () => {
    setUserMode('admin');
    setCurrentEmployee('');
    window.history.replaceState({}, '', window.location.pathname);
  };

  const generateEmployeeLink = (employeeName) => {
    const baseUrl = window.location.origin + window.location.pathname;
    return `${baseUrl}?emp=${encodeURIComponent(employeeName)}`;
  };

  const copyToClipboard = (text, employeeName) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedEmployee(employeeName);
      setTimeout(() => setCopiedEmployee(''), 2000);
    });
  };

  const addBranch = () => {
    if (newBranch.trim() && !branches.includes(newBranch.trim())) {
      setBranches([...branches, newBranch.trim()]);
      setNewBranch('');
    }
  };

  const addEmployee = () => {
    if (newEmployee.trim() && !employees.includes(newEmployee.trim())) {
      setEmployees([...employees, newEmployee.trim()]);
      setNewEmployee('');
    }
  };

  const removeBranch = (branch) => {
    setBranches(branches.filter(b => b !== branch));
    setSchedules(schedules.filter(s => s.branch !== branch));
  };

  const removeEmployee = (employee) => {
    setEmployees(employees.filter(e => e !== employee));
    setSchedules(schedules.filter(s => s.employee !== employee));
  };

  const toggleBranchSelection = (branch) => {
    if (selectedBranches.includes(branch)) {
      setSelectedBranches(selectedBranches.filter(b => b !== branch));
    } else {
      setSelectedBranches([...selectedBranches, branch]);
    }
  };

  const addSchedule = () => {
    if (!selectedDate || selectedBranches.length === 0 || !selectedEmployee) {
      alert('กรุณาเลือกวันที่ สาขา และพนักงาน');
      return;
    }

    const existingSchedules = schedules.filter(
      s => s.date === selectedDate && s.employee === selectedEmployee
    );

    const duplicateBranches = selectedBranches.filter(branch => 
      existingSchedules.some(s => s.branch === branch)
    );

    if (existingSchedules.length > 0) {
      const existingBranchList = existingSchedules.map(s => s.branch).join(', ');
      const newBranchList = selectedBranches.join(', ');
      
      let message = `⚠️ คำเตือน! พนักงานซ้ำกัน\n\n`;
      message += `พนักงาน: "${selectedEmployee}"\n`;
      message += `วันที่: ${new Date(selectedDate + 'T00:00:00').toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}\n\n`;
      message += `📍 มีตารางงานอยู่แล้วที่สาขา:\n${existingBranchList}\n\n`;
      message += `🆕 ต้องการเพิ่มที่สาขา:\n${newBranchList}\n\n`;
      
      if (duplicateBranches.length > 0) {
        message += `❌ สาขาที่ซ้ำกัน:\n${duplicateBranches.join(', ')}\n\n`;
      }
      
      message += `❓ คุณต้องการให้พนักงานคนนี้ทำงานหลายสาขาในวันเดียวกันหรือไม่?`;
      
      const confirmAdd = window.confirm(message);
      
      if (!confirmAdd) {
        return;
      }
    }

    const newSchedules = [];
    const skippedBranches = [];
    
    selectedBranches.forEach(branch => {
      const isDuplicate = schedules.some(
        s => s.date === selectedDate && s.employee === selectedEmployee && s.branch === branch
      );

      if (!isDuplicate) {
        newSchedules.push({
          id: Date.now() + Math.random(),
          date: selectedDate,
          branch: branch,
          employee: selectedEmployee
        });
      } else {
        skippedBranches.push(branch);
      }
    });

    if (newSchedules.length > 0) {
      setSchedules([...schedules, ...newSchedules]);
      
      const dateFormatted = new Date(selectedDate + 'T00:00:00').toLocaleDateString('th-TH', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      
      let resultMessage = `✅ เพิ่มตารางงานสำเร็จ!\n\n`;
      resultMessage += `👤 พนักงาน: ${selectedEmployee}\n`;
      resultMessage += `📅 วันที่: ${dateFormatted}\n`;
      resultMessage += `🏢 สาขาที่เพิ่ม: ${newSchedules.map(s => s.branch).join(', ')} (${newSchedules.length} สาขา)\n`;
      
      if (skippedBranches.length > 0) {
        resultMessage += `\n⚠️ ข้ามสาขาที่มีอยู่แล้ว: ${skippedBranches.join(', ')}`;
      }
      
      const totalBranchesAfter = schedules.filter(
        s => s.date === selectedDate && s.employee === selectedEmployee
      ).length + newSchedules.length;
      
      if (totalBranchesAfter > 1) {
        resultMessage += `\n\n📊 สรุป: พนักงานคนนี้มีตารางงาน ${totalBranchesAfter} สาขาในวันนี้`;
      }
      
      alert(resultMessage);
      
      setSelectedBranches([]);
      setSelectedEmployee('');
    } else {
      alert('❌ ไม่สามารถเพิ่มได้\n\nพนักงานคนนี้อยู่ในสาขาที่เลือกทั้งหมดในวันนี้แล้ว!');
    }
  };

  const removeSchedule = (id) => {
    setSchedules(schedules.filter(s => s.id !== id));
  };

  const getSchedulesByDate = (date) => {
    return schedules.filter(s => s.date === date);
  };

  const getEmployeeSchedules = (empName = null) => {
    const targetEmployee = empName || currentEmployee;
    if (userMode === 'employee' && targetEmployee) {
      return schedules.filter(s => s.employee === targetEmployee)
        .sort((a, b) => new Date(a.date) - new Date(b.date));
    }
    
    const result = {};
    employees.forEach(emp => {
      result[emp] = schedules.filter(s => s.employee === emp)
        .sort((a, b) => new Date(a.date) - new Date(b.date));
    });
    return result;
  };

  const getBranchSchedules = () => {
    const result = {};
    branches.forEach(branch => {
      result[branch] = schedules.filter(s => s.branch === branch)
        .sort((a, b) => new Date(a.date) - new Date(b.date));
    });
    return result;
  };

  const getUniqueDates = () => {
    const dates = [...new Set(schedules.map(s => s.date))];
    return dates.sort();
  };

  const filteredEmployees = employees.filter(emp => 
    emp.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredBranches = branches.filter(branch => 
    branch.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="text-center">
          <div className="spinner"></div>
          <p className="loading-text">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  if (userMode === 'employee' && !currentEmployee) {
    return (
      <div className="employee-select-screen">
        <div className="employee-select-container">
          <div className="employee-select-card">
            <div className="text-center mb-8">
              <div className="icon-circle">
                <Users size={40} />
              </div>
              <h1 className="title">เลือกชื่อของคุณ</h1>
              <p className="subtitle">เพื่อดูตารางงานของคุณ</p>
            </div>

            <div className="employee-list">
              {employees.map(emp => (
                <button
                  key={emp}
                  onClick={() => setCurrentEmployee(emp)}
                  className="employee-button"
                >
                  {emp}
                </button>
              ))}
            </div>

            <button onClick={switchToAdminMode} className="back-button">
              <Unlock size={20} />
              กลับสู่โหมดผู้จัดการ
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (userMode === 'employee' && currentEmployee) {
    const mySchedules = getEmployeeSchedules(currentEmployee);
    
    return (
      <div className="employee-view-screen">
        <div className="container">
          <div className="card header-card">
            <div className="header-content">
              <div className="header-left">
                <div className="icon-circle-green">
                  <Eye size={32} />
                </div>
                <div>
                  <h1 className="main-title">สวัสดี, {currentEmployee}</h1>
                  <p className="subtitle">นี่คือตารางงานของคุณ</p>
                </div>
              </div>
              <button onClick={() => setCurrentEmployee('')} className="change-button">
                เปลี่ยนพนักงาน
              </button>
            </div>
            <div className="badge-container">
              <span className="badge badge-green">โหมดพนักงาน</span>
              <span className="badge badge-yellow">ไม่สามารถแก้ไขได้</span>
            </div>
          </div>

          {mySchedules.length > 0 ? (
            <div className="schedule-list">
              {mySchedules.map(schedule => {
                const dateObj = new Date(schedule.date + 'T00:00:00');
                const thaiDate = dateObj.toLocaleDateString('th-TH', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  weekday: 'long'
                });
                
                return (
                  <div key={schedule.id} className="schedule-card">
                    <div className="schedule-date">
                      <Calendar size={24} />
                      <h3>{thaiDate}</h3>
                    </div>
                    <div className="schedule-branch">
                      <Building2 size={24} />
                      <div>
                        <p className="label">สาขา</p>
                        <p className="branch-name">{schedule.branch}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-state">
              <Calendar size={64} />
              <p>ยังไม่มีตารางงานของคุณ</p>
            </div>
          )}

          <button onClick={switchToAdminMode} className="admin-button">
            <Unlock size={20} />
            กลับสู่โหมดผู้จัดการ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-screen">
      <div className="container">
        <div className="card header-card">
          <div className="header-content-admin">
            <div>
              <h1 className="main-title-admin">
                <Calendar size={40} />
                ระบบตารางงานหลายสาขา
              </h1>
              <p className="subtitle">จัดการตารางงานพนักงานแต่ละสาขา (เพิ่มหลายสาขาพร้อมกันได้)</p>
            </div>
            <div className="header-actions">
              <div className="save-badge">✓ บันทึกอัตโนมัติ</div>
              <button onClick={() => setShowShareModal(true)} className="share-button">
                <Share2 size={18} />
                แชร์ลิงค์พนักงาน
              </button>
              <button onClick={switchToEmployeeMode} className="employee-mode-button">
                <Lock size={18} />
                มุมมองพนักงาน
              </button>
            </div>
          </div>
        </div>

        {showShareModal && (
          <div className="modal-overlay" onClick={() => setShowShareModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2 className="modal-title">
                  <Share2 />
                  แชร์ลิงค์สำหรับพนักงาน
                </h2>
                <button onClick={() => setShowShareModal(false)} className="modal-close">
                  ×
                </button>
              </div>
              
              <p className="modal-description">
                คัดลอกลิงค์ด้านล่างเพื่อส่งให้พนักงานดูตารางงานของตัวเอง (พนักงานจะไม่สามารถแก้ไขข้อมูลได้)
              </p>
              
              <div className="link-list">
                {employees.map(emp => {
                  const link = generateEmployeeLink(emp);
                  const isCopied = copiedEmployee === emp;
                  
                  return (
                    <div key={emp} className="link-item">
                      <div className="link-header">
                        <span className="employee-name">
                          <Users size={18} />
                          {emp}
                        </span>
                        <button
                          onClick={() => copyToClipboard(link, emp)}
                          className={isCopied ? 'copy-button copied' : 'copy-button'}
                        >
                          {isCopied ? (
                            <>
                              <CheckCircle size={18} />
                              คัดลอกแล้ว!
                            </>
                          ) : (
                            <>
                              <Copy size={18} />
                              คัดลอก
                            </>
                          )}
                        </button>
                      </div>
                      <input
                        type="text"
                        value={link}
                        readOnly
                        className="link-input"
                        onClick={(e) => e.target.select()}
                      />
                    </div>
                  );
                })}
              </div>

              {employees.length === 0 && (
                <div className="empty-state-small">
                  <Users size={48} />
                  <p>ยังไม่มีพนักงานในระบบ</p>
                </div>
              )}

              <button onClick={() => setShowShareModal(false)} className="modal-close-button">
                ปิด
              </button>
            </div>
          </div>
        )}

        <div className="grid-2">
          <div className="card">
            <h2 className="card-title">
              <Building2 />
              จัดการสาขา
            </h2>
            <div className="input-group">
              <input
                type="text"
                value={newBranch}
                onChange={(e) => setNewBranch(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addBranch()}
                placeholder="ชื่อสาขา"
                className="input"
              />
              <button onClick={addBranch} className="add-button">
                <Plus size={20} />
                เพิ่ม
              </button>
            </div>
            <div className="item-list">
              {branches.map(branch => (
                <div key={branch} className="item">
                  <span>{branch}</span>
                  <button onClick={() => removeBranch(branch)} className="delete-button">
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h2 className="card-title card-title-green">
              <Users />
              จัดการพนักงาน
            </h2>
            <div className="input-group">
              <input
                type="text"
                value={newEmployee}
                onChange={(e) => setNewEmployee(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addEmployee()}
                placeholder="ชื่อพนักงาน"
                className="input"
              />
              <button onClick={addEmployee} className="add-button add-button-green">
                <Plus size={20} />
                เพิ่ม
              </button>
            </div>
            <div className="item-list">
              {employees.map(emp => (
                <div key={emp} className="item item-green">
                  <span>{emp}</span>
                  <button onClick={() => removeEmployee(emp)} className="delete-button">
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="card-title card-title-purple">
            <Zap />
            เพิ่มตารางงาน (เร็ว - เลือกหลายสาขาพร้อมกัน)
          </h2>
          
          <div className="schedule-form">
            <div className="form-row">
              <div className="form-field">
                <label>วันที่</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="input"
                />
              </div>
              
              <div className="form-field">
                <label>พนักงาน</label>
                <select
                  value={selectedEmployee}
                  onChange={(e) => setSelectedEmployee(e.target.value)}
                  className="input"
                >
                  <option value="">เลือกพนักงาน</option>
                  {employees.map(emp => (
                    <option key={emp} value={emp}>{emp}</option>
                  ))}
                </select>
              </div>

              <div className="form-field-button">
                <button onClick={addSchedule} className="submit-button">
                  <Plus size={20} />
                  เพิ่มตาราง
                </button>
              </div>
            </div>

            <div className="branch-selection">
              <label className="branch-label">
                เลือกสาขา (คลิกเพื่อเลือกหลายสาขา) - เลือกแล้ว: {selectedBranches.length}
              </label>
              <div className="branch-grid">
                {branches.map(branch => (
                  <button
                    key={branch}
                    onClick={() => toggleBranchSelection(branch)}
                    className={selectedBranches.includes(branch) ? 'branch-button selected' : 'branch-button'}
                  >
                    {selectedBranches.includes(branch) && '✓ '}
                    {branch}
                  </button>
                ))}
              </div>
              {branches.length === 0 && (
                <p className="empty-message">กรุณาเพิ่มสาขาก่อน</p>
              )}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="view-tabs">
            <button
              onClick={() => setViewMode('calendar')}
              className={viewMode === 'calendar' ? 'tab active' : 'tab'}
            >
              ดูตามวัน
            </button>
            <button
              onClick={() => setViewMode('employee')}
              className={viewMode === 'employee' ? 'tab active tab-green' : 'tab'}
            >
              ดูตามพนักงาน
            </button>
            <button
              onClick={() => setViewMode('branch')}
              className={viewMode === 'branch' ? 'tab active tab-orange' : 'tab'}
            >
              ดูตามสาขา
            </button>
            {(viewMode === 'employee' || viewMode === 'branch') && (
              <div className="search-box">
                <Search size={20} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ค้นหา..."
                  className="search-input"
                />
              </div>
            )}
          </div>
        </div>

        {viewMode === 'calendar' && (
          <div className="view-content">
            {getUniqueDates().map(date => {
              const daySchedules = getSchedulesByDate(date);
              const dateObj = new Date(date + 'T00:00:00');
              const thaiDate = dateObj.toLocaleDateString('th-TH', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'long'
              });
              
              return (
                <div key={date} className="card">
                  <h3 className="date-header">{thaiDate}</h3>
                  <div className="branch-grid-view">
                    {branches.map(branch => {
                      const branchEmployees = daySchedules.filter(s => s.branch === branch);
                      return (
                        <div key={branch} className="branch-box">
                          <h4 className="branch-title">
                            <Building2 size={18} />
                            {branch}
                            <span className="count">({branchEmployees.length})</span>
                          </h4>
                          {branchEmployees.length > 0 ? (
                            <div className="employee-list-small">
                              {branchEmployees.map(schedule => (
                                <div key={schedule.id} className="employee-item">
                                  <span>{schedule.employee}</span>
                                  <button
                                    onClick={() => removeSchedule(schedule.id)}
                                    className="delete-button-small"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="empty-text">ไม่มีพนักงาน</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            {getUniqueDates().length === 0 && (
              <div className="empty-state">
                <p>ยังไม่มีตารางงาน</p>
              </div>
            )}
          </div>
        )}

        {viewMode === 'employee' && (
          <div className="view-content">
            {filteredEmployees.map(emp => {
              const empSchedules = getEmployeeSchedules()[emp];
              return (
                <div key={emp} className="card">
                  <h3 className="employee-header">
                    <Users />
                    {emp}
                  </h3>
                  {empSchedules.length > 0 ? (
                    <div className="schedule-grid">
                      {empSchedules.map(schedule => {
                        const dateObj = new Date(schedule.date + 'T00:00:00');
                        const thaiDate = dateObj.toLocaleDateString('th-TH', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        });
                        return (
                          <div key={schedule.id} className="schedule-item schedule-item-green">
                            <div className="schedule-item-content">
                              <div>
                                <p className="schedule-branch-name">{schedule.branch}</p>
                                <p className="schedule-date-small">{thaiDate}</p>
                              </div>
                              <button
                                onClick={() => removeSchedule(schedule.id)}
                                className="delete-button-small"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="empty-text">ยังไม่มีตารางงาน</p>
                  )}
                </div>
              );
            })}
            {filteredEmployees.length === 0 && (
              <div className="empty-state">
                <p>ไม่พบพนักงาน</p>
              </div>
            )}
          </div>
        )}

        {viewMode === 'branch' && (
          <div className="view-content">
            {filteredBranches.map(branch => {
              const branchSchedules = getBranchSchedules()[branch];
              return (
                <div key={branch} className="card">
                  <h3 className="branch-header">
                    <Building2 />
                    {branch}
                  </h3>
                  {branchSchedules.length > 0 ? (
                    <div className="schedule-grid">
                      {branchSchedules.map(schedule => {
                        const dateObj = new Date(schedule.date + 'T00:00:00');
                        const thaiDate = dateObj.toLocaleDateString('th-TH', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        });
                        return (
                          <div key={schedule.id} className="schedule-item schedule-item-orange">
                            <div className="schedule-item-content">
                              <div>
                                <p className="schedule-branch-name">{schedule.employee}</p>
                                <p className="schedule-date-small">{thaiDate}</p>
                              </div>
                              <button
                                onClick={() => removeSchedule(schedule.id)}
                                className="delete-button-small"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="empty-text">ยังไม่มีตารางงาน</p>
                  )}
                </div>
              );
            })}
            {filteredBranches.length === 0 && (
              <div className="empty-state">
                <p>ไม่พบสาขา</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
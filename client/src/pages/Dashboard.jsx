import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Users, Calendar, Wallet, BarChart3, Plus, Search, ChevronRight, Download,
  CheckCircle2, FileText, MoreVertical, ArrowUpRight, ArrowDownRight,
  X, Upload, FileSpreadsheet, Trash2, MessageCircle, AlertTriangle, ChevronLeft,
  Archive, ArchiveRestore, Clock, Paperclip,
  ArrowLeftRight, TrendingUp, Edit3, ChevronDown, Printer, Share2, MousePointer2, Settings, HelpCircle,
  Eye, EyeOff
} from 'lucide-react';
import MobileSidebar from '../components/MobileSidebar';
import HelpTab from '../components/HelpTab';

import { getStaff, addStaff, updateStaff, setStaffCredentials } from '../api/staff';
import { getDepartments, addDepartment, updateDepartment, deleteDepartment } from '../api/departments';
import { getAttendance, markAttendance, bulkAttendance } from '../api/attendance';
import { getTransactions, addTransaction } from '../api/transactions';
import { processPayroll, getSlips } from '../api/payroll';
import { useAuth } from '../context/AuthContext';
import * as XLSX from 'xlsx';
import domtoimage from 'dom-to-image-more';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

// --- Helpers ---

const formatCurrency = (amt) => {
  const num = Number(amt) || 0;
  const isNeg = num < 0;
  return `${isNeg ? '-' : ''}₹${Math.abs(num).toLocaleString('en-IN')}`;
};

const getMonthYear = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr + '-01');
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
};

const getCurrentMonthKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const getPrevMonthKey = () => {
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const getFinancialYearRange = () => {
  const now = new Date();
  const currentMonth = now.getMonth();
  const startYear = currentMonth >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  const endYear = startYear + 1;
  return { start: `${startYear}-04-01`, end: `${endYear}-03-31`, label: `FY ${startYear}-${String(endYear).slice(2)}` };
};

const getMonthOptionsList = () => {
  const options = [];
  const date = new Date();
  for (let i = 0; i < 24; i++) {
    const d = new Date(date.getFullYear(), date.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    options.push({ key, label: d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) });
  }
  return options;
};

// --- Sub-Components ---
const Avatar = ({ src, name, className = "w-8 h-8", isInactive = false }) => {
  const [hasError, setHasError] = useState(false);
  const initials = name ? String(name).split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '??';
  if (hasError || !src) {
    return <div className={`${className} rounded-full ${isInactive ? 'bg-gray-100 text-gray-400' : 'bg-gray-100 text-gray-700'} border border-gray-200 flex items-center justify-center font-bold text-xs flex-shrink-0`}>{initials}</div>;
  }
  return <img src={src} alt={String(name)} className={`${className} rounded-full border border-gray-200 object-cover flex-shrink-0 ${isInactive ? 'opacity-50 grayscale' : ''}`} onError={() => setHasError(true)} />;
};

const StatCard = ({ title, value, icon: Icon, isWarning }) => (
  <div className={`bg-white p-4 rounded-xl border ${isWarning ? 'border-red-200' : 'border-gray-200'} flex flex-col gap-2 w-full shadow-sm hover:shadow-md transition-shadow`}>
    <div className="flex items-center justify-between">
      <p className={`text-[11px] font-semibold uppercase tracking-wider ${isWarning ? 'text-red-600' : 'text-gray-500'}`}>{title}</p>
      <Icon size={16} className={isWarning ? 'text-red-500' : 'text-gray-400'} />
    </div>
    <h3 className={`text-xl font-bold ${isWarning ? 'text-red-700' : 'text-gray-900'} tracking-tight truncate`}>{value}</h3>
  </div>
);

const ActionGroup = ({ primary, secondary }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="flex items-center gap-2 shrink-0">
      <div className="hidden sm:flex items-center gap-2">
        {secondary && secondary.map((act, i) => (
          <button key={i} onClick={act.onClick} className="bg-white text-gray-700 border border-gray-200 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
            {act.icon && <act.icon size={14} />} {act.label}
          </button>
        ))}
      </div>
      {primary && (
        <button onClick={primary.onClick} className="bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 whitespace-nowrap">
          {primary.icon && <primary.icon size={14} />} {primary.label}
        </button>
      )}
      {secondary && secondary.length > 0 && (
        <div className="relative sm:hidden">
          <button onClick={() => setIsOpen(!isOpen)} className="p-2 bg-white border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center justify-center">
            <MoreVertical size={18} />
          </button>
          {isOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 z-50 py-1 overflow-hidden">
                {secondary.map((act, i) => (
                  <button key={i} onClick={() => { act.onClick(); setIsOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 text-left font-medium border-b border-gray-100 last:border-0">
                    {act.icon && <act.icon size={14} />} {act.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
function SettingsTab({ company: authCompany }) {
  const { loginSave, logout } = useAuth();
  const [profile, setProfile] = useState({ companyName: '', ownerName: '', email: '' });
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showPwd, setShowPwd] = useState({ current: false, new: false, confirm: false });
  const [profileMsg, setProfileMsg] = useState('');
  const [passwordMsg, setPasswordMsg] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    if (authCompany) {
      setProfile({
        companyName: authCompany.companyName || '',
        ownerName: authCompany.ownerName || '',
        email: authCompany.email || '',
      });
    }
  }, [authCompany]);

  const handleProfileSave = async () => {
    setProfileLoading(true);
    setProfileMsg('');
    try {
      const { updateCompany } = await import('../api/company');
      const res = await updateCompany({
        companyName: profile.companyName,
        ownerName: profile.ownerName,
      });
      const token = localStorage.getItem('token');
      loginSave(token, res.data);
      setProfileMsg('Profile updated successfully.');
    } catch (err) {
      setProfileMsg(err.response?.data?.message || 'Failed to update profile.');
    }
    setProfileLoading(false);
  };

  const handlePasswordSave = async () => {
    if (passwords.newPassword !== passwords.confirmPassword) {
      return setPasswordMsg('New passwords do not match.');
    }
    if (passwords.newPassword.length < 6) {
      return setPasswordMsg('Password must be at least 6 characters.');
    }
    setPasswordLoading(true);
    setPasswordMsg('');
    try {
      const { updateCompany } = await import('../api/company');
      await updateCompany({
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPasswordMsg('Password changed successfully.');
    } catch (err) {
      setPasswordMsg(err.response?.data?.message || 'Failed to change password.');
    }
    setPasswordLoading(false);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-bold text-lg text-black">Company Profile</h3>
          <p className="text-gray-500 text-[10px] uppercase tracking-widest mt-0.5">Update your company details</p>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-[10px] font-bold text-gray-600 block mb-1 uppercase tracking-widest">Company Name</label>
            <input type="text" className="w-full bg-white border border-gray-300 px-3 py-2 rounded-lg text-sm outline-none focus:border-black transition-colors" value={profile.companyName} onChange={e => setProfile({ ...profile, companyName: e.target.value })} />
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-600 block mb-1 uppercase tracking-widest">Owner Name</label>
            <input type="text" className="w-full bg-white border border-gray-300 px-3 py-2 rounded-lg text-sm outline-none focus:border-black transition-colors" value={profile.ownerName} onChange={e => setProfile({ ...profile, ownerName: e.target.value })} />
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-600 block mb-1 uppercase tracking-widest">Email Address</label>
            <input type="email" disabled className="w-full bg-gray-50 border border-gray-200 px-3 py-2 rounded-lg text-sm text-gray-400 cursor-not-allowed" value={profile.email} />
            <p className="text-[10px] text-gray-400 mt-1">Email cannot be changed.</p>
          </div>
          {profileMsg && (
            <p className={`text-xs font-medium p-2 rounded-lg ${profileMsg.includes('success') ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>{profileMsg}</p>
          )}
          <button onClick={handleProfileSave} disabled={profileLoading} className="bg-black text-white px-5 py-2 rounded-lg text-xs font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50">
            {profileLoading ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-bold text-lg text-black">Change Password</h3>
          <p className="text-gray-500 text-[10px] uppercase tracking-widest mt-0.5">Update your login password</p>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-[10px] font-bold text-gray-600 block mb-1 uppercase tracking-widest">Current Password</label>
            <div className="relative">
              <input type={showPwd.current ? 'text' : 'password'} className="w-full bg-white border border-gray-300 px-3 py-2 pr-9 rounded-lg text-sm outline-none focus:border-black transition-colors" value={passwords.currentPassword} onChange={e => setPasswords({ ...passwords, currentPassword: e.target.value })} />
              <button type="button" onClick={() => setShowPwd(p => ({ ...p, current: !p.current }))} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">{showPwd.current ? <EyeOff size={15} /> : <Eye size={15} />}</button>
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-600 block mb-1 uppercase tracking-widest">New Password</label>
            <div className="relative">
              <input type={showPwd.new ? 'text' : 'password'} className="w-full bg-white border border-gray-300 px-3 py-2 pr-9 rounded-lg text-sm outline-none focus:border-black transition-colors" value={passwords.newPassword} onChange={e => setPasswords({ ...passwords, newPassword: e.target.value })} />
              <button type="button" onClick={() => setShowPwd(p => ({ ...p, new: !p.new }))} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">{showPwd.new ? <EyeOff size={15} /> : <Eye size={15} />}</button>
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-600 block mb-1 uppercase tracking-widest">Confirm New Password</label>
            <div className="relative">
              <input type={showPwd.confirm ? 'text' : 'password'} className="w-full bg-white border border-gray-300 px-3 py-2 pr-9 rounded-lg text-sm outline-none focus:border-black transition-colors" value={passwords.confirmPassword} onChange={e => setPasswords({ ...passwords, confirmPassword: e.target.value })} />
              <button type="button" onClick={() => setShowPwd(p => ({ ...p, confirm: !p.confirm }))} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">{showPwd.confirm ? <EyeOff size={15} /> : <Eye size={15} />}</button>
            </div>
          </div>
          {passwordMsg && (
            <p className={`text-xs font-medium p-2 rounded-lg ${passwordMsg.includes('success') ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>{passwordMsg}</p>
          )}
          <button onClick={handlePasswordSave} disabled={passwordLoading} className="bg-black text-white px-5 py-2 rounded-lg text-xs font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50">
            {passwordLoading ? 'Changing...' : 'Change Password'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-red-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-red-100">
          <h3 className="font-bold text-lg text-red-600">Danger Zone</h3>
          <p className="text-red-400 text-[10px] uppercase tracking-widest mt-0.5">Irreversible actions</p>
        </div>
        <div className="p-5">
          <p className="text-sm text-gray-600 mb-4">Logging out will clear your session. You will need to log in again.</p>
          <button onClick={logout} className="bg-red-600 text-white px-5 py-2 rounded-lg text-xs font-semibold hover:bg-red-700 transition-colors">
            Logout from StaffFlow
          </button>
        </div>
      </div>
    </div>
  );
}
// --- Main App ---
export default function Dashboard() {
  const { company, logout } = useAuth();
    const [staff, setStaff] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [attendance, setAttendance] = useState({});
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDept, setSelectedDept] = useState(null);
    const [activeDeptFilter, setActiveDeptFilter] = useState('all');

  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'dashboard';
  const setActiveTab = (tab) => setSearchParams({ tab }, { replace: true });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthKey());
  const [selectedLedgerStaff, setSelectedLedgerStaff] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const [staffTabFilter, setStaffTabFilter] = useState('active');
const [showExportModal, setShowExportModal] = useState(false);
const [exportRange, setExportRange] = useState({ type: 'month', month: getCurrentMonthKey(), from: '', to: '' });
const [showArchivedLedgers, setShowArchivedLedgers] = useState(false);


  const fileInputRef = useRef(null);
  const attachmentRef = useRef(null);
  const pdfSourceRef = useRef(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState(null);
  const [modalData, setModalData] = useState({});

  // Credentials section state (edit-staff modal)
  const [credEmail, setCredEmail]         = useState('');
  const [credPwd, setCredPwd]             = useState('');
  const [credConfirm, setCredConfirm]     = useState('');
  const [showCredPwd, setShowCredPwd]     = useState(false);
  const [showCredConf, setShowCredConf]   = useState(false);
  const [credMsg, setCredMsg]             = useState('');
  const [credErr, setCredErr]             = useState('');
  const [credSaving, setCredSaving]       = useState(false);

  // --- Load all data from API on mount ---
  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      try {
        const [staffRes, txRes, attRes, deptRes] = await Promise.all([
        getStaff(),
        getTransactions({}),
        getAttendance(selectedMonth),
        getDepartments(),
        ]);
        setStaff(staffRes.data);
        setTransactions(txRes.data);
        setAttendance(attRes.data);
        setDepartments(deptRes.data);
      } catch (err) {
        console.error('Failed to load data:', err);
      }
      setLoading(false);
    };
    loadAll();
  }, []);

  // Reload attendance when month changes
  useEffect(() => {
    const loadAttendance = async () => {
      try {
        const res = await getAttendance(selectedMonth);
        setAttendance(res.data);
      } catch (err) {
        console.error('Failed to load attendance:', err);
      }
    };
    loadAttendance();
  }, [selectedMonth]);

  // Reload transactions when month changes
  useEffect(() => {
    const loadTransactions = async () => {
      try {
        const res = await getTransactions({});
        setTransactions(res.data);
      } catch (err) {
        console.error('Failed to load transactions:', err);
      }
    };
    loadTransactions();
  }, [selectedMonth]);

 

  // --- PDF Export ---
  // --- PDF Export ---
  // --- PDF Export ---
  const handleExportPDF = async (filename, share = false) => {
    setIsExporting(true);
    try {
      const element = pdfSourceRef.current;
      if (!element) { 
        alert('Content not visible or hidden.'); 
        setIsExporting(false); 
        return; 
      }

      // 🧹 SANITIZE DOM FOR CAPTURE
      element.classList.add('is-capturing');
      
      if (document.fonts && document.fonts.ready) {
        await document.fonts.ready;
      }
      await new Promise(r => setTimeout(r, 200));
      
      let imgData = null;

      // ATTEMPT 1: dom-to-image-more (Primary - handles Tailwind 4 much better)
      try {
        const options = {
          bgcolor: '#ffffff',
          width: element.offsetWidth * 2.5,
          height: element.offsetHeight * 2.5,
          style: { transform: 'scale(2.5)', transformOrigin: 'top left', width: element.offsetWidth + 'px', height: element.offsetHeight + 'px' }
        };
        imgData = await domtoimage.toPng(element, options);
      } catch (d2iError) {
        console.warn('dom-to-image failed, attempting fallback...', d2iError);
        // FALLBACK: html2canvas (Now safe due to .is-capturing class)
        const canvas = await html2canvas(element, {
          scale: 2.5, useCORS: true, backgroundColor: '#ffffff', logging: false, allowTaint: false,
          onclone: (clonedDoc) => {
            const allElements = clonedDoc.getElementsByTagName("*");
            for (let i = 0; i < allElements.length; i++) {
              allElements[i].style.boxShadow = 'none';
              const style = clonedDoc.defaultView.getComputedStyle(allElements[i]);
              if (style.borderBottomWidth === '0px' && style.borderTopWidth === '0px' && 
                  style.borderLeftWidth === '0px' && style.borderRightWidth === '0px') {
                allElements[i].style.borderStyle = 'none';
              }
            }
          }
        });
        imgData = canvas.toDataURL('image/png');
      }

      // 🧼 RESTORE DOM
      element.classList.remove('is-capturing');

      if (!imgData) throw new Error('Capture failed');

      const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (element.offsetHeight * pdfWidth) / element.offsetWidth;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');

      const fullFilename = `${filename}.pdf`;

      if (share && navigator.share) {
        try {
          const pdfBlob = pdf.output('blob');
          const file = new File([pdfBlob], fullFilename, { type: 'application/pdf' });
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({ files: [file], title: filename });
          } else {
            pdf.save(fullFilename);
          }
        } catch (shareErr) {
          console.error('Share error:', shareErr);
          pdf.save(fullFilename);
        }
      } else {
        pdf.save(fullFilename);
      }
    } catch (err) {
      console.error('Final PDF failure:', err);
      // Ensure cleanup on error
      if (pdfSourceRef.current) pdfSourceRef.current.classList.remove('is-capturing');
      alert('High-Fidelity capture failed. Please try again or use a different browser.');
    }
    setIsExporting(false);
  };

  const handleExportCSV = () => {
    if (!selectedLedgerStaff) return;
    const ledger = getStaffLedger(selectedLedgerStaff._id);
    const headers = "Date,Type,Description,Debit,Credit\n";
    const escCsv = (v) => `"${String(v || '').replace(/"/g, '""')}"`;
    const rows = ledger.map(t => {
      const debit = (t.type === 'advance' || t.type === 'salary') ? t.amount : 0;
      const credit = t.type === 'salary' ? ((t.earnedSalary || 0) + (t.overtime || 0) + (t.bonus || 0)) : (t.type === 'adjustment' ? t.amount : 0);
      return `${t.date},${t.type},${escCsv(t.note)},${debit},${credit}`;
    }).join("\n");
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Ledger_${selectedLedgerStaff.name}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const shareWhatsApp = () => {
    if (!modalData.employee) return;
    const text = `*SALARY STATEMENT*
---------------------------
*Employee:* ${modalData.employee.name}
*Month:* ${getMonthYear(modalData.monthKey)}
*Net Payout:* ${formatCurrency(modalData.amount)}
*Status:* Processed & Paid

_You can view/download your full PDF payslip by logging into your StaffFlow portal._`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`);
  };

  const downloadStaffTemplate = () => {
  const headers = "Name,Role,Salary,WeeklyOff,Allowance,Deduction";
  const weeklyOffLabel = (wo) => {
    if (wo === 'weekend') return 'weekend';
    return ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'][wo] || 'sunday';
  };
  const escCsv = (v) => `"${String(v || '').replace(/"/g, '""')}"`;
  const rows = staff.map(s =>
    `${escCsv(s.name)},${escCsv(s.role)},${s.salary},${weeklyOffLabel(s.weeklyOff)},${s.fixedAllowance || 0},${s.fixedDeduction || 0}`
  ).join('\n');
  const blob = new Blob([headers + '\n' + rows], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'Staff_Template.csv'; a.click();
  window.URL.revokeObjectURL(url);
};

  // --- Attendance CSV ---
  const downloadAttendanceTemplate = () => {
    const activeStaff = staff.filter(s => s.isActive !== false);
    const headers = ["Staff ID", "Staff Name", ...monthDates.map(d => d.dateStr)].join(",");
    const rows = activeStaff.map(s => [s._id, s.name, ...monthDates.map(() => "")].join(",")).join("\n");
    const blob = new Blob([headers + "\n" + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `Attendance_${selectedMonth}.csv`; a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleBulkAttendanceUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      const lines = e.target.result.split('\n').filter(l => l.trim());
      if (lines.length < 2) { alert('CSV file is empty or has no data rows.'); return; }
      const headers = lines[0].split(',').map(h => h.trim());
      const validStatuses = ['P', 'HD', 'A', 'OT', 'PL', 'SL', 'PH', 'WE'];
      const statusMap = {};

      lines.slice(1).forEach(row => {
        const cols = row.split(',').map(c => c.trim());
        const staffId = cols[0];
        if (!staffId) return;
        if (!statusMap[staffId]) statusMap[staffId] = {};
        for (let i = 2; i < headers.length; i++) {
          const dateStr = headers[i];
          const status = cols[i]?.toUpperCase();
          if (dateStr && status && validStatuses.includes(status)) {
            statusMap[staffId][dateStr] = status;
          }
        }
      });

      // Send individual markAttendance calls per staff per date (preserves each cell's actual status)
      const entries = [];
      Object.entries(statusMap).forEach(([staffId, dateMap]) => {
        Object.entries(dateMap).forEach(([date, status]) => {
          entries.push({ staffId, date, status });
        });
      });

      if (entries.length === 0) { alert('No valid attendance data found in the CSV.'); return; }

      try {
        await Promise.all(entries.map(e => markAttendance(e)));
        const res = await getAttendance(selectedMonth);
        setAttendance(res.data);
        alert(`Imported ${entries.length} attendance records.`);
      } catch (err) {
        console.error(err);
        alert('Import failed: ' + (err.response?.data?.message || err.message));
      }
      setIsModalOpen(false);
    };
    reader.readAsText(file);
  };

  // --- Logic Helpers ---
  const daysInMonth = useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    return new Date(year, month, 0).getDate();
  }, [selectedMonth]);

  const monthDates = useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    return Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const date = new Date(year, month - 1, day);
      return {
        dateStr: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNum: day,
        dayOfWeek: date.getDay()
      };
    });
  }, [selectedMonth, daysInMonth]);

  const isWeekendOff = (staffMember, dayOfWeek) => {
  if (staffMember.weeklyOff === 'weekend') {
    return dayOfWeek === 0 || dayOfWeek === 6;
  }
  return dayOfWeek === Number(staffMember.weeklyOff);
  };

  const getSalaryForDate = (staffMember, dateStr) => {
    const targetDate = new Date(dateStr);
    const sortedHistory = [...(staffMember.salaryHistory || [])].sort((a, b) => new Date(b.effectiveDate) - new Date(a.effectiveDate));
    const effectiveSalary = sortedHistory.find(h => new Date(h.effectiveDate) <= targetDate);
    return effectiveSalary ? effectiveSalary.amount : (staffMember.salary || 0);
  };

  const calculateLiveStats = (staffMember, monthKey) => {
  const records = attendance[staffMember._id] || {};
  const [year, month] = monthKey.split('-').map(Number);
  const totalDays = new Date(year, month, 0).getDate();
  let presentDays = 0, otDays = 0, halfDays = 0, absentDays = 0,
      paidHolidayCount = 0, plCount = 0, slCount = 0, weCount = 0;

  for (let i = 1; i <= totalDays; i++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
    const dateObj = new Date(year, month - 1, i);
    const isOff = isWeekendOff(staffMember, dateObj.getDay());
    const status = records[dateStr];

    if (isOff) {
      if (!status || status === '' || status === 'WE') weCount += 1;
      else if (status === 'OT' || status === 'P') { weCount += 1; otDays += 1; }
      else if (status === 'HD') { weCount += 1; otDays += 0.5; }
      else if (status === 'A') absentDays += 1;
      else if (status === 'PL') plCount += 1;
      else if (status === 'SL') slCount += 1;
      else if (status === 'PH') paidHolidayCount += 1;
    } else {
      if (status === 'P') presentDays += 1;
      else if (status === 'HD') halfDays += 1;
      else if (status === 'A') absentDays += 1;
      else if (status === 'PL') plCount += 1;
      else if (status === 'SL') slCount += 1;
      else if (status === 'OT') { presentDays += 1; otDays += 1; }
      else if (status === 'PH') paidHolidayCount += 1;
    }
  }

  const currentSalary = getSalaryForDate(staffMember, `${monthKey}-01`);
const dailyRate = currentSalary / totalDays;
const totalBasePaidDays = presentDays + weCount + paidHolidayCount + plCount + slCount + (halfDays * 0.5);  
const earnedSalary = Math.round(totalBasePaidDays * dailyRate);
  const otAmount = Math.round(otDays * dailyRate);

  return { totalBasePaidDays, earnedSalary, otAmount, otDays, presentDays, halfDays, absentDays, paidHolidayCount, plCount, slCount, weCount };
};

  const totalAmountDueInModal = useMemo(() => {
    if (modalType !== 'salary' || !modalData.employee) return 0;
    return (modalData.earnedSalary || 0) + (modalData.employee.balance || 0) + (Number(modalData.overtime) || 0) + (Number(modalData.bonus) || 0) - (Number(modalData.manualDeduction) || 0);
  }, [modalData, modalType]);

  const slipMonthTxs = useMemo(() => {
    if (modalType !== 'slip' || !modalData?.staffId) return [];
    return transactions.filter(t => {
      const tStaffId = t.staff?._id || t.staff;
      return tStaffId === modalData.staffId && t.date?.startsWith(modalData.monthKey) && t._id !== modalData._id;
    }).sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [modalType, modalData, transactions]);

  const startOfMonthBalance = useMemo(() => {
    if (modalType !== 'slip') return 0;
    let netMonthTxEffect = 0;
    slipMonthTxs.forEach(t => {
      if (t.type === 'advance') netMonthTxEffect -= (t.amount || 0);
      else if (t.type === 'adjustment') netMonthTxEffect += (t.amount || 0);
    });
    return (modalData.openingBalance || 0) - netMonthTxEffect;
  }, [modalType, modalData, slipMonthTxs]);

  // --- Save Employee Credentials (separate from Save Changes) ---
  const handleSaveCredentials = async () => {
    setCredMsg(''); setCredErr('');
    if (!credEmail) { setCredErr('Email is required'); return; }
    if (credPwd && credPwd !== credConfirm) { setCredErr('Passwords do not match'); return; }
    if (credPwd && credPwd.length < 6) { setCredErr('Password must be at least 6 characters'); return; }
    setCredSaving(true);
    try {
      await setStaffCredentials(modalData.staffId, {
        email: credEmail,
        ...(credPwd ? { password: credPwd } : {}),
      });
      setCredMsg('Credentials saved! Employee can now log in.');
      setCredPwd(''); setCredConfirm('');
      const fresh = await getStaff();
      setStaff(fresh.data);
    } catch (e) {
      setCredErr(e.response?.data?.message || 'Failed to save credentials');
    }
    setCredSaving(false);
  };

  // --- Processing Handlers ---
  const processPayment = async () => {
    try {
      if (modalType === 'salary') {
        const paid = Number(modalData.actualPaid) || 0;
        const newBalance = totalAmountDueInModal - paid;
        const res = await processPayroll({
          staffId: modalData.employee._id,
          monthKey: selectedMonth,
          amount: paid,
          earnedSalary: modalData.earnedSalary,
          overtime: Number(modalData.overtime) || 0,
          otDays: modalData.otDays,
          presentDays: modalData.presentDays,
          halfDays: modalData.halfDays,
          absentDays: modalData.absentDays,
          paidHolidayCount: modalData.paidHolidayCount,
          plCount: modalData.plCount,
          slCount: modalData.slCount,
          bonus: Number(modalData.bonus) || 0,
          deductions: Number(modalData.manualDeduction) || 0,
          openingBalance: modalData.employee.balance,
          closingBalance: newBalance,
          paymentMode: modalData.paymentMode || 'Bank',
          note: modalData.remarks || 'Salary Payout',
          date: modalData.date || new Date().toISOString().split('T')[0],
          attachment: modalData.attachment || '',
        });
        setTransactions(prev => [res.data, ...prev]);
        setStaff(prev => prev.map(s => s._id === modalData.employee._id ? { ...s, balance: newBalance } : s));
        if (selectedLedgerStaff?._id === modalData.employee._id) {
          setSelectedLedgerStaff(prev => prev ? { ...prev, balance: newBalance } : prev);
        }

      } else if (modalType === 'new-advance') {
        const amount = Number(modalData.amount);
        const res = await addTransaction({
          staffId: modalData.staffId,
          type: modalData.type,
          amount,
          date: modalData.date,
          paymentMode: modalData.paymentMode,
          note: modalData.remarks || 'Manual Entry',
        });
        // Attach staff object so ledger renders correctly without a page reload
        const staffMember = staff.find(s => s._id === modalData.staffId);
        setTransactions(prev => [{ ...res.data, staff: staffMember }, ...prev]);
        const balanceDelta = modalData.type === 'advance' ? -amount : amount;
        const newBalance = (staffMember?.balance || 0) + balanceDelta;
        setStaff(prev => prev.map(s => s._id === modalData.staffId ? { ...s, balance: newBalance } : s));
        // Update selectedLedgerStaff balance if currently viewing that staff's ledger
        if (selectedLedgerStaff?._id === modalData.staffId) {
          setSelectedLedgerStaff(prev => prev ? { ...prev, balance: newBalance } : prev);
        }

 } else if (modalType === 'update-salary') {
        await updateStaff(modalData.staffId, {
          salary: Number(modalData.amount),
          effectiveDate: modalData.effectiveDate,
        });
        const freshStaff = await getStaff();
        setStaff(freshStaff.data);

          } else if (modalType === 'edit-staff') {
            await updateStaff(modalData.staffId, {
              name: modalData.name,
              role: modalData.role,
              fixedAllowance: Number(modalData.fixedAllowance),
              fixedDeduction: Number(modalData.fixedDeduction),
              weeklyOff: modalData.weeklyOff === 'weekend' ? 'weekend' : Number(modalData.weeklyOff),
              salary: Number(modalData.salary),
              effectiveDate: modalData.effectiveDate,
              department: modalData.department || null,
            });
            const [freshStaff, freshDepts] = await Promise.all([getStaff(), getDepartments()]);
            setStaff(freshStaff.data);
            setDepartments(freshDepts.data);

      } else if (modalType === 'add-staff') {
          await addStaff({
            name: modalData.name,
            role: modalData.role,
            salary: Number(modalData.salary) || 0,
            fixedAllowance: Number(modalData.fixedAllowance) || 0,
            fixedDeduction: Number(modalData.fixedDeduction) || 0,
            weeklyOff: modalData.weeklyOff === 'weekend' ? 'weekend' : Number(modalData.weeklyOff) || 0,
            department: modalData.department || null,
            email: modalData.staffEmail || '',
            password: modalData.staffPassword || '',
          });
          // Refetch staff and departments so counts stay in sync
          const [freshStaff, freshDepts] = await Promise.all([getStaff(), getDepartments()]);
          setStaff(freshStaff.data);
          setDepartments(freshDepts.data);

      } else if (modalType === 'add-department') {
        const res = await addDepartment({
            name: modalData.name,
            description: modalData.description || '',
            color: modalData.color || '#6366f1',
        });
        setDepartments(prev => [...prev, res.data]);

        } else if (modalType === 'edit-department') {
        const res = await updateDepartment(modalData.deptId, {
            name: modalData.name,
            description: modalData.description,
            color: modalData.color,
        });
        setDepartments(prev => prev.map(d => d._id === modalData.deptId ? res.data : d));

    }
    } catch (err) {
      alert('Operation failed: ' + (err.response?.data?.message || err.message));
    }
    setIsModalOpen(false);
  };
  const handleDeleteDept = async (deptId) => {
  if (!confirm('Delete this department? Staff inside will be moved to Unassigned.')) return;
  try {
    await deleteDepartment(deptId);
    setDepartments(prev => prev.filter(d => d._id !== deptId));
    setStaff(prev => prev.map(s => (s.department?._id || s.department) === deptId ? { ...s, department: null } : s));
    if (selectedDept?._id === deptId) setSelectedDept(null);
  } catch (err) { alert('Failed to delete department.'); }
};

  const toggleStaffStatus = async (id, currentStatus) => {
    if (!confirm(`Are you sure you want to ${currentStatus !== false ? 'deactivate' : 'activate'} this staff member?`)) return;
    try {
      const res = await updateStaff(id, { isActive: currentStatus === false });
      setStaff(prev => prev.map(s => s._id === id ? res.data : s));
    } catch (err) { alert('Failed to update staff status.'); }
  };

  const applyBulkRangeAttendance = async () => {
    const { startDate, endDate, status, targetStaffId } = modalData;
    if (!startDate || !endDate || !status) return;

    const start = new Date(startDate);
    const end = new Date(endDate);
    const activeStaffList = staff.filter(s => s.isActive !== false);
    const staffToUpdate = targetStaffId === 'all' ? activeStaffList : activeStaffList.filter(s => s._id === targetStaffId);
    const staffIds = staffToUpdate.map(s => s._id);
    const dates = [];

    let current = new Date(start);
    while (current <= end) {
      const dateStr = current.toISOString().split('T')[0];
      if (dateStr.startsWith(selectedMonth)) dates.push(dateStr);
      current.setDate(current.getDate() + 1);
    }

    if (staffIds.length && dates.length) {
      try {
        await bulkAttendance({ staffIds, dates, status });
        const res = await getAttendance(selectedMonth);
        setAttendance(res.data);
      } catch (err) { alert('Bulk fill failed.'); }
    }
    setIsModalOpen(false);
  };

const toggleAttendance = async (staffId, dateStr, currentStatus, isOff) => {
  const statuses = isOff
    ? ['', 'OT', 'HD', 'A', 'PL', 'SL']
    : ['', 'P', 'HD', 'A', 'OT', 'PL', 'SL'];
  const nextIdx = (statuses.indexOf(currentStatus || '') + 1) % statuses.length;
  const newStatus = statuses[nextIdx];

  setAttendance(prev => ({
    ...prev,
    [staffId]: { ...(prev[staffId] || {}), [dateStr]: newStatus }
  }));

  try {
    await markAttendance({ staffId, date: dateStr, status: newStatus });
  } catch (err) {
    setAttendance(prev => ({
      ...prev,
      [staffId]: { ...(prev[staffId] || {}), [dateStr]: currentStatus }
    }));
  }
};

const togglePHForDate = async (dateStr) => {
  const activeIds = activeStaffList.map(s => s._id);
  if (!activeIds.length) return;
  const firstStatus = (attendance[activeIds[0]] || {})[dateStr];
  const newStatus = firstStatus === 'PH' ? '' : 'PH';

  setAttendance(prev => {
    const updated = { ...prev };
    activeIds.forEach(id => {
      updated[id] = { ...(updated[id] || {}), [dateStr]: newStatus };
    });
    return updated;
  });

  try {
    await bulkAttendance({ staffIds: activeIds, dates: [dateStr], status: newStatus });
  } catch (err) {
    console.error('PH toggle failed:', err);
  }
};

  const handlePayTrigger = (employee) => {
    const liveStats = calculateLiveStats(employee, selectedMonth);
    const alreadyPaidThisMonth = transactions.some(t => {
      const tStaffId = t.staff?._id || t.staff;
      return tStaffId === employee._id && t.type === 'salary' && t.monthKey === selectedMonth;
    });
    const earnedToApply = alreadyPaidThisMonth ? 0 : liveStats.earnedSalary;
    const otToApply = liveStats.otAmount;
    const fixedBonus = alreadyPaidThisMonth ? 0 : (employee.fixedAllowance || 0);
    const fixedDed = alreadyPaidThisMonth ? 0 : (employee.fixedDeduction || 0);
    const initialDue = earnedToApply + otToApply + fixedBonus - fixedDed + (employee.balance || 0);

    setModalType('salary');
    setModalData({
      employee, overtime: otToApply, otDays: liveStats.otDays,
      presentDays: liveStats.presentDays, halfDays: liveStats.halfDays, absentDays: liveStats.absentDays,
      paidHolidayCount: liveStats.paidHolidayCount, plCount: liveStats.plCount, slCount: liveStats.slCount,
      earnedSalary: earnedToApply, isSecondary: alreadyPaidThisMonth,
      bonus: fixedBonus, manualDeduction: fixedDed, remarks: '', paymentMode: 'Bank', isEditing: false,
      actualPaid: initialDue > 0 ? initialDue : 0, attachment: null, date: new Date().toISOString().split('T')[0]
    });
    setIsModalOpen(true);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setModalData(prev => ({ ...prev, attachment: reader.result }));
      reader.readAsDataURL(file);
    }
  };

const handleExportExcel = (range) => {
  let fromDate, toDate, label;

  if (range.type === 'month') {
    const [year, month] = range.month.split('-').map(Number);
    fromDate = `${range.month}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    toDate = `${range.month}-${String(lastDay).padStart(2, '0')}`;
    label = getMonthYear(range.month);
  } else if (range.type === 'range') {
    fromDate = range.from;
    toDate = range.to;
    label = `${range.from} to ${range.to}`;
  } else {
    fromDate = fyRange.start;
    toDate = fyRange.end;
    label = fyRange.label;
  }

  // Sheet 1 — Staff List
  const staffSheet = staff.map(s => ({
    'Name': s.name,
    'Role': s.role,
    'Department': departments.find(d => d._id === (s.department?._id || s.department))?.name || 'Unassigned',
    'Base Salary': s.salary,
    'Fixed Allowance': s.fixedAllowance || 0,
    'Fixed Deduction': s.fixedDeduction || 0,
    'Weekly Off': s.weeklyOff === 'weekend' ? 'Sat+Sun' : ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][s.weeklyOff || 0],
    'Status': s.isActive !== false ? 'Active' : 'Inactive',
    'Balance': s.balance || 0,
  }));

  // Sheet 2 — Attendance for date range
  const filteredDates = [];
  let cur = new Date(fromDate);
  const end = new Date(toDate);
  while (cur <= end) {
    filteredDates.push(cur.toISOString().split('T')[0]);
    cur.setDate(cur.getDate() + 1);
  }

  const attendanceSheet = activeStaffList.map(s => {
    const row = {
      'Name': s.name,
      'Role': s.role,
      'Department': departments.find(d => d._id === (s.department?._id || s.department))?.name || 'Unassigned',
    };
    filteredDates.forEach(date => {
      row[date] = (attendance[s._id] || {})[date] || '-';
    });
    return row;
  });

  // Sheet 3 — Salary Slips
  const salaryTxs = transactions.filter(t =>
    t.type === 'salary' && t.date >= fromDate && t.date <= toDate
  );
  const salarySheet = salaryTxs.length ? salaryTxs.map(tx => {
    const tStaffId = tx.staff?._id || tx.staff;
    const emp = tx.staff?.name ? tx.staff : staff.find(s => s._id === tStaffId);
    return {
      'Employee': emp?.name || 'Unknown',
      'Role': emp?.role || '',
      'Month': getMonthYear(tx.monthKey),
      'Date': tx.date,
      'Earned Salary': tx.earnedSalary || 0,
      'OT Pay': tx.overtime || 0,
      'Allowance': tx.bonus || 0,
      'Deduction': tx.deductions || 0,
      'Net Paid': tx.amount || 0,
      'Opening Balance': tx.openingBalance || 0,
      'Closing Balance': tx.closingBalance || 0,
      'Payment Mode': tx.paymentMode || '',
      'Remarks': tx.note || '',
    };
  }) : [{ 'Info': 'No salary slips for selected period' }];

  // Sheet 4 — All Transactions
  const allTxs = transactions.filter(t => t.date >= fromDate && t.date <= toDate);
  const txSheet = allTxs.length ? allTxs.map(tx => {
    const tStaffId = tx.staff?._id || tx.staff;
    const emp = tx.staff?.name ? tx.staff : staff.find(s => s._id === tStaffId);
    return {
      'Date': tx.date,
      'Employee': emp?.name || 'Unknown',
      'Type': tx.type,
      'Amount': tx.amount || 0,
      'Note': tx.note || '',
      'Payment Mode': tx.paymentMode || '',
    };
  }) : [{ 'Info': 'No transactions for selected period' }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(staffSheet), 'Staff');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(attendanceSheet), 'Attendance');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(salarySheet), 'Salary Slips');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(txSheet), 'Transactions');

  XLSX.writeFile(wb, `StaffFlow_${company?.companyName}_${label}.xlsx`);
  setShowExportModal(false);
};

  const viewSlip = (tx) => {
    const tStaffId = tx.staff?._id || tx.staff;
    const employee = tx.staff?.name ? tx.staff : staff.find(s => s._id === tStaffId);
    setModalType('slip');
    setModalData({ ...tx, staffId: tStaffId, employee });
    setIsModalOpen(true);
  };

  // --- Analytics ---
  const activeStaffList = useMemo(() => staff.filter(st => st.isActive !== false), [staff]);
  const overAdvancedStaff = useMemo(() => activeStaffList.filter(st => (st.balance || 0) < -(st.salary || 0)), [activeStaffList]);

  const pendingPayouts = useMemo(() => {
    const prevMonth = getPrevMonthKey();
    return activeStaffList.filter(st => {
      const stats = calculateLiveStats(st, prevMonth);
      const hasPaid = transactions.some(t => {
        const tStaffId = t.staff?._id || t.staff;
        return tStaffId === st._id && t.type === 'salary' && t.monthKey === prevMonth;
      });
      return stats.totalBasePaidDays > 0 && !hasPaid;
    });
  }, [activeStaffList, attendance, transactions]);

  const last6MonthsChart = useMemo(() => {
    const data = [];
    let max = 0;
    for (let i = 5; i >= 0; i--) {
      const d = new Date(); d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const total = transactions.filter(t => t.type === 'salary' && t.monthKey === key).reduce((a, b) => a + (b.amount || 0), 0);
      if (total > max) max = total;
      data.push({ label: d.toLocaleDateString('en-US', { month: 'short' }), total });
    }
    return { data, max: max || 1 };
  }, [transactions]);

  const fyRange = getFinancialYearRange();
  const monthOptions = getMonthOptionsList();

  const filteredStaffList = staff.filter(st =>
    String(st.name).toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(st.role).toLowerCase().includes(searchTerm.toLowerCase())
  );
  const activeLedgerStaff = filteredStaffList.filter(s => s.isActive !== false);
  const inactiveLedgerWithBalance = filteredStaffList.filter(s => s.isActive === false && (s.balance || 0) !== 0);
  const archivedLedgerStaff = filteredStaffList.filter(s => s.isActive === false && (s.balance || 0) === 0);
  const getStaffLedger = (staffId) => transactions.filter(t => {
    const tStaffId = t.staff?._id || t.staff;
    return tStaffId === staffId && t.date >= fyRange.start && t.date <= fyRange.end;
  }).sort((a, b) => new Date(a.date) - new Date(b.date));

  const displayedStaffDirectory = staff
    .filter(s => staffTabFilter === 'active' ? s.isActive !== false : s.isActive === false)
    .filter(st => String(st.name).toLowerCase().includes(searchTerm.toLowerCase()) || String(st.role).toLowerCase().includes(searchTerm.toLowerCase()));

    const deptFilteredStaff = activeStaffList.filter(st => {
    const searchMatch = String(st.name).toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(st.role).toLowerCase().includes(searchTerm.toLowerCase());
    if (activeDeptFilter === 'all') return searchMatch;
    if (activeDeptFilter === 'unassigned') return !st.department && searchMatch;
    return (st.department === activeDeptFilter || st.department?._id === activeDeptFilter) && searchMatch;
    });

  const filteredActiveStaffList = activeStaffList.filter(st =>
    String(st.name).toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(st.role).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderLedgerRow = (s) => (
    <tr key={s._id} onClick={() => setSelectedLedgerStaff(s)} className="hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-100 last:border-0 group">
      <td className="px-4 py-4 flex items-center gap-3 font-medium text-gray-900">
        <Avatar src={s.avatar} name={s.name} isInactive={s.isActive === false} />
        <span className={`text-sm ${s.isActive === false ? 'text-gray-500' : ''}`}>{s.name}</span>
      </td>
      <td className="px-4 py-4 text-gray-500 text-center text-xs">{s.role}</td>
      <td className="px-4 py-4 text-right font-semibold text-sm">
        <span className={(s.balance || 0) > 0 ? 'text-emerald-600' : (s.balance || 0) < 0 ? 'text-red-600' : 'text-gray-500'}>{formatCurrency(s.balance)}</span>
      </td>
      <td className="px-4 py-4 text-center"><ChevronRight size={16} className="text-gray-400 group-hover:text-black inline-block transition-colors" /></td>
    </tr>
  );


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500 text-sm">Loading StaffFlow...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans overflow-x-hidden">

      {/* Mobile Sidebar */}
      <MobileSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        company={company}
        logout={logout}
      />

      {/* Top Nav */}
      <nav className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">

          {/* Logo — always visible */}
          <div className="flex items-center gap-2 md:pr-6 md:border-r md:border-gray-200">
            <div className="bg-black p-1 rounded-md"><Wallet className="text-white" size={16} /></div>
            <h1 className="text-sm font-bold text-black tracking-tight uppercase">StaffFlow</h1>
          </div>

          {/* Desktop nav links */}
          <div className="hidden md:flex flex-1 items-center gap-1 px-4">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
              { id: 'staff',     label: 'Directory',  icon: Users },
              { id: 'attendance',label: 'Attendance', icon: Clock },
              { id: 'ledger',    label: 'Ledgers',    icon: ArrowLeftRight },
              { id: 'salaries',  label: 'Payroll',    icon: Calendar },
              { id: 'reports',   label: 'Reports',    icon: FileText },
              { id: 'help',      label: 'Help',       icon: HelpCircle },
              { id: 'settings',  label: 'Settings',   icon: Settings },
            ].map(item => (
              <button key={item.id} onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${activeTab === item.id ? 'bg-black text-white' : 'text-gray-500 hover:bg-gray-100 hover:text-black'}`}>
                <item.icon size={14} /> {item.label}
              </button>
            ))}
          </div>

          {/* Desktop logout */}
          <div className="hidden md:flex pl-4 border-l border-gray-200 items-center gap-2">
            <button onClick={logout} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-500 hover:bg-gray-50 transition-colors">
              Logout
            </button>
          </div>

          {/* Mobile: animated hamburger → X on the RIGHT */}
          <button
            onClick={() => setIsSidebarOpen(o => !o)}
            className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="Toggle menu"
          >
            <div className="w-5 h-4 flex flex-col justify-between">
              <span className={`block h-0.5 bg-gray-700 rounded-full origin-center transition-all duration-300 ease-in-out ${isSidebarOpen ? 'rotate-45 translate-y-[7px]' : ''}`} />
              <span className={`block h-0.5 bg-gray-700 rounded-full transition-all duration-300 ease-in-out ${isSidebarOpen ? 'opacity-0 scale-x-0' : ''}`} />
              <span className={`block h-0.5 bg-gray-700 rounded-full origin-center transition-all duration-300 ease-in-out ${isSidebarOpen ? '-rotate-45 -translate-y-[7px]' : ''}`} />
            </div>
          </button>

        </div>
      </nav>

      <main className="max-w-6xl mx-auto w-full p-3 sm:p-6 lg:p-8 relative z-10">

        {/* Global Header */}
        <header className="mb-5 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-black tracking-tight capitalize">
              {activeTab === 'ledger' ? 'Financial Ledgers' : activeTab === 'salaries' ? 'Payroll' : activeTab === 'settings' ? 'Settings' : activeTab === 'help' ? 'Help & Guide' : activeTab.replace('-', ' ')}
            </h2>
            <p className="text-gray-500 text-[10px] mt-0.5 uppercase tracking-widest">{company?.companyName} • {fyRange.label}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-lg w-full outline-none focus:border-black text-xs transition-colors" />
            </div>
            <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-white border border-gray-200 px-2.5 py-2 text-xs font-semibold outline-none cursor-pointer text-gray-700 rounded-lg focus:border-black transition-colors shrink-0">
              {monthOptions.map(m => <option key={m.key} value={m.key}>{m.label}</option>)}
            </select>
          </div>
        </header>

        {/* DASHBOARD TAB */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6 tab-fade">
            {(overAdvancedStaff.length > 0 || pendingPayouts.length > 0) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {overAdvancedStaff.length > 0 && (
                  <div onClick={() => { setModalType('warning-over-advance'); setIsModalOpen(true); }}
                    className="bg-red-50 border border-red-200 p-4 rounded-xl flex items-start gap-4 cursor-pointer hover:bg-red-100 transition-colors group">
                    <AlertTriangle size={20} className="text-red-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-red-900 text-sm">Advance Warning</h4>
                      <p className="text-red-700 text-xs mt-1">{overAdvancedStaff.length} staff have debt exceeding base pay.</p>
                      <p className="text-[10px] font-bold text-red-600 mt-2 flex items-center gap-1">Click to view <ChevronRight size={12} /></p>
                    </div>
                  </div>
                )}
                {pendingPayouts.length > 0 && (
                  <div onClick={() => { setModalType('warning-pending-payouts'); setIsModalOpen(true); }}
                    className="bg-orange-50 border border-orange-200 p-4 rounded-xl flex items-start gap-4 cursor-pointer hover:bg-orange-100 transition-colors group">
                    <Clock size={20} className="text-orange-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-orange-900 text-sm">Pending Payouts</h4>
                      <p className="text-orange-700 text-xs mt-1">{pendingPayouts.length} staff need salary records for last month.</p>
                      <p className="text-[10px] font-bold text-orange-600 mt-2 flex items-center gap-1">Click to resolve <ChevronRight size={12} /></p>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard title="Active Team" value={activeStaffList.length} icon={Users} />
              <StatCard title="Ledger Debt (-)" value={formatCurrency(Math.abs(activeStaffList.filter(st => (st.balance || 0) < 0).reduce((acc, curr) => acc + (curr.balance || 0), 0)))} icon={ArrowDownRight} isWarning={overAdvancedStaff.length > 0} />
              <StatCard title="Ledger Credit (+)" value={formatCurrency(activeStaffList.filter(st => (st.balance || 0) > 0).reduce((acc, curr) => acc + (curr.balance || 0), 0))} icon={ArrowUpRight} />
              <StatCard title="Processed Slips" value={transactions.filter(t => t.type === 'salary' && t.monthKey === selectedMonth).length} icon={FileText} />
            </div>

            <div className="grid grid-cols-1 gap-6">
              <div className="bg-white p-5 md:p-6 rounded-xl border border-gray-200 flex flex-col justify-between overflow-hidden shadow-sm">

                <div className="mb-6 flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-lg text-black">Expense Trend</h3>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-0.5">Past 6 Months</p>
                  </div>
                  <TrendingUp size={16} className="text-gray-400" />
                </div>
                <div className="flex items-end justify-between h-40 md:h-48 gap-2 border-b border-gray-100 pb-2">
                  {last6MonthsChart.data.map((m, i) => (
                    <div key={i} className="flex flex-col items-center flex-1 group relative h-full justify-end min-w-0">
                      <div className="w-full max-w-[40px] mx-auto bg-gray-200 rounded-t-sm transition-all group-hover:bg-black"
                        style={{ height: `${(m.total / last6MonthsChart.max) * 100}%`, minHeight: m.total > 0 ? '10%' : '0%' }}>
                        {m.total > 0 && <span className="absolute -top-8 left-1/2 -translate-x-1/2 text-[10px] font-medium text-black opacity-0 group-hover:opacity-100 transition-opacity bg-white border border-gray-200 px-2 py-1 rounded shadow-sm z-10 pointer-events-none whitespace-nowrap">{formatCurrency(m.total)}</span>}
                      </div>
                      <span className="text-[9px] font-semibold text-gray-400 mt-2 uppercase tracking-widest">{m.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STAFF TAB */}
        {activeTab === 'staff' && (
        <div className="space-y-4 tab-fade">
            {/* Department Cards View */}
            {!selectedDept ? (
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                <div>
                    <h3 className="font-bold text-lg text-black">Departments</h3>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-0.5">Click a department to manage its staff</p>
                </div>
                <button onClick={() => { setModalType('add-department'); setModalData({ name: '', description: '', color: '#6366f1' }); setIsModalOpen(true); }}
                    className="bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors flex items-center gap-2">
                    <Plus size={14} /> Add Department
                </button>
                </div>

                {/* Unassigned card */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
               

                {departments.map(dept => (
                    <div key={dept._id} onClick={() => setSelectedDept(dept)}
                    className="bg-white border border-gray-200 rounded-xl p-5 cursor-pointer hover:shadow-md transition-shadow group relative">
                    <div className="flex items-start justify-between mb-3">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: dept.color + '20' }}>
                        <Users size={18} style={{ color: dept.color }} />
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={(e) => { e.stopPropagation(); setModalType('edit-department'); setModalData({ deptId: dept._id, name: dept.name, description: dept.description, color: dept.color }); setIsModalOpen(true); }}
                            className="p-1.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-500 hover:text-black transition-colors">
                            <Edit3 size={12} />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); handleDeleteDept(dept._id); }}
                            className="p-1.5 bg-white border border-red-200 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors">
                            <X size={12} />
                        </button>
                        </div>
                    </div>
                    <h4 className="font-bold text-black text-base">{dept.name}</h4>
                    {dept.description && <p className="text-[10px] text-gray-400 mt-0.5 truncate">{dept.description}</p>}
                    <p className="text-[10px] text-gray-500 mt-2 uppercase tracking-widest">{dept.staffCount || 0} active staff</p>
                    </div>
                ))}

                {departments.length === 0 && (
                    <div className="col-span-full py-12 bg-white rounded-xl border border-dashed border-gray-300 text-center">
                    <p className="text-gray-400 text-sm">No departments yet. Create one to organise your staff.</p>
                    </div>
                )}
                </div>
            </div>
            ) : (
            /* Department Staff View */
            <div className="space-y-4">
                <div className="flex items-center justify-between gap-2 bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
                <button onClick={() => setSelectedDept(null)} className="flex items-center gap-1 text-gray-600 hover:text-black font-semibold text-xs transition-colors bg-white border border-gray-200 px-3 py-2 rounded-lg">
                    <ChevronLeft size={16} /> Departments
                </button>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: selectedDept.color }}></div>
                    <span className="font-bold text-black text-sm">{selectedDept.name}</span>
                </div>
            <ActionGroup
                      primary={{ label: 'Add Staff', icon: Plus, onClick: () => { setModalType('add-staff'); setModalData({ name: '', role: '', salary: 0, fixedAllowance: 0, fixedDeduction: 0, weeklyOff: 'weekend', department: selectedDept._id === 'unassigned' ? null : selectedDept._id }); setIsModalOpen(true); } }}
                      secondary={[{ label: 'Export Staff', icon: Download, onClick: downloadStaffTemplate }]}
                    />
                </div>

        {/* Active / Inactive tabs */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-gray-200 flex items-center gap-3">
            <div className="flex bg-gray-100 p-1 rounded-lg w-fit">
              <button onClick={() => setStaffTabFilter('active')} className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${staffTabFilter === 'active' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}>Active</button>
              <button onClick={() => setStaffTabFilter('inactive')} className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${staffTabFilter === 'inactive' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}>Inactive</button>
            </div>
          </div>
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left whitespace-nowrap">
              <thead className="bg-gray-50 text-[10px] uppercase text-gray-500 font-bold border-b border-gray-200 tracking-wider">
                <tr><th className="px-4 py-3">Employee</th><th className="px-4 py-3">Role</th><th className="px-4 py-3 text-center">Weekly Off</th><th className="px-4 py-3 text-center">Base Salary</th><th className="px-4 py-3 text-right">Actions</th></tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm text-gray-800">
                {staff.filter(s => {
                  const deptMatch = selectedDept._id === 'unassigned'
                    ? !s.department
                    : (s.department?._id || s.department) === selectedDept._id;
                  const statusMatch = staffTabFilter === 'active' ? s.isActive !== false : s.isActive === false;
                  const searchMatch = String(s.name).toLowerCase().includes(searchTerm.toLowerCase()) || String(s.role).toLowerCase().includes(searchTerm.toLowerCase());
                  return deptMatch && statusMatch && searchMatch;
                }).map(s => (
                  <tr key={s._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 flex items-center gap-3 font-semibold text-black">
                      <Avatar src={s.avatar} name={s.name} isInactive={s.isActive === false} />
                      <span className={s.isActive === false ? 'text-gray-400 font-medium' : ''}>{s.name}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{s.role}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-[10px] uppercase font-bold tracking-wider">
                        {s.weeklyOff === 'weekend' ? 'Sat+Sun' : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][s.weeklyOff !== undefined ? s.weeklyOff : 0]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="font-semibold text-sm">{formatCurrency(s.salary)}</div>
                      {((s.fixedAllowance > 0) || (s.fixedDeduction > 0)) && <div className="text-[9px] text-gray-400 mt-0.5 space-x-1.5 font-medium">{s.fixedAllowance > 0 && <span className="text-emerald-600">+{s.fixedAllowance} Allow</span>}{s.fixedDeduction > 0 && <span className="text-red-600">-{s.fixedDeduction} Deduct</span>}</div>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => { setModalType('edit-staff'); setModalData({ staffId: s._id, name: s.name, role: s.role, salary: s.salary, fixedAllowance: s.fixedAllowance || 0, fixedDeduction: s.fixedDeduction || 0, weeklyOff: s.weeklyOff !== undefined ? s.weeklyOff : 0, effectiveDate: new Date().toISOString().split('T')[0], department: s.department?._id || s.department || null }); setCredEmail(s.email || ''); setCredPwd(''); setCredConfirm(''); setCredMsg(''); setCredErr(''); setIsModalOpen(true); }}
                          className="text-gray-600 hover:text-black bg-white border border-gray-200 px-3 py-1.5 rounded text-xs font-semibold transition-colors shadow-sm">Edit</button>
                        <button onClick={() => { setModalType('update-salary'); setModalData({ staffId: s._id, name: s.name, amount: s.salary, effectiveDate: new Date().toISOString().split('T')[0] }); setIsModalOpen(true); }}
                          className="text-gray-600 hover:text-black bg-white border border-gray-200 px-3 py-1.5 rounded text-xs font-semibold transition-colors shadow-sm">Revise</button>
                        {s.isActive !== false ? (
                          <button onClick={() => toggleStaffStatus(s._id, s.isActive)} className="p-1.5 text-gray-500 bg-gray-50 hover:bg-gray-200 border border-gray-200 rounded transition-colors"><Archive size={14} /></button>
                        ) : (
                          <button onClick={() => toggleStaffStatus(s._id, s.isActive)} className="p-1.5 text-black bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded transition-colors"><ArchiveRestore size={14} /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {staff.filter(s => {
              const deptMatch = selectedDept._id === 'unassigned'
                ? !s.department
                : (s.department?._id || s.department) === selectedDept._id;                  return deptMatch && (staffTabFilter === 'active' ? s.isActive !== false : s.isActive === false);
                }).length === 0 && (
                  <tr><td colSpan="5" className="px-6 py-12 text-center text-gray-400 text-sm">No {staffTabFilter} staff in this department.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )}
  </div>
)}

        {/* LEDGER TAB */}
        {activeTab === 'ledger' && (
          <div className="space-y-4 tab-fade">
            {!selectedLedgerStaff ? (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between gap-4">
                  <h3 className="font-bold text-lg text-black">Select Account</h3>
                  <button onClick={() => { setModalType('new-advance'); setModalData({ staffId: staff[0]?._id, type: 'advance', amount: 0, remarks: '', date: new Date().toISOString().split('T')[0], paymentMode: 'Cash' }); setIsModalOpen(true); }}
                    className="bg-black text-white px-3 sm:px-4 py-2 rounded-lg text-xs font-semibold hover:bg-gray-800 transition-colors flex items-center gap-2">
                    <Edit3 size={14} /> Entry
                  </button>
                </div>
                <div className="overflow-x-auto w-full">
                  <table className="w-full text-left whitespace-nowrap">
                    <thead className="bg-gray-50 text-[10px] uppercase text-gray-500 font-bold border-b border-gray-200 tracking-wider">
                      <tr><th className="px-4 py-3">Employee</th><th className="px-4 py-3 text-center">Role</th><th className="px-4 py-3 text-right">Balance</th><th className="px-4 py-3 text-center"></th></tr>
                    </thead>
                    <tbody className="text-sm text-gray-800">
                      {activeLedgerStaff.length > 0 && <tr><td colSpan="4" className="bg-gray-50 border-b border-gray-200 text-[10px] font-bold text-gray-500 uppercase tracking-widest px-4 py-2">Active Accounts</td></tr>}
                      {activeLedgerStaff.map(s => renderLedgerRow(s))}
                      {inactiveLedgerWithBalance.length > 0 && <tr><td colSpan="4" className="bg-red-50 border-y border-red-100 text-[10px] font-bold text-red-700 uppercase tracking-widest px-4 py-2"><span className="flex items-center gap-2"><AlertTriangle size={12} /> Pending Settlements</span></td></tr>}
                      {inactiveLedgerWithBalance.map(s => renderLedgerRow(s))}
                      {archivedLedgerStaff.length > 0 && (
                        <>
                          <tr><td colSpan="4" className="bg-gray-100 border-y border-gray-200 text-[10px] font-bold text-gray-500 uppercase tracking-widest px-4 py-2 cursor-pointer hover:bg-gray-200 transition-colors" onClick={() => setShowArchivedLedgers(!showArchivedLedgers)}>
                            <div className="flex items-center gap-2"><Archive size={12} /> Archived (Settled) {showArchivedLedgers ? <ChevronDown size={14} /> : <ChevronRight size={14} />}</div>
                          </td></tr>
                          {showArchivedLedgers && archivedLedgerStaff.map(s => renderLedgerRow(s))}
                        </>
                      )}
                      {filteredStaffList.length === 0 && <tr><td colSpan="4" className="text-center py-12 text-gray-400 text-sm">No accounts found.</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2 bg-white p-2 rounded-xl border border-gray-200 shadow-sm">
                  <button onClick={() => setSelectedLedgerStaff(null)} className="flex items-center gap-1 text-gray-600 hover:text-black font-semibold text-xs transition-colors bg-white border border-gray-200 px-3 py-2 rounded-lg"><ChevronLeft size={16} /> Back</button>
                  <ActionGroup
                    primary={{ label: 'Entry', icon: Edit3, onClick: () => { setModalType('new-advance'); setModalData({ staffId: selectedLedgerStaff._id, type: 'advance', amount: 0, remarks: '', date: new Date().toISOString().split('T')[0], paymentMode: 'Cash' }); setIsModalOpen(true); } }}
                    secondary={[
                      { label: 'Export CSV', icon: FileSpreadsheet, onClick: handleExportCSV },
                      { label: 'Download PDF', icon: Download, onClick: () => handleExportPDF(`Ledger_${selectedLedgerStaff.name}`) }
                    ]}
                  />
                </div>
                <div ref={pdfSourceRef} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                  <div className="p-4 md:p-6 border-b border-gray-200 bg-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Avatar src={selectedLedgerStaff.avatar} name={selectedLedgerStaff.name} className="w-10 h-10" isInactive={selectedLedgerStaff.isActive === false} />
                      <div>
                        <h4 className="text-lg font-bold text-black">{selectedLedgerStaff.name}</h4>
                        <p className="text-xs text-gray-500 mt-0.5">{selectedLedgerStaff.role} • FY Statement</p>
                      </div>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                      <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Balance</p>
                      <p className={`text-xl font-bold ${selectedLedgerStaff.balance > 0 ? 'text-emerald-600' : selectedLedgerStaff.balance < 0 ? 'text-red-600' : 'text-black'}`}>{formatCurrency(selectedLedgerStaff.balance)}</p>
                    </div>
                  </div>
                  <div className="overflow-x-auto w-full">
                    <table className="w-full text-left whitespace-nowrap">
                      <thead className="bg-white text-[10px] text-gray-500 uppercase font-bold tracking-wider border-b border-gray-200">
                        <tr><th className="px-4 py-3">Date</th><th className="px-4 py-3">Category</th><th className="px-4 py-3">Description</th><th className="px-4 py-3 text-right">Debit (-)</th><th className="px-4 py-3 text-right">Credit (+)</th></tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 text-sm text-gray-800">
                        {getStaffLedger(selectedLedgerStaff._id).map(t => (
                          <tr key={t._id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3 text-xs font-medium text-gray-600">{t.date}</td>
                            <td className="px-4 py-3"><span className="text-[9px] font-bold text-gray-600 border border-gray-200 bg-white px-1.5 py-0.5 rounded uppercase tracking-wider">{t.type}</span></td>
                            <td className="px-4 py-3 text-gray-600 text-xs truncate max-w-[150px] sm:max-w-xs">{t.note}</td>
                            <td className="px-4 py-3 text-right font-semibold text-red-600 text-xs">{t.type === 'advance' || t.type === 'salary' ? formatCurrency(t.amount) : '-'}</td>
                            <td className="px-4 py-3 text-right font-semibold text-emerald-600 text-xs">{t.type === 'salary' ? formatCurrency((t.earnedSalary || 0) + (t.overtime || 0) + (t.bonus || 0)) : (t.type === 'adjustment' ? formatCurrency(t.amount) : '-')}</td>
                          </tr>
                        ))}
                        {getStaffLedger(selectedLedgerStaff._id).length === 0 && <tr><td colSpan="5" className="px-6 py-12 text-center text-gray-400 text-sm">No records found.</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ATTENDANCE TAB */}
        {activeTab === 'attendance' && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm tab-fade">
            <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row justify-between gap-3 sm:items-center">
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-lg text-black">Attendance Log</h3>
                <div className="flex items-center gap-2 mt-2">
                <select value={activeDeptFilter} onChange={e => setActiveDeptFilter(e.target.value)}
                    className="bg-white border border-gray-200 px-3 py-1.5 text-xs font-semibold outline-none cursor-pointer text-gray-700 rounded-lg focus:border-black transition-colors">
                    <option value="all">All Departments</option>
                    
                    {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                </select>
                </div>
                <div className="flex overflow-x-auto gap-1.5 mt-1.5">
                    <span className="text-[9px] font-semibold text-gray-500 border border-gray-200 bg-gray-100 px-1.5 rounded whitespace-nowrap">WE: Weekend</span>
                    <span className="text-[9px] font-semibold text-yellow-700 border border-yellow-200 bg-yellow-50 px-1.5 rounded whitespace-nowrap">PH: Public Holiday</span>
                    <span className="text-[9px] font-semibold text-emerald-700 border border-emerald-200 bg-emerald-50 px-1.5 rounded whitespace-nowrap">P: Present</span>
                    <span className="text-[9px] font-semibold text-amber-700 border border-amber-200 bg-amber-50 px-1.5 rounded whitespace-nowrap">HD: Half Day</span>
                    <span className="text-[9px] font-semibold text-blue-700 border border-blue-200 bg-blue-50 px-1.5 rounded whitespace-nowrap">OT: Overtime</span>
                    <span className="text-[9px] font-semibold text-purple-700 border border-purple-200 bg-purple-50 px-1.5 rounded whitespace-nowrap">PL / SL:Paid or sick Leave</span>
                    <span className="text-[9px] font-semibold text-red-700 border border-red-200 bg-red-50 px-1.5 rounded whitespace-nowrap">A: Absent</span>
                </div>
              </div>
              <ActionGroup
                  primary={{ label: 'Export Excel', icon: Download, onClick: () => { setModalType('attendance-export'); setModalData({ dept: 'all', from: `${selectedMonth}-01`, to: `${selectedMonth}-${String(new Date(Number(selectedMonth.split('-')[0]), Number(selectedMonth.split('-')[1]), 0).getDate()).padStart(2,'0')}` }); setIsModalOpen(true); } }}
                  secondary={[{ label: 'Auto-Fill', icon: MousePointer2, onClick: () => { setModalType('attendance-range'); setModalData({ targetStaffId: 'all', startDate: `${selectedMonth}-01`, endDate: `${selectedMonth}-01`, status: 'P' }); setIsModalOpen(true); } }]}
              />
            </div>
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 text-[9px] uppercase text-gray-500 font-bold border-b border-gray-200 tracking-wider">
                  <tr>
                    <th className="px-4 py-2.5 border-r border-gray-200 sticky left-0 bg-gray-50 z-20 min-w-[140px]">Employee</th>
                   {monthDates.map(d => {
                        const isPHDate = activeStaffList.length > 0 &&
                            (attendance[activeStaffList[0]?._id] || {})[d.dateStr] === 'PH';
                        return (
                            <th key={d.dateStr} onClick={() => togglePHForDate(d.dateStr)}
                            title="Click to mark as Public Holiday for all"
                            className={`px-1 py-2.5 text-center border-r border-gray-200 min-w-[32px] cursor-pointer hover:bg-yellow-50 transition-colors ${isPHDate ? 'bg-yellow-50' : ''}`}>
                            <div className="text-gray-400">{d.dayName[0]}</div>
                            <div className={`mt-0.5 text-[10px] font-bold ${isPHDate ? 'text-yellow-600' : 'text-black'}`}>
                                {isPHDate ? 'PH' : d.dayNum}
                            </div>
                            </th>
                        );
                        })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {deptFilteredStaff.map(s => (
                    <tr key={s._id} className="hover:bg-gray-50 transition-colors group">
                      <td className="px-4 py-2 border-r border-gray-200 sticky left-0 bg-white group-hover:bg-gray-50 z-10 font-semibold text-black flex items-center gap-2 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                        <Avatar src={s.avatar} name={s.name} className="w-6 h-6" />
                        <span className="truncate max-w-[100px] text-xs">{s.name}</span>
                      </td>
                      {monthDates.map(d => {
               const isOff = isWeekendOff(s, d.dayOfWeek);
                            const status = (attendance[s._id] || {})[d.dateStr] || '';
                            const displayStatus = (!status || status === '') && isOff ? 'WE' : (status || '');

                            let colorClass = 'text-gray-400 font-normal';
                            if (displayStatus === 'P') colorClass = 'text-emerald-700 bg-emerald-50 border border-emerald-200 font-bold';
                            else if (displayStatus === 'A') colorClass = 'text-red-700 bg-red-50 border border-red-200 font-bold';
                            else if (displayStatus === 'HD') colorClass = 'text-amber-700 bg-amber-50 border border-amber-200 font-bold';
                            else if (displayStatus === 'OT') colorClass = 'text-blue-700 bg-blue-50 border border-blue-200 font-bold';
                            else if (displayStatus === 'WE') colorClass = 'text-gray-500 bg-gray-100 border border-gray-200 text-[9px] font-semibold';
                            else if (displayStatus === 'PH') colorClass = 'text-yellow-700 bg-yellow-50 border border-yellow-200 text-[9px] font-semibold';
                            else if (displayStatus === 'PL' || displayStatus === 'SL') colorClass = 'text-purple-700 bg-purple-50 border border-purple-200 font-bold text-[9px]';

                            return (
                            <td key={d.dateStr} onClick={() => toggleAttendance(s._id, d.dateStr, status, isOff)}
                                className={`p-0.5 border-r border-gray-100 text-center cursor-pointer transition-colors ${isOff ? 'bg-gray-50' : ''}`}>
                                <div className={`w-full h-7 flex items-center justify-center text-[10px] rounded-sm transition-all hover:opacity-80 ${displayStatus ? colorClass : 'hover:bg-gray-200'}`}>
                              {displayStatus || '-'}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                  {deptFilteredStaff.length === 0 && <tr><td colSpan={monthDates.length + 1} className="text-center py-12 text-gray-400 text-sm">No active staff found.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* PAYROLL TAB */}
        {activeTab === 'salaries' && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm tab-fade">
            <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row justify-between gap-3 sm:items-center">
             <h3 className="font-bold text-lg text-black">Payroll Processing</h3>
                <div className="flex items-center gap-2">
                <select value={activeDeptFilter} onChange={e => setActiveDeptFilter(e.target.value)}
                    className="bg-white border border-gray-200 px-3 py-1.5 text-xs font-semibold outline-none cursor-pointer text-gray-700 rounded-lg focus:border-black transition-colors">
                    <option value="all">All Departments</option>
                
                    {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                </select>
                <span className="bg-gray-100 text-black text-[10px] font-bold px-2 py-1.5 rounded uppercase tracking-wider border border-gray-200 w-fit">{getMonthYear(selectedMonth)}</span>
                </div>
            </div>
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left whitespace-nowrap">
                <thead className="bg-gray-50 text-[10px] text-gray-500 font-bold border-b border-gray-200 uppercase tracking-wider">
                  <tr><th className="px-4 py-3">Employee</th><th className="px-4 py-3 text-center">Calculated Earnings</th><th className="px-4 py-3 text-center">Previous Balance</th><th className="px-4 py-3 text-center">Attendance</th><th className="px-4 py-3 text-right">Action</th></tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm text-gray-800">
                    {deptFilteredStaff.map(person => {                    
                    const stats = calculateLiveStats(person, selectedMonth);
                    const monthSlips = transactions.filter(t => {
                      const tStaffId = t.staff?._id || t.staff;
                      return tStaffId === person._id && t.type === 'salary' && t.monthKey === selectedMonth;
                    });
                    return (
                      <tr key={person._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 flex items-center gap-2 font-semibold text-black"><Avatar src={person.avatar} name={person.name} className="w-8 h-8" />{person.name}</td>
                        <td className="px-4 py-3 text-center font-medium text-xs">{formatCurrency(stats.earnedSalary)}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-1 rounded border text-[10px] font-bold ${person.balance < 0 ? 'text-red-700 bg-red-50 border-red-200' : person.balance > 0 ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-gray-500 bg-gray-50 border-gray-200'}`}>{formatCurrency(person.balance)}</span>
                        </td>
                        <td className="px-4 py-3 text-center text-[10px] font-medium text-gray-500">{stats.presentDays}P / {stats.paidHolidayCount}PH / {stats.halfDays}H / {stats.otDays}OT</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex flex-col items-end gap-1.5">
                            <button onClick={() => handlePayTrigger(person)} className="bg-black text-white px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-gray-800 transition-colors flex items-center gap-1">Process <ChevronRight size={12} /></button>
                            {monthSlips.length > 0 && (
                              <div className="flex gap-1 mt-1">
                                {monthSlips.map((slip, idx) => (
                                  <button key={slip._id} onClick={() => viewSlip(slip)} className="text-[9px] font-bold text-gray-600 hover:text-black border border-gray-300 px-1.5 py-0.5 rounded bg-white transition-colors uppercase tracking-wider shadow-sm">Slip #{idx + 1}</button>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                    {deptFilteredStaff.length === 0 && <tr><td colSpan="5" className="px-6 py-12 text-center text-gray-400 text-sm">No active staff found.</td></tr>}                
                </tbody>
              </table>
            </div>
          </div>
        )}

            {/* REPORTS TAB */}
            {activeTab === 'reports' && (
              <div className="space-y-4 tab-fade">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-lg text-black">Salary Reports</h3>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-0.5">{getMonthYear(selectedMonth)}</p>
                  </div>
                  <button onClick={() => setShowExportModal(true)}
                    className="bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors flex items-center gap-2">
                    <Download size={14} /> Export Excel
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {transactions.filter(t => t.monthKey === selectedMonth && t.type === 'salary').length === 0 ? (
                <div className="col-span-full py-16 bg-white rounded-xl border border-gray-200 text-center text-gray-500 text-sm font-medium">No salary slips for {getMonthYear(selectedMonth)}.</div>
              ) : (
                transactions.filter(t => t.monthKey === selectedMonth && t.type === 'salary').map(tx => {
                  const tStaffId = tx.staff?._id || tx.staff;
                  const staffMember = tx.staff?.name ? tx.staff : staff.find(s => s._id === tStaffId);
                  return (
                    <div key={tx._id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3 min-w-0 pr-2">
                          <div className="p-2 bg-gray-100 text-black rounded-lg flex-shrink-0"><FileText size={16} /></div>
                          <div className="min-w-0">
                            <p className="font-bold text-sm text-black truncate">{staffMember?.name || 'Unknown'}</p>
                            <p className="text-[10px] text-gray-500 font-medium mt-0.5">{tx.date}</p>
                          </div>
                        </div>
                        <button onClick={() => viewSlip(tx)} className="p-2 text-gray-500 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-black transition-colors flex-shrink-0 shadow-sm"><Printer size={14} /></button>
                      </div>
                      <div>
                        <div className="flex justify-between text-xs mb-2 items-end">
                          <span className="text-gray-500 font-bold text-[9px] uppercase tracking-widest">Net Payout</span>
                          <span className="font-bold text-xl text-black">{formatCurrency(tx.amount)}</span>
                        </div>
                                                    {tx.overtime > 0 && (
                              <p className="text-[10px] text-blue-700 bg-blue-50 border border-blue-200 p-1.5 rounded mt-1">
                                OT: {formatCurrency(tx.overtime)} ({tx.otDays} days)
                              </p>
                            )}
                        {tx.note && <p className="text-[10px] text-gray-600 bg-gray-50 border border-gray-200 p-2 rounded line-clamp-1 italic">"{tx.note}"</p>}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* HELP TAB */}
        {activeTab === 'help' && <div className="tab-fade"><HelpTab /></div>}

        {/* SETTINGS TAB */}
        {activeTab === 'settings' && <div className="tab-fade"><SettingsTab company={company} /></div>}

        {/* MODALS */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>

            {/* Warning Modals */}
            {modalType === 'warning-over-advance' && (
              <div className="bg-white rounded-xl w-full max-w-md shadow-xl p-5 relative z-10 flex flex-col max-h-[85vh]">
                <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-lg text-red-600 flex items-center gap-2"><AlertTriangle size={18} /> Advance Warning</h3><button onClick={() => setIsModalOpen(false)} className="p-1 text-gray-400 hover:bg-gray-100 rounded"><X size={16} /></button></div>
                <div className="overflow-y-auto space-y-2 flex-1">
                  {overAdvancedStaff.map(s => (
                    <div key={s._id} className="flex justify-between items-center p-3 bg-white border border-gray-200 rounded-lg">
                      <div className="flex items-center gap-3"><Avatar src={s.avatar} name={s.name} className="w-8 h-8" /><div><p className="font-semibold text-black text-sm">{s.name}</p><p className="text-[10px] text-gray-500">Base: {formatCurrency(s.salary)}</p></div></div>
                      <p className="font-bold text-base text-red-600">{formatCurrency(s.balance)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {modalType === 'warning-pending-payouts' && (
              <div className="bg-white rounded-xl w-full max-w-md shadow-xl p-5 relative z-10 flex flex-col max-h-[85vh]">
                <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-lg text-orange-600 flex items-center gap-2"><Clock size={18} /> Pending Payouts</h3><button onClick={() => setIsModalOpen(false)} className="p-1 text-gray-400 hover:bg-gray-100 rounded"><X size={16} /></button></div>
                <div className="overflow-y-auto space-y-2 flex-1">
                  {pendingPayouts.map(s => (
                    <div key={s._id} className="flex justify-between items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg">
                      <div className="flex items-center gap-3"><Avatar src={s.avatar} name={s.name} className="w-8 h-8" /><p className="font-semibold text-black text-sm">{s.name}</p></div>
                      <button onClick={() => { setIsModalOpen(false); setActiveTab('salaries'); setSelectedMonth(getPrevMonthKey()); }} className="bg-white border border-gray-300 text-black px-3 py-1.5 rounded-lg font-semibold text-[10px] uppercase tracking-wider hover:bg-gray-50 whitespace-nowrap">Go to Payroll</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Salary Slip Modal */}
            {modalType === 'slip' && (
              <div className="bg-white rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden relative z-10 flex flex-col max-h-[95vh]">
                <div className="p-3 flex flex-wrap justify-end gap-2 border-b border-gray-200 bg-gray-50 shrink-0">
                  <button onClick={shareWhatsApp} className="bg-white border border-gray-300 text-black px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 hover:bg-gray-50"><MessageCircle size={14} className="text-[#25D366]" /> Send</button>
                  <button onClick={() => handleExportPDF(`Slip_${modalData.employee?.name}_${modalData.monthKey}`, true)} className="bg-white border border-gray-300 text-black px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 hover:bg-gray-50">
                    {isExporting ? 'Wait...' : <><Share2 size={14} className="text-blue-500" /> Share</>}
                  </button>
                  <button onClick={() => handleExportPDF(`Slip_${modalData.employee?.name}_${modalData.monthKey}`)} className="bg-black text-white px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 hover:bg-gray-800"><Download size={14} /> PDF</button>
                  <button onClick={() => setIsModalOpen(false)} className="p-1.5 ml-1 text-gray-500 hover:bg-gray-200 rounded-md"><X size={16} /></button>
                </div>
                <div className="overflow-y-auto flex-1 bg-white">
                  <div ref={pdfSourceRef} className="p-6 md:p-8 space-y-5 bg-white">
                    <div className="flex justify-between items-start border-b border-gray-200 pb-3">
                      <div>
                        <h2 className="text-xl font-bold text-black uppercase">Settlement Statement</h2>
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">{getMonthYear(modalData.monthKey)} • {fyRange.label}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] text-gray-400 uppercase tracking-widest">Reference</p>
                        <p className="text-xs font-bold text-black">#{String(modalData._id || '').slice(-6).toUpperCase()}</p>
                        <p className="text-[9px] text-gray-500 mt-1 uppercase font-semibold">Via: {modalData.paymentMode}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Avatar src={modalData.employee?.avatar} name={modalData.employee?.name} className="w-12 h-12" />
                      <div><p className="font-bold text-lg text-black">{modalData.employee?.name}</p><p className="text-[10px] font-medium text-gray-500">{modalData.employee?.role}</p></div>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 p-4 rounded-xl">
                      <div className="flex justify-between items-center mb-3">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Opening Balance</p>
                        <p className={`text-sm font-bold ${startOfMonthBalance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{formatCurrency(startOfMonthBalance)}</p>
                      </div>
                      <div className="flex justify-between items-center border-t border-gray-200 pt-3">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Pre-Salary Balance</p>
                        <p className={`text-sm font-bold ${modalData.openingBalance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{formatCurrency(modalData.openingBalance)}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="bg-gray-50 border border-gray-200 p-4 rounded-xl">
                        <p className="text-[9px] font-bold uppercase tracking-widest text-gray-500 mb-2">Attendance</p>
                        <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px] font-medium text-gray-700">
                          <div className="flex justify-between"><span>Present:</span><span className="font-bold text-black">{modalData.presentDays || 0}</span></div>
                          <div className="flex justify-between"><span>Absent:</span><span className="font-bold text-black">{modalData.absentDays || 0}</span></div>
                          <div className="flex justify-between"><span>Paid Holiday:</span><span className="font-bold text-black">{modalData.paidHolidayCount || 0}</span></div>
                          <div className="flex justify-between"><span>Paid Leave:</span><span className="font-bold text-black">{modalData.plCount || 0}</span></div>
                          <div className="flex justify-between"><span>Overtime:</span><span className="font-bold text-black">{modalData.otDays || 0}</span></div>
                        </div>
                      </div>
                      <div className="bg-gray-50 border border-gray-200 p-4 rounded-xl space-y-2">
                        <p className="text-[9px] font-bold uppercase tracking-widest text-gray-500 border-b border-gray-200 pb-1.5">Calculation</p>
                        <div className="space-y-1.5 text-[10px] text-gray-800">
                          <div className="flex justify-between"><span>Earned Base</span><span className="font-semibold">{formatCurrency(modalData.earnedSalary)}</span></div>
                          {modalData.overtime > 0 && <div className="flex justify-between"><span>OT Pay</span><span className="font-semibold">{formatCurrency(modalData.overtime)}</span></div>}
                          {modalData.bonus > 0 && <div className="flex justify-between"><span>Allowance</span><span className="font-semibold">{formatCurrency(modalData.bonus)}</span></div>}
                          {modalData.deductions > 0 && <div className="flex justify-between"><span>Deduction</span><span className="font-semibold text-red-600">-{formatCurrency(modalData.deductions)}</span></div>}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 border-t border-gray-200 pt-4">
                      <div><p className="text-[9px] font-bold uppercase tracking-widest text-gray-500 mb-0.5">Net Transfer</p><p className="text-2xl font-black text-black">{formatCurrency(modalData.amount)}</p></div>
                      <div className="sm:text-right"><p className="text-[9px] font-bold uppercase tracking-widest text-gray-500 mb-0.5">Closing Balance</p><p className={`text-base font-bold ${modalData.closingBalance > 0 ? 'text-emerald-600' : modalData.closingBalance < 0 ? 'text-red-600' : 'text-black'}`}>{formatCurrency(modalData.closingBalance)}</p></div>
                    </div>
                    {modalData.note && <div><p className="text-[9px] font-bold uppercase tracking-widest text-gray-500 mb-1">Remarks</p><p className="text-[10px] text-gray-700 italic">"{modalData.note}"</p></div>}
                  </div>
                </div>
              </div>
            )}

            {/* Revise Salary */}
            {modalType === 'update-salary' && (
              <div className="bg-white rounded-xl w-full max-w-md shadow-xl p-5 relative z-10 flex flex-col max-h-[85vh]">
                <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-lg text-black">Revise Base Salary</h3><button onClick={() => setIsModalOpen(false)} className="p-1 text-gray-400 hover:bg-gray-100 rounded-md"><X size={16} /></button></div>
                <div className="space-y-4 flex-1">
                  <div><label className="text-[10px] font-bold text-gray-600 block mb-1 uppercase tracking-widest">New Monthly Base (₹)</label><input type="number" className="w-full bg-white border border-gray-300 px-3 py-2 rounded-lg text-base font-bold outline-none focus:border-black" value={modalData.amount} onChange={(e) => setModalData({ ...modalData, amount: e.target.value })} /></div>
                  <div><label className="text-[10px] font-bold text-gray-600 block mb-1 uppercase tracking-widest">Effective From</label><input type="date" className="w-full bg-white border border-gray-300 px-3 py-2 rounded-lg text-sm outline-none focus:border-black" value={modalData.effectiveDate} onChange={(e) => setModalData({ ...modalData, effectiveDate: e.target.value })} /></div>
                </div>
                <div className="flex gap-2 mt-5">
                  <button onClick={() => setIsModalOpen(false)} className="flex-1 py-2 text-xs font-semibold text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
                  <button onClick={processPayment} className="flex-[2] py-2 bg-black text-white rounded-lg text-xs font-semibold hover:bg-gray-800">Save</button>
                </div>
              </div>
            )}

            {/* Edit Staff Modal */}
            
            {modalType === 'edit-staff' && (
            <div className="bg-white rounded-xl w-full max-w-md shadow-xl p-5 relative z-10 flex flex-col max-h-[85vh]">
                <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg text-black">Edit Staff</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-1 text-gray-400 hover:bg-gray-100 rounded-md"><X size={18} /></button>
                </div>
                <div className="space-y-3 overflow-y-auto flex-1">
                <div>
                    <label className="text-[10px] font-bold text-gray-600 block mb-1 uppercase tracking-widest">Full Name</label>
                    <input type="text" className="w-full bg-white border border-gray-300 px-3 py-1.5 rounded-lg text-sm outline-none focus:border-black" value={modalData.name} onChange={(e) => setModalData({ ...modalData, name: e.target.value })} />
                </div>
                <div>
                    <label className="text-[10px] font-bold text-gray-600 block mb-1 uppercase tracking-widest">Job Title</label>
                    <input type="text" className="w-full bg-white border border-gray-300 px-3 py-1.5 rounded-lg text-sm outline-none focus:border-black" value={modalData.role} onChange={(e) => setModalData({ ...modalData, role: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                    <label className="text-[10px] font-bold text-gray-600 block mb-1 uppercase tracking-widest">Allowance (+)</label>
                    <input type="number" className="w-full bg-white border border-gray-300 px-3 py-1.5 rounded-lg text-sm outline-none focus:border-black" value={modalData.fixedAllowance} onChange={(e) => setModalData({ ...modalData, fixedAllowance: Number(e.target.value) })} />
                    </div>
                    <div>
                    <label className="text-[10px] font-bold text-gray-600 block mb-1 uppercase tracking-widest">Deduction (-)</label>
                    <input type="number" className="w-full bg-white border border-gray-300 px-3 py-1.5 rounded-lg text-sm outline-none focus:border-black" value={modalData.fixedDeduction} onChange={(e) => setModalData({ ...modalData, fixedDeduction: Number(e.target.value) })} />
                    </div>
                </div>
                <div>
                    <label className="text-[10px] font-bold text-gray-600 block mb-1 uppercase tracking-widest">Weekly Off</label>
                    <select className="w-full bg-white border border-gray-300 px-3 py-1.5 rounded-lg text-sm outline-none focus:border-black" value={modalData.weeklyOff} onChange={(e) => {
                    const val = e.target.value;
                    setModalData({ ...modalData, weeklyOff: val === 'weekend' ? 'weekend' : Number(val) });
                    }}>
                    <option value="weekend">Sat + Sun (Weekend)</option>
                    <option value={0}>Sunday only</option>
                    <option value={1}>Monday</option>
                    <option value={2}>Tuesday</option>
                    <option value={3}>Wednesday</option>
                    <option value={4}>Thursday</option>
                    <option value={5}>Friday</option>
                    <option value={6}>Saturday only</option>
                    </select>
                </div>
                <div>
                    <label className="text-[10px] font-bold text-gray-600 block mb-1 uppercase tracking-widest">New Base Salary (₹)</label>
                    <input type="number" className="w-full bg-white border border-gray-300 px-3 py-1.5 rounded-lg text-sm outline-none focus:border-black" value={modalData.salary} onChange={(e) => setModalData({ ...modalData, salary: Number(e.target.value) })} />
                </div>
                <div>
                    <label className="text-[10px] font-bold text-gray-600 block mb-1 uppercase tracking-widest">Salary Effective From</label>
                    <input type="date" className="w-full bg-white border border-gray-300 px-3 py-1.5 rounded-lg text-sm outline-none focus:border-black" value={modalData.effectiveDate} onChange={(e) => setModalData({ ...modalData, effectiveDate: e.target.value })} />
                </div>
                <div>
                    <label className="text-[10px] font-bold text-gray-600 block mb-1 uppercase tracking-widest">Department</label>
                    <select className="w-full bg-white border border-gray-300 px-3 py-1.5 rounded-lg text-sm outline-none focus:border-black" value={modalData.department || ''} onChange={e => setModalData({ ...modalData, department: e.target.value || null })}>
                    <option value="">Unassigned</option>
                    {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                    </select>
                </div>
                {/* Employee Portal Credentials — separate section */}
                <div className="pt-3 border-t border-gray-100 space-y-2">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Employee Portal Credentials</p>
                  <div>
                    <label className="text-[10px] font-bold text-gray-600 block mb-1 uppercase tracking-widest">Login Email</label>
                    <input type="email" className="w-full bg-white border border-gray-300 px-3 py-1.5 rounded-lg text-sm outline-none focus:border-black" placeholder="staff@email.com" value={credEmail} onChange={e => setCredEmail(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-600 block mb-1 uppercase tracking-widest">Set Password <span className="text-gray-400 normal-case font-normal">(leave blank to keep)</span></label>
                    <div className="relative">
                      <input type={showCredPwd ? 'text' : 'password'} className="w-full bg-white border border-gray-300 px-3 py-1.5 pr-9 rounded-lg text-sm outline-none focus:border-black" placeholder="••••••" value={credPwd} onChange={e => setCredPwd(e.target.value)} />
                      <button type="button" onClick={() => setShowCredPwd(v => !v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">{showCredPwd ? <EyeOff size={14} /> : <Eye size={14} />}</button>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-600 block mb-1 uppercase tracking-widest">Confirm Password</label>
                    <div className="relative">
                      <input type={showCredConf ? 'text' : 'password'} className="w-full bg-white border border-gray-300 px-3 py-1.5 pr-9 rounded-lg text-sm outline-none focus:border-black" placeholder="••••••" value={credConfirm} onChange={e => setCredConfirm(e.target.value)} />
                      <button type="button" onClick={() => setShowCredConf(v => !v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">{showCredConf ? <EyeOff size={14} /> : <Eye size={14} />}</button>
                    </div>
                  </div>
                  {credErr && <p className="text-[11px] text-red-600 bg-red-50 border border-red-200 rounded-lg px-2 py-1.5">{credErr}</p>}
                  {credMsg && <p className="text-[11px] text-green-700 bg-green-50 border border-green-200 rounded-lg px-2 py-1.5">{credMsg}</p>}
                  <button onClick={handleSaveCredentials} disabled={credSaving}
                    className="w-full py-2 bg-gray-900 text-white rounded-lg text-xs font-semibold hover:bg-black transition-colors disabled:opacity-50">
                    {credSaving ? 'Saving...' : 'Save Credentials'}
                  </button>
                  <p className="text-[10px] text-gray-400 text-center">Share these credentials with your employee for portal access.</p>
                </div>
                </div>
                <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
                <button onClick={() => setIsModalOpen(false)} className="flex-1 py-2 text-xs font-semibold text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
                <button onClick={processPayment} className="flex-[2] py-2 bg-black text-white rounded-lg text-xs font-semibold hover:bg-gray-800">Save Changes</button>
                </div>
            </div>
            )}

            {/* New Advance / Adjustment */}
            {modalType === 'new-advance' && (
              <div className="bg-white rounded-xl w-full max-w-md shadow-xl p-5 relative z-10 flex flex-col max-h-[85vh]">
                <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-lg text-black">Ledger Entry</h3><button onClick={() => setIsModalOpen(false)} className="p-1 text-gray-400 hover:bg-gray-100 rounded-md"><X size={16} /></button></div>
                <div className="space-y-4 overflow-y-auto flex-1">
                  <div><label className="text-[10px] font-bold text-gray-600 block mb-1 uppercase tracking-widest">Target Account</label>
                    <select className="w-full bg-white border border-gray-300 px-3 py-2 rounded-lg text-sm outline-none focus:border-black" value={modalData.staffId} onChange={(e) => setModalData({ ...modalData, staffId: e.target.value })}>
                      {staff.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div><label className="text-[10px] font-bold text-gray-600 block mb-1 uppercase tracking-widest">Type</label>
                    <div className="flex gap-2">
                      <button onClick={() => setModalData({ ...modalData, type: 'advance' })} className={`flex-1 py-1.5 rounded-lg text-xs font-bold border ${modalData.type === 'advance' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}`}>Debit (-)</button>
                      <button onClick={() => setModalData({ ...modalData, type: 'adjustment' })} className={`flex-1 py-1.5 rounded-lg text-xs font-bold border ${modalData.type === 'adjustment' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}`}>Credit (+)</button>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-1"><label className="text-[10px] font-bold text-gray-600 block mb-1 uppercase tracking-widest">Amount (₹)</label><input type="number" className="w-full bg-white border border-gray-300 px-3 py-2 rounded-lg text-sm font-bold outline-none focus:border-black" value={modalData.amount} onChange={(e) => setModalData({ ...modalData, amount: e.target.value })} /></div>
                    <div className="flex-1"><label className="text-[10px] font-bold text-gray-600 block mb-1 uppercase tracking-widest">Mode</label>
                      <select className="w-full bg-white border border-gray-300 px-3 py-2 rounded-lg text-sm outline-none focus:border-black h-[38px]" value={modalData.paymentMode} onChange={(e) => setModalData({ ...modalData, paymentMode: e.target.value })}>
                        <option value="Cash">Cash</option><option value="Bank">Bank</option><option value="UPI">UPI</option>
                      </select>
                    </div>
                  </div>
                  <div><label className="text-[10px] font-bold text-gray-600 block mb-1 uppercase tracking-widest">Date</label><input type="date" className="w-full bg-white border border-gray-300 px-3 py-2 rounded-lg text-sm outline-none focus:border-black" value={modalData.date} onChange={(e) => setModalData({ ...modalData, date: e.target.value })} /></div>
                  <div><label className="text-[10px] font-bold text-gray-600 block mb-1 uppercase tracking-widest">Note</label><input type="text" placeholder="Reason..." className="w-full bg-white border border-gray-300 px-3 py-2 rounded-lg text-sm outline-none focus:border-black" value={modalData.remarks} onChange={(e) => setModalData({ ...modalData, remarks: e.target.value })} /></div>
                </div>
                <div className="flex gap-2 mt-5">
                  <button onClick={() => setIsModalOpen(false)} className="flex-1 py-2 text-xs font-semibold text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
                  <button onClick={processPayment} className="flex-[2] py-2 bg-black text-white rounded-lg text-xs font-semibold hover:bg-gray-800">Confirm Post</button>
                </div>
              </div>
            )}

            {/* Salary Process Modal */}
            {modalType === 'salary' && (
              <div className="bg-white rounded-xl w-full max-w-md shadow-2xl relative z-10 flex flex-col max-h-[85vh]">
                <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="font-bold text-lg text-black">Process Payout</h3>
                  <button onClick={() => setIsModalOpen(false)} className="p-1 text-gray-400 hover:bg-gray-100 rounded-md"><X size={16} /></button>
                </div>
                <div className="p-5 space-y-4 overflow-y-auto flex-1">
                  <div className="flex justify-between items-center bg-gray-50 border border-gray-200 p-3 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Avatar src={modalData.employee?.avatar} name={modalData.employee?.name} className="w-8 h-8" />
                      <div><p className="font-semibold text-sm text-black">{modalData.employee?.name}</p><p className="text-[9px] text-gray-500 uppercase tracking-widest">Base: {formatCurrency(modalData.employee?.salary)}</p></div>
                    </div>
                    <div className="text-right"><p className="text-[9px] uppercase font-bold text-gray-500 mb-0.5">Earned</p><p className="font-bold text-base text-black">{formatCurrency(modalData.earnedSalary)}</p></div>
                  </div>
                  {modalData.isSecondary && (
                    <div className="bg-orange-50 border border-orange-200 p-2.5 rounded-lg flex items-start gap-2">
                      <AlertTriangle size={14} className="text-orange-600 mt-0.5 shrink-0" />
                      <p className="text-[10px] text-orange-800">Base salary already recorded this month. Processing balances only.</p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="text-[10px] font-bold uppercase tracking-widest text-gray-600 block mb-1">Payout Date</label><input type="date" className="w-full bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-black" value={modalData.date || ''} onChange={(e) => setModalData({ ...modalData, date: e.target.value })} /></div>
                    <div>
                    
<label className="text-[10px] font-bold uppercase tracking-widest text-gray-600 block mb-1">
  OT Pay {modalData.otDays > 0 ? `(${modalData.otDays} days)` : ''}
</label>                    
                    <input type="number" className="w-full bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-black" value={modalData.overtime} onChange={(e) => setModalData({ ...modalData, overtime: Number(e.target.value) })} /></div>
                    
                    <div><label className="text-[10px] font-bold uppercase tracking-widest text-gray-600 block mb-1">Allowance</label><input type="number" className="w-full bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-black" value={modalData.bonus} onChange={(e) => setModalData({ ...modalData, bonus: Number(e.target.value) })} /></div>
                    <div><label className="text-[10px] font-bold uppercase tracking-widest text-gray-600 block mb-1">Deduction</label><input type="number" className="w-full bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-black" value={modalData.manualDeduction} onChange={(e) => setModalData({ ...modalData, manualDeduction: Number(e.target.value) })} /></div>
                    <div><label className="text-[10px] font-bold uppercase tracking-widest text-gray-600 block mb-1">Remarks</label><input type="text" className="w-full bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-black" value={modalData.remarks || ''} onChange={(e) => setModalData({ ...modalData, remarks: e.target.value })} /></div>
                    <div><label className="text-[10px] font-bold uppercase tracking-widest text-gray-600 block mb-1">Payment Mode</label><select className="w-full bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-black" value={modalData.paymentMode || 'Bank'} onChange={(e) => setModalData({ ...modalData, paymentMode: e.target.value })}><option value="Bank">Bank</option><option value="Cash">Cash</option><option value="UPI">UPI</option></select></div>
                    <div><label className="text-[10px] font-bold uppercase tracking-widest text-gray-600 block mb-1">Receipt</label>
                      <div onClick={() => attachmentRef.current?.click()} className="w-full bg-white border border-dashed border-gray-300 rounded-lg h-[34px] flex items-center justify-center gap-1.5 cursor-pointer hover:bg-gray-50">
                        {modalData.attachment ? <><CheckCircle2 size={12} className="text-emerald-500" /><span className="text-[10px] font-semibold text-emerald-600">Attached</span></> : <><Paperclip size={12} className="text-gray-400" /><span className="text-[10px] font-semibold text-gray-500">Upload</span></>}
                        <input type="file" ref={attachmentRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
                      </div>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-gray-100">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-700 block mb-1.5">Final Transfer Amount (₹)</label>
                    <input type="number" className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2 font-bold text-2xl text-black outline-none focus:border-black" value={modalData.actualPaid} onChange={(e) => setModalData({ ...modalData, actualPaid: Number(e.target.value) })} />
                    <div className="flex justify-between text-[9px] font-semibold text-gray-500 mt-1.5 px-1 uppercase tracking-widest">
                      <span>Net Due: {formatCurrency(totalAmountDueInModal)}</span>
                      <span>Carryover: <span className={totalAmountDueInModal - modalData.actualPaid >= 0 ? 'text-emerald-600' : 'text-red-600'}>{formatCurrency(totalAmountDueInModal - modalData.actualPaid)}</span></span>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-gray-50 flex gap-2 border-t border-gray-200">
                  <button onClick={() => setIsModalOpen(false)} className="flex-1 py-2 text-xs font-semibold text-gray-700 border border-gray-300 rounded-lg hover:bg-white">Cancel</button>
                  <button onClick={processPayment} className="flex-[2] py-2 bg-black text-white rounded-lg text-xs font-semibold hover:bg-gray-800">Confirm Payout</button>
                </div>
              </div>
            )}

            {/* Add Staff Modal */}
            {modalType === 'add-staff' && (
              <div className="bg-white rounded-xl w-full max-w-md shadow-xl p-5 relative z-10 flex flex-col max-h-[85vh]">
                <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-lg text-black">New Profile</h3><button onClick={() => setIsModalOpen(false)} className="p-1 text-gray-400 hover:bg-gray-100 rounded-md"><X size={18} /></button></div>
                <div className="space-y-3 overflow-y-auto flex-1">
                  <div><label className="text-[10px] font-bold text-gray-600 block mb-1 uppercase tracking-widest">Full Name</label><input type="text" className="w-full bg-white border border-gray-300 px-3 py-1.5 rounded-lg text-sm outline-none focus:border-black" placeholder="Name" value={modalData.name} onChange={(e) => setModalData({ ...modalData, name: e.target.value })} /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="text-[10px] font-bold text-gray-600 block mb-1 uppercase tracking-widest">Job Title</label><input type="text" className="w-full bg-white border border-gray-300 px-3 py-1.5 rounded-lg text-sm outline-none focus:border-black" placeholder="Role" value={modalData.role} onChange={(e) => setModalData({ ...modalData, role: e.target.value })} /></div>
                    <div><label className="text-[10px] font-bold text-gray-600 block mb-1 uppercase tracking-widest">Base Salary</label><input type="number" className="w-full bg-white border border-gray-300 px-3 py-1.5 rounded-lg text-sm outline-none focus:border-black" placeholder="0" value={modalData.salary} onChange={(e) => setModalData({ ...modalData, salary: Number(e.target.value) })} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="text-[10px] font-bold text-gray-600 block mb-1 uppercase tracking-widest">Allowance (+)</label><input type="number" className="w-full bg-white border border-gray-300 px-3 py-1.5 rounded-lg text-sm outline-none focus:border-black" placeholder="0" value={modalData.fixedAllowance} onChange={(e) => setModalData({ ...modalData, fixedAllowance: Number(e.target.value) })} /></div>
                    <div><label className="text-[10px] font-bold text-gray-600 block mb-1 uppercase tracking-widest">Deduction (-)</label><input type="number" className="w-full bg-white border border-gray-300 px-3 py-1.5 rounded-lg text-sm outline-none focus:border-black" placeholder="0" value={modalData.fixedDeduction} onChange={(e) => setModalData({ ...modalData, fixedDeduction: Number(e.target.value) })} /></div>
                  </div>
                  <div><label className="text-[10px] font-bold text-gray-600 block mb-1 uppercase tracking-widest">Weekly Off</label>
                    <select className="w-full bg-white border border-gray-300 px-3 py-1.5 rounded-lg text-sm outline-none focus:border-black" value={modalData.weeklyOff} onChange={(e) => {
                    const val = e.target.value;
                    setModalData({ ...modalData, weeklyOff: val === 'weekend' ? 'weekend' : Number(val) });
                    }}>
                    <option value="weekend">Sat + Sun (Weekend)</option>
                    <option value={0}>Sunday only</option>
                    <option value={1}>Monday</option>
                    <option value={2}>Tuesday</option>
                    <option value={3}>Wednesday</option>
                    <option value={4}>Thursday</option>
                    <option value={5}>Friday</option>
                    <option value={6}>Saturday only</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-600 block mb-1 uppercase tracking-widest">Department</label>
                    <select className="w-full bg-white border border-gray-300 px-3 py-1.5 rounded-lg text-sm outline-none focus:border-black" value={modalData.department || ''} onChange={e => setModalData({ ...modalData, department: e.target.value || null })}>
                      <option value="">No Department</option>
                      {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                    </select>
                  </div>
                  <div className="pt-2 border-t border-gray-100">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Portal Login (Optional)</p>
                    <div className="space-y-2">
                      <div><label className="text-[10px] font-bold text-gray-600 block mb-1 uppercase tracking-widest">Login Email</label><input type="email" className="w-full bg-white border border-gray-300 px-3 py-1.5 rounded-lg text-sm outline-none focus:border-black" placeholder="staff@email.com" value={modalData.staffEmail || ''} onChange={e => setModalData({ ...modalData, staffEmail: e.target.value })} /></div>
                      <div><label className="text-[10px] font-bold text-gray-600 block mb-1 uppercase tracking-widest">Password</label>
                        <div className="relative">
                          <input type={modalData.showStaffPwd ? 'text' : 'password'} className="w-full bg-white border border-gray-300 px-3 py-1.5 pr-9 rounded-lg text-sm outline-none focus:border-black" placeholder="min 6 chars" value={modalData.staffPassword || ''} onChange={e => setModalData({ ...modalData, staffPassword: e.target.value })} />
                          <button type="button" onClick={() => setModalData(d => ({ ...d, showStaffPwd: !d.showStaffPwd }))} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">{modalData.showStaffPwd ? <EyeOff size={14} /> : <Eye size={14} />}</button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
                  <button onClick={() => setIsModalOpen(false)} className="flex-1 py-2 text-xs font-semibold text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
                  <button onClick={processPayment} className="flex-[2] py-2 bg-black text-white rounded-lg text-xs font-semibold hover:bg-gray-800">Create Profile</button>
                </div>
              </div>
            )}

            {/* Bulk Attendance Range */}
            {modalType === 'attendance-range' && (
              <div className="bg-white rounded-xl w-full max-w-md shadow-xl p-5 relative z-10 flex flex-col max-h-[85vh]">
                <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-lg text-black">Auto-Fill Attendance</h3><button onClick={() => setIsModalOpen(false)} className="p-1 text-gray-400 hover:bg-gray-100 rounded-md"><X size={16} /></button></div>
                <div className="space-y-4 overflow-y-auto flex-1">
                  <div><label className="text-[10px] font-bold text-gray-600 block mb-1 uppercase tracking-widest">Employee</label>
                    <select className="w-full bg-white border border-gray-300 px-3 py-1.5 rounded-lg text-sm outline-none focus:border-black" value={modalData.targetStaffId} onChange={(e) => setModalData({ ...modalData, targetStaffId: e.target.value })}>
                      <option value="all">All Active</option>
                      {activeStaffList.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="text-[10px] font-bold text-gray-600 block mb-1 uppercase tracking-widest">Start Date</label><input type="date" className="w-full bg-white border border-gray-300 px-3 py-1.5 rounded-lg text-xs outline-none focus:border-black" value={modalData.startDate} onChange={(e) => setModalData({ ...modalData, startDate: e.target.value })} /></div>
                    <div><label className="text-[10px] font-bold text-gray-600 block mb-1 uppercase tracking-widest">End Date</label><input type="date" className="w-full bg-white border border-gray-300 px-3 py-1.5 rounded-lg text-xs outline-none focus:border-black" value={modalData.endDate} onChange={(e) => setModalData({ ...modalData, endDate: e.target.value })} /></div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-600 block mb-2 uppercase tracking-widest">Status</label>
                    <div className="grid grid-cols-3 gap-2">
                        {[{ id: 'P', l: 'Present' }, { id: 'A', l: 'Absent' }, { id: 'HD', l: 'Half Day' }, { id: 'OT', l: 'Overtime' }, { id: 'PL', l: 'Paid Leave' }, { id: 'SL', l: 'Sick Leave' }, { id: 'PH', l: 'Public Holiday' }, { id: 'WE', l: 'Weekend' }].map(s => (                       
                       <button key={s.id} onClick={() => setModalData({ ...modalData, status: s.id })} className={`py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${modalData.status === s.id ? 'bg-black text-white border-black' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}>{s.l}</button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
                  <button onClick={() => setIsModalOpen(false)} className="flex-1 py-2 text-xs font-semibold text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
                  <button onClick={applyBulkRangeAttendance} className="flex-[2] py-2 bg-black text-white rounded-lg text-xs font-semibold hover:bg-gray-800">Apply</button>
                </div>
              </div>
            )}
            {/* Attendance Export Modal */}
{modalType === 'attendance-export' && (
  <div className="bg-white rounded-xl w-full max-w-md shadow-xl p-5 relative z-10 flex flex-col max-h-[85vh]">
    <div className="flex justify-between items-center mb-5">
      <h3 className="font-bold text-lg text-black">Export Attendance</h3>
      <button onClick={() => setIsModalOpen(false)} className="p-1 text-gray-400 hover:bg-gray-100 rounded-md"><X size={16} /></button>
    </div>
    <div className="space-y-4 flex-1 overflow-y-auto">

      {/* Department filter */}
      <div>
        <label className="text-[10px] font-bold text-gray-600 block mb-1 uppercase tracking-widest">Department</label>
        <select className="w-full bg-white border border-gray-300 px-3 py-2 rounded-lg text-sm outline-none focus:border-black"
          value={modalData.dept} onChange={e => setModalData({ ...modalData, dept: e.target.value })}>
          <option value="all">All Departments</option>
          {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
        </select>
      </div>

      {/* Date range */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] font-bold text-gray-600 block mb-1 uppercase tracking-widest">From Date</label>
          <input type="date" className="w-full bg-white border border-gray-300 px-3 py-2 rounded-lg text-sm outline-none focus:border-black"
            value={modalData.from} onChange={e => setModalData({ ...modalData, from: e.target.value })} />
        </div>
        <div>
          <label className="text-[10px] font-bold text-gray-600 block mb-1 uppercase tracking-widest">To Date</label>
          <input type="date" className="w-full bg-white border border-gray-300 px-3 py-2 rounded-lg text-sm outline-none focus:border-black"
            value={modalData.to} onChange={e => setModalData({ ...modalData, to: e.target.value })} />
        </div>
      </div>

      {/* Quick date presets */}
      <div>
        <label className="text-[10px] font-bold text-gray-600 block mb-2 uppercase tracking-widest">Quick Select</label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'This Month', onClick: () => {
              const [y, m] = selectedMonth.split('-').map(Number);
              setModalData(prev => ({ ...prev, from: `${selectedMonth}-01`, to: `${selectedMonth}-${String(new Date(y, m, 0).getDate()).padStart(2,'0')}` }));
            }},
            { label: 'Last Month', onClick: () => {
              const d = new Date(); d.setMonth(d.getMonth() - 1);
              const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
              const lastDay = new Date(d.getFullYear(), d.getMonth()+1, 0).getDate();
              setModalData(prev => ({ ...prev, from: `${key}-01`, to: `${key}-${String(lastDay).padStart(2,'0')}` }));
            }},
            { label: 'Full Year', onClick: () => {
              setModalData(prev => ({ ...prev, from: fyRange.start, to: fyRange.end }));
            }},
          ].map((p, i) => (
            <button key={i} onClick={p.onClick}
              className="py-1.5 rounded-lg text-[10px] font-bold border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 transition-colors">
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Preview info */}
      {modalData.from && modalData.to && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Export Preview</p>
          <p className="text-xs text-gray-700">
            <span className="font-semibold">{modalData.dept === 'all' ? 'All Departments' : departments.find(d => d._id === modalData.dept)?.name}</span>
            {' · '}
            {modalData.from} to {modalData.to}
          </p>
          <p className="text-[10px] text-gray-500 mt-1">
            {activeStaffList.filter(s => modalData.dept === 'all' || s.department === modalData.dept || s.department?._id === modalData.dept).length} staff members
          </p>
        </div>
      )}
    </div>

    <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
      <button onClick={() => setIsModalOpen(false)} className="flex-1 py-2 text-xs font-semibold text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
      <button
        disabled={!modalData.from || !modalData.to}
        onClick={() => {
          // Filter staff by department
          const filteredStaff = activeStaffList.filter(s =>
            modalData.dept === 'all' || s.department === modalData.dept || s.department?._id === modalData.dept
          );

          // Build date list
          const dates = [];
          let cur = new Date(modalData.from);
          const end = new Date(modalData.to);
          while (cur <= end) {
            dates.push(cur.toISOString().split('T')[0]);
            cur.setDate(cur.getDate() + 1);
          }

          // Build rows
          const rows = filteredStaff.map(s => {
            const row = {
              'Name': s.name,
              'Role': s.role,
              'Department': departments.find(d => d._id === (s.department?._id || s.department))?.name || 'Unassigned',
            };
            dates.forEach(date => {
              const dayOfWeek = new Date(date).getDay();
              const isOff = isWeekendOff(s, dayOfWeek);
              const status = (attendance[s._id] || {})[date] || '';
              row[date] = status || (isOff ? 'WE' : '-');
            });
            // Summary columns
            const presentCount = dates.filter(d => (attendance[s._id] || {})[d] === 'P' || (attendance[s._id] || {})[d] === 'OT').length;
            const absentCount = dates.filter(d => (attendance[s._id] || {})[d] === 'A').length;
            const hdCount = dates.filter(d => (attendance[s._id] || {})[d] === 'HD').length;
            row['Total Present'] = presentCount;
            row['Total Absent'] = absentCount;
            row['Total Half Day'] = hdCount;
            return row;
          });

          const wb = XLSX.utils.book_new();
          const ws = XLSX.utils.json_to_sheet(rows);
          XLSX.utils.book_append_sheet(wb, ws, 'Attendance');
          const deptName = modalData.dept === 'all' ? 'All' : departments.find(d => d._id === modalData.dept)?.name || 'Dept';
          XLSX.writeFile(wb, `Attendance_${deptName}_${modalData.from}_to_${modalData.to}.xlsx`);
          setIsModalOpen(false);
        }}
        className="flex-[2] py-2 bg-black text-white rounded-lg text-xs font-semibold hover:bg-gray-800 disabled:opacity-50 flex items-center justify-center gap-2">
        <Download size={14} /> Download Excel
      </button>
    </div>
  </div>
)}

            {/* Attendance Upload */}
            {modalType === 'attendance-upload' && (
              <div className="bg-white rounded-xl w-full max-w-md shadow-xl p-5 relative z-10 text-center">
                <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-lg text-black">Import Attendance</h3><button onClick={() => setIsModalOpen(false)} className="p-1 text-gray-400 hover:bg-gray-100 rounded-md"><X size={16} /></button></div>
                <div className="space-y-4">
                  <div onClick={() => fileInputRef.current?.click()} className="border border-dashed border-gray-300 bg-gray-50 rounded-xl p-6 flex flex-col items-center justify-center hover:bg-gray-100 cursor-pointer">
                    <FileSpreadsheet size={24} className="mb-2 text-gray-400" />
                    <p className="font-semibold text-xs text-gray-600">Select CSV File</p>
                    <input type="file" className="hidden" ref={fileInputRef} accept=".csv" onChange={handleBulkAttendanceUpload} />
                  </div>
                  <button onClick={downloadAttendanceTemplate} className="w-full py-2 bg-white border border-gray-300 text-black rounded-lg text-xs font-semibold flex items-center justify-center gap-2 hover:bg-gray-50"><Download size={14} /> Download Template</button>
                </div>
              </div>
            )}
            {/* Export Excel Modal */}
{showExportModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowExportModal(false)}></div>
    <div className="bg-white rounded-xl w-full max-w-md shadow-xl p-5 relative z-10">
      <div className="flex justify-between items-center mb-5">
        <h3 className="font-bold text-lg text-black">Export to Excel</h3>
        <button onClick={() => setShowExportModal(false)} className="p-1 text-gray-400 hover:bg-gray-100 rounded-md"><X size={16} /></button>
      </div>

      <div className="space-y-4">
        {/* Type selector */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: 'month', label: 'By Month' },
            { id: 'range', label: 'Date Range' },
            { id: 'fy', label: 'Full Year' },
          ].map(t => (
            <button key={t.id} onClick={() => setExportRange(prev => ({ ...prev, type: t.id }))}
              className={`py-2 rounded-lg text-xs font-bold border transition-colors ${exportRange.type === t.id ? 'bg-black text-white border-black' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Month selector */}
        {exportRange.type === 'month' && (
          <div>
            <label className="text-[10px] font-bold text-gray-600 block mb-1 uppercase tracking-widest">Select Month</label>
            <select className="w-full bg-white border border-gray-300 px-3 py-2 rounded-lg text-sm outline-none focus:border-black"
              value={exportRange.month} onChange={e => setExportRange(prev => ({ ...prev, month: e.target.value }))}>
              {monthOptions.map(m => <option key={m.key} value={m.key}>{m.label}</option>)}
            </select>
          </div>
        )}

        {/* Date range selector */}
        {exportRange.type === 'range' && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-gray-600 block mb-1 uppercase tracking-widest">From</label>
              <input type="date" className="w-full bg-white border border-gray-300 px-3 py-2 rounded-lg text-sm outline-none focus:border-black"
                value={exportRange.from} onChange={e => setExportRange(prev => ({ ...prev, from: e.target.value }))} />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-600 block mb-1 uppercase tracking-widest">To</label>
              <input type="date" className="w-full bg-white border border-gray-300 px-3 py-2 rounded-lg text-sm outline-none focus:border-black"
                value={exportRange.to} onChange={e => setExportRange(prev => ({ ...prev, to: e.target.value }))} />
            </div>
          </div>
        )}

        {/* Full year info */}
        {exportRange.type === 'fy' && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <p className="text-xs text-gray-600">Exports all data for <span className="font-bold text-black">{fyRange.label}</span></p>
            <p className="text-[10px] text-gray-400 mt-0.5">{fyRange.start} to {fyRange.end}</p>
          </div>
        )}

        {/* What's included */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-1">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Includes 4 sheets:</p>
          {['Staff List', 'Attendance', 'Salary Slips', 'All Transactions'].map((s, i) => (
            <p key={i} className="text-xs text-gray-600 flex items-center gap-2">
              <span className="w-4 h-4 bg-black text-white rounded text-[9px] flex items-center justify-center font-bold">{i+1}</span>
              {s}
            </p>
          ))}
        </div>
      </div>

      <div className="flex gap-2 mt-5">
        <button onClick={() => setShowExportModal(false)} className="flex-1 py-2 text-xs font-semibold text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
        <button onClick={() => handleExportExcel(exportRange)}
          disabled={exportRange.type === 'range' && (!exportRange.from || !exportRange.to)}
          className="flex-[2] py-2 bg-black text-white rounded-lg text-xs font-semibold hover:bg-gray-800 disabled:opacity-50 flex items-center justify-center gap-2">
          <Download size={14} /> Download Excel
        </button>
      </div>
    </div>
  </div>
)}

            {/* Add Department */}
            {modalType === 'add-department' && (
            <div className="bg-white rounded-xl w-full max-w-md shadow-xl p-5 relative z-10 flex flex-col max-h-[85vh]">
                <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg text-black">New Department</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-1 text-gray-400 hover:bg-gray-100 rounded-md"><X size={16} /></button>
                </div>
                <div className="space-y-4 flex-1">
                <div>
                    <label className="text-[10px] font-bold text-gray-600 block mb-1 uppercase tracking-widest">Department Name</label>
                    <input type="text" placeholder="e.g. Web Dev, AI ML, Cyber" className="w-full bg-white border border-gray-300 px-3 py-2 rounded-lg text-sm outline-none focus:border-black" value={modalData.name} onChange={e => setModalData({ ...modalData, name: e.target.value })} />
                </div>
                <div>
                    <label className="text-[10px] font-bold text-gray-600 block mb-1 uppercase tracking-widest">Description (optional)</label>
                    <input type="text" placeholder="Brief description..." className="w-full bg-white border border-gray-300 px-3 py-2 rounded-lg text-sm outline-none focus:border-black" value={modalData.description} onChange={e => setModalData({ ...modalData, description: e.target.value })} />
                </div>
                <div>
                    <label className="text-[10px] font-bold text-gray-600 block mb-1 uppercase tracking-widest">Department Color</label>
                    <div className="flex items-center gap-3">
                    <input type="color" className="w-12 h-10 rounded-lg border border-gray-300 cursor-pointer" value={modalData.color} onChange={e => setModalData({ ...modalData, color: e.target.value })} />
                    <span className="text-sm text-gray-600 font-medium">{modalData.color}</span>
                    </div>
                </div>
                </div>
                <div className="flex gap-2 mt-5">
                <button onClick={() => setIsModalOpen(false)} className="flex-1 py-2 text-xs font-semibold text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
                <button onClick={processPayment} className="flex-[2] py-2 bg-black text-white rounded-lg text-xs font-semibold hover:bg-gray-800">Create Department</button>
                </div>
            </div>
            )}

            {/* Edit Department */}
            {modalType === 'edit-department' && (
            <div className="bg-white rounded-xl w-full max-w-md shadow-xl p-5 relative z-10 flex flex-col max-h-[85vh]">
                <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg text-black">Edit Department</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-1 text-gray-400 hover:bg-gray-100 rounded-md"><X size={16} /></button>
                </div>
                <div className="space-y-4 flex-1">
                <div>
                    <label className="text-[10px] font-bold text-gray-600 block mb-1 uppercase tracking-widest">Department Name</label>
                    <input type="text" className="w-full bg-white border border-gray-300 px-3 py-2 rounded-lg text-sm outline-none focus:border-black" value={modalData.name} onChange={e => setModalData({ ...modalData, name: e.target.value })} />
                </div>
                <div>
                    <label className="text-[10px] font-bold text-gray-600 block mb-1 uppercase tracking-widest">Description</label>
                    <input type="text" className="w-full bg-white border border-gray-300 px-3 py-2 rounded-lg text-sm outline-none focus:border-black" value={modalData.description} onChange={e => setModalData({ ...modalData, description: e.target.value })} />
                </div>
                <div>
                    <label className="text-[10px] font-bold text-gray-600 block mb-1 uppercase tracking-widest">Color</label>
                    <div className="flex items-center gap-3">
                    <input type="color" className="w-12 h-10 rounded-lg border border-gray-300 cursor-pointer" value={modalData.color} onChange={e => setModalData({ ...modalData, color: e.target.value })} />
                    <span className="text-sm text-gray-600 font-medium">{modalData.color}</span>
                    </div>
                </div>
                </div>
                <div className="flex gap-2 mt-5">
                <button onClick={() => setIsModalOpen(false)} className="flex-1 py-2 text-xs font-semibold text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
                <button onClick={processPayment} className="flex-[2] py-2 bg-black text-white rounded-lg text-xs font-semibold hover:bg-gray-800">Save Changes</button>
                </div>
            </div>
            )}
           
          </div>
        )}
      </main>

    </div>
  );
}
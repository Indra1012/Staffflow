import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getMyProfile,
  getMyAttendance,
  getMySlips,
  getMyLedger,
  changeMyPassword,
} from '../api/employeePortal';
import {
  User, CalendarDays, FileText, BookOpen, HelpCircle,
  LogOut, Wallet, ChevronDown, ChevronUp, Eye, EyeOff,
  Download, Share2, MessageCircle
} from 'lucide-react';
import html2canvas from 'html2canvas';
import domtoimage from 'dom-to-image-more';
import { jsPDF } from 'jspdf';

// ─── helpers ──────────────────────────────────────────────────────────────────
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const todayDate = new Date();
const toYM = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;

// Map DB status codes → display info
const STATUS_MAP = {
  P:  { label: 'P',   full: 'Present',  style: 'bg-green-100 text-green-700' },
  A:  { label: 'A',   full: 'Absent',   style: 'bg-red-100 text-red-600' },
  HD: { label: 'HD',  full: 'Half Day', style: 'bg-yellow-100 text-yellow-700' },
  OT: { label: 'OT',  full: 'Overtime', style: 'bg-emerald-100 text-emerald-700' },
  PH: { label: 'PH',  full: 'Holiday',  style: 'bg-blue-100 text-blue-600' },
  PL: { label: 'PL',  full: 'P.Leave',  style: 'bg-sky-100 text-sky-700' },
  SL: { label: 'SL',  full: 'S.Leave',  style: 'bg-orange-100 text-orange-700' },
  WE: { label: 'WE',  full: 'Weekend',  style: 'bg-gray-100 text-gray-500' },
};

const fmt = (n) => (n || 0).toLocaleString('en-IN');

// ─── Attendance Tab ────────────────────────────────────────────────────────────
function AttendanceTab() {
  const [month, setMonth] = useState(toYM(todayDate));
  const [data, setData]   = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    getMyAttendance(month)
      .then(r => setData(r.data || {}))
      .catch(() => { setData({}); setError('Could not load attendance.'); })
      .finally(() => setLoading(false));
  }, [month]);

  const [y, m] = month.split('-').map(Number);
  const daysInMonth = new Date(y, m, 0).getDate();
  const firstDay    = new Date(y, m - 1, 1).getDay();

  // Count by category
  const counts = { present: 0, absent: 0, half: 0, leave: 0, holiday: 0, weekend: 0 };
  Object.values(data).forEach(s => {
    if (s === 'P' || s === 'OT')  counts.present++;
    else if (s === 'A')            counts.absent++;
    else if (s === 'HD')           counts.half++;
    else if (s === 'PL' || s === 'SL') counts.leave++;
    else if (s === 'PH')           counts.holiday++;
    else if (s === 'WE')           counts.weekend++;
  });

  const prevMonth = () => { const d = new Date(y, m - 2, 1); setMonth(toYM(d)); };
  const nextMonth = () => {
    const d = new Date(y, m, 1);
    if (toYM(d) <= toYM(todayDate)) setMonth(toYM(d));
  };

  const summaryPills = [
    { label: 'Present', val: counts.present, color: 'bg-green-50 text-green-700' },
    { label: 'Absent',  val: counts.absent,  color: 'bg-red-50 text-red-600' },
    { label: 'Half',    val: counts.half,    color: 'bg-yellow-50 text-yellow-700' },
    { label: 'Leave',   val: counts.leave,   color: 'bg-sky-50 text-sky-700' },
    { label: 'Holiday', val: counts.holiday, color: 'bg-blue-50 text-blue-600' },
    { label: 'Weekend', val: counts.weekend, color: 'bg-gray-50 text-gray-500' },
  ];

  return (
    <div className="p-4 max-w-lg mx-auto">
      {/* Month nav */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth}
          className="p-2 rounded-xl hover:bg-gray-100 transition-colors active:scale-95">
          <ChevronDown size={18} className="rotate-90" />
        </button>
        <h2 className="font-bold text-base text-black">{MONTHS[m-1]} {y}</h2>
        <button onClick={nextMonth}
          disabled={toYM(new Date(y, m, 1)) > toYM(todayDate)}
          className="p-2 rounded-xl hover:bg-gray-100 transition-colors active:scale-95 disabled:opacity-30">
          <ChevronDown size={18} className="-rotate-90" />
        </button>
      </div>

      {/* Summary pills */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {summaryPills.map(({ label, val, color }) => (
          <div key={label} className={`${color} rounded-xl p-2.5 text-center`}>
            <div className="text-xl font-bold">{val}</div>
            <div className="text-[10px] font-semibold uppercase tracking-wide">{label}</div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2 mb-3">
        {Object.entries(STATUS_MAP).map(([code, { label, style }]) => (
          <span key={code} className={`px-2 py-0.5 rounded text-[10px] font-bold ${style}`}>
            {code} = {label === code ? STATUS_MAP[code].full : label}
          </span>
        ))}
      </div>

      {error && <p className="text-xs text-red-600 text-center mb-2">{error}</p>}

      {/* Calendar grid */}
      {loading ? (
        <div className="text-center py-8 text-gray-400 text-sm">Loading...</div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="grid grid-cols-7 text-center border-b border-gray-100">
            {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
              <div key={d} className="py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`e${i}`} className="aspect-square border border-gray-50" />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${month}-${String(day).padStart(2,'0')}`;
              const status = data[dateStr] || '';
              const info = STATUS_MAP[status];
              const isToday = dateStr === toYM(todayDate) + '-' + String(todayDate.getDate()).padStart(2,'0');
              return (
                <div key={day}
                  className={`aspect-square flex flex-col items-center justify-center border border-gray-50 text-[11px] relative
                    ${info ? info.style : 'bg-white text-gray-300'}
                    ${isToday ? 'ring-2 ring-inset ring-black' : ''}
                  `}>
                  <span className={`font-semibold leading-none ${!info ? 'text-gray-400' : ''}`}>{day}</span>
                  {info && <span className="text-[8px] font-bold leading-none mt-0.5">{info.label}</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* No data note */}
      {!loading && Object.keys(data).length === 0 && (
        <p className="text-center text-xs text-gray-400 mt-3">No attendance recorded for this month yet.</p>
      )}
    </div>
  );
}

// ─── Payslips Tab ──────────────────────────────────────────────────────────────
function PayslipsTab({ profile }) {
  const [slips, setSlips]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [dlState, setDlState] = useState({}); // { [id]: 'loading' | 'done' | 'error' }

  useEffect(() => {
    getMySlips()
      .then(r => setSlips(r.data || []))
      .catch(() => setSlips([]))
      .finally(() => setLoading(false));
  }, []);

  const handleExportPDF = async (slip, share = false) => {
    setDlState(s => ({ ...s, [slip._id]: 'loading' }));
    const el = document.getElementById(`slip-${slip._id}`);
    try {
      if (!el) throw new Error('Slip element not found');

      // 🧹 SANITIZE DOM FOR CAPTURE
      el.classList.add('is-capturing');

      // Safety check: ensure fonts are loaded
      if (document.fonts && document.fonts.ready) {
        await document.fonts.ready;
      }
      await new Promise(r => setTimeout(r, 200));
      
      let imgData = null;

      // ATTEMPT 1: dom-to-image-more (Primary - handles Tailwind 4 much better)
      try {
        imgData = await domtoimage.toPng(el, {
          bgcolor: '#ffffff',
          width: el.offsetWidth * 2.5,
          height: el.offsetHeight * 2.5,
          style: { transform: 'scale(2.5)', transformOrigin: 'top left', width: el.offsetWidth + 'px', height: el.offsetHeight + 'px' }
        });
      } catch (d2iError) {
        console.warn('dom-to-image failed, attempting fallback...', d2iError);
        // ATTEMPT 2: html2canvas (Fallback - Now safe due to .is-capturing class)
        const canvas = await html2canvas(el, {
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
      el.classList.remove('is-capturing');

      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageW = pdf.internal.pageSize.getWidth();
      const imgH  = (el.offsetHeight * pageW) / el.offsetWidth;
      pdf.addImage(imgData, 'PNG', 0, 0, pageW, imgH, undefined, 'FAST');

      const filename = `Payslip_${profile?.name || 'employee'}_${slip.date || slip._id}.pdf`;

      if (share && navigator.share) {
        try {
          const pdfBlob = pdf.output('blob');
          const file = new File([pdfBlob], filename, { type: 'application/pdf' });
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({ files: [file], title: filename });
          } else {
            pdf.save(filename);
          }
        } catch {
          pdf.save(filename);
        }
      } else {
        pdf.save(filename);
      }

      setDlState(s => ({ ...s, [slip._id]: 'done' }));
      setTimeout(() => setDlState(s => ({ ...s, [slip._id]: undefined })), 2000);
    } catch (err) {
      console.error('Final PDF failure:', err);
      if (el) el.classList.remove('is-capturing');
      setDlState(s => ({ ...s, [slip._id]: 'error' }));
      setTimeout(() => setDlState(s => ({ ...s, [slip._id]: undefined })), 3000);
    }
  };

  const shareWhatsApp = (slip) => {
    if (!slip || !profile) return;
    const text = `*MY SALARY SLIP*
---------------------------
*Name:* ${profile.name}
*Date:* ${slip.date || 'N/A'}
*Net Payout:* ₹${fmt(slip.amount)}
*Status:* Paid

_Digital record via StaffFlow portal_`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`);
  };

  if (loading) return <div className="text-center py-12 text-gray-400 text-sm">Loading payslips...</div>;
  if (!slips.length) return (
    <div className="text-center py-12">
      <FileText size={36} className="mx-auto text-gray-300 mb-2" />
      <p className="text-gray-500 text-sm">No payslips yet</p>
      <p className="text-gray-400 text-xs mt-1">Your salary slips will appear here after payroll is processed.</p>
    </div>
  );

  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto">
      {slips.map(slip => {
        const dl = dlState[slip._id];
        return (
          <div key={slip._id}>
            {/* Printable slip card */}
            <div id={`slip-${slip._id}`}
              className="bg-white border border-gray-200 rounded-2xl p-5"
              style={{ fontFamily: 'Arial, sans-serif' }}>
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <div className="bg-black rounded-md p-1 flex items-center justify-center">
                      <Wallet className="text-white" size={11} />
                    </div>
                    <span className="text-xs font-black text-black uppercase tracking-widest">StaffFlow</span>
                  </div>
                  <p className="text-[10px] text-gray-400 font-medium">Salary Slip</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-gray-500 mb-0.5">{slip.date || ''}</p>
                  <p className="text-lg font-black text-black">₹{fmt(slip.amount)}</p>
                  <span className="text-[9px] font-bold bg-green-50 text-green-700 px-1.5 py-0.5 rounded-full uppercase">Paid</span>
                </div>
              </div>

              {/* Employee info */}
              <div className="bg-gray-50 rounded-xl p-3 mb-3">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-500">Employee</span>
                  <span className="font-semibold text-black">{profile?.name || '—'}</span>
                </div>
                {profile?.role && (
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Designation</span>
                    <span className="font-semibold text-black">{profile.role}</span>
                  </div>
                )}
                {profile?.department?.name && (
                  <div className="flex justify-between text-xs mt-1">
                    <span className="text-gray-500">Department</span>
                    <span className="font-semibold text-black">{profile.department.name}</span>
                  </div>
                )}
              </div>

              {/* Breakdown */}
              <div className="space-y-1.5">
                {slip.presentDays > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Present Days</span>
                    <span className="font-medium">{slip.presentDays} days</span>
                  </div>
                )}
                {slip.halfDays > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Half Days</span>
                    <span className="font-medium">{slip.halfDays}</span>
                  </div>
                )}
                {slip.absentDays > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Absent Days</span>
                    <span className="font-medium text-red-600">{slip.absentDays}</span>
                  </div>
                )}
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Earned Salary</span>
                  <span className="font-medium">₹{fmt(slip.earnedSalary)}</span>
                </div>
                {slip.bonus > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Allowance / Bonus</span>
                    <span className="font-medium text-green-700">+₹{fmt(slip.bonus)}</span>
                  </div>
                )}
                {slip.overtime > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Overtime Pay</span>
                    <span className="font-medium text-green-700">+₹{fmt(slip.overtime)}</span>
                  </div>
                )}
                {slip.deductions > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Deductions</span>
                    <span className="font-medium text-red-600">-₹{fmt(slip.deductions)}</span>
                  </div>
                )}
                {slip.openingBalance !== 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Advance Deducted</span>
                    <span className="font-medium text-red-600">-₹{fmt(Math.abs(slip.openingBalance))}</span>
                  </div>
                )}
                <div className="flex justify-between text-xs border-t border-gray-200 pt-1.5 mt-1">
                  <span className="font-bold text-black">Net Pay</span>
                  <span className="font-black text-black">₹{fmt(slip.amount)}</span>
                </div>
                {slip.paymentMode && (
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Payment Mode</span>
                    <span className="text-gray-600">{slip.paymentMode}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions Area */}
            <div className="mt-3 grid grid-cols-3 gap-2">
              <button
                onClick={() => shareWhatsApp(slip)}
                className="flex flex-col items-center justify-center gap-1 py-2 rounded-xl bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                title="Send to WhatsApp"
              >
                <MessageCircle size={16} className="text-[#25D366]" />
                <span className="text-[9px] font-bold uppercase tracking-wider">Send</span>
              </button>

              <button
                onClick={() => handleExportPDF(slip, true)}
                disabled={dl === 'loading'}
                className="flex flex-col items-center justify-center gap-1 py-2 rounded-xl bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
                title="Share PDF"
              >
                <Share2 size={16} className="text-blue-500" />
                <span className="text-[9px] font-bold uppercase tracking-wider">Share</span>
              </button>

              <button
                onClick={() => handleExportPDF(slip)}
                disabled={dl === 'loading'}
                className={`flex flex-col items-center justify-center gap-1 py-2 rounded-xl transition-all active:scale-[0.98] disabled:opacity-50
                  ${dl === 'error'   ? 'bg-red-600 text-white' :
                    dl === 'done'    ? 'bg-green-600 text-white' :
                    dl === 'loading' ? 'bg-gray-400 text-white cursor-wait' :
                    'bg-black text-white hover:bg-gray-800'}
                `}
              >
                {dl === 'loading' ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Download size={16} />
                )}
                <span className="text-[9px] font-bold uppercase tracking-wider">
                  {dl === 'loading' ? '...' : dl === 'done' ? 'Saved' : 'PDF'}
                </span>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Ledger Tab ────────────────────────────────────────────────────────────────
function LedgerTab() {
  const [txns, setTxns]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState('');

  useEffect(() => {
    getMyLedger()
      .then(r => setTxns(r.data || []))
      .catch(() => { setTxns([]); setError('Could not load ledger.'); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-12 text-gray-400 text-sm">Loading ledger...</div>;
  if (!txns.length) return (
    <div className="text-center py-12">
      <BookOpen size={36} className="mx-auto text-gray-300 mb-2" />
      <p className="text-gray-500 text-sm">No transactions yet</p>
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );

  const typeInfo = (t) => {
    if (t === 'salary')     return { label: 'Salary',     style: 'bg-green-50 text-green-700' };
    if (t === 'advance')    return { label: 'Advance',    style: 'bg-red-50 text-red-600' };
    if (t === 'adjustment') return { label: 'Adjust',     style: 'bg-blue-50 text-blue-600' };
    return { label: t, style: 'bg-gray-100 text-gray-600' };
  };

  return (
    <div className="p-4 max-w-lg mx-auto">
      <div className="bg-white rounded-2xl border border-gray-200 overflow-x-auto">
        <table className="w-full text-xs min-w-[380px]">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-3 py-2.5 font-semibold text-gray-500 text-[10px] uppercase tracking-wider">Date</th>
              <th className="text-left px-3 py-2.5 font-semibold text-gray-500 text-[10px] uppercase tracking-wider">Type</th>
              <th className="text-right px-3 py-2.5 font-semibold text-gray-500 text-[10px] uppercase tracking-wider">Debit</th>
              <th className="text-right px-3 py-2.5 font-semibold text-gray-500 text-[10px] uppercase tracking-wider">Credit</th>
              <th className="text-right px-3 py-2.5 font-semibold text-gray-500 text-[10px] uppercase tracking-wider">Balance</th>
            </tr>
          </thead>
          <tbody>
            {txns.map((tx, i) => {
              const { label, style } = typeInfo(tx.type);
              const bal = tx.runningBalance ?? 0;
              return (
                <tr key={tx._id || i} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-3 py-2.5 text-gray-600 whitespace-nowrap">{tx.date || ''}</td>
                  <td className="px-3 py-2.5">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${style}`}>{label}</span>
                  </td>
                  <td className="px-3 py-2.5 text-right text-red-600 font-medium">
                    {tx.debit ? `₹${fmt(tx.debit)}` : '—'}
                  </td>
                  <td className="px-3 py-2.5 text-right text-green-700 font-medium">
                    {tx.credit ? `₹${fmt(tx.credit)}` : '—'}
                  </td>
                  <td className={`px-3 py-2.5 text-right font-bold ${bal < 0 ? 'text-red-600' : 'text-black'}`}>
                    ₹{fmt(bal)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Profile Tab ───────────────────────────────────────────────────────────────
function ProfileTab({ profile }) {
  const [curPwd,     setCurPwd]     = useState('');
  const [newPwd,     setNewPwd]     = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [showCur,    setShowCur]    = useState(false);
  const [showNew,    setShowNew]    = useState(false);
  const [showConf,   setShowConf]   = useState(false);
  const [msg,        setMsg]        = useState('');
  const [err,        setErr]        = useState('');
  const [saving,     setSaving]     = useState(false);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setMsg(''); setErr('');
    if (newPwd !== confirmPwd) { setErr('New passwords do not match'); return; }
    if (newPwd.length < 6)     { setErr('Password must be at least 6 characters'); return; }
    setSaving(true);
    try {
      await changeMyPassword(curPwd, newPwd);
      setMsg('Password changed successfully');
      setCurPwd(''); setNewPwd(''); setConfirmPwd('');
    } catch (e) {
      setErr(e.response?.data?.message || 'Failed to change password');
    }
    setSaving(false);
  };

  if (!profile) return <div className="text-center py-12 text-gray-400 text-sm">Loading...</div>;

  const fields = [
    { label: 'Full Name',  value: profile.name },
    { label: 'Job Title',  value: profile.role || '—' },
    { label: 'Email',      value: profile.email || '—' },
    { label: 'Department', value: profile.department?.name || '—' },
    { label: 'Join Date',  value: profile.joinDate || '—' },
    { label: 'Base Salary',value: profile.salary ? `₹${fmt(profile.salary)}` : '—' },
    { label: 'Company',    value: profile.company?.companyName || '—' },
  ];

  const pwdFields = [
    { label: 'Current Password', val: curPwd, set: setCurPwd, show: showCur, toggle: setShowCur },
    { label: 'New Password',     val: newPwd, set: setNewPwd, show: showNew, toggle: setShowNew },
    { label: 'Confirm Password', val: confirmPwd, set: setConfirmPwd, show: showConf, toggle: setShowConf },
  ];

  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto">
      {/* Profile card */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-14 h-14 rounded-full bg-black flex items-center justify-center text-white font-black text-xl">
            {profile.name?.[0]?.toUpperCase() || '?'}
          </div>
          <div>
            <h3 className="font-bold text-black text-base">{profile.name}</h3>
            <p className="text-xs text-gray-500">{profile.role || 'Employee'}</p>
          </div>
        </div>
        <div className="divide-y divide-gray-50">
          {fields.map(({ label, value }) => (
            <div key={label} className="flex justify-between items-center py-2">
              <span className="text-xs text-gray-500">{label}</span>
              <span className="text-xs font-semibold text-black text-right">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Change password */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <h3 className="font-bold text-black mb-4 text-sm">Change Password</h3>
        <form onSubmit={handleChangePassword} className="space-y-3">
          {pwdFields.map(({ label, val, set, show, toggle }) => (
            <div key={label}>
              <label className="text-[10px] font-bold text-gray-600 block mb-1 uppercase tracking-widest">{label}</label>
              <div className="relative">
                <input
                  type={show ? 'text' : 'password'}
                  value={val}
                  onChange={e => set(e.target.value)}
                  required
                  className="w-full bg-white border border-gray-300 px-3 py-2.5 pr-10 rounded-lg text-sm outline-none focus:border-black transition-colors"
                  placeholder="••••••••"
                />
                <button type="button" onClick={() => toggle(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                  {show ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
          ))}
          {err && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg p-2">{err}</p>}
          {msg && <p className="text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg p-2">{msg}</p>}
          <button type="submit" disabled={saving}
            className="w-full bg-black text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50 active:scale-[0.98]">
            {saving ? 'Saving...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Help Tab ──────────────────────────────────────────────────────────────────
const FAQ_ITEMS = [
  {
    section: 'Salary & Pay',
    items: [
      { q: 'When is my salary credited?', a: 'Salary is processed by your employer at the end of the month. Check with your employer for the exact date.' },
      { q: 'Why is my salary different from last month?', a: 'Your net salary may vary due to attendance, advances deducted, or adjustments applied. Check your payslip for a full breakdown.' },
      { q: 'What is "Fixed Allowance"?', a: 'Fixed Allowance is an additional amount added to your base salary every month, regardless of attendance.' },
      { q: 'What is "Fixed Deduction"?', a: 'Fixed Deduction is a fixed amount deducted from your salary every month (e.g., PF, ESI, or company policy).' },
    ],
  },
  {
    section: 'Attendance',
    items: [
      { q: 'What do the attendance codes mean?', a: 'P = Present, A = Absent, HD = Half Day, OT = Overtime, PH = Paid Holiday, PL = Paid Leave, SL = Sick Leave, WE = Weekend Off.' },
      { q: 'My attendance is marked wrong — what do I do?', a: 'Contact your employer or HR manager to correct it. Only the admin can update attendance records.' },
      { q: 'How are holidays counted?', a: 'Days marked PH (Paid Holiday) are paid days off and do not reduce your salary.' },
    ],
  },
  {
    section: 'Advances & Ledger',
    items: [
      { q: 'How are advances deducted?', a: 'Advances you take are deducted from your salary at the time of payroll. Your ledger shows each advance as a debit entry.' },
      { q: 'What does the running balance mean?', a: 'Running balance shows your net position after each transaction. A negative number means the company will deduct it from your next salary.' },
      { q: 'I see an "Adjustment" — what is it?', a: 'Adjustments are manual corrections or bonuses added by your employer.' },
    ],
  },
  {
    section: 'Payslips',
    items: [
      { q: 'Can I download my payslip as PDF?', a: 'Yes — tap "Download PDF" on any payslip. The file saves directly to your device.' },
      { q: 'How far back do payslips go?', a: 'All payslips from the date you were added to the system are available here.' },
    ],
  },
  {
    section: 'Account & Login',
    items: [
      { q: 'I forgot my password — what do I do?', a: 'Contact your employer to reset your password. They set a new one from the admin panel.' },
      { q: 'Can I change my own password?', a: 'Yes — go to Profile → Change Password. You need your current password to do this.' },
      { q: "My account isn't working or I can't log in?", a: 'Your employer controls login access. Ask them to check that your account is enabled.' },
    ],
  },
];

function HelpTab() {
  const [openSection, setOpenSection] = useState(null);
  const [openItem,    setOpenItem]    = useState(null);

  return (
    <div className="p-4 max-w-lg mx-auto space-y-3">
      <div className="bg-black text-white rounded-2xl p-4">
        <p className="text-[10px] font-bold uppercase tracking-widest mb-1 text-gray-400">Need Help?</p>
        <p className="text-sm font-semibold mb-1">Talk to your employer</p>
        <p className="text-xs text-gray-300 leading-relaxed">For salary corrections, attendance fixes, password resets, or any payroll questions — contact your HR manager or company admin directly.</p>
      </div>

      {FAQ_ITEMS.map((sec, si) => (
        <div key={si} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <button
            onClick={() => setOpenSection(openSection === si ? null : si)}
            className="w-full flex items-center justify-between px-4 py-3.5 text-left active:bg-gray-50"
          >
            <span className="font-bold text-sm text-black">{sec.section}</span>
            {openSection === si
              ? <ChevronUp size={16} className="text-gray-400" />
              : <ChevronDown size={16} className="text-gray-400" />}
          </button>
          {openSection === si && (
            <div className="border-t border-gray-100">
              {sec.items.map((item, ii) => (
                <div key={ii} className="border-b border-gray-50 last:border-0">
                  <button
                    onClick={() => setOpenItem(openItem === `${si}-${ii}` ? null : `${si}-${ii}`)}
                    className="w-full flex items-start justify-between px-4 py-3 text-left active:bg-gray-50"
                  >
                    <span className="text-xs font-semibold text-gray-800 pr-3">{item.q}</span>
                    {openItem === `${si}-${ii}`
                      ? <ChevronUp size={14} className="text-gray-400 mt-0.5 shrink-0" />
                      : <ChevronDown size={14} className="text-gray-400 mt-0.5 shrink-0" />}
                  </button>
                  {openItem === `${si}-${ii}` && (
                    <p className="px-4 pb-3 text-xs text-gray-500 leading-relaxed">{item.a}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'attendance', label: 'Attendance', icon: CalendarDays },
  { id: 'payslips',   label: 'Payslips',   icon: FileText },
  { id: 'ledger',     label: 'Ledger',     icon: BookOpen },
  { id: 'profile',    label: 'Profile',    icon: User },
  { id: 'help',       label: 'Help',       icon: HelpCircle },
];

export default function EmployeePortal() {
  const { logout }  = useAuth();
  const [activeTab, setActiveTab] = useState('attendance');
  const [profile,   setProfile]   = useState(null);

  useEffect(() => {
    getMyProfile()
      .then(r => setProfile(r.data))
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top navbar */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-black p-1.5 rounded-lg"><Wallet className="text-white" size={15} /></div>
            <div>
              <p className="text-xs font-bold text-black uppercase tracking-widest leading-none">StaffFlow</p>
              {profile?.company?.companyName && (
                <p className="text-[10px] text-gray-400">{profile.company.companyName}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {profile && (
              <div className="w-7 h-7 rounded-full bg-black flex items-center justify-center text-white text-xs font-bold">
                {profile.name?.[0]?.toUpperCase() || '?'}
              </div>
            )}
            <button onClick={logout}
              className="p-1.5 rounded-lg text-gray-500 hover:text-black hover:bg-gray-100 transition-colors"
              title="Logout">
              <LogOut size={16} />
            </button>
          </div>
        </div>

        {/* Desktop tab bar */}
        <div className="hidden sm:flex max-w-lg mx-auto border-t border-gray-100">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold transition-colors border-b-2
                ${activeTab === id ? 'border-black text-black' : 'border-transparent text-gray-400 hover:text-gray-700'}`}>
              <Icon size={14} />{label}
            </button>
          ))}
        </div>
      </nav>

      {/* Tab content */}
      <main className="flex-1 overflow-y-auto pb-20 sm:pb-6">
        {activeTab === 'attendance' && <AttendanceTab />}
        {activeTab === 'payslips'   && <PayslipsTab profile={profile} />}
        {activeTab === 'ledger'     && <LedgerTab />}
        {activeTab === 'profile'    && <ProfileTab profile={profile} />}
        {activeTab === 'help'       && <HelpTab />}
      </main>

      {/* Bottom mobile nav */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
        <div className="grid grid-cols-5">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={`flex flex-col items-center justify-center py-2 gap-0.5 transition-colors
                ${activeTab === id ? 'text-black' : 'text-gray-400'}`}>
              <Icon size={18} strokeWidth={activeTab === id ? 2.5 : 1.8} />
              <span className="text-[9px] font-semibold">{label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}

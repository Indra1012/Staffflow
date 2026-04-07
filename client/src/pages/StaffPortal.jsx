import { useState, useEffect, useRef } from 'react';
import {
  Wallet, LogOut, User, Clock, ArrowLeftRight, FileText,
  ChevronLeft, ChevronRight, Download, Share2, BarChart3,
  Calendar, TrendingUp, ArrowUpRight, ArrowDownRight, Eye, EyeOff,
  HelpCircle, ChevronDown, AlertCircle, MessageSquare, IndianRupee,
  CalendarDays, BookOpen, Info, MessageCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getMyProfile, getMyAttendance, getMyLedger, getMyPayslips } from '../api/staffPortal';
import html2canvas from 'html2canvas';
import domtoimage from 'dom-to-image-more';
import { jsPDF } from 'jspdf';

const formatCurrency = (amt) => {
  const num = Number(amt) || 0;
  const isNeg = num < 0;
  return `${isNeg ? '-' : ''}₹${Math.abs(num).toLocaleString('en-IN')}`;
};

const getMonthYear = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr + '-01');
  return d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
};

const getCurrentMonthKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const getMonthOptions = () => {
  const options = [];
  const now = new Date();
  for (let i = 0; i < 18; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    options.push({ key, label: d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) });
  }
  return options;
};

const STATUS_CONFIG = {
  P:  { label: 'Present',        bg: 'bg-emerald-100', text: 'text-emerald-800', dot: 'bg-emerald-500' },
  OT: { label: 'Overtime',       bg: 'bg-blue-100',    text: 'text-blue-800',    dot: 'bg-blue-500' },
  HD: { label: 'Half Day',       bg: 'bg-yellow-100',  text: 'text-yellow-800',  dot: 'bg-yellow-500' },
  A:  { label: 'Absent',         bg: 'bg-red-100',     text: 'text-red-800',     dot: 'bg-red-500' },
  PL: { label: 'Paid Leave',     bg: 'bg-purple-100',  text: 'text-purple-800',  dot: 'bg-purple-500' },
  SL: { label: 'Sick Leave',     bg: 'bg-orange-100',  text: 'text-orange-800',  dot: 'bg-orange-500' },
  PH: { label: 'Public Holiday', bg: 'bg-pink-100',    text: 'text-pink-800',    dot: 'bg-pink-500' },
  WE: { label: 'Weekend',        bg: 'bg-gray-100',    text: 'text-gray-500',    dot: 'bg-gray-300' },
};


export default function StaffPortal() {
  const { staffUser, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [profile, setProfile] = useState(null);
  const [attendance, setAttendance] = useState({});
  const [ledger, setLedger] = useState([]);
  const [payslips, setPayslips] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthKey());
  const [selectedSlip, setSelectedSlip] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const [loading, setLoading] = useState(true);
  const slipRef = useRef(null);
  const monthOptions = getMonthOptions();

  useEffect(() => {
    (async () => {
      try {
        const [profRes, ledRes, slipRes] = await Promise.all([
          getMyProfile(), getMyLedger(), getMyPayslips()
        ]);
        setProfile(profRes.data);
        setLedger(ledRes.data);
        setPayslips(slipRes.data);
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (activeTab !== 'attendance') return;
    getMyAttendance(selectedMonth).then(res => setAttendance(res.data)).catch(() => {});
  }, [activeTab, selectedMonth]);

  const getDaysInMonth = (monthKey) => {
    const [y, m] = monthKey.split('-').map(Number);
    return new Date(y, m, 0).getDate();
  };

  const getAttendanceSummary = () => {
    const counts = { P: 0, OT: 0, HD: 0, A: 0, PL: 0, SL: 0, PH: 0, WE: 0 };
    Object.values(attendance).forEach(s => { if (counts[s] !== undefined) counts[s]++; });
    return counts;
  };

  const handleExportPDF = async (share = false) => {
    const element = slipRef.current;
    if (!element) return;
    setIsExporting(true);
    try {
      // 🧹 SANITIZE DOM FOR CAPTURE
      element.classList.add('is-capturing');

      if (document.fonts && document.fonts.ready) {
        await document.fonts.ready;
      }
      await new Promise(r => setTimeout(r, 200));
      
      let imgData = null;

      // ATTEMPT 1: dom-to-image-more (Primary - for Better Tailwind 4 support)
      try {
        imgData = await domtoimage.toPng(element, {
          bgcolor: '#ffffff',
          width: element.offsetWidth * 2.5,
          height: element.offsetHeight * 2.5,
          style: { transform: 'scale(2.5)', transformOrigin: 'top left', width: element.offsetWidth + 'px', height: element.offsetHeight + 'px' }
        });
      } catch (d2iError) {
        console.warn('dom-to-image failed, trying fallback...', d2iError);
        // ATTEMPT 2: html2canvas (Fallback - Now safe due to .is-capturing class)
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

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (element.offsetHeight * pdfWidth) / element.offsetWidth;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');

      const filename = `Payslip_${profile?.name}_${selectedSlip?.monthKey || 'slip'}.pdf`;

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
    } catch (err) {
      console.error('Final PDF failure:', err);
      // Ensure cleanup on error
      if (slipRef.current) slipRef.current.classList.remove('is-capturing');
      alert('High-Fidelity capture failed. Please try again or use a different browser.');
    }
    setIsExporting(false);
  };

  const shareWhatsApp = () => {
    if (!selectedSlip || !profile) return;
    const text = `*SALARY STATEMENT*
---------------------------
*Employee:* ${profile.name}
*Month:* ${getMonthYear(selectedSlip.monthKey)}
*Net Payout:* ${formatCurrency(selectedSlip.amount)}
*Status:* Paid

_Find your digital payslip in your StaffFlow portal._`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500 text-sm">Loading your portal...</p>
        </div>
      </div>
    );
  }

  const summary = getAttendanceSummary();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Nav */}
      <nav className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-black p-1 rounded-md"><Wallet className="text-white" size={15} /></div>
            <span className="text-sm font-bold text-black tracking-tight uppercase">StaffFlow</span>
            <span className="hidden sm:inline text-gray-300 mx-1">|</span>
            <span className="hidden sm:inline text-xs text-gray-500 font-medium">{staffUser?.companyName}</span>
          </div>
          <button onClick={logout} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-lg transition-colors">
            <LogOut size={14} /> Logout
          </button>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Profile header */}
        <div className="bg-black text-white rounded-2xl p-5 mb-5 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center text-xl font-bold shrink-0">
            {profile?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??'}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-lg leading-tight truncate">{profile?.name}</h2>
            <p className="text-white/60 text-sm truncate">{profile?.role}</p>
            <p className="text-white/40 text-xs mt-0.5 truncate">{profile?.department?.name || 'No Department'}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-white/50 text-[10px] uppercase tracking-widest">Monthly Salary</p>
            <p className="font-bold text-lg">{formatCurrency(profile?.salary)}</p>
          </div>
        </div>

        {/* Tab nav */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-5">
          {[
            { id: 'overview',    label: 'Overview',    icon: BarChart3 },
            { id: 'attendance',  label: 'Attendance',  icon: Clock },
            { id: 'ledger',      label: 'Ledger',      icon: ArrowLeftRight },
            { id: 'payslips',    label: 'Payslips',    icon: FileText },
            { id: 'help',        label: 'Help',        icon: HelpCircle },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-colors ${
                activeTab === tab.id ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-black'
              }`}
            >
              <tab.icon size={13} />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-4 tab-fade">
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Base Salary',   value: formatCurrency(profile?.salary),        icon: TrendingUp },
                { label: 'Ledger Balance',value: formatCurrency(profile?.balance || 0),   icon: ArrowLeftRight, warn: (profile?.balance || 0) < 0 },
                { label: 'Total Payslips',value: payslips.length,                         icon: FileText },
                { label: 'Department',    value: profile?.department?.name || 'None',     icon: User },
              ].map((item, i) => (
                <div key={i} className={`bg-white border rounded-xl p-4 shadow-sm ${item.warn ? 'border-red-200' : 'border-gray-200'}`}>
                  <div className="flex items-center justify-between mb-1">
                    <p className={`text-[10px] font-bold uppercase tracking-wider ${item.warn ? 'text-red-600' : 'text-gray-500'}`}>{item.label}</p>
                    <item.icon size={14} className={item.warn ? 'text-red-400' : 'text-gray-400'} />
                  </div>
                  <p className={`text-lg font-bold truncate ${item.warn ? 'text-red-700' : 'text-black'}`}>{item.value}</p>
                </div>
              ))}
            </div>

            {/* Recent payslips */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-100">
                <h3 className="font-bold text-sm text-black">Recent Payslips</h3>
              </div>
              {payslips.slice(0, 5).length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-8">No payslips yet</p>
              ) : (
                <div className="divide-y divide-gray-100">
                  {payslips.slice(0, 5).map(slip => (
                    <button key={slip._id} onClick={() => { setSelectedSlip(slip); setActiveTab('payslips'); }}
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors text-left">
                      <div>
                        <p className="text-sm font-semibold text-black">{getMonthYear(slip.monthKey)}</p>
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider">{slip.paymentMode || 'Bank'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-black">{formatCurrency(slip.amount)}</p>
                        <p className="text-[10px] text-gray-400">{slip.presentDays || 0} days</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ATTENDANCE */}
        {activeTab === 'attendance' && (
          <div className="space-y-4 tab-fade">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-black">Attendance</h3>
              <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}
                className="bg-white border border-gray-200 px-2.5 py-1.5 text-xs font-semibold outline-none rounded-lg focus:border-black">
                {monthOptions.map(m => <option key={m.key} value={m.key}>{m.label}</option>)}
              </select>
            </div>

            {/* Summary pills */}
            <div className="flex gap-2 flex-wrap">
              {[['P', 'Present'], ['OT', 'OT'], ['HD', 'Half'], ['A', 'Absent'], ['PL', 'PL'], ['SL', 'SL']].map(([key, label]) => (
                summary[key] > 0 && (
                  <span key={key} className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_CONFIG[key].bg} ${STATUS_CONFIG[key].text}`}>
                    {label}: {summary[key]}
                  </span>
                )
              ))}
            </div>

            {/* Calendar grid */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
              <div className="grid grid-cols-7 border-b border-gray-100">
                {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
                  <div key={d} className="py-2 text-center text-[10px] font-bold text-gray-400 uppercase">{d}</div>
                ))}
              </div>
              <div className="p-2">
                {(() => {
                  const [y, m] = selectedMonth.split('-').map(Number);
                  const totalDays = getDaysInMonth(selectedMonth);
                  const firstDay = new Date(y, m - 1, 1).getDay();
                  const cells = [];
                  for (let i = 0; i < firstDay; i++) cells.push(null);
                  for (let d = 1; d <= totalDays; d++) cells.push(d);
                  return (
                    <div className="grid grid-cols-7 gap-1">
                      {cells.map((day, i) => {
                        if (!day) return <div key={`e-${i}`} />;
                        const dateStr = `${y}-${String(m).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
                        const status = attendance[dateStr];
                        const cfg = status ? STATUS_CONFIG[status] : null;
                        return (
                          <div key={dateStr} className={`aspect-square rounded-lg flex flex-col items-center justify-center ${cfg ? cfg.bg : 'bg-gray-50'}`}>
                            <span className={`text-xs font-bold ${cfg ? cfg.text : 'text-gray-400'}`}>{day}</span>
                            {status && <span className={`w-1 h-1 rounded-full mt-0.5 ${cfg.dot}`} />}
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-2">
              {Object.entries(STATUS_CONFIG).filter(([k]) => k !== 'WE').map(([key, cfg]) => (
                <span key={key} className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-semibold ${cfg.bg} ${cfg.text}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                  {key} — {cfg.label}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* LEDGER */}
        {activeTab === 'ledger' && (
          <div className="space-y-3 tab-fade">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-black">Your Ledger</h3>
              <div className={`text-sm font-bold ${(profile?.balance || 0) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                Balance: {formatCurrency(profile?.balance || 0)}
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
              {ledger.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-8">No transactions yet</p>
              ) : (
                <div className="divide-y divide-gray-100">
                  {ledger.map(tx => (
                    <div key={tx._id} className="flex items-center justify-between px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                          tx.type === 'salary' ? 'bg-emerald-100' :
                          tx.type === 'advance' ? 'bg-red-100' : 'bg-blue-100'
                        }`}>
                          {tx.type === 'salary'     ? <ArrowUpRight size={14} className="text-emerald-600" /> :
                           tx.type === 'advance'    ? <ArrowDownRight size={14} className="text-red-600" /> :
                                                      <ArrowUpRight size={14} className="text-blue-600" />}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-black capitalize">{tx.type}</p>
                          <p className="text-[10px] text-gray-400">{tx.note || ''} · {tx.date}</p>
                        </div>
                      </div>
                      <p className={`text-sm font-bold ${tx.type === 'advance' ? 'text-red-600' : 'text-emerald-600'}`}>
                        {tx.type === 'advance' ? '-' : '+'}{formatCurrency(tx.amount)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* PAYSLIPS */}
        {activeTab === 'payslips' && (
          <div className="space-y-4 tab-fade">
            {!selectedSlip ? (
              <>
                <h3 className="font-bold text-black">Payslips</h3>
                {payslips.length === 0 ? (
                  <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-gray-400 text-sm">No payslips yet</div>
                ) : (
                  <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                    <div className="divide-y divide-gray-100">
                      {payslips.map(slip => (
                        <button key={slip._id} onClick={() => setSelectedSlip(slip)}
                          className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 transition-colors text-left">
                          <div>
                            <p className="text-sm font-bold text-black">{getMonthYear(slip.monthKey)}</p>
                            <p className="text-[10px] text-gray-400 mt-0.5">{slip.presentDays || 0} present · {slip.halfDays || 0} HD · {slip.absentDays || 0} absent</p>
                          </div>
                          <div className="text-right flex items-center gap-2">
                            <div>
                              <p className="text-sm font-bold text-black">{formatCurrency(slip.amount)}</p>
                              <p className="text-[10px] text-gray-400">{slip.paymentMode}</p>
                            </div>
                            <ChevronRight size={14} className="text-gray-400" />
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              /* Payslip Detail */
              <div>
                <div className="flex items-center justify-between mb-4">
                  <button onClick={() => setSelectedSlip(null)} className="flex items-center gap-1.5 text-sm font-semibold text-gray-600 hover:text-black transition-colors">
                    <ChevronLeft size={16} /> Back
                  </button>
                  <div className="flex flex-wrap justify-end gap-2">
                    <button onClick={shareWhatsApp} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-xs font-semibold hover:bg-gray-50 transition-colors">
                      <MessageCircle size={13} className="text-[#25D366]" /> Send
                    </button>
                    <button onClick={() => handleExportPDF(true)} disabled={isExporting}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 text-xs font-semibold hover:bg-gray-200 transition-colors disabled:opacity-50">
                      <Share2 size={13} className="text-blue-500" /> Share
                    </button>
                    <button onClick={() => handleExportPDF(false)} disabled={isExporting}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black text-white text-xs font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50">
                      <Download size={13} /> {isExporting ? 'Saving...' : 'PDF'}
                    </button>
                  </div>
                </div>

                {/* Printable slip */}
                <div ref={slipRef} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                  {/* Header */}
                  <div className="bg-black text-white p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] text-white/50 uppercase tracking-widest mb-1">Salary Slip</p>
                        <h3 className="font-bold text-lg">{getMonthYear(selectedSlip.monthKey)}</h3>
                      </div>
                      <div className="text-right">
                        <p className="text-white/50 text-[10px] uppercase tracking-widest">Net Payout</p>
                        <p className="text-2xl font-bold">{formatCurrency(selectedSlip.amount)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Employee info */}
                  <div className="p-5 border-b border-gray-100">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase tracking-widest">Employee</p>
                        <p className="text-sm font-bold text-black mt-0.5">{profile?.name}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase tracking-widest">Designation</p>
                        <p className="text-sm font-bold text-black mt-0.5">{profile?.role || '—'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase tracking-widest">Department</p>
                        <p className="text-sm font-bold text-black mt-0.5">{profile?.department?.name || '—'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase tracking-widest">Payment Mode</p>
                        <p className="text-sm font-bold text-black mt-0.5">{selectedSlip.paymentMode || 'Bank'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Attendance breakdown */}
                  <div className="p-5 border-b border-gray-100">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Attendance</p>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        ['Present', selectedSlip.presentDays || 0],
                        ['Half Day', selectedSlip.halfDays || 0],
                        ['Absent', selectedSlip.absentDays || 0],
                        ['Paid Leave', selectedSlip.plCount || 0],
                        ['Sick Leave', selectedSlip.slCount || 0],
                        ['Overtime', selectedSlip.otDays || 0],
                      ].map(([label, val]) => (
                        <div key={label} className="bg-gray-50 rounded-lg p-2.5 text-center">
                          <p className="text-lg font-bold text-black">{val}</p>
                          <p className="text-[10px] text-gray-500">{label}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Earnings / Deductions */}
                  <div className="p-5">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Earnings & Deductions</p>
                    <div className="space-y-2">
                      {[
                        { label: 'Earned Salary',     val: selectedSlip.earnedSalary,     positive: true },
                        { label: 'Overtime',          val: selectedSlip.overtime || 0,    positive: true },
                        { label: 'Allowance',         val: selectedSlip.bonus || 0,       positive: true },
                        { label: 'Deductions',        val: selectedSlip.deductions || 0,  positive: false },
                        { label: 'Opening Balance',   val: selectedSlip.openingBalance || 0, positive: (selectedSlip.openingBalance || 0) >= 0 },
                      ].map(({ label, val, positive }) => (
                        <div key={label} className="flex items-center justify-between py-1.5 border-b border-gray-100 last:border-0">
                          <span className="text-sm text-gray-600">{label}</span>
                          <span className={`text-sm font-semibold ${positive ? 'text-emerald-700' : 'text-red-600'}`}>
                            {positive ? '+' : '-'}{formatCurrency(Math.abs(val))}
                          </span>
                        </div>
                      ))}
                      <div className="flex items-center justify-between pt-2">
                        <span className="text-sm font-bold text-black">Net Payout</span>
                        <span className="text-base font-bold text-black">{formatCurrency(selectedSlip.amount)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* HELP */}
        {activeTab === 'help' && <StaffHelp companyName={staffUser?.companyName} />}

      </div>
    </div>
  );
}

/* ─── Staff Help Component ─── */
const HELP_SECTIONS = [
  {
    id: 'salary',
    icon: IndianRupee,
    title: 'Salary & Pay',
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    items: [
      {
        q: 'How is my salary calculated?',
        a: `Your salary is calculated based on your attendance for the month using this formula:\n\n• Daily Rate = Base Salary ÷ Total days in month\n• Earned Salary = Paid Days × Daily Rate\n\nPaid Days include: Present (P), Overtime (OT), Paid Leave (PL), Sick Leave (SL), Public Holidays (PH), and Weekend Off days.\n\nHalf Day (HD) = 0.5 days paid. Absent (A) = 0 days paid.`,
      },
      {
        q: 'Why is my salary less than my base salary this month?',
        a: `Your net payout can be lower than your base salary if:\n\n1. You were marked Absent (A) or Half Day (HD) on some days — those days are either not paid or counted as 0.5 days\n2. You have a fixed deduction set by your employer\n3. You took an advance earlier and it is being recovered from this month's salary\n4. The opening balance on your ledger was negative\n\nCheck your payslip for that month — it shows the full breakdown of earned salary, deductions, and adjustments.`,
      },
      {
        q: 'What is "Opening Balance" on my payslip?',
        a: `Opening Balance is the amount carried over from your ledger before this salary was processed.\n\n• If you took an advance (e.g. ₹2,000 in advance), your balance became -₹2,000\n• When salary is processed, this negative balance reduces your net payout\n• If your employer added a bonus/adjustment, it could also be a positive balance\n\nAfter salary is paid, the closing balance becomes ₹0.`,
      },
      {
        q: 'What are the extra amounts added to my salary?',
        a: `Three things can increase your payout beyond the earned salary:\n\n1. Allowance — A fixed monthly amount set by your employer (e.g. travel or food allowance)\n2. Overtime — Extra pay for days marked OT. Usually calculated as your daily rate × OT days\n3. Bonus — One-time extra amount added by your employer when processing salary\n\nYou can see each of these on your payslip under "Earnings & Deductions".`,
      },
      {
        q: 'When will I receive my salary?',
        a: `Your employer decides when salary is paid and processed. StaffFlow does not automatically transfer money — it is a record-keeping tool.\n\nOnce your employer marks your salary as "Paid" in the system, it will appear in your Payslips tab. If you have not received your salary but it shows as processed, contact your employer directly.`,
      },
    ],
  },
  {
    id: 'attendance',
    icon: CalendarDays,
    title: 'Attendance',
    color: 'text-blue-700',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    items: [
      {
        q: 'What do the attendance codes mean?',
        a: `Here is what each code means on your attendance calendar:\n\n• P  — Present (full working day, fully paid)\n• OT — Overtime (worked beyond normal hours, extra pay)\n• HD — Half Day (worked half the day, paid 50%)\n• A  — Absent (did not come to work, unpaid)\n• PL — Paid Leave (approved leave, still paid)\n• SL — Sick Leave (medical leave, still paid)\n• PH — Public Holiday (national/festival holiday, paid)\n• WE — Weekend Off (your weekly off day, paid)\n\nOnly P, OT, PL, SL, PH, and WE days count as paid days.`,
      },
      {
        q: 'My attendance for a day seems wrong. What should I do?',
        a: `You cannot change your own attendance — only your employer/admin can update it.\n\nIf you notice an error:\n1. Take note of the date and what the wrong status is\n2. Tell your employer or HR admin the correct status it should be\n3. Your employer can correct it in the system\n\nOnce corrected, re-check your payslip for that month — if salary was already processed, your employer may need to re-process it.`,
      },
      {
        q: 'Why do some days show blank / no status?',
        a: `Blank days (no colour, no dot) mean attendance has not been marked for that date yet.\n\nThis can happen if:\n• Your employer has not yet marked attendance for those dates\n• The month is still in progress and your employer marks attendance day by day or at the end of the month\n\nIf the month is over and many days are blank, contact your employer to update the attendance.`,
      },
      {
        q: 'What is a "Weekly Off" and am I paid for it?',
        a: `A weekly off is the day(s) your employer has set as your rest day(s). Common options are:\n• Sunday only\n• Saturday + Sunday (Weekend)\n• Or any other single day set by your employer\n\nWeekly off days (WE) are counted as paid days — you are paid for them even though you do not work. They appear grey on your calendar.`,
      },
    ],
  },
  {
    id: 'ledger',
    icon: ArrowLeftRight,
    title: 'Ledger & Advances',
    color: 'text-purple-700',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    items: [
      {
        q: 'What is the Ledger?',
        a: `The Ledger is your personal account balance with your employer. It records all money transactions between you and the company:\n\n• Debit (−) entries: Advances taken, salary deductions\n• Credit (+) entries: Adjustments, bonuses added to your account\n\nYour current balance is shown at the top of the Ledger tab. A negative balance means you owe money to the company (e.g. you took an advance). A positive balance means the company owes you money.`,
      },
      {
        q: 'What is an "Advance" and how does it affect my salary?',
        a: `An advance is money your employer paid you before your salary date — like a loan from the company.\n\nExample:\n• You asked for ₹3,000 in advance mid-month\n• Your balance becomes -₹3,000\n• At month end when salary is processed, that -₹3,000 is shown as "Opening Balance"\n• Your net payout is reduced by ₹3,000\n• After processing, balance resets to ₹0\n\nIf the advance was larger than your earned salary, you may still owe money — this will carry forward to next month.`,
      },
      {
        q: 'I see a transaction I do not recognise. What should I do?',
        a: `Check the transaction type and note:\n• "advance" — means money was debited (advance given to you or a deduction)\n• "adjustment" — a manual entry by your employer (could be a bonus or correction)\n• "salary" — your monthly salary payment\n\nIf a transaction looks wrong, note the date and amount, then ask your employer to review and explain it. Your employer has full control over ledger entries.`,
      },
    ],
  },
  {
    id: 'payslips',
    icon: FileText,
    title: 'Payslips & Download',
    color: 'text-orange-700',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    items: [
      {
        q: 'How do I download my salary slip?',
        a: `Go to the Payslips tab → tap any month → tap the "PDF" button (top right of the slip). Your payslip will be downloaded as a PDF file.\n\nYou can also tap "Share" to send it via WhatsApp, email, or any other app on your phone.`,
      },
      {
        q: 'My payslip is not showing for last month. Why?',
        a: `A payslip only appears once your employer has "Processed" your salary for that month in the system. It does not appear automatically just because the month ended.\n\nIf a month is missing, it means your employer has not yet run payroll for that period. Contact your employer to ask when it will be processed.`,
      },
      {
        q: 'Can I use this payslip as proof of income?',
        a: `Yes, the payslip downloaded from StaffFlow can be used as a basic income proof. It shows:\n• Your name and designation\n• Company name\n• Month and year\n• Gross earnings breakdown\n• Net payout amount\n\nHowever, for official purposes like bank loans or visa applications, your employer may need to provide a stamped/signed letter in addition to the payslip.`,
      },
    ],
  },
  {
    id: 'account',
    icon: User,
    title: 'Your Account',
    color: 'text-gray-700',
    bg: 'bg-gray-50',
    border: 'border-gray-200',
    items: [
      {
        q: 'How do I change my login password?',
        a: `You cannot change your own password from this portal — only your employer/admin can set or reset your password.\n\nAsk your employer to update your password in the Staff directory. They can edit your profile and set a new password for you.`,
      },
      {
        q: 'I forgot my password. How do I log in?',
        a: `Contact your employer or HR admin and ask them to reset your portal password. They can set a new password for you from the admin panel.\n\nOnce they give you the new password, use it to log in at the login page.`,
      },
      {
        q: 'Can I see other employees\' details?',
        a: `No. Your portal only shows your own data — your attendance, your payslips, your ledger. You cannot see any other employee's information.\n\nThe admin (your employer) has a separate login that shows the full team view.`,
      },
      {
        q: 'I have been logged out unexpectedly. Why?',
        a: `Your login session expires after 7 days for security. After that you need to log in again.\n\nOther reasons you may be logged out:\n• You logged in on another device\n• Your employer disabled your portal access\n• You clicked Logout\n\nIf your login suddenly stops working (wrong password), your employer may have reset your credentials. Ask them for the new password.`,
      },
    ],
  },
];

function StaffHelp({ companyName }) {
  const [openItem, setOpenItem] = useState(null);
  const [activeSection, setActiveSection] = useState('salary');
  const section = HELP_SECTIONS.find(s => s.id === activeSection);

  return (
    <div className="space-y-4 tab-fade">
      {/* Header */}
      <div className="bg-black rounded-2xl p-5 text-white">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center shrink-0">
            <BookOpen size={20} className="text-white" />
          </div>
          <div>
            <h3 className="font-bold text-base leading-tight">Help & Guide</h3>
            <p className="text-white/50 text-xs mt-0.5">Answers to your common questions</p>
          </div>
        </div>
        <div className="bg-white/10 rounded-xl px-4 py-3 flex items-start gap-2.5">
          <Info size={14} className="text-white/60 mt-0.5 shrink-0" />
          <p className="text-xs text-white/80 leading-relaxed">
            Can't find your answer here? Contact your manager or HR admin at <span className="font-semibold text-white">{companyName || 'your company'}</span> — they manage your salary, attendance, and account.
          </p>
        </div>
      </div>

      {/* What to ask your employer */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <div className="flex items-start gap-2.5">
          <MessageSquare size={15} className="text-amber-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-bold text-amber-800 mb-1.5">Things to ask your employer directly</p>
            <ul className="space-y-1">
              {[
                'Correct a wrong attendance entry',
                'Explain an unexpected deduction',
                'Process or re-process salary for a month',
                'Reset your portal login password',
                'Explain an advance or ledger entry',
                'Add an allowance or approve a leave',
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-2 text-xs text-amber-700">
                  <span className="w-1 h-1 rounded-full bg-amber-500 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Section pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
        {HELP_SECTIONS.map(s => (
          <button
            key={s.id}
            onClick={() => { setActiveSection(s.id); setOpenItem(null); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition-colors ${
              activeSection === s.id
                ? `${s.bg} ${s.color} ${s.border}`
                : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
            }`}
          >
            <s.icon size={12} />
            {s.title}
          </button>
        ))}
      </div>

      {/* Q&A accordion */}
      <div className="space-y-2">
        {section?.items.map((item, i) => {
          const key = `${activeSection}-${i}`;
          const isOpen = openItem === key;
          return (
            <div key={key} className={`bg-white border rounded-xl overflow-hidden transition-all ${isOpen ? section.border : 'border-gray-200'}`}>
              <button
                onClick={() => setOpenItem(isOpen ? null : key)}
                className="w-full flex items-center justify-between px-4 py-3.5 text-left gap-3"
              >
                <span className="text-sm font-semibold text-black leading-snug">{item.q}</span>
                <ChevronDown size={16} className={`text-gray-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
              </button>
              {isOpen && (
                <div className={`px-4 pb-4 border-t ${section.border}`}>
                  <div className={`${section.bg} rounded-lg p-3 mt-3`}>
                    {item.a.split('\n').map((line, li) => (
                      line.trim() === '' ? <div key={li} className="h-1.5" /> :
                      <p key={li} className={`text-xs leading-relaxed ${section.color}`}>{line}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

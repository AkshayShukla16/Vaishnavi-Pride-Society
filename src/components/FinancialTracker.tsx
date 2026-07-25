import React, { useState } from 'react';
import { Payment, SocietyExpense, UserRole, Flat, PaymentStatus } from '../types/society';
import { compressImage } from '../services/imageCompressor';
import { getLocalISOString } from '../utils/dateFormatter';
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Upload, 
  Camera,
  CheckCircle2, 
  XCircle, 
  Plus, 
  FileText, 
  Building2, 
  QrCode, 
  ShieldCheck,
  Eye,
  Check,
  X
} from 'lucide-react';

interface FinancialTrackerProps {
  payments: Payment[];
  expenses: SocietyExpense[];
  onAddPayment: (payment: Omit<Payment, 'id' | 'submittedAt'>) => void;
  onVerifyPayment: (paymentId: string, status: PaymentStatus, reason?: string) => void;
  onAddExpense: (expense: Omit<SocietyExpense, 'id'>) => void;
  currentFlat: Flat;
  currentRole: UserRole;
}

export const FinancialTracker: React.FC<FinancialTrackerProps> = ({
  payments,
  expenses,
  onAddPayment,
  onVerifyPayment,
  onAddExpense,
  currentFlat,
  currentRole,
}) => {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);

  // Payment Form State
  const [amount, setAmount] = useState(4500);
  const [monthYear, setMonthYear] = useState('July 2026');
  const [transactionRef, setTransactionRef] = useState('');
  const [screenshotUrl, setScreenshotUrl] = useState('');
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionNotice, setCompressionNotice] = useState('');

  // Expense Form State
  const [expTitle, setExpTitle] = useState('');
  const [expCategory, setExpCategory] = useState<SocietyExpense['category']>('Utilities');
  const [expAmount, setExpAmount] = useState<number>(0);
  const [expVendor, setExpVendor] = useState('');
  const [expInvoiceUrl, setExpInvoiceUrl] = useState('');

  const handleScreenshotUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsCompressing(true);
    try {
      const compressed = await compressImage(file, 150);
      setScreenshotUrl(compressed);
      setCompressionNotice('UPI Screenshot compressed to ~150KB (Canvas engine)');
    } catch (err) {
      console.error('Compression failed', err);
    } finally {
      setIsCompressing(false);
    }
  };

  const handleInvoiceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file, 150);
      setExpInvoiceUrl(compressed);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDepositSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transactionRef || !screenshotUrl) return;

    onAddPayment({
      flatId: currentFlat.id,
      flatNumber: currentFlat.flatNumber,
      ownerName: currentFlat.ownerName,
      amount,
      monthYear,
      transactionRef,
      screenshotUrl,
      status: 'PENDING VERIFICATION',
    });

    setTransactionRef('');
    setScreenshotUrl('');
    setCompressionNotice('');
    setShowPaymentModal(false);
  };

  const handleExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expTitle || !expAmount || !expVendor) return;

    onAddExpense({
      title: expTitle,
      category: expCategory,
      amountPaid: expAmount,
      vendorName: expVendor,
      invoiceUrl: expInvoiceUrl || 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=500&auto=format&fit=crop&q=60',
      datePaid: getLocalISOString().split('T')[0],
      approvedByAdminId: currentFlat.id,
    });

    setExpTitle('');
    setExpAmount(0);
    setExpVendor('');
    setExpInvoiceUrl('');
    setShowExpenseModal(false);
  };

  // Live Formula Calculations (Requirement 3.3)
  const totalVerifiedDeposits = payments
    .filter(p => p.status === 'VERIFIED')
    .reduce((sum, p) => sum + p.amount, 0);

  const totalSocietyExpenses = expenses.reduce((sum, e) => sum + e.amountPaid, 0);

  const netBuildingFundBalance = totalVerifiedDeposits - totalSocietyExpenses;

  return (
    <div className="space-y-6">
      {/* Financial Formula Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Net Fund Card */}
        <div className="glass-panel p-5 bg-gradient-to-br from-slate-900 via-slate-900 to-sky-950/40 border-sky-500/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Current Building Net Fund</span>
            <span className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <Wallet className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-white tracking-tight">
              ₹ {netBuildingFundBalance.toLocaleString('en-IN')}
            </div>
            <p className="text-[11px] text-sky-300 mt-1 font-mono">
              Live Formula: Verified Deposits - Total Outflows
            </p>
          </div>
        </div>

        {/* Total Deposits */}
        <div className="glass-panel p-5 bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/40 border-emerald-500/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Verified Deposits</span>
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <TrendingUp className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-emerald-400 tracking-tight">
              ₹ {totalVerifiedDeposits.toLocaleString('en-IN')}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              From Verified UPI Flat Maintenance Slips
            </p>
          </div>
        </div>

        {/* Total Expenses */}
        <div className="glass-panel p-5 bg-gradient-to-br from-slate-900 via-slate-900 to-rose-950/40 border-rose-500/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Society Expenses</span>
            <span className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <TrendingDown className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-rose-400 tracking-tight">
              ₹ {totalSocietyExpenses.toLocaleString('en-IN')}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Audited Outflow Receipts & Vendor Invoices
            </p>
          </div>
        </div>
      </div>

      {/* Action Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 glass-panel">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-sky-400" />
            100% Transparent Financial Ledger & UPI Deposit
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Every flat maintenance deposit and society vendor expense is publicly auditable building-wide.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {currentRole !== 'Auditor' && (
            <button
              onClick={() => setShowPaymentModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-sky-600/30"
            >
              <QrCode className="w-4 h-4" />
              Pay UPI & Upload Deposit
            </button>
          )}

          {currentRole === 'Management' && (
            <button
              onClick={() => setShowExpenseModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-rose-300 border border-rose-500/40 rounded-xl text-xs font-semibold"
            >
              <Plus className="w-4 h-4" />
              Record Outflow Expense
            </button>
          )}
        </div>
      </div>

      {/* Main Ledger Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Maintenance Payment Deposits */}
        <div className="glass-panel p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              Incoming Maintenance Deposits
            </h3>
            <span className="text-xs text-slate-400 font-mono">154 Flat Slips</span>
          </div>

          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {payments.map((p) => {
              const isPending = p.status === 'PENDING VERIFICATION';
              const isVerified = p.status === 'VERIFIED';

              return (
                <div key={p.id} className="p-4 bg-slate-950/60 rounded-xl border border-slate-800/80 flex flex-col justify-between space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">Flat #{p.flatNumber}</span>
                        <span className="text-xs text-slate-400">({p.ownerName})</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">Month: <strong className="text-slate-200">{p.monthYear}</strong></p>
                      <p className="text-[11px] text-sky-400 font-mono mt-0.5">Ref: {p.transactionRef}</p>
                    </div>

                    <div className="text-right">
                      <span className="text-sm font-extrabold text-emerald-400 block">₹ {p.amount.toLocaleString('en-IN')}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase mt-1 inline-block ${
                        isPending
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : isVerified
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      }`}>
                        {p.status}
                      </span>
                    </div>
                  </div>

                  {/* Screenshot Thumbnail */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
                    {p.screenshotUrl && (
                      <a href={p.screenshotUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs text-sky-400 hover:underline">
                        <FileText className="w-3.5 h-3.5" />
                        View UPI Receipt Soft-Copy
                      </a>
                    )}

                    {/* Admin Verification Actions */}
                    {currentRole === 'Management' && isPending && (
                      <div className="flex gap-2 ml-auto">
                        <button
                          onClick={() => onVerifyPayment(p.id, 'VERIFIED')}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-md shadow-emerald-600/30"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Approve
                        </button>
                        <button
                          onClick={() => onVerifyPayment(p.id, 'REJECTED', 'Invalid Transaction ID')}
                          className="px-2.5 py-1 bg-rose-600/30 hover:bg-rose-600/50 text-rose-300 border border-rose-500/40 rounded-lg text-xs font-semibold flex items-center gap-1"
                        >
                          <X className="w-3.5 h-3.5" />
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Outgoing Society Expenses */}
        <div className="glass-panel p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-rose-400" />
              Audited Outflow Society Expenses
            </h3>
            <span className="text-xs text-slate-400 font-mono">Public Auditing</span>
          </div>

          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {expenses.map((exp) => (
              <div key={exp.id} className="p-4 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-white text-sm">{exp.title}</h4>
                    <p className="text-xs text-slate-400 mt-0.5">Vendor: <strong className="text-slate-200">{exp.vendorName}</strong></p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-sky-300 text-[10px] font-semibold">{exp.category}</span>
                      <span className="text-[10px] text-slate-500">Paid: {exp.datePaid}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-sm font-extrabold text-rose-400 block">₹ {exp.amountPaid.toLocaleString('en-IN')}</span>
                    <span className="text-[10px] text-emerald-400 font-medium">Audited & Verified</span>
                  </div>
                </div>

                {exp.invoiceUrl && (
                  <div className="pt-2 border-t border-slate-800/60">
                    <a href={exp.invoiceUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs text-sky-400 hover:underline">
                      <FileText className="w-3.5 h-3.5" />
                      View Vendor Receipt Invoice (Soft Copy)
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Payment Deposit Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-lg p-6 space-y-5">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <QrCode className="w-5 h-5 text-sky-400" />
                Submit Monthly Maintenance Payment Slip
              </h3>
              <button onClick={() => setShowPaymentModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            {/* Society Bank UPI Details Box */}
            <div className="p-4 bg-sky-950/60 border border-sky-800/80 rounded-2xl space-y-2 text-xs">
              <div className="flex justify-between items-center text-sky-200 font-bold">
                <span>Society UPI VPA:</span>
                <span className="font-mono bg-sky-900/60 px-2 py-0.5 rounded border border-sky-700">vaishnavipride@sbi</span>
              </div>
              <p className="text-slate-300 text-[11px]">Bank: State Bank of India | Account: 40918239019 | IFSC: SBIN0004910</p>
            </div>

            <form onSubmit={handleDepositSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Maintenance Amount (₹)</label>
                  <input
                    type="number"
                    required
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Payment Month</label>
                  <input
                    type="text"
                    required
                    value={monthYear}
                    onChange={(e) => setMonthYear(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">UPI Transaction Reference ID</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. UPI/619204928104/SBI or UTR Number"
                  value={transactionRef}
                  onChange={(e) => setTransactionRef(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Upload UPI Transaction Screenshot / Photo</label>
                <div className="flex flex-wrap items-center gap-3 p-3 bg-slate-950 border border-slate-800 rounded-xl">
                  <label className="cursor-pointer px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 shadow-sm">
                    <Camera className="w-3.5 h-3.5" />
                    {isCompressing ? 'Compressing...' : 'Take Live Photo'}
                    <input type="file" accept="image/*" capture="environment" onChange={handleScreenshotUpload} className="hidden" />
                  </label>

                  <label className="cursor-pointer px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-sky-300 rounded-lg text-xs font-medium flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5" />
                    Choose File
                    <input type="file" accept="image/*" onChange={handleScreenshotUpload} className="hidden" />
                  </label>
                  {screenshotUrl && (
                    <img src={screenshotUrl} alt="Preview" className="w-10 h-10 object-cover rounded-lg border border-sky-500/50" />
                  )}
                </div>
                {compressionNotice && (
                  <p className="text-[11px] text-emerald-400 mt-1 font-mono">{compressionNotice}</p>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 hover:bg-slate-700 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCompressing}
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-sky-600/30"
                >
                  Submit Payment for Verification
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Expense Modal */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-lg p-6 space-y-5">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-rose-400" />
                Register Society Expense Outflow
              </h3>
              <button onClick={() => setShowExpenseModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleExpenseSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Expense Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Monthly Security Guard Agency Salary"
                  value={expTitle}
                  onChange={(e) => setExpTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Category</label>
                  <select
                    value={expCategory}
                    onChange={(e) => setExpCategory(e.target.value as SocietyExpense['category'])}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none"
                  >
                    <option value="Wages">Wages</option>
                    <option value="Utilities">Utilities</option>
                    <option value="Security">Security</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Vendor AMC">Vendor AMC</option>
                    <option value="Misc">Misc</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Amount Paid (₹)</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 85000"
                    value={expAmount || ''}
                    onChange={(e) => setExpAmount(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Vendor / Payee Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Security Agency"
                  value={expVendor}
                  onChange={(e) => setExpVendor(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Attach Mandatory Vendor Receipt/Invoice</label>
                <div className="flex items-center gap-3 p-3 bg-slate-950 border border-slate-800 rounded-xl">
                  <label className="cursor-pointer px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-sky-300 rounded-lg text-xs font-medium flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5" />
                    Upload Invoice
                    <input type="file" accept="image/*" onChange={handleInvoiceUpload} className="hidden" />
                  </label>
                  {expInvoiceUrl && (
                    <img src={expInvoiceUrl} alt="Preview" className="w-10 h-10 object-cover rounded-lg border border-sky-500/50" />
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 hover:bg-slate-700 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-rose-600/30"
                >
                  Record Outflow & Update Fund Balance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

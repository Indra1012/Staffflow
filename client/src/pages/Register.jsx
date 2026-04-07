import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '../api/auth';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff } from 'lucide-react';

export default function Register() {
  const { loginSave } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ companyName: '', ownerName: '', email: '', password: '', confirmPassword: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      return setError('Passwords do not match');
    }
    setLoading(true);
    setError('');
    try {
      const res = await register({
        companyName: form.companyName,
        ownerName: form.ownerName,
        email: form.email,
        password: form.password,
      });
      loginSave(res.data.token, res.data.company, 'company');
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm p-8 rounded-2xl border border-gray-200 shadow-sm">
        <h1 className="text-2xl font-bold text-black mb-1">StaffFlow</h1>
        <p className="text-gray-500 text-sm mb-8">Create your company account</p>

        {error && <p className="text-red-600 text-sm mb-4 bg-red-50 border border-red-200 p-3 rounded-lg">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-600 uppercase tracking-widest block mb-1">Company Name</label>
            <input type="text" required className="w-full border border-gray-300 px-3 py-2 rounded-lg text-sm outline-none focus:border-black transition-colors" value={form.companyName} onChange={e => setForm({ ...form, companyName: e.target.value })} />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-600 uppercase tracking-widest block mb-1">Owner Full Name</label>
            <input type="text" required className="w-full border border-gray-300 px-3 py-2 rounded-lg text-sm outline-none focus:border-black transition-colors" value={form.ownerName} onChange={e => setForm({ ...form, ownerName: e.target.value })} />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-600 uppercase tracking-widest block mb-1">Email Address</label>
            <input type="email" required className="w-full border border-gray-300 px-3 py-2 rounded-lg text-sm outline-none focus:border-black transition-colors" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-600 uppercase tracking-widest block mb-1">Password</label>
            <div className="relative">
              <input type={showPwd ? 'text' : 'password'} required className="w-full border border-gray-300 px-3 py-2 pr-9 rounded-lg text-sm outline-none focus:border-black transition-colors" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
              <button type="button" onClick={() => setShowPwd(v => !v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-600 uppercase tracking-widest block mb-1">Confirm Password</label>
            <div className="relative">
              <input type={showConfirmPwd ? 'text' : 'password'} required className="w-full border border-gray-300 px-3 py-2 pr-9 rounded-lg text-sm outline-none focus:border-black transition-colors" value={form.confirmPassword} onChange={e => setForm({ ...form, confirmPassword: e.target.value })} />
              <button type="button" onClick={() => setShowConfirmPwd(v => !v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                {showConfirmPwd ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>
          <button type="submit" disabled={loading} className="w-full bg-black text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50">
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-500 mt-6">
          Already have an account? <Link to="/login" className="text-black font-semibold hover:underline">Sign In</Link>
        </p>
      </div>
    </div>
  );
}

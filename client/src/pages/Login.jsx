import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import { login, googleAuth } from '../api/auth';
import { staffLogin, staffGoogleAuth } from '../api/employeePortal';
import { Wallet, Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const { loginSave } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState('company'); // 'company' | 'employee'

  // Company login state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Employee login state
  const [empEmail, setEmpEmail] = useState('');
  const [empPassword, setEmpPassword] = useState('');
  const [showEmpPassword, setShowEmpPassword] = useState(false);
  const [empError, setEmpError] = useState('');
  const [empLoading, setEmpLoading] = useState(false);

  // Google setup flow state
  const [showSetup, setShowSetup] = useState(false);
  const [googleCredential, setGoogleCredential] = useState('');
  const [googleEmail, setGoogleEmail] = useState('');
  const [googleName, setGoogleName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [ownerName, setOwnerName] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await login({ email, password });
      if (res.data.role === 'staff') {
        loginSave(res.data.token, res.data.staff, 'staff');
        navigate('/employee');
      } else {
        loginSave(res.data.token, res.data.company, 'company');
        navigate('/');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || err.message || 'Login failed');
    }
    setLoading(false);
  };

  const handleEmployeeLogin = async (e) => {
    e.preventDefault();
    setEmpLoading(true);
    setEmpError('');
    try {
      const res = await staffLogin(empEmail, empPassword);
      loginSave(res.data.token, res.data.staff, 'staff');
      navigate('/employee');
    } catch (err) {
      console.error('Emp login error:', err);
      setEmpError(err.response?.data?.message || err.message || 'Login failed');
    }
    setEmpLoading(false);
  };

  const handleGoogleSuccess = async (tokenResponse) => {
    setLoading(true);
    setError('');
    try {
      const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
      });
      const userInfo = await userInfoRes.json();

      const res = await googleAuth({ credential: tokenResponse.access_token, email: userInfo.email });

      if (res.data.isNew) {
        setGoogleCredential(tokenResponse.access_token);
        setGoogleEmail(res.data.email);
        setGoogleName(res.data.name);
        setOwnerName(res.data.name || '');
        setShowSetup(true);
        setLoading(false);
        return;
      }

      loginSave(res.data.token, res.data.company, 'company');
      navigate('/');
    } catch (err) {
      console.error('Google auth error:', err);
      setError(err.response?.data?.message || err.message || 'Google sign-in failed. Please try again.');
    }
    setLoading(false);
  };

  const handleEmpGoogleSuccess = async (tokenResponse) => {
    setEmpLoading(true);
    setEmpError('');
    try {
      const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
      });
      const userInfo = await userInfoRes.json();

      const res = await staffGoogleAuth({ credential: tokenResponse.access_token, email: userInfo.email });
      loginSave(res.data.token, res.data.staff, 'staff');
      navigate('/employee');
    } catch (err) {
      console.error('Emp Google auth error:', err);
      setEmpError(err.response?.data?.message || err.message || 'Employee Google sign-in failed.');
    }
    setEmpLoading(false);
  };

  const googleLogin = useGoogleLogin({
    onSuccess: handleGoogleSuccess,
    onError: () => setError('Google sign-in failed.'),
  });

  const empGoogleLogin = useGoogleLogin({
    onSuccess: handleEmpGoogleSuccess,
    onError: () => setEmpError('Google sign-in failed.'),
  });

  const handleSetupSubmit = async (e) => {
    e.preventDefault();
    if (!companyName || !ownerName) return setError('Please fill in all fields.');
    setLoading(true);
    setError('');
    try {
      const res = await googleAuth({
        credential: googleCredential,
        email: googleEmail,
        companyName,
        ownerName,
      });
      loginSave(res.data.token, res.data.company, 'company');
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Setup failed.');
    }
    setLoading(false);
  };

  // Setup screen for new Google users
  if (showSetup) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <div className="flex items-center gap-2 mb-8">
            <div className="bg-black p-1.5 rounded-lg"><Wallet className="text-white" size={18} /></div>
            <h1 className="text-lg font-bold text-black tracking-tight uppercase">StaffFlow</h1>
          </div>
          <h2 className="text-xl font-bold text-black mb-1">Almost there!</h2>
          <p className="text-gray-500 text-sm mb-6">Signed in as <span className="font-semibold text-black">{googleEmail}</span>. Set up your company to continue.</p>
          <form onSubmit={handleSetupSubmit} className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-gray-600 block mb-1.5 uppercase tracking-widest">Company Name</label>
              <input type="text" className="w-full bg-white border border-gray-300 px-3 py-2.5 rounded-lg text-sm outline-none focus:border-black transition-colors" placeholder="e.g. Indra Tech" value={companyName} onChange={e => setCompanyName(e.target.value)} autoFocus />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-600 block mb-1.5 uppercase tracking-widest">Owner Name</label>
              <input type="text" className="w-full bg-white border border-gray-300 px-3 py-2.5 rounded-lg text-sm outline-none focus:border-black transition-colors" placeholder="Your full name" value={ownerName} onChange={e => setOwnerName(e.target.value)} />
            </div>
            {error && <p className="text-xs text-red-600 bg-red-50 border border-red-200 p-2 rounded-lg">{error}</p>}
            <button type="submit" disabled={loading} className="w-full bg-black text-white py-2.5 rounded-lg font-semibold text-sm hover:bg-gray-800 transition-colors disabled:opacity-50">
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <div className="flex items-center gap-2 mb-6">
          <div className="bg-black p-1.5 rounded-lg"><Wallet className="text-white" size={18} /></div>
          <h1 className="text-lg font-bold text-black tracking-tight uppercase">StaffFlow</h1>
        </div>

        {/* Tabs */}
        <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
          <button
            onClick={() => { setTab('company'); setError(''); setEmpError(''); }}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${tab === 'company' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Company Login
          </button>
          <button
            onClick={() => { setTab('employee'); setError(''); setEmpError(''); }}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${tab === 'employee' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Employee Login
          </button>
        </div>

        {tab === 'company' ? (
          <>
            <h2 className="text-2xl font-bold text-black mb-1">Welcome back</h2>
            <p className="text-gray-500 text-sm mb-6">Sign in to your company account</p>

            {/* Google Button */}
            <button onClick={() => googleLogin()} disabled={loading}
              className="w-full flex items-center justify-center gap-3 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 font-semibold py-2.5 rounded-lg text-sm transition-colors mb-4 disabled:opacity-50">
              <svg width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"/><path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2.01c-.72.48-1.63.76-2.7.76-2.08 0-3.84-1.4-4.47-3.29H1.88v2.07A8 8 0 0 0 8.98 17z"/><path fill="#FBBC05" d="M4.51 10.52A4.8 4.8 0 0 1 4.26 9c0-.52.09-1.03.25-1.52V5.41H1.88A8 8 0 0 0 .98 9c0 1.29.31 2.51.9 3.59l2.63-2.07z"/><path fill="#EA4335" d="M8.98 3.58c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 8.98 1a8 8 0 0 0-7.1 4.41l2.63 2.07c.63-1.89 2.39-3.3 4.47-3.3z"/></svg>
              Continue with Google
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-gray-200"></div>
              <span className="text-xs text-gray-400 font-medium">or</span>
              <div className="flex-1 h-px bg-gray-200"></div>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-gray-600 block mb-1.5 uppercase tracking-widest">Email</label>
                <input type="email" className="w-full bg-white border border-gray-300 px-3 py-2.5 rounded-lg text-sm outline-none focus:border-black transition-colors" placeholder="you@company.com" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-600 block mb-1.5 uppercase tracking-widest">Password</label>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} className="w-full bg-white border border-gray-300 px-3 py-2.5 pr-10 rounded-lg text-sm outline-none focus:border-black transition-colors" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
                  <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              {error && <p className="text-xs text-red-600 bg-red-50 border border-red-200 p-2 rounded-lg">{error}</p>}
              <button type="submit" disabled={loading} className="w-full bg-black text-white py-2.5 rounded-lg font-semibold text-sm hover:bg-gray-800 transition-colors disabled:opacity-50">
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <p className="text-center text-xs text-gray-500 mt-6">
              Don't have an account? <a href="/register" className="text-black font-semibold hover:underline">Register</a>
            </p>
          </>
        ) : (
          <>
            <h2 className="text-2xl font-bold text-black mb-1">Employee Login</h2>
            <p className="text-gray-500 text-sm mb-6">Sign in with your employee credentials</p>

            {/* Employee Google Button */}
            <button onClick={() => empGoogleLogin()} disabled={empLoading}
              className="w-full flex items-center justify-center gap-3 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 font-semibold py-2.5 rounded-lg text-sm transition-colors mb-4 disabled:opacity-50">
              <svg width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"/><path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2.01c-.72.48-1.63.76-2.7.76-2.08 0-3.84-1.4-4.47-3.29H1.88v2.07A8 8 0 0 0 8.98 17z"/><path fill="#FBBC05" d="M4.51 10.52A4.8 4.8 0 0 1 4.26 9c0-.52.09-1.03.25-1.52V5.41H1.88A8 8 0 0 0 .98 9c0 1.29.31 2.51.9 3.59l2.63-2.07z"/><path fill="#EA4335" d="M8.98 3.58c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 8.98 1a8 8 0 0 0-7.1 4.41l2.63 2.07c.63-1.89 2.39-3.3 4.47-3.3z"/></svg>
              Continue with Google
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-gray-200"></div>
              <span className="text-xs text-gray-400 font-medium">or</span>
              <div className="flex-1 h-px bg-gray-200"></div>
            </div>

            <form onSubmit={handleEmployeeLogin} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-gray-600 block mb-1.5 uppercase tracking-widest">Email</label>
                <input type="email" className="w-full bg-white border border-gray-300 px-3 py-2.5 rounded-lg text-sm outline-none focus:border-black transition-colors" placeholder="your.email@company.com" value={empEmail} onChange={e => setEmpEmail(e.target.value)} required autoFocus />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-600 block mb-1.5 uppercase tracking-widest">Password</label>
                <div className="relative">
                  <input type={showEmpPassword ? 'text' : 'password'} className="w-full bg-white border border-gray-300 px-3 py-2.5 pr-10 rounded-lg text-sm outline-none focus:border-black transition-colors" placeholder="••••••••" value={empPassword} onChange={e => setEmpPassword(e.target.value)} required />
                  <button type="button" onClick={() => setShowEmpPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                    {showEmpPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              {empError && <p className="text-xs text-red-600 bg-red-50 border border-red-200 p-2 rounded-lg">{empError}</p>}
              <button type="submit" disabled={empLoading} className="w-full bg-black text-white py-2.5 rounded-lg font-semibold text-sm hover:bg-gray-800 transition-colors disabled:opacity-50">
                {empLoading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <p className="text-center text-xs text-gray-500 mt-6">
              Contact your employer if you don't have login credentials.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

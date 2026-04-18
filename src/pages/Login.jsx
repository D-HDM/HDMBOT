import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { 
  FiMail, FiLock, FiEye, FiEyeOff, FiLogIn, FiShield, 
  FiSmartphone, FiCheckCircle, FiAlertCircle, FiLoader 
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import clsx from 'clsx';

const Login = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated, loading: authLoading } = useAuth();
  const { darkMode } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const validateForm = () => {
    const newErrors = {};
    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    try {
      const success = await login(email, password, rememberMe);
      if (success) {
        toast.success('Login successful! Redirecting...');
      } else {
        toast.error('Invalid email or password');
      }
    } catch (err) {
      console.error('Login error:', err);
      toast.error('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-500 to-primary-700">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg">
          <FiLoader className="w-12 h-12 text-primary-500 animate-spin mx-auto" />
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  const inputClass = clsx(
    'w-full pl-10 pr-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition-colors',
    darkMode
      ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:ring-primary-500'
      : 'bg-white border-gray-300 text-gray-800 focus:ring-primary-500'
  );

  return (
    <div className="min-h-screen flex">
      {/* Left Column - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 md:p-8 bg-white dark:bg-gray-900">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl mb-4">
              <FiSmartphone className="text-white text-3xl" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">HDM Platform</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2">WhatsApp Business Automation</p>
          </div>

          {/* Welcome Text */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">Welcome Back</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Sign in to access your dashboard</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiMail className="text-gray-400" size={18} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); if (errors.email) setErrors({ ...errors, email: '' }); }}
                  className={clsx(inputClass, errors.email && 'border-red-500 focus:ring-red-500')}
                  placeholder="you@example.com"
                  disabled={loading}
                  autoComplete="email"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                  <FiAlertCircle size={12} /> {errors.email}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiLock className="text-gray-400" size={18} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); if (errors.password) setErrors({ ...errors, password: '' }); }}
                  className={clsx(inputClass, 'pr-10', errors.password && 'border-red-500 focus:ring-red-500')}
                  placeholder="••••••"
                  disabled={loading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <FiEyeOff className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" size={18} />
                  ) : (
                    <FiEye className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" size={18} />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                  <FiAlertCircle size={12} /> {errors.password}
                </p>
              )}
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-primary-500 border-gray-300 rounded focus:ring-primary-500"
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">Remember me</span>
              </label>
              <Link to="/forgot-password" className="text-sm text-primary-500 hover:underline">
                Forgot password?
              </Link>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <FiLoader className="animate-spin" size={18} />
                  Signing in...
                </>
              ) : (
                <>
                  <FiLogIn size={18} />
                  Sign In
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-xs text-gray-400 dark:text-gray-600">
              &copy; 2026 HDM Enterprise. All rights reserved.
            </p>
          </div>
        </div>
      </div>

      {/* Right Column - Hero/Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-500 to-primary-700 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-white rounded-full blur-3xl" />
        </div>
        
        <div className="relative z-10 flex flex-col justify-center px-12 text-white">
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-4 py-2 mb-6">
              <FiShield size={16} />
              <span className="text-sm font-medium">Enterprise Security</span>
            </div>
          </div>
          
          <h2 className="text-4xl font-bold mb-4">
            WhatsApp Business<br />
            Automation Platform
          </h2>
          
          <p className="text-lg text-white/80 mb-8 leading-relaxed">
            Streamline your customer communication with automated responses, 
            multi-device support, and powerful analytics.
          </p>
          
          <div className="space-y-4">
            {['Multi-device Support', 'Auto-reply Rules Engine', 'Real-time Analytics Dashboard', '24/7 Automated Responses'].map((feature, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <FiCheckCircle size={16} />
                </div>
                <span>{feature}</span>
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-3 gap-4 mt-12 pt-8 border-t border-white/20">
            <div>
              <p className="text-2xl font-bold">10K+</p>
              <p className="text-sm text-white/70">Messages Daily</p>
            </div>
            <div>
              <p className="text-2xl font-bold">99.9%</p>
              <p className="text-sm text-white/70">Uptime</p>
            </div>
            <div>
              <p className="text-2xl font-bold">24/7</p>
              <p className="text-sm text-white/70">Support</p>
            </div>
          </div>
        </div>
        
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/20 to-transparent" />
      </div>
    </div>
  );
};

export default Login;
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../context/authStore';
import { authService } from '../../services/authService';
import toast from 'react-hot-toast';
import { LogIn, User, Lock, X, HelpCircle, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [errors, setErrors] = useState({});
  const usernameRef = useRef(null);

  // Auto-focus username on mount
  useEffect(() => { usernameRef.current?.focus(); }, []);

  const validate = () => {
    const e = {};
    if (!formData.username.trim()) e.username = 'Username is required';
    if (!formData.password) e.password = 'Password is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(p => ({ ...p, [name]: value }));
    if (errors[name]) setErrors(p => ({ ...p, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const response = await authService.login(formData);
      if (response?.token && response?.user) {
        login(response.user, response.token);
        toast.success('Welcome back!');
        navigate('/');
      } else {
        toast.error('Invalid username or password');
      }
    } catch (error) {
      toast.error(error?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Heading */}
      <div className="mb-7">
        <h2 className="text-2xl font-bold text-white mb-1">Welcome back</h2>
        <p className="text-gray-500 text-sm">Sign in to your account to continue</p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {/* Username */}
        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
            Username
          </label>
          <div className="relative">
            <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none" />
            <input
              ref={usernameRef}
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Enter your username"
              autoComplete="username"
              className={`w-full pl-10 pr-4 py-3 rounded-xl text-sm text-white placeholder:text-gray-600 bg-gray-800 border transition-all outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 ${
                errors.username ? 'border-red-500 bg-red-950/20' : 'border-gray-700 hover:border-gray-600'
              }`}
            />
          </div>
          <AnimatePresence>
            {errors.username && (
              <motion.p
                initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="text-xs text-red-400 mt-1.5 flex items-center gap-1"
              >
                <span>⚠</span> {errors.username}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Password */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Password
            </label>
            <button
              type="button"
              onClick={() => setShowForgotModal(true)}
              className="text-xs text-primary-400 hover:text-primary-300 transition-colors"
            >
              Forgot password?
            </button>
          </div>
          <div className="relative">
            <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none" />
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              autoComplete="current-password"
              className={`w-full pl-10 pr-11 py-3 rounded-xl text-sm text-white placeholder:text-gray-600 bg-gray-800 border transition-all outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 ${
                errors.password ? 'border-red-500 bg-red-950/20' : 'border-gray-700 hover:border-gray-600'
              }`}
            />
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPassword(p => !p)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400 transition-colors"
            >
              {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          <AnimatePresence>
            {errors.password && (
              <motion.p
                initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="text-xs text-red-400 mt-1.5 flex items-center gap-1"
              >
                <span>⚠</span> {errors.password}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Submit */}
        <motion.button
          type="submit"
          disabled={loading}
          whileHover={{ scale: loading ? 1 : 1.01 }}
          whileTap={{ scale: loading ? 1 : 0.98 }}
          className="w-full mt-2 py-3 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 shadow-lg shadow-primary-900/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
              />
              <span>Signing in...</span>
            </>
          ) : (
            <>
              <span>Sign In</span>
              <ArrowRight size={16} />
            </>
          )}
        </motion.button>
      </form>

      {/* Divider */}
      <div className="mt-6 pt-5 border-t border-gray-800 text-center">
        <p className="text-xs text-gray-600">
          Protected by enterprise-grade security
        </p>
      </div>

      {/* Forgot Password Modal */}
      <AnimatePresence>
        {showForgotModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => setShowForgotModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 16 }}
              className="relative bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl p-6 w-full max-w-sm z-10"
            >
              <button
                onClick={() => setShowForgotModal(false)}
                className="absolute top-4 right-4 text-gray-600 hover:text-gray-300 transition-colors"
              >
                <X size={18} />
              </button>
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-primary-500/15 border border-primary-500/20 rounded-xl flex items-center justify-center mb-4">
                  <HelpCircle className="w-6 h-6 text-primary-400" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">Forgot your password?</h3>
                <p className="text-sm text-gray-400 mb-4 leading-relaxed">
                  Contact your system administrator to reset your password.
                </p>
                <div className="w-full bg-gray-800 border border-gray-700 rounded-xl p-4 text-left space-y-1.5">
                  {['Contact your system administrator', 'Admin resets from Settings → Security', 'You receive a new temporary password'].map((step, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full bg-primary-500/20 text-primary-400 text-[9px] font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                      <span className="text-xs text-gray-400">{step}</span>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setShowForgotModal(false)}
                  className="mt-4 w-full py-2.5 bg-primary-600 hover:bg-primary-500 text-white rounded-xl font-semibold text-sm transition-colors"
                >
                  Got it
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Login;

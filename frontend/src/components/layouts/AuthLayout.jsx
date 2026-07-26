import { motion } from 'framer-motion';
import logo from '../../assets/images/svr logo.jpg';
import { TrendingUp, Package, Users, ShieldCheck } from 'lucide-react';
import { SYSTEM_SUBTITLE, useCompanyStore } from '../../context/companyStore';

const stats = [
  { value: '500+', label: 'Purchases tracked' },
  { value: '98%', label: 'Payment accuracy' },
  { value: '3x', label: 'Faster reporting' },
  { value: '0', label: 'Data loss incidents' },
];

const features = [
  { icon: Package, text: 'Raw purchase to finished goods — complete traceability' },
  { icon: Users,   text: 'Worker management, job work & daily wages in one place' },
  { icon: TrendingUp, text: 'Real-time profit dashboard & owner summary' },
  { icon: ShieldCheck, text: 'Secure, role-based access with daily backups' },
];

const AuthLayout = ({ children }) => {
  const companyName = useCompanyStore((state) => state.companyInfo.companyName);

  return (
    <div className="min-h-screen flex bg-gray-950">
      {/* ── Left panel ── */}
      <div className="hidden lg:flex lg:w-[52%] relative overflow-hidden flex-col">
        {/* Background layers */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-primary-950 to-gray-900" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-primary-600/20 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-accent-600/15 via-transparent to-transparent" />

        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)', backgroundSize: '40px 40px' }}
        />

        {/* Glow orbs */}
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.15, 0.25, 0.15] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-primary-500/20 blur-[80px]"
        />
        <motion.div
          animate={{ scale: [1.1, 1, 1.1], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute bottom-[-15%] right-[-10%] w-[450px] h-[450px] rounded-full bg-accent-500/15 blur-[80px]"
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between h-full p-12">
          {/* Logo + Brand */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center gap-3"
          >
            <img src={logo} alt="SVR" className="w-10 h-10 rounded-xl ring-2 ring-white/10" />
            <div>
              <p className="text-white font-bold text-base leading-tight">{companyName}</p>
              <p className="text-gray-500 text-xs">{SYSTEM_SUBTITLE}</p>
            </div>
          </motion.div>

          {/* Hero copy */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="space-y-6"
          >
            <div>
              <span className="inline-block px-3 py-1 text-xs font-semibold bg-primary-500/20 text-primary-300 rounded-full border border-primary-500/30 mb-4">
                Cashew Industry ERP
              </span>
              <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight">
                Run your cashew<br />
                business <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-accent-400">smarter</span>
              </h1>
              <p className="text-gray-400 text-base mt-4 max-w-sm leading-relaxed">
                From raw purchase to final sale — track every kilogram, every rupee, every worker in real time.
              </p>
            </div>

            {/* Feature list */}
            <div className="space-y-3">
              {features.map(({ icon: Icon, text }, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <div className="w-7 h-7 rounded-lg bg-primary-500/15 border border-primary-500/20 flex items-center justify-center flex-shrink-0">
                    <Icon size={14} className="text-primary-400" />
                  </div>
                  <span className="text-gray-400 text-sm">{text}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Stats row */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="grid grid-cols-4 gap-4 pt-8 border-t border-white/10"
          >
            {stats.map(({ value, label }) => (
              <div key={label}>
                <p className="text-xl font-bold text-white">{value}</p>
                <p className="text-xs text-gray-500 mt-0.5 leading-tight">{label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-gray-950 relative">
        {/* Subtle radial bg */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary-900/20 via-transparent to-transparent pointer-events-none" />

        {/* Mobile logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="lg:hidden flex items-center gap-2 mb-8"
        >
          <img src={logo} alt="SVR" className="w-9 h-9 rounded-xl ring-2 ring-primary-500/40" />
          <span className="text-white font-bold">{companyName}</span>
        </motion.div>

        {/* Form card */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="relative w-full max-w-[400px]"
        >
          {/* Card glow */}
          <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-primary-500/20 to-accent-500/10 blur-sm" />
          <div className="relative bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-2xl">
            {children}
          </div>
        </motion.div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-8 text-gray-700 text-xs"
        >
          © {new Date().getFullYear()} {companyName}. All rights reserved.
        </motion.p>
      </div>
    </div>
  );
};

export default AuthLayout;

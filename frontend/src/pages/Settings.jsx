import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Building2,
  User,
  Bell,
  CreditCard,
  Save,
  Building,
  Phone,
  Mail,
  MapPin,
  FileText,
  Banknote,
  Lock,
  Shield,
  Eye,
  EyeOff,
  Layers,
} from 'lucide-react';
import toast from 'react-hot-toast';
import settingsService from '../services/settingsService';
import { authService } from '../services/authService';
import { useCompanyStore } from '../context/companyStore';
import { useModuleSettingsStore } from '../context/moduleSettingsStore';
import { menuSections } from '../config/menuSections';
import LoadingSpinner from '../components/ui/LoadingSpinner';

// Flattened, toggleable modules — mirrors the sidebar, skipping the always-on Dashboard.
const TOGGLEABLE_MODULES = menuSections.slice(1).map((section) => ({
  title: section.title,
  items: section.items.flatMap((item) =>
    item.submenu
      ? item.submenu.map((sub) => ({ path: sub.path, label: `${item.label} — ${sub.label}` }))
      : [{ path: item.path, label: item.label }]
  ),
}));

const DEFAULTS = {
  company_info: {
    companyName: '',
    ownerName: '',
    businessType: '',
    gstNumber: '',
    panNumber: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    phone: '',
    email: '',
    website: '',
  },
  payment_config: {
    defaultPaymentMode: 'Cash',
    phonePeNumber: '',
    phonePeName: '',
    primaryBankName: '',
    primaryAccountNumber: '',
    primaryIfscCode: '',
    secondaryBankName: '',
    secondaryAccountNumber: '',
    secondaryIfscCode: '',
  },
  user_preferences: {
    currency: 'INR',
    dateFormat: 'DD/MM/YYYY',
    language: 'English',
    timezone: 'Asia/Kolkata',
  },
  notification_settings: {
    lowStockAlerts: true,
    paymentReminders: true,
    expiryAlerts: true,
    emailNotifications: false,
    smsNotifications: false,
  },
  module_settings: {
    disabledPaths: [],
  },
};

const Settings = () => {
  const [activeTab, setActiveTab] = useState('company');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [companyInfo, setCompanyInfo] = useState(DEFAULTS.company_info);
  const [paymentConfig, setPaymentConfig] = useState(DEFAULTS.payment_config);
  const [userPrefs, setUserPrefs] = useState(DEFAULTS.user_preferences);
  const [notifications, setNotifications] = useState(DEFAULTS.notification_settings);
  const [disabledPaths, setDisabledPaths] = useState(DEFAULTS.module_settings.disabledPaths);
  const { setCompanyInfo: setStoredCompanyInfo } = useCompanyStore();
  const { setDisabledPaths: setStoredDisabledPaths } = useModuleSettingsStore();

  const [passwordData, setPasswordData] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [changingPassword, setChangingPassword] = useState(false);
  const [showOldPw, setShowOldPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await settingsService.get();
      if (data.company_info) {
        const nextCompanyInfo = { ...DEFAULTS.company_info, ...data.company_info };
        setCompanyInfo(nextCompanyInfo);
        setStoredCompanyInfo(nextCompanyInfo);
      }
      if (data.payment_config) setPaymentConfig({ ...DEFAULTS.payment_config, ...data.payment_config });
      if (data.user_preferences) setUserPrefs({ ...DEFAULTS.user_preferences, ...data.user_preferences });
      if (data.notification_settings) setNotifications({ ...DEFAULTS.notification_settings, ...data.notification_settings });
      if (data.module_settings) setDisabledPaths(data.module_settings.disabledPaths || []);
    } catch (error) {
      if (import.meta.env.DEV) console.error('Failed to load settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e, section, data) => {
    e.preventDefault();
    setSaving(true);
    try {
      await settingsService.save(section, data);
      if (section === 'company_info') setStoredCompanyInfo(data);
      if (section === 'module_settings') setStoredDisabledPaths(data.disabledPaths);
      toast.success('Settings saved successfully');
    } catch (error) {
      if (import.meta.env.DEV) console.error('Failed to save settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const validatePassword = () => {
    const errs = {};
    if (!passwordData.oldPassword) errs.oldPassword = 'Current password is required';
    if (!passwordData.newPassword) errs.newPassword = 'New password is required';
    else if (passwordData.newPassword.length < 6) errs.newPassword = 'Must be at least 6 characters';
    if (!passwordData.confirmPassword) errs.confirmPassword = 'Please confirm your new password';
    else if (passwordData.newPassword !== passwordData.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    setPasswordErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!validatePassword()) return;
    setChangingPassword(true);
    try {
      await authService.changePassword({ oldPassword: passwordData.oldPassword, newPassword: passwordData.newPassword });
      toast.success('Password changed successfully');
      setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
      setPasswordErrors({});
    } catch (error) {
      if (import.meta.env.DEV) console.error('Password change error:', error);
      toast.error(error?.message || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  const toggleModule = (path) => {
    setDisabledPaths((prev) =>
      prev.includes(path) ? prev.filter((p) => p !== path) : [...prev, path]
    );
  };

  const tabs = [
    { id: 'company', label: 'Company Info', icon: Building2 },
    { id: 'payment', label: 'Payment Config', icon: CreditCard },
    { id: 'preferences', label: 'Preferences', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'modules', label: 'Modules', icon: Layers },
    { id: 'security', label: 'Security', icon: Shield },
  ];

  if (loading) {
    return (
      <div className="p-4 md:p-6">
        <LoadingSpinner fullPage text="Loading settings..." />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-600 mt-1">Manage your application settings and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Tabs */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all mb-1 ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-primary-600 to-secondary-600 text-white shadow-md'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon size={20} />
                  <span className="font-medium">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-2xl shadow-soft border border-gray-100 p-6"
          >
            {/* Company Information Tab */}
            {activeTab === 'company' && (
              <form onSubmit={(e) => handleSave(e, 'company_info', companyInfo)}>
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <Building2 className="text-primary-600" />
                  Company Information
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Company Name<span className="text-red-500 ml-1">*</span>
                    </label>
                    <div className="relative">
                      <Building className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        type="text"
                        value={companyInfo.companyName}
                        onChange={(e) => setCompanyInfo({ ...companyInfo, companyName: e.target.value })}
                        className="input pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Owner Name<span className="text-red-500 ml-1">*</span>
                    </label>
                    <input
                      type="text"
                      value={companyInfo.ownerName}
                      onChange={(e) => setCompanyInfo({ ...companyInfo, ownerName: e.target.value })}
                      className="input"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Business Type</label>
                    <input
                      type="text"
                      value={companyInfo.businessType}
                      onChange={(e) => setCompanyInfo({ ...companyInfo, businessType: e.target.value })}
                      className="input"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">GST Number</label>
                    <div className="relative">
                      <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        type="text"
                        value={companyInfo.gstNumber}
                        onChange={(e) => setCompanyInfo({ ...companyInfo, gstNumber: e.target.value })}
                        className="input pl-10"
                        placeholder="22AAAAA0000A1Z5"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">PAN Number</label>
                    <input
                      type="text"
                      value={companyInfo.panNumber}
                      onChange={(e) => setCompanyInfo({ ...companyInfo, panNumber: e.target.value })}
                      className="input"
                      placeholder="AAAAA0000A"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 text-gray-400" size={18} />
                      <textarea
                        value={companyInfo.address}
                        onChange={(e) => setCompanyInfo({ ...companyInfo, address: e.target.value })}
                        className="input pl-10 resize-none"
                        rows="3"
                        placeholder="Street address"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                    <input
                      type="text"
                      value={companyInfo.city}
                      onChange={(e) => setCompanyInfo({ ...companyInfo, city: e.target.value })}
                      className="input"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                    <input
                      type="text"
                      value={companyInfo.state}
                      onChange={(e) => setCompanyInfo({ ...companyInfo, state: e.target.value })}
                      className="input"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Pincode</label>
                    <input
                      type="text"
                      value={companyInfo.pincode}
                      onChange={(e) => setCompanyInfo({ ...companyInfo, pincode: e.target.value })}
                      className="input"
                      maxLength="6"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        type="tel"
                        value={companyInfo.phone}
                        onChange={(e) => setCompanyInfo({ ...companyInfo, phone: e.target.value })}
                        className="input pl-10"
                        placeholder="+91 "
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        type="email"
                        value={companyInfo.email}
                        onChange={(e) => setCompanyInfo({ ...companyInfo, email: e.target.value })}
                        className="input pl-10"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
                    <input
                      type="url"
                      value={companyInfo.website}
                      onChange={(e) => setCompanyInfo({ ...companyInfo, website: e.target.value })}
                      className="input"
                      placeholder="https://"
                    />
                  </div>
                </div>

                <div className="flex justify-end mt-6">
                  <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
                    <Save size={18} />
                    {saving ? 'Saving...' : 'Save Company Info'}
                  </button>
                </div>
              </form>
            )}

            {/* Payment Configuration Tab */}
            {activeTab === 'payment' && (
              <form onSubmit={(e) => handleSave(e, 'payment_config', paymentConfig)}>
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <CreditCard className="text-primary-600" />
                  Payment Configuration
                </h2>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Default Payment Mode</label>
                    <select
                      value={paymentConfig.defaultPaymentMode}
                      onChange={(e) => setPaymentConfig({ ...paymentConfig, defaultPaymentMode: e.target.value })}
                      className="input"
                    >
                      <option value="Cash">Cash</option>
                      <option value="PhonePe">PhonePe</option>
                      <option value="Bank">Bank Transfer</option>
                    </select>
                  </div>

                  <div className="border-t pt-4">
                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Banknote size={18} className="text-primary-600" />
                      PhonePe Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">PhonePe Number</label>
                        <input
                          type="tel"
                          value={paymentConfig.phonePeNumber}
                          onChange={(e) => setPaymentConfig({ ...paymentConfig, phonePeNumber: e.target.value })}
                          className="input"
                          placeholder="+91 "
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">PhonePe Name</label>
                        <input
                          type="text"
                          value={paymentConfig.phonePeName}
                          onChange={(e) => setPaymentConfig({ ...paymentConfig, phonePeName: e.target.value })}
                          className="input"
                          placeholder="Account holder name"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Building size={18} className="text-primary-600" />
                      Primary Bank Account
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Bank Name</label>
                        <input
                          type="text"
                          value={paymentConfig.primaryBankName}
                          onChange={(e) => setPaymentConfig({ ...paymentConfig, primaryBankName: e.target.value })}
                          className="input"
                          placeholder="e.g., State Bank of India"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Account Number</label>
                        <input
                          type="text"
                          value={paymentConfig.primaryAccountNumber}
                          onChange={(e) => setPaymentConfig({ ...paymentConfig, primaryAccountNumber: e.target.value })}
                          className="input"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">IFSC Code</label>
                        <input
                          type="text"
                          value={paymentConfig.primaryIfscCode}
                          onChange={(e) => setPaymentConfig({ ...paymentConfig, primaryIfscCode: e.target.value })}
                          className="input"
                          placeholder="e.g., SBIN0001234"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Building size={18} className="text-gray-600" />
                      Secondary Bank Account (Optional)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Bank Name</label>
                        <input
                          type="text"
                          value={paymentConfig.secondaryBankName}
                          onChange={(e) => setPaymentConfig({ ...paymentConfig, secondaryBankName: e.target.value })}
                          className="input"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Account Number</label>
                        <input
                          type="text"
                          value={paymentConfig.secondaryAccountNumber}
                          onChange={(e) => setPaymentConfig({ ...paymentConfig, secondaryAccountNumber: e.target.value })}
                          className="input"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">IFSC Code</label>
                        <input
                          type="text"
                          value={paymentConfig.secondaryIfscCode}
                          onChange={(e) => setPaymentConfig({ ...paymentConfig, secondaryIfscCode: e.target.value })}
                          className="input"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end mt-6">
                  <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
                    <Save size={18} />
                    {saving ? 'Saving...' : 'Save Payment Config'}
                  </button>
                </div>
              </form>
            )}

            {/* User Preferences Tab */}
            {activeTab === 'preferences' && (
              <form onSubmit={(e) => handleSave(e, 'user_preferences', userPrefs)}>
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <User className="text-primary-600" />
                  User Preferences
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
                    <select
                      value={userPrefs.currency}
                      onChange={(e) => setUserPrefs({ ...userPrefs, currency: e.target.value })}
                      className="input"
                    >
                      <option value="INR">INR (₹)</option>
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date Format</label>
                    <select
                      value={userPrefs.dateFormat}
                      onChange={(e) => setUserPrefs({ ...userPrefs, dateFormat: e.target.value })}
                      className="input"
                    >
                      <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
                    <select
                      value={userPrefs.language}
                      onChange={(e) => setUserPrefs({ ...userPrefs, language: e.target.value })}
                      className="input"
                    >
                      <option value="English">English</option>
                      <option value="Hindi">Hindi</option>
                      <option value="Telugu">Telugu</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
                    <select
                      value={userPrefs.timezone}
                      onChange={(e) => setUserPrefs({ ...userPrefs, timezone: e.target.value })}
                      className="input"
                    >
                      <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                      <option value="America/New_York">America/New_York (EST)</option>
                      <option value="Europe/London">Europe/London (GMT)</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end mt-6">
                  <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
                    <Save size={18} />
                    {saving ? 'Saving...' : 'Save Preferences'}
                  </button>
                </div>
              </form>
            )}

            {/* Security Tab */}
            {/* Modules Tab */}
            {activeTab === 'modules' && (
              <form onSubmit={(e) => handleSave(e, 'module_settings', { disabledPaths })}>
                <h2 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <Layers className="text-primary-600" />
                  Modules
                </h2>
                <p className="text-sm text-gray-600 mb-6">
                  Turn off modules you do not use to declutter the sidebar. You can turn them back on any time — no data is deleted.
                </p>

                <div className="space-y-6">
                  {TOGGLEABLE_MODULES.map((group) => (
                    <div key={group.title}>
                      <h3 className="font-semibold text-gray-900 mb-2">{group.title}</h3>
                      <div className="space-y-2">
                        {group.items.map((item) => (
                          <label
                            key={item.path}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors"
                          >
                            <span className="font-medium text-gray-900 text-sm">{item.label}</span>
                            <input
                              type="checkbox"
                              checked={!disabledPaths.includes(item.path)}
                              onChange={() => toggleModule(item.path)}
                              className="w-5 h-5 text-primary-600 rounded focus:ring-2 focus:ring-primary-500/30"
                            />
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end mt-6">
                  <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
                    <Save size={18} />
                    {saving ? 'Saving...' : 'Save Module Settings'}
                  </button>
                </div>
              </form>
            )}

            {activeTab === 'security' && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <Shield className="text-primary-600" />
                  Security Settings
                </h2>

                <form onSubmit={handleChangePassword} noValidate>
                  <div className="bg-gray-50 rounded-xl p-5 mb-4">
                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Lock size={18} className="text-primary-600" />
                      Change Password
                    </h3>
                    <div className="space-y-4">
                      {/* Current Password */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                        <div className="relative">
                          <input
                            type={showOldPw ? 'text' : 'password'}
                            value={passwordData.oldPassword}
                            onChange={(e) => { setPasswordData({ ...passwordData, oldPassword: e.target.value }); setPasswordErrors({ ...passwordErrors, oldPassword: '' }); }}
                            className={`input pr-10 ${passwordErrors.oldPassword ? 'border-red-400 bg-red-50' : ''}`}
                            placeholder="Enter current password"
                            autoComplete="current-password"
                          />
                          <button type="button" onClick={() => setShowOldPw(!showOldPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                            {showOldPw ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                        {passwordErrors.oldPassword && <p className="text-xs text-red-500 mt-1">{passwordErrors.oldPassword}</p>}
                      </div>

                      {/* New Password */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                        <div className="relative">
                          <input
                            type={showNewPw ? 'text' : 'password'}
                            value={passwordData.newPassword}
                            onChange={(e) => { setPasswordData({ ...passwordData, newPassword: e.target.value }); setPasswordErrors({ ...passwordErrors, newPassword: '' }); }}
                            className={`input pr-10 ${passwordErrors.newPassword ? 'border-red-400 bg-red-50' : ''}`}
                            placeholder="At least 6 characters"
                            autoComplete="new-password"
                          />
                          <button type="button" onClick={() => setShowNewPw(!showNewPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                            {showNewPw ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                        {passwordErrors.newPassword && <p className="text-xs text-red-500 mt-1">{passwordErrors.newPassword}</p>}
                        {passwordData.newPassword && passwordData.newPassword.length >= 6 && (
                          <p className="text-xs text-green-600 mt-1">Password strength: Good</p>
                        )}
                      </div>

                      {/* Confirm Password */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                        <div className="relative">
                          <input
                            type={showConfirmPw ? 'text' : 'password'}
                            value={passwordData.confirmPassword}
                            onChange={(e) => { setPasswordData({ ...passwordData, confirmPassword: e.target.value }); setPasswordErrors({ ...passwordErrors, confirmPassword: '' }); }}
                            className={`input pr-10 ${passwordErrors.confirmPassword ? 'border-red-400 bg-red-50' : ''}`}
                            placeholder="Re-enter new password"
                            autoComplete="new-password"
                          />
                          <button type="button" onClick={() => setShowConfirmPw(!showConfirmPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                            {showConfirmPw ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                        {passwordErrors.confirmPassword && <p className="text-xs text-red-500 mt-1">{passwordErrors.confirmPassword}</p>}
                      </div>
                    </div>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
                    <p className="text-sm text-amber-800 font-medium">Password Tips</p>
                    <ul className="text-xs text-amber-700 mt-1 space-y-0.5">
                      <li>• Use at least 6 characters</li>
                      <li>• Mix letters, numbers and symbols for a stronger password</li>
                      <li>• Do not share your password with anyone</li>
                    </ul>
                  </div>

                  <div className="flex justify-end">
                    <button type="submit" disabled={changingPassword} className="btn-primary flex items-center gap-2">
                      <Lock size={18} />
                      {changingPassword ? 'Changing...' : 'Change Password'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <form onSubmit={(e) => handleSave(e, 'notification_settings', notifications)}>
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <Bell className="text-primary-600" />
                  Notification Settings
                </h2>

                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900">Alert Notifications</h3>

                  {[
                    { key: 'lowStockAlerts', label: 'Low Stock Alerts', desc: 'Get notified when stock levels are low' },
                    { key: 'paymentReminders', label: 'Payment Reminders', desc: 'Reminders for pending payments' },
                    { key: 'expiryAlerts', label: 'Expiry Alerts', desc: 'Alerts for product expiry dates' },
                  ].map(({ key, label, desc }) => (
                    <label key={key} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                      <div>
                        <p className="font-medium text-gray-900">{label}</p>
                        <p className="text-sm text-gray-600">{desc}</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={notifications[key]}
                        onChange={(e) => setNotifications({ ...notifications, [key]: e.target.checked })}
                        className="w-5 h-5 text-primary-600 rounded focus:ring-2 focus:ring-primary-500/30"
                      />
                    </label>
                  ))}

                  <h3 className="font-semibold text-gray-900 pt-4">Communication Channels</h3>

                  {[
                    { key: 'emailNotifications', label: 'Email Notifications', desc: 'Receive alerts via email' },
                    { key: 'smsNotifications', label: 'SMS Notifications', desc: 'Receive alerts via SMS' },
                  ].map(({ key, label, desc }) => (
                    <label key={key} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                      <div>
                        <p className="font-medium text-gray-900">{label}</p>
                        <p className="text-sm text-gray-600">{desc}</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={notifications[key]}
                        onChange={(e) => setNotifications({ ...notifications, [key]: e.target.checked })}
                        className="w-5 h-5 text-primary-600 rounded focus:ring-2 focus:ring-primary-500/30"
                      />
                    </label>
                  ))}
                </div>

                <div className="flex justify-end mt-6">
                  <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
                    <Save size={18} />
                    {saving ? 'Saving...' : 'Save Notification Settings'}
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Settings;

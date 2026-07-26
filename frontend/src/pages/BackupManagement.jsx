import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Database,
  Download,
  Upload,
  Trash2,
  Clock,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  HardDrive,
  Calendar,
  FileArchive,
  Save,
  RotateCcw,
  Shield
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../context/authStore';
import { rawPurchaseService } from '../services/rawPurchaseService';
import { jobWorkService } from '../services/jobWorkService';
import { salesOrderService } from '../services/salesOrderService';
import { expenseService } from '../services/expenseService';
import { customerService } from '../services/customerService';
import { supplierService } from '../services/supplierService';
import { workerService } from '../services/workerService';
import { dailyWorkService } from '../services/dailyWorkService';

const STORAGE_KEY = 'svr_backup_history';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

const BackupManagement = () => {
  const fileInputRef = useRef(null);
  const { token } = useAuthStore();
  const [backups, setBackups] = useState([]);
  const [sqlDownloading, setSqlDownloading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [importing, setImporting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [importStatus, setImportStatus] = useState('');
  const [inputKey, setInputKey] = useState(Date.now());

  const [backupSettings, setBackupSettings] = useState({
    autoBackup: false,
    backupFrequency: 'DAILY',
    retentionDays: 30,
    backupTime: '02:00'
  });

  const [stats, setStats] = useState({
    totalBackups: 0,
    totalSize: 0,
    lastBackupDate: null,
    oldestBackupDate: null,
    autoBackupEnabled: false
  });

  useEffect(() => {
    loadBackups();
    loadBackupSettings();
  }, []);

  const loadBackups = () => {
    setLoading(true);
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const list = stored ? JSON.parse(stored) : [];
      setBackups(list);
      calculateStats(list);
    } catch {
      setBackups([]);
    } finally {
      setLoading(false);
    }
  };

  const saveBackupHistory = (list) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  };

  const loadBackupSettings = () => {
    const saved = localStorage.getItem('backupSettings');
    if (saved) setBackupSettings(JSON.parse(saved));
  };

  const calculateStats = (backupList) => {
    const totalSize = backupList.reduce((sum, b) => sum + (b.size || 0), 0);
    const sorted = [...backupList].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    setStats({
      totalBackups: backupList.length,
      totalSize,
      lastBackupDate: sorted[0]?.createdAt || null,
      oldestBackupDate: sorted[sorted.length - 1]?.createdAt || null,
      autoBackupEnabled: backupSettings.autoBackup
    });
  };

  // Fetch all data and return as backup object
  const fetchAllData = async () => {
    const [rawPurchases, jobWorks, salesOrders, expenses, customers, suppliers, workers, dailyWorks] =
      await Promise.allSettled([
        rawPurchaseService.getAll(),
        jobWorkService.getAll(),
        salesOrderService.getAll(),
        expenseService.getAll(),
        customerService.getAll(),
        supplierService.getAll(),
        workerService.getAll(),
        dailyWorkService.getAll(),
      ]);

    const extract = (result) => (result.status === 'fulfilled' ? result.value || [] : []);

    return {
      rawPurchases: extract(rawPurchases),
      jobWorks: extract(jobWorks),
      salesOrders: extract(salesOrders),
      expenses: extract(expenses),
      customers: extract(customers),
      suppliers: extract(suppliers),
      workers: extract(workers),
      dailyWorks: extract(dailyWorks),
    };
  };

  // Trigger browser file download
  const triggerDownload = (content, fileName) => {
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCreateBackup = async () => {
    setCreating(true);
    try {
      toast('Fetching data from all modules...', { icon: '📦' });
      const data = await fetchAllData();

      const now = new Date();
      const timestamp = now.toISOString().replace(/[-:T]/g, '_').split('.')[0];
      const fileName = `svr_cashew_backup_${timestamp}.json`;

      const totalRecords = Object.values(data).reduce((sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0), 0);

      const backupPayload = {
        exportedAt: now.toISOString(),
        version: '1.0',
        totalRecords,
        modules: ['Raw Purchase', 'Job Work', 'Sales', 'Expenses', 'Customers', 'Suppliers', 'Workers', 'Daily Work'],
        data,
      };

      const jsonContent = JSON.stringify(backupPayload, null, 2);
      const sizeBytes = new Blob([jsonContent]).size;

      // Download the file
      triggerDownload(jsonContent, fileName);

      // Save metadata to history (no content — already downloaded to disk)
      const entry = {
        id: `backup_${Date.now()}`,
        fileName,
        createdAt: now.toISOString(),
        size: sizeBytes,
        type: 'MANUAL',
        status: 'COMPLETED',
        modules: backupPayload.modules,
        recordCount: totalRecords,
      };

      const updated = [entry, ...backups];
      setBackups(updated);
      saveBackupHistory(updated);
      calculateStats(updated);

      toast.success(`Backup created & downloaded! ${totalRecords} records in ${formatFileSize(sizeBytes)}`);
    } catch (error) {
      toast.error('Failed to create backup: ' + (error.message || 'Unknown error'));
    } finally {
      setCreating(false);
    }
  };

  const handleDownloadBackup = (backup) => {
    // Backup file was already downloaded when created — show info to re-create
    toast('The backup file was downloaded when it was created. To get a fresh copy, click "Create Backup Now".', { icon: 'ℹ️', duration: 5000 });
  };

  const handleRestoreBackup = (backup) => {
    toast(
      `To restore "${backup.fileName}" (${new Date(backup.createdAt).toLocaleDateString('en-IN')}), import the .json file into the database using the SQL backup or contact your administrator.`,
      { icon: 'ℹ️', duration: 7000 }
    );
  };

  const handleDeleteBackup = (backupId) => {
    setDeleteConfirmId(backupId);
  };

  const confirmDelete = () => {
    const updated = backups.filter(b => b.id !== deleteConfirmId);
    setBackups(updated);
    saveBackupHistory(updated);
    calculateStats(updated);
    setDeleteConfirmId(null);
    toast.success('Backup deleted');
  };

  const handleImportBackupFile = async (file) => {
    if (!file) return;
    setImporting(true);
    setImportStatus('Reading file...');

    try {
      const text = await file.text();
      setImportStatus('Parsing JSON...');
      const parsed = JSON.parse(text);

      // Accept both single backup object and array
      const items = Array.isArray(parsed) ? parsed : [parsed];

      const importedEntries = items.map((item, idx) => ({
        id: item.id || `backup_import_${Date.now()}_${idx}`,
        fileName: item.fileName || file.name,
        createdAt: item.exportedAt || item.createdAt || new Date().toISOString(),
        size: new Blob([JSON.stringify(item)]).size,
        type: item.type || 'MANUAL',
        status: 'COMPLETED',
        modules: item.modules || ['Raw Purchase', 'Job Work', 'Sales', 'Expenses'],
        recordCount: item.totalRecords || item.recordCount || 0,
      }));

      const updated = [...importedEntries, ...backups];
      setBackups(updated);
      saveBackupHistory(updated);
      calculateStats(updated);

      toast.success(`Imported ${importedEntries.length} backup record(s)`);
    } catch (error) {
      toast.error(error.message || 'Failed to import backup file');
    } finally {
      setImporting(false);
      setImportStatus('');
      setInputKey(Date.now());
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleFileUploadChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.json')) {
      toast.error('Please select a valid .json backup file');
      e.target.value = '';
      return;
    }
    handleImportBackupFile(file);
  };

  const handleSQLBackup = async () => {
    setSqlDownloading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/backup/sql`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || `Server error ${response.status}`);
      }

      const blob = await response.blob();
      const contentDisposition = response.headers.get('Content-Disposition') || '';
      const match = contentDisposition.match(/filename="?([^"]+)"?/);
      const fileName = match ? match[1] : `svr_cashew_backup_${new Date().toISOString().replace(/[-:T]/g, '_').split('.')[0]}.sql`;

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`SQL backup downloaded: ${fileName}`);
    } catch (error) {
      toast.error('Failed to download SQL backup: ' + error.message);
    } finally {
      setSqlDownloading(false);
    }
  };

  const handleSaveSettings = () => {
    localStorage.setItem('backupSettings', JSON.stringify(backupSettings));
    toast.success('Backup settings saved');
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i];
  };

  const getStatusBadge = (status) => {
    const styles = {
      COMPLETED: 'bg-green-100 text-green-700 border-green-200',
      IN_PROGRESS: 'bg-blue-100 text-blue-700 border-blue-200',
      FAILED: 'bg-red-100 text-red-700 border-red-200'
    };
    const icons = { COMPLETED: CheckCircle, IN_PROGRESS: RefreshCw, FAILED: AlertCircle };
    const Icon = icons[status] || CheckCircle;
    return (
      <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${styles[status] || styles.COMPLETED}`}>
        <Icon className="w-3.5 h-3.5" />
        <span>{status}</span>
      </div>
    );
  };

  const getTypeBadge = (type) => (
    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
      type === 'AUTO'
        ? 'bg-purple-100 text-purple-700 border border-purple-200'
        : 'bg-blue-100 text-blue-700 border border-blue-200'
    }`}>
      {type}
    </span>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDeleteConfirmId(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm z-10">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Backup Record?</h3>
            <p className="text-sm text-gray-600 mb-4">This will remove the backup record. The downloaded file on your disk will not be affected.</p>
            <div className="flex gap-3">
              <button onClick={confirmDelete} className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-colors">Delete</button>
              <button onClick={() => setDeleteConfirmId(null)} className="flex-1 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-semibold transition-colors">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {(creating || false || importing) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl border border-white/80 backdrop-blur-xl">
            <div className="flex items-center gap-4">
              <RefreshCw className="w-7 h-7 text-primary-600 animate-spin" />
              <div>
                <p className="text-lg font-semibold text-gray-900">Please wait...</p>
                <p className="text-sm text-gray-600 mt-1">
                  {importing && importStatus ? importStatus : creating ? 'Fetching and packaging backup...' : 'Verifying backup...'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl shadow-soft">
            <Database className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Backup Management</h1>
            <p className="text-sm text-gray-600">Create, download, and manage data backups</p>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <FileArchive className="w-8 h-8 text-blue-600" />
            <span className="text-xs font-semibold text-blue-700 bg-blue-200 px-2 py-1 rounded-full">Total</span>
          </div>
          <p className="text-2xl font-bold text-blue-900">{stats.totalBackups}</p>
          <p className="text-xs text-blue-700 mt-1">Total Backups</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
          <div className="flex items-center justify-between mb-2">
            <HardDrive className="w-8 h-8 text-green-600" />
            <span className="text-xs font-semibold text-green-700 bg-green-200 px-2 py-1 rounded-full">Storage</span>
          </div>
          <p className="text-2xl font-bold text-green-900">{formatFileSize(stats.totalSize)}</p>
          <p className="text-xs text-green-700 mt-1">Total Size</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
          <div className="flex items-center justify-between mb-2">
            <Clock className="w-8 h-8 text-purple-600" />
            <span className="text-xs font-semibold text-purple-700 bg-purple-200 px-2 py-1 rounded-full">Recent</span>
          </div>
          <p className="text-lg font-bold text-purple-900">
            {stats.lastBackupDate ? new Date(stats.lastBackupDate).toLocaleDateString('en-IN') : 'N/A'}
          </p>
          <p className="text-xs text-purple-700 mt-1">Last Backup</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className={`bg-gradient-to-br rounded-xl p-4 border ${backupSettings.autoBackup ? 'from-green-50 to-green-100 border-green-200' : 'from-gray-50 to-gray-100 border-gray-200'}`}>
          <div className="flex items-center justify-between mb-2">
            <Shield className={`w-8 h-8 ${backupSettings.autoBackup ? 'text-green-600' : 'text-gray-600'}`} />
            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${backupSettings.autoBackup ? 'text-green-700 bg-green-200' : 'text-gray-700 bg-gray-200'}`}>
              {backupSettings.autoBackup ? 'Enabled' : 'Disabled'}
            </span>
          </div>
          <p className={`text-2xl font-bold ${backupSettings.autoBackup ? 'text-green-900' : 'text-gray-900'}`}>Auto Backup</p>
          <p className={`text-xs mt-1 ${backupSettings.autoBackup ? 'text-green-700' : 'text-gray-700'}`}>
            {backupSettings.autoBackup ? backupSettings.backupFrequency : 'Not Active'}
          </p>
        </motion.div>
      </div>

      {/* Action Buttons */}
      <div className="bg-white rounded-xl shadow-soft border border-gray-200 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-3">
          <button
            onClick={handleCreateBackup}
            disabled={creating || false}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {creating ? <><RefreshCw className="w-5 h-5 animate-spin" /><span>Creating Backup...</span></> : <><Save className="w-5 h-5" /><span>Create Backup Now</span></>}
          </button>

          <button
            onClick={handleSQLBackup}
            disabled={sqlDownloading || creating || false}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl hover:from-orange-600 hover:to-red-600 font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            title="Download full database as .sql file (importable in phpMyAdmin)"
          >
            {sqlDownloading ? (
              <><RefreshCw className="w-5 h-5 animate-spin" /><span>Downloading SQL...</span></>
            ) : (
              <><Database className="w-5 h-5" /><span>Download SQL Backup</span></>
            )}
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={false || creating || importing}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Upload className="w-5 h-5" />
            <span>Import Backup</span>
          </button>
          <input
            key={inputKey}
            ref={fileInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleFileUploadChange}
          />

          <button
            onClick={loadBackups}
            disabled={loading || creating || false}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Backup Settings */}
      <div className="bg-white rounded-xl shadow-soft border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary-600" />
          Automatic Backup Settings
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Enable Auto Backup</label>
            <button
              onClick={() => setBackupSettings({ ...backupSettings, autoBackup: !backupSettings.autoBackup })}
              className={`w-full px-4 py-2 rounded-xl font-semibold transition-all ${backupSettings.autoBackup ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            >
              {backupSettings.autoBackup ? 'Enabled' : 'Disabled'}
            </button>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Backup Frequency</label>
            <select
              value={backupSettings.backupFrequency}
              onChange={(e) => setBackupSettings({ ...backupSettings, backupFrequency: e.target.value })}
              disabled={!backupSettings.autoBackup}
              className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 transition-all disabled:opacity-50"
            >
              <option value="DAILY">Daily</option>
              <option value="WEEKLY">Weekly</option>
              <option value="MONTHLY">Monthly</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Backup Time</label>
            <input
              type="time"
              value={backupSettings.backupTime}
              onChange={(e) => setBackupSettings({ ...backupSettings, backupTime: e.target.value })}
              disabled={!backupSettings.autoBackup}
              className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 transition-all disabled:opacity-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Retention (Days)</label>
            <input
              type="number"
              value={backupSettings.retentionDays}
              onChange={(e) => setBackupSettings({ ...backupSettings, retentionDays: parseInt(e.target.value) })}
              disabled={!backupSettings.autoBackup}
              min="1" max="365"
              className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 transition-all disabled:opacity-50"
            />
          </div>
        </div>
        <div className="mt-4">
          <button
            onClick={handleSaveSettings}
            className="px-6 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 font-semibold transition-all"
          >
            Save Settings
          </button>
        </div>
      </div>

      {/* Backups List */}
      <div className="bg-white rounded-xl shadow-soft border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-bold text-gray-900">Backup History</h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : backups.length === 0 ? (
          <div className="text-center py-12">
            <Database className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">No backups yet.</p>
            <p className="text-sm text-gray-400">Click "Create Backup Now" to export all data to a JSON file.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-primary-50 to-secondary-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">File Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Created</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Type</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Size</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Records</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {backups.map((backup, index) => (
                  <motion.tr
                    key={backup.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.04 }}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3 text-sm">
                      <div className="font-medium text-gray-900">{backup.fileName}</div>
                      <div className="text-xs text-gray-500">{(backup.modules || []).join(', ')}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <div>
                          <div>{new Date(backup.createdAt).toLocaleDateString('en-IN')}</div>
                          <div className="text-xs text-gray-500">{new Date(backup.createdAt).toLocaleTimeString('en-IN')}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">{getTypeBadge(backup.type)}</td>
                    <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">{formatFileSize(backup.size)}</td>
                    <td className="px-4 py-3 text-sm text-center">
                      <span className="inline-flex items-center px-2.5 py-1 bg-gray-100 rounded-full text-gray-700 font-semibold">
                        {(backup.recordCount || 0).toLocaleString()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">{getStatusBadge(backup.status)}</td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleDownloadBackup(backup)}
                          className="p-2 hover:bg-blue-100 rounded-lg transition-colors group"
                          title="Download Backup"
                        >
                          <Download className="w-4 h-4 text-gray-500 group-hover:text-blue-600" />
                        </button>
                        <button
                          onClick={() => handleRestoreBackup(backup)}
                          disabled={false}
                          className="p-2 hover:bg-green-100 rounded-lg transition-colors group disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Restore Backup"
                        >
                          <RotateCcw className="w-4 h-4 text-gray-500 group-hover:text-green-600" />
                        </button>
                        <button
                          onClick={() => handleDeleteBackup(backup.id)}
                          className="p-2 hover:bg-red-100 rounded-lg transition-colors group"
                          title="Delete Backup"
                        >
                          <Trash2 className="w-4 h-4 text-gray-500 group-hover:text-red-600" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};

export default BackupManagement;

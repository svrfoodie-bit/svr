import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Mail,
  Calendar,
  FileDown,
  Clock,
  CheckCircle,
  XCircle,
  Settings,
  Plus,
  Edit2,
  Trash2,
  Send,
  Download,
  Eye,
  Filter,
  RefreshCw,
  FileText,
  Database,
  Table,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { exportToExcel, exportToPDF } from '../utils/exportUtils';
import { exportService } from '../services/exportService';

const ExportManagement = () => {
  // Tab state
  const [activeTab, setActiveTab] = useState('email');

  // Email Export State
  const [emailForm, setEmailForm] = useState({
    module: 'SALES',
    format: 'EXCEL',
    recipients: '',
    subject: '',
    message: '',
    includeCharts: false
  });
  const [sendingEmail, setSendingEmail] = useState(false);

  // Scheduled Reports State
  const [schedules, setSchedules] = useState([]);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [scheduleForm, setScheduleForm] = useState({
    name: '',
    module: 'SALES',
    frequency: 'DAILY',
    time: '09:00',
    format: 'EXCEL',
    recipients: '',
    templateId: '',
    status: 'ACTIVE'
  });
  const [loadingSchedules, setLoadingSchedules] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null); // { type: 'schedule'|'template', id }

  // Export Templates State
  const [templates, setTemplates] = useState([]);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templateForm, setTemplateForm] = useState({
    name: '',
    module: 'SALES',
    columns: 'Order Number,Customer,Date,Amount,Status',
    isDefault: false
  });
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  // Export History State
  const [exportHistory, setExportHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyFilter, setHistoryFilter] = useState('ALL');

  useEffect(() => {
    const loadAll = async () => {
      await Promise.all([loadSchedules(), loadTemplates(), loadHistory()]);
    };
    loadAll();
  }, []);

  const loadSchedules = async () => {
    setLoadingSchedules(true);
    try {
      const data = await exportService.getSchedules();
      setSchedules(data || []);
    } catch (error) {
      toast.error(error.message || 'Failed to load schedules');
    } finally {
      setLoadingSchedules(false);
    }
  };

  const loadTemplates = async () => {
    setLoadingTemplates(true);
    try {
      const data = await exportService.getTemplates();
      setTemplates(data || []);
    } catch (error) {
      toast.error(error.message || 'Failed to load templates');
    } finally {
      setLoadingTemplates(false);
    }
  };

  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const data = await exportService.getHistory({ limit: 100 });
      setExportHistory(data || []);
    } catch (error) {
      toast.error(error.message || 'Failed to load export history');
    } finally {
      setLoadingHistory(false);
    }
  };

  const resetScheduleForm = () => {
    setScheduleForm({
      name: '',
      module: 'SALES',
      frequency: 'DAILY',
      time: '09:00',
      format: 'EXCEL',
      recipients: '',
      templateId: '',
      status: 'ACTIVE'
    });
  };

  const resetTemplateForm = () => {
    setTemplateForm({
      name: '',
      module: 'SALES',
      columns: 'Order Number,Customer,Date,Amount,Status',
      isDefault: false
    });
  };

  const handleEmailExport = async () => {
    if (!emailForm.recipients || !emailForm.subject) {
      toast.error('Please fill in all required fields');
      return;
    }

    const emails = emailForm.recipients.split(',').map(e => e.trim()).filter(Boolean);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalid = emails.filter(e => !emailRegex.test(e));
    if (invalid.length > 0) {
      toast.error(`Invalid email address${invalid.length > 1 ? 'es' : ''}: ${invalid.join(', ')}`);
      return;
    }

    setSendingEmail(true);
    try {
      await exportService.sendEmailExport(emailForm);
      toast.success(`Report sent successfully to ${emailForm.recipients}`);
      setEmailForm({
        module: 'SALES',
        format: 'EXCEL',
        recipients: '',
        subject: '',
        message: '',
        includeCharts: false
      });
      await loadHistory();
    } catch (error) {
      toast.error(error.message || 'Failed to send email report');
    } finally {
      setSendingEmail(false);
    }
  };

  const handleSaveSchedule = async (scheduleData) => {
    if (scheduleData.recipients) {
      const emails = scheduleData.recipients.split(',').map(e => e.trim()).filter(Boolean);
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const invalid = emails.filter(e => !emailRegex.test(e));
      if (invalid.length > 0) {
        toast.error(`Invalid email address${invalid.length > 1 ? 'es' : ''}: ${invalid.join(', ')}`);
        return;
      }
    }
    try {
      if (editingSchedule) {
        await exportService.updateSchedule(editingSchedule.id, scheduleData);
        toast.success('Schedule updated successfully');
      } else {
        await exportService.createSchedule(scheduleData);
        toast.success('Schedule created successfully');
      }
      setShowScheduleModal(false);
      setEditingSchedule(null);
      resetScheduleForm();
      await loadSchedules();
    } catch (error) {
      toast.error(error.message || 'Failed to save schedule');
    }
  };

  const handleDeleteSchedule = (id) => {
    setConfirmDelete({ type: 'schedule', id });
  };

  const handleToggleSchedule = async (id) => {
    try {
      await exportService.toggleScheduleStatus(id);
      await loadSchedules();
    } catch (error) {
      toast.error(error.message || 'Failed to update schedule');
    }
  };

  const handleDeleteTemplate = (id) => {
    setConfirmDelete({ type: 'template', id });
  };

  const executeConfirmedDelete = async () => {
    if (!confirmDelete) return;
    try {
      if (confirmDelete.type === 'schedule') {
        await exportService.deleteSchedule(confirmDelete.id);
        toast.success('Schedule deleted successfully');
        await loadSchedules();
      } else {
        await exportService.deleteTemplate(confirmDelete.id);
        toast.success('Template deleted successfully');
        await loadTemplates();
      }
    } catch (error) {
      toast.error(error.message || 'Failed to delete');
    } finally {
      setConfirmDelete(null);
    }
  };

  const handleSetDefaultTemplate = async (id) => {
    try {
      await exportService.setDefaultTemplate(id);
      toast.success('Default template updated');
      await loadTemplates();
    } catch (error) {
      toast.error(error.message || 'Failed to update default template');
    }
  };

  const handleSaveTemplate = async () => {
    if (!templateForm.name.trim()) {
      toast.error('Template name is required');
      return;
    }

    try {
      const templateData = {
        name: templateForm.name,
        module: templateForm.module,
        columns: templateForm.columns.split(',').map(col => col.trim()).filter(Boolean),
        filters: {},
        isDefault: templateForm.isDefault
      };

      await exportService.createTemplate(templateData);
      toast.success('Template created successfully');
      setShowTemplateModal(false);
      resetTemplateForm();
      await loadTemplates();
    } catch (error) {
      toast.error(error.message || 'Failed to create template');
    }
  };

  const handleDownloadExport = async (record) => {
    try {
      const blob = await exportService.downloadExport(record.id);
      const fileName = record.fileName || `export_${record.id}`;
      exportService.downloadFile(blob, fileName);
    } catch (error) {
      toast.error(error.message || 'Failed to download export');
    }
  };

  // Filter export history
  const filteredHistory = historyFilter === 'ALL'
    ? exportHistory
    : exportHistory.filter(h => h.type === historyFilter);

  const tabs = [
    { id: 'email', label: 'Email Export', icon: Mail },
    { id: 'scheduled', label: 'Scheduled Reports', icon: Calendar },
    { id: 'templates', label: 'Export Templates', icon: FileText },
    { id: 'history', label: 'Export History', icon: Database }
  ];

  return (
    <div className="p-4 md:p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setConfirmDelete(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm z-10">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Confirm Delete</h3>
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to delete this {confirmDelete.type}? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={executeConfirmedDelete} className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-colors">Delete</button>
              <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-semibold transition-colors">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Export Management</h1>
          <p className="text-gray-600 mt-1">Manage exports, schedules, and templates</p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="p-2 bg-white rounded-lg shadow-md border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          <RefreshCw className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-md border border-gray-100 p-2">
        <div className="flex gap-2 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-primary-600 to-secondary-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {/* Email Export Tab */}
        {activeTab === 'email' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-md p-6 border border-gray-100"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Mail className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Email Export</h2>
                <p className="text-sm text-gray-600">Send reports directly to email addresses</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Module Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Module *
                </label>
                <select
                  value={emailForm.module}
                  onChange={(e) => setEmailForm({ ...emailForm, module: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="SALES">Sales Orders</option>
                  <option value="PAYMENTS">Payment Management</option>
                  <option value="RAW_PURCHASE">Raw Purchases</option>
                  <option value="JOB_WORK">Job Work</option>
                  <option value="EXPENSES">Expenses</option>
                  <option value="CUSTOMERS">Customers</option>
                </select>
              </div>

              {/* Format Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Export Format *
                </label>
                <select
                  value={emailForm.format}
                  onChange={(e) => setEmailForm({ ...emailForm, format: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="EXCEL">Excel (CSV)</option>
                  <option value="PDF">PDF Document</option>
                </select>
              </div>

              {/* Recipients */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Recipients * (comma-separated)
                </label>
                <input
                  type="text"
                  value={emailForm.recipients}
                  onChange={(e) => setEmailForm({ ...emailForm, recipients: e.target.value })}
                  placeholder="email1@example.com, email2@example.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              {/* Subject */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Subject *
                </label>
                <input
                  type="text"
                  value={emailForm.subject}
                  onChange={(e) => setEmailForm({ ...emailForm, subject: e.target.value })}
                  placeholder="Monthly Sales Report - December 2024"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              {/* Message */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message (Optional)
                </label>
                <textarea
                  value={emailForm.message}
                  onChange={(e) => setEmailForm({ ...emailForm, message: e.target.value })}
                  placeholder="Please find attached the monthly sales report..."
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              {/* Include Charts */}
              <div className="md:col-span-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={emailForm.includeCharts}
                    onChange={(e) => setEmailForm({ ...emailForm, includeCharts: e.target.checked })}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700">Include charts and visualizations (PDF only)</span>
                </label>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleEmailExport}
                disabled={sendingEmail}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 transition-all shadow-md disabled:opacity-50"
              >
                {sendingEmail ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Send Email
                  </>
                )}
              </button>
              <button
                onClick={() => setEmailForm({
                  module: 'SALES',
                  format: 'EXCEL',
                  recipients: '',
                  subject: '',
                  message: '',
                  includeCharts: false
                })}
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-all"
              >
                Reset
              </button>
            </div>
          </motion.div>
        )}

        {/* Scheduled Reports Tab */}
        {activeTab === 'scheduled' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Header with Add Button */}
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <Calendar className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Scheduled Reports</h2>
                    <p className="text-sm text-gray-600">Automated report generation and delivery</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setEditingSchedule(null);
                    resetScheduleForm();
                    setShowScheduleModal(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg font-medium hover:from-purple-700 hover:to-purple-800 transition-all shadow-md"
                >
                  <Plus className="w-5 h-5" />
                  New Schedule
                </button>
              </div>
            </div>

            {/* Schedules List */}
            <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Report Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Module
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Frequency
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Next Run
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {schedules.map((schedule) => (
                      <tr key={schedule.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{schedule.name}</div>
                          <div className="text-xs text-gray-500">{schedule.recipients}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900">{schedule.module}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-900">{schedule.frequency} at {schedule.time}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {schedule.nextRun}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            schedule.status === 'ACTIVE'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {schedule.status === 'ACTIVE' ? (
                              <CheckCircle className="w-3 h-3" />
                            ) : (
                              <XCircle className="w-3 h-3" />
                            )}
                            {schedule.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleToggleSchedule(schedule.id)}
                              className="text-blue-600 hover:text-blue-700"
                              title={schedule.status === 'ACTIVE' ? 'Pause' : 'Activate'}
                            >
                              {schedule.status === 'ACTIVE' ? 'Pause' : 'Activate'}
                            </button>
                            <button
                              onClick={() => {
                                setEditingSchedule(schedule);
                                setScheduleForm({
                                  name: schedule.name || '',
                                  module: schedule.module || 'SALES',
                                  frequency: schedule.frequency || 'DAILY',
                                  time: schedule.time || '09:00',
                                  format: schedule.format || 'EXCEL',
                                  recipients: schedule.recipients || '',
                                  templateId: schedule.template_id || schedule.templateId || '',
                                  status: schedule.status || 'ACTIVE'
                                });
                                setShowScheduleModal(true);
                              }}
                              className="text-gray-600 hover:text-gray-700"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteSchedule(schedule.id)}
                              className="text-red-600 hover:text-red-700"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* Export Templates Tab */}
        {activeTab === 'templates' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Header */}
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <FileText className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Export Templates</h2>
                    <p className="text-sm text-gray-600">Customize export columns and filters</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowTemplateModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg font-medium hover:from-green-700 hover:to-green-800 transition-all shadow-md"
                >
                  <Plus className="w-5 h-5" />
                  New Template
                </button>
              </div>
            </div>

            {/* Templates Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Table className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{template.name}</h3>
                        <p className="text-sm text-gray-600">{template.module}</p>
                      </div>
                    </div>
                    {template.isDefault && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                        Default
                      </span>
                    )}
                  </div>

                  <div className="space-y-2 mb-4">
                    <p className="text-xs font-medium text-gray-500 uppercase">Columns ({template.columns.length})</p>
                    <div className="flex flex-wrap gap-1">
                      {template.columns.slice(0, 3).map((col, idx) => (
                        <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                          {col}
                        </span>
                      ))}
                      {template.columns.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                          +{template.columns.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                    <span>Created: {template.createdAt}</span>
                  </div>

                  <div className="flex gap-2">
                    {!template.isDefault && (
                      <button
                        onClick={() => handleSetDefaultTemplate(template.id)}
                        className="flex-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"
                      >
                        Set Default
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteTemplate(template.id)}
                      className="px-3 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Export History Tab */}
        {activeTab === 'history' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Header with Filter */}
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-orange-100 rounded-lg">
                    <Database className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Export History</h2>
                    <p className="text-sm text-gray-600">Track all export activities</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="w-5 h-5 text-gray-400" />
                  <select
                    value={historyFilter}
                    onChange={(e) => setHistoryFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="ALL">All Types</option>
                    <option value="EMAIL">Email Only</option>
                    <option value="SCHEDULED">Scheduled Only</option>
                    <option value="MANUAL">Manual Only</option>
                  </select>
                </div>
              </div>
            </div>

            {/* History Table */}
            <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Timestamp
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Module
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Format
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Recipients
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Records
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredHistory.map((record) => (
                      <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{record.timestamp}</div>
                          <div className="text-xs text-gray-500">By {record.executedBy}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            record.type === 'EMAIL' ? 'bg-blue-100 text-blue-800' :
                            record.type === 'SCHEDULED' ? 'bg-purple-100 text-purple-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {record.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {record.module}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {record.format}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                          {record.recipients}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{record.recordCount} rows</div>
                          <div className="text-xs text-gray-500">{(record.fileSize / 1024).toFixed(1)} KB</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            record.status === 'SUCCESS'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {record.status === 'SUCCESS' ? (
                              <CheckCircle className="w-3 h-3" />
                            ) : (
                              <AlertCircle className="w-3 h-3" />
                            )}
                            {record.status}
                          </span>
                          {record.error && (
                            <div className="text-xs text-red-600 mt-1">{record.error}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => toast.info('Download functionality will be implemented')}
                              className="text-blue-600 hover:text-blue-700"
                              title="Download"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => toast.info('View details functionality will be implemented')}
                              className="text-gray-600 hover:text-gray-700"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {editingSchedule ? 'Edit Schedule' : 'New Schedule'}
                </h3>
                <p className="text-sm text-gray-500">
                  Create or update an automated export schedule.
                </p>
              </div>
              <button
                onClick={() => {
                  setShowScheduleModal(false);
                  setEditingSchedule(null);
                  resetScheduleForm();
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Schedule Name</label>
                <input
                  type="text"
                  value={scheduleForm.name}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Module</label>
                <select
                  value={scheduleForm.module}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, module: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="SALES">Sales Orders</option>
                  <option value="PAYMENTS">Payment Management</option>
                  <option value="RAW_PURCHASE">Raw Purchases</option>
                  <option value="JOB_WORK">Job Work</option>
                  <option value="EXPENSES">Expenses</option>
                  <option value="CUSTOMERS">Customers</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Frequency</label>
                <select
                  value={scheduleForm.frequency}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, frequency: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="DAILY">Daily</option>
                  <option value="WEEKLY">Weekly</option>
                  <option value="MONTHLY">Monthly</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Run Time</label>
                <input
                  type="time"
                  value={scheduleForm.time}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, time: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Format</label>
                <select
                  value={scheduleForm.format}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, format: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="EXCEL">Excel</option>
                  <option value="PDF">PDF</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Recipients</label>
                <input
                  type="text"
                  value={scheduleForm.recipients}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, recipients: e.target.value })}
                  placeholder="email1@example.com, email2@example.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Template ID (optional)</label>
                <input
                  type="text"
                  value={scheduleForm.templateId}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, templateId: e.target.value })}
                  placeholder="Existing template id"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div className="md:col-span-2 flex items-center gap-3">
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={scheduleForm.status === 'ACTIVE'}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, status: e.target.checked ? 'ACTIVE' : 'PAUSED' })}
                    className="h-4 w-4 text-primary-600 border-gray-300 rounded"
                  />
                  Active schedule
                </label>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowScheduleModal(false);
                  setEditingSchedule(null);
                  resetScheduleForm();
                }}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSaveSchedule(scheduleForm)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Save Schedule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Template Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900">New Export Template</h3>
                <p className="text-sm text-gray-500">Create a reusable export template for reports.</p>
              </div>
              <button
                onClick={() => {
                  setShowTemplateModal(false);
                  resetTemplateForm();
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Template Name</label>
                <input
                  type="text"
                  value={templateForm.name}
                  onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Module</label>
                <select
                  value={templateForm.module}
                  onChange={(e) => setTemplateForm({ ...templateForm, module: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="SALES">Sales Orders</option>
                  <option value="PAYMENTS">Payment Management</option>
                  <option value="RAW_PURCHASE">Raw Purchases</option>
                  <option value="JOB_WORK">Job Work</option>
                  <option value="EXPENSES">Expenses</option>
                  <option value="CUSTOMERS">Customers</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Columns (comma-separated)</label>
                <input
                  type="text"
                  value={templateForm.columns}
                  onChange={(e) => setTemplateForm({ ...templateForm, columns: e.target.value })}
                  placeholder="Order Number, Customer, Date, Amount, Status"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  id="template-default"
                  type="checkbox"
                  checked={templateForm.isDefault}
                  onChange={(e) => setTemplateForm({ ...templateForm, isDefault: e.target.checked })}
                  className="h-4 w-4 text-primary-600 border-gray-300 rounded"
                />
                <label htmlFor="template-default" className="text-sm text-gray-700">Set as default template</label>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowTemplateModal(false);
                  resetTemplateForm();
                }}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTemplate}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Create Template
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExportManagement;

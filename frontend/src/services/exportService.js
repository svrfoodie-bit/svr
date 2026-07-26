import api from './api';

/**
 * Export Service
 * Handles all export-related API calls including email exports, templates, schedules, and history
 */
export const exportService = {
  /**
   * Email Export
   */
  async sendEmailExport(data) {
    try {
      const response = await api.post('/exports/email', data);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  },

  /**
   * Export Templates
   */
  async getTemplates() {
    try {
      const response = await api.get('/exports/templates');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  },

  async createTemplate(data) {
    try {
      const response = await api.post('/exports/templates', data);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  },

  async updateTemplate(id, data) {
    try {
      const response = await api.put(`/exports/templates/${id}`, data);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  },

  async setDefaultTemplate(id) {
    try {
      const response = await api.put(`/exports/templates/${id}/default`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  },

  async deleteTemplate(id) {
    try {
      const response = await api.delete(`/exports/templates/${id}`);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  },

  /**
   * Export Schedules
   */
  async getSchedules() {
    try {
      const response = await api.get('/exports/schedules');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  },

  async createSchedule(data) {
    try {
      const response = await api.post('/exports/schedules', data);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  },

  async updateSchedule(id, data) {
    try {
      const response = await api.put(`/exports/schedules/${id}`, data);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  },

  async toggleScheduleStatus(id) {
    try {
      const response = await api.put(`/exports/schedules/${id}/toggle`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  },

  async deleteSchedule(id) {
    try {
      const response = await api.delete(`/exports/schedules/${id}`);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  },

  /**
   * Export History
   */
  async getHistory(filters = {}) {
    try {
      const params = new URLSearchParams();

      if (filters.type) params.append('type', filters.type);
      if (filters.module) params.append('module', filters.module);
      if (filters.status) params.append('status', filters.status);
      if (filters.limit) params.append('limit', filters.limit);

      const response = await api.get(`/exports/history?${params.toString()}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  },

  async downloadExport(id) {
    try {
      const response = await api.get(`/exports/download/${id}`, {
        responseType: 'blob'
      });
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  },

  async getStatistics(filters = {}) {
    try {
      const params = new URLSearchParams();

      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const response = await api.get(`/exports/statistics?${params.toString()}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  },

  /**
   * Helper method to download a file from blob
   */
  downloadFile(blob, fileName) {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  /**
   * Error handler
   */
  handleError(error) {
    if (error.response) {
      // Server responded with error
      const message = error.response.data?.message || error.response.data?.error || 'An error occurred';
      return new Error(message);
    } else if (error.request) {
      // Request made but no response
      return new Error('No response from server. Please check your connection.');
    } else {
      // Something else happened
      return new Error(error.message || 'An unexpected error occurred');
    }
  }
};

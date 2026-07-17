import api from './axios';

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  requestOtp: (data) => api.post('/auth/request-otp', data),
  verifyOtp: (data) => api.post('/auth/verify-otp', data),
  getProfile: () => api.get('/auth/profile'),
};

export const dashboardAPI = {
  getSummary: () => api.get('/dashboard/summary'),
  getAIInsights: () => api.get('/dashboard/ai-insights'),
  getReport: (startDate, endDate) =>
    api.get('/dashboard/report', { params: { startDate, endDate } }),
};

export const energyAPI = {
  getReadings: (params) => api.get('/energy/readings', { params }),
  addReading: (data) => api.post('/energy/readings', data),
  getAnalytics: (params) => api.get('/energy/analytics', { params }),
  getNodes: () => api.get('/energy/nodes'),
  createNode: (data) => api.post('/energy/nodes', data),
  updateNodeStatus: (id, status) =>
    api.patch(`/energy/nodes/${id}/status`, JSON.stringify(status)),
  getNodeSummary: (nodeId) => api.get(`/energy/nodes/${nodeId}/summary`),
  sendNodeSmsAlert: (nodeId) => api.post(`/energy/nodes/${nodeId}/sms-alert`),
};

export const faultAPI = {
  getFaults: (params) => api.get('/fault', { params }),
  getFault: (id) => api.get(`/fault/${id}`),
  reportFault: (data) => api.post('/fault', data),
  updateStatus: (id, data) => api.patch(`/fault/${id}/status`, data),
  predictFaults: (nodeId) => api.get(`/fault/predict/${nodeId}`),
  getStats: () => api.get('/fault/stats'),
};

export const outageAPI = {
  getOutages: (params) => api.get('/outage', { params }),
  getOutage: (id) => api.get(`/outage/${id}`),
  reportOutage: (data) => api.post('/outage', data),
  restoreOutage: (id, data) => api.patch(`/outage/${id}/restore`, data),
  getStats: () => api.get('/outage/stats'),
};

export const aiChatAPI = {
  sendMessage: (message, history) => api.post('/aichat/message', { message, history }),
};

export const notificationsAPI = {
  getNotifications: () => api.get('/notification'),
  markAsRead: (id) => api.post(`/notification/${id}/read`),
};

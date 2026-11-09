import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getHealth = async () => {
  const response = await apiClient.get('/health');
  return response.data;
};

export const getDashboardStats = async () => {
  const response = await apiClient.get('/dashboard/stats');
  return response.data;
};

export const getHistory = async (limit = 100, offset = 0) => {
  const response = await apiClient.get(`/history?limit=${limit}&offset=${offset}`);
  return response.data;
};

export const predictSample = async (sampleData) => {
  const response = await apiClient.post('/predict', sampleData);
  return response.data;
};

export const evaluateAnomaly = async (sampleData) => {
  const response = await apiClient.post('/anomaly', sampleData);
  return response.data;
};

export const uploadCsv = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await apiClient.post('/upload-csv', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

// ==========================================
// PDF Compliance & Audit Report Endpoints
// ==========================================

export const downloadAllReportsPdf = async () => {
  const response = await apiClient.get('/reports/all', {
    responseType: 'blob',
  });
  return response.data;
};

export const downloadSingleReportPdf = async (sampleId) => {
  const response = await apiClient.get(`/reports/sample/${sampleId}`, {
    responseType: 'blob',
  });
  return response.data;
};

export const downloadSelectedReportsPdf = async (sampleIds) => {
  const response = await apiClient.post('/reports/selected', { sample_ids: sampleIds }, {
    responseType: 'blob',
  });
  return response.data;
};

export const triggerBlobDownload = (blobData, defaultFilename = 'AquaWatch_Report.pdf') => {
  const url = window.URL.createObjectURL(new Blob([blobData], { type: 'application/pdf' }));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', defaultFilename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

// ==========================================
// ESP32 IoT API Endpoints
// ==========================================

export const getIoTDevices = async () => {
  const response = await apiClient.get('/iot/devices');
  return response.data;
};

export const registerIoTDevice = async (deviceData) => {
  const response = await apiClient.post('/iot/devices/register', deviceData);
  return response.data;
};

export const getIoTDeviceStatus = async (deviceId) => {
  const response = await apiClient.get(`/iot/devices/${deviceId}/status`);
  return response.data;
};

export const getLatestIoTReading = async (deviceId, isSimulated = false) => {
  let url = `/iot/readings/latest?is_simulated=${isSimulated}`;
  if (deviceId) url += `&device_id=${deviceId}`;
  const response = await apiClient.get(url);
  return response.data;
};

export const getIoTReadingsHistory = async (deviceId, isSimulated = false, limit = 50) => {
  let url = `/iot/readings/history?is_simulated=${isSimulated}&limit=${limit}`;
  if (deviceId) url += `&device_id=${deviceId}`;
  const response = await apiClient.get(url);
  return response.data;
};

export const postIoTReading = async (readingData) => {
  const response = await apiClient.post('/iot/readings', readingData);
  return response.data;
};

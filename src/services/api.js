import axios from 'axios';
import { message } from 'antd';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

// 请求拦截：自动带 Token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('clientToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 响应拦截：统一错误处理
api.interceptors.response.use(
  (response) => {
    const data = response.data;
    // 业务错误：code !== 0
    if (data && typeof data.code !== 'undefined' && data.code !== 0) {
      message.error(data.message || '操作失败');
      return Promise.reject(new Error(data.message || '操作失败'));
    }
    return data;
  },
  (error) => {
    const status = error.response?.status;

    if (status === 401) {
      // Token 无效或过期
      localStorage.removeItem('clientToken');
      localStorage.removeItem('clientUser');
      message.error('登录已过期，请重新登录');
      window.location.href = '/client/login';
    } else if (status >= 500) {
      // 服务器异常
      message.error('服务器异常，请稍后重试');
    } else if (status === 404) {
      message.error('接口不存在');
    } else if (status === 0 || status === undefined) {
      // 网络断开 / 后端挂了
      message.error('网络异常，请检查网络或服务器');
    } else {
      // 其他业务层错误
      const msg = error.response?.data?.message || error.message;
      message.error(msg);
    }
    return Promise.reject(error);
  }
);

// ============ API ============

// 认证
export const clientAuth = {
  register: (data) => api.post('/client/register', data),
  login: (data) => api.post('/client/login', data),
  me: () => api.get('/client/me'),
  changePassword: (data) => api.put('/client/password', data),
  sendResetCode: (data) => api.post('/client/send-reset-code', data),
  resetPassword: (data) => api.post('/client/reset-password', data),
};

// 牌价（公开）
export const rate = {
  list: () => api.get('/rate/public'),
};

// 换汇
export const exchange = {
  create: (data) => api.post('/client/exchange', data),
  list: (params) => api.get('/client/exchange/list', { params }),
  detail: (exchangeId) => api.get(`/client/exchange/detail/${exchangeId}`),
  confirm: (exchangeId) => api.put(`/client/exchange/${exchangeId}/confirm`),
  uploadProof: (exchangeId, formData) => api.post(`/client/exchange/${exchangeId}/proof`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
};

// 收款人
export const payee = {
  list: (params) => api.get('/client/payee/list', { params }),
  detail: (payeeId) => api.get(`/client/payee/detail/${payeeId}`),
  create: (data) => api.post('/client/payee', data),
  update: (payeeId, data) => api.put(`/client/payee/${payeeId}`, data),
  remove: (payeeId) => api.delete(`/client/payee/${payeeId}`),
};

// 钱包
export const wallet = {
  getMy: () => api.get('/client/wallet'),
};

// 入金
export const deposit = {
  create: (data) => api.post('/client/deposit', data),
  list: (params) => api.get('/client/deposit/list', { params }),
  detail: (orderNo) => api.get(`/client/deposit/detail/${orderNo}`),
};

// 提现/付款
export const withdrawal = {
  create: (data) => api.post('/client/withdrawal', data),
  list: (params) => api.get('/client/withdrawal/list', { params }),
  detail: (withdrawalId) => api.get(`/client/withdrawal/detail/${withdrawalId}`),
  customerConfirm: (withdrawalId) => api.put(`/client/withdrawal/${withdrawalId}/customer-confirm`),
  complete: (withdrawalId) => api.put(`/client/withdrawal/${withdrawalId}/complete`),
  cancel: (withdrawalId) => api.put(`/client/withdrawal/${withdrawalId}/cancel`),
};

// 下载 PDF 辅助函数
export const downloadPdf = (url, filename) => {
  const token = localStorage.getItem('clientToken');
  fetch(`/api${url}`, {
    headers: { Authorization: token ? `Bearer ${token}` : '' },
  })
    .then(res => {
      if (!res.ok) throw new Error('下载失败');
      return res.blob();
    })
    .then(blob => {
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(blobUrl);
    })
    .catch(() => message.error('下载失败，请稍后重试'));
};

// 邮件
export const email = {
  sendCode: (email) => api.post('/email/send-code', { email }),
};

// 文件上传
export const upload = (files) => {
  const formData = new FormData();
  const fileArray = Array.isArray(files) ? files : [files];
  fileArray.forEach((file) => formData.append('files', file));
  return api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export default api;

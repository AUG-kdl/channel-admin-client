// 客户端 API 服务 - 使用相对路径，让 devServer 代理到后端
const API_BASE = '/api';

const request = async (url, options = {}) => {
  const token = localStorage.getItem('clientToken');

  const isFormData = options.body instanceof FormData;
  const headers = {
    ...(token && { Authorization: `Bearer ${token}` }),
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(isFormData
      ? Object.fromEntries(Object.entries(options.headers || {}).filter(([k]) => k.toLowerCase() !== 'content-type'))
      : options.headers),
  };

  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (data.code !== 0) {
    throw new Error(data.message || '请求失败');
  }

  return data;
};

// 认证
export const clientAuth = {
  register: (data) => request('/client/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (data) => request('/client/login', { method: 'POST', body: JSON.stringify(data) }),
  me: () => request('/client/me'),
  changePassword: (data) => request('/client/password', { method: 'PUT', body: JSON.stringify(data) }),
  updateProfile: (data) => request('/client/profile', { method: 'PUT', body: JSON.stringify({ ...data, authStatus: 'pending' }) }),
  sendResetCode: (data) => request('/client/send-reset-code', { method: 'POST', body: JSON.stringify(data) }),
  resetPassword: (data) => request('/client/reset-password', { method: 'POST', body: JSON.stringify(data) }),
};

// 牌价（公开）
export const rate = {
  list: () => request('/rate/public'),
};

// 换汇
export const exchange = {
  create: (data) => request('/client/exchange', { method: 'POST', body: JSON.stringify(data) }),
  list: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/client/exchange/list${query ? `?${query}` : ''}`);
  },
  detail: (exchangeId) => request(`/client/exchange/detail/${exchangeId}`),
  confirm: (exchangeId) => request(`/client/exchange/${exchangeId}/confirm`, { method: 'PUT' }),
  uploadProof: (exchangeId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return request(`/client/exchange/${exchangeId}/proof`, { method: 'POST', body: formData });
  },
};

// 收款人
export const payee = {
  list: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/client/payee/list${query ? `?${query}` : ''}`);
  },
  detail: (payeeId) => request(`/client/payee/detail/${payeeId}`),
  create: (data) => request('/client/payee', { method: 'POST', body: JSON.stringify(data) }),
  update: (payeeId, data) => request(`/client/payee/${payeeId}`, { method: 'PUT', body: JSON.stringify(data) }),
  remove: (payeeId) => request(`/client/payee/${payeeId}`, { method: 'DELETE' }),
};

// 钱包
export const wallet = {
  getMy: () => request('/client/wallet'),
};

// 入金
export const deposit = {
  create: (data) => request('/client/deposit', { method: 'POST', body: JSON.stringify(data) }),
  list: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/client/deposit/list${query ? `?${query}` : ''}`);
  },
  detail: (orderNo) => request(`/client/deposit/detail/${orderNo}`),
};

// 提现/付款
export const withdrawal = {
  create: (data) => request('/client/withdrawal', { method: 'POST', body: JSON.stringify(data) }),
  list: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/client/withdrawal/list${query ? `?${query}` : ''}`);
  },
  detail: (withdrawalId) => request(`/client/withdrawal/detail/${withdrawalId}`),
  customerConfirm: (withdrawalId) => request(`/client/withdrawal/${withdrawalId}/customer-confirm`, { method: 'PUT' }),
  complete: (withdrawalId) => request(`/client/withdrawal/${withdrawalId}/complete`, { method: 'PUT' }),
  cancel: (withdrawalId) => request(`/client/withdrawal/${withdrawalId}/cancel`, { method: 'PUT' }),
};

// 邮件
export const email = {
  sendCode: (email) => request('/email/send-code', { method: 'POST', body: JSON.stringify({ email }) }),
};

// 文件上传
export const upload = async (files) => {
  const token = localStorage.getItem('clientToken');
  const formData = new FormData();
  const fileArray = Array.isArray(files) ? files : [files];
  fileArray.forEach((file) => formData.append('files', file));

  const response = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: formData,
  });

  const data = await response.json();
  if (data.code !== 0) {
    throw new Error(data.message || '上传失败');
  }
  return data;
};

export default {
  clientAuth,
  rate,
  exchange,
  upload,
  email,
  wallet,
  payee,
  deposit,
  withdrawal,
};

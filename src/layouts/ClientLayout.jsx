import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'umi';
import { Dropdown, Avatar, Modal, Select, Space } from 'antd';
import {
  UserOutlined, HomeOutlined, LogoutOutlined, MoneyCollectOutlined,
  BankOutlined, LockOutlined, SettingOutlined, DownOutlined,
  SwapOutlined, FundProjectionScreenOutlined, SendOutlined,
  ClockCircleOutlined, CloseCircleOutlined,
} from '@ant-design/icons';
import { useI18n } from '../locales/I18nContext';
import { clientAuth } from '../services/api';

const LANGS = [
  { label: '中文', value: 'zh-CN', flag: '🇨🇳' },
  { label: 'English', value: 'en-US', flag: '🇺🇸' },
  { label: 'Русский', value: 'ru-RU', flag: '🇷🇺' },
];

const STORAGE_KEY = 'client_locale';

export default function ClientLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { locale, setLocale, t } = useI18n();
  const token = localStorage.getItem('clientToken');
  const userStr = localStorage.getItem('clientUser') || '{}';
  const user = JSON.parse(userStr);

  const [logoutVisible, setLogoutVisible] = useState(false);
  const [authStatus, setAuthStatus] = useState(user.authStatus || 'pending');
  const [authReason, setAuthReason] = useState(user.authReason || '');

  // 每次进入 layout 时拉取最新 authStatus + authReason
  useEffect(() => {
    if (!token) return;
    clientAuth.me().then(res => {
      const fresh = res.data?.authStatus || 'pending';
      const reason = res.data?.authReason || '';
      setAuthStatus(fresh);
      setAuthReason(reason);
      const updated = { ...user, authStatus: fresh, authReason: reason };
      localStorage.setItem('clientUser', JSON.stringify(updated));
    }).catch(() => {});
  }, []);

  const isAuthBlocked = authStatus !== 'approved' && !['/client/profile', '/client/profile/edit'].includes(location.pathname);

  if (!token) {
    navigate('/client/login');
    return null;
  }

  const navItems = [
    { path: '/client/home', label: t('nav.home'), icon: <HomeOutlined /> },
    { path: '/client/exchange', label: t('nav.exchange'), icon: <SwapOutlined /> },
    { path: '/client/receivable', label: t('nav.receivable'), icon: <MoneyCollectOutlined /> },
    { path: '/client/deposit', label: t('nav.deposit'), icon: <FundProjectionScreenOutlined /> },
    { path: '/client/withdrawal', label: t('nav.withdrawal'), icon: <SendOutlined /> },
    { path: '/client/about', label: t('nav.about'), icon: <BankOutlined /> },
  ];

  const isActive = (path) =>
    location.pathname === path || location.pathname.startsWith(path + '/');

  const dropdownMenu = {
    items: [
      { key: '/client/profile', label: t('nav.profile'), icon: <SettingOutlined />, style: { height: 30, lineHeight: '30px' } },
      { key: '/client/profile/password', label: t('nav.password'), icon: <LockOutlined />, style: { height: 30, lineHeight: '30px' } },
      { type: 'divider' },
      { key: 'logout', label: t('nav.logout'), icon: <LogoutOutlined />, danger: true, style: { height: 30, lineHeight: '30px' } },
    ],
    style: { minWidth: 180, padding: '6px 0' },
    onClick: ({ key }) => {
      if (key === 'logout') {
        setLogoutVisible(true);
      } else {
        navigate(key);
      }
    },
  };

  const handleLogout = () => {
    localStorage.removeItem('clientToken');
    localStorage.removeItem('clientUser');
    setLogoutVisible(false);
    navigate('/client/login');
  };

  return (
    <>
      <style>{`body, html { margin: 0 !important; padding: 0 !important; } #root { overflow-x: hidden; }`}</style>

      {/* 认证阻断弹框 — 三态引导 */}
      <Modal
        open={isAuthBlocked}
        footer={null}
        closable={false}
        maskClosable={false}
        centered
        width={420}
        styles={{ body: { padding: 0, overflow: 'hidden' } }}
      >
        <div style={{ textAlign: 'center', padding: '40px 32px 32px' }}>
          {/* 图标 */}
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: authStatus === 'pending'
              ? 'linear-gradient(135deg, #fff7e6 0%, #ffe7b0 100%)'
              : authStatus === 'rejected'
                ? 'linear-gradient(135deg, #fff1f0 0%, #ffccc7 100%)'
                : 'linear-gradient(135deg, #f0f4ff 0%, #e0e7ff 100%)',
            border: `2px solid ${authStatus === 'pending' ? '#ffa940' : authStatus === 'rejected' ? '#ff4d4f' : '#818cf8'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 24px',
          }}>
            {authStatus === 'pending'
              ? <ClockCircleOutlined style={{ fontSize: 32, color: '#fa8c16' }} />
              : authStatus === 'rejected'
                ? <CloseCircleOutlined style={{ fontSize: 32, color: '#f5222d' }} />
                : <UserOutlined style={{ fontSize: 32, color: '#6366f1' }} />
            }
          </div>

          {/* 标题 */}
          <div style={{ fontSize: 18, fontWeight: 700, color: '#1a1a2e', marginBottom: 10 }}>
            {authStatus === 'pending' ? t('nav.authPendingTitle')
              : authStatus === 'rejected' ? t('nav.authRejectedTitle')
              : t('nav.authUnsubmittedTitle')}
          </div>

          {/* 描述 */}
          <div style={{ fontSize: 14, color: '#6b7280', marginBottom: authStatus === 'rejected' ? 8 : 28, lineHeight: 1.7 }}>
            {authStatus === 'pending' ? t('nav.authPendingDesc')
              : authStatus === 'rejected' ? t('nav.authRejectedDesc')
              : t('nav.authUnsubmittedDesc')}
          </div>

          {/* 拒绝原因 */}
          {authStatus === 'rejected' && authReason && (
            <div style={{
              background: '#fff1f0', border: '1px solid #ffccc7',
              borderRadius: 8, padding: '10px 14px', marginBottom: 24,
              fontSize: 13, color: '#cf1322', textAlign: 'left', lineHeight: 1.6,
            }}>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>{t('nav.authRejectReason') || '拒绝原因'}：</div>
              <div>{authReason}</div>
            </div>
          )}

          {/* 按钮 — 始终显示"去认证" */}
          <button
            onClick={() => navigate('/client/profile')}
            style={{
              width: '100%', height: 48, borderRadius: 12,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none', color: '#fff', fontSize: 15, fontWeight: 600,
              cursor: 'pointer', boxShadow: '0 4px 12px rgba(102,126,234,0.3)',
            }}
          >
            {t('nav.authUnsubmittedBtn') || '去认证'}
          </button>
        </div>
      </Modal>

      {/* 退出登录弹框 */}
      <Modal
        open={logoutVisible}
        onCancel={() => setLogoutVisible(false)}
        footer={null}
        closable={false}
        centered
        width={360}
        styles={{ body: { padding: 0, overflow: 'hidden' } }}
      >
        <div style={{ textAlign: 'center', padding: '32px 24px 24px' }}>
          {/* 图标 */}
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: 'linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%)',
            border: '2px solid #c4b5fd',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px',
          }}>
            <LogoutOutlined style={{ fontSize: 28, color: '#7c3aed' }} />
          </div>
          {/* 标题 */}
          <div style={{ fontSize: 17, fontWeight: 600, color: '#1a1a2e', marginBottom: 8 }}>{t('nav.logout')}</div>
          {/* 描述 */}
          <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 28, lineHeight: 1.6 }}>
            {t('nav.logoutConfirm')}<br />{t('nav.logoutConfirmDesc')}
          </div>
          {/* 按钮 */}
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={() => setLogoutVisible(false)}
              style={{
                flex: 1, height: 44, borderRadius: 10, border: '1px solid #e5e7eb',
                background: '#fff', color: '#374151', fontSize: 15, fontWeight: 500,
                cursor: 'pointer', transition: 'all 0.2s',
              }}
              onMouseEnter={e => e.target.style.background = '#f9fafb'}
              onMouseLeave={e => e.target.style.background = '#fff'}
            >
              {t('app.cancel')}
            </button>
            <button
              onClick={handleLogout}
              style={{
                flex: 1, height: 44, borderRadius: 10,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none', color: '#fff', fontSize: 15, fontWeight: 500,
                cursor: 'pointer', boxShadow: '0 4px 12px rgba(102,126,234,0.3)',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => e.target.style.opacity = '0.9'}
              onMouseLeave={e => e.target.style.opacity = '1'}
            >
              {t('nav.logout')}
            </button>
          </div>
        </div>
      </Modal>

      <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
        <header style={{
          height: 64, background: '#fff',
          boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
          position: 'sticky', top: 0, zIndex: 100,
          display: 'flex', alignItems: 'center',
          padding: '0 16px', justifyContent: 'space-between',
        }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => navigate('/client/home')}>
            <img src="/favicon.png" alt="logo" style={{ width: 32, height: 32 }} />
            <span style={{ fontSize: 20, fontWeight: 700, color: '#667eea', letterSpacing: 1 }}>将星 GenStarPay</span>
          </div>

          {/* 导航 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {navItems.map((item) => (
              <div
                key={item.path}
                onClick={() => navigate(item.path)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 16px', borderRadius: 8, cursor: 'pointer',
                  fontSize: 15,
                  fontWeight: isActive(item.path) ? 600 : 500,
                  color: isActive(item.path) ? '#667eea' : '#333',
                  background: isActive(item.path) ? 'rgba(102,126,234,0.1)' : 'transparent',
                  transition: 'all 0.2s',
                }}
              >
                <span style={{ fontSize: 16 }}>{item.icon}</span>
                <span>{item.label}</span>
              </div>
            ))}
          </div>

          {/* 右侧 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginRight: 32 }}>
            {/* 语言切换 */}
            <Select
              value={locale}
              onChange={(v) => { localStorage.setItem(STORAGE_KEY, v); setLocale(v); }}
              size="small"
              style={{ width: 110 }}
              options={LANGS.map(l => ({ value: l.value, label: (
                <span style={{ fontSize: 14 }}>
                  <span style={{ marginRight: 6 }}>{l.flag}</span>{l.label}
                </span>
              )}))}
            />

            {/* 用户下拉 */}
            <Dropdown menu={dropdownMenu} placement="bottomRight" trigger={['click']} overlayStyle={{ minWidth: 180 }}>
              <Space style={{ cursor: 'pointer', padding: '6px 12px', borderRadius: 8, transition: 'background 0.2s' }}>
                <Avatar size={36} icon={<UserOutlined />} style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }} />
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: 500, color: '#333', fontSize: 14, lineHeight: 1.3 }}>{user.name || t('nav.user')}</div>
                  <div style={{ fontSize: 12, color: '#999', lineHeight: 1.3 }}>{user.company || ''}</div>
                </div>
                <DownOutlined style={{ fontSize: 11, color: '#999' }} />
              </Space>
            </Dropdown>
          </div>
        </header>

        <main style={{ minHeight: 'calc(100vh - 64px)', overflowX: 'hidden' }}>
          <Outlet />
        </main>
      </div>
    </>
  );
}

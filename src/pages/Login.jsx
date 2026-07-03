import { useState } from 'react';
import { Form, Input, Button, message, Modal, Select } from 'antd';
import { LockOutlined, MailOutlined, UserOutlined } from '@ant-design/icons';
import { useNavigate } from 'umi';
import { clientAuth } from '@/services/api';
import { useI18n } from '../locales/I18nContext';

const LANGS = [
  { label: '中文', value: 'zh-CN', flag: '🇨🇳' },
  { label: 'English', value: 'en-US', flag: '🇺🇸' },
  { label: 'Русский', value: 'ru-RU', flag: '🇷🇺' },
];
const STORAGE_KEY = 'client_locale';

const Login = () => {
  const navigate = useNavigate();
  const { t, locale, setLocale } = useI18n();
  const [loading, setLoading] = useState(false);
  const [firstLoginModal, setFirstLoginModal] = useState(false);

  const handleLogin = async (values) => {
    setLoading(true);
    try {
      const res = await clientAuth.login({
        email: values.email,
        password: values.password,
      });

      localStorage.setItem('clientToken', res.data.token);
      localStorage.setItem('clientUser', JSON.stringify(res.data.user));
      message.success(t('login.loginSuccess'));

      if (res.data.user.isFirstLogin) {
        setFirstLoginModal(true);
      } else {
        navigate('/client/home');
      }
    } catch (e) {
      // 错误已由拦截器统一处理
    } finally {
      setLoading(false);
    }
  };

  const handleGoProfile = () => {
    setFirstLoginModal(false);
    navigate('/client/profile/edit');
  };

  return (
    <>
      <style>{`body, html { margin: 0 !important; padding: 0 !important; overflow: hidden; height: 100%; } #root { height: 100%; }`}</style>
      <div style={{
        minHeight: '100vh',
        width: '100vw',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'stretch',
      }}>
        {/* 语言切换 */}
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 10 }}>
          <Select
            value={locale}
            onChange={(v) => { localStorage.setItem(STORAGE_KEY, v); setLocale(v); }}
            size="small"
            style={{ width: 120 }}
            options={LANGS.map(l => ({ value: l.value, label: (
              <span style={{ fontSize: 14 }}>
                <span style={{ marginRight: 6 }}>{l.flag}</span>{l.label}
              </span>
            )}))}
          />
        </div>

        {/* 左侧品牌区域 */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '0 80px',
          color: '#fff',
        }}>
          <h1 style={{ fontSize: 64, fontWeight: 800, margin: 0, letterSpacing: -1 }}>将星 GenStarPay</h1>
          <p style={{ fontSize: 20, marginTop: 24, opacity: 0.9, lineHeight: 1.6, maxWidth: 480 }}>
            {t('login.brand')}
          </p>
          <div style={{ marginTop: 64, display: 'flex', gap: 48 }}>
            <div>
              <div style={{ fontSize: 48, fontWeight: 700 }}>7.25</div>
              <div style={{ fontSize: 14, opacity: 0.7, marginTop: 4 }}>USD/CNY</div>
            </div>
            <div>
              <div style={{ fontSize: 48, fontWeight: 700 }}>7.23</div>
              <div style={{ fontSize: 14, opacity: 0.7, marginTop: 4 }}>USD/CNH</div>
            </div>
          </div>
        </div>

        {/* 右侧登录表单区域 */}
        <div style={{
          width: 480,
          background: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '60px 48px',
          boxShadow: '-10px 0 40px rgba(0,0,0,0.1)',
        }}>
          <div style={{ width: '100%', maxWidth: 360 }}>
            <h2 style={{ fontSize: 28, fontWeight: 600, color: '#333', marginBottom: 8 }}>{t('login.welcomeTitle')}</h2>
            <p style={{ color: '#999', marginBottom: 40 }}>{t('login.welcomeSubtitle')}</p>

            <Form onFinish={handleLogin} layout="vertical" size="large">
              <Form.Item name="email" rules={[{ required: true, message: t('login.emailRequired') }]}>
                <Input
                  prefix={<MailOutlined style={{ color: '#999' }} />}
                  placeholder={t('login.emailPlaceholder')}
                  style={{ height: 52, borderRadius: 10, marginBottom: 20 }}
                />
              </Form.Item>

              <Form.Item name="password" rules={[{ required: true, message: t('login.passwordRequired') }]}>
                <Input.Password
                  prefix={<LockOutlined style={{ color: '#999' }} />}
                  placeholder={t('login.passwordPlaceholder')}
                  style={{ height: 52, borderRadius: 10, marginBottom: 12 }}
                />
              </Form.Item>

              <Form.Item style={{ marginTop: 32 }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  block
                  style={{ height: 52, fontSize: 16, borderRadius: 10, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', border: 'none' }}
                >
                  {t('login.submit')}
                </Button>
              </Form.Item>

              <div style={{ textAlign: 'center', color: '#666', marginTop: 24 }}>
                {t('login.noAccount')} <a href="/client/register" style={{ color: '#667eea', fontWeight: 500 }}>{t('login.register')}</a>
                <span style={{ margin: '0 8px', color: '#ddd' }}>|</span>
                <a href="/client/forgot-password" style={{ color: '#667eea', fontWeight: 500 }}>{t('login.forgotPassword')}</a>
              </div>
            </Form>
          </div>
        </div>
      </div>

      {/* 首次登录引导弹框 */}
      <Modal
        title={null}
        open={firstLoginModal}
        footer={null}
        onCancel={() => { setFirstLoginModal(false); navigate('/client/home'); }}
        centered
        width={400}
      >
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
          }}>
            <UserOutlined style={{ fontSize: 28, color: '#fff' }} />
          </div>
          <h3 style={{ fontSize: 20, fontWeight: 600, color: '#333', marginBottom: 12 }}>
            {t('login.firstLoginTitle')}
          </h3>
          <p style={{ color: '#666', fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
            {t('login.firstLoginDesc')}
          </p>
          <Button
            type="primary"
            block
            size="large"
            onClick={handleGoProfile}
            style={{
              height: 48,
              fontSize: 16,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none',
            }}
          >
            {t('login.completeProfile')}
          </Button>
          <Button
            type="text"
            block
            onClick={() => { setFirstLoginModal(false); navigate('/client/home'); }}
            style={{ marginTop: 12, color: '#999' }}
          >
            {t('login.later')}
          </Button>
        </div>
      </Modal>
    </>
  );
};

export default Login;

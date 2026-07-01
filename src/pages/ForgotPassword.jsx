import { useState, useEffect } from 'react';
import { Form, Input, Button, message } from 'antd';
import { LockOutlined, MailOutlined, SafetyOutlined } from '@ant-design/icons';
import { useNavigate } from 'umi';
import { clientAuth } from '@/services/api';
import { useI18n } from '../locales/I18nContext';

const LANGS = [
  { label: '中文', value: 'zh-CN', flag: '🇨🇳' },
  { label: 'English', value: 'en-US', flag: '🇺🇸' },
  { label: 'Русский', value: 'ru-RU', flag: '🇷🇺' },
];
const STORAGE_KEY = 'client_locale';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const { t, locale, setLocale } = useI18n();
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [form] = Form.useForm();

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // 发送验证码
  const handleSendCode = async () => {
    try {
      const emailValue = await form.validateFields(['email']);
      if (!emailValue.email) return;
      setSending(true);
      await clientAuth.sendResetCode({ email: emailValue.email });
      message.success(t('forgotPassword.sendSuccess'));
      setCountdown(60);
    } catch (e) {
      // 表单校验失败会走这里，不处理
    } finally {
      setSending(false);
    }
  };

  // 提交重置
  const handleReset = async (values) => {
    setLoading(true);
    try {
      await clientAuth.resetPassword({
        email: values.email,
        code: values.code,
        password: values.password,
      });
      message.success(t('forgotPassword.resetSuccess'));
      setTimeout(() => navigate('/client/login'), 1500);
    } catch (e) {
      const err = e?.message || '';
      if (err.includes('邮箱') || err.includes('email') || err.includes('not registered')) {
        message.error(t('forgotPassword.emailNotRegistered'));
      } else if (err.includes('验证码') || err.includes('code') || err.includes('expired')) {
        message.error(t('forgotPassword.codeError'));
      } else {
        message.error(err || t('app.error'));
      }
    } finally {
      setLoading(false);
    }
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
          <select
            value={locale}
            onChange={(e) => { localStorage.setItem(STORAGE_KEY, e.target.value); setLocale(e.target.value); }}
            style={{ width: 120, padding: '4px 8px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.15)', color: '#fff', fontSize: 14, cursor: 'pointer' }}
          >
            {LANGS.map(l => (
              <option key={l.value} value={l.value} style={{ color: '#333' }}>{l.flag} {l.label}</option>
            ))}
          </select>
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

        {/* 右侧表单区域 */}
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
            <h2 style={{ fontSize: 28, fontWeight: 600, color: '#333', marginBottom: 8 }}>{t('forgotPassword.title')}</h2>
            <p style={{ color: '#999', marginBottom: 32, fontSize: 14 }}>{t('forgotPassword.subtitle')}</p>

            <Form form={form} onFinish={handleReset} layout="vertical" size="large">
              <Form.Item
                name="email"
                rules={[
                  { required: true, message: t('forgotPassword.emailRequired') },
                  { type: 'email', message: t('register.emailFormat') },
                ]}
              >
                <Input
                  prefix={<MailOutlined style={{ color: '#999' }} />}
                  placeholder={t('forgotPassword.emailPlaceholder')}
                  style={{ height: 48, borderRadius: 8 }}
                />
              </Form.Item>

              <Form.Item
                name="code"
                rules={[
                  { required: true, message: t('forgotPassword.codeRequired') },
                  { len: 6, message: t('register.codeLen') },
                ]}
              >
                <Input
                  prefix={<SafetyOutlined style={{ color: '#999' }} />}
                  placeholder={t('forgotPassword.codePlaceholder')}
                  maxLength={6}
                  style={{ height: 48, borderRadius: 8 }}
                  addonAfter={
                    <Button
                      type="link"
                      loading={sending}
                      disabled={countdown > 0}
                      onClick={handleSendCode}
                      style={{ padding: 0, height: 'auto', fontSize: 14 }}
                    >
                      {countdown > 0 ? `${countdown}s` : t('forgotPassword.sendCode')}
                    </Button>
                  }
                />
              </Form.Item>

              <Form.Item
                name="password"
                rules={[
                  { required: true, message: t('forgotPassword.newPasswordRequired') },
                  { min: 6, message: t('forgotPassword.newPasswordMin') },
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined style={{ color: '#999' }} />}
                  placeholder={t('forgotPassword.newPasswordPlaceholder')}
                  style={{ height: 48, borderRadius: 8 }}
                />
              </Form.Item>

              <Form.Item
                name="confirmPassword"
                dependencies={['password']}
                rules={[
                  { required: true, message: t('forgotPassword.confirmPasswordRequired') },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('password') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error(t('forgotPassword.passwordMismatch')));
                    },
                  }),
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined style={{ color: '#999' }} />}
                  placeholder={t('forgotPassword.confirmPasswordPlaceholder')}
                  style={{ height: 48, borderRadius: 8 }}
                />
              </Form.Item>

              <Form.Item style={{ marginTop: 24 }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  block
                  style={{
                    height: 48,
                    fontSize: 16,
                    fontWeight: 500,
                    borderRadius: 8,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    border: 'none',
                  }}
                >
                  {t('forgotPassword.confirmBtn')}
                </Button>
              </Form.Item>

              <div style={{ textAlign: 'center', color: '#666', marginTop: 16 }}>
                <a href="/client/login" style={{ color: '#667eea', fontWeight: 500 }}>
                  ← {t('forgotPassword.backToLogin')}
                </a>
              </div>
            </Form>
          </div>
        </div>
      </div>
    </>
  );
};

export default ForgotPassword;

import { useState, useEffect } from 'react';
import { Form, Input, Button, message, Select } from 'antd';
import { LockOutlined, MailOutlined, BankOutlined, MobileOutlined, SafetyOutlined } from '@ant-design/icons';
import { useNavigate } from 'umi';
import { clientAuth, email } from '@/services/api';
import { useI18n } from '../locales/I18nContext';

const LANGS = [
  { label: '中文', value: 'zh-CN', flag: '🇨🇳' },
  { label: 'English', value: 'en-US', flag: '🇺🇸' },
  { label: 'Русский', value: 'ru-RU', flag: '🇷🇺' },
];
const STORAGE_KEY = 'client_locale';

const Register = () => {
  const [loading, setLoading] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const navigate = useNavigate();
  const { t, locale, setLocale } = useI18n();
  const [countdown, setCountdown] = useState(0);
  const [form] = Form.useForm();
  const [salesToken, setSalesToken] = useState('');
  const [channel, setChannel] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('salesToken');
    const ch = params.get('channel');
    if (token) setSalesToken(token);
    if (ch) setChannel(ch);
  }, []);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleSendCode = async () => {
    try {
      const emailValue = await form.validateFields(['email']);
      if (!emailValue.email) {
        message.warning(t('register.pleaseFillEmail'));
        return;
      }
      setSendingCode(true);
      const result = await email.sendCode(emailValue.email);
      message.success(result.message || t('register.codeSent'));
      setCountdown(60);
    } catch (error) {
      if (error.errorFields) return;
      message.error(t('register.sendFailed'));
    } finally {
      setSendingCode(false);
    }
  };

  const handleRegister = async (values) => {
    setLoading(true);
    try {
      await clientAuth.register({
        email: values.email,
        password: values.password,
        name: values.name || '',
        company: values.company,
        phone: values.phone || '',
        code: values.code,
        salesToken,
        channel,
      });
      message.success(t('register.registerSuccess'));
      navigate('/client/login');
    } catch (error) {
      message.error(error.message || t('register.registerFailed'));
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
          <h1 style={{ fontSize: 64, fontWeight: 800, margin: 0, letterSpacing: -1 }}>GenstarPay</h1>
          <p style={{ fontSize: 20, marginTop: 24, opacity: 0.9, lineHeight: 1.6, maxWidth: 480 }}>
            {t('register.brand')}
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
          <div style={{ marginTop: 64, fontSize: 14, opacity: 0.6, maxWidth: 480, lineHeight: 1.8 }}>
            <div>✓ 7×24 小时专业客服</div>
            <div>✓ 资金安全保障</div>
            <div>✓ 一站式跨境支付解决方案</div>
          </div>
        </div>

        {/* 右侧注册表单区域 */}
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
            <h2 style={{ fontSize: 28, fontWeight: 600, color: '#333', marginBottom: 8 }}>{t('register.title')}</h2>
            <p style={{ color: '#999', marginBottom: 32 }}>{t('register.subtitle')}</p>

            <Form form={form} onFinish={handleRegister} layout="vertical" size="large">
              <Form.Item
                name="email"
                rules={[
                  { required: true, message: t('register.emailRequired') },
                  { type: 'email', message: t('register.emailFormat') },
                ]}
              >
                <Input
                  prefix={<MailOutlined style={{ color: '#999' }} />}
                  placeholder={t('register.emailPlaceholder')}
                  style={{ height: 48, borderRadius: 8 }}
                />
              </Form.Item>

              <Form.Item
                name="code"
                rules={[
                  { required: true, message: t('register.codeRequired') },
                  { len: 6, message: t('register.codeLen') },
                ]}
              >
                <Input
                  prefix={<SafetyOutlined style={{ color: '#999' }} />}
                  placeholder={t('register.codePlaceholder')}
                  maxLength={6}
                  style={{ height: 48, borderRadius: 8 }}
                  addonAfter={
                    <Button
                      type="link"
                      loading={sendingCode}
                      disabled={countdown > 0}
                      onClick={handleSendCode}
                      style={{ padding: 0, height: 'auto', fontSize: 14 }}
                    >
                      {countdown > 0 ? `${countdown}${t('register.resendIn')}` : t('register.sendCode')}
                    </Button>
                  }
                />
              </Form.Item>

              <Form.Item
                name="password"
                rules={[
                  { required: true, message: t('register.passwordRequired') },
                  { min: 6, message: t('register.passwordMin') },
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined style={{ color: '#999' }} />}
                  placeholder={t('register.passwordPlaceholder')}
                  style={{ height: 48, borderRadius: 8 }}
                />
              </Form.Item>

              <Form.Item
                name="company"
                rules={[{ required: true, message: t('register.companyRequired') }]}
              >
                <Input
                  prefix={<BankOutlined style={{ color: '#999' }} />}
                  placeholder={t('register.companyPlaceholder')}
                  style={{ height: 48, borderRadius: 8 }}
                />
              </Form.Item>

              <Form.Item name="name">
                <Input
                  prefix={<BankOutlined style={{ color: '#999' }} />}
                  placeholder={t('register.namePlaceholder')}
                  style={{ height: 48, borderRadius: 8 }}
                />
              </Form.Item>

              <Form.Item name="phone">
                <Input
                  prefix={<MobileOutlined style={{ color: '#999' }} />}
                  placeholder={t('register.phonePlaceholder')}
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
                  {t('register.submit')}
                </Button>
              </Form.Item>

              <div style={{ textAlign: 'center', color: '#666', marginTop: 16 }}>
                {t('register.hasAccount')} <a href="/client/login" style={{ color: '#667eea', fontWeight: 500 }}>{t('register.loginLink')}</a>
              </div>
            </Form>
          </div>
        </div>
      </div>
    </>
  );
};

export default Register;

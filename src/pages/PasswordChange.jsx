import { useState } from 'react';
import { Form, Input, Button, message } from 'antd';
import { LockOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate } from 'umi';
import { clientAuth } from '@/services/api';
import { useI18n } from '@/locales/I18nContext';

const PasswordChange = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const { t } = useI18n();

  const handleSubmit = async (values) => {
    if (values.newPassword !== values.confirmPassword) {
      message.error(t('passwordChange.passwordMismatch'));
      return;
    }
    if (values.newPassword.length < 6) {
      message.error(t('passwordChange.newPasswordMin'));
      return;
    }

    setLoading(true);
    try {
      await clientAuth.changePassword({
        oldPassword: values.oldPassword,
        newPassword: values.newPassword,
      });
      message.success(t('passwordChange.successMsg'));
      localStorage.removeItem('clientToken');
      localStorage.removeItem('clientUser');
      setTimeout(() => {
        navigate('/client/login');
      }, 1500);
    } catch (e) {
      // 错误已由拦截器统一处理
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', padding: '40px 60px' }}>
      <div style={{
        maxWidth: 600,
        margin: '0 auto',
        background: '#fff',
        borderRadius: 24,
        padding: '40px 48px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
      }}>
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/client/profile')}
          style={{ color: '#999', padding: '4px 0', marginBottom: 20 }}
        >
          {t('passwordChange.back')}
        </Button>
        <h2 style={{ fontSize: 22, fontWeight: 600, color: '#333', marginBottom: 28 }}>{t('passwordChange.title')}</h2>

        <Form form={form} layout="vertical" onFinish={handleSubmit} size="large">
          <Form.Item
            name="oldPassword"
            label={<span style={{ fontWeight: 500, color: '#333' }}>{t('passwordChange.oldPassword')}</span>}
            rules={[{ required: true, message: t('passwordChange.oldPasswordRequired') }]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: '#999' }} />}
              placeholder={t('passwordChange.oldPasswordPlaceholder')}
              style={{ height: 48, borderRadius: 10 }}
            />
          </Form.Item>

          <Form.Item
            name="newPassword"
            label={<span style={{ fontWeight: 500, color: '#333' }}>{t('passwordChange.newPassword')}</span>}
            rules={[{ required: true, message: t('passwordChange.newPasswordRequired') }, { min: 6, message: t('passwordChange.newPasswordMin') }]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: '#999' }} />}
              placeholder={t('passwordChange.newPasswordPlaceholder')}
              style={{ height: 48, borderRadius: 10 }}
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label={<span style={{ fontWeight: 500, color: '#333' }}>{t('passwordChange.confirmPassword')}</span>}
            rules={[{ required: true, message: t('passwordChange.confirmPasswordRequired') }]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: '#999' }} />}
              placeholder={t('passwordChange.confirmPasswordPlaceholder')}
              style={{ height: 48, borderRadius: 10 }}
            />
          </Form.Item>

          <Form.Item style={{ marginTop: 32 }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              style={{
                height: 48,
                fontSize: 16,
                fontWeight: 500,
                borderRadius: 10,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
              }}
            >
              {t('passwordChange.submitBtn')}
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
};

export default PasswordChange;

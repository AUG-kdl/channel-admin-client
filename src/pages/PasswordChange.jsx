import { useState } from 'react';
import { Form, Input, Button, message } from 'antd';
import { LockOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate } from 'umi';
import { clientAuth } from '@/services/api';

const PasswordChange = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const handleSubmit = async (values) => {
    if (values.newPassword !== values.confirmPassword) {
      message.error('两次输入的密码不一致');
      return;
    }
    if (values.newPassword.length < 6) {
      message.error('新密码至少6位');
      return;
    }

    setLoading(true);
    try {
      await clientAuth.changePassword({
        oldPassword: values.oldPassword,
        newPassword: values.newPassword,
      });
      message.success('密码修改成功，请重新登录');
      localStorage.removeItem('clientToken');
      localStorage.removeItem('clientUser');
      setTimeout(() => {
        navigate('/client/login');
      }, 1500);
    } catch (e) {
      message.error(e.message || '修改失败');
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
          返回
        </Button>
        <h2 style={{ fontSize: 22, fontWeight: 600, color: '#333', marginBottom: 28 }}>修改密码</h2>

        <Form form={form} layout="vertical" onFinish={handleSubmit} size="large">
          <Form.Item
            name="oldPassword"
            label={<span style={{ fontWeight: 500, color: '#333' }}>旧密码</span>}
            rules={[{ required: true, message: '请输入旧密码' }]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: '#999' }} />}
              placeholder="请输入旧密码"
              style={{ height: 48, borderRadius: 10 }}
            />
          </Form.Item>

          <Form.Item
            name="newPassword"
            label={<span style={{ fontWeight: 500, color: '#333' }}>新密码</span>}
            rules={[{ required: true, message: '请输入新密码' }, { min: 6, message: '新密码至少6位' }]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: '#999' }} />}
              placeholder="请输入新密码（至少6位）"
              style={{ height: 48, borderRadius: 10 }}
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label={<span style={{ fontWeight: 500, color: '#333' }}>确认密码</span>}
            rules={[{ required: true, message: '请确认新密码' }]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: '#999' }} />}
              placeholder="请再次输入新密码"
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
              确认修改
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
};

export default PasswordChange;

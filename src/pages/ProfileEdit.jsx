import { useState, useEffect } from 'react';
import { Form, Input, Button, message, Space, Upload, Image } from 'antd';
import { UserOutlined, MailOutlined, BankOutlined, ArrowLeftOutlined, InboxOutlined, FileTextOutlined, DeleteOutlined, DownloadOutlined, CheckCircleOutlined, ClockCircleOutlined, CloseCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'umi';
import { clientAuth, upload } from '@/services/api';
import { useI18n } from '../locales/I18nContext';

const { Dragger } = Upload;

const ProfileEdit = () => {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState({
    businessLicense: [],
    br: [],
    cr: [],
  });
  const user = JSON.parse(localStorage.getItem('clientUser') || '{}');
  const authStatus = user.authStatus || 'pending';
  const authReason = user.authReason || '';

  const AUTH_CONFIG = {
    null: {
      icon: <ExclamationCircleOutlined />,
      bg: '#f0f4ff',
      border: '#c7d2fe',
      color: '#6366f1',
      text: 'nav.authUnsubmitted',
    },
    pending: {
      icon: <ClockCircleOutlined />,
      bg: '#fff7e6',
      border: '#ffd591',
      color: '#fa8c16',
      text: 'nav.authPending',
    },
    approved: {
      icon: <CheckCircleOutlined />,
      bg: '#f0fff4',
      border: '#95de64',
      color: '#52c41a',
      text: 'nav.authApproved',
    },
    rejected: {
      icon: <CloseCircleOutlined />,
      bg: '#fff1f0',
      border: '#ffccc7',
      color: '#f5222d',
      text: 'nav.authRejected',
    },
  };

  const authCfg = AUTH_CONFIG[authStatus] || AUTH_CONFIG.pending;

  useEffect(() => {
    if (user.businessLicense) {
      setFileList(prev => ({ ...prev, businessLicense: [{
        uid: '-1', name: '营业执照', status: 'done', url: user.businessLicense, _uploaded: true,
      }] }));
    }
    if (user.br) {
      setFileList(prev => ({ ...prev, br: [{
        uid: '-2', name: 'BR 商业登记证', status: 'done', url: user.br, _uploaded: true,
      }] }));
    }
    if (user.cr) {
      setFileList(prev => ({ ...prev, cr: [{
        uid: '-3', name: 'CR 公司注册证', status: 'done', url: user.cr, _uploaded: true,
      }] }));
    }
  }, []);

  const handleUpload = async (key, file) => {
    try {
      const res = await upload(file);
      const url = res.data?.url || res.url || (Array.isArray(res.data) ? res.data[0]?.url : null);
      if (url) {
        setFileList(prev => ({ ...prev, [key]: [{
          uid: file.uid || `-${Date.now()}`,
          name: file.name,
          status: 'done',
          url,
          _uploaded: true,
        }] }));
        message.success('上传成功');
      }
    } catch (e) {
      message.error('上传失败：' + (e.message || '请重试'));
    }
  };

  const handleRemove = (key) => {
    setFileList(prev => ({ ...prev, [key]: [] }));
  };

  const isUploaded = (url) => {
    if (!url) return false;
    return url.startsWith('http') || url.startsWith('/');
  };

  const FileUploadCard = ({ keyName, label, required = true, desc }) => {
    const list = fileList[keyName] || [];
    const hasFile = list.length > 0;
    return (
      <div style={{ padding: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: '#333' }}>
            {label} {required && <span style={{ color: '#f5222d' }}>*</span>}
          </div>
          {hasFile && (
            <span style={{ fontSize: 12, color: '#52c41a', background: '#f0fff4', padding: '2px 8px', borderRadius: 10, fontWeight: 500 }}>
              已上传
            </span>
          )}
        </div>
        {desc && <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 8 }}>{desc}</div>}

        {/* 已上传的文件 - 显示图片缩略图 */}
        {hasFile && list[0].url && (
          <div style={{ marginBottom: 8, padding: 8, background: '#f0fff4', border: '1px solid #b7eb8f', borderRadius: 8, position: 'relative' }}>
            <Image src={list[0].url} alt={list[0].name} style={{ width: '100%', maxHeight: 140, objectFit: 'contain', borderRadius: 4 }} />
            <div style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(0,0,0,0.55)', borderRadius: 6, padding: '2px 8px', color: '#fff', fontSize: 12 }}>{list[0].name}</div>
            <DeleteOutlined
              style={{ position: 'absolute', top: 12, left: 12, color: '#f5222d', background: '#fff', padding: 4, borderRadius: 4, cursor: 'pointer' }}
              onClick={() => handleRemove(keyName)}
            />
          </div>
        )}

        {/* 上传控件 - 一直显示（不删除的话也可以再传覆盖） */}
        <Dragger
          name="files"
          multiple={false}
          maxCount={1}
          fileList={[]}
          beforeUpload={(file) => {
            handleUpload(keyName, file);
            return false;
          }}
          showUploadList={false}
          accept=".jpg,.jpeg,.png,.pdf"
          style={{ borderRadius: 8 }}
        >
          <p className="ant-upload-drag-icon">
            <InboxOutlined style={{ color: '#667eea', fontSize: 24 }} />
          </p>
          <p style={{ color: '#667eea', fontSize: 12, margin: 0 }}>点击或拖拽上传（{hasFile ? '将替换' : '单个文件'}）</p>
          <p style={{ color: '#9ca3af', fontSize: 11, margin: '4px 0 0' }}>PDF / 图片</p>
        </Dragger>
      </div>
    );
  };

  const handleSubmit = async (values) => {
    const businessLicense = fileList.businessLicense?.[0]?.url;
    const br = fileList.br?.[0]?.url;
    const cr = fileList.cr?.[0]?.url;

    if (!businessLicense && !(br && cr)) {
      message.error('请上传营业执照，或同时上传BR和CR文件');
      return;
    }

    setLoading(true);
    try {
      const res = await clientAuth.updateProfile({
        name: values.name,
        company: values.company,
        phone: values.phone,
        businessLicense: fileList.businessLicense?.[0]?.url || null,
        br: fileList.br?.[0]?.url || null,
        cr: fileList.cr?.[0]?.url || null,
      });
      // 用后端返回的 authStatus 同步本地（后端会自动判断：改了证照→pending，否则不变）
      const updatedUser = { ...user, ...res.data, name: values.name, company: values.company };
      localStorage.setItem('clientUser', JSON.stringify(updatedUser));
      message.success('保存成功');
      navigate('/client/profile');
    } catch (e) {
      // 错误已由拦截器统一处理
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', padding: '40px 60px' }}>
      <div style={{
        maxWidth: 900,
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
        <h2 style={{ fontSize: 22, fontWeight: 600, color: '#333', marginBottom: 28 }}>编辑资料</h2>

        {/* 认证状态卡片 */}
        <div style={{
          background: authCfg.bg,
          border: `1px solid ${authCfg.border}`,
          borderRadius: 14,
          padding: '16px 20px',
          marginBottom: 28,
          display: 'flex',
          alignItems: authStatus === 'rejected' && authReason ? 'flex-start' : 'center',
          gap: 14,
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: '50%',
            background: '#fff', border: `2px solid ${authCfg.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <span style={{ fontSize: 20, color: authCfg.color }}>{authCfg.icon}</span>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: authStatus === 'rejected' && authReason ? 4 : 0 }}>
              <span style={{ fontSize: 15, fontWeight: 600, color: '#333' }}>{t(authCfg.text)}</span>
            </div>
            {authStatus === 'rejected' && authReason ? (
              <div style={{ fontSize: 13, color: '#cf1322', lineHeight: 1.5 }}>
                <span style={{ fontWeight: 600 }}>{t('nav.authRejectReason') || '拒绝原因'}：</span>
                <span>{authReason}</span>
              </div>
            ) : authStatus === 'pending' ? (
              <div style={{ fontSize: 13, color: '#92400e' }}>审核通常需要 1-2 个工作日，请耐心等待。</div>
            ) : authStatus === 'null' ? (
              <div style={{ fontSize: 13, color: '#4b5563' }}>请上传资质材料完成认证，认证通过后即可使用完整功能。</div>
            ) : null}
          </div>
        </div>

        {/* 个人信息 */}
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#333', marginBottom: 16 }}>个人信息</div>
          <Form form={form} layout="vertical" onFinish={handleSubmit} size="large" initialValues={user}>
            <div style={{ display: 'flex', gap: 24 }}>
              <Form.Item name="name" label={<span style={{ fontWeight: 500, color: '#333' }}>姓名</span>} style={{ flex: 1 }}>
                <Input prefix={<UserOutlined style={{ color: '#999' }} />} placeholder="请输入姓名" style={{ height: 48, borderRadius: 10 }} />
              </Form.Item>
              <Form.Item name="phone" label={<span style={{ fontWeight: 500, color: '#333' }}>手机号</span>} style={{ flex: 1 }}>
                <Input prefix={<span style={{ color: '#999' }}>📱</span>} placeholder="手机号不可修改" style={{ height: 48, borderRadius: 10 }} disabled />
              </Form.Item>
            </div>
            <div style={{ display: 'flex', gap: 24 }}>
              <Form.Item name="email" label={<span style={{ fontWeight: 500, color: '#333' }}>邮箱</span>} style={{ flex: 1 }}>
                <Input prefix={<MailOutlined style={{ color: '#999' }} />} placeholder="请输入邮箱" style={{ height: 48, borderRadius: 10 }} />
              </Form.Item>
              <Form.Item name="company" label={<span style={{ fontWeight: 500, color: '#333' }}>公司名称</span>} style={{ flex: 1 }}>
                <Input prefix={<BankOutlined style={{ color: '#999' }} />} placeholder="请输入公司名称" style={{ height: 48, borderRadius: 10 }} />
              </Form.Item>
            </div>
          </Form>
        </div>

        {/* 资质材料 */}
        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#333', marginBottom: 6 }}>资质材料</div>
          <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 16 }}>请上传以下所有证件：</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16 }}>
            {/* 组 1：营业执照 */}
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#333', marginBottom: 4 }}>{t('profileEdit.businessLicense')} <span style={{ color: '#9ca3af', fontWeight: 400, fontSize: 12 }}>（必传）</span></div>
              <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 12 }}>上传营业执照</div>
              <FileUploadCard keyName="businessLicense" label={t('profileEdit.businessLicense')} desc={t('profileEdit.businessLicenseDesc')} />
            </div>
            {/* 组 2：BR / CR 都要传 */}
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#333', marginBottom: 4 }}>BR / CR <span style={{ color: '#9ca3af', fontWeight: 400, fontSize: 12 }}>（都要传）</span></div>
              <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 12 }}>BR 商业登记证 + CR 公司注册证 都要上传</div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'stretch' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <FileUploadCard keyName="br" label={t('profileEdit.br')} desc={t('profileEdit.businessLicenseDesc')} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <FileUploadCard keyName="cr" label={t('profileEdit.cr')} desc={t('profileEdit.businessLicenseDesc')} />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 32, display: 'flex', justifyContent: 'center', gap: 16, paddingTop: 24, borderTop: '1px dashed #e5e7eb' }}>
          <Button onClick={() => navigate('/client/profile')} style={{ width: 140, height: 48, borderRadius: 24, fontSize: 15 }}>{t('app.cancel')}</Button>
          <Button
            type="primary"
            loading={loading}
            onClick={() => form.submit()}
            style={{ width: 180, height: 48, borderRadius: 24, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', border: 'none', fontSize: 15, fontWeight: 500 }}
          >
            {t('app.submit')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProfileEdit;

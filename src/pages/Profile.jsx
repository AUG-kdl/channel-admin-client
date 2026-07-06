import { useEffect, useState } from 'react';
import { Tabs, Image } from 'antd';
import { UserOutlined, EditOutlined, FilePdfOutlined, CheckCircleOutlined, ClockCircleOutlined, CloseCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'umi';
import { clientAuth } from '@/services/api';
import { useI18n } from '../locales/I18nContext';

const FilePreview = ({ url, label }) => {
  if (!url) return null;
  const ext = url.split('.').pop()?.toLowerCase().split('?')[0];
  const isPdf = ext === 'pdf';
  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(ext);

  if (isImage) {
    return (
      <div style={{ textAlign: 'center' }}>
        <Image
          src={url}
          width={160}
          height={120}
          style={{ objectFit: 'cover', borderRadius: 10, border: '1px solid #e8e8f0', cursor: 'pointer' }}
          preview={{ mask: null }}
        />
        <a href={url} download target="_blank" rel="noreferrer">
          <div style={{ fontSize: 12, color: '#667eea', marginTop: 8 }}>{label}</div>
        </a>
      </div>
    );
  }

  if (isPdf) {
    return (
      <div style={{ textAlign: 'center' }}>
        <a href={url} target="_blank" rel="noreferrer">
          <div style={{
            width: 160, height: 120, background: '#fff1f0', border: '1px solid #ffccc7',
            borderRadius: 10, display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', cursor: 'pointer', color: '#ff4d4f',
          }}>
            <FilePdfOutlined style={{ fontSize: 36, marginBottom: 6 }} />
            <span style={{ fontSize: 12 }}>PDF</span>
          </div>
        </a>
        <a href={url} download>
          <div style={{ fontSize: 12, color: '#667eea', marginTop: 6 }}>{label}</div>
        </a>
      </div>
    );
  }

  return (
    <a href={url} target="_blank" rel="noreferrer" download style={{ display: 'inline-block' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#667eea' }}>
        <span>{label}</span>
      </div>
    </a>
  );
};

const InfoRow = ({ label, value }) => (
  <div style={{ width: '50%', padding: '12px 0', display: 'flex', alignItems: 'flex-start', boxSizing: 'border-box' }}>
    <div style={{ width: 90, fontSize: 13, color: '#9ca3af', flexShrink: 0 }}>{label}</div>
    <div style={{ fontSize: 13, color: '#333', fontWeight: 500, wordBreak: 'break-all' }}>{value || '-'}</div>
  </div>
);

const InfoGrid = ({ children }) => (
  <div style={{ display: 'flex', flexWrap: 'wrap', borderTop: '1px solid #f0f0f0' }}>
    {children}
  </div>
);

const Profile = () => {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('clientUser') || '{}'));

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await clientAuth.me();
        if (res.data) {
          setUser(res.data);
          localStorage.setItem('clientUser', JSON.stringify(res.data));
        }
      } catch (e) {
        // 错误已由拦截器统一处理
      }
    };
    fetchUser();
  }, []);

  const baseInfoTab = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* 用户头像 + 基本信息 */}
      <div style={{ background: '#fff', borderRadius: 16, padding: '28px 32px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <UserOutlined style={{ fontSize: 28, color: '#fff' }} />
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 600, color: '#1a1a2e', marginBottom: 4 }}>{user.name || '用户'}</div>
              <div style={{ fontSize: 13, color: '#9ca3af' }}>{user.company || '公司名称'}</div>
            </div>
          </div>
          <div
            onClick={() => navigate('/client/profile/edit')}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              padding: '8px 18px', borderRadius: 20,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: '#fff', fontSize: 13, fontWeight: 500, cursor: 'pointer',
            }}
          >
            <EditOutlined />
            编辑资料
          </div>
        </div>
        <InfoGrid>
          <InfoRow label="姓名" value={user.name} />
          <InfoRow label={t('profile.phone')} value={user.phone} />
          <InfoRow label={t('profile.email')} value={user.email} />
          <InfoRow label={t('profile.company')} value={user.company} />
          <InfoRow label={t('profile.registerTime')} value="2024-01-15" />
          {/* 认证状态 */}
          <InfoRow label="认证状态" value={
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              {user.authStatus === 'approved' ? (
                <><CheckCircleOutlined style={{ color: '#52c41a', fontSize: 14 }} /><span style={{ color: '#52c41a' }}>{t('nav.authApproved')}</span></>
              ) : user.authStatus === 'pending' ? (
                <><ClockCircleOutlined style={{ color: '#fa8c16', fontSize: 14 }} /><span style={{ color: '#fa8c16' }}>{t('nav.authPending')}</span></>
              ) : user.authStatus === 'rejected' ? (
                <><CloseCircleOutlined style={{ color: '#f5222d', fontSize: 14 }} /><span style={{ color: '#f5222d' }}>{t('nav.authRejected') || '已拒绝'}</span></>
              ) : (
                <><ExclamationCircleOutlined style={{ color: '#6366f1', fontSize: 14 }} /><span style={{ color: '#6366f1' }}>{t('nav.authUnsubmitted') || '未提交'}</span></>
              )}
            </span>
          } />
          {/* 拒绝原因 */}
          {user.authStatus === 'rejected' && user.authReason && (
            <div style={{ width: '100%', padding: '8px 0 4px' }}>
              <div style={{ fontSize: 12, color: '#f5222d', background: '#fff1f0', border: '1px solid #ffccc7', borderRadius: 6, padding: '8px 12px', lineHeight: 1.5 }}>
                <span style={{ fontWeight: 600 }}>{t('nav.authRejectReason') || '拒绝原因'}：</span>{user.authReason}
              </div>
            </div>
          )}
        </InfoGrid>
      </div>

      {/* 证照文件 */}
      {(() => {
        const bl = user.businessLicense;
        const br = user.br;
        const cr = user.cr;
        if (!bl && !br && !cr) {
          return <div style={{ background: '#fff', borderRadius: 16, padding: '24px 32px', color: '#f5222d', fontSize: 13 }}>{t('profile.docNotUploaded')}</div>;
        }
        return (
          <div style={{ background: '#fff', borderRadius: 16, padding: '28px 32px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.04)' }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#1a1a2e', marginBottom: 20 }}>{t('profile.documents')}</div>
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              <FilePreview url={bl} label={t('profile.businessLicense')} />
              <FilePreview url={br} label={t('profile.br')} />
              <FilePreview url={cr} label={t('profile.cr')} />
            </div>
          </div>
        );
      })()}

      {/* 专属销售 */}
      <div style={{ background: '#fff', borderRadius: 16, padding: '28px 32px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.04)' }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: '#1a1a2e', marginBottom: 16 }}>专属销售顾问</div>
        {user.salesName || user.sales?.name ? (
          <InfoGrid>
            <InfoRow label="销售姓名" value={user.salesName || user.sales?.name} />
            <InfoRow label="销售电话" value={user.salesPhone || user.sales?.phone} />
            <InfoRow label="销售邮箱" value={user.salesEmail || user.sales?.email} />
          </InfoGrid>
        ) : (
          <div style={{ color: '#9ca3af', fontSize: 13, padding: '8px 0' }}>暂无专属销售顾问，如有疑问请联系客服</div>
        )}
      </div>
    </div>
  );

  const tabItems = [
    { key: 'base', label: '基础信息', children: baseInfoTab },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg, #f5f7fa 0%, #eceef5 100%)', padding: '32px' }}>
      <div style={{ maxWidth: 860, margin: '0 auto' }}>
        <Tabs defaultActiveKey="base" items={tabItems} tabBarStyle={{ borderBottom: 'none', marginBottom: 0 }} />
      </div>
    </div>
  );
};

export default Profile;

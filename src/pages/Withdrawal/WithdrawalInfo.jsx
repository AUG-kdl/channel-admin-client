import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'umi';
import { Button, Spin, Result, Tag, Card, message } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { withdrawal } from '@/services/api';
import moment from 'moment';
import { useI18n } from '@/locales/I18nContext';

const FileCard = ({ url, name }) => {
  if (!url) return null;
  const ext = url.split('.').pop()?.toLowerCase().split('?')[0];
  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(ext);
  const fileName = name || url.split('/').pop() || '文件';
  const handleDownload = (e) => {
    e.preventDefault();
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 110 }}>
      {isImage ? (
        <img
          src={url}
          style={{ width: 100, height: 80, objectFit: 'cover', borderRadius: 8, border: '1px solid #e8e8f0', cursor: 'pointer' }}
          onClick={() => window.open(url, '_blank')}
        />
      ) : (
        <div
          style={{ width: 100, height: 80, background: '#fff1f0', border: '1px solid #ffccc7', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          onClick={() => window.open(url, '_blank')}
        >
          <span style={{ fontSize: 12, color: '#ff4d4f', fontWeight: 600 }}>PDF</span>
        </div>
      )}
      <span
        style={{ fontSize: 11, color: '#667eea', marginTop: 4, cursor: 'pointer', textAlign: 'center', maxWidth: 110, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
        onClick={handleDownload}
        title={fileName}
      >
        {fileName}
      </span>
    </div>
  );
};

const WithdrawalInfo = () => {
  const { withdrawalId } = useParams();
  const navigate = useNavigate();
  const { t } = useI18n();
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchDetail(); }, [withdrawalId]);

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const res = await withdrawal.detail(withdrawalId);
      if (res.code === 0) setDetail(res.data);
    } catch (e) {
      // 错误已由拦截器统一处理
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: 'calc(100vh - 64px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Spin size="large" tip={t('app.loading')} />
      </div>
    );
  }

  if (!detail) {
    return (
      <div style={{ minHeight: 'calc(100vh - 64px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Result status="error" title={t('withdrawalInfo.notFound')} extra={<Button type="primary" onClick={() => navigate('/client/withdrawal')}>{t('withdrawalInfo.backToList')}</Button>} />
      </div>
    );
  }

  const statusMap = {
    pending_review: { text: 'withdrawalInfo.status_pending_review', color: 'orange' },
    processed: { text: 'withdrawalInfo.status_processed', color: 'blue' },
    confirmed: { text: 'withdrawalInfo.status_confirmed', color: 'purple' },
    uploaded: { text: 'withdrawalInfo.status_uploaded', color: 'blue' },
    completed: { text: 'withdrawalInfo.status_completed', color: 'green' },
  };
  const regionMap = {
    mainland: t('withdrawalInfo.mainland'),
    hk: t('withdrawalInfo.hk'),
  };
  const s = statusMap[detail.status] || {};
  const files = Array.isArray(detail.proofFiles) ? detail.proofFiles : [];

  return (
    <div style={{ minHeight: 'calc(100vh - 64px)', background: 'linear-gradient(160deg, #f5f7fa 0%, #eceef5 100%)', padding: '24px 32px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>

        {/* 顶部导航 */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24, gap: 8 }}>
          <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate('/client/withdrawal')} style={{ color: '#667eea', fontSize: 14 }}>
            {t('withdrawalInfo.back')}
          </Button>
          <span style={{ color: '#d0d0d8' }}>/</span>
          <span style={{ color: '#667eea', fontSize: 14, fontWeight: 500 }}>{t('withdrawalInfo.withdrawal')}</span>
          <span style={{ color: '#d0d0d8' }}>/</span>
          <span style={{ color: '#333', fontSize: 14, fontWeight: 500 }}>{t('withdrawalInfo.detail')}</span>
        </div>

        <Card
          style={{
            borderRadius: 16,
            boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
            border: '1px solid rgba(0,0,0,0.04)',
          }}
          bodyStyle={{ padding: '32px 36px' }}
        >
          {/* 标题区 */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
            <div>
              <div style={{ fontSize: 20, fontWeight: 600, color: '#1a1a2e', marginBottom: 6 }}>{t('withdrawalInfo.title')}</div>
              <div style={{ fontSize: 13, color: '#9ca3af', fontFamily: 'monospace' }}>{detail.withdrawalId}</div>
            </div>
            {s.text && (
              <Tag color={s.color} style={{ fontSize: 14, padding: '4px 12px', borderRadius: 6 }}>
                {t(s.text)}
              </Tag>
            )}
          </div>

          {/* 基本信息 */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#667eea', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 3, height: 14, background: '#667eea', borderRadius: 2 }} />
              {t('withdrawalInfo.basicInfo')}
            </div>
            <div style={{ background: '#f8f9ff', borderRadius: 12, padding: '20px 24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 48px' }}>
                <div style={{ padding: '10px 0', borderBottom: '1px solid #e8e8f0' }}>
                  <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 4 }}>{t('withdrawalInfo.payeeName')}</div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#333' }}>{detail.payeeName}</div>
                </div>
                <div style={{ padding: '10px 0', borderBottom: '1px solid #e8e8f0' }}>
                  <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 4 }}>{t('withdrawalInfo.region')}</div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#333' }}>{regionMap[detail.region] || detail.region}</div>
                </div>
                <div style={{ padding: '10px 0', borderBottom: '1px solid #e8e8f0' }}>
                  <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 4 }}>{t('withdrawalInfo.currency')}</div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#667eea' }}>{detail.currency}</div>
                </div>
                <div style={{ padding: '10px 0', borderBottom: '1px solid #e8e8f0' }}>
                  <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 4 }}>{t('withdrawalInfo.amount')}</div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#667eea' }}>
                    {parseFloat(detail.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                </div>
                {detail.handlingFee != null && (
                  <div style={{ padding: '10px 0', borderBottom: '1px solid #e8e8f0' }}>
                    <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 4 }}>{t('withdrawalInfo.handlingFee')}</div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: '#ff4d4f' }}>
                      {parseFloat(detail.handlingFee).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                )}
                {detail.arrivalAmount != null && (
                  <div style={{ padding: '10px 0', borderBottom: '1px solid #e8e8f0' }}>
                    <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 4 }}>{t('withdrawalInfo.arrivalAmount')}</div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: '#52c41a' }}>
                      {parseFloat(detail.arrivalAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                )}
                <div style={{ padding: '10px 0', borderBottom: '1px solid #e8e8f0' }}>
                  <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 4 }}>{t('withdrawalInfo.subjectType')}</div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#333' }}>{detail.subjectType === 'personal' ? t('withdrawalInfo.personal') : detail.subjectType === 'enterprise' ? t('withdrawalInfo.enterprise') : ''}</div>
                </div>
                <div style={{ padding: '10px 0', borderBottom: '1px solid #e8e8f0' }}>
                  <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 4 }}>{t('withdrawalInfo.applyTime')}</div>
                  <div style={{ fontSize: 15, fontWeight: 500, color: '#333' }}>{detail.createdAt ? moment(detail.createdAt).format('YYYY-MM-DD HH:mm:ss') : '-'}</div>
                </div>
              </div>
              {detail.notes && (
                <div style={{ padding: '10px 0' }}>
                  <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 4 }}>{t('withdrawalInfo.remark')}</div>
                  <div style={{ fontSize: 14, color: '#333' }}>{detail.notes}</div>
                </div>
              )}
            </div>
          </div>

          {/* 收款方信息 */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#667eea', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 3, height: 14, background: '#667eea', borderRadius: 2 }} />
              {t('withdrawalInfo.payeeInfo')}
            </div>
            <div style={{ background: '#f8f9ff', borderRadius: 12, padding: '20px 24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 48px' }}>
                <div style={{ padding: '10px 0', borderBottom: '1px solid #e8e8f0' }}>
                  <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 4 }}>{t('withdrawalInfo.subjectType')}</div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#333' }}>
                    {detail.payeeSnapType === 'personal' ? t('withdrawalInfo.personal') : detail.payeeSnapType === 'enterprise' ? t('withdrawalInfo.enterprise') : '-'}
                  </div>
                </div>
                {detail.payeeSnapType === 'personal' ? (
                  <>
                    <div style={{ padding: '10px 0', borderBottom: '1px solid #e8e8f0' }}>
                      <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 4 }}>{t('withdrawalInfo.payeeName')}</div>
                      <div style={{ fontSize: 15, fontWeight: 600, color: '#333' }}>{detail.payeeSnapName || '-'}</div>
                    </div>
                    <div style={{ padding: '10px 0', borderBottom: '1px solid #e8e8f0' }}>
                      <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 4 }}>{t('withdrawalInfo.payeePhone')}</div>
                      <div style={{ fontSize: 15, fontWeight: 600, color: '#333' }}>{detail.payeeSnapPhone || '-'}</div>
                    </div>
                    <div style={{ padding: '10px 0', borderBottom: '1px solid #e8e8f0' }}>
                      <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 4 }}>{t('withdrawalInfo.idCard')}</div>
                      <div style={{ fontSize: 15, fontWeight: 600, color: '#333' }}>{detail.payeeSnapIdCard || '-'}</div>
                    </div>
                    <div style={{ padding: '10px 0', borderBottom: '1px solid #e8e8f0' }}>
                      <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 4 }}>{t('withdrawalInfo.payeeBankAccount')}</div>
                      <div style={{ fontSize: 15, fontWeight: 600, color: '#333' }}>{detail.payeeSnapBankCard || '-'}</div>
                    </div>
                    <div style={{ padding: '10px 0', borderBottom: '1px solid #e8e8f0' }}>
                      <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 4 }}>{t('withdrawalInfo.payeeBank')}</div>
                      <div style={{ fontSize: 15, fontWeight: 600, color: '#333' }}>{detail.payeeSnapBankBranch || '-'}</div>
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ padding: '10px 0', borderBottom: '1px solid #e8e8f0' }}>
                      <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 4 }}>{t('withdrawalInfo.payeeName')}</div>
                      <div style={{ fontSize: 15, fontWeight: 600, color: '#333' }}>{detail.payeeSnapCompanyName || '-'}</div>
                    </div>
                    <div style={{ padding: '10px 0', borderBottom: '1px solid #e8e8f0' }}>
                      <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 4 }}>{t('withdrawalInfo.payeePhone')}</div>
                      <div style={{ fontSize: 15, fontWeight: 600, color: '#333' }}>{detail.payeeSnapPhone || '-'}</div>
                    </div>
                    <div style={{ padding: '10px 0', borderBottom: '1px solid #e8e8f0' }}>
                      <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 4 }}>{t('withdrawalInfo.payeeBankAccount')}</div>
                      <div style={{ fontSize: 15, fontWeight: 600, color: '#333' }}>{detail.payeeSnapBankAccount || '-'}</div>
                    </div>
                    <div style={{ padding: '10px 0', borderBottom: '1px solid #e8e8f0' }}>
                      <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 4 }}>{t('withdrawalInfo.payeeBank')}</div>
                      <div style={{ fontSize: 15, fontWeight: 600, color: '#333' }}>{detail.payeeSnapBankName || '-'}</div>
                    </div>
                    <div style={{ padding: '10px 0', borderBottom: '1px solid #e8e8f0' }}>
                      <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 4 }}>{t('withdrawalInfo.bankAddress')}</div>
                      <div style={{ fontSize: 15, fontWeight: 600, color: '#333' }}>{detail.payeeSnapBankAddress || '-'}</div>
                    </div>
                    <div style={{ padding: '10px 0', borderBottom: '1px solid #e8e8f0' }}>
                      <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 4 }}>{t('withdrawalInfo.swiftCode')}</div>
                      <div style={{ fontSize: 15, fontWeight: 600, color: '#333' }}>{detail.payeeSnapSwiftCode || '-'}</div>
                    </div>
                    <div style={{ padding: '10px 0', borderBottom: '1px solid #e8e8f0' }}>
                      <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 4 }}>{t('withdrawalInfo.bankCode')}</div>
                      <div style={{ fontSize: 15, fontWeight: 600, color: '#333' }}>{detail.payeeSnapBankCode || '-'}</div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* 水单凭证 */}
          {files.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#667eea', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 3, height: 14, background: '#667eea', borderRadius: 2 }} />
                {t('withdrawalInfo.proofFiles')}（{files.length}{t('withdrawalInfo.proofCount')}）
              </div>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {files.map((f, i) => {
                  const url = typeof f === 'string' ? f : f.url;
                  const name = typeof f === 'object' ? f.name : null;
                  return <FileCard key={i} url={url} name={name} />;
                })}
              </div>
            </div>
          )}

          {/* 底部按钮 */}
          <div style={{ textAlign: 'center', marginTop: 8 }}>
            <Button
              type="primary"
              size="large"
              onClick={() => navigate('/client/withdrawal')}
              style={{ width: 160, height: 48, borderRadius: 12, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', border: 'none', color: '#fff', fontSize: 15 }}
            >
              {t('withdrawalInfo.backToList')}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default WithdrawalInfo;

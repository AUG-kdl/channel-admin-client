import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'umi';
import { Button, Spin, Result, message } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { payee } from '@/services/api';
import { useI18n } from '@/locales/I18nContext';
import moment from 'moment';

const STATUS_MAP = (t) => ({
  pending_review: { text: t('payeeInfo.status_pending_review'), color: '#fa8c16', bg: '#fff7e6' },
  approved:       { text: t('payeeInfo.status_approved'), color: '#52c41a', bg: '#f0fff4' },
  rejected:       { text: t('payeeInfo.status_rejected'), color: '#f5222d', bg: '#fff1f0' },
});

const InfoRow = ({ label, value }) => (
  <div style={{ width: '50%', padding: '14px 0', display: 'flex', alignItems: 'flex-start', boxSizing: 'border-box', borderBottom: '1px solid #f5f5f5' }}>
    <div style={{ width: 100, fontSize: 13, color: '#9ca3af', flexShrink: 0 }}>{label}</div>
    <div style={{ fontSize: 13, color: '#333', fontWeight: 500, wordBreak: 'break-all' }}>{value || '-'}</div>
  </div>
);

const InfoGrid = ({ children }) => (
  <div style={{ display: 'flex', flexWrap: 'wrap', borderTop: '1px solid #f0f0f0' }}>
    {children}
  </div>
);

const Card = ({ title, children }) => (
  <div style={{ background: '#fff', borderRadius: 16, padding: '28px 32px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.04)', marginBottom: 16 }}>
    {title && <div style={{ fontSize: 15, fontWeight: 600, color: '#1a1a2e', marginBottom: 20 }}>{title}</div>}
    {children}
  </div>
);

const ReceivableDetail = () => {
  const { payeeId } = useParams();
  const navigate = useNavigate();
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const { t } = useI18n();

  useEffect(() => { fetchDetail(); }, [payeeId]);

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const res = await payee.list();
      const found = (res.data?.list || []).find(r => r.payeeId === payeeId);
      setDetail(found || null);
    } catch (e) {
      // 错误已由拦截器统一处理
    } finally {
      setLoading(false);
    }
  };

  const statusMap = STATUS_MAP(t);
  const statusInfo = statusMap[detail?.status] || {};

  return (
    <div style={{ minHeight: 'calc(100vh - 64px)', background: 'linear-gradient(160deg, #f5f7fa 0%, #eceef5 100%)', padding: '24px 32px' }}>
      <div style={{ maxWidth: 860, margin: '0 auto' }}>

        {/* 顶部 */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20, gap: 8 }}>
          <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate('/client/receivable')} style={{ color: '#667eea', fontSize: 14 }}>
            {t('payeeInfo.back')}
          </Button>
          <span style={{ color: '#d0d0d8' }}>/</span>
          <span style={{ color: '#667eea', fontSize: 14, fontWeight: 500 }}>{t('payeeInfo.receivable')}</span>
          <span style={{ color: '#d0d0d8' }}>/</span>
          <span style={{ color: '#333', fontSize: 14, fontWeight: 500 }}>{t('payeeInfo.detail')}</span>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><Spin size="large" /></div>
        ) : !detail ? (
          <Result status="error" title={t('payeeInfo.notFound')} subTitle={t('payeeInfo.notFoundDesc') || '该收款人记录不存在或已被删除'} />
        ) : (
          <>
            {/* 概览卡片 */}
            <Card>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                <div>
                  <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 6 }}>{t('payeeInfo.payeeId')}</div>
                  <div style={{ fontFamily: 'monospace', fontSize: 20, fontWeight: 700, color: '#1a1a2e' }}>{detail.payeeId}</div>
                  <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 8 }}>{t('payeeInfo.createdAt')}：{detail.createdAt ? moment(detail.createdAt).format('YYYY-MM-DD HH:mm') : '-'}</div>
                </div>
                <span style={{ background: statusInfo.bg, color: statusInfo.color, padding: '8px 20px', borderRadius: 12, fontSize: 14, fontWeight: 600 }}>
                  {statusInfo.text}
                </span>
              </div>
              <div style={{ background: '#f8f9ff', borderRadius: 12, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 13, color: '#9ca3af' }}>{t('payeeInfo.type')}</span>
                <span style={{ background: detail.type === 'personal' ? '#e6f7ff' : '#f9f0ff', color: detail.type === 'personal' ? '#1890ff' : '#722ed1', padding: '4px 14px', borderRadius: 12, fontSize: 13, fontWeight: 600 }}>
                  {detail.type === 'personal' ? t('payeeInfo.personal') : t('payeeInfo.enterprise')}
                </span>
              </div>
            </Card>

            {/* 基本信息 */}
            <Card title={t('payeeInfo.basicInfo')}>
              <InfoGrid>
                {detail.type === 'personal' ? (
                  <>
                    <InfoRow label={t('payeeInfo.name')} value={detail.name} />
                    <InfoRow label={t('payeeInfo.phone')} value={detail.phone} />
                    <InfoRow label={t('payeeInfo.idCard')} value={detail.idCard} />
                    <InfoRow label={t('payeeInfo.bankCard')} value={detail.bankCard} />
                    <InfoRow label={t('payeeInfo.bankBranch')} value={detail.bankBranch} />
                  </>
                ) : (
                  <>
                    <InfoRow label={t('payeeInfo.companyName')} value={detail.companyName} />
                    <InfoRow label={t('payeeInfo.phone')} value={detail.phone} />
                    <InfoRow label={t('payeeInfo.bankAccount')} value={detail.bankAccount} />
                    <InfoRow label={t('payeeInfo.bankName')} value={detail.bankName} />
                    <InfoRow label={t('payeeInfo.bankAddress')} value={detail.bankAddress} />
                    <InfoRow label={t('payeeInfo.swiftCode')} value={detail.swiftCode} />
                    <InfoRow label={t('payeeInfo.bankCode')} value={detail.bankCode} />
                  </>
                )}
                {detail.notes && <InfoRow label={t('payeeInfo.notes')} value={detail.notes} />}
              </InfoGrid>
            </Card>

            {/* 拒绝原因 */}
            {detail.rejectReason && (
              <Card title={t('payeeInfo.rejectReason')}>
                <div style={{ background: '#fff1f0', borderRadius: 8, padding: '14px 18px', color: '#f5222d', fontSize: 14, border: '1px solid #ffccc7' }}>
                  {detail.rejectReason}
                </div>
              </Card>
            )}

            {/* 底部按钮 */}
            <div style={{ textAlign: 'center', marginTop: 8 }}>
              <Button onClick={() => navigate('/client/receivable')} style={{ height: 40, borderRadius: 8, width: 140, fontSize: 14 }}>
                {t('payeeInfo.backToList')}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ReceivableDetail;

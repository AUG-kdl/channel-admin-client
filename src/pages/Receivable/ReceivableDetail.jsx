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

const Section = ({ title, children }) => (
  <div style={{ marginBottom: 40 }}>
    <div style={{ fontSize: 12, color: '#667eea', fontWeight: 600, marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1 }}>{title}</div>
    {children}
  </div>
);

const FieldGrid = ({ children }) => (
  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0 32px' }}>
    {children}
  </div>
);

const FieldItem = ({ label, children, span }) => (
  <div style={{ gridColumn: span ? `span ${span}` : undefined, padding: '14px 0', borderBottom: '1px solid #f5f5f5', display: 'flex', alignItems: 'baseline', gap: 8 }}>
    <span style={{ color: '#9ca3af', fontSize: 13, flexShrink: 0 }}>{label}</span>
    <span style={{ fontSize: 14, fontWeight: 500, color: '#333', wordBreak: 'break-all', flex: 1 }}>{children}</span>
  </div>
);

const Card = ({ children }) => (
  <div style={{ background: '#fff', borderRadius: 16, padding: '32px 36px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.04)', marginBottom: 16 }}>
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
          <Result status="error" title={t('payeeInfo.notFound')} subTitle={t('payeeInfo.notFoundDesc')} />
        ) : (
          <>
            <Card>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
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

            <Card>
              <Section title={t('payeeInfo.basicInfo')}>
                <FieldGrid>
                  {detail.type === 'personal' ? (
                    <>
                      <FieldItem label={t('payeeInfo.name')}>{detail.name || '-'}</FieldItem>
                      <FieldItem label={t('payeeInfo.phone')}>{detail.phone || '-'}</FieldItem>
                      <FieldItem label={t('payeeInfo.idCard')}>{detail.idCard || '-'}</FieldItem>
                      <FieldItem label={t('payeeInfo.bankCard')}>{detail.bankCard || '-'}</FieldItem>
                      <FieldItem label={t('payeeInfo.bankBranch')}>{detail.bankBranch || '-'}</FieldItem>
                    </>
                  ) : (
                    <>
                      <FieldItem label={t('payeeInfo.companyName')}>{detail.companyName || '-'}</FieldItem>
                      <FieldItem label={t('payeeInfo.phone')}>{detail.phone || '-'}</FieldItem>
                      <FieldItem label={t('payeeInfo.bankAccount')}>{detail.bankAccount || '-'}</FieldItem>
                      <FieldItem label={t('payeeInfo.bankName')}>{detail.bankName || '-'}</FieldItem>
                      <FieldItem label={t('payeeInfo.bankAddress')}>{detail.bankAddress || '-'}</FieldItem>
                      <FieldItem label={t('payeeInfo.swiftCode')}>{detail.swiftCode || '-'}</FieldItem>
                      <FieldItem label={t('payeeInfo.bankCode')}>{detail.bankCode || '-'}</FieldItem>
                    </>
                  )}
                  <FieldItem label={t('payeeInfo.notes')}>{detail.notes || '-'}</FieldItem>
                  {detail.rejectReason && <FieldItem label={t('payeeInfo.reason')}>{detail.rejectReason}</FieldItem>}
                </FieldGrid>
              </Section>

              {detail.rejectReason && (
                <Section title={t('payeeInfo.rejectReason')}>
                  <div style={{ background: '#fff1f0', borderRadius: 8, padding: '14px 18px', color: '#f5222d', fontSize: 14, border: '1px solid #ffccc7' }}>
                    {detail.rejectReason}
                  </div>
                </Section>
              )}
            </Card>

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

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'umi';
import { Button, Image, Spin, Result, message } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { deposit } from '@/services/api';
import moment from 'moment';
import { useI18n } from '../../locales/I18nContext';

const STATUS_MAP = (t) => ({
  pending_review: { text: t('depositDetail.status_pending_review'), color: '#fa8c16', bg: '#fff7e6' },
  approved:       { text: t('depositDetail.status_approved'), color: '#52c41a', bg: '#f0fff4' },
  rejected:       { text: t('depositDetail.status_rejected'), color: '#f5222d', bg: '#fff1f0' },
});

const Section = ({ title, children }) => (
  <div style={{ marginBottom: 36 }}>
    <div style={{ fontSize: 12, color: '#667eea', fontWeight: 600, marginBottom: 14, textTransform: 'uppercase', letterSpacing: 1 }}>{title}</div>
    {children}
  </div>
);

const FieldGrid = ({ children }) => (
  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0 32px' }}>
    {children}
  </div>
);

const FieldItem = ({ label, children, span }) => (
  <div style={{ gridColumn: span ? `span ${span}` : undefined, padding: '10px 0', borderBottom: '1px solid #f5f5f5', display: 'flex', alignItems: 'baseline', gap: 8 }}>
    <span style={{ color: '#9ca3af', fontSize: 13, flexShrink: 0 }}>{label}</span>
    <span style={{ fontSize: 14, fontWeight: 500, color: '#333', wordBreak: 'break-all', flex: 1 }}>{children}</span>
  </div>
);

const Card = ({ children }) => (
  <div style={{ background: '#fff', borderRadius: 16, padding: '32px 36px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.04)' }}>
    {children}
  </div>
);

const DepositDetail = () => {
  const { orderNo } = useParams();
  const navigate = useNavigate();
  const { t } = useI18n();
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchDetail(); }, [orderNo]);

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const res = await deposit.detail(orderNo);
      if (res.code === 0) setDetail(res.data);
    } catch (e) {
      // 错误已由拦截器统一处理
    } finally {
      setLoading(false);
    }
  };

  const status = detail?.status;
  const statusInfo = STATUS_MAP(t)[status] || {};
  const dash = '—';

  return (
    <div style={{ minHeight: 'calc(100vh - 64px)', background: 'linear-gradient(160deg, #f5f7fa 0%, #eceef5 100%)', padding: '24px 32px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>

        {/* 顶部导航 */}
        <div style={{ marginBottom: 20 }}>
          <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate('/client/deposit')} style={{ color: '#667eea', fontSize: 14, padding: 0 }}>
            {t('depositDetail.back')}
          </Button>
        </div>

        {/* 状态标签 */}
        {status && (
          <div style={{ marginBottom: 16 }}>
            <span style={{
              display: 'inline-block',
              padding: '4px 16px',
              borderRadius: 20,
              fontSize: 13,
              fontWeight: 500,
              color: statusInfo.color,
              background: statusInfo.bg,
              border: `1px solid ${statusInfo.color}30`,
            }}>
              {statusInfo.text}
            </span>
          </div>
        )}

        <Spin spinning={loading}>
          {detail ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <Card>
                <Section title={t('depositDetail.basicInfo')}>
                  <FieldGrid>
                    <FieldItem label={t('depositDetail.orderNo')}>{detail.orderNo || dash}</FieldItem>
                    <FieldItem label={t('depositDetail.amount')}>{detail.amount || dash}</FieldItem>
                    <FieldItem label={t('depositDetail.currency')}>{detail.currency || dash}</FieldItem>
                    <FieldItem label={t('depositDetail.status2')}>{statusInfo.text || dash}</FieldItem>
                    <FieldItem label={t('depositDetail.createdAt')}>
                      {detail.createdAt ? moment(detail.createdAt).format('YYYY-MM-DD HH:mm') : dash}
                    </FieldItem>
                    <FieldItem label={t('depositDetail.updatedAt')}>
                      {detail.updatedAt ? moment(detail.updatedAt).format('YYYY-MM-DD HH:mm') : dash}
                    </FieldItem>
                  </FieldGrid>
                </Section>

                <Section title={t('depositDetail.payerInfo')}>
                  <FieldGrid>
                    <FieldItem label={t('depositDetail.payerName')}>{detail.payerName || dash}</FieldItem>
                    <FieldItem label={t('depositDetail.payerBank')}>{detail.payerBank || dash}</FieldItem>
                    <FieldItem label={t('depositDetail.payerAccount')}>{detail.payerAccount || dash}</FieldItem>
                  </FieldGrid>
                </Section>

                {/* 入金凭证 */}
                <Section title={t('depositDetail.proof')}>
                  {(() => {
                    try {
                      let imgs = detail.images;
                      if (typeof imgs === 'string') imgs = JSON.parse(imgs);
                      if (!Array.isArray(imgs) || imgs.length === 0) {
                        return <span style={{ color: '#d0d0d0', fontSize: 14 }}>{t('depositDetail.noFile')}</span>;
                      }
                      return (
                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                          {imgs.map((img, i) => {
                            const url = typeof img === 'string' ? img : img.url;
                            return <Image key={i} src={url} width={90} height={90} style={{ objectFit: 'cover', borderRadius: 8, border: '1px solid #eee' }} />;
                          })}
                        </div>
                      );
                    } catch {
                      return <span style={{ color: '#d0d0d0', fontSize: 14 }}>{t('depositDetail.noFile')}</span>;
                    }
                  })()}
                </Section>

                {/* 备注 / 拒绝原因 */}
                {status === 'rejected' && detail.notes && (
                  <Section title={t('depositDetail.rejectReason')}>
                    <div style={{ background: '#fff1f0', border: '1px solid #ffa39e', borderRadius: 8, padding: '12px 16px', color: '#cf1322', fontSize: 14 }}>
                      {detail.notes}
                    </div>
                  </Section>
                )}
                {status !== 'rejected' && detail.notes && (
                  <Section title={t('depositDetail.notes')}>
                    <div style={{ color: '#333', fontSize: 14 }}>{detail.notes}</div>
                  </Section>
                )}
              </Card>
            </div>
          ) : (
            <Result status="warning" title={t('depositDetail.notFound')} />
          )}
        </Spin>
      </div>
    </div>
  );
};

export default DepositDetail;

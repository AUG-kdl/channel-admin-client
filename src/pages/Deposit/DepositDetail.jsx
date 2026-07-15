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

        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16, gap: 8 }}>
          <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate('/client/deposit')} style={{ color: '#667eea', fontSize: 14 }}>
            {t('depositDetail.back')}
          </Button>
          <span style={{ color: '#d0d0d8' }}>/</span>
          <span style={{ color: '#667eea', fontSize: 14, fontWeight: 500 }}>{t('depositList.title')}</span>
          <span style={{ color: '#d0d0d8' }}>/</span>
          <span style={{ color: '#333', fontSize: 14, fontWeight: 500 }}>{t('depositDetail.title')}</span>
        </div>

        <Spin spinning={loading}>
          {detail ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <Card>
                <Section title={t('depositDetail.basicInfo')}>
                  <FieldGrid>
                    <FieldItem label={t('depositDetail.orderNo')}>{detail.orderNo || dash}</FieldItem>
                    <FieldItem label={t('depositDetail.amount')}>{detail.fromAmount || dash}</FieldItem>
                    <FieldItem label={t('depositDetail.currency')}>{detail.fromCurrency || dash}</FieldItem>
                    <FieldItem label={t('depositDetail.bankCard')}>{detail.bankCard || dash}</FieldItem>
                    <FieldItem label={t('depositDetail.bankBranch')}>{detail.bankBranch || dash}</FieldItem>
                    <FieldItem label={t('depositDetail.bankAddress')}>{detail.bankAddress || dash}</FieldItem>
                    <FieldItem label={t('depositDetail.status2')}>
                      <span style={{
                        display: 'inline-block',
                        padding: '2px 12px',
                        borderRadius: 12,
                        fontSize: 12,
                        fontWeight: 500,
                        color: statusInfo.color,
                        background: statusInfo.bg,
                      }}>
                        {statusInfo.text || dash}
                      </span>
                    </FieldItem>
                    <FieldItem label={t('depositDetail.createdAt')}>
                      {detail.createdAt ? moment(detail.createdAt).format('YYYY-MM-DD HH:mm') : dash}
                    </FieldItem>
                    <FieldItem label={t('depositDetail.updatedAt')}>
                      {detail.updatedAt ? moment(detail.updatedAt).format('YYYY-MM-DD HH:mm') : dash}
                    </FieldItem>
                    <FieldItem label={t('depositDetail.notes') || '备注'}>{detail.notes || dash}</FieldItem>
                    <FieldItem label={t('depositDetail.reason') || '审核备注'}>{detail.reason || dash}</FieldItem>
                  </FieldGrid>
                </Section>

                {/* Deposit Proof */}
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
                            const name = typeof img === 'object' ? (img.name || url.split('/').pop() || `凭证${i + 1}`) : url.split('/').pop();
                            return (
                              <div key={i} style={{ textAlign: 'center' }}>
                                <Image src={url} width={90} height={90} style={{ objectFit: 'cover', borderRadius: 8, border: '1px solid #eee', display: 'block' }} />
                                <a href={url} download={name} target="_blank" rel="noopener noreferrer"
                                  style={{ display: 'block', marginTop: 4, fontSize: 11, color: '#1677ff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 90 }}>
                                  {name}
                                </a>
                              </div>
                            );
                          })}
                        </div>
                      );
                    } catch {
                      return <span style={{ color: '#d0d0d0', fontSize: 14 }}>{t('depositDetail.noFile')}</span>;
                    }
                  })()}
                </Section>

                {/* Attached Files */}
                {(() => {
                  const parseJson = (val) => {
                    if (!val) return [];
                    if (typeof val === 'string') {
                      try { return JSON.parse(val); } catch { return []; }
                    }
                    return Array.isArray(val) ? val : [];
                  };

                  const renderFiles = (field, label) => {
                    const list = parseJson(field);
                    if (!list.length) return null;
                    return (
                      <div style={{ marginBottom: 16 }}>
                        <div style={{ fontSize: 13, color: '#9ca3af', marginBottom: 8 }}>{label}</div>
                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                          {list.map((item, i) => {
                            const url = typeof item === 'string' ? item : item.url;
                            const name = typeof item === 'object' ? (item.name || url.split('/').pop() || `${t('depositDetail.file') || '文件'}${i + 1}`) : url.split('/').pop();
                            const isImg = /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(url);
                            return (
                              <div key={i} style={{ textAlign: 'center' }}>
                                {isImg
                                  ? <Image src={url} width={90} height={90} style={{ objectFit: 'cover', borderRadius: 8, border: '1px solid #eee', display: 'block' }} />
                                  : <div style={{ width: 90, height: 90, borderRadius: 8, border: '1px solid #eee', background: '#fafafa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><img src="/pdf-icon.png" alt="" style={{ width: 40, height: 40 }} /></div>
                                }
                                <a href={url} download={name} target="_blank" rel="noopener noreferrer"
                                  style={{ display: 'block', marginTop: 4, fontSize: 11, color: '#1677ff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 90 }}>
                                  {name}
                                </a>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  };

                  const hasTrade = parseJson(detail.tradeContract).length > 0;
                  const hasAgree = parseJson(detail.agreementFile).length > 0;
                  const hasLogistics = parseJson(detail.logisticsFile).length > 0;

                  if (!hasTrade && !hasAgree && !hasLogistics) return null;

                  return (
                    <Section title={t('depositDetail.proof')}>
                      <>{renderFiles(detail.tradeContract, t('depositApply.tradeContract'))}{renderFiles(detail.agreementFile, t('depositApply.tradeAgreement'))}{renderFiles(detail.logisticsFile, t('depositApply.logisticsInfo'))}</>
                    </Section>
                  );
                })()}

                <div style={{ textAlign: 'center', marginTop: 8 }}>
                  <Button
                    type="primary"
                    onClick={() => navigate('/client/deposit')}
                    style={{ width: 160, height: 44, borderRadius: 12, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', border: 'none', boxShadow: '0 4px 12px rgba(102,126,234,0.3)' }}
                  >
                    {t('depositDetail.back')}
                  </Button>
                </div>
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

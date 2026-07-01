import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'umi';
import { Button, Spin, Result, Descriptions, Tag, Card, message } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { exchange } from '@/services/api';
import moment from 'moment';
import { useI18n } from '@/locales/I18nContext';

const STATUS_MAP = {
  pending_review: { text: 'status_pending_review', color: 'orange' },
  confirmed: { text: 'status_confirmed', color: 'blue' },
  approved: { text: 'status_approved', color: 'green' },
};

const ExchangeInfo = () => {
  const { exchangeId } = useParams();
  const navigate = useNavigate();
  const { t } = useI18n();
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchDetail(); }, [exchangeId]);

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const res = await exchange.detail(exchangeId);
      if (res.code === 0) setDetail(res.data);
    } catch (e) {
      message.error(e.message || t('exchangeInfo.loadFailed'));
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
        <Result status="error" title={t('exchangeInfo.notFound')} extra={<Button type="primary" onClick={() => navigate('/client/exchange')}>{t('exchangeInfo.backToList')}</Button>} />
      </div>
    );
  }

  const statusKey = STATUS_MAP[detail.status]?.text;
  const statusColor = STATUS_MAP[detail.status]?.color;

  return (
    <div style={{ minHeight: 'calc(100vh - 64px)', background: 'linear-gradient(160deg, #f5f7fa 0%, #eceef5 100%)', padding: '24px 32px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>

        {/* 顶部导航 */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24, gap: 8 }}>
          <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate('/client/exchange')} style={{ color: '#667eea', fontSize: 14 }}>
            {t('exchangeInfo.back')}
          </Button>
          <span style={{ color: '#d0d0d8' }}>/</span>
          <span style={{ color: '#667eea', fontSize: 14, fontWeight: 500 }}>{t('exchangeInfo.exchange')}</span>
          <span style={{ color: '#d0d0d8' }}>/</span>
          <span style={{ color: '#333', fontSize: 14, fontWeight: 500 }}>{t('exchangeInfo.detail')}</span>
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
              <div style={{ fontSize: 20, fontWeight: 600, color: '#1a1a2e', marginBottom: 6 }}>{t('exchangeInfo.title')}</div>
              <div style={{ fontSize: 13, color: '#9ca3af', fontFamily: 'monospace' }}>{detail.exchangeId}</div>
            </div>
            {statusKey && (
              <Tag color={statusColor} style={{ fontSize: 14, padding: '4px 12px', borderRadius: 6 }}>
                {t(`exchangeInfo.${statusKey}`)}
              </Tag>
            )}
          </div>

          {/* 基本信息 */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#667eea', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 3, height: 14, background: '#667eea', borderRadius: 2 }} />
              {t('exchangeInfo.basicInfo')}
            </div>
            <div style={{ background: '#f8f9ff', borderRadius: 12, padding: '20px 24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 48px' }}>
                <div style={{ padding: '10px 0', borderBottom: '1px solid #e8e8f0' }}>
                  <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 4 }}>{t('exchangeInfo.fromCurrency')}</div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#333' }}>{detail.fromCurrency}</div>
                </div>
                <div style={{ padding: '10px 0', borderBottom: '1px solid #e8e8f0' }}>
                  <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 4 }}>{t('exchangeInfo.toCurrency')}</div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#333' }}>{detail.toCurrency}</div>
                </div>
                <div style={{ padding: '10px 0', borderBottom: '1px solid #e8e8f0' }}>
                  <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 4 }}>{t('exchangeInfo.fromAmount')}</div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#333' }}>{detail.fromAmount}</div>
                </div>
                <div style={{ padding: '10px 0', borderBottom: '1px solid #e8e8f0' }}>
                  <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 4 }}>{t('exchangeInfo.toAmount')}</div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#52c41a' }}>{detail.toAmount || '-'}</div>
                </div>
                {detail.exchangeRate && (
                  <div style={{ padding: '10px 0', borderBottom: '1px solid #e8e8f0' }}>
                    <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 4 }}>{t('exchangeInfo.exchangeRate')}</div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: '#667eea' }}>{detail.exchangeRate}</div>
                  </div>
                )}
                <div style={{ padding: '10px 0', borderBottom: '1px solid #e8e8f0' }}>
                  <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 4 }}>{t('exchangeInfo.applyTime')}</div>
                  <div style={{ fontSize: 15, fontWeight: 500, color: '#333' }}>{detail.createdAt ? moment(detail.createdAt).format('YYYY-MM-DD HH:mm:ss') : '-'}</div>
                </div>
                {detail.customerConfirmAt && (
                  <div style={{ padding: '10px 0', borderBottom: '1px solid #e8e8f0' }}>
                    <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 4 }}>{t('exchangeInfo.confirmTime')}</div>
                    <div style={{ fontSize: 15, fontWeight: 500, color: '#333' }}>{moment(detail.customerConfirmAt).format('YYYY-MM-DD HH:mm:ss')}</div>
                  </div>
                )}
              </div>
              {detail.notes && (
                <div style={{ padding: '10px 0' }}>
                  <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 4 }}>{t('exchangeInfo.remark')}</div>
                  <div style={{ fontSize: 14, color: '#333' }}>{detail.notes}</div>
                </div>
              )}
            </div>
          </div>

          {/* 底部按钮 */}
          <div style={{ textAlign: 'center', marginTop: 8 }}>
            <Button type="primary" size="large" onClick={() => navigate('/client/exchange')} style={{ width: 160, height: 48, borderRadius: 12, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', border: 'none', color: '#fff', fontSize: 15 }}>
              {t('exchangeInfo.backToList')}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ExchangeInfo;

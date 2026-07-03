import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'umi';
import { Button, Spin, Result, Steps, Modal, message } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { exchange } from '@/services/api';
import { useI18n } from '../../locales/I18nContext';

const FieldBox = ({ label, value }) => (
  <div style={{ padding: '8px 0', borderBottom: '1px solid #e8e8f0' }}>
    <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 14, fontWeight: 600, color: '#333' }}>{value}</div>
  </div>
);

const ExchangeDetail = () => {
  const { exchangeId } = useParams();
  const navigate = useNavigate();
  const { t } = useI18n();
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetchDetail(); }, [exchangeId]);

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const res = await exchange.detail(exchangeId);
      if (res.code === 0) setDetail(res.data);
    } catch (e) {
      // 错误已由拦截器统一处理
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    Modal.confirm({
      title: t('exchangeDetail.confirmTitle'),
      content: <div style={{ color: '#f5222d' }}><b>此操作不可逆！</b><br />{t('exchangeDetail.confirmContent')}</div>,
      okText: t('exchangeDetail.okConfirm'),
      cancelText: t('app.cancel'),
      onOk: async () => {
        try {
          setSubmitting(true);
          await exchange.confirm(exchangeId);
          message.success(t('exchangeDetail.exchangeSuccess'));
          fetchDetail();
        } catch (e) {
          // 错误已由拦截器统一处理
        } finally {
          setSubmitting(false);
        }
      },
    });
  };

  if (loading) {
    return <div style={{ minHeight: 'calc(100vh - 64px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Spin size="large" tip={t('exchangeDetail.loading')} /></div>;
  }

  if (!detail) {
    return (
      <div style={{ minHeight: 'calc(100vh - 64px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Result status="error" title={t('exchangeDetail.notFound')} extra={<Button type="primary" onClick={() => navigate('/client/exchange')}>{t('exchangeDetail.backToList')}</Button>} />
      </div>
    );
  }

  const Card = ({ children }) => (
    <div style={{ background: '#fff', borderRadius: 16, padding: '32px 36px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.04)', marginBottom: 16 }}>
      {children}
    </div>
  );

  return (
    <div style={{ minHeight: 'calc(100vh - 64px)', background: 'linear-gradient(160deg, #f5f7fa 0%, #eceef5 100%)', padding: '24px 32px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>

        {/* 顶部 */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20, gap: 8 }}>
          <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate('/client/exchange')} style={{ color: '#667eea', fontSize: 14 }}>
            {t('exchangeDetail.back')}
          </Button>
          <span style={{ color: '#d0d0d8' }}>/</span>
          <span style={{ color: '#667eea', fontSize: 14, fontWeight: 500 }}>{t('exchangeDetail.exchange')}</span>
          <span style={{ color: '#d0d0d8' }}>/</span>
          <span style={{ color: '#333', fontSize: 14, fontWeight: 500 }}>{t('exchangeDetail.title')}</span>
        </div>

        {/* 步骤条 */}
        <Card>
          {detail.status === 'approved' ? (
            <Steps current={1} status="finish" items={[
              { title: t('exchangeDetail.confirmExchange') },
              { title: t('exchangeDetail.complete') },
            ]} />
          ) : (
            <Steps current={0} items={[
              { title: t('exchangeDetail.confirmExchange') },
              { title: t('exchangeDetail.complete') },
            ]} />
          )}
        </Card>

        {/* 待客户确认 */}
        {detail.status === 'confirmed' && (
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#52c41a' }} />
              <span style={{ fontSize: 14, fontWeight: 600, color: '#1a1a2e' }}>{t('exchangeDetail.waitConfirm')}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0 32px', marginBottom: 20 }}>
              <FieldBox label={t('exchangeDetail.exchangeNo')} value={<span style={{ color: '#667eea' }}>{detail.exchangeId}</span>} />
              <FieldBox label={t('exchangeDetail.fromAmount')} value={`${detail.fromAmount} ${detail.fromCurrency}`} />
              <FieldBox label={t('exchangeDetail.fromCurrency')} value={detail.fromCurrency} />
              <FieldBox label={t('exchangeDetail.rate')} value={<span style={{ color: '#667eea' }}>{detail.exchangeRate}</span>} />
              <FieldBox label={t('exchangeDetail.toAmount')} value={<span style={{ color: '#52c41a' }}>{detail.toAmount} {detail.toCurrency}</span>} />
              <FieldBox label={t('exchangeDetail.toCurrency')} value={detail.toCurrency} />
            </div>
            <div style={{ background: '#fff7e6', borderLeft: '3px solid #fa8c16', padding: '12px 16px', borderRadius: 8, marginBottom: 16, color: '#874d00', fontSize: 13 }}>
              {t('exchangeDetail.checkAmount')}
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <Button type="primary" size="large" onClick={handleConfirm} loading={submitting}
                style={{ width: 160, height: 48, borderRadius: 12, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', border: 'none', color: '#fff', fontSize: 15 }}>
                {t('exchangeDetail.confirmExchange')}
              </Button>
            </div>
          </Card>
        )}

        {/* 待处理 */}
        {detail.status === 'pending_review' && (
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#667eea' }} />
              <span style={{ fontSize: 14, fontWeight: 600, color: '#1a1a2e' }}>{t('exchangeDetail.waitAdmin')}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0 32px', marginBottom: 20 }}>
              <FieldBox label={t('exchangeDetail.exchangeNo')} value={<span style={{ color: '#667eea' }}>{detail.exchangeId}</span>} />
              <FieldBox label={t('exchangeDetail.fromAmount')} value={`${detail.fromAmount} ${detail.fromCurrency}`} />
              <FieldBox label={t('exchangeDetail.toCurrency')} value={detail.toCurrency} />
              <FieldBox label={t('exchangeDetail.fromCurrency')} value={detail.fromCurrency} />
            </div>
            <div style={{ textAlign: 'center', color: '#9ca3af', fontSize: 13, marginBottom: 16 }}>{t('exchangeDetail.waitRate')}</div>
          </Card>
        )}

        {/* 已完成 */}
        {detail.status === 'approved' && (
          <Card>
            <Result
              status="success"
              title={t('exchangeDetail.exchangeComplete')}
              subTitle={`已成功将 ${detail.fromAmount} ${detail.fromCurrency} 换为 ${detail.toAmount} ${detail.toCurrency}`}
              extra={<Button type="primary" onClick={() => navigate('/client/exchange')} style={{ borderRadius: 12 }}>{t('exchangeDetail.backToList')}</Button>}
            />
          </Card>
        )}

      </div>
    </div>
  );
};

export default ExchangeDetail;

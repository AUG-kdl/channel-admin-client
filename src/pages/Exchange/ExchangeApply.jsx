import { useState, useEffect } from 'react';
import { useNavigate } from 'umi';
import { Form, Select, Input, Button, message, Alert } from 'antd';
import { SwapOutlined, ClockCircleOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { exchange, wallet } from '@/services/api';
import { useI18n } from '../../locales/I18nContext';

const ExchangeApply = () => {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [fromCurrency, setFromCurrency] = useState('USD');
  const [toCurrency, setToCurrency] = useState('CNH');
  const [balances, setBalances] = useState({});

  // 检查时间（北京时间 15:00-20:00）
  const checkTime = () => {
    const now = new Date();
    const utc8Hour = (now.getUTCHours() + 8) % 24;
    return utc8Hour >= 15 && utc8Hour < 20;
  };

  useEffect(() => {
    // 加载钱包
    wallet.getMy().then(res => {
      const b = {};
      (res.data || []).forEach(item => { b[item.currency] = parseFloat(item.balance); });
      setBalances(b);
      // 默认填满源币种余额
      const defaultAmt = b[fromCurrency] || 0;
      form.setFieldsValue({ fromAmount: String(defaultAmt) });
    }).catch(() => {});
  }, []);

  const handleSubmit = async () => {
    if (!checkTime()) {
      message.error(t('exchangeApply.timeLimit'));
      return;
    }
    try {
      const values = await form.validateFields();
      const user = JSON.parse(localStorage.getItem('clientUser') || '{}');
      setSubmitting(true);
      try {
        const res = await exchange.create({
          fromCurrency: values.fromCurrency,
          toCurrency: values.toCurrency,
          fromAmount: values.fromAmount,
          notes: values.remark,
          channel: user.channel,
          salesToken: user.salesToken,
        });
        message.success(t('exchangeApply.success'));
        setTimeout(() => navigate('/client/exchange'), 1000);
      } catch (error) {
        message.error(error.message || t('exchangeApply.failed'));
      } finally {
        setSubmitting(false);
      }
    } catch (error) {
      console.error(t('exchangeApply.validateFailed') + ':', error);
    }
  };

  const inTimeWindow = checkTime();

  return (
    <div style={{ minHeight: 'calc(100vh - 64px)', background: 'linear-gradient(160deg, #f5f7fa 0%, #eceef5 100%)', padding: '24px 32px' }}>
      <div style={{ width: '80%', maxWidth: 750, margin: '0 auto' }}>

        {/* 顶部 */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20, gap: 8 }}>
          <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate('/client/exchange')} style={{ color: '#667eea', fontSize: 14 }}>
            {t('exchangeApply.back')}
          </Button>
          <span style={{ color: '#d0d0d8' }}>/</span>
          <span style={{ color: '#667eea', fontSize: 14, fontWeight: 500 }}>{t('exchangeApply.exchange')}</span>
          <span style={{ color: '#d0d0d8' }}>/</span>
          <span style={{ color: '#333', fontSize: 14, fontWeight: 500 }}>{t('exchangeApply.apply')}</span>
        </div>

        {/* 头部 */}
        <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: 16, padding: '24px 28px', marginBottom: 20, color: '#fff', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -30, right: -30, width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
          <div style={{ position: 'absolute', bottom: -40, right: 80, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
          <h1 style={{ fontSize: 24, fontWeight: 600, margin: 0, marginBottom: 6, position: 'relative' }}>{t('exchangeApply.title')}</h1>
          <div style={{ fontSize: 13, opacity: 0.85, position: 'relative' }}>
            <ClockCircleOutlined style={{ marginRight: 4 }} />
            {t('exchangeApply.checkTimeNote')}
          </div>
        </div>

        {/* 内容区 */}
        <div style={{ background: '#fff', borderRadius: 16, padding: '32px 40px', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
          {!inTimeWindow && (
            <Alert
              type="warning"
              showIcon
              message={t('exchangeApply.title')}
              description={t('exchangeApply.outOfTimeNote')}
              style={{ marginBottom: 20 }}
            />
          )}
          <Form form={form} layout="horizontal" onFinish={handleSubmit} labelAlign="right" labelCol={{ span: 5 }} wrapperCol={{ span: 17 }}>
            <Form.Item label={t('exchangeApply.fromCurrency')} name="fromCurrency" rules={[{ required: true, message: t('exchangeApply.fromCurrencySelect') }]} initialValue="USD">
              <Select size="large" onChange={val => {
                setFromCurrency(val);
                form.setFieldsValue({ fromAmount: String(balances[val] || 0) });
              }} options={[
                { value: 'USD', label: `USD ${t('home.currencyUSD')}` },
                { value: 'CNY', label: `CNY ${t('home.currencyCNY')}` },
                { value: 'CNH', label: `CNH ${t('home.currencyCNH')}` },
                { value: 'RUB', label: `RUB ${t('home.currencyRUB')}` },
              ]} />
            </Form.Item>

            <Form.Item label={t('exchangeApply.fromAmount')} name="fromAmount" rules={[{ required: true, message: t('exchangeApply.fromAmountInput') }]}>
              <Input
                size="large"
                readOnly
                style={{ background: '#f5f5f5', cursor: 'not-allowed' }}
              />
            </Form.Item>

            <Form.Item label={t('exchangeApply.toCurrency')} name="toCurrency" rules={[{ required: true, message: t('exchangeApply.toCurrencySelect') }]} initialValue="CNH">
              <Select size="large" onChange={setToCurrency} options={[
                { value: 'USD', label: `USD ${t('home.currencyUSD')}` },
                { value: 'CNY', label: `CNY ${t('home.currencyCNY')}` },
                { value: 'CNH', label: `CNH ${t('home.currencyCNH')}` },
                { value: 'RUB', label: `RUB ${t('home.currencyRUB')}` },
              ]} />
            </Form.Item>

            <Form.Item label={t('exchangeApply.remark')} name="remark">
              <Input.TextArea placeholder={t('exchangeApply.remarkPlaceholder')} maxLength={200} showCount style={{ minHeight: 100 }} />
            </Form.Item>

            <div style={{ background: '#f5f3ff', borderLeft: '3px solid #667eea', padding: '16px 20px', borderRadius: 8, marginBottom: 16, color: '#4b5563', fontSize: 14, lineHeight: 1.7 }}>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>{t('exchangeApply.processNote')}</div>
              <div>{t('exchangeApply.processStep1')}</div>
              <div>{t('exchangeApply.processStep2')}</div>
              <div>{t('exchangeApply.processStep3')}</div>
            </div>

            <Form.Item wrapperCol={{ span: 24 }} style={{ textAlign: 'center', marginTop: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 16 }}>
                <Button size="large" onClick={() => navigate('/client/exchange')} style={{ width: 140, height: 52, borderRadius: 12, border: '1px solid #d9d9d9', fontSize: 16, color: '#333', background: '#fff' }}>{t('exchangeApply.cancel')}</Button>
                <Button type="primary" size="large" htmlType="submit" loading={submitting} disabled={!inTimeWindow} style={{
                  width: 200, height: 52, borderRadius: 12, color: '#fff',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', border: 'none', fontSize: 16,
                }}>{t('exchangeApply.submit')}</Button>
              </div>
            </Form.Item>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default ExchangeApply;

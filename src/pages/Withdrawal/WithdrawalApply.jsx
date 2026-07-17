import { useState, useEffect } from 'react';
import { useNavigate } from 'umi';
import { Form, Input, Select, Radio, Button, message, Card, Spin } from 'antd';
import { ArrowLeftOutlined, PlusOutlined } from '@ant-design/icons';
import { withdrawal, payee, wallet } from '@/services/api';
import { useI18n } from '../../locales/I18nContext';

const WithdrawalApply = () => {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [payees, setPayees] = useState([]);
  const [payeeType, setPayeeType] = useState('personal');
  const [selectedPayee, setSelectedPayee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [balances, setBalances] = useState({});
  const [selectedCurrency, setSelectedCurrency] = useState('CNY');

  useEffect(() => {
    const load = async () => {
      try {
        const [payeeRes, walletRes] = await Promise.all([
          payee.list({ status: 'approved', pageSize: 1000 }),
          wallet.getMy(),
        ]);
        setPayees(payeeRes.data?.list || []);
        // 解析钱包余额
        const b = {};
        (walletRes.data || []).forEach(item => { b[item.currency] = parseFloat(item.balance || 0); });
        setBalances(b);
      } catch (e) {
        // 错误已由拦截器统一处理
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSubmit = async (values) => {
    setSubmitting(true);
    try {
      const user = JSON.parse(localStorage.getItem('clientUser') || '{}');
      const selected = payees.find(p => p.payeeId === values.payeeId);
      await withdrawal.create({
        ...values,
        payeeName: selected?.type === 'personal' ? selected.name : selected.companyName,
        payeeType: selected?.type,
        channel: user.channel,
        salesToken: user.salesToken,
      });
      message.success(t('withdrawalApply.success'));
      navigate('/client/withdrawal');
    } catch (e) {
      // 错误已由拦截器统一处理
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: 'calc(100vh - 64px)', background: 'linear-gradient(160deg, #f5f7fa 0%, #eceef5 100%)', padding: '24px 32px' }}>
      <div style={{ width: '80%', maxWidth: 750, margin: '0 auto' }}>

        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20, gap: 8 }}>
          <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate('/client/withdrawal')} style={{ color: '#667eea', fontSize: 14 }}>
            {t('withdrawalApply.back')}
          </Button>
          <span style={{ color: '#d0d0d8' }}>/</span>
          <span style={{ color: '#667eea', fontSize: 14, fontWeight: 500 }}>{t('withdrawalApply.withdrawal')}</span>
          <span style={{ color: '#d0d0d8' }}>/</span>
          <span style={{ color: '#333', fontSize: 14, fontWeight: 500 }}>{t('withdrawalApply.apply')}</span>
        </div>

        <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: 16, padding: '24px 28px', marginBottom: 20, color: '#fff', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -30, right: -30, width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
          <div style={{ position: 'absolute', bottom: -40, right: 80, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
          <h1 style={{ fontSize: 24, fontWeight: 600, margin: 0, marginBottom: 6, position: 'relative' }}>{t('withdrawalApply.title')}</h1>
          <div style={{ fontSize: 13, opacity: 0.85, position: 'relative' }}>{t('withdrawalApply.subtitle')}</div>
        </div>

        <Card style={{ borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.04)' }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spin size="large" /></div>
          ) : (
            <Form form={form} layout="horizontal" labelCol={{ span: 6 }} wrapperCol={{ span: 16 }} onFinish={handleSubmit} initialValues={{ region: 'mainland', subjectType: 'personal', currency: 'CNY' }} style={{ marginTop: 8 }}>
              <style>{`
                .ant-form-item .ant-form-item-label > label {
                  white-space: normal;
                  word-break: break-word;
                  line-height: 1.4;
                }
              `}</style>
              <Form.Item label={t('withdrawalApply.region')} name="region" rules={[{ required: true }]}>
                <Radio.Group>
                  <Radio value="mainland">{t('withdrawalApply.mainland')}</Radio>
                  <Radio value="hk">{t('withdrawalApply.hk')}</Radio>
                  <Radio value="overseas">{t('withdrawalApply.overseas')}</Radio>
                </Radio.Group>
              </Form.Item>

              <Form.Item label={t('withdrawalApply.subjectType')} name="subjectType" rules={[{ required: true }]}>
                <Radio.Group onChange={e => { setPayeeType(e.target.value); setSelectedPayee(null); form.setFieldsValue({ payeeId: undefined }); }}>
                  <Radio value="personal">{t('withdrawalApply.personal')}</Radio>
                  <Radio value="enterprise">{t('withdrawalApply.enterprise')}</Radio>
                </Radio.Group>
              </Form.Item>

              <Form.Item label={t('withdrawalApply.payeeAccount')} required>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Form.Item name="payeeId" noStyle rules={[{ required: true, message: t('withdrawalApply.selectPayee') }]}>
                    <Select
                      placeholder={t('withdrawalApply.selectPayee')}
                      size="large"
                      showSearch
                      allowClear
                      optionFilterProp="label"
                      style={{ flex: 1 }}
                      onChange={(val) => {
                        if (!val) { setSelectedPayee(null); return; }
                        const p = payees.find(x => x.payeeId === val);
                        setSelectedPayee(p || null);
                      }}
                      options={payees.filter(p => p.type === payeeType).map(p => ({
                        value: p.payeeId,
                        label: p.type === 'personal' ? p.name : p.companyName,
                      }))}
                    />
                  </Form.Item>
                  <Button
                    size="large"
                    icon={<PlusOutlined />}
                    onClick={() => navigate('/client/receivable/apply')}
                    style={{
                      borderRadius: 8,
                      height: 40,
                      fontSize: 14,
                      fontWeight: 500,
                      border: '1px dashed #667eea',
                      color: '#667eea',
                      background: '#fff',
                    }}
                  >
                    {t('withdrawalApply.addPayee')}
                  </Button>
                </div>
                {selectedPayee && (
                  <div style={{ background: '#f0f4ff', border: '1px solid #dde3f5', borderRadius: 10, padding: '14px 18px', marginTop: 8, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 24px' }}>
                    {selectedPayee.type === 'personal' ? (
                      <>
                        <div><div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 2 }}>{t('withdrawalApply.labelName')}</div><div style={{ fontSize: 13, fontWeight: 600, color: '#333' }}>{selectedPayee.name || '-'}</div></div>
                        <div><div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 2 }}>{t('withdrawalApply.labelPayeeId')}</div><div style={{ fontSize: 13, fontWeight: 600, color: '#667eea', fontFamily: 'monospace' }}>{selectedPayee.payeeId}</div></div>
                        <div><div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 2 }}>{t('payeeApply.phone')}</div><div style={{ fontSize: 13, fontWeight: 500, color: '#333' }}>{selectedPayee.phone || '-'}</div></div>
                        <div><div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 2 }}>{t('payeeApply.idCard')}</div><div style={{ fontSize: 13, fontWeight: 500, color: '#333', fontFamily: 'monospace' }}>{selectedPayee.idCard || '-'}</div></div>
                        <div style={{ gridColumn: '1 / -1' }}><div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 2 }}>{t('withdrawalApply.labelBankBranch')}</div><div style={{ fontSize: 13, fontWeight: 500, color: '#333' }}>{selectedPayee.bankBranch || '-'}</div></div>
                        <div style={{ gridColumn: '1 / -1' }}><div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 2 }}>{t('withdrawalApply.labelBankCard')}</div><div style={{ fontSize: 13, fontWeight: 600, color: '#333', fontFamily: 'monospace' }}>{selectedPayee.bankCard || '-'}</div></div>
                      </>
                    ) : (
                      <>
                        <div><div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 2 }}>{t('withdrawalApply.labelCompanyName')}</div><div style={{ fontSize: 13, fontWeight: 600, color: '#333' }}>{selectedPayee.companyName || '-'}</div></div>
                        <div><div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 2 }}>{t('withdrawalApply.labelPayeeId')}</div><div style={{ fontSize: 13, fontWeight: 600, color: '#667eea', fontFamily: 'monospace' }}>{selectedPayee.payeeId}</div></div>
                        <div><div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 2 }}>{t('withdrawalApply.labelBankName')}</div><div style={{ fontSize: 13, fontWeight: 500, color: '#333' }}>{selectedPayee.bankName || '-'}</div></div>
                        <div><div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 2 }}>{t('withdrawalApply.labelBankAccount')}</div><div style={{ fontSize: 13, fontWeight: 600, color: '#333', fontFamily: 'monospace' }}>{selectedPayee.bankAccount || '-'}</div></div>
                        <div><div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 2 }}>{t('payeeApply.swiftCode')}</div><div style={{ fontSize: 13, fontWeight: 500, color: '#333', fontFamily: 'monospace' }}>{selectedPayee.swiftCode || '-'}</div></div>
                        <div><div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 2 }}>{t('payeeApply.bankCode')}</div><div style={{ fontSize: 13, fontWeight: 500, color: '#333', fontFamily: 'monospace' }}>{selectedPayee.bankCode || '-'}</div></div>
                        <div style={{ gridColumn: 'span 2' }}><div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 2 }}>{t('payeeApply.bankAddress')}</div><div style={{ fontSize: 13, fontWeight: 500, color: '#333' }}>{selectedPayee.bankAddress || '-'}</div></div>
                      </>
                    )}
                  </div>
                )}
              </Form.Item>

              <Form.Item label={t('withdrawalApply.currency')} name="currency" rules={[{ required: true, message: t('withdrawalApply.currencyRequired') }]}>
                <Select
                  size="large"
                  allowClear
                  placeholder={t('withdrawalApply.currencySelect')}
                  onChange={(val) => { setSelectedCurrency(val); form.setFieldsValue({ amount: undefined }); }}
                  options={[
                    { value: 'CNY', label: `CNY ${t('home.currencyCNY')}` },
                    { value: 'USD', label: `USD ${t('home.currencyUSD')}` },
                    { value: 'CNH', label: `CNH ${t('home.currencyCNH')}` },
                    { value: 'RUB', label: `RUB ${t('home.currencyRUB')}` },
                  ]}
                />
              </Form.Item>
              {selectedCurrency && (
                <div style={{ background: '#f0fff4', border: '1px solid #b7eb8f', borderRadius: 10, padding: '12px 18px', marginBottom: 16, width: '64%', marginLeft: '25%' }}>
                  <div style={{ fontSize: 12, color: '#52c41a', marginBottom: 2 }}>{t('withdrawalApply.availableAmount')}</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#52c41a' }}>
                    {balances[selectedCurrency] != null
                      ? balances[selectedCurrency].toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                      : '—'} {selectedCurrency}
                  </div>
                </div>
              )}

              <Form.Item label={t('withdrawalApply.amount')} name="amount" rules={[
                { required: true, message: t('withdrawalApply.amountPlaceholder') },
                { pattern: /^[0-9]*\.?[0-9]*$/, message: t('withdrawalApply.amountFormatError') },
                {
                  validator: (_, value) => {
                    if (!value || !selectedCurrency) return Promise.resolve();
                    const balance = balances[selectedCurrency] || 0;
                    if (parseFloat(value) > balance) {
                      return Promise.reject(t('withdrawalApply.amountExceedBalance', {
                        amount: balances[selectedCurrency].toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
                        currency: selectedCurrency,
                      }));
                    }
                    return Promise.resolve();
                  },
                },
              ]}>
                <Input
                  size="large"
                  placeholder={t('withdrawalApply.amountPlaceholder')}
                  style={{ borderRadius: 8 }}
                />
              </Form.Item>

              <Form.Item label={t('withdrawalApply.remark')} name="notes">
                <Input.TextArea placeholder={t('withdrawalApply.remarkPlaceholder')} rows={3} allowClear style={{ borderRadius: 8 }} />
              </Form.Item>

              <div style={{ display: 'flex', gap: 16, marginTop: 32, justifyContent: 'center' }}>
                <Button
                  onClick={() => navigate('/client/withdrawal')}
                  size="large"
                  style={{ height: 48, borderRadius: 12, width: 180, fontSize: 15 }}
                >
                  {t('withdrawalApply.cancel')}
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={submitting}
                  size="large"
                  style={{ height: 48, borderRadius: 12, width: 180, fontSize: 15, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', border: 'none', boxShadow: '0 4px 12px rgba(102,126,234,0.3)' }}
                >
                  {t('withdrawalApply.submit')}
                </Button>
              </div>
            </Form>
          )}
        </Card>
      </div>
    </div>
  );
};

export default WithdrawalApply;

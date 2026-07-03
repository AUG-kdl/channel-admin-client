import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'umi';
import { Form, Input, Radio, Button, message, Card } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { payee } from '@/services/api';
import { useI18n } from '../../locales/I18nContext';

const PayeeApply = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useI18n();
  const [form] = Form.useForm();
  const [payeeType, setPayeeType] = useState('personal');
  const [loading, setLoading] = useState(false);
  const [editRecord, setEditRecord] = useState(null);

  useEffect(() => {
    if (location.state?.record) {
      setEditRecord(location.state.record);
      form.setFieldsValue(location.state.record);
      setPayeeType(location.state.record.type);
    }
  }, [location.state, form]);

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem('clientUser') || '{}');
      const payload = { ...values, type: payeeType, channel: user.channel, salesToken: user.salesToken };
      if (editRecord) {
        await payee.update(editRecord.payeeId, payload);
        message.success(t('app.success'));
      } else {
        await payee.create(payload);
        message.success(t('app.success'));
      }
      navigate('/client/receivable');
    } catch (e) {
      // 错误已由拦截器统一处理
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: 'calc(100vh - 64px)', background: 'linear-gradient(160deg, #f5f7fa 0%, #eceef5 100%)', padding: '24px 32px' }}>
      <div style={{ width: '80%', maxWidth: 750, margin: '0 auto' }}>

        {/* 顶部 */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20, gap: 8 }}>
          <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate('/client/receivable')} style={{ color: '#667eea', fontSize: 14 }}>
            {t('payeeApply.back')}
          </Button>
          <span style={{ color: '#d0d0d8' }}>/</span>
          <span style={{ color: '#667eea', fontSize: 14, fontWeight: 500 }}>{t('payeeApply.payee')}</span>
          <span style={{ color: '#d0d0d8' }}>/</span>
          <span style={{ color: '#333', fontSize: 14, fontWeight: 500 }}>{editRecord ? t('payeeApply.edit') : t('payeeApply.apply')}</span>
        </div>

        <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: 16, padding: '24px 28px', marginBottom: 20, color: '#fff', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -30, right: -30, width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
          <div style={{ position: 'absolute', bottom: -40, right: 80, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
          <h1 style={{ fontSize: 24, fontWeight: 600, margin: 0, marginBottom: 6, position: 'relative' }}>{editRecord ? t('payeeApply.editTitle') : t('payeeApply.title')}</h1>
          <div style={{ fontSize: 13, opacity: 0.85, position: 'relative' }}>{t('payeeApply.subtitle')}</div>
        </div>

        <Card style={{ borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.04)' }}>
          <Form form={form} layout="horizontal" labelCol={{ span: 5 }} wrapperCol={{ span: 16 }} onFinish={handleSubmit} initialValues={{ type: 'personal' }} style={{ marginTop: 8 }}>
            <Form.Item label={t('payeeApply.type')} name="type" rules={[{ required: true, message: t('payeeApply.type') }]}>
              <Radio.Group onChange={e => setPayeeType(e.target.value)}>
                <Radio value="personal">{t('payeeApply.personal')}</Radio>
                <Radio value="enterprise">{t('payeeApply.enterprise')}</Radio>
              </Radio.Group>
            </Form.Item>

            {payeeType === 'personal' ? (
              <>
                <Form.Item label={t('payeeApply.name')} name="name" rules={[{ required: true, message: t('payeeApply.nameRequired') }]}>
                  <Input size="large" placeholder={t('payeeApply.namePlaceholder')} allowClear style={{ borderRadius: 8 }} />
                </Form.Item>
                <Form.Item label={t('payeeApply.phone')} name="phone">
                  <Input size="large" placeholder={t('payeeApply.phonePlaceholder')} allowClear style={{ borderRadius: 8 }} />
                </Form.Item>
                <Form.Item label={t('payeeApply.idCard')} name="idCard">
                  <Input size="large" placeholder={t('payeeApply.idCardPlaceholder')} allowClear style={{ borderRadius: 8 }} />
                </Form.Item>
                <Form.Item label={t('payeeApply.bankCard')} name="bankCard" rules={[{ required: true, message: t('payeeApply.bankCardRequired') }]}>
                  <Input size="large" placeholder={t('payeeApply.bankCardPlaceholder')} allowClear style={{ borderRadius: 8 }} />
                </Form.Item>
                <Form.Item label={t('payeeApply.bankBranch')} name="bankBranch" rules={[{ required: true, message: t('payeeApply.bankBranchRequired') }]}>
                  <Input size="large" placeholder={t('payeeApply.bankBranchPlaceholder')} allowClear style={{ borderRadius: 8 }} />
                </Form.Item>
              </>
            ) : (
              <>
                <Form.Item label={t('payeeApply.companyName')} name="companyName" rules={[{ required: true, message: t('payeeApply.companyNameRequired') }]}>
                  <Input size="large" placeholder={t('payeeApply.companyNamePlaceholder')} allowClear style={{ borderRadius: 8 }} />
                </Form.Item>
                <Form.Item label={t('payeeApply.bankAccount')} name="bankAccount" rules={[{ required: true, message: t('payeeApply.bankAccountRequired') }]}>
                  <Input size="large" placeholder={t('payeeApply.bankAccountPlaceholder')} allowClear style={{ borderRadius: 8 }} />
                </Form.Item>
                <Form.Item label={t('payeeApply.bankName')} name="bankName" rules={[{ required: true, message: t('payeeApply.bankNameRequired') }]}>
                  <Input size="large" placeholder={t('payeeApply.bankNamePlaceholder')} allowClear style={{ borderRadius: 8 }} />
                </Form.Item>
                <Form.Item label={t('payeeApply.bankAddress')} name="bankAddress">
                  <Input size="large" placeholder={t('payeeApply.bankAddressPlaceholder')} allowClear style={{ borderRadius: 8 }} />
                </Form.Item>
                <Form.Item label={t('payeeApply.swiftCode')} name="swiftCode">
                  <Input size="large" placeholder={t('payeeApply.swiftCodePlaceholder')} allowClear style={{ borderRadius: 8 }} />
                </Form.Item>
                <Form.Item label={t('payeeApply.bankCode')} name="bankCode">
                  <Input size="large" placeholder={t('payeeApply.bankCodePlaceholder')} allowClear style={{ borderRadius: 8 }} />
                </Form.Item>
              </>
            )}

            <Form.Item label={t('payeeApply.remark')} name="notes">
              <Input.TextArea placeholder={t('payeeApply.remarkPlaceholder')} rows={3} allowClear style={{ borderRadius: 8 }} />
            </Form.Item>

            <Form.Item wrapperCol={{ span: 24 }} style={{ marginTop: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 16 }}>
                <Button size="large" onClick={() => navigate('/client/receivable')} style={{ width: 160, height: 52, borderRadius: 12, fontSize: 15 }}>
                  {t('payeeApply.cancel')}
                </Button>
                <Button type="primary" size="large" htmlType="submit" loading={loading} style={{ width: 180, height: 52, borderRadius: 12, fontSize: 15, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', border: 'none' }}>
                  {t('payeeApply.submit')}
                </Button>
              </div>
            </Form.Item>
          </Form>
        </Card>
      </div>
    </div>
  );
};

export default PayeeApply;

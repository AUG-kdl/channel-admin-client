import { useEffect, useState } from 'react';
import { Modal, Form, Input, Radio, message } from 'antd';
import { payee } from '@/services/api';
import { useI18n } from '@/locales/I18nContext';

const PayeeModal = ({ visible, record, onSuccess, onCancel }) => {
  const [form] = Form.useForm();
  const isEdit = !!record;
  const payeeType = Form.useWatch('type', form) || record?.type || 'personal';
  const [loading, setLoading] = useState(false);
  const { t } = useI18n();

  useEffect(() => {
    if (visible && record) {
      form.setFieldsValue(record);
    } else if (visible) {
      form.resetFields();
      form.setFieldsValue({ type: 'personal' });
    }
  }, [visible, record]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      let res;
      if (isEdit) {
        res = await payee.update(record.payeeId, values);
      } else {
        res = await payee.create(values);
      }
      message.success(isEdit ? t('payeeInfo.success') : t('payeeInfo.success'));
      onSuccess?.();
    } catch (err) {
      if (err.errorFields) return;
      // 错误已由拦截器统一处理
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={visible}
      title={isEdit ? t('payeeInfo.editPayee') : t('payeeInfo.addPayee')}
      onCancel={onCancel}
      onOk={handleSubmit}
      okText={t('payeeInfo.save')}
      cancelText={t('payeeInfo.cancel')}
      width={520}
      confirmLoading={loading}
      destroyOnClose
    >
      <Form form={form} layout="vertical" initialValues={{ type: 'personal' }}>
        <Form.Item label={t('payeeInfo.typeLabel')} name="type" rules={[{ required: true, message: t('payeeInfo.nameRequired') }]}>
          <Radio.Group>
            <Radio value="personal">{t('payeeInfo.personal')}</Radio>
            <Radio value="enterprise">{t('payeeInfo.enterprise')}</Radio>
          </Radio.Group>
        </Form.Item>

        {payeeType === 'personal' ? (
          <>
            <Form.Item label={t('payeeInfo.name')} name="name" rules={[{ required: true, message: t('payeeInfo.nameRequired') }]}>
              <Input placeholder={t('payeeApply.namePlaceholder')} />
            </Form.Item>
            <Form.Item label={t('payeeInfo.phone')} name="phone">
              <Input placeholder={t('payeeApply.phonePlaceholder')} />
            </Form.Item>
            <Form.Item label={t('payeeInfo.idCard')} name="idCard">
              <Input placeholder={t('payeeApply.idCardPlaceholder')} />
            </Form.Item>
            <Form.Item label={t('payeeInfo.bankCard')} name="bankCard" rules={[{ required: true, message: t('payeeInfo.bankCardRequired') }]}>
              <Input placeholder={t('payeeApply.bankCardPlaceholder')} />
            </Form.Item>
            <Form.Item label={t('payeeInfo.bankBranch')} name="bankBranch" rules={[{ required: true, message: t('payeeInfo.bankBranchRequired') }]}>
              <Input placeholder={t('payeeApply.bankBranchPlaceholder')} />
            </Form.Item>
          </>
        ) : (
          <>
            <Form.Item label={t('payeeInfo.companyName')} name="companyName" rules={[{ required: true, message: t('payeeInfo.companyNameRequired') }]}>
              <Input placeholder={t('payeeApply.companyNamePlaceholder')} />
            </Form.Item>
            <Form.Item label={t('payeeInfo.bankAccount')} name="bankAccount" rules={[{ required: true, message: t('payeeInfo.bankAccountRequired') }]}>
              <Input placeholder={t('payeeApply.bankAccountPlaceholder')} />
            </Form.Item>
            <Form.Item label={t('payeeInfo.bankName')} name="bankName" rules={[{ required: true, message: t('payeeInfo.bankNameRequired') }]}>
              <Input placeholder={t('payeeApply.bankNamePlaceholder')} />
            </Form.Item>
            <Form.Item label={t('payeeInfo.bankAddress')} name="bankAddress">
              <Input placeholder={t('payeeApply.bankAddressPlaceholder')} />
            </Form.Item>
            <Form.Item label={t('payeeInfo.swiftCode')} name="swiftCode">
              <Input placeholder={t('payeeApply.swiftCodePlaceholder')} />
            </Form.Item>
            <Form.Item label={t('payeeInfo.bankCode')} name="bankCode">
              <Input placeholder={t('payeeApply.bankCodePlaceholder')} />
            </Form.Item>
          </>
        )}

        <Form.Item label={t('payeeInfo.notes')} name="notes">
          <Input.TextArea placeholder={t('payeeApply.remarkPlaceholder')} rows={3} />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default PayeeModal;

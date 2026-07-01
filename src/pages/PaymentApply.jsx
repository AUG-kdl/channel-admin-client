import { useState } from 'react';
import { useNavigate } from 'umi';
import { Form, Input, Select, Button, message } from 'antd';
import { DollarOutlined } from '@ant-design/icons';
import { withdrawal } from '@/services/api';

const PaymentApply = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const handleCancel = () => {
    navigate('/client/payment');
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      try {
        await withdrawal.create({
          fromCurrency: values.fromCurrency,
          fromAmount: values.fromAmount,
          accountName: values.accountName,
          bankBranch: values.bankBranch,
          bankAddress: values.bankAddress,
          bankCard: values.bankCard,
          remark: values.remark,
        });
        message.success('付款申请已提交，请等待审核');
        setTimeout(() => navigate('/client/payment'), 1000);
      } catch (error) {
        message.error(error.message || '提交失败');
      } finally {
        setSubmitting(false);
      }
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  return (
    <div style={{ minHeight: 'calc(100vh - 64px)', background: 'linear-gradient(160deg, #f5f7fa 0%, #eceef5 100%)', padding: '24px 32px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>

        {/* 顶部品牌区 */}
        <div style={{ width: 1000, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: 20, padding: '24px 32px', display: 'flex', alignItems: 'center', gap: 16, boxSizing: 'border-box', flexShrink: 0 }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <DollarOutlined style={{ fontSize: 24, color: '#fff' }} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, color: '#fff', fontWeight: 600 }}>申请付款</h1>
            <p style={{ margin: '8px 0 0', color: 'rgba(255,255,255,0.85)', fontSize: 14 }}>请如实填写付款信息，提交后由销售确认</p>
          </div>
        </div>

        {/* 表单卡片 */}
        <div style={{ width: 1000, background: '#fff', borderRadius: 20, padding: '40px 56px', boxShadow: '0 4px 24px rgba(0,0,0,0.06)', boxSizing: 'border-box', flexShrink: 0 }}>
          <Form form={form} layout="horizontal" onFinish={handleSubmit} labelAlign="left" colon={false} style={{ width: '100%', display: 'block' }}>

            <Form.Item label="付款币种" name="fromCurrency" rules={[{ required: true, message: '请选择付款币种' }]}>
              <Select
                placeholder="请选择付款币种"
                size="large"
                options={[
                  { value: 'CNY', label: 'CNY 在岸人民币' },
                  { value: 'CNH', label: 'CNH 离岸人民币' },
                  { value: 'USD', label: 'USD 美元' },
                ]}
              />
            </Form.Item>

            <Form.Item label="付款金额" name="fromAmount" rules={[{ required: true, message: '请输入付款金额' }]}>
              <Input placeholder="请输入付款金额" size="large" />
            </Form.Item>

            <Form.Item label="账户名称" name="accountName" rules={[{ required: true, message: '请输入账户名称' }]}>
              <Input placeholder="请输入付款账户名称" size="large" />
            </Form.Item>

            <Form.Item label="银行开户行" name="bankBranch" rules={[{ required: true, message: '请输入银行开户行' }]}>
              <Input placeholder="例：中国工商银行北京分行" size="large" />
            </Form.Item>

            <Form.Item label="银行地址" name="bankAddress" rules={[{ required: true, message: '请输入银行地址' }]}>
              <Input placeholder="例：北京市朝阳区建国路 1 号" size="large" />
            </Form.Item>

            <Form.Item label="银行卡号" name="bankCard" rules={[{ required: true, message: '请输入银行卡号' }]}>
              <Input placeholder="请输入收款方银行卡号" size="large" />
            </Form.Item>

            <Form.Item label="备注" name="remark">
              <Input.TextArea
                placeholder="选填，可补充付款用途、紧急程度等说明"
                maxLength={200}
                showCount
                style={{ minHeight: 160 }}
              />
            </Form.Item>

            {/* 提示卡 */}
            <div style={{ marginTop: 12, padding: '20px 24px', background: '#f5f3ff', borderLeft: '3px solid #667eea', borderRadius: 8, display: 'flex', gap: 14, fontSize: 14, color: '#4b5563', lineHeight: 1.7 }}>
              <div style={{ flexShrink: 0, width: 22, height: 22, background: '#667eea', color: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600 }}>i</div>
              <div>
                提交后款项将进入 <b>销售确认</b> 环节，请确保收款方信息准确无误。<br />
                如需紧急处理，请在备注中说明，或联系您的销售。
              </div>
            </div>

            <Form.Item style={{ marginBottom: 0, marginTop: 32, paddingTop: 24, borderTop: '1px dashed #e5e7eb', display: 'flex', justifyContent: 'center' }}>
              <Button
                size="large"
                onClick={handleCancel}
                style={{ width: 140, height: 52, borderRadius: 12, border: '1px solid #e8e8e8', marginRight: 16, fontSize: 16 }}
              >
                取消
              </Button>
              <Button
                type="primary"
                size="large"
                htmlType="submit"
                loading={submitting}
                style={{
                  width: 200,
                  height: 52,
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none',
                  fontWeight: 500,
                  fontSize: 16,
                }}
              >
                提交申请
              </Button>
            </Form.Item>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default PaymentApply;

import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'umi';
import { Form, Select, Input, Button, message, Card, Upload, Alert } from 'antd';
import { ArrowLeftOutlined, InboxOutlined } from '@ant-design/icons';
import { deposit, upload } from '@/services/api';
import { useI18n } from '../../locales/I18nContext';
import DOCX from './template.docx';

const { Dragger } = Upload;

const DepositApply = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useI18n();
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [fileList, setFileList] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [tradeFileList, setTradeFileList] = useState([]);
  const [tradeUploading, setTradeUploading] = useState(false);
  const [agreementFileList, setAgreementFileList] = useState([]);
  const [agreementUploading, setAgreementUploading] = useState(false);
  const [logisticsFileList, setLogisticsFileList] = useState([]);
  const [logisticsUploading, setLogisticsUploading] = useState(false);

  // 重新申请：被拒记录（从列表页带过来）
  const reapplyRecord = location.state?.fromRejected;

  // 重新申请：回显被拒记录的数据
  useEffect(() => {
    const rejected = location.state?.fromRejected;
    if (rejected) {
      form.setFieldsValue({
        fromCurrency: rejected.fromCurrency,
        fromAmount: rejected.fromAmount,
        accountName: rejected.accountName,
        bankCard: rejected.bankCard,
        bankBranch: rejected.bankBranch,
        bankAddress: rejected.bankAddress,
        notes: rejected.notes,
      });
      if (Array.isArray(rejected.images)) {
        setFileList(rejected.images.map((img, i) => {
          const url = typeof img === 'string' ? img : img.url;
          const name = typeof img === 'object' && img.name ? img.name : `${t('depositApply.file')} ${i + 1}`;
          return { uid: `existing-${i}`, name, status: 'done', url };
        }));
      }
    }
  }, [location.state]);

  // 上传前校验
  const beforeUpload = (file) => {
    const isValidType = file.type === 'application/pdf' || file.type.startsWith('image/');
    if (!isValidType) {
      message.error(t('depositApply.onlySupportPdfImage'));
      return Upload.LIST_IGNORE;
    }
    const isLt10M = file.size / 1024 / 1024 < 10;
    if (!isLt10M) {
      message.error(t('depositApply.fileSizeLimit'));
      return Upload.LIST_IGNORE;
    }
    if (fileList.length >= 5) {
      message.error(t('depositApply.maxFiles'));
      return Upload.LIST_IGNORE;
    }
    return true;
  };

  const handleUpload = async (file) => {
    setUploading(true);
    try {
      const res = await upload([file]);
      const data = Array.isArray(res.data) ? res.data : [res.data];
      const newFile = {
        uid: file.uid,
        name: file.name,
        status: 'done',
        url: data[0]?.url,
        ossKey: data[0]?.ossKey,
        originalName: data[0]?.originalName || file.name,
      };
      setFileList(prev => [...prev, newFile]);
      return newFile;
    } catch (e) {
      // 错误已由拦截器统一处理
      return false;
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = (file) => {
    setFileList(prev => prev.filter(f => f.uid !== file.uid));
  };

  const handleUploadSingle = async (file, setFileList, setUploading) => {
    setUploading(true);
    try {
      const res = await upload([file]);
      const data = Array.isArray(res.data) ? res.data : [res.data];
      const newFile = {
        uid: file.uid,
        name: file.name,
        status: 'done',
        url: data[0]?.url,
        ossKey: data[0]?.ossKey,
        originalName: data[0]?.originalName || file.name,
      };
      setFileList(prev => [...prev, newFile]);
      return newFile;
    } catch {
      return false;
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveSingle = (file, setFileList) => {
    setFileList(prev => prev.filter(f => f.uid !== file.uid));
  };

  const handleRemoveSingleByUid = (uid, setFileList) => {
    setFileList(prev => prev.filter(f => f.uid !== uid));
  };

  const handleSubmit = async (values) => {
    if (uploading || tradeUploading || agreementUploading || logisticsUploading) {
      message.warning(t('depositApply.uploadPending'));
      return;
    }
    const validFiles = fileList.filter(f => f.status === 'done' && f.url);
    if (validFiles.length === 0) {
      message.error(t('depositApply.uploadProofRequired'));
      return;
    }
    const validTrade = tradeFileList.filter(f => f.status === 'done' && f.url);
    const validAgreement = agreementFileList.filter(f => f.status === 'done' && f.url);
    const validLogistics = logisticsFileList.filter(f => f.status === 'done' && f.url);
    if (!validAgreement.length) { message.error(t('depositApply.uploadAgreementRequired')); return; }
    const user = JSON.parse(localStorage.getItem('clientUser') || '{}');
    setSubmitting(true);
    try {
      const images = validFiles.map(f => ({ url: f.url, name: f.originalName || f.name }));
      const tradeContract = validTrade.map(f => ({ url: f.url, name: f.originalName || f.name }));
      const agreementFile = validAgreement.map(f => ({ url: f.url, name: f.originalName || f.name }));
      const logisticsFile = validLogistics.map(f => ({ url: f.url, name: f.originalName || f.name }));
      await deposit.create({
        ...values,
        images,
        tradeContract,
        agreementFile,
        logisticsFile,
        channel: user.channel,
        salesToken: user.salesToken,
      });
      message.success(t('depositApply.success'));
      navigate('/client/deposit');
    } catch (e) {
      // 错误已由拦截器统一处理
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: 'calc(100vh - 64px)', background: 'linear-gradient(160deg, #f5f7fa 0%, #eceef5 100%)', padding: '24px 32px' }}>
      <div style={{ width: '80%', maxWidth: 750, margin: '0 auto' }}>

        {/* 顶部 */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20, gap: 8 }}>
          <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate('/client/deposit')} style={{ color: '#667eea', fontSize: 14 }}>
            {t('depositApply.back')}
          </Button>
          <span style={{ color: '#d0d0d8' }}>/</span>
          <span style={{ color: '#667eea', fontSize: 14, fontWeight: 500 }}>{t('depositApply.deposit')}</span>
          <span style={{ color: '#d0d0d8' }}>/</span>
          <span style={{ color: '#333', fontSize: 14, fontWeight: 500 }}>{t('depositApply.apply')}</span>
        </div>

        <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: 16, padding: '24px 28px', marginBottom: 20, color: '#fff', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -30, right: -30, width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
          <div style={{ position: 'absolute', bottom: -40, right: 80, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
          <h1 style={{ fontSize: 24, fontWeight: 600, margin: 0, marginBottom: 6, position: 'relative' }}>{t('depositApply.title')}</h1>
          <div style={{ fontSize: 13, opacity: 0.85, position: 'relative' }}>{t('depositApply.subtitle')}</div>
        </div>

        <Card style={{ borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.04)' }}>
          <Form form={form} layout="horizontal" labelCol={{ span: 6 }} wrapperCol={{ span: 16 }} onFinish={handleSubmit} style={{ marginTop: 8 }}>
            {/* 重新申请：展示审核备注 */}
            {reapplyRecord?.reason && (
              <Alert
                type="warning"
                showIcon
                message={
                  <span>
                    <span style={{ fontWeight: 600 }}>{t('depositApply.auditRemark')}</span>
                    <span>{reapplyRecord.reason}</span>
                  </span>
                }
                style={{ marginBottom: 16, borderRadius: 10, background: '#fffbe6', border: '1px solid #ffe58f', color: '#ad6800' }}
              />
            )}
            <Form.Item label={t('depositApply.currency')} name="fromCurrency" rules={[{ required: true, message: t('depositApply.currencySelect') }]}>
              <Select placeholder={t('depositApply.currencySelect')} allowClear size="large" options={[
                { value: 'USD', label: 'USD 美元' },
                { value: 'CNY', label: 'CNY 人民币' },
                { value: 'CNH', label: 'CNH 离岸人民币' },
                { value: 'RUB', label: 'RUB 俄罗斯卢布' },
              ]} />
            </Form.Item>

            <Form.Item label={t('depositApply.amount')} name="fromAmount" rules={[
              { required: true, message: t('depositApply.amountInput') },
              { pattern: /^[1-9]\d*(\.\d+)?$/, message: t('depositApply.amountPositive') },
            ]}>
              <Input size="large" type="text" inputMode="decimal" placeholder={t('depositApply.amountInput')} allowClear style={{ borderRadius: 8 }} />
            </Form.Item>

            <Form.Item label={t('depositApply.accountName')} name="accountName" rules={[{ required: true, message: t('depositApply.accountName') }]}>
              <Input size="large" placeholder={t('depositApply.accountName')} allowClear style={{ borderRadius: 8 }} />
            </Form.Item>

            <Form.Item label={t('depositApply.bankCard')} name="bankCard" rules={[{ required: true, message: t('depositApply.bankCard') }]}>
              <Input size="large" placeholder={t('depositApply.bankCard')} allowClear style={{ borderRadius: 8 }} />
            </Form.Item>

            <Form.Item label={t('depositApply.bankBranch')} name="bankBranch" rules={[{ required: true, message: t('depositApply.bankBranch') }]}>
              <Input size="large" placeholder={t('depositApply.bankBranch')} allowClear style={{ borderRadius: 8 }} />
            </Form.Item>

            <Form.Item label={t('depositApply.bankAddress')} name="bankAddress" rules={[{ required: true, message: t('depositApply.bankAddress') }]}>
              <Input size="large" placeholder={t('depositApply.bankAddress')} allowClear style={{ borderRadius: 8 }} />
            </Form.Item>

            {/* 入金凭证（水单）—— 必填 */}
            <Form.Item label={<span><span style={{ color: '#f5222d' }}>*</span> {t('depositApply.proofLabel')}</span>}>
              <Dragger
                multiple
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                beforeUpload={beforeUpload}
                customRequest={({ file, onSuccess, onError }) => {
                  handleUpload(file)
                    .then(result => result && onSuccess(result))
                    .catch(err => onError(err));
                }}
                fileList={fileList}
                onRemove={handleRemove}
                listType="picture"
              >
                <p className="ant-upload-drag-icon">
                  <InboxOutlined style={{ color: '#667eea' }} />
                </p>
                <p className="ant-upload-text">{t('depositApply.proofUpload')}</p>
                <p className="ant-upload-hint" style={{ fontSize: 12, color: '#999' }}>
                  {t('depositApply.proofUploadHint')}
                </p>
              </Dragger>
            </Form.Item>

            {/* 代收付协议 —— 必填，带下载模板 */}
            <Form.Item label={<span><span style={{ color: '#f5222d' }}>*</span> {t('depositApply.tradeAgreement')}</span>}>
              <Dragger
                accept=".pdf,.xlsx,.xls,.doc,.docx"
                beforeUpload={file => { handleUploadSingle(file, setAgreementFileList, setAgreementUploading); return false; }}
                fileList={agreementFileList}
                onRemove={file => handleRemoveSingleByUid(file.uid, setAgreementFileList)}
              >
                <p className="ant-upload-drag-icon"><InboxOutlined style={{ color: '#667eea' }} /></p>
                <p className="ant-upload-text">{t('depositApply.uploadHint')}</p>
                <p className="ant-upload-hint" style={{ fontSize: 12, color: '#999' }}>{t('depositApply.uploadHintAgreement')}</p>
              </Dragger>
              <div style={{ marginTop: 8 }}>
                <a href={DOCX} download="代收付协议模板.docx" target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: '#1677ff' }}>{t('depositApply.downloadAgreementTemplate')}</a>
              </div>
            </Form.Item>

            {/* 贸易合同 —— 非必填 */}
            <Form.Item label={t('depositApply.tradeContract')}>
              <Dragger
                accept=".pdf,.xlsx,.xls,.doc,.docx"
                beforeUpload={file => { handleUploadSingle(file, setTradeFileList, setTradeUploading); return false; }}
                fileList={tradeFileList}
                onRemove={file => handleRemoveSingleByUid(file.uid, setTradeFileList)}
              >
                <p className="ant-upload-drag-icon"><InboxOutlined style={{ color: '#667eea' }} /></p>
                <p className="ant-upload-text">{t('depositApply.uploadHint')}</p>
                <p className="ant-upload-hint" style={{ fontSize: 12, color: '#999' }}>{t('depositApply.uploadHintAgreement')}</p>
              </Dragger>
            </Form.Item>

            {/* 物流信息 —— 非必填 */}
            <Form.Item label={t('depositApply.logisticsInfo')}>
              <Dragger
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                beforeUpload={file => { handleUploadSingle(file, setLogisticsFileList, setLogisticsUploading); return false; }}
                fileList={logisticsFileList}
                onRemove={file => handleRemoveSingleByUid(file.uid, setLogisticsFileList)}
              >
                <p className="ant-upload-drag-icon"><InboxOutlined style={{ color: '#667eea' }} /></p>
                <p className="ant-upload-text">{t('depositApply.uploadHint')}</p>
                <p className="ant-upload-hint" style={{ fontSize: 12, color: '#999' }}>{t('depositApply.uploadHintLogistics')}</p>
              </Dragger>
            </Form.Item>

            <Form.Item label={t('depositApply.notes')} name="notes">
              <Input.TextArea size="large" rows={2} placeholder={t('depositApply.notes')} allowClear style={{ borderRadius: 8 }} />
            </Form.Item>

            <div style={{ display: 'flex', gap: 16, marginTop: 24, justifyContent: 'center' }}>
              <Button onClick={() => navigate('/client/deposit')} size="large" style={{ borderRadius: 12, width: 180, height: 48, fontSize: 15 }}>
                {t('app.cancel')}
              </Button>
              <Button type="primary" htmlType="submit" loading={submitting} size="large"
                style={{ borderRadius: 12, width: 180, height: 48, fontSize: 15, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', border: 'none', boxShadow: '0 4px 12px rgba(102,126,234,0.3)' }}>
                {t('depositApply.submitApplication')}
              </Button>
            </div>
          </Form>
        </Card>
      </div>
    </div>
  );
};

export default DepositApply;

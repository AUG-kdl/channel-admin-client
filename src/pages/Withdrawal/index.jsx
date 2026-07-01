import { useState, useEffect } from 'react';
import { useNavigate } from 'umi';
import { Form, Select, Button, message, Table, Empty, Spin, Tag, Input, Drawer, Image } from 'antd';
import { PlusOutlined, EyeOutlined, DownloadOutlined, FileImageOutlined, FileTextOutlined } from '@ant-design/icons';
import { withdrawal } from '@/services/api';
import { useI18n } from '../../locales/I18nContext';
import moment from 'moment';

// 解析凭证文件列表
const parseProofFiles = (field) => {
  try {
    let arr = typeof field === 'string' ? JSON.parse(field) : field;
    if (!Array.isArray(arr)) return [];
    return arr.map(item => {
      if (typeof item === 'string') return { url: item, name: item.split('/').pop() };
      return { url: item.url || item.src || '', name: item.name || item.url?.split('/').pop() || '' };
    });
  } catch {
    return [];
  }
};
const isImage = (url) => /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(url);
const isPdf = (url) => /\.pdf$/i.test(url);

const Withdrawal = () => {
  const [listForm] = Form.useForm();
  const navigate = useNavigate();
  const { t } = useI18n();
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [proofVisible, setProofVisible] = useState(false);
  const [currentProofs, setCurrentProofs] = useState([]);

  const STATUS_MAP = {
    pending_review: { text: t('withdrawalList.status_pending_review'), color: '#fa8c16', bg: '#fff7e6' },
    uploaded:     { text: t('withdrawalList.status_uploaded'), color: '#1890ff', bg: '#e6f7ff' },
    completed:   { text: t('withdrawalList.status_completed'), color: '#52c41a', bg: '#f0fff4' },
  };

  const REGION_MAP = {
    mainland: t('withdrawalList.region_mainland'),
    hk_mo: t('withdrawalList.region_hk_mo'),
  };

  const fetchData = async (params = {}) => {
    setLoading(true);
    try {
      const values = listForm.getFieldsValue();
      const queryParams = { page, pageSize, ...params };
      if (values.withdrawalId) queryParams.withdrawalId = values.withdrawalId;
      if (values.status) queryParams.status = values.status;
      if (values.region) queryParams.region = values.region;
      const res = await withdrawal.list(queryParams);
      setData(res.data?.list || []);
      setTotal(res.data?.total || 0);
    } catch (e) {
      message.error(t('withdrawalList.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [page, pageSize, t]);

  const handleSearch = () => { setPage(1); fetchData({ page: 1 }); };
  const handleReset = () => { listForm.resetFields(); setPage(1); fetchData({ page: 1 }); };

  const handleDownload = (record) => {
    const headers = [
      t('withdrawalList.withdrawalId'),
      t('withdrawalList.type'),
      t('withdrawalList.payeeName'),
      t('withdrawalList.amount'),
      t('withdrawalList.currency'),
      t('withdrawalList.subjectType'),
      t('withdrawalList.region'),
      t('withdrawalList.status'),
      t('withdrawalList.submittedAt'),
    ];
    const row = [
      record.withdrawalId,
      record.payeeType === 'personal' ? t('withdrawalList.subject_personal') : t('withdrawalList.subject_enterprise'),
      record.payeeName,
      record.amount,
      record.currency,
      record.subjectType === 'personal' ? t('withdrawalList.subject_personal') : t('withdrawalList.subject_enterprise'),
      REGION_MAP[record.region] || record.region,
      STATUS_MAP[record.status]?.text || record.status,
      record.submittedAt ? moment(record.submittedAt).format('YYYY-MM-DD HH:mm') : '-',
    ];
    const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const csv = '\ufeff' + [headers, row].map(r => r.map(esc).join(',')).join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `提现付款详情_${record.withdrawalId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const columns = [
    { title: t('withdrawalList.withdrawalOrderNo'), dataIndex: 'withdrawalId', key: 'withdrawalId', width: 160,
      render: (v) => (
        <span
          style={{ fontFamily: 'monospace', color: '#667eea', fontWeight: 500, cursor: 'pointer' }}
          onClick={() => navigate(`/client/withdrawal/${v}`)}
        >
          {v}
        </span>
      ) },
    { title: t('withdrawalList.payeeName'), dataIndex: 'payeeName', key: 'payeeName', width: 200,
      render: (v) => v },
    { title: t('withdrawalList.region'), dataIndex: 'region', key: 'region', width: 100,
      render: (v) => REGION_MAP[v] || (v || '') },
    { title: t('withdrawalList.amount'), key: 'amount', width: 160,
      render: (_, r) => (
        <span style={{ fontWeight: 600, color: '#667eea', fontSize: 15 }}>
          {parseFloat(r.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })} {r.currency}
        </span>
      ) },
    { title: t('withdrawalList.subjectType'), dataIndex: 'subjectType', key: 'subjectType', width: 90,
      render: (v) => v === 'personal' ? t('withdrawalList.subject_personal') : v === 'enterprise' ? t('withdrawalList.subject_enterprise') : '' },
    { title: t('withdrawalList.proof'), key: 'proof', width: 90,
      render: (_, r) => {
        const arr = parseProofFiles(r.proofFiles);
        if (arr.length === 0) return <span style={{ color: '#d0d0d0' }}>—</span>;
        return (
          <Button type="link" size="small" style={{ padding: 0, color: '#667eea' }} icon={<FileImageOutlined />} onClick={() => { setCurrentProofs(arr); setProofVisible(true); }}>
            {arr.length}张
          </Button>
        );
      } },
    { title: t('withdrawalList.status'), dataIndex: 'status', key: 'status', width: 110,
      render: (s) => {
        if (!s) return null;
        const m = STATUS_MAP[s];
        if (!m) return <span>{s}</span>;
        return <span style={{ background: m.bg, color: m.color, padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 500 }}>{m.text}</span>;
      }},
    { title: t('withdrawalList.submittedAt'), dataIndex: 'submittedAt', key: 'submittedAt', width: 160,
      render: (v) => v ? moment(v).format('YYYY-MM-DD HH:mm') : '' },
    { title: t('withdrawalList.action'), key: 'action', width: 300, fixed: 'right',
      render: (_, r) => (
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => navigate(`/client/withdrawal/${r.withdrawalId}`)}>{t('withdrawalList.detail').replace('详情', '提现/付款详情')}</Button>
          <Button type="link" size="small" icon={<FileTextOutlined />} onClick={() => navigate(`/client/withdrawal/withdrawalInfo/${r.withdrawalId}`)}>{t('withdrawalList.view')}</Button>
          {r.status === 'completed' && (
            <Button type="link" size="small" icon={<DownloadOutlined />} onClick={() => handleDownload(r)}>{t('withdrawalList.download')}</Button>
          )}
        </div>
      ) },
  ];

  return (
    <div style={{ minHeight: 'calc(100vh - 64px)', background: 'linear-gradient(160deg, #f5f7fa 0%, #eceef5 100%)', padding: '24px 32px' }}>
      <div style={{ maxWidth: 1440, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>

        <div style={{ padding: '0 4px' }}>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: '#1a1a2e', margin: 0 }}>{t('withdrawalList.title')}</h1>
          <p style={{ fontSize: 13, color: '#9ca3af', marginTop: 4 }}>{t('withdrawalList.title')}</p>
        </div>

        <div style={{ background: '#fff', borderRadius: 16, padding: '20px 24px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.04)' }}>
          <Form form={listForm} layout="inline" style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', rowGap: 12, columnGap: 20 }}>
            <Form.Item label={t('withdrawalList.withdrawalOrderNo')} name="withdrawalId" labelCol={{ style: { width: 120 } }} style={{ marginBottom: 0 }}>
              <Input placeholder="请输入提现/付款订单号" allowClear style={{ width: 280, height: 36 }} />
            </Form.Item>
            <Form.Item label={t('withdrawalList.filterStatus')} name="status" labelCol={{ style: { width: 60 } }} style={{ marginBottom: 0 }}>
              <Select placeholder={t('withdrawalList.all')} allowClear style={{ width: 280, height: 36 }} options={[
                { value: 'pending_review', label: t('withdrawalList.status_pending_review') },
                { value: 'uploaded', label: t('withdrawalList.status_uploaded') },
                { value: 'completed', label: t('withdrawalList.status_completed') },
              ]} />
            </Form.Item>
            <Form.Item label={t('withdrawalList.filterRegion')} name="region" labelCol={{ style: { width: 60 } }} style={{ marginBottom: 0 }}>
              <Select placeholder={t('withdrawalList.all')} allowClear style={{ width: 280, height: 36 }} options={[
                { value: 'mainland', label: t('withdrawalList.region_mainland') },
                { value: 'hk_mo', label: t('withdrawalList.region_hk_mo') },
              ]} />
            </Form.Item>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button type="primary" onClick={handleSearch} style={{ height: 36, borderRadius: 8, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', border: 'none', boxShadow: '0 4px 12px rgba(102,126,234,0.3)' }}>{t('app.search')}</Button>
              <Button onClick={handleReset} style={{ height: 36, borderRadius: 8, background: '#f3f4f6', color: '#6b7280', border: '1px solid #e5e7eb' }}>{t('app.reset')}</Button>
              <Button onClick={() => navigate('/client/withdrawal/apply')} style={{ height: 36, borderRadius: 8, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: '#fff', border: 'none', boxShadow: '0 4px 12px rgba(102,126,234,0.3)' }}>
                <PlusOutlined />{t('withdrawalList.addBtn')}
              </Button>
            </div>
          </Form>
        </div>

        <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.04)', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}><Spin size="large" /></div>
          ) : data.length === 0 ? (
            <Empty description={t('app.noData')} style={{ padding: '80px 0' }} />
          ) : (
            <Table
              dataSource={data}
              columns={columns}
              rowKey="withdrawalId"
              scroll={{ x: 1500 }}
              pagination={{
                current: page, pageSize, total,
                onChange: (p, ps) => { setPage(p); setPageSize(ps); },
                showSizeChanger: false,
              }}
            />
          )}
        </div>

        {/* 凭证文件抽屉 */}
        <Drawer
          title={t('withdrawalList.proofFiles')}
          placement="right"
          width={400}
          open={proofVisible}
          onClose={() => setProofVisible(false)}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
            {currentProofs.map((f, i) => {
              if (isImage(f.url)) {
                const handleDownload = () => { const a = document.createElement('a'); a.href = f.url; a.download = f.name || '凭证.png'; a.click(); };
                return (
                  <div key={i} style={{ textAlign: 'center' }}>
                    <Image
                      src={f.url}
                      alt={f.name}
                      style={{ width: '100%', height: 100, objectFit: 'cover', borderRadius: 8, border: '1px solid #f0f0f0', display: 'block' }}
                      preview={{ mask: null }}
                    />
                    <div style={{ fontSize: 11, color: '#667eea', marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: 'pointer' }} onClick={handleDownload}>{f.name}</div>
                  </div>
                );
              }
              if (isPdf(f.url)) {
                const handleDownload = () => { const a = document.createElement('a'); a.href = f.url; a.download = f.name || '凭证.pdf'; a.click(); };
                return (
                  <div key={i} style={{ textAlign: 'center' }}>
                    <div
                      style={{ cursor: 'pointer', borderRadius: 8, overflow: 'hidden', border: '1px solid #f0f0f0', background: '#fafafa', display: 'flex', alignItems: 'center', justifyContent: 'center', height: 100 }}
                      onClick={handleDownload}
                    >
                      <img src="/pdf-icon.png" alt="PDF" style={{ width: 48, height: 48 }} />
                    </div>
                    <div style={{ fontSize: 11, color: '#667eea', marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: 'pointer' }} onClick={handleDownload}>{f.name}</div>
                  </div>
                );
              }
              return null;
            })}
          </div>
          {currentProofs.length === 0 && (
            <div style={{ textAlign: 'center', color: '#999', padding: '40px 0' }}>{t('withdrawalList.noProof')}</div>
          )}
        </Drawer>

      </div>
    </div>
  );
};

export default Withdrawal;

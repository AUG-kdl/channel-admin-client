import { useState, useEffect } from 'react';
import { useNavigate } from 'umi';
import {
  Form, Select, Input, Button, message, Table, Empty, Spin, DatePicker, Modal, Drawer, Image,
} from 'antd';
import {
  PlusOutlined, EyeOutlined, DownloadOutlined, FileImageOutlined,
} from '@ant-design/icons';
import { deposit } from '@/services/api';
import { useI18n } from '../../locales/I18nContext';
import moment from 'moment';
import { downloadPdf } from '@/services/api';

const { RangePicker } = DatePicker;

// 解析凭证文件列表，返回 [{url, name}]
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

// 判断是否为图片
const isImage = (url) => /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(url);
// 判断是否为PDF
const isPdf = (url) => /\.pdf$/i.test(url);

const Deposit = () => {
  const [listForm] = Form.useForm();
  const navigate = useNavigate();
  const { t } = useI18n();
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [reapplyRecord, setReapplyRecord] = useState(null);
  const [proofVisible, setProofVisible] = useState(false);
  const [currentProofs, setCurrentProofs] = useState([]);

  const statusMap = {
    pending_review: { text: t('depositList.status_pending_review'), color: '#fa8c16', bg: '#fff7e6' },
    approved:       { text: t('depositList.status_approved'), color: '#52c41a', bg: '#f0fff4' },
    rejected:       { text: t('depositList.status_rejected'), color: '#f5222d', bg: '#fff1f0' },
  };

  const fetchData = async (params = {}) => {
    setLoading(true);
    try {
      const values = listForm.getFieldsValue();
      const queryParams = { page, pageSize, ...params };
      if (values.orderNo) queryParams.orderNo = values.orderNo;
      if (values.status) queryParams.status = values.status;
      if (values.fromCurrency) queryParams.fromCurrency = values.fromCurrency;
      if (values.accountName) queryParams.accountName = values.accountName;
      if (values.dateRange && values.dateRange[0]) {
        queryParams.startDate = values.dateRange[0].format('YYYY-MM-DD');
        queryParams.endDate = values.dateRange[1].format('YYYY-MM-DD');
      }
      const res = await deposit.list(queryParams);
      setData(res.data?.list || []);
      setTotal(res.data?.total || 0);
    } catch (e) {
      // 错误已由拦截器统一处理
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [page, pageSize, t]);

  const handleSearch = () => { setPage(1); fetchData({ page: 1 }); };
  const handleReset = () => { listForm.resetFields(); setPage(1); fetchData({ page: 1 }); };

  const handleDownload = (record) => {
    const id = record.orderNo || record.id;
    downloadPdf(`/client/deposit/pdf/${id}`, `入金明细_${id}.pdf`);
  };

  const columns = [
    { title: t('depositList.depositOrderNo'), dataIndex: 'orderNo', key: 'orderNo', width: 180,
      render: (v) => (
        <span
          style={{ fontFamily: 'monospace', color: '#667eea', fontWeight: 500, cursor: 'pointer' }}
          onClick={() => navigate(`/client/deposit/${v}`)}
        >
          {v || '-'}
        </span>
      ) },
    { title: t('depositList.fromCurrency'), dataIndex: 'fromCurrency', key: 'fromCurrency', width: 100 },
    { title: t('depositList.fromAmount'), dataIndex: 'fromAmount', key: 'fromAmount', width: 130,
      render: (v, r) => <span style={{ fontWeight: 600 }}>{parseFloat(v || 0).toLocaleString()} {r.fromCurrency}</span> },
    { title: t('depositList.accountName'), dataIndex: 'accountName', key: 'accountName', width: 140,
      render: (v) => v || '-' },
    { title: t('depositList.images'), key: 'images', width: 100,
      render: (_, r) => {
        const arr = parseProofFiles(r.images);
        if (arr.length === 0) return <span style={{ color: '#d0d0d0', fontSize: 13 }}>—</span>;
        return (
          <Button type="link" size="small" style={{ padding: 0, color: '#667eea' }} icon={<FileImageOutlined />} onClick={() => { setCurrentProofs(arr); setProofVisible(true); }}>
            {arr.length}{t('depositList.imageCount') || '张'}
          </Button>
        );
      } },
    { title: t('depositList.status'), dataIndex: 'status', key: 'status', width: 110,
      render: (s) => {
        const m = statusMap[s] || statusMap.pending_review;
        return <span style={{ background: m.bg, color: m.color, padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 500 }}>{m.text}</span>;
      }},
    { title: t('depositList.createdAt'), dataIndex: 'createdAt', key: 'createdAt', width: 160,
      render: (v) => v ? moment(v).format('YYYY-MM-DD HH:mm') : '-' },
    { title: t('depositList.action'), key: 'action', width: 110, fixed: 'right',
      render: (_, r) => (
        <>
          {r.status === 'rejected' && (
            <Button type="link" size="small" icon={<PlusOutlined />} onClick={() => setReapplyRecord(r)}>{t('depositList.reapply')}</Button>
          )}
          {r.status === 'approved' && (
            <Button type="link" size="small" icon={<DownloadOutlined />} onClick={() => handleDownload(r)}>{t('depositList.download')}</Button>
          )}
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => navigate(`/client/deposit/${r.orderNo}`)}>{t('depositList.view')}</Button>
        </>
      ) },
  ];

  return (
    <div style={{ minHeight: 'calc(100vh - 64px)', background: 'linear-gradient(160deg, #f5f7fa 0%, #eceef5 100%)', padding: '24px 32px' }}>
      <div style={{ maxWidth: 1440, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Banner */}
        <div style={{ padding: '0 4px' }}>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: '#1a1a2e', margin: 0 }}>{t('depositList.title')}</h1>
          <p style={{ fontSize: 13, color: '#9ca3af', marginTop: 4 }}>{t('depositList.title')}</p>
        </div>

        {/* 筛选 + 操作 */}
        <div style={{ background: '#fff', borderRadius: 16, padding: '20px 24px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.04)' }}>
          <Form form={listForm} layout="inline" style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', rowGap: 12, columnGap: 20 }}>
            <Form.Item label={t('depositList.depositOrderNo')} name="orderNo" style={{ marginBottom: 0 }}>
              <Input placeholder="请输入入金订单号" allowClear style={{ width: 280, height: 36 }} />
            </Form.Item>
            <Form.Item label={t('depositList.filterStatus')} name="status" style={{ marginBottom: 0 }}>
              <Select placeholder={t('depositList.all')} allowClear style={{ width: 280, height: 36 }} options={[
                { value: 'pending_review', label: t('depositList.status_pending_review') },
                { value: 'approved', label: t('depositList.status_approved') },
                { value: 'rejected', label: t('depositList.status_rejected') },
              ]} />
            </Form.Item>
            <Form.Item label={t('depositList.fromCurrency')} name="fromCurrency" style={{ marginBottom: 0 }}>
              <Select placeholder={t('depositList.all')} allowClear style={{ width: 280, height: 36 }} options={[
                { value: 'USD', label: 'USD' },
                { value: 'CNY', label: 'CNY' },
                { value: 'CNH', label: 'CNH' },
                { value: 'RUB', label: 'RUB' },
              ]} />
            </Form.Item>
            <Form.Item label={t('depositList.accountName')} name="accountName" style={{ marginBottom: 0 }}>
              <Input placeholder={t('depositList.accountName')} allowClear style={{ width: 280, height: 36 }} />
            </Form.Item>
            <Form.Item label={t('app.dateRange')} name="dateRange" style={{ marginBottom: 0 }}>
              <RangePicker allowClear style={{ width: 280, height: 36 }} />
            </Form.Item>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button type="primary" onClick={handleSearch} style={{ height: 36, borderRadius: 8, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', border: 'none', boxShadow: '0 4px 12px rgba(102,126,234,0.3)' }}>{t('app.search')}</Button>
              <Button onClick={handleReset} style={{ height: 36, borderRadius: 8, background: '#f3f4f6', color: '#6b7280', border: '1px solid #e5e7eb' }}>{t('app.reset')}</Button>
              <Button onClick={() => navigate('/client/deposit/apply')} style={{ height: 36, borderRadius: 8, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: '#fff', border: 'none', boxShadow: '0 4px 12px rgba(102,126,234,0.3)' }}>
                <PlusOutlined />{t('depositList.applyBtn')}
              </Button>
            </div>
          </Form>
        </div>

        {/* 表格 */}
        <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.04)', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}><Spin size="large" /></div>
          ) : data.length === 0 ? (
            <Empty description={t('app.noData')} style={{ padding: '80px 0' }} />
          ) : (
            <Table
              dataSource={data}
              columns={columns}
              rowKey="id"
              loading={loading}
              scroll={{ x: 1600 }}
              pagination={{
                current: page,
                pageSize,
                total,
                onChange: (p, ps) => { setPage(p); setPageSize(ps); },
                showSizeChanger: false,
              }}
            />
          )}
        </div>

        {/* 凭证文件抽屉 */}
        <Drawer
          title={t('depositList.proofFiles')}
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
            <div style={{ textAlign: 'center', color: '#999', padding: '40px 0' }}>{t('depositList.noProof') || '暂无凭证'}</div>
          )}
        </Drawer>

        {/* 重新申请确认 */}
        <Modal
          title={t('depositList.reapplyTitle')}
          open={!!reapplyRecord}
          onOk={() => { navigate('/client/deposit/apply', { state: { fromRejected: reapplyRecord } }); setReapplyRecord(null); }}
          onCancel={() => setReapplyRecord(null)}
          okText={t('depositList.reapplyConfirm')}
          cancelText={t('depositList.reapplyCancel')}
        >
          {reapplyRecord && (
            <div style={{ fontSize: 14, color: '#333', lineHeight: 1.8 }}>
              <p style={{ marginBottom: 8 }}>{t('depositList.reapplyConfirm')}</p>
              <div style={{ background: '#f9f9f9', borderRadius: 8, padding: '12px 16px' }}>
                <div>{t('depositList.orderNo')}：<span style={{ fontFamily: 'monospace', color: '#667eea' }}>{reapplyRecord.orderNo}</span></div>
                <div>{t('depositList.fromCurrency')}：{reapplyRecord.fromCurrency}</div>
                <div>{t('depositList.fromAmount')}：{reapplyRecord.fromAmount}</div>
                <div>{t('depositList.accountName')}：{reapplyRecord.accountName}</div>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
};

export default Deposit;

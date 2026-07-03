import { useState, useEffect } from 'react';
import { useNavigate } from 'umi';
import {
  Form, Input, Select, Button, message, Modal, Table, Empty, Spin, Image, DatePicker, Drawer,
} from 'antd';
import { DollarOutlined, EyeOutlined, CheckCircleOutlined, ClockCircleOutlined, CloseCircleOutlined, FileTextOutlined, DownloadOutlined } from '@ant-design/icons';
import { withdrawal } from '@/services/api';
import { useI18n } from '@/locales/I18nContext';
import moment from 'moment';

const { RangePicker } = DatePicker;

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

const statusMap = {
  pending: { text: '待处理', color: '#fa8c16', bg: '#fff7e6', icon: <ClockCircleOutlined /> },
  processing: { text: '处理中', color: '#1890ff', bg: '#e6f7ff', icon: <ClockCircleOutlined /> },
  completed: { text: '已完成', color: '#52c41a', bg: '#f0fff4', icon: <CheckCircleOutlined /> },
  rejected: { text: '已驳回', color: '#f5222d', bg: '#fff1f0', icon: <CloseCircleOutlined /> },
};

const Payment = () => {
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
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [detailVisible, setDetailVisible] = useState(false);
  const [currentDetail, setCurrentDetail] = useState(null);

  const fetchData = async (params = {}) => {
    setLoading(true);
    try {
      const values = listForm.getFieldsValue();
      const queryParams = { page, pageSize, ...params };
      if (values.orderNo) queryParams.orderNo = values.orderNo;
      if (values.fromCurrency) queryParams.fromCurrency = values.fromCurrency;
      if (values.status) queryParams.status = values.status;
      if (values.dateRange && values.dateRange[0]) {
        queryParams.startDate = values.dateRange[0].format('YYYY-MM-DD');
        queryParams.endDate = values.dateRange[1].format('YYYY-MM-DD');
      }
      const res = await withdrawal.list(queryParams);
      setData(res.data?.list || []);
      setTotal(res.data?.total || 0);
    } catch (e) {
      // 错误已由拦截器统一处理
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, pageSize]);

  const handleSearch = () => {
    setPage(1);
    fetchData({ page: 1 });
  };

  const handleReset = () => {
    listForm.resetFields();
    setPage(1);
    fetchData({ page: 1 });
  };

  const handleApply = () => {
    navigate('/client/payment/apply');
  };

  const handleViewDetail = (record) => {
    setCurrentDetail(record);
    setDetailVisible(true);
  };

  const handleDownload = (record) => {
    // 构造 CSV 内容（BOM 防 Excel 乱码）
    const headers = ['订单号', '付款币种', '付款金额', '折合币种', '折合金额', '账户名称', '银行开户行', '银行地址', '银行卡号', '备注', '状态', '提交时间'];
    const statusText = (statusMap[record.status] || statusMap.pending).text;
    const row = [
      record.orderNo,
      record.fromCurrency,
      record.fromAmount,
      record.toCurrency || '-',
      record.toAmount || '-',
      record.accountName,
      record.bankBranch,
      record.bankAddress,
      record.bankCard,
      record.remark || '',
      statusText,
      record.createdAt ? moment(record.createdAt).format('YYYY-MM-DD HH:mm:ss') : '-',
    ];
    // CSV 转义
    const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const csv = '\ufeff' + [headers, row].map(r => r.map(esc).join(',')).join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `付款明细_${record.orderNo}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    message.success('已下载');
  };

  const columns = [
    { title: '订单号', dataIndex: 'orderNo', key: 'orderNo', width: 180,
      render: (v) => <span style={{ fontFamily: 'monospace', color: '#667eea', fontWeight: 500 }}>{v}</span> },
    { title: '付款金额', key: 'fromAmount', width: 160,
      render: (_, r) => <span style={{ fontWeight: 600 }}>{parseFloat(r.fromAmount).toLocaleString()} {r.fromCurrency}</span> },
    { title: '折合', key: 'toAmount', width: 160,
      render: (_, r) => `${parseFloat(r.toAmount).toLocaleString()} ${r.toCurrency}` },
    { title: '收款银行卡', dataIndex: 'bankCard', key: 'bankCard', width: 180 },
    { title: t('paymentList.proof') || '凭证', dataIndex: 'images', key: 'images', width: 100,
      render: (images) => {
        const arr = parseProofFiles(images);
        if (arr.length === 0) return '-';
        return <Button type="link" style={{ padding: 0, color: '#667eea' }} icon={<EyeOutlined />} onClick={() => { setCurrentProofs(arr); setProofVisible(true); }}>{arr.length}</Button>;
      } },
    { title: '状态', dataIndex: 'status', key: 'status', width: 110,
      render: (s) => {
        const m = statusMap[s] || statusMap.pending;
        return <span style={{ background: m.bg, color: m.color, padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 500 }}>● {m.text}</span>;
      } },
    { title: '提交时间', dataIndex: 'createdAt', key: 'createdAt', width: 160,
      render: (v) => v ? moment(v).format('YYYY-MM-DD HH:mm') : '-' },
    { title: '操作', key: 'action', width: 200, fixed: 'right',
      render: (_, r) => (
        <div style={{ display: 'flex', gap: 4 }}>
          <Button type="link" size="small" style={{ padding: '0 6px', color: '#667eea' }} icon={<FileTextOutlined />} onClick={() => handleViewDetail(r)}>付款详情</Button>
          <Button type="link" size="small" style={{ padding: '0 6px', color: '#667eea' }} icon={<DownloadOutlined />} onClick={() => handleDownload(r)}>下载明细</Button>
        </div>
      ) },
  ];

  return (
    <div style={{ minHeight: 'calc(100vh - 64px)', background: 'linear-gradient(160deg, #f5f7fa 0%, #eceef5 100%)', padding: '24px 32px' }}>
      <div style={{ maxWidth: 1440, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* 顶部标题 */}
        <div style={{ padding: '0 4px' }}>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: '#1a1a2e', margin: 0 }}>付款管理</h1>
          <p style={{ fontSize: 13, color: '#9ca3af', marginTop: 4 }}>查询付款记录，发起新付款申请</p>
        </div>

        {/* 筛选 + 操作 */}
        <div style={{ background: '#fff', borderRadius: 16, padding: '20px 24px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.04)' }}>
          <Form form={listForm} layout="inline" style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', rowGap: 12, columnGap: 20 }}>
            <Form.Item name="orderNo" style={{ marginBottom: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 13, color: '#6b7280', fontWeight: 500, marginRight: 8}}>订单号</span>
              <Input placeholder="请输入订单号" style={{ width: 180, height: 36 }} />
            </Form.Item>
            <Form.Item name="fromCurrency" style={{ marginBottom: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 13, color: '#6b7280', fontWeight: 500, marginRight: 8 }}>付款币种</span>
              <Select placeholder="全部" allowClear style={{ width: 140, height: 36 }} options={[
                { value: 'USD', label: 'USD 美元' },
                { value: 'CNY', label: 'CNY 人民币' },
                { value: 'CNH', label: 'CNH 离岸' },
              ]} />
            </Form.Item>
            <Form.Item name="status" style={{ marginBottom: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 13, color: '#6b7280', fontWeight: 500, marginRight: 8 }}>状态</span>
              <Select placeholder="全部" allowClear style={{ width: 140, height: 36 }} options={[
                { value: 'pending', label: '待处理' },
                { value: 'completed', label: '已完成' },
                { value: 'rejected', label: '已驳回' },
              ]} />
            </Form.Item>
            <Form.Item name="dateRange" style={{ marginBottom: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 13, color: '#6b7280', fontWeight: 500, marginRight: 8 }}>日期范围</span>
              <RangePicker style={{ width: 240, height: 36 }} placeholder={['开始日期', '结束日期']} />
            </Form.Item>
            <div style={{ width: 1, height: 20, background: '#e5e7eb' }} />
            <Button type="primary" onClick={handleSearch} style={{ height: 36, borderRadius: 8, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', border: 'none', boxShadow: '0 4px 12px rgba(102,126,234,0.3)' }}>查询</Button>
            <Button onClick={handleReset} style={{ height: 36, borderRadius: 8, background: '#f3f4f6', color: '#6b7280', border: '1px solid #e5e7eb' }}>重置</Button>
            <Button onClick={handleApply} style={{ height: 36, borderRadius: 8, marginLeft: 'auto', background: 'linear-gradient(135deg, #5b67d9 0%, #667eea 100%)', color: '#fff', border: 'none', boxShadow: '0 4px 12px rgba(102,126,234,0.3)' }}>申请付款</Button>
          </Form>
        </div>

        {/* 表格 */}
        <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.04)', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}><Spin size="large" /></div>
          ) : data.length === 0 ? (
            <Empty description="暂无付款记录" style={{ padding: '80px 0' }} />
          ) : (
            <Table
              dataSource={data}
              columns={columns}
              rowKey="id"
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
                    <div style={{ cursor: 'pointer', borderRadius: 8, overflow: 'hidden', border: '1px solid #f0f0f0', background: '#fafafa' }} onClick={() => { setPreviewImage(f.url); setPreviewVisible(true); }}>
                      <img src={f.url} alt={f.name} style={{ width: '100%', height: 100, objectFit: 'cover', display: 'block' }} />
                    </div>
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

      {/* 图片预览 */}
      <Image
        src={previewImage}
        preview={{ visible: previewVisible, onVisibleChange: setPreviewVisible }}
      />

      <Modal
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        onOk={() => setDetailVisible(false)}
        title="付款详情"
        width={720}
        okText="关闭"
        cancelButtonProps={{ style: { display: 'none' } }}
      >
        {currentDetail && (() => {
          const s = (statusMap[currentDetail.status] || statusMap.pending);
          const rows = [
            ['订单号', currentDetail.orderNo],
            ['状态', <span key="s" style={{ background: s.bg, color: s.color, padding: '2px 10px', borderRadius: 10, fontSize: 12, fontWeight: 500 }}>● {s.text}</span>],
            ['付款币种', currentDetail.fromCurrency],
            ['付款金额', `${parseFloat(currentDetail.fromAmount || 0).toLocaleString()} ${currentDetail.fromCurrency}`],
            ['折合', currentDetail.toAmount ? `${parseFloat(currentDetail.toAmount).toLocaleString()} ${currentDetail.toCurrency}` : '-'],
            ['账户名称', currentDetail.accountName],
            ['银行开户行', currentDetail.bankBranch],
            ['银行地址', currentDetail.bankAddress],
            ['银行卡号', currentDetail.bankCard],
            ['备注', currentDetail.remark || '-'],
            ['提交时间', currentDetail.createdAt ? moment(currentDetail.createdAt).format('YYYY-MM-DD HH:mm:ss') : '-'],
          ];
          return (
            <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', rowGap: 14, columnGap: 16 }}>
              {rows.map(([k, v], i) => (
                <div key={i} style={{ display: 'contents' }}>
                  <div style={{ color: '#9ca3af', textAlign: 'right', lineHeight: '24px' }}>{k}</div>
                  <div style={{ color: '#1a1a2e', lineHeight: '24px', wordBreak: 'break-all' }}>{v}</div>
                </div>
              ))}
            </div>
          );
        })()}
      </Modal>
    </div>
  );
};

export default Payment;
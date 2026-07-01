import { useState, useEffect } from 'react';
import { useNavigate } from 'umi';
import {
  Form, Input, Select, Button, message, Table, Empty, Spin, Image, DatePicker,
} from 'antd';
import {
  SwapOutlined, EyeOutlined, FileTextOutlined, DownloadOutlined,
  ClockCircleOutlined, CheckCircleOutlined,
} from '@ant-design/icons';
import { exchange } from '@/services/api';
import { useI18n } from '../../locales/I18nContext';
import moment from 'moment';

const { RangePicker } = DatePicker;

const Exchange = () => {
  const [listForm] = Form.useForm();
  const navigate = useNavigate();
  const { t } = useI18n();
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(false);

  const statusMap = {
    pending_review: { text: t('exchangeList.status_pending_review'), color: '#fa8c16', bg: '#fff7e6', icon: <ClockCircleOutlined /> },
    confirmed:     { text: t('exchangeList.status_confirmed'), color: '#1890ff', bg: '#e6f7ff' },
    approved:      { text: t('exchangeList.status_approved'), color: '#52c41a', bg: '#f0fff4', icon: <CheckCircleOutlined /> },
  };

  const fetchData = async (params = {}) => {
    setLoading(true);
    try {
      const values = listForm.getFieldsValue();
      const queryParams = { page, pageSize, ...params };
      if (values.orderNo) queryParams.orderNo = values.orderNo;
      if (values.status) queryParams.status = values.status;
      if (values.dateRange && values.dateRange[0]) {
        queryParams.startDate = values.dateRange[0].format('YYYY-MM-DD');
        queryParams.endDate = values.dateRange[1].format('YYYY-MM-DD');
      }
      const res = await exchange.list(queryParams);
      setData(res.data?.list || []);
      setTotal(res.data?.total || 0);
    } catch (e) {
      message.error(t('exchangeList.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [page, pageSize, t]);

  const handleSearch = () => { setPage(1); fetchData({ page: 1 }); };
  const handleReset = () => { listForm.resetFields(); setPage(1); fetchData({ page: 1 }); };
  const handleApply = () => { navigate('/client/exchange/apply'); };

  const columns = [
    { title: t('exchangeList.exchangeId'), dataIndex: 'exchangeId', key: 'exchangeId', width: 200,
      render: (v) => (
        <span
          style={{ fontFamily: 'monospace', color: '#667eea', fontWeight: 500, cursor: 'pointer' }}
          onClick={() => navigate(`/client/exchange/exchangeInfo/${v}`)}
        >
          {v}
        </span>
      )
    },
    { title: t('exchangeList.fromCurrency'), dataIndex: 'fromCurrency', key: 'fromCurrency', width: 100 },
    { title: t('exchangeList.fromAmount'), dataIndex: 'fromAmount', key: 'fromAmount', width: 130,
      render: (v, r) => <span style={{ fontWeight: 600 }}>{parseFloat(v || 0).toLocaleString()} {r.fromCurrency}</span> },
    { title: t('exchangeList.toCurrency'), dataIndex: 'toCurrency', key: 'toCurrency', width: 100 },
    { title: t('exchangeList.toAmount'), dataIndex: 'toAmount', key: 'toAmount', width: 130,
      render: (v, r) => v ? <span style={{ color: '#52c41a', fontWeight: 600 }}>{parseFloat(v).toLocaleString()} {r.toCurrency}</span> : '-' },
    { title: t('exchangeList.exchangeRate'), dataIndex: 'exchangeRate', key: 'exchangeRate', width: 100,
      render: (v) => v || '-' },
    { title: t('exchangeList.status'), dataIndex: 'status', key: 'status', width: 130,
      render: (s) => {
        const m = statusMap[s] || '';
        return <span style={{ background: m.bg, color: m.color, padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 500 }}>{m.text}</span>;
      }},
    { title: t('exchangeList.createdAt'), dataIndex: 'createdAt', key: 'createdAt', width: 160,
      render: (v) => v ? moment(v).format('YYYY-MM-DD HH:mm') : '-' },
    { title: t('exchangeList.action'), key: 'action', width: 200, fixed: 'right',
      render: (_, r) => {
        const {status} = r || {};
        const isShow = ['confirmed', 'approved'].includes(status);
        return (
        <>
        {
          isShow && (
          <Button type="link" size="small" icon={<FileTextOutlined />} onClick={() => navigate(`/client/exchange/${r.exchangeId}`)}>{t('exchangeList.detail')}</Button>
          )
        }
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => navigate(`/client/exchange/exchangeInfo/${r.exchangeId}`)}>{t('exchangeList.view')}</Button>
        </>
        );
      }
    },
  ];

  return (
    <div style={{ minHeight: 'calc(100vh - 64px)', background: 'linear-gradient(160deg, #f5f7fa 0%, #eceef5 100%)', padding: '24px 32px' }}>
      <div style={{ maxWidth: 1440, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* 顶部标题 */}
        <div style={{ padding: '0 4px' }}>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: '#1a1a2e', margin: 0 }}>{t('exchangeList.title')}</h1>
          <p style={{ fontSize: 13, color: '#9ca3af', marginTop: 4 }}>查询换汇记录，发起新换汇申请</p>
        </div>

        {/* 筛选 + 操作 */}
        <div style={{ background: '#fff', borderRadius: 16, padding: '20px 24px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.04)' }}>
          <Form form={listForm} layout="inline" style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', rowGap: 12, columnGap: 20 }}>
            <Form.Item label={t('exchangeList.exchangeOrderNo')} name="orderNo" labelCol={{ style: { width: 80 } }} style={{ marginBottom: 0 }}>
              <Input placeholder={t('exchangeList.orderNoPlaceholder')} allowClear style={{ width: 280, height: 36 }} />
            </Form.Item>
            <Form.Item label={t('exchangeList.filterStatus')} name="status" labelCol={{ style: { width: 80 } }} style={{ marginBottom: 0 }}>
              <Select placeholder={t('exchangeList.all')} allowClear style={{ width: 280, height: 36 }} options={[
                { value: 'pending_review', label: t('exchangeList.status_pending_review') },
                { value: 'confirmed', label: t('exchangeList.status_confirmed') },
                { value: 'approved', label: t('exchangeList.status_approved') },
              ]} />
            </Form.Item>
            <Form.Item label={t('app.dateRange')} name="dateRange" labelCol={{ style: { width: 80 } }} style={{ marginBottom: 0 }}>
              <RangePicker allowClear style={{ width: 280, height: 36 }} />
            </Form.Item>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button type="primary" onClick={handleSearch} style={{ height: 36, borderRadius: 8, background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', border: 'none', boxShadow: '0 4px 12px rgba(245,158,11,0.3)' }}>{t('app.search')}</Button>
              <Button onClick={handleReset} style={{ height: 36, borderRadius: 8, background: '#f3f4f6', color: '#6b7280', border: '1px solid #e5e7eb' }}>{t('app.reset')}</Button>
              <Button onClick={handleApply} style={{ height: 36, borderRadius: 8, background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', color: '#fff', border: 'none', boxShadow: '0 4px 12px rgba(245,158,11,0.3)' }}>{t('exchangeApply.title')}</Button>
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
              scroll={{ x: 1500 }}
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
    </div>
  );
};

export default Exchange;

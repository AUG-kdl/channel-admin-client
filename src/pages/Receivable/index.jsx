import { useState, useEffect } from 'react';
import { useNavigate } from 'umi';
import { Form, Input, Select, Button, message, Table, Empty, Spin, Tag, Modal } from 'antd';
import { PlusOutlined, EyeOutlined, EditOutlined, DeleteOutlined, UserOutlined, BankOutlined } from '@ant-design/icons';
import { payee } from '@/services/api';
import { useI18n } from '../../locales/I18nContext';
import moment from 'moment';

const Receivable = () => {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [searchForm] = Form.useForm();
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(false);

  const STATUS_MAP = {
    pending_review: { text: t('receivableList.status_pending_review'), color: '#fa8c16', bg: '#fff7e6' },
    approved:       { text: t('receivableList.status_approved'), color: '#52c41a', bg: '#f0fff4' },
    rejected:       { text: t('receivableList.status_rejected'), color: '#f5222d', bg: '#fff1f0' },
  };

  const fetchData = async (params = {}) => {
    setLoading(true);
    try {
      const values = searchForm.getFieldsValue();
      const queryParams = { page, pageSize, ...params };
      if (values.name) queryParams.name = values.name;
      if (values.payeeId) queryParams.payeeId = values.payeeId;
      if (values.type) queryParams.type = values.type;
      if (values.status) queryParams.status = values.status;
      const res = await payee.list(queryParams);
      setData(res.data?.list || []);
      setTotal(res.data?.total || 0);
    } catch (e) {
      message.error(t('receivableList.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [page, pageSize, t]);

  const handleSearch = () => { setPage(1); fetchData({ page: 1 }); };
  const handleReset = () => { searchForm.resetFields(); setPage(1); fetchData({ page: 1 }); };
  const handleView = (record) => { navigate(`/client/receivable/${record.payeeId}`); };

  const [deleteVisible, setDeleteVisible] = useState(false);
  const [deletingRecord, setDeletingRecord] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const handleDeleteClick = (record) => {
    setDeletingRecord(record);
    setDeleteVisible(true);
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await payee.remove(deletingRecord.payeeId);
      message.success(t('receivableList.deleteSuccess'));
      setDeleteVisible(false);
      fetchData();
    } catch (err) {
      message.error(t('receivableList.deleteFailed'));
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    { title: t('receivableList.payeeId'), dataIndex: 'payeeId', key: 'payeeId', width: 180,
      render: (v) => <span style={{ fontFamily: 'monospace', color: '#667eea', fontWeight: 500 }}>{v}</span> },
    { title: t('receivableList.type'), dataIndex: 'type', key: 'type', width: 90,
      render: (v) => (
        <Tag style={{ display: 'inline-flex', alignItems: 'center', gap: 4, borderRadius: 12, padding: '2px 10px', fontSize: 12, background: v === 'personal' ? '#e6f7ff' : '#f9f0ff', color: v === 'personal' ? '#1890ff' : '#722ed1', border: 'none' }}>
          {v === 'personal' ? <UserOutlined /> : <BankOutlined />}
          {v === 'personal' ? t('receivableList.typePersonal') : t('receivableList.typeEnterprise')}
        </Tag>
      ) },
    { title: t('receivableList.name'), key: 'name', width: 220,
      render: (_, r) => r.type === 'personal' ? (r.name || '-') : (r.companyName || '-') },
    { title: t('receivableList.phone'), dataIndex: 'phone', key: 'phone', width: 130, render: (v) => v || '-' },
    { title: t('receivableList.bank'), key: 'bank', width: 200,
      render: (_, r) => {
        const val = r.type === 'personal' ? r.bankCard : r.bankAccount;
        return val ? <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{val}</span> : '-';
      } },
    { title: t('receivableList.bankName'), key: 'bankInfo', width: 220,
      render: (_, r) => r.type === 'personal' ? (r.bankBranch || '-') : (r.bankName || '-') },
    { title: t('receivableList.bankAddress'), key: 'bankAddress', width: 280,
      render: (_, r) => r.type === 'enterprise' ? (r.bankAddress || '-') : null },
    { title: t('receivableList.status'), dataIndex: 'status', key: 'status', width: 110,
      render: (s) => {
        const m = STATUS_MAP[s] || STATUS_MAP.pending_review;
        return <span style={{ background: m.bg, color: m.color, padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 500 }}>{m.text}</span>;
      } },
    { title: t('receivableList.createdAt'), dataIndex: 'createdAt', key: 'createdAt', width: 160,
      render: (v) => v ? moment(v).format('YYYY-MM-DD HH:mm') : '-' },
    { title: t('receivableList.notes'), key: 'notes', width: 120,
      render: (_, r) => <span style={{ color: '#9ca3af', fontSize: 13 }}>{r.notes || '-'}</span> },
    { title: t('receivableList.action'), key: 'action', width: 280, fixed: 'right',
      render: (_, r) => (
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleView(r)}>{t('receivableList.view')}</Button>
          {(r.status === 'pending_review' || r.status === 'rejected') && (
            <Button type="link" size="small" icon={<EditOutlined />} onClick={() => navigate(`/client/receivable/apply`, { state: { fromRejected: r } })}>{t('receivableList.edit')}</Button>
          )}
          {r.status === 'rejected' && (
            <Button type="link" size="small" danger icon={<EditOutlined />} onClick={() => navigate(`/client/receivable/apply`, { state: { fromRejected: r } })}>{t('receivableList.reapply') || '重新填写'}</Button>
          )}
          <Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDeleteClick(r)}>{t('receivableList.delete')}</Button>
        </div>
      ) },
  ];

  return (
    <div style={{ minHeight: 'calc(100vh - 64px)', background: 'linear-gradient(160deg, #f5f7fa 0%, #eceef5 100%)', padding: '24px 32px' }}>
      <div style={{ maxWidth: 1440, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>

        <div style={{ padding: '0 4px' }}>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: '#1a1a2e', margin: 0 }}>{t('receivableList.title')}</h1>
          <p style={{ fontSize: 13, color: '#9ca3af', marginTop: 4 }}>{t('receivableList.title')}</p>
        </div>

        <div style={{ background: '#fff', borderRadius: 16, padding: '20px 24px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.04)' }}>
          <Form form={searchForm} layout="inline" style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', rowGap: 12, columnGap: 20 }}>
            <Form.Item label={t('receivableList.name')} name="name" labelCol={{ style: { width: 80 } }} style={{ marginBottom: 0 }}>
              <Input placeholder={t('receivableList.name')} allowClear style={{ width: 280, height: 36 }} />
            </Form.Item>
            <Form.Item label={t('receivableList.payeeId')} name="payeeId" labelCol={{ style: { width: 80 } }} style={{ marginBottom: 0 }}>
              <Input placeholder={t('receivableList.payeeId')} allowClear style={{ width: 280, height: 36 }} />
            </Form.Item>
            <Form.Item label={t('receivableList.filterType')} name="type" labelCol={{ style: { width: 80 } }} style={{ marginBottom: 0 }}>
              <Select placeholder={t('receivableList.all')} allowClear style={{ width: 280, height: 36 }} options={[
                { value: 'personal', label: t('receivableList.typePersonal') },
                { value: 'enterprise', label: t('receivableList.typeEnterprise') },
              ]} />
            </Form.Item>
            <Form.Item label={t('receivableList.filterStatus')} name="status" labelCol={{ style: { width: 80 } }} style={{ marginBottom: 0 }}>
              <Select placeholder={t('receivableList.all')} allowClear style={{ width: 280, height: 36 }} options={[
                { value: 'pending_review', label: t('receivableList.status_pending_review') },
                { value: 'approved', label: t('receivableList.status_approved') },
                { value: 'rejected', label: t('receivableList.status_rejected') },
              ]} />
            </Form.Item>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button type="primary" onClick={handleSearch} style={{ height: 36, borderRadius: 8, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', border: 'none', boxShadow: '0 4px 12px rgba(102,126,234,0.3)' }}>{t('app.search')}</Button>
              <Button onClick={handleReset} style={{ height: 36, borderRadius: 8, background: '#f3f4f6', color: '#6b7280', border: '1px solid #e5e7eb' }}>{t('app.reset')}</Button>
              <Button onClick={() => navigate('/client/receivable/apply')} style={{ height: 36, borderRadius: 8, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: '#fff', border: 'none', boxShadow: '0 4px 12px rgba(102,126,234,0.3)' }}>
                <PlusOutlined />{t('receivableList.addBtn')}
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
              rowKey="id"
              scroll={{ x: 1400 }}
              pagination={{
                current: page, pageSize, total,
                onChange: (p, ps) => { setPage(p); setPageSize(ps); },
                showSizeChanger: false,
              }}
            />
          )}
        </div>
      </div>

      <Modal
        open={deleteVisible}
        onCancel={() => setDeleteVisible(false)}
        onOk={confirmDelete}
        confirmLoading={deleting}
        okText={t('receivableList.deleteOk')}
        cancelText={t('receivableList.deleteCancel')}
        okButtonProps={{ danger: true }}
        title={t('receivableList.deleteTitle')}
      >
        <div style={{ padding: '8px 0', fontSize: 14, color: '#333', lineHeight: 1.7 }}>
          {t('receivableList.deleteContent')}
        </div>
      </Modal>
    </div>
  );
};

export default Receivable;

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'umi';
import { Button, Spin, Result, Modal, message, Card, Steps } from 'antd';
import { ArrowLeftOutlined, CheckCircleOutlined, ClockCircleOutlined, FileTextOutlined } from '@ant-design/icons';
import { withdrawal } from '@/services/api';
import { useI18n } from '@/locales/I18nContext';
import moment from 'moment';

const fmt = (n) => parseFloat(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2 });

const FileCard = ({ url, name }) => {
  if (!url) return null;
  const ext = url.split('.').pop()?.toLowerCase().split('?')[0];
  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(ext);
  const fileName = name || url.split('/').pop() || '文件';
  const handleDownload = (e) => {
    e.preventDefault();
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 110 }}>
      {isImage ? (
        <img
          src={url}
          style={{ width: 100, height: 80, objectFit: 'cover', borderRadius: 8, border: '1px solid #e8e8f0', cursor: 'pointer' }}
          onClick={() => window.open(url, '_blank')}
        />
      ) : (
        <div
          style={{ width: 100, height: 80, background: '#fff1f0', border: '1px solid #ffccc7', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          onClick={() => window.open(url, '_blank')}
        >
          <span style={{ fontSize: 12, color: '#ff4d4f', fontWeight: 600 }}>PDF</span>
        </div>
      )}
      <span
        style={{ fontSize: 11, color: '#667eea', marginTop: 4, cursor: 'pointer', textAlign: 'center', maxWidth: 110, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
        onClick={handleDownload}
        title={fileName}
      >
        {fileName}
      </span>
    </div>
  );
};

const WithdrawalDetail = () => {
  const { withdrawalId } = useParams();
  const navigate = useNavigate();
  const { t } = useI18n();
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [confirming, setConfirming] = useState(false);


  useEffect(() => { fetchDetail(); }, [withdrawalId]);

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const res = await withdrawal.detail(withdrawalId);
      if (res.code === 0) setDetail(res.data);
    } catch (e) {
      // Error handled by interceptor
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    setConfirming(true);
    try {
      await withdrawal.complete(withdrawalId);
      message.success(t('withdrawalDetail.success'));
      setConfirmVisible(false);
      fetchDetail();
    } catch (e) {
      // Error handled by interceptor
    } finally {
      setConfirming(false);
    }
  };

  const status = detail?.status;
  const files = Array.isArray(detail?.proofFiles) ? detail.proofFiles : [];
  const isPending = status === 'pending_review';
  const isUploaded = status === 'uploaded';
  const isCompleted = status === 'completed';

  return (
    <div style={{ minHeight: 'calc(100vh - 64px)', background: 'linear-gradient(160deg, #f5f7fa 0%, #eceef5 100%)', padding: '24px 32px' }}>
      <div style={{ maxWidth: 860, margin: '0 auto' }}>

        {/* 顶部导航 */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24, gap: 8 }}>
          <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate('/client/withdrawal')} style={{ color: '#667eea', fontSize: 14 }}>
            {t('withdrawalDetail.back')}
          </Button>
          <span style={{ color: '#d0d0d8' }}>/</span>
          <span style={{ color: '#667eea', fontSize: 14, fontWeight: 500 }}>{t('withdrawalDetail.withdrawal')}</span>
          <span style={{ color: '#d0d0d8' }}>/</span>
          <span style={{ color: '#333', fontSize: 14, fontWeight: 500 }}>{t('withdrawalDetail.detail')}</span>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><Spin size="large" /></div>
        ) : !detail ? (
          <Result status="error" title={t('withdrawalDetail.notFound')} extra={<Button type="primary" onClick={() => navigate('/client/withdrawal')}>{t('withdrawalDetail.backToList')}</Button>} />
        ) : (
          <Card style={{ borderRadius: 20, boxShadow: '0 4px 20px rgba(102,126,234,0.08)', border: '1px solid rgba(102,126,234,0.1)' }} bodyStyle={{ padding: 0 }}>

            {/* 步骤条 */}
            <div style={{ padding: '28px 32px 20px', borderBottom: '1px solid #f0f0f0' }}>
              {isCompleted ? (
                <Steps current={1} status="finish" items={[{ title: t('withdrawalDetail.step1') }, { title: t('withdrawalDetail.step2') }]} />
              ) : (
                <Steps current={isUploaded ? 1 : 0} items={[{ title: t('withdrawalDetail.step1') }, { title: t('withdrawalDetail.step2') }]} />
              )}
            </div>

            {/* 待处理 */}
            {isPending && (
              <div style={{ padding: '32px 32px 28px', textAlign: 'center' }}>
                <ClockCircleOutlined style={{ fontSize: 40, color: '#fa8c16', marginBottom: 12 }} />
                <div style={{ fontSize: 16, fontWeight: 600, color: '#333', marginBottom: 6 }}>{t('withdrawalDetail.waitingUpload')}</div>
                <div style={{ fontSize: 13, color: '#9ca3af', marginBottom: 24 }}>{t('withdrawalDetail.waitingUploadDesc')}</div>
                <div style={{ fontSize: 32, fontWeight: 700, color: '#667eea', marginBottom: 8 }}>{fmt(detail.amount)} {detail.currency}</div>
                <div style={{ fontSize: 13, color: '#9ca3af', marginBottom: 28 }}>{t('withdrawalDetail.payee')}：{detail.payeeName}</div>
                <Button size="large" onClick={() => navigate('/client/withdrawal')} style={{ width: 160, height: 48, borderRadius: 12, fontSize: 15, border: '1px solid #e5e7eb', color: '#374151', background: '#fff' }}>
                  {t('withdrawalDetail.backToListBtn')}
                </Button>
              </div>
            )}

            {/* 已上传 */}
            {isUploaded && (
              <div style={{ padding: '32px 32px 28px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0 32px', marginBottom: 24 }}>
                  <div style={{ textAlign: 'center', padding: '16px 0', borderRight: '1px solid #f0f0f0' }}>
                    <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 6 }}>{t('withdrawalDetail.amount')}</div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: '#667eea' }}>{fmt(detail.amount)}</div>
                    <div style={{ fontSize: 13, color: '#667eea' }}>{detail.currency}</div>
                  </div>
                  <div style={{ textAlign: 'center', padding: '16px 0', borderRight: '1px solid #f0f0f0' }}>
                    <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 6 }}>{t('withdrawalDetail.payee')}</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#333' }}>{detail.payeeName}</div>
                  </div>
                  <div style={{ textAlign: 'center', padding: '16px 0' }}>
                    <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 6 }}>{t('withdrawalDetail.handlingFee')}</div>
                    <div style={{ fontSize: 16, fontWeight: 600, color: detail.handlingFee != null ? '#667eea' : '#d0d0d0' }}>
                      {detail.handlingFee != null ? `${fmt(detail.handlingFee)} ${detail.currency}` : '—'}
                    </div>
                  </div>
                </div>
                {detail.arrivalAmount != null && (
                  <div style={{ textAlign: 'center', padding: '10px 0', marginBottom: 16, background: '#f0fff4', borderRadius: 10, border: '1px solid #b7eb8f' }}>
                    <div style={{ fontSize: 12, color: '#52c41a', marginBottom: 4 }}>{t('withdrawalDetail.arrivalAmount')}</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: '#52c41a' }}>{fmt(detail.arrivalAmount)} {detail.currency}</div>
                  </div>
                )}
                {files.length > 0 && (
                  <div style={{ marginBottom: 24 }}>
                    <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 10 }}>{t('withdrawalDetail.proofTitle')}（{files.length}{t('withdrawalDetail.proofCount').replace('{count}', '')}）</div>
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                      {files.map((f, i) => <FileCard key={i} url={typeof f === 'string' ? f : f.url} name={typeof f === 'object' ? f.name : null} />)}
                    </div>
                  </div>
                )}
                <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                  <Button size="large" onClick={() => navigate('/client/withdrawal')} style={{ width: 160, height: 48, borderRadius: 12, fontSize: 15, border: '1px solid #e5e7eb', color: '#374151', background: '#fff' }}>
                    {t('withdrawalDetail.backToListBtn')}
                  </Button>
                  <Button
                    type="primary"
                    size="large"
                    onClick={() => setConfirmVisible(true)}
                    style={{
                      width: 200, height: 48, borderRadius: 12, fontSize: 15,
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      border: 'none', boxShadow: '0 4px 16px rgba(102,126,234,0.3)',
                    }}
                  >
                    <CheckCircleOutlined />{t('withdrawalDetail.confirmCompleteBtn')}
                  </Button>
                </div>
              </div>
            )}

            {/* 已完成 */}
            {isCompleted && (
              <div style={{ padding: '32px 32px 28px' }}>
                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                  <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 4px 16px rgba(102,126,234,0.35)' }}>
                    <CheckCircleOutlined style={{ fontSize: 24, color: '#fff' }} />
                  </div>
                  <div style={{ fontSize: 17, fontWeight: 600, color: '#667eea', marginBottom: 4 }}>{t('withdrawalDetail.withdrawalComplete')}</div>
                  <div style={{ fontSize: 13, color: '#9ca3af' }}>{t('withdrawalDetail.completeTime')}：{detail.updatedAt ? moment(detail.updatedAt).format('YYYY-MM-DD HH:mm') : ''}</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0 32px', marginBottom: 24 }}>
                  <div style={{ textAlign: 'center', padding: '16px 0', borderRight: '1px solid #f0f0f0' }}>
                    <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 6 }}>{t('withdrawalDetail.amount')}</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#667eea' }}>{fmt(detail.amount)}</div>
                    <div style={{ fontSize: 13, color: '#667eea' }}>{detail.currency}</div>
                  </div>
                  <div style={{ textAlign: 'center', padding: '16px 0', borderRight: '1px solid #f0f0f0' }}>
                    <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 6 }}>{t('withdrawalDetail.payee')}</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#333' }}>{detail.payeeName}</div>
                  </div>
                  <div style={{ textAlign: 'center', padding: '16px 0' }}>
                    <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 6 }}>{t('withdrawalDetail.handlingFee')}</div>
                    <div style={{ fontSize: 16, fontWeight: 600, color: detail.handlingFee != null ? '#667eea' : '#d0d0d0' }}>
                      {detail.handlingFee != null ? `${fmt(detail.handlingFee)} ${detail.currency}` : '—'}
                    </div>
                  </div>
                </div>
                {detail.arrivalAmount != null && (
                  <div style={{ textAlign: 'center', padding: '10px 0', marginBottom: 16, background: '#f0fff4', borderRadius: 10, border: '1px solid #b7eb8f' }}>
                    <div style={{ fontSize: 12, color: '#52c41a', marginBottom: 4 }}>{t('withdrawalDetail.arrivalAmount')}</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: '#52c41a' }}>{fmt(detail.arrivalAmount)} {detail.currency}</div>
                  </div>
                )}
                {files.length > 0 && (
                  <div style={{ marginBottom: 24 }}>
                    <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 10 }}>{t('withdrawalDetail.proofTitle')}（{files.length}{t('withdrawalDetail.proofCount').replace('{count}', '')}）</div>
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                      {files.map((f, i) => <FileCard key={i} url={typeof f === 'string' ? f : f.url} name={typeof f === 'object' ? f.name : null} />)}
                    </div>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <Button size="large" onClick={() => navigate('/client/withdrawal')} style={{ width: 160, height: 48, borderRadius: 12, fontSize: 15, border: '1px solid #e5e7eb', color: '#374151', background: '#fff' }}>
                    {t('withdrawalDetail.backToListBtn')}
                  </Button>
                </div>
              </div>
            )}
          </Card>
        )}
      </div>

      {/* 确认完成弹框 */}
      <Modal
        open={confirmVisible}
        onCancel={() => setConfirmVisible(false)}
        footer={null}
        closable={false}
        centered
        width={360}
        styles={{ body: { padding: 0, overflow: 'hidden' } }}
      >
        <div style={{ textAlign: 'center', padding: '32px 24px 24px' }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: 'linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%)',
            border: '2px solid #c4b5fd',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px',
          }}>
            <CheckCircleOutlined style={{ fontSize: 28, color: '#7c3aed' }} />
          </div>
          <div style={{ fontSize: 17, fontWeight: 600, color: '#1a1a2e', marginBottom: 8 }}>{t('withdrawalDetail.confirmTitle')}</div>
          <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 28, lineHeight: 1.6 }}>
            {t('withdrawalDetail.confirmDesc')}
          </div>
          <div style={{ background: '#f8f9ff', borderRadius: 12, padding: '14px 18px', marginBottom: 24, textAlign: 'left' }}>
            <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 4 }}>{t('withdrawalDetail.payee')}</div>
            <div style={{ fontSize: 14, fontWeight: 500, color: '#333', marginBottom: 8 }}>{detail?.payeeName}</div>
            <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 4 }}>{t('withdrawalDetail.amount')}</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#667eea' }}>
              {detail ? `${fmt(detail.amount)} ${detail.currency}` : ''}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={() => setConfirmVisible(false)}
              style={{
                flex: 1, height: 44, borderRadius: 10, border: '1px solid #e5e7eb',
                background: '#fff', color: '#374151', fontSize: 15, fontWeight: 500,
                cursor: 'pointer', transition: 'all 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
              onMouseLeave={e => e.currentTarget.style.background = '#fff'}
            >
              {t('withdrawalDetail.cancel')}
            </button>
            <button
              onClick={handleConfirm}
              disabled={confirming}
              style={{
                flex: 1, height: 44, borderRadius: 10,
                background: confirming ? '#9ca3af' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none', color: '#fff', fontSize: 15, fontWeight: 500,
                cursor: confirming ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 12px rgba(102,126,234,0.3)',
                transition: 'all 0.2s',
              }}
            >
              {confirming ? '...' : t('withdrawalDetail.confirmBtn')}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default WithdrawalDetail;

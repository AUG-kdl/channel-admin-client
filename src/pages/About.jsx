import { Row, Col } from 'antd';
import { useI18n } from '../locales/I18nContext';

const About = () => {
  const { t, td } = useI18n();

  const advantages = (td('about.advantages') || []).map((item, i) => ({
    num: `0${i + 1}`,
    ...item,
    icon: ['🏦', '📋', '🛒', '📊', '🌐', '💰'][i],
  }));

  const offices = td('about.offices') || [];

  return (
    <div style={{ minHeight: 'calc(100vh - 64px)', background: '#f5f6f8' }}>
      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '60px 32px', textAlign: 'center' }}>
        <div style={{
          width: 64,
          height: 64,
          background: 'rgba(255,255,255,0.2)',
          borderRadius: 16,
          lineHeight: '64px',
          fontSize: 32,
          fontWeight: 700,
          color: '#fff',
          margin: '0 auto 24px',
          position: 'relative',
          display: 'inline-block',
        }}>
          G<span style={{ position: 'absolute', top: -6, right: 8, fontSize: 14, color: '#ffd700' }}>★</span>
        </div>
        <h1 style={{ color: '#fff', fontSize: 32, fontWeight: 700, margin: '0 0 8px' }}>{t('about.brand')}</h1>
        <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 15, margin: '0 0 24px' }}>{t('about.services')}</p>
        <div style={{
          display: 'inline-block',
          background: 'rgba(255,255,255,0.15)',
          border: '1px solid rgba(255,255,255,0.3)',
          borderRadius: 12,
          padding: '16px 32px',
          marginBottom: 24,
        }}>
          <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, marginBottom: 6 }}>{t('about.corePurpose')}</div>
          <div style={{ color: '#fff', fontSize: 16, fontWeight: 500 }}>{t('about.corePurposeDesc')}</div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
          {[t('about.featureStable'), t('about.featureFast'), t('about.featureSave'), t('about.featureBestRate')].map((item) => (
            <span key={item} style={{
              background: 'rgba(255,255,255,0.2)',
              color: '#fff',
              padding: '10px 20px',
              fontSize: 14,
              borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.3)'
            }}>
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* 六大产品 */}
      <div style={{ background: '#fff', padding: '48px 32px', borderBottom: '1px solid #eee' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <h2 style={{ fontSize: 24, fontWeight: 600, color: '#333', marginBottom: 32, textAlign: 'center' }}>{t('about.sixProducts')}</h2>
          <Row gutter={[20, 20]}>
            {advantages.map((item) => (
              <Col xs={24} sm={12} lg={8} key={item.num} style={{ marginBottom: 60 }}>
                <div style={{
                  background: '#fff',
                  borderRadius: 16,
                  padding: 28,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                  height: '100%',
                  minHeight: 160,
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                    <div style={{
                      width: 48,
                      height: 48,
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      borderRadius: 12,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 22,
                      flexShrink: 0,
                    }}>
                      {item.icon}
                    </div>
                    <div>
                      <div style={{ color: '#667eea', fontSize: 22, fontWeight: 700, marginBottom: 6 }}>{item.num}</div>
                      <div style={{ color: '#333', fontSize: 14, fontWeight: 600, marginBottom: 6, lineHeight: 1.4 }}>{item.title}</div>
                      <div style={{ color: '#666', fontSize: 12, lineHeight: 1.6 }}>{item.desc}</div>
                    </div>
                  </div>
                </div>
              </Col>
            ))}
          </Row>
        </div>
      </div>

      {/* 平台介绍 */}
      <div style={{ background: '#f5f6f8', padding: '48px 32px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: 16,
            padding: '40px',
          }}>
            <h2 style={{ fontSize: 22, fontWeight: 600, color: '#fff', marginBottom: 16 }}>{t('about.platformIntro')}</h2>
            <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: 14, lineHeight: 2, margin: 0 }}>
              {t('about.platformDesc')}
            </p>
          </div>
        </div>
      </div>

      {/* 联系方式 */}
      <div style={{ background: '#fff', padding: '48px 32px', borderTop: '1px solid #eee' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <span style={{
              display: 'inline-block',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: '#fff',
              padding: '12px 32px',
              borderRadius: 24,
              fontSize: 16,
              fontWeight: 500,
            }}>
              🌐 www.rostonpay.com
            </span>
          </div>
          <Row gutter={[20, 20]}>
            {offices.map((item) => (
              <Col xs={24} sm={12} lg={6} key={item.city}>
                <div style={{
                  background: '#f8f9fb',
                  borderRadius: 12,
                  padding: '24px 20px',
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: 28, marginBottom: 12 }}>📍</div>
                  <div style={{ color: '#333', fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{item.city}</div>
                  <div style={{ color: '#999', fontSize: 12, marginBottom: 8 }}>{item.country}</div>
                  <div style={{ color: '#666', fontSize: 12, lineHeight: 1.6 }}>{item.address}</div>
                </div>
              </Col>
            ))}
          </Row>
        </div>
      </div>

      {/* Footer */}
      <div style={{ textAlign: 'center', padding: 24, color: '#ccc', fontSize: 12 }}>
        © 2024 General Star Co., Limited. All Rights Reserved.
      </div>
    </div>
  );
};

export default About;

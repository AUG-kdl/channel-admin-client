import { useState, useEffect } from 'react';
import { useNavigate } from 'umi';
import { Card, Spin, Row, Col, Input, Select, Button, message } from 'antd';
import { DollarOutlined, WalletOutlined, FileTextOutlined, RiseOutlined, UploadOutlined, SwapOutlined, UserSwitchOutlined, PlusOutlined } from '@ant-design/icons';
import { rate, wallet, exchange, deposit, withdrawal } from '@/services/api';
import { useI18n } from '../locales/I18nContext';

const CURRENCY_MAP = {
  USD: 'currencyUSD',
  CNY: 'currencyCNY',
  CNH: 'currencyCNH',
  RUB: 'currencyRUB',
};

// 操作指引 - 样式
const guideCardStyle = {
  background: '#fafbfc',
  border: '1px solid #f0f0f2',
  borderRadius: 14,
  padding: '20px 16px',
  display: 'flex',
  flexDirection: 'column',
  minHeight: 180,
};

const guideLinkStyle = {
  fontSize: 13,
  color: '#1677ff',
  textDecoration: 'none',
  padding: '6px 10px',
  borderRadius: 8,
  background: '#fff',
  border: '1px solid #e8e8f0',
  display: 'block',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

// 步骤头部（编号 + 标题）
const StepHeader = ({ num, title }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 10, borderBottom: '1px solid #f0f0f2' }}>
    <div style={{
      width: 26,
      height: 26,
      borderRadius: '50%',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: '#fff',
      fontSize: 13,
      fontWeight: 700,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    }}>
      {num}
    </div>
    <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1a2e' }}>{title}</div>
  </div>
);

// 操作指引步骤条
const stepperAccent = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';

const StepNode = ({ num, icon, title, subtitle, color = '#667eea', isLast }) => (
  <div style={{ display: 'flex', alignItems: 'stretch', flex: 1, minWidth: 0 }}>
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, minWidth: 0 }}>
      {/* 数字在上 + 图标在下 */}
      <div style={{
        fontSize: 13,
        fontWeight: 700,
        color: color,
        letterSpacing: 1,
      }}>STEP {num}</div>
      <div style={{
        width: 52,
        height: 52,
        borderRadius: '50%',
        background: stepperAccent,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        fontSize: 24,
        boxShadow: `0 4px 12px ${color}33`,
        marginTop: 6,
      }}>
        {icon}
      </div>
      {/* 标题 */}
      <div style={{ marginTop: 12, fontSize: 14, fontWeight: 600, color: '#1a1a2e', textAlign: 'center' }}>{title}</div>
      {subtitle && <div style={{ marginTop: 4, fontSize: 12, color: '#9095a3', textAlign: 'center' }}>{subtitle}</div>}
    </div>
    {/* 连接线（虚线） */}
    {!isLast && (
      <div style={{
        flex: '0 0 60px',
        alignSelf: 'center',
        height: 2,
        marginBottom: 28,
        backgroundImage: 'linear-gradient(to right, #c9cfe0 50%, transparent 50%)',
        backgroundSize: '10px 2px',
        backgroundRepeat: 'repeat-x',
      }} />
    )}
  </div>
);

// 无框链接按钮（带 →）
const LinkBtn = ({ onClick, children }) => (
  <span
    onClick={onClick}
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      color: '#667eea',
      fontSize: 13,
      fontWeight: 500,
      cursor: 'pointer',
      padding: '4px 0',
      transition: 'color 0.2s',
    }}
    onMouseEnter={e => e.currentTarget.style.color = '#764ba2'}
    onMouseLeave={e => e.currentTarget.style.color = '#667eea'}
  >
    {children}
  </span>
);

// 待办状态展示
const TodoStatus = ({ hasTodo, t }) => (
  <div style={{
    fontSize: 13,
    color: hasTodo ? '#fa8c16' : '#52c41a',
    lineHeight: 1.6,
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  }}>
    {hasTodo ? `ⓘ ${t('home.hasTodo')}` : `✓ ${t('home.noTodoStatus')}`}
  </div>
);

const Home = () => {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [rates, setRates] = useState({});
  const [walletBalances, setWalletBalances] = useState({});
  const [fromCurrency, setFromCurrency] = useState('USD');
  const [toCurrency, setToCurrency] = useState('CNY');
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [currentTime, setCurrentTime] = useState('');
  const [todoList, setTodoList] = useState([]);
  // 各模块待办状态（用于底部操作指引）{ deposit, exchange, withdrawal }
  const [moduleTodos, setModuleTodos] = useState({ deposit: false, exchange: false, withdrawal: false });

  useEffect(() => {
    const fetchRates = async () => {
      try {
        const res = await rate.list();
        const rateMap = {};
        res.data.forEach(item => {
          rateMap[`${item.baseCurrency}_${item.quoteCurrency}`] = parseFloat(item.rate);
        });
        setRates(rateMap);
      } catch (e) {
        // 错误已由拦截器统一处理
      }
    };
    fetchRates();
    const interval = setInterval(fetchRates, 30000);

    const fetchWallet = async () => {
      try {
        const res = await wallet.getMy();
        const bal = {};
        (res.data || []).forEach(item => { bal[item.currency] = parseFloat(item.balance); });
        setWalletBalances(bal);
      } catch (e) {
        // 错误已由拦截器统一处理
      }
    };
    fetchWallet();

    // 拉取待办
    // 各模块的"已完成"状态：不在这些状态里的就算待办
    const DONE_EXCHANGE = ['approved'];
    const DONE_DEPOSIT = ['approved'];
    const DONE_WITHDRAWAL = ['completed', 'cancelled'];
    const fetchTodo = async () => {
      const [exRes, depRes, wdRes] = await Promise.allSettled([
        exchange.list({ page: 1, pageSize: 100 }),
        deposit.list({ page: 1, pageSize: 100 }),
        withdrawal.list({ page: 1, pageSize: 100 }),
      ]);

      const todos = [];
      const hasExchange = exRes.status === 'fulfilled' && exRes.value.data?.list?.some(item => !DONE_EXCHANGE.includes(item.status));
      const hasDeposit = depRes.status === 'fulfilled' && depRes.value.data?.list?.some(item => !DONE_DEPOSIT.includes(item.status));
      const hasWithdrawal = wdRes.status === 'fulfilled' && wdRes.value.data?.list?.some(item => !DONE_WITHDRAWAL.includes(item.status));

      if (hasExchange) todos.push({ type: 'exchange', label: t('home.todoExchange'), path: '/client/exchange' });
      if (hasDeposit) todos.push({ type: 'deposit', label: t('home.todoDeposit'), path: '/client/deposit' });
      if (hasWithdrawal) todos.push({ type: 'withdrawal', label: t('home.todoWithdrawal'), path: '/client/withdrawal' });

      setTodoList(todos);
      setModuleTodos({ deposit: hasDeposit, exchange: hasExchange, withdrawal: hasWithdrawal });
    };
    fetchTodo();

    setTimeout(() => setLoading(false), 600);
    return () => clearInterval(interval);
  }, [t]);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const getRate = (from, to) => {
    const key = `${from}_${to}`;
    if (rates[key]) return rates[key];
    const reverseKey = `${to}_${from}`;
    if (rates[reverseKey]) return (1 / rates[reverseKey]).toFixed(6);
    return 1;
  };

  const handleFromAmountChange = (e) => {
    const value = e.target.value;
    setFromAmount(value);
    if (value && !isNaN(value)) {
      setToAmount((parseFloat(value) * getRate(fromCurrency, toCurrency)).toFixed(2));
    } else {
      setToAmount('');
    }
  };

  const handleToAmountChange = (e) => {
    const value = e.target.value;
    setToAmount(value);
    if (value && !isNaN(value)) {
      setFromAmount((parseFloat(value) * getRate(toCurrency, fromCurrency)).toFixed(2));
    } else {
      setFromAmount('');
    }
  };

  const handleFromCurrencyChange = (value) => {
    setFromCurrency(value);
    if (fromAmount) {
      setToAmount((fromAmount * getRate(value, toCurrency)).toFixed(2));
    }
  };

  const handleToCurrencyChange = (value) => {
    setToCurrency(value);
    if (fromAmount) {
      setToAmount((fromAmount * getRate(fromCurrency, value)).toFixed(2));
    }
  };

  const handleSwap = () => {
    const temp = fromCurrency;
    const tempAmount = fromAmount;
    setFromCurrency(toCurrency);
    setToCurrency(temp);
    setFromAmount(toAmount);
    setToAmount(tempAmount);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f5f7fa' }}>
        <Spin size="large" />
      </div>
    );
  }

  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const firstDay = new Date(currentYear, currentMonth, 1).getDay() || 7;
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const prevDays = new Date(currentYear, currentMonth, 0).getDate();
  const todayDay = today.getDate();

  const calendarDays = [];
  for (let i = firstDay - 1; i > 0; i--) {
    calendarDays.push({ day: prevDays - i + 1, other: true });
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push({ day: i, other: false, isToday: i === todayDay });
  }
  const remaining = 42 - calendarDays.length;
  for (let i = 1; i <= remaining; i++) {
    calendarDays.push({ day: i, other: true });
  }

  const weekdays = ['一', '二', '三', '四', '五', '六', '日'];

  const walletCards = [
    { currency: 'USD', key: 'currencyUSD' },
    { currency: 'CNY', key: 'currencyCNY' },
    { currency: 'CNH', key: 'currencyCNH' },
    { currency: 'RUB', key: 'currencyRUB' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg, #f5f7fa 0%, #eceef5 100%)', padding: '32px' }}>
      <div style={{ maxWidth: 1440, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* 上半部分 */}
        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>

          {/* 左侧 2/3 */}
          <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: 20, minHeight: 820 }}>

            {/* 我的钱包 */}
            <div style={{ background: '#fff', borderRadius: 16, padding: 24 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#667eea', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 6 }}>
                <WalletOutlined />
                {t('home.wallet')}
              </div>
              <Row gutter={[16, 16]}>
                {walletCards.map(item => {
                  const balance = walletBalances[item.currency] || 0;
                  return (
                    <Col span={6} key={item.currency}>
                      <div style={{ background: '#dbeafe', borderRadius: 16, padding: '20px 16px', minHeight: 100, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 2px 12px rgba(59,130,246,0.12)', border: '1px solid #93c5fd' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div style={{ fontSize: 22, fontWeight: 700, color: '#1e3a8a', letterSpacing: '-0.5px' }}>{item.currency}</div>
                          <div style={{ fontSize: 11, color: '#60a5fa', textAlign: 'right' }}>{t('home.' + item.key)}</div>
                        </div>
                        <div style={{ fontSize: balance > 0 ? 20 : 16, fontWeight: 700, color: '#1a1a2e', wordBreak: 'break-all', marginTop: 8 }}>
                          {balance > 0
                            ? balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                            : '-'}
                        </div>
                      </div>
                    </Col>
                  );
                })}
              </Row>
            </div>

            {/* 货币兑换 */}
            <div className="card" style={{ background: '#fff', borderRadius: 20, padding: 28, boxShadow: '0 2px 16px rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.04)', flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#1a1a2e', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#52c41a' }} />
                {t('home.exchangeCalc')}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 28, flex: 1 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 8, fontWeight: 500 }}>{t('home.from')}</div>
                    <div style={{ background: '#f0f6ff', border: '1px solid #dde8ff', borderRadius: 14, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
                      <input
                        value={fromAmount}
                        onChange={handleFromAmountChange}
                        placeholder="0.00"
                        style={{ flex: 1, background: 'transparent', border: 'none', color: '#1a1a2e', fontSize: 22, fontWeight: 600, outline: 'none' }}
                      />
                      <span style={{ color: '#667eea', fontSize: 15, fontWeight: 600 }}>{fromCurrency}</span>
                    </div>
                  </div>
                  <Select
                    value={fromCurrency}
                    onChange={handleFromCurrencyChange}
                    style={{ width: '100%', height: 44 }}
                    dropdownStyle={{ background: '#fff', borderRadius: 10 }}
                    options={[
                      { value: 'USD', label: `USD ${t('home.currencyUSD')}` },
                      { value: 'CNY', label: `CNY ${t('home.currencyCNY')}` },
                      { value: 'CNH', label: `CNH ${t('home.currencyCNH')}` },
                      { value: 'RUB', label: `RUB ${t('home.currencyRUB')}` },
                    ]}
                  />
                </div>

                <div
                  onClick={handleSwap}
                  style={{ width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg, #5b67d9 0%, #667eea 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 6px 20px rgba(102,126,234,0.35)', flexShrink: 0, transition: 'transform 0.3s, box-shadow 0.3s', color: '#fff' }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'rotate(180deg)'; e.currentTarget.style.boxShadow = '0 10px 28px rgba(102,126,234,0.45)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 6px 20px rgba(102,126,234,0.35)'; }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M7 16l-4-4 4-4M17 8l4 4-4 4M3 12h18"/>
                  </svg>
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 8, fontWeight: 500 }}>{t('home.to')}</div>
                    <div style={{ background: '#f0f6ff', border: '1px solid #dde8ff', borderRadius: 14, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
                      <input
                        value={toAmount}
                        onChange={handleToAmountChange}
                        placeholder="0.00"
                        style={{ flex: 1, background: 'transparent', border: 'none', color: '#1a1a2e', fontSize: 22, fontWeight: 600, outline: 'none' }}
                      />
                      <span style={{ color: '#667eea', fontSize: 15, fontWeight: 600 }}>{toCurrency}</span>
                    </div>
                  </div>
                  <Select
                    value={toCurrency}
                    onChange={handleToCurrencyChange}
                    style={{ width: '100%', height: 44 }}
                    dropdownStyle={{ background: '#fff', borderRadius: 10 }}
                    options={[
                      { value: 'USD', label: `USD ${t('home.currencyUSD')}` },
                      { value: 'CNY', label: `CNY ${t('home.currencyCNY')}` },
                      { value: 'CNH', label: `CNH ${t('home.currencyCNH')}` },
                      { value: 'RUB', label: `RUB ${t('home.currencyRUB')}` },
                    ]}
                  />
                </div>
              </div>
              <div style={{ textAlign: 'center', marginTop: 18, paddingTop: 16, borderTop: '1px solid #f4f5f7', fontSize: 14, color: '#9ca3af' }}>
                {t('home.currentRate').replace('{from}', fromCurrency).replace('{rate}', getRate(fromCurrency, toCurrency)).replace('{to}', toCurrency)}
              </div>
            </div>

            {/* 快捷操作 */}
            <div className="card" style={{ background: '#fff', borderRadius: 20, padding: '24px 28px', boxShadow: '0 2px 16px rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.04)' }}>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#1a1a2e', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#fa8c16' }} />
                {t('home.quickActions')}
              </div>
              <Row gutter={[14, 14]}>

                {/* 入金 */}
                <Col span={8}>
                  <div
                    onClick={() => navigate('/client/deposit/apply')}
                    style={{ background: '#fafbfc', border: '1px solid #f0f0f2', borderRadius: 16, padding: '20px 16px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.22s' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#722ed1'; e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(114,46,209,0.12)'; e.currentTarget.style.background = '#fff'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#f0f0f2'; e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; e.currentTarget.style.background = '#fafbfc'; }}
                  >
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg, #722ed1, #b37feb)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                      <UploadOutlined style={{ fontSize: 18, color: '#fff' }} />
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1a2e', marginBottom: 4 }}>{t('home.depositApply')}</div>
                    <div style={{ fontSize: 12, color: '#9ca3af' }}>{t('home.depositSub')}</div>
                  </div>
                </Col>

                {/* 换汇 */}
                <Col span={8}>
                  <div
                    onClick={() => navigate('/client/exchange/apply')}
                    style={{ background: '#fafbfc', border: '1px solid #f0f0f2', borderRadius: 16, padding: '20px 16px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.22s' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#fa8c16'; e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(250,140,22,0.12)'; e.currentTarget.style.background = '#fff'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#f0f0f2'; e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; e.currentTarget.style.background = '#fafbfc'; }}
                  >
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg, #fa8c16, #ffd666)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                      <SwapOutlined style={{ fontSize: 18, color: '#fff' }} />
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1a2e', marginBottom: 4 }}>{t('home.exchangeApply')}</div>
                    <div style={{ fontSize: 12, color: '#9ca3af' }}>{t('home.exchangeSub')}</div>
                  </div>
                </Col>

                {/* 提现/付款 */}
                <Col span={8}>
                  <div
                    onClick={() => navigate('/client/withdrawal/apply')}
                    style={{ background: '#fafbfc', border: '1px solid #f0f0f2', borderRadius: 16, padding: '20px 16px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.22s' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#13c2c2'; e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(19,194,194,0.12)'; e.currentTarget.style.background = '#fff'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#f0f0f2'; e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; e.currentTarget.style.background = '#fafbfc'; }}
                  >
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg, #13c2c2, #5cdbd3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                      <DollarOutlined style={{ fontSize: 18, color: '#fff' }} />
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1a2e', marginBottom: 4 }}>{t('home.withdrawalApply')}</div>
                    <div style={{ fontSize: 12, color: '#9ca3af' }}>{t('home.withdrawalSub')}</div>
                  </div>
                </Col>

                {/* 发起收款 */}
                <Col span={8}>
                  <div
                    onClick={() => navigate('/client/receivable/apply')}
                    style={{ background: '#fafbfc', border: '1px solid #f0f0f2', borderRadius: 16, padding: '20px 16px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.22s' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#52c41a'; e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(82,196,26,0.12)'; e.currentTarget.style.background = '#fff'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#f0f0f2'; e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; e.currentTarget.style.background = '#fafbfc'; }}
                  >
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg, #52c41a, #95de64)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                      <WalletOutlined style={{ fontSize: 18, color: '#fff' }} />
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1a2e', marginBottom: 4 }}>{t('home.addPayee')}</div>
                    <div style={{ fontSize: 12, color: '#9ca3af' }}>{t('home.initiateCollectionSub')}</div>
                  </div>
                </Col>

                {/* 收款记录 */}
                <Col span={8}>
                  <div
                    onClick={() => navigate('/client/about')}
                    style={{ background: '#fafbfc', border: '1px solid #f0f0f2', borderRadius: 16, padding: '20px 16px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.22s' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#1890ff'; e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(24,144,255,0.12)'; e.currentTarget.style.background = '#fff'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#f0f0f2'; e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; e.currentTarget.style.background = '#fafbfc'; }}
                  >
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg, #1890ff, #69c0ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                      <RiseOutlined style={{ fontSize: 18, color: '#fff' }} />
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1a2e', marginBottom: 4 }}>{t('home.enterpriseIntro')}</div>
                    <div style={{ fontSize: 12, color: '#9ca3af' }}>{t('home.enterpriseIntroSub')}</div>
                  </div>
                </Col>

                {/* 收款人管理 */}
                <Col span={8}>
                  <div
                    onClick={() => navigate('/client/star-enterprise')}
                    style={{ background: '#fafbfc', border: '1px solid #f0f0f2', borderRadius: 16, padding: '20px 16px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.22s' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#eb2f96'; e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(235,47,150,0.12)'; e.currentTarget.style.background = '#fff'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#f0f0f2'; e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; e.currentTarget.style.background = '#fafbfc'; }}
                  >
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg, #eb2f96, #ff85c0)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                      <UserSwitchOutlined style={{ fontSize: 18, color: '#fff' }} />
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1a2e', marginBottom: 4 }}>{t('home.payeeMgmt')}</div>
                    <div style={{ fontSize: 12, color: '#9ca3af' }}>{t('home.payeeMgmtSub')}</div>
                  </div>
                </Col>

              </Row>
            </div>
        </div>

        {/* 右侧 1/3 */}
          <div style={{ flex: 1, width: 360, display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* 待办事项 */}
            <div className="card" style={{ background: '#fff', borderRadius: 20, padding: 28, boxShadow: '0 2px 16px rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.04)', flex: 1 }}>

              <div style={{ fontSize: 16, fontWeight: 600, color: '#1a1a2e', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444' }} />
                {t('home.todo')}
                {todoList.length > 0 && (
                  <span style={{ background: '#ff4d4f', color: '#fff', fontSize: 11, fontWeight: 700, borderRadius: 10, padding: '1px 8px', lineHeight: '18px' }}>
                    {todoList.length}
                  </span>
                )}
              </div>
              {todoList.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#d1d5db', fontSize: 14 }}>
                  {t('home.noTodo')}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {todoList.map((item, idx) => (
                    <div
                      key={idx}
                      onClick={() => navigate(item.path)}
                      style={{
                        background: '#f0f4ff',
                        border: '1px solid #c7d2fe',
                        borderRadius: 12,
                        padding: '14px 16px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = '#667eea'; e.currentTarget.style.transform = 'translateX(4px)'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = '#c7d2fe'; e.currentTarget.style.transform = ''; }}
                    >
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#4f46e5', marginBottom: 4 }}>
                        {item.label}
                      </div>
                      <div style={{ fontSize: 12, color: '#8c8c8c' }}>
                        {t('home.goToProcess')}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 日期表 */}
            <div className="card" style={{ background: '#fff', borderRadius: 20, padding: 28, boxShadow: '0 2px 16px rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.04)', flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <span style={{ fontSize: 16, fontWeight: 600, color: '#1a1a2e' }}>{currentYear}年{currentMonth + 1}月</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 5, textAlign: 'center' }}>
                {weekdays.map((w, i) => (
                  <div key={i} style={{ fontSize: 12, color: '#c0c0c8', padding: '6px 0', fontWeight: 500 }}>{w}</div>
                ))}
                {calendarDays.map((d, i) => (
                  <div
                    key={i}
                    style={{
                      fontSize: 13, color: d.other ? '#d4d4d8' : '#374151',
                      padding: '10px 4px', borderRadius: 10, cursor: 'pointer',
                      transition: 'all 0.15s', fontWeight: 500,
                      background: d.isToday ? 'linear-gradient(135deg, #5b67d9 0%, #667eea 100%)' : 'transparent',
                      color: d.isToday ? '#fff' : d.other ? '#d4d4d8' : '#374151',
                      boxShadow: d.isToday ? '0 4px 14px rgba(102,126,234,0.3)' : 'none',
                    }}
                  >
                    {d.day}
                  </div>
                ))}
              </div>
            </div>
          </div>
          </div>

      {/* 操作指引（5 步骤条 + 内容区，跨整个宽度） */}
      <div style={{ background: '#fff', borderRadius: 24, padding: '32px 36px', boxShadow: '0 2px 16px rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.04)' }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: '#1a1a2e', marginBottom: 28, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#722ed1' }} />
          {t('home.guide')}
        </div>

        {/* 步骤条 */}
        <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 32, padding: '0 12px' }}>
          <StepNode num={1} icon={<FileTextOutlined />} title={t('home.guideNode1Title')} subtitle={t('home.guideNode1Sub')} color="#667eea" />
          <StepNode num={2} icon={<UploadOutlined />} title={t('home.guideNode2Title')} subtitle={t('home.guideNode2Sub')} color="#52c41a" />
          <StepNode num={3} icon={<SwapOutlined />} title={t('home.guideNode3Title')} subtitle={t('home.guideNode3Sub')} color="#fa8c16" />
          <StepNode num={4} icon={<UserSwitchOutlined />} title={t('home.guideNode4Title')} subtitle={t('home.guideNode4Sub')} color="#722ed1" isLast={false} />
          <StepNode num={5} icon={<RiseOutlined />} title={t('home.guideNode5Title')} subtitle={t('home.guideNode5Sub')} color="#eb2f96" isLast />
        </div>

        {/* 步骤内容区 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16 }}>
          {/* 通用样式：描述区（垂直居中）+ 底部链接按钮组 */}
          {[
            {
              desc: t('home.guideDesc1'),
              btns: (
                <a
                  href="/代收付协议模板.docx"
                  download="代收付协议模板.docx"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    color: '#667eea',
                    fontSize: 13,
                    fontWeight: 500,
                    textDecoration: 'none',
                  }}
                >
                  <FileTextOutlined /> {t('home.guideBtn1')}
                </a>
              ),
            },
            {
              desc: t('home.guideDesc2'),
              status: moduleTodos.deposit,
              btns: (
                <>
                  <LinkBtn onClick={() => navigate('/client/deposit/apply')}>{t('home.guideApply')}</LinkBtn>
                  <LinkBtn onClick={() => navigate('/client/deposit')}>{t('home.guideProcess')}</LinkBtn>
                </>
              ),
            },
            {
              desc: t('home.guideDesc3'),
              status: moduleTodos.exchange,
              btns: (
                <>
                  <LinkBtn onClick={() => navigate('/client/exchange/apply')}>{t('home.guideApply')}</LinkBtn>
                  <LinkBtn onClick={() => navigate('/client/exchange')}>{t('home.guideProcess')}</LinkBtn>
                </>
              ),
            },
            {
              desc: t('home.guideDesc4'),
              btns: (
                <>
                  <LinkBtn onClick={() => navigate('/client/receivable/apply')}>{t('home.guideAdd')}</LinkBtn>
                  <LinkBtn onClick={() => navigate('/client/receivable')}>{t('home.guideProcess')}</LinkBtn>
                </>
              ),
            },
            {
              desc: t('home.guideDesc5'),
              status: moduleTodos.withdrawal,
              btns: (
                <>
                  <LinkBtn onClick={() => navigate('/client/withdrawal/apply')}>{t('home.guideApply')}</LinkBtn>
                  <LinkBtn onClick={() => navigate('/client/withdrawal')}>{t('home.guideProcess')}</LinkBtn>
                </>
              ),
            },
          ].map((item, i) => (
            <div key={i} style={{ ...guideCardStyle, alignItems: 'center', textAlign: 'center' }}>
              {/* 描述区：自动撑满中间 */}
              <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                width: '100%',
              }}>
                <div style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.6 }}>{item.desc}</div>
                {item.status !== undefined && <TodoStatus hasTodo={item.status} t={t} />}
              </div>
              {/* 底部链接按钮组：固定底部 */}
              <div style={{
                display: 'flex',
                gap: 12,
                marginTop: 14,
                paddingTop: 12,
                borderTop: '1px dashed #e8e8f0',
                width: '100%',
                justifyContent: 'center',
                flexWrap: 'wrap',
              }}>
                {item.btns}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 底部品牌定位 */}
      <div style={{ background: '#fff', borderRadius: 24, padding: '40px 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', overflow: 'hidden', boxShadow: '0 2px 16px rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.04)' }}>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: 22, fontWeight: 600, color: '#1a1a2e', marginBottom: 10 }}>{t('home.brandTitle')}</h3>
            <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.7, maxWidth: 520 }}>{t('home.brandDesc')}</p>
          </div>
          <div style={{ display: 'flex', gap: 24 }}>
            {[
              { icon: <DollarOutlined style={{ fontSize: 20, color: '#667eea' }} />, label: t('home.multiCurrency'), borderColor: '#667eea' },
              { icon: <RiseOutlined style={{ fontSize: 20, color: '#52c41a' }} />, label: t('home.realtimeRate'), borderColor: '#52c41a' },
              { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fa8c16" strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>, label: t('home.fastSettlement'), borderColor: '#fa8c16' },
            ].map((item, i) => (
              <div key={i} style={{ textAlign: 'center', padding: '20px 28px', border: `1px solid ${item.borderColor}`, borderRadius: 16, minWidth: 110 }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: `${item.borderColor}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
                  {item.icon}
                </div>
                <div style={{ fontSize: 13, color: '#1a1a2e', fontWeight: 600 }}>{item.label}</div>
              </div>
            ))}
          </div>
      </div>
      </div>
    </div>
  );
};

export default Home;

import { defineConfig } from 'umi';

export default defineConfig({
  title: 'GenStarPay 客户端',
  links: [{ rel: 'icon', href: '/favicon.png', type: 'image/png' }],
  proxy: {
    '/api': {
      target: 'http://localhost:7005',
      changeOrigin: true,
    },
  },
  routes: [
    { path: '/client/login', component: '@/pages/Login' },
    { path: '/client/register', component: '@/pages/Register' },
    { path: '/client/forgot-password', component: '@/pages/ForgotPassword' },
    { path: '/client', component: '@/layouts/ClientLayout',
      routes: [
        { path: '/client/home', component: '@/pages/Home' },
        { path: '/client/receivable', component: '@/pages/Receivable/index' },
        { path: '/client/receivable/apply', component: '@/pages/Receivable/PayeeApply' },
        { path: '/client/receivable/:payeeId', component: '@/pages/Receivable/ReceivableDetail' },
        { path: '/client/deposit', component: '@/pages/Deposit/index' },
        { path: '/client/deposit/apply', component: '@/pages/Deposit/DepositApply' },
        { path: '/client/deposit/:orderNo', component: '@/pages/Deposit/DepositDetail' },
        { path: '/client/about', component: '@/pages/About' },
        { path: '/client/exchange', component: '@/pages/Exchange/index' },
        { path: '/client/exchange/apply', component: '@/pages/Exchange/ExchangeApply' },
        { path: '/client/exchange/:exchangeId', component: '@/pages/Exchange/ExchangeDetail' },
        { path: '/client/exchange/exchangeInfo/:exchangeId', component: '@/pages/Exchange/ExchangeInfo' },
        { path: '/client/withdrawal', component: '@/pages/Withdrawal/index' },
        { path: '/client/withdrawal/apply', component: '@/pages/Withdrawal/WithdrawalApply' },
        { path: '/client/withdrawal/:withdrawalId', component: '@/pages/Withdrawal/WithdrawalDetail' },
        { path: '/client/withdrawal/withdrawalInfo/:withdrawalId', component: '@/pages/Withdrawal/WithdrawalInfo' },
        { path: '/client/profile', component: '@/pages/Profile' },
        { path: '/client/profile/edit', component: '@/pages/ProfileEdit' },
        { path: '/client/profile/password', component: '@/pages/PasswordChange' },
      ],
    },
    { path: '/', redirect: '/client/login' },
  ],
  npmClient: 'npm',
});

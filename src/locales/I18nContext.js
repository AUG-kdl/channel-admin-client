import React, { createContext, useContext, useCallback, useMemo, useState, useEffect } from 'react';
import zhCN from './zh-CN';
import enUS from './en-US';
import ruRU from './ru-RU';

const LOCALES = { 'zh-CN': zhCN, 'en-US': enUS, 'ru-RU': ruRU };
const STORAGE_KEY = 'client_locale';

export const I18nContext = createContext(null);

export function I18nProvider({ children }) {
  const [version, setVersion] = useState(0);

  // 监听其他标签页或代码写的 localechange 事件来刷新
  useEffect(() => {
    const handler = () => setVersion(v => v + 1);
    window.addEventListener('localechange', handler);
    return () => window.removeEventListener('localechange', handler);
  }, []);

  // locale 依赖 version，每次 version++ 都会重新读 localStorage
  const locale = localStorage.getItem(STORAGE_KEY) || 'zh-CN';

  const setLocale = useCallback((l) => {
    localStorage.setItem(STORAGE_KEY, l);
    setVersion(v => v + 1);
  }, []);

  const t = useCallback((key) => {
    const dict = LOCALES[locale] || LOCALES['zh-CN'];
    const keys = key.split('.');
    let val = dict;
    for (const k of keys) {
      if (val && typeof val === 'object') val = val[k];
      else return key;
    }
    return typeof val === 'string' ? val : key;
  }, [locale]);

  // 直接取翻译对象（支持数组/对象，非字符串）
  const td = useCallback((key) => {
    const dict = LOCALES[locale] || LOCALES['zh-CN'];
    const keys = key.split('.');
    let val = dict;
    for (const k of keys) {
      if (val && typeof val === 'object') val = val[k];
      else return null;
    }
    return val;
  }, [locale]);

  const value = useMemo(() => ({ locale, setLocale, t, td }), [locale, t, td]);

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  const DEFAULT_T = (key) => key;
  if (!ctx) return { locale: 'zh-CN', setLocale: () => {}, t: DEFAULT_T, td: () => null };
  return ctx;
}

import React from 'react';
import { I18nProvider } from './locales/I18nContext';

export function rootContainer(container) {
  return React.createElement(I18nProvider, null, container);
}

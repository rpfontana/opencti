import * as R from 'ramda';
import React from 'react';
import { Base64 } from 'js-base64';
import Tooltip from '@mui/material/Tooltip';
import { APP_BASE_PATH } from '../relay/environment';
import { isNotEmptyField } from './utils';

export const truncate = (str, limit, truncateSpaces = true) => {
  if (str === undefined || str === null || str.length <= limit) {
    return str;
  }
  const trimmedStr = str.substring(0, limit);
  if (!truncateSpaces || !trimmedStr.includes(' ')) {
    return `${trimmedStr}...`;
  }
  return `${trimmedStr.substring(
    0,
    Math.min(trimmedStr.length, trimmedStr.lastIndexOf(' ')),
  )}...`;
};

export const adaptFieldValue = (value) => {
  if (Array.isArray(value)) {
    return value;
  }
  if (R.isNil(value)) {
    return '';
  }
  return value.toString();
};

export const pascalize = (s) => s.replace(/(\w)(\w*)/g, (g0, g1, g2) => g1.toUpperCase() + g2.toLowerCase());

export const convertFromStixType = (s) => {
  if (!s) {
    return s;
  }
  let type = pascalize(s);
  if (type.includes('Opencti')) {
    type = type.replaceAll('Opencti', 'OpenCTI');
  }
  if (type.includes('Ipv')) {
    type = type.replaceAll('Ipv', 'IPv');
  }
  if (type === 'File' || type === 'Stixfile') {
    return 'StixFile';
  }
  if (type.startsWith('X-OpenCTI-')) {
    type = type.replaceAll('X-OpenCTI-', '');
  }
  return type;
};

export const convertToStixType = (type) => {
  if (!type) {
    return type;
  }
  if (type === 'StixFile') {
    return 'file';
  }
  if (['Sector', 'Organization', 'Individual', 'System'].includes(type)) {
    return 'identity';
  }
  if (['Threat-Actor-Group', 'Threat-Actor-Individual'].includes(type)) {
    return 'threat-actor';
  }
  if (['Region', 'Country', 'City', 'Position', 'Administrative-Area'].includes(type)) {
    return 'location';
  }
  return type.toLowerCase();
};

export const isValidStixBundle = (bundle) => {
  try {
    const data = JSON.parse(bundle);
    return !!(data.objects && data.objects.length > 0);
  } catch (e) {
    return false;
  }
};

export const toB64 = (str) => Base64.encodeURI(str);

export const toBase64 = (str) => Base64.encode(str);

export const fromB64 = (str) => Base64.decode(str);

export const fromBase64 = (str) => Base64.encode(str);

export const uniqWithByFields = R.curry((fields, data) => R.uniqWith(R.allPass(R.map(R.eqProps)(fields)))(data));

export const computeDuplicates = (fields, data) => R.groupWith(R.allPass(R.map(R.eqProps)(fields)), data);

export const capitalizeFirstLetter = (str) => str.charAt(0).toUpperCase() + str.slice(1);

export const capitalizeWords = (str) => str.split(' ').map(capitalizeFirstLetter).join(' ');

export const toCamelCase = (str) => {
  return str.replace(/[^a-zA-Z0-9 ]/g, '').replace(/(?:^\w|[A-Z]|\b\w)/g, (word, i) => {
    return i === 0 ? word.toLowerCase() : word.toUpperCase();
  }).replace(/\s+/g, '');
};

export const renderObservableValue = (observable) => {
  switch (observable.entity_type) {
    case 'IPv4-Addr':
    case 'IPv6-Addr':
      if ((observable.countries?.edges ?? []).length > 0) {
        const country = R.head(observable.countries.edges).node;
        const flag = R.head(
          (country.x_opencti_aliases ?? []).filter((n) => n.length === 2),
        );
        if (flag) {
          return (
            <div>
              <div style={{ float: 'left', paddingTop: 2 }}>
                <Tooltip title={country.name}>
                  <img
                    style={{ width: 20 }}
                    src={`${APP_BASE_PATH}/static/flags/4x3/${flag.toLowerCase()}.svg`}
                    alt={country.name}
                  />
                </Tooltip>
              </div>
              <div style={{ float: 'left', marginLeft: 10 }}>
                {observable.observable_value}
              </div>
            </div>
          );
        }
      }
      return observable.observable_value;
    default:
      return observable.observable_value;
  }
};

export const emptyFilled = (str) => (isNotEmptyField(str) ? str : '-');

/**
 * @param str {string}
 * @returns {string[]}
 */
export const splitMultilines = (str) => (str ?? '')
  .split(/\r?\n/)
  .filter((v) => !!v)
  .map((s) => s.trim());

export const maskString = (value) => (value ? '•'.repeat(value.length) : '');

/**
 * Add zero-width spaces every 10 characters in a string.
 * It allows PDF generation to automatically go to new line instead
 * of going outside of the file when facing every long names, ids, etc.
 *
 * @param value String to make wrappable.
 * @returns {string} Same string but wrappable.
 */
export const stringWithZeroWidthSpace = (value) => {
  return (value.match(/.{1,10}/g) ?? []).join('​');
};

/**
 * Chart of Accounts Template Index
 * Exports all country-specific COA templates following Odoo's official structure
 */

import { US } from './countries/US.js';
import { GB } from './countries/GB.js';
import { DE } from './countries/DE.js';
import { FR } from './countries/FR.js';
import { ES } from './countries/ES.js';
import { IT } from './countries/IT.js';
import { NL } from './countries/NL.js';
import { BE } from './countries/BE.js';
import { PT } from './countries/PT.js';
import { PL } from './countries/PL.js';
import { SE } from './countries/SE.js';
import { NO } from './countries/NO.js';
import { DK } from './countries/DK.js';
import { FI } from './countries/FI.js';
import { AT } from './countries/AT.js';
import { CH } from './countries/CH.js';
import { AU } from './countries/AU.js';
import { NZ } from './countries/NZ.js';
import { CA } from './countries/CA.js';
import { MX } from './countries/MX.js';
import { BR } from './countries/BR.js';
import { ZA } from './countries/ZA.js';
import { IN } from './countries/IN.js';
import { JP } from './countries/JP.js';
import { CN } from './countries/CN.js';

export const AVAILABLE_TEMPLATES = [
  US,
  GB,
  DE,
  FR,
  ES,
  IT,
  NL,
  BE,
  PT,
  PL,
  SE,
  NO,
  DK,
  FI,
  AT,
  CH,
  AU,
  NZ,
  CA,
  MX,
  BR,
  ZA,
  IN,
  JP,
  CN
];

export function getTemplateByCountry(countryCode) {
  return AVAILABLE_TEMPLATES.find(t => t.country === countryCode);
}

export function getTemplateByCode(code) {
  return AVAILABLE_TEMPLATES.find(t => t.code === code);
}

export function searchTemplates(query) {
  const lowerQuery = query.toLowerCase();
  return AVAILABLE_TEMPLATES.filter(t =>
    t.name.toLowerCase().includes(lowerQuery) ||
    t.country.toLowerCase().includes(lowerQuery) ||
    t.description?.toLowerCase().includes(lowerQuery)
  );
}

export {
  US, GB, DE, FR, ES, IT, NL, BE, PT, PL, SE, NO, DK, FI, AT, CH,
  AU, NZ, CA, MX, BR, ZA, IN, JP, CN
};

export default AVAILABLE_TEMPLATES;

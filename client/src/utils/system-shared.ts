export const ExtTypeMap: Record<SupportedExt, string> = {
  csv: 'text/csv',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  eml: 'message/rfc822',
  htm: 'text/html',
  html: 'text/html',
  msg: 'application/vnd.ms-outlook',
  pdf: 'application/pdf',
  rtf: 'application/rtf',
  txt: 'text/plain',
  wpd: 'application/vnd.wordperfect',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  zip: 'application/zip',
};

const supportedExt = [
  'csv',
  'doc',
  'docx',
  'eml',
  'htm',
  'html',
  'msg',
  'pdf',
  'rtf',
  'txt',
  'wpd',
  'xls',
  'xlsx',
  'zip',
] as const;
type SupportedExt = (typeof supportedExt)[number];

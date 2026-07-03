import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';
import {
  createConnection,
  type Connection,
  type RowDataPacket,
} from 'mysql2/promise';
import {
  extractKepcoDistributionDebugSnippets,
  parseKepcoDistributionQualifications,
} from './distribution-workforce-parser';

type KimJungheeRow = RowDataPacket & {
  employeeName: string;
  residentRegistrationNumber: string | null;
  certificateNo: string | null;
};

const KEPCO_BASE_URL = 'https://www.kepco.co.kr';
const KEPCO_REGIST_PATH =
  '/home/customer/library/inquiry-distribution-personnel/staff-information/regist.do';
const KEPCO_VIEW_PATH =
  '/home/customer/library/inquiry-distribution-personnel/staff-information/view.do';

const shouldRun = process.env.RUN_KEPCO_LIVE_TEST === '1';
const describeLive = shouldRun ? describe : describe.skip;

describeLive('김중희 KEPCO 실제 요청 파서 검증', () => {
  jest.setTimeout(60_000);

  let connection: Connection;

  beforeAll(async () => {
    const env = loadEnv();
    connection = await createConnection({
      host: env.DB_HOST ?? 'localhost',
      port: Number(env.DB_PORT ?? 3306),
      user: requiredEnv(env, 'DB_USERNAME'),
      password: requiredEnv(env, 'DB_PASSWORD'),
      database: requiredEnv(env, 'DB_DATABASE'),
    });
  });

  afterAll(async () => {
    await connection?.end();
  });

  it('실제 KEPCO 응답에서 실적시간과 small 메모를 파싱한다', async () => {
    const row = await loadKimJunghee(connection);
    const birthDate = birthDateFromResidentRegistrationNumber(
      row.residentRegistrationNumber,
    );
    const certificateNo = row.certificateNo?.replace(/\D/g, '') ?? '';

    expect(birthDate).toEqual(expect.stringMatching(/^\d{8}$/));
    expect(certificateNo).toHaveLength(11);

    const html = await fetchKepcoHtml({
      employeeName: row.employeeName,
      birthDate,
      certificateNo,
      periodFrom: process.env.KEPCO_TEST_PERIOD_FROM ?? '2025-01-01',
      periodTo: process.env.KEPCO_TEST_PERIOD_TO ?? '2026-07-03',
    });
    const snippets = extractKepcoDistributionDebugSnippets(html);
    const qualifications = parseKepcoDistributionQualifications(html);

    console.log('KEPCO raw snippets:', JSON.stringify(snippets, null, 2));
    console.log(
      'KEPCO parsed qualifications:',
      JSON.stringify(qualifications, null, 2),
    );

    const underground = qualifications.find(
      (item) => item.qualificationName === '지중배전',
    );
    if (!underground?.workHours || !underground.memo) {
      throw new Error(
        [
          'KEPCO 실제 응답에서 지중배전 실적시간/메모 파싱에 실패했습니다.',
          `parsed=${JSON.stringify(qualifications, null, 2)}`,
          `snippets=${JSON.stringify(snippets, null, 2)}`,
        ].join('\n'),
      );
    }

    expect(underground.workHours).toEqual(
      expect.stringMatching(/^\d+(?:\.\d{1,3})?$/),
    );
    expect(underground.workHours).not.toMatch(/^(24|2000|2025)(?:\.000)?$/);
    expect(underground.memo).toEqual(expect.stringContaining('작업실적'));
  });
});

async function loadKimJunghee(connection: Connection) {
  const [rows] = await connection.execute<KimJungheeRow[]>(
    `
      SELECT
        e.employeeName,
        e.residentRegistrationNumber,
        ec.certificateNo
      FROM employees e
      JOIN employee_certificates ec
        ON ec.employeeId = e.id
       AND ec.companyId = e.companyId
      JOIN certificate_types ct
        ON ct.id = ec.certificateTypeId
       AND ct.companyId = e.companyId
      WHERE e.employeeName = ?
        AND ct.certificateTypeName = ?
        AND ec.certificateNo IS NOT NULL
        AND ec.certificateNo <> ''
      ORDER BY ec.id DESC
      LIMIT 1
    `,
    ['김중희', '배전기능자격'],
  );
  const row = rows[0];
  if (!row) {
    throw new Error('김중희 배전기능자격 자격번호를 찾지 못했습니다.');
  }
  return row;
}

async function fetchKepcoHtml(request: {
  employeeName: string;
  birthDate: string;
  certificateNo: string;
  periodFrom: string;
  periodTo: string;
}) {
  const registUrl = new URL(KEPCO_REGIST_PATH, KEPCO_BASE_URL);
  const viewUrl = new URL(KEPCO_VIEW_PATH, KEPCO_BASE_URL);
  const initialResponse = await fetch(registUrl, {
    headers: { 'user-agent': 'Mozilla/5.0' },
  });
  const cookie = cookieFromSetCookie(initialResponse.headers.get('set-cookie'));
  const submittedPeriodFrom = toKepcoWorkMonth(request.periodFrom);
  const submittedPeriodTo = toKepcoWorkMonth(request.periodTo);
  const body = new URLSearchParams({
    name: request.employeeName,
    birth: request.birthDate,
    skillNum: request.certificateNo,
    skillSdate: submittedPeriodFrom,
    skillEdate: submittedPeriodTo,
  });

  console.log(
    'KEPCO live request:',
    JSON.stringify({
      employeeName: request.employeeName,
      birthDate: maskBirthDate(request.birthDate),
      certificateNo: maskCertificateNo(request.certificateNo),
      requestedPeriodFrom: request.periodFrom,
      requestedPeriodTo: request.periodTo,
      submittedPeriodFrom,
      submittedPeriodTo,
      url: viewUrl.toString(),
    }),
  );

  const response = await fetch(viewUrl, {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
      cookie,
      referer: registUrl.toString(),
      'user-agent': 'Mozilla/5.0',
    },
    body,
    redirect: 'follow',
  });

  console.log(
    'KEPCO live response:',
    JSON.stringify({
      status: response.status,
      ok: response.ok,
      url: response.url,
    }),
  );
  expect(response.ok).toBe(true);

  return response.text();
}

function birthDateFromResidentRegistrationNumber(value?: string | null) {
  const digits = value?.replace(/\D/g, '');
  if (!digits || digits.length < 7) return '';

  const year = Number(digits.slice(0, 2));
  const month = Number(digits.slice(2, 4));
  const day = Number(digits.slice(4, 6));
  const centuryCode = digits[6];
  const century =
    centuryCode === '1' ||
    centuryCode === '2' ||
    centuryCode === '5' ||
    centuryCode === '6'
      ? 1900
      : centuryCode === '3' ||
          centuryCode === '4' ||
          centuryCode === '7' ||
          centuryCode === '8'
        ? 2000
        : centuryCode === '9' || centuryCode === '0'
          ? 1800
          : null;
  if (!century) return '';

  const date = new Date(Date.UTC(century + year, month - 1, day));
  if (
    date.getUTCFullYear() !== century + year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return '';
  }

  return `${date.getUTCFullYear()}${String(month).padStart(2, '0')}${String(
    day,
  ).padStart(2, '0')}`;
}

function cookieFromSetCookie(value: string | null) {
  if (!value) return '';
  return value
    .split(/,(?=\s*[^;=]+=[^;]+)/)
    .map((part) => part.split(';')[0]?.trim())
    .filter((part): part is string => Boolean(part))
    .join('; ');
}

function toKepcoWorkMonth(value: string) {
  return value.slice(0, 7);
}

function maskBirthDate(value: string) {
  return `${value.slice(0, 4)}****`;
}

function maskCertificateNo(value: string) {
  return `${value.slice(0, 2)}${'*'.repeat(Math.max(0, value.length - 4))}${value.slice(-2)}`;
}

function loadEnv() {
  const envPath = [
    resolve(process.cwd(), '.env'),
    resolve(__dirname, '../../../.env'),
  ].find((candidate) => existsSync(candidate));
  const fileEnv = envPath ? parseEnvFile(readFileSync(envPath, 'utf8')) : {};
  return { ...fileEnv, ...process.env };
}

function parseEnvFile(value: string) {
  return Object.fromEntries(
    value
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#'))
      .map((line) => {
        const separatorIndex = line.indexOf('=');
        return [line.slice(0, separatorIndex), line.slice(separatorIndex + 1)];
      }),
  );
}

function requiredEnv(env: NodeJS.ProcessEnv, key: string) {
  const value = env[key];
  if (!value) throw new Error(`${key} 환경변수가 필요합니다.`);
  return value;
}

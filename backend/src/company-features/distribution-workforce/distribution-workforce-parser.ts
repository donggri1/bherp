export type KepcoDistributionQualification = {
  qualificationName: string;
  acquiredDate?: string | null;
  renewedDate?: string | null;
  expiredDate?: string | null;
  qualificationStatus?: string | null;
  certificateNo?: string | null;
  workHours?: string | null;
  memo?: string | null;
};

const TARGET_NAMES = ['무정전', '지중배전'] as const;
const DATE_PATTERN =
  /(\d{4})\s*(?:[-./년])?\s*(\d{1,2})\s*(?:[-./월])?\s*(\d{1,2})/;
const DATE_PATTERN_GLOBAL =
  /(\d{4})\s*(?:[-./년])?\s*(\d{1,2})\s*(?:[-./월])?\s*(\d{1,2})/g;
const CERTIFICATE_NO_PATTERN = /\b\d{2}-?\d{2}-?\d{2}-?\d{5}\b/;
const HOURS_PATTERN = /(\d+(?:\.\d+)?)\s*(?:시간|[hH])/;
const NUMBER_PATTERN = /(\d+(?:\.\d+)?)/;

export function parseKepcoDistributionQualifications(
  html: string,
): KepcoDistributionQualification[] {
  const byName = new Map<string, KepcoDistributionQualification>();

  for (const qualification of parseTableQualifications(html)) {
    mergeQualification(byName, qualification);
  }

  for (const qualification of parseRowHeaderQualifications(html)) {
    mergeQualification(byName, qualification);
  }

  for (const qualification of parsePerformanceTextQualifications(html)) {
    mergeQualification(byName, qualification);
  }

  for (const qualification of parseBlockQualifications(html)) {
    mergeQualification(byName, qualification);
  }

  return TARGET_NAMES.map((name) => byName.get(name)).filter(
    (item): item is KepcoDistributionQualification => Boolean(item),
  );
}

export function extractKepcoDistributionDebugSnippets(html: string) {
  const snippets = new Set<string>();
  const patterns = [
    /무정전[\s\S]{0,260}/gi,
    /지중배전[\s\S]{0,260}/gi,
    /전공\s*실적[\s\S]{0,260}/gi,
    /작업실적입니다[\s\S]{0,120}/gi,
  ];

  for (const pattern of patterns) {
    for (const match of html.matchAll(pattern)) {
      const snippet = stripTags(match[0]).slice(0, 300);
      if (snippet) snippets.add(snippet);
      if (snippets.size >= 6) return [...snippets];
    }
  }

  return [...snippets];
}

function parseTableQualifications(
  html: string,
): KepcoDistributionQualification[] {
  const qualifications: KepcoDistributionQualification[] = [];
  const tables = html.match(/<table[\s\S]*?<\/table>/gi) ?? [];

  for (const table of tables) {
    const rows = table.match(/<tr[\s\S]*?<\/tr>/gi) ?? [];
    const headers = extractCells(
      rows.find((row) => /<th[\s\S]*?>/i.test(row)) ?? '',
    );

    for (const row of rows) {
      if (!/<td[\s\S]*?>/i.test(row)) continue;

      const cells = extractCells(row);
      const rowText = normalizeText(cells.join(' '));
      const qualificationName = targetNameFromText(rowText);
      if (!qualificationName) continue;

      const rowHeaderQualification = parseRowHeaderQualification(row);
      if (rowHeaderQualification) {
        qualifications.push(rowHeaderQualification);
        continue;
      }

      const fromHeaders = headers.length
        ? (() => {
            const workHoursValue = valueByHeader(headers, cells, [
              /시간/,
              /실적/,
            ]);
            return {
              acquiredDate: normalizeDate(
                valueByHeader(headers, cells, [/취득/]) ??
                  extractLabeledDate(rowText, ['취득']),
              ),
              renewedDate: normalizeDate(
                valueByHeader(headers, cells, [/갱신/]) ??
                  extractLabeledDate(rowText, ['갱신']),
              ),
              expiredDate: normalizeDate(
                valueByHeader(headers, cells, [/만료/]) ??
                  extractLabeledDate(rowText, ['만료']),
              ),
              qualificationStatus: normalizeNullable(
                valueByHeader(headers, cells, [/상태/]) ??
                  extractLabeledText(rowText, ['자격상태', '상태']),
              ),
              certificateNo: normalizeNullable(
                valueByHeader(headers, cells, [/자격.*번호/, /번호/]) ??
                  extractCertificateNo(rowText),
              ),
              workHours: normalizeHours(workHoursValue ?? rowText),
            };
          })()
        : parseQualificationFields(rowText);

      qualifications.push({
        qualificationName,
        ...fromHeaders,
      });
    }
  }

  return qualifications;
}

function parseRowHeaderQualifications(
  html: string,
): KepcoDistributionQualification[] {
  return (html.match(/<tr[\s\S]*?<\/tr>/gi) ?? [])
    .map((row) => parseRowHeaderQualification(row))
    .filter((item): item is KepcoDistributionQualification => Boolean(item));
}

function parseRowHeaderQualification(
  row: string,
): KepcoDistributionQualification | null {
  const titleText = normalizeText(extractCellsByTag(row, 'th').join(' '));
  const valueText = normalizeText(extractCellsByTag(row, 'td').join(' '));
  const qualificationName = targetNameFromText(titleText);
  if (!titleText || !valueText || !qualificationName) return null;
  if (!/(실적|시간)/.test(titleText)) return null;

  const emphasizedValue = extractEmphasizedTexts(row).find(
    (value) => HOURS_PATTERN.test(value) || NUMBER_PATTERN.test(value),
  );
  const workHours =
    normalizeHours(emphasizedValue ?? valueText, Boolean(emphasizedValue)) ??
    defaultZeroHoursForPerformanceText(valueText);
  if (!workHours) return null;

  return {
    qualificationName,
    workHours,
    memo:
      normalizeNullable(extractSmallTexts(row).join(' ')) ??
      extractWorkPerformanceMemo(valueText),
  };
}

function parsePerformanceTextQualifications(
  html: string,
): KepcoDistributionQualification[] {
  const text = stripTags(html);
  const qualifications: KepcoDistributionQualification[] = [];

  for (const qualificationName of TARGET_NAMES) {
    const fields = parsePerformanceFields(text, qualificationName);
    if (!fields.workHours && !fields.memo) continue;
    qualifications.push({ qualificationName, ...fields });
  }

  return qualifications;
}

function parseBlockQualifications(
  html: string,
): KepcoDistributionQualification[] {
  const blocks =
    html.match(
      /<(?:section|article|li|tr|dl|div)\b[\s\S]*?<\/(?:section|article|li|tr|dl|div)>/gi,
    ) ?? [];
  const qualifications: KepcoDistributionQualification[] = [];

  for (const block of blocks) {
    const text = stripTags(block);
    const qualificationName = targetNameFromText(text);
    if (!qualificationName) continue;

    const rowHeaderFields = parseRowHeaderQualification(block);
    if (rowHeaderFields) {
      qualifications.push(rowHeaderFields);
      continue;
    }

    const fields = parseQualificationFields(text);
    if (
      !hasFieldEvidence(fields) &&
      !/(취득|갱신|만료|상태|자격.*번호|시간|실적)/.test(text)
    ) {
      continue;
    }

    qualifications.push({ qualificationName, ...fields });
  }

  return qualifications;
}

function parseQualificationFields(text: string) {
  const dates = isWorkPerformanceText(text) ? [] : extractDates(text);
  const acquiredDate = normalizeDate(
    extractLabeledDate(text, ['취득일자', '취득일', '취득']) ?? dates[0],
  );
  const renewedDate = normalizeDate(
    extractLabeledDate(text, ['갱신일자', '갱신일', '갱신']) ?? dates[1],
  );
  const expiredDate = normalizeDate(
    extractLabeledDate(text, ['만료일자', '만료일', '만료', '유효기간']) ??
      dates[2],
  );

  return compactQualificationFields({
    acquiredDate,
    renewedDate,
    expiredDate,
    qualificationStatus: normalizeNullable(
      extractLabeledText(text, ['자격상태', '상태', '판정']),
    ),
    certificateNo: normalizeNullable(extractCertificateNo(text)),
    ...parsePerformanceFields(text, targetNameFromText(text)),
  });
}

function extractCells(row: string) {
  return [...row.matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)].map((match) =>
    stripTags(match[1]),
  );
}

function extractCellsByTag(row: string, tagName: 'th' | 'td') {
  return [
    ...row.matchAll(
      new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'gi'),
    ),
  ].map((match) => stripTags(match[1]));
}

function extractEmphasizedTexts(row: string) {
  return [
    ...row.matchAll(/<(?:b|strong|em)[^>]*>([\s\S]*?)<\/(?:b|strong|em)>/gi),
  ].map((match) => stripTags(match[1]));
}

function extractSmallTexts(row: string) {
  return [...row.matchAll(/<small[^>]*>([\s\S]*?)<\/small>/gi)].map((match) =>
    stripTags(match[1]),
  );
}

function valueByHeader(headers: string[], cells: string[], patterns: RegExp[]) {
  const index = headers.findIndex((header) =>
    patterns.some((pattern) => pattern.test(header)),
  );
  if (index < 0) return null;
  return cells[index] ?? null;
}

function stripTags(value: string) {
  return normalizeText(
    decodeHtmlEntities(value)
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' '),
  );
}

function decodeHtmlEntities(value: string) {
  return value
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#40;/g, '(')
    .replace(/&#41;/g, ')');
}

function normalizeText(value: string) {
  return value.replace(/\s+/g, ' ').trim();
}

function targetNameFromText(text: string) {
  if (text.includes('지중배전')) return '지중배전';
  if (text.includes('무정전')) return '무정전';
  return null;
}

function extractLabeledDate(text: string, labels: string[]) {
  for (const label of labels) {
    const match = text.match(labelPattern(label, 100));
    const date = match?.[1]?.match(DATE_PATTERN)?.[0];
    if (date) return date;
  }
  return null;
}

function extractLabeledText(text: string, labels: string[]) {
  for (const label of labels) {
    const match = text.match(labelPattern(label, 80));
    const value = match?.[1]
      ?.replace(
        /(자격증번호|자격번호|취득일|취득|갱신일|갱신|만료일|만료|시간|실적).*$/,
        '',
      )
      .trim();
    if (value) return value;
  }
  return null;
}

function extractCertificateNo(text: string) {
  return text.match(CERTIFICATE_NO_PATTERN)?.[0] ?? null;
}

function extractDates(text: string) {
  return [...text.matchAll(DATE_PATTERN_GLOBAL)]
    .map((match) => normalizeDate(match[0]))
    .filter((value): value is string => Boolean(value));
}

function normalizeDate(value?: string | null) {
  const match = value?.match(DATE_PATTERN);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function normalizeHours(value?: string | null, allowPlainNumber = false) {
  const match =
    value?.match(HOURS_PATTERN) ??
    (allowPlainNumber ? value?.match(NUMBER_PATTERN) : null);
  if (!match) return null;
  const numericValue = Number(match[1]);
  if (!Number.isFinite(numericValue)) return null;
  const [integerPart, fractionPart] = match[1].split('.');
  if (!fractionPart) return String(numericValue);
  return `${Number(integerPart)}.${fractionPart.slice(0, 3)}`;
}

function parsePerformanceFields(
  text: string,
  qualificationName: string | null,
): Pick<KepcoDistributionQualification, 'workHours' | 'memo'> {
  if (!qualificationName) return {};

  const escapedName = escapeRegExp(qualificationName);
  const performanceMatch = text.match(
    new RegExp(
      `${escapedName}\\s*(?:전공)?\\s*(?:작업)?\\s*실적[\\s\\S]{0,160}`,
    ),
  );
  if (!performanceMatch) return {};

  const workHours =
    normalizeHours(performanceMatch[0]) ??
    defaultZeroHoursForPerformanceText(performanceMatch[0]);
  if (!workHours) return {};

  return compactQualificationFields({
    workHours,
    memo: extractWorkPerformanceMemo(performanceMatch[0]) ?? null,
  });
}

function compactQualificationFields(
  value: Omit<KepcoDistributionQualification, 'qualificationName'>,
) {
  return Object.fromEntries(
    Object.entries(value).filter(
      ([, item]) => item !== null && item !== undefined,
    ),
  ) as Omit<KepcoDistributionQualification, 'qualificationName'>;
}

function extractWorkPerformanceMemo(text: string) {
  return (
    normalizeText(text).match(
      /\d{4}\s*[-./]\s*\d{1,2}(?:\s*[-./]\s*\d{1,2})?\s*~\s*\d{4}\s*[-./]\s*\d{1,2}(?:\s*[-./]\s*\d{1,2})?\s*작업실적입니다\.?/,
    )?.[0] ?? null
  );
}

function defaultZeroHoursForPerformanceText(text: string) {
  const normalized = normalizeText(text);
  if (!/(전공\s*)?실적/.test(normalized)) return null;
  if (!/(?:^|\s)[hH](?:\s|$)/.test(normalized)) return null;
  return '0';
}

function normalizeNullable(value?: string | null) {
  const normalized = value?.trim();
  return normalized || null;
}

function hasFieldEvidence(
  value: Omit<KepcoDistributionQualification, 'qualificationName'>,
) {
  return Boolean(
    value.acquiredDate ||
    value.renewedDate ||
    value.expiredDate ||
    value.qualificationStatus ||
    value.certificateNo ||
    value.workHours ||
    value.memo,
  );
}

function mergeQualification(
  byName: Map<string, KepcoDistributionQualification>,
  next: KepcoDistributionQualification,
) {
  const current = byName.get(next.qualificationName);
  if (!current) {
    byName.set(next.qualificationName, next);
    return;
  }

  byName.set(next.qualificationName, {
    qualificationName: next.qualificationName,
    acquiredDate: current.acquiredDate ?? next.acquiredDate,
    renewedDate: current.renewedDate ?? next.renewedDate,
    expiredDate: current.expiredDate ?? next.expiredDate,
    qualificationStatus:
      current.qualificationStatus ?? next.qualificationStatus,
    certificateNo: current.certificateNo ?? next.certificateNo,
    workHours: next.workHours ?? current.workHours,
    memo: next.memo ?? current.memo,
  });
}

function isWorkPerformanceText(text: string) {
  return /(작업실적|실적입니다)/.test(text);
}

function labelPattern(label: string, maxLength: number) {
  const flexibleLabel = label
    .split('')
    .map((char) => escapeRegExp(char))
    .join('\\s*');
  return new RegExp(`${flexibleLabel}\\s*[:：]?\\s*([\\s\\S]{0,${maxLength}})`);
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

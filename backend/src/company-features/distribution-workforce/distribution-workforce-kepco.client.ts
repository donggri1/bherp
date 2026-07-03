import { Injectable, Logger } from '@nestjs/common';
import {
  extractKepcoDistributionDebugSnippets,
  parseKepcoDistributionQualifications,
  type KepcoDistributionQualification,
} from './distribution-workforce-parser';

export type { KepcoDistributionQualification } from './distribution-workforce-parser';

export type KepcoDistributionRequest = {
  employeeName: string;
  birthDate: string;
  certificateNo: string;
  periodFrom: string;
  periodTo: string;
};

export type KepcoDistributionResponse = {
  qualifications: KepcoDistributionQualification[];
};

const KEPCO_BASE_URL = 'https://www.kepco.co.kr';
const KEPCO_REGIST_PATH =
  '/home/customer/library/inquiry-distribution-personnel/staff-information/regist.do';
const KEPCO_VIEW_PATH =
  '/home/customer/library/inquiry-distribution-personnel/staff-information/view.do';
const KEPCO_REQUEST_TIMEOUT_MS = 15_000;

@Injectable()
export class DistributionWorkforceKepcoClient {
  private readonly logger = new Logger(DistributionWorkforceKepcoClient.name);

  async fetchQualifications(
    request: KepcoDistributionRequest,
  ): Promise<KepcoDistributionResponse> {
    this.validateRequest(request);

    const registUrl = new URL(KEPCO_REGIST_PATH, KEPCO_BASE_URL);
    const viewUrl = new URL(KEPCO_VIEW_PATH, KEPCO_BASE_URL);
    const initialResponse = await this.fetchWithTimeout(registUrl);
    const cookie = this.cookieFromSetCookie(
      initialResponse.headers.get('set-cookie'),
    );
    const body = new URLSearchParams({
      name: request.employeeName,
      birth: request.birthDate,
      skillNum: request.certificateNo,
      skillSdate: this.toKepcoWorkMonth(request.periodFrom),
      skillEdate: this.toKepcoWorkMonth(request.periodTo),
    });

    const response = await this.fetchWithTimeout(viewUrl, {
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

    if (!response.ok) {
      throw new Error(`KEPCO 조회 요청이 실패했습니다. (${response.status})`);
    }

    const html = await response.text();
    const qualifications = parseKepcoDistributionQualifications(html);
    this.logger.log(
      `KEPCO distribution parsed qualifications: ${JSON.stringify(
        qualifications.map((item) => ({
          qualificationName: item.qualificationName,
          acquiredDate: item.acquiredDate,
          renewedDate: item.renewedDate,
          expiredDate: item.expiredDate,
          qualificationStatus: item.qualificationStatus,
          certificateNo: item.certificateNo,
          workHours: item.workHours,
          memo: item.memo,
        })),
      )}`,
    );

    const missingWorkHours = qualifications.filter(
      (item) =>
        (item.qualificationName === '무정전' ||
          item.qualificationName === '지중배전') &&
        !item.workHours,
    );
    if (!qualifications.length || missingWorkHours.length) {
      this.logger.warn(
        `KEPCO distribution parser snippets: ${JSON.stringify(
          extractKepcoDistributionDebugSnippets(html),
        )}`,
      );
    }

    return { qualifications };
  }

  private validateRequest(request: KepcoDistributionRequest) {
    if (!request.employeeName.trim()) {
      throw new Error('KEPCO 조회 사원명이 없습니다.');
    }
    if (!/^\d{8}$/.test(request.birthDate)) {
      throw new Error('KEPCO 조회 생년월일 형식이 올바르지 않습니다.');
    }
    if (!/^\d{11}$/.test(request.certificateNo)) {
      throw new Error('KEPCO 조회 자격번호는 하이픈 없는 11자리여야 합니다.');
    }
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(request.periodFrom) ||
      !/^\d{4}-\d{2}-\d{2}$/.test(request.periodTo)
    ) {
      throw new Error('KEPCO 조회기간 형식이 올바르지 않습니다.');
    }
  }

  private toKepcoWorkMonth(value: string) {
    return value.slice(0, 7);
  }

  private async fetchWithTimeout(input: URL, init?: RequestInit) {
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      KEPCO_REQUEST_TIMEOUT_MS,
    );

    try {
      return await fetch(input, {
        ...init,
        headers: {
          'user-agent': 'Mozilla/5.0',
          ...init?.headers,
        },
        signal: controller.signal,
      });
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('KEPCO 조회 요청 시간이 초과되었습니다.');
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  private cookieFromSetCookie(value: string | null) {
    if (!value) return '';
    return value
      .split(/,(?=\s*[^;=]+=[^;]+)/)
      .map((part) => part.split(';')[0]?.trim())
      .filter((part): part is string => Boolean(part))
      .join('; ');
  }
}

import { parseKepcoDistributionQualifications } from './distribution-workforce-parser';

describe('parseKepcoDistributionQualifications', () => {
  it('parses target qualification rows from a table', () => {
    const html = `
      <table>
        <tr>
          <th>자격명</th>
          <th>취득일</th>
          <th>갱신일</th>
          <th>만료일</th>
          <th>자격상태</th>
          <th>자격증번호</th>
          <th>실적시간</th>
        </tr>
        <tr>
          <td>무정전</td>
          <td>2025.01.02</td>
          <td>2025-06-03</td>
          <td>2026년 06월 03일</td>
          <td>정상</td>
          <td>25-05-91-03694</td>
          <td>12.5시간</td>
        </tr>
        <tr>
          <td>배전기능자격</td>
          <td>2024-01-01</td>
          <td></td>
          <td></td>
          <td>정상</td>
          <td>25-05-91-03694</td>
          <td>1시간</td>
        </tr>
      </table>
    `;

    expect(parseKepcoDistributionQualifications(html)).toEqual([
      {
        qualificationName: '무정전',
        acquiredDate: '2025-01-02',
        renewedDate: '2025-06-03',
        expiredDate: '2026-06-03',
        qualificationStatus: '정상',
        certificateNo: '25-05-91-03694',
        workHours: '12.5',
      },
    ]);
  });

  it('parses target qualification fields from text blocks', () => {
    const html = `
      <div class="result-card">
        지중배전 자격상태: 유효 자격증번호: 25-05-91-03694
        취득일: 2025-01-01 갱신일: 2025-02-01 만료일: 2026-06-03
        지중배전전공 실적 시간 8시간
      </div>
    `;

    expect(parseKepcoDistributionQualifications(html)).toEqual([
      {
        qualificationName: '지중배전',
        acquiredDate: '2025-01-01',
        renewedDate: '2025-02-01',
        expiredDate: '2026-06-03',
        qualificationStatus: '유효',
        certificateNo: '25-05-91-03694',
        workHours: '8',
      },
    ]);
  });

  it('does not parse work hours from unlabeled text numbers', () => {
    const html = `
      <div class="result-card">
        무정전
        취득일자 20250101
        갱신 일자 2025.02.01
        만료일자 2026/06/03
        자격 상태 정상
        자격증번호 25-05-91-03694
        무정전전공 작업실적 15.75
      </div>
    `;

    expect(parseKepcoDistributionQualifications(html)).toEqual([
      {
        qualificationName: '무정전',
        acquiredDate: '2025-01-01',
        renewedDate: '2025-02-01',
        expiredDate: '2026-06-03',
        qualificationStatus: '정상',
        certificateNo: '25-05-91-03694',
      },
    ]);
  });

  it('parses work hours from KEPCO row header result table bold values', () => {
    const html = `
      <table>
        <tbody>
          <tr>
            <th scope="row" class="table-tit center">무정전전공 실적</th>
            <td class="table-txt left" colspan="3">
              <b>53.694h</b>
              <small>2000-01 ~ 2026-07 작업실적입니다.</small>
            </td>
          </tr>
          <tr>
            <th scope="row" class="table-tit center">지중배전전공 실적</th>
            <td class="table-txt left" colspan="3">
              <b>217.573h</b>
              <small>2000-01 ~ 2026-07 작업실적입니다.</small>
            </td>
          </tr>
        </tbody>
      </table>
    `;

    expect(parseKepcoDistributionQualifications(html)).toEqual([
      {
        qualificationName: '무정전',
        workHours: '53.694',
        memo: '2000-01 ~ 2026-07 작업실적입니다.',
      },
      {
        qualificationName: '지중배전',
        workHours: '217.573',
        memo: '2000-01 ~ 2026-07 작업실적입니다.',
      },
    ]);
  });

  it('parses work hours and memo from a KEPCO tbody fragment', () => {
    const html = `
      <tbody>
        <tr>
          <th scope="row" class="table-tit center">지중배전전공 실적</th>
          <td class="table-txt left" colspan="3">
            <b>217.573h</b>
            <small>2000-01 ~ 2026-07 작업실적입니다.</small>
          </td>
        </tr>
      </tbody>
    `;

    expect(parseKepcoDistributionQualifications(html)).toEqual([
      {
        qualificationName: '지중배전',
        workHours: '217.573',
        memo: '2000-01 ~ 2026-07 작업실적입니다.',
      },
    ]);
  });

  it('parses one-decimal work hours without a bold tag', () => {
    const html = `
      <table>
        <tr>
          <th scope="row" class="table-tit center">지중배전전공 실적</th>
          <td class="table-txt left" colspan="3">
            5.9h
            <small>2025-01 ~ 2026-06 작업실적입니다.</small>
          </td>
        </tr>
      </table>
    `;

    expect(parseKepcoDistributionQualifications(html)).toEqual([
      {
        qualificationName: '지중배전',
        workHours: '5.9',
        memo: '2025-01 ~ 2026-06 작업실적입니다.',
      },
    ]);
  });

  it('parses one-decimal work hours from strong tags', () => {
    const html = `
      <tr>
        <th scope="row" class="table-tit center">무정전전공 실적</th>
        <td class="table-txt left" colspan="3">
          <strong>5.9h</strong>
          <small>2025-01 ~ 2026-06 작업실적입니다.</small>
        </td>
      </tr>
    `;

    expect(parseKepcoDistributionQualifications(html)).toEqual([
      {
        qualificationName: '무정전',
        workHours: '5.9',
        memo: '2025-01 ~ 2026-06 작업실적입니다.',
      },
    ]);
  });

  it('parses empty KEPCO hour cells as zero and keeps day-range memo', () => {
    const html = `
      <table>
        <tr>
          <th scope="row" class="table-tit center">지중배전전공 실적</th>
          <td class="table-txt left" colspan="3">
            <b></b>h
            <small>2025-01-01 ~ 2026-06-03 작업실적입니다.</small>
          </td>
        </tr>
      </table>
    `;

    expect(parseKepcoDistributionQualifications(html)).toEqual([
      {
        qualificationName: '지중배전',
        workHours: '0',
        memo: '2025-01-01 ~ 2026-06-03 작업실적입니다.',
      },
    ]);
  });

  it('parses live-response text snippets with h but no number as zero hours', () => {
    const html = `
      <div>
        무정전전공 실적 h 2025-01-01 ~ 2026-06-03 작업실적입니다.
        지중배전전공 실적 h 2025-01-01 ~ 2026-06-03 작업실적입니다.
      </div>
    `;

    expect(parseKepcoDistributionQualifications(html)).toEqual([
      {
        qualificationName: '무정전',
        workHours: '0',
        memo: '2025-01-01 ~ 2026-06-03 작업실적입니다.',
      },
      {
        qualificationName: '지중배전',
        workHours: '0',
        memo: '2025-01-01 ~ 2026-06-03 작업실적입니다.',
      },
    ]);
  });

  it('parses target-specific performance text with h units only', () => {
    const html = `
      <div>
        화면 안내 24시간 이용 가능
        지중배전전공 실적 5.9h 2025-01 ~ 2026-06 작업실적입니다.
      </div>
    `;

    expect(parseKepcoDistributionQualifications(html)).toEqual([
      {
        qualificationName: '지중배전',
        workHours: '5.9',
        memo: '2025-01 ~ 2026-06 작업실적입니다.',
      },
    ]);
  });

  it('merges qualification info with work-hour boxes from KEPCO staff information page', () => {
    const html = `
      <div class="staff-information-container">
        <div class="customer-view-container">
          <div class="sub-component-title-box">
            <h4 class="sub-component-title">자격정보</h4>
          </div>
          <div class="customer-view-content">
            <table>
              <caption>자료실 - 배전기능인력 - 자격정보</caption>
              <thead>
                <tr>
                  <th scope="row" class="table-tit center">자격명</th>
                  <th scope="row" class="table-tit center">취득</th>
                  <th scope="row" class="table-tit center">갱신</th>
                  <th scope="row" class="table-tit center">만료</th>
                  <th scope="row" class="table-tit center">자격상태</th>
                  <th scope="row" class="table-tit center">자격증번호</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td class="table-sub-tit center">지중배전</td>
                  <td class="table-txt center">20251119</td>
                  <td class="table-txt center">20251119</td>
                  <td class="table-txt center">20301118</td>
                  <td class="table-txt center">정상</td>
                  <td class="table-txt center">25039103492</td>
                </tr>
                <tr>
                  <td class="table-sub-tit center">무정전</td>
                  <td class="table-txt center bg-blue">20251203</td>
                  <td class="table-txt center bg-blue">20251203</td>
                  <td class="table-txt center bg-blue">20301202</td>
                  <td class="table-txt center bg-blue">정상</td>
                  <td class="table-txt center bg-blue">25059103694</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div class="customer-view-container">
          <div class="sub-component-title-box">
            <h4 class="sub-component-title">무정전전공 작업시간</h4>
          </div>
          <div class="customer-view-content">
            <table>
              <caption>자료실 - 배전기능인력 - 무정전전공 작업시간</caption>
              <tbody>
                <tr>
                  <th scope="row" class="table-tit center">무정전전공 실적</th>
                  <td class="table-txt left" colspan="3">
                    <b>5.9h</b>
                    <small>2025-01 ~ 2026-07 작업실적입니다.</small>
                  </td>
                </tr>
                <tr>
                  <th scope="row" class="table-tit center">지중배전전공 실적</th>
                  <td class="table-txt left" colspan="3">
                    <b>11.8h</b>
                    <small>2025-01 ~ 2026-07 작업실적입니다.</small>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    expect(parseKepcoDistributionQualifications(html)).toEqual([
      {
        qualificationName: '무정전',
        acquiredDate: '2025-12-03',
        renewedDate: '2025-12-03',
        expiredDate: '2030-12-02',
        qualificationStatus: '정상',
        certificateNo: '25059103694',
        workHours: '5.9',
        memo: '2025-01 ~ 2026-07 작업실적입니다.',
      },
      {
        qualificationName: '지중배전',
        acquiredDate: '2025-11-19',
        renewedDate: '2025-11-19',
        expiredDate: '2030-11-18',
        qualificationStatus: '정상',
        certificateNo: '25039103492',
        workHours: '11.8',
        memo: '2025-01 ~ 2026-07 작업실적입니다.',
      },
    ]);
  });

  it('ignores unrelated responses', () => {
    expect(
      parseKepcoDistributionQualifications('<div>조회 결과가 없습니다.</div>'),
    ).toEqual([]);
  });
});

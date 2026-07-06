import { extractConstructionNo } from './sungwon-tax-invoice-mapper';

describe('sungwon tax invoice mapper', () => {
  it('extracts KEPCO construction number from national tax invoice note', () => {
    expect(
      extractConstructionNo('공사번호:389920263376한전사업소명:경기본부/서수원지사'),
    ).toBe('3899-2026-3376');
  });
});

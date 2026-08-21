import { formatPhoneNumber } from "./quotation-schema";
import {
  formatPrice,
  getPrintableOptionLines,
  getQuotationStatus,
  numberToKoreanCurrency,
  type QuotationCalculation,
  type QuotationIssuerSnapshot,
} from "./quotation-data";

export type QuotationDocumentData = {
  quoteNumber: string | null;
  title: string;
  recipient: {
    organization: string;
    contactName: string;
    phone: string;
    email: string;
  };
  issuer: QuotationIssuerSnapshot;
  calculation: QuotationCalculation;
  issuedAt: number;
  validUntil: number;
};

const dateFormatter = new Intl.DateTimeFormat("ko-KR", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function formatDocumentDate(value: number) {
  return dateFormatter.format(value).replace(/\. /g, ".").replace(/\.$/, "");
}

export function QuotationDocument({
  document,
  preview = false,
}: {
  document: QuotationDocumentData;
  preview?: boolean;
}) {
  const { calculation } = document;
  return (
    <div className="quotation-document-viewport" tabIndex={0}>
      <article className="quotation-document" aria-label="견적서 문서">
        {preview && (
          <span className="quotation-document__preview">발행 전 미리보기</span>
        )}
        <header className="quotation-document__heading">
          <span className="quotation-document__brand">STAYGRAF</span>
          <p>{document.title}</p>
          <h1>견 적 서</h1>
          <dl>
            <div>
              <dt>견적번호</dt>
              <dd>{document.quoteNumber ?? "발행 시 생성"}</dd>
            </div>
            <div>
              <dt>견적일자</dt>
              <dd>{formatDocumentDate(document.issuedAt)}</dd>
            </div>
            <div>
              <dt>유효기간</dt>
              <dd>{formatDocumentDate(document.validUntil)}까지</dd>
            </div>
          </dl>
        </header>

        <section
          className="quotation-parties"
          aria-label="수신처와 공급자 정보"
        >
          <div>
            <h2>받는 분</h2>
            <dl>
              <div>
                <dt>수신처</dt>
                <dd>{document.recipient.organization} 귀하</dd>
              </div>
              <div>
                <dt>담당자</dt>
                <dd>{document.recipient.contactName}</dd>
              </div>
              <div>
                <dt>연락처</dt>
                <dd>{formatPhoneNumber(document.recipient.phone)}</dd>
              </div>
              {document.recipient.email && (
                <div>
                  <dt>이메일</dt>
                  <dd>{document.recipient.email}</dd>
                </div>
              )}
            </dl>
          </div>
          <div>
            <h2>공급자</h2>
            <dl>
              <div>
                <dt>상호</dt>
                <dd>{document.issuer.name}</dd>
              </div>
              <div>
                <dt>사업자번호</dt>
                <dd>{document.issuer.businessNumber}</dd>
              </div>
              {document.issuer.representative &&
                document.issuer.representative !== "미등록" && (
                  <div>
                    <dt>대표자</dt>
                    <dd>{document.issuer.representative}</dd>
                  </div>
                )}
              <div>
                <dt>주소</dt>
                <dd>{document.issuer.address}</dd>
              </div>
              <div>
                <dt>업태·종목</dt>
                <dd>
                  {document.issuer.businessType} ·{" "}
                  {document.issuer.businessItem}
                </dd>
              </div>
              <div>
                <dt>연락처</dt>
                <dd>{formatPhoneNumber(document.issuer.phone)}</dd>
              </div>
            </dl>
          </div>
        </section>

        <section className="quotation-amount" aria-label="견적 총액">
          <span>견적금액</span>
          <strong>
            {numberToKoreanCurrency(calculation.total.includingVat)}
          </strong>
          <b>{formatPrice(calculation.total.includingVat)}</b>
          <small>부가가치세 포함</small>
        </section>

        <div className="quotation-document__table-heading">
          <h2 className="quotation-document__lead">견적 내역</h2>
          <span>(단위: 원)</span>
        </div>
        <table className="quotation-table">
          <caption className="sr-only">견적 품목과 금액</caption>
          <colgroup>
            <col className="quotation-col-number" />
            <col className="quotation-col-name" />
            <col className="quotation-col-option" />
            <col className="quotation-col-quantity" />
            <col className="quotation-col-unit" />
            <col className="quotation-col-price" />
            <col className="quotation-col-supply" />
            <col className="quotation-col-vat" />
          </colgroup>
          <thead>
            <tr>
              <th scope="col">No.</th>
              <th scope="col">품명</th>
              <th scope="col">규격·옵션</th>
              <th scope="col">수량</th>
              <th scope="col">단위</th>
              <th scope="col">
                단가
                <br />
                (VAT 포함)
              </th>
              <th scope="col">공급가액</th>
              <th scope="col">세액</th>
            </tr>
          </thead>
          <tbody>
            {calculation.groups.flatMap((group) =>
              group.lines.map((line) => (
                <QuotationLineRow key={line.id} line={line} />
              )),
            )}
          </tbody>
        </table>

        <section
          className="quotation-shipping-conditions"
          aria-labelledby="quotation-shipping-title"
        >
          <h2 id="quotation-shipping-title">배송 조건</h2>
          <dl>
            {calculation.groups.map((group) => (
              <div key={group.method}>
                <dt>{group.label}</dt>
                <dd>{group.note}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="quotation-totals" aria-label="견적 합계">
          <dl>
            <div>
              <dt>
                {calculation.productDiscountIncludingVat > 0
                  ? "정상 상품금액"
                  : "상품 금액"}
              </dt>
              <dd>
                {formatPrice(calculation.regularProductTotalIncludingVat)}
              </dd>
            </div>
            {calculation.productDiscountIncludingVat > 0 && (
              <div className="is-discount">
                <dt>상품 할인</dt>
                <dd>-{formatPrice(calculation.productDiscountIncludingVat)}</dd>
              </div>
            )}
            <div>
              <dt>선불 배송비</dt>
              <dd>
                {formatPrice(calculation.prepaidShippingTotalIncludingVat)}
              </dd>
            </div>
            <div>
              <dt>공급가액</dt>
              <dd>{formatPrice(calculation.total.supply)}</dd>
            </div>
            <div>
              <dt>부가세</dt>
              <dd>{formatPrice(calculation.total.vat)}</dd>
            </div>
            <div className="is-total">
              <dt>견적 합계</dt>
              <dd>{formatPrice(calculation.total.includingVat)}</dd>
            </div>
          </dl>
        </section>

        <section
          className="quotation-terms"
          aria-labelledby="quotation-terms-title"
        >
          <h2 id="quotation-terms-title">견적 조건</h2>
          <ul>
            <li>견적 유효기간은 견적일로부터 14일입니다.</li>
            <li>견적서는 주문 확정 및 재고 확보 문서가 아닙니다.</li>
            <li>상품 가격과 판매 조건은 유효기간 이후 변경될 수 있습니다.</li>
            {calculation.hasCollectShipping && (
              <li>
                개별 화물 운송비는 견적 합계에 포함되지 않으며 착불로 별도
                결제됩니다.
              </li>
            )}
            <li>실제 주문 시 수량과 배송 조건을 다시 확인해 주세요.</li>
          </ul>
        </section>
        <footer className="quotation-document__footer">
          <span>{document.issuer.name}</span>
          <span>
            {document.issuer.phone} · {document.issuer.email}
          </span>
          {document.quoteNumber && (
            <span className="quotation-document__status">
              {getQuotationStatus({ validUntil: document.validUntil })}
            </span>
          )}
        </footer>
      </article>
    </div>
  );
}

function QuotationLineRow({
  line,
}: {
  line: QuotationCalculation["groups"][number]["lines"][number];
}) {
  const optionLines = getPrintableOptionLines(line);

  return (
    <tr className={`quotation-table__${line.kind}`}>
      <td>{line.lineNumber}</td>
      <td>{line.productName}</td>
      <td>
        {optionLines.map((option) => (
          <span key={option}>{option}</span>
        ))}
      </td>
      <td data-unit={line.unit}>{line.quantity.toLocaleString("ko-KR")}</td>
      <td>{line.unit}</td>
      <td>{line.appliedUnitPriceIncludingVat.toLocaleString("ko-KR")}</td>
      <td>{line.total.supply.toLocaleString("ko-KR")}</td>
      <td>{line.total.vat.toLocaleString("ko-KR")}</td>
    </tr>
  );
}

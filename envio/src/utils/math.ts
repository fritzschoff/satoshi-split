import { BigDecimal } from 'generated';

export const ADDRESS_ZERO = '0x0000000000000000000000000000000000000000';
export const ZERO_BI = BigInt(0);
export const ONE_BI = BigInt(1);
export const ZERO_BD = new BigDecimal('0');
export const ONE_BD = new BigDecimal('1');
export const Q96 = BigInt(2) ** BigInt(96);
export const MaxUint256 = BigInt(
  '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'
);

export function exponentToBigDecimal(decimals: bigint): BigDecimal {
  let resultString = '1';

  for (let i = 0; i < Number(decimals); i++) {
    resultString += '0';
  }

  return new BigDecimal(resultString);
}

export function safeDiv(amount0: BigDecimal, amount1: BigDecimal): BigDecimal {
  if (amount1.eq(ZERO_BD)) {
    return ZERO_BD;
  } else {
    return amount0.div(amount1);
  }
}

export function convertTokenToDecimal(
  tokenAmount: bigint,
  exchangeDecimals: bigint
): BigDecimal {
  if (exchangeDecimals == ZERO_BI) {
    return new BigDecimal(tokenAmount.toString());
  }
  return new BigDecimal(tokenAmount.toString()).div(
    exponentToBigDecimal(exchangeDecimals)
  );
}

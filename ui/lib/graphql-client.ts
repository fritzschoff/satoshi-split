import { GraphQLClient } from 'graphql-request';

const ENVIO_GRAPHQL_URL =
  (process.env.NEXT_PUBLIC_NODE_ENV === 'production'
    ? process.env.NEXT_PUBLIC_ENVIO_GRAPHQL_URL_PROD
    : process.env.NEXT_PUBLIC_ENVIO_GRAPHQL_URL_DEV) ||
  'http://localhost:8080/v1/graphql';

export const graphqlClient = new GraphQLClient(ENVIO_GRAPHQL_URL);

export const getSplitQuery = `
  query GetSplit($id: String!) {
    Split(where: { id: { _eq: $id } }) {
      id
      creator
      members
      defaultToken
      createdAt
      totalDebt
      spendings {
        id
        spendingId
        title
        payer
        amount
        forWho
        timestamp
        token
        txHash
      }
      debts {
        id
        debtor
        creditor
        amount
        token
        isPaid
        paidAt
        txHash
      }
    }
  }
`;

export const getUserActivityQuery = `
  query GetUserActivity($address: String!) {
    UserActivity(where: { id: { _eq: $address } }) {
      id
      totalSpentETH
      totalSpentUSD
      totalReceivedETH
      totalReceivedUSD
      totalGasSpent
      transactionCount
      splits
      transactions {
        id
        from_id
        to
        amount
        token
        gasUsed
        gasPrice
        timestamp
        chainId
        status
        blockNumber
        txType
      }
    }
  }
`;

export const getUserSplitsQuery = `
  query GetUserSplits($address: String!) {
    Split(where: { members: { _contains: [$address] } }) {
      id
      creator
      members
      defaultToken
      createdAt
      totalDebt
    }
  }
`;

export const getBridgeDepositsQuery = `
  query GetBridgeDeposits($from: String, $limit: Int = 100) {
    BridgeDeposit(
      where: { from: { _eq: $from } }
      order_by: { timestamp: desc }
      limit: $limit
    ) {
      id
      requestHash
      from
      gasRefunded
      timestamp
      blockNumber
      txHash
      chainId
    }
  }
`;

export const getBridgeDepositByRequestHashQuery = `
  query GetBridgeDepositByRequestHash($requestHash: String!) {
    BridgeDeposit(where: { requestHash: { _eq: $requestHash } }) {
      id
      requestHash
      from
      gasRefunded
      timestamp
      blockNumber
      txHash
      chainId
    }
  }
`;

export const getBridgeFillsQuery = `
  query GetBridgeFills($solver: String, $limit: Int = 100) {
    BridgeFill(
      where: { solver: { _eq: $solver } }
      order_by: { timestamp: desc }
      limit: $limit
    ) {
      id
      requestHash
      from
      solver
      timestamp
      blockNumber
      txHash
      chainId
    }
  }
`;

export const getBridgeFillByRequestHashQuery = `
  query GetBridgeFillByRequestHash($requestHash: String!) {
    BridgeFill(where: { requestHash: { _eq: $requestHash } }) {
      id
      requestHash
      from
      solver
      timestamp
      blockNumber
      txHash
      chainId
    }
  }
`;

export const getBridgeWithdrawalsQuery = `
  query GetBridgeWithdrawals($to: String, $limit: Int = 100) {
    BridgeWithdraw(
      where: { to: { _eq: $to } }
      order_by: { timestamp: desc }
      limit: $limit
    ) {
      id
      to
      token
      amount
      timestamp
      blockNumber
      txHash
      chainId
    }
  }
`;

export const getBridgeSettlesQuery = `
  query GetBridgeSettles($limit: Int = 100) {
    BridgeSettle(
      order_by: { timestamp: desc }
      limit: $limit
    ) {
      id
      nonce
      solvers
      tokens
      amounts
      timestamp
      blockNumber
      txHash
      chainId
    }
  }
`;

export const getBridgeSettleBySolverQuery = `
  query GetBridgeSettleBySolver($solver: String!, $limit: Int = 100) {
    BridgeSettle(
      where: { solvers: { _contains: [$solver] } }
      order_by: { timestamp: desc }
      limit: $limit
    ) {
      id
      nonce
      solvers
      tokens
      amounts
      timestamp
      blockNumber
      txHash
      chainId
    }
  }
`;

export const getBridgeReceiveETHQuery = `
  query GetBridgeReceiveETH($from: String, $limit: Int = 100) {
    BridgeReceiveETH(
      where: { from: { _eq: $from } }
      order_by: { timestamp: desc }
      limit: $limit
    ) {
      id
      from
      amount
      timestamp
      blockNumber
      txHash
      chainId
    }
  }
`;

export const getBridgeGasConfigQuery = `
  query GetBridgeGasConfig($chainId: Int!) {
    BridgeGasConfig(
      where: { chainId: { _eq: $chainId } }
      order_by: { updatedAt: desc }
    ) {
      id
      functionType
      overhead
      updatedAt
      blockNumber
      txHash
      chainId
    }
  }
`;

export const getBridgeGasPriceQuery = `
  query GetBridgeGasPrice($chainId: Int!) {
    BridgeGasPrice(
      where: { chainId: { _eq: $chainId } }
      order_by: { updatedAt: desc }
      limit: 1
    ) {
      id
      gasPrice
      updatedAt
      blockNumber
      txHash
      chainId
    }
  }
`;

export const getUserBridgeActivityQuery = `
  query GetUserBridgeActivity($address: String!, $limit: Int = 50) {
    BridgeDeposit(
      where: { from: { _eq: $address } }
      order_by: { timestamp: desc }
      limit: $limit
    ) {
      id
      requestHash
      from
      gasRefunded
      timestamp
      blockNumber
      txHash
      chainId
    }
    BridgeFill(
      where: { solver: { _eq: $address } }
      order_by: { timestamp: desc }
      limit: $limit
    ) {
      id
      requestHash
      from
      solver
      timestamp
      blockNumber
      txHash
      chainId
    }
    BridgeWithdraw(
      where: { to: { _eq: $address } }
      order_by: { timestamp: desc }
      limit: $limit
    ) {
      id
      to
      token
      amount
      timestamp
      blockNumber
      txHash
      chainId
    }
  }
`;

export const getAllBridgeTransactionsQuery = `
  query GetAllBridgeTransactions($limit: Int = 100) {
    BridgeDeposit(order_by: { timestamp: desc }, limit: $limit) {
      id
      requestHash
      from
      gasRefunded
      timestamp
      blockNumber
      txHash
      chainId
    }
    BridgeFill(order_by: { timestamp: desc }, limit: $limit) {
      id
      requestHash
      from
      solver
      timestamp
      blockNumber
      txHash
      chainId
    }
    BridgeWithdraw(order_by: { timestamp: desc }, limit: $limit) {
      id
      to
      token
      amount
      timestamp
      blockNumber
      txHash
      chainId
    }
    BridgeSettle(order_by: { timestamp: desc }, limit: $limit) {
      id
      nonce
      solvers
      tokens
      amounts
      timestamp
      blockNumber
      txHash
      chainId
    }
  }
`;

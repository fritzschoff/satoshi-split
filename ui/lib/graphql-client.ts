import { GraphQLClient } from 'graphql-request';

const ENVIO_GRAPHQL_URL =
  process.env.NEXT_PUBLIC_ENVIO_GRAPHQL_URL ||
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

import { GraphQLClient } from 'graphql-request';

const ENVIO_GRAPHQL_URL =
  process.env.NEXT_PUBLIC_ENVIO_GRAPHQL_URL ||
  'http://localhost:8080/v1/graphql';

export const graphqlClient = new GraphQLClient(ENVIO_GRAPHQL_URL);

export const getSplitQuery = `
  query GetSplit($id: ID!) {
    Split(id: $id) {
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
        chainId
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
  query GetUserActivity($address: ID!) {
    UserActivity(id: $address) {
      id
      totalSpent
      totalReceived
      totalGasSpent
      transactionCount
      splits
      transactions {
        id
        from {
          id
        }
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
    Splits(where: { members_contains: [$address] }) {
      id
      creator
      members
      defaultToken
      createdAt
      totalDebt
    }
  }
`;

import assert from 'assert';
import { TestHelpers } from 'generated';
const { MockDb, SplitManager, Addresses } = TestHelpers;

describe('SplitManager', () => {
  it('SplitCreated should create a Split entity with correct data', async () => {
    // Instantiate a mock DB
    const mockDbEmpty = MockDb.createMockDb();

    // Get mock addresses from helpers
    const creatorAddress = Addresses.mockAddresses[0];
    const member1 = Addresses.mockAddresses[1];
    const member2 = Addresses.mockAddresses[2];
    const tokenAddress = Addresses.mockAddresses[3];

    // Create a mock SplitCreated event
    const mockSplitCreated = SplitManager.SplitCreated.createMockEvent({
      splitId: 1n,
      creator: creatorAddress,
      initialMembers: [member1, member2],
      defaultToken: tokenAddress,
    });

    // Process the mockEvent
    const mockDbAfterCreate = await SplitManager.SplitCreated.processEvent({
      event: mockSplitCreated,
      mockDb: mockDbEmpty,
    });

    // Get the created split
    const split = mockDbAfterCreate.entities.Split.get('1');

    // Assert the split was created correctly
    assert.notEqual(split, undefined, 'Split should be created');
    assert.equal(split?.id, '1', 'Split ID should be 1');
    assert.equal(
      split?.creator.toLowerCase(),
      creatorAddress.toLowerCase(),
      'Creator should match'
    );
    assert.equal(split?.totalDebt, 0n, 'Initial debt should be 0');
    assert.ok(
      split?.members.includes(creatorAddress.toLowerCase()),
      'Creator should be in members'
    );
    assert.ok(
      split?.members.includes(member1.toLowerCase()),
      'Member1 should be in members'
    );
    assert.ok(
      split?.members.includes(member2.toLowerCase()),
      'Member2 should be in members'
    );

    // Check user activity was created for creator
    const creatorActivity = mockDbAfterCreate.entities.UserActivity.get(
      creatorAddress.toLowerCase()
    );
    assert.notEqual(
      creatorActivity,
      undefined,
      'Creator activity should be created'
    );
    assert.equal(
      creatorActivity?.transactionCount,
      1,
      'Transaction count should be 1'
    );
  });
});

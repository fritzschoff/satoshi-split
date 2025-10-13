// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Test} from "forge-std/Test.sol";
import {SplitManager} from "./SplitManager.sol";
import {MockERC20} from "./MockERC20.sol";

contract SplitManagerTest is Test {
    SplitManager public splitManager;
    MockERC20 public mockUSDC;
    MockERC20 public mockUSDT;
    
    address public creator = address(0x1);
    address public alice = address(0x2);
    address public bob = address(0x3);
    address public charlie = address(0x4);
    
    function setUp() public {
        splitManager = new SplitManager();
        mockUSDC = new MockERC20("Mock USDC", "USDC", 6);
        mockUSDT = new MockERC20("Mock USDT", "USDT", 6);
        
        mockUSDC.mint(creator, 10000e6);
        mockUSDC.mint(alice, 10000e6);
        mockUSDC.mint(bob, 10000e6);
        mockUSDC.mint(charlie, 10000e6);
        
        mockUSDT.mint(creator, 10000e6);
        mockUSDT.mint(alice, 10000e6);
        mockUSDT.mint(bob, 10000e6);
        mockUSDT.mint(charlie, 10000e6);
        
        vm.deal(creator, 100 ether);
        vm.deal(alice, 100 ether);
        vm.deal(bob, 100 ether);
        vm.deal(charlie, 100 ether);
    }
    
    function test_CreateSplitWithInitialMembers() public {
        vm.startPrank(creator);
        
        address[] memory initialMembers = new address[](2);
        initialMembers[0] = alice;
        initialMembers[1] = bob;
        
        uint256 splitId = splitManager.createSplit(initialMembers, address(mockUSDC));
        
        (
            address splitCreator,
            address[] memory members,
            uint256 createdAt,
            uint256 totalDebt,
            address defaultToken,
            uint256 spendingCounter
        ) = splitManager.getSplitDetails(splitId);
        
        require(splitCreator == creator, "Creator should match");
        require(members.length == 3, "Should have 3 members (creator + 2)");
        require(members[0] == creator, "First member should be creator");
        require(defaultToken == address(mockUSDC), "Default token should be USDC");
        require(totalDebt == 0, "Initial debt should be 0");
        require(spendingCounter == 0, "Initial spending counter should be 0");
        require(createdAt > 0, "Created timestamp should be set");
        
        vm.stopPrank();
    }
    
    function test_CreateSplitWithETH() public {
        vm.startPrank(creator);
        
        address[] memory initialMembers = new address[](1);
        initialMembers[0] = alice;
        
        uint256 splitId = splitManager.createSplit(initialMembers, address(0));
        
        (,,,,address defaultToken,) = splitManager.getSplitDetails(splitId);
        
        require(defaultToken == address(0), "Default token should be ETH (address(0))");
        
        vm.stopPrank();
    }
    
    function test_AddMember() public {
        vm.startPrank(creator);
        
        address[] memory initialMembers = new address[](1);
        initialMembers[0] = alice;
        
        uint256 splitId = splitManager.createSplit(initialMembers, address(mockUSDC));
        
        splitManager.addMember(splitId, bob);
        
        (,address[] memory members,,,,) = splitManager.getSplitDetails(splitId);
        
        require(members.length == 3, "Should have 3 members");
        require(members[2] == bob, "Bob should be added");
        
        vm.stopPrank();
    }
    
    function test_CannotAddMemberIfNotCreator() public {
        vm.startPrank(creator);
        
        address[] memory initialMembers = new address[](1);
        initialMembers[0] = alice;
        
        uint256 splitId = splitManager.createSplit(initialMembers, address(mockUSDC));
        
        vm.stopPrank();
        
        vm.startPrank(alice);
        vm.expectRevert("Not the split creator");
        splitManager.addMember(splitId, bob);
        vm.stopPrank();
    }
    
    function test_RemoveMember() public {
        vm.startPrank(creator);
        
        address[] memory initialMembers = new address[](2);
        initialMembers[0] = alice;
        initialMembers[1] = bob;
        
        uint256 splitId = splitManager.createSplit(initialMembers, address(mockUSDC));
        
        splitManager.removeMember(splitId, bob);
        
        (,address[] memory members,,,,) = splitManager.getSplitDetails(splitId);
        
        require(members.length == 2, "Should have 2 members");
        
        vm.stopPrank();
    }
    
    function test_CannotRemoveCreator() public {
        vm.startPrank(creator);
        
        address[] memory initialMembers = new address[](1);
        initialMembers[0] = alice;
        
        uint256 splitId = splitManager.createSplit(initialMembers, address(mockUSDC));
        
        vm.expectRevert("Cannot remove creator");
        splitManager.removeMember(splitId, creator);
        
        vm.stopPrank();
    }
    
    function test_AddSpendingAllMembers() public {
        vm.startPrank(creator);
        
        address[] memory initialMembers = new address[](2);
        initialMembers[0] = alice;
        initialMembers[1] = bob;
        
        uint256 splitId = splitManager.createSplit(initialMembers, address(mockUSDC));
        
        address[] memory forWho = new address[](0);
        splitManager.addSpending(splitId, "Dinner", 300e6, forWho);
        
        (,,,uint256 totalDebt,,uint256 spendingCounter) = splitManager.getSplitDetails(splitId);
        
        require(spendingCounter == 1, "Spending counter should be 1");
        require(totalDebt == 200e6, "Total debt should be 200 USDC (alice + bob owe 100 each)");
        
        vm.stopPrank();
    }
    
    function test_AddSpendingExcludingMembers() public {
        vm.startPrank(creator);
        
        address[] memory initialMembers = new address[](2);
        initialMembers[0] = alice;
        initialMembers[1] = bob;
        
        uint256 splitId = splitManager.createSplit(initialMembers, address(mockUSDC));
        
        address[] memory forWho = new address[](2);
        forWho[0] = creator;
        forWho[1] = alice;
        
        splitManager.addSpending(splitId, "Lunch", 200e6, forWho);
        
        (,,,uint256 totalDebt,,) = splitManager.getSplitDetails(splitId);
        
        require(totalDebt == 100e6, "Total debt should be 100 USDC");
        
        SplitManager.Debt memory debt = splitManager.getDebt(splitId, alice, creator);
        require(debt.amount == 100e6, "Alice should owe 100 USDC");
        
        vm.stopPrank();
    }
    
    function test_PayDebtWithToken() public {
        vm.startPrank(creator);
        
        address[] memory initialMembers = new address[](1);
        initialMembers[0] = alice;
        
        uint256 splitId = splitManager.createSplit(initialMembers, address(mockUSDC));
        
        address[] memory forWho = new address[](2);
        forWho[0] = creator;
        forWho[1] = alice;
        
        splitManager.addSpending(splitId, "Dinner", 200e6, forWho);
        
        vm.stopPrank();
        
        vm.startPrank(alice);
        mockUSDC.approve(address(splitManager), 100e6);
        
        uint256 creatorBalanceBefore = mockUSDC.balanceOf(creator);
        splitManager.payDebt(splitId, creator, 100e6);
        uint256 creatorBalanceAfter = mockUSDC.balanceOf(creator);
        
        require(creatorBalanceAfter - creatorBalanceBefore == 100e6, "Creator should receive 100 USDC");
        
        SplitManager.Debt memory debt = splitManager.getDebt(splitId, alice, creator);
        require(debt.amount == 0, "Debt should be paid off");
        require(debt.isPaid == true, "Debt should be marked as paid");
        
        vm.stopPrank();
    }
    
    function test_PayDebtWithETH() public {
        vm.startPrank(creator);
        
        address[] memory initialMembers = new address[](1);
        initialMembers[0] = alice;
        
        uint256 splitId = splitManager.createSplit(initialMembers, address(0)); // ETH
        
        address[] memory forWho = new address[](2);
        forWho[0] = creator;
        forWho[1] = alice;
        
        splitManager.addSpending(splitId, "Dinner", 2 ether, forWho);
        
        vm.stopPrank();
        
        vm.startPrank(alice);
        
        uint256 creatorBalanceBefore = creator.balance;
        splitManager.payDebt{value: 1 ether}(splitId, creator, 1 ether);
        uint256 creatorBalanceAfter = creator.balance;
        
        require(creatorBalanceAfter - creatorBalanceBefore == 1 ether, "Creator should receive 1 ETH");
        
        SplitManager.Debt memory debt = splitManager.getDebt(splitId, alice, creator);
        require(debt.amount == 0, "Debt should be paid off");
        
        vm.stopPrank();
    }
    
    function test_PartialDebtPayment() public {
        vm.startPrank(creator);
        
        address[] memory initialMembers = new address[](1);
        initialMembers[0] = alice;
        
        uint256 splitId = splitManager.createSplit(initialMembers, address(mockUSDC));
        
        address[] memory forWho = new address[](2);
        forWho[0] = creator;
        forWho[1] = alice;
        
        splitManager.addSpending(splitId, "Dinner", 200e6, forWho);
        
        vm.stopPrank();
        
        vm.startPrank(alice);
        mockUSDC.approve(address(splitManager), 50e6);
        splitManager.payDebt(splitId, creator, 50e6);
        
        SplitManager.Debt memory debt = splitManager.getDebt(splitId, alice, creator);
        require(debt.amount == 50e6, "Remaining debt should be 50 USDC");
        require(debt.isPaid == false, "Debt should not be marked as fully paid");
        
        vm.stopPrank();
    }
    
    function test_MultipleSpendingsAccumulateDebts() public {
        vm.startPrank(creator);
        
        address[] memory initialMembers = new address[](1);
        initialMembers[0] = alice;
        
        uint256 splitId = splitManager.createSplit(initialMembers, address(mockUSDC));
        
        address[] memory forWho = new address[](2);
        forWho[0] = creator;
        forWho[1] = alice;
        
        splitManager.addSpending(splitId, "Dinner", 200e6, forWho);
        splitManager.addSpending(splitId, "Lunch", 100e6, forWho);
        
        SplitManager.Debt memory debt = splitManager.getDebt(splitId, alice, creator);
        require(debt.amount == 150e6, "Total debt should be 150 USDC (100 + 50)");
        
        vm.stopPrank();
    }
    
    function test_GetSpendings() public {
        vm.startPrank(creator);
        
        address[] memory initialMembers = new address[](1);
        initialMembers[0] = alice;
        
        uint256 splitId = splitManager.createSplit(initialMembers, address(mockUSDC));
        
        address[] memory forWho = new address[](0);
        splitManager.addSpending(splitId, "Dinner", 300e6, forWho);
        splitManager.addSpending(splitId, "Lunch", 150e6, forWho);
        
        SplitManager.Spending[] memory spendings = splitManager.getSpendings(splitId);
        
        require(spendings.length == 2, "Should have 2 spendings");
        require(spendings[0].amount == 300e6, "First spending should be 300 USDC");
        require(spendings[1].amount == 150e6, "Second spending should be 150 USDC");
        
        vm.stopPrank();
    }
    
    function test_GetDebtorDebts() public {
        vm.startPrank(creator);
        
        address[] memory initialMembers = new address[](2);
        initialMembers[0] = alice;
        initialMembers[1] = bob;
        
        uint256 splitId = splitManager.createSplit(initialMembers, address(mockUSDC));
        
        address[] memory forWho = new address[](0);
        splitManager.addSpending(splitId, "Dinner", 300e6, forWho);
        
        vm.stopPrank();
        
        vm.startPrank(bob);
        address[] memory forWhoBob = new address[](2);
        forWhoBob[0] = bob;
        forWhoBob[1] = alice;
        splitManager.addSpending(splitId, "Lunch", 100e6, forWhoBob);
        vm.stopPrank();
        
        (address[] memory creditors, uint256[] memory amounts) = splitManager.getDebtorDebts(splitId, alice);
        
        require(creditors.length == 2, "Alice should have 2 creditors");
        require(amounts[0] > 0, "Should have debt to first creditor");
        require(amounts[1] > 0, "Should have debt to second creditor");
    }
    
    function testFuzz_EqualSplitCalculation(uint8 numMembers, uint96 amount) public {
        vm.assume(numMembers >= 2 && numMembers <= 10);
        vm.assume(amount >= numMembers && amount <= 1000000e6);
        
        vm.startPrank(creator);
        
        address[] memory initialMembers = new address[](numMembers - 1);
        for (uint8 i = 0; i < numMembers - 1; i++) {
            initialMembers[i] = address(uint160(i + 100));
        }
        
        uint256 splitId = splitManager.createSplit(initialMembers, address(mockUSDC));
        
        address[] memory forWho = new address[](0);
        splitManager.addSpending(splitId, "Test", amount, forWho);
        
        uint256 expectedSharePerPerson = amount / numMembers;
        uint256 expectedTotalDebt = expectedSharePerPerson * (numMembers - 1);
        
        (,,,uint256 totalDebt,,) = splitManager.getSplitDetails(splitId);
        
        require(totalDebt == expectedTotalDebt, "Total debt calculation incorrect");
        
        vm.stopPrank();
    }
    
    function test_CannotPayMoreThanOwed() public {
        vm.startPrank(creator);
        
        address[] memory initialMembers = new address[](1);
        initialMembers[0] = alice;
        
        uint256 splitId = splitManager.createSplit(initialMembers, address(mockUSDC));
        
        address[] memory forWho = new address[](2);
        forWho[0] = creator;
        forWho[1] = alice;
        
        splitManager.addSpending(splitId, "Dinner", 200e6, forWho);
        
        vm.stopPrank();
        
        vm.startPrank(alice);
        mockUSDC.approve(address(splitManager), 200e6);
        
        vm.expectRevert("Invalid payment amount");
        splitManager.payDebt(splitId, creator, 200e6); // Trying to pay 200 when only owes 100
        
        vm.stopPrank();
    }
}


// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title SplitManager
 * @notice Manages expense splitting groups with debt tracking and settlement
 * @dev Supports ETH and ERC20 tokens for expense tracking and debt payment
 */
contract SplitManager {
    using SafeERC20 for IERC20;

    struct Split {
        address creator;
        address[] members;
        uint256 createdAt;
        uint256 totalDebt;
        address defaultToken; // 0x for ETH
        uint256 spendingCounter;
    }

    struct Spending {
        uint256 id;
        string title;
        address payer;
        uint256 amount;
        address[] forWho;
        uint256 timestamp;
        address token;
    }

    struct Debt {
        address debtor;
        address creditor;
        uint256 amount;
        address token;
        bool isPaid;
    }

    uint256 private _splitIdCounter;
    mapping(uint256 => Split) public splits;
    mapping(uint256 => Spending[]) public splitSpendings;
    mapping(uint256 => mapping(address => mapping(address => Debt))) public debts; // splitId => debtor => creditor => Debt
    
    event SplitCreated(
        uint256 indexed splitId,
        address indexed creator,
        address[] initialMembers,
        address defaultToken
    );
    
    event MemberAdded(
        uint256 indexed splitId,
        address indexed member
    );
    
    event MemberRemoved(
        uint256 indexed splitId,
        address indexed member
    );
    
    event SpendingAdded(
        uint256 indexed splitId,
        uint256 spendingId,
        string title,
        address indexed payer,
        uint256 amount,
        address[] forWho,
        address token
    );
    
    event DebtPaid(
        uint256 indexed splitId,
        address indexed debtor,
        address indexed creditor,
        uint256 amount,
        address token
    );

    modifier onlyCreator(uint256 splitId) {
        require(splits[splitId].creator == msg.sender, "Not the split creator");
        _;
    }

    modifier splitExists(uint256 splitId) {
        require(splits[splitId].creator != address(0), "Split does not exist");
        _;
    }

    /**
     * @notice Create a new expense split group
     * @param initialMembers Array of initial member addresses (creator is automatically included)
     * @param defaultToken Default token for the split (address(0) for ETH)
     * @return splitId The ID of the newly created split
     */
    function createSplit(
        address[] memory initialMembers,
        address defaultToken
    ) external returns (uint256 splitId) {
        splitId = _splitIdCounter++;
        
        Split storage newSplit = splits[splitId];
        newSplit.creator = msg.sender;
        newSplit.createdAt = block.timestamp;
        newSplit.defaultToken = defaultToken;
        newSplit.spendingCounter = 0;
        newSplit.totalDebt = 0;
        
        newSplit.members.push(msg.sender);
        
        for (uint256 i = 0; i < initialMembers.length; i++) {
            address member = initialMembers[i];
            require(member != address(0), "Invalid member address");
            require(member != msg.sender, "Creator cannot be in members list");
            
            for (uint256 j = 0; j < i; j++) {
                require(initialMembers[j] != member, "Duplicate member address");
            }
            
            newSplit.members.push(member);
        }
        
        emit SplitCreated(splitId, msg.sender, initialMembers, defaultToken);
    }

    /**
     * @notice Add a member to an existing split
     * @param splitId The ID of the split
     * @param member The address of the member to add
     */
    function addMember(uint256 splitId, address member) 
        external 
        splitExists(splitId) 
        onlyCreator(splitId) 
    {
        require(member != address(0), "Invalid member address");
        require(!_isMember(splitId, member), "Member already exists");
        
        splits[splitId].members.push(member);
        emit MemberAdded(splitId, member);
    }

    /**
     * @notice Remove a member from a split
     * @param splitId The ID of the split
     * @param member The address of the member to remove
     */
    function removeMember(uint256 splitId, address member) 
        external 
        splitExists(splitId) 
        onlyCreator(splitId) 
    {
        require(member != splits[splitId].creator, "Cannot remove creator");
        
        address[] storage members = splits[splitId].members;
        for (uint256 i = 0; i < members.length; i++) {
            if (members[i] == member) {
                members[i] = members[members.length - 1];
                members.pop();
                emit MemberRemoved(splitId, member);
                return;
            }
        }
        revert("Member not found");
    }

    /**
     * @notice Add an expense to the split
     * @param splitId The ID of the split
     * @param title Title/description of the expense
     * @param amount Total amount of the expense
     * @param forWho Array of member addresses who participated (empty = all members)
     */
    function addSpending(
        uint256 splitId,
        string memory title,
        uint256 amount,
        address[] memory forWho
    ) external splitExists(splitId) {
        require(_isMember(splitId, msg.sender), "Not a member of this split");
        require(amount > 0, "Amount must be greater than 0");
        
        Split storage split = splits[splitId];
        address token = split.defaultToken;
        
        address[] memory participants = forWho.length == 0 ? split.members : forWho;
        
        for (uint256 i = 0; i < participants.length; i++) {
            require(_isMember(splitId, participants[i]), "Participant not a member");
        }
        
        Spending memory newSpending = Spending({
            id: split.spendingCounter,
            title: title,
            payer: msg.sender,
            amount: amount,
            forWho: participants,
            timestamp: block.timestamp,
            token: token
        });
        
        splitSpendings[splitId].push(newSpending);
        split.spendingCounter++;
        
        uint256 sharePerPerson = amount / participants.length;
        
        for (uint256 i = 0; i < participants.length; i++) {
            address participant = participants[i];
            
            if (participant == msg.sender) continue;
            
            Debt storage debt = debts[splitId][participant][msg.sender];
            
            if (debt.debtor == address(0)) {
                debt.debtor = participant;
                debt.creditor = msg.sender;
                debt.token = token;
                debt.amount = sharePerPerson;
                debt.isPaid = false;
            } else {
                debt.amount += sharePerPerson;
            }
            
            split.totalDebt += sharePerPerson;
        }
        
        emit SpendingAdded(splitId, newSpending.id, title, msg.sender, amount, participants, token);
    }

    /**
     * @notice Pay off a debt to a creditor
     * @param splitId The ID of the split
     * @param creditor The address of the creditor
     * @param amount The amount to pay
     */
    function payDebt(
        uint256 splitId,
        address creditor,
        uint256 amount
    ) external payable splitExists(splitId) {
        Debt storage debt = debts[splitId][msg.sender][creditor];
        require(debt.debtor != address(0), "No debt exists");
        require(!debt.isPaid, "Debt already paid");
        require(amount > 0 && amount <= debt.amount, "Invalid payment amount");
        
        address token = splits[splitId].defaultToken;
        
        if (token == address(0)) {
            require(msg.value == amount, "Incorrect ETH amount");
            (bool success, ) = creditor.call{value: amount}("");
            require(success, "ETH transfer failed");
        } else {
            require(msg.value == 0, "ETH not accepted for token payments");
            IERC20(token).safeTransferFrom(msg.sender, creditor, amount);
        }
        
        debt.amount -= amount;
        splits[splitId].totalDebt -= amount;
        
        if (debt.amount == 0) {
            debt.isPaid = true;
        }
        
        emit DebtPaid(splitId, msg.sender, creditor, amount, token);
    }

    /**
     * @notice Get complete details of a split
     * @param splitId The ID of the split
     * @return creator The creator address
     * @return members Array of member addresses
     * @return createdAt Creation timestamp
     * @return totalDebt Total outstanding debt
     * @return defaultToken Default token address
     * @return spendingCounter Number of spendings
     */
    function getSplitDetails(uint256 splitId) 
        external 
        view 
        splitExists(splitId)
        returns (
            address creator,
            address[] memory members,
            uint256 createdAt,
            uint256 totalDebt,
            address defaultToken,
            uint256 spendingCounter
        )
    {
        Split storage split = splits[splitId];
        return (
            split.creator,
            split.members,
            split.createdAt,
            split.totalDebt,
            split.defaultToken,
            split.spendingCounter
        );
    }

    /**
     * @notice Get all spendings for a split
     * @param splitId The ID of the split
     * @return Array of spending records
     */
    function getSpendings(uint256 splitId) 
        external 
        view 
        splitExists(splitId)
        returns (Spending[] memory)
    {
        return splitSpendings[splitId];
    }

    /**
     * @notice Get debt between a debtor and creditor
     * @param splitId The ID of the split
     * @param debtor The debtor address
     * @param creditor The creditor address
     * @return Debt details
     */
    function getDebt(uint256 splitId, address debtor, address creditor)
        external
        view
        splitExists(splitId)
        returns (Debt memory)
    {
        return debts[splitId][debtor][creditor];
    }

    /**
     * @notice Get all debts for a specific debtor in a split
     * @param splitId The ID of the split
     * @param debtor The debtor address
     * @return creditors Array of creditors
     * @return amounts Array of debt amounts
     */
    function getDebtorDebts(uint256 splitId, address debtor)
        external
        view
        splitExists(splitId)
        returns (address[] memory creditors, uint256[] memory amounts)
    {
        address[] memory members = splits[splitId].members;
        uint256 debtCount = 0;
        
        for (uint256 i = 0; i < members.length; i++) {
            if (debts[splitId][debtor][members[i]].amount > 0) {
                debtCount++;
            }
        }
        
        creditors = new address[](debtCount);
        amounts = new uint256[](debtCount);
        
        uint256 index = 0;
        for (uint256 i = 0; i < members.length; i++) {
            Debt storage debt = debts[splitId][debtor][members[i]];
            if (debt.amount > 0) {
                creditors[index] = members[i];
                amounts[index] = debt.amount;
                index++;
            }
        }
    }

    /**
     * @notice Check if an address is a member of a split
     * @param splitId The ID of the split
     * @param account The address to check
     * @return bool True if the address is a member
     */
    function _isMember(uint256 splitId, address account) private view returns (bool) {
        address[] storage members = splits[splitId].members;
        for (uint256 i = 0; i < members.length; i++) {
            if (members[i] == account) {
                return true;
            }
        }
        return false;
    }
}


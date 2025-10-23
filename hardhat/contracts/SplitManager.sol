// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

/**
 * @title SplitManager
 * @notice Manages expense splitting groups with debt tracking and settlement
 * @dev Supports ETH and USDC tokens for expense tracking and debt payment
 * @dev Upgradeable contract using UUPS proxy pattern
 */
contract SplitManager is Initializable, UUPSUpgradeable, OwnableUpgradeable {
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

    uint256 public splitIdCounter;
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

        event SpendingRemoved(
        uint256 indexed splitId,
        uint256 indexed spendingId,
        address indexed removedBy
    );
    
    event DebtPaid(
        uint256 indexed splitId,
        address indexed debtor,
        address indexed creditor,
        uint256 amount,
        address token
    ); 

    event MemberAddedToSpending(
        uint256 indexed splitId,
        uint256 indexed spendingId,
        address indexed member,
        address addedBy
    );

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @notice Initialize the contract (replaces constructor for upgradeable contracts)
     * @param _owner The initial owner of the contract
     */
    function initialize(address _owner) public initializer {
        __Ownable_init(_owner);
        __UUPSUpgradeable_init();
    }

    /**
     * @dev Required by UUPSUpgradeable - authorize upgrade to new implementation
     * @param newImplementation Address of the new implementation contract
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    modifier onlyCreator(uint256 splitId) {
        require(splits[splitId].creator == msg.sender, "Not the split creator");
        _;
    }

    modifier splitExists(uint256 splitId) {
        require(splits[splitId].creator != address(0), "Split does not exist");
        _;
    }

    /**
     * @notice Create a new split
     * @param initialMembers Array of initial member addresses (creator is automatically included)
     * @param defaultToken Default token for the split (address(0) for ETH)
     * @return splitId The ID of the newly created split
     */
    function createSplit(
        address[] memory initialMembers,
        address defaultToken
    ) external returns (uint256 splitId) {
        splitId = splitIdCounter++;
        
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
     * @dev Redistributes any outstanding debts among remaining members
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
            Debt storage debtToMember = debts[splitId][members[i]][member];
            if (debtToMember.amount > 0 && !debtToMember.isPaid) {
                splits[splitId].totalDebt -= debtToMember.amount;
                debtToMember.amount = 0;
                debtToMember.isPaid = true;
            }
        }

        uint256 memberIndex;
        
        for (uint256 i = 0; i < members.length; i++) {
            address creditor = members[i];
            if (creditor == member) {
                memberIndex = i;
                continue;
            }
            
            Debt storage debtFromMember = debts[splitId][member][creditor];
            if (debtFromMember.amount > 0 && !debtFromMember.isPaid) {
                _redistributeDebt(splitId, member, creditor, debtFromMember.amount);
                splits[splitId].totalDebt -= debtFromMember.amount;
                debtFromMember.amount = 0;
                debtFromMember.isPaid = true;
            }
        }

        members[memberIndex] = members[members.length - 1];
        members.pop();
        emit MemberRemoved(splitId, member);
    }
    
    /**
     * @dev Internal function to redistribute a removed member's debt
     * @param splitId The ID of the split
     * @param removedMember The member being removed
     * @param creditor The creditor to whom debt is owed
     * @param debtAmount The amount of debt to redistribute
     */
    function _redistributeDebt(
        uint256 splitId,
        address removedMember,
        address creditor,
        uint256 debtAmount
    ) private {
        address[] storage members = splits[splitId].members;
        
        uint256 eligibleCount = 0;
        for (uint256 i = 0; i < members.length; i++) {
            if (members[i] != removedMember && members[i] != creditor) {
                eligibleCount++;
            }
        }
        
        if (eligibleCount == 0) return;
        
        uint256 sharePerMember = debtAmount / eligibleCount;
        if (sharePerMember == 0) return;
        
        for (uint256 i = 0; i < members.length; i++) {
            address eligibleMember = members[i];
            if (eligibleMember == removedMember || eligibleMember == creditor) continue;
            
            Debt storage debt = debts[splitId][eligibleMember][creditor];
            
            if (debt.debtor == address(0)) {
                debt.debtor = eligibleMember;
                debt.creditor = creditor;
                debt.token = splits[splitId].defaultToken;
                debt.amount = sharePerMember;
                debt.isPaid = false;
            } else {
                debt.amount += sharePerMember;
            }
            
            splits[splitId].totalDebt += sharePerMember;
        }
    }

    /**
     * @notice Add an expense to the split
     * @param splitId The ID of the split
     * @param title Title of the expense
     * @param amount Total amount of the expense
     * @param forWho Array of member addresses who participated (empty = all members)
     */
    function addSpending(
        uint256 splitId,
        string memory title,
        uint256 amount,
        address[] memory forWho
    ) external splitExists(splitId) returns (uint256 spendingId) {
        require(_isMember(splitId, msg.sender), "Not a member of this split");
        require(amount > 0, "Amount must be greater than 0");
        
        Split storage split = splits[splitId];
        address token = split.defaultToken;
        
        address[] memory members = forWho.length == 0 ? split.members : forWho;
        
        for (uint256 i = 0; i < members.length; i++) {
            require(_isMember(splitId, members[i]), "Member not a member");
        }
        
        spendingId = split.spendingCounter;
        Spending memory newSpending = Spending({
            id: split.spendingCounter,
            title: title,
            payer: msg.sender,
            amount: amount,
            forWho: members,
            timestamp: block.timestamp,
            token: token
        });
        
        splitSpendings[splitId].push(newSpending);
        split.spendingCounter++;
        
        uint256 sharePerPerson = amount / members.length;
        
        for (uint256 i = 0; i < members.length; i++) {
            address member = members[i];
            
            if (member == msg.sender) continue;
            
            Debt storage debt = debts[splitId][member][msg.sender];
            
            if (debt.debtor == address(0)) {
                debt.debtor = member;
                debt.creditor = msg.sender;
                debt.token = token;
                debt.amount = sharePerPerson;
                debt.isPaid = false;
            } else {
                debt.amount += sharePerPerson;
            }
            
            split.totalDebt += sharePerPerson;
        }
        
        emit SpendingAdded(splitId, newSpending.id, title, msg.sender, amount, members, token);

        return spendingId;
    }

    /**
     * @notice Pay off a debt to a creditor
     * @param splitId The ID of the split
     * @param creditor The address of the creditor
     * @param payForMember The address of the member to pay for
     * @param amount The amount to pay
     */
    function payDebt(
        uint256 splitId,
        address creditor,
        address payForMember,
        uint256 amount
    ) external payable splitExists(splitId) {
        Debt storage debt = debts[splitId][payForMember][creditor];
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
        
        emit DebtPaid(splitId, payForMember, creditor, amount, token);
    }

    /**
     * @notice Remove a spending from a split
     * @dev Only the split creator or the spending creator can remove it
     * @dev This will reverse all debts created by this spending
     * @param splitId The ID of the split
     * @param spendingId The ID of the spending to remove
     */
    function removeSpending(
        uint256 splitId,
        uint256 spendingId
    ) external splitExists(splitId) {
        require(_isMember(splitId, msg.sender), "Not a member of this split");
        
        Spending[] storage spendings = splitSpendings[splitId];
        require(spendingId < spendings.length, "Invalid spending ID");
        
        Spending memory spending = spendings[spendingId];
        require(spending.id == spendingId, "Spending not found");
        
        require(
            splits[splitId].creator == msg.sender || spending.payer == msg.sender,
            "Not authorized to remove this spending"
        );
        
        _reverseSpendingDebts(splitId, spending);
        
        delete spendings[spendingId];
        
        emit SpendingRemoved(splitId, spendingId, msg.sender);
    }

    /**
     * @notice Add a member to an existing spending
     * @dev Only the split creator or the spending payer can add members
     * @dev This recalculates debt shares for all members
     * @param splitId The ID of the split
     * @param spendingId The ID of the spending
     * @param member The address of the member to add
     */
    function addMemberToSpending(
        uint256 splitId,
        uint256 spendingId,
        address member
    ) external splitExists(splitId) {
        require(_isMember(splitId, msg.sender), "Not a member of this split");
        require(_isMember(splitId, member), "Member not a member of split");

        Spending[] storage spendings = splitSpendings[splitId];
        require(spendingId < spendings.length, "Invalid spending ID");
        
        Spending storage spending = spendings[spendingId];
        require(spending.id == spendingId, "Spending not found");
        
        require(
            splits[splitId].creator == msg.sender || spending.payer == msg.sender,
            "Not authorized to modify this spending"
        );
        
        for (uint256 i = 0; i < spending.forWho.length; i++) {
            require(spending.forWho[i] != member, "Member already in spending");
        }
        
        _addMemberAndRecalculateDebts(splitId, spending, member);
        
        emit MemberAddedToSpending(splitId, spendingId, member, msg.sender);
    }
    
    /**
     * @dev Internal function to add member and recalculate debts
     * @param splitId The ID of the split
     * @param spending The spending to modify
     * @param member The member to add
     */
    function _addMemberAndRecalculateDebts(
        uint256 splitId,
        Spending storage spending,
        address member
    ) private {
        uint256 oldCount = spending.forWho.length;
        uint256 newCount = oldCount + 1;
        
        uint256 oldShare = spending.amount / oldCount;
        uint256 newShare = spending.amount / newCount;
        
        for (uint256 i = 0; i < oldCount; i++) {
            address addr = spending.forWho[i];
            
            if (addr == spending.payer) continue;
            
            Debt storage debt = debts[splitId][addr][spending.payer];
            
            if (debt.amount >= oldShare) {
                debt.amount = debt.amount - oldShare + newShare;
                splits[splitId].totalDebt = splits[splitId].totalDebt - oldShare + newShare;
            }
        }
        
        spending.forWho.push(member);
        
        if (member != spending.payer) {
            Debt storage newDebt = debts[splitId][member][spending.payer];
            
            if (newDebt.debtor == address(0)) {
                newDebt.debtor = member;
                newDebt.creditor = spending.payer;
                newDebt.token = spending.token;
                newDebt.amount = newShare;
                newDebt.isPaid = false;
            } else {
                newDebt.amount += newShare;
            }
            
            splits[splitId].totalDebt += newShare;
        }
    }
    
    /**
     * @dev Internal function to reverse debts from a spending
     * @param splitId The ID of the split
     * @param spending The spending to reverse
     */
    function _reverseSpendingDebts(
        uint256 splitId,
        Spending memory spending
    ) private {
        uint256 sharePerPerson = spending.amount / spending.forWho.length;
        
        for (uint256 i = 0; i < spending.forWho.length; i++) {
            address member = spending.forWho[i];
            
            if (member == spending.payer) continue;
            
            Debt storage debt = debts[splitId][member][spending.payer];
            
            if (debt.amount >= sharePerPerson) {
                debt.amount -= sharePerPerson;
                splits[splitId].totalDebt -= sharePerPerson;
                
                if (debt.amount == 0) {
                    debt.isPaid = true;
                }
            }
        }
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

    /**
     * @dev This empty reserved space is put in place to allow future versions to add new
     * variables without shifting down storage in the inheritance chain.
     * See https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps
     */
    uint256[50] private __gap;
}


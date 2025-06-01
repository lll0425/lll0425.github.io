// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

contract MyToken {
    uint256 public ticketPrice = 100;  // 樂透彩券價格
    uint256 public lastDrawTime;  // 上次抽獎的時間
    uint256 public LotteryMax = 4;  // 樂透號碼最大值
    uint256 public potBalance;  // 獎池餘額

    struct Bet2 {
        address bettor;  // 下注者的地址
        uint8[3] numbers;  // 下注的號碼
    }
    Bet2[] public bets;  // 所有下注
    uint8[3] private winningNumbers;  // 贏家號碼

    event BetPlaced(address indexed bettor, uint8[3] numbers);  // 下注事件
    event DrawResult(uint8[3] winningNumbers);  // 抽獎結果事件
    event Payout(address winner, uint256 amount);  // 派獎事件

    // 樂透下注
    function betLottery2(uint8 a, uint8 b, uint8 c) public payable {
        require(a >= 1 && a <= LotteryMax && b >= 1 && b <= LotteryMax && c >= 1 && c <= LotteryMax, "Numbers must be between 1 and LotteryMax");
        require(a != b && a != c && b != c, "Numbers must be unique");

        uint256 fee = ticketPrice * 10 / 100; // 10 tokens as fee
        uint256 contribution = ticketPrice - fee; // 90 tokens to pot
        potBalance += contribution;
        
        bets.push(Bet2(msg.sender, [a, b, c]));
        emit BetPlaced(msg.sender, [a, b, c]);
    }

    // 抽獎2
    function draw2() public {
        require(block.timestamp >= lastDrawTime + 2 minutes, "Cannot draw yet, wait for cooldown");
        require(bets.length > 0, "No tickets sold");
        
        // Draw 3 unique numbers
        uint8[3] memory drawNumbers;
        drawNumbers[0] = randomNumber();
        
        do {
            drawNumbers[1] = randomNumber();
        } while (drawNumbers[1] == drawNumbers[0]);
        
        do {
            drawNumbers[2] = randomNumber();
        } while (drawNumbers[2] == drawNumbers[0] || drawNumbers[2] == drawNumbers[1]);

        // Store the winning numbers
        winningNumbers = drawNumbers;
        emit DrawResult(winningNumbers);

        address[] memory winners = new address[](bets.length);
        uint countWinners = 0;

        // Determine winners
        for (uint i = 0; i < bets.length; i++) {
            if (isWinner(bets[i].numbers, winningNumbers)) {
                winners[countWinners] = bets[i].bettor;
                countWinners++;
            }
        }

        // Payout winners or roll over the pot
        if (countWinners > 0) {
            uint256 winnerShare = potBalance / countWinners;
            for (uint i = 0; i < countWinners; i++) {
                payable(winners[i]).transfer(winnerShare);
                emit Payout(winners[i], winnerShare);
            }
            potBalance = 0; // Reset pot after payout
        }

        lastDrawTime = block.timestamp;
        delete bets; // Reset bets
    }

    // 隨機號碼生成器
    function randomNumber() private view returns (uint8) {
        return uint8(uint256(keccak256(abi.encodePacked(block.timestamp, block.prevrandao, msg.sender))) % 46 + 1);
    }

    // 檢查下注是否獲勝
    function isWinner(uint8[3] memory betNumbers, uint8[3] memory winNumbers) private pure returns (bool) {
        return (betNumbers[0] == winNumbers[0] && betNumbers[1] == winNumbers[1] && betNumbers[2] == winNumbers[2]);
    }
} 
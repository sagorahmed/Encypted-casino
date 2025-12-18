// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {FHE, euint32, euint64, ebool} from "@fhevm/solidity/lib/FHE.sol";

/// @title FHE Game Logic Library
/// @notice Provides encrypted game logic utilities for casino games
library FHEGameLogic {

    /// @notice Generate encrypted random number in range [1, max]
    /// @param max Maximum value (exclusive)
    /// @return Encrypted random number
    function generateRandomNumber(uint32 max) internal returns (euint32) {
        return FHE.add(
            FHE.and(FHE.randEuint32(), FHE.asEuint32(max - 1)),
            FHE.asEuint32(1)
        );
    }

    /// @notice Generate encrypted coin flip (0 or 1)
    /// @return Encrypted coin result (0 = Heads, 1 = Tails)
    function generateCoinFlip() internal returns (euint32) {
        return FHE.and(FHE.randEuint32(), FHE.asEuint32(1));
    }

    /// @notice Validate encrypted bet amount
    /// @param betAmount Amount to validate
    /// @param maxBet Maximum allowed bet
    /// @return Valid true if bet is valid, false otherwise
    function validateBetAmount(uint256 betAmount, uint256 maxBet) internal pure returns (bool) {
        return betAmount > 0 && betAmount <= maxBet;
    }

    /// @notice Calculate encrypted payout for win
    /// @param betAmount Original bet amount
    /// @param multiplier Payout multiplier
    /// @param won Whether player won
    /// @return Encrypted payout amount
    function calculatePayout(
        euint32 betAmount,
        uint8 multiplier,
        ebool won
    ) internal returns (euint32) {
        return FHE.select(
            won,
            FHE.mul(betAmount, FHE.asEuint32(multiplier)),
            FHE.asEuint32(0)
        );
    }
}

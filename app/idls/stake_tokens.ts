/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/stake_tokens.json`.
 */
export type StakeTokens = {
  "address": "7a8fBQMwbtE1C61fcGUW6quAgdqdmzYojha5cQq9Ju4q",
  "metadata": {
    "name": "stakeTokens",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "This program is used to stake tokens"
  },
  "instructions": [
    {
      "name": "fundReward",
      "docs": [
        "Fund reward instruction",
        "This instruction is used to fund the reward pool",
        "",
        "# Arguments",
        "* `ctx` - context of the program",
        "* `amount` - amount to fund the reward pool"
      ],
      "discriminator": [
        188,
        50,
        249,
        165,
        93,
        151,
        38,
        63
      ],
      "accounts": [
        {
          "name": "stakingAccount",
          "writable": true
        },
        {
          "name": "stakingTokenAccount",
          "writable": true
        },
        {
          "name": "admin",
          "writable": true,
          "signer": true
        },
        {
          "name": "adminTokenAccount",
          "writable": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "initialize",
      "docs": [
        "Initialize instruction",
        "This instruction is used to create a new staking pool",
        "",
        "# Arguments",
        "* `ctx` - context of the program",
        "* `bump` - unique bump for rach pool",
        "* `token_mint` - program_id (address) of specific token which is allowed stake",
        "* `reward_rate` - APY return yearly in percentage (0-100)",
        "* `min_staking_duration` - minimum staking duration in seconds"
      ],
      "discriminator": [
        175,
        175,
        109,
        31,
        13,
        152,
        155,
        237
      ],
      "accounts": [
        {
          "name": "stakingAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "admin"
              },
              {
                "kind": "const",
                "value": [
                  115,
                  116,
                  97,
                  107,
                  105,
                  110,
                  103,
                  95,
                  97,
                  99,
                  99,
                  111,
                  117,
                  110,
                  116
                ]
              }
            ]
          }
        },
        {
          "name": "admin",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "bump",
          "type": "u8"
        },
        {
          "name": "tokenMint",
          "type": "pubkey"
        },
        {
          "name": "rewardRate",
          "type": "u8"
        },
        {
          "name": "minStakingDuration",
          "type": "i64"
        }
      ]
    },
    {
      "name": "redeem",
      "docs": [
        "Redeem instruction",
        "This instruction is used to redeem staked tokens",
        "",
        "# Arguments",
        "* `ctx` - context of the program",
        "* `force_redeem` - force redeeming"
      ],
      "discriminator": [
        184,
        12,
        86,
        149,
        70,
        196,
        97,
        225
      ],
      "accounts": [
        {
          "name": "stakingAccount",
          "writable": true
        },
        {
          "name": "stakingTokenAccountOwner",
          "writable": true,
          "signer": true
        },
        {
          "name": "userStake",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "user"
              },
              {
                "kind": "const",
                "value": [
                  117,
                  115,
                  101,
                  114,
                  95,
                  115,
                  116,
                  97,
                  107,
                  101
                ]
              }
            ]
          }
        },
        {
          "name": "user",
          "writable": true,
          "signer": true
        },
        {
          "name": "userTokenAccount",
          "writable": true
        },
        {
          "name": "stakingTokenAccount",
          "writable": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": [
        {
          "name": "forceRedeem",
          "type": "bool"
        }
      ]
    },
    {
      "name": "stake",
      "docs": [
        "Stake instruction",
        "This instruction is used to stake tokens",
        "",
        "# Arguments",
        "* `ctx` - context of the program",
        "* `amount` - amount to stake",
        "* `timestamp` - custom timestamp for testing"
      ],
      "discriminator": [
        206,
        176,
        202,
        18,
        200,
        209,
        179,
        108
      ],
      "accounts": [
        {
          "name": "stakingAccount",
          "writable": true
        },
        {
          "name": "userStake",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "user"
              },
              {
                "kind": "const",
                "value": [
                  117,
                  115,
                  101,
                  114,
                  95,
                  115,
                  116,
                  97,
                  107,
                  101
                ]
              }
            ]
          }
        },
        {
          "name": "user",
          "writable": true,
          "signer": true
        },
        {
          "name": "userTokenAccount",
          "writable": true
        },
        {
          "name": "stakingTokenAccount",
          "writable": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        },
        {
          "name": "timestamp",
          "type": {
            "option": "i64"
          }
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "stakingAccount",
      "discriminator": [
        52,
        178,
        251,
        157,
        180,
        186,
        98,
        234
      ]
    },
    {
      "name": "userStake",
      "discriminator": [
        102,
        53,
        163,
        107,
        9,
        138,
        87,
        153
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "alreadyStaked",
      "msg": "User has already staked."
    },
    {
      "code": 6001,
      "name": "nothingStaked",
      "msg": "User has nothing staked."
    },
    {
      "code": 6002,
      "name": "invalidArgument",
      "msg": "Invalid argument."
    },
    {
      "code": 6003,
      "name": "insufficientRewardFunds",
      "msg": "Insufficient funds, please wait until the reward pool is funded, or force redeem."
    },
    {
      "code": 6004,
      "name": "adminOnly",
      "msg": "Only admin can fund the reward pool."
    },
    {
      "code": 6005,
      "name": "stakingDurationNotMet",
      "msg": "Staking duration not met."
    },
    {
      "code": 6006,
      "name": "calculationError",
      "msg": "Calculation error."
    },
    {
      "code": 6007,
      "name": "zeroValueError",
      "msg": "Provided parameters includes 0 which are not allowed"
    }
  ],
  "types": [
    {
      "name": "stakingAccount",
      "docs": [
        "Staking account struct",
        "This struct is used to define the state of the staking pool",
        "",
        "# Fields",
        "* `admin` - admin account (signer)",
        "* `reward_rate` - annual percentage yield (APY) in percentage (0-100)",
        "* `bump` - bump for the PDA (multiple PDAs can be created with the same seeds)",
        "* `token_mint` - program_id (address) of specific token which is allowed stake",
        "* `admin_reward_amount` - admin reward amount",
        "* `min_staking_duration` - minimum staking duration in seconds"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "admin",
            "type": "pubkey"
          },
          {
            "name": "rewardRate",
            "type": "u8"
          },
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "tokenMint",
            "type": "pubkey"
          },
          {
            "name": "adminRewardAmount",
            "type": "u64"
          },
          {
            "name": "minStakingDuration",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "userStake",
      "docs": [
        "User stake account struct",
        "This struct is used to define the state of the user stake account",
        "",
        "# Fields",
        "* `amount` - Amount of tokens staked",
        "* `start_time` - Start time of staking in milliseconds"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "startTime",
            "type": "i64"
          }
        ]
      }
    }
  ]
};

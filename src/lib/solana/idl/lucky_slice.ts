/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/lucky_slice_program.json`.
 */
export type LuckySliceProgram = {
  "address": "A666hnXcDdB9y8Vz2anJTLQg8R7tivBLEXTC4PBQaFoV",
  "metadata": {
    "name": "luckySliceProgram",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "startRound",
      "discriminator": [
        144,
        144,
        43,
        7,
        193,
        42,
        217,
        215
      ],
      "accounts": [
        {
          "name": "player",
          "writable": true,
          "signer": true
        },
        {
          "name": "stats",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  108,
                  105,
                  99,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "player"
              }
            ]
          }
        },
        {
          "name": "round",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  111,
                  117,
                  110,
                  100
                ]
              },
              {
                "kind": "account",
                "path": "player"
              }
            ]
          }
        },
        {
          "name": "slotHashes",
          "docs": [
            "bytes, because the sysvar is far too large to deserialize on-chain."
          ],
          "address": "SysvarS1otHashes111111111111111111111111111"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "submitCut",
      "discriminator": [
        50,
        57,
        156,
        53,
        209,
        150,
        254,
        38
      ],
      "accounts": [
        {
          "name": "player",
          "writable": true,
          "signer": true
        },
        {
          "name": "round",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  111,
                  117,
                  110,
                  100
                ]
              },
              {
                "kind": "account",
                "path": "player"
              }
            ]
          }
        },
        {
          "name": "stats",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  108,
                  105,
                  99,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "player"
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "actualBps",
          "type": "u32"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "round",
      "discriminator": [
        87,
        127,
        165,
        51,
        73,
        78,
        116,
        174
      ]
    },
    {
      "name": "sliceStats",
      "discriminator": [
        16,
        105,
        105,
        144,
        222,
        51,
        6,
        221
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "slotHashUnavailable",
      "msg": "The SlotHashes sysvar has no entries yet."
    },
    {
      "code": 6001,
      "name": "cutOutOfRange",
      "msg": "Cut size must be between 0 and 10000 basis points."
    },
    {
      "code": 6002,
      "name": "submittedTooSoon",
      "msg": "Submitted too soon after starting the round."
    }
  ],
  "types": [
    {
      "name": "round",
      "docs": [
        "An in-progress round. Created by start_round (which also rolls the",
        "target), closed by submit_cut, so a player can only have one open round",
        "at a time."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "player",
            "type": "pubkey"
          },
          {
            "name": "targetBps",
            "type": "u32"
          },
          {
            "name": "startSlot",
            "type": "u64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "sliceStats",
      "docs": [
        "One per player, created on their first round and reused for every one",
        "after. `best_accuracy_bps` is the leaderboard stat: 10_000 means a",
        "perfect cut, 0 means as far from the target as possible. `attempts`",
        "doubles as the target's randomness nonce."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "player",
            "type": "pubkey"
          },
          {
            "name": "bestAccuracyBps",
            "type": "u32"
          },
          {
            "name": "attempts",
            "type": "u64"
          },
          {
            "name": "lastSlot",
            "type": "u64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    }
  ],
  "constants": [
    {
      "name": "bpsDenominator",
      "docs": [
        "Cut size and accuracy are tracked in basis points (0–10_000, i.e.",
        "0%–100%) rather than a percentage, so the on-chain math never needs to",
        "round a fraction."
      ],
      "type": "u32",
      "value": "10000"
    },
    {
      "name": "minRoundSlots",
      "docs": [
        "The knife's timing is client-side gameplay the chain can't watch, the",
        "same way Cookie Crush's board is — so, like Cookie Crush, this is a",
        "loose plausibility floor, not real anti-cheat: submitting in the same",
        "slot the round started would mean no actual tap happened in between."
      ],
      "type": "u64",
      "value": "1"
    },
    {
      "name": "roundSeed",
      "type": "bytes",
      "value": "[114, 111, 117, 110, 100]"
    },
    {
      "name": "statsSeed",
      "type": "bytes",
      "value": "[115, 108, 105, 99, 101]"
    }
  ]
};

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
      "name": "slice",
      "discriminator": [
        236,
        98,
        7,
        45,
        223,
        178,
        212,
        213
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
    }
  ],
  "accounts": [
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
    }
  ],
  "types": [
    {
      "name": "sliceStats",
      "docs": [
        "One per player, created on their first slice and reused for every one",
        "after. `best_cut_bps` is the leaderboard stat; `attempts` doubles as the",
        "randomness nonce, so two slices in the same slot never hash to the same",
        "input."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "player",
            "type": "pubkey"
          },
          {
            "name": "bestCutBps",
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
        "Cut size is tracked in basis points (0–10_000, i.e. 0%–100%) rather than",
        "a percentage, so the on-chain math never needs to round a fraction."
      ],
      "type": "u32",
      "value": "10000"
    },
    {
      "name": "statsSeed",
      "type": "bytes",
      "value": "[115, 108, 105, 99, 101]"
    }
  ]
};

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
      "docs": [
        "`wager` escrows $CRUMB against the round; see WAGER_ACCURACY_BPS for",
        "the bar the cut has to clear to get it back."
      ],
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
        },
        {
          "name": "jar",
          "optional": true
        },
        {
          "name": "crumbMint",
          "optional": true
        },
        {
          "name": "jarCrumbs",
          "writable": true,
          "optional": true
        },
        {
          "name": "wagerEscrow",
          "docs": [
            "Held by the round itself, so only this program can settle it, and only",
            "once the cut is in."
          ],
          "writable": true,
          "optional": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "round"
              },
              {
                "kind": "const",
                "value": [
                  6,
                  221,
                  246,
                  225,
                  215,
                  101,
                  161,
                  147,
                  217,
                  203,
                  225,
                  70,
                  206,
                  235,
                  121,
                  172,
                  28,
                  180,
                  133,
                  237,
                  95,
                  91,
                  55,
                  145,
                  58,
                  140,
                  245,
                  133,
                  126,
                  255,
                  0,
                  169
                ]
              },
              {
                "kind": "account",
                "path": "crumbMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "crumbJarProgram",
          "optional": true,
          "address": "85eL8gcexHuQmX8BvpMYxVPobmrcFRW62XBGGVuhKaLr"
        },
        {
          "name": "tokenProgram",
          "optional": true,
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "associatedTokenProgram",
          "optional": true,
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        }
      ],
      "args": [
        {
          "name": "wager",
          "type": "bool"
        }
      ]
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
        },
        {
          "name": "crumbMint",
          "docs": [
            "Mutable because losing the stake burns it, which lowers supply."
          ],
          "writable": true,
          "optional": true
        },
        {
          "name": "jarCrumbs",
          "writable": true,
          "optional": true
        },
        {
          "name": "wagerEscrow",
          "writable": true,
          "optional": true
        },
        {
          "name": "tokenProgram",
          "optional": true,
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
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
    },
    {
      "code": 6003,
      "name": "wagerAccountsMissing",
      "msg": "Staking a round needs your Cookie Jar and its $CRUMB accounts."
    }
  ],
  "types": [
    {
      "name": "cookieJar",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "owner",
            "type": "pubkey"
          },
          {
            "name": "crumbBalance",
            "docs": [
              "Legacy balance from before $CRUMB became a real SPL token. Only ever",
              "written to pre-migration; frozen (and zeroed once spent) afterward.",
              "Cannot be removed or reordered -- every already-minted jar on-chain",
              "has this exact byte layout baked in, and Borsh deserializes",
              "positionally, so doing either would corrupt every existing account."
            ],
            "type": "u64"
          },
          {
            "name": "productionRate",
            "type": "u64"
          },
          {
            "name": "lastClaimedTs",
            "type": "i64"
          },
          {
            "name": "lastRaidTs",
            "type": "i64"
          },
          {
            "name": "defenseLevel",
            "type": "u8"
          },
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "migrated",
            "docs": [
              "Appended field, not inserted -- new fields must only ever go at the",
              "end for the same reason `crumb_balance` can't move. False on every",
              "jar that existed before this field did (realloc zero-initializes new",
              "space), true immediately for jars minted after, since they start",
              "with nothing to migrate."
            ],
            "type": "bool"
          }
        ]
      }
    },
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
          },
          {
            "name": "wagered",
            "docs": [
              "Whether crumbs are escrowed against this round. submit_cut has to know",
              "without being told, so a player can't quietly settle a staked round as",
              "if it were a free one."
            ],
            "type": "bool"
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
    },
    {
      "name": "wagerAccuracyBps",
      "docs": [
        "The accuracy a staked round has to reach to get the stake back. Well",
        "above what a careless tap lands, but comfortably reachable with a",
        "deliberate one, so the stake rewards precision rather than luck."
      ],
      "type": "u32",
      "value": "8500"
    },
    {
      "name": "wagerStakeCrumbs",
      "docs": [
        "What a staked round puts at risk. Smaller than Cookie Crush's boost,",
        "because a round is over in seconds and a player will take many of them."
      ],
      "type": "u64",
      "value": "150"
    }
  ]
};

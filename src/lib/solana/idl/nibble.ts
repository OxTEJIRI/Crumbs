/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/nibble_program.json`.
 */
export type NibbleProgram = {
  "address": "96A38RPbCfpcv8o5ZCbTSq8Q1kT6DBujHygJMiWLDbWj",
  "metadata": {
    "name": "nibbleProgram",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "bake",
      "discriminator": [
        176,
        125,
        232,
        117,
        208,
        89,
        202,
        19
      ],
      "accounts": [
        {
          "name": "baker",
          "writable": true,
          "signer": true
        },
        {
          "name": "cookie",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  111,
                  118,
                  101,
                  110
                ]
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "bakeAmount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "crankHeat",
      "discriminator": [
        134,
        168,
        155,
        100,
        157,
        249,
        190,
        216
      ],
      "accounts": [
        {
          "name": "cranker",
          "signer": true
        },
        {
          "name": "cookie",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  111,
                  118,
                  101,
                  110
                ]
              }
            ]
          }
        },
        {
          "name": "jar",
          "docs": [
            "pushes heat to the cap."
          ],
          "writable": true,
          "address": "7261MGftUdiVdfb4dJpPkL2bize2aRcw3ehpSm9No4Uj"
        }
      ],
      "args": []
    },
    {
      "name": "glaze",
      "discriminator": [
        136,
        188,
        8,
        163,
        8,
        92,
        148,
        141
      ],
      "accounts": [
        {
          "name": "baker",
          "writable": true,
          "signer": true
        },
        {
          "name": "cookie",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  111,
                  118,
                  101,
                  110
                ]
              }
            ]
          }
        },
        {
          "name": "jar",
          "docs": [
            "idle check turns up a burn."
          ],
          "writable": true,
          "address": "7261MGftUdiVdfb4dJpPkL2bize2aRcw3ehpSm9No4Uj"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "maxCost",
          "type": "u64"
        }
      ]
    },
    {
      "name": "nibble",
      "discriminator": [
        154,
        250,
        55,
        219,
        0,
        148,
        47,
        93
      ],
      "accounts": [
        {
          "name": "nibbler",
          "writable": true,
          "signer": true
        },
        {
          "name": "cookie",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  111,
                  118,
                  101,
                  110
                ]
              }
            ]
          }
        },
        {
          "name": "jar",
          "docs": [
            "credited, never read or deserialized."
          ],
          "writable": true,
          "address": "7261MGftUdiVdfb4dJpPkL2bize2aRcw3ehpSm9No4Uj"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "bid",
          "type": "u64"
        }
      ]
    },
    {
      "name": "pull",
      "discriminator": [
        78,
        119,
        161,
        115,
        9,
        167,
        75,
        125
      ],
      "accounts": [
        {
          "name": "baker",
          "writable": true,
          "signer": true
        },
        {
          "name": "cookie",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  111,
                  118,
                  101,
                  110
                ]
              }
            ]
          }
        },
        {
          "name": "jar",
          "docs": [
            "whole pot if this call's idle check finds it already overdue to burn."
          ],
          "writable": true,
          "address": "7261MGftUdiVdfb4dJpPkL2bize2aRcw3ehpSm9No4Uj"
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "cookie",
      "discriminator": [
        156,
        103,
        85,
        170,
        18,
        27,
        127,
        44
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "cookieAlreadyLive",
      "msg": "A cookie is already live — bake again once it's eaten, burned, or pulled"
    },
    {
      "code": 6001,
      "name": "cookieNotLive",
      "msg": "There's no live cookie to act on right now"
    },
    {
      "code": 6002,
      "name": "bakeTooSmall",
      "msg": "Bake amount is below the minimum"
    },
    {
      "code": 6003,
      "name": "bidTooSmall",
      "msg": "Bid is below the minimum nibble"
    },
    {
      "code": 6004,
      "name": "bakerLocked",
      "msg": "The baker can't nibble their own cookie yet"
    },
    {
      "code": 6005,
      "name": "notTheBaker",
      "msg": "Only the baker can do that"
    },
    {
      "code": 6006,
      "name": "notIdleYet",
      "msg": "The cookie hasn't been idle long enough to crank"
    },
    {
      "code": 6007,
      "name": "glazeCostExceeded",
      "msg": "Glaze would cost more than your specified maximum"
    }
  ],
  "types": [
    {
      "name": "cookie",
      "docs": [
        "A singleton, recycled across every batch — the whole game is this one",
        "account. `bake` resets it; `nibble`/`glaze`/`pull`/`crank_heat` mutate it",
        "while it's Live."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "baker",
            "type": "pubkey"
          },
          {
            "name": "batchId",
            "type": "u64"
          },
          {
            "name": "hp",
            "type": "u32"
          },
          {
            "name": "heat",
            "type": "u32"
          },
          {
            "name": "createdSlot",
            "type": "u64"
          },
          {
            "name": "lastActionSlot",
            "type": "u64"
          },
          {
            "name": "nibbleCount",
            "type": "u32"
          },
          {
            "name": "lastNibbler",
            "type": "pubkey"
          },
          {
            "name": "state",
            "type": {
              "defined": {
                "name": "cookieState"
              }
            }
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "cookieState",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "empty"
          },
          {
            "name": "live"
          },
          {
            "name": "eaten"
          },
          {
            "name": "burned"
          },
          {
            "name": "pulled"
          }
        ]
      }
    }
  ],
  "constants": [
    {
      "name": "bakerLockSlots",
      "docs": [
        "Baker cannot nibble their own cookie until this many slots after bake —",
        "stops bake-and-self-eat in the same breath. Self-nibbling afterward is",
        "harmless: PAYOUT_BPS < 10_000 means every bite is net-negative for",
        "whoever pays for it, self included, so there's nothing to exploit."
      ],
      "type": "u64",
      "value": "8"
    },
    {
      "name": "bpsDenominator",
      "docs": [
        "Denominator for every basis-point percentage below (payout share, jar",
        "share, damage range). Numerically the same as MAX_HP/MAX_HEAT, but kept",
        "as its own name since it means something different: \"out of 100%,\" not",
        "\"out of a full cookie.\""
      ],
      "type": "u32",
      "value": "10000"
    },
    {
      "name": "damageK",
      "type": "u64",
      "value": "5000"
    },
    {
      "name": "damageMaxBps",
      "type": "u32",
      "value": "3000"
    },
    {
      "name": "damageMinBps",
      "docs": [
        "Damage curve: damage = D_MIN + (D_MAX - D_MIN) * bid / (bid + K * hp).",
        "Small bids chip; huge bids do more but with diminishing returns, so no",
        "single transaction can one-shot a healthy cookie. K is tuned so a",
        "~0.05 COOK bid against a full-health cookie lands near the curve's",
        "midpoint — see `damage_bps` for the exact arithmetic."
      ],
      "type": "u32",
      "value": "300"
    },
    {
      "name": "glazeBaseCostLamports",
      "type": "u64",
      "value": "5000000"
    },
    {
      "name": "glazeHeatDivisor",
      "type": "u64",
      "value": "20"
    },
    {
      "name": "glazeHeatReduction",
      "docs": [
        "Glaze always removes this much heat and restores this much HP, for a",
        "cost that grows with heat squared — cheap early, a panic spend late."
      ],
      "type": "u32",
      "value": "2000"
    },
    {
      "name": "glazeHpRestore",
      "type": "u32",
      "value": "500"
    },
    {
      "name": "heatBase",
      "docs": [
        "Heat added per nibble: a flat cost plus a share proportional to the",
        "damage just dealt, so aggressive bites heat the oven faster than gentle",
        "ones."
      ],
      "type": "u32",
      "value": "100"
    },
    {
      "name": "heatScale",
      "type": "u32",
      "value": "2000"
    },
    {
      "name": "idleHeat",
      "docs": [
        "Flat heat added per idle window left unattended."
      ],
      "type": "u32",
      "value": "2500"
    },
    {
      "name": "idleSlots",
      "docs": [
        "How long the cookie can sit untouched before it starts cooking on its own."
      ],
      "type": "u64",
      "value": "15"
    },
    {
      "name": "jarAddress",
      "docs": [
        "TODO(before mainnet deploy): replace with Cookie Chain's actual",
        "community treasury address. This is our own deploy wallet, a safe",
        "placeholder for local testing only — burns and fee cuts must not go",
        "anywhere real until the genuine address is confirmed."
      ],
      "type": "pubkey",
      "value": "7261MGftUdiVdfb4dJpPkL2bize2aRcw3ehpSm9No4Uj"
    },
    {
      "name": "jarShareBps",
      "docs": [
        "Protocol cut on every ending (eaten or pulled) and on the full pot when a",
        "cookie burns from neglect."
      ],
      "type": "u32",
      "value": "200"
    },
    {
      "name": "maxHeat",
      "type": "u32",
      "value": "10000"
    },
    {
      "name": "maxHp",
      "docs": [
        "HP and heat are tracked in basis points (0–10_000) rather than a",
        "percentage, so integer math never needs to round a fraction."
      ],
      "type": "u32",
      "value": "10000"
    },
    {
      "name": "minBakeLamports",
      "type": "u64",
      "value": "50000000"
    },
    {
      "name": "minNibbleLamports",
      "type": "u64",
      "value": "1000000"
    },
    {
      "name": "ovenSeed",
      "type": "bytes",
      "value": "[111, 118, 101, 110]"
    },
    {
      "name": "payoutShareBps",
      "docs": [
        "Share of the (post-bid) pot paid to the nibbler, proportional to the",
        "damage fraction they just dealt. The rest stays in the pot for the next",
        "bite, the eventual winner, or the jar. Below 10_000 so nibbling — even",
        "nibbling your own cookie after the lock — is never a free lunch."
      ],
      "type": "u32",
      "value": "6000"
    }
  ]
};

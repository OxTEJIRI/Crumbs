/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/crumb_jar.json`.
 */
export type CrumbJar = {
  "address": "85eL8gcexHuQmX8BvpMYxVPobmrcFRW62XBGGVuhKaLr",
  "metadata": {
    "name": "crumbJar",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "claimCrumbs",
      "discriminator": [
        143,
        41,
        17,
        208,
        255,
        57,
        174,
        122
      ],
      "accounts": [
        {
          "name": "owner",
          "signer": true
        },
        {
          "name": "jar",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  111,
                  107,
                  105,
                  101,
                  95,
                  106,
                  97,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "owner"
              }
            ]
          }
        }
      ],
      "args": []
    },
    {
      "name": "commitRaid",
      "discriminator": [
        89,
        24,
        15,
        248,
        223,
        62,
        42,
        1
      ],
      "accounts": [
        {
          "name": "attacker",
          "writable": true,
          "signer": true
        },
        {
          "name": "attackerJar",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  111,
                  107,
                  105,
                  101,
                  95,
                  106,
                  97,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "attacker"
              }
            ]
          }
        },
        {
          "name": "targetJar",
          "docs": [
            "Loaded so a raid cannot be committed against a jar that does not exist."
          ],
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  111,
                  107,
                  105,
                  101,
                  95,
                  106,
                  97,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "targetJar.owner",
                "account": "cookieJar"
              }
            ]
          }
        },
        {
          "name": "raid",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  97,
                  105,
                  100
                ]
              },
              {
                "kind": "account",
                "path": "attacker"
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
          "name": "commitment",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        }
      ]
    },
    {
      "name": "initializeJar",
      "discriminator": [
        228,
        77,
        238,
        85,
        8,
        38,
        159,
        21
      ],
      "accounts": [
        {
          "name": "owner",
          "writable": true,
          "signer": true
        },
        {
          "name": "jar",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  111,
                  107,
                  105,
                  101,
                  95,
                  106,
                  97,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "owner"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "revealRaid",
      "discriminator": [
        128,
        249,
        76,
        49,
        112,
        1,
        166,
        171
      ],
      "accounts": [
        {
          "name": "attacker",
          "writable": true,
          "signer": true
        },
        {
          "name": "attackerJar",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  111,
                  107,
                  105,
                  101,
                  95,
                  106,
                  97,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "attacker"
              }
            ]
          }
        },
        {
          "name": "targetJar",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  111,
                  107,
                  105,
                  101,
                  95,
                  106,
                  97,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "targetJar.owner",
                "account": "cookieJar"
              }
            ]
          }
        },
        {
          "name": "raid",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  97,
                  105,
                  100
                ]
              },
              {
                "kind": "account",
                "path": "attacker"
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
        }
      ],
      "args": [
        {
          "name": "secret",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "cookieJar",
      "discriminator": [
        142,
        10,
        6,
        22,
        233,
        55,
        199,
        204
      ]
    },
    {
      "name": "raid",
      "discriminator": [
        247,
        50,
        237,
        152,
        225,
        69,
        138,
        211
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "selfRaid",
      "msg": "You cannot raid your own jar"
    },
    {
      "code": 6001,
      "name": "raidOnCooldown",
      "msg": "Your raid is still on cooldown"
    },
    {
      "code": 6002,
      "name": "insufficientCrumbs",
      "msg": "Not enough crumbs to stake this raid"
    },
    {
      "code": 6003,
      "name": "wrongTarget",
      "msg": "This target does not match the jar you committed to raid"
    },
    {
      "code": 6004,
      "name": "invalidReveal",
      "msg": "The revealed secret does not match your commitment"
    },
    {
      "code": 6005,
      "name": "revealTooSoon",
      "msg": "Reveal must land in a later slot than the commit"
    },
    {
      "code": 6006,
      "name": "slotHashUnavailable",
      "msg": "The slot hashes sysvar could not be read"
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
          }
        ]
      }
    },
    {
      "name": "raid",
      "docs": [
        "An in-flight raid. Created at commit, closed at reveal, and seeded on the",
        "attacker so a player can only have one raid open at a time."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "attacker",
            "type": "pubkey"
          },
          {
            "name": "target",
            "type": "pubkey"
          },
          {
            "name": "commitment",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "commitSlot",
            "type": "u64"
          },
          {
            "name": "staked",
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
      "name": "baseProductionRate",
      "docs": [
        "Tuned for a fast, replayable feel: a claim after even a short session",
        "banks a satisfying number instead of a trickle."
      ],
      "type": "u64",
      "value": "20"
    },
    {
      "name": "baseRaidSuccessPercent",
      "type": "u64",
      "value": "70"
    },
    {
      "name": "defenseReductionPerLevel",
      "type": "u64",
      "value": "5"
    },
    {
      "name": "jarSeed",
      "type": "bytes",
      "value": "[99, 111, 111, 107, 105, 101, 95, 106, 97, 114]"
    },
    {
      "name": "raidCooldownSeconds",
      "docs": [
        "Short enough that a player can raid again right away rather than being",
        "locked out for minutes — the whole point of a game you want to replay."
      ],
      "type": "i64",
      "value": "30"
    },
    {
      "name": "raidSeed",
      "type": "bytes",
      "value": "[114, 97, 105, 100]"
    },
    {
      "name": "raidStake",
      "docs": [
        "Staked by the attacker at commit time and forfeited on a loss. Taking it",
        "up front means walking away from an unfavourable reveal costs the same as",
        "losing, so there is no reason to abandon a raid. Scaled with",
        "BASE_PRODUCTION_RATE so it stays roughly \"a few seconds of accrual,\" not",
        "trivial and not crushing."
      ],
      "type": "u64",
      "value": "100"
    },
    {
      "name": "raidStealPercent",
      "type": "u64",
      "value": "20"
    },
    {
      "name": "slotHashesId",
      "docs": [
        "`SysvarS1otHashes111111111111111111111111111`"
      ],
      "type": "pubkey",
      "value": "SysvarS1otHashes111111111111111111111111111"
    }
  ]
};

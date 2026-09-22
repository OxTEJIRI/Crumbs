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
          "name": "crumbMint",
          "docs": [
            "Mutable because minting raises the mint's own supply figure."
          ],
          "writable": true,
          "address": "9Fj8joWNECtUdB74S2Y5odrUUj9pukuLak3ouQDjgCbS"
        },
        {
          "name": "mintAuthority",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  114,
                  117,
                  109,
                  98,
                  95,
                  109,
                  105,
                  110,
                  116,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ]
              }
            ]
          }
        },
        {
          "name": "jarCrumbs",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "jar"
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
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
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
          "name": "crumbMint",
          "address": "9Fj8joWNECtUdB74S2Y5odrUUj9pukuLak3ouQDjgCbS"
        },
        {
          "name": "attackerCrumbs",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "attackerJar"
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
          "name": "raidEscrow",
          "docs": [
            "The stake has to live somewhere real while the raid is pending, not",
            "just be subtracted from a number -- this is that somewhere.",
            "Authority is the raid PDA itself, so only this program can move it,",
            "and only once the raid resolves."
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "raid"
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
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
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
      "name": "escrowCrumbs",
      "docs": [
        "Callable over CPI by a game that puts crumbs at risk rather than",
        "spending them outright; that game settles the escrow itself."
      ],
      "discriminator": [
        136,
        6,
        53,
        241,
        92,
        180,
        43,
        104
      ],
      "accounts": [
        {
          "name": "owner",
          "signer": true
        },
        {
          "name": "jar",
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
          "name": "crumbMint",
          "address": "9Fj8joWNECtUdB74S2Y5odrUUj9pukuLak3ouQDjgCbS"
        },
        {
          "name": "jarCrumbs",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "jar"
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
          "name": "escrow",
          "writable": true
        },
        {
          "name": "escrowAuthority",
          "signer": true
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
      "name": "migrateToToken",
      "discriminator": [
        176,
        211,
        106,
        6,
        241,
        92,
        180,
        245
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
          "name": "crumbMint",
          "docs": [
            "Mutable because minting raises the mint's own supply figure."
          ],
          "writable": true,
          "address": "9Fj8joWNECtUdB74S2Y5odrUUj9pukuLak3ouQDjgCbS"
        },
        {
          "name": "mintAuthority",
          "docs": [
            "constraint is what actually verifies this is the right PDA."
          ],
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  114,
                  117,
                  109,
                  98,
                  95,
                  109,
                  105,
                  110,
                  116,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ]
              }
            ]
          }
        },
        {
          "name": "jarCrumbs",
          "docs": [
            "This jar's own crumb-holding token account. Authority is the jar's",
            "own PDA, not the player's wallet, so the program can move tokens out",
            "of it unilaterally during a raid -- matching exactly how raids",
            "already work against the legacy u64 balance today."
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "jar"
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
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
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
          "name": "crumbMint",
          "docs": [
            "Mutable because a lost raid burns the stake, and a won one first mints",
            "the target's pending accrual -- both move the mint's own supply figure."
          ],
          "writable": true,
          "address": "9Fj8joWNECtUdB74S2Y5odrUUj9pukuLak3ouQDjgCbS"
        },
        {
          "name": "mintAuthority",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  114,
                  117,
                  109,
                  98,
                  95,
                  109,
                  105,
                  110,
                  116,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ]
              }
            ]
          }
        },
        {
          "name": "attackerCrumbs",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "attackerJar"
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
          "name": "targetCrumbs",
          "docs": [
            "`init_if_needed` because a target who has never claimed has no token",
            "account yet. Without this the reveal would fail forever, and since the",
            "stake is already escrowed and the raid PDA is seeded per-attacker, that",
            "would strand the stake and lock the attacker out of raiding entirely."
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "targetJar"
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
          "name": "raidEscrow",
          "docs": [
            "Pinned to the raid PDA's own associated account so a substituted",
            "empty one can't be passed in to leave the real stake orphaned once",
            "the raid account closes."
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "raid"
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
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
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
    },
    {
      "name": "spendCrumbs",
      "docs": [
        "Callable by the other games over CPI, so a game can take payment in",
        "the same transaction as the action it's charging for."
      ],
      "discriminator": [
        204,
        250,
        240,
        79,
        169,
        63,
        58,
        188
      ],
      "accounts": [
        {
          "name": "owner",
          "signer": true
        },
        {
          "name": "jar",
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
          "name": "crumbMint",
          "docs": [
            "Mutable because burning lowers the mint's own supply figure."
          ],
          "writable": true,
          "address": "9Fj8joWNECtUdB74S2Y5odrUUj9pukuLak3ouQDjgCbS"
        },
        {
          "name": "jarCrumbs",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "jar"
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
    },
    {
      "code": 6007,
      "name": "notMigrated",
      "msg": "This jar's crumbs still need migrating to the real $CRUMB token before this will work"
    },
    {
      "code": 6008,
      "name": "alreadyMigrated",
      "msg": "This jar has already migrated to the real $CRUMB token"
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
      "name": "crumbMint",
      "docs": [
        "The real $CRUMB SPL Token mint. 0 decimals: crumbs have always been",
        "whole numbers, so this keeps every existing balance and UI display",
        "exactly as-is.",
        "",
        "TODO(before mainnet use): this mint hasn't been created on Cookie Chain",
        "yet, only locally for testing -- see target/deploy/crumb-mint-keypair.json",
        "(gitignored, same as every other program keypair). Creating it for real",
        "is a separate, deliberate step from deploying this program upgrade."
      ],
      "type": "pubkey",
      "value": "9Fj8joWNECtUdB74S2Y5odrUUj9pukuLak3ouQDjgCbS"
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
      "name": "mintAuthoritySeed",
      "docs": [
        "A single global PDA, not per-jar, since an SPL mint can only have one",
        "mint authority pubkey. Every jar's own token account is still authorized",
        "by that jar's own PDA (for moving crumbs it already holds, as raids do);",
        "this one is only ever used to sign the mint_to CPI that creates new",
        "crumbs in the first place."
      ],
      "type": "bytes",
      "value": "[99, 114, 117, 109, 98, 95, 109, 105, 110, 116, 95, 97, 117, 116, 104, 111, 114, 105, 116, 121]"
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

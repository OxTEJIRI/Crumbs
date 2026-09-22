/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/cookie_crush.json`.
 */
export type CookieCrush = {
  "address": "2jT3Tqpz2bavkJeDQiQTG8S6i3X1DMLUU6Gazeb9LvLM",
  "metadata": {
    "name": "cookieCrush",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "startLevel",
      "docs": [
        "`boost` pays $CRUMB for a longer round; see BOOST_EXTRA_SECONDS."
      ],
      "discriminator": [
        225,
        44,
        40,
        137,
        122,
        105,
        57,
        72
      ],
      "accounts": [
        {
          "name": "player",
          "writable": true,
          "signer": true
        },
        {
          "name": "session",
          "writable": true
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
          "writable": true,
          "optional": true
        },
        {
          "name": "jarCrumbs",
          "writable": true,
          "optional": true
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
        }
      ],
      "args": [
        {
          "name": "levelId",
          "type": "u8"
        },
        {
          "name": "boost",
          "type": "bool"
        }
      ]
    },
    {
      "name": "submitScore",
      "discriminator": [
        212,
        128,
        45,
        22,
        112,
        82,
        85,
        235
      ],
      "accounts": [
        {
          "name": "player",
          "writable": true,
          "signer": true
        },
        {
          "name": "session",
          "writable": true
        },
        {
          "name": "levelScore",
          "writable": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "levelId",
          "type": "u8"
        },
        {
          "name": "score",
          "type": "u32"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "levelScore",
      "discriminator": [
        77,
        141,
        194,
        239,
        103,
        121,
        204,
        2
      ]
    },
    {
      "name": "session",
      "discriminator": [
        243,
        81,
        72,
        115,
        214,
        188,
        72,
        144
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "submittedTooSoon",
      "msg": "Play a little longer before submitting a score"
    },
    {
      "code": 6001,
      "name": "scoreImplausible",
      "msg": "That score isn't plausible for how long the session ran"
    },
    {
      "code": 6002,
      "name": "boostAccountsMissing",
      "msg": "Paying for a longer round needs your Cookie Jar and its $CRUMB accounts"
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
      "name": "levelScore",
      "docs": [
        "A player's running record for one level. Persists across attempts."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "player",
            "type": "pubkey"
          },
          {
            "name": "levelId",
            "type": "u8"
          },
          {
            "name": "bestScore",
            "type": "u32"
          },
          {
            "name": "attempts",
            "type": "u32"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "session",
      "docs": [
        "An in-progress level attempt. Created by start_level, closed by",
        "submit_score, so a player can only have one open attempt per level."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "player",
            "type": "pubkey"
          },
          {
            "name": "levelId",
            "type": "u8"
          },
          {
            "name": "startedAt",
            "type": "i64"
          },
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "boosted",
            "docs": [
              "Whether the player paid $CRUMB for a longer round. Recorded so the",
              "purchase is visible on chain, not because the clock is enforced here."
            ],
            "type": "bool"
          }
        ]
      }
    }
  ],
  "constants": [
    {
      "name": "boostCostCrumbs",
      "docs": [
        "What a longer round costs in $CRUMB. Roughly twelve seconds of a jar's",
        "accrual, so it's a real decision without being out of reach."
      ],
      "type": "u64",
      "value": "250"
    },
    {
      "name": "boostExtraSeconds",
      "docs": [
        "How much longer a boosted round runs, on top of the base 60. The clock",
        "itself is client-side like the rest of the board, so this is the agreed",
        "number both sides work from, not something the chain enforces. The",
        "*payment* is enforced; the extra time is as trusted as the score is."
      ],
      "type": "i64",
      "value": "30"
    },
    {
      "name": "maxScorePerSecond",
      "docs": [
        "Loose plausibility ceiling, not real anti-cheat: gameplay lives entirely in",
        "the browser, so nothing here can prove a submitted score came from actual",
        "play. This only rejects a score no session of that length could reach."
      ],
      "type": "u64",
      "value": "80"
    },
    {
      "name": "minElapsedSeconds",
      "docs": [
        "A session must run at least this long before its score can be submitted,",
        "so a session can't be opened and closed in the same instant."
      ],
      "type": "i64",
      "value": "3"
    },
    {
      "name": "scoreBurstAllowance",
      "docs": [
        "Flat allowance on top of the per-second ceiling, so a strong opening",
        "cascade in the first second or two isn't rejected as \"too fast.\""
      ],
      "type": "u64",
      "value": "200"
    },
    {
      "name": "scoreSeed",
      "type": "bytes",
      "value": "[115, 99, 111, 114, 101]"
    },
    {
      "name": "sessionSeed",
      "type": "bytes",
      "value": "[115, 101, 115, 115, 105, 111, 110]"
    }
  ]
};

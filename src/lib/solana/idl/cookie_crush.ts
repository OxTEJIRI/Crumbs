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
        }
      ],
      "args": [
        {
          "name": "levelId",
          "type": "u8"
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
    }
  ],
  "types": [
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
          }
        ]
      }
    }
  ],
  "constants": [
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

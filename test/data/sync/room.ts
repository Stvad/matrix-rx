import {MatrixEvent, SyncResponse} from '../../../src'

export const id = '!test-room:matrix.org'

export const lastEventId = "$8BtqJ2UCX7X0xBauNd1GDOXS1GaB-8RDMnuPURn3MsI"
export const secondToLastEventId = "$7Uirl17NaVWCD3u8XmW4MEbxfRz1KWNM-1R3PAkjjeU"

export const lastEvent: MatrixEvent = {
    "content": {
        "body": "hmm",
        "format": "org.matrix.custom.html",
        "formatted_body": "<p dir=\"ltr\"><span>hmm</span></p>",
        "msgtype": "m.text"
    },
    "origin_server_ts": 1668265599886,
    "sender": "@metavlad:matrix.org",
    "type": "m.room.message",
    "unsigned": {
        "age": 326902747,
        "transaction_id": "textSat Nov 12 2022 16:06:39 GMT+0100 (Central European Standard Time)"
    },
    "event_id": lastEventId
}

export const secondToLastEvent: MatrixEvent = {
    "content": {
        "body": " * new! 2",
        "format": "org.matrix.custom.html",
        "formatted_body": " * new! 2",
        "m.new_content": {
            "body": "new! 2",
            "format": "org.matrix.custom.html",
            "formatted_body": "new! 2",
            "msgtype": "m.text",
            "org.matrix.msc1767.message": [
                {
                    "body": "new! 2",
                    "mimetype": "text/plain"
                },
                {
                    "body": "new! 2",
                    "mimetype": "text/html"
                }
            ]
        },
        "m.relates_to": {
            "event_id": "$bTgfLbl_EL8AL8eTS-QelbVgByhBXjkyauN74i08b4E",
            "rel_type": "m.replace"
        },
        "msgtype": "m.text",
        "org.matrix.msc1767.message": [
            {
                "body": " * new! 2",
                "mimetype": "text/plain"
            },
            {
                "body": " * new! 2",
                "mimetype": "text/html"
            }
        ]
    },
    "origin_server_ts": 1668253564597,
    "sender": "@metavlad:matrix.org",
    "type": "m.room.message",
    "unsigned": {
        "age": 338938036
    },
    "event_id": secondToLastEventId
}

export const initial: SyncResponse = {
    "next_batch": "s3452768126_757284974_5374094_1720948964_1750370107_3752927_660162646_5803511097_0",
    "account_data": {
        "events": [
            {
                "type": "m.direct",
                "content": {
                    "@maxtesting:matrix.org": [
                        "!ZXvpWSTlbhnIkHmsiy:matrix.org"
                    ],
                    "@stvad:matrix.org": [
                        "!QMMCtlZdDCVqyEwYZv:matrix.org"
                    ]
                }
            },
            {
                "type": "m.push_rules",
                "content": {
                    "global": {
                        "underride": [
                            {
                                "conditions": [
                                    {
                                        "kind": "event_match",
                                        "key": "type",
                                        "pattern": "m.call.invite"
                                    }
                                ],
                                "actions": [
                                    "notify",
                                    {
                                        "set_tweak": "sound",
                                        "value": "ring"
                                    },
                                    {
                                        "set_tweak": "highlight",
                                        "value": false
                                    }
                                ],
                                "rule_id": ".m.rule.call",
                                "default": true,
                                "enabled": true
                            },
                            {
                                "conditions": [
                                    {
                                        "kind": "event_match",
                                        "key": "type",
                                        "pattern": "m.room.message"
                                    },
                                    {
                                        "kind": "room_member_count",
                                        "is": "2"
                                    }
                                ],
                                "actions": [
                                    "notify",
                                    {
                                        "set_tweak": "sound",
                                        "value": "default"
                                    },
                                    {
                                        "set_tweak": "highlight",
                                        "value": false
                                    }
                                ],
                                "rule_id": ".m.rule.room_one_to_one",
                                "default": true,
                                "enabled": true
                            },
                            {
                                "conditions": [
                                    {
                                        "kind": "event_match",
                                        "key": "type",
                                        "pattern": "m.room.encrypted"
                                    },
                                    {
                                        "kind": "room_member_count",
                                        "is": "2"
                                    }
                                ],
                                "actions": [
                                    "notify",
                                    {
                                        "set_tweak": "sound",
                                        "value": "default"
                                    },
                                    {
                                        "set_tweak": "highlight",
                                        "value": false
                                    }
                                ],
                                "rule_id": ".m.rule.encrypted_room_one_to_one",
                                "default": true,
                                "enabled": true
                            },
                            {
                                "conditions": [
                                    {
                                        "kind": "event_match",
                                        "key": "type",
                                        "pattern": "m.room.message"
                                    }
                                ],
                                "actions": [
                                    "notify",
                                    {
                                        "set_tweak": "highlight",
                                        "value": false
                                    }
                                ],
                                "rule_id": ".m.rule.message",
                                "default": true,
                                "enabled": true
                            },
                            {
                                "conditions": [
                                    {
                                        "kind": "event_match",
                                        "key": "type",
                                        "pattern": "m.room.encrypted"
                                    }
                                ],
                                "actions": [
                                    "notify",
                                    {
                                        "set_tweak": "highlight",
                                        "value": false
                                    }
                                ],
                                "rule_id": ".m.rule.encrypted",
                                "default": true,
                                "enabled": true
                            },
                            {
                                "conditions": [
                                    {
                                        "kind": "event_match",
                                        "key": "type",
                                        "pattern": "im.vector.modular.widgets"
                                    },
                                    {
                                        "kind": "event_match",
                                        "key": "content.type",
                                        "pattern": "jitsi"
                                    },
                                    {
                                        "kind": "event_match",
                                        "key": "state_key",
                                        "pattern": "*"
                                    }
                                ],
                                "actions": [
                                    "notify",
                                    {
                                        "set_tweak": "highlight",
                                        "value": false
                                    }
                                ],
                                "rule_id": ".im.vector.jitsi",
                                "default": true,
                                "enabled": true
                            }
                        ],
                        "sender": [
                            {
                                "actions": [
                                    "notify"
                                ],
                                "rule_id": "@metavlad:matrix.org",
                                "default": false,
                                "enabled": true
                            }
                        ],
                        "room": [],
                        "content": [],
                        "override": [
                            {
                                "conditions": [],
                                "actions": [
                                    "dont_notify"
                                ],
                                "rule_id": ".m.rule.master",
                                "default": true,
                                "enabled": false
                            },
                            {
                                "conditions": [],
                                "actions": [
                                    "notify"
                                ],
                                "rule_id": "org.stvad.matrix.notify-for-sent",
                                "default": false,
                                "enabled": true
                            },
                            {
                                "conditions": [
                                    {
                                        "kind": "event_match",
                                        "key": "content.msgtype",
                                        "pattern": "m.notice"
                                    }
                                ],
                                "actions": [
                                    "dont_notify"
                                ],
                                "rule_id": ".m.rule.suppress_notices",
                                "default": true,
                                "enabled": true
                            },
                            {
                                "conditions": [
                                    {
                                        "kind": "event_match",
                                        "key": "type",
                                        "pattern": "m.room.member"
                                    },
                                    {
                                        "kind": "event_match",
                                        "key": "content.membership",
                                        "pattern": "invite"
                                    },
                                    {
                                        "kind": "event_match",
                                        "key": "state_key",
                                        "pattern": "@metavlad:matrix.org"
                                    }
                                ],
                                "actions": [
                                    "notify",
                                    {
                                        "set_tweak": "highlight",
                                        "value": false
                                    },
                                    {
                                        "set_tweak": "sound",
                                        "value": "default"
                                    }
                                ],
                                "rule_id": ".m.rule.invite_for_me",
                                "default": true,
                                "enabled": true
                            },
                            {
                                "conditions": [
                                    {
                                        "kind": "event_match",
                                        "key": "type",
                                        "pattern": "m.room.member"
                                    }
                                ],
                                "actions": [
                                    "dont_notify"
                                ],
                                "rule_id": ".m.rule.member_event",
                                "default": true,
                                "enabled": true
                            },
                            {
                                "conditions": [
                                    {
                                        "kind": "contains_display_name"
                                    }
                                ],
                                "actions": [
                                    "notify",
                                    {
                                        "set_tweak": "highlight"
                                    },
                                    {
                                        "set_tweak": "sound",
                                        "value": "default"
                                    }
                                ],
                                "rule_id": ".m.rule.contains_display_name",
                                "default": true,
                                "enabled": true
                            },
                            {
                                "conditions": [
                                    {
                                        "kind": "sender_notification_permission",
                                        "key": "room"
                                    },
                                    {
                                        "kind": "event_match",
                                        "key": "content.body",
                                        "pattern": "@room"
                                    }
                                ],
                                "actions": [
                                    "notify",
                                    {
                                        "set_tweak": "highlight"
                                    }
                                ],
                                "rule_id": ".m.rule.roomnotif",
                                "default": true,
                                "enabled": true
                            },
                            {
                                "conditions": [
                                    {
                                        "kind": "event_match",
                                        "key": "type",
                                        "pattern": "m.room.tombstone"
                                    },
                                    {
                                        "kind": "event_match",
                                        "key": "state_key",
                                        "pattern": ""
                                    }
                                ],
                                "actions": [
                                    "notify",
                                    {
                                        "set_tweak": "highlight"
                                    }
                                ],
                                "rule_id": ".m.rule.tombstone",
                                "default": true,
                                "enabled": true
                            },
                            {
                                "conditions": [
                                    {
                                        "kind": "event_match",
                                        "key": "type",
                                        "pattern": "m.reaction"
                                    }
                                ],
                                "actions": [
                                    "dont_notify"
                                ],
                                "rule_id": ".m.rule.reaction",
                                "default": true,
                                "enabled": true
                            },
                            {
                                "conditions": [
                                    {
                                        "kind": "event_match",
                                        "key": "type",
                                        "pattern": "m.room.server_acl"
                                    },
                                    {
                                        "kind": "event_match",
                                        "key": "state_key",
                                        "pattern": ""
                                    }
                                ],
                                "actions": [],
                                "rule_id": ".m.rule.room.server_acl",
                                "default": true,
                                "enabled": true
                            }
                        ]
                    },
                    "device": {}
                }
            }
        ]
    },
    "device_one_time_keys_count": {
        "signed_curve25519": 0
    },
    "device_unused_fallback_key_types": [],
    "rooms": {
        "join": {
            "!test-room:matrix.org": {
                "timeline": {
                    "events": [
                        {
                            "content": {
                                "body": "many kb plugins?",
                                "format": "org.matrix.custom.html",
                                "formatted_body": "<p dir=\"ltr\"><span>many kb plugins?</span></p>",
                                "msgtype": "m.text"
                            },
                            "origin_server_ts": 1667416258698,
                            "sender": "@metavlad:matrix.org",
                            "type": "m.room.message",
                            "unsigned": {
                                "age": 1176243935,
                                "transaction_id": "textWed Nov 02 2022 12:10:58 GMT-0700 (Pacific Daylight Time)"
                            },
                            "event_id": "$2gYbjJ90c7eB0ObIwrd0jc5WORflzGLz8lc3QVl7KFw"
                        },
                        {
                            "content": {
                                "body": "",
                                "format": "org.matrix.custom.html",
                                "formatted_body": "",
                                "msgtype": "m.text"
                            },
                            "origin_server_ts": 1667416426760,
                            "sender": "@metavlad:matrix.org",
                            "type": "m.room.message",
                            "unsigned": {
                                "age": 1176075873,
                                "transaction_id": "textWed Nov 02 2022 12:13:46 GMT-0700 (Pacific Daylight Time)"
                            },
                            "event_id": "$ypmVFE6OMoogbICoNt9fGbH3IVY3KT9SwfPssC_7MJE"
                        },
                        {
                            "content": {
                                "body": "",
                                "format": "org.matrix.custom.html",
                                "formatted_body": "",
                                "msgtype": "m.text"
                            },
                            "origin_server_ts": 1667416463123,
                            "sender": "@metavlad:matrix.org",
                            "type": "m.room.message",
                            "unsigned": {
                                "age": 1176039510,
                                "transaction_id": "textWed Nov 02 2022 12:14:22 GMT-0700 (Pacific Daylight Time)"
                            },
                            "event_id": "$0Bnyvs--9mnNy2uWDEPDeYd90X3BepnPU7dJ0j_A_rM"
                        },
                        {
                            "content": {
                                "body": "spartan",
                                "format": "org.matrix.custom.html",
                                "formatted_body": "<p dir=\"ltr\"><span>spartan</span></p>",
                                "msgtype": "m.text"
                            },
                            "origin_server_ts": 1667416600861,
                            "sender": "@metavlad:matrix.org",
                            "type": "m.room.message",
                            "unsigned": {
                                "age": 1175901772,
                                "transaction_id": "textWed Nov 02 2022 12:16:40 GMT-0700 (Pacific Daylight Time)"
                            },
                            "event_id": "$YbUF3Z3DknzjDYT-GPWxLvpu2B-KxVNbk5Ab9och_T4"
                        },
                        {
                            "content": {
                                "body": "new threads come again",
                                "msgtype": "m.text",
                                "org.matrix.msc1767.text": "new threads come again"
                            },
                            "origin_server_ts": 1668089741856,
                            "sender": "@metavlad:matrix.org",
                            "type": "m.room.message",
                            "unsigned": {
                                "age": 502760777,
                                "m.relations": {
                                    "m.thread": {
                                        "latest_event": {
                                            "content": {
                                                "body": "new! 2",
                                                "format": "org.matrix.custom.html",
                                                "formatted_body": "new! 2",
                                                "msgtype": "m.text",
                                                "org.matrix.msc1767.message": [
                                                    {
                                                        "body": "new! 2",
                                                        "mimetype": "text/plain"
                                                    },
                                                    {
                                                        "body": "new! 2",
                                                        "mimetype": "text/html"
                                                    }
                                                ],
                                                "m.relates_to": {
                                                    "event_id": "$YXjtcBkHVdEZPLV_V1KaVq5asTmdW-03rPO2rKDKrD4",
                                                    "is_falling_back": true,
                                                    "m.in_reply_to": {
                                                        "event_id": "$9B0_jyvdHmVlBQGHh5JEeOQA8iAktCbDbBRq-QfZUXo"
                                                    },
                                                    "rel_type": "m.thread"
                                                }
                                            },
                                            "origin_server_ts": 1668253555108,
                                            "sender": "@metavlad:matrix.org",
                                            "type": "m.room.message",
                                            "unsigned": {
                                                "age": 338947525,
                                                "m.relations": {
                                                    "m.replace": {
                                                        "event_id": secondToLastEventId,
                                                        "origin_server_ts": 1668253564597,
                                                        "sender": "@metavlad:matrix.org"
                                                    }
                                                }
                                            },
                                            "event_id": "$bTgfLbl_EL8AL8eTS-QelbVgByhBXjkyauN74i08b4E"
                                        },
                                        "count": 2,
                                        "current_user_participated": true
                                    }
                                }
                            },
                            "event_id": "$YXjtcBkHVdEZPLV_V1KaVq5asTmdW-03rPO2rKDKrD4"
                        },
                        {
                            "content": {
                                "body": "inside thread - edits (check on reload)? 6",
                                "format": "org.matrix.custom.html",
                                "formatted_body": "inside thread - edits (check on reload)? 6",
                                "msgtype": "m.text",
                                "org.matrix.msc1767.message": [
                                    {
                                        "body": "inside thread - edits (check on reload)? 6",
                                        "mimetype": "text/plain"
                                    },
                                    {
                                        "body": "inside thread - edits (check on reload)? 6",
                                        "mimetype": "text/html"
                                    }
                                ],
                                "m.relates_to": {
                                    "event_id": "$YXjtcBkHVdEZPLV_V1KaVq5asTmdW-03rPO2rKDKrD4",
                                    "is_falling_back": true,
                                    "m.in_reply_to": {
                                        "event_id": "$YXjtcBkHVdEZPLV_V1KaVq5asTmdW-03rPO2rKDKrD4"
                                    },
                                    "rel_type": "m.thread"
                                }
                            },
                            "origin_server_ts": 1668089747515,
                            "sender": "@metavlad:matrix.org",
                            "type": "m.room.message",
                            "unsigned": {
                                "age": 502755118,
                                "m.relations": {
                                    "m.replace": {
                                        "event_id": "$F85wbcR6NtA_dQExvdZeUCqDZHpWx7cx_QuTRRxCFcE",
                                        "origin_server_ts": 1668251736136,
                                        "sender": "@metavlad:matrix.org"
                                    }
                                }
                            },
                            "event_id": "$9B0_jyvdHmVlBQGHh5JEeOQA8iAktCbDbBRq-QfZUXo"
                        },
                        {
                            "content": {
                                "body": " * inside thread - edits (check on reload)?",
                                "format": "org.matrix.custom.html",
                                "formatted_body": " * inside thread - edits (check on reload)?",
                                "m.new_content": {
                                    "body": "inside thread - edits (check on reload)?",
                                    "format": "org.matrix.custom.html",
                                    "formatted_body": "inside thread - edits (check on reload)?",
                                    "msgtype": "m.text",
                                    "org.matrix.msc1767.message": [
                                        {
                                            "body": "inside thread - edits (check on reload)?",
                                            "mimetype": "text/plain"
                                        },
                                        {
                                            "body": "inside thread - edits (check on reload)?",
                                            "mimetype": "text/html"
                                        }
                                    ]
                                },
                                "m.relates_to": {
                                    "event_id": "$9B0_jyvdHmVlBQGHh5JEeOQA8iAktCbDbBRq-QfZUXo",
                                    "rel_type": "m.replace"
                                },
                                "msgtype": "m.text",
                                "org.matrix.msc1767.message": [
                                    {
                                        "body": " * inside thread - edits (check on reload)?",
                                        "mimetype": "text/plain"
                                    },
                                    {
                                        "body": " * inside thread - edits (check on reload)?",
                                        "mimetype": "text/html"
                                    }
                                ]
                            },
                            "origin_server_ts": 1668189048504,
                            "sender": "@metavlad:matrix.org",
                            "type": "m.room.message",
                            "unsigned": {
                                "age": 403454129
                            },
                            "event_id": "$Sq60EsysPQUstPmyyhEblSqyZX0KMVaaU9qqEKg2ZhI"
                        },
                        {
                            "content": {
                                "body": " * inside thread - edits (check on reload)? 2",
                                "format": "org.matrix.custom.html",
                                "formatted_body": " * inside thread - edits (check on reload)? 2",
                                "m.new_content": {
                                    "body": "inside thread - edits (check on reload)? 2",
                                    "format": "org.matrix.custom.html",
                                    "formatted_body": "inside thread - edits (check on reload)? 2",
                                    "msgtype": "m.text",
                                    "org.matrix.msc1767.message": [
                                        {
                                            "body": "inside thread - edits (check on reload)? 2",
                                            "mimetype": "text/plain"
                                        },
                                        {
                                            "body": "inside thread - edits (check on reload)? 2",
                                            "mimetype": "text/html"
                                        }
                                    ]
                                },
                                "m.relates_to": {
                                    "event_id": "$9B0_jyvdHmVlBQGHh5JEeOQA8iAktCbDbBRq-QfZUXo",
                                    "rel_type": "m.replace"
                                },
                                "msgtype": "m.text",
                                "org.matrix.msc1767.message": [
                                    {
                                        "body": " * inside thread - edits (check on reload)? 2",
                                        "mimetype": "text/plain"
                                    },
                                    {
                                        "body": " * inside thread - edits (check on reload)? 2",
                                        "mimetype": "text/html"
                                    }
                                ]
                            },
                            "origin_server_ts": 1668189365532,
                            "sender": "@metavlad:matrix.org",
                            "type": "m.room.message",
                            "unsigned": {
                                "age": 403137101
                            },
                            "event_id": "$29sdrW0gffDDuCO-uzDZab0YZdUAwR-KpPtVBCqfcgg"
                        },
                        {
                            "content": {
                                "body": " * inside thread - edits (check on reload)? 3",
                                "format": "org.matrix.custom.html",
                                "formatted_body": " * inside thread - edits (check on reload)? 3",
                                "m.new_content": {
                                    "body": "inside thread - edits (check on reload)? 3",
                                    "format": "org.matrix.custom.html",
                                    "formatted_body": "inside thread - edits (check on reload)? 3",
                                    "msgtype": "m.text",
                                    "org.matrix.msc1767.message": [
                                        {
                                            "body": "inside thread - edits (check on reload)? 3",
                                            "mimetype": "text/plain"
                                        },
                                        {
                                            "body": "inside thread - edits (check on reload)? 3",
                                            "mimetype": "text/html"
                                        }
                                    ]
                                },
                                "m.relates_to": {
                                    "event_id": "$9B0_jyvdHmVlBQGHh5JEeOQA8iAktCbDbBRq-QfZUXo",
                                    "rel_type": "m.replace"
                                },
                                "msgtype": "m.text",
                                "org.matrix.msc1767.message": [
                                    {
                                        "body": " * inside thread - edits (check on reload)? 3",
                                        "mimetype": "text/plain"
                                    },
                                    {
                                        "body": " * inside thread - edits (check on reload)? 3",
                                        "mimetype": "text/html"
                                    }
                                ]
                            },
                            "origin_server_ts": 1668189483231,
                            "sender": "@metavlad:matrix.org",
                            "type": "m.room.message",
                            "unsigned": {
                                "age": 403019402
                            },
                            "event_id": "$od0grw3Yhzz2Kq7Szl3difzVyi93uj2S7vYTZwfeAig"
                        },
                        {
                            "content": {
                                "body": " * inside thread - edits (check on reload)? 4",
                                "format": "org.matrix.custom.html",
                                "formatted_body": " * inside thread - edits (check on reload)? 4",
                                "m.new_content": {
                                    "body": "inside thread - edits (check on reload)? 4",
                                    "format": "org.matrix.custom.html",
                                    "formatted_body": "inside thread - edits (check on reload)? 4",
                                    "msgtype": "m.text",
                                    "org.matrix.msc1767.message": [
                                        {
                                            "body": "inside thread - edits (check on reload)? 4",
                                            "mimetype": "text/plain"
                                        },
                                        {
                                            "body": "inside thread - edits (check on reload)? 4",
                                            "mimetype": "text/html"
                                        }
                                    ]
                                },
                                "m.relates_to": {
                                    "event_id": "$9B0_jyvdHmVlBQGHh5JEeOQA8iAktCbDbBRq-QfZUXo",
                                    "rel_type": "m.replace"
                                },
                                "msgtype": "m.text",
                                "org.matrix.msc1767.message": [
                                    {
                                        "body": " * inside thread - edits (check on reload)? 4",
                                        "mimetype": "text/plain"
                                    },
                                    {
                                        "body": " * inside thread - edits (check on reload)? 4",
                                        "mimetype": "text/html"
                                    }
                                ]
                            },
                            "origin_server_ts": 1668250557846,
                            "sender": "@metavlad:matrix.org",
                            "type": "m.room.message",
                            "unsigned": {
                                "age": 341944787
                            },
                            "event_id": "$N-1bIs0jLoKco_97JzPQJIpsEkM40xrBx_Xj4VBDPfU"
                        },
                        {
                            "content": {
                                "body": " * inside thread - edits (check on reload)? 5",
                                "format": "org.matrix.custom.html",
                                "formatted_body": " * inside thread - edits (check on reload)? 5",
                                "m.new_content": {
                                    "body": "inside thread - edits (check on reload)? 5",
                                    "format": "org.matrix.custom.html",
                                    "formatted_body": "inside thread - edits (check on reload)? 5",
                                    "msgtype": "m.text",
                                    "org.matrix.msc1767.message": [
                                        {
                                            "body": "inside thread - edits (check on reload)? 5",
                                            "mimetype": "text/plain"
                                        },
                                        {
                                            "body": "inside thread - edits (check on reload)? 5",
                                            "mimetype": "text/html"
                                        }
                                    ]
                                },
                                "m.relates_to": {
                                    "event_id": "$9B0_jyvdHmVlBQGHh5JEeOQA8iAktCbDbBRq-QfZUXo",
                                    "rel_type": "m.replace"
                                },
                                "msgtype": "m.text",
                                "org.matrix.msc1767.message": [
                                    {
                                        "body": " * inside thread - edits (check on reload)? 5",
                                        "mimetype": "text/plain"
                                    },
                                    {
                                        "body": " * inside thread - edits (check on reload)? 5",
                                        "mimetype": "text/html"
                                    }
                                ]
                            },
                            "origin_server_ts": 1668251714672,
                            "sender": "@metavlad:matrix.org",
                            "type": "m.room.message",
                            "unsigned": {
                                "age": 340787961
                            },
                            "event_id": "$O-4wgPLsa1BtGE2QnzhGanjn0LYWBb5NiJSAKW_kafA"
                        },
                        {
                            "content": {
                                "body": " * inside thread - edits (check on reload)? 6",
                                "format": "org.matrix.custom.html",
                                "formatted_body": " * inside thread - edits (check on reload)? 6",
                                "m.new_content": {
                                    "body": "inside thread - edits (check on reload)? 6",
                                    "format": "org.matrix.custom.html",
                                    "formatted_body": "inside thread - edits (check on reload)? 6",
                                    "msgtype": "m.text",
                                    "org.matrix.msc1767.message": [
                                        {
                                            "body": "inside thread - edits (check on reload)? 6",
                                            "mimetype": "text/plain"
                                        },
                                        {
                                            "body": "inside thread - edits (check on reload)? 6",
                                            "mimetype": "text/html"
                                        }
                                    ]
                                },
                                "m.relates_to": {
                                    "event_id": "$9B0_jyvdHmVlBQGHh5JEeOQA8iAktCbDbBRq-QfZUXo",
                                    "rel_type": "m.replace"
                                },
                                "msgtype": "m.text",
                                "org.matrix.msc1767.message": [
                                    {
                                        "body": " * inside thread - edits (check on reload)? 6",
                                        "mimetype": "text/plain"
                                    },
                                    {
                                        "body": " * inside thread - edits (check on reload)? 6",
                                        "mimetype": "text/html"
                                    }
                                ]
                            },
                            "origin_server_ts": 1668251736136,
                            "sender": "@metavlad:matrix.org",
                            "type": "m.room.message",
                            "unsigned": {
                                "age": 340766497
                            },
                            "event_id": "$F85wbcR6NtA_dQExvdZeUCqDZHpWx7cx_QuTRRxCFcE"
                        },
                        {
                            "content": {
                                "body": "new! 2",
                                "format": "org.matrix.custom.html",
                                "formatted_body": "new! 2",
                                "msgtype": "m.text",
                                "org.matrix.msc1767.message": [
                                    {
                                        "body": "new! 2",
                                        "mimetype": "text/plain"
                                    },
                                    {
                                        "body": "new! 2",
                                        "mimetype": "text/html"
                                    }
                                ],
                                "m.relates_to": {
                                    "event_id": "$YXjtcBkHVdEZPLV_V1KaVq5asTmdW-03rPO2rKDKrD4",
                                    "is_falling_back": true,
                                    "m.in_reply_to": {
                                        "event_id": "$9B0_jyvdHmVlBQGHh5JEeOQA8iAktCbDbBRq-QfZUXo"
                                    },
                                    "rel_type": "m.thread"
                                }
                            },
                            "origin_server_ts": 1668253555108,
                            "sender": "@metavlad:matrix.org",
                            "type": "m.room.message",
                            "unsigned": {
                                "age": 338947525,
                                "m.relations": {
                                    "m.replace": {
                                        "event_id": secondToLastEventId,
                                        "origin_server_ts": 1668253564597,
                                        "sender": "@metavlad:matrix.org"
                                    }
                                }
                            },
                            "event_id": "$bTgfLbl_EL8AL8eTS-QelbVgByhBXjkyauN74i08b4E"
                        },
                        secondToLastEvent,
                        lastEvent
                    ],
                    "prev_batch": "t149-3409681023_757284974_5374094_1720948964_1750370107_3752927_660162646_5803511097_0",
                    "limited": true
                },
                "state": {
                    "events": [
                        {
                            "content": {
                                "displayname": "metavlad",
                                "join_authorised_via_users_server": "@maxtesting:matrix.org",
                                "membership": "join"
                            },
                            "origin_server_ts": 1662248126640,
                            "sender": "@metavlad:matrix.org",
                            "state_key": "@metavlad:matrix.org",
                            "type": "m.room.member",
                            "unsigned": {
                                "age": 6344375993
                            },
                            "event_id": "$zOxfppxj4bEeWd_VwVDjMDtjsAcR-IcOb5W0BkxiJHQ"
                        },
                        {
                            "content": {
                                "allow": [
                                    {
                                        "room_id": "!GESKIXOzthxQnCBzCG:matrix.org",
                                        "type": "m.room_membership"
                                    }
                                ],
                                "join_rule": "restricted"
                            },
                            "origin_server_ts": 1662247102697,
                            "sender": "@maxtesting:matrix.org",
                            "state_key": "",
                            "type": "m.room.join_rules",
                            "unsigned": {
                                "age": 6345399936
                            },
                            "event_id": "$4GZ4AP1BlzkN5ybF93ceR-4uMYPze-wmSTjKl_v2wt4"
                        },
                        {
                            "content": {
                                "ban": 50,
                                "events": {
                                    "m.room.avatar": 50,
                                    "m.room.canonical_alias": 50,
                                    "m.room.encryption": 100,
                                    "m.room.history_visibility": 100,
                                    "m.room.name": 50,
                                    "m.room.power_levels": 100,
                                    "m.room.server_acl": 100,
                                    "m.room.tombstone": 100
                                },
                                "events_default": 0,
                                "historical": 100,
                                "invite": 0,
                                "kick": 50,
                                "redact": 50,
                                "state_default": 50,
                                "users": {
                                    "@maxtesting:matrix.org": 100,
                                    "@metavlad:matrix.org": 100
                                },
                                "users_default": 0
                            },
                            "origin_server_ts": 1662318526319,
                            "sender": "@maxtesting:matrix.org",
                            "state_key": "",
                            "type": "m.room.power_levels",
                            "unsigned": {
                                "replaces_state": "$PaDDkiOPdG4hW0WaGhnDFy4orQ5_AXC-0Ybz-Eb1PHE",
                                "age": 6273976314
                            },
                            "event_id": "$7I-5gxP_pMfAUK--gLDIBjWBgz5UZmZeimmN2TRyMm0"
                        },
                        {
                            "content": {
                                "name": "General6"
                            },
                            "origin_server_ts": 1666306951440,
                            "sender": "@metavlad:matrix.org",
                            "state_key": "",
                            "type": "m.room.name",
                            "unsigned": {
                                "replaces_state": "$9BiEht5WF5ZwbloUaSE08iXRSHPj416kT3_KIc_bzjc",
                                "age": 2285551193
                            },
                            "event_id": "$63Zcd9rJna8ttcM2sF4uVeoDbmssYv3unqTVmFaTVJA"
                        },
                        {
                            "content": {
                                "creator": "@maxtesting:matrix.org",
                                "room_version": "9"
                            },
                            "origin_server_ts": 1662247101555,
                            "sender": "@maxtesting:matrix.org",
                            "state_key": "",
                            "type": "m.room.create",
                            "unsigned": {
                                "age": 6345401078
                            },
                            "event_id": "$hFqmiWPlpzkj9NC6yu_HXospGPp0C7ftcer68Pr3hq0"
                        },
                        {
                            "content": {
                                "canonical": true,
                                "via": [
                                    "matrix.org"
                                ]
                            },
                            "origin_server_ts": 1662247102613,
                            "sender": "@maxtesting:matrix.org",
                            "state_key": "!GESKIXOzthxQnCBzCG:matrix.org",
                            "type": "m.space.parent",
                            "unsigned": {
                                "age": 6345400020
                            },
                            "event_id": "$QU6YWte6m_GgFQGvj8XdNmuKMYFLkgLMnT7DqaydcNE"
                        }
                    ]
                },
                "account_data": {
                    "events": []
                },
                "ephemeral": {
                    "events": []
                },
                "unread_notifications": {
                    "notification_count": 0,
                    "highlight_count": 0
                },
                "summary": {
                    "m.joined_member_count": 2,
                    "m.invited_member_count": 0
                }
            },
            "!GESKIXOzthxQnCBzCG:matrix.org": {
                "timeline": {
                    "events": [],
                    "prev_batch": "s3452768126_757284974_5374094_1720948964_1750370107_3752927_660162646_5803511097_0",
                    "limited": false
                },
                "state": {
                    "events": []
                },
                "account_data": {
                    "events": []
                },
                "ephemeral": {
                    "events": []
                },
                "unread_notifications": {
                    "notification_count": 0,
                    "highlight_count": 0
                },
                "summary": {
                    "m.joined_member_count": 2,
                    "m.invited_member_count": 0
                }
            },
            "!bmCwNZOOEGdsDEGYEr:matrix.org": {
                "timeline": {
                    "events": [],
                    "prev_batch": "s3452768126_757284974_5374094_1720948964_1750370107_3752927_660162646_5803511097_0",
                    "limited": false
                },
                "state": {
                    "events": []
                },
                "account_data": {
                    "events": []
                },
                "ephemeral": {
                    "events": []
                },
                "unread_notifications": {
                    "notification_count": 0,
                    "highlight_count": 0
                },
                "summary": {
                    "m.joined_member_count": 2,
                    "m.invited_member_count": 0
                }
            },
            "!ZFiztMbLglzacuFCOr:matrix.org": {
                "timeline": {
                    "events": [],
                    "prev_batch": "s3452768126_757284974_5374094_1720948964_1750370107_3752927_660162646_5803511097_0",
                    "limited": false
                },
                "state": {
                    "events": []
                },
                "account_data": {
                    "events": []
                },
                "ephemeral": {
                    "events": []
                },
                "unread_notifications": {
                    "notification_count": 0,
                    "highlight_count": 0
                },
                "summary": {
                    "m.joined_member_count": 1,
                    "m.invited_member_count": 0
                }
            },
            "!ceIrVPLDVwnWDIQuwB:matrix.org": {
                "timeline": {
                    "events": [],
                    "prev_batch": "s3452768126_757284974_5374094_1720948964_1750370107_3752927_660162646_5803511097_0",
                    "limited": false
                },
                "state": {
                    "events": []
                },
                "account_data": {
                    "events": []
                },
                "ephemeral": {
                    "events": []
                },
                "unread_notifications": {
                    "notification_count": 0,
                    "highlight_count": 0
                },
                "summary": {
                    "m.joined_member_count": 2,
                    "m.invited_member_count": 0
                }
            },
            "!sNbPHwlgXVcCObRAgE:matrix.org": {
                "timeline": {
                    "events": [],
                    "prev_batch": "s3452768126_757284974_5374094_1720948964_1750370107_3752927_660162646_5803511097_0",
                    "limited": false
                },
                "state": {
                    "events": []
                },
                "account_data": {
                    "events": []
                },
                "ephemeral": {
                    "events": []
                },
                "unread_notifications": {
                    "notification_count": 0,
                    "highlight_count": 0
                },
                "summary": {
                    "m.joined_member_count": 1,
                    "m.invited_member_count": 0
                }
            },
            "!ZXvpWSTlbhnIkHmsiy:matrix.org": {
                "timeline": {
                    "events": [],
                    "prev_batch": "s3452768126_757284974_5374094_1720948964_1750370107_3752927_660162646_5803511097_0",
                    "limited": false
                },
                "state": {
                    "events": []
                },
                "account_data": {
                    "events": []
                },
                "ephemeral": {
                    "events": []
                },
                "unread_notifications": {
                    "notification_count": 0,
                    "highlight_count": 0
                },
                "summary": {
                    "m.joined_member_count": 2,
                    "m.invited_member_count": 0,
                    "m.heroes": [
                        "@maxtesting:matrix.org"
                    ]
                }
            },
            "!QMMCtlZdDCVqyEwYZv:matrix.org": {
                "timeline": {
                    "events": [],
                    "prev_batch": "s3452768126_757284974_5374094_1720948964_1750370107_3752927_660162646_5803511097_0",
                    "limited": false
                },
                "state": {
                    "events": [
                        {
                            "content": {
                                "avatar_url": "mxc://matrix.org/efEKKCbzDVtYHgLCnlSMiWvs",
                                "displayname": "Vlad",
                                "membership": "join"
                            },
                            "origin_server_ts": 1667427199839,
                            "sender": "@stvad:matrix.org",
                            "state_key": "@stvad:matrix.org",
                            "type": "m.room.member",
                            "unsigned": {
                                "replaces_state": "$2g_TUP12tj3vDQXHrR3lYmwhHTaL9yFCGVtPkDyZi8w",
                                "prev_content": {
                                    "avatar_url": "mxc://matrix.org/efEKKCbzDVtYHgLCnlSMiWvs",
                                    "displayname": "Vlad",
                                    "is_direct": true,
                                    "membership": "invite"
                                },
                                "prev_sender": "@metavlad:matrix.org",
                                "age": 1165302794
                            },
                            "event_id": "$gSEkkHwEDNFFip2B4Ugjh-q-FP9xty97zVEYHJfhpBk"
                        }
                    ]
                },
                "account_data": {
                    "events": []
                },
                "ephemeral": {
                    "events": []
                },
                "unread_notifications": {
                    "notification_count": 0,
                    "highlight_count": 0
                },
                "summary": {
                    "m.joined_member_count": 2,
                    "m.invited_member_count": 0,
                    "m.heroes": [
                        "@stvad:matrix.org"
                    ]
                }
            },
            "!tHxocTIzjlabuHXevV:matrix.org": {
                "timeline": {
                    "events": [],
                    "prev_batch": "s3452768126_757284974_5374094_1720948964_1750370107_3752927_660162646_5803511097_0",
                    "limited": false
                },
                "state": {
                    "events": []
                },
                "account_data": {
                    "events": []
                },
                "ephemeral": {
                    "events": []
                },
                "unread_notifications": {
                    "notification_count": 0,
                    "highlight_count": 0
                },
                "summary": {
                    "m.joined_member_count": 2,
                    "m.invited_member_count": 0
                }
            },
            "!hWpEEIosXYrmodpPNs:matrix.org": {
                "timeline": {
                    "events": [],
                    "prev_batch": "s3452768126_757284974_5374094_1720948964_1750370107_3752927_660162646_5803511097_0",
                    "limited": false
                },
                "state": {
                    "events": []
                },
                "account_data": {
                    "events": []
                },
                "ephemeral": {
                    "events": []
                },
                "unread_notifications": {
                    "notification_count": 0,
                    "highlight_count": 0
                },
                "summary": {
                    "m.joined_member_count": 2,
                    "m.invited_member_count": 0
                }
            },
            "!xwGMGAlaCQHDOKHxGB:matrix.org": {
                "timeline": {
                    "events": [],
                    "prev_batch": "s3452768126_757284974_5374094_1720948964_1750370107_3752927_660162646_5803511097_0",
                    "limited": false
                },
                "state": {
                    "events": []
                },
                "account_data": {
                    "events": []
                },
                "ephemeral": {
                    "events": []
                },
                "unread_notifications": {
                    "notification_count": 0,
                    "highlight_count": 0
                },
                "summary": {
                    "m.joined_member_count": 1,
                    "m.invited_member_count": 0
                }
            }
        }
    }
}

export const empty: SyncResponse = {
    "next_batch": "s3452768151_757284974_5374124_1720948980_1750370120_3752927_660162649_5803511098_0",
    "device_one_time_keys_count": {
        "signed_curve25519": 0
    },
    "device_unused_fallback_key_types": []
}

export const incremental: SyncResponse = {
    "next_batch": "s3452891534_757284974_5543277_1721035551_1750468269_3753025_660220557_5803832655_0",
    "device_one_time_keys_count": {
        "signed_curve25519": 0
    },
    "device_unused_fallback_key_types": [],
    "rooms": {
        "join": {
            "!test-room:matrix.org": {
                "timeline": {
                    "events": [
                        {
                            "content": {
                                "body": "sync with messages ",
                                "format": "org.matrix.custom.html",
                                "formatted_body": "<p dir=\"ltr\"><span>sync with messages </span></p>",
                                "msgtype": "m.text"
                            },
                            "origin_server_ts": 1668595876864,
                            "sender": "@metavlad:matrix.org",
                            "type": "m.room.message",
                            "unsigned": {
                                "age": 243,
                                "transaction_id": "textWed Nov 16 2022 11:51:16 GMT+0100 (Central European Standard Time)"
                            },
                            "event_id": "$6pm_FmaLHrxrTH3WRFbE2MA4avhN6iX5lzS3XPCEg0c"
                        }
                    ],
                    "prev_batch": "s3452891533_757284974_5543277_1721035551_1750468269_3753025_660220557_5803832655_0",
                    "limited": false
                },
                "state": {
                    "events": []
                },
                "account_data": {
                    "events": []
                },
                "ephemeral": {
                    "events": []
                },
                "unread_notifications": {
                    "notification_count": 0,
                    "highlight_count": 0
                },
                "summary": {}
            }
        }
    }
}

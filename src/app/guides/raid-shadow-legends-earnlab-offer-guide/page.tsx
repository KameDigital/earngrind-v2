import type { Metadata } from "next";
import type { ComponentType, ReactNode } from "react";
import Link from "next/link";
import {
    AlertTriangle,
    BookOpen,
    Camera,
    CheckCircle2,
    ClipboardList,
    Coins,
    Gamepad2,
    Receipt,
    ShieldCheck,
    Sparkles,
    Star,
    Trophy,
} from "lucide-react";
import { absoluteUrl } from "@/lib/site-url";
import { indexFollowRobots } from "@/lib/seo-metadata";

const PAGE_PATH = "/guides/raid-shadow-legends-earnlab-offer-guide";
const PAGE_URL = absoluteUrl(PAGE_PATH);
const LAST_UPDATED = "May 31, 2026";
const TITLE = "Raid Shadow Legends EarnLab Offer Guide";
const DESCRIPTION =
    "Raid Shadow Legends EarnLab offer guide for US Android users: task payouts, level routes, hero ranks, purchases, Sacred Shards, proof, and stop rules.";

export const dynamic = "force-static";

export const metadata: Metadata = {
    title: TITLE,
    description: DESCRIPTION,
    alternates: {
        canonical: PAGE_URL,
    },
    robots: indexFollowRobots(),
    openGraph: {
        title: TITLE,
        description: DESCRIPTION,
        url: PAGE_URL,
        type: "article",
    },
    twitter: {
        card: "summary",
        title: TITLE,
        description: DESCRIPTION,
    },
};

const taskRows = [
  {
    "id": "task_001",
    "task": "Register and start playing the game",
    "points": 370,
    "value": 0.37,
    "deadline": "no listed deadline"
  },
  {
    "id": "task_002",
    "task": "Complete the tutorial",
    "points": 37,
    "value": 0.04,
    "deadline": "no listed deadline"
  },
  {
    "id": "task_003",
    "task": "Fight 20 Battles within 24 Hours",
    "points": 89,
    "value": 0.09,
    "deadline": "within 24 Hours"
  },
  {
    "id": "task_004",
    "task": "Reach level 15 within 3 Days",
    "points": 111,
    "value": 0.11,
    "deadline": "within 3 Days"
  },
  {
    "id": "task_005",
    "task": "Upgrade a hero to 5 stars within 3 days",
    "points": 185,
    "value": 0.18,
    "deadline": "within 3 days"
  },
  {
    "id": "task_006",
    "task": "Reach Level 30 within 4 days",
    "points": 444,
    "value": 0.44,
    "deadline": "within 4 days"
  },
  {
    "id": "task_007",
    "task": "Upgrade 3 heroes to 5 stars within 5 days",
    "points": 740,
    "value": 0.74,
    "deadline": "within 5 days"
  },
  {
    "id": "task_008",
    "task": "Upgrade a hero to 6 stars within 10 days",
    "points": 1110,
    "value": 1.11,
    "deadline": "within 10 days"
  },
  {
    "id": "task_009",
    "task": "Upgrade 5 heroes to 5 stars within 14 days",
    "points": 1850,
    "value": 1.85,
    "deadline": "within 14 days"
  },
  {
    "id": "task_010",
    "task": "Upgrade 3 heroes to 6 stars within 21 days",
    "points": 5920,
    "value": 5.92,
    "deadline": "within 21 days"
  },
  {
    "id": "task_011",
    "task": "Make any purchase. Can be repeated daily, 1 time per 24 hours",
    "points": 2220,
    "value": 2.22,
    "deadline": "1 time per 24 hours"
  },
  {
    "id": "task_012",
    "task": "Purchase Silver 500k pack for USD 9.99",
    "points": 11100,
    "value": 11.1,
    "deadline": "no listed deadline"
  },
  {
    "id": "task_013",
    "task": "Purchase the Daily Gem Pack for USD 9.99",
    "points": 11100,
    "value": 11.1,
    "deadline": "no listed deadline"
  },
  {
    "id": "task_014",
    "task": "Purchase a Sacred Daily Pack for USD 29.99",
    "points": 25900,
    "value": 25.9,
    "deadline": "no listed deadline"
  },
  {
    "id": "task_015",
    "task": "Purchase the Beginner Progress Pack for USD 49.99. Eligible only if purchased after Day 7",
    "points": 44400,
    "value": 44.4,
    "deadline": "after Day 7"
  },
  {
    "id": "task_016",
    "task": "Purchase Box of Gems for USD 29.99. Eligible only if purchased after Day 30",
    "points": 37000,
    "value": 37,
    "deadline": "after Day 30"
  },
  {
    "id": "task_017",
    "task": "Open 2 Sacred / Yellow Shards",
    "points": 2220,
    "value": 2.22,
    "deadline": "no listed deadline"
  },
  {
    "id": "task_018",
    "task": "Open 4 Sacred / Yellow Shards",
    "points": 5920,
    "value": 5.92,
    "deadline": "no listed deadline"
  },
  {
    "id": "task_019",
    "task": "Open 6 Sacred / Yellow Shards",
    "points": 16280,
    "value": 16.28,
    "deadline": "no listed deadline"
  },
  {
    "id": "task_020",
    "task": "Open 8 Sacred / Yellow Shards",
    "points": 28120,
    "value": 28.12,
    "deadline": "no listed deadline"
  },
  {
    "id": "task_021",
    "task": "Reach Level 50 within 21 days",
    "points": 14800,
    "value": 14.8,
    "deadline": "within 21 days"
  },
  {
    "id": "task_022",
    "task": "Reach Level 60 within 35 days",
    "points": 37000,
    "value": 37,
    "deadline": "within 35 days"
  },
  {
    "id": "task_023",
    "task": "Reach Level 70 within 60 days",
    "points": 125800,
    "value": 125.8,
    "deadline": "within 60 days"
  }
] as const;
const riskBands = [
  {
    "band": "safe_free_to_play",
    "task_ids": [
      "task_001",
      "task_002",
      "task_003",
      "task_004",
      "task_005",
      "task_006"
    ],
    "listed_reward_value": "1.23 in listed payout",
    "main_tracking_support_risk": "Low cash risk, but early no-credit is a hard warning.",
    "continue_reassess_stop_rule": "Continue if register, tutorial, 20 battles, Level 15, first 5-star, and Level 30 are on pace and at least some early credit appears.",
    "editorial_treatment": "Recommend as the basic test band for eligible new Android users."
  },
  {
    "band": "active_grind",
    "task_ids": [
      "task_007",
      "task_008",
      "task_009",
      "task_010",
      "task_021"
    ],
    "listed_reward_value": "24.42 in listed payout",
    "main_tracking_support_risk": "Time and energy risk rise; missed midpoint progress makes late rank tasks inefficient.",
    "continue_reassess_stop_rule": "Continue only if the food pipeline, campaign farmer, and Level 50 pace are visible by the midpoint.",
    "editorial_treatment": "Explain as a grinder band, not a casual route."
  },
  {
    "band": "low_spend",
    "task_ids": [
      "task_011",
      "task_012",
      "task_013",
      "task_014",
      "task_015",
      "task_017",
      "task_018"
    ],
    "listed_reward_value": "102.86 in listed payout before costs",
    "main_tracking_support_risk": "Receipt and pack-name mismatch risk; shard supply can force more spend.",
    "continue_reassess_stop_rule": "Only spend after free tracking has credited and the exact purchase or Sacred Shard tier is visible.",
    "editorial_treatment": "Use neutral economics; never frame spend as required for everyone."
  },
  {
    "band": "high_risk_or_not_recommended",
    "task_ids": [
      "task_016",
      "task_019",
      "task_020",
      "task_022",
      "task_023"
    ],
    "listed_reward_value": "244.20 in listed payout before costs",
    "main_tracking_support_risk": "Long deadlines, high level targets, scarce shards, and Day 30 timing create high missing-credit and opportunity-cost risk.",
    "continue_reassess_stop_rule": "Stop by default unless earlier tiers credited, resources are already secured, and the user can document every step.",
    "editorial_treatment": "Mark as stop or specialist-only goals for most readers."
  }
] as const;
const gameSystems = [
  {
    "system_name": "Campaign farming for account XP",
    "explanation": "Campaign clears are the repeatable loop that moves account level tasks while also leveling food champions.",
    "why_it_matters": "It overlaps Level 15, Level 30, Level 50, Level 60, Level 70, 5-star, and 6-star tasks.",
    "source_claim_ids": [
      "claim_005"
    ],
    "include_in_guide": true
  },
  {
    "system_name": "Tavern champion rank upgrades",
    "explanation": "The Tavern converts leveled food champions into higher star ranks.",
    "why_it_matters": "It is the core mechanic behind every 5-star and 6-star hero task.",
    "source_claim_ids": [
      "claim_003"
    ],
    "include_in_guide": true
  },
  {
    "system_name": "Energy refill timing and XP boosts",
    "explanation": "Energy gates campaign farming and XP boosts make the same energy more valuable.",
    "why_it_matters": "Energy shortages create most deadline misses after the early account levels.",
    "source_claim_ids": [
      "claim_005"
    ],
    "include_in_guide": true
  },
  {
    "system_name": "Portal Sacred Shard opening",
    "explanation": "Sacred or Yellow Shards must be opened in the Portal and are not interchangeable with cheaper shard types.",
    "why_it_matters": "The shard tasks require a specific random reward inventory item and proof before and after opening.",
    "source_claim_ids": [
      "claim_004"
    ],
    "include_in_guide": true
  },
  {
    "system_name": "Android purchase receipt flow",
    "explanation": "Paid tasks need the exact in-game purchase, Google Play receipt, and task-state evidence.",
    "why_it_matters": "Purchase tasks create the biggest mismatch between listed payout and cash outlay.",
    "source_claim_ids": [
      "claim_008"
    ],
    "include_in_guide": true
  }
] as const;
const taskArchetypes = [
  {
    "task_id": "task_001",
    "exact_task_text": "Register and start playing the game",
    "primary_archetype": "install_open_tracking",
    "secondary_archetypes": [
      "support_proof_tracking"
    ],
    "why_this_mapping": "Register and start playing the game is best handled through install_open_tracking because completion depends on the named game system plus proof that EarnLab tracked it.",
    "required_sections": [
      "canonical task table",
      "guided task-by-task route",
      "evidence log plan",
      "support-state model"
    ],
    "required_proof": [
      "EarnLab clicked offer page",
      "Android install session",
      "tutorial or battle counter screen",
      "EarnLab task state"
    ],
    "risk_band": "safe_free_to_play",
    "source_claim_ids": [
      "claim_001",
      "claim_009"
    ]
  },
  {
    "task_id": "task_002",
    "exact_task_text": "Complete the tutorial",
    "primary_archetype": "install_open_tracking",
    "secondary_archetypes": [
      "support_proof_tracking"
    ],
    "why_this_mapping": "Complete the tutorial is best handled through install_open_tracking because completion depends on the named game system plus proof that EarnLab tracked it.",
    "required_sections": [
      "canonical task table",
      "guided task-by-task route",
      "evidence log plan",
      "support-state model"
    ],
    "required_proof": [
      "EarnLab clicked offer page",
      "Android install session",
      "tutorial or battle counter screen",
      "EarnLab task state"
    ],
    "risk_band": "safe_free_to_play",
    "source_claim_ids": [
      "claim_001",
      "claim_009"
    ]
  },
  {
    "task_id": "task_003",
    "exact_task_text": "Fight 20 Battles within 24 Hours",
    "primary_archetype": "chapter_stage_campaign",
    "secondary_archetypes": [
      "support_proof_tracking"
    ],
    "why_this_mapping": "Fight 20 Battles within 24 Hours is best handled through chapter_stage_campaign because completion depends on the named game system plus proof that EarnLab tracked it.",
    "required_sections": [
      "canonical task table",
      "guided task-by-task route",
      "evidence log plan",
      "support-state model"
    ],
    "required_proof": [
      "EarnLab clicked offer page",
      "Android install session",
      "tutorial or battle counter screen",
      "EarnLab task state"
    ],
    "risk_band": "safe_free_to_play",
    "source_claim_ids": [
      "claim_001",
      "claim_009"
    ]
  },
  {
    "task_id": "task_004",
    "exact_task_text": "Reach level 15 within 3 Days",
    "primary_archetype": "account_player_level",
    "secondary_archetypes": [
      "support_proof_tracking"
    ],
    "why_this_mapping": "Reach level 15 within 3 Days is best handled through account_player_level because completion depends on the named game system plus proof that EarnLab tracked it.",
    "required_sections": [
      "canonical task table",
      "guided task-by-task route",
      "evidence log plan",
      "support-state model"
    ],
    "required_proof": [
      "account profile level screen",
      "campaign progress screen",
      "daily quest completion if used",
      "EarnLab task state"
    ],
    "risk_band": "safe_free_to_play",
    "source_claim_ids": [
      "claim_001",
      "claim_009"
    ]
  },
  {
    "task_id": "task_005",
    "exact_task_text": "Upgrade a hero to 5 stars within 3 days",
    "primary_archetype": "character_hero_rank",
    "secondary_archetypes": [
      "support_proof_tracking"
    ],
    "why_this_mapping": "Upgrade a hero to 5 stars within 3 days is best handled through character_hero_rank because completion depends on the named game system plus proof that EarnLab tracked it.",
    "required_sections": [
      "canonical task table",
      "guided task-by-task route",
      "evidence log plan",
      "support-state model"
    ],
    "required_proof": [
      "Tavern rank screen",
      "champion roster showing star rank",
      "profile/account screen",
      "EarnLab task state"
    ],
    "risk_band": "safe_free_to_play",
    "source_claim_ids": [
      "claim_001",
      "claim_009"
    ]
  },
  {
    "task_id": "task_006",
    "exact_task_text": "Reach Level 30 within 4 days",
    "primary_archetype": "account_player_level",
    "secondary_archetypes": [
      "support_proof_tracking"
    ],
    "why_this_mapping": "Reach Level 30 within 4 days is best handled through account_player_level because completion depends on the named game system plus proof that EarnLab tracked it.",
    "required_sections": [
      "canonical task table",
      "guided task-by-task route",
      "evidence log plan",
      "support-state model"
    ],
    "required_proof": [
      "account profile level screen",
      "campaign progress screen",
      "daily quest completion if used",
      "EarnLab task state"
    ],
    "risk_band": "safe_free_to_play",
    "source_claim_ids": [
      "claim_001",
      "claim_009"
    ]
  },
  {
    "task_id": "task_007",
    "exact_task_text": "Upgrade 3 heroes to 5 stars within 5 days",
    "primary_archetype": "character_hero_rank",
    "secondary_archetypes": [
      "support_proof_tracking"
    ],
    "why_this_mapping": "Upgrade 3 heroes to 5 stars within 5 days is best handled through character_hero_rank because completion depends on the named game system plus proof that EarnLab tracked it.",
    "required_sections": [
      "canonical task table",
      "guided task-by-task route",
      "evidence log plan",
      "support-state model"
    ],
    "required_proof": [
      "Tavern rank screen",
      "champion roster showing star rank",
      "profile/account screen",
      "EarnLab task state"
    ],
    "risk_band": "active_grind",
    "source_claim_ids": [
      "claim_001",
      "claim_009"
    ]
  },
  {
    "task_id": "task_008",
    "exact_task_text": "Upgrade a hero to 6 stars within 10 days",
    "primary_archetype": "character_hero_rank",
    "secondary_archetypes": [
      "support_proof_tracking"
    ],
    "why_this_mapping": "Upgrade a hero to 6 stars within 10 days is best handled through character_hero_rank because completion depends on the named game system plus proof that EarnLab tracked it.",
    "required_sections": [
      "canonical task table",
      "guided task-by-task route",
      "evidence log plan",
      "support-state model"
    ],
    "required_proof": [
      "Tavern rank screen",
      "champion roster showing star rank",
      "profile/account screen",
      "EarnLab task state"
    ],
    "risk_band": "active_grind",
    "source_claim_ids": [
      "claim_001",
      "claim_009"
    ]
  },
  {
    "task_id": "task_009",
    "exact_task_text": "Upgrade 5 heroes to 5 stars within 14 days",
    "primary_archetype": "character_hero_rank",
    "secondary_archetypes": [
      "support_proof_tracking"
    ],
    "why_this_mapping": "Upgrade 5 heroes to 5 stars within 14 days is best handled through character_hero_rank because completion depends on the named game system plus proof that EarnLab tracked it.",
    "required_sections": [
      "canonical task table",
      "guided task-by-task route",
      "evidence log plan",
      "support-state model"
    ],
    "required_proof": [
      "Tavern rank screen",
      "champion roster showing star rank",
      "profile/account screen",
      "EarnLab task state"
    ],
    "risk_band": "active_grind",
    "source_claim_ids": [
      "claim_001",
      "claim_009"
    ]
  },
  {
    "task_id": "task_010",
    "exact_task_text": "Upgrade 3 heroes to 6 stars within 21 days",
    "primary_archetype": "character_hero_rank",
    "secondary_archetypes": [
      "support_proof_tracking"
    ],
    "why_this_mapping": "Upgrade 3 heroes to 6 stars within 21 days is best handled through character_hero_rank because completion depends on the named game system plus proof that EarnLab tracked it.",
    "required_sections": [
      "canonical task table",
      "guided task-by-task route",
      "evidence log plan",
      "support-state model"
    ],
    "required_proof": [
      "Tavern rank screen",
      "champion roster showing star rank",
      "profile/account screen",
      "EarnLab task state"
    ],
    "risk_band": "active_grind",
    "source_claim_ids": [
      "claim_001",
      "claim_009"
    ]
  },
  {
    "task_id": "task_011",
    "exact_task_text": "Make any purchase. Can be repeated daily, 1 time per 24 hours",
    "primary_archetype": "purchase_recharge_subscription",
    "secondary_archetypes": [
      "support_proof_tracking"
    ],
    "why_this_mapping": "Make any purchase. Can be repeated daily, 1 time per 24 hours is best handled through purchase_recharge_subscription because completion depends on the named game system plus proof that EarnLab tracked it.",
    "required_sections": [
      "canonical task table",
      "guided task-by-task route",
      "evidence log plan",
      "support-state model"
    ],
    "required_proof": [
      "EarnLab task screenshot before purchase",
      "Google Play receipt",
      "in-game purchase confirmation",
      "EarnLab credited or pending state"
    ],
    "risk_band": "low_spend",
    "source_claim_ids": [
      "claim_001",
      "claim_009"
    ]
  },
  {
    "task_id": "task_012",
    "exact_task_text": "Purchase Silver 500k pack for USD 9.99",
    "primary_archetype": "purchase_recharge_subscription",
    "secondary_archetypes": [
      "support_proof_tracking"
    ],
    "why_this_mapping": "Purchase Silver 500k pack for USD 9.99 is best handled through purchase_recharge_subscription because completion depends on the named game system plus proof that EarnLab tracked it.",
    "required_sections": [
      "canonical task table",
      "guided task-by-task route",
      "evidence log plan",
      "support-state model"
    ],
    "required_proof": [
      "EarnLab task screenshot before purchase",
      "Google Play receipt",
      "in-game purchase confirmation",
      "EarnLab credited or pending state"
    ],
    "risk_band": "low_spend",
    "source_claim_ids": [
      "claim_001",
      "claim_009"
    ]
  },
  {
    "task_id": "task_013",
    "exact_task_text": "Purchase the Daily Gem Pack for USD 9.99",
    "primary_archetype": "purchase_recharge_subscription",
    "secondary_archetypes": [
      "support_proof_tracking"
    ],
    "why_this_mapping": "Purchase the Daily Gem Pack for USD 9.99 is best handled through purchase_recharge_subscription because completion depends on the named game system plus proof that EarnLab tracked it.",
    "required_sections": [
      "canonical task table",
      "guided task-by-task route",
      "evidence log plan",
      "support-state model"
    ],
    "required_proof": [
      "EarnLab task screenshot before purchase",
      "Google Play receipt",
      "in-game purchase confirmation",
      "EarnLab credited or pending state"
    ],
    "risk_band": "low_spend",
    "source_claim_ids": [
      "claim_001",
      "claim_009"
    ]
  },
  {
    "task_id": "task_014",
    "exact_task_text": "Purchase a Sacred Daily Pack for USD 29.99",
    "primary_archetype": "purchase_recharge_subscription",
    "secondary_archetypes": [
      "support_proof_tracking"
    ],
    "why_this_mapping": "Purchase a Sacred Daily Pack for USD 29.99 is best handled through purchase_recharge_subscription because completion depends on the named game system plus proof that EarnLab tracked it.",
    "required_sections": [
      "canonical task table",
      "guided task-by-task route",
      "evidence log plan",
      "support-state model"
    ],
    "required_proof": [
      "EarnLab task screenshot before purchase",
      "Google Play receipt",
      "in-game purchase confirmation",
      "EarnLab credited or pending state"
    ],
    "risk_band": "low_spend",
    "source_claim_ids": [
      "claim_001",
      "claim_009"
    ]
  },
  {
    "task_id": "task_015",
    "exact_task_text": "Purchase the Beginner Progress Pack for USD 49.99. Eligible only if purchased after Day 7",
    "primary_archetype": "purchase_recharge_subscription",
    "secondary_archetypes": [
      "support_proof_tracking"
    ],
    "why_this_mapping": "Purchase the Beginner Progress Pack for USD 49.99. Eligible only if purchased after Day 7 is best handled through purchase_recharge_subscription because completion depends on the named game system plus proof that EarnLab tracked it.",
    "required_sections": [
      "canonical task table",
      "guided task-by-task route",
      "evidence log plan",
      "support-state model"
    ],
    "required_proof": [
      "EarnLab task screenshot before purchase",
      "Google Play receipt",
      "in-game purchase confirmation",
      "EarnLab credited or pending state"
    ],
    "risk_band": "low_spend",
    "source_claim_ids": [
      "claim_001",
      "claim_009"
    ]
  },
  {
    "task_id": "task_016",
    "exact_task_text": "Purchase Box of Gems for USD 29.99. Eligible only if purchased after Day 30",
    "primary_archetype": "purchase_recharge_subscription",
    "secondary_archetypes": [
      "support_proof_tracking"
    ],
    "why_this_mapping": "Purchase Box of Gems for USD 29.99. Eligible only if purchased after Day 30 is best handled through purchase_recharge_subscription because completion depends on the named game system plus proof that EarnLab tracked it.",
    "required_sections": [
      "canonical task table",
      "guided task-by-task route",
      "evidence log plan",
      "support-state model"
    ],
    "required_proof": [
      "EarnLab task screenshot before purchase",
      "Google Play receipt",
      "in-game purchase confirmation",
      "EarnLab credited or pending state"
    ],
    "risk_band": "high_risk_or_not_recommended",
    "source_claim_ids": [
      "claim_001",
      "claim_009"
    ]
  },
  {
    "task_id": "task_017",
    "exact_task_text": "Open 2 Sacred / Yellow Shards",
    "primary_archetype": "random_reward_gacha",
    "secondary_archetypes": [
      "purchase_recharge_subscription",
      "support_proof_tracking"
    ],
    "why_this_mapping": "Open 2 Sacred / Yellow Shards is best handled through random_reward_gacha because completion depends on the named game system plus proof that EarnLab tracked it.",
    "required_sections": [
      "canonical task table",
      "guided task-by-task route",
      "evidence log plan",
      "support-state model"
    ],
    "required_proof": [
      "Sacred Shard inventory before opening",
      "Portal screen after opening",
      "EarnLab task state",
      "timestamped account profile"
    ],
    "risk_band": "low_spend",
    "source_claim_ids": [
      "claim_001",
      "claim_009"
    ]
  },
  {
    "task_id": "task_018",
    "exact_task_text": "Open 4 Sacred / Yellow Shards",
    "primary_archetype": "random_reward_gacha",
    "secondary_archetypes": [
      "purchase_recharge_subscription",
      "support_proof_tracking"
    ],
    "why_this_mapping": "Open 4 Sacred / Yellow Shards is best handled through random_reward_gacha because completion depends on the named game system plus proof that EarnLab tracked it.",
    "required_sections": [
      "canonical task table",
      "guided task-by-task route",
      "evidence log plan",
      "support-state model"
    ],
    "required_proof": [
      "Sacred Shard inventory before opening",
      "Portal screen after opening",
      "EarnLab task state",
      "timestamped account profile"
    ],
    "risk_band": "low_spend",
    "source_claim_ids": [
      "claim_001",
      "claim_009"
    ]
  },
  {
    "task_id": "task_019",
    "exact_task_text": "Open 6 Sacred / Yellow Shards",
    "primary_archetype": "random_reward_gacha",
    "secondary_archetypes": [
      "purchase_recharge_subscription",
      "support_proof_tracking"
    ],
    "why_this_mapping": "Open 6 Sacred / Yellow Shards is best handled through random_reward_gacha because completion depends on the named game system plus proof that EarnLab tracked it.",
    "required_sections": [
      "canonical task table",
      "guided task-by-task route",
      "evidence log plan",
      "support-state model"
    ],
    "required_proof": [
      "Sacred Shard inventory before opening",
      "Portal screen after opening",
      "EarnLab task state",
      "timestamped account profile"
    ],
    "risk_band": "high_risk_or_not_recommended",
    "source_claim_ids": [
      "claim_001",
      "claim_009"
    ]
  },
  {
    "task_id": "task_020",
    "exact_task_text": "Open 8 Sacred / Yellow Shards",
    "primary_archetype": "random_reward_gacha",
    "secondary_archetypes": [
      "purchase_recharge_subscription",
      "support_proof_tracking"
    ],
    "why_this_mapping": "Open 8 Sacred / Yellow Shards is best handled through random_reward_gacha because completion depends on the named game system plus proof that EarnLab tracked it.",
    "required_sections": [
      "canonical task table",
      "guided task-by-task route",
      "evidence log plan",
      "support-state model"
    ],
    "required_proof": [
      "Sacred Shard inventory before opening",
      "Portal screen after opening",
      "EarnLab task state",
      "timestamped account profile"
    ],
    "risk_band": "high_risk_or_not_recommended",
    "source_claim_ids": [
      "claim_001",
      "claim_009"
    ]
  },
  {
    "task_id": "task_021",
    "exact_task_text": "Reach Level 50 within 21 days",
    "primary_archetype": "account_player_level",
    "secondary_archetypes": [
      "support_proof_tracking"
    ],
    "why_this_mapping": "Reach Level 50 within 21 days is best handled through account_player_level because completion depends on the named game system plus proof that EarnLab tracked it.",
    "required_sections": [
      "canonical task table",
      "guided task-by-task route",
      "evidence log plan",
      "support-state model"
    ],
    "required_proof": [
      "account profile level screen",
      "campaign progress screen",
      "daily quest completion if used",
      "EarnLab task state"
    ],
    "risk_band": "active_grind",
    "source_claim_ids": [
      "claim_001",
      "claim_009"
    ]
  },
  {
    "task_id": "task_022",
    "exact_task_text": "Reach Level 60 within 35 days",
    "primary_archetype": "account_player_level",
    "secondary_archetypes": [
      "support_proof_tracking"
    ],
    "why_this_mapping": "Reach Level 60 within 35 days is best handled through account_player_level because completion depends on the named game system plus proof that EarnLab tracked it.",
    "required_sections": [
      "canonical task table",
      "guided task-by-task route",
      "evidence log plan",
      "support-state model"
    ],
    "required_proof": [
      "account profile level screen",
      "campaign progress screen",
      "daily quest completion if used",
      "EarnLab task state"
    ],
    "risk_band": "high_risk_or_not_recommended",
    "source_claim_ids": [
      "claim_001",
      "claim_009"
    ]
  },
  {
    "task_id": "task_023",
    "exact_task_text": "Reach Level 70 within 60 days",
    "primary_archetype": "account_player_level",
    "secondary_archetypes": [
      "support_proof_tracking"
    ],
    "why_this_mapping": "Reach Level 70 within 60 days is best handled through account_player_level because completion depends on the named game system plus proof that EarnLab tracked it.",
    "required_sections": [
      "canonical task table",
      "guided task-by-task route",
      "evidence log plan",
      "support-state model"
    ],
    "required_proof": [
      "account profile level screen",
      "campaign progress screen",
      "daily quest completion if used",
      "EarnLab task state"
    ],
    "risk_band": "high_risk_or_not_recommended",
    "source_claim_ids": [
      "claim_001",
      "claim_009"
    ]
  }
] as const;
const mechanicDossiers = [
  {
    "mechanic_name": "Campaign farming for account XP",
    "plain_english_explanation": "Spend energy on repeatable campaign battles so account XP rises while food champions gain levels.",
    "task_ids_affected": [
      "task_004",
      "task_006",
      "task_021",
      "task_022",
      "task_023",
      "task_003"
    ],
    "bottlenecks_and_conflicts": "Energy, XP boost timing, and the temptation to farm inefficient stages.",
    "proof_screens": [
      "profile level",
      "campaign stage",
      "EarnLab task state"
    ]
  },
  {
    "mechanic_name": "Tavern champion rank upgrades",
    "plain_english_explanation": "Use leveled food champions in the Tavern to increase a target champion from 4-star to 5-star or 5-star to 6-star.",
    "task_ids_affected": [
      "task_005",
      "task_007",
      "task_008",
      "task_009",
      "task_010"
    ],
    "bottlenecks_and_conflicts": "Food inventory, silver, champion lock mistakes, and short deadlines.",
    "proof_screens": [
      "Tavern rank screen",
      "champion roster star count",
      "EarnLab task state"
    ]
  },
  {
    "mechanic_name": "Energy refill timing and XP boosts",
    "plain_english_explanation": "Energy controls how many campaign runs are possible; XP boosts increase the value of each run.",
    "task_ids_affected": [
      "task_004",
      "task_006",
      "task_021",
      "task_022",
      "task_023",
      "task_005",
      "task_007",
      "task_008",
      "task_009",
      "task_010"
    ],
    "bottlenecks_and_conflicts": "Spending gems too early can leave no reserve for high-value checkpoints.",
    "proof_screens": [
      "energy count",
      "XP boost timer",
      "daily mission screen"
    ]
  },
  {
    "mechanic_name": "Portal Sacred Shard opening",
    "plain_english_explanation": "Open the exact Sacred or Yellow Shard in the Portal; other shard colors do not satisfy these tasks.",
    "task_ids_affected": [
      "task_017",
      "task_018",
      "task_019",
      "task_020"
    ],
    "bottlenecks_and_conflicts": "Sacred Shards are scarce and paid sources can erase payout value.",
    "proof_screens": [
      "Sacred Shard inventory",
      "Portal result",
      "EarnLab tier state"
    ]
  },
  {
    "mechanic_name": "Android purchase receipt flow",
    "plain_english_explanation": "Paid tasks need an in-game purchase from the tracked Android install and a Google Play receipt.",
    "task_ids_affected": [
      "task_011",
      "task_012",
      "task_013",
      "task_014",
      "task_015",
      "task_016"
    ],
    "bottlenecks_and_conflicts": "Task wording, Day 7 and Day 30 restrictions, tax, and missing-credit support.",
    "proof_screens": [
      "offer task before purchase",
      "Google Play receipt",
      "in-game delivery",
      "EarnLab credit state"
    ]
  }
] as const;
const milestoneMatrix = [
  {
    "milestone": "Day 0 tracking checkpoint",
    "task_ids": [
      "task_001",
      "task_002",
      "task_003"
    ],
    "checkpoint": "Register, tutorial, and 20 battles should be completed from the same EarnLab Android session.",
    "continue_rule": "Continue if early task state is credited or clearly pending.",
    "reassess_rule": "Reassess if no early task moves after a normal tracking wait.",
    "stop_rule": "Stop before purchases if install or tutorial never tracks."
  },
  {
    "milestone": "Day 3 to Day 5 early growth checkpoint",
    "task_ids": [
      "task_004",
      "task_005",
      "task_006",
      "task_007"
    ],
    "checkpoint": "Level 15, first 5-star, Level 30, and three 5-stars test whether the campaign and Tavern loop is working.",
    "continue_rule": "Continue if food inventory and account level are both moving.",
    "reassess_rule": "Reassess if Level 30 or three 5-stars are behind pace.",
    "stop_rule": "Stop rank chasing if no food pipeline exists by the midpoint."
  },
  {
    "milestone": "Day 10 to Day 21 active grind checkpoint",
    "task_ids": [
      "task_008",
      "task_009",
      "task_010",
      "task_021"
    ],
    "checkpoint": "First 6-star, five 5-stars, three 6-stars, and Level 50 require consistent energy and food planning.",
    "continue_rule": "Continue if a 6-star chain is already built and Level 50 pace is visible.",
    "reassess_rule": "Reassess if energy or silver shortage blocks daily farming.",
    "stop_rule": "Stop before buying resources to rescue a missed rank deadline."
  },
  {
    "milestone": "Day 30 to Day 60 late checkpoint",
    "task_ids": [
      "task_016",
      "task_022",
      "task_023"
    ],
    "checkpoint": "Day 30 Box of Gems, Level 60, and Level 70 are long-window tasks with tracking exposure.",
    "continue_rule": "Continue only with a clean credit record and daily progress ahead of pace.",
    "reassess_rule": "Reassess if level gain slows or support evidence is incomplete.",
    "stop_rule": "Stop for most users before Level 70 unless already close without new spend."
  },
  {
    "milestone": "Sacred Shard tier checkpoint",
    "task_ids": [
      "task_017",
      "task_018",
      "task_019",
      "task_020"
    ],
    "checkpoint": "Two, four, six, and eight Sacred Shard openings should be treated as escalating inventory tiers.",
    "continue_rule": "Continue from two to four only after the earlier tier credits.",
    "reassess_rule": "Reassess if the next tier requires paid shards not already planned.",
    "stop_rule": "Stop before six or eight if cost exceeds value or proof is weak."
  }
] as const;
const purchaseEconomics = [
  {
    "task_id": "task_011",
    "pack_or_action": "Make any purchase. Can be repeated daily, 1 time per 24 hours",
    "listed_reward_value": "2.22 per credited daily purchase",
    "listed_cost": "Variable",
    "net_before_tax": "Depends on the cheapest visible eligible purchase",
    "support_risk": "Repeat cadence can be misunderstood; screenshot each 24-hour reset.",
    "recommendation": "Only use after early tracking credits; do not stack repeated purchases without observed credit."
  },
  {
    "task_id": "task_012",
    "pack_or_action": "Purchase Silver 500k pack for USD 9.99",
    "listed_reward_value": "11.10",
    "listed_cost": "USD 9.99 before tax",
    "net_before_tax": "About 1.11 before tax",
    "support_risk": "Pack name must match the task closely.",
    "recommendation": "Small positive listed spread, but only if exact pack is visible and early tracking credited."
  },
  {
    "task_id": "task_013",
    "pack_or_action": "Purchase the Daily Gem Pack for USD 9.99",
    "listed_reward_value": "11.10",
    "listed_cost": "USD 9.99 before tax",
    "net_before_tax": "About 1.11 before tax",
    "support_risk": "Subscription-style or timed pack wording may complicate proof.",
    "recommendation": "Capture task, checkout, receipt, and in-game delivery screens."
  },
  {
    "task_id": "task_014",
    "pack_or_action": "Purchase a Sacred Daily Pack for USD 29.99",
    "listed_reward_value": "25.90",
    "listed_cost": "USD 29.99 before tax",
    "net_before_tax": "About negative 4.09 before tax",
    "support_risk": "May only make sense if it also supplies Sacred Shards needed for tiers.",
    "recommendation": "Do not buy for payout alone; treat as shard supply only after support proof is ready."
  },
  {
    "task_id": "task_015",
    "pack_or_action": "Purchase the Beginner Progress Pack for USD 49.99. Eligible only if purchased after Day 7",
    "listed_reward_value": "44.40",
    "listed_cost": "USD 49.99 before tax",
    "net_before_tax": "About negative 5.59 before tax",
    "support_risk": "Day 7 eligibility is a timing trap.",
    "recommendation": "Wait until after Day 7 and only continue if earlier spend credited."
  },
  {
    "task_id": "task_016",
    "pack_or_action": "Purchase Box of Gems for USD 29.99. Eligible only if purchased after Day 30",
    "listed_reward_value": "37.00",
    "listed_cost": "USD 29.99 before tax",
    "net_before_tax": "About 7.01 before tax",
    "support_risk": "Day 30 delay means a long tracking window before purchase.",
    "recommendation": "High-risk timing; only for users still actively progressing with a clean credit record."
  }
] as const;
const randomRewardModel = [
  {
    "task_ids": [
      "task_017",
      "task_018",
      "task_019",
      "task_020"
    ],
    "reward_object": "Sacred / Yellow Shards",
    "what_is_measured": "The task measures opening the correct shard type, not receiving a specific champion.",
    "guaranteed_part": "If a Sacred Shard is already in inventory, opening it is controllable and can be documented.",
    "random_part": "The champion pull is random and should not be treated as the value driver.",
    "paid_paths": "Sacred Daily Pack or other targeted packs may supply shards but can make the net value negative.",
    "proof_plan": "Screenshot shard inventory before opening, Portal result after opening, and EarnLab tier state.",
    "stop_rule": "Stop if the next tier requires unplanned paid shards or if the first Sacred tier fails to credit."
  }
] as const;
const terminologyMap = [
  {
    "offer_wording": "hero",
    "game_wording": "champion",
    "why_it_matters": "Raid commonly calls playable units champions, while the task list says hero."
  },
  {
    "offer_wording": "5 stars / 6 stars",
    "game_wording": "rank in the Tavern",
    "why_it_matters": "Star count means rank, not ordinary champion level."
  },
  {
    "offer_wording": "Sacred / Yellow Shards",
    "game_wording": "Sacred Shards in the Portal",
    "why_it_matters": "Other shard colors should not be counted toward Sacred tasks."
  },
  {
    "offer_wording": "Reach Level",
    "game_wording": "account/player level",
    "why_it_matters": "The level tasks are account progress tasks, not champion level tasks."
  },
  {
    "offer_wording": "Make any purchase",
    "game_wording": "in-app purchase through Android / Google Play",
    "why_it_matters": "Receipt and exact session proof matter for support."
  }
] as const;
const taskRoutes = [
  {
    "id": "task_001",
    "task": "Register and start playing the game",
    "mechanics": [
      "offer click attribution",
      "Android install session",
      "tutorial checkpoint",
      "battle counter proof"
    ],
    "route": [
      "Start from the EarnLab offer link on the same Android device.",
      "Complete the visible early requirement, then check EarnLab before pushing deeper.",
      "Take screenshots of the task list, in-game state, and any completion screen."
    ],
    "checkpoints": [
      "profile level or battle count",
      "daily progress pace",
      "EarnLab credit state"
    ],
    "proof": [
      "EarnLab clicked offer page",
      "Android install session",
      "tutorial or battle counter screen",
      "EarnLab task state"
    ],
    "stop": "Continue while tracking is healthy and the deadline checkpoint is on pace; reassess immediately if early credit fails.",
    "progression": {
      "target_type": "tracking",
      "target_value": "tracking completion",
      "progression_systems_to_cover": [
        "offer click attribution",
        "Android install session",
        "in-game completion screen"
      ],
      "xp_or_progress_sources": [
        "tracked install",
        "tutorial and campaign battle completion",
        "purchase receipt when relevant"
      ],
      "daily_repeatable_loop": [
        "check EarnLab task state",
        "take screenshots before and after completion",
        "pause if early credit fails"
      ],
      "priority_order": [
        "start from EarnLab link",
        "finish the visible requirement",
        "wait for credit before stacking spend"
      ],
      "milestone_route": [
        "install checkpoint",
        "tutorial checkpoint",
        "20 battle checkpoint",
        "purchase proof checkpoint"
      ],
      "gates_and_unlocks": [
        "new install eligibility",
        "tutorial access",
        "Google Play receipt for purchases"
      ],
      "resource_plan": [
        "keep device and account unchanged",
        "keep receipts",
        "do not reinstall or switch devices mid-offer"
      ],
      "accelerators": [
        "stable Wi-Fi",
        "single Google Play account",
        "early screenshots"
      ],
      "what_to_ignore": [
        "VPNs",
        "alternate app stores",
        "untracked reinstall attempts"
      ],
      "tables_or_checklists_needed": [
        "tracking setup checklist",
        "evidence log plan"
      ],
      "late_stage_bottlenecks": [
        "missing early credit is a warning sign",
        "purchase tasks add support risk if early tasks did not track"
      ],
      "reassessment_triggers": [
        "install or tutorial does not credit",
        "task timer is unclear",
        "receipt name differs from offer wording"
      ]
    }
  },
  {
    "id": "task_002",
    "task": "Complete the tutorial",
    "mechanics": [
      "offer click attribution",
      "Android install session",
      "tutorial checkpoint",
      "battle counter proof"
    ],
    "route": [
      "Start from the EarnLab offer link on the same Android device.",
      "Complete the visible early requirement, then check EarnLab before pushing deeper.",
      "Take screenshots of the task list, in-game state, and any completion screen."
    ],
    "checkpoints": [
      "profile level or battle count",
      "daily progress pace",
      "EarnLab credit state"
    ],
    "proof": [
      "EarnLab clicked offer page",
      "Android install session",
      "tutorial or battle counter screen",
      "EarnLab task state"
    ],
    "stop": "Continue while tracking is healthy and the deadline checkpoint is on pace; reassess immediately if early credit fails.",
    "progression": {
      "target_type": "tracking",
      "target_value": "tracking completion",
      "progression_systems_to_cover": [
        "offer click attribution",
        "Android install session",
        "in-game completion screen"
      ],
      "xp_or_progress_sources": [
        "tracked install",
        "tutorial and campaign battle completion",
        "purchase receipt when relevant"
      ],
      "daily_repeatable_loop": [
        "check EarnLab task state",
        "take screenshots before and after completion",
        "pause if early credit fails"
      ],
      "priority_order": [
        "start from EarnLab link",
        "finish the visible requirement",
        "wait for credit before stacking spend"
      ],
      "milestone_route": [
        "install checkpoint",
        "tutorial checkpoint",
        "20 battle checkpoint",
        "purchase proof checkpoint"
      ],
      "gates_and_unlocks": [
        "new install eligibility",
        "tutorial access",
        "Google Play receipt for purchases"
      ],
      "resource_plan": [
        "keep device and account unchanged",
        "keep receipts",
        "do not reinstall or switch devices mid-offer"
      ],
      "accelerators": [
        "stable Wi-Fi",
        "single Google Play account",
        "early screenshots"
      ],
      "what_to_ignore": [
        "VPNs",
        "alternate app stores",
        "untracked reinstall attempts"
      ],
      "tables_or_checklists_needed": [
        "tracking setup checklist",
        "evidence log plan"
      ],
      "late_stage_bottlenecks": [
        "missing early credit is a warning sign",
        "purchase tasks add support risk if early tasks did not track"
      ],
      "reassessment_triggers": [
        "install or tutorial does not credit",
        "task timer is unclear",
        "receipt name differs from offer wording"
      ]
    }
  },
  {
    "id": "task_003",
    "task": "Fight 20 Battles within 24 Hours",
    "mechanics": [
      "offer click attribution",
      "Android install session",
      "tutorial checkpoint",
      "battle counter proof"
    ],
    "route": [
      "Start from the EarnLab offer link on the same Android device.",
      "Complete the visible early requirement, then check EarnLab before pushing deeper.",
      "Take screenshots of the task list, in-game state, and any completion screen."
    ],
    "checkpoints": [
      "profile level or battle count",
      "daily progress pace",
      "EarnLab credit state"
    ],
    "proof": [
      "EarnLab clicked offer page",
      "Android install session",
      "tutorial or battle counter screen",
      "EarnLab task state"
    ],
    "stop": "Continue while tracking is healthy and the deadline checkpoint is on pace; reassess immediately if early credit fails.",
    "progression": {
      "target_type": "tracking",
      "target_value": "tracking completion",
      "progression_systems_to_cover": [
        "offer click attribution",
        "Android install session",
        "in-game completion screen"
      ],
      "xp_or_progress_sources": [
        "tracked install",
        "tutorial and campaign battle completion",
        "purchase receipt when relevant"
      ],
      "daily_repeatable_loop": [
        "check EarnLab task state",
        "take screenshots before and after completion",
        "pause if early credit fails"
      ],
      "priority_order": [
        "start from EarnLab link",
        "finish the visible requirement",
        "wait for credit before stacking spend"
      ],
      "milestone_route": [
        "install checkpoint",
        "tutorial checkpoint",
        "20 battle checkpoint",
        "purchase proof checkpoint"
      ],
      "gates_and_unlocks": [
        "new install eligibility",
        "tutorial access",
        "Google Play receipt for purchases"
      ],
      "resource_plan": [
        "keep device and account unchanged",
        "keep receipts",
        "do not reinstall or switch devices mid-offer"
      ],
      "accelerators": [
        "stable Wi-Fi",
        "single Google Play account",
        "early screenshots"
      ],
      "what_to_ignore": [
        "VPNs",
        "alternate app stores",
        "untracked reinstall attempts"
      ],
      "tables_or_checklists_needed": [
        "tracking setup checklist",
        "evidence log plan"
      ],
      "late_stage_bottlenecks": [
        "missing early credit is a warning sign",
        "purchase tasks add support risk if early tasks did not track"
      ],
      "reassessment_triggers": [
        "install or tutorial does not credit",
        "task timer is unclear",
        "receipt name differs from offer wording"
      ]
    }
  },
  {
    "id": "task_004",
    "task": "Reach level 15 within 3 Days",
    "mechanics": [
      "account level progression",
      "Campaign farming for account XP",
      "energy refill timing",
      "daily quests and mission rewards"
    ],
    "route": [
      "Farm campaign stages while completing daily quests and missions so account XP rises with useful hero progress.",
      "Compare the level target against the milestone matrix, then continue only when the daily checkpoint is on pace.",
      "Keep a screenshot of the profile level before and after the target credits."
    ],
    "checkpoints": [
      "profile level or battle count",
      "daily progress pace",
      "EarnLab credit state"
    ],
    "proof": [
      "account profile level screen",
      "campaign progress screen",
      "daily quest completion if used",
      "EarnLab task state"
    ],
    "stop": "Continue while tracking is healthy and the deadline checkpoint is on pace; reassess immediately if early credit fails.",
    "progression": {
      "target_type": "account_level",
      "target_value": "15",
      "progression_systems_to_cover": [
        "Campaign farming for account XP",
        "daily quests and mission rewards",
        "energy refill timing and XP boosts"
      ],
      "xp_or_progress_sources": [
        "Campaign stage clears",
        "daily and weekly missions",
        "login rewards, event rewards, and energy refills"
      ],
      "daily_repeatable_loop": [
        "spend energy on campaign stages",
        "claim daily quests and missions",
        "upgrade starter champion and food while account XP rises"
      ],
      "priority_order": [
        "clear tutorial and campaign unlocks",
        "farm the highest reliable campaign stage",
        "use multi-battle only after screenshots and tracking checks"
      ],
      "milestone_route": [
        "Level 15 checkpoint: tutorial, campaign farming, and first daily loop complete",
        "Level 30 checkpoint: early progression is still fast but requires consistent energy use",
        "Level 50 checkpoint: continue only if several 5-star and 6-star rank tasks are also moving",
        "Level 60 checkpoint: reassess if progress has slowed below a daily level target",
        "Level 70 checkpoint: stop for most players unless already far ahead with strong tracked progress"
      ],
      "gates_and_unlocks": [
        "campaign access",
        "tavern access",
        "daily quests",
        "energy refills"
      ],
      "resource_plan": [
        "save gems for energy only when the payout band justifies it",
        "avoid spending premium currency on summons before the shard plan is clear",
        "keep screenshots at each level milestone"
      ],
      "accelerators": [
        "XP boosts",
        "multi-battle",
        "campaign farming",
        "daily missions"
      ],
      "what_to_ignore": [
        "arena optimization",
        "deep gear min-maxing",
        "champion collection detours that do not improve campaign clears"
      ],
      "tables_or_checklists_needed": [
        "milestone matrix",
        "daily route checklist"
      ],
      "late_stage_bottlenecks": [
        "account XP slows sharply after early levels",
        "energy becomes the limiting input",
        "Level 60 and Level 70 are late goals with high time risk"
      ],
      "reassessment_triggers": [
        "missed deadline checkpoint",
        "no tracking credit on early tasks",
        "energy shortage without overlapping rank progress"
      ]
    }
  },
  {
    "id": "task_005",
    "task": "Upgrade a hero to 5 stars within 3 days",
    "mechanics": [
      "Tavern champion rank upgrades",
      "food champion leveling",
      "campaign farming for food XP",
      "silver for Tavern upgrades"
    ],
    "route": [
      "Use the Tavern rank ladder: level food champions in campaign, rank them up, then feed them into the target champion.",
      "Build one reliable campaign farmer before spreading resources across several heroes.",
      "Stop if the food inventory cannot support the next 5-star or 6-star deadline without unplanned spending."
    ],
    "checkpoints": [
      "food inventory count",
      "Tavern rank result",
      "deadline midpoint check"
    ],
    "proof": [
      "Tavern rank screen",
      "champion roster showing star rank",
      "profile/account screen",
      "EarnLab task state"
    ],
    "stop": "Continue while tracking is healthy and the deadline checkpoint is on pace; reassess immediately if early credit fails.",
    "progression": {
      "target_type": "hero_rank",
      "target_value": "5-star hero rank",
      "progression_systems_to_cover": [
        "Tavern champion rank upgrades",
        "food champion leveling",
        "campaign farming for food XP"
      ],
      "xp_or_progress_sources": [
        "campaign XP on food champions",
        "brews and chickens when earned",
        "starter champion farming loop"
      ],
      "daily_repeatable_loop": [
        "level food champions",
        "rank food in Tavern",
        "return upgraded food to campaign farming"
      ],
      "priority_order": [
        "rank one campaign farmer first",
        "build 5-star food before pushing multiple projects",
        "attempt 6-star goals only after food inventory proves the route"
      ],
      "milestone_route": [
        "first 5-star checkpoint: starter champion and enough food ready",
        "three 5-stars checkpoint: food pipeline must be stable",
        "first 6-star checkpoint: five 5-star food champions required",
        "three 6-stars checkpoint: stop unless resources are already banked"
      ],
      "gates_and_unlocks": [
        "Tavern unlocked after tutorial",
        "enough duplicate or food champions",
        "silver for Tavern upgrades"
      ],
      "resource_plan": [
        "preserve low-value champions as food",
        "reserve silver for rank upgrades",
        "do not sacrifice core campaign carry champions"
      ],
      "accelerators": [
        "brews",
        "chickens",
        "XP boosts",
        "multi-battle farming"
      ],
      "what_to_ignore": [
        "ranking every rare champion",
        "gear perfection before campaign farming works",
        "summon spending without a shard task reason"
      ],
      "tables_or_checklists_needed": [
        "hero rank ladder",
        "food inventory checklist"
      ],
      "late_stage_bottlenecks": [
        "6-star rank requires a large food chain",
        "silver and champion inventory become friction",
        "multiple 6-stars inside short windows are high-risk"
      ],
      "reassessment_triggers": [
        "not enough 4-star or 5-star food by the midpoint",
        "campaign farmer cannot clear farm stage reliably",
        "early rank credits fail to track"
      ]
    }
  },
  {
    "id": "task_006",
    "task": "Reach Level 30 within 4 days",
    "mechanics": [
      "account level progression",
      "Campaign farming for account XP",
      "energy refill timing",
      "daily quests and mission rewards"
    ],
    "route": [
      "Farm campaign stages while completing daily quests and missions so account XP rises with useful hero progress.",
      "Compare the level target against the milestone matrix, then continue only when the daily checkpoint is on pace.",
      "Keep a screenshot of the profile level before and after the target credits."
    ],
    "checkpoints": [
      "profile level or battle count",
      "daily progress pace",
      "EarnLab credit state"
    ],
    "proof": [
      "account profile level screen",
      "campaign progress screen",
      "daily quest completion if used",
      "EarnLab task state"
    ],
    "stop": "Continue while tracking is healthy and the deadline checkpoint is on pace; reassess immediately if early credit fails.",
    "progression": {
      "target_type": "account_level",
      "target_value": "30",
      "progression_systems_to_cover": [
        "Campaign farming for account XP",
        "daily quests and mission rewards",
        "energy refill timing and XP boosts"
      ],
      "xp_or_progress_sources": [
        "Campaign stage clears",
        "daily and weekly missions",
        "login rewards, event rewards, and energy refills"
      ],
      "daily_repeatable_loop": [
        "spend energy on campaign stages",
        "claim daily quests and missions",
        "upgrade starter champion and food while account XP rises"
      ],
      "priority_order": [
        "clear tutorial and campaign unlocks",
        "farm the highest reliable campaign stage",
        "use multi-battle only after screenshots and tracking checks"
      ],
      "milestone_route": [
        "Level 15 checkpoint: tutorial, campaign farming, and first daily loop complete",
        "Level 30 checkpoint: early progression is still fast but requires consistent energy use",
        "Level 50 checkpoint: continue only if several 5-star and 6-star rank tasks are also moving",
        "Level 60 checkpoint: reassess if progress has slowed below a daily level target",
        "Level 70 checkpoint: stop for most players unless already far ahead with strong tracked progress"
      ],
      "gates_and_unlocks": [
        "campaign access",
        "tavern access",
        "daily quests",
        "energy refills"
      ],
      "resource_plan": [
        "save gems for energy only when the payout band justifies it",
        "avoid spending premium currency on summons before the shard plan is clear",
        "keep screenshots at each level milestone"
      ],
      "accelerators": [
        "XP boosts",
        "multi-battle",
        "campaign farming",
        "daily missions"
      ],
      "what_to_ignore": [
        "arena optimization",
        "deep gear min-maxing",
        "champion collection detours that do not improve campaign clears"
      ],
      "tables_or_checklists_needed": [
        "milestone matrix",
        "daily route checklist"
      ],
      "late_stage_bottlenecks": [
        "account XP slows sharply after early levels",
        "energy becomes the limiting input",
        "Level 60 and Level 70 are late goals with high time risk"
      ],
      "reassessment_triggers": [
        "missed deadline checkpoint",
        "no tracking credit on early tasks",
        "energy shortage without overlapping rank progress"
      ]
    }
  },
  {
    "id": "task_007",
    "task": "Upgrade 3 heroes to 5 stars within 5 days",
    "mechanics": [
      "Tavern champion rank upgrades",
      "food champion leveling",
      "campaign farming for food XP",
      "silver for Tavern upgrades"
    ],
    "route": [
      "Use the Tavern rank ladder: level food champions in campaign, rank them up, then feed them into the target champion.",
      "Build one reliable campaign farmer before spreading resources across several heroes.",
      "Stop if the food inventory cannot support the next 5-star or 6-star deadline without unplanned spending."
    ],
    "checkpoints": [
      "food inventory count",
      "Tavern rank result",
      "deadline midpoint check"
    ],
    "proof": [
      "Tavern rank screen",
      "champion roster showing star rank",
      "profile/account screen",
      "EarnLab task state"
    ],
    "stop": "Continue while tracking is healthy and the deadline checkpoint is on pace; reassess immediately if early credit fails.",
    "progression": {
      "target_type": "hero_rank",
      "target_value": "5-star hero rank",
      "progression_systems_to_cover": [
        "Tavern champion rank upgrades",
        "food champion leveling",
        "campaign farming for food XP"
      ],
      "xp_or_progress_sources": [
        "campaign XP on food champions",
        "brews and chickens when earned",
        "starter champion farming loop"
      ],
      "daily_repeatable_loop": [
        "level food champions",
        "rank food in Tavern",
        "return upgraded food to campaign farming"
      ],
      "priority_order": [
        "rank one campaign farmer first",
        "build 5-star food before pushing multiple projects",
        "attempt 6-star goals only after food inventory proves the route"
      ],
      "milestone_route": [
        "first 5-star checkpoint: starter champion and enough food ready",
        "three 5-stars checkpoint: food pipeline must be stable",
        "first 6-star checkpoint: five 5-star food champions required",
        "three 6-stars checkpoint: stop unless resources are already banked"
      ],
      "gates_and_unlocks": [
        "Tavern unlocked after tutorial",
        "enough duplicate or food champions",
        "silver for Tavern upgrades"
      ],
      "resource_plan": [
        "preserve low-value champions as food",
        "reserve silver for rank upgrades",
        "do not sacrifice core campaign carry champions"
      ],
      "accelerators": [
        "brews",
        "chickens",
        "XP boosts",
        "multi-battle farming"
      ],
      "what_to_ignore": [
        "ranking every rare champion",
        "gear perfection before campaign farming works",
        "summon spending without a shard task reason"
      ],
      "tables_or_checklists_needed": [
        "hero rank ladder",
        "food inventory checklist"
      ],
      "late_stage_bottlenecks": [
        "6-star rank requires a large food chain",
        "silver and champion inventory become friction",
        "multiple 6-stars inside short windows are high-risk"
      ],
      "reassessment_triggers": [
        "not enough 4-star or 5-star food by the midpoint",
        "campaign farmer cannot clear farm stage reliably",
        "early rank credits fail to track"
      ]
    }
  },
  {
    "id": "task_008",
    "task": "Upgrade a hero to 6 stars within 10 days",
    "mechanics": [
      "Tavern champion rank upgrades",
      "food champion leveling",
      "campaign farming for food XP",
      "silver for Tavern upgrades"
    ],
    "route": [
      "Use the Tavern rank ladder: level food champions in campaign, rank them up, then feed them into the target champion.",
      "Build one reliable campaign farmer before spreading resources across several heroes.",
      "Stop if the food inventory cannot support the next 5-star or 6-star deadline without unplanned spending."
    ],
    "checkpoints": [
      "food inventory count",
      "Tavern rank result",
      "deadline midpoint check"
    ],
    "proof": [
      "Tavern rank screen",
      "champion roster showing star rank",
      "profile/account screen",
      "EarnLab task state"
    ],
    "stop": "Continue while tracking is healthy and the deadline checkpoint is on pace; reassess immediately if early credit fails.",
    "progression": {
      "target_type": "hero_rank",
      "target_value": "6-star hero rank",
      "progression_systems_to_cover": [
        "Tavern champion rank upgrades",
        "food champion leveling",
        "campaign farming for food XP"
      ],
      "xp_or_progress_sources": [
        "campaign XP on food champions",
        "brews and chickens when earned",
        "starter champion farming loop"
      ],
      "daily_repeatable_loop": [
        "level food champions",
        "rank food in Tavern",
        "return upgraded food to campaign farming"
      ],
      "priority_order": [
        "rank one campaign farmer first",
        "build 5-star food before pushing multiple projects",
        "attempt 6-star goals only after food inventory proves the route"
      ],
      "milestone_route": [
        "first 5-star checkpoint: starter champion and enough food ready",
        "three 5-stars checkpoint: food pipeline must be stable",
        "first 6-star checkpoint: five 5-star food champions required",
        "three 6-stars checkpoint: stop unless resources are already banked"
      ],
      "gates_and_unlocks": [
        "Tavern unlocked after tutorial",
        "enough duplicate or food champions",
        "silver for Tavern upgrades"
      ],
      "resource_plan": [
        "preserve low-value champions as food",
        "reserve silver for rank upgrades",
        "do not sacrifice core campaign carry champions"
      ],
      "accelerators": [
        "brews",
        "chickens",
        "XP boosts",
        "multi-battle farming"
      ],
      "what_to_ignore": [
        "ranking every rare champion",
        "gear perfection before campaign farming works",
        "summon spending without a shard task reason"
      ],
      "tables_or_checklists_needed": [
        "hero rank ladder",
        "food inventory checklist"
      ],
      "late_stage_bottlenecks": [
        "6-star rank requires a large food chain",
        "silver and champion inventory become friction",
        "multiple 6-stars inside short windows are high-risk"
      ],
      "reassessment_triggers": [
        "not enough 4-star or 5-star food by the midpoint",
        "campaign farmer cannot clear farm stage reliably",
        "early rank credits fail to track"
      ]
    }
  },
  {
    "id": "task_009",
    "task": "Upgrade 5 heroes to 5 stars within 14 days",
    "mechanics": [
      "Tavern champion rank upgrades",
      "food champion leveling",
      "campaign farming for food XP",
      "silver for Tavern upgrades"
    ],
    "route": [
      "Use the Tavern rank ladder: level food champions in campaign, rank them up, then feed them into the target champion.",
      "Build one reliable campaign farmer before spreading resources across several heroes.",
      "Stop if the food inventory cannot support the next 5-star or 6-star deadline without unplanned spending."
    ],
    "checkpoints": [
      "food inventory count",
      "Tavern rank result",
      "deadline midpoint check"
    ],
    "proof": [
      "Tavern rank screen",
      "champion roster showing star rank",
      "profile/account screen",
      "EarnLab task state"
    ],
    "stop": "Continue while tracking is healthy and the deadline checkpoint is on pace; reassess immediately if early credit fails.",
    "progression": {
      "target_type": "hero_rank",
      "target_value": "5-star hero rank",
      "progression_systems_to_cover": [
        "Tavern champion rank upgrades",
        "food champion leveling",
        "campaign farming for food XP"
      ],
      "xp_or_progress_sources": [
        "campaign XP on food champions",
        "brews and chickens when earned",
        "starter champion farming loop"
      ],
      "daily_repeatable_loop": [
        "level food champions",
        "rank food in Tavern",
        "return upgraded food to campaign farming"
      ],
      "priority_order": [
        "rank one campaign farmer first",
        "build 5-star food before pushing multiple projects",
        "attempt 6-star goals only after food inventory proves the route"
      ],
      "milestone_route": [
        "first 5-star checkpoint: starter champion and enough food ready",
        "three 5-stars checkpoint: food pipeline must be stable",
        "first 6-star checkpoint: five 5-star food champions required",
        "three 6-stars checkpoint: stop unless resources are already banked"
      ],
      "gates_and_unlocks": [
        "Tavern unlocked after tutorial",
        "enough duplicate or food champions",
        "silver for Tavern upgrades"
      ],
      "resource_plan": [
        "preserve low-value champions as food",
        "reserve silver for rank upgrades",
        "do not sacrifice core campaign carry champions"
      ],
      "accelerators": [
        "brews",
        "chickens",
        "XP boosts",
        "multi-battle farming"
      ],
      "what_to_ignore": [
        "ranking every rare champion",
        "gear perfection before campaign farming works",
        "summon spending without a shard task reason"
      ],
      "tables_or_checklists_needed": [
        "hero rank ladder",
        "food inventory checklist"
      ],
      "late_stage_bottlenecks": [
        "6-star rank requires a large food chain",
        "silver and champion inventory become friction",
        "multiple 6-stars inside short windows are high-risk"
      ],
      "reassessment_triggers": [
        "not enough 4-star or 5-star food by the midpoint",
        "campaign farmer cannot clear farm stage reliably",
        "early rank credits fail to track"
      ]
    }
  },
  {
    "id": "task_010",
    "task": "Upgrade 3 heroes to 6 stars within 21 days",
    "mechanics": [
      "Tavern champion rank upgrades",
      "food champion leveling",
      "campaign farming for food XP",
      "silver for Tavern upgrades"
    ],
    "route": [
      "Use the Tavern rank ladder: level food champions in campaign, rank them up, then feed them into the target champion.",
      "Build one reliable campaign farmer before spreading resources across several heroes.",
      "Stop if the food inventory cannot support the next 5-star or 6-star deadline without unplanned spending."
    ],
    "checkpoints": [
      "food inventory count",
      "Tavern rank result",
      "deadline midpoint check"
    ],
    "proof": [
      "Tavern rank screen",
      "champion roster showing star rank",
      "profile/account screen",
      "EarnLab task state"
    ],
    "stop": "Continue while tracking is healthy and the deadline checkpoint is on pace; reassess immediately if early credit fails.",
    "progression": {
      "target_type": "hero_rank",
      "target_value": "6-star hero rank",
      "progression_systems_to_cover": [
        "Tavern champion rank upgrades",
        "food champion leveling",
        "campaign farming for food XP"
      ],
      "xp_or_progress_sources": [
        "campaign XP on food champions",
        "brews and chickens when earned",
        "starter champion farming loop"
      ],
      "daily_repeatable_loop": [
        "level food champions",
        "rank food in Tavern",
        "return upgraded food to campaign farming"
      ],
      "priority_order": [
        "rank one campaign farmer first",
        "build 5-star food before pushing multiple projects",
        "attempt 6-star goals only after food inventory proves the route"
      ],
      "milestone_route": [
        "first 5-star checkpoint: starter champion and enough food ready",
        "three 5-stars checkpoint: food pipeline must be stable",
        "first 6-star checkpoint: five 5-star food champions required",
        "three 6-stars checkpoint: stop unless resources are already banked"
      ],
      "gates_and_unlocks": [
        "Tavern unlocked after tutorial",
        "enough duplicate or food champions",
        "silver for Tavern upgrades"
      ],
      "resource_plan": [
        "preserve low-value champions as food",
        "reserve silver for rank upgrades",
        "do not sacrifice core campaign carry champions"
      ],
      "accelerators": [
        "brews",
        "chickens",
        "XP boosts",
        "multi-battle farming"
      ],
      "what_to_ignore": [
        "ranking every rare champion",
        "gear perfection before campaign farming works",
        "summon spending without a shard task reason"
      ],
      "tables_or_checklists_needed": [
        "hero rank ladder",
        "food inventory checklist"
      ],
      "late_stage_bottlenecks": [
        "6-star rank requires a large food chain",
        "silver and champion inventory become friction",
        "multiple 6-stars inside short windows are high-risk"
      ],
      "reassessment_triggers": [
        "not enough 4-star or 5-star food by the midpoint",
        "campaign farmer cannot clear farm stage reliably",
        "early rank credits fail to track"
      ]
    }
  },
  {
    "id": "task_011",
    "task": "Make any purchase. Can be repeated daily, 1 time per 24 hours",
    "mechanics": [
      "purchase receipt proof",
      "Google Play purchase flow",
      "offer task visibility",
      "support packet"
    ],
    "route": [
      "Confirm the exact EarnLab purchase task is visible before buying.",
      "Buy only from the tracked Android game session and keep the Google Play receipt.",
      "Wait for the purchase task or earlier tracking tasks to credit before stacking additional paid tasks."
    ],
    "checkpoints": [
      "task visible before purchase",
      "receipt saved",
      "credit or pending state after purchase"
    ],
    "proof": [
      "EarnLab task screenshot before purchase",
      "Google Play receipt",
      "in-game purchase confirmation",
      "EarnLab credited or pending state"
    ],
    "stop": "Continue only after early free tasks credit and the purchase or shard source has a clear positive reason beyond speculation.",
    "progression": {
      "target_type": "purchase",
      "target_value": "purchase completion",
      "progression_systems_to_cover": [
        "offer click attribution",
        "Android install session",
        "in-game completion screen"
      ],
      "xp_or_progress_sources": [
        "tracked install",
        "tutorial and campaign battle completion",
        "purchase receipt when relevant"
      ],
      "daily_repeatable_loop": [
        "check EarnLab task state",
        "take screenshots before and after completion",
        "pause if early credit fails"
      ],
      "priority_order": [
        "start from EarnLab link",
        "finish the visible requirement",
        "wait for credit before stacking spend"
      ],
      "milestone_route": [
        "install checkpoint",
        "tutorial checkpoint",
        "20 battle checkpoint",
        "purchase proof checkpoint"
      ],
      "gates_and_unlocks": [
        "new install eligibility",
        "tutorial access",
        "Google Play receipt for purchases"
      ],
      "resource_plan": [
        "keep device and account unchanged",
        "keep receipts",
        "do not reinstall or switch devices mid-offer"
      ],
      "accelerators": [
        "stable Wi-Fi",
        "single Google Play account",
        "early screenshots"
      ],
      "what_to_ignore": [
        "VPNs",
        "alternate app stores",
        "untracked reinstall attempts"
      ],
      "tables_or_checklists_needed": [
        "tracking setup checklist",
        "evidence log plan"
      ],
      "late_stage_bottlenecks": [
        "missing early credit is a warning sign",
        "purchase tasks add support risk if early tasks did not track"
      ],
      "reassessment_triggers": [
        "install or tutorial does not credit",
        "task timer is unclear",
        "receipt name differs from offer wording"
      ]
    }
  },
  {
    "id": "task_012",
    "task": "Purchase Silver 500k pack for USD 9.99",
    "mechanics": [
      "purchase receipt proof",
      "Google Play purchase flow",
      "offer task visibility",
      "support packet"
    ],
    "route": [
      "Confirm the exact EarnLab purchase task is visible before buying.",
      "Buy only from the tracked Android game session and keep the Google Play receipt.",
      "Wait for the purchase task or earlier tracking tasks to credit before stacking additional paid tasks."
    ],
    "checkpoints": [
      "task visible before purchase",
      "receipt saved",
      "credit or pending state after purchase"
    ],
    "proof": [
      "EarnLab task screenshot before purchase",
      "Google Play receipt",
      "in-game purchase confirmation",
      "EarnLab credited or pending state"
    ],
    "stop": "Continue only after early free tasks credit and the purchase or shard source has a clear positive reason beyond speculation.",
    "progression": {
      "target_type": "purchase",
      "target_value": "purchase completion",
      "progression_systems_to_cover": [
        "offer click attribution",
        "Android install session",
        "in-game completion screen"
      ],
      "xp_or_progress_sources": [
        "tracked install",
        "tutorial and campaign battle completion",
        "purchase receipt when relevant"
      ],
      "daily_repeatable_loop": [
        "check EarnLab task state",
        "take screenshots before and after completion",
        "pause if early credit fails"
      ],
      "priority_order": [
        "start from EarnLab link",
        "finish the visible requirement",
        "wait for credit before stacking spend"
      ],
      "milestone_route": [
        "install checkpoint",
        "tutorial checkpoint",
        "20 battle checkpoint",
        "purchase proof checkpoint"
      ],
      "gates_and_unlocks": [
        "new install eligibility",
        "tutorial access",
        "Google Play receipt for purchases"
      ],
      "resource_plan": [
        "keep device and account unchanged",
        "keep receipts",
        "do not reinstall or switch devices mid-offer"
      ],
      "accelerators": [
        "stable Wi-Fi",
        "single Google Play account",
        "early screenshots"
      ],
      "what_to_ignore": [
        "VPNs",
        "alternate app stores",
        "untracked reinstall attempts"
      ],
      "tables_or_checklists_needed": [
        "tracking setup checklist",
        "evidence log plan"
      ],
      "late_stage_bottlenecks": [
        "missing early credit is a warning sign",
        "purchase tasks add support risk if early tasks did not track"
      ],
      "reassessment_triggers": [
        "install or tutorial does not credit",
        "task timer is unclear",
        "receipt name differs from offer wording"
      ]
    }
  },
  {
    "id": "task_013",
    "task": "Purchase the Daily Gem Pack for USD 9.99",
    "mechanics": [
      "purchase receipt proof",
      "Google Play purchase flow",
      "offer task visibility",
      "support packet"
    ],
    "route": [
      "Confirm the exact EarnLab purchase task is visible before buying.",
      "Buy only from the tracked Android game session and keep the Google Play receipt.",
      "Wait for the purchase task or earlier tracking tasks to credit before stacking additional paid tasks."
    ],
    "checkpoints": [
      "task visible before purchase",
      "receipt saved",
      "credit or pending state after purchase"
    ],
    "proof": [
      "EarnLab task screenshot before purchase",
      "Google Play receipt",
      "in-game purchase confirmation",
      "EarnLab credited or pending state"
    ],
    "stop": "Continue only after early free tasks credit and the purchase or shard source has a clear positive reason beyond speculation.",
    "progression": {
      "target_type": "purchase",
      "target_value": "purchase completion",
      "progression_systems_to_cover": [
        "offer click attribution",
        "Android install session",
        "in-game completion screen"
      ],
      "xp_or_progress_sources": [
        "tracked install",
        "tutorial and campaign battle completion",
        "purchase receipt when relevant"
      ],
      "daily_repeatable_loop": [
        "check EarnLab task state",
        "take screenshots before and after completion",
        "pause if early credit fails"
      ],
      "priority_order": [
        "start from EarnLab link",
        "finish the visible requirement",
        "wait for credit before stacking spend"
      ],
      "milestone_route": [
        "install checkpoint",
        "tutorial checkpoint",
        "20 battle checkpoint",
        "purchase proof checkpoint"
      ],
      "gates_and_unlocks": [
        "new install eligibility",
        "tutorial access",
        "Google Play receipt for purchases"
      ],
      "resource_plan": [
        "keep device and account unchanged",
        "keep receipts",
        "do not reinstall or switch devices mid-offer"
      ],
      "accelerators": [
        "stable Wi-Fi",
        "single Google Play account",
        "early screenshots"
      ],
      "what_to_ignore": [
        "VPNs",
        "alternate app stores",
        "untracked reinstall attempts"
      ],
      "tables_or_checklists_needed": [
        "tracking setup checklist",
        "evidence log plan"
      ],
      "late_stage_bottlenecks": [
        "missing early credit is a warning sign",
        "purchase tasks add support risk if early tasks did not track"
      ],
      "reassessment_triggers": [
        "install or tutorial does not credit",
        "task timer is unclear",
        "receipt name differs from offer wording"
      ]
    }
  },
  {
    "id": "task_014",
    "task": "Purchase a Sacred Daily Pack for USD 29.99",
    "mechanics": [
      "purchase receipt proof",
      "Google Play purchase flow",
      "offer task visibility",
      "support packet"
    ],
    "route": [
      "Confirm the exact EarnLab purchase task is visible before buying.",
      "Buy only from the tracked Android game session and keep the Google Play receipt.",
      "Wait for the purchase task or earlier tracking tasks to credit before stacking additional paid tasks."
    ],
    "checkpoints": [
      "task visible before purchase",
      "receipt saved",
      "credit or pending state after purchase"
    ],
    "proof": [
      "EarnLab task screenshot before purchase",
      "Google Play receipt",
      "in-game purchase confirmation",
      "EarnLab credited or pending state"
    ],
    "stop": "Continue only after early free tasks credit and the purchase or shard source has a clear positive reason beyond speculation.",
    "progression": {
      "target_type": "purchase",
      "target_value": "purchase completion",
      "progression_systems_to_cover": [
        "offer click attribution",
        "Android install session",
        "in-game completion screen"
      ],
      "xp_or_progress_sources": [
        "tracked install",
        "tutorial and campaign battle completion",
        "purchase receipt when relevant"
      ],
      "daily_repeatable_loop": [
        "check EarnLab task state",
        "take screenshots before and after completion",
        "pause if early credit fails"
      ],
      "priority_order": [
        "start from EarnLab link",
        "finish the visible requirement",
        "wait for credit before stacking spend"
      ],
      "milestone_route": [
        "install checkpoint",
        "tutorial checkpoint",
        "20 battle checkpoint",
        "purchase proof checkpoint"
      ],
      "gates_and_unlocks": [
        "new install eligibility",
        "tutorial access",
        "Google Play receipt for purchases"
      ],
      "resource_plan": [
        "keep device and account unchanged",
        "keep receipts",
        "do not reinstall or switch devices mid-offer"
      ],
      "accelerators": [
        "stable Wi-Fi",
        "single Google Play account",
        "early screenshots"
      ],
      "what_to_ignore": [
        "VPNs",
        "alternate app stores",
        "untracked reinstall attempts"
      ],
      "tables_or_checklists_needed": [
        "tracking setup checklist",
        "evidence log plan"
      ],
      "late_stage_bottlenecks": [
        "missing early credit is a warning sign",
        "purchase tasks add support risk if early tasks did not track"
      ],
      "reassessment_triggers": [
        "install or tutorial does not credit",
        "task timer is unclear",
        "receipt name differs from offer wording"
      ]
    }
  },
  {
    "id": "task_015",
    "task": "Purchase the Beginner Progress Pack for USD 49.99. Eligible only if purchased after Day 7",
    "mechanics": [
      "purchase receipt proof",
      "Google Play purchase flow",
      "offer task visibility",
      "support packet"
    ],
    "route": [
      "Confirm the exact EarnLab purchase task is visible before buying.",
      "Buy only from the tracked Android game session and keep the Google Play receipt.",
      "Wait for the purchase task or earlier tracking tasks to credit before stacking additional paid tasks."
    ],
    "checkpoints": [
      "task visible before purchase",
      "receipt saved",
      "credit or pending state after purchase"
    ],
    "proof": [
      "EarnLab task screenshot before purchase",
      "Google Play receipt",
      "in-game purchase confirmation",
      "EarnLab credited or pending state"
    ],
    "stop": "Continue only after early free tasks credit and the purchase or shard source has a clear positive reason beyond speculation.",
    "progression": {
      "target_type": "purchase",
      "target_value": "purchase completion",
      "progression_systems_to_cover": [
        "offer click attribution",
        "Android install session",
        "in-game completion screen"
      ],
      "xp_or_progress_sources": [
        "tracked install",
        "tutorial and campaign battle completion",
        "purchase receipt when relevant"
      ],
      "daily_repeatable_loop": [
        "check EarnLab task state",
        "take screenshots before and after completion",
        "pause if early credit fails"
      ],
      "priority_order": [
        "start from EarnLab link",
        "finish the visible requirement",
        "wait for credit before stacking spend"
      ],
      "milestone_route": [
        "install checkpoint",
        "tutorial checkpoint",
        "20 battle checkpoint",
        "purchase proof checkpoint"
      ],
      "gates_and_unlocks": [
        "new install eligibility",
        "tutorial access",
        "Google Play receipt for purchases"
      ],
      "resource_plan": [
        "keep device and account unchanged",
        "keep receipts",
        "do not reinstall or switch devices mid-offer"
      ],
      "accelerators": [
        "stable Wi-Fi",
        "single Google Play account",
        "early screenshots"
      ],
      "what_to_ignore": [
        "VPNs",
        "alternate app stores",
        "untracked reinstall attempts"
      ],
      "tables_or_checklists_needed": [
        "tracking setup checklist",
        "evidence log plan"
      ],
      "late_stage_bottlenecks": [
        "missing early credit is a warning sign",
        "purchase tasks add support risk if early tasks did not track"
      ],
      "reassessment_triggers": [
        "install or tutorial does not credit",
        "task timer is unclear",
        "receipt name differs from offer wording"
      ]
    }
  },
  {
    "id": "task_016",
    "task": "Purchase Box of Gems for USD 29.99. Eligible only if purchased after Day 30",
    "mechanics": [
      "purchase receipt proof",
      "Google Play purchase flow",
      "offer task visibility",
      "support packet"
    ],
    "route": [
      "Confirm the exact EarnLab purchase task is visible before buying.",
      "Buy only from the tracked Android game session and keep the Google Play receipt.",
      "Wait for the purchase task or earlier tracking tasks to credit before stacking additional paid tasks."
    ],
    "checkpoints": [
      "task visible before purchase",
      "receipt saved",
      "credit or pending state after purchase"
    ],
    "proof": [
      "EarnLab task screenshot before purchase",
      "Google Play receipt",
      "in-game purchase confirmation",
      "EarnLab credited or pending state"
    ],
    "stop": "Treat this as a stop-first task. Continue only if earlier tasks credited, the needed resources are already secured, and the expected cost or time still makes sense.",
    "progression": {
      "target_type": "purchase",
      "target_value": "purchase completion",
      "progression_systems_to_cover": [
        "offer click attribution",
        "Android install session",
        "in-game completion screen"
      ],
      "xp_or_progress_sources": [
        "tracked install",
        "tutorial and campaign battle completion",
        "purchase receipt when relevant"
      ],
      "daily_repeatable_loop": [
        "check EarnLab task state",
        "take screenshots before and after completion",
        "pause if early credit fails"
      ],
      "priority_order": [
        "start from EarnLab link",
        "finish the visible requirement",
        "wait for credit before stacking spend"
      ],
      "milestone_route": [
        "install checkpoint",
        "tutorial checkpoint",
        "20 battle checkpoint",
        "purchase proof checkpoint"
      ],
      "gates_and_unlocks": [
        "new install eligibility",
        "tutorial access",
        "Google Play receipt for purchases"
      ],
      "resource_plan": [
        "keep device and account unchanged",
        "keep receipts",
        "do not reinstall or switch devices mid-offer"
      ],
      "accelerators": [
        "stable Wi-Fi",
        "single Google Play account",
        "early screenshots"
      ],
      "what_to_ignore": [
        "VPNs",
        "alternate app stores",
        "untracked reinstall attempts"
      ],
      "tables_or_checklists_needed": [
        "tracking setup checklist",
        "evidence log plan"
      ],
      "late_stage_bottlenecks": [
        "missing early credit is a warning sign",
        "purchase tasks add support risk if early tasks did not track"
      ],
      "reassessment_triggers": [
        "install or tutorial does not credit",
        "task timer is unclear",
        "receipt name differs from offer wording"
      ]
    }
  },
  {
    "id": "task_017",
    "task": "Open 2 Sacred / Yellow Shards",
    "mechanics": [
      "Portal shard opening",
      "Sacred Shard inventory proof",
      "random reward model",
      "paid pack timing"
    ],
    "route": [
      "Verify the task asks for Sacred or Yellow Shards, not Ancient, Void, or Mystery Shards.",
      "Document the shard inventory before opening and the Portal result after opening.",
      "Do not chase later shard tiers unless the earlier Sacred Shard tier credited and the shard source is already secured."
    ],
    "checkpoints": [
      "shard count before opening",
      "tier credit after opening",
      "remaining shard source identified"
    ],
    "proof": [
      "Sacred Shard inventory before opening",
      "Portal screen after opening",
      "EarnLab task state",
      "timestamped account profile"
    ],
    "stop": "Continue only after early free tasks credit and the purchase or shard source has a clear positive reason beyond speculation.",
    "progression": {
      "target_type": "collection",
      "target_value": "2 Sacred / Yellow Shards",
      "progression_systems_to_cover": [
        "Portal shard opening",
        "Sacred Shard inventory proof",
        "paid pack timing"
      ],
      "xp_or_progress_sources": [
        "purchased Sacred packs",
        "earned one-time game rewards when available",
        "event or login rewards only if visible in the account"
      ],
      "daily_repeatable_loop": [
        "check shard inventory",
        "document source of each Sacred Shard",
        "open shards only when the offer task is visible and tracking is healthy"
      ],
      "priority_order": [
        "prove the first two opens before chasing four",
        "avoid six and eight unless shards are already secured",
        "do not buy random packs hoping for enough Sacred Shards"
      ],
      "milestone_route": [
        "2 Sacred Shards: possible through a targeted paid or earned source",
        "4 Sacred Shards: reassess cost and evidence",
        "6 Sacred Shards: high risk without confirmed inventory",
        "8 Sacred Shards: stop unless the net economics and tracking history are strong"
      ],
      "gates_and_unlocks": [
        "Portal access",
        "Sacred Shard inventory",
        "offer task visibility"
      ],
      "resource_plan": [
        "record each shard source",
        "avoid mystery or ancient shard detours",
        "keep screenshots before and after every open"
      ],
      "accelerators": [
        "targeted Sacred packs",
        "visible event rewards",
        "campaign or mission reward only when already reachable"
      ],
      "what_to_ignore": [
        "non-Sacred shards",
        "legendary pull odds",
        "champion chase detours"
      ],
      "tables_or_checklists_needed": [
        "Sacred Shard random reward model",
        "purchase economics table"
      ],
      "late_stage_bottlenecks": [
        "Sacred Shards are scarce",
        "paid sources can exceed the listed payout",
        "random rewards do not guarantee tracking credit"
      ],
      "reassessment_triggers": [
        "task does not credit after the first shard tier",
        "required shards would need unplanned purchases",
        "support proof is incomplete"
      ]
    }
  },
  {
    "id": "task_018",
    "task": "Open 4 Sacred / Yellow Shards",
    "mechanics": [
      "Portal shard opening",
      "Sacred Shard inventory proof",
      "random reward model",
      "paid pack timing"
    ],
    "route": [
      "Verify the task asks for Sacred or Yellow Shards, not Ancient, Void, or Mystery Shards.",
      "Document the shard inventory before opening and the Portal result after opening.",
      "Do not chase later shard tiers unless the earlier Sacred Shard tier credited and the shard source is already secured."
    ],
    "checkpoints": [
      "shard count before opening",
      "tier credit after opening",
      "remaining shard source identified"
    ],
    "proof": [
      "Sacred Shard inventory before opening",
      "Portal screen after opening",
      "EarnLab task state",
      "timestamped account profile"
    ],
    "stop": "Continue only after early free tasks credit and the purchase or shard source has a clear positive reason beyond speculation.",
    "progression": {
      "target_type": "collection",
      "target_value": "4 Sacred / Yellow Shards",
      "progression_systems_to_cover": [
        "Portal shard opening",
        "Sacred Shard inventory proof",
        "paid pack timing"
      ],
      "xp_or_progress_sources": [
        "purchased Sacred packs",
        "earned one-time game rewards when available",
        "event or login rewards only if visible in the account"
      ],
      "daily_repeatable_loop": [
        "check shard inventory",
        "document source of each Sacred Shard",
        "open shards only when the offer task is visible and tracking is healthy"
      ],
      "priority_order": [
        "prove the first two opens before chasing four",
        "avoid six and eight unless shards are already secured",
        "do not buy random packs hoping for enough Sacred Shards"
      ],
      "milestone_route": [
        "2 Sacred Shards: possible through a targeted paid or earned source",
        "4 Sacred Shards: reassess cost and evidence",
        "6 Sacred Shards: high risk without confirmed inventory",
        "8 Sacred Shards: stop unless the net economics and tracking history are strong"
      ],
      "gates_and_unlocks": [
        "Portal access",
        "Sacred Shard inventory",
        "offer task visibility"
      ],
      "resource_plan": [
        "record each shard source",
        "avoid mystery or ancient shard detours",
        "keep screenshots before and after every open"
      ],
      "accelerators": [
        "targeted Sacred packs",
        "visible event rewards",
        "campaign or mission reward only when already reachable"
      ],
      "what_to_ignore": [
        "non-Sacred shards",
        "legendary pull odds",
        "champion chase detours"
      ],
      "tables_or_checklists_needed": [
        "Sacred Shard random reward model",
        "purchase economics table"
      ],
      "late_stage_bottlenecks": [
        "Sacred Shards are scarce",
        "paid sources can exceed the listed payout",
        "random rewards do not guarantee tracking credit"
      ],
      "reassessment_triggers": [
        "task does not credit after the first shard tier",
        "required shards would need unplanned purchases",
        "support proof is incomplete"
      ]
    }
  },
  {
    "id": "task_019",
    "task": "Open 6 Sacred / Yellow Shards",
    "mechanics": [
      "Portal shard opening",
      "Sacred Shard inventory proof",
      "random reward model",
      "paid pack timing"
    ],
    "route": [
      "Verify the task asks for Sacred or Yellow Shards, not Ancient, Void, or Mystery Shards.",
      "Document the shard inventory before opening and the Portal result after opening.",
      "Do not chase later shard tiers unless the earlier Sacred Shard tier credited and the shard source is already secured."
    ],
    "checkpoints": [
      "shard count before opening",
      "tier credit after opening",
      "remaining shard source identified"
    ],
    "proof": [
      "Sacred Shard inventory before opening",
      "Portal screen after opening",
      "EarnLab task state",
      "timestamped account profile"
    ],
    "stop": "Treat this as a stop-first task. Continue only if earlier tasks credited, the needed resources are already secured, and the expected cost or time still makes sense.",
    "progression": {
      "target_type": "collection",
      "target_value": "6 Sacred / Yellow Shards",
      "progression_systems_to_cover": [
        "Portal shard opening",
        "Sacred Shard inventory proof",
        "paid pack timing"
      ],
      "xp_or_progress_sources": [
        "purchased Sacred packs",
        "earned one-time game rewards when available",
        "event or login rewards only if visible in the account"
      ],
      "daily_repeatable_loop": [
        "check shard inventory",
        "document source of each Sacred Shard",
        "open shards only when the offer task is visible and tracking is healthy"
      ],
      "priority_order": [
        "prove the first two opens before chasing four",
        "avoid six and eight unless shards are already secured",
        "do not buy random packs hoping for enough Sacred Shards"
      ],
      "milestone_route": [
        "2 Sacred Shards: possible through a targeted paid or earned source",
        "4 Sacred Shards: reassess cost and evidence",
        "6 Sacred Shards: high risk without confirmed inventory",
        "8 Sacred Shards: stop unless the net economics and tracking history are strong"
      ],
      "gates_and_unlocks": [
        "Portal access",
        "Sacred Shard inventory",
        "offer task visibility"
      ],
      "resource_plan": [
        "record each shard source",
        "avoid mystery or ancient shard detours",
        "keep screenshots before and after every open"
      ],
      "accelerators": [
        "targeted Sacred packs",
        "visible event rewards",
        "campaign or mission reward only when already reachable"
      ],
      "what_to_ignore": [
        "non-Sacred shards",
        "legendary pull odds",
        "champion chase detours"
      ],
      "tables_or_checklists_needed": [
        "Sacred Shard random reward model",
        "purchase economics table"
      ],
      "late_stage_bottlenecks": [
        "Sacred Shards are scarce",
        "paid sources can exceed the listed payout",
        "random rewards do not guarantee tracking credit"
      ],
      "reassessment_triggers": [
        "task does not credit after the first shard tier",
        "required shards would need unplanned purchases",
        "support proof is incomplete"
      ]
    }
  },
  {
    "id": "task_020",
    "task": "Open 8 Sacred / Yellow Shards",
    "mechanics": [
      "Portal shard opening",
      "Sacred Shard inventory proof",
      "random reward model",
      "paid pack timing"
    ],
    "route": [
      "Verify the task asks for Sacred or Yellow Shards, not Ancient, Void, or Mystery Shards.",
      "Document the shard inventory before opening and the Portal result after opening.",
      "Do not chase later shard tiers unless the earlier Sacred Shard tier credited and the shard source is already secured."
    ],
    "checkpoints": [
      "shard count before opening",
      "tier credit after opening",
      "remaining shard source identified"
    ],
    "proof": [
      "Sacred Shard inventory before opening",
      "Portal screen after opening",
      "EarnLab task state",
      "timestamped account profile"
    ],
    "stop": "Treat this as a stop-first task. Continue only if earlier tasks credited, the needed resources are already secured, and the expected cost or time still makes sense.",
    "progression": {
      "target_type": "collection",
      "target_value": "8 Sacred / Yellow Shards",
      "progression_systems_to_cover": [
        "Portal shard opening",
        "Sacred Shard inventory proof",
        "paid pack timing"
      ],
      "xp_or_progress_sources": [
        "purchased Sacred packs",
        "earned one-time game rewards when available",
        "event or login rewards only if visible in the account"
      ],
      "daily_repeatable_loop": [
        "check shard inventory",
        "document source of each Sacred Shard",
        "open shards only when the offer task is visible and tracking is healthy"
      ],
      "priority_order": [
        "prove the first two opens before chasing four",
        "avoid six and eight unless shards are already secured",
        "do not buy random packs hoping for enough Sacred Shards"
      ],
      "milestone_route": [
        "2 Sacred Shards: possible through a targeted paid or earned source",
        "4 Sacred Shards: reassess cost and evidence",
        "6 Sacred Shards: high risk without confirmed inventory",
        "8 Sacred Shards: stop unless the net economics and tracking history are strong"
      ],
      "gates_and_unlocks": [
        "Portal access",
        "Sacred Shard inventory",
        "offer task visibility"
      ],
      "resource_plan": [
        "record each shard source",
        "avoid mystery or ancient shard detours",
        "keep screenshots before and after every open"
      ],
      "accelerators": [
        "targeted Sacred packs",
        "visible event rewards",
        "campaign or mission reward only when already reachable"
      ],
      "what_to_ignore": [
        "non-Sacred shards",
        "legendary pull odds",
        "champion chase detours"
      ],
      "tables_or_checklists_needed": [
        "Sacred Shard random reward model",
        "purchase economics table"
      ],
      "late_stage_bottlenecks": [
        "Sacred Shards are scarce",
        "paid sources can exceed the listed payout",
        "random rewards do not guarantee tracking credit"
      ],
      "reassessment_triggers": [
        "task does not credit after the first shard tier",
        "required shards would need unplanned purchases",
        "support proof is incomplete"
      ]
    }
  },
  {
    "id": "task_021",
    "task": "Reach Level 50 within 21 days",
    "mechanics": [
      "account level progression",
      "Campaign farming for account XP",
      "energy refill timing",
      "daily quests and mission rewards"
    ],
    "route": [
      "Farm campaign stages while completing daily quests and missions so account XP rises with useful hero progress.",
      "Compare the level target against the milestone matrix, then continue only when the daily checkpoint is on pace.",
      "Keep a screenshot of the profile level before and after the target credits."
    ],
    "checkpoints": [
      "profile level or battle count",
      "daily progress pace",
      "EarnLab credit state"
    ],
    "proof": [
      "account profile level screen",
      "campaign progress screen",
      "daily quest completion if used",
      "EarnLab task state"
    ],
    "stop": "Continue while tracking is healthy and the deadline checkpoint is on pace; reassess immediately if early credit fails.",
    "progression": {
      "target_type": "account_level",
      "target_value": "50",
      "progression_systems_to_cover": [
        "Campaign farming for account XP",
        "daily quests and mission rewards",
        "energy refill timing and XP boosts"
      ],
      "xp_or_progress_sources": [
        "Campaign stage clears",
        "daily and weekly missions",
        "login rewards, event rewards, and energy refills"
      ],
      "daily_repeatable_loop": [
        "spend energy on campaign stages",
        "claim daily quests and missions",
        "upgrade starter champion and food while account XP rises"
      ],
      "priority_order": [
        "clear tutorial and campaign unlocks",
        "farm the highest reliable campaign stage",
        "use multi-battle only after screenshots and tracking checks"
      ],
      "milestone_route": [
        "Level 15 checkpoint: tutorial, campaign farming, and first daily loop complete",
        "Level 30 checkpoint: early progression is still fast but requires consistent energy use",
        "Level 50 checkpoint: continue only if several 5-star and 6-star rank tasks are also moving",
        "Level 60 checkpoint: reassess if progress has slowed below a daily level target",
        "Level 70 checkpoint: stop for most players unless already far ahead with strong tracked progress"
      ],
      "gates_and_unlocks": [
        "campaign access",
        "tavern access",
        "daily quests",
        "energy refills"
      ],
      "resource_plan": [
        "save gems for energy only when the payout band justifies it",
        "avoid spending premium currency on summons before the shard plan is clear",
        "keep screenshots at each level milestone"
      ],
      "accelerators": [
        "XP boosts",
        "multi-battle",
        "campaign farming",
        "daily missions"
      ],
      "what_to_ignore": [
        "arena optimization",
        "deep gear min-maxing",
        "champion collection detours that do not improve campaign clears"
      ],
      "tables_or_checklists_needed": [
        "milestone matrix",
        "daily route checklist"
      ],
      "late_stage_bottlenecks": [
        "account XP slows sharply after early levels",
        "energy becomes the limiting input",
        "Level 60 and Level 70 are late goals with high time risk"
      ],
      "reassessment_triggers": [
        "missed deadline checkpoint",
        "no tracking credit on early tasks",
        "energy shortage without overlapping rank progress"
      ]
    }
  },
  {
    "id": "task_022",
    "task": "Reach Level 60 within 35 days",
    "mechanics": [
      "account level progression",
      "Campaign farming for account XP",
      "energy refill timing",
      "daily quests and mission rewards"
    ],
    "route": [
      "Farm campaign stages while completing daily quests and missions so account XP rises with useful hero progress.",
      "Compare the level target against the milestone matrix, then continue only when the daily checkpoint is on pace.",
      "Keep a screenshot of the profile level before and after the target credits."
    ],
    "checkpoints": [
      "profile level or battle count",
      "daily progress pace",
      "EarnLab credit state"
    ],
    "proof": [
      "account profile level screen",
      "campaign progress screen",
      "daily quest completion if used",
      "EarnLab task state"
    ],
    "stop": "Treat this as a stop-first task. Continue only if earlier tasks credited, the needed resources are already secured, and the expected cost or time still makes sense.",
    "progression": {
      "target_type": "account_level",
      "target_value": "60",
      "progression_systems_to_cover": [
        "Campaign farming for account XP",
        "daily quests and mission rewards",
        "energy refill timing and XP boosts"
      ],
      "xp_or_progress_sources": [
        "Campaign stage clears",
        "daily and weekly missions",
        "login rewards, event rewards, and energy refills"
      ],
      "daily_repeatable_loop": [
        "spend energy on campaign stages",
        "claim daily quests and missions",
        "upgrade starter champion and food while account XP rises"
      ],
      "priority_order": [
        "clear tutorial and campaign unlocks",
        "farm the highest reliable campaign stage",
        "use multi-battle only after screenshots and tracking checks"
      ],
      "milestone_route": [
        "Level 15 checkpoint: tutorial, campaign farming, and first daily loop complete",
        "Level 30 checkpoint: early progression is still fast but requires consistent energy use",
        "Level 50 checkpoint: continue only if several 5-star and 6-star rank tasks are also moving",
        "Level 60 checkpoint: reassess if progress has slowed below a daily level target",
        "Level 70 checkpoint: stop for most players unless already far ahead with strong tracked progress"
      ],
      "gates_and_unlocks": [
        "campaign access",
        "tavern access",
        "daily quests",
        "energy refills"
      ],
      "resource_plan": [
        "save gems for energy only when the payout band justifies it",
        "avoid spending premium currency on summons before the shard plan is clear",
        "keep screenshots at each level milestone"
      ],
      "accelerators": [
        "XP boosts",
        "multi-battle",
        "campaign farming",
        "daily missions"
      ],
      "what_to_ignore": [
        "arena optimization",
        "deep gear min-maxing",
        "champion collection detours that do not improve campaign clears"
      ],
      "tables_or_checklists_needed": [
        "milestone matrix",
        "daily route checklist"
      ],
      "late_stage_bottlenecks": [
        "account XP slows sharply after early levels",
        "energy becomes the limiting input",
        "Level 60 and Level 70 are late goals with high time risk"
      ],
      "reassessment_triggers": [
        "missed deadline checkpoint",
        "no tracking credit on early tasks",
        "energy shortage without overlapping rank progress"
      ]
    }
  },
  {
    "id": "task_023",
    "task": "Reach Level 70 within 60 days",
    "mechanics": [
      "account level progression",
      "Campaign farming for account XP",
      "energy refill timing",
      "daily quests and mission rewards"
    ],
    "route": [
      "Farm campaign stages while completing daily quests and missions so account XP rises with useful hero progress.",
      "Compare the level target against the milestone matrix, then continue only when the daily checkpoint is on pace.",
      "Keep a screenshot of the profile level before and after the target credits."
    ],
    "checkpoints": [
      "profile level or battle count",
      "daily progress pace",
      "EarnLab credit state"
    ],
    "proof": [
      "account profile level screen",
      "campaign progress screen",
      "daily quest completion if used",
      "EarnLab task state"
    ],
    "stop": "Treat this as a stop-first task. Continue only if earlier tasks credited, the needed resources are already secured, and the expected cost or time still makes sense.",
    "progression": {
      "target_type": "account_level",
      "target_value": "70",
      "progression_systems_to_cover": [
        "Campaign farming for account XP",
        "daily quests and mission rewards",
        "energy refill timing and XP boosts"
      ],
      "xp_or_progress_sources": [
        "Campaign stage clears",
        "daily and weekly missions",
        "login rewards, event rewards, and energy refills"
      ],
      "daily_repeatable_loop": [
        "spend energy on campaign stages",
        "claim daily quests and missions",
        "upgrade starter champion and food while account XP rises"
      ],
      "priority_order": [
        "clear tutorial and campaign unlocks",
        "farm the highest reliable campaign stage",
        "use multi-battle only after screenshots and tracking checks"
      ],
      "milestone_route": [
        "Level 15 checkpoint: tutorial, campaign farming, and first daily loop complete",
        "Level 30 checkpoint: early progression is still fast but requires consistent energy use",
        "Level 50 checkpoint: continue only if several 5-star and 6-star rank tasks are also moving",
        "Level 60 checkpoint: reassess if progress has slowed below a daily level target",
        "Level 70 checkpoint: stop for most players unless already far ahead with strong tracked progress"
      ],
      "gates_and_unlocks": [
        "campaign access",
        "tavern access",
        "daily quests",
        "energy refills"
      ],
      "resource_plan": [
        "save gems for energy only when the payout band justifies it",
        "avoid spending premium currency on summons before the shard plan is clear",
        "keep screenshots at each level milestone"
      ],
      "accelerators": [
        "XP boosts",
        "multi-battle",
        "campaign farming",
        "daily missions"
      ],
      "what_to_ignore": [
        "arena optimization",
        "deep gear min-maxing",
        "champion collection detours that do not improve campaign clears"
      ],
      "tables_or_checklists_needed": [
        "milestone matrix",
        "daily route checklist"
      ],
      "late_stage_bottlenecks": [
        "account XP slows sharply after early levels",
        "energy becomes the limiting input",
        "Level 60 and Level 70 are late goals with high time risk"
      ],
      "reassessment_triggers": [
        "missed deadline checkpoint",
        "no tracking credit on early tasks",
        "energy shortage without overlapping rank progress"
      ]
    }
  }
] as const;
const sourceLog = [
  {
    "source_id": "src_002",
    "source_type": "app_store",
    "title": "Google Play Raid: Shadow Legends",
    "url": "https://play.google.com/store/apps/details?id=com.plarium.raidlegends",
    "captured_date": "2026-05-31",
    "notes": "Android availability and publisher."
  },
  {
    "source_id": "src_003",
    "source_type": "publisher_support",
    "title": "Raid support: The Tavern",
    "url": "https://raid-support.plarium.com/hc/en-us/articles/360014648380-The-Tavern",
    "captured_date": "2026-05-31",
    "notes": "Champion development and rank path."
  },
  {
    "source_id": "src_004",
    "source_type": "publisher_support",
    "title": "Raid support: Shards",
    "url": "https://raid-support.plarium.com/hc/en-us/articles/360014657020-Guide-Shards",
    "captured_date": "2026-05-31",
    "notes": "Shard terminology and Portal model."
  },
  {
    "source_id": "src_005",
    "source_type": "publisher_support",
    "title": "Raid support: Multi-Battle",
    "url": "https://raid-support.plarium.com/hc/en-us/articles/360014658840-Guide-Multi-Battle",
    "captured_date": "2026-05-31",
    "notes": "Repeated farming feature."
  },
  {
    "source_id": "src_006",
    "source_type": "offerwall_support",
    "title": "EarnLab missing offer tracking help",
    "url": "https://help.earnlab.com/en/article/my-offer-didnt-track-what-should-i-do-osd5a1/",
    "captured_date": "2026-05-31",
    "notes": "Support workflow reference."
  }
] as const;

const navSections = [
    ["Snapshot", "offer-snapshot-and-realistic-payout-bands"],
    ["Task table", "full-canonical-task-table"],
    ["Tracking", "tracking-setup-and-eligibility"],
    ["Evidence", "evidence-log-plan"],
    ["Systems", "game-systems-that-actually-move-task-progress"],
    ["Archetypes", "task-archetype-map"],
    ["Mechanics", "mechanic-dossiers"],
    ["Milestones", "milestone-matrix"],
    ["Day route", "day-by-day-route-with-continue-reassess-stop-rules"],
    ["Task route", "guided-task-by-task-route"],
    ["Purchases", "purchase-economics-table"],
    ["Sacred Shards", "sacred-shard-random-reward-model"],
    ["Support", "support-state-model"],
    ["FAQ", "faq"],
] as const;

const faqItems = [
    {
        question: "Is the Raid Shadow Legends EarnLab offer worth it?",
        answer:
            "It is worth testing through the early free tasks if you are eligible. It is worth grinding only if Level 30, early 5-star tasks, and tracking are all healthy. It is not worth treating the 372.72 rounded headline value as realistic for a normal user.",
    },
    {
        question: "Should I buy packs for the EarnLab tasks?",
        answer:
            "Only after early tracking credits and only when the exact purchase task is visible. The Silver 500k and Daily Gem Pack rows have small listed spreads before tax. The Sacred Daily Pack and Beginner Progress Pack are negative before tax unless they support another goal. The Day 30 Box of Gems has timing risk.",
    },
    {
        question: "Do Sacred Shard tasks require a specific champion?",
        answer:
            "No. The measurable task is opening Sacred or Yellow Shards. The champion result is random, and the guide treats it as irrelevant to payout strategy. The proof focus is inventory before opening, Portal result after opening, and EarnLab tier state.",
    },
    {
        question: "What is the difference between hero stars and champion level?",
        answer:
            "The offer says hero, while Raid often says champion. A 5-star or 6-star task is about rank shown through the Tavern and roster star count, not simply leveling a champion to a numeric level.",
    },
    {
        question: "When should I stop chasing Level 70?",
        answer:
            "Stop unless you are already close, earlier tasks credited cleanly, and the remaining daily account XP path does not require speculative spend. Level 70 within 60 days has the largest listed payout, but it is also a long-window tracking and time-risk task.",
    },
    {
        question: "What proof should I keep if credit is missing?",
        answer:
            "Keep the EarnLab task page, install path, player ID, completion screen, task state, timestamps, and receipts for paid tasks. Missing-credit support is much weaker if you cannot show the task before completion and the game state after completion.",
    },
] as const;

const dayRoute = [
    {
        label: "Day 0",
        copy:
            "Start from EarnLab, install on Android, finish Register and start playing the game, Complete the tutorial, and Fight 20 Battles within 24 Hours.",
        continueRule: "Continue if the install path is clean and the first task states look normal.",
        reassessRule: "Reassess if nothing appears after a normal tracking wait.",
        stopRule: "Stop before spend if install or tutorial never tracks.",
    },
    {
        label: "Days 1 to 3",
        copy:
            "Push campaign farming, daily quests, and first Tavern upgrades for Reach level 15 within 3 Days and Upgrade a hero to 5 stars within 3 days.",
        continueRule: "Continue if campaign clears are reliable and the first 5-star proof is clean.",
        reassessRule: "Reassess if food champions or silver are already short.",
        stopRule: "Stop if you would need a purchase just to rescue the early 5-star deadline.",
    },
    {
        label: "Days 3 to 5",
        copy:
            "Focus on Reach Level 30 within 4 days and Upgrade 3 heroes to 5 stars within 5 days.",
        continueRule: "Continue if Level 30 and three 5-stars overlap naturally through campaign farming.",
        reassessRule: "Reassess if the account can level but the food pipeline is weak.",
        stopRule: "Stop rank expansion if three 5-stars would consume your campaign carry or require unplanned pack buying.",
    },
    {
        label: "Days 6 to 14",
        copy:
            "Move only overlapping goals: Upgrade a hero to 6 stars within 10 days and Upgrade 5 heroes to 5 stars within 14 days.",
        continueRule: "Continue if a 6-star food chain is already visible.",
        reassessRule: "Reassess if the first 6-star is not close by the midpoint.",
        stopRule: "Stop before buying resources unless earlier paid and free tasks have credited.",
    },
    {
        label: "Days 15 to 21",
        copy:
            "Evaluate Upgrade 3 heroes to 6 stars within 21 days and Reach Level 50 within 21 days together.",
        continueRule: "Continue if campaign farming raises account XP while food levels.",
        reassessRule: "Reassess if energy or silver shortage blocks daily farming.",
        stopRule: "Stop before buying resources to rescue a missed rank deadline.",
    },
    {
        label: "Days 22 to 35",
        copy:
            "Reach Level 60 within 35 days and the after Day 30 purchase task are tracking-exposure goals.",
        continueRule: "Continue only with a clean credit history and consistent daily account XP.",
        reassessRule: "Reassess if each daily loop produces too little level progress.",
        stopRule: "Stop if Level 60 requires buying energy or packs just to chase listed payout.",
    },
    {
        label: "Days 36 to 60",
        copy:
            "Reach Level 70 within 60 days is the largest listed payout and the least casual target.",
        continueRule: "Continue only if you are already close, have no support gaps, and can finish without new speculative spend.",
        reassessRule: "Reassess if progress falls behind the daily level pace.",
        stopRule: "For most users, close the offer rather than chase Level 70.",
    },
] as const;

type IconComponent = ComponentType<{ className?: string }>;

const systemIcons: IconComponent[] = [Gamepad2, Star, Coins, Sparkles, Receipt];
const totalPoints = taskRows.reduce((sum, task) => sum + task.points, 0);
const totalValue = totalPoints / 1000;

function formatPoints(value: number) {
    return value.toLocaleString("en-US");
}

function formatValue(value: number) {
    return value.toFixed(2);
}

function JsonLd() {
    const jsonLd = [
        {
            "@context": "https://schema.org",
            "@type": "Article",
            headline: TITLE,
            description: DESCRIPTION,
            dateModified: LAST_UPDATED,
            mainEntityOfPage: PAGE_URL,
            author: {
                "@type": "Organization",
                name: "EarnGrind",
            },
        },
        {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
                { "@type": "ListItem", position: 1, name: "EarnGrind", item: absoluteUrl("/") },
                { "@type": "ListItem", position: 2, name: "Guides", item: absoluteUrl("/guides") },
                { "@type": "ListItem", position: 3, name: TITLE, item: PAGE_URL },
            ],
        },
        {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqItems.map((item) => ({
                "@type": "Question",
                name: item.question,
                acceptedAnswer: {
                    "@type": "Answer",
                    text: item.answer,
                },
            })),
        },
    ];

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
    );
}

function SectionHeading({
    eyebrow,
    title,
    children,
}: {
    eyebrow: string;
    title: string;
    children?: ReactNode;
}) {
    return (
        <div className="mb-5">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">{eyebrow}</p>
            <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-950 md:text-3xl">{title}</h2>
            {children ? <div className="mt-3 max-w-3xl text-base leading-7 text-slate-700">{children}</div> : null}
        </div>
    );
}

function ModelSection({
    id,
    eyebrow,
    title,
    children,
}: {
    id: string;
    eyebrow: string;
    title: string;
    children: ReactNode;
}) {
    return (
        <section id={id} className="min-w-0 scroll-mt-24 border-t border-slate-200 py-10">
            <SectionHeading eyebrow={eyebrow} title={title} />
            {children}
        </section>
    );
}

function TableShell({ children }: { children: ReactNode }) {
    return (
        <div className="w-full max-w-full overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
            <table className="w-full table-fixed divide-y divide-slate-200 text-left text-sm">
                {children}
            </table>
        </div>
    );
}

function Th({ children }: { children: ReactNode }) {
    return <th className="break-words bg-slate-50 px-4 py-3 font-bold text-slate-800">{children}</th>;
}

function Td({ children, className = "" }: { children: ReactNode; className?: string }) {
    return <td className={`break-words align-top px-4 py-4 text-slate-700 ${className}`}>{children}</td>;
}

function List({ items }: { items: readonly string[] }) {
    return (
        <ul className="space-y-1.5">
            {items.map((item) => (
                <li key={item} className="leading-6">{item}</li>
            ))}
        </ul>
    );
}

function Metric({ label, value, icon: Icon }: { label: string; value: string; icon: IconComponent }) {
    return (
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-md bg-emerald-50 text-emerald-700">
                    <Icon className="h-5 w-5" />
                </span>
                <div>
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">{label}</p>
                    <p className="mt-1 text-xl font-extrabold text-slate-950">{value}</p>
                </div>
            </div>
        </div>
    );
}

function StatusBadge({ children }: { children: ReactNode }) {
    return (
        <span className="inline-flex rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-emerald-800">
            {children}
        </span>
    );
}

export default function RaidShadowLegendsEarnlabOfferGuidePage() {
    return (
        <>
            <JsonLd />
            <main className="overflow-x-hidden bg-slate-50 text-slate-900">
                <section className="border-b border-slate-200 bg-white">
                    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                        <nav className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-600" aria-label="Breadcrumb">
                            <Link href="/" className="hover:text-slate-950">EarnGrind</Link>
                            <span>/</span>
                            <Link href="/guides" className="hover:text-slate-950">Guides</Link>
                            <span>/</span>
                            <span className="text-slate-950">Raid Shadow Legends EarnLab</span>
                        </nav>
                    </div>
                </section>

                <section className="bg-slate-950 text-white">
                    <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1.35fr_0.65fr] lg:px-8">
                        <div>
                            <p className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-300">EarnLab Android operator memo</p>
                            <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-tight md:text-6xl">
                                Raid Shadow Legends EarnLab Offer Guide
                            </h1>
                            <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-200">
                                A professional route for US Android users who have not installed Raid before. The task list totals {formatValue(totalValue)} in rounded listed payout, but the practical route is tracking first, grind second, and spend only after proof.
                            </p>
                            <div className="mt-6 flex flex-wrap gap-3 text-sm font-bold">
                                <StatusBadge>Content QA passed</StatusBadge>
                                <StatusBadge>{formatPoints(totalPoints)} points</StatusBadge>
                                <StatusBadge>Last updated {LAST_UPDATED}</StatusBadge>
                            </div>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                            <Metric label="Provider" value="EarnLab" icon={ShieldCheck} />
                            <Metric label="Device" value="Android" icon={Gamepad2} />
                            <Metric label="Listed value" value={formatValue(totalValue)} icon={Coins} />
                        </div>
                    </div>
                </section>

                <nav className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur" aria-label="Guide sections">
                    <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 py-3 sm:px-6 lg:px-8">
                        {navSections.map(([label, id]) => (
                            <a
                                key={id}
                                href={`#${id}`}
                                className="whitespace-nowrap rounded-md border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800"
                            >
                                {label}
                            </a>
                        ))}
                    </div>
                </nav>

                <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
                    <ModelSection
                        id="offer-snapshot-and-realistic-payout-bands"
                        eyebrow="Snapshot"
                        title="Offer Snapshot And Realistic Payout Bands"
                    >
                        <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
                            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                                <p className="text-base leading-7 text-slate-700">
                                    Provider: EarnLab. Country: United States. Device: Android. Payout source: task list. Deadline source: task list. Target user: new Raid: Shadow Legends Android player.
                                </p>
                                <p className="mt-4 text-base leading-7 text-slate-700">
                                    The useful way to read this offer is not as one giant payout. The safe free band tests attribution, the active grind band tests campaign and Tavern pace, the low spend band requires clean proof, and the high-risk band is stop-first for most readers.
                                </p>
                            </div>
                            <TableShell>
                                <thead>
                                    <tr>
                                        <Th>Band</Th>
                                        <Th>Tasks</Th>
                                        <Th>Listed reward value</Th>
                                        <Th>Main risk</Th>
                                        <Th>Continue / reassess / stop</Th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {riskBands.map((band) => (
                                        <tr key={band.band}>
                                            <Td className="font-bold text-slate-950">{band.band}</Td>
                                            <Td>{band.task_ids.join(", ")}</Td>
                                            <Td>{band.listed_reward_value}</Td>
                                            <Td>{band.main_tracking_support_risk}</Td>
                                            <Td>{band.continue_reassess_stop_rule}</Td>
                                        </tr>
                                    ))}
                                </tbody>
                            </TableShell>
                        </div>
                    </ModelSection>

                    <ModelSection id="full-canonical-task-table" eyebrow="Tasks" title="Full Canonical Task Table">
                        <p className="mb-5 max-w-3xl text-base leading-7 text-slate-700">
                            Exact task wording is preserved here. Purchase rows use USD notation for store prices so the task price is not confused with the EarnLab payout value.
                        </p>
                        <TableShell>
                            <thead>
                                <tr>
                                    <Th>ID</Th>
                                    <Th>Canonical task wording</Th>
                                    <Th>Points</Th>
                                    <Th>Approx value</Th>
                                    <Th>Deadline</Th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {taskRows.map((task) => (
                                    <tr key={task.id}>
                                        <Td className="font-bold text-slate-950">{task.id}</Td>
                                        <Td>{task.task}</Td>
                                        <Td>{formatPoints(task.points)}</Td>
                                        <Td>{formatValue(task.value)}</Td>
                                        <Td>{task.deadline}</Td>
                                    </tr>
                                ))}
                            </tbody>
                        </TableShell>
                    </ModelSection>

                    <ModelSection id="tracking-setup-and-eligibility" eyebrow="Tracking" title="Tracking Setup And Eligibility">
                        <div className="grid gap-5 md:grid-cols-3">
                            {[
                                "Start from the EarnLab offer page on the Android device that will finish the tasks.",
                                "Do not install from Google Play first, use a VPN, switch devices, or reuse an old Raid account.",
                                "Use the first three tasks as the attribution audit before any purchase or Sacred Shard chase.",
                            ].map((item) => (
                                <div key={item} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                                    <CheckCircle2 className="h-5 w-5 text-emerald-700" />
                                    <p className="mt-3 text-sm leading-6 text-slate-700">{item}</p>
                                </div>
                            ))}
                        </div>
                    </ModelSection>

                    <ModelSection id="evidence-log-plan" eyebrow="Proof" title="Evidence Log Plan">
                        <div className="grid gap-5 md:grid-cols-3">
                            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                                <h3 className="font-extrabold text-slate-950">Offer proof</h3>
                                <List items={["EarnLab offer page before install", "canonical task table with deadlines", "credited, pending, or missing state after each task"]} />
                            </div>
                            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                                <h3 className="font-extrabold text-slate-950">Game proof</h3>
                                <List items={["account profile level", "Tavern rank screens", "Sacred Shard inventory and Portal opening", "purchase delivery screens"]} />
                            </div>
                            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                                <h3 className="font-extrabold text-slate-950">Support proof</h3>
                                <List items={["Android device model", "Raid player ID", "Google Play receipts for paid tasks", "timestamps and screenshots in order"]} />
                            </div>
                        </div>
                    </ModelSection>

                    <ModelSection id="game-overview" eyebrow="Game context" title="Game Overview">
                        <p className="max-w-4xl text-base leading-7 text-slate-700">
                            Raid: Shadow Legends is a champion-collection RPG from Plarium where this EarnLab task list mostly maps to measurable systems: campaign farming, account/player level, Tavern champion rank, Android purchase receipts, and Portal Sacred Shard openings. This page focuses on game systems that create offer progress and support proof.
                        </p>
                    </ModelSection>

                    <ModelSection id="game-systems-that-actually-move-task-progress" eyebrow="Systems" title="Game Systems That Actually Move Task Progress">
                        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                            {gameSystems.map((system, index) => {
                                const Icon = systemIcons[index] ?? BookOpen;
                                return (
                                    <div key={system.system_name} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                                        <Icon className="h-6 w-6 text-emerald-700" />
                                        <h3 className="mt-3 text-lg font-extrabold text-slate-950">{system.system_name}</h3>
                                        <p className="mt-2 text-sm leading-6 text-slate-700">{system.explanation} {system.why_it_matters}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </ModelSection>

                    <ModelSection id="task-archetype-map" eyebrow="Task model" title="Task Archetype Map">
                        <TableShell>
                            <thead>
                                <tr>
                                    <Th>Task</Th>
                                    <Th>Exact task</Th>
                                    <Th>Primary archetype</Th>
                                    <Th>Risk band</Th>
                                    <Th>Proof</Th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {taskArchetypes.map((row) => (
                                    <tr key={row.task_id}>
                                        <Td className="font-bold text-slate-950">{row.task_id}</Td>
                                        <Td>{row.exact_task_text}</Td>
                                        <Td>{row.primary_archetype}</Td>
                                        <Td>{row.risk_band}</Td>
                                        <Td><List items={row.required_proof} /></Td>
                                    </tr>
                                ))}
                            </tbody>
                        </TableShell>
                    </ModelSection>

                    <ModelSection id="mechanic-dossiers" eyebrow="Mechanics" title="Mechanic Dossiers">
                        <TableShell>
                            <thead>
                                <tr>
                                    <Th>Mechanic</Th>
                                    <Th>Plain English</Th>
                                    <Th>Tasks</Th>
                                    <Th>Bottlenecks</Th>
                                    <Th>Proof screens</Th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {mechanicDossiers.map((row) => (
                                    <tr key={row.mechanic_name}>
                                        <Td className="font-bold text-slate-950">{row.mechanic_name}</Td>
                                        <Td>{row.plain_english_explanation}</Td>
                                        <Td>{row.task_ids_affected.join(", ")}</Td>
                                        <Td>{row.bottlenecks_and_conflicts}</Td>
                                        <Td><List items={row.proof_screens} /></Td>
                                    </tr>
                                ))}
                            </tbody>
                        </TableShell>
                    </ModelSection>

                    <ModelSection id="milestone-matrix" eyebrow="Decision model" title="Milestone Matrix">
                        <TableShell>
                            <thead>
                                <tr>
                                    <Th>Milestone</Th>
                                    <Th>Tasks</Th>
                                    <Th>Checkpoint</Th>
                                    <Th>Continue</Th>
                                    <Th>Reassess</Th>
                                    <Th>Stop</Th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {milestoneMatrix.map((row) => (
                                    <tr key={row.milestone}>
                                        <Td className="font-bold text-slate-950">{row.milestone}</Td>
                                        <Td>{row.task_ids.join(", ")}</Td>
                                        <Td>{row.checkpoint}</Td>
                                        <Td>{row.continue_rule}</Td>
                                        <Td>{row.reassess_rule}</Td>
                                        <Td>{row.stop_rule}</Td>
                                    </tr>
                                ))}
                            </tbody>
                        </TableShell>
                    </ModelSection>

                    <ModelSection id="day-by-day-route-with-continue-reassess-stop-rules" eyebrow="Route" title="Day-by-Day Route With Continue Reassess Stop Rules">
                        <div className="grid gap-4">
                            {dayRoute.map((day) => (
                                <div key={day.label} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                                    <h3 className="text-lg font-extrabold text-slate-950">{day.label}</h3>
                                    <p className="mt-2 text-sm leading-6 text-slate-700">{day.copy}</p>
                                    <div className="mt-4 grid gap-3 md:grid-cols-3">
                                        <p className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-900"><strong>Continue:</strong> {day.continueRule}</p>
                                        <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-900"><strong>Reassess:</strong> {day.reassessRule}</p>
                                        <p className="rounded-md bg-red-50 p-3 text-sm text-red-900"><strong>Stop:</strong> {day.stopRule}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ModelSection>

                    <ModelSection id="guided-task-by-task-route" eyebrow="Task route" title="Guided Task-By-Task Route">
                        <div className="grid gap-4">
                            {taskRoutes.map((task) => (
                                <details key={task.id} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm" open={["task_001", "task_012", "task_017", "task_023"].includes(task.id)}>
                                    <summary className="cursor-pointer text-lg font-extrabold text-slate-950">
                                        {task.id}: {task.task}
                                    </summary>
                                    <div className="mt-4 grid gap-4 lg:grid-cols-2">
                                        <div>
                                            <h4 className="font-bold text-slate-900">Guided route</h4>
                                            <List items={task.route} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-900">Progress checkpoints</h4>
                                            <List items={task.checkpoints} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-900">Proof</h4>
                                            <List items={task.proof} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-900">Stop or skip rule</h4>
                                            <p className="text-sm leading-6 text-slate-700">{task.stop}</p>
                                        </div>
                                    </div>
                                </details>
                            ))}
                        </div>
                    </ModelSection>

                    <ModelSection id="purchase-economics-table" eyebrow="Purchases" title="Purchase Economics Table">
                        <TableShell>
                            <thead>
                                <tr>
                                    <Th>Task</Th>
                                    <Th>Purchase</Th>
                                    <Th>Listed reward</Th>
                                    <Th>Listed cost</Th>
                                    <Th>Net before tax</Th>
                                    <Th>Recommendation</Th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {purchaseEconomics.map((row) => (
                                    <tr key={row.task_id}>
                                        <Td className="font-bold text-slate-950">{row.task_id}</Td>
                                        <Td>{row.pack_or_action}</Td>
                                        <Td>{row.listed_reward_value}</Td>
                                        <Td>{row.listed_cost}</Td>
                                        <Td>{row.net_before_tax}</Td>
                                        <Td>{row.recommendation}</Td>
                                    </tr>
                                ))}
                            </tbody>
                        </TableShell>
                    </ModelSection>

                    <ModelSection id="sacred-shard-random-reward-model" eyebrow="Sacred Shards" title="Sacred Shard / Random Reward Model">
                        <TableShell>
                            <thead>
                                <tr>
                                    <Th>Tasks</Th>
                                    <Th>Reward object</Th>
                                    <Th>Measured action</Th>
                                    <Th>Guaranteed part</Th>
                                    <Th>Random part</Th>
                                    <Th>Paid paths</Th>
                                    <Th>Stop rule</Th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {randomRewardModel.map((row) => (
                                    <tr key={row.reward_object}>
                                        <Td>{row.task_ids.join(", ")}</Td>
                                        <Td className="font-bold text-slate-950">{row.reward_object}</Td>
                                        <Td>{row.what_is_measured}</Td>
                                        <Td>{row.guaranteed_part}</Td>
                                        <Td>{row.random_part}</Td>
                                        <Td>{row.paid_paths}</Td>
                                        <Td>{row.stop_rule}</Td>
                                    </tr>
                                ))}
                            </tbody>
                        </TableShell>
                    </ModelSection>

                    <ModelSection id="support-state-model" eyebrow="Support" title="Support-State Model">
                        <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
                            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                                <h3 className="font-extrabold text-slate-950">States</h3>
                                <List items={["not_started", "clicked_installed", "in_progress", "credited", "pending", "missing_credit", "support_submitted", "denied_or_unresolved"]} />
                            </div>
                            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                                <h3 className="font-extrabold text-slate-950">Risk triggers</h3>
                                <List items={["early install or tutorial does not credit", "purchase made before task visibility", "Day 7 or Day 30 timing missed", "Sacred Shard tier opened without before screenshot"]} />
                            </div>
                        </div>
                    </ModelSection>

                    <ModelSection id="terminology-map" eyebrow="Translation" title="Terminology Map">
                        <TableShell>
                            <thead>
                                <tr>
                                    <Th>Offer wording</Th>
                                    <Th>Game wording</Th>
                                    <Th>Why it matters</Th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {terminologyMap.map((row) => (
                                    <tr key={row.offer_wording}>
                                        <Td className="font-bold text-slate-950">{row.offer_wording}</Td>
                                        <Td>{row.game_wording}</Td>
                                        <Td>{row.why_it_matters}</Td>
                                    </tr>
                                ))}
                            </tbody>
                        </TableShell>
                    </ModelSection>

                    <ModelSection id="proof-and-missing-credit-workflow" eyebrow="Workflow" title="Proof And Missing-Credit Workflow">
                        <div className="grid gap-5 md:grid-cols-5">
                            {[
                                "Document the task before completion.",
                                "Complete it in the tracked Android session.",
                                "Capture the result screen and EarnLab status.",
                                "Wait through the normal tracking window.",
                                "Submit task name, points, completion time, player ID, screenshots, and receipt if paid.",
                            ].map((step, index) => (
                                <div key={step} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-md bg-slate-950 text-sm font-black text-white">{index + 1}</div>
                                    <p className="mt-3 text-sm leading-6 text-slate-700">{step}</p>
                                </div>
                            ))}
                        </div>
                    </ModelSection>

                    <ModelSection id="faq" eyebrow="FAQ" title="FAQ">
                        <div className="grid gap-4">
                            {faqItems.map((item) => (
                                <div key={item.question} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                                    <h3 className="text-lg font-extrabold text-slate-950">{item.question}</h3>
                                    <p className="mt-2 text-base leading-7 text-slate-700">{item.answer}</p>
                                </div>
                            ))}
                        </div>
                    </ModelSection>

                    <ModelSection id="sources" eyebrow="Sources" title="Sources">
                        <div className="grid gap-3">
                            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                                <p className="font-bold text-slate-950">User-provided EarnLab task list</p>
                                <p className="mt-1 text-sm text-slate-600">Payout and deadline source of record.</p>
                            </div>
                            {sourceLog.map((source) => (
                                <a
                                    key={source.source_id}
                                    href={source.url}
                                    className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm hover:border-emerald-300 hover:bg-emerald-50"
                                >
                                    <p className="font-bold text-slate-950">{source.title}</p>
                                    <p className="mt-1 text-sm text-slate-600">{source.notes}</p>
                                </a>
                            ))}
                        </div>
                    </ModelSection>

                    <section id="next-step" className="scroll-mt-24 py-10">
                        <div className="rounded-lg bg-slate-950 p-6 text-white shadow-sm">
                            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                                <div>
                                    <p className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-300">Next step</p>
                                    <h2 className="mt-2 text-2xl font-extrabold">Compare your visible EarnLab offer before starting</h2>
                                    <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-200">
                                        If the visible offer differs, follow the visible EarnLab terms and use this page as the strategy framework.
                                    </p>
                                </div>
                                <Link
                                    href="/offers"
                                    className="inline-flex items-center justify-center rounded-md bg-emerald-400 px-5 py-3 text-sm font-extrabold text-slate-950 hover:bg-emerald-300"
                                >
                                    Browse offers
                                </Link>
                            </div>
                        </div>
                    </section>
                </div>
            </main>
        </>
    );
}

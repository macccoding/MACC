import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import type { Prisma } from "@/generated/prisma/client";

export async function POST(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  try {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    // Technique Ratings
    const ratingData: Prisma.TTTechniqueRatingCreateInput[] = [
      { shot: "bh-flick", rating: 5, date: today },
      { shot: "bh-opening-loop", rating: 8, date: today },
      { shot: "bh-counter-loop", rating: 6, date: today },
      { shot: "bh-block-redirect", rating: 8, date: today },
      { shot: "bh-kill-finish", rating: 7, date: today },
      { shot: "bh-push-touch", rating: 8, date: today },
      { shot: "fh-opening-loop", rating: 9, date: today },
      { shot: "fh-counter-loop", rating: 8, date: today },
      { shot: "fh-kill-smash", rating: 9, date: today },
      { shot: "fh-block", rating: 4, date: today },
      { shot: "fh-flick", rating: 4, date: today },
      { shot: "fh-push-touch", rating: 8, date: today },
    ];

    const ratings = await prisma.tTTechniqueRating.createMany({
      data: ratingData,
    });

    // Technique References
    const referenceData: Prisma.TTTechniqueReferenceCreateInput[] = [
      {
        shot: "bh-flick",
        playerName: "Lin Yun-Ju",
        mechanicsBreakdown:
          "Wrist snap, timing, receive-to-attack transition. Compact motion that generates speed without big backswing.",
      },
      {
        shot: "bh-opening-loop",
        playerName: "Lin Shidong",
        mechanicsBreakdown:
          "Compact swing that generates power without a big windup. Rally sustain.",
      },
      {
        shot: "bh-opening-loop",
        playerName: "Fan Zhendong",
        mechanicsBreakdown: "Raw power from any position.",
      },
      {
        shot: "bh-counter-loop",
        playerName: "Lin Shidong",
        mechanicsBreakdown:
          "Rally sustain and consistency. FZD-style backhand with more spin variation.",
      },
      {
        shot: "bh-block-redirect",
        playerName: "Fan Zhendong",
        mechanicsBreakdown: "Versatility — punch block, active block, redirect.",
      },
      {
        shot: "bh-kill-finish",
        playerName: "Fan Zhendong",
        mechanicsBreakdown: "The statement shot. Walk-off energy.",
      },
      {
        shot: "fh-opening-loop",
        playerName: "Fan Zhendong",
        mechanicsBreakdown: "Complete forehand reference.",
      },
      {
        shot: "fh-counter-loop",
        playerName: "Fan Zhendong",
        mechanicsBreakdown:
          "Mid-range bombs. Hugo Calderano's effortless quality also a reference.",
      },
      {
        shot: "fh-kill-smash",
        playerName: "Fan Zhendong",
        mechanicsBreakdown: "The Amaterasu finish.",
      },
      {
        shot: "pendulum-serve",
        playerName: "Lin Yun-Ju",
        mechanicsBreakdown:
          "Extended arm pendulum. 5+ spin variations from same motion.",
      },
      {
        shot: "backhand-serve",
        playerName: "Dimitrij Ovtcharov",
        mechanicsBreakdown: "Good variance of top, back, side.",
      },
      {
        shot: "receive",
        playerName: "Lin Yun-Ju",
        mechanicsBreakdown: "Flick mastery and receive-to-attack transition.",
      },
    ];

    const references = await prisma.tTTechniqueReference.createMany({
      data: referenceData,
    });

    // Equipment History
    const equipmentData: Prisma.TTEquipmentLogCreateInput[] = [
      {
        item: "Dignics 09C",
        type: "rubber",
        side: "bh",
        blade: "FZD ALC",
        dateStarted: new Date("2025-06-01"),
        dateEnded: new Date("2025-08-01"),
        satisfaction: 5,
        pros: "Good starter",
        cons: "High arc, lacked directness",
        verdict: "discarded",
      },
      {
        item: "Dignics 05",
        type: "rubber",
        side: "bh",
        blade: "FZD ALC",
        dateStarted: new Date("2025-08-01"),
        dateEnded: new Date("2025-11-01"),
        satisfaction: 6,
        pros: "Excellent in rallies",
        cons: "Too sensitive for serve receive",
        verdict: "discarded",
      },
      {
        item: "Zyre 03",
        type: "rubber",
        side: "bh",
        blade: "FZD ALC",
        dateStarted: new Date("2025-11-01"),
        dateEnded: new Date("2026-02-01"),
        satisfaction: 7,
        pros: "Topspin rallies, catapult",
        cons: "No chop game, lack of feel. Swordmaster cloak — no armor.",
        verdict: "discarded",
        revisitConditions: "If flick and short game strong enough",
      },
      {
        item: "Xiom J&H C52.5",
        type: "rubber",
        side: "bh",
        blade: "FZD ALC",
        dateStarted: new Date("2026-02-01"),
        satisfaction: 8,
        pros: "Tack, easier to play, Zyre + 09C positives without arc",
        cons: "Requires active play, still learning",
        verdict: "kept",
      },
    ];

    const equipment = await prisma.tTEquipmentLog.createMany({
      data: equipmentData,
    });

    // Periodization Phases
    const phaseData: Prisma.TTPeriodPhaseCreateInput[] = [
      {
        name: "Foundation",
        startMonth: new Date("2026-04-01"),
        endMonth: new Date("2026-05-31"),
        focusAreas: ["BH flick rebuild", "Mode 1 discipline", "Footwork efficiency"],
        targets: [
          "Flick 5→6.5",
          "Conscious calibration every session",
          "Reduce unforced errors from rushing",
        ],
      },
      {
        name: "Development",
        startMonth: new Date("2026-06-01"),
        endMonth: new Date("2026-07-31"),
        focusAreas: ["BH counter-loop consistency", "FH block development", "Fitness ramp"],
        targets: [
          "Counter 6→7.5",
          "Crossover zone improvement",
          "Calisthenics 3x/week",
        ],
      },
      {
        name: "Integration",
        startMonth: new Date("2026-08-01"),
        endMonth: new Date("2026-09-30"),
        focusAreas: ["Full game under pressure", "Serve/receive sharpening", "Match simulation"],
        targets: ["All systems under pressure", "Serve variation mastery", "Tournament-pace rallies"],
      },
      {
        name: "Competition",
        startMonth: new Date("2026-10-01"),
        endMonth: new Date("2026-11-30"),
        focusAreas: ["Broward tournament reps", "Tactical prep", "Peaking"],
        targets: [
          "Peak form for nationals",
          "Opponent-specific gameplans",
          "Mental game under tournament pressure",
        ],
      },
    ];

    const phases = await prisma.tTPeriodPhase.createMany({
      data: phaseData,
    });

    return NextResponse.json({
      seeded: {
        ratings: ratings.count,
        references: references.count,
        equipment: equipment.count,
        phases: phases.count,
      },
    });
  } catch (err) {
    console.error("[tt/seed] POST error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

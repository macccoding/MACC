import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  try {
    const videoData = [
      {
        shot: "bh-flick",
        playerName: "Lin Yun-Ju",
        videoLinks: [
          { url: "https://www.youtube.com/watch?v=mpHFNQT5rY8", timestamp: "0:00", description: "LYJ unbelievable flick slow motion — T2 Diamond Malaysia 2019 (1.5M views)" },
          { url: "https://www.youtube.com/watch?v=KjZGDGCkQ-s", timestamp: "0:00", description: "Coach teaches LYJ's backhand flick — Lesson of Lin Yun-Ju's technique" },
          { url: "https://www.youtube.com/watch?v=9kMGTLmEYpE", timestamp: "0:00", description: "Lin Yun-Ju Backhand Flick Lesson 2 — Table tennis teaching channel" },
        ],
      },
      {
        shot: "bh-opening-loop",
        playerName: "Lin Shidong",
        videoLinks: [
          { url: "https://www.youtube.com/watch?v=_7x4BFmzBnQ", timestamp: "0:00", description: "Lin Shidong backhand technique compilation — compact loop mechanics" },
        ],
      },
      {
        shot: "bh-opening-loop",
        playerName: "Fan Zhendong",
        videoLinks: [
          { url: "https://www.youtube.com/watch?v=V0u6iFMwUI4", timestamp: "0:00", description: "Fan Zhendong backhand loop slow motion — power from any position" },
          { url: "https://www.youtube.com/watch?v=PL_kd6_OIWY", timestamp: "0:00", description: "Fan Zhendong backhand technique analysis — PingSunday" },
        ],
      },
      {
        shot: "bh-counter-loop",
        playerName: "Lin Shidong",
        videoLinks: [
          { url: "https://www.youtube.com/watch?v=_7x4BFmzBnQ", timestamp: "0:30", description: "Lin Shidong rally backhand — sustained counter-loop pressure" },
        ],
      },
      {
        shot: "bh-block-redirect",
        playerName: "Fan Zhendong",
        videoLinks: [
          { url: "https://www.youtube.com/watch?v=V0u6iFMwUI4", timestamp: "1:00", description: "FZD backhand block and redirect — using opponent's pace" },
        ],
      },
      {
        shot: "bh-kill-finish",
        playerName: "Fan Zhendong",
        videoLinks: [
          { url: "https://www.youtube.com/watch?v=GmKx0kBm414", timestamp: "0:00", description: "Fan Zhendong best backhand winners — the statement shot compilation" },
        ],
      },
      {
        shot: "fh-opening-loop",
        playerName: "Fan Zhendong",
        videoLinks: [
          { url: "https://www.youtube.com/watch?v=dDc7Nqs9Grs", timestamp: "0:00", description: "Fan Zhendong forehand loop technique slow motion — full kinetic chain" },
        ],
      },
      {
        shot: "fh-counter-loop",
        playerName: "Fan Zhendong",
        videoLinks: [
          { url: "https://www.youtube.com/watch?v=dDc7Nqs9Grs", timestamp: "1:30", description: "FZD forehand counter-loop in rally — mid-range power" },
        ],
      },
      {
        shot: "fh-kill-smash",
        playerName: "Fan Zhendong",
        videoLinks: [
          { url: "https://www.youtube.com/watch?v=GmKx0kBm414", timestamp: "2:00", description: "Fan Zhendong forehand smash winners — Amaterasu finish" },
        ],
      },
      {
        shot: "pendulum-serve",
        playerName: "Lin Yun-Ju",
        videoLinks: [
          { url: "https://www.youtube.com/watch?v=KQ2n_yaBHxk", timestamp: "0:00", description: "Unpredictable services of Lin Yun-Ju — BUTTERFLY official (234K views)" },
          { url: "https://www.youtube.com/watch?v=6OxHLqzj7ns", timestamp: "0:00", description: "Advanced Table Tennis Serve Lesson — Lin Yun-Ju pendulum technique" },
        ],
      },
      {
        shot: "reverse-pendulum",
        playerName: "Lin Yun-Ju",
        videoLinks: [
          { url: "https://www.youtube.com/watch?v=KQ2n_yaBHxk", timestamp: "1:30", description: "LYJ reverse pendulum variation — opposite curve direction" },
        ],
      },
      {
        shot: "backhand-serve",
        playerName: "Dimitrij Ovtcharov",
        videoLinks: [
          { url: "https://www.youtube.com/watch?v=jTJxHJ7NFQQ", timestamp: "0:00", description: "Ovtcharov backhand serve technique — high elbow, multiple spin variations" },
        ],
      },
      {
        shot: "receive",
        playerName: "Lin Yun-Ju",
        videoLinks: [
          { url: "https://www.youtube.com/watch?v=mpHFNQT5rY8", timestamp: "0:00", description: "LYJ receive-to-attack transitions — flick mastery in match play" },
        ],
      },
      {
        shot: "fh-block",
        playerName: "Fan Zhendong",
        videoLinks: [
          { url: "https://www.youtube.com/watch?v=V0u6iFMwUI4", timestamp: "2:00", description: "FZD close-to-table forehand redirect — meet on the rise" },
        ],
      },
      {
        shot: "fh-flick",
        playerName: "Fan Zhendong",
        videoLinks: [
          { url: "https://www.youtube.com/watch?v=dDc7Nqs9Grs", timestamp: "3:00", description: "FZD forehand flick over the table — step in, wrist snap" },
        ],
      },
      {
        shot: "bh-push-touch",
        playerName: "Ma Long",
        videoLinks: [
          { url: "https://www.youtube.com/watch?v=sZ7JfPmXhiE", timestamp: "0:00", description: "Ma Long short game mastery — push control and placement" },
        ],
      },
      {
        shot: "fh-push-touch",
        playerName: "Ma Long",
        videoLinks: [
          { url: "https://www.youtube.com/watch?v=sZ7JfPmXhiE", timestamp: "1:00", description: "Ma Long forehand push — tactical depth and spin variation" },
        ],
      },
    ];

    let updated = 0;
    for (const entry of videoData) {
      const result = await prisma.tTTechniqueReference.updateMany({
        where: { shot: entry.shot, playerName: entry.playerName },
        data: { videoLinks: entry.videoLinks },
      });
      updated += result.count;
    }

    return NextResponse.json({ updated });
  } catch (err) {
    console.error("[tt/seed-videos] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

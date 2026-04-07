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
          { url: "https://www.youtube.com/watch?v=mpHFNQT5rY8", timestamp: "0:00", description: "LYJ unbelievable flick slow motion — T2 Diamond Malaysia (1.5M views)" },
          { url: "https://www.youtube.com/watch?v=EZPknumditk", timestamp: "0:00", description: "Lesson of LYJ's backhand flick against backspin from FH side" },
          { url: "https://www.youtube.com/watch?v=6H_KY2IGSU0", timestamp: "0:00", description: "LYJ backhand flick slow motion — best angle" },
          { url: "https://www.youtube.com/watch?v=Dw1FaGc5tL4", timestamp: "0:00", description: "Former Coach of LYJ teaches 4 steps to master the backhand flick" },
        ],
      },
      {
        shot: "bh-opening-loop",
        playerName: "Lin Shidong",
        videoLinks: [
          { url: "https://www.youtube.com/watch?v=4yL1rciyEwo", timestamp: "0:00", description: "Analyse the SUPER FAST backhand of Lin Shidong" },
          { url: "https://www.youtube.com/watch?v=aF3Us3ogqf8", timestamp: "0:00", description: "Lin Shidong backhand compilation" },
          { url: "https://www.youtube.com/watch?v=xhDmO5_OEsw", timestamp: "0:00", description: "China's next hero — Lin Shidong crazy training 2024" },
        ],
      },
      {
        shot: "bh-opening-loop",
        playerName: "Fan Zhendong",
        videoLinks: [
          { url: "https://www.youtube.com/watch?v=SBzf--PjaXo", timestamp: "0:00", description: "How FZD's backhand became a weapon — and how you can copy it" },
          { url: "https://www.youtube.com/watch?v=aY4Tts4EAUQ", timestamp: "0:00", description: "FZD — the best backhand in the world (explosive attack compilation)" },
        ],
      },
      {
        shot: "bh-counter-loop",
        playerName: "Lin Shidong",
        videoLinks: [
          { url: "https://www.youtube.com/watch?v=LQ8wX20l2LQ", timestamp: "0:00", description: "Best of Lin Shidong 'The Walking Highlight' — rally backhand" },
          { url: "https://www.youtube.com/watch?v=zm2_viyTUoc", timestamp: "0:00", description: "World No.1 Lin Shidong training — US Smash 2025" },
        ],
      },
      {
        shot: "bh-block-redirect",
        playerName: "Fan Zhendong",
        videoLinks: [
          { url: "https://www.youtube.com/watch?v=aY4Tts4EAUQ", timestamp: "0:00", description: "FZD explosive backhand — includes block and redirect sequences" },
        ],
      },
      {
        shot: "bh-kill-finish",
        playerName: "Fan Zhendong",
        videoLinks: [
          { url: "https://www.youtube.com/watch?v=yRCWxCf6jGA", timestamp: "0:00", description: "FZD Oscar-worthy placements against top players — backhand winners [HD]" },
          { url: "https://www.youtube.com/watch?v=x1FRDiRaLjI", timestamp: "0:00", description: "FZD modern techniques — unbelievable backhand flicks and kills" },
        ],
      },
      {
        shot: "fh-opening-loop",
        playerName: "Fan Zhendong",
        videoLinks: [
          { url: "https://www.youtube.com/watch?v=gdU4l98m_hQ", timestamp: "0:00", description: "Table tennis in slow motion 240fps — FZD forehand loop" },
          { url: "https://www.youtube.com/watch?v=Sd5GjRFEyIE", timestamp: "0:00", description: "Table tennis slow motion 240fps — FZD forehand loop (alternate angle)" },
          { url: "https://www.youtube.com/watch?v=b-byg1cVLnA", timestamp: "0:00", description: "FZD exceptional postural adjustment forehand in slow motion" },
        ],
      },
      {
        shot: "fh-counter-loop",
        playerName: "Fan Zhendong",
        videoLinks: [
          { url: "https://www.youtube.com/watch?v=LqCWEbblMJA", timestamp: "0:00", description: "FZD forehand ability is simply ABNORMAL — rally sequences" },
          { url: "https://www.youtube.com/watch?v=cpqkroZ_GyM", timestamp: "0:00", description: "The only forehand loop technique that produces highest-quality shots" },
        ],
      },
      {
        shot: "fh-kill-smash",
        playerName: "Fan Zhendong",
        videoLinks: [
          { url: "https://www.youtube.com/watch?v=yRCWxCf6jGA", timestamp: "0:00", description: "FZD Oscar-worthy placements — forehand smash winners" },
          { url: "https://www.youtube.com/watch?v=jCIUYUdD-FE", timestamp: "0:00", description: "FZD forehand fade loop — Bowmar Sports shot of the week" },
        ],
      },
      {
        shot: "pendulum-serve",
        playerName: "Lin Yun-Ju",
        videoLinks: [
          { url: "https://www.youtube.com/watch?v=RKmsytmZr6A", timestamp: "0:00", description: "Advanced serve lesson — the Lin Yun-Ju system explained" },
          { url: "https://www.youtube.com/watch?v=bupBbNp9otA", timestamp: "0:00", description: "Lin Yun-Ju's 4 killer serves — tutorial" },
        ],
      },
      {
        shot: "reverse-pendulum",
        playerName: "Lin Yun-Ju",
        videoLinks: [
          { url: "https://www.youtube.com/watch?v=bupBbNp9otA", timestamp: "0:00", description: "LYJ serve variations including reverse pendulum" },
        ],
      },
      {
        shot: "backhand-serve",
        playerName: "Dimitrij Ovtcharov",
        videoLinks: [
          { url: "https://www.youtube.com/watch?v=3cKp75PqQuA", timestamp: "0:00", description: "Dimitrij Ovtcharov's serves vs TableTennisDaily" },
          { url: "https://www.youtube.com/watch?v=wXX5Di9bJxo", timestamp: "0:00", description: "Backhand serve like Dimitrij Ovtcharov — tutorial" },
          { url: "https://www.youtube.com/watch?v=HwLD6soiUiA", timestamp: "0:00", description: "Backhand serve tutorial — same motion, different spin" },
        ],
      },
      {
        shot: "receive",
        playerName: "Lin Yun-Ju",
        videoLinks: [
          { url: "https://www.youtube.com/watch?v=mpHFNQT5rY8", timestamp: "0:00", description: "LYJ receive-to-attack — flick mastery in match play" },
          { url: "https://www.youtube.com/watch?v=F7Bg7pPCxPg", timestamp: "0:00", description: "Master the backhand flick — advanced receive skills" },
        ],
      },
      {
        shot: "fh-block",
        playerName: "Fan Zhendong",
        videoLinks: [
          { url: "https://www.youtube.com/watch?v=zAGc3h7gpxs", timestamp: "0:00", description: "Why your forehand block always fails — fix with 3 simple rules" },
          { url: "https://www.youtube.com/watch?v=l5JBJx_XE-s", timestamp: "0:00", description: "Mastering the art of blocking — advanced techniques" },
        ],
      },
      {
        shot: "fh-flick",
        playerName: "Fan Zhendong",
        videoLinks: [
          { url: "https://www.youtube.com/watch?v=mC0H6OLL_4M", timestamp: "0:00", description: "Forehand flick — PingSkills tutorial" },
          { url: "https://www.youtube.com/watch?v=kaeWe3HbD8I", timestamp: "0:00", description: "Dominate short serves with a killer forehand flick" },
          { url: "https://www.youtube.com/watch?v=s_XNancfdK0", timestamp: "0:00", description: "Zhang Jike 2025 tuition — forehand flick" },
        ],
      },
      {
        shot: "bh-push-touch",
        playerName: "Ma Long",
        videoLinks: [
          { url: "https://www.youtube.com/watch?v=eLPCVbTXo5A", timestamp: "0:00", description: "How to push effectively — professionals explained" },
          { url: "https://www.youtube.com/watch?v=kTN9IxBg_4k", timestamp: "0:00", description: "7 pro tactics from Ma Long — how to win like a champion" },
          { url: "https://www.youtube.com/watch?v=520lxu7WPzk", timestamp: "0:00", description: "Ma Long training FH flick and FH short push" },
        ],
      },
      {
        shot: "fh-push-touch",
        playerName: "Ma Long",
        videoLinks: [
          { url: "https://www.youtube.com/watch?v=520lxu7WPzk", timestamp: "0:00", description: "Ma Long training FH flick and FH short push" },
          { url: "https://www.youtube.com/watch?v=0C0XrhG9axQ", timestamp: "0:00", description: "How to improve your short push — with a fun game" },
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

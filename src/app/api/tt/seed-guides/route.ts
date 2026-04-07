import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

const guides = [
  {
    shot: "bh-flick",
    readyPosition:
      "Feet shoulder-width apart, knees bent 15-25\u00b0, weight on balls of feet. Body slightly forward \u2014 chest inclined toward the table. Racket at mid-torso height, forearm parallel to table surface. Stand slightly toward the middle, biased to backhand side to pre-position for crossover flick coverage.",
    gripAdjustment:
      "Loosen overall grip pressure \u2014 racket should feel like it could be pulled out from behind. Thumb moves slightly higher on blade for backhand support. At contact, pressure from thumb and index finger increases briefly and explosively \u2014 a \u2018pinch and release\u2019 dynamic, not sustained tension.",
    preparation:
      "Step right foot in and under the table, shortening distance between torso and ball. Elbow comes forward and up, positioned in front of body above table height \u2014 this is the pivot point. Wrist drops downward and inward, racket head pointing toward your stomach. For banana flick: wrist loads further, racket face turns more toward your body creating a hooded position.",
    contact:
      "Contact at peak of bounce or fractionally before. Standard flick: top of ball (12 o\u2019clock), face closed 5-10\u00b0 past vertical, forward-upward trajectory at ~45\u00b0. Banana flick: top-left quadrant (10-11 o\u2019clock for RH), grazing side contact that produces curved flight path. Against heavy backspin: open face more (30-50\u00b0) and brush more steeply upward.",
    wristForearm:
      "Forearm rotates forward and outward (supination) around elbow pivot \u2014 not just a push forward. Wrist snaps simultaneously with forearm, traveling 45-60\u00b0 of arc. For banana flick: both wrist and forearm sweep sideways. The key is Lin Yun-Ju\u2019s \u2018whip crack\u2019 principle \u2014 arm and wrist relaxed until contact, then maximum acceleration. Shoulder plays minimal role.",
    followThrough:
      "Short and compact \u2014 not a loop. Stop before racket reaches shoulder height. Forearm roughly horizontal, face pointing toward net. Grip releases immediately after contact. Right foot pulls back instantly \u2014 do not linger in the crouched position. Recovery is mandatory.",
    commonMistakes:
      "Elbow stays pinned to body (destroys pivot mechanics). Contacting on descending ball (loses leverage). Shoulder-driven stroke (becomes a mini-loop). Gripping too tight in prep (kills wrist snap speed). Not loading wrist far enough back. Ball too far from body at contact. No spin adjustment between backspin and no-spin serves.",
    whenToUse:
      "Short ball within 60cm of net on backhand or middle. Server expecting a push \u2014 surprise element is maximum. Short topspin or no-spin serves (cleanest opportunities). Crossover into forehand court (Lin\u2019s signature) to force angles the server didn\u2019t serve into.",
    whenNotToUse:
      "Ball is half-long or long (use backhand loop). Extremely heavy backspin you can\u2019t confidently read. Ball bounces deep near end-line. You\u2019re off-balance from previous shot. Opponent is a flat hitter who struggles with backspin \u2014 pushing is better. Very short, very low ball below table height.",
    cuePhrase: "Loose grip, elbow forward, snap at the top.",
  },
  {
    shot: "bh-opening-loop",
    readyPosition:
      "Feet approximately 1.5 shoulder-widths apart, right foot slightly back. Weight evenly distributed on balls of feet. Knees bent, torso leaning slightly forward. Arms held shoulder-width apart at roughly 90\u00b0 elbow angle. Bat positioned above table height. Distance from table: 40-60cm.",
    gripAdjustment:
      "Neutral shakehand grip, pressure moderate at 50-60%. Index finger presses firmly for stability during the upward brush. Thumb maintains support on forehand rubber. Wrist cocked back slightly in preparation.",
    preparation:
      "Weight shifts slightly onto left leg. Right arm bent at elbow, forearm roughly parallel to endline. Shoulders rotate slightly more than hips/waist. Both shoulders lower as you crouch to prepare for the lifting motion. Bat angle approximately 45\u00b0 to generate topspin. The compact preparation is key \u2014 modeled after Lin Shidong, no big windup.",
    contact:
      "Contact at the 1-2 o\u2019clock position on the ball, brushing upward and forward. Bat angle stays around 45\u00b0. Ball struck while moving upward and forward \u2014 this is a lifting, brushing action. Contact point is in front of the body, slightly left of centerline. Against heavy backspin: contact further under the ball (closer to 3 o\u2019clock) with more open face.",
    wristForearm:
      "Upper arm leads the movement initially, bat lags behind. Then forearm and bat accelerate with high velocity \u2014 the whip effect. Wrist snaps at contact to add speed and spin. The forearm rotates around the elbow pivot. For Fan Zhendong-level power: the entire kinetic chain fires \u2014 knees straighten, hips rotate, shoulder drives, forearm whips, wrist snaps.",
    followThrough:
      "Arm swings forward and slightly right after maximum extension. Wrist naturally turns over. Free arm stays stationary for balance. Return to ready position immediately \u2014 the opening loop is ball 3, you need to be ready for ball 5.",
    commonMistakes:
      "Swinging with just the arm (no body rotation). Contact too late on descending ball. Not crouching low enough for heavy backspin. Trying to hit through the ball instead of brushing upward. Rushing the shot \u2014 the opening loop needs the full preparation phase.",
    whenToUse:
      "Opponent pushes long to your backhand. Any backspin ball at mid-distance. After your serve forces a long push return. Ball is below net height but within looping range.",
    whenNotToUse:
      "Ball is short (use flick or push). Ball has heavy topspin already (use counter-loop instead). You\u2019re jammed at the table with no room for the upward swing.",
    cuePhrase: "Drop low, brush up through the ball.",
  },
  {
    shot: "bh-counter-loop",
    readyPosition:
      "Closer to table than opening loop \u2014 30-50cm. Feet shoulder-width, slight crouch. Weight slightly forward. Bat at mid-chest height, ready to meet the incoming topspin. Quick reaction stance.",
    gripAdjustment:
      "Moderate grip pressure 50-60%. Wrist neutral or slightly forward. The counter-loop requires less wrist loading than the opening loop \u2014 it\u2019s about timing and redirection more than generation.",
    preparation:
      "Minimal backswing \u2014 elbow lifts 5-8cm, forearm rotates back 25-35\u00b0. Shoulder turns no more than 15-20\u00b0. Preparation happens as opponent\u2019s bat contacts ball \u2014 you\u2019re reading and reacting. Lin Shidong\u2019s model: compact, controlled, sustainable over long rallies.",
    contact:
      "Contact at top of ball (11-12 o\u2019clock) while ball is still rising or at peak. Bat angle more closed than opening loop \u2014 60-75\u00b0 (nearly vertical). Contact point 25-35cm in front of body. The topspin is already on the ball \u2014 your job is to redirect it with your own spin added on top.",
    wristForearm:
      "Forearm drives forward 20-30cm. Wrist adds a controlled snap forward \u2014 not explosive like a kill, but firm and accelerating. You\u2019re using the incoming spin energy plus your own forearm rotation. Direction changes happen through wrist angle at contact \u2014 crosscourt or down-the-line decided in the last moment.",
    followThrough:
      "Compact follow-through, arm extends forward but not upward. Return to ready within 200-300ms. The counter-loop is a rally shot \u2014 recovery speed matters more than power on any single ball.",
    commonMistakes:
      "Going for too much power too early \u2014 trying to end the rally instead of building pressure. Over-rotating shoulder (turns it into a slow loop). Not closing bat face enough against heavy topspin (ball flies long). Standing too far from table for counter-looping range.",
    whenToUse:
      "Opponent loops to your backhand in a topspin rally. Ball has moderate to heavy topspin. You\u2019re in a rally exchange and want to sustain pressure. You want to change direction mid-rally to break opponent\u2019s rhythm.",
    whenNotToUse:
      "Ball has backspin (use opening loop). Ball is very high and weak (use kill instead). You have clear space and time to step around for forehand.",
    cuePhrase:
      "Compact, forward, redirect \u2014 don\u2019t force the ending.",
  },
  {
    shot: "bh-block-redirect",
    readyPosition:
      "Very close to table \u2014 20-35cm. Feet shoulder-width + 2-3cm, left foot 1-2cm forward. Weight 55-60% on balls of feet, slight forward lean 5-10\u00b0 from vertical. Knees bent 15-20\u00b0. Bat at navel height, 30cm in front of body centerline.",
    gripAdjustment:
      "Index finger relaxes slightly \u2014 do not tighten into blade. Thumb provides primary tension. Grip pressure 40-50% of max. Fan Zhendong\u2019s grip is famously relaxed until contact.",
    preparation:
      "Active block: almost zero backswing. Elbow lifts 2-3cm, forearm rotates back 15-20\u00b0. Shoulder stays still. Punch block: forearm rotates back 25-35\u00b0, slight elbow draw 3-5cm toward body. This is a forearm/wrist unit move, not a shoulder move. Preparation must happen as opponent\u2019s bat contacts ball.",
    contact:
      "Top-back quadrant of ball (11-12 o\u2019clock). Against heavy topspin: further toward top (12 o\u2019clock). Against flat: 11 o\u2019clock. 25-35cm in front of hip line, slightly left of centerline. Bat angle 80-85\u00b0 for active block (nearly vertical), 75-80\u00b0 for punch block. Timing: rising ball, just after bounce peak.",
    wristForearm:
      "Active block: wrist firm, no snap. Forearm moves forward 8-12cm. Think \u2018wall with forward lean\u2019 \u2014 redirecting energy, not generating it. Punch block: wrist snaps forward 20-30\u00b0 at contact in 50-80ms. Fan uses micro-pronation (~15\u00b0) on punch block to add sidespin and deflect angle crosscourt.",
    followThrough:
      "Active block: arm extends 10-15cm past contact. Elbow stays fixed. Return to ready within 200ms. Punch block: forearm drives through 20-25cm, wrist ends pronated, bat face pointing toward target zone.",
    commonMistakes:
      "Pushing bat at ball using shoulder/elbow extension (inconsistent). Bat angle too open (flies long). Waiting flat-footed. Grip tightening before contact (kills feel). Elbow too far back (turns block into a swing).",
    whenToUse:
      "Opponent looping from midrange with heavy topspin. Out of position and need to reset. Want to redirect pace crosscourt or down the line. Punch block: opponent mid-swing on a loop, ball is slightly high \u2014 surprise with pace.",
    whenNotToUse:
      "Ball is below table height or short (push or flick). You have comfortable setup to attack. Opponent is pushing/cutting (block on underspin pops up).",
    cuePhrase: "Wall that leans in. Snap the wrist, not the arm.",
  },
  {
    shot: "bh-kill-finish",
    readyPosition:
      "Distance 40-70cm from table. Feet slightly wider than shoulder width. Weight shifts to right foot during preparation. Knees bent 20-25\u00b0. Bat pre-loaded at hip height left side, elbow slightly elevated.",
    gripAdjustment:
      "Tighten grip to 70-80% of max \u2014 opposite to block grip. Index finger presses firmly into blade for rigidity and power transfer. Thumb maintains tension. Wrist cocked back (dorsiflexion 20-25\u00b0) in preparation.",
    preparation:
      "Forearm rotates back 50-60\u00b0 from contact plane. Elbow drops slightly (5-8cm below contact level) then rises through swing \u2014 creating upward-forward arc. Shoulder turns 20-25\u00b0 to the left. Weight shifts to right foot during loading. Non-playing arm opens slightly for balance.",
    contact:
      "Top-back of ball (12-1 o\u2019clock). Very high ball: further back (1 o\u2019clock) for topspin safety. Floated no-spin: 11 o\u2019clock for pure pace. 30-40cm in front of hip, at or slightly above elbow height. Bat angle 70-75\u00b0 (moderately closed). Timing: at peak of bounce \u2014 do NOT wait for descent.",
    wristForearm:
      "This is the core: forearm accelerates through 60-70\u00b0 of arc in ~100ms. Wrist snaps forward aggressively: 35-45\u00b0 of flexion in the final 30ms. Elbow stays as fixed pivot \u2014 forearm rotates around elbow, not shoulder. Slight pronation (10-15\u00b0) during contact closes face dynamically and adds topspin. This is the Totsuka \u2014 the statement shot.",
    followThrough:
      "Forearm finishes at roughly shoulder height, bat face forward. Wrist fully snapped, bat pointing upward/forward. Weight completes transfer to left foot. Immediate reset within 300ms \u2014 possible only because swing is compact.",
    commonMistakes:
      "Swinging with shoulder/upper arm (destroys consistency). Contact too late on descent. Wrist snapping without forearm acceleration first (produces flick, not kill). Standing too close to table. Not closing bat face enough on no-spin floaters.",
    whenToUse:
      "Opponent\u2019s loop lands short with high arc. Long floated push. Third-ball receives that come back high. Any ball above net height with space to swing.",
    whenNotToUse:
      "Ball is low or below net height (loop instead). You\u2019re jammed with no forearm arc space. Rally is fast and tight to table (punch block or counter). Off-balance and can\u2019t set weight properly.",
    cuePhrase: "Elbow as pivot, forearm as whip.",
  },
  {
    shot: "bh-push-touch",
    readyPosition:
      "Distance 20-30cm from table, or leaning to 10-15cm for short ball. Feet parallel or left slightly forward, shoulder width. Weight slightly forward on balls of feet. Bat at waist/navel height, face open. Body lean forward 10-15\u00b0 at hips.",
    gripAdjustment:
      "Neutral shakehand, light grip 35-45%. Index finger presses gently against backhand blade for tactile feedback. Wrist cocked slightly back (dorsiflexion 10-15\u00b0).",
    preparation:
      "Elbow rises 5-10cm from ready position. Forearm rotates back 20-30\u00b0. Bat face opens to 40-50\u00b0 (pointing partly upward) \u2014 more open for heavier backspin, less for no-spin. For short ball: lean body forward at hips, extend arm over table, keep elbow bent 90-100\u00b0.",
    contact:
      "Bottom of ball (6 o\u2019clock) for pure backspin. Bottom-back (6-7 o\u2019clock) for more loaded cut. Directly in front of or slightly left of centerline, 20-30cm forward. For short balls: arm fully extended over table. Bat angle 40-55\u00b0 open. Timing: descending phase for control, or peak for aggressive short push.",
    wristForearm:
      "Forearm moves forward-and-slightly-downward through contact (25-30cm travel). Wrist adds downward snap at contact (20-25\u00b0 ulnar deviation) \u2014 this is the cut that generates backspin. The motion is forward-down, like slicing under the ball. Speed of wrist snap controls spin amount. Forearm direction controls depth: more forward = deeper, more downward = shorter.",
    followThrough:
      "Bat finishes 20-25cm forward and slightly downward. Elbow relatively straight at end. Return to ready immediately.",
    commonMistakes:
      "Bat face not open enough (clips net). Pushing with arm only, no wrist cut (weak float). Contact too late. Not moving feet to get behind the ball. Pushing too long consistently (predictable, easy to attack).",
    whenToUse:
      "Opponent serves short with backspin or no-spin, too short to loop. Keeping a short game rally to probe for mistakes. Ball is very wide to backhand and you can\u2019t get in position to flick.",
    whenNotToUse:
      "Ball is above net height when it bounces (flick/attack). Ball is long (should be looped). You\u2019re comfortable enough to flick \u2014 flick wins more points.",
    cuePhrase: "Open face, slice under, cut not lift.",
  },
  {
    shot: "fh-opening-loop",
    readyPosition:
      "Distance 50-70cm from table. Right foot back 15-20cm, left foot forward \u2014 classic FH stance. Weight 60% on right foot. Knees bent 20-25\u00b0. Bat at hip/waist height. Body rotated slightly right, loading the right side.",
    gripAdjustment:
      "Standard shakehand, moderate pressure 50-60%. Index finger relaxes slightly off backhand side for wrist freedom. Thumb firm on forehand rubber. Wrist cocked back (extension 25-30\u00b0).",
    preparation:
      "Shoulder turns right 35-45\u00b0. Bat drops to hip level or below, face opens 40-50\u00b0 (pointing partly toward ceiling). Elbow bends to 90-100\u00b0. Left arm extends for counterbalance \u2014 critical for power. Weight loads onto right foot. Knees bend deeper for heavy backspin balls.",
    contact:
      "1-2 o\u2019clock position on the ball, brushing upward and forward. Against heavy backspin: more toward 3 o\u2019clock (further under) with more open face. 35-45cm in front of right hip. Bat angle starts open and closes through contact. Timing: rising ball or at peak. The brushing action generates heavy topspin.",
    wristForearm:
      "Kinetic chain fires sequentially: knees straighten \u2192 hips rotate \u2192 shoulder drives \u2192 forearm whips \u2192 wrist snaps. Forearm rotates forward through 70-90\u00b0 of arc. Wrist snaps at contact for final acceleration. Fan Zhendong model: the whole body contributes but the forearm-wrist is the accelerator.",
    followThrough:
      "Arm finishes high, bat near or above shoulder height. Weight transfers fully to left foot. Right shoulder has rotated 40-50\u00b0 past contact. The follow-through is larger than backhand loop \u2014 the shoulder turn creates additional range.",
    commonMistakes:
      "Not loading weight onto right foot (weak loop). Not using left arm counterbalance. Contact too far back (ball behind you). Not opening bat face enough against heavy backspin. Rushing \u2014 the FH opening loop needs the full preparation phase.",
    whenToUse:
      "Opponent pushes long to your forehand. Any backspin ball at mid-distance on FH side. After serve forces a long return. You\u2019ve stepped around from backhand to attack with forehand.",
    whenNotToUse:
      "Ball is short (push or flick). Ball has topspin (use counter-loop or drive). You\u2019re jammed at the table with no room for the full swing.",
    cuePhrase: "Load right, brush up, let the body rotate.",
  },
  {
    shot: "fh-counter-loop",
    readyPosition:
      "Distance 40-60cm. Feet in FH stance but less extreme than opening loop \u2014 more neutral for quick transitions. Weight balanced, slight forward lean. Bat at chest height, ready to meet incoming topspin.",
    gripAdjustment:
      "Firm grip 60-70%. Wrist slightly forward. Less wrist loading than opening loop \u2014 timing and bat speed matter more than wrist snap here.",
    preparation:
      "Shoulder turns right 25-35\u00b0 (less than opening loop). Bat drops to mid-chest, face closes slightly. Elbow stays relatively close. The preparation is quicker and more compact than the opening loop \u2014 you\u2019re reacting to incoming topspin, not creating from scratch.",
    contact:
      "Top of ball (11-12 o\u2019clock). Bat angle more closed \u2014 65-80\u00b0 depending on incoming spin weight. Contact well in front of body, 35-45cm forward. Timing: at peak or slightly before peak. You\u2019re adding your topspin on top of theirs. Hugo Calderano reference: mid-range bombs at extreme angles, refusing easy balls.",
    wristForearm:
      "Forearm drives forward and slightly upward. Wrist adds controlled acceleration. The forearm-supination-to-pronation rotation adds 20-30% to racket head speed. The motion is more forward than upward compared to opening loop. Use incoming spin energy \u2014 redirect and amplify, don\u2019t fight it.",
    followThrough:
      "Arm finishes across body, bat ending near left shoulder or ear. Weight transfers to left foot. Recovery: step back with right foot to return to neutral. Shorter follow-through than opening loop for faster reset.",
    commonMistakes:
      "Over-rotating (slow recovery). Not closing face enough (ball flies long). Trying to hit through heavy topspin instead of brushing over it. Standing too far back (lose control of the rally).",
    whenToUse:
      "Opponent loops to your forehand in a topspin rally. Ball has moderate to heavy topspin at mid-distance. You want to apply pressure and find angles. Mid-range rally exchanges.",
    whenNotToUse:
      "Ball has backspin (use opening loop). Ball is weak and high (use kill/smash). You\u2019re at the table and should be blocking or counter-driving.",
    cuePhrase: "Forward and over, use their spin.",
  },
  {
    shot: "fh-kill-smash",
    readyPosition:
      "Distance 50-80cm \u2014 need room for full swing. Right foot back 15-20cm, left forward. Weight 60% right foot. Knees 20-25\u00b0 bend. Bat at hip/waist height.",
    gripAdjustment:
      "Tighten to 75-85% at contact. Index finger relaxes off backhand side for full wrist freedom. Thumb stays firm. Wrist cocked back 30-35\u00b0 during backswing.",
    preparation:
      "Shoulder turns right 35-45\u00b0. Bat drops to hip or below, face opens 45-50\u00b0. Elbow bends to 90-100\u00b0. Left arm extends forward and left for counterbalance \u2014 critical for power, not decoration. Weight transfers to right foot.",
    contact:
      "Top-back of ball (12 o\u2019clock). Very high ball: 1 o\u2019clock for topspin margin. Fast flat ball: straight back for pure drive. 40-50cm in front of right hip at or above waist height. Bat angle 70-80\u00b0 (moderately closed). Timing: at peak of bounce. Against high floaters \u2014 don\u2019t rush, you have time.",
    wristForearm:
      "Full kinetic chain: shoulder drives first (20-25\u00b0 turn), elbow extends, then wrist cracks. Forearm rotates through 70-90\u00b0 of arc. Wrist snap: 40-50\u00b0 of explosive flexion in final 30-40ms. Supination to pronation rotation adds 20-30% to racket head speed. This is the Amaterasu finish \u2014 single explosive moment, not sustained push.",
    followThrough:
      "Arm finishes across body, bat near left shoulder or ear. Weight fully on left foot. Right shoulder rotated 40-50\u00b0 past contact. Recovery: step back with right foot.",
    commonMistakes:
      "Hitting with locked elbow (no leverage). Not using left arm counterbalance. Over-rotating shoulder too early. Contact too close to body (jammed). Not closing face against no-spin balls.",
    whenToUse:
      "Opponent\u2019s ball floats high over table. Lifted push too high. Weak lob after you\u2019ve pulled them wide. Any ball above mid-chest with time to set up.",
    whenNotToUse:
      "Ball is low or has heavy topspin (loop instead). Jammed at table with no swing room. Heavy sidespin you haven\u2019t tracked. Off-balance \u2014 don\u2019t kill when unstable.",
    cuePhrase: "Lead with elbow, crack the wrist at contact.",
  },
  {
    shot: "fh-block",
    readyPosition:
      "Very close to table \u2014 15-25cm. Left foot 3-5cm forward, shoulder width. Weight 55% forward, body slightly crouched 25-30\u00b0 forward lean. Bat 5-10cm above table edge. Elbow 5-8cm from body on right side.",
    gripAdjustment:
      "Neutral shakehand, light 35-45%. Index finger relaxed. Wrist slightly extended back 10-15\u00b0 to pre-open bat face.",
    preparation:
      "Minimal \u2014 forearm rotates back only 10-15\u00b0. Elbow may raise 2-3cm. No shoulder rotation \u2014 pure forearm/wrist shot. Preparation time under 100ms, everything on reflex.",
    contact:
      "Top of ball (12 o\u2019clock) against heavy topspin. Top-back (11-12 o\u2019clock) against moderate. Directly in front of right hip, 20-30cm forward. Bat angle 75-85\u00b0 against heavy topspin, 85-90\u00b0 (vertical) against flat pace. Timing: rising ball \u2014 critical for FH block. Contact on rise compresses opponent\u2019s time.",
    wristForearm:
      "Forearm moves forward 10-15cm \u2014 controlled, not limp. Wrist firm at contact, small push-forward 5-10\u00b0. No snap \u2014 snap causes inconsistency on fast incoming balls. Using opponent\u2019s pace \u2014 angle and redirect, don\u2019t generate. For active block: slight pronation pushes ball down the line.",
    followThrough:
      "Bat extends forward 10-15cm, finishes at waist-chest height. Return to ready immediately \u2014 FH block is a setup shot, not a finisher.",
    commonMistakes:
      "Opening bat face too much (pops up, easy counter). Contacting on descent (loses rising-ball advantage). Gripping too tight (deadens feel). Moving elbow away from body (reduces control). Making it passive \u2014 good FH block has slight forward pressure.",
    whenToUse:
      "Opponent loops from one side, redirect crosscourt. Fast exchange where footwork isn\u2019t possible. Redirect angle away from opponent\u2019s power position.",
    whenNotToUse:
      "Ball is short (push or flick). Ball is low (net risk high). You have comfortable position to loop \u2014 always attack over defense.",
    cuePhrase: "Meet it on the rise, redirect not absorb.",
  },
  {
    shot: "fh-flick",
    readyPosition:
      "At or leaning over the table. Weight on left foot initially, right foot prepares to step in. Bat at navel height, face slightly open. Body upright or slight forward lean.",
    gripAdjustment:
      "Loosen to 30-40% \u2014 the most important adjustment of all shots. A loose grip allows the wrist snap that defines the flick. Index finger relaxes completely off backhand side. Thumb stays lightly in contact.",
    preparation:
      "Right foot steps forward and diagonally left \u2014 plant toe pointing toward ball, knee bent 30-35\u00b0. Body crouches: forward lean 20-30\u00b0 at hips, right shoulder drops slightly. Forearm rotates back 20-30\u00b0, elbow bends 100-110\u00b0. Bat face opens 30-40\u00b0 from vertical. Wrist cocks back 30-40\u00b0 \u2014 this is the stored energy. Lazy wrist cock = weak flick.",
    contact:
      "Top-back of ball (11-12 o\u2019clock) \u2014 must contact top half for topspin. Against heavy backspin: further back (12-1 o\u2019clock area), close face more. Over the table, 10-20cm in front of contact foot. Bat angle 70-80\u00b0 at contact (mostly closed). Starting open, closing through contact. Timing: at peak of bounce.",
    wristForearm:
      "The flick is 80% wrist, 20% forearm. Forearm moves forward only 10-15cm \u2014 positions the elbow. Wrist snap: 45-55\u00b0 of explosive flexion in 30-40ms. Direction is forward-and-slightly-downward (creates topspin, not flat drive). Elbow stays as fixed pivot. Against heavy backspin: snap more downward, accelerate through the ball.",
    followThrough:
      "Bat finishes at roughly shoulder height on right side, face toward target. Wrist fully snapped. Right foot immediately steps back \u2014 recovery is mandatory, you\u2019re over the table in a bad position. Weight shifts back to left foot.",
    commonMistakes:
      "Not stepping in (reaching with arm = weak float). Grip too tight (kills wrist snap). Contact too close to net. Insufficient wrist cock. Following through upward instead of forward-down (lifts instead of dips). Not recovering after flick.",
    whenToUse:
      "Short ball to forehand above net height. Serve receive when opponent serves short and you want initiative. No-spin or light-backspin short balls especially.",
    whenNotToUse:
      "Ball below table height at contact (net error certain). Heavy backspin unless wrist speed is confident. Ball is long (just loop). Body not in position (use BH flick or push instead). No time to step in.",
    cuePhrase:
      "Step in, loose grip, snap the wrist down through the top.",
  },
  {
    shot: "fh-push-touch",
    readyPosition:
      "Distance 15-25cm, leaning in. Right foot slightly back or parallel. Significant forward lean from hips 15-20\u00b0 to reach over table. Bat at navel height, face open, elbow bent 80-90\u00b0.",
    gripAdjustment:
      "Neutral shakehand, very light 35-40%. Wrist cocked slightly back. Index finger relaxed \u2014 pushes are feel shots.",
    preparation:
      "Smaller than BH push: forearm rotates back only 15-20\u00b0. Elbow stays close to body 5-8cm. Bat opens to 40-50\u00b0. For very short ball: right foot steps forward and left (diagonal) to get body over table.",
    contact:
      "Bottom of ball (6 o\u2019clock) or bottom-right (5-6 o\u2019clock for sidespin variation). Directly in front of right hip or slightly forward, over the table. Bat angle 40-55\u00b0 open. Timing: descending phase for control, peak for aggressive short push.",
    wristForearm:
      "Forward motion 20-25cm. Wrist adds downward-forward snap at contact 20-30\u00b0 \u2014 less aggressive than BH push because FH wrist mobility is more constrained in this direction. Direction control through wrist angle at contact (line vs crosscourt).",
    followThrough:
      "Bat finishes 15-20cm forward, slightly downward. Right arm extended across table \u2014 recover quickly, vulnerable position.",
    commonMistakes:
      "Standing too far from table (forced to reach). Not stepping in with right foot (weak, lifted push). Pushing too long (FH push easier to attack than BH). Not enough wrist cut (no-spin float).",
    whenToUse:
      "Short ball to forehand too much backspin to flick. Tactical short game probing opponent\u2019s backhand. Change of pace in push rally.",
    whenNotToUse:
      "Ball above net height (always flick or open). Ball is long (loop it). Comfortable flick setup available \u2014 FH push is more passive.",
    cuePhrase: "Step in, cut under, keep it short.",
  },
  {
    shot: "pendulum-serve",
    readyPosition:
      "Stand at left side of table, roughly at left corner. Body angled 30-45\u00b0 to end line (right shoulder toward table). Right foot forward, left foot back \u2014 wide stance for hip rotation room. Close enough that toss falls just inside baseline.",
    gripAdjustment:
      "Loosen grip significantly for wrist freedom. The extended arm pendulum (Lin Yun-Ju model) requires maximum wrist range. Fingers wrap loosely, tightening only at contact moment.",
    preparation:
      "Ball toss from flat palm, 25-35cm height (higher than minimum gives more time for arm arc). Toss position: directly in front of playing shoulder, nearly vertical trajectory. Arm extends outward and low \u2014 the extended arm style creates a longer brush path and wider deception window than compact pendulum.",
    contact:
      "Varies by spin \u2014 this is the Sharingan: all variations from one motion. Short backspin: bottom of ball (6-7 o\u2019clock), open face 60-70\u00b0, decelerate after contact. Heavy backspin: dead bottom (6 o\u2019clock), face 45-50\u00b0, full acceleration through contact. No-spin: side of ball (3-4 o\u2019clock), vertical face, thicker hit not brush. Sidespin: right side (3 o\u2019clock), wrist snaps outward. Back-side: bottom-right (5 o\u2019clock), wrist fires down AND left simultaneously.",
    wristForearm:
      "The differentiation happens in the last 10-20cm of the swing. Entry motion is identical for all variations. Backspin: wrist snaps downward. Sidespin: wrist snaps outward (pronation). No-spin: bat face changes to vertical, thicker contact. Fast long: contact upper-right (1-2 o\u2019clock), more forward drive. The opponent has ~80ms to read the difference \u2014 essentially unreadable at speed.",
    followThrough:
      "Varies but mask it. Backspin: abrupt stop (deception cue \u2014 suggests maximum spin). Heavy backspin: full follow-through, bat ends left of center. No-spin: consciously normalize to look like backspin. The follow-through tell is the last thing opponents read \u2014 train to make them all look similar.",
    commonMistakes:
      "Varying the toss between spin types (most readable tell). Changing stance between variations. Differentiating too early in the swing arc. Slowing arm for no-spin (telegraphs immediately). Not going deep enough on fast long serve. Changing body position to \u2018load up\u2019 for faster serve.",
    whenToUse:
      "Default serve \u2014 70-80% of your serves should be pendulum variations. Build sequences: heavy backspin \u2192 no-spin \u2192 back-side. Each primes opponent to misread the next. Short to FH, long to BH white line as primary targets.",
    whenNotToUse:
      "Opponent has fully read your pendulum (switch to reverse or backhand serve). You\u2019ve served the same variation twice in a row at a critical point.",
    cuePhrase:
      "Same motion every time. The wrist decides at the last second.",
  },
  {
    shot: "reverse-pendulum",
    readyPosition:
      "Same left-side position as regular pendulum. Body angle slightly more open \u2014 about 30\u00b0 rather than 45\u00b0. This is important: the bat path goes left-to-right (opposite to regular), so you need slightly more open position to complete the swing.",
    gripAdjustment:
      "Similar to regular pendulum. Wrist must be flexible for the reversed snap direction. Grip loose for wrist freedom.",
    preparation:
      "Toss slightly further left (toward elbow side) than regular pendulum \u2014 puts ball in path of left-to-right swing. Same height 25-35cm. Arm extends similarly to regular pendulum to maintain visual similarity.",
    contact:
      "Sidespin: left side of ball (9 o\u2019clock). Topspin-sidespin: upper-left quadrant (10-11 o\u2019clock). The bat sweeps from left to right across the ball. The spin curves the OPPOSITE direction of regular pendulum \u2014 breaks toward opponent\u2019s forehand.",
    wristForearm:
      "Wrist snap is inward (supination to pronation, elbow moving right). Bat starts with tip pointing left, swings rightward. For topspin variation: contact at 10-11 o\u2019clock, bat moving right-and-slightly-upward. The reverse wrist snap is less natural \u2014 generates 30-40% less spin until heavily drilled.",
    followThrough:
      "Continues the rightward sweep. Keep elbow extension identical to regular pendulum for deception. The bat face angle at contact is the main difference \u2014 from opponent\u2019s side view, hard to read.",
    commonMistakes:
      "Changing toss position too obviously. Under-accelerating the wrist (reverse snap is less natural). Placing too close to center line \u2014 must go wide to force movement. Looking different from regular pendulum setup.",
    whenToUse:
      "When opponent has heavily committed to reading regular pendulum. Rhythm breaker \u2014 changes the expected curve direction. Target wide forehand to pull opponent off table. Topspin-sidespin variation drops lower than expected.",
    whenNotToUse:
      "As your primary serve (it\u2019s a change-up, not the main weapon). If you haven\u2019t drilled it enough for consistent spin quality.",
    cuePhrase: "Right side of the clock, wrist fires right.",
  },
  {
    shot: "backhand-serve",
    readyPosition:
      "Stand near center or slightly right of center. Body faces table more squarely \u2014 roughly parallel to end line. Feet shoulder-width, weight slightly forward, left foot slightly back or level. Close to table \u2014 serve from just behind end line.",
    gripAdjustment:
      "Standard backhand grip. The key Ovtcharov feature: elbow is raised and leads the swing. Bat tip points roughly downward at start, elbow high. This high-elbow position makes all three spin variations look identical.",
    preparation:
      "Lower toss than pendulum \u2014 16-20cm, giving faster, snappier action. Toss from free hand in front of body, slightly left of center. The lower toss contributes to the \u2018quickness\u2019 feel.",
    contact:
      "Topspin: top of ball (12 o\u2019clock), wrist snaps upward and forward, face closing over ball. Backspin: bottom of ball (6 o\u2019clock), face open nearly horizontal, wrist and elbow whip under. Sidespin: right side of ball (3 o\u2019clock), wrist sweeps left to right. All from the same high-elbow entry position.",
    wristForearm:
      "Elbow drives the initial movement, wrist whips from the cocked position. For backspin: elbow drives downward, wrist whips under \u2014 generates more spin than wrist alone. For topspin: elbow drives forward, wrist closes over. For sidespin: elbow holds steady, wrist sweeps across. The high elbow is the visual anchor for deception.",
    followThrough:
      "Topspin: upward toward table. Backspin: bat ends pointing toward floor. Sidespin: bat sweeps to the right. Freeze elbow position at same height for all variations \u2014 change only wrist direction.",
    commonMistakes:
      "Not raising the elbow (deception lost, serve becomes readable). Tossing too high (loses quick explosive feel). Over-rotating body (telegraphs spin). Placing all variations to same spot (no tactical deception).",
    whenToUse:
      "Close games when you want to bank a point or two with unfamiliar look. When leading and want to throw off opponent\u2019s rhythm. Best targets: short FH for backspin, body/middle for topspin, wide BH for sidespin.",
    whenNotToUse:
      "As your primary serve (it\u2019s a curveball, not the main weapon). When opponent has already seen several and started reading the elbow.",
    cuePhrase: "Elbow first, wrist decides.",
  },
  {
    shot: "receive",
    readyPosition:
      "One step back from end line, slightly to backhand side. Slightly crouched, weight forward on balls of feet \u2014 never flat-footed. Bat in neutral position at waist height, angle slightly open. Eyes on the contact zone \u2014 where bat meets ball on the serve, not the ball after it leaves.",
    gripAdjustment:
      "Neutral ready grip, moderate pressure. Be ready to loosen for flick or firm up for drive. The grip adjustment happens during the read, not before.",
    preparation:
      "Read spin from these cues in order of reliability: (1) Bat face angle at contact \u2014 open = backspin, closed = topspin, vertical = sidespin/dead. (2) Swing direction \u2014 down = backspin, up = topspin, lateral = sidespin, abrupt stop = no-spin. (3) Sound \u2014 sharp hiss = heavy spin brush, soft thunk = dead ball. (4) Ball trajectory \u2014 dips sharply = heavy backspin, stays flat = topspin/dead, curves laterally = sidespin.",
    contact:
      "Decision framework \u2014 Long serve: ATTACK, never push (pushing long = giving server what they want). Short heavy backspin: push with open face, target short BH or fast wide FH. Short no-spin/light: FLICK \u2014 this is the money opportunity. Short sidespin: push with compensated angle. Short topspin: never push (flies off bat), flick or block.",
    wristForearm:
      "For flick receive: step right foot in, bat from below and behind ball, wrist snaps forward-upward at peak of bounce, generate your own topspin. For push receive: open face, contact bottom of ball, forward-downward cut with wrist. For attack on long serve: full loop mechanics, don\u2019t hold back.",
    followThrough:
      "Flick: compact, immediate recovery. Push: forward along table, controlled. Attack: full loop follow-through. In all cases: recover to ready position as fast as possible for ball 4.",
    commonMistakes:
      "Reading the motion instead of the contact (motion is the disguise, contact is truth). Always defaulting to push (eliminates your flick threat, lets server be aggressive). Receiving flat-footed (can\u2019t step into flick or adjust). Not accounting for sidespin lateral drift. Over-reading and freezing. Not testing the serve early in the match.",
    whenToUse:
      "Every receive is a decision point. The first 2-3 points: test variety of returns (push, flick, block) to gather information. Flick to the body/elbow crossover point \u2014 most underrated placement.",
    whenNotToUse:
      "N/A \u2014 receive is always required. The decision is WHICH receive to use, not whether to receive.",
    cuePhrase:
      "Watch the contact, not the arm. Decide before it crosses the net.",
  },
];

const missingRefs = [
  {
    shot: "reverse-pendulum",
    playerName: "Lin Yun-Ju",
    extractionNotes:
      "Reverse pendulum as a rhythm breaker from the same extended arm position. Opposite curve direction to keep opponents from committing to one read.",
  },
  {
    shot: "fh-flick",
    playerName: "Fan Zhendong",
    extractionNotes:
      "Aggressive forehand flick as a surprise weapon on short balls to the forehand side. Steps in decisively, wrist snap generates quality despite limited swing.",
  },
  {
    shot: "fh-block",
    playerName: "Fan Zhendong",
    extractionNotes:
      "Close-to-table forehand redirect. Uses opponent's pace, meets ball on the rise. Transitions quickly back to attack.",
  },
  {
    shot: "bh-push-touch",
    playerName: "Ma Long",
    extractionNotes:
      "Tactical short game mastery. Controls depth and spin variation to probe opponents and set up third-ball attacks. Short push quality is a weapon.",
  },
  {
    shot: "fh-push-touch",
    playerName: "Ma Long",
    extractionNotes:
      "Forehand push as a tactical tool, not just a passive return. Precise placement and spin variation to control the short game.",
  },
];

export async function POST(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  try {
    let guidesSeeded = 0;
    for (const g of guides) {
      await prisma.tTTechniqueGuide.upsert({
        where: { shot: g.shot },
        create: { ...g, updatedAt: new Date() },
        update: { ...g, updatedAt: new Date() },
      });
      guidesSeeded++;
    }

    let refsSeeded = 0;
    for (const r of missingRefs) {
      const existing = await prisma.tTTechniqueReference.findFirst({
        where: { shot: r.shot, playerName: r.playerName },
      });
      if (!existing) {
        await prisma.tTTechniqueReference.create({ data: r });
        refsSeeded++;
      }
    }

    return NextResponse.json({
      seeded: { guides: guidesSeeded, references: refsSeeded },
    });
  } catch (err) {
    console.error("[tt/seed-guides] Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

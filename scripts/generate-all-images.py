#!/usr/bin/env python3
"""Generate all me.io scroll story images using Gemini/Imagen API."""

import os
import sys
import time
from pathlib import Path

from google import genai
from google.genai import types

API_KEY = os.environ.get("GEMINI_API_KEY", "AIzaSyCAI4RmkGt9kZJhPhJA37s17h3hReY-FR0")
OUTPUT_DIR = Path("/Users/mac/prod/me.io/public/images")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# Try models in order of preference
MODELS_TO_TRY = [
    "imagen-4.0-generate-001",
    "gemini-2.5-flash-image",
    "gemini-2.0-flash-exp-image-generation",
    "gemini-3-pro-image-preview",
]

IMAGES = [
    {
        "name": "01-hero-exhausted-creative",
        "ratio": "16:9",
        "prompt": (
            "A person lying face-down on the ground, exhausted and defeated, arms spread wide. "
            "Drawn in heavy black ink with thick, rough brush strokes like a woodcut print. "
            "The figure is anatomically expressive with the weight of their body pressed against the ground. "
            "Scattered around them are floating objects: an open laptop, crumpled paper, coffee cup, phone, clock, "
            "loose dollar bills, and a pen — drifting upward as if gravity released them. "
            "Aggressive crosshatching for shadow. White background. Pure black ink only. "
            "THICK and IMPERFECT strokes — visible brush texture, splatter marks, uneven edges. "
            "Style of relief print, linocut, woodcut. Think Ralph Steadman."
        ),
    },
    {
        "name": "02-goalkeeper-reaching",
        "ratio": "4:3",
        "prompt": (
            "A figure diving horizontally through the air, arms outstretched, reaching desperately "
            "for a small glowing orb just out of grasp. Heavy black ink illustration, woodcut print style. "
            "The body is stretched to its limit, every muscle straining. Thick aggressive brush strokes "
            "define the torso and limbs. Crosshatched shadows on the underside. Ink splatter trails behind. "
            "White background. Pure black ink only. Lines THICK and RAW, carved-into-woodblock feel. "
            "NOT clean or polished digital art."
        ),
    },
    {
        "name": "03-corner-book",
        "ratio": "1:1",
        "prompt": (
            "A single open book with pages fanning out, drawn in heavy black ink woodcut style. "
            "Thick brush strokes, visible texture. The book appears to be floating, pages catching air. "
            "Only the book on white background. Aggressive crosshatching for shadow. "
            "Lines are THICK, rough, imperfect. Linocut print aesthetic."
        ),
    },
    {
        "name": "04-corner-globe",
        "ratio": "1:1",
        "prompt": (
            "A cracked globe or world sphere, drawn in heavy black ink woodcut style. "
            "Visible latitude and longitude lines carved with thick rough strokes. A crack runs through it. "
            "Crosshatched shadows give it dimension. Ink splatter around edges. "
            "Only the globe on white background. Lines THICK and imperfect, like a relief print."
        ),
    },
    {
        "name": "05-corner-envelope",
        "ratio": "1:1",
        "prompt": (
            "An envelope or letter floating in the air, slightly open, drawn in heavy black ink linocut style. "
            "A small piece of paper peeks out. Thick rough brush strokes. White background. "
            "Crosshatched shadow underneath. The envelope appears weightless, slightly tilted. "
            "Lines must be THICK and RAW. Woodcut print aesthetic."
        ),
    },
    {
        "name": "06-corner-coffee",
        "ratio": "1:1",
        "prompt": (
            "A coffee cup tipped over, liquid spilling out in a dramatic splash, drawn in heavy black ink "
            "woodcut style. Thick imperfect brush strokes. White background. Crosshatching on the cup for shadow. "
            "Lines are rough, uneven, hand-carved feeling. Linocut relief print aesthetic."
        ),
    },
    {
        "name": "07-overwhelmed-face",
        "ratio": "3:4",
        "prompt": (
            "A close-up frontal view of a human face in extreme distress. The eyes are replaced by intense "
            "chaotic scribble spirals — tight aggressive circular strokes like the mind is spinning out of control. "
            "The top of the head is open or dissolving into scattered shapes and fragmented marks. "
            "Heavy black ink, woodcut print style. Deep crosshatched shadows under cheekbones and jaw. "
            "Hands grip the sides of the face. Thick ROUGH brush strokes throughout — nothing clean or polished. "
            "The feeling is claustrophobic anxiety. White background. Pure black ink only."
        ),
    },
    {
        "name": "08-the-fall-white-on-black",
        "ratio": "16:9",
        "prompt": (
            "A human figure falling through empty black void, body twisted and limbs spread in freefall. "
            "The figure is rendered in WHITE ink on pure BLACK background — an inversion. "
            "Heavy rough woodcut aesthetic but reversed: thick white brush strokes on black. "
            "The face shows quiet resignation, not panic. One hand reaches upward. "
            "Crosshatched white lines define the musculature. Small white ink splatters trail like stars. "
            "THICK and TEXTURED strokes like scratchboard or white linocut on black paper."
        ),
    },
    {
        "name": "09-blue-ribbon-path",
        "ratio": "9:16",
        "prompt": (
            "A single flowing ribbon or brushstroke in solid cobalt blue on pure white background. "
            "The ribbon curves gracefully in an S-shape from top-left to bottom-right, with natural width "
            "variation — thicker in the middle, tapering at the ends. The edges are slightly rough and organic, "
            "not perfectly smooth. It should feel like a single confident calligraphy stroke. "
            "Minimal — just the one blue stroke on white. The blue should be rich and saturated."
        ),
    },
    {
        "name": "10-spiral-clock",
        "ratio": "16:9",
        "prompt": (
            "A mesmerizing Droste effect spiral of clock faces, each clock getting smaller as it spirals inward "
            "toward a central vanishing point. A Fibonacci spiral made of Roman numeral clock faces. "
            "The clocks are rendered in dark muted blue on a brighter cobalt blue background. "
            "Roman numerals I through XII drawn in slightly rough hand-carved style. "
            "The spiral creates infinite time collapsing inward. Largest numbers at outer edges cropped by frame. "
            "The feeling is meditative. Monochrome blue palette only."
        ),
    },
    {
        "name": "11-peace-brush-text",
        "ratio": "16:9",
        "prompt": (
            "The word PEACE written in massive heavy white brush calligraphy on a cobalt blue background. "
            "The letters are THICK, imperfect, with visible brush texture — dried brush marks, rough edges, "
            "ink pooling at stroke endpoints. NOT a clean font — looks like written with a wide worn-out brush "
            "in a single expressive motion. Letters have slight organic lean and variation. "
            "Behind the main word, faded repetitions echo outward in progressively lighter opacity. "
            "A single small four-pointed star sparkle sits below the word."
        ),
    },
    {
        "name": "12-footer-resting-figure",
        "ratio": "3:2",
        "prompt": (
            "A small figure lying on their side in a restful pose — peacefully resting, not defeated. "
            "Drawn in heavy black ink woodcut style with thick brush strokes. One arm tucked under head "
            "like a pillow. Simpler than detailed — more gestural. Thick crosshatching for shadow. "
            "White background. The mood is calm resolution, acceptance. Linocut print aesthetic."
        ),
    },
    {
        "name": "T1-directionless-brush-text",
        "ratio": "16:9",
        "prompt": (
            "The word DIRECTIONLESS in massive black brush calligraphy on white background. "
            "Each letter painted with an extremely thick worn brush — visible dry brush texture, rough edges, "
            "ink pooling and splatter. Letters are BOLD and HEAVY taking full width. Not uniform — "
            "each letter has different weight and lean, painted in one explosive motion. "
            "Protest poster or punk zine aesthetic. Strokes at least 3x thicker than normal bold font. "
            "Pure black ink on white. Raw, aggressive, powerful."
        ),
    },
    {
        "name": "T2-but-brush-text",
        "ratio": "3:2",
        "prompt": (
            "The word BUT followed by three dots in heavy black brush ink lettering on light gray background. "
            "The letters are thick, slightly irregular, with rough brush texture. "
            "Dramatic and impactful. Ink splatter beneath. The style suggests a dramatic pause. "
            "Woodcut print aesthetic. Heavy, raw brush strokes. NOT a clean digital font."
        ),
    },
    {
        "name": "T3-just-keep-walking-brush-text",
        "ratio": "16:9",
        "prompt": (
            "Two lines of text: JUST KEEP in lighter weight on the first line, then WALKING in massive "
            "extremely heavy black brush calligraphy on the second line. The word WALKING has thick rough "
            "almost violent brush strokes — like carved more than written. Visible brush drag marks, "
            "dry brush texture, uneven baselines. Raw power and defiance. White background. "
            "Woodcut linocut print style. NOT a clean digital font."
        ),
    },
]


def try_generate_with_model(client, model_name, prompt, ratio):
    """Try generating with a specific model."""
    # Imagen models use different API
    if model_name.startswith("imagen"):
        try:
            response = client.models.generate_images(
                model=model_name,
                prompt=prompt,
                config=types.GenerateImagesConfig(
                    number_of_images=1,
                    aspect_ratio=ratio,
                ),
            )
            if response.generated_images:
                return response.generated_images[0].image.image_bytes
        except Exception as e:
            raise e
    else:
        # Gemini models
        config = types.GenerateContentConfig(
            response_modalities=["IMAGE", "TEXT"],
        )
        if ratio:
            config = types.GenerateContentConfig(
                response_modalities=["IMAGE", "TEXT"],
                image_config=types.ImageConfig(aspect_ratio=ratio),
            )

        response = client.models.generate_content(
            model=model_name,
            contents=[prompt],
            config=config,
        )

        for part in response.candidates[0].content.parts:
            if part.inline_data and part.inline_data.mime_type.startswith("image/"):
                return part.inline_data.data

    return None


def main():
    client = genai.Client(api_key=API_KEY)

    # Find a working model
    working_model = None
    for model in MODELS_TO_TRY:
        print(f"Testing model: {model}...")
        try:
            data = try_generate_with_model(client, model, "A simple black circle on white background", "1:1")
            if data:
                working_model = model
                # Save test image
                test_path = OUTPUT_DIR / "_test.png"
                with open(test_path, "wb") as f:
                    f.write(data)
                test_path.unlink()  # Clean up test
                print(f"  -> {model} works!")
                break
            else:
                print(f"  -> {model} returned no image")
        except Exception as e:
            print(f"  -> {model} failed: {e}")
        time.sleep(5)

    if not working_model:
        print("ERROR: No working model found!")
        sys.exit(1)

    print(f"\nUsing model: {working_model}")
    print(f"Output dir: {OUTPUT_DIR}")
    print(f"Images to generate: {len(IMAGES)}")
    print("=" * 60)

    success_count = 0
    fail_count = 0

    for i, img in enumerate(IMAGES):
        name = img["name"]
        out_path = OUTPUT_DIR / f"{name}.png"

        if out_path.exists():
            print(f"\n[{i+1}/{len(IMAGES)}] SKIP {name} (already exists)")
            success_count += 1
            continue

        print(f"\n[{i+1}/{len(IMAGES)}] Generating {name}...")
        print(f"  Ratio: {img['ratio']}")

        retries = 3
        for attempt in range(retries):
            try:
                data = try_generate_with_model(client, working_model, img["prompt"], img["ratio"])
                if data:
                    with open(out_path, "wb") as f:
                        f.write(data)
                    size_kb = out_path.stat().st_size / 1024
                    print(f"  -> SAVED: {out_path} ({size_kb:.0f}KB)")
                    success_count += 1
                    break
                else:
                    print(f"  -> No image returned (attempt {attempt+1}/{retries})")
            except Exception as e:
                err = str(e)
                if "rate" in err.lower() or "quota" in err.lower():
                    wait = 15 * (attempt + 1)
                    print(f"  -> Rate limited, waiting {wait}s (attempt {attempt+1}/{retries})")
                    time.sleep(wait)
                elif "safety" in err.lower():
                    print(f"  -> Safety filter triggered, rephrasing...")
                    # Simplify prompt for retry
                    img["prompt"] = img["prompt"].replace("distress", "tension").replace("anxiety", "pressure")
                    time.sleep(5)
                else:
                    print(f"  -> Error: {err}")
                    time.sleep(10)
        else:
            print(f"  -> FAILED after {retries} attempts")
            fail_count += 1

        # Delay between generations
        if i < len(IMAGES) - 1:
            delay = 8
            print(f"  Waiting {delay}s before next...")
            time.sleep(delay)

    print("\n" + "=" * 60)
    print(f"DONE: {success_count} succeeded, {fail_count} failed")
    print(f"Images saved to: {OUTPUT_DIR}")


if __name__ == "__main__":
    main()

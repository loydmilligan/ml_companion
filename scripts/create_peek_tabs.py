#!/usr/bin/env python3
"""
Create edge tab images for the peek panel.
Resizes cassette spine images and adds rotated handwritten text.

Modes:
  --static    Generate images with baked-in text (default, for fallback)
  --blank     Generate blank images for CSS text overlay (dynamic text)
"""

from PIL import Image, ImageDraw, ImageFont
import os
import sys

# Paths
BASE_DIR = "/home/mmariani/Projects/ml_companion"
GENERATED_DIR = f"{BASE_DIR}/generated"
OUTPUT_DIR = f"{BASE_DIR}/web/public/images/peek-tab"
FONT_PATH = f"{BASE_DIR}/web/public/fonts/Caveat-Bold.ttf"

# Target dimensions for the tab (width x height)
TARGET_WIDTH = 48  # Slightly wider for larger text

# Text to display (only used in static mode)
LEAGUE_NAME = "Hip Jammers"
ROUND_NAME = "Easy as 1, 2, 3"
DATE_TEXT = "JAN 12"  # For the red label area

# Colors
TEXT_DARK = "#1a1510"  # Dark brown for light background
TEXT_LIGHT = "#f0e8d8"  # Cream for dark background
RED_LABEL_TEXT_LIGHT = "#1a1510"  # Dark text on red label (light mode)
RED_LABEL_TEXT_DARK = "#f0e8d8"  # Light text on red label (dark mode)

os.makedirs(OUTPUT_DIR, exist_ok=True)

def create_tab_image(source_path, output_name, text_color, label_text_color, font_size=18, label_font_size=11):
    """Create a tab image with rotated text and date label."""

    # Load the source image
    img = Image.open(source_path).convert("RGBA")
    orig_w, orig_h = img.size

    # Calculate new dimensions maintaining aspect ratio
    aspect = orig_h / orig_w
    new_width = TARGET_WIDTH
    new_height = int(new_width * aspect)

    # Resize
    img = img.resize((new_width, new_height), Image.Resampling.LANCZOS)

    # Load fonts
    try:
        font = ImageFont.truetype(FONT_PATH, font_size)
        font_small = ImageFont.truetype(FONT_PATH, font_size - 4)
        label_font = ImageFont.truetype(FONT_PATH, label_font_size)
    except:
        font = ImageFont.load_default()
        font_small = font
        label_font = font

    # === Draw date in red label area (horizontal, at top) ===
    draw = ImageDraw.Draw(img)

    # Measure date text
    date_bbox = draw.textbbox((0, 0), DATE_TEXT, font=label_font)
    date_width = date_bbox[2] - date_bbox[0]
    date_height = date_bbox[3] - date_bbox[1]

    # Position in red label area (near top, centered horizontally)
    date_x = (img.width - date_width) // 2
    date_y = 12  # Near top where red label is

    draw.text((date_x, date_y), DATE_TEXT, font=label_font, fill=label_text_color)

    # === Draw league name and round name (rotated, with gap) ===

    # Create separate text images for league and round
    dummy = Image.new("RGBA", (1, 1))
    draw_dummy = ImageDraw.Draw(dummy)

    # Measure texts
    league_bbox = draw_dummy.textbbox((0, 0), LEAGUE_NAME, font=font)
    league_width = league_bbox[2] - league_bbox[0]
    league_height = league_bbox[3] - league_bbox[1]

    round_bbox = draw_dummy.textbbox((0, 0), ROUND_NAME, font=font_small)
    round_width = round_bbox[2] - round_bbox[0]
    round_height = round_bbox[3] - round_bbox[1]

    # Gap between league and round name (increased for visual separation)
    gap = 48

    # Total width when stacked vertically (will be rotated)
    total_text_width = league_width + gap + round_width
    max_text_height = max(league_height, round_height)

    # Create text image with both texts
    padding = 6
    text_img = Image.new("RGBA", (total_text_width + padding * 2, max_text_height + padding * 2), (0, 0, 0, 0))
    draw_text = ImageDraw.Draw(text_img)

    # Draw league name on left, round name on right (with gap)
    draw_text.text((padding, padding), LEAGUE_NAME, font=font, fill=text_color)
    draw_text.text((padding + league_width + gap, padding + (league_height - round_height) // 2), ROUND_NAME, font=font_small, fill=text_color)

    # Rotate 90° counter-clockwise (text reads bottom to top)
    text_rotated = text_img.rotate(90, expand=True)

    # Calculate position - center vertically, but offset down from top label area
    text_x = (img.width - text_rotated.width) // 2
    # Position text below the red label area with some padding
    label_area_height = 40  # Approximate height of red label area
    available_height = img.height - label_area_height - 20  # Leave some bottom margin
    text_y = label_area_height + (available_height - text_rotated.height) // 2

    # Composite
    img.paste(text_rotated, (text_x, text_y), text_rotated)

    # Save
    output_path = f"{OUTPUT_DIR}/{output_name}"
    img.save(output_path, "PNG")
    print(f"Created: {output_path} ({img.width}x{img.height})")

    # Also create a 2x version for retina
    img_2x = Image.open(source_path).convert("RGBA")
    img_2x = img_2x.resize((new_width * 2, new_height * 2), Image.Resampling.LANCZOS)

    # Draw date at 2x
    draw_2x = ImageDraw.Draw(img_2x)
    label_font_2x = ImageFont.truetype(FONT_PATH, label_font_size * 2)
    date_bbox_2x = draw_2x.textbbox((0, 0), DATE_TEXT, font=label_font_2x)
    date_width_2x = date_bbox_2x[2] - date_bbox_2x[0]
    date_x_2x = (img_2x.width - date_width_2x) // 2
    draw_2x.text((date_x_2x, 24), DATE_TEXT, font=label_font_2x, fill=label_text_color)

    # Recreate text at 2x
    font_2x = ImageFont.truetype(FONT_PATH, font_size * 2)
    font_small_2x = ImageFont.truetype(FONT_PATH, (font_size - 4) * 2)

    league_bbox_2x = draw_dummy.textbbox((0, 0), LEAGUE_NAME, font=font_2x)
    league_width_2x = league_bbox_2x[2] - league_bbox_2x[0]
    league_height_2x = league_bbox_2x[3] - league_bbox_2x[1]

    round_bbox_2x = draw_dummy.textbbox((0, 0), ROUND_NAME, font=font_small_2x)
    round_width_2x = round_bbox_2x[2] - round_bbox_2x[0]
    round_height_2x = round_bbox_2x[3] - round_bbox_2x[1]

    gap_2x = gap * 2
    total_text_width_2x = league_width_2x + gap_2x + round_width_2x
    max_text_height_2x = max(league_height_2x, round_height_2x)

    text_img_2x = Image.new("RGBA", (total_text_width_2x + padding * 4, max_text_height_2x + padding * 4), (0, 0, 0, 0))
    draw_text_2x = ImageDraw.Draw(text_img_2x)
    draw_text_2x.text((padding * 2, padding * 2), LEAGUE_NAME, font=font_2x, fill=text_color)
    draw_text_2x.text((padding * 2 + league_width_2x + gap_2x, padding * 2 + (league_height_2x - round_height_2x) // 2), ROUND_NAME, font=font_small_2x, fill=text_color)

    text_rotated_2x = text_img_2x.rotate(90, expand=True)

    text_x_2x = (img_2x.width - text_rotated_2x.width) // 2
    text_y_2x = (label_area_height * 2) + ((available_height * 2) - text_rotated_2x.height) // 2
    img_2x.paste(text_rotated_2x, (text_x_2x, text_y_2x), text_rotated_2x)

    output_path_2x = f"{OUTPUT_DIR}/{output_name.replace('.png', '@2x.png')}"
    img_2x.save(output_path_2x, "PNG")
    print(f"Created: {output_path_2x} ({img_2x.width}x{img_2x.height})")

    return img

def create_bin_divider(source_path, output_name, text_color, font_size=14):
    """Create a bin divider tab image with rotated text."""

    img = Image.open(source_path).convert("RGBA")
    orig_w, orig_h = img.size

    # Target: narrower, more tab-like
    target_w = 50
    aspect = orig_h / orig_w
    target_h = int(target_w * aspect)

    img = img.resize((target_w, target_h), Image.Resampling.LANCZOS)

    # Load font
    try:
        font = ImageFont.truetype(FONT_PATH, font_size)
    except:
        font = ImageFont.load_default()

    draw = ImageDraw.Draw(img)

    # For bin divider, text is rotated
    text_full = f"{LEAGUE_NAME}"

    # Measure
    bbox = draw.textbbox((0, 0), text_full, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]

    # Create text image
    text_img = Image.new("RGBA", (text_width + 8, text_height + 8), (0, 0, 0, 0))
    draw_text = ImageDraw.Draw(text_img)
    draw_text.text((4, 4), text_full, font=font, fill=text_color)
    text_rotated = text_img.rotate(90, expand=True)

    # Position - offset right (away from coral stripe)
    text_x = (img.width - text_rotated.width) // 2 + 8
    text_y = (img.height - text_rotated.height) // 2

    img.paste(text_rotated, (text_x, text_y), text_rotated)

    output_path = f"{OUTPUT_DIR}/{output_name}"
    img.save(output_path, "PNG")
    print(f"Created: {output_path} ({img.width}x{img.height})")

    return img

def create_blank_cassette(source_path, output_name):
    """Create a blank cassette tab image (no text) for CSS text overlay."""

    # Load the source image
    img = Image.open(source_path).convert("RGBA")
    orig_w, orig_h = img.size

    # Calculate new dimensions maintaining aspect ratio
    aspect = orig_h / orig_w
    new_width = TARGET_WIDTH
    new_height = int(new_width * aspect)

    # Resize
    img = img.resize((new_width, new_height), Image.Resampling.LANCZOS)

    # Save 1x
    output_path = f"{OUTPUT_DIR}/{output_name}"
    img.save(output_path, "PNG")
    print(f"Created: {output_path} ({img.width}x{img.height})")

    # Create 2x version
    img_2x = Image.open(source_path).convert("RGBA")
    img_2x = img_2x.resize((new_width * 2, new_height * 2), Image.Resampling.LANCZOS)

    output_path_2x = f"{OUTPUT_DIR}/{output_name.replace('.png', '@2x.png')}"
    img_2x.save(output_path_2x, "PNG")
    print(f"Created: {output_path_2x} ({img_2x.width}x{img_2x.height})")

    return img


if __name__ == "__main__":
    # Check for --blank flag
    blank_mode = "--blank" in sys.argv

    if blank_mode:
        print("Creating BLANK peek tab images (for CSS text overlay)...\n")

        # Blank cassette spines (no text)
        create_blank_cassette(
            f"{GENERATED_DIR}/bg_remove_cas_spine_light.png",
            "peek-tab-cassette-blank-light.png"
        )

        create_blank_cassette(
            f"{GENERATED_DIR}/bg_remove_cas_spine_dark.png",
            "peek-tab-cassette-blank-dark.png"
        )

        print("\nDone! Blank images saved to:", OUTPUT_DIR)
    else:
        print("Creating peek tab images with static text...\n")

        # Cassette spines with larger fonts
        create_tab_image(
            f"{GENERATED_DIR}/bg_remove_cas_spine_light.png",
            "peek-tab-cassette-light.png",
            TEXT_DARK,
            RED_LABEL_TEXT_LIGHT,
            font_size=18,
            label_font_size=10
        )

        create_tab_image(
            f"{GENERATED_DIR}/bg_remove_cas_spine_dark.png",
            "peek-tab-cassette-dark.png",
            TEXT_LIGHT,
            RED_LABEL_TEXT_DARK,
            font_size=18,
            label_font_size=10
        )

        # Bin dividers
        create_bin_divider(
            f"{GENERATED_DIR}/bg_remove_bin_div_light.png",
            "peek-tab-divider-light.png",
            TEXT_DARK,
            font_size=12
        )

        create_bin_divider(
            f"{GENERATED_DIR}/bg_remove_bin_div_dark.png",
            "peek-tab-divider-dark.png",
            TEXT_LIGHT,
            font_size=12
        )

        print("\nDone! Images saved to:", OUTPUT_DIR)

#!/usr/bin/env python3
import csv
import json
import os
import re
import time
import urllib.parse
import urllib.request
from pathlib import Path

def load_env(path: Path):
  if not path.exists():
    return
  with path.open() as handle:
    for raw in handle:
      line = raw.strip()
      if not line or line.startswith("#") or "=" not in line:
        continue
      key, value = line.split("=", 1)
      os.environ.setdefault(key.strip(), value.strip())

ROOT = Path(__file__).resolve().parents[1]
load_env(ROOT / ".env")
DISCOGS_TOKEN = os.environ.get("DISCOGS_TOKEN", "")
SUBMISSIONS_PATH = ROOT / "web" / "public" / "data" / "submissions.csv"
OUTPUT_PATH = ROOT / "web" / "public" / "data" / "track_metadata.csv"
SEARXNG_URL = os.environ.get("SEARXNG_URL", "http://192.168.6.11:8888")
REQUEST_DELAY_SEC = float(os.environ.get("SEARXNG_DELAY", "0.8"))
REQUEST_TIMEOUT = float(os.environ.get("SEARXNG_TIMEOUT", "12"))
LIMIT = int(os.environ.get("SEARXNG_LIMIT", "0"))
SEARXNG_ENGINES = os.environ.get("SEARXNG_ENGINES", "")
DEBUG_MISS = os.environ.get("SEARXNG_DEBUG_MISS") == "1"


def load_existing():
  if not OUTPUT_PATH.exists():
    return {}
  with OUTPUT_PATH.open(newline="") as handle:
    reader = csv.DictReader(handle)
    return {row.get("Spotify URI"): row for row in reader if row.get("Spotify URI")}


def load_submissions():
  with SUBMISSIONS_PATH.open(newline="") as handle:
    reader = csv.DictReader(handle)
    rows = [row for row in reader if row.get("Spotify URI")]
  unique = {}
  for row in rows:
    uri = row["Spotify URI"]
    if uri not in unique:
      unique[uri] = row
  return unique


def fetch_results(query):
  params = {
    "q": query,
    "format": "json",
    "language": "en",
    "safesearch": "0",
    "categories": "general",
  }
  if SEARXNG_ENGINES:
    params["engines"] = SEARXNG_ENGINES
  params = urllib.parse.urlencode(params)
  url = f"{SEARXNG_URL}/search?{params}"
  req = urllib.request.Request(url, headers={"User-Agent": "tml-metadata/1.0"})
  with urllib.request.urlopen(req, timeout=REQUEST_TIMEOUT) as resp:
    payload = resp.read().decode("utf-8")
  return json.loads(payload)


def fetch_discogs(title, artist):
  if not DISCOGS_TOKEN:
    return None
  query = f"{title} {artist}".strip()
  params = urllib.parse.urlencode(
    {
      "q": query,
      "type": "release",
      "token": DISCOGS_TOKEN,
      "per_page": "5",
    }
  )
  url = f"https://api.discogs.com/database/search?{params}"
  req = urllib.request.Request(
    url,
    headers={
      "User-Agent": "talking-music-league/1.0",
    },
  )
  with urllib.request.urlopen(req, timeout=REQUEST_TIMEOUT) as resp:
    payload = resp.read().decode("utf-8")
  data = json.loads(payload)
  results = data.get("results", [])
  if not results:
    return None
  return results


def extract_year(text):
  if not text:
    return None
  match = re.search(r"(19|20)\d{2}", text)
  return match.group(0) if match else None


def extract_genres(text):
  if not text:
    return None
  match = re.search(r"Genres?:\\s*([^\\.]+)", text, flags=re.IGNORECASE)
  if not match:
    return None
  raw = match.group(1)
  parts = [part.strip() for part in re.split(r"[;,/]", raw) if part.strip()]
  return ", ".join(parts[:6]) if parts else None


def pick_metadata(results):
  release_year = None
  genres = None
  for item in results:
    blob = " ".join(
      value for value in [item.get("title", ""), item.get("content", "")] if value
    )
    if not release_year and re.search(r"release|released", blob, re.IGNORECASE):
      release_year = extract_year(blob)
    if not genres:
      genres = extract_genres(blob)
    if release_year and genres:
      break
  if not release_year:
    for item in results:
      release_year = (
        extract_year(item.get("content", ""))
        or extract_year(item.get("title", ""))
      )
      if release_year:
        break
  if not genres:
    for item in results:
      genres = extract_genres(item.get("content", "")) or extract_genres(item.get("title", ""))
      if genres:
        break
  return release_year, genres


def pick_discogs_metadata(results):
  if not results:
    return "", ""
  release_year = ""
  genres = ""
  for item in results:
    year = item.get("year")
    if year and not release_year:
      release_year = str(year)
    item_genres = item.get("genre") or []
    if item_genres and not genres:
      genres = ", ".join(item_genres[:6])
    if release_year and genres:
      break
  return release_year, genres


def main():
  if not SUBMISSIONS_PATH.exists():
    raise SystemExit(f"Missing submissions CSV at {SUBMISSIONS_PATH}")
  existing = load_existing()
  submissions = load_submissions()
  output_rows = dict(existing)
  submission_items = list(submissions.items())

  for idx, (uri, row) in enumerate(submission_items, start=1):
    if LIMIT and idx > LIMIT:
      break
    if uri in existing and (existing[uri].get("Release Year") or existing[uri].get("Genres")):
      continue
    title = row.get("Title", "").strip()
    artist = row.get("Artist(s)", "").strip()
    queries = [
      f'{title} {artist} "release date" genre',
      f'{title} {artist} "release year" genre',
      f'{title} {artist} released',
      f'{title} {artist} site:discogs.com',
      f'{title} {artist} site:musicbrainz.org',
      f'{title} {artist} site:wikipedia.org',
    ]
    release_year = ""
    genres = ""
    results = []
    try:
      discogs_results = fetch_discogs(title, artist)
      if discogs_results:
        release_year, genres = pick_discogs_metadata(discogs_results)
    except Exception as exc:
      print(f"Discogs failed for {title} - {artist}: {exc}")
    for query in queries:
      if release_year and genres:
        break
      try:
        data = fetch_results(query)
        results = data.get("results", [])
        release_year, genres = pick_metadata(results)
        if DEBUG_MISS and not release_year:
          if results:
            snippet = results[0].get("content") or results[0].get("title") or ""
            print(f"  miss: {query} -> {snippet[:160]}")
          else:
            unresponsive = data.get("unresponsive_engines")
            print(f"  empty: {query} (unresponsive={unresponsive})")
      except Exception as exc:
        print(f"Failed for {title} - {artist}: {exc}")
      if release_year or genres:
        break
    output_rows[uri] = {
      "Spotify URI": uri,
      "Release Year": release_year or "",
      "Genres": genres or "",
    }
    print(f"[{idx}/{len(submissions)}] {title} - {artist} -> {release_year or 'n/a'} | {genres or 'n/a'}")
    time.sleep(REQUEST_DELAY_SEC)

  if LIMIT and existing:
    for uri, row in submissions.items():
      if uri not in output_rows and uri in existing:
        output_rows[uri] = existing[uri]

  with OUTPUT_PATH.open("w", newline="") as handle:
    writer = csv.DictWriter(handle, fieldnames=["Spotify URI", "Release Year", "Genres"])
    writer.writeheader()
    writer.writerows(output_rows.values())

  print(f"Wrote {len(output_rows)} rows to {OUTPUT_PATH}")


if __name__ == "__main__":
  main()

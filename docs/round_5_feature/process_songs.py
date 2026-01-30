import pandas as pd
import glob
import os
import re

def normalize_string(s):
    """Normalize strings for more accurate deduplication."""
    if pd.isna(s):
        return ""
    # Convert to lowercase, remove punctuation and extra whitespace
    s = str(s).lower()
    s = re.sub(r'[^\w\s]', '', s)
    return " ".join(s.split())

def process_music_data(directory_path="."):
    all_files = glob.glob(os.path.join(directory_path, "*.csv"))
    
    # Track metadata mapping
    # Key: (normalized_artist, normalized_song)
    # Value: { 'artist': original_artist, 'song': original_song, 'genre': set(), 
    #          'year': set(), 'games': set(), 'is_dlc': False, 'gh': False, 'rb': False }
    master_dict = {}

    print(f"Found {len(all_files)} files to process...")

    for file in all_files:
        # Determine the game title from the filename
        game_title = file.split(" - ")[-1].replace(".csv", "")
        
        # Determine franchise
        is_gh = any(term in game_title.upper() for term in ["GH", "GUITAR HERO", "BAND HERO", "DJ HERO"])
        is_rb = any(term in game_title.upper() for term in ["RB", "ROCK BAND", "FUSER", "AUDICA", "LEGO"])

        try:
            # Most sheets have headers on row 1, some are offset. 
            # We'll try to find 'Song' or 'Artist' in the first few rows.
            df = pd.read_csv(file, skipinitialspace=True)
            
            # Basic column mapping logic
            cols = [c.strip() for c in df.columns]
            artist_col = next((c for c in cols if 'ARTIST' in c.upper()), None)
            song_col = next((c for c in cols if 'SONG' in c.upper() or 'TITLE' in c.upper()), None)
            genre_col = next((c for c in cols if 'GENRE' in c.upper()), None)
            year_col = next((c for c in cols if 'YEAR' in c.upper() or 'RELEASE' in c.upper()), None)
            
            if not artist_col or not song_col:
                continue

            for _, row in df.iterrows():
                artist = str(row[artist_col]).strip()
                song = str(row[song_col]).strip()
                
                if artist == "nan" or song == "nan" or not artist or not song:
                    continue

                norm_key = (normalize_string(artist), normalize_string(song))
                
                if norm_key not in master_dict:
                    master_dict[norm_key] = {
                        'Artist': artist,
                        'Song Title': song,
                        'Genre': "",
                        'Year': "",
                        'Guitar Hero Series': False,
                        'Rock Band Series': False,
                        'Games': set(),
                        'Is DLC': False
                    }
                
                entry = master_dict[norm_key]
                entry['Games'].add(game_title)
                
                if is_gh: entry['Guitar Hero Series'] = True
                if is_rb: entry['Rock Band Series'] = True
                
                # Update metadata if available and currently empty
                if genre_col in row and pd.notna(row[genre_col]) and not entry['Genre']:
                    entry['Genre'] = str(row[genre_col]).strip()
                
                if year_col in row and pd.notna(row[year_col]) and not entry['Year']:
                    entry['Year'] = str(row[year_col]).strip()
                
                # Detect DLC status from game title or 'Source' column
                if "DLC" in game_title.upper() or ("Source" in row and "DLC" in str(row["Source"]).upper()):
                    entry['Is DLC'] = True

        except Exception as e:
            print(f"Skipping {file} due to error: {e}")

    # Convert back to flat list for DataFrame
    final_list = []
    for entry in master_dict.values():
        entry['Games'] = ", ".join(sorted(list(entry['Games'])))
        final_list.append(entry)

    final_df = pd.DataFrame(final_list)
    
    # Sort by Artist then Song
    final_df = final_df.sort_values(['Artist', 'Song Title'])
    
    output_name = "music_rhythm_master_list_complete.csv"
    final_df.to_csv(output_name, index=False)
    print(f"Successfully generated {output_name} with {len(final_df)} unique tracks.")

if __name__ == "__main__":
    process_music_data()

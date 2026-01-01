-- Import FamJam2 Season 2 submissions and votes
-- Run this migration via Supabase Dashboard SQL Editor or supabase db push

-- Round ID Mapping (external_round_id -> internal round_id):
-- 19188e64ed3a413da9eeb1bb14b76739 -> 0302db3c-3e44-477b-a313-5219aa5e37e1 (Show Off, round 10)
-- 75cf5c3af0d5406e9282586bb5fef633 -> c71b8c9c-529e-407b-a29f-bda76de3aee9 (It's Not a Phase!, round 9)
-- b8252c9a3cf94d16bea09a8b49d39841 -> 45d63f83-1216-4c47-8444-c89bc76c0bcb (Weatherbug, round 8)
-- 5e3fa6318c3648cd8b098f4cfb43f94b -> 7653fe57-8210-47fc-ae2f-69b0eef587fc (Surprise!, round 7)
-- 6c4e073d7a7843829ccc40c4da6103f6 -> 13e71934-cc5e-41d2-9c32-e363c8bc814e (Hometown Hero, round 6)
-- 68b3dad8d09947ba9b461ef4cb723e0e -> f876e9f1-0e3f-4b1f-8d99-63daddfe4e97 (Get Pumped, round 5)
-- cbff0293ae7740d191984df3ccca85ba -> 2b1af553-0e7c-4832-bb29-ce60f6785177 (No Vault Shit, round 4)
-- e775303cd72f462f9474f449b9224f9f -> a4f0d293-0b07-4020-825c-5d5d809d70d8 (Shower Power, round 3)
-- b2af1d8e51e249a2b70ca7e63389ae56 -> 25151392-3222-49f4-8e71-6f18d0950c30 (Feast For Your Ears, round 2)
-- 1dca94faeb044555b8f88ddce045efa0 -> 02b47f0d-124e-4b90-a3b9-3a71e0088528 (Scorekeepers, round 1)

-- =====================================
-- Round 10: Show Off (already inserted 7)
-- =====================================

-- =====================================
-- Round 9: It's Not a Phase!
-- =====================================
INSERT INTO submissions (round_id, title, artist, album, source_uri, external_round_id, external_submitter_id, external_created_at, external_comment, external_visible_to_voters)
VALUES
  ('c71b8c9c-529e-407b-a29f-bda76de3aee9', 'Song 2 - 2012 Remaster', 'Blur', 'Blur (Special Edition)', 'spotify:track:1FTSo4v6BOZH9QxKc3MbVM', '75cf5c3af0d5406e9282586bb5fef633', '2c50a279a7434625875744cd926951b5', '2025-10-12T01:07:54Z', 'I had a hard time picking a song for this one. Way too many good options.', true),
  ('c71b8c9c-529e-407b-a29f-bda76de3aee9', 'Against The Wind', 'Bob Seger', 'Against The Wind', 'spotify:track:1SWmFiFSIBoDbQJjNKC7SR', '75cf5c3af0d5406e9282586bb5fef633', '576dfe5c1d6d4348bb1010d3c16ffd6e', '2025-10-10T00:42:18Z', 'Very personal. And still meaningful to me.', true),
  ('c71b8c9c-529e-407b-a29f-bda76de3aee9', 'Teenage Dirtbag', 'Wheatus', 'Wheatus', 'spotify:track:25FTMokYEbEWHEdss5JLZS', '75cf5c3af0d5406e9282586bb5fef633', '7c67a5a1dc45447dbe8663e3d0569caa', '2025-10-10T04:24:31Z', 'it''s still good!', true),
  ('c71b8c9c-529e-407b-a29f-bda76de3aee9', 'Hand in My Pocket', 'Alanis Morissette', 'Jagged Little Pill', 'spotify:track:3ArPxT1Wt0Yse6kBeCqGFe', '75cf5c3af0d5406e9282586bb5fef633', 'e999240901ce4d76955dcfe00bf2f022', '2025-10-10T03:14:00Z', '', true),
  ('c71b8c9c-529e-407b-a29f-bda76de3aee9', 'Father And Son', 'Yusuf / Cat Stevens', 'Tea For The Tillerman (Remastered 2020)', 'spotify:track:476V2d6iA2tWXgQboKmTtA', '75cf5c3af0d5406e9282586bb5fef633', 'dcc28e0cb1484913a81b2043ee1b3fb9', '2025-10-10T00:41:51Z', 'Love this song...so beautiful', true),
  ('c71b8c9c-529e-407b-a29f-bda76de3aee9', 'Waterfalls', 'TLC', 'Crazysexycool', 'spotify:track:6qspW4YKycviDFjHBOaqUY', '75cf5c3af0d5406e9282586bb5fef633', 'b3dfab17cc1e4751b56296dd32ed7b12', '2025-10-10T00:49:44Z', 'Still love this song. We listened to it nonstop as we drove around isle of skye.', true),
  ('c71b8c9c-529e-407b-a29f-bda76de3aee9', 'Dammit', 'blink-182', 'Dude Ranch', 'spotify:track:6WkSUgo1VdpzgtiXKlFPcY', '75cf5c3af0d5406e9282586bb5fef633', '2f0b5460e6ad4c9a9203f605c3ca0ad5', '2025-10-12T01:08:32Z', '', false)
ON CONFLICT DO NOTHING;

-- =====================================
-- Round 8: Weatherbug
-- =====================================
INSERT INTO submissions (round_id, title, artist, album, source_uri, external_round_id, external_submitter_id, external_created_at, external_comment, external_visible_to_voters)
VALUES
  ('45d63f83-1216-4c47-8444-c89bc76c0bcb', 'Blinded By Rainbows - Remastered', 'The Rolling Stones', 'Voodoo Lounge (Remastered 2009)', 'spotify:track:2BPuGATHtSHLud79E6tOQm', 'b8252c9a3cf94d16bea09a8b49d39841', 'e999240901ce4d76955dcfe00bf2f022', '2025-10-15T20:46:29Z', '', true),
  ('45d63f83-1216-4c47-8444-c89bc76c0bcb', 'Rain', 'Wildlight, Ayla Nereo, The Polish Ambassador', 'The Tide', 'spotify:track:2mQ7hi5Bi5QI19Ns41RWRQ', 'b8252c9a3cf94d16bea09a8b49d39841', '7c67a5a1dc45447dbe8663e3d0569caa', '2025-10-15T19:52:19Z', 'he''s not actually the Polish Ambassador', true),
  ('45d63f83-1216-4c47-8444-c89bc76c0bcb', 'Mr. Blue Sky', 'Electric Light Orchestra', 'Out of the Blue', 'spotify:track:2RlgNHKcydI9sayD2Df2xp', 'b8252c9a3cf94d16bea09a8b49d39841', '2c50a279a7434625875744cd926951b5', '2025-10-15T16:00:33Z', '', true),
  ('45d63f83-1216-4c47-8444-c89bc76c0bcb', 'The Rain Song - Remaster', 'Led Zeppelin', 'Houses of the Holy (Remaster)', 'spotify:track:3JLrri1xSCui3bzITDJbkk', 'b8252c9a3cf94d16bea09a8b49d39841', '576dfe5c1d6d4348bb1010d3c16ffd6e', '2025-10-16T00:38:18Z', '', true),
  ('45d63f83-1216-4c47-8444-c89bc76c0bcb', 'Steal My Sunshine', 'LEN', 'You Can''t Stop The Bum Rush', 'spotify:track:4agp6oHofabdUedr0B1krj', 'b8252c9a3cf94d16bea09a8b49d39841', '2f0b5460e6ad4c9a9203f605c3ca0ad5', '2025-10-18T06:37:17Z', '', false),
  ('45d63f83-1216-4c47-8444-c89bc76c0bcb', 'Here Comes The Sun - Remastered 2009', 'The Beatles', 'Abbey Road (Remastered)', 'spotify:track:6dGnYIeXmHdcikdzNNDMm2', 'b8252c9a3cf94d16bea09a8b49d39841', 'b3dfab17cc1e4751b56296dd32ed7b12', '2025-10-15T17:09:00Z', 'One of my all time favorite songs. Written by the best Beatle - George.', true),
  ('45d63f83-1216-4c47-8444-c89bc76c0bcb', 'Set Fire to the Rain', 'Adele', '21', 'spotify:track:73CMRj62VK8nUS4ezD2wvi', 'b8252c9a3cf94d16bea09a8b49d39841', 'dcc28e0cb1484913a81b2043ee1b3fb9', '2025-10-16T04:36:11Z', '', false)
ON CONFLICT DO NOTHING;

-- =====================================
-- Round 7: Surprise!
-- =====================================
INSERT INTO submissions (round_id, title, artist, album, source_uri, external_round_id, external_submitter_id, external_created_at, external_comment, external_visible_to_voters)
VALUES
  ('7653fe57-8210-47fc-ae2f-69b0eef587fc', 'Pink Pony Club', 'Chappell Roan', 'The Rise and Fall of a Midwest Princess', 'spotify:track:1k2pQc5i348DCHwbn5KTdc', '5e3fa6318c3648cd8b098f4cfb43f94b', 'dcc28e0cb1484913a81b2043ee1b3fb9', '2025-10-22T04:47:01Z', 'Loved this song when I heard it such a catchy tune...surprised me!', false),
  ('7653fe57-8210-47fc-ae2f-69b0eef587fc', 'Abissama', 'Incredible Polo', 'Abissama', 'spotify:track:2mNmKVBJ1U1nuPFJ5VGjCl', '5e3fa6318c3648cd8b098f4cfb43f94b', '2c50a279a7434625875744cd926951b5', '2025-10-23T06:20:06Z', 'French singer, composer, and beatboxer Incredible Polo''s title track to the 2013 album.', true),
  ('7653fe57-8210-47fc-ae2f-69b0eef587fc', 'CATFISH', 'Doechii', 'Alligator Bites Never Heal', 'spotify:track:3QQvSQKV8YmQxryrnx1m9FqL', '5e3fa6318c3648cd8b098f4cfb43f94b', 'b3dfab17cc1e4751b56296dd32ed7b12', '2025-10-22T15:18:56Z', '', true),
  ('7653fe57-8210-47fc-ae2f-69b0eef587fc', 'My Shot', 'Lin-Manuel Miranda', 'Hamilton', 'spotify:track:4cxvludVmQxryrnx1m9FqL', '5e3fa6318c3648cd8b098f4cfb43f94b', 'e999240901ce4d76955dcfe00bf2f022', '2025-10-22T05:03:57Z', 'Never thought I''d be a musical person!', true),
  ('7653fe57-8210-47fc-ae2f-69b0eef587fc', 'Music For a Sushi Restaurant', 'Harry Styles', 'Harry''s House', 'spotify:track:5LYMamLv12UPbemOaTPyeV', '5e3fa6318c3648cd8b098f4cfb43f94b', '2f0b5460e6ad4c9a9203f605c3ca0ad5', '2025-10-24T07:27:36Z', 'Don''t lie, you dancin', true),
  ('7653fe57-8210-47fc-ae2f-69b0eef587fc', 'Low Rider', 'War', 'Why Can''t We Be Friends?', 'spotify:track:7Bz8yww6UMbTgTVLG6zbI4', '5e3fa6318c3648cd8b098f4cfb43f94b', '576dfe5c1d6d4348bb1010d3c16ffd6e', '2025-10-25T16:49:27Z', '', true),
  ('7653fe57-8210-47fc-ae2f-69b0eef587fc', 'La grenade', 'Clara Luciani', 'Sainte-Victoire', 'spotify:track:7ixCRBD0FZMRBeOBhTu2KD', '5e3fa6318c3648cd8b098f4cfb43f94b', '7c67a5a1dc45447dbe8663e3d0569caa', '2025-10-22T05:21:58Z', 'It''s French?!?', true)
ON CONFLICT DO NOTHING;

-- =====================================
-- Round 6: Hometown Hero
-- =====================================
INSERT INTO submissions (round_id, title, artist, album, source_uri, external_round_id, external_submitter_id, external_created_at, external_comment, external_visible_to_voters)
VALUES
  ('13e71934-cc5e-41d2-9c32-e363c8bc814e', 'Folsom Prison Blues', 'Johnny Cash', 'I Walk the Line', 'spotify:track:0LTSNmOLBt25GMjHlxp9OR', '6c4e073d7a7843829ccc40c4da6103f6', '576dfe5c1d6d4348bb1010d3c16ffd6e', '2025-10-30T19:36:35Z', '', true),
  ('13e71934-cc5e-41d2-9c32-e363c8bc814e', 'Space Ghost Coast To Coast', 'Glass Animals', 'Dreamland', 'spotify:track:0RZLmpEzGR2NHite6rvS5H', '6c4e073d7a7843829ccc40c4da6103f6', '2c50a279a7434625875744cd926951b5', '2025-10-31T19:14:20Z', '', true),
  ('13e71934-cc5e-41d2-9c32-e363c8bc814e', 'Celebrate', 'Anderson .Paak', 'Malibu', 'spotify:track:1zlclNkERGFrCxznXOgkD3', '6c4e073d7a7843829ccc40c4da6103f6', '7c67a5a1dc45447dbe8663e3d0569caa', '2025-10-28T16:52:10Z', 'I almost submitted this for the last round, since it fit that theme too', true),
  ('13e71934-cc5e-41d2-9c32-e363c8bc814e', 'Stockholmsvy', 'Hannes, waterbaby', 'Stockholmsvy', 'spotify:track:3BeaiIXko9QV8689eWB6yd', '6c4e073d7a7843829ccc40c4da6103f6', '041d2dd0b7c346b3bcdc78eb2ebd17e6', '2025-10-31T18:00:53Z', '', false),
  ('13e71934-cc5e-41d2-9c32-e363c8bc814e', 'Los Angeles', 'HAIM', 'Women In Music Pt. III', 'spotify:track:3RXozqS8icK2YGcIggW7KM', '6c4e073d7a7843829ccc40c4da6103f6', 'b3dfab17cc1e4751b56296dd32ed7b12', '2025-10-28T16:39:53Z', '', true),
  ('13e71934-cc5e-41d2-9c32-e363c8bc814e', 'Hotel California', 'Eagles', 'Hotel California', 'spotify:track:40riOy7x9W7GXjyGp4pjAv', '6c4e073d7a7843829ccc40c4da6103f6', 'dcc28e0cb1484913a81b2043ee1b3fb9', '2025-10-28T15:45:55Z', '', false),
  ('13e71934-cc5e-41d2-9c32-e363c8bc814e', 'Lake Shore Drive', 'Aliotta Haynes Jeremiah', 'Lake Shore Drive', 'spotify:track:46MX86XQqYCZRvwPpeq4Gi', '6c4e073d7a7843829ccc40c4da6103f6', 'c9cfa17b4e1443fba81ab98f5b33cf2c', '2025-10-30T05:58:11Z', '', false),
  ('13e71934-cc5e-41d2-9c32-e363c8bc814e', 'California', 'Charlotte Cardin', 'California', 'spotify:track:5zGGeOITimuBNNpRfarEeG', '6c4e073d7a7843829ccc40c4da6103f6', 'e999240901ce4d76955dcfe00bf2f022', '2025-10-28T16:34:24Z', 'One of my fave singers.', true),
  ('13e71934-cc5e-41d2-9c32-e363c8bc814e', 'Leaving Jesusland', 'NOFX', 'Wolves in Wolves'' Clothing', 'spotify:track:7KFKekUmBedCbqUYjrhHyr', '6c4e073d7a7843829ccc40c4da6103f6', '2f0b5460e6ad4c9a9203f605c3ca0ad5', '2025-10-28T19:56:35Z', 'Had to do it...give the lyrics a little look-see before passing judgement', true)
ON CONFLICT DO NOTHING;

-- =====================================
-- Round 5: Get Pumped
-- =====================================
INSERT INTO submissions (round_id, title, artist, album, source_uri, external_round_id, external_submitter_id, external_created_at, external_comment, external_visible_to_voters)
VALUES
  ('f876e9f1-0e3f-4b1f-8d99-63daddfe4e97', 'Mr. Brightside', 'The Killers', 'Hot Fuss', 'spotify:track:003vvx7Niy0yvhvHt4a68B', '68b3dad8d09947ba9b461ef4cb723e0e', 'c9cfa17b4e1443fba81ab98f5b33cf2c', '2025-11-06T17:59:11Z', '', false),
  ('f876e9f1-0e3f-4b1f-8d99-63daddfe4e97', 'Perfect (Exceeder)', 'Mason, Princess Superstar', 'Perfect (Exceeder)', 'spotify:track:0whmIaItqkT8e5PVuPyhvT', '68b3dad8d09947ba9b461ef4cb723e0e', '041d2dd0b7c346b3bcdc78eb2ebd17e6', '2025-11-05T23:06:43Z', 'Eurotrash 4-ever', true),
  ('f876e9f1-0e3f-4b1f-8d99-63daddfe4e97', 'CHOKE', 'The Warning', 'ERROR', 'spotify:track:1GQv9r0tn00ZfHTw92jAcW', '68b3dad8d09947ba9b461ef4cb723e0e', '7c67a5a1dc45447dbe8663e3d0569caa', '2025-11-06T17:44:53Z', '', true),
  ('f876e9f1-0e3f-4b1f-8d99-63daddfe4e97', 'Leaving The Light', 'Genesis Owusu', 'STRUGGLER', 'spotify:track:35nOLWeyoXbZvhcczCzQit', '68b3dad8d09947ba9b461ef4cb723e0e', '2c50a279a7434625875744cd926951b5', '2025-11-09T10:34:17Z', '', false),
  ('f876e9f1-0e3f-4b1f-8d99-63daddfe4e97', 'Shut Up and Dance', 'WALK THE MOON', 'TALKING IS HARD', 'spotify:track:4kbj5MwxO1bq9wjT5g9HaA', '68b3dad8d09947ba9b461ef4cb723e0e', 'dcc28e0cb1484913a81b2043ee1b3fb9', '2025-11-05T21:22:57Z', '', false),
  ('f876e9f1-0e3f-4b1f-8d99-63daddfe4e97', 'One Thing', 'Lola Young', 'One Thing', 'spotify:track:6KFQdIB3njXBQNcg1xUh9U', '68b3dad8d09947ba9b461ef4cb723e0e', 'e999240901ce4d76955dcfe00bf2f022', '2025-11-07T19:19:17Z', 'its not your classic pump up song but it really gets me hyped, especially the drop', false),
  ('f876e9f1-0e3f-4b1f-8d99-63daddfe4e97', 'Pinball Wizard', 'The Who', 'Tommy', 'spotify:track:6LbbHFEajG9e4m0G3L47c4', '68b3dad8d09947ba9b461ef4cb723e0e', '2f0b5460e6ad4c9a9203f605c3ca0ad5', '2025-11-07T02:26:40Z', '', false),
  ('f876e9f1-0e3f-4b1f-8d99-63daddfe4e97', 'Freedom', 'Beyonce, Kendrick Lamar', 'Lemonade', 'spotify:track:7aBxcRw77817BrkdPChAGY', '68b3dad8d09947ba9b461ef4cb723e0e', 'b3dfab17cc1e4751b56296dd32ed7b12', '2025-11-05T23:00:08Z', 'Not really a deep cut, sorry! But Ill never forget her performing this live at the Rose Bowl, SUCH a pump up.', true),
  ('f876e9f1-0e3f-4b1f-8d99-63daddfe4e97', 'Gonna Fly Now', 'Bill Conti', 'Rocky', 'spotify:track:7iXYRR70wewzVYzWScm99j', '68b3dad8d09947ba9b461ef4cb723e0e', '576dfe5c1d6d4348bb1010d3c16ffd6e', '2025-11-06T20:03:45Z', '', true)
ON CONFLICT DO NOTHING;

-- =====================================
-- Round 4: No Vault Shit
-- =====================================
INSERT INTO submissions (round_id, title, artist, album, source_uri, external_round_id, external_submitter_id, external_created_at, external_comment, external_visible_to_voters)
VALUES
  ('2b1af553-0e7c-4832-bb29-ce60f6785177', 'Black Hole', 'Griff', 'One Foot In Front Of The Other', 'spotify:track:0vnKE8ukNmF641XhnEyZJD', 'cbff0293ae7740d191984df3ccca85ba', '7c67a5a1dc45447dbe8663e3d0569caa', '2025-11-13T19:01:08Z', '', false),
  ('2b1af553-0e7c-4832-bb29-ce60f6785177', 'Something Inbetween', 'Olivia Dean', 'The Art of Loving', 'spotify:track:28HadeGsalBfbVfMEkCcF7', 'cbff0293ae7740d191984df3ccca85ba', 'b3dfab17cc1e4751b56296dd32ed7b12', '2025-11-13T20:05:19Z', '', false),
  ('2b1af553-0e7c-4832-bb29-ce60f6785177', 'Life Is', 'Jessica Pratt', 'Here in the Pitch', 'spotify:track:2vECdxxkaVhExdYdB85fyP', 'cbff0293ae7740d191984df3ccca85ba', '041d2dd0b7c346b3bcdc78eb2ebd17e6', '2025-11-13T22:19:46Z', 'Sounds like vault...? But not vault!', false),
  ('2b1af553-0e7c-4832-bb29-ce60f6785177', 'Mariella', 'Khruangbin, Leon Bridges', 'Texas Moon', 'spotify:track:3dvXRk7TZ929m21p49RR5P', 'cbff0293ae7740d191984df3ccca85ba', 'c9cfa17b4e1443fba81ab98f5b33cf2c', '2025-11-15T03:48:05Z', '', true),
  ('2b1af553-0e7c-4832-bb29-ce60f6785177', 'All That', 'Ab-Soul', 'Soul Burger', 'spotify:track:5sk89mgPwZyXgD4augi9Rn', 'cbff0293ae7740d191984df3ccca85ba', '2f0b5460e6ad4c9a9203f605c3ca0ad5', '2025-11-14T08:40:41Z', 'Can I take ya order?', true),
  ('2b1af553-0e7c-4832-bb29-ce60f6785177', 'The Birds Don''t Sing', 'Clipse, John Legend', 'Let God Sort Em Out', 'spotify:track:5YNeRyeovlDh6C2IthH3Vl', 'cbff0293ae7740d191984df3ccca85ba', '2c50a279a7434625875744cd926951b5', '2025-11-13T18:39:33Z', 'Clipse is a rap duo made up of 2 brothers.', true),
  ('2b1af553-0e7c-4832-bb29-ce60f6785177', 'Beautiful Things', 'Benson Boone', 'Beautiful Things', 'spotify:track:6tNQ70jh4OwmPGpYy6R2o9', 'cbff0293ae7740d191984df3ccca85ba', 'dcc28e0cb1484913a81b2043ee1b3fb9', '2025-11-13T18:55:46Z', '', false),
  ('2b1af553-0e7c-4832-bb29-ce60f6785177', 'I Drink Wine', 'Adele', '30', 'spotify:track:6v0UJD4a2FtleHeSYVX02A', 'cbff0293ae7740d191984df3ccca85ba', '576dfe5c1d6d4348bb1010d3c16ffd6e', '2025-11-16T19:10:30Z', '', true),
  ('2b1af553-0e7c-4832-bb29-ce60f6785177', 'Too Easy', 'Connor Price, Nic D', 'ICONIC', 'spotify:track:7EQjPEL70tzjlTgCgU0QrV', 'cbff0293ae7740d191984df3ccca85ba', 'e999240901ce4d76955dcfe00bf2f022', '2025-11-16T14:30:10Z', '', true)
ON CONFLICT DO NOTHING;

-- =====================================
-- Round 3: Shower Power
-- =====================================
INSERT INTO submissions (round_id, title, artist, album, source_uri, external_round_id, external_submitter_id, external_created_at, external_comment, external_visible_to_voters)
VALUES
  ('a4f0d293-0b07-4020-825c-5d5d809d70d8', 'Sorry I''m Here For Someone Else', 'Benson Boone', 'American Heart', 'spotify:track:15zJeVUmKFnbrxm9dxcxYD', 'e775303cd72f462f9474f449b9224f9f', 'dcc28e0cb1484913a81b2043ee1b3fb9', '2025-11-21T00:55:52Z', '', true),
  ('a4f0d293-0b07-4020-825c-5d5d809d70d8', 'Wet Dream', 'Wet Leg', 'Wet Leg', 'spotify:track:260Ub1Yuj4CobdISTOBvM9', 'e775303cd72f462f9474f449b9224f9f', '2c50a279a7434625875744cd926951b5', '2025-11-22T18:45:08Z', '', true),
  ('a4f0d293-0b07-4020-825c-5d5d809d70d8', 'Meaningless', 'Charlotte Cardin', 'Phoenix', 'spotify:track:2E6QMP1mJcyD319Izd5mIK', 'e775303cd72f462f9474f449b9224f9f', 'b3dfab17cc1e4751b56296dd32ed7b12', '2025-11-21T01:34:33Z', '', true),
  ('a4f0d293-0b07-4020-825c-5d5d809d70d8', 'Mary Jane''s Last Dance', 'Tom Petty and the Heartbreakers', 'Greatest Hits', 'spotify:track:3dmqIB2Qxe2XZobw9gXxJ6', 'e775303cd72f462f9474f449b9224f9f', 'c9cfa17b4e1443fba81ab98f5b33cf2c', '2025-11-20T23:01:31Z', 'Just really imagine yourself in the shower', true),
  ('a4f0d293-0b07-4020-825c-5d5d809d70d8', 'California Sunrise', 'Dirty Gold', 'Roar', 'spotify:track:3khtVBKKSjLZie9bMSuf1g', 'e775303cd72f462f9474f449b9224f9f', '041d2dd0b7c346b3bcdc78eb2ebd17e6', '2025-11-21T00:56:35Z', 'For your morning shower.', false),
  ('a4f0d293-0b07-4020-825c-5d5d809d70d8', 'My Delirium', 'Ladyhawke', 'Ladyhawke', 'spotify:track:3vqSWOEMO4OOxa2QJHuitI', 'e775303cd72f462f9474f449b9224f9f', '7c67a5a1dc45447dbe8663e3d0569caa', '2025-11-20T23:27:43Z', '', true),
  ('a4f0d293-0b07-4020-825c-5d5d809d70d8', 'Thinking ''Bout Love', 'Wild Rivers', 'Songs to Break Up To', 'spotify:track:42UaitnwvuKqNcD5Oa2HlD', 'e775303cd72f462f9474f449b9224f9f', 'e999240901ce4d76955dcfe00bf2f022', '2025-11-21T21:17:57Z', '', true),
  ('a4f0d293-0b07-4020-825c-5d5d809d70d8', 'Witchy Woman', 'Eagles', 'Eagles', 'spotify:track:436yrzQWA32vb1sTZKXg9r', 'e775303cd72f462f9474f449b9224f9f', '2f0b5460e6ad4c9a9203f605c3ca0ad5', '2025-11-23T17:49:44Z', '', false),
  ('a4f0d293-0b07-4020-825c-5d5d809d70d8', 'We Are The Champions', 'Queen', 'News Of The World', 'spotify:track:7ccI9cStQbQdystvc6TvxD', 'e775303cd72f462f9474f449b9224f9f', '576dfe5c1d6d4348bb1010d3c16ffd6e', '2025-11-23T00:34:25Z', '', false)
ON CONFLICT DO NOTHING;

-- =====================================
-- Round 2: Feast For Your Ears
-- =====================================
INSERT INTO submissions (round_id, title, artist, album, source_uri, external_round_id, external_submitter_id, external_created_at, external_comment, external_visible_to_voters)
VALUES
  ('25151392-3222-49f4-8e71-6f18d0950c30', 'Kiss The Bottle', 'Jawbreaker', 'Etc.', 'spotify:track:0J8D5urAKG9QFCrUP4XyU6', 'b2af1d8e51e249a2b70ca7e63389ae56', '2f0b5460e6ad4c9a9203f605c3ca0ad5', '2025-12-01T03:29:18Z', '', false),
  ('25151392-3222-49f4-8e71-6f18d0950c30', 'Shapeshifter', 'Lorde', 'Virgin', 'spotify:track:0vtgMfyOVM2Y97DcVVJw3m', 'b2af1d8e51e249a2b70ca7e63389ae56', '7c67a5a1dc45447dbe8663e3d0569caa', '2025-11-27T07:19:31Z', '', true),
  ('25151392-3222-49f4-8e71-6f18d0950c30', 'Soup', 'Remi Wolf', 'Big Ideas', 'spotify:track:1Wi1XpdZzGVIdRTzlTrIEF', 'b2af1d8e51e249a2b70ca7e63389ae56', 'b3dfab17cc1e4751b56296dd32ed7b12', '2025-11-29T22:39:30Z', '', true),
  ('25151392-3222-49f4-8e71-6f18d0950c30', 'Gin and Juice', 'Snoop Dogg', 'Doggystyle', 'spotify:track:39QBkWKnap8wRSW4WB9OK0', 'b2af1d8e51e249a2b70ca7e63389ae56', '041d2dd0b7c346b3bcdc78eb2ebd17e6', '2025-11-27T23:28:28Z', '', false),
  ('25151392-3222-49f4-8e71-6f18d0950c30', 'Strawberry Fields Forever', 'The Beatles', 'Magical Mystery Tour', 'spotify:track:3Am0IbOxmvlSXro7N5iSfZ', 'b2af1d8e51e249a2b70ca7e63389ae56', 'dcc28e0cb1484913a81b2043ee1b3fb9', '2025-11-27T16:06:54Z', '', false),
  ('25151392-3222-49f4-8e71-6f18d0950c30', 'Alcohol', 'The Kinks', 'Muswell Hillbillies', 'spotify:track:3X7xtmkqehuBVaZ59tfK3G', 'b2af1d8e51e249a2b70ca7e63389ae56', 'c9cfa17b4e1443fba81ab98f5b33cf2c', '2025-11-29T20:35:39Z', '', false),
  ('25151392-3222-49f4-8e71-6f18d0950c30', 'Drink Too Much', 'G Flip', 'About Us', 'spotify:track:6G7iasUIzd1NUDvfcZYmxc', 'b2af1d8e51e249a2b70ca7e63389ae56', 'e999240901ce4d76955dcfe00bf2f022', '2025-11-27T16:06:46Z', 'G flip is a hero in the queer community', true),
  ('25151392-3222-49f4-8e71-6f18d0950c30', 'Cheeseburger In Paradise', 'Jimmy Buffett', 'Son Of A Son Of A Sailor', 'spotify:track:6VeZ970uI0Yi6sjBgyFBrp', 'b2af1d8e51e249a2b70ca7e63389ae56', '576dfe5c1d6d4348bb1010d3c16ffd6e', '2025-11-29T01:48:53Z', '', false),
  ('25151392-3222-49f4-8e71-6f18d0950c30', 'Blaxploitation', 'Noname', 'Room 25', 'spotify:track:7npEyXswEtXndjHXQs081U', 'b2af1d8e51e249a2b70ca7e63389ae56', '2c50a279a7434625875744cd926951b5', '2025-12-01T03:16:14Z', '', true)
ON CONFLICT DO NOTHING;

-- =====================================
-- Round 1: Scorekeepers
-- =====================================
INSERT INTO submissions (round_id, title, artist, album, source_uri, external_round_id, external_submitter_id, external_created_at, external_comment, external_visible_to_voters)
VALUES
  ('02b47f0d-124e-4b90-a3b9-3a71e0088528', 'The Wings', 'Gustavo Santaolalla', 'Brokeback Mountain Soundtrack', 'spotify:track:0NLinDVPDkD2OCCqhh6PZ5', '1dca94faeb044555b8f88ddce045efa0', 'b3dfab17cc1e4751b56296dd32ed7b12', '2025-12-04T17:45:09Z', '', false),
  ('02b47f0d-124e-4b90-a3b9-3a71e0088528', 'I''m Forrest... Forrest Gump', 'Alan Silvestri', 'Forrest Gump Score', 'spotify:track:1ijrMIqQvZNsnoqGukPzFD', '1dca94faeb044555b8f88ddce045efa0', 'dcc28e0cb1484913a81b2043ee1b3fb9', '2025-12-04T17:08:41Z', 'So beautiful', false),
  ('02b47f0d-124e-4b90-a3b9-3a71e0088528', 'The Kiss', 'Trevor Jones', 'Last of the Mohicans', 'spotify:track:28BMJNUEpAFUiPOBCk3Xw2', '1dca94faeb044555b8f88ddce045efa0', 'e999240901ce4d76955dcfe00bf2f022', '2025-12-07T18:22:12Z', '', true),
  ('02b47f0d-124e-4b90-a3b9-3a71e0088528', 'Main Title (Theme From Jaws)', 'John Williams', 'Jaws', 'spotify:track:55xly70WJY1cx5qsoogaqs', '1dca94faeb044555b8f88ddce045efa0', '576dfe5c1d6d4348bb1010d3c16ffd6e', '2025-12-04T17:25:06Z', 'Stay out of the water...', true),
  ('02b47f0d-124e-4b90-a3b9-3a71e0088528', 'The James Bond Theme', 'John Barry', 'Music Of John Barry', 'spotify:track:589AelScFm0FYQ4VG1biJi', '1dca94faeb044555b8f88ddce045efa0', 'c9cfa17b4e1443fba81ab98f5b33cf2c', '2025-12-07T07:13:50Z', '', false),
  ('02b47f0d-124e-4b90-a3b9-3a71e0088528', 'End Credits - From Beetlejuice', 'Danny Elfman', 'Beetlejuice Soundtrack', 'spotify:track:5PUFKWLxbNUEtkblAgX10B', '1dca94faeb044555b8f88ddce045efa0', '2f0b5460e6ad4c9a9203f605c3ca0ad5', '2025-12-08T03:20:19Z', '', false),
  ('02b47f0d-124e-4b90-a3b9-3a71e0088528', 'Lux Aeterna', 'Clint Mansell, Kronos Quartet', 'Requiem for a Dream', 'spotify:track:62Da3JOu9H9EIgmqV7DoLG', '1dca94faeb044555b8f88ddce045efa0', '7c67a5a1dc45447dbe8663e3d0569caa', '2025-12-04T17:15:55Z', '', true),
  ('02b47f0d-124e-4b90-a3b9-3a71e0088528', 'Prelude', 'Bernard Herrmann', 'Psycho', 'spotify:track:6lME0CcSj49T7LqeBOygXQ', '1dca94faeb044555b8f88ddce045efa0', '041d2dd0b7c346b3bcdc78eb2ebd17e6', '2025-12-04T18:12:30Z', 'Gimme some mo''', true),
  ('02b47f0d-124e-4b90-a3b9-3a71e0088528', 'Ping Island/Lightning Strike', 'Mark Mothersbaugh', 'Life Aquatic', 'spotify:track:7qkv79RK1ESgjeEgUdcGj8', '1dca94faeb044555b8f88ddce045efa0', '2c50a279a7434625875744cd926951b5', '2025-12-04T16:39:04Z', '', true)
ON CONFLICT DO NOTHING;

-- =====================================
-- Season 3: Create league and rounds
-- =====================================
INSERT INTO leagues (id, group_id, name, season_number, created_at)
VALUES ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'b4e34838-b9e6-4b64-96f1-ff900592f9fb', 'Fam Jam III: Third Time''s the Charm', 3, NOW())
ON CONFLICT DO NOTHING;

-- Season 3 Round 1: Deep Cuts
INSERT INTO rounds (id, league_id, theme, theme_description, status, season_number, round_number, external_round_id, external_created_at, playlist_url, external_playlist_url, created_at)
VALUES ('s3r1-deep-cuts-0000-0000-000000000001', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Deep Cuts', 'Songs that are not well-known by artists who are very well-known. Theme provided by Jordan', 'archived', 3, 1, 'd1250619c349456590ad9fe59e1020fc', '2025-12-12T08:11:45Z', 'https://open.spotify.com/playlist/72nvDA3d8wo6l76qV8MO4p', 'https://open.spotify.com/playlist/72nvDA3d8wo6l76qV8MO4p', NOW())
ON CONFLICT DO NOTHING;

-- Season 3 Round 2: Get In Gear
INSERT INTO rounds (id, league_id, theme, theme_description, status, season_number, round_number, external_round_id, external_created_at, playlist_url, external_playlist_url, created_at)
VALUES ('s3r2-get-in-gear-0000-000000000002', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Get In Gear', 'Songs that mention cars in the lyrics. Theme provided by Jerry', 'archived', 3, 2, '507f34716cd3466484a9eaad0e3ace4a', '2025-12-12T20:18:59Z', 'https://open.spotify.com/playlist/5BAGqASxeRcmzZ8aLEEbVU', 'https://open.spotify.com/playlist/5BAGqASxeRcmzZ8aLEEbVU', NOW())
ON CONFLICT DO NOTHING;

-- Season 3 Round 1 Submissions (Deep Cuts)
INSERT INTO submissions (round_id, title, artist, album, source_uri, external_round_id, external_submitter_id, external_created_at, external_comment, external_visible_to_voters)
VALUES
  ('s3r1-deep-cuts-0000-0000-000000000001', 'Freedom Time - Live', 'Ms. Lauryn Hill', 'MTV Unplugged No. 2.0', 'spotify:track:0kQ2DTgR9iAkIKoeoIHfn9', 'd1250619c349456590ad9fe59e1020fc', 'e999240901ce4d76955dcfe00bf2f022', '2025-12-13T03:26:34Z', 'This entire album is WOW to me', false),
  ('s3r1-deep-cuts-0000-0000-000000000001', 'Bron-Y-Aur Stomp', 'Led Zeppelin', 'Led Zeppelin III', 'spotify:track:1dK6cNOMYjEP3QGYOfwP6t', 'd1250619c349456590ad9fe59e1020fc', '2c50a279a7434625875744cd926951b5', '2025-12-14T04:31:14Z', 'This counts as a deep cut, right?', true),
  ('s3r1-deep-cuts-0000-0000-000000000001', 'Elton''s Song', 'Elton John', 'The Fox', 'spotify:track:1DPHu7wpXxF6XUHz2jKkN2', 'd1250619c349456590ad9fe59e1020fc', 'dcc28e0cb1484913a81b2043ee1b3fb9', '2025-12-17T17:46:55Z', '', false),
  ('s3r1-deep-cuts-0000-0000-000000000001', 'Gold Dust Woman', 'Fleetwood Mac', 'Rumours', 'spotify:track:2w3ScXudq4aD3K5HFO5xvx', 'd1250619c349456590ad9fe59e1020fc', '5be930fc97a44698abbc6cfafda5b2ae', '2025-12-15T12:52:15Z', '', false),
  ('s3r1-deep-cuts-0000-0000-000000000001', 'Stand Inside Your Love', 'The Smashing Pumpkins', 'Machina', 'spotify:track:3RciEQxS7PxtLqMs7OwRsU', 'd1250619c349456590ad9fe59e1020fc', '7c67a5a1dc45447dbe8663e3d0569caa', '2025-12-16T18:00:49Z', 'I love this song', true),
  ('s3r1-deep-cuts-0000-0000-000000000001', 'Truth Doesn''t Make a Noise', 'The White Stripes', 'De Stijl', 'spotify:track:4cuKwDw7T3JELdePWwa3hZ', 'd1250619c349456590ad9fe59e1020fc', 'c9cfa17b4e1443fba81ab98f5b33cf2c', '2025-12-17T02:37:55Z', '', false),
  ('s3r1-deep-cuts-0000-0000-000000000001', 'Lake Of Fire - Live', 'Nirvana', 'MTV Unplugged', 'spotify:track:4UJmPSJsBsIR1U0N79BU1g', 'd1250619c349456590ad9fe59e1020fc', '2f0b5460e6ad4c9a9203f605c3ca0ad5', '2025-12-17T21:13:06Z', 'Hard to find nirvana songs that qualify', false),
  ('s3r1-deep-cuts-0000-0000-000000000001', 'favorite crime', 'Olivia Rodrigo', 'SOUR', 'spotify:track:5JCoSi02qi3jJeHdZXMmR8', 'd1250619c349456590ad9fe59e1020fc', 'b3dfab17cc1e4751b56296dd32ed7b12', '2025-12-14T23:46:37Z', 'I''m hoping the fact that this was never a single makes it deep cut enough.', false),
  ('s3r1-deep-cuts-0000-0000-000000000001', 'Skyline Pigeon', 'Elton John', 'Empty Sky', 'spotify:track:5MimWt53Ukh0gcv7mC0Rnx', 'd1250619c349456590ad9fe59e1020fc', '576dfe5c1d6d4348bb1010d3c16ffd6e', '2025-12-17T17:53:41Z', 'Such a warm song', false),
  ('s3r1-deep-cuts-0000-0000-000000000001', 'Green Eyes', 'Erykah Badu', 'Mama''s Gun', 'spotify:track:6qvtiA4wQQliK6K7oRdovk', 'd1250619c349456590ad9fe59e1020fc', '041d2dd0b7c346b3bcdc78eb2ebd17e6', '2025-12-17T02:10:04Z', '', false)
ON CONFLICT DO NOTHING;

-- Season 3 Round 2 Submissions (Get In Gear)
INSERT INTO submissions (round_id, title, artist, album, source_uri, external_round_id, external_submitter_id, external_created_at, external_comment, external_visible_to_voters)
VALUES
  ('s3r2-get-in-gear-0000-000000000002', 'Jerry Was A Race Car Driver', 'Primus', 'Sailing The Seas Of Cheese', 'spotify:track:19C0LKY3DCcQtuviPJNy5d', '507f34716cd3466484a9eaad0e3ace4a', '2f0b5460e6ad4c9a9203f605c3ca0ad5', '2025-12-23T20:54:32Z', '', false),
  ('s3r2-get-in-gear-0000-000000000002', 'Little Red Corvette', 'Prince', 'The Hits / The B-Sides', 'spotify:track:1gnkotdghLOSDg4OoliVRD', '507f34716cd3466484a9eaad0e3ace4a', 'dcc28e0cb1484913a81b2043ee1b3fb9', '2025-12-23T16:47:47Z', '', false),
  ('s3r2-get-in-gear-0000-000000000002', 'Greased Lightnin''', 'John Travolta, Jeff Conaway', 'Grease', 'spotify:track:1XNE0QfNjdroSdosMIk8F6', '507f34716cd3466484a9eaad0e3ace4a', '576dfe5c1d6d4348bb1010d3c16ffd6e', '2025-12-23T16:41:48Z', 'Burnin up the quarter mile', false),
  ('s3r2-get-in-gear-0000-000000000002', 'Burbons And Lacs', 'Master P, Silkk The Shocker', 'Ghetto D', 'spotify:track:1Xunvmk47Mju6oZlgzm2Ty', '507f34716cd3466484a9eaad0e3ace4a', 'b3dfab17cc1e4751b56296dd32ed7b12', '2025-12-23T15:38:37Z', '', false),
  ('s3r2-get-in-gear-0000-000000000002', 'Sprinter', 'Dave, Central Cee', 'Sprinter', 'spotify:track:2FDTHlrBguDzQkp7PVj16Q', '507f34716cd3466484a9eaad0e3ace4a', 'e999240901ce4d76955dcfe00bf2f022', '2025-12-23T16:27:52Z', '', false),
  ('s3r2-get-in-gear-0000-000000000002', 'Fast Car', 'Tracy Chapman', 'Tracy Chapman', 'spotify:track:2M9ro2krNb7nr7HSprkEgo', '507f34716cd3466484a9eaad0e3ace4a', '7c67a5a1dc45447dbe8663e3d0569caa', '2025-12-22T18:54:44Z', '', true),
  ('s3r2-get-in-gear-0000-000000000002', 'Last Kiss', 'Pearl Jam', 'Lost Dogs', 'spotify:track:3g5f74RbR1W2p0BkwYRTZ9', '507f34716cd3466484a9eaad0e3ace4a', 'c9cfa17b4e1443fba81ab98f5b33cf2c', '2025-12-24T02:55:15Z', '', false),
  ('s3r2-get-in-gear-0000-000000000002', 'The Message', 'Grandmaster Flash, The Furious Five', 'Kings of the Streets', 'spotify:track:4ZIw3JAHPjI57WvWW47lQT', '507f34716cd3466484a9eaad0e3ace4a', '5be930fc97a44698abbc6cfafda5b2ae', '2025-12-23T15:10:47Z', 'Heartbreaker.', true),
  ('s3r2-get-in-gear-0000-000000000002', 'Bow Down', 'Geese', 'Getting Killed', 'spotify:track:5jR6zOQf3HtU2mifXWg6hE', '507f34716cd3466484a9eaad0e3ace4a', '2c50a279a7434625875744cd926951b5', '2025-12-23T21:04:43Z', '', false),
  ('s3r2-get-in-gear-0000-000000000002', 'Bad Girls', 'M.I.A.', 'Matangi', 'spotify:track:6nzXkCBOhb2mxctNihOqbb', '507f34716cd3466484a9eaad0e3ace4a', '041d2dd0b7c346b3bcdc78eb2ebd17e6', '2025-12-22T18:58:04Z', 'Tip: amazing music video.', true)
ON CONFLICT DO NOTHING;

-- Add Marco to season_competitors if not already there
INSERT INTO season_competitors (group_id, external_id, name)
VALUES ('b4e34838-b9e6-4b64-96f1-ff900592f9fb', '5be930fc97a44698abbc6cfafda5b2ae', 'Marco')
ON CONFLICT DO NOTHING;

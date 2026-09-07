-- AccelRestaurants cinematic audio / global media plane
-- Safe to run against an existing database.

alter table public.screens
  add column if not exists audio_config jsonb default '{
    "enabled": true,
    "masterVolume": 0.7,
    "backgroundMusic": "",
    "playlist": [],
    "schedule": {"enabled": false, "startTime": "00:00", "endTime": "23:59", "days": [0,1,2,3,4,5,6]},
    "allowVideoAudio": true,
    "fadeBetweenTracksMs": 1200,
    "quietHours": {"enabled": false, "startTime": "22:00", "endTime": "07:00", "days": [0,1,2,3,4,5,6]},
    "coordinationMode": "priority",
    "duckingEnabled": true,
    "duckLevel": 0.25
  }'::jsonb;

comment on column public.screens.audio_config is
  'Screen-level cinematic audio configuration, including global media playlist, scheduling, quiet hours, ducking, coordination mode, and master volume.';

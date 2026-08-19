# OSR Vocal Hunter V10

Sample-first UX prototype for the vocal-only hunter.

Flow:
user intent -> rule-based YouTube search -> candidate sources -> sample-first presentation -> select candidates -> MY PACK.

Important: this version does NOT pretend that a YouTube video has already been downloaded or that an audio segment has been extracted. The actual audio worker is the next technical layer.

No generative AI is used.

The future worker should:
1. receive selected YouTube source IDs,
2. download only where the user has the necessary rights/permission,
3. extract audio,
4. detect useful vocal regions,
5. cut WAV samples,
6. return playable sample files,
7. attach exact source + timestamp provenance.

Vercel remains the web/search layer; heavy audio processing should run outside Vercel serverless functions.

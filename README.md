# OSR Vocal Hunter V5

V5 deliberately focuses only on VOCALS.

Core idea:
User intent -> rule-based vocal search expansion -> multiple YouTube search families -> candidate scoring -> diverse shortlist.

The search layer always prioritizes acapella / vocals-only / minimal backing, even when the user's wording is broader (e.g. "90s R&B").

It does NOT exclude Shorts. Instead it applies a small Shorts penalty and stronger metadata-based penalties to obvious AI/spam signals.

No generative AI is used.

The next layer is the important one: analyze each shortlisted source and extract the best vocal segments automatically, then curate them into a sample pack. That processing should happen in a separate worker, not in a Vercel serverless function.

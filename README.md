# OSR Sample Hunter V2

No AI is used. The dice button chooses from a fixed list of human-written searches.

This version searches up to five YouTube result pages and filters by view count after retrieving video statistics. YouTube documents `pageToken` pagination and up to 50 results per search request. Additional pages consume API quota.

The current Vercel version is for discovery. It does not package or store 20 arbitrary YouTube audio files. A real "download 20 samples -> named folder -> ZIP" feature should use a dedicated download worker and storage layer, and only process recordings the user is authorized to download and reuse. Vercel serverless functions are not a good fit for long audio downloads and packaging.
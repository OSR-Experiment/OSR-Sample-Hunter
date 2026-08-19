export default async function handler(req,res){
  const key=process.env.YOUTUBE_API_KEY;
  if(!key) return res.status(500).json({error:"YOUTUBE_API_KEY manquante sur le serveur."});
  const {q,count="20",maxViews="3000",duration="any"}=req.query;
  const durMap={short:"short",medium:"medium",long:"long"};
  const params=new URLSearchParams({
    part:"snippet",type:"video",q,maxResults:String(Math.min(Number(count)*3,50)),
    key
  });
  if(durMap[duration]) params.set("videoDuration",durMap[duration]);
  const sr=await fetch("https://www.googleapis.com/youtube/v3/search?"+params);
  if(!sr.ok) return res.status(502).json({error:"YouTube Search API error"});
  const search=await sr.json();
  const ids=(search.items||[]).map(x=>x.id.videoId).filter(Boolean);
  if(!ids.length) return res.json({items:[]});
  const vr=await fetch("https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id="+ids.join(",")+"&key="+key);
  const videos=await vr.json();
  const max=Number(maxViews);
  const items=(videos.items||[]).filter(v=>Number(v.statistics?.viewCount||0)<=max).slice(0,Number(count))
    .map(v=>({title:v.snippet.title,channel:v.snippet.channelTitle,views:Number(v.statistics.viewCount||0),
      thumbnail:v.snippet.thumbnails?.medium?.url||v.snippet.thumbnails?.default?.url,
      duration:isoDuration(v.contentDetails?.duration),url:`https://www.youtube.com/watch?v=${v.id}`}));
  res.json({items});
}
function isoDuration(s){
  if(!s)return null; const m=s.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/); if(!m)return null;
  const h=Number(m[1]||0),mi=Number(m[2]||0),se=Number(m[3]||0);
  return h?`${h}:${String(mi).padStart(2,"0")}:${String(se).padStart(2,"0")}`:`${mi}:${String(se).padStart(2,"0")}`;
}

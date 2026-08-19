export default async function handler(req,res){
const key=process.env.YOUTUBE_API_KEY;if(!key)return res.status(500).json({error:"YOUTUBE_API_KEY manquante sur Vercel."});
const q=String(req.query.q||"").trim(),wanted=Math.min(Math.max(Number(req.query.count||20),1),30),maxViews=Math.max(Number(req.query.maxViews||3000),0);
if(!q)return res.status(400).json({error:"Recherche vide."});
let pageToken="",found=new Map();
for(let page=0;page<5 && found.size<wanted*4;page++){const sp=new URLSearchParams({part:"snippet",type:"video",q,maxResults:"50",key});if(pageToken)sp.set("pageToken",pageToken);
const sr=await fetch("https://www.googleapis.com/youtube/v3/search?"+sp),sj=await sr.json();if(!sr.ok)return res.status(sr.status).json({error:sj.error?.message||"YouTube Search API error"});
for(const x of sj.items||[])if(x.id?.videoId)found.set(x.id.videoId,x);pageToken=sj.nextPageToken||"";if(!pageToken)break}
const ids=[...found.keys()],candidates=[];
for(let i=0;i<ids.length;i+=50){const vp=new URLSearchParams({part:"snippet,statistics,contentDetails",id:ids.slice(i,i+50).join(","),key}),vr=await fetch("https://www.googleapis.com/youtube/v3/videos?"+vp),vj=await vr.json();
if(!vr.ok)return res.status(vr.status).json({error:vj.error?.message||"YouTube Videos API error"});
for(const v of vj.items||[]){const views=Number(v.statistics?.viewCount||0);if(views<=maxViews)candidates.push({title:v.snippet.title,channel:v.snippet.channelTitle,views,thumbnail:v.snippet.thumbnails?.medium?.url||v.snippet.thumbnails?.default?.url,duration:isoDuration(v.contentDetails?.duration),url:`https://www.youtube.com/watch?v=${v.id}`})}}
candidates.sort(()=>Math.random()-.5);res.json({items:candidates.slice(0,wanted)})}
function isoDuration(s){if(!s)return null;const m=s.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);if(!m)return null;const h=Number(m[1]||0),mi=Number(m[2]||0),se=Number(m[3]||0);return h?`${h}:${String(mi).padStart(2,"0")}:${String(se).padStart(2,"0")}`:`${mi}:${String(se).padStart(2,"0")}`}
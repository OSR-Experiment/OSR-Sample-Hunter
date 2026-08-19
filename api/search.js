export default async function handler(req,res){
const key=process.env.YOUTUBE_API_KEY;if(!key)return res.status(500).json({error:"YOUTUBE_API_KEY manquante sur Vercel."});
const q=String(req.query.q||"").trim(),wanted=Math.min(Math.max(Number(req.query.count||20),1),50),maxViews=Math.max(Number(req.query.maxViews||10000),0),depth=req.query.depth||"deep",page=Math.max(Number(req.query.page||0),0);
if(!q)return res.status(400).json({error:"Recherche vide."});
const recentDays=365;
const variants=[q,`${q} live session`,`${q} recording`,`${q} performance`,`${q} session`,`${q} archive`,`${q} obscure`];
const configs=depth==="shallow"?[{order:"relevance",variant:0} ,{order:"date",variant:0}]:depth==="very"?[
{order:"date",variant:0},{order:"date",variant:1},{order:"relevance",variant:0},{order:"relevance",variant:2},{order:"relevance",variant:4},{order:"relevance",variant:5},{order:"date",variant:3},{order:"relevance",variant:6}
]:[{order:"date",variant:0},{order:"relevance",variant:0},{order:"relevance",variant:1},{order:"relevance",variant:3},{order:"date",variant:1}];
const start=page*2, selectedConfigs=configs.slice(start,start+Math.min(4,configs.length-start));
if(!selectedConfigs.length)return res.json({items:[],hasMore:false});
const ids=new Set();
for(const c of selectedConfigs){const sp=new URLSearchParams({part:"snippet",type:"video",q:variants[c.variant],maxResults:"50",order:c.order,key});
if(c.order==="date"){const d=new Date(Date.now()-recentDays*86400000);sp.set("publishedAfter",d.toISOString())}
const sr=await fetch("https://www.googleapis.com/youtube/v3/search?"+sp),sj=await sr.json();if(!sr.ok)return res.status(sr.status).json({error:sj.error?.message||"YouTube Search API error"});for(const x of sj.items||[])if(x.id?.videoId)ids.add(x.id.videoId)}
const all=[...ids],items=[];for(let i=0;i<all.length;i+=50){const vp=new URLSearchParams({part:"snippet,statistics,contentDetails",id:all.slice(i,i+50).join(","),key}),vr=await fetch("https://www.googleapis.com/youtube/v3/videos?"+vp),vj=await vr.json();if(!vr.ok)return res.status(vr.status).json({error:vj.error?.message||"YouTube Videos API error"});for(const v of vj.items||[]){const views=Number(v.statistics?.viewCount||0);if((!maxViews||views<=maxViews)&&!isJunk(v.snippet?.title||""))items.push({id:v.id,title:v.snippet.title,channel:v.snippet.channelTitle,views,thumbnail:v.snippet.thumbnails?.medium?.url||v.snippet.thumbnails?.default?.url,duration:isoDuration(v.contentDetails?.duration),url:`https://www.youtube.com/watch?v=${v.id}`})}}
items.sort(()=>Math.random()-.5);res.json({items:items.slice(0,wanted),hasMore:start+selectedConfigs.length<configs.length})}
function isJunk(t){return /\b(shorts?|reaction|tutorial|lesson|how to|compilation|playlist)\b/i.test(t)}
function isoDuration(s){if(!s)return null;const m=s.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);if(!m)return null;const h=Number(m[1]||0),mi=Number(m[2]||0),se=Number(m[3]||0);return h?`${h}:${String(mi).padStart(2,"0")}:${String(se).padStart(2,"0")}`:`${mi}:${String(se).padStart(2,"0")}`}

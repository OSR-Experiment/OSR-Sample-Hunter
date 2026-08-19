export default async function handler(req,res){
 const key=process.env.YOUTUBE_API_KEY;
 if(!key)return res.status(500).json({error:"YOUTUBE_API_KEY missing on Vercel."});
 const q=String(req.query.q||"").trim();
 const wanted=Math.min(Math.max(Number(req.query.count||10),1),20);
 const maxViews=Math.max(Number(req.query.maxViews||10000),0);
 if(!q)return res.status(400).json({error:"Empty search."});

 // Rule-based intent expansion. No generative AI.
 const intent=parseIntent(q);
 const queries=buildQueries(intent);
 const strategy=[...new Set([
   "vocals only / acapella priority",
   intent.style ? `${intent.style} vocal aesthetic` : "human vocal performance",
   intent.context ? intent.context : "amateur / live / rehearsal sources",
   "recent uploads + older archives",
   "small / less obvious sources",
   "penalize spam, repetitive and obvious AI signals"
 ])];

 const candidates=new Map();
 // Keep API usage bounded: 8 search calls, 25 results each.
 for(const spec of queries.slice(0,8)){
   const sp=new URLSearchParams({part:"snippet",type:"video",q:spec.q,maxResults:"25",order:spec.order,key});
   if(spec.publishedAfter)sp.set("publishedAfter",spec.publishedAfter);
   const sr=await fetch("https://www.googleapis.com/youtube/v3/search?"+sp);
   const sj=await sr.json();
   if(!sr.ok)return res.status(sr.status).json({error:sj.error?.message||"YouTube Search API error"});
   for(const x of sj.items||[])if(x.id?.videoId)candidates.set(x.id.videoId,x);
 }

 const ids=[...candidates.keys()], videos=[];
 for(let i=0;i<ids.length;i+=50){
   const vp=new URLSearchParams({part:"snippet,statistics,contentDetails",id:ids.slice(i,i+50).join(","),key});
   const vr=await fetch("https://www.googleapis.com/youtube/v3/videos?"+vp);
   const vj=await vr.json();
   if(!vr.ok)return res.status(vr.status).json({error:vj.error?.message||"YouTube Videos API error"});
   for(const v of vj.items||[]){
     const views=Number(v.statistics?.viewCount||0);
     if(maxViews && views>maxViews)continue;
     const title=v.snippet?.title||"",desc=v.snippet?.description||"",channel=v.snippet?.channelTitle||"";
     const score=scoreVideo(v,views,q);
     videos.push({
       id:v.id,title,channel,views,
       thumbnail:v.snippet?.thumbnails?.medium?.url||v.snippet?.thumbnails?.default?.url,
       duration:isoDuration(v.contentDetails?.duration),
       publishedAt:v.snippet?.publishedAt,
       ageLabel:ageLabel(v.snippet?.publishedAt),
       score,
       reason:scoreReason(v,score)
     });
   }
 }

 // Diversity-aware selection: don't let one obvious query dominate.
 videos.sort((a,b)=>b.score-a.score);
 const picked=[], usedChannels=new Map();
 for(const v of videos){
   const n=usedChannels.get(v.channel)||0;
   if(n>=2 && picked.length<wanted-1)continue;
   picked.push(v);usedChannels.set(v.channel,n+1);
   if(picked.length>=wanted)break;
 }
 res.json({items:picked,strategy});
}

function parseIntent(q){
 const low=q.toLowerCase();
 const styleWords=["90s r&b","r&b","soul","70s","80s","60s","indie","lofi","gospel","folk","jazz","pop","rock"];
 const contextWords=["amateur","bedroom","church","choir","live","rehearsal","cover","acapella","a cappella","vocal only","isolated","home recording"];
 return {
   style:styleWords.find(x=>low.includes(x))||"",
   context:contextWords.filter(x=>low.includes(x)).slice(0,3).join(" / "),
   female:/female|woman|girl|women/.test(low),
   male:/male|man|boy|men/.test(low),
   recent:/recent|new|newest|fresh|recently|latest/.test(low),
   old:/old|archive|archival|70s|80s|90s|60s/.test(low)
 };
}

function buildQueries(i){
 const base=i.female?"female":i.male?"male":"singer";
 const style=i.style||"vocal";
 const context=i.context;
 const core=[
   `${style} ${base} acapella`,
   `${style} ${base} vocals only`,
   `${style} ${base} isolated vocal`,
   `${style} ${base} vocal rehearsal`,
   `${style} ${base} singer live`,
   `${style} ${base} amateur vocal`,
   `${style} ${base} home recording`,
   `${style} ${base} vocal cover`
 ];
 if(context)core.unshift(`${context} ${style} ${base} vocal`);
 const now=new Date(), recent=new Date(now.getTime()-180*86400000).toISOString();
 const out=[];
 core.slice(0,5).forEach(q=>out.push({q,order:"relevance"}));
 // Date searches are deliberately separate so recent low-view uploads can surface.
 out.push({q:`${style} ${base} vocal`,order:"date",publishedAfter:recent});
 out.push({q:`${style} ${base} acapella`,order:"date",publishedAfter:recent});
 out.push({q:`${style} ${base} singer rehearsal`,order:"date",publishedAfter:recent});
 return out;
}

function scoreVideo(v,views,q){
 const t=(v.snippet?.title||"").toLowerCase(),d=(v.snippet?.description||"").toLowerCase(),c=(v.snippet?.channelTitle||"").toLowerCase();
 let s=0;
 const positive=["acapella","a cappella","vocals only","vocal only","isolated vocal","isolated vocals","no music","voice only","singing","singer","rehearsal","live","cover","choir","church","amateur","bedroom","home recording"];
 const negative=["ai generated","ai music","ai cover","suno","udio","reaction","tutorial","lesson","how to","compilation","playlist","karaoke","lyrics","instrumental","type beat","podcast"];
 for(const w of positive)if(t.includes(w)||d.includes(w))s+=8;
 for(const w of negative)if(t.includes(w)||d.includes(w)||c.includes(w))s-=18;
 // Short-form is allowed. We do NOT exclude Shorts.
 if(/\bshorts?\b/.test(t))s-=2;
 // Low views help, but only as a weak signal.
 if(views===0)s+=2; else if(views<1000)s+=12; else if(views<3000)s+=9; else if(views<10000)s+=5;
 const published=new Date(v.snippet?.publishedAt||Date.now()),ageDays=Math.max(0,(Date.now()-published.getTime())/86400000);
 if(ageDays<30)s+=5; else if(ageDays>3650)s+=7; else if(ageDays>1800)s+=4;
 const dur=parseDuration(v.contentDetails?.duration);
 if(dur>=3&&dur<=900)s+=3;
 // Strongly penalize obvious automated/spam-looking metadata, not vertical format itself.
 if(/\b(ai|generated|suno|udio)\b/.test(c))s-=20;
 if(/\b(ai|generated|suno|udio)\b/.test(t))s-=25;
 if(/\b\d{2,4}\s*(songs|tracks|videos)\b/.test(t))s-=12;
 return s;
}
function scoreReason(v,s){
 const t=(v.snippet?.title||"").toLowerCase();
 const bits=[];
 if(/acapella|a cappella|vocal only|vocals only|isolated/.test(t))bits.push("strong vocal-only signal");
 if(/amateur|bedroom|home|rehearsal/.test(t))bits.push("human/home recording signal");
 if(/ai|suno|udio|generated/.test(t))bits.push("AI/spam penalty applied");
 if(Number(v.statistics?.viewCount||0)<3000)bits.push("low-view signal");
 if(!bits.length)bits.push("broad vocal candidate");
 return bits.join(" · ");
}
function parseDuration(s){const m=String(s||"").match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);if(!m)return 0;return Number(m[1]||0)*3600+Number(m[2]||0)*60+Number(m[3]||0)}
function isoDuration(s){const sec=parseDuration(s);if(!sec)return null;const h=Math.floor(sec/3600),m=Math.floor(sec%3600/60),z=sec%60;return h?`${h}:${String(m).padStart(2,"0")}:${String(z).padStart(2,"0")}`:`${m}:${String(z).padStart(2,"0")}`}
function ageLabel(s){const d=Math.max(0,Math.floor((Date.now()-new Date(s).getTime())/86400000));if(d<1)return"uploaded today";if(d<30)return`uploaded ${d}d ago`;if(d<365)return`uploaded ${Math.floor(d/30)}mo ago`;return`uploaded ${Math.floor(d/365)}y ago`}

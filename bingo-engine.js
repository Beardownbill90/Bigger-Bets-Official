
const bingoJSON=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
const bingoLeagues=[['NBA','basketball','nba'],['NFL','football','nfl'],['NHL','hockey','nhl'],['MLB','baseball','mlb'],['CFB','football','college-football'],['College Basketball','basketball','mens-college-basketball'],['WNBA','basketball','wnba'],['MLS','soccer','usa.1'],['La Liga','soccer','esp.1'],['Premier League','soccer','eng.1']];
const bingoMetrics={basketball:[{name:'Points',keys:['points','PTS'],lines:[19.5,24.5]},{name:'Rebounds',keys:['rebounds','REB'],lines:[4.5,7.5]},{name:'Assists',keys:['assists','AST'],lines:[3.5,5.5]}],football:[{name:'Passing yards',group:'passing',keys:['passingYards','YDS'],lines:[199.5,249.5]},{name:'Rushing yards',group:'rushing',keys:['rushingYards','YDS'],lines:[39.5,69.5]},{name:'Receiving yards',group:'receiving',keys:['receivingYards','YDS'],lines:[39.5,69.5]}],hockey:[{name:'Shots',keys:['shots','shotsTotal','S','SOG'],lines:[1.5,2.5]},{name:'Goals',keys:['goals','G'],lines:[.5,1.5]},{name:'Assists',keys:['assists','A'],lines:[.5,1.5]}],baseball:[{name:'Hits',group:'batting',keys:['hits','H'],lines:[.5,1.5]},{name:'Runs',group:'batting',keys:['runs','R'],lines:[.5,1.5]}],soccer:[{name:'Goals',keys:['goals','G'],lines:[.5,1.5]},{name:'Shots',keys:['shotsTotal','totalShots','SH'],lines:[1.5,2.5]}]};
function bingoDay(now=new Date()){return new Intl.DateTimeFormat('en-CA',{timeZone:'America/Chicago',year:'numeric',month:'2-digit',day:'2-digit'}).format(now).replaceAll('-','')}
function bingoReward(balance){if(balance>=2000000)return Math.floor(balance*1.6);if(balance>=500000)return 2000000;if(balance>=150000)return 500000;if(balance>=60000)return 150000;if(balance>=15000)return 60000;if(balance>=5000)return 15000;if(balance>=100)return 5000;return 1000}
function randomIndex(n){const a=new Uint32Array(1);crypto.getRandomValues(a);return a[0]%n}
function mix(a){const out=[...a];for(let i=out.length-1;i>0;i--){const j=randomIndex(i+1);[out[i],out[j]]=[out[j],out[i]]}return out}
async function bingoFeed(url){const r=await fetch(url,{signal:AbortSignal.timeout(10000),headers:{Accept:'application/json'}});if(!r.ok)throw Error('Score feed unavailable');return r.json()}
function parseBingoGames(raw,league,day,now=Date.now()){const [name,sport,slug]=league;return(raw.events||[]).flatMap(e=>{const c=e.competitions?.[0],s=c?.status?.type||e.status?.type||{},h=c?.competitors?.find(x=>x.homeAway==='home'),a=c?.competitors?.find(x=>x.homeAway==='away');if(!h?.team?.id||!a?.team?.id||s.state!=='pre'||s.completed||/cancel|postpon|suspend|delay/i.test(s.name||'')||!e.date||new Date(e.date).getTime()<=now+60000||bingoDay(new Date(e.date))!==day)return [];return [{league:name,sport,slug,eventId:String(e.id),date:e.date,homeId:String(h.team.id),awayId:String(a.team.id),home:h.team.displayName||h.team.name,away:a.team.displayName||a.team.name}]})}
function bingoURL(g,type){return `https://site.api.espn.com/apis/site/v2/sports/${g.sport}/${g.slug}/${type}`}
function bingoNextDay(day){const d=new Date(Date.UTC(Number(day.slice(0,4)),Number(day.slice(4,6))-1,Number(day.slice(6,8))+1,12));return d.toISOString().slice(0,10).replaceAll('-','')}
async function makeBingoCells(day){
 const now=Date.now(),days=[day,bingoNextDay(day)];
 const boards=await Promise.allSettled(days.flatMap(date=>bingoLeagues.map(async l=>parseBingoGames(await bingoFeed(`https://site.api.espn.com/apis/site/v2/sports/${l[1]}/${l[2]}/scoreboard?dates=${date}&limit=200${l[0]==='CFB'?'&groups=80':l[0]==='College Basketball'?'&groups=50':''}`),l,date,now))));
 if(boards.every(r=>r.status==='rejected'))throw Error('Could not load live sports schedules. Check your connection and tap Draw again.');
 const unique=new Map();for(const result of boards)if(result.status==='fulfilled')for(const g of result.value)if(new Date(g.date).getTime()<=now+48*60*60*1000)unique.set(g.league+':'+g.eventId,g);
 const games=mix([...unique.values()]);
 if(games.length<3)throw Error('Fewer than 3 upcoming games are available within 48 hours. Try again when new schedules are posted.');
 // Use final-score markets so drawing a card never depends on roster or player-log feeds.
 // Each game gets one total direction to avoid contradictory squares on the same card.
 const winners=games.map(g=>{const choice=randomIndex(2);return {...g,type:'winner',choice,label:(choice===0?g.home:g.away)+' to win'}});
 const totals=[],extras=[];
 for(const g of games){
  const base=g.sport==='basketball'?(g.league==='NBA'?219.5:149.5):g.sport==='football'?44.5:g.sport==='hockey'?5.5:g.sport==='baseball'?8.5:2.5;
  const stride=g.sport==='basketball'?5:g.sport==='football'?3:1,side=randomIndex(2)?'over':'under';
  const offsets=[0,-1,1,-2,2,3,4,5];
  for(const [i,offset] of offsets.entries()){
   const line=Math.max(.5,base+offset*stride);
   const cell={...g,type:'total',line,side,label:`${g.away} at ${g.home}: total ${side} ${line}`};
   (i===0?totals:extras).push(cell);
  }
 }
 const seen=new Set(),candidates=[];
 for(const c of [...mix([...winners,...totals]),...mix(extras)]){const key=[c.league,c.eventId,c.type,c.line??c.choice,c.side||''].join(':');if(!seen.has(key)){seen.add(key);candidates.push(c)}}
 const cells=mix(candidates.slice(0,25)).map(c=>({...c,id:crypto.randomUUID(),status:'pending'}));
 if(cells.length!==25)throw Error('Not enough unique upcoming challenges. Try again when more games are scheduled.');
 if(cells.some(c=>new Date(c.date).getTime()<=Date.now()+30000))throw Error('A selected game just started. Please try drawing again.');
 return cells;
}
function gradeBingoCell(cell,raw){const c=raw.header?.competitions?.[0],type=c?.status?.type;if(!type)return {...cell,note:'Waiting for the score feed.'};if(/cancel|abandon/i.test(type.name||''))return {...cell,status:'void',note:'Game canceled — card cannot complete.'};if(!type.completed)return {...cell,note:type.shortDetail||type.description||'Awaiting final result'};const h=c.competitors?.find(x=>x.homeAway==='home'),a=c.competitors?.find(x=>x.homeAway==='away'),score=[Number(h?.score?.value??h?.score),Number(a?.score?.value??a?.score)];if(cell.type==='total'){if(!score.every(Number.isFinite))return {...cell,note:'Final score unavailable.'};const value=score[0]+score[1];return {...cell,status:value===cell.line?'void':(cell.side==='over'?value>cell.line:value<cell.line)?'won':'lost',actual:value,note:'Reported final game total'}}if(cell.type==='winner'){if(!score.every(Number.isFinite))return {...cell,note:'Final score unavailable.'};const chosen=cell.choice===0?h:a,other=cell.choice===0?a:h,won=chosen?.winner===true||score[cell.choice]>score[1-cell.choice];if(!won&&!other?.winner&&score[0]===score[1]&&cell.sport!=='soccer')return {...cell,status:'void',note:'Tied game — card cannot complete.'};return {...cell,status:won?'won':'lost',actual:score.join('–'),note:'Reported final score'}}const stat=readPlayerStat(raw,{...cell,metric:cell.metric});if(stat.dnp)return {...cell,status:'void',note:'Did not play — card cannot complete.'};if(stat.missing)return {...cell,note:'Waiting for a supported final player stat.'};if(stat.value===cell.line)return {...cell,status:'void',actual:stat.value,note:'Exact line — void'};return {...cell,status:(cell.side==='over'?stat.value>cell.line:stat.value<cell.line)?'won':'lost',actual:stat.value,note:'Reported final player stat'};
}

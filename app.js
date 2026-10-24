// Shortcut for document.getElementById
const $=id=>document.getElementById(id);
// Weather icons: SVG pieces combined by wx() below
const SUN='<circle cx="22" cy="22" r="9" fill="url(#sg)"/><g stroke="#fbbf24" stroke-width="2.5" stroke-linecap="round"><path d="M22 6v4M22 34v4M6 22h4M34 22h4M10.7 10.7l2.8 2.8M30.5 30.5l2.8 2.8M10.7 33.3l2.8-2.8M30.5 13.5l2.8-2.8"/></g>';
const MOON='<path d="M30 6a17 17 0 1 0 12 29A15 15 0 0 1 30 6z" fill="url(#mg)"/>';
const CLD=(x=0,y=0,s=1)=>`<path transform="translate(${x} ${y}) scale(${s})" d="M13 40a8.5 8.5 0 0 1-1-16.9A12 12 0 0 1 35 21a9.5 9.5 0 0 1 1 19z" fill="url(#cg)"/>`;
const DROPS='<g stroke="#60a5fa" stroke-width="2.6" stroke-linecap="round"><path d="M17 43l-2 4M25 43l-2 4M33 43l-2 4"/></g>';
const SNOW='<g fill="#bfdbfe"><circle cx="16" cy="45" r="1.8"/><circle cx="25" cy="46" r="1.8"/><circle cx="34" cy="45" r="1.8"/></g>';
const FOG='<g stroke="#cbd5e1" stroke-width="2.6" stroke-linecap="round"><path d="M12 44h24M16 48h18"/></g>';
const BOLT='<path d="M26 36l-6 9h5l-2 6 8-10h-5z" fill="#fde047"/>';
// Returns the SVG icon for a weather code (WMO); night swaps the sun for a moon
function wx(c,night){
  const clear=night?MOON:SUN;let b;
  if(c==0)b=clear;
  else if(c==1)b=clear+CLD(10,6,.6);
  else if(c==2)b=`<g transform="translate(-6 -6) scale(.9)">${clear}</g>`+CLD(2,-2,1);
  else if(c==3)b=CLD(0,-6,1.05);
  else if(c==45||c==48)b=CLD(0,-8,1)+FOG;
  else if((c>=71&&c<=77)||c==85||c==86)b=CLD(0,-8,1)+SNOW;
  else if(c>=95)b=CLD(0,-8,1)+BOLT;
  else b=CLD(0,-8,1)+DROPS;
  return `<svg viewBox="0 0 48 52" aria-hidden="true">${b}</svg>`;
}
// Small raindrop icon used in the hourly rain chance
const DROPI='<svg class="dr" viewBox="0 0 24 24"><path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/></svg>';
// Weather code -> text label (the emoji slot is unused; wx() draws the icon)
const WMO={0:['☀️','Sunny'],1:['🌤','Mostly Sunny'],2:['⛅','Partly Cloudy'],3:['☁️','Cloudy'],45:['🌫','Fog'],48:['🌫','Fog'],51:['🌦','Light Drizzle'],53:['🌦','Drizzle'],55:['🌧','Heavy Drizzle'],61:['🌧','Light Rain'],63:['🌧','Rain'],65:['🌧','Heavy Rain'],71:['🌨','Light Snow'],73:['🌨','Snow'],75:['❄️','Heavy Snow'],80:['🌦','Showers'],81:['🌧','Showers'],82:['⛈','Heavy Showers'],95:['⛈','Thunderstorm'],96:['⛈','Thunderstorm'],99:['⛈','Thunderstorm']};
// Returns [icon svg, label] for a weather code
const wmo=(c,night)=>{const w=WMO[c]||['','Cloudy'];return [wx(c,night),night&&c<=1?w[1].replace('Sunny','Clear'):w[1]]};
// Current city; Addis Ababa is the default
let place={name:'Addis Ababa',country:'Ethiopia',lat:9.03,lon:38.74};
// Shows a status or error message under the temperature
const status=(t,err)=>{$('stxt').textContent=t;$('status').className='status'+(err?' err':'')};
const busy=on=>{$('spin').hidden=!on;document.querySelector('.hero').classList.toggle('loading',on)};
// Formats a change value like "↑ 7 %" (arrow shows up, down or same)
const delta=(el,d,unit,dec=0)=>{const v=+d.toFixed(dec);el.textContent=(v>0?'↑ ':v<0?'↓ ':'→ ')+Math.abs(v)+' '+unit};

// Fetches forecast from Open-Meteo (no API key), then draws the page; past_days=1 gives yesterday for comparisons
async function load(){
  status('Loading forecast…');busy(true);
  const f='https://api.open-meteo.com/v1/forecast?latitude='+place.lat+'&longitude='+place.lon+
   '&current=temperature_2m,weather_code,is_day&hourly=temperature_2m,weather_code,precipitation_probability,relative_humidity_2m,surface_pressure,wind_speed_10m,visibility,is_day'+
   '&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto&past_days=1&forecast_days=6';
  try{
    const r=await fetch(f);if(!r.ok)throw 0;const d=await r.json();render(d);status('');busy(false);
    loadAir();$('map').src='https://embed.windy.com/embed2.html?lat='+place.lat+'&lon='+place.lon+'&zoom=6&level=surface&overlay=rain&marker=true&metricWind=km/h&metricTemp=°C';
  }catch(e){busy(false);status('Could not load weather. Check your connection and try again.',true)}
}
// Fills the whole Forecast view from the API response
function render(d){
  $('city').textContent=place.name;$('aqCity').textContent=place.name;$('country').textContent=place.country;
  const c=d.current,h=d.hourly,dy=d.daily,night=!c.is_day;
  const [ic,txt]=wmo(c.weather_code,night);
  $('temp').textContent=Math.round(c.temperature_2m);$('icon').innerHTML=ic;$('cond').textContent=txt;
  $('hl').innerHTML='H: '+Math.round(dy.temperature_2m_max[1])+'° &nbsp; L: '+Math.round(dy.temperature_2m_min[1])+'°';
  const tz=d.timezone,abbr=d.timezone_abbreviation.replace('GMT+3','EAT');
  $('time').textContent=new Intl.DateTimeFormat('en-US',{hour:'numeric',minute:'2-digit',timeZone:tz}).format(new Date())+' '+abbr;
  // i = index of the current hour in the hourly list; i-24 is the same hour yesterday
  const i=h.time.indexOf(c.time.slice(0,13)+':00'),y=i-24;
  $('hum').textContent=h.relative_humidity_2m[i];$('wind').textContent=Math.round(h.wind_speed_10m[i]);
  $('pres').textContent=Math.round(h.surface_pressure[i]);$('vis').textContent=Math.round(h.visibility[i]/1000);
  delta($('dHum'),h.relative_humidity_2m[i]-h.relative_humidity_2m[y],'%');
  delta($('dWind'),h.wind_speed_10m[i]-h.wind_speed_10m[y],'km/h');
  delta($('dPres'),h.surface_pressure[i]-h.surface_pressure[y],'hPa');
  delta($('dVis'),(h.visibility[i]-h.visibility[y])/1000,'km');
  const fmt=(s,o)=>new Intl.DateTimeFormat('en-US',{...o,timeZone:'UTC'}).format(new Date(s+'T12:00:00Z'));
  $('days').innerHTML=[1,2,3,4,5].map(k=>{const w=wmo(dy.weather_code[k]);return `<div class="cell${k==1?' sel':''}"><b>${k==1?'Today':fmt(dy.time[k],{weekday:'short'})}</b><small>${fmt(dy.time[k],{month:'short',day:'numeric'})}</small><span class="ic">${w[0]}</span><b>${Math.round(dy.temperature_2m_max[k])}°<small> / ${Math.round(dy.temperature_2m_min[k])}°</small></b><small>${w[1]}</small></div>`}).join('');
  $('hours').innerHTML=[0,1,2,3,4,5].map(k=>{const j=i+k,w=wmo(h.weather_code[j],!h.is_day[j]);
    const t=h.time[j].slice(11,13)|0,lab=(t%12||12)+' '+(t<12?'AM':'PM');
    return `<div class="cell${k==0?' sel':''}"><small>${lab}</small><span class="ic">${w[0]}</span><b>${Math.round(h.temperature_2m[j])}°</b><span class="rain">${DROPI}${h.precipitation_probability[j]??0}%</span></div>`}).join('');
  chart(dy,fmt);
  // Pick the hero background: night, snow, rain, sunny or cloudy
  const code=c.weather_code,sky=night?'night':(code>=71&&code<=77)||code==85||code==86?'snow':(code>=51&&code<=67)||(code>=80&&code<=82)||code>=95?'rain':code<=1?'sunny':'cloudy';
  document.querySelector('.hero').dataset.sky=sky;
  const rain=Math.max(...[1,2,3].map(k=>dy.precipitation_sum[k]));
  $('tipT').textContent=rain>2?'Rain expected soon':c.temperature_2m>30?'It\u2019s hot out there':'Enjoy the weather';
  $('tipD').textContent=rain>2?'Pack an umbrella before you head out.':c.temperature_2m>30?'Drink water and stay in the shade.':'Stay prepared, stay comfortable.';
}
// Draws the 5-day precipitation chart as an inline SVG (curve plus bars)
function chart(dy,fmt){
  const v=[1,2,3,4,5].map(k=>dy.precipitation_sum[k]),max=Math.max(10,Math.ceil(Math.max(...v)/5)*5),W=300,H=170,L=34,B=34,pw=W-L-6,ph=H-B-8,step=pw/5;
  let s=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Precipitation for the next 5 days"><defs><linearGradient id="pg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3b82f6" stop-opacity=".9"/><stop offset="1" stop-color="#1d4ed8" stop-opacity=".15"/></linearGradient></defs>`;
  [0,.5,1].forEach(p=>{const y=8+ph*(1-p);s+=`<line x1="${L}" x2="${W-6}" y1="${y}" y2="${y}" stroke="currentColor" opacity=".15"/><text x="0" y="${y+4}" font-size="9" fill="currentColor" opacity=".7">${max*p} mm</text>`});
  const pts=v.map((n,k)=>[L+step*(k+.5),8+ph*(1-n/max)]);
  let p=`M${pts[0][0]},${8+ph}L${pts[0][0]},${pts[0][1]}`;
  for(let k=1;k<pts.length;k++){const mx=(pts[k-1][0]+pts[k][0])/2;p+=`C${mx},${pts[k-1][1]} ${mx},${pts[k][1]} ${pts[k][0]},${pts[k][1]}`}
  p+=`L${pts[4][0]},${8+ph}Z`;
  s+=`<path d="${p}" fill="url(#pg)"/>`;
  v.forEach((n,k)=>{const x=L+step*(k+.5),h=Math.max(4,ph*n/max);s+=`<rect x="${x-6}" y="${8+ph-h}" width="12" height="${h}" rx="3" fill="#3b82f6" opacity=".9"/><text x="${x}" y="${H-18}" text-anchor="middle" font-size="9" fill="currentColor">${k?fmt(dy.time[k+1],{weekday:'short'}):'Today'}</text><text x="${x}" y="${H-7}" text-anchor="middle" font-size="8" fill="currentColor" opacity=".6">${fmt(dy.time[k+1],{month:'short',day:'numeric'})}</text>`});
  $('chart').innerHTML=s+'</svg>';
}
// AQI levels: [max AQI, label, colour, advice line 1, advice line 2]
const LV=[[50,'Good','#34d399','Air is clean','Enjoy outdoor activities'],[100,'Moderate','#2fe6a0','Generally acceptable','for most people.'],[150,'Unhealthy for Sensitive Groups','#facc15','Sensitive groups should limit','prolonged outdoor effort.'],[200,'Unhealthy','#fb923c','Everyone should reduce','prolonged outdoor effort.'],[300,'Very Unhealthy','#ef4444','Avoid outdoor activity','especially children and elders.'],[1e9,'Hazardous','#a855f7','Stay indoors','and keep windows closed.']];
// Pollutants: [id, API field, label, [green limit, yellow limit] in µg/m³, health breakpoint used for "dominant"]
const POL=[['pm25','pm2_5','PM2.5',[20,40],12],['pm10','pm10','PM10',[50,100],54],['o3','ozone','Ozone (O₃)',[60,120],106],['no2','nitrogen_dioxide','NO₂',[100,200],100]];
// Fetches air quality and fills the gauge, pollutant bars and summary strip
async function loadAir(){
  try{const r=await fetch('https://air-quality-api.open-meteo.com/v1/air-quality?latitude='+place.lat+'&longitude='+place.lon+'&current=us_aqi,pm2_5,pm10,ozone,nitrogen_dioxide&timezone=auto');
  if(!r.ok)throw 0;const c=(await r.json()).current,a=Math.round(c.us_aqi),lv=LV.find(l=>a<=l[0]);
  $('aqi').textContent=a;$('aqiL').textContent=lv[1];$('aqiL').style.background=lv[2];
  $('arc').style.strokeDasharray=(414.7*Math.min(a/100,1))+' 553';
  $('bIdx').textContent=a;$('bCat').textContent=lv[1];$('bCat').style.color=lv[2];$('bAdv').textContent=lv[3];$('bAdv2').textContent=lv[4];
  let dom=null,best=-1;
  POL.forEach(p=>{const v=Math.round(c[p[1]]||0),lim=p[3],col=v<lim[0]?'#22e58f':v<lim[1]?'#facc15':'#fb923c';
    $('v-'+p[0]).textContent=v;$('b-'+p[0]).style.cssText='width:'+Math.min(100,Math.max(8,v/(lim[1]*2)*100))+'%;background:'+col;
    const ratio=v/p[4];if(ratio>best){best=ratio;dom=[p[2],v]}});
  $('bDom').textContent=dom[0];$('bDomV').textContent='('+dom[1]+' µg/m³)';
  const t=c.time.slice(11,16).split(':'),H=+t[0];$('bUpd').textContent=(H%12||12)+':'+t[1]+' '+(H<12?'AM':'PM');
  }catch(e){$('aqiL').textContent='Unavailable';$('aqiL').style.background='#64748b'}
}
// ---- City search ----
// City search: waits 300ms after typing, then shows matching cities from the geocoding API
let t;$('q').addEventListener('input',e=>{clearTimeout(t);const v=e.target.value.trim();if(v.length<2){$('results').hidden=true;return}
  t=setTimeout(async()=>{try{const r=await(await fetch('https://geocoding-api.open-meteo.com/v1/search?count=5&name='+encodeURIComponent(v))).json();
  const L=$('results');L.innerHTML=(r.results||[]).map((p,i)=>`<li tabindex="0" data-i="${i}">${p.name}${p.admin1?', '+p.admin1:''} <small>${p.country||''}</small></li>`).join('')||'<li>No cities found</li>';L.hidden=false;L._r=r.results||[]}catch(e){}},300)});
// Select a city from the results and reload the weather
const pick=li=>{const p=$('results')._r[li.dataset.i];if(!p)return;place={name:p.name,country:p.country||'',lat:p.latitude,lon:p.longitude};$('results').hidden=true;$('q').value='';load()};
$('results').addEventListener('click',e=>e.target.closest('li[data-i]')&&pick(e.target.closest('li')));
$('results').addEventListener('keydown',e=>e.key==='Enter'&&e.target.dataset.i&&pick(e.target));
// Pressing Enter: use the first match, or show a "city not found" error
$('searchForm').addEventListener('submit',async e=>{e.preventDefault();const v=$('q').value.trim();
  if(!v)return status('Enter a city name to search.',true);
  status('Searching for "'+v+'"…');busy(true);
  try{const r=await(await fetch('https://geocoding-api.open-meteo.com/v1/search?count=1&name='+encodeURIComponent(v))).json();
    if(!r.results){busy(false);$('results').hidden=true;return status('City "'+v+'" not found. Check the spelling and try again.',true)}
    $('results')._r=r.results;pick({dataset:{i:0}})}
  catch(err){busy(false);status('Search failed. Check your connection and try again.',true)}});
document.addEventListener('click',e=>{if(!e.target.closest('.search'))$('results').hidden=true});
// Use My Location: browser GPS, then reverse-geocode the city name
// ---- Location ----
$('locBtn').onclick=()=>{if(!navigator.geolocation)return status('Location is not supported in this browser.',true);status('Finding your location…');
  navigator.geolocation.getCurrentPosition(async p=>{const {latitude:lat,longitude:lon}=p.coords;let n='Your location',c='';
  try{const g=await(await fetch('https://api.bigdatacloud.net/data/reverse-geocode-client?latitude='+lat+'&longitude='+lon+'&localityLanguage=en')).json();n=g.city||g.locality||n;c=g.countryName||''}catch(e){}
  place={name:n,country:c,lat,lon};load()},()=>status('Location access denied. Search for a city instead.',true),{timeout:10000})};
// Tab switching and light/dark theme (theme is saved in localStorage)
// ---- Tabs and theme ----
function go(v){document.querySelectorAll('.view').forEach(s=>s.classList.toggle('active',s.id==='view-'+v));document.querySelectorAll('.tab').forEach(b=>b.classList.toggle('active',b.dataset.view===v));scrollTo(0,0)}
document.querySelectorAll('.tab').forEach(b=>b.onclick=()=>go(b.dataset.view));
document.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>go(b.dataset.go));
$('viewAll').onclick=e=>{e.preventDefault();$('days').scrollIntoView({behavior:'smooth'})};
function theme(m){document.documentElement.dataset.theme=m;$('lightBtn').classList.toggle('on',m==='light');$('darkBtn').classList.toggle('on',m==='dark');try{localStorage.setItem('atmos-theme',m)}catch(e){}}
$('lightBtn').onclick=()=>theme('light');$('darkBtn').onclick=()=>theme('dark');
try{theme(localStorage.getItem('atmos-theme')||'dark')}catch(e){}
load();

// Mobile: tap the Hourly Forecast row to expand or collapse it
$('hourHead').onclick=()=>$('hourHead').parentElement.classList.toggle('open');

$('aqCityBtn').onclick=()=>{go('forecast');$('q').focus()};

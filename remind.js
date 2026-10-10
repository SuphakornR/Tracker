/* Shared reminder logic. Loaded by the page and by the service worker, so both agree on what is due. */
(function(g){
function pad(n){return n<10?'0'+n:''+n}
function today(d){return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())}
/* s = {items:[{key,time:'HH:MM',days:[0-6 Mon..Sun]|null,date:'YYYY-MM-DD'|null}], skip:{key:day}, fired:{key:'day@time'}, snooze:{key:ms}} */
function due(s,now,grace){
 var td=today(now),dw=(now.getDay()+6)%7,mn=now.getHours()*60+now.getMinutes(),t0=new Date(now).setHours(0,0,0,0),out=[];
 grace=grace||180;
 (s.items||[]).forEach(function(it){
  if(s.skip&&s.skip[it.key]===td)return;
  var sn=s.snooze&&s.snooze[it.key];
  if(sn&&sn>=t0){if(now.getTime()>=sn)out.push(it);return}
  if(it.date?it.date!==td:(it.days&&it.days.indexOf(dw)<0))return;
  var p=it.time.split(':'),t=+p[0]*60+ +p[1];
  if(mn<t||mn-t>grace)return;
  if(s.fired&&s.fired[it.key]===td+'@'+it.time)return;
  out.push(it)});
 return out}
g.Remind={due:due,today:today}})(typeof self!=='undefined'?self:window);

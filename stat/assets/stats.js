(() => {
  const el = id => document.getElementById(id);
  const fmt = n => n.toLocaleString('zh-CN');
  let data, byDay;
  function select(day) {
    el('day').value = day;
    const row = byDay.get(day);
    for (const [id,key] of [['total','total_tokens'],['input','input_tokens'],['output','output_tokens'],['cached','cached_input_tokens']]) el(id).textContent = row ? fmt(row[key]) : '—';
    el('sessions').textContent = row ? `${row.sessions} 个会话有用量记录` : '当天未记录用量';
    el('reasoning').textContent = row ? `其中推理输出 ${fmt(row.reasoning_output_tokens)}` : '包含推理输出';
    el('uncached').textContent = row ? fmt(Math.max(0,row.input_tokens-row.cached_input_tokens)) : '—';
    const percent = row && row.input_tokens ? 100*row.cached_input_tokens/row.input_tokens : 0;
    el('cache-rate').textContent = row ? percent.toFixed(1)+'%' : '—';
    el('cache-fill').style.width = Math.min(percent,100)+'%';
    el('cache-meter').setAttribute('aria-label', row ? `缓存输入占比 ${percent.toFixed(1)}%` : '当天未记录用量');
    el('chart').querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.day === day)));
  }
  function render() {
    const count = Number(el('range').value);
    const end = new Date(data.days[data.days.length-1].date+'T00:00:00Z');
    const start = count ? new Date(end.getTime()-(count-1)*86400000) : new Date(data.days[0].date+'T00:00:00Z');
    const rows = [];
    for(let t=start.getTime();t<=end.getTime();t+=86400000){const date=new Date(t).toISOString().slice(0,10); rows.push(byDay.get(date)||{date,missing:true});}
    const max=Math.max(1,...rows.map(r=>r.total_tokens||0));
    el('chart').replaceChildren(); el('rows').replaceChildren();
    for(const row of rows){
      const button=document.createElement('button'); button.className='bar'+(row.missing?' missing':'');button.dataset.day=row.date;
      button.style.height=Math.max(2,150*(row.total_tokens||0)/max)+'px';
      button.title=`${row.date} · ${row.missing?'未记录':fmt(row.total_tokens)+' token'}`;
      button.setAttribute('aria-label',button.title);button.onclick=()=>select(row.date);el('chart').append(button);
    }
    for(const row of [...rows].reverse()){
      const tr=document.createElement('tr');
      for(const key of ['date','total_tokens','input_tokens','cached_input_tokens','output_tokens','sessions']){const td=document.createElement('td');td.textContent=key==='date'?row.date:row.missing?'未记录':fmt(row[key]);tr.append(td);}el('rows').append(tr);
    }
    el('chart-start').textContent=rows[0].date;el('chart-end').textContent=rows.at(-1).date;
    el('range-summary').textContent=`范围内已记录 ${fmt(rows.reduce((sum,r)=>sum+(r.total_tokens||0),0))} token · ${rows.filter(r=>!r.missing).length} 天有记录`;
    select(el('day').value||data.days.at(-1).date);
  }
  fetch('codex-stats.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error();return r.json();}).then(value=>{
    if(!Array.isArray(value.days)||!value.days.length)throw Error();data=value;byDay=new Map(data.days.map(row=>[row.date,row]));
    el('source-status').textContent=`本机记录 · ${data.days.length} 天 · ${fmt(data.session_files)} 份会话文件 · 更新于 ${new Date(data.generated_at).toLocaleString('zh-CN',{timeZone:'Asia/Shanghai',hour12:false})}（北京时间）`;
    el('day').min=data.days[0].date;el('day').max=data.days.at(-1).date;el('day').disabled=false;
    el('day').value=data.days.at(-1).date;el('day').onchange=()=>select(el('day').value);el('range').onchange=render;
    el('coverage').textContent+=` ${data.scope}。累计计数重置 ${data.counter_resets} 次，重置时采用单次用量，可能存在漏记；无法解析的记录 ${data.malformed_records} 条。`;
    render();
  }).catch(()=>{el('source-status').textContent='Token 数据暂时无法加载，请稍后刷新。';});
})();

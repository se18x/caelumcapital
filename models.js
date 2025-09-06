function ready(fn){ if(document.readyState==='loading'){ document.addEventListener('DOMContentLoaded', fn); } else { fn(); } }

// Helper to wait for Chart.js if script loads after DOM
function waitForChart(maxMs=3000){ return new Promise(res=>{ if(window.Chart) return res(true); const t0=performance.now(); const id=setInterval(()=>{ if(window.Chart||performance.now()-t0>maxMs){ clearInterval(id); res(!!window.Chart); } },50); }); }

document.addEventListener('DOMContentLoaded',function(){try{if(window.AOS){AOS.init({duration:800,easing:'ease-in-out',once:true,offset:100});}}catch(_){} const e=document.querySelector('.perf-grid');if(e){
  // Store original KPI values for safety
  const nums=e.querySelectorAll('.perf-number');
  nums.forEach(n=>{ n.dataset.orig=(n.textContent||'').trim(); });

  // If already in view on load, animate immediately
  const rect=e.getBoundingClientRect();
  const alreadyInView = rect.top < window.innerHeight && rect.bottom > 0;
  if(alreadyInView && e.getAttribute('data-locked')!=='true'){
    nums.length && animateStats(nums);
  } else {
    const io=new IntersectionObserver(entries=>{
      entries.forEach(ent=>{
        if(!ent.isIntersecting) return;
        if(e.getAttribute('data-locked')!=='true'){
          const list=e.querySelectorAll('.perf-number');
          list&&list.length&&animateStats(list);
        }
        io.unobserve(e);
      });
    },{threshold:.2});
    io.observe(e);
  }

  // Fallback: if any KPI is stuck at 0 after 1.5s, restore original text
  setTimeout(()=>{
    nums.forEach(n=>{
      const txt=(n.textContent||'').trim();
      if(/^\$?0(\.0+)?(K|%|\+)?$/.test(txt) && n.dataset.orig){ n.textContent=n.dataset.orig; }
    });
  },1500);
}});function animateStats(nodes){
  const easeOutCubic=t=>1-Math.pow(1-t,3);
  const formatMoney=v=>{const parts=v.toFixed(1).split('.');parts[0]=parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');return parts.join('.')};
  nodes.forEach(node=>{const originalText=node.textContent||'';let target=0,prefix='',suffix='';if(originalText.includes('$')){prefix='$';target=parseFloat(originalText.replace(/[^\d.]/g,''));}else if(originalText.includes('%')){suffix='%';target=parseFloat(originalText.replace(/[^\d.]/g,''));}else if(originalText.includes('+')){suffix='+';target=parseFloat(originalText.replace(/[^\d.]/g,''));}else{target=parseFloat(originalText.replace(/[^\d.]/g,''));}const durationMs=1200;let startTs=null;function step(ts){if(startTs===null) startTs=ts;const t=Math.min((ts-startTs)/durationMs,1);const value=target*easeOutCubic(t);if(prefix==='$') node.textContent=prefix+formatMoney(value); else if(suffix==='%'||suffix==='+') node.textContent=Math.round(value)+suffix; else node.textContent=Math.round(value).toString(); if(t<1) requestAnimationFrame(step); else node.textContent=originalText;}requestAnimationFrame(step);});}

// Enhance trades table: search + sort control + aria-live announcements
(function(){
  const CSV_URL = 'assets/data/SPY-CX1.1-Trades-static.csv';
  const TABLE_ID = 'trades-table';
  const SEARCH_ID = 'trades-search';
  const FILTER_ID = 'trades-action-filter';
  const SORT_ID = 'trades-sort';
  const ARIA_ID = 'trades-aria';
  const PAGE_SIZE = 25;
  let allRows = [], filteredRows = [], sortCol = 'Date', sortDir = 'asc', page = 1;

  function announce(msg){ const n=document.getElementById(ARIA_ID); if(n){ n.textContent = msg; } }
  function parseCSV(text){ const lines=text.trim().split(/\r?\n/); if(!lines.length) return []; const headers=lines[0].split(',').map(h=>h.replace(/^\ufeff/, '').trim()); return lines.slice(1).map(line=>{ const vals=[],re=/(?:"([^"]*)")|([^,]+)/g; let m; while((m=re.exec(line))!==null) vals.push((m[1]||m[2]||'').trim()); while(vals.length<headers.length) vals.push(''); const obj={}; headers.forEach((h,j)=>obj[h]=vals[j]||''); return obj; }); }
  function formatMoney(v){ const n=Number(v)||0; return n.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2}); }
  function renderTable(){ const tableDiv=document.getElementById(TABLE_ID); if(!tableDiv) return; if(!filteredRows.length){ tableDiv.innerHTML = '<table class="trades-table"><thead><tr>'+['Date','Action','Price','Shares','Capital After','Trade Profit','Portfolio Value'].map(h=>`<th scope="col">${h}</th>`).join('')+'</tr></thead><tbody><tr class="empty-row"><td colspan="7">No trades found.</td></tr></tbody></table>'; return; } const start=(page-1)*PAGE_SIZE,end=start+PAGE_SIZE; const pageRows=filteredRows.slice(start,end); const ths=['Date','Action','Price','Shares','Capital After','Trade Profit','Portfolio Value'].map(h=>{ let cls='sortable'; if(sortCol===h) cls+=' sorted-'+sortDir; return `<th scope="col" class="${cls}" data-col="${h}">${h}</th>`; }).join(''); const moneyCols={'Price':true,'Capital After':true,'Trade Profit':true,'Portfolio Value':true}; const trs=pageRows.map(r=>{ const tds=['Date','Action','Price','Shares','Capital After','Trade Profit','Portfolio Value'].map(k=>{ const v=r[k]||''; if(moneyCols[k] && v!==''){ const n=parseFloat(v)||0; return `<td class="num-cell" data-num="${n}" data-fmt="money">${formatMoney(n)}</td>`; } return `<td>${v}</td>`; }).join(''); const cls=(r.Action||'').toUpperCase()==='SELL'?' style="border-left:2px solid #e6e6e6"':''; return `<tr${cls}>${tds}</tr>`; }).join(''); tableDiv.innerHTML = `<table class="trades-table"><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table>`+`<div class="trades-pagination"><button class="trades-btn" ${page===1?'disabled':''}>Prev</button><span class="page-info">Page ${page} of ${Math.ceil(filteredRows.length/PAGE_SIZE)}</span><button class="trades-btn" ${end>=filteredRows.length?'disabled':''}>Next</button></div>`; tableDiv.querySelectorAll('th.sortable').forEach(th=>{ th.onclick=()=>{ const col=th.getAttribute('data-col'); if(sortCol===col) sortDir=sortDir==='asc'?'desc':'asc'; else {sortCol=col; sortDir='asc';} sortRows(); page=1; renderTable(); announce(`Sorted by ${sortCol} ${sortDir}`); }; }); const btns=tableDiv.querySelectorAll('.trades-pagination button'); const prev=btns[0], next=btns[1]; if(prev) prev.onclick=()=>{ if(page>1){ page--; renderTable(); announce(`Page ${page}`);} }; if(next) next.onclick=()=>{ const maxPage=Math.ceil(filteredRows.length/PAGE_SIZE); if(page<maxPage){ page++; renderTable(); announce(`Page ${page}`);} }; }
  function sortRows(){ filteredRows.sort((a,b)=>{ let v1=a[sortCol],v2=b[sortCol]; if(sortCol==='Date'){ v1=v1||''; v2=v2||''; return sortDir==='asc'?v1.localeCompare(v2):v2.localeCompare(v1); } if(['Price','Shares','Capital After','Trade Profit','Portfolio Value'].includes(sortCol)){ v1=parseFloat(v1)||0; v2=parseFloat(v2)||0; return sortDir==='asc'?v1-v2:v2-v1; } return sortDir==='asc'?(v1||'').localeCompare(v2||''):(v2||'').localeCompare(v1||''); }); }
  function applyFilters(){ const q=(document.getElementById(SEARCH_ID)?.value||'').toLowerCase(); const act=document.getElementById(FILTER_ID)?.value||''; const sortSel=document.getElementById(SORT_ID)?.value||'oldest'; sortCol='Date'; sortDir= sortSel==='oldest' ? 'asc':'desc'; filteredRows = allRows.filter(r=>{ if(act && (r.Action||'')!==act) return false; if(!q) return true; return Object.values(r).some(v=> (v||'').toString().toLowerCase().includes(q)); }); sortRows(); page=1; renderTable(); announce(`Filter ${act||'All'}, ${filteredRows.length} rows`); }
  let t; function debounce(){ clearTimeout(t); t=setTimeout(applyFilters,200); }
  async function init(){ try{ console.debug('[Trades] Fetch', CSV_URL); const res=await fetch(CSV_URL,{cache:'no-cache'}); if(!res.ok) throw 0; const text=await res.text(); allRows = parseCSV(text); allRows.sort((a,b)=> (a.Date||'').localeCompare(b.Date||'')); filteredRows = allRows.slice(); sortCol='Date'; sortDir='asc'; page=1; renderTable(); const s=document.getElementById(SEARCH_ID), f=document.getElementById(FILTER_ID), so=document.getElementById(SORT_ID); s&&s.addEventListener('input',debounce); f&&f.addEventListener('change',applyFilters); so&&so.addEventListener('change',applyFilters); }catch(e){ const tableDiv=document.getElementById(TABLE_ID); if(tableDiv) tableDiv.innerHTML = `<div class="trades-table-fallback">Unable to load trade log. <a href="${CSV_URL}" download>Download CSV</a></div>`; console.error('[Trades] Load failed', e);} }
  if(document.getElementById(TABLE_ID)) ready(init);
})();

// Animate performance card numbers when visible
(function(){
  const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ease = t=>1-Math.pow(1-t,3);
  const formatNumber = (n, d=0) => { const parts=Number(n||0).toFixed(d).split('.'); parts[0]=parts[0].replace(/\B(?=(\d{3})+(?!\d))/g,','); return parts.join(d?'.':''); };
  function runAnimation(){ if(prefersReduced) return; const grid=document.querySelector('.perf-grid'); if(!grid||grid.dataset.animated==='true') return; const nums=grid.querySelectorAll('.perf-number'); nums.forEach(node=>{ const original=node.textContent||''; let target=0,type='int',hasK=false; if(original.includes('$')){ type='money'; hasK=/k/i.test(original); target=parseFloat(original.replace(/[^\d.\-]/g,''))||0; } else if(original.includes('%')){ type='percent'; target=parseFloat(original.replace(/[^\d.\-]/g,''))||0; } else if(original.includes('+')){ type='plus'; target=parseFloat(original.replace(/[^\d.\-]/g,''))||0; } else { type='int'; target=parseFloat(original.replace(/[^\d.\-]/g,''))||0; } const dur=1100; let startTs=null; function step(ts){ if(startTs===null) startTs=ts; const t=Math.min((ts-startTs)/dur,1); const val=target*ease(t); if(type==='money'){ node.textContent = hasK? `$${formatNumber(val,1)}K` : `$${formatNumber(val,2)}`; } else if(type==='percent'){ node.textContent = `${Math.round(val)}%`; } else if(type==='plus'){ node.textContent = `${Math.round(val)}+`; } else { node.textContent = `${Math.round(val)}`; } if(t<1) requestAnimationFrame(step); else node.textContent=original; } requestAnimationFrame(step); }); grid.dataset.animated='true'; }
  function init(){ const grid=document.querySelector('.perf-grid'); if(!grid) return; const rect=grid.getBoundingClientRect(); const inView=rect.top<window.innerHeight && rect.bottom>0; if(inView) runAnimation(); const obs=new IntersectionObserver((entries)=>{ if(entries.some(e=>e.isIntersecting)){ runAnimation(); obs.disconnect(); } },{threshold:.25}); obs.observe(grid); }
  ready(init);
})();

// Equity chart and badge percent update
(function(){
  const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const CX11_EQUITY_CSV = 'assets/data/SPY-CX1.1-Equity-static.csv';
  const SMA20_EQUITY_CSV = 'assets/data/SPY-SMA20-Equity-static.csv';
  const currencyFormat = (n) => { const v=Number(n||0); const parts=v.toFixed(2).split('.'); parts[0]=parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ','); return `$${parts.join('.')}`; };
  function parseCSV(text){ const lines=text.trim().split(/\r?\n/); if(!lines.length) return []; const headers=lines[0].split(',').map(h=>h.replace(/^\ufeff/, '').trim()); return lines.slice(1).map(line=>{ const vals=[],re=/(?:"([^"]*)")|([^,]+)/g; let m; while((m=re.exec(line))!==null) vals.push((m[1]||m[2]||'').trim()); while(vals.length<headers.length) vals.push(''); const o={}; headers.forEach((h,j)=>o[h]=vals[j]||''); return o; }); }
  function sortAsc(rows){ return rows.sort((a,b)=>String(a.Date||'').localeCompare(String(b.Date||''))); }
  async function fetchCSV(url) { const res = await fetch(url, {cache:'no-cache'}); if(!res.ok) throw new Error(`Failed to fetch ${url}`); return res.text(); }
  async function init(){ 
    try{ 
      console.debug('[Equity] Fetching both datasets');
      // Fetch both CSV files in parallel
      const [cx11Text, sma20Text] = await Promise.all([
        fetchCSV(CX11_EQUITY_CSV),
        fetchCSV(SMA20_EQUITY_CSV)
      ]);
      
      const cx11Rows = sortAsc(parseCSV(cx11Text));
      const sma20Rows = sortAsc(parseCSV(sma20Text));
      
      if(!cx11Rows.length || !sma20Rows.length) { 
        const fb=document.getElementById('equity-fallback'); 
        if(fb) fb.hidden=false; 
        return; 
      } 
      
      // Process CX-1.1 data for badge calculation (using CX-1.1 specifically)
      const cx11Series = cx11Rows.map(r=>({d:r.Date,v:parseFloat(String(r['Portfolio Value']||'').replace(/[^\d.\-]/g,''))||0}));
      const start = cx11Series[0].v, end = cx11Series[cx11Series.length-1].v;
      const ret = start ? ((end-start)/start*100) : 0;
      
      // Update badge with CX-1.1 percentage
      const badge = document.getElementById('perf-badge');
      if(badge){ 
        badge.textContent = (ret>=0?'+':'') + ret.toFixed(2) + '%'; 
        badge.classList.toggle('positive', ret>=0); 
        badge.classList.toggle('negative', ret<0); 
      } 
      
      // Process SMA-20 data
      const sma20Series = sma20Rows.map(r=>({d:r.Date,v:parseFloat(String(r['Portfolio Value']||'').replace(/[^\d.\-]/g,''))||0}));
      
      const ctx = document.getElementById('equityChart');
      if(!ctx) return;
      
      const hasChart = await waitForChart();
      if(!hasChart) return;
      
      Chart.defaults.font.family = "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
      
      // Create combined labels from both datasets
      const allDates = [...new Set([...cx11Series.map(p=>p.d), ...sma20Series.map(p=>p.d)])].sort();
      
      // Create data arrays aligned with the combined date labels
      // For CX-1.1, we need to forward-fill values between trades
      const cx11Data = allDates.map(date => {
        const point = cx11Series.find(p => p.d === date);
        if (point) return point.v;
        
        // Find the last known value before this date
        const lastKnownValue = cx11Series
          .filter(p => p.d <= date)
          .sort((a, b) => new Date(b.d) - new Date(a.d))[0];
        
        return lastKnownValue ? lastKnownValue.v : null;
      });
      
      // For SMA-20, also forward-fill to ensure continuous line
      const sma20Data = allDates.map(date => {
        const point = sma20Series.find(p => p.d === date);
        if (point) return point.v;
        
        // Find the last known value before this date
        const lastKnownValue = sma20Series
          .filter(p => p.d <= date)
          .sort((a, b) => new Date(b.d) - new Date(a.d))[0];
        
        return lastKnownValue ? lastKnownValue.v : null;
      });
      
      
      const animation = prefersReduced ? false : { duration:1200, easing:'easeOutExpo' };
      
      new Chart(ctx, {
        type:'line', 
        data:{ 
          labels: allDates,
          datasets:[
            { 
              label:'CX-1.1 Strategy', 
              data: cx11Data, 
              borderColor:'#000000', 
              backgroundColor: 'rgba(0, 0, 0, 0.1)',
              borderWidth:2, 
              tension:0.4, 
              pointRadius:0,
              fill: false
            },
            { 
              label:'CX-01 Strategy', 
              data: sma20Data, 
              borderColor:'#000000', 
              backgroundColor: 'rgba(0, 0, 0, 0.1)',
              borderWidth:2, 
              tension:0, 
              pointRadius:0,
              fill: false,
              borderDash: [8, 4]
            }
          ] 
        }, 
        options:{ 
          responsive:true, 
          animation, 
          plugins:{ 
            legend:{
              display: true,
              position: 'top',
              labels: {
                usePointStyle: false,
                padding: 15,
                font: {
                  family: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                  size: 12,
                  weight: '500'
                },
                generateLabels: function(chart) {
                  const original = Chart.defaults.plugins.legend.labels.generateLabels;
                  const labels = original.call(this, chart);
                  labels.forEach(label => {
                    label.fillStyle = '#000000';
                    label.lineWidth = 2;
                    // Make the second label (SMA-20) dashed
                    if (label.text === 'SMA-20 Strategy') {
                      label.lineDash = [8, 4];
                    }
                  });
                  return labels;
                }
              }
            }, 
            tooltip:{
              mode:'index',
              intersect:false,
              callbacks:{ 
                label:(context) => {
                  const datasetLabel = context.dataset.label;
                  const value = currencyFormat(context.parsed.y);
                  return `${datasetLabel}: ${value}`;
                }
              } 
            } 
          }, 
          scales:{ 
            x:{ 
              display:true, 
              ticks:{ maxTicksLimit:6 } 
            }, 
            y:{ 
              display:true, 
              ticks:{ callback:(v)=>'$'+Number(v).toLocaleString() } 
            } 
          } 
        }
      }); 
    } catch(e){ 
      const fb=document.getElementById('equity-fallback'); 
      if(fb) fb.hidden=false; 
      console.error('[Equity] Load failed', e); 
    } 
  }
  ready(init);
})();

function prefersReducedMotion(){return window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;}
function observeOnce(el,cb){const io=new IntersectionObserver((es,o)=>{es.forEach(e=>{if(e.isIntersecting){cb(e.target);o.unobserve(e.target);}})},{threshold:.3});io.observe(el);}
function initScrambleOnView(sel){if(prefersReducedMotion())return;const rng='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';document.querySelectorAll(sel).forEach(el=>{const final=el.getAttribute('data-final')||el.textContent;observeOnce(el,()=>{const dur=700,t0=performance.now();(function tick(t){const p=Math.min((t-t0)/dur,1);el.textContent=[...final].map(ch=>ch===' ' ? ' ' : (Math.random()<(1-p)? rng[(Math.random()*rng.length)|0] : ch)).join('');if(p<1)requestAnimationFrame(tick);else el.textContent=final;})(t0);});});}
ready(()=>initScrambleOnView('.future-roadmap .title.scramble'));
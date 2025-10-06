// script.js - shared for index + sheet pages
// Detect which page we are on by checking body and some IDs
const onIndex = !!document.getElementById('cards');
const onSheet = !!document.getElementById('previewWrap');

// ---------- Utilities ----------
function uid(){ return 'id-'+Math.random().toString(36).slice(2,9); }
function saveProfiles(profiles){ localStorage.setItem('ank_profiles', JSON.stringify(profiles)); }
function loadProfiles(){ try{ return JSON.parse(localStorage.getItem('ank_profiles')||'[]') }catch(e){return []} }
function getProfile(id){ return loadProfiles().find(p=>p.id===id) }
function setProfile(p){
  const arr = loadProfiles(); const idx = arr.findIndex(x=>x.id===p.id);
  if(idx>=0) arr[idx]=p; else arr.push(p);
  saveProfiles(arr);
}
function deleteProfile(id){
  const arr = loadProfiles().filter(p=>p.id!==id); saveProfiles(arr);
}
function cloneProfile(id){
  const p = getProfile(id); if(!p) return null;
  const copy = JSON.parse(JSON.stringify(p)); copy.id = uid(); copy.name = p.name + ' (bản sao)'; setProfile(copy); return copy;
}

// ---------- Default profile ensure ----------
function ensureDefault(){
  const list = loadProfiles();
  if(list.length===0){
    const d = {
      id: uid(),
      name: 'Hồ sơ mặc định by Dr Dong',
      desc: 'Style card mặc định. Ấn vào để chỉnh sửa, hoặc ấn tạo bản sao để copy.',
      editLink: '',
      publicLink: '',
      frontHTML: '<div class="q">{{col1}}</div>',
      backHTML: '<div class="q">{{col1}}</div><hr/><div class="ans">{{col2}}</div>',
      styleCSS: '.q{font-weight:600}.ans{color:#2ecc71}',
      replaceRules: '##a. => A.\n##b. => B.\n##c. => C.\n##d. => D.\n##e. => E.',
      deckName: 'Deck mặc định'
    };
    setProfile(d);
  }
}
ensureDefault();

// ---------- Index page logic ----------
if(onIndex){
  const container = document.getElementById('cards');
  const searchInput = document.getElementById('searchInput');
  function renderCards(filter=''){
    const profiles = loadProfiles();
    container.innerHTML = '';
    const filtered = profiles.filter(p => p.name.toLowerCase().includes(filter.toLowerCase()) || (p.desc||'').toLowerCase().includes(filter.toLowerCase()));
    filtered.forEach(p => {
      const card = document.createElement('div'); card.className='card';
      card.innerHTML = `
        <div class="card-title">${escapeHtml(p.name)}</div>
        <div class="card-sub">${escapeHtml(p.desc||'')}</div>
        <div class="card-actions">
          <button class="btn-action btn-blue" data-action="create" data-id="${p.id}">▶️ TẠO ANKI</button>
          <button class="btn-action btn-cyan" data-action="copy" data-id="${p.id}">📋 SAO CHÉP</button>
          <button class="btn-action btn-green" data-action="sheet" data-id="${p.id}">🟢 GG SHEET</button>
          <button class="btn-action btn-red" data-action="delete" data-id="${p.id}">🗑️ XÓA</button>
        </div>
      `;
      container.appendChild(card);
    });
    // if none show message
    if(filtered.length===0){
      const m = document.createElement('div'); m.style.color='#9aa5b1'; m.textContent='Không có hồ sơ.'; m.style.padding='12px';
      container.appendChild(m);
    }
  }
  renderCards();

  searchInput.addEventListener('input', ()=> renderCards(searchInput.value.trim()));

  // Create default button -> go to sheet.html with that profile loaded (create if not exist)
  document.getElementById('createDefault').addEventListener('click', ()=>{
    // open first profile's sheet
    const p = loadProfiles()[0];
    if(p) location.href = `sheet.html?id=${p.id}`;
  });

  // delegate buttons
  container.addEventListener('click', async (ev)=>{
    const btn = ev.target.closest('button[data-action]');
    if(!btn) return;
    const action = btn.dataset.action, id = btn.dataset.id;
    if(action==='copy'){
      const copy = cloneProfile(id);
      renderCards();
      if(copy) { alert('Đã tạo bản sao'); }
    } else if(action==='delete'){
      if(confirm('Bạn có chắc muốn xóa hồ sơ này?')){ deleteProfile(id); renderCards(); }
    } else if(action==='sheet'){
      location.href = `sheet.html?id=${id}`;
    } else if(action==='create'){
      // create apkg from that profile (needs fetch CSV inside sheet logic). We'll open sheet.html and auto-export
      location.href = `sheet.html?id=${id}&autoExport=1`;
    }
  });
}

// ---------- Sheet page logic ----------
if(onSheet){
  // helpers for this page
  const qs = new URLSearchParams(location.search);
  const profileId = qs.get('id') || loadProfiles()[0]?.id;
  let profile = getProfile(profileId);
  const autoExport = qs.get('autoExport') === '1';

  // DOM refs
  const tplName = document.getElementById('tplName');
  const deckNameInput = document.getElementById('deckName');
  const tplDesc = document.getElementById('tplDesc');
  const editLink = document.getElementById('editLink');
  const publicLink = document.getElementById('publicLink');
  const openEdit = document.getElementById('openEdit');
  const openPublic = document.getElementById('openPublic');
  const saveLinks = document.getElementById('saveLinks');
  const previewSheetBtn = document.getElementById('previewSheet');
  const previewWrap = document.getElementById('previewWrap');
  const status = document.getElementById('status');
  const replaceRules = document.getElementById('replaceRules');
  const frontHTML = document.getElementById('frontHTML') || null;
  const backHTML = document.getElementById('backHTML') || null;
  const styleCSS = document.getElementById('styleCSS') || null;
  const saveTemplate = document.getElementById('saveTemplate');
  const exportApkg = document.getElementById('exportApkg');
  const editorArea = document.getElementById('editorArea');
  const miniBtns = document.querySelectorAll('.edit-buttons .mini');
  const templateTitle = document.getElementById('templateTitle');
  const backBtn = document.getElementById('backBtn');
  const saveAllBtn = document.getElementById('saveAllBtn');

  if(!profile){
    alert('Không tìm thấy hồ sơ; trở về trang chính.'); location.href='index.html'; throw '';
  }

  // initial fill
  templateTitle.textContent = profile.name;
  tplName.value = profile.name;
  tplDesc.value = profile.desc || '';
  editLink.value = profile.editLink || '';
  publicLink.value = profile.publicLink || '';
  replaceRules.value = profile.replaceRules || '';
  deckNameInput.value = profile.deckName || '';
  // create editors for front/back/style inside editorArea (we want dynamic textareas)
  // initial area shows replaceRules
  function setEditor(target){
    editorArea.innerHTML = '';
    if(target==='replace'){
      const ta = document.createElement('textarea'); ta.id='replaceRules'; ta.rows=6; ta.value = profile.replaceRules || ''; ta.placeholder='Quy tắc thay thế (mỗi dòng: find => replace)';
      editorArea.appendChild(ta);
    } else if(target==='front'){
      const ta = document.createElement('textarea'); ta.id='frontHTML'; ta.rows=8; ta.value = profile.frontHTML || '<div>{{col1}}</div>';
      editorArea.appendChild(ta);
    } else if(target==='back'){
      const ta = document.createElement('textarea'); ta.id='backHTML'; ta.rows=8; ta.value = profile.backHTML || '<div>{{col1}}</div><hr/>{{col2}}';
      editorArea.appendChild(ta);
    } else if(target==='style'){
      const ta = document.createElement('textarea'); ta.id='styleCSS'; ta.rows=6; ta.value = profile.styleCSS || '.q{font-weight:600}';
      editorArea.appendChild(ta);
    }
  }
  setEditor('replace');

  miniBtns.forEach(b=>{
    b.addEventListener('click', ()=> {
      miniBtns.forEach(x=>x.disabled=false);
      b.disabled = true;
      setEditor(b.dataset.target);
    });
  });

  // open handlers
  openEdit.addEventListener('click', ()=> { if(editLink.value) window.open(editLink.value,'_blank'); else alert('Chưa có link edit')});
  openPublic.addEventListener('click', ()=> { if(publicLink.value) window.open(publicLink.value,'_blank'); else alert('Chưa có link public')});

  saveLinks.addEventListener('click', ()=>{
    profile.editLink = editLink.value.trim();
    profile.publicLink = publicLink.value.trim();
    profile.deckName = deckNameInput.value.trim();
    setProfile(profile);
    status.textContent = 'Đã lưu liên kết';
    setTimeout(()=> status.textContent='Chưa tải dữ liệu',1200);
  });

  saveTemplate.addEventListener('click', ()=>{
    // read editor values
    const r = document.getElementById('replaceRules');
    const f = document.getElementById('frontHTML');
    const b = document.getElementById('backHTML');
    const s = document.getElementById('styleCSS');
    if(r) profile.replaceRules = r.value;
    if(f) profile.frontHTML = f.value;
    if(b) profile.backHTML = b.value;
    if(s) profile.styleCSS = s.value;
    profile.name = tplName.value.trim() || profile.name;
    profile.desc = tplDesc.value.trim();
    profile.deckName = deckNameInput.value.trim();
    setProfile(profile);
    status.textContent = 'Đã lưu template';
    setTimeout(()=> status.textContent='Chưa tải dữ liệu',1200);
  });

  saveAllBtn.addEventListener('click', ()=> {
    document.getElementById('saveTemplate')?.click();
    document.getElementById('saveLinks')?.click();
    alert('Đã lưu toàn bộ');
  });

  backBtn.addEventListener('click', ()=> location.href='index.html');

  // CSV utils
  function normSheetUrl(input){
    if(!input) return null;
    input = input.trim();
    if(input.includes('output=csv')||input.includes('export?format=csv')||input.includes('gviz/tq?tqx=out:csv')) return input;
    const idMatch = input.match(/\/d\/([a-zA-Z0-9-_]+)/);
    const gidMatch = input.match(/[?&]gid=(\d+)/);
    if(idMatch){
      const id = idMatch[1], gid = gidMatch?gidMatch[1]:'0';
      return `https://docs.google.com/spreadsheets/d/${id}/export?format=csv&gid=${gid}`;
    }
    if(input.includes('/pub') && !input.includes('output=csv')){
      if(input.includes('?')) return input + '&output=csv';
      return input + '?output=csv';
    }
    return input;
  }

  // CSV parse (robust)
  function parseCSV(text){
    const rows=[]; let cur=''; let inQ=false; let row=[];
    for(let i=0;i<text.length;i++){
      const ch=text[i], nxt=text[i+1];
      if(inQ){
        if(ch==='"' && nxt==='"'){ cur+='"'; i++; }
        else if(ch==='"'){ inQ=false; }
        else cur+=ch;
      } else {
        if(ch==='"'){ inQ=true; }
        else if(ch===','){ row.push(cur); cur=''; }
        else if(ch==='\r'){}
        else if(ch==='\n'){ row.push(cur); rows.push(row); row=[]; cur=''; }
        else cur+=ch;
      }
    }
    if(cur!=='' || row.length) row.push(cur);
    if(row.length) rows.push(row);
    return rows;
  }

  function escapeHtml(s){ if(s==null) return ''; return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  async function fetchCsv(url){
    const res = await fetch(url);
    if(!res.ok) throw new Error('Không tải được CSV');
    const text = await res.text();
    return parseCSV(text);
  }

  previewSheetBtn.addEventListener('click', async ()=>{
    previewWrap.innerHTML=''; status.textContent='Đang tải...';
    const raw = normSheetUrl(publicLink.value.trim());
    if(!raw){ status.textContent='Public link chưa hợp lệ'; return; }
    try{
      const rows = await fetchCsv(raw);
      if(!rows || rows.length===0) { status.textContent='Không có dữ liệu'; return; }
      status.textContent = `Đã tải: ${rows.length} hàng`;
      // render
      let html = '<table class="preview"><thead><tr>' + rows[0].map(h=>`<th>${escapeHtml(h)}</th>`).join('') + '</tr></thead><tbody>';
      const max = Math.min(rows.length-1, 20);
      for(let i=1;i<=max;i++){ const r=rows[i]; html += '<tr>' + rows[0].map((_,c)=> `<td>${escapeHtml(r && r[c] ? r[c] : '')}</td>`).join('') + '</tr>'; }
      html += '</tbody></table>';
      previewWrap.innerHTML = html;
      window._LAST_SHEET_ROWS = rows;
    } catch(err){
      console.error(err); status.textContent = 'Lỗi: ' + (err.message||err);
    }
  });

  // apply replace rules: profile.replaceRules contains lines "find => replace"
  function applyReplaceRules(s){
    if(!s) return s;
    const lines = (profile.replaceRules||'').split(/\r?\n/).map(l=>l.trim()).filter(Boolean);
    let out = s;
    lines.forEach(line=>{
      const parts = line.split('=>').map(x=>x.trim());
      if(parts.length>=2){
        try{
          const find = parts[0].replace(/\\n/g,'\n');
          const repl = parts.slice(1).join('=>');
          // treat find as literal
          const key = find.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
          const re = new RegExp(key,'g');
          out = out.replace(re, repl);
        }catch(e){}
      }
    });
    return out;
  }

  // Build note HTML from row: use {{col1}}... replace rules then template
  function buildFromRow(row){
    // row is array, header row not included
    let frontTpl = document.getElementById('frontHTML') ? document.getElementById('frontHTML').value : profile.frontHTML;
    let backTpl = document.getElementById('backHTML') ? document.getElementById('backHTML').value : profile.backHTML;
    // replace placeholders
    for(let i=0;i<50;i++){
      const key = `{{col${i+1}}}`;
      const val = row[i]||'';
      frontTpl = frontTpl.split(key).join(val);
      backTpl = backTpl.split(key).join(val);
    }
    // apply replace rules on resulting HTML text
    frontTpl = applyReplaceRules(frontTpl);
    backTpl = applyReplaceRules(backTpl);
    return {front: frontTpl, back: backTpl};
  }

  // Export .apkg using anki-apkg-export
  exportApkg.addEventListener('click', async ()=>{
    status.textContent = 'Đang xuất .apkg...';
    const raw = normSheetUrl(publicLink.value.trim());
    if(!raw){ status.textContent='Public link chưa hợp lệ'; return; }
    try{
      const rows = await fetchCsv(raw);
      if(!rows||rows.length<=1){ status.textContent='CSV không có dữ liệu hàng'; return; }
      // create deck
      const deckName = (deckNameInput.value.trim() || profile.deckName || 'Deck');
      const apkg = new window.AnkiExport(deckName);
      // add style as media style.css (anki-apkg-export doesn't automatically inject css to card templates, but we can add it as media to be referenced)
      // We'll add style as media file and user can reference it in templates (we don't add template structure in apkg-export lib; it just creates notes with front/back)
      apkg.addMedia('style.css', (profile.styleCSS || document.getElementById('styleCSS')?.value || '').toString());
      // iterate rows (skip header)
      for(let i=1;i<rows.length;i++){
        const r = rows[i];
        const note = buildFromRow(r);
        apkg.addCard(note.front, note.back);
      }
      const zip = await apkg.save(); // Uint8Array
      const blob = new Blob([zip], {type: 'application/octet-stream'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `${deckName}.apkg`; a.click();
      status.textContent = 'Hoàn tất xuất .apkg';
    } catch(err){
      console.error(err); status.textContent = 'Lỗi khi xuất: '+(err.message||err);
    }
  });

  // if autoExport param present, preview then export
  if(autoExport){
    (async ()=>{ await new Promise(r=>setTimeout(r,200)); document.getElementById('previewSheet')?.click(); await new Promise(r=>setTimeout(r,800)); document.getElementById('exportApkg')?.click(); })();
  }
}

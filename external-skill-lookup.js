document.addEventListener('DOMContentLoaded',function(){
const form=document.getElementById('form'),input=document.getElementById('url'),status=document.getElementById('status'),out=document.getElementById('results'),button=form.querySelector('button');
function esc(v){return String(v||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function front(md,key){const m=md.match(new RegExp('^'+key+':\\s*(.+)$','m'));return m?m[1].replace(/^["']|["']$/g,''):''}
async function search(){
out.innerHTML='';let u;try{u=new URL(input.value.trim())}catch{status.textContent='請輸入有效網址。';return}
if(u.hostname!=='github.com'){status.textContent='目前只支援 github.com 公開儲存庫。';return}
const p=u.pathname.split('/').filter(Boolean);if(p.length<2){status.textContent='請貼上完整的 GitHub 專案或技能資料夾連結。';return}
const owner=p[0],repo=p[1],base='https://api.github.com/repos/'+encodeURIComponent(owner)+'/'+encodeURIComponent(repo),headers={Accept:'application/vnd.github+json'};
let branch='',path='';if(p[2]==='tree'||p[2]==='blob'){branch=p[3]||'';path=p.slice(4).join('/')}
status.textContent='正在搜尋此儲存庫的 SKILL.md…';button.disabled=true;
try{
const mr=await fetch(base,{headers});if(!mr.ok)throw Error(mr.status===404?'找不到公開儲存庫。':'GitHub 回應 '+mr.status);
const meta=await mr.json();branch=branch||meta.default_branch;
let files=[];
if(path.toLowerCase().endsWith('skill.md')){files=[{path}]}else{
const tr=await fetch(base+'/git/trees/'+encodeURIComponent(branch)+'?recursive=1',{headers});if(!tr.ok)throw Error('無法讀取檔案清單。');
const tree=await tr.json();files=tree.tree.filter(x=>x.type==='blob'&&x.path.toLowerCase().endsWith('skill.md'));
if(path)files=files.filter(x=>x.path===path||x.path.startsWith(path.replace(/\\/$/,'')+'/'));
}
if(!files.length){status.textContent='這個儲存庫或資料夾中沒有找到 SKILL.md。請確認貼的是公開技能資料夾或技能檔連結。';return}
files=files.slice(0,20);
const cards=await Promise.all(files.map(async f=>{const raw='https://raw.githubusercontent.com/'+owner+'/'+repo+'/'+branch+'/'+f.path;const rr=await fetch(raw);if(!rr.ok)return '';const md=await rr.text();const name=front(md,'name')||f.path.split('/').slice(-2,-1)[0]||repo,desc=front(md,'description');return '<article class="result"><span class="tag">'+esc(f.path)+'</span><h2>'+esc(name)+'</h2><h3>這個 Skill 的用途</h3><p>'+esc(desc||'文件沒有提供簡短用途說明，請展開技能內容查看。')+'</p><details><summary>查看 SKILL.md 內容</summary><div class="readme">'+esc(md.slice(0,16000))+'</div></details><p><a target="_blank" rel="noreferrer" href="https://github.com/'+owner+'/'+repo+'/blob/'+branch+'/'+f.path+'">在 GitHub 開啟此技能 ↗</a></p></article>'}));
out.innerHTML=cards.filter(Boolean).join('');status.textContent='找到 '+files.length+' 個 Skill。';if(!out.innerHTML)status.textContent='找到技能路徑，但無法讀取文件；請確認它是公開內容。';
}catch(err){status.textContent='查詢失敗：'+err.message+'。請確認連結指向公開儲存庫。'}finally{button.disabled=false}
}
button.type='button';button.addEventListener('click',search);form.addEventListener('submit',function(e){e.preventDefault();search()});
});
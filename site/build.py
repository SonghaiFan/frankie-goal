#!/usr/bin/env python3
"""Build the independent bilingual Goal introduction. Standard library only."""
import argparse,html,json,shutil
from pathlib import Path
H=html.escape
def build(repo,out):
 cfg=json.loads((repo/'site/project.json').read_text());content=json.loads((repo/'site/content.json').read_text());out.mkdir(parents=True,exist_ok=True);media=out/'media';media.mkdir(exist_ok=True)
 shutil.copy(repo/'site/style.css',out/'style.css');shutil.copy(repo/'docs/readme/banner.png',media/'banner.png');shutil.copy(repo/'docs/readme/assets/frankie.svg',media/'signature.svg')
 names=['home-current.png','planning-current.png','next-current.png','focus-current.png','calendar-current.png']
 for n in names:shutil.copy(repo/'site/assets'/n,media/n)
 (out/'.nojekyll').touch()
 for lang,c in content.items():
  zh=lang=='zh';pre='../' if zh else './';dest=out/'zh' if zh else out;dest.mkdir(exist_ok=True);url=cfg['pages_url']+('zh/' if zh else '')
  cards=lambda xs:''.join('<article><h3>'+H(a)+'</h3><p>'+H(b)+'</p></article>' for a,b in xs)
  gallery=''.join(f'<figure><a href="{pre}media/{n}"><img src="{pre}media/{n}" alt="{H(t,quote=True)}" loading="lazy" width="1468" height="1247"></a><figcaption>{H(t)}</figcaption></figure>' for n,t in zip(names,c['captions']))
  page=f'''<!doctype html><html lang="{'zh-CN' if zh else 'en'}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Franklin Goal | {H(c['title'])}</title><meta name="description" content="{H(c['intro'],quote=True)}"><meta name="theme-color" content="#f4f2ee"><link rel="canonical" href="{url}"><link rel="alternate" hreflang="en" href="{cfg['pages_url']}"><link rel="alternate" hreflang="zh-CN" href="{cfg['pages_url']}zh/"><meta property="og:type" content="website"><meta property="og:url" content="{url}"><meta property="og:title" content="Franklin Goal"><meta property="og:description" content="{H(c['intro'],quote=True)}"><meta property="og:image" content="{cfg['pages_url']}media/banner.png"><link rel="stylesheet" href="{pre}style.css"></head><body><a class="skip" href="#main">{H(c['skip'])}</a><header class="shell"><a class="brand" href="{pre}">franklin-goal</a><nav aria-label="{'页面导航' if zh else 'Page navigation'}"><a href="#workflow">{c['nav'][0]}</a><a href="#use">{c['nav'][1]}</a><a href="#screens">{c['nav'][2]}</a><a href="{pre}" lang="en" {'aria-current="page"' if not zh else ''}>EN</a><a href="{pre}zh/" lang="zh-CN" {'aria-current="page"' if zh else ''}>中文</a></nav></header><main id="main" class="shell"><section class="hero"><div><p class="eyebrow">GOALS → ACTIONS → TIME</p><h1>{H(c['title'])}</h1><p class="lead">{H(c['intro'])}</p><a class="button" href="{cfg['app_url']}">{H(c['open'])} ↗</a></div><figure class="hero-screen"><img src="{pre}media/planning-current.png" alt="{H(c['captions'][1],quote=True)}" width="1468" height="1247" fetchpriority="high"></figure></section>
<section class="section" id="workflow"><h2>{H(c['concept_title'])}</h2><p class="lead narrow">{H(c['concept_intro'])}</p><div class="concepts">{cards(c['concepts'])}</div></section>
<section class="section planning"><div><h2>{H(c['planning_title'])}</h2><p class="lead">{H(c['planning_intro'])}</p></div><div class="modes">{cards(c['modes'])}</div><p class="planning-note">{H(c['planning_note'])}</p></section>
<section class="section manual"><div><h2>{H(c['manual_title'])}</h2><p class="lead">{H(c['manual_intro'])}</p></div><figure><img src="{pre}media/next-current.png" alt="{H(c['captions'][2],quote=True)}" width="1468" height="1247" loading="lazy"><figcaption>{H(c['captions'][2])}</figcaption></figure></section>
<section class="section" id="use"><h2>{'第一次使用' if zh else 'Your first session'}</h2><ol class="steps">{''.join('<li><h3>'+H(a)+'</h3><p>'+H(b)+'</p></li>' for a,b in c['steps'])}</ol></section>
<section class="section" id="screens"><h2>{H(c['gallery_title'])}</h2><div class="gallery">{gallery}</div></section>
<section class="section runtime" id="start"><div><h2>{H(c['storage_title'])}</h2><p>{H(c['storage'])}</p><h3>{'AI 与数据' if zh else 'AI and your data'}</h3><p>{H(c['ai'])}</p><h3>{'JSON 备份' if zh else 'JSON backups'}</h3><p>{H(c['backup'])}</p></div><div><h3>{H(c['notes_title'])}</h3><p>{H(c['notes'])}</p><h3>{H(c['run'])}</h3><pre><code>npm ci\nnpm run dev</code></pre><p>{H(c['run_note'])}</p><a href="https://github.com/{cfg['repository']}/blob/main/site/GUIDE.md">{H(c['guide'])} ↗</a></div></section></main><footer class="shell"><img src="{pre}media/signature.svg" width="85" height="36" alt="Frankie"><span>{H(c['footer'])}</span><a href="https://github.com/{cfg['repository']}">{H(c['source'])} ↗</a></footer></body></html>'''
  (dest/'index.html').write_text(page)
 print(out)
if __name__=='__main__':
 ap=argparse.ArgumentParser();ap.add_argument('--out',default='_site');a=ap.parse_args();build(Path(__file__).resolve().parents[1],Path(a.out).resolve())

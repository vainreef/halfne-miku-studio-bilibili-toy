"""Editable hair structure/material pass; does not regenerate other character artwork."""
import re
from pathlib import Path
p=Path(__file__).resolve().parents[1]/'art/source/whale-master.svg'
s=p.read_text()
def group(id,node,body,before=None):
 global s
 pattern=r'(<g id="'+re.escape(id)+r'" data-node="[^"]+"[^>]*>).*?(</g><!-- /part -->)'
 if re.search(pattern,s,re.S):s=re.sub(pattern,lambda m:m[1]+body+m[2],s,flags=re.S)
 else:
  g=f'<g id="{id}" data-node="{node}">{body}</g><!-- /part -->\n'
  if before:s=s.replace(before,g+before)
  else:s=s.replace('</svg>',g+'</svg>')
def get(id):return re.search(r'<g id="'+re.escape(id)+r'".*?<!-- /part -->',s,re.S)[0]
def gradient(id,xml):
 global s
 pattern=r'<(?:linear|radial)Gradient id="'+id+r'".*?</(?:linear|radial)Gradient>'
 if re.search(pattern,s,re.S):s=re.sub(pattern,lambda m:xml,s,flags=re.S)
 else:s=s.replace('</defs>',xml+'\n</defs>',1)
gradient('hair','''<radialGradient id="hair" gradientUnits="userSpaceOnUse" cx="505" cy="305" r="550"><stop stop-color="#2e6be9"/><stop offset=".46" stop-color="#2b65e2"/><stop offset=".8" stop-color="#2a60db"/><stop offset="1" stop-color="#2553c8"/></radialGradient>''')
gradient('hairBack','''<linearGradient id="hairBack" x1="520" y1="335" x2="620" y2="1010" gradientUnits="userSpaceOnUse"><stop stop-color="#2744ae"/><stop offset=".4" stop-color="#2a58c7"/><stop offset=".72" stop-color="#2d7ce6"/><stop offset="1" stop-color="#329cf4"/></linearGradient>''')
gradient('hairLight','''<linearGradient id="hairLight" x1="440" y1="480" x2="670" y2="990" gradientUnits="userSpaceOnUse"><stop stop-color="#2c72e1"/><stop offset=".5" stop-color="#328df0"/><stop offset="1" stop-color="#35a7f5"/></linearGradient>''')
gradient('hairInnerShadow','''<linearGradient id="hairInnerShadow" x1="510" y1="440" x2="640" y2="995" gradientUnits="userSpaceOnUse"><stop stop-color="#253d9e"/><stop offset=".47" stop-color="#274bb1"/><stop offset="1" stop-color="#2b66ce"/></linearGradient>''')
for side,x1,x2 in [('L',310,370),('R',805,700)]:
 gradient('frontLock'+side,f'''<linearGradient id="frontLock{side}" x1="{x1}" y1="500" x2="{x2}" y2="785" gradientUnits="userSpaceOnUse"><stop stop-color="#285bd0"/><stop offset=".45" stop-color="#2b69dc"/><stop offset=".78" stop-color="#328aee"/><stop offset="1" stop-color="#399bf4"/></linearGradient>''')
 gradient('frontLight'+side,f'''<linearGradient id="frontLight{side}" x1="{x1}" y1="595" x2="{x2}" y2="780" gradientUnits="userSpaceOnUse"><stop stop-color="#2e77e4"/><stop offset=".5" stop-color="#328aee"/><stop offset="1" stop-color="#3a9df5"/></linearGradient>''')
 gradient('underLock'+side,f'''<linearGradient id="underLock{side}" x1="{x1}" y1="575" x2="{x2}" y2="746" gradientUnits="userSpaceOnUse"><stop stop-color="#326ee1"/><stop offset=".55" stop-color="#397fe9"/><stop offset="1" stop-color="#3d97f2"/></linearGradient>''')
 gradient('curlShade'+side,f'''<linearGradient id="curlShade{side}" x1="{x1}" y1="630" x2="{x2}" y2="775" gradientUnits="userSpaceOnUse"><stop stop-color="#234bb9" stop-opacity=".42"/><stop offset=".66" stop-color="#2658c7" stop-opacity=".24"/><stop offset="1" stop-color="#2b6bdd" stop-opacity="0"/></linearGradient>''')
gradient('backSideShadeL','''<linearGradient id="backSideShadeL" x1="310" y1="660" x2="440" y2="690" gradientUnits="userSpaceOnUse"><stop stop-color="#2344a7" stop-opacity="0"/><stop offset="1" stop-color="#2344a7" stop-opacity=".65"/></linearGradient>''')
gradient('backSideShadeR','''<linearGradient id="backSideShadeR" x1="670" y1="650" x2="850" y2="710" gradientUnits="userSpaceOnUse"><stop stop-color="#213e9f" stop-opacity=".65"/><stop offset="1" stop-color="#274fb8" stop-opacity="0"/></linearGradient>''')
# Paint-layer separation, not a new animated joint for the cap.
if 'id="hair-cap"' not in s:
 m=get('head-base');cap=re.search(r'<path[^>]+/>',m)[0];s=s.replace(m,m.replace(cap,'',1));group('hair-cap','head.hairCap',cap,before='<g id="head-base"')
# Full under-lock silhouettes extend beneath the cheek and upper clothing, not into an elbow.
left='''<path data-strand="under-left" d="M333 550 C342 581 350 613 374 636 Q402 657 432 663 L456 664 Q437 679 405 682 L416 695 Q382 692 363 674 C364 698 351 723 329 735 L309 741 Q329 714 331 693 Q335 678 323 668 C309 636 311 582 333 550Z" fill="url(#underLockL)"/><path d="M333 578 Q331 632 360 660 Q378 678 405 682 Q371 682 352 663 C330 640 322 609 333 578Z" fill="url(#curlShadeL)"/>'''
right='''<path data-strand="under-right" d="M797 550 C804 591 785 633 759 654 Q733 676 692 681 L660 675 Q675 692 708 696 L695 709 Q737 703 764 689 C754 718 748 748 760 764 Q782 742 791 710 Q798 690 788 681 C816 650 833 610 826 566Z" fill="url(#underLockR)"/><path d="M800 585 Q809 631 776 665 Q746 694 708 696 Q751 689 770 659 Q795 626 800 585Z" fill="url(#curlShadeR)"/>'''
group('hair-under-left','hairUnderL',left,before='<g id="bodice"')
group('hair-under-right','hairUnderR',right,before='<g id="bodice"')
for side,name in [('L','left'),('R','right')]:
 m=get('side-lock-'+name)
 m2=m.replace('url(#hair)','url(#frontLock'+side+')').replace('url(#hairLight)','url(#frontLight'+side+')')
 # Idempotent material overlay for the curl's concave turn.
 m2=re.sub(r'<path data-shading="curl-turn"[^>]+/>','',m2)
 if side=='L':shade='<path data-shading="curl-turn" d="M311 604 C300 635 309 657 329 678 Q351 699 350 720 Q348 741 327 751 C352 740 365 717 350 691 Q331 664 326 649 Q315 628 321 609Z" fill="url(#curlShadeL)"/>'
 else:shade='<path data-shading="curl-turn" d="M774 622 Q778 653 745 682 C715 704 701 722 713 746 L725 765 Q697 753 699 729 C696 707 724 684 744 667 Q765 645 774 622Z" fill="url(#curlShadeR)"/>'
 m2=m2.replace('</g><!-- /part -->',shade+'</g><!-- /part -->');s=s.replace(m,m2)
# Blur only inside each strand's silhouette: shade cannot spill into face/clothing.
if 'id="hairShadeSoft"' not in s:
 s=s.replace('</defs>','<filter id="hairShadeSoft" x="-30%" y="-20%" width="160%" height="140%"><feGaussianBlur stdDeviation="3.5"/></filter></defs>',1)
for side,name in [('L','left'),('R','right')]:
 m=get('side-lock-'+name)
 first=re.search(r'<path[^>]+/>',m)[0]
 clip='<clipPath id="frontStrandClip'+side+'" clipPathUnits="userSpaceOnUse">'+first+'</clipPath>'
 pattern=r'<clipPath id="frontStrandClip'+side+r'".*?</clipPath>'
 if re.search(pattern,s,re.S):s=re.sub(pattern,lambda q:clip,s,flags=re.S)
 else:s=s.replace('</defs>',clip+'</defs>',1)
 m=get('side-lock-'+name)
 m2=m.replace('data-shading="curl-turn"','data-shading="curl-turn" filter="url(#hairShadeSoft)" clip-path="url(#frontStrandClip'+side+')"')
 s=s.replace(m,m2)
for name,shade in [
 ('left','<path data-shading="back-inner" d="M351 420 C407 490 416 582 402 683 C395 764 373 841 348 889 L324 830 Q362 722 348 653 Q330 562 351 420Z" fill="url(#backSideShadeL)"/>'),
 ('right','<path data-shading="back-inner" d="M674 525 C710 615 741 666 768 709 C793 757 785 799 804 843 L806 911 Q743 891 725 822 C705 779 684 733 678 676Z" fill="url(#backSideShadeR)"/>')]:
 m=get('hair-back-'+name);m2=re.sub(r'<path data-shading="back-inner"[^>]+/>','',m);m2=m2.replace('</g><!-- /part -->',shade+'</g><!-- /part -->');s=s.replace(m,m2)
# Replace flat cyan highlights/dark cap accents with material gradients while keeping silhouettes.
gradient('bangLight','''<linearGradient id="bangLight" x1="330" y1="282" x2="560" y2="404" gradientUnits="userSpaceOnUse"><stop stop-color="#68c8fc"/><stop offset="1" stop-color="#67bdf7"/></linearGradient>''')
gradient('bangShade','''<linearGradient id="bangShade" x1="470" y1="220" x2="636" y2="295" gradientUnits="userSpaceOnUse"><stop stop-color="#244dbd"/><stop offset="1" stop-color="#2854ca"/></linearGradient>''')
for name in ['left','center','right']:
 m=get('bangs-'+name);s=s.replace(m,m.replace('#6bc8fa','url(#bangLight)').replace('#244dbd','url(#bangShade)'))
p.write_text(s)

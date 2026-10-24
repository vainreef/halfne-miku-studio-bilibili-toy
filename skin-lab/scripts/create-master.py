"""Authored vector artwork in reference-image coordinates. Run explicitly to recreate
source master; normal regeneration uses export-parts.mjs and preserves manual edits."""
from pathlib import Path
import math
out=Path(__file__).resolve().parents[1]/'art/source/whale-master.svg'
parts=[]
def path(d,fill,extra=''):return f'<path d="{d}" fill="{fill}" {extra}/>'
def ellipse(x,y,rx,ry,fill,extra=''):return f'<ellipse cx="{x}" cy="{y}" rx="{rx}" ry="{ry}" fill="{fill}" {extra}/>'
def part(id,node,body,expr=None,visible=True):
 parts.append(f'<g id="{id}" data-node="{node}"'+(f' data-state="{expr}"' if expr else '')+(' style="display:none"' if not visible else '')+'>'+body+'</g><!-- /part -->')
def bow(x,y,size,color):
 return f'<g transform="translate({x} {y}) scale({size})">'+path('M-4 -4 C-45 -40 -46 -28 -32 8 C-45 40 -19 26 -3 8 Z',color)+path('M4 -4 C45 -40 46 -28 32 8 C45 40 19 26 3 8 Z',color)+path('M-9 -8 Q0 -13 9 -8 L10 8 Q0 14 -10 8Z',color)+path('M-4 8 L-14 52 1 42 8 13 M5 8 L36 40 36 18 12 5',color)+'</g>'
# Independent tail, intentionally behind all hair and clothes. Full hidden root.
part('whale-tail','whaleTail',path('M 650 935 C 750 920 784 1020 877 1010 C 942 1007 998 951 1015 909 C 984 905 929 919 905 895 C 887 878 892 852 894 834 C 936 856 975 851 1021 840 C 1068 799 1136 820 1216 788 C 1228 843 1195 900 1151 925 C 1111 947 1064 958 1040 946 C 1020 1096 929 1178 812 1173 C 737 1169 690 1117 648 1076 Z','url(#tail)')+path('M 672 1028 C 739 1109 797 1144 874 1128 C 960 1110 1019 1033 1040 946 C 1038 1068 958 1171 844 1175 C 759 1184 688 1121 648 1076 Z','#b5b9ef')+path('M 1040 944 C 1124 939 1212 893 1216 788 C 1233 852 1194 911 1154 931 C 1118 950 1066 964 1040 954Z','#f7f5ff'))
# Back hair: sweeping curls, not two recolored straight ponytails.
left=path('M 350 370 C 305 360 260 382 244 450 C 201 463 224 556 208 621 C 182 657 120 683 153 735 C 162 750 180 758 205 762 C 154 792 110 826 132 874 C 141 895 165 908 185 906 C 162 934 187 969 222 976 C 265 986 294 955 301 934 C 302 966 287 1004 262 1020 C 334 1003 367 955 366 900 C 405 839 432 740 443 648 C 445 550 435 420 350 370 Z','url(#hairBack)')
left+=path('M 256 358 C 246 454 261 503 247 566 C 233 633 188 661 184 693 C 177 726 213 734 226 753 C 180 783 155 810 164 837 C 170 863 209 865 205 894 C 201 921 232 936 253 920 C 288 889 253 855 266 814 C 282 764 326 742 313 689 C 304 650 307 624 325 603 C 343 565 353 452 337 359 Z','url(#hairLight)')
part('hair-loop-left','head.clipBL',path('M 254 284 C 176 320 164 360 168 409 C 179 374 204 345 249 335 C 207 356 190 388 202 420 C 211 383 234 366 264 357 Z','#2859d9'))
left+=path('M 209 617 C 168 638 138 668 144 701 C 149 730 178 748 204 751 C 169 725 161 701 178 676 C 187 658 203 646 218 636 Z','#278af0')
left+=path('M 221 878 C 250 905 278 918 268 944 C 259 965 240 972 223 966 C 267 985 298 955 296 932 C 297 900 267 876 256 856Z','#2f8aef')
left+=path('M 168 820 C 138 852 158 884 184 892 Q 168 869 188 845Z','#329bf5')
left+=path('M 334 624 C 300 677 330 713 313 747 C 301 775 275 789 275 823 C 268 797 271 777 286 757 C 308 730 291 700 299 675 Q 309 643 334 624Z','#245dcc')
left+=path('M 256 891 C 278 921 272 944 250 954 Q 279 951 285 927 Q 282 904 256 891Z','#4bb9fa')
part('hair-back-left','tailL',left)
right=path('M 800 370 C 860 355 917 408 938 456 C 960 467 1007 500 1002 567 C 1000 612 978 636 978 657 C 1046 703 1057 743 1028 774 C 1006 796 980 802 965 818 C 1003 845 1000 886 977 908 C 949 936 905 937 890 963 C 890 990 860 1011 832 1001 C 790 994 779 952 781 918 C 723 895 712 840 725 788 C 689 728 650 587 638 514 Z','url(#hairBack)')
right+=path('M 879 371 C 943 425 907 500 935 552 C 947 579 963 599 944 633 C 913 674 928 700 964 724 C 1011 754 985 772 954 786 C 915 805 917 838 934 862 C 944 881 929 900 904 912 C 862 937 867 963 880 977 C 828 978 816 936 833 900 C 866 846 834 810 812 779 C 787 743 804 702 828 674 C 873 623 844 573 827 526 Z','url(#hairLight)')
right+=path('M 928 430 C 1000 449 1029 512 1000 567 C 1010 517 974 468 932 461 Z','#244fce')
right+=path('M 947 560 C 996 614 1028 625 1009 670 C 1032 652 1031 632 1014 614 C 994 594 970 585 951 568Z','#326ae6')
right+=path('M 920 813 C 947 844 929 875 904 894 C 880 910 874 936 885 958 Q 855 941 871 908 C 887 879 905 866 893 839Z','#2d8eef')
right+=path('M 806 682 C 791 729 830 754 834 787 C 841 826 809 845 816 883 C 796 848 824 826 817 794 C 813 769 777 738 792 705Z','#2860cf')
right+=path('M 936 715 Q 971 744 964 766 Q 992 746 963 723Z','#51b7fb')
part('hair-back-right','tailR',right)
# Legs: real skin, ruffled socks and low navy shoes. Hidden thigh extension.
for side,flip in [('left',False),('right',True)]:
 body=path('M 434 1025 L 520 1044 L 473 1147 Q 459 1170 418 1155 L 404 1133 Z','url(#skin)')+path('M 439 1050 L 511 1062 L 484 1101Z','#ffb69f')
 body+=path('M 408 1127 Q 416 1114 434 1121 Q 448 1115 454 1128 Q 483 1117 489 1134 Q 490 1149 471 1151 L 475 1195 L 404 1197 L 403 1151 Q 386 1145 398 1135Z','url(#white)')
 body+=path('M 415 1146 L 431 1198 L 405 1199 L 402 1151Z','#d9d7f6')
 body+=path('M 405 1172 Q 427 1163 449 1181 L 467 1201 Q 475 1218 460 1227 C 439 1239 382 1234 376 1218 Q 373 1197 391 1174Z','url(#navy)')
 body+=path('M 391 1191 Q 411 1179 433 1196 M 424 1184 L 436 1198','none','stroke="#fcfbff" stroke-width="5" stroke-linecap="round"')
 if flip:body=f'<g transform="translate(1100 0) scale(-1 1)">{body}</g>'
 part('leg-'+side,'legR' if flip else 'legL',body)
# Skirt with built-in overlap behind bodice, white hem, apron and whale embroidery.
skirt=path('M 467 805 Q 547 785 622 807 C 664 874 718 904 775 955 L 815 1018 Q 580 1151 300 1010 C 332 931 420 889 467 805 Z','url(#navy)')
skirt+=path('M 465 819 C 438 880 417 930 394 979 L 330 999 M 628 824 C 649 888 698 943 744 1007','none','stroke="#2a315f" stroke-width="9" opacity=".55"')
skirt+=path('M 311 989 Q 527 1116 804 1001 L 816 1024 Q 569 1155 299 1014 Z','url(#white)')
# Pleated lace along the lower arc, kept within the silhouette.
for i in range(18):
 t=i/17;x=310+493*t;y=1001+65*math.sin(math.pi*t)
 a=-18+35*t
 skirt+=f'<g transform="translate({x:.2f} {y:.2f}) rotate({a:.2f})">'+path('M-13 -9 L12 -9 L16 12 Q0 20 -15 10Z','#fafaff')+path('M6 -8 L12 -9 L16 12 L9 15Z','#deddf8')+'</g>'
skirt+=path('M 481 819 Q 550 838 618 819 C 626 872 644 909 631 959 C 626 1018 581 1035 524 1030 C 451 1028 412 1005 414 959 C 419 907 462 873 481 819 Z','url(#white)')
# Apron scallops follow the border, not a cut-out PNG.
for x,y,r in [(472,851,11),(458,873,10),(442,895,10),(429,920,10),(420,945,10),(423,974,10),(436,995,10),(459,1011,10),(485,1023,9),(514,1030,9),(543,1031,9),(572,1028,10),(600,1017,10),(621,995,10),(630,970,10),(636,945,10),(632,917,10),(624,888,10),(620,861,10)]:skirt+=ellipse(x,y,r,r,'#f7f7ff')
skirt+=path('M 487 844 Q 554 859 612 841 M 474 858 L453 895 M 596 854 L602 896','none','stroke="#dddaf4" stroke-width="4" stroke-linecap="round"')
# Whale mark: rounded head, smile, tail and water-spout.
skirt+=path('M 487 974 C 475 946 493 923 517 927 C 543 927 540 953 559 952 Q 568 952 569 942 Q 554 944 556 932 Q 570 928 575 941 Q 587 928 592 938 Q 590 951 577 952 Q 569 976 547 979 Q 512 968 487 974 Z','#2860e5')+path('M 490 964 Q 508 964 519 976 Q 503 979 490 974 Z','#fff')+ellipse(502,944,3,3,'#fff')+path('M 519 919 Q 513 909 509 912 M 521 918 Q 525 906 532 911','none','stroke="#2c67e9" stroke-width="5" stroke-linecap="round"')
part('skirt-apron','lower.skirt',skirt)
part('waist-ribbon','lower.belt',bow(704,944,.95,'#e9af8b'))
# Bodice, shoulders, arms: full surfaces overlap inside the sleeves.
part('bodice','upper',path('M 467 705 Q 540 692 615 707 L 650 771 L 622 834 Q 541 851 466 828 L 438 769Z','url(#navy)')+path('M 475 701 L 606 701 L 600 795 Q 542 812 480 791Z','url(#white)')+path('M 469 795 Q 542 813 621 795 L 620 836 Q 544 849 469 829 Z','#343b72')+''.join(ellipse(x,y,4.7,4.7,'#f6ce85') for x,y in [(491,809),(491,826),(558,813),(558,830)]))
# Side white ruffles map to original shirt physics nodes.
for side in ['left','right']:
 b=path('M 478 706 Q 459 697 458 717 Q 442 717 449 734 Q 435 744 446 756 Q 434 772 449 782 Q 449 798 471 793 L 484 764 Z','url(#white)')
 if side=='right':b=f'<g transform="translate(1095 0) scale(-1 1)">{b}</g>'
 part('bodice-frill-'+side,'upper.shirtL' if side=='left' else 'upper.shirtR',b)
for side in ['left','right']:
 b=path('M 457 714 C 429 707 411 724 403 749 L 379 792 Q 368 806 382 822 L 417 844 Q 432 828 445 810 L 449 778 Q 476 751 457 714 Z','url(#navy)')
 b+=path('M 398 775 Q 417 794 436 799 L 418 827 L 383 807Z','#323968')
 if side=='right':b=f'<g transform="translate(1100 0) scale(-1 1)">{b}</g>'
 part('sleeve-'+side,'shoulderL' if side=='left' else 'shoulderR',b)
# Chest / neck, collar is intentionally behind the bow.
part('neck','uppercollar.collar.neck',path('M 533 666 L 583 668 L 578 719 L 542 730 L 529 706Z','url(#skin)'))
part('collar','uppercollar.collar.collar',path('M 505 694 Q 527 683 543 704 L 557 713 L 581 697 Q 599 688 620 709 L 600 746 L 561 722 L 535 750 L 500 715Z','url(#white)')+path('M 546 747 L 563 747 L 557 790 L 543 790Z','#fff')+ellipse(550,758,2.7,2.7,'#363e70')+ellipse(550,778,2.7,2.7,'#363e70'))
part('chest-bow','uppercollar.collar.tie',bow(548,724,.95,'#29315f')+ellipse(548,724,7,9,'#61b9e9')+path('M 546 718 L 552 720 L 550 730 L 544 730Z','#eeb282'))
# Whale fins / head side ornaments: white lining and curved navy fin silhouette.
for side in ['left','right']:
 b=path('M 338 412 C 267 421 230 491 86 510 C 104 540 134 545 154 539 Q 175 568 201 548 Q 223 574 247 551 Q 272 570 304 540 L 351 476Z','url(#white)')+path('M 335 402 C 266 421 228 491 87 510 Q 115 539 154 517 Q 178 540 201 521 Q 223 544 247 522 Q 274 545 300 519 L 350 470Z','url(#fin)')
 if side=='right':b=f'<g transform="translate(1165 20) scale(-1 1)">{b}</g>'
 part('head-fin-'+side,'head.phoneL' if side=='left' else 'head.phoneR',b)
# Complete head backing and hidden forehead, ears, skin (no gaps below fringe).
head=path('M 298 351 C 289 231 390 136 538 126 C 725 101 864 183 907 320 C 948 442 907 582 845 669 C 820 665 800 672 780 650 L 335 650 C 282 627 261 477 298 351Z','url(#hair)')
head+=ellipse(804,600,36,56,'#ffdabf')+ellipse(808,600,18,30,'#f7b8a5')
head+=path('M 359 344 C 418 281 641 288 731 345 C 794 389 823 480 802 573 C 788 653 685 681 553 682 C 426 681 347 653 336 592 C 318 505 322 412 359 344 Z','url(#skin)')
part('head-base','head.base',head)
# Deliberately asymmetric curly face-framing strands, hidden extensions under cap.
lock=path('M 342 288 C 316 385 283 427 255 503 C 232 566 238 643 282 679 C 303 705 329 727 310 750 Q 336 751 352 728 C 365 692 335 663 334 643 Q 352 669 377 671 C 338 637 327 620 331 588 C 299 612 309 549 321 518 C 347 446 380 350 342 288 Z','url(#hair)')
lock+=path('M 292 634 C 279 679 321 699 329 724 C 336 745 322 758 303 761 C 346 764 371 731 355 702 Q 341 675 326 663 Z','url(#hairLight)')
part('side-lock-left','head.momiL',lock)
lockR=path('M 800 300 C 856 352 867 421 846 487 C 839 560 852 617 809 653 C 778 680 746 697 746 728 C 748 752 767 756 782 761 C 739 773 701 748 702 721 C 699 677 755 652 758 620 C 782 586 782 549 780 515 C 752 475 756 358 800 300 Z','url(#hair)')
lockR+=path('M 796 591 C 805 643 764 667 740 690 Q 715 718 734 746 C 708 733 703 715 716 693 C 733 663 770 642 776 609 Z','url(#hairLight)')
part('side-lock-right','head.momiR',lockR)
# Three broad, overlapping fringe shapes. Their top edges remain buried under cap.
part('bangs-left','head.bangs.L',path('M 355 222 Q 411 185 478 226 C 451 305 415 350 380 403 C 338 464 316 514 287 588 C 268 545 274 492 288 447 C 304 388 296 285 355 222Z','url(#hair)')+path('M 348 281 Q 367 320 411 313 Q 373 346 337 345 L 317 372 Q 313 333 348 281Z','#66c9ff'))
part('bangs-center','head.bangs.M',path('M 445 224 C 511 183 615 189 675 231 C 664 311 636 392 590 472 C 579 497 569 522 561 544 Q 567 559 578 565 Q 545 565 526 551 Q 508 566 490 564 Q 510 553 515 540 C 482 503 469 472 465 441 L 452 527 C 420 464 423 401 416 359 C 406 305 413 265 445 224 Z','url(#hair)')+path('M 455 313 C 489 354 530 357 572 346 Q 515 394 461 375 L 446 401 Q 438 353 455 313Z','#6accff')+path('M 436 270 Q 489 216 515 238 Q 470 245 436 270Z','#234ac5'))
part('bangs-right','head.bangs.R',path('M 651 218 C 744 197 805 244 825 312 C 838 376 841 444 826 508 Q 816 535 795 512 C 779 493 777 462 769 437 Q 758 462 750 484 C 733 444 730 408 719 379 C 710 419 685 462 665 499 Q 652 523 643 532 C 631 496 631 458 626 421 Q 610 454 599 475 C 599 414 618 339 632 290 Z','url(#hair)')+path('M 557 235 Q 602 195 664 290 Q 612 245 557 235Z','#234ac5'))
# Curled ahoge, with a pale rim and a dark lower tip.
part('ahoge','head.ahoge',path('M 419 103 C 442 16 547 -8 610 44 C 683 105 625 160 581 180 C 608 141 617 97 583 77 C 536 43 463 62 419 103 Z','url(#hair)','stroke="#eef9ff" stroke-width="2"')+path('M 419 103 Q 432 64 458 49 Q 439 77 419 103 Z','#1766d9'))
# White pleated maid headband. A continuous under-band plus individual lace folds.
# Ellipse from left-side to upper crown and down to right-side, open toward bottom.
band=path('M 283 351 C 276 229 374 112 509 111 C 528 100 556 107 574 116 C 701 93 835 192 871 332 L 872 398 L 841 404 C 828 277 710 186 579 194 C 443 188 335 249 315 355Z','url(#white)')
# Pleats along an elliptical cap: polar span 200..348 degrees in y-down coords.
for i in range(13):
 a=math.radians(199+i*11.8);b=a+math.radians(10)
 # centered at x575 y405; all samples across upper arc
 p1=(575+299*math.cos(a),405+290*math.sin(a));p2=(575+299*math.cos(b),405+290*math.sin(b));p3=(575+254*math.cos(b),405+241*math.sin(b));p4=(575+254*math.cos(a),405+241*math.sin(a))
 band+=path(f'M {p1[0]:.1f} {p1[1]:.1f} L {p2[0]:.1f} {p2[1]:.1f} L {p3[0]:.1f} {p3[1]:.1f} L {p4[0]:.1f} {p4[1]:.1f} Z','#fafaff')
 band+=path(f'M {p2[0]:.1f} {p2[1]:.1f} L {p3[0]:.1f} {p3[1]:.1f} L {p3[0]-9:.1f} {p3[1]+3:.1f}Z','#dcdaf6')
part('maid-headdress','head.headDress',band)
part('blue-hair-bow','head.clipFR',path('M 866 414 C 815 371 797 395 819 432 C 805 474 828 488 866 448 Z','#38b9f7')+path('M 884 414 C 929 372 952 388 933 430 C 950 470 923 487 884 448Z','#32b3f4')+path('M 861 421 Q 873 414 888 419 L 891 441 Q 875 450 861 441Z','#42c1fa')+path('M 860 428 Q 845 423 847 434 Q 853 437 861 432 M 891 429 Q 903 420 905 429 Q 901 437 891 432Z','#218edb'))
# Front forearms on hips. Skin hands overlap skirt at waist, never floating at chest.
for side in ['left','right']:
 b=path('M 388 791 L 423 803 L 465 849 L 437 869 Q 405 850 381 820 Q 372 806 388 791 Z','url(#navy)')+path('M 417 831 L 434 816 L 451 837 L 433 854Z','#acb5db')+path('M 438 842 Q 447 829 458 836 L 479 855 Q 485 862 476 871 L 464 880 Q 456 883 445 875 L 433 861Z','url(#skin)')
 if side=='right':b=f'<g transform="translate(1100 0) scale(-1 1)">{b}</g>'
 part('forearm-'+side,'armL' if side=='left' else 'armR',b)
# All expression states use original protocol keys. Default half-lidded mischievous face.
for eye in ['happy','jaded','oo','xx','aa','sideglance','eheh','pumped']:
 for opened in ['o','c']:
  body=''
  for right in [False,True]:
   x,y=(650,512) if right else (409,490)
   # Main face spacing and asymmetric slant follow the reference.
   if opened=='c':
    d='M -30 21 Q 0 45 31 22' if eye in ['happy','eheh'] else 'M-29 28 Q0 16 30 27'
    body+=f'<g transform="translate({x} {y})">'+path(d,'none','stroke="#303760" stroke-width="10" stroke-linecap="round"')+'</g>'
   elif eye in ['happy','jaded','sideglance']:
    dx=9 if eye=='sideglance' else 0
    h=87 if eye=='happy' else 72
    body+=f'<g transform="translate({x+dx} {y})">'+path(f'M-23 0 L27 3 L24 {h-15} Q22 {h} 0 {h} Q-23 {h} -23 {h-17} Z','#303760')+path('M-34 -6 L36 4','none','stroke="#303760" stroke-width="12" stroke-linecap="round"')+'</g>'
   elif eye=='oo':body+=ellipse(x,y+29,28,39,'#303760')+ellipse(x-6,y+15,9,13,'#fff')
   elif eye=='xx':body+=f'<g transform="translate({x} {y+25})">'+path('M-27 0 L27 48 M27 0 L-27 48','none','stroke="#303760" stroke-width="12" stroke-linecap="round"')+'</g>'
   elif eye=='aa':
    body+=f'<g transform="translate({x} {y+28})">'+path('M 1 -2 C-39 -34 -43 31 -8 34 C17 37 23 1 2 2 C-19 2 -18 25 -2 22 C31 47 48 -11 13 -27','none','stroke="#303760" stroke-width="7" stroke-linecap="round"')+'</g>'
   elif eye=='eheh':body+=f'<g transform="translate({x} {y+18})">'+path('M-28 40 L9 5 L28 43','none','stroke="#303760" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"')+'</g>'
   elif eye=='pumped':body+=f'<g transform="translate({x} {y+22})">'+path('M0 -20 L11 9 L38 15 L13 31 L8 58 L-9 37 L-36 32 L-13 14Z','#303760')+'</g>'
  # Short blue brows, never a second pair of heavy eyes.
  body+=path('M 428 448 Q 440 462 451 465 M 604 475 Q 624 472 639 461','none','stroke="#2e88e6" stroke-width="3" stroke-linecap="round"')
  part(f'eyes-{eye}{opened}','head.face.eyes',body,eye+opened,eye=='happy' and opened=='o')
part('blush','head.face.facered',ellipse(380,600,22,14,'#ff8795')+ellipse(680,611,22,14,'#ff8795'))
for kind in ['happy','neutral','cat','angry','pout','drool','duck','tongue']:
 for mouth in range(1,8):
  x,y=520,620
  # The reference's cheeky open smile is default; vowel shapes remain distinct.
  w=[31,30,36,18,32,22,34][mouth-1];h=[57,55,19,32,28,42,19][mouth-1]
  if kind=='pout':w*=.65;h*=.6
  if kind=='duck':
   b=path(f'M{-w} 0 Q0 {-h*.5} {w} 0 L{w*.55} {h*.4} L{-w*.6} {h*.35}Z','#ee8c89')
  elif kind=='cat' and mouth==1:b=path('M-30 2 Q-15 25 0 2 Q15 25 30 2','none','stroke="#ed8581" stroke-width="5" stroke-linecap="round"')
  elif kind=='neutral' and mouth==1:b=path('M-22 5 Q0 3 22 5','none','stroke="#ed8581" stroke-width="5" stroke-linecap="round"')
  elif kind=='angry' and mouth==1:b=path('M-25 14 Q0 -7 25 14','none','stroke="#db7478" stroke-width="5" stroke-linecap="round"')
  else:
   b=path(f'M{-w} 0 Q{-w*.4} 11 0 2 Q{w*.5} 9 {w} -3 Q{w*.9} {h} 0 {h} Q{-w*.8} {h} {-w} 0Z','#ec676c')
   b+=path(f'M{-w*.62} {h*.58} Q0 {h*.27} {w*.65} {h*.5} Q{w*.6} {h} 0 {h} Q{-w*.5} {h} {-w*.62} {h*.58}Z','#ff9296')
   if mouth==7:b+=path(f'M{-w*.85} 1 Q0 8 {w*.85} -1 L{w*.75} 10 Q0 17 {-w*.75} 11Z','#fff8f1')
  if kind=='drool':b+=path(f'M{w*.6} {h*.7} Q{w+12} {h+17} {w+1} {h+24} Q{w-10} {h+24} {w*.6} {h*.7}Z','#a9e2ff')
  if kind=='tongue':b+=path(f'M-9 {h*.5} Q9 {h*.4} 17 {h*.6} L16 {h+12} Q0 {h+29} -9 {h+9}Z','#ff8c9e')
  part(f'mouth-{kind}{mouth}','head.face.mouth',f'<g transform="translate({x} {y})">{b}</g>',kind+str(mouth),kind=='happy' and mouth==1)
defs='''<defs>
<linearGradient id="hair" x1="380" y1="180" x2="740" y2="730" gradientUnits="userSpaceOnUse"><stop stop-color="#2b66ed"/><stop offset=".38" stop-color="#2b5ddd"/><stop offset=".68" stop-color="#2b63df"/><stop offset="1" stop-color="#2f87ec"/></linearGradient>
<linearGradient id="hairBack" x1="500" y1="300" x2="650" y2="1000" gradientUnits="userSpaceOnUse"><stop stop-color="#2544b5"/><stop offset=".53" stop-color="#3168df"/><stop offset="1" stop-color="#2f9af6"/></linearGradient>
<linearGradient id="hairLight" x1="450" y1="500" x2="750" y2="960" gradientUnits="userSpaceOnUse"><stop stop-color="#3386ed"/><stop offset="1" stop-color="#31a8f7"/></linearGradient>
<linearGradient id="fin" x1="600" y1="430" x2="600" y2="580" gradientUnits="userSpaceOnUse"><stop stop-color="#244cc4"/><stop offset="1" stop-color="#2c41a7"/></linearGradient>
<linearGradient id="skin" x1="400" y1="400" x2="760" y2="1100" gradientUnits="userSpaceOnUse"><stop stop-color="#ffddc5"/><stop offset="1" stop-color="#ffd0b9"/></linearGradient>
<linearGradient id="white" x1="450" y1="800" x2="680" y2="1000" gradientUnits="userSpaceOnUse"><stop stop-color="#fff"/><stop offset="1" stop-color="#f2f0ff"/></linearGradient>
<linearGradient id="navy" x1="440" y1="750" x2="680" y2="1100" gradientUnits="userSpaceOnUse"><stop stop-color="#333b71"/><stop offset="1" stop-color="#3c4381"/></linearGradient>
<linearGradient id="tail" x1="750" y1="940" x2="1150" y2="1060" gradientUnits="userSpaceOnUse"><stop stop-color="#285bdb"/><stop offset="1" stop-color="#2354cf"/></linearGradient>
</defs>'''
# Source master is a static rest-pose illustration. Layer order follows the model;
# expression variants are kept hidden except default states.
order=['whaleTail','tailL','tailR','legL','legR','lower.skirt','lower.belt','upper','upper.shirtL','upper.shirtR','shoulderL','shoulderR','uppercollar.collar.neck','uppercollar.collar.collar','uppercollar.collar.tie','head.phoneL','head.phoneR','head.clipBL','head.base','head.face.eyes','head.face.facered','head.face.mouth','head.momiL','head.momiR','head.bangs.L','head.bangs.M','head.bangs.R','head.ahoge','head.headDress','head.clipFR','armL','armR']
parts.sort(key=lambda s:order.index(s.split('data-node="')[1].split('"')[0]))
out.write_text('<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="1254" height="1254" viewBox="0 0 1254 1254">\n<title>鲸鱼娘 — 可编辑分层母版</title>\n'+defs+'\n'+'\n'.join(parts)+'\n</svg>\n')
print(f'{len(parts)} authored groups → {out}')

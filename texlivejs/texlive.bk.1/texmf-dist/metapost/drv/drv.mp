%% drv 0.97
%% Copyright 2011 Laurent M\'ehats
%
% This work may be distributed and/or modified under the
% conditions of the LaTeX Project Public License, either version 1.3
% of this license or (at your option) any later version.
% The latest version of this license is in
%   http://www.latex-project.org/lppl.txt
% and version 1.3 or later is part of all distributions of LaTeX
% version 2005/12/01 or later.
%
% This work has the LPPL maintenance status `maintained'.
%
% The Current Maintainer of this work is Laurent M\'ehats.
% <laurent.mehats@gmail.com>
%
% This work consists of the file drv.mp

newinternal drv_version;
drv_version:=0.97;


%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
%
% User's macros summary
%
%
% * Judgment & inference declarations
% ===================================
%
%   jgm <nat> <str list>
%	<nat>		judgment index
%	<str list>	sub-judgments math-mode LaTeX code
%
%   nfr <nat> (<nat list>) (<str>, <id>)
%	<nat>		inference index
%	<nat list>	list of premise indices
%	<str>		inference label math-mode LaTeX code
%	<id>		inference line style identifier
%			(0, 1, 2, 3, 4, 5, 6 or _)
%			  0	none
%			  1	simple
%			  2	double
%			  3	dotted
%			  4	dashed
%			  5	waved
%			  6	TeX-dotted
%			  _	default (set by drv_path_style)
%
%   mvd <nat 1> (<nat 2>, <id>)
%	<nat 1>		index of the origin judgment
%	<nat 2>		number of phantom steps
%	<id>		phantom steps path-style identifier
%			(0, 1, 2, 3, 4, 5, 6 or _)
%
%   Nfr <nat> (<nat list>) (<str 1>, <str 2>, <str 3>, <id>)
%	<nat>		inference index
%	<nat list>	list of premise indices
%	<str 1>		inference label math-mode LaTeX code
%	<str 2>		left delimiter label math-mode LaTeX code
%	<str 3>		right delimiter label math-mode LaTeX code
%	<id>		inference line style identifier
%			(0, 1, 2, 3, 4, 5, 6 or _)
%
%   Mvd <nat 1> (<nat 2>, <str 1>, <str 2>, <id>)
%	<nat 1>		index of the origin judgment
%	<nat 2>		number of phantom steps
%	<str 1>		left label math-mode LaTeX code
%	<str 2>		right label math-mode LaTeX code
%	<id>		phantom steps path-style identifier
%			(0, 1, 2, 3, 4, 5, 6 or _)
%
%   NFR <nat> (<nat list>) (<str 1>, <str 2>, <str 3>, <str 4>)
%     (<id 1>, <id 2>, <id 3>)
%	<nat>		inference index
%	<nat list>	list of premise indices
%	<str 1>		left inference label math-mode LaTeX code
%	<str 2>		right inference label math-mode LaTeX code
%	<str 3>		left delimiter label math-mode LaTeX code
%	<str 4>		right delimiter label math-mode LaTeX code
%	<id 1>		junction style identifier (0, 1, 2, 3 or _)
%			  0	fully-interlacing
%			  1	semi-interlacing
%			  2	non-interlacing
%			  3	user specified (tricky)
%			  _	default (set by drv_junction_style)
%	<id 2>		alignment style identifier (l, c, r, u or _)
%			  l	left
%			  c	centered
%			  r	right
%			  u	user specified (tricky)
%			  _	default (set by drv_alignment_style)
%	<id 3>		inference line style identifier
%			(0, 1, 2, 3, 4, 5, 6 or _)
%
%   MVD <nat 1> (<nat 2>, <str 1>, <str 2>, <id 1> <id 2>)
%	<nat 1>		index of the origin judgment
%	<nat 2>		number of phantom steps
%	<str 1>		left label math-mode LaTeX code
%	<str 2>		right label math-mode LaTeX code
%	<id 1>		alignment style identifier (l, c, r, u or _)
%	<id 2>		phantom steps path-style identifier
%			(0, 1, 2, 3, 4, 5, 6 or _)
%
%   NFR_opt <nat> (<nat list>) (<str list 1>) (<str list 2>)
%     (<id 1>, <id 2>, <id 3>)
%	<nat>		inference index
%	<nat list>	list of premise indices
%	<str list 1>	list of inference labels math-mode LaTeX code
%	<str list 2>	list of delimiter labels math-mode LaTeX code
%	<id 1>		junction style identifier (0, 1, 2, 3 or _)
%	<id 2>		alignment style identifier (l, c, r, u or _)
%	<id 3>		inference line style identifier
%			(0, 1, 2, 3, 4, 5, 6 or _)
%
%   MVD_opt <nat 1> (<nat 2>) (<str list>) (<id 1> <id 2>)
%	<nat 1>		index of the origin judgment
%	<nat 2>		number of phantom steps
%	<str list>	list of labels math-mode LaTeX code
%	<id 1>		alignment style identifier (l, c, r or u)
%	<id 2>		phantom steps path-style identifier
%			(0, 1, 2, 3, 4, 5, 6 or _)
%
% * Tunings
% =========
%
%   drv_font_size <str>
%	<str>		LaTeX font-size command
%			  "\tiny"
%			  "\scriptsize"
%			  "\footnotesize"
%			  "\small"
%			  "\normalsize"
%			  "\large"
%			  "\Large"
%			  etc.
%
%   drv_math_style (<id>, <str>)
%	<id>		component identifier (drv, jdg, ilb, dlb or plb)
%			  drv	derivation trees
%			  jdg	judgments
%			  ilb	inference labels
%			  dlb	delimiter labels
%			  plb	phantom steps labels
%	<str>		LaTeX math-style command
%
%   drv_scale (<id>, <float>)
%	<id>		scale identifier (clr, crv, prm, jdg or ilb)
%			  clr	nice explanation soon (see examples)
%			  crv	nice explanation soon (see examples)
%			  prm	nice explanation soon (see examples)
%			  jdg	nice explanation soon (see examples)
%			  ilb	nice explanation soon (see examples)
%	<float>		scale value
%
%   drv_junction_style <id>
%	<id>		junction style identifier (0, 1 or 2)
%			  0	``fully-interlacing''
%			  1	``semi-interlacing''
%			  2	``non-interlacing''
%
%   drv_alignment_style <id>
%	<id>		alignment style identifier (l, c or r)
%			  l	left
%			  c	centered
%			  r	right
%
%   drv_path_style (<id 1>, <id 2>)
%	<id 1>		path-type identifier (iln or phm)
%			  iln	inference lines
%			  phm	phantom steps paths
%	<id 2>		path-style identifier (0, 1, 2, 3, 4, 5 or 6)
%
%   drv_labels_position (<id 1>, <id 2>)
%	<id 1>		label-type identifier (ilb, plb or dlb)
%			  ilb	inference labels
%			  dlb	delimiter labels
%			  plb	phantom steps labels
%	<id 2>		position identifier (l or r)
%			  l	left
%			  r	right
%
%   drv_roots_position <id>
%	<id>		position identifier (t or b)
%			  t	top
%			  b	bottom
%
%   drv_axis_reference <id>
%	<id>		reference identifier (iln or jdg)
%			  iln	root inference line axis
%			  jdg	root judgment math-axis
%
%   drv_left_delimiter <str>
%	<str>		left delimiter math-mode LaTeX code
%			  "("
%			  "["
%			  "\lbrace"
%			  "\langle"
%			  etc.
%
%   drv_right_delimiter <str>
%	<str>		right delimiter math-mode LaTeX code
%			  ")"
%			  "]"
%			  "\rbrace"
%			  "\rangle"
%			  etc.
%
%   drv_box_mode <id>
%	<id>		status identifier (on or off)
%
%   drv_fraction_mode <id>
%	<id>		status identifier (on or off)
%
%   drv_proof_mode <id>
%	<id>		status identifier (on or off)
%
%   drv_labels_mode (<id 1>, <id 2>)
%	<id 1>		label-type identifier (ilb, plb or dlb)
%			  ilb	inference labels
%			  dlb	delimiter labels
%			  plb	phantom steps labels
%	<id 2>		status identifier (on or off)
%
%   drv_verbatimtex <str>
%	<str>		LaTeX material
%
%   drv_radial_mode <id>
%	<id>		status identifier (on or off)
%			  on
%			  off
%
%   drv_azimuth <float>
%	<float>		azimuth degree
%
%
% * Derivation tree pictures
% ==========================
%
%   drv_bbox <nat>
%	<nat>		sub-tree root index
%
%   drv_axis (<id>, <nat>)
%	<id>		reference type identifier (iln, jdg or dlm)
%			  iln	inference line axis
%			  jdg	judgment math-axis
%			  dlm	delimiter axis
%	<nat>		reference index
%
%   <path> drv_styled <id>
%	<path>		MetaPost path expression
%	<id>		path style identifier (0, 1, 2, 3, 4, 5 or 6)
%
%   drv_root (<nat>, <id>)
%	<nat>		root index
%	<id>		position identifier (t or b)
%			  t	top
%			  b	bottom
%


%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
%
% MetaPost messages formatting
%

% drv_format prevents messages from being automatically cut into lines every
% 79 characters: if possible, a word which would otherwise be cut is 'pushed'
% to the following line by inserting space characters before it.

vardef drv_format (expr str, fst_len, nxt_len, dbl_pcs)=
  % str: the message to be formatted
  % fst_len: first line length
  % nxt_len: following lines length
  % dbl_pcs (boolean): occurrences of the percent character must be doubled
  save str_len, sub_len, aux_len, chr_rnk, occ_num, aux_str, chr;
  numeric str_len, sub_len, aux_len, chr_rnk, occ_num;
  string aux_str, chr;
  str_len:=length str;
  sub_len:=0;
  chr_rnk:=0;
  occ_num:=0;
  aux_len:=0;
  aux_str:="";
  forever:
    exitif (chr_rnk=fst_len) or (chr_rnk=str_len);
    chr:=substring (chr_rnk, chr_rnk+1) of str;
    aux_str:=aux_str&chr;
    if chr=" ":
      sub_len:=chr_rnk+1;
      aux_len:=sub_len+occ_num;
    elseif (chr="%") and dbl_pcs:
      aux_str:=aux_str&"%";
      occ_num:=occ_num+1;
    fi
    chr_rnk:=chr_rnk+1;
  endfor
  if chr_rnk=fst_len:
    begingroup
      if sub_len=0:
        sub_len:=fst_len;
        aux_len:=sub_len+occ_num;
      fi
      substring (0, aux_len) of aux_str&
        for idx=sub_len+1 upto fst_len:
          " "&
        endfor
        drv_format (substring (sub_len, str_len) of str,
          nxt_len, nxt_len, dbl_pcs)
    endgroup
  else:
    aux_str
  fi
enddef;

boolean drv_inside_fig;
drv_inside_fig:=false;

vardef drv_context=
  "drv"&if drv_inside_fig: " (fig. "&decimal charcode&")"&fi ": "
enddef;

vardef drv_message expr str=
  message drv_format (drv_context&str, 79, 79, false);
enddef;

vardef drv_errhelp expr str=
  % Occurrences of the percent character must be doubled: errhelp makes single
  % single occurrences behave as newline characters (this is inherited from
  % MetaFont).
  errhelp drv_format (str, 79, 79, true);
enddef;

vardef drv_errmessage expr str=
  % errmessage inserts the 2-characters string  "! " before its argument.
  % Hence 77 as a first line length argument.
  errmessage drv_format (drv_context&str, 77, 79, false);
enddef;

drv_message "version "&decimal drv_version&".";


%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
%
% Delayed LaTeX processing
%

picture tex_pct[];
string delayed_tex_file;
delayed_tex_file:=jobname&"-delayed.mp";

%
% reading LaTeX picture definitions
%

boolean drv_nullpicture;
drv_nullpicture:=true;

string readfrom_str;
readfrom_str:=readfrom delayed_tex_file;
if readfrom_str<>EOF:
  closefrom delayed_tex_file;
  drv_message ("reading `"&delayed_tex_file&"' LateX picture definitions.");
  batchmode;
  scantokens ("input "&delayed_tex_file);
  errorstopmode;
  drv_message "done.";
  drv_nullpicture:=false;
fi

%
% copying LaTeX preamble
%

vardef drv_find_verbatimtex=
  save readfrom_str;
  string readfrom_str;
  forever:
    readfrom_str:=readfrom jobname;
    exitif (readfrom_str="verbatimtex%&latex")
        or (readfrom_str="verbatimtex %&latex")
        or (readfrom_str=EOF);
  endfor
  if readfrom_str="verbatimtex %&latex":
    drv_message "warning, "&ditto&"verbatimtex %&latex"&ditto&
      " is deprecated, you should use "&ditto&"verbatimtex%&latex"&ditto&
      " instead.";
  fi
  if readfrom_str=EOF:
    closefrom jobname;
    drv_errhelp ("`"&jobname&".mp' should contain "&
      ditto&"verbatimtex%&latex"&ditto&" on a single line.");
    drv_errmessage (ditto&"verbatimtex%&latex"&ditto&" is missing");
  fi
enddef;

vardef drv_find (expr search_str) (suffix accum_str)=
  save readfrom_str, readfrom_substr;
  string readfrom_str, readfrom_substr;
  accum_str:="";
  forever:
    readfrom_str:=readfrom jobname;
    readfrom_substr:=substring (0, length search_str) of readfrom_str;
    exitif (readfrom_substr=search_str) or (readfrom_str=EOF);
    accum_str:=accum_str&readfrom_str&char(10);
  endfor
  if readfrom_str=EOF:
    closefrom jobname;
    drv_errhelp ("`"&jobname&".mp' should contain a line starting with "&
      ditto&search_str&ditto&".");
    drv_errmessage (ditto&search_str&ditto&" is missing");
  fi
enddef;

string tex_preamble_str[];
% tex_preamble_str[0] from "verbatimtex%&latex" to "\begin{document}"
% tex_preamble_str[1] from "\begin{document}" to "etex;"

drv_message ("reading `"&jobname&".mp' LateX preamble.");
  drv_find_verbatimtex;
  drv_find ("\begin{document}", tex_preamble_str[0]);
  drv_find ("etex;", tex_preamble_str[1]);
  closefrom jobname;
  write
    "%"&char(10)&
    "% AUTOMATICALLY GENERATED BY DRV.MP - DO NOT MODIFY."&char(10)&
    "%"&char(10)&char(10)&
    "verbatimtex%&latex"&char(10)&
    tex_preamble_str[0]&
    "\begin{document}"&char(10)&
    tex_preamble_str[1]&
    "etex;"
  to delayed_tex_file;
drv_message "done.";

%
% writing LaTeX picture definitions
%

numeric tex_pct_rnk;
tex_pct_rnk:=0;

% Math style indices: 0, 1, 2, 3
string mth_sty_str[];
mth_sty_str[0]:="\displaystyle";
mth_sty_str[1]:="\textstyle";
mth_sty_str[2]:="\scriptstyle";
mth_sty_str[3]:="\scriptscriptstyle";

string drv_fontsize;

vardef drv_tex[] expr tex_str=
  % @: math style index
  % tex_str: math mode LaTeX code
  save def_str, pct;
  string def_str;
  picture pct;
  def_str:="btex{"&drv_fontsize&"$"&mth_sty_str[@]&"{}"&tex_str&"{}$}etex;";
  write "tex_pct["&(decimal tex_pct_rnk)&"]:="&def_str to delayed_tex_file;
  pct:=
    if known tex_pct[tex_pct_rnk]:
      tex_pct[tex_pct_rnk]
    else:
      nullpicture
    fi;
  tex_pct_rnk:=tex_pct_rnk+1;
  pct
enddef;

vardef drv_verbatimtex expr tex_str=
  write char(10)&
    "% drv_verbatimtex"&char(10)&char(10)&
    "verbatimtex"&char(10)&
    tex_str&char(10)&
    "etex;"
  to delayed_tex_file;
enddef;


%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
%
% MetaPost shorthands
%

vardef depth expr pct=
  ypart llcorner pct
enddef;

vardef height expr pct=
  ypart urcorner pct
enddef;

vardef width expr pct=
  xpart urcorner pct-xpart llcorner pct
enddef;


%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
%
% Font-specific parameters
%

%
% em[s]		width of an m (s: mathstyle index)
% ex[s]		height of an x
% axis_hg[s]	height of the mathematical axis
% num_bl_hg[s]	height of a numerator baseline w.r.t. the fraction bar axis
% den_bl_dp[s]	depth of a denominator baseline w.r.t. the fraction bar axis
% rul_thk[s]	default rule thickness
%

numeric em[], ex[], axis_hg[], num_bl_hg[], den_bl_dp[], rul_thk[];

%
% thn_sp[s]	thin space, usually 1em/6
% med_sp[s]	medium space, usually 2em/9
% thk_sp[s]	thick space, usually 5em/18
%

numeric thn_sp[], med_sp[], thk_sp[];

%
% pdt_hg[s]	height of a punctuation ldot
% pdt_wd[s]	width of a punctuation ldot
%

numeric pdt_hg[], pdt_wd[];

%
% tt_dgt[s][i]	typewriter typeface digits (i ranges from 0 to 9)
%

picture tt_dgt[][];

%
% min_clr[s]	minimal clearance between a numerator
%		or a denominator and the fraction bar
% prm_skp[s]	<nice explanation>
% jdg_skp[s]	<nice explanation>
% ilb_skp[s]	<nice explanation>
% plb_skp[s]	<nice explanation>
%

numeric min_clr[], prm_skp[], jdg_skp[], ilb_skp[], plb_skp[];

%vardef drv_fontdimen[] expr font=
%  save dim_pct;
%  picture dim_pct;
%  dim_pct:=drv_tex[0] ("\rule{\the\fontdimen"&(decimal @)&font&"}{0bp}");
%  width dim_pct
%enddef;

vardef drv_fontdimen[] expr font=
  save dim_pct, dim_str;
  picture dim_pct;
  string dim_str;
  dim_pct:=drv_tex[0] ("\mbox{\the\fontdimen"&(decimal @)&font&"}");
  dim_str:="0";
  for tok within dim_pct:
    dim_str:=dim_str&(textpart tok);
  endfor
  scantokens dim_str
enddef;

vardef drv_font_size expr size_str=
  save pdt_pct, sp_pct;
  picture pdt_pct, sp_pct;
  drv_fontsize:=size_str;
  write char(10)&"% font-specific parameters ("&drv_fontsize&")"&char(10)
    to delayed_tex_file;
  ex[0]:=drv_fontdimen[5] "\textfont2";
  ex[1]:=drv_fontdimen[5] "\textfont2";
  ex[2]:=drv_fontdimen[5] "\scriptfont2";
  ex[3]:=drv_fontdimen[5] "\scriptscriptfont2";
  em[0]:=drv_fontdimen[6] "\textfont2";
  em[1]:=drv_fontdimen[6] "\textfont2";
  em[2]:=drv_fontdimen[6] "\scriptfont2";
  em[3]:=drv_fontdimen[6] "\scriptscriptfont2";
  rul_thk[0]:=drv_fontdimen[8] "\textfont3";
  rul_thk[1]:=drv_fontdimen[8] "\textfont3";
  rul_thk[2]:=drv_fontdimen[8] "\scriptfont3";
  rul_thk[3]:=drv_fontdimen[8] "\scriptscriptfont3";
  axis_hg[0]:=drv_fontdimen[22] "\textfont2";
  axis_hg[1]:=drv_fontdimen[22] "\textfont2";
  axis_hg[2]:=drv_fontdimen[22] "\scriptfont2";
  axis_hg[3]:=drv_fontdimen[22] "\scriptscriptfont2";
  num_bl_hg[0]:=(drv_fontdimen[8] "\textfont2")-axis_hg[0];
  num_bl_hg[1]:=(drv_fontdimen[9] "\textfont2")-axis_hg[1];
  num_bl_hg[2]:=(drv_fontdimen[9] "\scriptfont2")-axis_hg[2];
  num_bl_hg[3]:=(drv_fontdimen[9] "\scriptscriptfont2")-axis_hg[3];
  den_bl_dp[0]:=-(drv_fontdimen[11] "\textfont2")-axis_hg[0];
  den_bl_dp[1]:=-(drv_fontdimen[12] "\textfont2")-axis_hg[1];
  den_bl_dp[2]:=-(drv_fontdimen[12] "\scriptfont2")-axis_hg[2];
  den_bl_dp[3]:=-(drv_fontdimen[12] "\scriptscriptfont2")-axis_hg[3];
  min_clr[0]:=3*rul_thk[0]; % The TEXbook,
  min_clr[1]:=1*rul_thk[1]; % Appendix G,
  min_clr[2]:=1*rul_thk[2]; % Rule 15d.
  min_clr[3]:=1*rul_thk[3]; %
  for mth_sty:=0 upto 3:
    sp_pct:=drv_tex[mth_sty] "\,"; % thinspace
    thn_sp[mth_sty]:=width sp_pct;
    sp_pct:=drv_tex[mth_sty] "\:"; % medspace
    med_sp[mth_sty]:=width sp_pct;
    sp_pct:=drv_tex[mth_sty] "\;"; % thickspace
    thk_sp[mth_sty]:=width sp_pct;
    pdt_pct:=drv_tex[mth_sty] "\ldotp";
    pdt_hg[mth_sty]:=height pdt_pct;
    pdt_wd[mth_sty]:=width pdt_pct;
    for dgt=0 upto 9:
      tt_dgt[mth_sty][dgt]:=drv_tex[mth_sty] "\texttt{"&(decimal dgt)&"}";
    endfor
    prm_skp[mth_sty]:=3*med_sp[mth_sty]; % arbitrary
    jdg_skp[mth_sty]:=thn_sp[mth_sty];   % arbitrary
    ilb_skp[mth_sty]:=thn_sp[mth_sty];   % arbitrary
    plb_skp[mth_sty]:=thk_sp[mth_sty];   % arbitrary
  endfor
enddef;


%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
%
% Math-related parameters & macros
%

%
% Math styles
% drv_sty		derivation trees
% jdg_sty[drv_sty]	judgments
% ilb_sty[drv_sty]	inference labels
% dlb_sty[drv_sty]	delimiter labels
% plb_sty[drv_sty]	phantom steps labels
%

numeric drv_sty, jdg_sty[], ilb_sty[], dlb_sty[], plb_sty[];

%
% Math-axis centered LaTeX pictures
%

vardef mth_tex[] expr tex_str=
  (drv_tex[@] tex_str) shifted (0, -axis_hg[@])
enddef;


%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
%
% drv-boxes
%

vardef drv_box text STR=
  for str=STR:
    expandafter picture scantokens str;
    expandafter pair scantokens str.l;
    expandafter pair scantokens str.c;
    expandafter pair scantokens str.r;
    expandafter numeric scantokens str.hg;
    expandafter numeric scantokens str.dp;
    drv_arc str;
  endfor
enddef;

vardef box_init @# (expr pct)=
  @#:=pct;
  @#.r-@#.l=(width pct, 0);
  @#.c=(@#.l+@#.r)/2;
  @#.hg:=height pct;
  @#.dp:=depth pct;
enddef;

vardef box_freeze @#=
  @#:=@# shifted @#.l;
enddef;


%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
%
% drv-arcs
%

vardef drv_arc text STR=
  for str=STR:
    expandafter numeric scantokens str.rad;
    expandafter numeric scantokens str.lng;
    expandafter numeric scantokens str.cng;
    expandafter numeric scantokens str.rng;
    expandafter pair scantokens str.org;
  endfor
enddef;

vardef arc_init @# (expr pct, ngl)=
  @#:=pct;
  @#.rng-@#.lng=ngl;
  @#.cng=(@#.lng+@#.rng)/2;
enddef;

vardef arc_freeze @#=
  @#:=@# rotated @#.lng shifted @#.org;
  @#.l:=(dir @#.lng) scaled @#.rad shifted @#.org;
  @#.c:=(dir @#.cng) scaled @#.rad shifted @#.org;
  @#.r:=(dir @#.rng) scaled @#.rad shifted @#.org;
enddef;


%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
%
% Polar coordinates, angles & text torsion
%

vardef rad_part expr ppt=
  xpart ppt
enddef;

vardef ngl_part expr ppt=
  ypart ppt
enddef;

vardef minrad (expr ppt_a, ppt_b)=
  min (rad_part ppt_a, rad_part ppt_b)
enddef;

% "tnum" (turning number) argument:
% -1: clockwise
%  1: counterclockwise

vardef lmost_ppt (expr ppt_a, ppt_b) expr tnum=
  if tnum*(ngl_part ppt_a)<tnum*(ngl_part ppt_b):
    ppt_a
  else:
    ppt_b
  fi
enddef;

vardef rmost_ppt (expr ppt_a, ppt_b) expr tnum=
  if tnum*(ngl_part ppt_a)>tnum*(ngl_part ppt_b):
    ppt_a
  else:
    ppt_b
  fi
enddef;

vardef arc_angle (expr rad, arc_len) expr tnum=
  if rad>0:
    save pth;
    path pth;
    pth:=fullcircle scaled (2*rad);
    tnum*(angle point (arctime arc_len of pth) of pth)
  else:
    0
  fi
enddef;

vardef circ_path (expr rad, ngl) expr tnum=
  save pth;
  path pth;
  pth:=if tnum=-1: reverse fi fullcircle scaled (2*rad);
  subpath (0, directiontime (dir (ngl+tnum*90)) of pth) of pth
enddef;

vardef text_arc (expr pct, rad) expr tnum=
  save arc_pct, tok_str, tok_trn, tok_ngl, hlf_wd, chr_pct;
  picture arc_pct, chr_pct;
  numeric tok_ngl, hlf_wd;
  string tok_str;
  arc_pct:=nullpicture;
  for tok within pct:
    if textual tok:
      transform tok_trn;
      tok_str:=textpart tok;
      (0, 0) transformed tok_trn=(0, 0);
      (0, 1) transformed tok_trn=(xypart tok, yypart tok);
      (1, 0) transformed tok_trn=(xxpart tok, yxpart tok);
      tok_ngl:=arc_angle (rad, xpart tok) tnum;
      for chr_rnk=0 upto (length tok_str-1):
        chr_pct:=
          substring (chr_rnk, chr_rnk+1) of tok_str infont (fontpart tok)
          transformed tok_trn;
        hlf_wd:=(width chr_pct)/2;
        tok_ngl:=tok_ngl+arc_angle (rad, hlf_wd) tnum;
        addto arc_pct also chr_pct
          shifted (-hlf_wd, 0)
          rotated (tok_ngl+tnum*90)
          shifted (dir tok_ngl scaled (rad-tnum*(ypart tok)));
        tok_ngl:=tok_ngl+arc_angle (rad, hlf_wd) tnum;
      endfor
    elseif stroked tok:
      path pth;
      pair src, tgt;
      numeric src_ngl, tgt_ngl;
      pth:=pathpart tok;
      src:=point 0 of pth;
      tgt:=point length pth of pth;
      src_ngl:=arc_angle (rad, xpart src) tnum;
      tgt_ngl:=arc_angle (rad, xpart tgt) tnum;
      interim linecap:=butt;
      addto arc_pct doublepath
        if xpart src<>xpart tgt: % horizontal rule
          (circ_path (rad-tnum*(ypart src), tgt_ngl-src_ngl) tnum)
          rotated src_ngl
        else:                    % vertical rule
          pth shifted -src rotated (src_ngl+tnum*90)
          shifted (dir src_ngl scaled (rad-tnum*(ypart src)))
        fi withpen penpart tok;
    fi
  endfor
  arc_pct
enddef;


%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
%
% beginfig & endfig
%

%
% drv_beginfig: figure initialization
%

pen drv_pen;

vardef drv_beginfig=
  %
  % Judgments
  %
  % jdg[i]	judgment drv-box
  % sbj_num[i]	number of sub-judgments
  % sbj[i][j]	sub-judgment drv-box (j ranges from 0 to sbj_num[i]-1)
  %
  drv_box "jdg[]";
  numeric sbj_num[];
  drv_box "sbj[][]";
  %
  % Inferences
  %
  % prm_num[i]	number of premises
  % prm[i][j]	premise index (j ranges from 0 to prm_num[i]-1)
  % ccl[i]	conclusion index
  % jct_sty[i]	junction style
  % alg_sty[i]	alignment style
  % iln_sty[i]	inference line style
  % l_prm[i]	leftmost `graphical' premise index
  % r_prm[i]	rightmost `graphical' premise index
  % bot_jdg[i]	boolean
  %
  numeric prm_num[], prm[][], ccl[];
  numeric jct_sty[];
  string alg_sty[];
  numeric iln_sty[];
  numeric l_prm[], r_prm[];
  boolean bot_jdg[];
  %
  % nfr_min_x[i]	inference minimal x
  % nfr_lmost_ppt[i]	inference leftmost polar point
  % l_dlb[i]		left delimiter label drv-box
  % l_dlm[i]		left delimiter drv-box
  % l_ilb[i]		left label drv-box
  % iln[i]		inference line drv-box
  % r_ilb[i]		right label drv-box
  % r_dlm[i]		right delimiter drv-box
  % r_dlb[i]		right delimiter label drv-box
  % nfr_max_x[i]	inference maximal x
  % nfr_rmost_ppt[i]	inference rightmost polar point
  %
  numeric nfr_min_x[];
  pair nfr_lmost_ppt[];
  drv_box "l_dlb[]", "l_dlm[]", "l_ilb[]";
  drv_box "iln[]";
  drv_box "r_ilb[]", "r_dlm[]", "r_dlb[]";
  numeric nfr_max_x[];
  pair nfr_rmost_ppt[];
  %
  % Sub-trees
  %
  % sub_min_x[i]	sub-tree minimal x
  % sub_lmost_ppt[i]	sub-tree leftmost polar point
  % sub_max_x[i]	sub-tree maximal x
  % sub_rmost_ppt[i]	sub-tree rightmost polar point
  % sub_min_y[i]	sub-tree minimal y
  % sub_min_rad[i]	sub-tree minimal radius
  % sub_max_y[i]	sub-tree maximal y
  % sub_max_rad[i]	sub-tree maximal radius
  % boxed[i]		boolean
  %
  numeric sub_min_x[], sub_max_x[], sub_min_y[], sub_max_y[];
  pair sub_lmost_ppt[], sub_rmost_ppt[];
  numeric sub_min_rad[], sub_max_rad[];
  boolean boxed[];
  %
  % Pen initialization
  %
  drv_pen:=pencircle scaled rul_thk[drv_sty];
  %
  % num_hg	height of a numerator axis w.r.t. the fraction bar axis
  % den_dp	depth of a denominator axis w.r.t. the fraction bar axis
  % iln_hg[s]	height of a style s inference line
  % iln_dp[s]	depth of a style s inference line
  %
  numeric num_hg, den_dp, iln_hg[], iln_dp[];
  num_hg:=num_bl_hg[drv_sty]+axis_hg[jdg_sty[drv_sty]];
  den_dp:=den_bl_dp[drv_sty]+axis_hg[jdg_sty[drv_sty]];
  picture iln_pct;
  for sty=0 upto 6:
    iln_pct:=((0, 0)--(10, 0)) drv_styled sty;
    iln_hg[sty]:=height iln_pct;
    iln_dp[sty]:=depth iln_pct;
  endfor
  %
  % Derivation trees
  %
  % root_num	number of roots
  % root[i]	root index (i ranges from 0 to root_num-1)
  % drv_checked	boolean
  % drv_frozen	boolean
  %
  numeric root_num, root[];
  boolean drv_checked, drv_frozen;
  root_num:=0;
  drv_checked:=false;
  drv_frozen:=false;
  %
  % Phantom steps
  %
  % phm_idx	phantom inferences index
  % src[i]	base phantom judgment index (in case of an origin judgment)
  % tgt[i]	origin judgment index (in case of a base phantom judgment)
  % phm_sty[i]	phantom steps style
  % l_plb[i]	left phantom steps label drv-box (in case of a base
  %		phantom judgment)
  % phm[i]	phantom steps drv-box (in case of a base phantom
  %		judgment)
  % r_plb[i]	right phantom steps label drv-box (in case of a base
  %		phantom judgment)
  %
  numeric phm_idx, src[], tgt[], phm_sty[];
  phm_idx:=0;
  drv_box "l_plb[]", "phm[]", "r_plb[]";
  %
  % Proof pictures
  %
  % jdg_prf[i]		judgment index drv-box
  % sbj_prf[i][j]	sub-judgment index drv-box (j ranges from 0 to
  %			sbj_num[i]-1)
  %
  drv_box "jdg_prf[]", "sbj_prf[][]";
  %
  % Info
  %
  write char(10)&"% fig. "&(decimal charcode)&char(10) to delayed_tex_file;
  drv_inside_fig:=true; % context: inside a figure
enddef;

extra_beginfig:=extra_beginfig&"drv_beginfig;";

%
% drv_endfig: proof-file generation
%

string proof_file;
proof_file:=jobname&"-proof.tex";

% TODO: taking outputtemplate into account.
vardef output_file[]=
  jobname&"."&(decimal @)
enddef;

string buf_str;
buf_str:=
  "%"&char(10)&
  "% AUTOMATICALLY GENERATED BY DRV.MP."&char(10)&
  "%"&char(10)&char(10)&
  tex_preamble_str[0]&
  "\usepackage{graphicx}"&char(10)&
  "\makeatletter"&char(10)&
  "\def\Gin@def@bp#1\relax#2#3{\gdef#2{#3}}"&char(10)&
  "\newsavebox{\graphicsbox}"&char(10)&
  "\newcommand*{\drv}[1]{%"&char(10)&
  "\sbox{\graphicsbox}{\includegraphics{#1}}%"&char(10)&
  "\raisebox{\Gin@lly bp}%"&char(10)&
  "{\usebox{\graphicsbox}}}"&char(10)&
  "\makeatother"&char(10)&char(10)&
  "\newcount\h"&char(10)&
  "\newcount\m"&char(10)&
  "\h=\time"&char(10)&
  "\divide\h 60"&char(10)&
  "\m=-\h"&char(10)&
  "\multiply\m 60"&char(10)&
  "\advance\m\time"&char(10)&
  "\def\hm{\number\h:\ifnum\m<10{}0\fi\number\m}"&char(10)&char(10)&
  "\newcommand{\mathaxis}{\frac{\quad}{}}"&char(10)&char(10)&
  "\begin{document}"&char(10)&
  tex_preamble_str[1]&
  "\noindent\today\ at \hm\medskip"&char(10)&char(10)&"\noindent";

vardef drv_endfig=
  drv_inside_fig:=false;   % context: outside a figure
  buf_str:=buf_str&char(10)&
  "\texttt{"&output_file[charcode]&"}"&char(10)&
  "  (\verb+"&drv_fontsize&"+, \verb+"&(mth_sty_str[drv_sty])&"+)"&char(10)&
  "    {"&drv_fontsize&char(10)&
  "      \["&(mth_sty_str[drv_sty])&char(10)&
  "        \mathaxis\drv{"&output_file[charcode]&"}\mathaxis"&char(10)&
  "      \]}\\";
  write EOF to proof_file; % erases the previous content
  write buf_str&char(10)&"\end{document}" to proof_file;
  write EOF to proof_file;
  if drv_nullpicture:
    draw btex{\tt drv}: run {\tt mpost} again.etex withcolor (1, 0, 0);
  fi
enddef;

extra_endfig:="drv_endfig;"&extra_endfig;


%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
%
% Judgment declarations
%

vardef jgm[] text SUB=
  % @: judgment index
  % SUB: list of `sub-judgments' (pictures or strings)
  if @<0:
    drv_errhelp "An judgment index can not be negative.";
    drv_errmessage (decimal @)&" is negative";
  elseif known jdg[@]:
    drv_errhelp "An index can be used only once to declare a judgment.";
    drv_errmessage (decimal @)&" has been used already as a judgment index";
  else:
    save jdg_pct, sbj_pct, jdg_wd, sbj_rnk;
    picture jdg_pct, sbj_pct;
    numeric jdg_wd, sbj_rnk;
    jdg_pct:=nullpicture;
    jdg_wd:=0;
    sbj_rnk:=0;
    for sub=SUB:
      sbj_pct:=mth_tex[jdg_sty[drv_sty]] sub;
      box_init sbj[@][sbj_rnk] (sbj_pct);
      if sbj_rnk>0:				% non mandatory test
        sbj[@][sbj_rnk-1].r=sbj[@][sbj_rnk].l;	% irrelevant if rnk=0
      fi
      addto jdg_pct also sbj_pct shifted (jdg_wd, 0);
      jdg_wd:=jdg_wd+width sbj_pct;
      sbj_rnk:=sbj_rnk+1;
    endfor
    sbj_num[@]:=sbj_rnk;
    box_init jdg[@] (jdg_pct);
    if sbj_num[@]>0:				% non mandatory test
      jdg[@].l=sbj[@][0].l;			% irrelevant if sbj_num=0
    fi
  fi
enddef;


%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
%
% Inference declarations
%

%
% 1. Global parameters
%

numeric drv_jct_sty;	% default junction style
string  drv_alg_sty;	% default junction style
numeric drv_iln_sty;	% default inference line path-style
numeric drv_phm_sty;	% default phantom steps path-style

boolean drv_ilb_on;	% inference labels on
boolean drv_dlb_on;	% delimiter labels on
boolean drv_plb_on;	% phantom steps labels on

%
% 2. Macros
%

vardef check_junction_style (suffix sty_sfx) (expr default)=
  save sty_str;
  string sty_str;
  sty_str:=str sty_sfx;
  if (sty_str="0")
  or (sty_str="1")
  or (sty_str="2")
  or (sty_str="3"):
    sty_sfx
  elseif (sty_str="_"):
    default
  else:
    begingroup
      drv_errhelp "Valid identifiers are"&
        " 0 (fully-interlacing),"&
        " 1 (semi-interlacing),"&
        " 2 (non-interlacing),"&
        " 3 (user specified) and"&
        " _ (default).";
      drv_errmessage sty_str&" is not a valid junction style identifier";
      default
    endgroup
  fi
enddef;

vardef check_alignment_style (suffix sty_sfx) (expr default)=
  save sty_str;
  string sty_str;
  sty_str:=str sty_sfx;
  if (sty_str="l")
  or (sty_str="c")
  or (sty_str="r")
  or (sty_str="u"):
    sty_str
  elseif (sty_str="_"):
    default
  else:
    begingroup
      drv_errhelp "Valid identifiers are"&
        " l (none),"&
        " c (simple),"&
        " r (double),"&
        " u (dotted) and"&
        " _ (default).";
      drv_errmessage sty_str&" is not a valid alignment style identifier";
      default
    endgroup
  fi
enddef;

vardef check_path_style (suffix sty_sfx) (expr default)=
  save sty_str;
  string sty_str;
  sty_str:=str sty_sfx;
  if (sty_str="0")
  or (sty_str="1")
  or (sty_str="2")
  or (sty_str="3")
  or (sty_str="4")
  or (sty_str="5")
  or (sty_str="6"):
    sty_sfx
  elseif (sty_str="_"):
    default
  else:
    begingroup
      drv_errhelp "Valid identifiers are"&
        " 0 (none),"&
        " 1 (simple),"&
        " 2 (double),"&
        " 3 (dotted),"&
        " 4 (dashed),"&
        " 5 (waved),"&
        " 6 (TeX-dotted) and"&
        " _ (default).";
      drv_errmessage sty_str&" is not a valid path style identifier";
      default
    endgroup
  fi
enddef;

vardef opt_init[] @# expr str=
  if str<>"":
    box_init @# (mth_tex[@] str);
  fi
enddef;

vardef NFR[] (text PRM) (expr lilb, rilb, ldlb, rdlb)
  (suffix j_sty, a_sty, i_sty)=
  %
  % @: inference index
  %
  if known prm_num[@]:
    drv_errhelp "An index can be used only once to declare an inference.";
    drv_errmessage (decimal @)&" has been used already as an inference index";
  else:
    %
    % PRM: list of premise indices
    %
    save prm_rnk, root_rnk;
    numeric prm_rnk, root_rnk;
    prm_rnk:=0;
    for prm_idx=PRM:
      if prm_idx=@:
        drv_errhelp "An inference index can not be used"&
          " as one of its own premise indices.";
        drv_errmessage "the inference index "&(decimal prm_idx)&
          " is used as one of its own premise indices";
      elseif known ccl[prm_idx]:
        drv_errhelp "An index can be used only once as a premise index.";
        drv_errmessage (decimal prm_idx)&" has been used already as a"&
          " premise index for inference declaration "&(decimal ccl[prm_idx]);
      else:
        if known prm_num[prm_idx]:
          %
          % roots list update
          %
          root_rnk:=0;
          forever:
            exitif root[root_rnk]=prm_idx;
            root_rnk:=root_rnk+1;
          endfor
          forever:
            exitif root_rnk=root_num-1;
            root[root_rnk]:=root[root_rnk+1];
            root_rnk:=root_rnk+1;
          endfor
          root_num:=root_num-1;
        fi
        ccl[prm_idx]:=@;
        prm[@][prm_rnk]:=prm_idx;
        prm_rnk:=prm_rnk+1;
      fi
    endfor
    prm_num[@]:=prm_rnk;
    if known ccl[@]:
      %
      % cycle detection
      %
      save ccl_idx, ccl_str;
      numeric ccl_idx;
      string ccl_str;
      ccl_idx:=@;
      ccl_str:=decimal ccl_idx;
      forever:
        ccl_idx:=ccl[ccl_idx];
        if ccl_idx>=0:
          ccl_str:=(decimal ccl_idx)&", "&ccl_str;
        fi
        exitif (unknown ccl[ccl_idx]) or (ccl_idx=@);
      endfor
      if ccl_idx=@:
        drv_errhelp  "Inferences declarations can not be cyclic.";
        drv_errmessage "inference declaration "&(decimal @)&" creates a"&
          " cycle of inferences (indices "&ccl_str&" from conclusions to"&
          " premises)";
      fi
    else:
      root[root_num]:=@;
      root_num:=root_num+1;
    fi
    %
    % lilb, rilb: inference labels
    %
    if drv_ilb_on:
      opt_init[ilb_sty[drv_sty]] l_ilb[@] lilb;
      opt_init[ilb_sty[drv_sty]] r_ilb[@] rilb;
    fi
    %
    % ldlb, rdlb: delimiter labels
    %
    if drv_dlb_on:
      opt_init[dlb_sty[drv_sty]] l_dlb[@] ldlb;
      opt_init[dlb_sty[drv_sty]] r_dlb[@] rdlb;
    else:
      if ldlb<>"":
        box_init l_dlb[@] (mth_tex[dlb_sty[drv_sty]] "{}");
      fi
      if rdlb<>"":
        box_init r_dlb[@] (mth_tex[dlb_sty[drv_sty]] "{}");
      fi
    fi
    %
    % j_sty, a_sty and i_sty: junction, alignment and inference styles
    %
    jct_sty[@]:=check_junction_style (j_sty, drv_jct_sty);
    alg_sty[@]:=check_alignment_style (a_sty, drv_alg_sty);
    iln_sty[@]:=check_path_style (i_sty, drv_iln_sty);
  fi
enddef;

vardef DCL[] (text PRM) (expr lilb, rilb, ldlb, rdlb)
  (suffix j_sty, a_sty, i_sty) text SUB=
    NFR[@] (PRM) (lilb, rilb, ldlb, rdlb, j_sty, a_sty, i_sty);
    jgm[@] SUB;
enddef;

vardef MVD[] (expr inf_num, lplb, rplb) (suffix a_sty, p_sty)=
  if inf_num<1:
    drv_errhelp "The minimal value is 1.";
    drv_errmessage (decimal inf_num)&" is not a valid number of inference"&
      " steps";
  else:
    save prm_idx, pth_sty, phm_jdg;
    numeric prm_idx, pth_sty;
    picture phm_jdg;
    pth_sty:=check_path_style (p_sty, drv_phm_sty);
    phm_jdg:=nullpicture;
    setbounds phm_jdg to (0, 0)--(iln_hg[pth_sty]-iln_dp[pth_sty], 0)--cycle;
    prm_idx:=@;
    for i=1 upto inf_num:
      phm_idx:=phm_idx-1;
      box_init jdg[phm_idx] (phm_jdg);
      sbj_num[phm_idx]:=0;
      NFR[phm_idx] (prm_idx) ("", "", "", "", 0, a_sty, 0);
      prm_idx:=phm_idx;
    endfor
    src[@]:=phm_idx;
    tgt[phm_idx]:=@;
    phm_sty[phm_idx]:=pth_sty;
    %
    % lplb, rplb: phantom steps labels
    %
    if drv_plb_on:
      opt_init[plb_sty[drv_sty]] l_plb[@] lplb;
      opt_init[plb_sty[drv_sty]] r_plb[@] rplb;
    fi
    phm_idx
  fi
enddef;

vardef bxd[]=
  boxed[@]:=true;
  @
enddef;

%
% Optional labels & shorthands
%

boolean drv_left_ilb;	% inference labels on the left
boolean drv_left_dlb;	% delimiter labels (hence delimiters) on the left
boolean drv_left_plb;	% phantom steps labels on the left

vardef opt_lbls @# (text LBL) expr left_lbls=
  save lbl_num, fst_lbl, snd_lbl;
  numeric lbl_num;
  lbl_num:=0;
  for lbl=LBL:
    if lbl_num=0:
      string fst_lbl;
      fst_lbl:=lbl;
    elseif lbl_num=1:
      string snd_lbl;
      snd_lbl:=lbl;
    else:
      drv_errhelp "At most two labels can be specified:"&
        " a left one and a right one.";
      drv_errmessage "more than two labels have been specified";
    fi
    lbl_num:=lbl_num+1;
  endfor
  string @#.l;
  string @#.r;
  if lbl_num=0:
    @#.l:="";
    @#.r:="";
  elseif lbl_num=1:
    if left_lbls:
      @#.l:=fst_lbl;
      @#.r:="";
    else:
      @#.l:="";
      @#.r:=fst_lbl;
    fi
  else:
    @#.l:=fst_lbl;
    @#.r:=snd_lbl;
  fi
enddef;

vardef NFR_opt[] (text PRM) (text ILB) (text DLB)
  (suffix j_sty, a_sty, i_sty)=
    opt_lbls ilb (ILB) drv_left_ilb;
    opt_lbls dlb (DLB) drv_left_dlb;
    NFR[@] (PRM) (ilb.l, ilb.r, dlb.l, dlb.r, j_sty, a_sty, i_sty);
enddef;

vardef DCL_opt[] (text PRM) (text ILB) (text DLB)
  (suffix j_sty, a_sty, i_sty) text SUB=
    NFR_opt[@] (PRM) (ILB) (DLB) (j_sty, a_sty, i_sty);
    jgm[@] SUB;
enddef;

vardef MVD_opt[] (expr inf_num) (text PLB) (suffix a_sty, p_sty)=
  opt_lbls plb (PLB) drv_left_plb;
  MVD[@] (inf_num, plb.l, plb.r, a_sty, p_sty)
enddef;

% Nfr, Dcl & Mvd

vardef Nfr[] (text PRM) (expr ilb, ldlb, rdlb) (suffix i_sty)=
  NFR_opt[@] (PRM) (ilb) (ldlb, rdlb) (_, _, i_sty);
enddef;

vardef Dcl[] (text PRM) (expr ilb, ldlb, rdlb) (suffix i_sty) text SUB=
  Nfr[@] (PRM) (ilb, ldlb, rdlb, i_sty);
  jgm[@] SUB;
enddef;

vardef Mvd[] (expr inf_num, lplb, rplb) (suffix p_sty)=
  MVD[@] (inf_num, lplb, rplb, _, p_sty)
enddef;

% nfr, dcl & mvd

vardef nfr[] (text PRM) (expr ilb) (suffix i_sty)=
  NFR_opt[@] (PRM) (ilb) () (_, _, i_sty);
enddef;

vardef dcl[] (text PRM) (expr ilb) (suffix i_sty) text SUB=
  nfr[@] (PRM) (ilb, i_sty);
  jgm[@] SUB;
enddef;

vardef mvd[] (expr inf_num) (suffix p_sty)=
  MVD_opt[@] (inf_num) () (_, p_sty)
enddef;


%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
%
% Pictured paths
%

vardef dotted_aux (expr pth, dot_wd, dots_dist)=
  save pth_len, pct;
  numeric pth_len;
  picture pct;
  pth_len:=arclength pth;
  pct:=nullpicture;
  if dots_dist>0:
    stp_num:=round ((pth_len-dot_wd)/dots_dist);
    if stp_num>0:
      stp_len:=(pth_len-dot_wd)/stp_num;
      addto pct doublepath pth dashed dashpattern (on 0 off stp_len)
        shifted (dot_wd/2, 0) withpen pencircle scaled dot_wd;
    fi
  fi
  pct
enddef;

primarydef pth dotted wd_dist=
  dotted_aux(pth, xpart wd_dist, ypart wd_dist)
enddef;

vardef expanded_aux (expr pth, scl, dir, stp_len)=
  save pth_len, aux_len;
  numeric pth_len, aux_len;
  pth_len:=arclength pth;
  if (stp_len>0) and (pth_len>stp_len):
    aux_len:=pth_len/(pth_len div stp_len);
    point arctime 0 of pth of pth shifted
      (unitvector direction arctime 0 of pth of pth
        rotated dir scaled scl)..
          {direction arctime 0 of pth of pth}
    for i=aux_len step aux_len until pth_len-aux_len:
      point arctime i of pth of pth shifted
        (unitvector direction arctime i of pth of pth
          rotated dir scaled scl)
            {direction arctime i of pth of pth}..
    endfor
    point arctime pth_len of pth of pth shifted
      (unitvector direction arctime pth_len of pth of pth
        rotated dir scaled scl)
          {direction arctime pth_len of pth of pth}
  else:
    pth
  fi
enddef;

primarydef pth expanded scl_dir_len=
  expanded_aux (pth,
    redpart scl_dir_len, greenpart scl_dir_len, bluepart scl_dir_len)
enddef;

vardef waved_aux (expr pth, amp)=
  save pth_len, mid;
  numeric pth_len, mid;
  pth_len:=arclength pth;
  if (amp>0) and (pth_len>2(1+sqrt 5)*amp):
    mid:=pth_len/(2(pth_len div (2(1+sqrt 5)*amp)));
    point arctime 0 of pth of pth shifted
      (unitvector direction arctime 0 of pth of pth
        rotated -90 scaled amp)
          {direction arctime 0 of pth of pth}
    for i=mid step 2mid until pth_len:
    ..point arctime i of pth of pth shifted
        (unitvector direction arctime i of pth of pth
          rotated 90 scaled amp)
            {direction arctime i of pth of pth}
    ..point arctime i+mid of pth of pth shifted
        (unitvector direction arctime i+mid of pth of pth
          rotated -90 scaled amp)
            {direction arctime i+mid of pth of pth}
    endfor
  else:
    pth
  fi
enddef;

primarydef pth waved amp=
  waved_aux(pth, amp)
enddef;

vardef drv_styled_aux[] expr pth=
  save sty_idx, pth_len, pct;
  numeric sty_idx, pth_len;
  picture pct;
  sty_idx:=check_path_style (@, 1);
  pth_len:=arclength pth;
  pct:=nullpicture;
  if sty_idx=1:
    interim linecap:=butt;
    addto pct doublepath pth withpen drv_pen;
  elseif sty_idx=2:
    interim linecap:=butt;
    addto pct doublepath pth
      expanded (1.25rul_thk[drv_sty],  90, rul_thk[drv_sty])
      withpen drv_pen;
    addto pct doublepath pth
      expanded (1.25rul_thk[drv_sty], -90, rul_thk[drv_sty])
      withpen drv_pen;
  elseif sty_idx=3:
    addto pct also pth dotted (rul_thk[drv_sty], 2rul_thk[drv_sty]);
  elseif sty_idx=4:
    if rul_thk[drv_sty]>0:
      interim linecap:=butt;
      save dsh_num, dsh_len;
      numeric dsh_num, dsh_len;
      dsh_num:=round(pth_len/(3rul_thk[drv_sty]));
      dsh_len:=
        if odd dsh_num:
          pth_len/dsh_num
        else:
          pth_len/(dsh_num+1)
        fi;
      addto pct doublepath pth dashed dashpattern(on dsh_len off dsh_len)
        withpen drv_pen;
    fi
  elseif sty_idx=5:
    interim linecap:=butt;
    addto pct doublepath pth
      waved 1.25rul_thk[drv_sty] withpen drv_pen;
  elseif (sty_idx=6) and (pth_len>0):
    addto pct also pth dotted (pdt_hg[drv_sty], pdt_wd[drv_sty]);
  fi
  pct
enddef;

primarydef pth drv_styled sty=
  drv_styled_aux[sty] pth
enddef;


%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
%
% Delimiters
%

%
% 1. Global parameters
%

string drv_ldlm_str; % left delimiter LaTeX code
string drv_rdlm_str; % right delimiter LaTeX code

%
% 2. Macros
%

vardef min_y[]=
  if bot_jdg[@]:
    if known ccl[@]:
      ypart jdg[@].c-num_hg+iln_hg[(iln_sty[ccl[@]])]
        +min_clr_scl*min_clr[drv_sty]/2
    else:
      sub_min_y[@]-min_clr_scl*min_clr[drv_sty]
    fi
  else:
    sub_min_y[@]-min_clr_scl*min_clr[drv_sty]
  fi
enddef;

vardef max_y[]=
  if bot_jdg[@]:
    sub_max_y[@]+min_clr_scl*min_clr[drv_sty]
  else:
    if known ccl[@]:
      ypart jdg[@].c-den_dp+iln_dp[(iln_sty[ccl[@]])]
        -min_clr_scl*min_clr[drv_sty]/2
    else:
      sub_max_y[@]+min_clr_scl*min_clr[drv_sty]
    fi
  fi
enddef;

vardef min_rad[]=
  if known ccl[@]:
    if bot_jdg[@]:
      jdg[@].rad-num_hg+iln_hg[(iln_sty[ccl[@]])]
    else:
      jdg[@].rad+den_dp-iln_dp[(iln_sty[ccl[@]])]
    fi+min_clr_scl*min_clr[drv_sty]/2
  else:
    sub_min_rad[@]-min_clr_scl*min_clr[drv_sty]
  fi
enddef;

vardef max_rad[]=
  sub_max_rad[@]+min_clr_scl*min_clr[drv_sty]
enddef;

vardef delim @# expr dlm_len=
  save rule_str, dlm_str, dlm_pct, dlm_dp;
  string rule_str, dlm_str;
  picture dlm_pct;
  numeric dlm_dp;
  rule_str:="\rule{0bp}{"&(decimal(dlm_len/2+axis_hg[drv_sty]))&"bp}";
  dlm_str:=
    if str @#="l":
      "\left"&drv_ldlm_str&rule_str&"\right."
    else:
      "\left."&rule_str&"\right"&drv_rdlm_str
    fi;
  dlm_pct:=mth_tex[drv_sty] dlm_str;
  dlm_dp:=depth dlm_pct;
  if dlm_dp=0:
    nullpicture
  else:
    begingroup
      setbounds dlm_pct to
        (xpart llcorner dlm_pct,  dlm_dp)
      --(xpart ulcorner dlm_pct, -dlm_dp)
      --(xpart urcorner dlm_pct, -dlm_dp)
      --(xpart lrcorner dlm_pct,  dlm_dp)
      --cycle;
      dlm_pct yscaled (dlm_len/(2*height dlm_pct))
    endgroup
  fi
enddef;


%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
%
% Checking, building, freezing (very inefficient, to be improved)
%

%
% 1. Global parameters
%

numeric min_clr_scl;		%
numeric prm_skp_scl;		%
numeric jdg_skp_scl;		%
numeric ilb_skp_scl;		%
numeric plb_skp_scl;		%

boolean drv_bot_roots;		%
boolean drv_boxmode_on;		%
boolean drv_fractionmode_on;	%
string  drv_axis_ref;		%

boolean drv_radialmode_on;	%
numeric crv_scl;		%
numeric azimuth_ngl;		%

%
% 2. Macros
%

%
% Checking
%

vardef fraction_inference[]=
      (prm_num[@]=0)
  and (iln_sty[@]=0)
  and (unknown l_ilb[@])
  and (unknown r_ilb[@])
  and drv_fractionmode_on
enddef;

vardef drv_bot_check[]=
  if unknown jdg[@]:
    drv_errhelp "An index must be used to declare both a judgment and an"&
      " inference.";
    drv_errmessage (decimal @)&" has been used as an inference index but not"&
      " as a judgment index";
  elseif unknown prm_num[@]:
    drv_errhelp "An index must be used to declare both a judgment and an"&
      " inference.";
    drv_errmessage (decimal @)&" has been used as a premise index but not"&
      " as an inference index";
  else:
    save i_sty, prm_idx;
    numeric i_sty, prm_idx;
    i_sty:=iln_sty[@];
    bot_jdg[@]:=true;
    for prm_rnk=0 upto prm_num[@]-1:
      prm_idx:=prm[@][prm_rnk];
      drv_bot_check[prm_idx];
      %
      % numerators and denominators clearances
      % The TEXbook, Appendix G, Rule 15d.
      %
      num_hg:=max (num_hg,
        iln_hg[i_sty]+min_clr_scl*min_clr[drv_sty]-jdg[prm_idx].dp);
    endfor
    if not fraction_inference[@]:
      den_dp:=min (den_dp,
        iln_dp[i_sty]-min_clr_scl*min_clr[drv_sty]-jdg[@].hg);
    fi
    if unknown boxed[@]:
      boxed[@]:=drv_boxmode_on;
    fi
  fi
enddef;

vardef drv_top_check[]=
  if unknown jdg[@]:
    drv_errhelp "An index must be used to declare both a judgment and an"&
      " inference.";
    drv_errmessage (decimal @)&" has been used as an inference index but not"&
      " as a judgment index";
  elseif unknown prm_num[@]:
    drv_errhelp "An index must be used to declare both a judgment and an"&
      " inference.";
    drv_errmessage (decimal @)&" has been used as a premise index but not"&
      " as an inference index";
  else:
    save i_sty, prm_idx;
    numeric i_sty, prm_idx;
    i_sty:=iln_sty[@];
    bot_jdg[@]:=false;
    for prm_rnk=0 upto prm_num[@]-1:
      prm_idx:=prm[@][prm_rnk];
      drv_top_check[prm_idx];
      %
      % numerators and denominators clearances
      % The TEXbook, Appendix G, Rule 15d.
      %
      den_dp:=min (den_dp,
        iln_dp[i_sty]-min_clr_scl*min_clr[drv_sty]-jdg[prm_idx].hg);
    endfor
    if not fraction_inference[@]:
      num_hg:=max (num_hg,
        iln_hg[i_sty]+min_clr_scl*min_clr[drv_sty]-jdg[@].dp);
    fi
    if unknown boxed[@]:
      boxed[@]:=drv_boxmode_on;
    fi
  fi
enddef;

vardef drv_root (expr idx) (suffix pos_sfx)=
  save root_idx;
  numeric root_idx;
  root_idx:=idx;
  forever:
    exitif unknown ccl[root_idx];
    root_idx:=ccl[root_idx];
  endfor
  if idx<>root_idx:
    drv_message "warning, "&(decimal idx)&" is not a root index"&
      " (the actual root index is "&(decimal root_idx)&").";
  fi
  bot_jdg[root_idx]:=check_position_bot (pos_sfx) (drv_bot_roots);
enddef;

vardef drv_check=
  if root_num=0:
    drv_errhelp "Well ...";
    drv_errmessage "no inference has been declared";
  else:
    save root_idx, root_str;
    numeric root_idx;
    string root_str;
    for root_rnk=0 upto root_num-1:
      root_idx:=root[root_rnk];
      if unknown bot_jdg[root_idx]:
        bot_jdg[root_idx]:=drv_bot_roots;
      fi
      if bot_jdg[root_idx]:
        drv_bot_check[root_idx];
      else:
        drv_top_check[root_idx];
      fi
      root_str:=if root_rnk>0: root_str&", "& fi decimal root_idx;
    endfor
    if root_num>1:
      drv_message "warning, multiple root indices ("&root_str&").";
    fi
  fi
  drv_checked:=true;
enddef;

%
% Building
%

vardef drv_lin_build[]=
  %
  % orientation
  %
  if bot_jdg[@]:
    ypart iln[@].c=ypart jdg[@].c-den_dp;
    sub_min_y[@]:=ypart jdg[@].c+jdg[@].dp;
    sub_max_y[@]:=
      if iln_sty[@]=0:
        ypart jdg[@].c+jdg[@].hg
      else:
        ypart iln[@].c+iln_hg[iln_sty[@]]
      fi;
    for prm_rnk=0 upto prm_num[@]-1:
      ypart jdg[prm[@][prm_rnk]].c=ypart iln[@].c+num_hg;
      drv_lin_build[prm[@][prm_rnk]];
      sub_max_y[@]:=max (sub_max_y[@], sub_max_y[prm[@][prm_rnk]]);
    endfor
  else:
    ypart iln[@].c=ypart jdg[@].c-num_hg;
    sub_min_y[@]:=
      if iln_sty[@]=0:
        ypart jdg[@].c+jdg[@].dp
      else:
        ypart iln[@].c+iln_dp[iln_sty[@]]
      fi;
    sub_max_y[@]:=ypart jdg[@].c+jdg[@].hg;
    for prm_rnk=0 upto prm_num[@]-1:
      ypart jdg[prm[@][prm_rnk]].c=ypart iln[@].c+den_dp;
      drv_lin_build[prm[@][prm_rnk]];
      sub_min_y[@]:=min (sub_min_y[@], sub_min_y[prm[@][prm_rnk]]);
    endfor
  fi
  %
  % premises junction (from left to right)
  %
  save l_lmost, l_rmost, r_lmost, r_rmost, l_max_x, r_min_x, min_skp;
  numeric l_lmost, l_rmost, r_lmost, r_rmost, l_max_x, r_min_x, min_skp[];
  for prm_rnk=1 upto prm_num[@]-1:
    l_lmost:=prm[@][0];
    l_rmost:=prm[@][prm_rnk-1];
    r_lmost:=prm[@][prm_rnk];
    r_rmost:=prm[@][prm_rnk];
    l_max_x:=nfr_max_x[l_rmost];
    r_min_x:=nfr_min_x[r_lmost];
    min_skp[0]:=r_min_x-l_max_x;
    forever:
      exitif (unknown r_prm[l_rmost]) or (unknown l_prm[r_lmost]);
      l_lmost:=l_prm[l_lmost];
      l_rmost:=r_prm[l_rmost];
      r_lmost:=l_prm[r_lmost];
      r_rmost:=r_prm[r_rmost];
      l_max_x:=max (l_max_x, nfr_max_x[l_rmost]);
      r_min_x:=min (r_min_x, nfr_min_x[r_lmost]);
      min_skp[0]:=min (min_skp[0], nfr_min_x[r_lmost]-nfr_max_x[l_rmost]);
    endfor
    min_skp[1]:=r_min_x-l_max_x;
    if known r_prm[l_rmost]:
      r_prm[r_rmost]:= r_prm[l_rmost];
      l_max_x:=sub_max_x[l_rmost];
    elseif known l_prm[r_lmost]:
      l_prm[l_lmost]:=l_prm[r_lmost];
      r_min_x:=sub_min_x[r_lmost];
    fi
    min_skp[2]:=r_min_x-l_max_x;
    if jct_sty[@]<3:
      min_skp[jct_sty[@]]=prm_skp_scl*prm_skp[drv_sty];
    fi
  endfor
  %
  % judgment alignment
  %
  if prm_num[@]=0:
    nfr_min_x[@]:=xpart jdg[@].l;
    nfr_max_x[@]:=xpart jdg[@].r;
  else:
    l_prm[@]:=prm[@][0];
    r_prm[@]:=prm[@][prm_num[@]-1];
    save l_xref, r_xref;
    l_xref=
      if boxed[l_prm[@]]:
        sub_min_x[l_prm[@]]
      else:
        xpart jdg[l_prm[@]].l
      fi;
    r_xref=
      if boxed[r_prm[@]]:
        sub_max_x[r_prm[@]]
      else:
        xpart jdg[r_prm[@]].r
      fi;
    if alg_sty[@]="l":
      xpart jdg[@].l=l_xref;
    elseif alg_sty[@]="c":
      xpart jdg[@].c=(l_xref+r_xref)/2;
    elseif alg_sty[@]="r":
      xpart jdg[@].r=r_xref;
    fi
    nfr_min_x[@]:=min (xpart jdg[@].l, l_xref);
    nfr_max_x[@]:=max (xpart jdg[@].r, r_xref);
  fi
  %
  % inference line
  %
  save iln_wd, iln_pct;
  numeric iln_wd;
  picture iln_pct;
  iln_wd:=nfr_max_x[@]-nfr_min_x[@]+2*jdg_skp_scl*jdg_skp[jdg_sty[drv_sty]];
  iln_pct:=((0, 0)--(iln_wd, 0)) drv_styled iln_sty[@];
  setbounds iln_pct to
    (0, ypart llcorner iln_pct)
  --(0, ypart ulcorner iln_pct)
  --(iln_wd, ypart ulcorner iln_pct)
  --(iln_wd, ypart llcorner iln_pct)
  --cycle; % ! `linecap:=butt' and `linecap:=squared' -> same bounding box !
  box_init iln[@] (iln_pct);
  xpart iln[@].c=(nfr_min_x[@]+nfr_max_x[@])/2;
  if iln_sty[@]>0:
    nfr_min_x[@]:=xpart iln[@].l;
    nfr_max_x[@]:=xpart iln[@].r;
  fi
  %
  % inference labels
  %
  if known l_ilb[@]:
    l_ilb[@].r=iln[@].l shifted (-ilb_skp_scl*ilb_skp[drv_sty], 0);
    nfr_min_x[@]:=xpart l_ilb[@].l;
    sub_min_y[@]:=min (sub_min_y[@], ypart l_ilb[@].c+l_ilb[@].dp);
    sub_max_y[@]:=max (sub_max_y[@], ypart l_ilb[@].c+l_ilb[@].hg);
  fi
  if known r_ilb[@]:
    r_ilb[@].l=iln[@].r shifted (ilb_skp_scl*ilb_skp[drv_sty], 0);
    nfr_max_x[@]:=xpart r_ilb[@].r;
    sub_min_y[@]:=min (sub_min_y[@], ypart r_ilb[@].c+r_ilb[@].dp);
    sub_max_y[@]:=max (sub_max_y[@], ypart r_ilb[@].c+r_ilb[@].hg);
  fi
  %
  % phantom steps
  %
  if known tgt[@]:
    save trg, bot_y, top_y, phm_pct;
    numeric trg, bot_y, top_y;
    picture phm_pct;
    trg:=tgt[@];
    if bot_jdg[@]:
      bot_y:=min_y[@]+min_clr_scl*min_clr[drv_sty]/2;
      top_y:=min_y[trg];
    else:
      bot_y:=max_y[trg];
      top_y:=max_y[@]-min_clr_scl*min_clr[drv_sty]/2;
    fi
    phm_pct:=((0, (bot_y-top_y)/2)--(0, (top_y-bot_y)/2))
      drv_styled phm_sty[@];
    box_init phm[trg] (phm_pct shifted ((width phm_pct)/2, 0));
    phm[trg].c=(xpart jdg[@].c, (top_y+bot_y)/2);
    nfr_min_x[@]:=min (nfr_min_x[@], xpart phm[trg].l);
    nfr_max_x[@]:=max (nfr_max_x[@], xpart phm[trg].r);
    %
    % phantom steps labels
    %
    if known l_plb[trg]:
      l_plb[trg].r=phm[trg].l shifted (-plb_skp[drv_sty], 0);
      nfr_min_x[@]:=min (nfr_min_x[@], xpart l_plb[trg].l);
    fi
    if known r_plb[trg]:
      r_plb[trg].l=phm[trg].r shifted ( plb_skp[drv_sty], 0);
      nfr_max_x[@]:=max (nfr_max_x[@], xpart r_plb[trg].r);
    fi
  fi
  %
  % sub_min_x & sub_max_x
  %
  sub_min_x[@]:=nfr_min_x[@];
  sub_max_x[@]:=nfr_max_x[@];
  for prm_rnk=0 upto prm_num[@]-1:
    sub_min_x[@]:=min (sub_min_x[@], sub_min_x[prm[@][prm_rnk]]);
    sub_max_x[@]:=max (sub_max_x[@], sub_max_x[prm[@][prm_rnk]]);
  endfor
  %
  % delimiters
  %
  if known l_dlb[@] or known r_dlb[@]:
    save miny, maxy;
    numeric miny, maxy;
    miny:=min_y[@];
    maxy:=max_y[@];
    if known l_dlb[@]:
      box_init l_dlm[@] (delim l (maxy-miny));
      l_dlm[@].r=(sub_min_x[@], (maxy+miny)/2);
      l_dlb[@].r=l_dlm[@].l;
      sub_min_x[@]:=xpart l_dlb[@].l;
    fi
    if known r_dlb[@]:
      box_init r_dlm[@] (delim r (maxy-miny));
      r_dlm[@].l=(sub_max_x[@], (maxy+miny)/2);
      r_dlb[@].l=r_dlm[@].r;
      sub_max_x[@]:=xpart r_dlb[@].r;
    fi
  fi
  if (known l_dlb[@]) or boxed[@]:
    save idx;
    numeric idx;
    idx:=@;
    forever:
      nfr_min_x[idx]:=sub_min_x[@];
      exitif unknown l_prm[idx];
      idx:=l_prm[idx];
    endfor
  fi
  if (known r_dlb[@]) or boxed[@]:
    save idx;
    numeric idx;
    idx:=@;
    forever:
      nfr_max_x[idx]:=sub_max_x[@];
      exitif unknown r_prm[idx];
      idx:=r_prm[idx];
    endfor
  fi
enddef;

vardef drv_rad_build[]=
  for sbj_rnk=0 upto (sbj_num[@]-1):
    sbj[@][sbj_rnk].rad=jdg[@].rad;
    sbj[@][sbj_rnk].org=jdg[@].org;
  endfor
  %
  % orientation
  %
  if bot_jdg[@]:
    iln[@].rad=jdg[@].rad-den_dp;
    iln[@].org=jdg[@].org;
    sub_min_rad[@]:=jdg[@].rad+jdg[@].dp;
    sub_max_rad[@]:=
      if iln_sty[@]=0:
        jdg[@].rad+jdg[@].hg
      else:
        iln[@].rad+iln_hg[iln_sty[@]]
      fi;
    for prm_rnk=0 upto prm_num[@]-1:
      jdg[prm[@][prm_rnk]].rad=iln[@].rad+num_hg;
      jdg[prm[@][prm_rnk]].org=iln[@].org;
      drv_rad_build[prm[@][prm_rnk]];
    sub_max_rad[@]:=max (sub_max_rad[@], sub_max_rad[prm[@][prm_rnk]]);
    endfor
  else:
    iln[@].rad=jdg[@].rad+num_hg;
    iln[@].org=jdg[@].org;
    sub_min_rad[@]:=jdg[@].rad-jdg[@].hg;
    sub_max_rad[@]:=
      if iln_sty[@]=0:
        jdg[@].rad-jdg[@].dp
      else:
        iln[@].rad-iln_dp[iln_sty[@]]
      fi;
    for prm_rnk=0 upto prm_num[@]-1:
      jdg[prm[@][prm_rnk]].rad=iln[@].rad-den_dp;
      jdg[prm[@][prm_rnk]].org=iln[@].org;
      drv_rad_build[prm[@][prm_rnk]];
    sub_max_rad[@]:=max (sub_max_rad[@], sub_max_rad[prm[@][prm_rnk]]);
    endfor;
  fi
  %
  % inference labels
  %
  if known l_ilb[@]:
    l_ilb[@].rad=iln[@].rad;
    l_ilb[@].org=iln[@].org;
    sub_max_rad[@]:=max (sub_max_rad[@],
      l_ilb[@].rad if bot_jdg[@]: +l_ilb[@].hg else: -l_ilb[@].dp fi);
  fi
  if known r_ilb[@]:
    r_ilb[@].rad=iln[@].rad;
    r_ilb[@].org=iln[@].org;
    sub_max_rad[@]:=max (sub_max_rad[@],
      r_ilb[@].rad if bot_jdg[@]: +r_ilb[@].hg else: -r_ilb[@].dp fi);
  fi
  %
  % phantom steps
  %
  if known tgt[@]:
    save trg, src_rad, tgt_rad;
    numeric trg, src_rad, tgt_rad;
    trg:=tgt[@];
    src_rad:=min_rad[@]+min_clr_scl*min_clr[drv_sty]/2;
    tgt_rad:=min_rad[trg];
    phm[trg].rad=(src_rad+tgt_rad)/2;
    phm[trg].org=jdg[@].org;
    %
    % phantom steps labels
    %
    if known l_plb[trg]:
      l_plb[trg].rad=phm[trg].rad;
      l_plb[trg].org=phm[trg].org;
    fi
    if known r_plb[trg]:
      r_plb[trg].rad=phm[trg].rad;
      r_plb[trg].org=phm[trg].org;
    fi
  fi
  %
  % delimiters
  %
  if known l_dlb[@] or known r_dlb[@]:
    save minr, maxr;
    numeric minr, maxr;
    minr:=min_rad[@];
    maxr:=max_rad[@];
    if known l_dlb[@]:
      l_dlm[@].rad=(minr+maxr)/2;
      l_dlb[@].rad=l_dlm[@].rad;
      l_dlb[@].org=l_dlm[@].org=jdg[@].org;
    fi
    if known r_dlb[@]:
      r_dlm[@].rad=(minr+maxr)/2;
      r_dlb[@].rad=r_dlm[@].rad;
      r_dlb[@].org=r_dlm[@].org=jdg[@].org;
    fi
  fi
enddef;

vardef drv_ngl_build[]=
  for prm_rnk=0 upto prm_num[@]-1:
    drv_ngl_build[prm[@][prm_rnk]];
  endfor
  save tnum;
  numeric tnum;
  tnum:=if bot_jdg[@]: - fi 1; % turning number
  %
  % judgment arc
  %
  save jdg_pct, jdg_ngl;
  picture jdg_pct;
  numeric jdg_ngl;
  jdg_pct:=nullpicture;
  jdg_ngl:=0;
  for sbj_rnk=0 upto (sbj_num[@]-1):
    arc_init sbj[@][sbj_rnk]
      (text_arc (sbj[@][sbj_rnk], sbj[@][sbj_rnk].rad) tnum,
       arc_angle (sbj[@][sbj_rnk].rad, width sbj[@][sbj_rnk]) tnum);
    if sbj_rnk>0:				% non mandatory test
      sbj[@][sbj_rnk-1].rng=sbj[@][sbj_rnk].lng;% irrelevant if rnk=0
    fi
    addto jdg_pct also sbj[@][sbj_rnk] rotated jdg_ngl;
    jdg_ngl:=jdg_ngl+sbj[@][sbj_rnk].rng-sbj[@][sbj_rnk].lng;
  endfor
  arc_init jdg[@] (jdg_pct, jdg_ngl);
  if sbj_num[@]>0:				% non mandatory test
    jdg[@].lng=sbj[@][0].lng;			% irrelevant if sbj_num=0
  fi
  %
  % premises junction (from left to right)
  %
  save l_lmost, l_rmost, r_lmost, r_rmost, l_rmost_ppt, r_lmost_ppt, ppt_skp;
  numeric l_lmost, l_rmost, r_lmost, r_rmost;
  pair l_rmost_ppt, r_lmost_ppt, ppt_skp[];
  for prm_rnk=1 upto prm_num[@]-1:
    l_lmost:=prm[@][0];
    l_rmost:=prm[@][prm_rnk-1];
    r_lmost:=prm[@][prm_rnk];
    r_rmost:=prm[@][prm_rnk];
    l_rmost_ppt:=nfr_rmost_ppt[l_rmost];
    r_lmost_ppt:=nfr_lmost_ppt[r_lmost];
    ppt_skp[0]:=(minrad (l_rmost_ppt, r_lmost_ppt),
      (ngl_part r_lmost_ppt)-(ngl_part l_rmost_ppt));
    forever:
      exitif (unknown r_prm[l_rmost]) or (unknown l_prm[r_lmost]);
      l_lmost:=l_prm[l_lmost];
      l_rmost:=r_prm[l_rmost];
      r_lmost:=l_prm[r_lmost];
      r_rmost:=r_prm[r_rmost];
      l_rmost_ppt:=rmost_ppt (l_rmost_ppt, nfr_rmost_ppt[l_rmost]) tnum;
      r_lmost_ppt:=lmost_ppt (r_lmost_ppt, nfr_lmost_ppt[r_lmost]) tnum;
      ppt_skp[0]:=rmost_ppt (ppt_skp[0], (minrad (l_rmost_ppt, r_lmost_ppt),
        (ngl_part r_lmost_ppt)-(ngl_part l_rmost_ppt))) tnum;
    endfor
    ppt_skp[1]:=(minrad (l_rmost_ppt, r_lmost_ppt),
      (ngl_part r_lmost_ppt)-(ngl_part l_rmost_ppt));
    if known r_prm[l_rmost]:
      r_prm[r_rmost]:=r_prm[l_rmost];
      l_rmost_ppt:=sub_rmost_ppt[l_rmost];
    elseif known l_prm[r_lmost]:
      l_prm[l_lmost]:=l_prm[r_lmost];
      r_lmost_ppt:=sub_lmost_ppt[r_lmost];
    fi
    ppt_skp[2]:=(minrad (l_rmost_ppt, r_lmost_ppt),
      (ngl_part r_lmost_ppt)-(ngl_part l_rmost_ppt));
    if jct_sty[@]<3:
      (ngl_part ppt_skp[jct_sty[@]])=
        arc_angle(rad_part ppt_skp[jct_sty[@]],
          prm_skp_scl*prm_skp[drv_sty]) tnum;
    fi
  endfor
  %
  % judgment alignment
  %
  if prm_num[@]=0:
    nfr_lmost_ppt[@]:=(jdg[@].rad, jdg[@].lng);
    nfr_rmost_ppt[@]:=(jdg[@].rad, jdg[@].rng);
  else:
    l_prm[@]:=prm[@][0];
    r_prm[@]:=prm[@][prm_num[@]-1];
    save l_ngl_ref, r_ngl_ref;
    numeric l_ngl_ref, r_ngl_ref;
    l_ngl_ref=
      if boxed[l_prm[@]]:
        ngl_part sub_lmost_ppt[l_prm[@]]
      else:
        jdg[l_prm[@]].lng
      fi;
    r_ngl_ref=
      if boxed[r_prm[@]]:
        ngl_part sub_rmost_ppt[r_prm[@]]
      else:
        jdg[r_prm[@]].rng
      fi;
    if alg_sty[@]="l":
      jdg[@].lng=l_ngl_ref;
    elseif alg_sty[@]="c":
      jdg[@].cng=(l_ngl_ref+r_ngl_ref)/2;
    elseif alg_sty[@]="r":
      jdg[@].rng=r_ngl_ref;
    fi
    nfr_lmost_ppt[@]:=(
      jdg[@].rad,
      tnum*min (tnum*jdg[@].lng, tnum*l_ngl_ref));
    nfr_rmost_ppt[@]:=(
      jdg[@].rad,
      tnum*max (tnum*jdg[@].rng, tnum*r_ngl_ref));
  fi
  %
  % inference line
  %
  save iln_ngl;
  numeric iln_ngl;
  iln_ngl:=2*(arc_angle(iln[@].rad,
    jdg_skp_scl*jdg_skp[jdg_sty[drv_sty]]) tnum)
      +(ngl_part nfr_rmost_ppt[@])
      -(ngl_part nfr_lmost_ppt[@]);
  arc_init iln[@]
    ((circ_path (iln[@].rad, iln_ngl) tnum) drv_styled iln_sty[@], iln_ngl);
  iln[@].hg=iln_hg[iln_sty[@]];
  iln[@].dp=iln_dp[iln_sty[@]];
  iln[@].cng=((ngl_part nfr_lmost_ppt[@])+(ngl_part nfr_rmost_ppt[@]))/2;
  if iln_sty[@]>0:
    nfr_lmost_ppt[@]:=(iln[@].rad, iln[@].lng);
    nfr_rmost_ppt[@]:=(iln[@].rad, iln[@].rng);
  fi
  %
  % inference labels
  %
  if known l_ilb[@]:
    arc_init l_ilb[@](
      text_arc (l_ilb[@], l_ilb[@].rad) tnum,
      arc_angle (l_ilb[@].rad, width l_ilb[@]) tnum);
    l_ilb[@].rng=iln[@].lng
      -arc_angle (l_ilb[@].rad, ilb_skp_scl*ilb_skp[drv_sty]) tnum;
    nfr_lmost_ppt[@]:=(l_ilb[@].rad, l_ilb[@].lng);
  fi
  if known r_ilb[@]:
    arc_init r_ilb[@](
      text_arc (r_ilb[@], r_ilb[@].rad) tnum,
      arc_angle (r_ilb[@].rad, width r_ilb[@]) tnum);
    r_ilb[@].lng=iln[@].rng
      +arc_angle (r_ilb[@].rad, ilb_skp_scl*ilb_skp[drv_sty]) tnum;
    nfr_rmost_ppt[@]:=(r_ilb[@].rad, r_ilb[@].rng);
  fi
  %
  % phantom steps
  %
  if known tgt[@]:
    save trg, src_rad, tgt_rad, phm_pct;
    numeric trg, src_rad, tgt_rad;
    picture phm_pct;
    trg:=tgt[@];
    src_rad:=min_rad[@]+min_clr_scl*min_clr[drv_sty]/2;
    tgt_rad:=min_rad[trg];
    phm_pct:=((0, (src_rad-tgt_rad)/2)--(0, (tgt_rad-src_rad)/2))
      drv_styled phm_sty[@];
    arc_init phm[trg] (
      phm_pct
        rotated (tnum*90+arc_angle (phm[trg].rad, (width phm_pct)/2) tnum)
        shifted ((dir 0) scaled phm[trg].rad),
      arc_angle (phm[trg].rad, width phm_pct) tnum);
    phm[trg].cng=jdg[@].cng;
    nfr_lmost_ppt[@]:=lmost_ppt (nfr_lmost_ppt[@],
      (phm[trg].rad, phm[trg].lng)) tnum;
    nfr_rmost_ppt[@]:=rmost_ppt (nfr_rmost_ppt[@],
      (phm[trg].rad, phm[trg].rng)) tnum;
    %
    % phantom steps labels
    %
    if known l_plb[trg]:
      arc_init l_plb[trg](
        text_arc (l_plb[trg], l_plb[trg].rad) tnum,
        arc_angle (l_plb[trg].rad, width l_plb[trg]) tnum);
      l_plb[trg].rng=phm[trg].lng
        -arc_angle (l_plb[trg].rad, plb_skp[drv_sty]) tnum;
      nfr_lmost_ppt[@]:=
        lmost_ppt(nfr_lmost_ppt[@], (l_plb[trg].rad, l_plb[trg].lng)) tnum;
    fi
    if known r_plb[trg]:
      arc_init r_plb[trg](
        text_arc (r_plb[trg], r_plb[trg].rad) tnum,
        arc_angle (r_plb[trg].rad, width r_plb[trg]) tnum);
      r_plb[trg].lng=phm[trg].rng
        +arc_angle (r_plb[trg].rad, plb_skp[drv_sty]) tnum;
      nfr_rmost_ppt[@]:=
        rmost_ppt(nfr_rmost_ppt[@], (r_plb[trg].rad, r_plb[trg].rng)) tnum;
    fi
  fi
  %
  % sub_lmost_ppt & sub_rmost_ppt
  %
  sub_lmost_ppt[@]:=nfr_lmost_ppt[@];
  sub_rmost_ppt[@]:=nfr_rmost_ppt[@];
  for prm_rnk=0 upto prm_num[@]-1:
    sub_lmost_ppt[@]:=
      lmost_ppt (sub_lmost_ppt[@], sub_lmost_ppt[prm[@][prm_rnk]]) tnum;
    sub_rmost_ppt[@]:=
      rmost_ppt (sub_rmost_ppt[@], sub_rmost_ppt[prm[@][prm_rnk]]) tnum;
  endfor
  %
  % delimiters
  %
  if known l_dlb[@] or known r_dlb[@]:
    save dlm_pct, minr, maxr;
    picture dlm_pct;
    numeric minr, maxr;
    minr:=min_rad[@];
    maxr:=max_rad[@];
    if known l_dlb[@]:
      dlm_pct:=delim l (maxr-minr);
      arc_init l_dlm[@] (
        dlm_pct
          rotated (tnum*90+arc_angle (l_dlm[@].rad, (width dlm_pct)/2) tnum)
          shifted ((dir 0) scaled l_dlm[@].rad),
        arc_angle (l_dlm[@].rad, width dlm_pct) tnum);
      l_dlm[@].rng=ngl_part sub_lmost_ppt[@];
      arc_init l_dlb[@](
        text_arc (l_dlb[@], l_dlb[@].rad) tnum,
        arc_angle (l_dlb[@].rad, width l_dlb[@]) tnum);
      l_dlb[@].rng=l_dlm[@].lng;
      sub_lmost_ppt[@]:= (l_dlb[@].rad, l_dlb[@].lng);
    fi
    if known r_dlb[@]:
      dlm_pct:=delim r (maxr-minr);
      arc_init r_dlm[@] (
        dlm_pct
          rotated (tnum*90+arc_angle (r_dlm[@].rad, (width dlm_pct)/2) tnum)
          shifted ((dir 0) scaled r_dlm[@].rad),
        arc_angle (r_dlm[@].rad, width dlm_pct) tnum);
      r_dlm[@].lng=ngl_part sub_rmost_ppt[@];
      arc_init r_dlb[@](
        text_arc (r_dlb[@], r_dlb[@].rad) tnum,
        arc_angle (r_dlb[@].rad, width r_dlb[@]) tnum);
      r_dlb[@].lng=r_dlm[@].rng;
      sub_rmost_ppt[@]:=(r_dlb[@].rad, r_dlb[@].rng);
    fi
  fi
  if (known l_dlb[@]) or boxed[@]:
    save idx;
    numeric idx;
    idx:=@;
    forever:
      nfr_lmost_ppt[idx]:=sub_lmost_ppt[@];
      exitif unknown l_prm[idx];
      idx:=l_prm[idx];
    endfor
  fi
  if (known r_dlb[@]) or boxed[@]:
    save idx;
    numeric idx;
    idx:=@;
    forever:
      nfr_rmost_ppt[idx]:=sub_rmost_ppt[@];
      exitif unknown r_prm[idx];
      idx:=r_prm[idx];
    endfor
  fi
enddef;

%
% Freezing
%

vardef drv_box_freeze[]=
  for prm_rnk=0 upto prm_num[@]-1:
    drv_box_freeze[prm[@][prm_rnk]];
  endfor
  for sbj_rnk=0 upto sbj_num[@]-1:
    box_freeze sbj[@][sbj_rnk];
  endfor
  forsuffixes sfx=
    iln, jdg, phm,
    l_dlb, l_dlm, l_ilb, l_plb,
    r_dlb, r_dlm, r_ilb, r_plb:
      if known sfx[@]:
        box_freeze sfx[@];
      fi
  endfor
enddef;

vardef drv_arc_freeze[]=
  for prm_rnk=0 upto prm_num[@]-1:
    drv_arc_freeze[prm[@][prm_rnk]];
  endfor
  for sbj_rnk=0 upto sbj_num[@]-1:
    arc_freeze sbj[@][sbj_rnk];
  endfor
  forsuffixes sfx=
    iln, jdg, phm,
    l_dlb, l_dlm, l_ilb, l_plb,
    r_dlb, r_dlm, r_ilb, r_plb:
      if known sfx[@]:
        arc_freeze sfx[@];
      fi
  endfor
enddef;

vardef drv_freeze=
  if not drv_checked:
    drv_check;
  fi
  save root_idx, tnum;
  numeric root_idx, tnum;
  %
  % first root
  %
  root_idx:=root[0];
  if drv_radialmode_on:
    drv_rad_build[root_idx];
    if unknown jdg[root_idx].rad:
      jdg[root_idx].rad=10(num_hg-den_dp)/crv_scl;
    fi
    drv_ngl_build[root_idx];
    tnum:=if bot_jdg[root_idx]: - fi 1; % turning number
    if unknown jdg[root_idx].cng:
      jdg[root_idx].cng=-tnum*azimuth_ngl;
    fi
    if unknown jdg[root_idx].org:
      %
      % default math axis
      %
      jdg[root_idx].org=
        (dir -jdg[root_idx].cng) scaled (tnum*axis_hg[drv_sty]+
          if drv_axis_ref="iln":
            iln[root_idx].rad
          else: % drv_axis_ref="jdg"
            jdg[root_idx].rad
          fi);
    fi
    drv_arc_freeze[root_idx];
  else:
    drv_lin_build[root_idx];
    if unknown xpart jdg[root_idx].c:
      xpart jdg[root_idx].c=0;
    fi
    if unknown ypart jdg[root_idx].c:
      %
      % default math axis
      %
      if drv_axis_ref="iln":
        ypart iln[root_idx].c=axis_hg[drv_sty];
      else: % drv_axis_ref="jdg"
        ypart jdg[root_idx].c=axis_hg[drv_sty];
      fi
    fi
    drv_box_freeze[root_idx];
  fi
  %
  % other roots
  %
  if drv_radialmode_on:
    save l_rmost_rad, l_rmost_ngl, r_lmost_rad, r_lmost_ngl;
    numeric l_rmost_rad, l_rmost_ngl, r_lmost_rad, r_lmost_ngl;
    for root_rnk=1 upto root_num-1:
      root_idx:=root[root_rnk];
      drv_rad_build[root_idx];
      if unknown jdg[root_idx].rad:
        jdg[root_idx].rad=10(num_hg-den_dp)/crv_scl;
      fi
      drv_ngl_build[root_idx];
      tnum:=if bot_jdg[root_idx]: - fi 1; % turning number
      l_rmost_rad:=rad_part sub_rmost_ppt[root[root_rnk-1]];
      l_rmost_ngl:=ngl_part sub_rmost_ppt[root[root_rnk-1]];
      r_lmost_rad:=rad_part sub_lmost_ppt[root_idx];
      r_lmost_ngl:=ngl_part sub_lmost_ppt[root_idx];
      if unknown jdg[root_idx].cng:
        r_lmost_ngl=l_rmost_ngl+
          if bot_jdg[root_idx]=bot_jdg[root[root_rnk-1]]:
            arc_angle (min (r_lmost_rad, l_rmost_rad),
              prm_skp_scl*prm_skp[drv_sty]) tnum
          else:
            180
          fi;
      fi
      if unknown jdg[root_idx].org:
        jdg[root_idx].org=
          if bot_jdg[root_idx]=bot_jdg[root[root_rnk-1]]:
            jdg[root[root_rnk-1]].org
          else:
            (dir l_rmost_ngl)
              scaled jdg[root[root_rnk-1]].rad
              shifted jdg[root[root_rnk-1]].org
              shifted ((dir (l_rmost_ngl-tnum*90))
                scaled (prm_skp_scl*prm_skp[drv_sty]))
              shifted ((dir l_rmost_ngl) scaled jdg[root_idx].rad)
          fi;
      fi
      drv_arc_freeze[root_idx];
    endfor
  else:
    for root_rnk=1 upto root_num-1:
      root_idx:=root[root_rnk];
      drv_lin_build[root_idx];
      if unknown xpart jdg[root_idx].c:
        sub_min_x[root_idx]=sub_max_x[root[root_rnk-1]]
          +prm_skp_scl*prm_skp[drv_sty];
      fi
      if unknown ypart jdg[root_idx].c:
        ypart jdg[root_idx].c=ypart jdg[root[root_rnk-1]].c;
      fi
      drv_box_freeze[root_idx];
    endfor
  fi
  drv_frozen:=true;
enddef;


%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
%
% Derivation tree pictures
%

%
% 1. Global parameters
%

boolean drv_proofmode_on;	%
color prf_clr;			%
color jdg_clr;			%
color sbj_clr;			%

prf_clr:=.75background;		% arbitrary
jdg_clr:=red;			% arbitrary
sbj_clr:=blue;			% arbitrary

%
% 2. Macros
%

vardef drv_tree_addto @# (expr idx) text draw_options=
  for prm_rnk=0 upto prm_num[idx]-1:
    drv_tree_addto @# (prm[idx][prm_rnk]) draw_options;
  endfor
  forsuffixes sfx=
    jdg, phm,
    l_dlb, l_dlm, l_ilb, l_plb,
    r_dlb, r_dlm, r_ilb, r_plb:
      if known sfx[idx]:
        addto @# also sfx[idx] draw_options;
      fi
  endfor
  if iln_sty[idx]>0:
      addto @# also iln[idx] draw_options;
  fi
enddef;

vardef tt_nat[] expr nat= % typewriter typeface naturals
  save nat_aux, nat_pct_wd, dgt_num, nat_pct;
  numeric nat_aux, nat_pct_wd, dgt_num;
  picture nat_pct;
  nat_aux:=abs nat;
  nat_pct:=nullpicture;
  nat_pct_wd:=0;
  dgt_num:=1;
  forever:
    exitif nat_aux div (10**dgt_num)=0;
    dgt_num:=dgt_num+1;
  endfor
  for rnk:=1 upto dgt_num:
    addto nat_pct also tt_dgt[@][nat_aux div (10**(dgt_num-rnk))]
      shifted (nat_pct_wd, 0);
    nat_pct_wd:=width nat_pct;
    nat_aux:=nat_aux mod (10**(dgt_num-rnk));
  endfor
  nat_pct shifted (0, -axis_hg[@])
enddef;

vardef prf_tree_addto @# expr idx=
  for prm_rnk=0 upto prm_num[idx]-1:
    prf_tree_addto @# (prm[idx][prm_rnk]);
  endfor
  if idx>=0:
    box_init jdg_prf[idx] (tt_nat[2] idx);
    jdg_prf[idx].r=jdg[idx].l;
    box_freeze jdg_prf[idx];
    addto @# also jdg_prf[idx] withcolor jdg_clr;
    addto @# doublepath jdg[idx].c withcolor jdg_clr
      withpen pencircle scaled (2*pdt_hg[drv_sty]);
  fi
  for sbj_rnk=0 upto sbj_num[idx]-1:
    box_init sbj_prf[idx][sbj_rnk] (tt_nat[3] sbj_rnk);
    if odd sbj_rnk:
      sbj_prf[idx][sbj_rnk].c shifted (0, sbj_prf[idx][sbj_rnk].hg)=
        sbj[idx][sbj_rnk].c
          shifted (0, -den_dp-min_clr_scl*min_clr[drv_sty]/2);
    else:
      sbj_prf[idx][sbj_rnk].c shifted (0, sbj_prf[idx][sbj_rnk].dp)=
        sbj[idx][sbj_rnk].c
          shifted (0, -num_hg+min_clr_scl*min_clr[drv_sty]/2);
    fi
    box_freeze sbj_prf[idx][sbj_rnk];
    addto @# also sbj_prf[idx][sbj_rnk] withcolor sbj_clr;
    addto @# doublepath sbj[idx][sbj_rnk].c withcolor sbj_clr
      withpen pencircle scaled pdt_hg[drv_sty];
  endfor
enddef;

vardef drv_tree=
  save pct;
  picture pct;
  pct:=nullpicture;
  if not drv_frozen:
    drv_freeze;
  fi
  for root_rnk=0 upto root_num-1:
    if drv_proofmode_on:
      drv_tree_addto pct (root[root_rnk]) withcolor prf_clr;
      prf_tree_addto pct (root[root_rnk]);
    else:
      drv_tree_addto pct (root[root_rnk]);
    fi
  endfor
  pct
enddef;

vardef drv_bbox[]=
  if not drv_frozen:
    drv_freeze;
  fi
  if drv_radialmode_on:
    save l_ngl, r_ngl, tnum;
    numeric l_ngl, r_ngl, tnum;
    tnum:=if bot_jdg[@]: - fi 1; % turning number
    l_ngl:=
      if known l_dlm[@].rng:
        l_dlm[@].rng-arc_angle
          (l_dlm[@].rad, jdg_skp_scl*jdg_skp[jdg_sty[drv_sty]]) tnum
      else:
        (ngl_part sub_lmost_ppt[@])-arc_angle
          (rad_part sub_lmost_ppt[@],
            jdg_skp_scl*jdg_skp[jdg_sty[drv_sty]]) tnum
      fi;
    r_ngl:=
      if known r_dlm[@].lng:
        r_dlm[@].lng+arc_angle
          (r_dlm[@].rad, jdg_skp_scl*jdg_skp[jdg_sty[drv_sty]]) tnum
      else:
        (ngl_part sub_rmost_ppt[@])+arc_angle
          (rad_part sub_rmost_ppt[@],
            jdg_skp_scl*jdg_skp[jdg_sty[drv_sty]]) tnum
      fi;
    (circ_path(max_rad[@], r_ngl-l_ngl) tnum--
     reverse circ_path(min_rad[@], r_ngl-l_ngl) tnum--
     cycle) rotated l_ngl shifted jdg[@].org
  else:
    save minx, maxx, miny, maxy;
    numeric minx, maxx, maxy, miny;
    minx:=
      if known l_dlm[@].r:
        xpart l_dlm[@].r
      else:
        sub_min_x[@]
      fi-jdg_skp_scl*jdg_skp[jdg_sty[drv_sty]];
    maxx:=
      if known r_dlm[@].l:
        xpart l_dlm[@].l
      else:
        sub_max_x[@]
      fi+jdg_skp_scl*jdg_skp[jdg_sty[drv_sty]];
    miny:=min_y[@];
    maxy:=max_y[@];
    (minx, miny)--
    (minx, maxy)--
    (maxx, maxy)--
    (maxx, miny)--
    cycle
  fi
enddef;

vardef mth_axis @# (suffix ref_sfx) (expr idx)=
  if not drv_frozen:
    drv_freeze;
  fi
  if unknown prm_num[idx]:
    drv_errhelp "An index must be used to declare an inference before it is"&
      " used to set the math axis of a picture.";
    drv_errmessage "no inference has been declared using index "&(decimal idx);
  else:
    save ref_str, yref;
    string ref_str;
    numeric yref;
    ref_str:=str ref_sfx;
    if ref_str="iln":
      yref:=ypart iln[idx].c;
    elseif ref_str="jdg":
      yref:=ypart jdg[idx].c;
    elseif ref_str="dlm":
      if known l_dlm[idx]:
        yref:=ypart l_dlm[idx].c;
      elseif known r_dlm[idx]:
        yref:=ypart r_dlm[idx].c;
      else:
        drv_errhelp "Well ...";
        drv_errmessage "no delimiter is attached to inference "&(decimal idx);
      fi
    else:
      drv_errhelp "Valid identifiers are"&
        " iln (inference line axis),"&
        " jdg (judgment math-axis) and"&
        " dlm (delimiter axis).";
      drv_errmessage (ref_str&" is not a valid reference type identifier");
    fi
    if known yref:
      @#:=@# shifted (0, axis_hg[drv_sty]-yref);
    fi
  fi
enddef;

vardef drv_axis (suffix ref) (expr idx)=
  mth_axis currentpicture (ref, idx);
enddef;


%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
%
% Tunings
%

vardef check_math_style (expr sty_str, default)=
  if sty_str="\displaystyle":
    0
  elseif sty_str="\textstyle":
    1
  elseif sty_str="\scriptstyle":
    2
  elseif sty_str="\scriptscriptstyle":
    3
  else:
    begingroup
      drv_errhelp "Valid commands are"&
        " \displaystyle,"&
        " \textstyle,"&
        " \scriptstyle and"&
        " \scriptscriptstyle.";
      drv_errmessage (sty_str&" is not a valid math-style command");
      default
    endgroup
  fi
enddef;

vardef check_position_left (suffix pos_sfx) (expr default)=
  save pos_str;
  string pos_str;
  pos_str:=str pos_sfx;
  if (pos_str="l"):
    true
  elseif (pos_str="r"):
    false
  else:
    begingroup
      drv_errhelp "Valid identifiers are l (left) and r (right).";
      drv_errmessage (pos_str&" is not a valid label position identifier");
      default
    endgroup
  fi
enddef;

vardef check_position_bot (suffix pos_sfx) (expr default)=
  save pos_str;
  string pos_str;
  pos_str:=str pos_sfx;
  if pos_str="t":
    false
  elseif pos_str="b":
    true
  else:
    begingroup
      drv_errhelp "Valid identifiers are"&
        " t (top) and"&
        " b (bottom).";
      drv_errmessage (pos_str&" is not a valid root position identifier");
      default
    endgroup
  fi
enddef;

vardef check_mode_on (suffix status_sfx) (expr default)=
  save status_str;
  string status_str;
  status_str:=str status_sfx;
  if status_str="on":
    true
  elseif status_str="off":
    false
  else:
    begingroup
      drv_errhelp "Possible identifiers are on and off";
      drv_errmessage (status_str&" is not a valid status identifier");
      default
    endgroup
  fi
enddef;

vardef drv_math_style (suffix typ_sfx) (expr sty_str)=
  save typ_str, sty_idx;
  string typ_str;
  numeric sty_idx;
  typ_str:=str typ_sfx;
  if  (typ_str<>"drv")
  and (typ_str<>"jdg")
  and (typ_str<>"ilb")
  and (typ_str<>"dlb")
  and (typ_str<>"plb"):
    drv_errhelp "Valid  identifiers are"&
      " drv (derivation tree),"&
      " jdg (judgment),"&
      " ilb (inference label),"&
      " dlb (delimiter label) and"&
      " plb (phantom steps label).";
    drv_errmessage (sty_str&" is not a valid component identifier");
  else:
    sty_idx:=check_math_style (sty_str, 0);
    if typ_str="drv":
      drv_sty:=sty_idx;
    else:
      forsuffixes sfx=scantokens (typ_str&"_sty"):
        for idx=0 upto 3:
          sfx[idx]:=min (idx+sty_idx, 3);
        endfor
      endfor
    fi
  fi
enddef;

vardef drv_scale (suffix scl_sfx) (expr scl)=
  save scl_str;
  string scl_str;
  scl_str:=str scl_sfx;
  if scl_str="clr":
    min_clr_scl:=scl;
  elseif scl_str="prm":
    prm_skp_scl:=scl;
  elseif (scl_str="jdg") or (scl_str="jgm"): % "jgm" is deprecated
    jdg_skp_scl:=scl;
  elseif (scl_str="ilb") or (scl_str="lbl"): % "lbl" is deprecated
    ilb_skp_scl:=scl;
  elseif scl_str="crv":
    crv_scl:=scl;
  else:
    drv_errhelp "Valid identifiers are"&
      " clr,"&
      " prm,"&
      " jdg,"&
      " ilb and"&
      " crv.";
    drv_errmessage (scl_str&" is not a valid scale identifier");
  fi
enddef;

vardef drv_junction_style suffix sty_sfx=
  drv_jct_sty:=check_junction_style (sty_sfx, drv_jct_sty);
enddef;

vardef drv_alignment_style suffix sty_sfx=
  drv_alg_sty:=check_alignment_style (sty_sfx, drv_alg_sty);
enddef;

vardef drv_path_style (suffix typ_sfx, sty_sfx)=
  save typ_str;
  string typ_str;
  typ_str:=str typ_sfx;
  if typ_str="iln":
    drv_iln_sty:=check_path_style (sty_sfx, drv_iln_sty);
  elseif typ_str="phm":
    drv_phm_sty:=check_path_style (sty_sfx, drv_phm_sty);
  else:
    drv_errhelp "Valid identifiers are"&
      " iln (inference line) and"&
      " phm (phantom steps path).";
    drv_errmessage (typ_str&" is not a valid path-type identifier");
  fi
enddef;

vardef drv_labels_position_aux (suffix typ_sfx, pos_sfx)=
  save typ_str, idt_str, pos_str;
  string typ_str, idt_str, pos_str;
  typ_str:=str typ_sfx;
  if typ_str="ilb":
    drv_left_ilb:=check_position_left (pos_sfx, drv_left_ilb);
  elseif typ_str="dlb":
    drv_left_dlb:=check_position_left (pos_sfx, drv_left_dlb);
  elseif typ_str="plb":
    drv_left_plb:=check_position_left (pos_sfx, drv_left_plb);
  else:
    drv_errhelp "Valid identifiers are"&
      " ilb (inference label),"&
      " dlb (delimiter label) and"&
      " plb (phantom steps label).";
    drv_errmessage (typ_str&" is not a valid label-type identifier");
  fi
enddef;

vardef drv_labels_position text ARG=
  drv_labels_position_aux if pair ARG: ARG else: (ilb, ARG) fi;
enddef;

vardef drv_roots_position suffix pos_sfx=
  drv_bot_roots:=check_position_bot (pos_sfx) (drv_bot_roots);
enddef;

vardef drv_axis_reference suffix ref_sfx=
  save ref_str;
  string ref_str;
  ref_str:=str ref_sfx;
  if (ref_str<>"iln") and (ref_str<>"jdg"):
    drv_errhelp "Valid identifiers are"&
      " iln (inference line axis) and"&
      " jdg (judgment math-axis).";
    drv_errmessage (ref_str&" is not a valid reference identifier");
  else:
    drv_axis_ref:=ref_str;
  fi
enddef;

vardef drv_delimiter (suffix pos_sfx) (expr dlm_str)=
  if check_position_left (pos_sfx, true):
    drv_ldlm_str:=dlm_str;
  else:
    drv_rdlm_str:=dlm_str;
  fi
enddef;

vardef drv_left_delimiter expr dlm_str=
  drv_delimiter (l, dlm_str);
enddef;

vardef drv_right_delimiter expr dlm_str=
  drv_delimiter (r, dlm_str);
enddef;

vardef drv_box_mode suffix status_sfx=
  drv_boxmode_on:=check_mode_on (status_sfx, drv_boxmode_on);
enddef;

vardef drv_fraction_mode suffix status_sfx=
  drv_fractionmode_on:=check_mode_on (status_sfx, drv_fractionmode_on);
enddef;

vardef drv_proof_mode suffix status_sfx=
  drv_proofmode_on:=check_mode_on (status_sfx, drv_proofmode_on);
enddef;

vardef drv_labels_mode (suffix typ_sfx, status_sfx)=
  save typ_str, idt_str, pos_str;
  string typ_str, idt_str, pos_str;
  typ_str:=str typ_sfx;
  if typ_str="ilb":
    drv_ilb_on:=check_mode_on (status_sfx, drv_ilb_on);
  elseif typ_str="dlb":
    drv_dlb_on:=check_mode_on (status_sfx, drv_dlb_on);
  elseif typ_str="plb":
    drv_plb_on:=check_mode_on (status_sfx, drv_plb_on);
  else:
    drv_errhelp "Valid identifiers are"&
      " ilb (inference label),"&
      " dlb (delimiter label) and"&
      " plb (phantom steps label).";
    drv_errmessage (typ_str&" is not a valid label-type identifier");
  fi
enddef;

vardef drv_radial_mode suffix status_sfx=
  drv_radialmode_on:=check_mode_on (status_sfx, drv_radialmode_on);
enddef;

vardef drv_azimuth expr ngl=
  azimuth_ngl:=ngl;
enddef;


%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
%
% Default settings
%

drv_font_size "\normalsize";
drv_math_style (drv, "\displaystyle");
drv_math_style (jdg, "\textstyle");
drv_math_style (ilb, "\scriptstyle");
drv_math_style (dlb, "\textstyle");
drv_math_style (plb, "\textstyle");
drv_scale (clr, 1);
drv_scale (prm, 1);
drv_scale (jdg, 1);
drv_scale (ilb, 1);
drv_junction_style 1;
drv_alignment_style c;
drv_path_style (iln, 1);
drv_path_style (phm, 3);
drv_labels_position (ilb, r);
drv_labels_position (dlb, l);
drv_labels_position (plb, l);
drv_roots_position b;
drv_axis_reference iln;
drv_left_delimiter "\lbrace";
drv_right_delimiter "\rbrace";
drv_box_mode off;
drv_fraction_mode on;
drv_proof_mode off;
drv_labels_mode (ilb, on);
drv_labels_mode (dlb, on);
drv_labels_mode (plb, on);

drv_radial_mode off;
drv_scale (crv, 1);
drv_azimuth 90;


%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
%
% LaTeX inclusion macro
%
% \drv includes a picture file in such a way that the baseline of the included
% picture coincides with the baseline of the inclusion point. The code for \drv
% was suggested by Josselin Noirel on the fr.comp.text.tex usenet group.
%
% \usepackage{graphicx}
% \makeatletter
% \def\Gin@def@bp#1\relax#2#3{\gdef#2{#3}}
% \newsavebox{\graphicsbox}
% \newcommand*{\drv}[1]{%
% \sbox{\graphicsbox}{\includegraphics{#1}}%
% \raisebox{\Gin@lly bp}%
% {\usebox{\graphicsbox}}}
% \makeatother

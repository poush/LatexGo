%%
%% This is file `roundrect.mp',
%% generated with the docstrip utility.
%%
%% The original source files were:
%%
%% roundrect.dtx  (with options: `package')
%% This is a generated file.
%% 
%% This document is copyright 2015 by Donald P. Goodman, and is
%% released publicly under the LaTeX Project Public License.  The
%% distribution and modification of this work is constrained by the
%% conditions of that license.  See
%% http://www.latex-project.org/lppl.txt
%% for the text of the license.  This document is released
%% under version 1.3 of that license, and this work may be distributed
%% or modified under the terms of that license or, at your option, any
%% later version.
%% 
%% This work has the LPPL maintenance status 'maintained'.
%% 
%% The Current Maintainer of this work is Donald P. Goodman
%% (dgoodmaniii@gmail.com).
%% 
%% This work consists of the files roundrect.dtx and
%% roundrect.ins, along with the generated file roundrect.mp
%% and roundrect.pdf, and the README.

input TEX;
color rrinnercolor; rrinnercolor := white;
numeric rrtoprtborderrad; rrtoprtborderrad := 40pt;
numeric rrbotrtborderrad; rrbotrtborderrad := 40pt;
numeric rrbotlftborderrad; rrbotlftborderrad := 40pt;
numeric rrtoplftborderrad; rrtoplftborderrad := 40pt;
numeric rrtextwd; rrtextwd := 0;
numeric rrshadowx; rrshadowx := rrbotrtborderrad/4;
numeric rrshadowy; rrshadowy := -rrbotrtborderrad/4;
string rrtextfont; rrtextfont := "\fontsize{10pt}{12pt}\selectfont ";
color rrtextcolor; rrtextcolor := black;
string rrbodytext; rrbodytext := "";
string rrtextalign; rrtextalign := "\centering";
string rrusepackage; rrusepackage := "";
boolean rrnotop; rrnotop := false;
boolean rrnobot; rrnobot := false;
boolean rrnolft; rrnolft := false;
boolean rrnort; rrnort := false;
boolean rrdropshadow; rrdropshadow := false;
color rrtopbordercolor; rrtopbordercolor := black;
color rrbotbordercolor; rrbotbordercolor := black;
color rrlftbordercolor; rrlftbordercolor := black;
color rrrtbordercolor; rrrtbordercolor := black;
color rrshadowcolor; rrshadowcolor := black;
def rrbordercolor(expr x) =
rrtopbordercolor := x;
rrbotbordercolor := x;
rrlftbordercolor := x;
rrrtbordercolor := x;
enddef;
def rrborderrad(expr x) =
rrtoplftborderrad := x;
rrbotlftborderrad := x;
rrtoprtborderrad := x;
rrbotrtborderrad := x;
enddef;
pen rrtopborderpen; rrtopborderpen := pencircle scaled 1.5;
pen rrbotborderpen; rrbotborderpen := pencircle scaled 1.5;
pen rrlftborderpen; rrlftborderpen := pencircle scaled 1.5;
pen rrrtborderpen; rrrtborderpen := pencircle scaled 1.5;
def rrborderpen(expr x) =
rrtopborderpen := x;
rrbotborderpen := x;
rrlftborderpen := x;
rrrtborderpen := x;
enddef;
def rrrestorevals =
rrborderrad(40pt);
rrbordercolor(black);
rrborderpen(pencircle scaled 1.5);
rrinnercolor := white;
rrnotop := false;
rrnobot := false;
rrnolft := false;
rrnort := false;
rrtextwd := 0;
rrtextfont := "\fontsize{10pt}{12pt}\selectfont ";
rrtextcolor := black;
rrbodytext := "";
rrtextalign; rrtextalign := "\centering";
rrdropshadow := false;
rrshadowcolor := black;
rrshadowx := rrbotrtborderrad/4;
rrshadowy := -rrbotrtborderrad/4;
enddef;
def roundrect(expr rrht, rrwd)(suffix name) =
TEXPRE("%&latex" & char(10) & "\documentclass{article}" & rrusepackage & "\begin{document}");
TEXPOST("\end{document}");
if (rrtextwd = 0):
rrtextwd := rrwd - 12pt;
fi
path rra; path rrb; path rrc; path rrd;
pair a; pair b; pair c; pair d;
a := (0,0) shifted (-rrwd/2,-rrht/2);
b := (0,0) shifted (rrwd/2,-rrht/2);
c := (0,0) shifted (rrwd/2,rrht/2);
d := (0,0) shifted (-rrwd/2,rrht/2);
rra := fullcircle scaled rrbotlftborderrad shifted (xpart a +
(rrbotlftborderrad/2),ypart a + (rrbotlftborderrad/2));
rrb := fullcircle scaled rrbotrtborderrad shifted (xpart b -
(rrbotrtborderrad/2),ypart b + (rrbotrtborderrad/2));
rrd := fullcircle scaled rrtoplftborderrad shifted (xpart d +
(rrtoplftborderrad/2),ypart d - (rrtoplftborderrad/2));
rrc := fullcircle scaled rrtoprtborderrad shifted (xpart c -
(rrtoprtborderrad/2),ypart c - (rrtoprtborderrad/2));
pair f; f := (a--b) intersectionpoint rra;
pair g; g := (a--b) intersectionpoint rrb;
pair h; h := (b--c) intersectionpoint rrb;
pair i; i := (b--c) intersectionpoint rrc;
pair j; j := (c--d) intersectionpoint rrc;
pair k; k := (c--d) intersectionpoint rrd;
pair l; l := (d--a) intersectionpoint rrd;
pair m; m := (d--a) intersectionpoint rra;
picture name;
picture border;
picture rrtext;
pair n; pair o;
path rrtoplftcorner; path rrbotlftcorner;
path rrtoprtcorner; path rrbotrtcorner;
path rrtopborder; path rrbotborder;
path rrlftborder; path rrrtborder;
rrtoplftcorner := l{up}..{right}k;
rrtoprtcorner := j{right}..{down}i;
rrbotrtcorner := h{down}..{left}g;
rrbotlftcorner := f{left}..{up}m;
rrtopborder := rrtoplftcorner--rrtoprtcorner;
rrbotborder := rrbotrtcorner--rrbotlftcorner;
rrlftborder := rrbotlftcorner--rrtoplftcorner;
rrrtborder := rrtoprtcorner--rrbotrtcorner;
picture rrdropshadowpic;
if (rrdropshadow = true):
rrdropshadowpic := image(fill rrtoplftcorner--rrtoprtcorner--
rrbotrtcorner--rrbotlftcorner--cycle
shifted (rrshadowx,rrshadowy) withcolor
rrshadowcolor);
else:
rrdropshadowpic := currentpicture;
fi
name := currentpicture;
addto name also rrdropshadowpic;
rrdropshadowpic := image(fill rrtoplftcorner--rrtoprtcorner--
rrbotrtcorner--rrbotlftcorner--cycle withcolor
rrinnercolor);
addto name also rrdropshadowpic;
picture rrtmpborder;
border := currentpicture;
if (rrnotop = false):
rrtmpborder := image(draw rrtopborder withcolor
rrtopbordercolor withpen rrtopborderpen);
addto border also rrtmpborder;
fi
if (rrnobot = false):
rrtmpborder := image(draw rrbotborder withcolor
rrbotbordercolor withpen rrbotborderpen);
addto border also rrtmpborder;
fi
if (rrnolft = false):
rrtmpborder := image(draw rrlftborder withcolor
rrlftbordercolor withpen rrlftborderpen);
addto border also rrtmpborder;
fi
if (rrnort = false):
rrtmpborder := image(draw rrrtborder withcolor
rrrtbordercolor withpen rrrtborderpen);
addto border also rrtmpborder;
fi
addto name also border;
rrtext :=
image(label(TEX("\parbox{"&decimal(rrtextwd)&"bp}{"&rrtextalign&rrtextfont&" "&rrbodytext&"}"),(0,0)) withcolor rrtextcolor;);
addto name also rrtext;
enddef;
\endinput
%%
%% End of file `roundrect.mp'.

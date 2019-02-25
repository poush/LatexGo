%%
%% This is file `shapes.mp',
%% generated with the docstrip utility.
%%
%% The original source files were:
%%
%% shapes.dtx  (with options: `package')
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
%% This work consists of the files shapes.dtx and
%% shapes.ins, along with the generated file shapes.mp
%% and shapes.pdf, and the README.

color fracfillcolor; fracfillcolor := red;
pen fraccirclepen; fraccirclepen := pencircle scaled 1.5;
pen fractionpen; fractionpen := pencircle scaled 1;
def fraccirc(suffix x)(expr y) =
radius := 1in;
ticklen := radius/24;
path circ; circ := fullcircle scaled radius;
pair p[]; pair q[]; pair r[]; pair s[];
p[0] := (0,0) shifted (0,radius/2);
q[0] := p[0] shifted (0,ticklen);
r[0] := p[0] shifted (0,-ticklen);
s[0] := r[0];
picture thefrac;
picture addition;
thefrac := image(pickup fraccirclepen; draw circ;);
addition := image(pickup fractionpen; draw p[0]--q[0];);
addto thefrac also addition;
for i=1 upto 12:
p[i] := p[i-1] rotatedaround ((0,0),-30);
q[i] := q[i-1] rotatedaround ((0,0),-30);
addition := image(pickup fractionpen; draw p[i]--q[i];);
addto thefrac also addition;
endfor;
addition := image(pickup fractionpen; draw (0,0)--r[0];);
addto thefrac also addition;
pair t; pair q;
addition := image(
t = r[0] rotatedaround ((0,0),-((360/y)*x)/2);
q = r[0] rotatedaround ((0,0),-((360/y)*x));
fill r[0]--(0,0)--q..t..cycle withcolor fracfillcolor;
draw r[0]--(0,0)--q..t..cycle;
);
addto thefrac also addition;
for i=1 upto y:
r[i] := r[i-1] rotatedaround ((0,0),-(360/y));
s[i] := r[i-1] rotatedaround ((0,0),-(360/y)/2);
addition := image(%
pickup fractionpen;%
draw (0,0)--r[i];
draw r[i-1]..s[i]..r[i];
);
addto thefrac also addition;
endfor;
enddef;
boolean modcircle; modcircle := true;
pen modcirclepen; modcirclepen := pencircle scaled 1;
pen modshapepen; modshapepen := pencircle scaled 1;
boolean modticks; modticks := false;
numeric nummodticks; nummodticks := 12;
numeric ticklen; ticklen := 0.1in;
pen tickpen; tickpen := pencircle scaled 1;
def modstar(expr numpoints,numbers,numstar) =
picture modfigure;
if (modcircle = true):
modfigure := image(draw fullcircle scaled 1in withpen modcirclepen;);
else:
modfigure := image();
fi;
picture modtickpic;
if (modticks = true):
modtickpic := image(
pair tickstart[]; pair tickend[];
tickstart[0] = (0,0) shifted (0,0.5in);
tickend[0] = tickstart[0] shifted (0,ticklen);
draw tickstart[0]--tickend[0] withpen tickpen;
for i=1 upto (nummodticks-1):
tickstart[i] = tickstart[i-1] rotatedaround
((0,0), (360/nummodticks));
tickend[i] = tickend[i-1] rotatedaround
((0,0), (360/nummodticks));
draw tickstart[i]--tickend[i] withpen tickpen;
endfor;
);
addto modfigure also modtickpic;
fi
pickup modshapepen;
pair p[]; pair q[];
picture addition;
p[0] = (0,0.5in);
q[0] = (0,0.6in);
if (numbers = 1):
addition := image(label("0",q[0]));
addto modfigure also addition;
fi
for i=1 upto numpoints:
p[i] = p[i-1] rotatedaround ((0,0),-(360/numpoints));
q[i] = q[i-1] rotatedaround ((0,0),-(360/numpoints));
if (numbers = 1):
if (i <> numpoints):
addition := image(label(decimal i,q[i]));
addto modfigure also addition;
fi
fi
endfor
for i=0 upto numpoints:
if (i < numstar):
addition := image(%
draw p[i]--p[i+numstar];
draw p[i]--p[numpoints - numstar + i];
);
addto modfigure also addition;
elseif (i >= (numstar*2)):
addition := image(draw p[i-numstar]--p[i]);
addto modfigure also addition;
fi
endfor
addto modfigure also addition;
enddef;
def modfig(expr numpoints,numbers) =
picture modfigure;
if (modcircle = true):
modfigure := image(draw fullcircle scaled 1in withpen modcirclepen);
else:
modfigure := image();
fi
picture modtickpic;
if (modticks = true):
modtickpic := image(
pair tickstart[]; pair tickend[];
tickstart[0] = (0,0) shifted (0,0.5in);
tickend[0] = tickstart[0] shifted (0,ticklen);
draw tickstart[0]--tickend[0] withpen tickpen;
for i=1 upto (nummodticks-1):
tickstart[i] = tickstart[i-1] rotatedaround
((0,0), (360/nummodticks));
tickend[i] = tickend[i-1] rotatedaround
((0,0), (360/nummodticks));
draw tickstart[i]--tickend[i] withpen tickpen;
endfor;
);
addto modfigure also modtickpic;
fi
pair p[]; pair q[];
picture addition;
pickup modshapepen;
p[0] = (0,0.5in);
q[0] = (0,0.6in);
if (numbers = 1):
addition := image(label("0",q[0]));
addto modfigure also addition;
fi
for i=1 upto numpoints:
p[i] = p[i-1] rotatedaround ((0,0),-(360/numpoints));
q[i] = q[i-1] rotatedaround ((0,0),-(360/numpoints));
addition := image(draw p[i-1]--p[i]);
addto modfigure also addition;
if (numbers = 1):
if (i <> numpoints):
addition := image(label(decimal i,q[i]));
addto modfigure also addition;
fi
fi
endfor;
enddef;
\endinput
%%
%% End of file `shapes.mp'.

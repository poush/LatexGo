%-*- coding: utf-8 -*-

% Damien Garrigues' ``nomogramme,'' reproduced from:
%
% @Article{garrigues:chronometrie1939,
%   author =       "Damien Garrigues",
%   title =        "{Généralisation de la formule pascale de Gauss: 
%                   Nomogramme du Calendrier perpétuel}",
%   journal =      "Annales françaises de chronométrie",
%   year =         "1939",
%   date =         "1er trimestre 1939",
%   volume =       "",
%   number =       "",
%   pages =        "47-60",
%   month =        "",
%   language =     "french",
% }
% 
%
% Denis Roegel
% 10-11 June 2001: initial version (complete, but not meant to be
%                     described in an article)
%
% 16 October 2008: improved version using latexmp
% 19 October 2008: some changes to make it more logical
%                   (in particular, col4 has been renumbered from the bottom)
% 20-24 October 2008: more changes and restructuration of the code,
%                     improvements in labels and braces
% 3-7 November 2008: addition of the special case of epact 25 which
%                  had previously been forgotten (footnote (a) in
%                  the Easter table area)
%
%
%
% Only part of the ``nomogramme'' is reproduced,
% and this version is not completely identical to the original.
% Some of the idiosyncrasies of the original drawing are difficult
% to reproduce algorithmically and the purpose is not to create an
% exact copy.
%
% It should also be noted that the code is much more complex than
% it needs to be for the pure reproduction of Garrigues' drawing,
% because we wanted in addition to show how the drawing is constructed,
% and provide a number of partial views. As a consequence, the code
% has been broken into many different pieces, and some related pieces
% had to be put in different macros.
%
% For detailed explanations, see the accompanying article.

input latexmp % for flexible latex labels
input rboxes  % for round boxes in column 10

numeric u;
u=1mm;

labeloffset:=7bp;

numeric th_ex;
th_ex=.5pt; % thickness of example dashed lines

% label shifts in column 8:
numeric col_shift_eight_a,col_shift_eight_b;
col_shift_eight_a=6u;
col_shift_eight_b=10u;

def whateverpair=(whatever,whatever) enddef;

% this macro formats the epact so that it fits on two characters
% (using a phantom 0 on the left)
def ep_st(expr i)=
  if i=0: textext("\phantom{0}$\star$")
  elseif i<10:
    textext("\phantom{0}"&decimal(i))
  else:
    textext(decimal(i))
  fi
enddef;

% this macro formats a number on two digits, adding a phantom 0 when
% necessary
def gstring(expr i)=
  if i<10:
    textext("\vphantom{(}\phantom{0}"&decimal(i))
  else:
    textext("\vphantom{(}"&decimal(i))
  fi
enddef;

def gpstring(expr i)=
  if i<10:
    textext("(\phantom{0}"&decimal(i)&")")
  else:
    textext("("&decimal(i)&")")
  fi
enddef;

% this macro adds a label within the Easter area at position (x,y)
def label_easter_slot(expr x,y,lab)=
  label(lab,.5[s[x]r[y],s[x+1]l[y+1]]);
enddef;

% transform 1->A, 2->B, 3->C, 4->D, 5->E, 6->F, 7->G
% for the correct display of the dominical letter
def DL(expr i)=
  char(64+i)
enddef;

% i is the point number in column 2 (1 at the bottom),
% and this macro returns a pair:
%        a) the Golden number associated to this point
%        b) the Julian epact  associated to this point
vardef gn_epact(expr i)=
  save G,JE;
  G=1+((9-11i) mod 19);
  JE=(11G-3) mod 30;
  (G,JE) % value returned
enddef;

% i is the point number in column 2 (1 at the bottom),
% and this macro returns a pair:
%        a) the Golden number associated to this point
%        b) the corresponding point in column 4 (1 at the bottom)
%             (col. 4 = Julian epact)
vardef gn_epactl(expr i)=
  save G,JE,JEL;
  G=1+((9-11i) mod 19);
  JE=(11G-3) mod 30;
  JEL=30-((JE+12) mod 30);
  (G,JEL) % value returned
enddef;

vardef sval(text sec)(text f)=
  save s;string s;
  % we build a string with space-separated values:
  for $=sec:
    if unknown s:
      s=f $;
    else:
      s:=s & " " & f $;
    fi;
  endfor;
  s
enddef;

% draw the values of the Gregorian secular parts in column 8;
% each call corresponds to one line
% i=circle from the bottom (i=1 to 4)
% j=line within the circle (j=1 at the top)
vardef secular_year(expr i,j)(text sec)=
  save vd;
  vd=4u; % vertical shift of the first line
  label(textext(sval(sec)(decimal)) scaled .5,
    col8[2i-1]+(10u,vd-(j-1)*.5vd));  
enddef;

def tddec expr i=
  if i<10: "0" & decimal(i)
  else:
    decimal(i)
  fi
enddef;

% i=box number, from 1 (at the bottom) to 7 (at the top)
% j=1 or 3 (1 for the line at the top of a box, 3 for the line at the bottom)
vardef yn(expr i,j)(text y)=
  save vd;
  vd=2u; % vertical shift of the first line
  label(textext(sval(y)(tddec)) scaled .5,
        col10[i]+(0,vd-(j-1)*vd));  
enddef;

% these numbers always appear at a fixed position:
def yn_left(expr i)(text y)=
  label.rt(textext(sval(y)(tddec)) scaled .5,col10[i]+(-10u,0));  
enddef;

% these numbers always appear at a fixed position:
def yn_right(expr i)(text y)=
  label.lft(textext(sval(y)(tddec)) scaled .5,col10[i]+(10u,0));  
enddef;

% list is a string with comma-separated values
% l is the line number (1 at the bottom)
vardef col_six_f(expr list,l)=
  save n,i;n=0;
  for $=scantokens(list):
    n:=n+1;
  endfor;
  % n is now the number of values in the list
  i=0;
  for $=scantokens(list):
    i:=i+1;
    if n>1:
      % if there is more than 1 value, the extreme values
      % are put at 2u below and above the center,
      % and the other values (if any) are spread evenly
      % in-between
      label(textext(decimal $) scaled .7,
            col6a[l]+(0,-2u+(i-1)*(4u/(n-1))));
    else:
      % if there is only one value, it is centered;
      % there is only one such case
      label(textext(decimal $) scaled .7,col6a[l]);
    fi;
  endfor;
enddef;

vardef col_one_three_f(expr list,l,c)=
  save n,i;n=0;
  for $=scantokens(list):
    n:=n+1;
  endfor;
  i=0;
  for $=scantokens(list):
    i:=i+1;
    label(textext(if c=3: (tddec $) else: decimal $ fi)
          scaled .6,
          col[c][l]+((if c=3: 2.5u else: 2u fi,0)
            rotated (180-(i-1)*360/n)));
  endfor;
enddef;

% variables for the regular columns and circle radiuses
pair col[][],col[]a[];
numeric height;height=150u; % vertical dimension of the drawing
numeric diam[];

% variables for labels
string col[][]st;

% variables for the Easter table:
pair B,C;
pair s[]r[],s[]l[];

% define the points in columns 1-7
vardef define_first_cols=
  save E;
  diam1=(height-18*.5)/18;
  for i:=1 upto 19:
    col1[i]=(0,(i-1)*height/18);
  endfor;
  for i:=1 upto 19:
    col3[i]=(40u,(i-1)*height/18);
  endfor;
  for i:=1 upto 37:
    col2[i]=((xpart(col1[1])+xpart(col3[1]))/2,
             .5*(i-1)*height/18);
  endfor;
  for i:=1 upto 37:
    E:=ypart(gn_epactl(i));
    col4[E]=(60u,(E-1)*height/29);
  endfor;
  for i:=1 upto 30:
    col6[i]=(110u,(i-1)*height/29);
  endfor;
  for i:=1 upto 58:
    col5[i]=((xpart(col4[1])+xpart(col6[1]))/2,.5*(i-1)*height/29);
  endfor;
  for i:=1 upto 30:
    % the circles for column 6 appear alternately
    % on the right and on the left of the center corresponding to col6
    if i mod 2=0:
      col6a[i]=col6[i]-(8u,0);
    else:
      col6a[i]=col6[i]+(8u,0);
    fi;
  endfor;
  for i:=1 upto 30:
    % the values in column 7 are shifted vertically by 20u:
    col7[i]=(130u,20u+(i-1)*(height-20u)/29); 
  endfor;
enddef;

% define strings containing the numbers in the circles of column 1
vardef define_col_one_labels=
  save p;
  for i=0 upto 84: % only S=0 to 84 are considered
    p:=1+(9+3i) mod 19;
    if unknown col1[p]st:
      col1[p]st=decimal(i);
    else:
      col1[p]st
        :=col1[p]st & "," & decimal(i);
    fi;
  endfor;
enddef;

% define strings containing the numbers in the circles of column 3
vardef define_col_three_labels=
  save p;
  for i=0 upto 99:
    p:=1+(15+12i) mod 19;
    if unknown col3[p]st:
      col3[p]st=decimal(i);
    else:
      col3[p]st
        :=col3[p]st & "," & decimal(i);
    fi;
  endfor;
enddef;

% define strings containing the numbers in the circles of column 6
vardef define_col_six_labels=
  save p,M;
  for i=15 upto 84: % all secular parts of column 6
    % find the line number where it goes
    M:=(15+i-floor(i/4)-floor((8i+13)/25)) mod 30;
    p:=1+(M+21) mod 30;
    if unknown col6[p]st:
      col6[p]st=decimal(i);
    else:
      col6[p]st:=col6[p]st & "," & decimal(i);
    fi;
  endfor;
enddef;

def draw_col_one_points=
  for i:=1 upto 19:
    drawdot col1[i];
  endfor;
enddef;

def draw_col_two_points=
  for i:=1 upto 37:
    drawdot col2[i];
  endfor;
enddef;

def draw_col_three_points=
  for i:=1 upto 19:
    drawdot col3[i];
  endfor;
enddef;

vardef draw_col_four_points=
  save GNE;pair GNE;
  for i:=1 upto 37:
    GNE:=whateverpair;GNE=gn_epactl(i);
    drawdot col4[ypart(GNE)];
  endfor;
enddef;

def draw_col_five_points=
  for i:=1 upto 58:
    drawdot col5[i];
  endfor;
enddef;

def draw_col_six_points=
  for i:=1 upto 30:
    drawdot col6[i];
  endfor;
enddef;

def draw_col_seven_points=
  for i:=1 upto 30:
    drawdot col7[i];
  endfor;
enddef;

def draw_col_eight_points=
  for i=1 upto 7:
    drawdot col8[i];
  endfor;
enddef;

def draw_col_nine_points=
  for i=1 upto 13:
    drawdot col9[i];
  endfor;
enddef;

def draw_col_ten_points=
  for i=1 upto 7:
    drawdot col10[i];
  endfor;
enddef;

def draw_col_eleven_points=
  for i=1 upto 7:
    drawdot col11[i];
  endfor;
enddef;

vardef draw_block_one_points=
  save oldpen;
  oldpen=savepen;
  pickup pencircle scaled 2pt;
  draw_col_one_points;
  draw_col_two_points;
  draw_col_three_points;
  pickup oldpen;
enddef;

vardef draw_block_two_points=
  save oldpen;
  oldpen=savepen;
  pickup pencircle scaled 2pt;
  draw_col_two_points;
  %draw_col_three_points;
  draw_col_four_points;
  pickup oldpen;
enddef;

vardef draw_block_three_points=
  save oldpen;
  oldpen=savepen;
  pickup pencircle scaled 2pt;
  draw_col_four_points;
  draw_col_five_points;
  draw_col_six_points;
  pickup oldpen;
enddef;

vardef draw_block_four_points=
  save oldpen;
  oldpen=savepen;
  pickup pencircle scaled 2pt;
  draw_col_five_points;
  %draw_col_six_points;
  draw_col_seven_points;
  pickup oldpen;
enddef;

vardef draw_block_five_points=
  save oldpen;
  oldpen=savepen;
  pickup pencircle scaled 2pt;
  draw_col_eight_points;
  draw_col_nine_points;
  draw_col_ten_points;
  pickup oldpen;
enddef;

vardef draw_block_six_points=
  save oldpen;
  oldpen=savepen;
  pickup pencircle scaled 2pt;
  %draw_col_eight_points;
  draw_col_nine_points;
  draw_col_eleven_points;
  pickup oldpen;
enddef;

vardef draw_block_seven_points=
  save oldpen;
  oldpen=savepen;
  pickup pencircle scaled 2pt;
  draw_col_seven_points;
  draw_col_eleven_points;
  pickup oldpen;
enddef;

% draw the various points in the columns:
vardef draw_all_points=
  save oldpen;
  oldpen=savepen;
  pickup pencircle scaled 2pt;
  draw_block_one_points;
  draw_block_three_points;
  draw_block_five_points;
  draw_block_seven_points;
  pickup oldpen;
enddef;

vardef draw_block_two_connections=
  for i:=1 upto 37:
    draw col2[i]--col4[ypart(gn_epactl(i))];
  endfor;
enddef;

def draw_block_four_connections=
  for i:=1 upto 58:
    draw col5[i]--col7[1+((i-1) mod 30)];
  endfor;
enddef;

def draw_block_six_connections=
  for i=1 upto 13:
    draw col9[i]--col11[1+(13-i) mod 7];
  endfor;
enddef;

% draw the lines connecting the points
def draw_all_connections=
  draw_block_two_connections;  
  draw_block_four_connections;
  draw_block_six_connections;
enddef;

% connecting the secular part to the last two digits of the year:
vardef draw_block_one_example=
  save oldpen;
  oldpen=savepen;
  draw col1[10]--col3[9] withcolor white; % erasing the old connection
  pickup pencircle scaled th_ex;
  draw col1[10]--col3[9] dashed evenly;
  pickup oldpen;
enddef;

% connecting the Golden number to the Julian epact:
vardef draw_block_two_example=
  save oldpen;
  oldpen=savepen;
  draw col2[18]--col4[29] withcolor white; % erasing the old connection
  pickup pencircle scaled th_ex;
  draw col2[18]--col4[29] dashed evenly;
  pickup oldpen;
enddef;

% connecting the Julian epact to M:
vardef draw_block_three_example=
  save oldpen;
  oldpen=savepen;
  draw col4[29]--col6[16] withcolor white; % erasing the old connection
  pickup pencircle scaled th_ex;
  draw col4[29]--col6[16] dashed evenly;
  pickup oldpen;
enddef;

% connecting the Gregorian epacts:
vardef draw_block_four_example=
  save oldpen;
  oldpen=savepen;
  draw col5[44]--col7[14] withcolor white; % erasing the old connection
  pickup pencircle scaled th_ex;
  draw col5[44]--col7[14] dashed evenly;
  pickup oldpen;
enddef;

% connecting the secular part of the year to the
% last two digits, in order to obtain the dominical letter:
vardef draw_block_five_example=
  save oldpen;
  oldpen=savepen;
  draw col8[7]--col10[5] withcolor white; % erasing the old connection
  pickup pencircle scaled th_ex;
  draw col8[7]--col10[5] dashed evenly;
  pickup oldpen;
enddef;

% connecting the dominical letters together:
vardef draw_block_six_example=
  save oldpen;
  oldpen=savepen;
  draw col9[11]--col11[3] withcolor white; % erasing the old connection
  pickup pencircle scaled th_ex;
  draw col9[11]--col11[3] dashed evenly;
  pickup oldpen;
enddef;

vardef draw_block_seven_example=
  save oldpen;
  oldpen=savepen;
  pickup pencircle scaled th_ex;
  % connecting all Easter dates with the same dominical letter A:
  draw col11[3]--C dashed evenly;
  % connecting all Easter dates with the same Gregorian epact value:
  draw col7[14]--B dashed evenly;
  % showing the Easter date:
  pickup pencircle scaled 3pt;
  draw (col11[3]--C) intersectionpoint (col7[14]--B);
  pickup oldpen;
enddef;

% example for 1939:
def draw_all_example=
  draw_block_one_example;
  draw_block_two_example;
  draw_block_three_example;
  draw_block_four_example;
  draw_block_five_example;
  draw_block_six_example;
  draw_block_seven_example;
enddef;

def draw_dbl_circle(expr da,db,c) text options=
  unfill fullcircle scaled db shifted c;
  draw fullcircle scaled db shifted c;
  draw fullcircle scaled da shifted c options;
enddef;

% circles in column 1:
def draw_col_one_circles=
  for i:=1 upto 19:
    draw_dbl_circle(.9diam1,diam1,col1[i]);
  endfor;
enddef;

% extra labels for block one:
def draw_col_one_circle_labels=
  for i:=1 upto 19:
    label.lft(textext(decimal((4+8*(i-1)) mod 19)),col1[i]+7u*left);
  endfor;
enddef;

% circles in column 3:
def draw_col_three_circles=
  for i:=1 upto 19:
    % this produces a simple circle:
    draw_dbl_circle(diam1,diam1,col3[i]);
  endfor;
enddef;

% extra labels for block one:
def draw_col_three_circle_labels=
  for i:=1 upto 19:
    label.lft(textext(decimal((13+8*(i-1)) mod 19)),col3[i]+13u*right);
  endfor;
enddef;

def draw_col_six_circles=
  % circles around column 6:
  for i:=1 upto 30:
    draw_dbl_circle(.9diam1,diam1,col6a[i]);
  endfor;
  % special case of the Julian calendar:
  draw_dbl_circle(.9diam1,diam1,col6[7]-(17u,0)) dashed evenly;
  drawarrow (col6[7]-(17u,0))--col6[7]
       cutbefore (fullcircle scaled diam1 shifted (col6[7]-(17u,0)));
  label(textext("\vbox{\halign{\hfil#\hfil\cr Jul.\cr Cal.\cr}}") scaled .7,
         col6[7]-(17u,0));
enddef;

% circles around column 8:
def draw_col_eight_circles=
  for i=1 upto 7:
    draw_dbl_circle(.9diam2,diam2,col8[i]-(col_shift_eight_a,0));    
    if i mod 2=1:
      draw_dbl_circle(.9diam3,diam3,col8[i]+(col_shift_eight_b,0));  
    fi;
  endfor;
enddef;

def draw_block_one_circles=
  draw_col_one_circles;
  draw_col_one_circle_labels;
  draw_col_three_circles;
  draw_col_three_circle_labels;
enddef;

def draw_block_two_circles=
  draw_col_three_circles;
enddef;

def draw_block_three_circles=
  draw_col_six_circles;
enddef;

def draw_block_four_circles=
  draw_col_six_circles;
enddef;

def draw_block_five_circles=
  draw_col_eight_circles;
enddef;

def draw_block_six_circles=
  draw_col_eight_circles;
enddef;

def draw_all_circles=
  draw_col_one_circles;
  draw_col_three_circles;
  draw_col_six_circles;
  draw_col_eight_circles;
enddef;

% display values in circles of column 1:
def draw_labels_col_one=
  for i=1 upto 19:
    col_one_three_f(col1[i]st,i,1);
  endfor;
  label(textext("I"),col1[1]-(0,10u));
  label(textext("$S$") scaled 1.5,col1[19]+(col1[19]-col1[18]));
enddef;

def draw_labels_col_two_a=
  label(textext("II"),col2[1]-(0,10u));
enddef;

% this is an extended display 
vardef draw_labels_col_two_b=
  save GNE;pair GNE;
  for i:=1 upto 37:
    GNE:=whateverpair;GNE=gn_epact(i);
    % some of the values here are written twice, but this causes no harm:
    label.rt(gstring(xpart(GNE)),col2[i]);
    label.lft(gstring(ypart(GNE)),col2[i]);
  endfor;
  label.lft(textext("$E_J$"),col2[37]+(col2[37]-col2[36]));
  label.rt(textext("$G$"),col2[37]+(col2[37]-col2[36]));
enddef;

% this is an extended display 
vardef draw_labels_col_two_c=
  save GNE;pair GNE;
  for i:=1 upto 37:
    GNE:=whateverpair;GNE=gn_epact(i);
    % some of the values here are written twice, but this causes no harm:
    label.lft(gstring(xpart(GNE)),col2[i]+15u*left);
    label.lft(gpstring(ypart(GNE)),col2[i]+5u*left);
  endfor;
  label.lft(textext("$G$"),col2[37]+(col2[37]-col2[36])+15u*left);
  label.lft(textext("$E_J$"),col2[37]+(col2[37]-col2[36])+5u*left);
enddef;

% display values in circles of column 3:
def draw_labels_col_three=
  for i=1 upto 19:
    col_one_three_f(col3[i]st,i,3);
  endfor;
  label(textext("III"),col3[1]-(0,10u));
  label(textext("$A$") scaled 1.5,col3[19]+(col3[19]-col3[18]));
enddef;

vardef draw_labels_col_four_base=
  save GNE;pair GNE;
  for i:=1 upto 37:
    GNE:=whateverpair;GNE=gn_epactl(i);
    % some of the values here are written twice, but this causes no harm:
    label.rt(gstring(xpart(GNE)),col4[ypart(GNE)]);
  endfor;
enddef;

% display labels in column 4 (values of the Golden number)
def draw_labels_col_four_a=
  draw_labels_col_four_base;
  label.lft(textext("IV"),col4[1]-(0,10u));
  label.rt(textext("Gold. N.") rotated 90,col4[1]-(0,10u));
enddef;

def draw_labels_col_four_b=
  draw_labels_col_four_base;
  label(textext("IV"),col4[1]-(0,10u));
enddef;

vardef draw_labels_col_four_c=
  save GNE,GNEL;pair GNE,GNEL;
  for i:=1 upto 37:
    GNEL:=whateverpair;GNEL=gn_epactl(i);
    GNE:=whateverpair;GNE=gn_epact(i);
    label.rt(gpstring(ypart(GNE)),col4[ypart(GNEL)]+5u*right);
  endfor;
  label.rt(textext("$G$"),col4[29]+(col4[29]-col4[28]));
  label.rt(textext("$E_J$"),col4[29]+(col4[29]-col4[28])+5u*right);
enddef;

vardef draw_labels_col_four_d=
  save GNE,GNEL;pair GNE,GNEL;
  for i:=1 upto 37:
    GNEL:=whateverpair;GNEL=gn_epactl(i);
    GNE:=whateverpair;GNE=gn_epact(i);
    label.lft(gstring(xpart(GNEL)),col4[ypart(GNEL)]+8u*left);
    label.lft(gpstring(ypart(GNE)),col4[ypart(GNEL)]);
  endfor;
  label.lft(textext("$G$"),col4[29]+(col4[29]-col4[28])+8u*left);
  label.lft(textext("$E_J$"),col4[29]+(col4[29]-col4[28]));
  label.lft(textext("IV"),col4[1]-(0,10u));
enddef;

def draw_labels_col_five=
  for i=1 upto 58:
    label.lft(ep_st((24-i) mod 30) scaled .7,col5[i]);
  endfor;
  label.lft(textext("$E_G$"),col5[58]+2(col5[58]-col5[57]));
  label(textext("V"),col5[1]-(0,10u));
enddef;

def draw_labels_col_five_a=
  label(textext("V"),col5[1]-(0,10u));
enddef;

% display values in circles of column 6:
def draw_labels_col_six_a=
  for i=1 upto 30:
    col_six_f(col6[i]st,i);
  endfor;
  label(textext("VI"),col6[1]-(0,10u));
  label(textext("$S$") scaled 1.5,col6[30]+2(col6[30]-col6[29]));
enddef;

vardef draw_labels_col_six_b=
  save lo;
  lo=labeloffset;
  labeloffset:=3bp;
  for i=1 upto 30:
    label.rt(gstring((7-i) mod 30) scaled .5,col6[i]);
  endfor;
  labeloffset:=lo;
  label(textext("$15-M$") scaled .7,col6[30]+.5(col6[30]-col6[29])+2u*right);
enddef;

% display values of the Gregorian epact
def draw_labels_col_seven_a=
  for i:=1 upto 30:
    label.rt(ep_st((24-i) mod 30),col7[i]);
  endfor;
  label(textext("VII"),col7[1]-(0,20u));
  label.rt(textext("Epact:") rotated 90,col7[1]-(0,10u));
enddef;

def draw_labels_col_seven_b=
  draw_labels_col_seven_a;
  label.rt(textext("$E_G$"),col7[30]+(col7[30]-col7[29]));
enddef;

def draw_labels_col_seven_c=
  for i:=1 upto 30:
    label.lft(ep_st((24-i) mod 30),col7[i]);
  endfor;
  label.lft(textext("$E_G$"),col7[30]+2(col7[30]-col7[29]));
  label(textext("VII"),col7[1]-(0,20u));
  label.lft(textext("Epact:") rotated 90,col7[1]-(0,10u));
enddef;

def draw_block_one_labels=
  draw_labels_col_one;
  draw_labels_col_two_a;
  draw_labels_col_three;
enddef;

def draw_block_two_labels=
  draw_labels_col_two_a;
  draw_labels_col_four_b;
enddef;

def draw_block_three_labels=
  draw_labels_col_four_d;
  draw_labels_col_five;
  draw_labels_col_six_a;
  draw_labels_col_six_b;
enddef;

def draw_block_four_labels=
  draw_labels_col_five;
  draw_labels_col_seven_b;
enddef;

% draw the labels in columns 1-7
def draw_first_labels=
  draw_labels_col_one;
  draw_labels_col_three;
  draw_labels_col_four_a;
  draw_labels_col_five_a;
  draw_labels_col_six_a;
  draw_labels_col_seven_a;
enddef;

def define_corners=
  corner1=whatever[col7[0],B]
         =C+whatever*up;
  corner3=.3[B,col7[31]]; % can be positioned freely
  corner2=(C--corner3) intersectionpoint (B--corner1);
  corner4=whatever[B,col7[31]]
         =C+whatever*up;
enddef;

vardef define_easter_table=
  save corner,p;
  pair corner[];
  % B and C can be positioned freely:
  C=(xpart(col7[1])+10u,-10u);
  B=(xpart(C)+150u,ypart(col7[5]));
  % we define two additional points in column 7,
  % one above the 30th, and one below the first:
  col7[1]-col7[0]=col7[31]-col7[30]=col7[2]-col7[1];
  % these four corners define the shape of area XI:
  define_corners;
  % area XI is divided into 8 slices (9 boundaries,
  % only 8 of which are drawn)
  for i=1 upto 9:
    s[i]l0=s[i]r0=(((i-1)/8))[corner4,corner3];
    s[i]l5=s[i]r5
      =whatever[corner1,corner2]=whatever[s[i]l0,C];
  endfor;
  % each of the eight slices is itself divided four times:  
  for i=1 upto 8: % i varies on the ``vertical lines,''
    % from left to right; 8 vertical lines enclose the
    % 35 easter slots;
    for j=1 upto 4: % j varies on the horizontal inner divisions
      p:=30-i-(j-1)*7;
      % from top to bottom
      if i<8:
        % division leaving to the right of vertical line i
        s[i]r[j]=(s[i]l0--s[i]l5)
          intersectionpoint (B--.5[col7[p],col7[p-1]]);
      fi;
      if i>1:
        % division leaving to the left of vertical line i
        s[i]l[j]=(s[i]l0--s[i]l5)
                        intersectionpoint
                     (B--.5[col7[p+1],col7[p]]);
      fi;
    endfor;
  endfor;
enddef;

% draw points B and C
vardef draw_B_and_C=
  save oldpen;
  oldpen=savepen;
  draw_dbl_circle(.8*3u,3u,B);
  draw_dbl_circle(.8*3u,3u,C);
  pickup pencircle scaled 2pt;
  drawdot B;drawdot C;
  pickup oldpen;
  label.ulft(textext("$B$"),B);
  label.ulft(textext("$C$"),C);
enddef;

% draw the slices in the Easter table:
vardef draw_easter_table_slices=
  save oldpen;
  oldpen=savepen;
  for i=1 upto 8:
    draw s[i]l0--s[i]l5;
  endfor;
  draw s8l5--s8l0--s1l0--s1l5--cycle;
  for i=1 upto 7:
    for j=1 upto 4:
      draw s[i]r[j]--s[i+1]l[j];
    endfor;
  endfor;
  pickup pencircle scaled 2pt;
  % March/April divisions:
  draw s8l3--s7r3--s7l3--s6r3--s6l3--s5r3--
       s5l4--s4r4--s4l4--s3r4--s3l4--
       s2r4--s2l4--s1r4;
  pickup oldpen;
enddef;

vardef draw_arrow_label@#(expr lab,c,s)=
  save oldpen;
  oldpen=savepen;
  pickup pencircle scaled 2pt;
  draw (c);
  pickup oldpen;
  drawarrow (c+s)--(c+u*unitvector(s));
  label@#(lab,c+s);
enddef;


vardef draw_easter_table_details=
  save corner;
  pair corner[];
  define_corners;
  draw_arrow_label.top(textext("\tt corner4"),corner4,(0,10u));
  draw_arrow_label.urt(textext("\tt corner3"),corner3,10u*dir(20));
  draw_arrow_label.lrt(textext("\tt corner2"),corner2,10u*dir(-20));
  draw_arrow_label.llft(textext("\tt corner1"),corner1,25u*dir(-132));

  draw_arrow_label.top(textext("\tt s2l0"),s[2]l[0],30u*dir(80));
  draw_arrow_label.rt(textext("\tt s2r0"),s[2]r[0],40u*dir(10));
  draw_arrow_label.top(textext("\tt s4l0"),s[4]l[0],12u*dir(90));
  draw_arrow_label.rt(textext("\tt s4r0"),s[4]r[0],20u*dir(5));
  draw_arrow_label.lrt(textext("\tt s7l3"),s[7]l[3],40u*dir(-10));
  draw_arrow_label.lrt(textext("\tt s7r3"),s[7]r[3],40u*dir(-40));
  draw_arrow_label.rt(textext("\tt s7r2"),s[7]r[2],60u*dir(5));
  
  draw corner1--corner2 dashed evenly;
  draw corner4--corner3 dashed evenly;
  draw corner2--corner3 dashed evenly;
enddef;

% draw the labels in the Easter table:
vardef draw_easter_table_labels=
  save laban,march,april,sl,j;
  string march,april;
  for i=1 upto 35: % 35 dates from March 22 till April 25
    sl:=1+(7-(i mod 7)) mod 7;
    j:=4-floor((i-1)/7);
    label_easter_slot(sl,j,textext(if i=35:"25 (a)" else:
                                   decimal(if i>10:i-10 else: i+21 fi) fi)
                           if i<8: scaled .7 fi);
  endfor;
  laban=angle(s8l0-s8l5);
  march="$\underbrace{\kern"
           & decimal(arclength(s8l3--s8l5)-5)
           & "bp}_{\hbox{MARCH}}$";
  april="$\underbrace{\kern"
           & decimal(arclength(s8l0--s8l3)-5)
           & "bp}_{\hbox{APRIL}}$";
  label(textext(march) rotated laban,
    .5[s8l3,s8l5]+3u*unitvector((s8l0-s8l5) rotated -90));
  label(textext(april) rotated laban,
    .5[s8l0,s8l3]+3u*unitvector((s8l0-s8l5) rotated -90));
enddef;

def draw_easter_table=
  draw_easter_table_slices;  
  draw_B_and_C;
  draw_easter_table_labels;
enddef;

vardef define_dominical_letters=
  save shift;
  pair shift;
  shift=(3u,3u);
  for i=1 upto 8:
    col11[i]=whatever[C,.5[s[i]r0,s[i+1]l0]]
            =whatever[s1r0+shift,s8l0+shift];
  endfor;
enddef;

def draw_labels_col_eleven=
  for i=1 upto 7:
    label.ulft(textext(DL(1+(10-i) mod 7)),col11[i]);
  endfor;
  label(textext("XI") rotated (angle(s1r0-s8l0)-90),
        .6[col11[8],col11[7]]);
enddef;

% define columns 8-11
def define_last_cols=
  diam2=7u;
  diam3=13u;
  for i=1 upto 7:
    col8[i]=s8l0+(15u,10u+(i-1)*ypart(s1l0-s8l0)/7);
    col10[i]=col8[i]+(50u,0);
  endfor;
  for i=1 upto 13:
    col9[i]=(xpart(col8[1]+col10[1])/2,
             ypart(col8[1])+(i-1)*(ypart(col8[7]-col8[1]))/12);
  endfor;
  define_dominical_letters;
enddef;

vardef draw_labels_col_eight_julian=
  save v;
  for i=1 upto 7:
    for j=1 upto 3:
      v:=((4+i) mod 7)+(j-1)*7;
      label(textext(decimal(v)) scaled .5,
            col8[i]-(col_shift_eight_a,0)
              +((0,1.4u) rotated ((j-1)*120)));
    endfor;
  endfor;
enddef;

def draw_labels_col_eight_gregorian=
  % the following lines could be parameterized, but it's not worth it
  secular_year(1,1)(16,20,24);
  secular_year(1,2)(28,32,36,40);
  secular_year(1,3)(44,48,52,56);
  secular_year(1,4)(60,64,68,72);
  secular_year(1,5)(76,80,84);

  secular_year(2,1)(17,21);
  secular_year(2,2)(25,29,33,37);
  secular_year(2,3)(41,45,49,53);
  secular_year(2,4)(57,61,65,69);
  secular_year(2,5)(73,77,81);

  secular_year(3,1)(18,22);
  secular_year(3,2)(26,30,34,38);
  secular_year(3,3)(42,46,50,54);
  secular_year(3,4)(58,62,66,70);
  secular_year(3,5)(74,78,82);

  secular_year(4,1)(15,19,23);
  secular_year(4,2)(27,31,35,39);
  secular_year(4,3)(43,47,51,55);
  secular_year(4,4)(59,63,67,71);
  secular_year(4,5)(75,79,83);
enddef;

vardef draw_labels_col_ten=
  save rbr;
  rbr=rbox_radius;
  rbox_radius:=15pt;
  for i=1 upto 7:
    rboxit.rb[i]("");
    rb[i].c=col10[i];
    rb[i].dx=9u;rb[i].dy=3.3u;
    unfill bpath(rb[i]);
    drawboxes(rb[i]);
  endfor;
  rbox_radius:=rbr;
  
  yn(1,1)(3,8,14,25,31);
  yn_left(1)(36,42);yn_right(1)(53,59);
  yn(1,3)(64,70,81,87,92,98);

  yn(2,1)(2,13,19,24,30);
  yn_left(2)(41,47);yn_right(2)(52,58);
  yn(2,3)(69,75,80,86,97);

  yn(3,1)(1,7,12,18,29);
  yn_left(3)(35,40);yn_right(3)(46,57);
  yn(3,3)(63,68,74,85,91,96);

  yn(4,1)(0,6,17,23,28);
  yn_left(4)(34,45);yn_right(4)(51,56);
  yn(4,3)(62,73,79,84,90);

  yn(5,1)(5,11,16,22,33);
  yn_left(5)(39,44);yn_right(5)(50,61);
  yn(5,3)(67,72,78,89,95);

  yn(6,1)(4,10,21,27,32);
  yn_left(6)(38,49);yn_right(6)(55,60);
  yn(6,3)(66,77,83,88,94);

  yn(7,1)(9,15,20,26,37);
  yn_left(7)(43,48);yn_right(7)(54,65);
  yn(7,3)(71,76,82,93,99);

  label(textext("X"),col10[1]-(0,10u));
  label(textext("$A$") scaled 1.5,col10[7]+2(col8[7]-col8[6]));
enddef;

def draw_labels_col_ten_a=
  draw_labels_col_ten;
  for i=1 upto 7:
    label.rt(textext(decimal((i+3) mod 7)),col10[i]+10u*right);    
  endfor;
enddef;

def draw_labels_col_eight_a=
  draw_labels_col_eight_julian;
  draw_labels_col_eight_gregorian;
  label(textext("VIII"),col8[1]-(0,10u));
  label(textext("J.C.") scaled 1.5,
        col8[7]+(-col_shift_eight_a,0)+(col8[7]-col8[6]));
  label(textext("G.C.") scaled 1.5,
        col8[7]+(col_shift_eight_b,0)+(col8[7]-col8[6]));
enddef;

def draw_labels_col_eight_b=
  for i=1 upto 7:
    label.top(decimal(i-1),col8[i]);
  endfor;
enddef;

def draw_labels_col_nine=
  for i=1 upto 13:
    label.rt(textext(DL(1+(3+i) mod 7)),col9[i]);
  endfor;
  label(textext("IX"),col9[1]-(0,10u));
  label.rt(textext("Dom. L.") rotated 90,col9[1]-(0,10u));
enddef;

def draw_labels_col_nine_a=
  for i=1 upto 13:
    label.rt(textext(DL(1+(3+i) mod 7)
        & " ("&decimal((i+3) mod 7)&")"),col9[i]);
  endfor;
  label(textext("IX"),col9[1]-(0,10u));
  label.rt(textext("Dom. L.") rotated 90,col9[1]-(0,10u));
enddef;

def draw_block_five_labels=
  draw_labels_col_eight_a;
  draw_labels_col_eight_b;
  draw_labels_col_nine_a;
  draw_labels_col_ten_a;
enddef;

def draw_block_six_labels=
  draw_labels_col_nine;
  draw_labels_col_eleven;
enddef;

def draw_block_seven_labels=
  draw_labels_col_seven_c;
  draw_labels_col_eleven;
enddef;

def draw_all_labels=
  draw_first_labels;
  draw_labels_col_eight_julian;
  draw_labels_col_eight_gregorian;
  label(textext("VIII"),col8[1]-(0,10u));
  draw_labels_col_nine;
  draw_labels_col_ten;
  draw_labels_col_eleven;
enddef;

def draw_block_one_brace=
  label(textext("$\overbrace{\kern85bp}^{\hbox{Year}}$") scaled 1.5,
        col2[37]+4(col2[37]-col2[36]));
enddef;

def draw_col_eight_brace=
  label(textext("$\overbrace{\kern50bp}^{\hbox{$S$}}$") scaled 1.5,
        col8[7]+2(col8[7]-col8[6])+(.5(col_shift_eight_b-col_shift_eight_a),0));
enddef;

def draw_block_five_braces=
  draw_col_eight_brace;
  label(textext("$\overbrace{\kern100bp}^{\hbox{Year}}$") scaled 1.5,
        col9[13]+6(col9[13]-col9[12])
            +(.25(col_shift_eight_b-col_shift_eight_a),0));
enddef;

def draw_block_six_brace=
  draw_col_eight_brace;
enddef;

def draw_all_braces=
  draw_block_one_brace;
  draw_block_five_braces;
enddef;

def draw_block_one=
  draw_block_one_example;
  draw_block_one_circles;
  draw_block_one_points; % after the circles
  draw_block_one_labels;
  draw_block_one_brace;
  draw_labels_col_two_b;
enddef;

def draw_block_two=
  draw_block_two_connections;
  draw_block_two_example;
  draw_block_two_points; % after the circles
  draw_block_two_labels;
  draw_labels_col_four_c;
  draw_labels_col_two_c;
enddef;

def draw_block_three=
  draw_block_three_example;
  draw_block_three_circles;
  draw_block_three_points; % after the circles
  draw_block_three_labels;
enddef;

def draw_block_four=
  draw_block_four_connections;
  draw_block_four_example;
  draw_block_four_points; % after the circles
  draw_block_four_labels;
enddef;

def draw_block_five=
  draw_block_five_example;
  draw_block_five_circles;
  draw_block_five_labels;
  draw_block_five_points; % must be after the labels
  draw_block_five_braces;
enddef;

def draw_block_six=
  draw_block_six_connections;  
  draw_block_six_example;
  draw_block_six_points; % after the example
  draw_block_six_labels;
enddef;

def draw_block_seven=
  draw_block_seven_example;
  draw_easter_table; % after the example
  draw_block_seven_labels;
  draw_block_seven_points; % after the example
  draw_easter_table_details;
enddef;

define_first_cols;
define_easter_table;
define_last_cols;
define_col_six_labels;
define_col_one_labels;
define_col_three_labels;

beginfig(1);
  draw_all_connections;
  draw_all_example;
  draw_easter_table;
  label(textext("\footnotesize "&
                "\parbox{4cm}{\raggedright "&
                    "Note (a). The Gregorian years which have " &
                    "epact $=$ 25, dominical letter $=$ C, and " &
                    "Golden Number $>$ 11 have their Easter on " &
                    "April 18 instead of April 25. The only such " &
                    "years are 1954, 2049, 2106, 3165, 3260, 3317, "&
                    "3852, 3909, 4004, 6399, etc." &
                "}"),C+35u*right);

  draw_all_circles;
  draw_all_labels;
  draw_all_points; % after the circles and the labels
  draw_all_braces;
endfig;

beginfig(11);
  draw_block_one;
endfig;

beginfig(12);
  draw_block_two;
endfig;

beginfig(13);
  draw_block_three;
endfig;

beginfig(14);
  draw_block_four;
endfig;

beginfig(15);
  draw_block_five;
endfig;

beginfig(16);
  draw_block_six;
endfig;

beginfig(17);
  draw_block_seven;
endfig;

beginfig(21);
  numeric v,w,last;
  v=10u;
  w=20u;
  last=5;
  pair P[],Q[],R[];
  pickup pencircle scaled 2pt;
  for i=0 upto last:
    P[i]=(0,i*v);draw P[i];
    Q[i]=(2w,i*v);draw Q[i];
  endfor;
  for i=0 upto 2last:
    R[i]=(w,i*v/2);draw R[i];
  endfor;
  pickup pencircle scaled .5;

  label.bot(textext("$p_i$"),P0);
  label.bot(textext("$q_i$"),Q0);
  label.bot(textext("$r_i$"),R0);
  draw P2--Q3;
  for i=0 upto 5:
    label.lft(textext(decimal i) scaled .7,P[i]);
  endfor;
  for i=0 upto 5:
    label.rt(textext(decimal i) scaled .7,Q[i]);
  endfor;
  for i=0 upto 4:
    label.rt(textext(decimal i) scaled .7,R[i]);
  endfor;
  unfill bbox(thelabel.rt(textext("5") scaled .7,R5));
  label.rt(textext("5") scaled .7,R5);
  for i=6 upto 10:
    label.rt(textext(decimal i) scaled .7,R[i]);
  endfor;

endfig;

beginfig(25);
  numeric v,w,last;
  v=10u;
  w=20u;
  last=5;
  pair P[],Q[],R[];
  pickup pencircle scaled 2pt;
  for i=0 upto last:
    P[i]=(0,i*v);draw P[i];
    Q[i]=(2w,i*v);draw Q[i];
  endfor;
  for i=0 upto 2last:
    R[i]=(w,i*v/2);draw R[i];
  endfor;
  pickup pencircle scaled .5;

  label.bot(textext("$p_i$"),P0);
  label.bot(textext("$q_i$"),Q0);
  label.bot(textext("$r_i$"),R0);
  draw P2--Q3;
  for i=0 upto 5:
    label.lft(textext("$x_" & decimal i & "$") scaled .7,P[i]);
  endfor;
  for i=0 upto 5:
    label.rt(textext("$y_" & decimal i & "$") scaled .7,Q[i]);
  endfor;
  for i=0 upto 4:
    label.rt(textext("$z_" & decimal i & "$") scaled .7,R[i]);
  endfor;
  unfill bbox(thelabel.rt(textext("$z_5$") scaled .7,R5));
  label.rt(textext("$z_5$") scaled .7,R5);
  for i=6 upto 10:
    label.rt(textext("$z_{" & decimal i & "}$") scaled .7,R[i]);
  endfor;

endfig;



end

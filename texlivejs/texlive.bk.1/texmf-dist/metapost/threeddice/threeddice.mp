% File threeddice.mp
% Version 1.0
%%%%%%%%%%%%%%%%%%%%
numeric dot_diam, corner_rad, face_margin, die_size;

% diameter of a dot
dot_diam := 1/6;

% distance from edge of face to edge of dot.
face_margin := dot_diam/2;

% rounded corner radius
corner_rad := dot_diam/2;

% size of a single die face:
die_size := 1cm;

% Outline of a face.
path die_face;
die_face := (0,corner_rad){down}
    ..{right}(corner_rad,0)..(1-corner_rad,0){right}
    ..{up}(1,corner_rad)..(1,1-corner_rad){up}
    ..{left}(1-corner_rad,1)..(corner_rad,1){left}
    ..{down}(0,1-corner_rad)..cycle;

% dot shape
path dot;
dot := fullcircle scaled dot_diam;

% distance from nearest edge to center of dot:
numeric dot_shift;
dot_shift := dot_diam/2 + face_margin; 

% Five of 9 locations where a dot could be located. 
pair die_face[]; 

die_face 1 := ( 0, 1)  + dot_shift*( 1,-1); % TL
die_face 2 := ( 0,.5)  + dot_shift*( 1, 0); % TC
die_face 3 := (.5,.5)                     ; % CC
die_face 4 := ( 1,.5)  + dot_shift*(-1, 0); % BC
die_face 5 := ( 1, 0)  + dot_shift*(-1, 1); % BR


picture pips[];
pips 1 := pips 2 := nullpicture;

% dot in center
addto pips 1 contour dot shifted die_face 3;

% dots in TL and BR corners
addto pips 2 contour dot shifted die_face 1;
addto pips 2 contour dot shifted die_face 5;

% dots in TR and BL corners 
pips 7 := pips 2 rotatedabout ((.5,.5), 90);

% 3 dots on TL to BR diagonal
pips 3 := pips 2;
addto pips 3 also pips 1;

% 3 dots on BL to TR diagonal
pips 8 := pips3 rotatedabout ((.5,.5),90);

% Dots in all 4 corners
pips 4 := pips 2;
addto pips 4 also pips 7;

% dots in all four corners and center
pips 5 := pips 4;
addto pips 5 also pips 1;

% 6 dots, 3 dots on top and three on bottom
pips 6 := pips 4;
addto pips 6 contour dot shifted die_face 2;
addto pips 6 contour dot shifted die_face 4;

% 6 dots, 3 at left and 3 at right
pips 11 := pips6 rotatedabout ((.5,.5),90);

% When three faces are showing, alternates 7, 8 and 11 for 2, 3 and 6 are 
% used when the total of the pips is odd (). This is an ad hoc rule that 
% matches what I see on my reference die.
vardef pips_sel_iii (expr X)=
  X if odd pips_total: if (X=2) or (X=3) or (X=6): + 5  fi  fi
enddef;
%
% Choices are less easy when only two faces show:
vardef pips_sel_ii (expr X,Y)=
  X if ((X=2) and ((Y=3) or (Y=4))) or
       ((X=3) and ((Y=1) or (Y=6))) or
       ((X=6) and ((Y=2) or (Y=5))): + 5 
    fi
enddef;

% for die with 3 faces showing:
path topface[], llftface, lrtface;
topface 1 =  die_face rotated  45 yscaled (1/sqrt(3));
llftface = topface 1 rotated 120;
lrtface = topface 1 rotated -120;

% for die with 2 faces showing:
path frontface;
topface 2  := (die_face shifted (-.5,0)) yscaled (1/sqrt(2));
frontface := topface 2 rotated 180;

pair D[];
D1 := dir  30;
D2 := dir 150;

path corner_connect[];
corner_connect1 := (point 6 of lrtface){up}..{D2}(point 3 of topface 1);
corner_connect2 := (point 6 of topface 1){-D1}..{down}(point 3 of llftface);
corner_connect3 := (point 6 of llftface){-D2}..{D1}(point 3 of lrtface);
corner_connect4 := (point 0 of frontface){up}..(point 3 of topface 2){up};
corner_connect5 := (point 0 of topface 2){down}..(point 3 of frontface){down};

% Text parameter is for drawing options (transformation, withcolor, etc.); 
% expression parameters are the # of pips on top, left and right.
def die_three(expr T, L, R) text _do_ =
  numeric pips_total; 
  pips_total := T + L + R; 
  draw topface 1  _do_;
  draw llftface _do_;
  draw lrtface  _do_;
  for n = 1 upto 3:
    draw corner_connect[n] _do_;
  endfor
  draw pips[pips_sel_iii(T)] rotated 45 yscaled (1/sqrt(3)) _do_;
  draw pips[pips_sel_iii(L)] rotated 45 yscaled (1/sqrt(3)) rotated  120 _do_;
  draw pips[pips_sel_iii(R)] rotated 45 yscaled (1/sqrt(3)) rotated -120 _do_;
enddef;

def die_two (expr T, F) text _do_ =
  draw topface 2 _do_;
  draw frontface _do_;
  draw (pips[pips_sel_ii(T,F)] shifted .5left) yscaled (1/sqrt(2)) _do_;
  draw (pips[pips_sel_ii(F,T)] shifted .5left) yscaled (1/sqrt(2)) rotated 180 _do_;
  draw corner_connect4 _do_;
  draw corner_connect5 _do_;
enddef;

def die_one (expr F) text _do_ =
  draw die_face _do_;
  draw pips[F]  _do_;
enddef;

if known outputtemplate:
  outputtemplate := "die3d-%c.mps";
elseif known mpversion:
  filenametemplate "die3d-%c.mps";
fi
% The 8 permissible views (up to rotation) with three faces equally 
% visible of a right handed die:
beginfig(123);
  die_three(1,2,3) scaled die_size;
endfig;

beginfig(135);
  die_three(1,3,5) scaled die_size;
endfig;

beginfig(154);
  die_three(1,5,4) scaled die_size;
endfig;

beginfig(142);
  die_three(1,4,2) scaled die_size;
endfig;

beginfig(246);
  die_three(2,4,6) scaled die_size;
endfig;

beginfig(263);
  die_three(2,6,3) scaled die_size;
endfig;

beginfig(365);
  die_three(3,6,5) scaled die_size;
endfig;

beginfig(456);
  die_three(4,5,6) scaled die_size;
endfig;

% The 12 permissible views (up to rotation) with only two faces equally 
% visible of a right handed die:
beginfig(12);
  die_two(1,2) scaled die_size;
endfig;

beginfig(13);
  die_two(1,3) scaled die_size;
endfig;

beginfig(14);
  die_two(1,4) scaled die_size;
endfig;

beginfig(15);
  die_two(1,5) scaled die_size;
endfig;

beginfig(23);
  die_two(2,3) scaled die_size;
endfig;

beginfig(24);
  die_two(2,4) scaled die_size;
endfig;

beginfig(26);
  die_two(2,6) scaled die_size;
endfig;

beginfig(35);
  die_two(3,5) scaled die_size;
endfig;

beginfig(36);
  die_two(3,6) scaled die_size;
endfig;

beginfig(45);
  die_two(4,5) scaled die_size;
endfig;

beginfig(46);
  die_two(4,6) scaled die_size;
endfig;

beginfig(56);
  die_two(5,6) scaled die_size;
endfig;

% The 6 possible single faces
beginfig(1);
  die_one(1) scaled die_size;
endfig;

beginfig(2);
  die_one(2) scaled die_size;
endfig;

beginfig(3);
  die_one(3) scaled die_size;
endfig;

beginfig(4);
  die_one(4) scaled die_size;
endfig;

beginfig(5);
  die_one(5) scaled die_size;
endfig;

beginfig(6);
  die_one(6) scaled die_size;
endfig;

end

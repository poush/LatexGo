% modeling of a suanpan (Chinese abacus)
% D. Roegel 9 September - 12 October 2008
% 
% These macros provide basic functions for producing suanpan (Chinese abacus)
% figures as well as soroban ones (Japanese abacus)

numeric u;
u=1cm;

% key-val mechanism (from LGC2, p. 59-60)
vardef executekeyval(text k)=
  save _equals;
  let _equals= =;
  tertiarydef _ll_ _assign _rr_ =
    hide(_ll_ _equals _rr_ ) 1
  enddef;
  save =;
  let = _equals _assign ;
  for _xx_ _equals k:endfor;
enddef;

numeric n; % number of digits
numeric nbl,vbu,nbu; % number of beads (lower/upper)
                     % vbu=value of a bead in the upper deck
numeric hsep,vsep,beadw,thframe,beadsp,wdvline,hlwindow,huwindow;
numeric wdframe,huwindow;

numeric beadtype;
boolean rod_numbers;
rod_numbers=true; % default

boolean overflow;

numeric abacus_units;
abacus_units=0; % a value of 1 marks every third rod by a dot
                % other values may be used in the future

n=13; % default
vbu=5; % value of a bead in the upper deck
nbl=5; % total beads below (lower deck)
nbu=2; % total beads above (upper deck)
hsep=.8u; % distance between lines of beads
ihsep=.5hsep; % initial hsep
vsep=.5u; % smallest distance between bead centers
beadw=.4hsep; % bead width
thframe=.3u; % frame thickness
beadsp=u; % bead spacing
wdvline=.1u; % thickness of bamboo lines
beadtype=1; % 1=round (suanpan), 2=biconal (soroban)

vardef setup_abacus(text kv)=
  save N,NBL,NBU,bead,units; % key names
  numeric N,NBL,NBU,units;
  string bead;
  executekeyval(kv);
  n:=N;
  nbl:=NBL;
  nbu:=NBU;
  abacus_units:=units;
  wdframe:=(n-1)*hsep+2ihsep+2thframe;
  htframe:=3thframe+(nbl+nbu-2)*vsep+vsep+vsep+2beadsp;
  hlwindow:=(nbl-1)*vsep+vsep+beadsp;  % height of lower window
  huwindow:=htframe-3thframe-hlwindow; % height of upper window
  if bead="suanpan":
    beadtype:=1;
  elseif bead="soroban":
    beadtype:=2;
  fi;  
enddef;

vardef draw_abacus_frame=
  save P;pair P[];
  % -------------- outer frame --------------
  P0=origin;
  P1-P0=P2-P3=wdframe*right;
  P2-P1=htframe*up;
  draw P0--P1--P2--P3--cycle;
  %--------- lower inner frame --------------
  P4-P0=(thframe,thframe);
  P5-P1=(-thframe,thframe);
  P9=P0+(1.5thframe+hlwindow)*up;
  P10-P9=P1-P0;
  P7=P9+(thframe,-.5thframe);
  P6-P7=P5-P4;
  draw P4--P5--P6--P7--cycle;
  %--------- upper inner frame --------------
  P14-P9=(thframe,.5thframe);
  P15-P10=(-thframe,.5thframe);
  P16-P2=(-thframe,-thframe);
  P17-P3=(thframe,-thframe);
  draw P14--P15--P16--P17--cycle; 
enddef;

vardef draw_abacus_rods=
  save h,ha,hb,savep;
  savep=savepen;
  ha=hlwindow;
  hb=huwindow;
  h=ha+hb+thframe;
  for i=1 upto n:
    draw (thframe+ihsep+(i-1)*hsep-.5wdvline,thframe)
         --(thframe+ihsep+(i-1)*hsep-.5wdvline,thframe+ha);
    draw (thframe+ihsep+(i-1)*hsep+.5wdvline,thframe)
         --(thframe+ihsep+(i-1)*hsep+.5wdvline,thframe+ha); 
    draw (thframe+ihsep+(i-1)*hsep-.5wdvline,thframe+h-hb)
	 --(thframe+ihsep+(i-1)*hsep-.5wdvline,thframe+h);
    draw (thframe+ihsep+(i-1)*hsep+.5wdvline,thframe+h-hb)
         --(thframe+ihsep+(i-1)*hsep+.5wdvline,thframe+h);
    if rod_numbers:
      label.bot(decimal i,(thframe+ihsep+(n-i)*hsep,0));
      label.top(decimal i,(thframe+ihsep+(n-i)*hsep,2thframe+h));
    fi    
  endfor;
  pickup pencircle scaled 3pt;
  if abacus_units=1:
    for i=3 step 3 until n:
      draw (thframe+ihsep+(n-i)*hsep,thframe+ha+.5thframe);
    endfor;    
  fi;
  pickup savep;
enddef;

numeric valU[],valL[],vl; % stores the abacus values and the number of digits
numeric valUMu[],valUMs[],valLMs[],valLMu[]; % moved values will be in gray

def reset_abacus=
  for i=1 upto n:
    valU[i]:=0;
    valL[i]:=0;
  endfor;
  reset_abacus_gray_above;
  reset_abacus_gray_below;
enddef;

def reset_abacus_gray_above=
  for i=1 upto n:
    valUMs[i]:=0;valUMu[i]:=0;
  endfor;  
enddef;

def reset_abacus_gray_below=
  for i=1 upto n:
    valLMu[i]:=0;valLMs[i]:=0;
  endfor;  
enddef;

def suanpan_bead(expr X,Y)=
  fullcircle xscaled 2beadw yscaled vsep shifted (X,Y)
enddef;

def draw_suanpan_bead(expr X,Y) text options=
  fill suanpan_bead(X,Y) options;
enddef;

def draw_suanpan_gray_bead(expr X,Y) text options=
  fill suanpan_bead(X,Y) options;
  draw suanpan_bead(X,Y);
enddef;

def draw_suanpan_bead_contour(expr X,Y) text options=
  draw_suanpan_gray_bead(X,Y) withcolor white;
enddef;

def define_soroban_bead_points(expr X,Y)=
  save p,pa;pair p[];path pa;
  p0=(X,Y);p1=p0+(beadw,.5wdvline);p2=p0+(.5wdvline,.5vsep);
  p3=p0+(-.5wdvline,.5vsep);p4=p0+(-beadw,.5wdvline);
  p5=p0+(-beadw,-.5wdvline);p6=p0+(-.5wdvline,-.5vsep);
  p7=p0+(.5wdvline,-.5vsep);p8=p0+(beadw,-.5wdvline);
  pa=p1--p2--p3--p4--p5--p6--p7--p8--cycle;
enddef;

% this macro draws a biconal bead, like on a soroban
vardef draw_soroban_bead(expr X,Y) text options=
  define_soroban_bead_points(X,Y);
  unfill pa;
  draw pa;draw p1--p4;draw p5--p8;
enddef;

% this macro draws a biconal bead, like on a soroban
vardef draw_soroban_gray_bead(expr X,Y) text options=
  define_soroban_bead_points(X,Y);
  fill pa withcolor .7white;
  draw pa;draw p1--p4;draw p5--p8;
enddef;

vardef draw_soroban_bead_contour(expr X,Y)=
  define_soroban_bead_points(X,Y);
  unfill pa;
  draw pa;
enddef;

def draw_bead_contour(expr X,Y) text options=
  if beadtype=1:
    draw_suanpan_bead_contour(X,Y);
  else:
    draw_soroban_bead_contour(X,Y);
  fi;
enddef;

def draw_bead(expr X,Y) text options=
  if beadtype=1:
    draw_suanpan_bead(X,Y) options;
  elseif beadtype=2:
    draw_soroban_bead(X,Y) options;
  fi;
enddef;

def draw_gray_bead(expr X,Y)=
  if beadtype=1:
    draw_suanpan_gray_bead(X,Y) withcolor .7white;
  elseif beadtype=2:
    draw_soroban_gray_bead(X,Y) withcolor .7white;
  fi;
enddef;

vardef draw_abacus_beads=
  save na,nb,X,Y;
  % we go through every bead line:
  for i=1 upto n:
    X:=thframe+ihsep+(n-i)*hsep;
    % first, we handle the lower beads:
    na:=nbl-valL[i];
    nb:=valL[i];
    % ------------------------------------------------------------
    % these are the lower beads which have not been raised (unset)
    for j=1 upto na:
      Y:=thframe+.5vsep+(j-1)*vsep;
      draw_bead(X,Y);
    endfor;
    % some of the previous ones are in gray:
    for j=na downto na-(valLMu[i]-1):
      Y:=thframe+.5vsep+(j-1)*vsep;
      draw_gray_bead(X,Y);
      
    endfor;
    %-------------------------------------------------------------
    % these are the lower beads which have been raised (set)
    for j=1 upto nb:
      Y:=thframe+hlwindow-(.5vsep+(j-1)*vsep);
      draw_bead(X,Y);
    endfor;
    % some of the previous ones are in gray:
    for j=nb downto nb-(valLMs[i]-1):
      Y:=thframe+hlwindow-(.5vsep+(j-1)*vsep);
      draw_gray_bead(X,Y);
    endfor;
    %-------------------------------------------------------------
    % then we handle the upper beads:
    na:=nbu-valU[i];
    nb:=valU[i];
    %--------------------------------------------------------------
    % these are the upper beads which have not been lowered (unset)
    for j=1 upto na:
      Y:=htframe-(thframe+.5vsep+(j-1)*vsep);
      draw_bead(X,Y);
    endfor;
    for j=na downto na-(valUMu[i]-1):
      Y:=htframe-(thframe+.5vsep+(j-1)*vsep);
      draw_gray_bead(X,Y);
    endfor;
    %--------------------------------------------------------------
    % these are the upper beads which have been lowered (set)
    for j=1 upto nb:
      Y:=2thframe+hlwindow+(.5vsep+(j-1)*vsep);
      draw_bead(X,Y);
    endfor;
    for j=nb downto nb-(valUMs[i]-1):
      Y:=2thframe+hlwindow+(.5vsep+(j-1)*vsep);
      draw_gray_bead(X,Y);
    endfor;
    %--------------------------------------------------------------
  endfor;  
enddef;

def draw_abacus=
  draw_abacus_frame;
  draw_abacus_rods;
  draw_abacus_beads;
enddef;

% v must be a string
vardef set_abacus_val(expr v)=
  save vx;
  numeric vx[];
  reset_abacus;
  vl:=min(length(v),n)-1; % handle overflows in the input
  for i=0 upto length(v)-1:
    vx[i]=ASCII(substring(i,i+1) of v)-ASCII("0");
  endfor;
  for i=1 upto length(v):
    valL[i]:=vx[length(v)-i];
    if valL[i]>vbu-1: % we must use vbu and not nbl, although
                      % they are usually the same
      valU[i]:=1;
      valL[i]:=valL[i]-vbu; % same remark
    fi;    
  endfor;  
enddef;

vardef reset_abacus_gray=
  save s;
  string s;
  s="";
  for i=1 upto n:s:=s & "0";endfor;
  set_abacus_gray(deck="lower",below=s,above=s);
  set_abacus_gray(deck="upper",below=s,above=s);
enddef;

vardef set_abacus_gray_below=
  save vx;
  numeric vx[];
  reset_abacus_gray_below;
  % reading the first string, for the lower part (which beads are gray)
  for i=0 upto length(below)-1:
    vx[i]:=ASCII(substring(i,i+1) of below)-ASCII("0");
  endfor;
  for i=1 upto length(below):
    valLMu[i]:=vx[length(below)-i];
  endfor;
  % reading the second string, for the upper part (which beads are gray)
  for i=0 upto length(above)-1:
    vx[i]:=ASCII(substring(i,i+1) of above)-ASCII("0");
  endfor;
  for i=1 upto length(above):
    valLMs[i]:=vx[length(above)-i];
  endfor;
  % we check that there is no conflict in the graying of beads:
  %   a bead can only be grayed if it exists
  for i=1 upto n:
    % lower beads ...............................
    na:=nbl-valL[i];
    nb:=valL[i];
    % we force threshholds if necessary:
    if valLMs[i]>valL[i]:valLMs[i]:=valL[i];fi
    if valLMu[i]>na:valLMu[i]:=na;fi
  endfor;
enddef;

vardef set_abacus_gray_above=
  save vx;
  numeric vx[];
  reset_abacus_gray_above;
  % reading the first string, for the lower part (which beads are gray)
  for i=0 upto length(below)-1:
    vx[i]:=ASCII(substring(i,i+1) of below)-ASCII("0");
  endfor;
  for i=1 upto length(below):
    valUMs[i]:=vx[length(below)-i];
  endfor;
  % reading the second string, for the upper part (which beads are gray)
  for i=0 upto length(above)-1:
    vx[i]:=ASCII(substring(i,i+1) of above)-ASCII("0");
  endfor;
  for i=1 upto length(above):
    valUMu[i]:=vx[length(above)-i];
  endfor;
  % we check that there is no conflict in the graying of beads:
  %   a bead can only be grayed if it exists
  for i=1 upto n:
    % upper beads ...............................
    na:=nbu-valU[i];
    nb:=valU[i];
    % we force threshholds if necessary:
    if valUMs[i]>valU[i]:valUMs[i]:=valU[i];fi
    if valUMu[i]>na:valUMu[i]:=na;fi
  endfor;
enddef;

vardef set_abacus_gray(text kv)=
  save deck,below,above; % key names
  string deck,below,above;
  executekeyval(kv);
  if deck="lower":
    set_abacus_gray_below;
  elseif deck="upper":
    set_abacus_gray_above;
  fi;  
enddef;

% put the label `lab' on the j-th bead on row i (i=1 at the right)
vardef mark_abacus(text kv)(expr lab)=
  save i,j; % key names
  numeric i,j;
  executekeyval(kv);
  
  save X,Y,na,nb,ju;
  X:=thframe+ihsep+(n-i)*hsep;
  if j<=nbl: % the bead to mark is below:
    % first, we handle the lower beads:
    na:=nbl-valL[i];
    nb:=valL[i];
    % ------------------------------------------------------------
    if j<=na:
      % these are the lower beads which have not been raised (unset)
      Y:=thframe+.5vsep+(j-1)*vsep;
    else:
      %-------------------------------------------------------------
      % these are the lower beads which have been raised (set)
      Y:=thframe+hlwindow-(.5vsep+(nb-(j-na))*vsep);
    fi    
  else: % the bead to mark is above:
    ju=j-nbl;
    %-------------------------------------------------------------
    % then we handle the upper beads:
    na:=nbu-valU[i];
    nb:=valU[i];
    if ju>nb: 
      %--------------------------------------------------------------
      % these are the upper beads which have not been lowered (unset)
      Y:=htframe-(thframe+.5vsep+(na-(ju-nb))*vsep);
    else:      
      %--------------------------------------------------------------
      % these are the upper beads which have been lowered (set)
      Y:=2thframe+hlwindow+(.5vsep+(ju-1)*vsep);
    fi;    
  fi;
  draw_bead_contour(X,Y);
  draw thelabel(lab,(X,Y)); % withcolor white;
enddef;

def show_val=
  for i=1 upto vl+1:
    message "valU[" & decimal i & "]=" & decimal (valU[i]);
    message "valL[" & decimal i & "]=" & decimal (valL[i]);
  endfor;  
enddef;

% v=value, iv=image view
def add_val(text kv)=
  save v,iv,fig; % key names
  string v;numeric iv;boolean fig;
  executekeyval(kv);  
  save vx,VL,VU,carry;
  numeric vx[],vL[],vU[],vx.len;
  overflow:=false;
  % we store the new value to add in one array
  vx.len=min(length(v),n)-1; % we consider at most n digits
  %message "vx.len=" & decimal vx.len;
  for i=0 upto vx.len:
    vx[i]=ASCII(substring(i,i+1) of v)-ASCII("0");
  endfor;
  for i=1 upto length(v):
    vL[i]:=vx[length(v)-i];
  endfor;

  % if necessary, we modify the size of the first number:
  if vx.len>vl:vl:=vx.len;fi
  % the result will be either this wide, or will have one more digit
  % to the left

  if fig:
    % the initial configuration:
    beginfig(iv);
      draw_abacus;
    endfig;
  fi
  
  % we add the digits from left to right:
  for i=vx.len+1 downto 1:
    valL[i]:=valL[i]+vL[i];
    % if there would be too many beads below, we adjust the upper ones:
    forever:
      if valL[i]>vbu-1:
        valL[i]:=valL[i]-vbu;
        valU[i]:=valU[i]+1;
      fi
      exitif valL[i]<vbu;
    endfor;
    % then, we propagate a carry if necessary:
    carry:=0;
    if valU[i]>1: % valU[i]=2 or 3 are possible values
      carry:=1;
      % propagate carry
      valU[i]:=valU[i]-2;
      for j=i+1 upto vl+1:
        valL[j]:=valL[j]+carry;
	if valL[j]>4:valL[j]:=0;valU[j]:=valU[j]+1;fi
	if valU[j]>1:carry:=1;valU[j]:=valU[j]-2;else:carry:=0;fi
	exitif carry=0; % no need to go all the way through,
	                % if the carry becomes 0
      endfor;
      if carry=1:
        % we increment vl and we add the carry:
	vl:=vl+1;
	valL[vl+1]:=1;
	if vl+1>n:overflow:=true;fi
      fi      
    fi
    %message "adding " & decimal vL[i] & " at position " & decimal i
    %  & " and generating view " & decimal (iv+(vx.len+1-i)+1);
    if fig:
      beginfig(iv+(vx.len+1-i)+1);
        draw_abacus;
      endfig;
    fi    
  endfor;

enddef;

endinput

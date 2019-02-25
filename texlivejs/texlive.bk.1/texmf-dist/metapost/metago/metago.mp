
%% metago.mp
%% Copyright 2008 Wentao Zheng
  %
  % This work may be distributed and/or modified under the conditions
  % of the LaTeX Project Public License, either version 1.3 of this
  % license or (at your option) any later version.  The latest version
  % of this license is in http://www.latex-project.org/lppl.txt and
  % version 1.3 or later is part of all distributions of LaTeX version
  % 2005/12/01 or later.
  %
  % This work has the LPPL maintenance status `maintained'.
  % 
  % The Current Maintainer of this work is Wentao Zheng.
  %
  % This work consists of the file metago.mp

input string;

% --------------------------------
% debug variable and logger method
% --------------------------------
boolean _DEBUG;
_DEBUG = true;
vardef log text t=
  if _DEBUG:
    show t;
  fi;
enddef;


% ------------------------
% Stack for pair variables
% ------------------------
%  - declare a stack: stack.s
%  - push a pair into a stack: s.push(<pair>)
%  - pop a pair from a stack: <pair> = s.pop()
%  - clear a stack: s.clear()
%  - check whether a stack is empty: s.empty()

vardef stack@#=
  string @#.value[];
  numeric @#.top;
  @#.top := 1;
enddef;

vardef pop@#=
  save tmp;
  string tmp;
  if @#.top > 1:
    @#.top := @#.top - 1;
    tmp = @#.value[@#.top];
  else:
    tmp = "";
  fi;

  save p;
  pair p;
  p = scantokens(tmp);
  (p)
enddef;

vardef push@# expr p=
  @#.value[@#.top] := "(" & (decimal xpart p) & "," & (decimal ypart p) & ")";
  @#.top := @#.top + 1;
enddef;

vardef empty@#=
  (@#.top = 1)
enddef;

vardef clear@#=
  @#.top := 1;
enddef;

%% determine whether two pairs are equal
vardef _is_pair_equal(expr p,q)=
  ((xpart p = xpart q) and (ypart p = ypart q))
enddef;

%% convert a pair to string with the form of "(x,y)"
vardef _point_str expr p=
  ((decimal xpart p) & "," & (decimal ypart p))
enddef;

% --------------------
% Parameters of MetaGo
% --------------------

u = 10pt; % !IMPORTANT, unit metric, DON'T user it or modify it

color board_color; % color of board background color

cell_width = 2u;
cell_line_width = .05u;

board_gap = 3u;
board_dot_d = .4u;
board_color = (1,200/255,100/255);
board_size = 19;

stone_d = .9cell_width;
stone_line_width = cell_line_width;


% -------------------------------------------
% Internal functions (DO NOT use/modify them)
% -------------------------------------------

% Go coord: 0-18, 0-18 (internal coord)
% MP coord: 0-18u + gap, 0-(-18u) + gap
transform GoToMP;
GoToMP := identity xscaled cell_width yscaled -cell_width
shifted (board_gap,-board_gap);

vardef mp_pos expr p=
  (p transformed GoToMP)
enddef;

vardef draw_cell expr p=
  save i,j;
  i = xpart p;
  j = ypart p;
  draw (mp_pos (i,j)) -- (mp_pos (i+1,j)) -- (mp_pos (i+1,j+1))
  -- (mp_pos (i,j+1)) -- cycle withpen pencircle scaled cell_line_width;
enddef;

vardef draw_dot expr p=
  fill (fullcircle scaled board_dot_d) shifted (mp_pos p);
enddef;

vardef _draw_stone(expr p,c)=
  save circ; path circ;
  circ = (fullcircle scaled stone_d) shifted p;
  fill circ withcolor c;
  draw circ withpen pencircle scaled stone_line_width;
enddef;

vardef draw_stone@# expr p=
  string type;
  type = str @#;
  if (type = "b") or (type = "B"):
    _draw_stone((mp_pos p),black);
  elseif (type = "w") or (type = "W"):
    _draw_stone((mp_pos p),white);
  else:
    show "ERROR of stone type: " & type & "!!";
  fi;
enddef;

% fout direction point of the pair p:
%   up, down, left, right
% p \in (1-board_size,1-board_size)
% if p is one the edge of the board, return p itself

vardef _up expr p=
  if (ypart p) = 1:
    (xpart p, ypart p)
  else:
    (xpart p, ypart p - 1)
  fi
enddef;

vardef _down expr p=
  if (ypart p) = board_size:
    (xpart p, ypart p)
  else:
    (xpart p, ypart p + 1)
  fi
enddef;

vardef _left expr p=
  if (xpart p) = 1:
    (xpart p, ypart p)
  else:
    (xpart p - 1, ypart p)
  fi
enddef;

vardef _right expr p=
  if (xpart p) = board_size:
    (xpart p, ypart p)
  else:
    (xpart p + 1, ypart p)
  fi
enddef;

% board memory: 1 ~ board_size, 1 ~ board_size
% - 0 means empty
% - -1 means white
% - 1 means black
WHITE = -1;
BLACK = 1;
EMPTY = 0;
numeric mem[][];
for i=1 upto board_size:
  for j=1 upto board_size:
    mem[i][j] = EMPTY;
  endfor;
endfor;

vardef MEM expr p=
  if (xpart p < 1) or (xpart p > board_size)
    or (ypart p < 1) or (ypart p > board_size):
    (2)
  else:
    (mem[xpart p][ypart p])
  fi
enddef;


%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
%%%% Open functions for Go visualization %%%%
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

%% draw empty Go board
vardef draw_board=
  %% draw board side and fill color
  save board; path board;
  board = origin -- (mp_pos(board_size-1,0)) + (board_gap,board_gap)
  -- (mp_pos(board_size-1,board_size-1)) + (board_gap,-board_gap)
  -- (mp_pos(0,board_size-1)) + (-board_gap,-board_gap) -- cycle;
  fill board withcolor board_color;
  draw board;

  %% draw cells
  for i=0 upto board_size-2:
    for j=0 upto board_size-2:
      draw_cell (i,j);
    endfor;
  endfor;

  %% draw dot if size = 19
  if board_size = 19:
    for i=3 step 6 until 15:
      for j=3 step 6 until 15:
	draw_dot (i,j);
      endfor;
    endfor;
  fi;
enddef;

vardef _char expr p=
  char(ASCII("A") + (p-1))
enddef;

%% draw label
vardef draw_label=
  for i=1 upto board_size:
    label(_char i, mp_pos(i-1,-1));
    label(_char i, mp_pos(i-1,board_size));

    label((decimal i), mp_pos(-1,board_size-i));
    label((decimal i), mp_pos(board_size,board_size-i));
  endfor;
enddef;

%% put a stone on postion p
%% B - black stone, p: 1~board_size, 1~board_size
%% W - white stone, p: 1~board_size, 1~board_size
%% C - clear stone, p: 1~board_size, 1~board_size

vardef B expr p=
  log "black " & (_point_str p);
  if IS_PUT:
    append_put "B " & (decimal (xpart p)) & " " & (decimal (ypart p));
  fi;
  mem[xpart p][ypart p] := BLACK;
enddef;

vardef W expr p=
  log "white " & (_point_str p);
  if IS_PUT:
    append_put "W " & (decimal (xpart p)) & " " & (decimal (ypart p));
  fi;
  mem[xpart p][ypart p] := WHITE;
enddef;

vardef C expr p=
  log "clear " & (_point_str p);
  if IS_PUT:
    if mem[xpart p][ypart p] = BLACK:
      append_put "b " & (decimal (xpart p)) & " " & (decimal (ypart p));
    elseif mem[xpart p][ypart p] = WHITE:
      append_put "w " & (decimal (xpart p)) & " " & (decimal (ypart p));
    fi;
  fi;
  mem[xpart p][ypart p] := EMPTY;
enddef;

%% draw current stones on board
vardef draw_stones=
  for i=1 upto board_size:
    for j=1 upto board_size:
      if mem[i][j] = BLACK:
	draw_stone.b(i-1,j-1);
      elseif mem[i][j] = WHITE:
	draw_stone.w(i-1,j-1);
      elseif mem[i][j] = EMPTY:
      else
	show "ERROR board memory with value " & (decimal mem[i][j]) & "!!";
      fi;
    endfor;
  endfor;
enddef;

%% check life_or_death for all stones
%% if stone s is dead, clear s from mem
vardef life_or_death=
  save m,count,ld;
  numeric m[][];
  for i=1 upto board_size:
    for j=1 upto board_size:
      m[i][j] = -1; %% -1, not checked; 0, pushed; 1 ..., checked
    endfor;
  endfor;

  count = 1;
  boolean ld[];
  stack.h;

  %% grouping and check life_or_death
  for i=1 upto board_size:
    for j=1 upto board_size:
      if (m[i][j] = -1) and not ((MEM(i,j)) = EMPTY):
	push.h(i,j);
	m[i][j] := 0;
	ld[count] := false;
	
	forever:
	  exitif empty.h;
	  
	  save test,p;
	  pair test[],p;

	  p := pop.h;
	  m[xpart p][ypart p] := count;

	  test[1] := _up p;
	  test[2] := _down p;
	  test[3] := _left p;
	  test[4] := _right p;
	  
	  for k=1 upto 4:
	    if ((MEM test[k]) = (MEM(i,j))) and
	      (m[xpart test[k]][ypart test[k]] = -1):
	      push.h(test[k]);
	      m[xpart test[k]][ypart test[k]] := 0;
	    fi;
	    
	    if (MEM test[k]) = EMPTY:
	      ld[count] := true;
	    fi;
	  endfor;
	endfor;

	count := count+1;
	clear.s;
      fi;
    endfor;
  endfor;

  %% clear dead stones
  for i=1 upto board_size:
    for j=1 upto board_size:
      if m[i][j] > 0:
	if ld[m[i][j]] = false:
	  C(i,j);
	fi;
      fi;
    endfor;
  endfor;
enddef;

%% check if added stone at p captures other stones
vardef _capture expr p=
  save test;
  pair test[];
  
  test[1] := _up p;
  test[2] := _down p;
  test[3] := _left p;
  test[4] := _right p;
  for i=1 upto 4:
    if (MEM test[i]) = -(MEM p):
      _check_death_of(test[i]);
    fi;
  endfor;
enddef;

vardef _check_death_of expr pp=
  stack.h;
  numeric m[][];
  for i=1 upto board_size:
    for j=1 upto board_size:
      m[i][j] = -1; %% un-pushed
    endfor;
  endfor;
  
  push.h pp;
  m[xpart pp][ypart pp] := 0;
  save ld; boolean ld;
  ld = false;
  
  forever:
    exitif empty.h;
    
    save test,p;
    pair test[],p;
    
    p := pop.h;
    %m[xpart p][ypart p] := 1;
    
    test[1] := _up p;
    test[2] := _down p;
    test[3] := _left p;
    test[4] := _right p;
    
    for k=1 upto 4:
      if ((MEM test[k]) = (MEM p)) and
	(m[xpart test[k]][ypart test[k]] = -1):
	push.h(test[k]);
	m[xpart test[k]][ypart test[k]] := 0;
      fi;
      
      if (MEM test[k]) = EMPTY:
	ld := true;
      fi;
    endfor;
  endfor;

  if ld = false:
    for i=1 upto board_size:
      for j=1 upto board_size:
	if m[i][j] = 0:
	  C(i,j);
	fi;
      endfor;
    endfor;
  fi;
enddef;

%% check if added stone at p is dead
vardef _suicide expr p=
  _check_death_of p;
enddef;

%% putting stone history
boolean IS_PUT;
IS_PUT = false;
string put_history[];
numeric cur_put_his;
cur_put_his = 1;
string put_his;

%% begin a put action
vardef beginput=
  IS_PUT := true;
  put_his := "";
enddef;

%% append stoning in a put action
vardef append_put text t=
  if (length put_his) = 0:
    put_his := t;
  else:
    put_his := put_his & " " & t;
  fi;
enddef;

%% end a put action
vardef endput=
  IS_PUT := false;
  put_history[cur_put_his] := put_his;
  log "append history: " & put_his;
  cur_put_his := cur_put_his + 1;
enddef;

%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
%%%% high level functions (encourged for use) %%%%
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% set_board_size
% set_board_color
% init_board
% put_b / put_w
% display_board

%% set board size between 1 and 19
%% default value is 19
vardef set_board_size expr p=
  if (p > 0) and (p < 20):
    board_size := p;
  fi;
enddef;

%% set board color with rgb triple (r,g,b)
vardef set_board_color text t=
  board_color := t;
enddef;

%% init the board with no stones
vardef init_board=
  save db; boolean db;
  db = _DEBUG;
  _DEBUG := false;
  for i=1 upto board_size:
    for j=1 upto board_size:
      C(i,j);
    endfor;
  endfor;
  _DEBUG := db;
enddef;

%% generate a random distributed board with stones
vardef random_board expr clear_ratio=
  save tmp;
  for i=1 upto board_size:
    for j=1 upto board_size:
      tmp := normaldeviate;
      if tmp > 0.5 clear_ratio:
	put_black(i,j);
      elseif tmp < -0.5 clear_ratio:
	put_white(i,j);
      fi;
    endfor;
  endfor;
enddef;

%% generate a random location ranged from (1,1)--(board_size,board_size)
vardef random_loc=
  save x,y;
  x = (uniformdeviate board_size);
  y = (uniformdeviate board_size);

  x := floor (abs (x - 0.0001));
  y := floor (abs (y - 0.0001));

  (x+1,y+1)
enddef;

%% display the Go board together with label, stones
vardef display_board=
  draw_board;
  draw_label;
  draw_stones;
enddef;

%% put a black stone at postion pp, if possible
%% check life and death after putting the stone
%% re-put the stone to make sure it survive 
vardef put_black expr pp=
  save p;
  pair p;
  if pair pp:
    p := pp;
  else:
    p := (random_loc);
  fi;
  %show "put black at " & (_point_str p);
  if (legal_loc p):
    beginput;
    B p;
    _capture p;
    _suicide p;
    endput;
  fi;
enddef;

vardef put_b(text t)=
  save tt,h,v;
  string tt;
  numeric h,v;
  tt = str t;
  h = ASCII(substring (0,1) of tt) - ASCII("A") + 1;
  v = board_size - scantokens(substring (1, length tt) of tt) + 1;
  % show h, v;
  put_black(h,v);
enddef;

%% put a white stone at postion pp, if possible
%% check life and death after putting the stone
%% re-put the stone to make sure it survive 
vardef put_white expr pp=
  save p;
  pair p;
  if pair pp:
    p := pp;
  else:
    p := (random_loc);
  fi;
  %show "put white at " & (_point_str p);
  if (legal_loc p):
    beginput;
    W p;
    _capture p;
    _suicide p;
    endput;
  fi;
enddef;

vardef put_w(text t)=
  save tt,h,v;
  string tt;
  numeric h,v;
  tt = str t;
  h = ASCII(substring (0,1) of tt) - ASCII("A") + 1;
  v = board_size - scantokens(substring (1, length tt) of tt) + 1;
  % show h, v;
  put_white(h,v);
enddef;

%% remove stone from position pp, if possible
vardef remove_stone expr pp=
  if (xpart pp > 0) and (xpart pp < board_size+1)
    and (ypart pp > 0) and (ypart pp < board_size+1):
    C pp;
  fi;
enddef;

%% determine whether putting stone at p is leagal
%% mem[p] is empty, and p is not out of bound
vardef legal_loc expr p=
  save tmp;
  tmp = 1;
  save x,y;
  x = xpart p;
  y = ypart p;
  if ((xpart p) < 1) or ((xpart p) > board_size)
    or ((ypart p) < 1) or ((ypart p) > board_size):
    show "ILLEGAL OPERATION, cell out of bound";
    (tmp = 2)
  elseif not ((MEM p) = EMPTY):
    show "ILLEGAL OPERATION, cell occupied";
    (tmp = 2)
  else:
    % save prev; string prev;
%     prev = put_history[cur_put_his-1];
    
%     if:
%       show "ILLEGAL OPERATION, re-put comflict";
%       (tmp = 2)
%     else:
    (tmp = 1)
%    fi
  fi
enddef;

%% go script file, plain format, i.e., color x-coord y-coord
string GO_FILE;
GO_FILE := "";
FIG_COUNT = 1;

%% generate boards based on go script
vardef generate_boards_from_file=
  if (length GO_FILE) < 1:
  else:
    save line,x,y,t;
    string line,t;

    init_board;
    display_board_fig; % empty board
    forever:
      line := readfrom GO_FILE;
      exitif (length line) < 3;
      
      t := loptok line;
      x := scantokens(loptok line);
      y := scantokens(loptok line);
      
      %show "read position " & t & "=(" & (decimal x) & "," & (decimal y) & ")";

      if (t = "b") or (t = "B"):
	put_black(x,y);
      elseif (t = "w") or (t = "W"):
	put_white(x,y);
      fi;
      display_board_fig;
    endfor;
  fi;
enddef;

%% display board in new fig
vardef display_board_fig=
  beginfig(FIG_COUNT);
    display_board;
    FIG_COUNT := FIG_COUNT + 1;
  endfig;
enddef;

%GO_FILE := "test.go";
%generate_boards_from_file;

%% if possible to retract the last put action
vardef can_restore=
  (cur_put_his > 1)
enddef;

%% extract put action from string
vardef _extract_put suffix s=
  save t,x,y;
  string t,x,y;
  if (length s) < 1:
    ""
  else:
    t = loptok s;
    x = loptok s;
    y = loptok s;
    t & "(" & x & "," & y & ")"
  fi
enddef;

%% reverse put action, C->B|W, B|C, W|C
vardef _reverse suffix s=
  save t;
  string t;
  t = substring (0,1) of s;
  if (t = "B") or (t = "W"):
    t := "C";
  else:
    t := char(ASCII("A") + ASCII(t) - ASCII("a"));
  fi;
  t & (substring (1,length s) of s)
enddef;

%% retract the last put action
vardef restore=
  save prev,act;
  string prev,act;
  prev = put_history[cur_put_his-1];
  cur_put_his := cur_put_his - 1;

  forever:
    act := _extract_put prev;
    exitif (length act) = 0;
    log "restore: " & act;
    scantokens(_reverse act);
  endfor;
enddef;

%% putting stones, format: {B|W}{A-Z}{decimal}
vardef stone text tt=
  if (length tt) < 3:
    show "ERROR: stone string illegal";
  else:
    save t,ys,xs;
    string t,ys,xs;
    t = loptok tt; %substring (0,1) of tt;
    xs = loptok tt; %substring (1,2) of tt;
    ys := loptok tt; %substring (2,length tt) of tt;

    save x,y;
    x = ASCII(xs) - ASCII("A") + 1;
    y = board_size - scantokens(ys) + 1;

    log "stone " & t & " at " & (decimal x) & "," & (decimal y);
    if (t = "B") or (t = "b"):
      put_black(x,y);
    elseif (t = "W") or (t = "w"):
      put_white(x,y);
    fi;
  fi;
enddef;

%% retract the last stoning action if possible
vardef retract=
  if can_restore:
    restore;
  else:
    show "restore can not be performed";
  fi;
enddef;

%% scripting on file
vardef script text file=
  save sf;
  string sf; sf = file;
  if (length sf) < 1:
    show "ERROR: script file name illegal";
  else:
    save line,x,y,t;
    string line,t;

    %set_board_size scantokens(readfrom sf);
    init_board;
    %display_board_fig; % empty board
    forever:
      line := readfrom sf;
      exitif (length line) < 3;

      stone line;
      display_board_fig;
    endfor;
  fi;
enddef;

_DEBUG := false;

%script "script.go";


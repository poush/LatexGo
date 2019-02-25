%
% Ball score card

defaultfont:="rptmr";
defaultscale := 1;
prologues := 1;
special "/rptmr /Times-Roman def";

% pen for the outer box
pickup pencircle scaled 1 pt;
fat nib = savepen;

% pen for the cross-lines
pickup pencircle scaled .5 pt;
medium nib = savepen;

% pen for slashes
pickup pencircle scaled .1 pt;
thin nib = savepen;

un = 1 cm;

def urc (expr x,y) =
  ((x,y)-(.2un,0)){right}..{down}((x,y)-(0,.2un))
enddef;
def lrc (expr x, y) =
  ((x,y)+(0,.2un)){down}..{left}((x,y)-(.2un,0))
enddef;
def llc (expr x, y) =
  ((x,y)+(.2un,0)){left}..{up}((x,y)+(0,.2un))
enddef;
def ulc (expr x, y) =
  ((x,y)-(0,.2un)){up}..{right}((x,y)+(.2un,0))
enddef;


beginfig(-1);

  picture pitcherbox, batterbox;

  batterbox = image (
    % outer frame
    pickup fat nib;
    draw llc (0,0)---ulc (0,11un)---urc(20un,11un)---lrc (20un,0)---cycle;

    % and some frame-like lines
    draw (0,1un)---(20un,1un);
    draw (0,10un)---(20un,10un);
    draw (4un,0)---(4un,11un);

    % name separators
    pickup medium nib;
    for i = 2un step un until 9 un:
      draw (0,i)---(20un,i);
      endfor;

    for i := 5 un step un until 19 un:
      draw (i, 0)---(i, 11un);
      endfor;
% added by Dave Rebnord
    for i := 4 un step un until 14 un:
      for j := 1 un step un until 9 un :
        draw (i+0.2un,j+0.5un)---(i+0.5un, j+0.8un)---(i+0.8un,j+0.5un)---(i+0.5un,j+0.2un)---cycle withcolor .25[white, black];
      endfor;
    endfor;

    % slashes and other light lines
    pickup thin nib;
    for i := 4un step un until 15un:
      draw (i,0)---(i+un, un);
      endfor;

    for i := un step un until 9un:
      draw (0, i+.5un)---(4un, i+.5un);
      draw (15un, i)---(16un, i+un);
      draw (19un, i)---(20un, i+un);
      endfor;

    
    draw (15un, 0)---(16un, un);
    draw (19un, 0)---(20un, un);
    draw (15un, 10un)---(16un, 11un);
    draw (19un, 10un)---point .5 of (urc (20un,11un));


    % labels
    for i := 1 upto 11:
      label(decimal i, ((3.5+i)*un, 10.5un));
      endfor;

    label.rt("Totals", (0, .5un));

    label.lft("Runs", (4un, 2/3un));
    label.lft("Hits", (4un, 1/3un));


    label.bot("ab", (15.3un, 11un));
    label.top("ap", (15.7un, 10un));

    label("r", (16.5un, 10.5un));
    label("h", (17.5un, 10.5un));
    label("rbi", (18.5un, 10.5un));

    label.bot("ob", (19.3un, 11un));
    label.top("e", (19.7un, 10un));
    );


  pitcherbox = image (
    % outer frame
    pickup fat nib;
    ph = 4.5un/5;
    draw llc (0,0)---ulc (0, 5ph)---urc (20un,5ph)---lrc (20un,0)---cycle;

    % and some frame-like lines
    draw urc (10un,5ph)---lrc (10un, 4ph)---llc (0,4ph);

    draw urc (10un, 4ph)---(10un,0);
    draw (4un,0)..(4un,5ph);

    % name separators
    pickup medium nib;

    draw ulc (10un, 4ph)---(20un,4ph);
    draw llc (10un, 4ph);

    for i = ph step ph until 3ph:
      draw (0,i)---(20un,i);
      endfor;

    for i := 0 step un until 4un:
      draw (5un+i,0)---(5un+i, 5ph);
      draw (14un+i,0)---(14un+i, 5ph);
      endfor;
    draw (19un,0)---(19un, 5ph);

    label("Pitchers", (2un, 4.5ph));
    label("IP", (4.5un, 4.5ph));
    label("H", (5.5un, 4.5ph));
    label("R", (6.5un, 4.5ph));
    label("ER", (7.5un, 4.5ph));
    label("K", (8.5un, 4.5ph));
    label("BB", (9.5un, 4.5ph));
    );


  draw batterbox shifted (.75un, .75un);
  draw pitcherbox shifted (.75un, 11.85un);
  draw batterbox shifted (.75un, 16.45un);

endfig;
end;

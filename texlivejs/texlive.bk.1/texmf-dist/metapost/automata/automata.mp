% PACKAGE FOR METAPOST TO DRAW FINITE STATE MACHINES, GRAPHS, TREES, ETC.
% Author: gabriele puppis

% declares a grid of equally-spaced nodes
%
% syntax:      matrix.<name>(<#rows>,<#cols>);
% 
% example:     matrix.a(2,3);
%
% parameters:  spacing = (60,30) | ...
%              offset = (0,0) | ...
%              numbering = (0,0) | ...
%
% (nodes are identified by <name>[<row>][<col>],
%  <name> can't be c,h,x,y or any other global variable,
%  the center/anchor of a node is <name>[<row>][<col>].c/.h,
%  <row> and <col> start from 0, 
%  so <name>[0][0] is the top left-most node,
%     <name>[<#rows>-1][<#cols>-1] is the bottom right-most node)
vardef matrix@# expr d =
  pair @#[][].c;
  pair @#[][].h;
  pair @#[][].s;
  path @#[][].f;
  numeric @#[][].m;
  
  for i=0 upto xpart(d)-1:
    for j=0 upto ypart(d)-1:
      @#[xpart(numbering)+i][ypart(numbering)+j].c := 
        (xpart(spacing)*j,-ypart(spacing)*i) shifted offset;
    endfor;
  endfor;
enddef;


% declares a tree-shaped arrangement of nodes
%
% syntax:      tree.<name>(<#levels>,<arity>);
%
% example:     tree.a(4,2);
%
% parameters:  spacing = (60,30) | ...
%              offset = (0,0) | ...
%              numbering = (0,0) | ...
%
% (nodes are identified by <name>[<depth>][<child>],
%  <name> can't be c,h,x,y or any other global variable,
%  the center/anchor of a node is <name>[<depth>][<child>].c/.h,
%  <depth> and <child> start from 0, 
%  so <name>[0][0] is the root, 
%     <name>[1][0] ... <name>[1][<arity>-1] are the children of the root,
%     and so on)
vardef tree@# expr d =
  pair @#[][].c;
  pair @#[][].h;
  pair @#[][].s;
  path @#[][].f;
  numeric @#[][].m;

  for i=0 upto xpart(d)-1:
    for j=0 upto (ypart(d)**i) - 1:
      @#[xpart(numbering)+i][ypart(numbering)+j].c = 
        (xpart(spacing) * ((j+0.5)*(ypart(d)**(xpart(d)-i)) - 0.5*(ypart(d)**xpart(d))),
         -ypart(spacing) * i) shifted offset;
    endfor;
  endfor;
enddef;


% declares a single node
%
% syntax:      put.<name>(x,y);
% 
% example:     put.a(100,100);
%
% (the center/anchor of a node is <name>.c/.h,
%  <name> can't be c,h,x,y or any other global variable)
vardef put@# expr p =
  pair @#.c;
  pair @#.h;
  pair @#.s;
  path @#.f;
  numeric @#.m;
  
  @#.c := p;
enddef;


% declares an additional single node inside an existing matrix or tree 
% (or change the position of an existing node)
%
% syntax:      setpos.<name>[<row>][<col>](x,y);
% 
% example:     setpos.a[0][0](100,100);
%
% (the center/anchor of a node is <name>[<row>][<col>].c/.h)
vardef setpos@# expr p =
  @#.c := p;
enddef;


% change the position of an existing node
%
% syntax:      movepos.<name>(x,y);
% 
% example:     movepos.a(10,10);
%              movepos.b[0][0](10,10);
vardef movepos@# expr p =
  @#.c := @#.c shifted p;
  @#.h := @#.h shifted p;
enddef;


% draws an existing node 
%
% syntax:      node.<node> <label>;
%
% example:     node.a[0][0] btex $\alpha$ etex;
%
% parameters:  size = 7 | ...
%              nodemargin = 1.5 | ...
%              shape = circle | utriangle | ltriangle | btriangle | rtriangle | 
%                      boxed | fixedbox | roundbox | roundfixedbox | diamond | none
%              boxmargin = 5 | ...
%              fixedboxwidth = 14 | ...
%              fixedboxheight = 14 | ...
%              border = solid | bold | dash | double | none
%              bordercolor = black | white | ...
%              filling = none | solid | lefthalf | righthalf
%              fillingcolor = black | white | ...
%              nodelabel = yes | no
%              nodelabelcolor = black | white | ...
%              solidsize = 0.9 | ...
%              boldsize = 1.5 | ...
%              dashsize = 0.75 | ...
%              doublesize = 0.75 | ...
vardef node@#(expr l) =
  save pic,fs,fm;
  picture pic; pic := thelabel(l, (0,0));
  pair fs;
  numeric fm;

  if (shape=circle):
    @#.s := (size,size);
    @#.f := circlepath;
    @#.h := @#.c;
    fs := (size,size);
    fm := 0;
  elseif (shape=utriangle):
    @#.s := (size+solidsize,size+solidsize);
    @#.f := utrianglepath;
    @#.h := @#.c shifted (0,0.5ypart(@#.s));
    fs = (size,size);
    fm := 4solidsize;
  elseif (shape=ltriangle):
    @#.s := (size+solidsize,size+solidsize);
    @#.f := ltrianglepath;
    @#.h := @#.c shifted (-0.5xpart(@#.s),0);
    fs = (size,size);
    fm := 4solidsize;
  elseif (shape=btriangle):
    @#.s := (size+solidsize,size+solidsize);
    @#.f := btrianglepath;
    @#.h := @#.c shifted (0,-0.5ypart(@#.s));
    fs = (size,size);
    fm := 4solidsize;
  elseif (shape=rtriangle):
    @#.s := (size+solidsize,size+solidsize);
    @#.f := rtrianglepath;
    @#.h := @#.c shifted (0.5xpart(@#.s),0);
    fs := (size,size);
    fm := 4solidsize;
  elseif (shape=boxed):
    @#.s := urcorner pic - llcorner pic + (boxmargin,boxmargin);
    @#.f := squarepath;
    @#.h := @#.c;
    fs := @#.s;
    fm := 0;
  elseif (shape=fixedbox):
    @#.s := (fixedboxwidth,fixedboxheight);
    @#.f := squarepath;
    @#.h := @#.c;
    fs := @#.s;
    fm := 0;
  elseif (shape=roundbox):
    @#.s := urcorner pic - llcorner pic;
    @#.f := rrectangle(xpart(@#.s),ypart(@#.s));
    @#.h := @#.c;
    fs := @#.s;
    fm := 0;
  elseif (shape=roundfixedbox):
    @#.s := (fixedboxwidth,fixedboxheight);
    @#.f := rrectangle(xpart(@#.s),ypart(@#.s));
    @#.h := @#.c;
    fs := @#.s;
    fm := 0;
  elseif (shape=diamond):
    @#.s := (size,size);
    @#.f := diamondpath;
    @#.h := @#.c;
    fs := (size,size);
    fm := 0;
  elseif (shape=none):
    @#.s := (0,0);
    @#.f := (0,0)..(0,0);
    @#.h := @#.c;
    @#.m := 0;
    fs := (0,0);
    fm := 0;
  else:
    errmessage("Node shape not defined");
  fi

  if (shape<>none):
    
    if (filling=solid):
      if (border=double):
        fill @#.f xscaled (xpart(fs)-2doublesize) yscaled (ypart(fs)-2doublesize) 
                  shifted @#.c withcolor fillingcolor;
      else:
        fill @#.f xscaled xpart(fs) yscaled ypart(fs)
                  shifted @#.c withcolor fillingcolor;
      fi
    elseif (filling=lefthalf):
      if (border=double):
        fill buildcycle(@#.f,(0,-1)--(0,1)) 
             xscaled (xpart(fs)-2doublesize) yscaled (ypart(fs)-2doublesize) 
             shifted @#.c withcolor fillingcolor;
      else:
        fill buildcycle(@#.f,(0,-1)--(0,1)) 
             xscaled xpart(fs) yscaled ypart(fs)
             shifted @#.c withcolor fillingcolor;
      fi
    elseif (filling=righthalf):
      if (border=double):
        fill buildcycle(@#.f,(0,-1)--(0,1)) rotated 180
             xscaled (xpart(fs)-2doublesize) yscaled (ypart(fs)-2doublesize) 
             shifted @#.c withcolor fillingcolor;
      else:
        fill buildcycle(@#.f,(0,-1)--(0,1)) rotated 180
             xscaled xpart(fs) yscaled ypart(fs)
             shifted @#.c withcolor fillingcolor;
      fi
    fi
  
    if (border=solid):
      @#.m := nodemargin * solidsize + fm;
      draw @#.f xscaled xpart(fs) yscaled ypart(fs) shifted @#.c 
           withpen pencircle scaled solidsize withcolor bordercolor;
    elseif (border=bold):
      @#.m := nodemargin * boldsize + fm;
      draw @#.f xscaled xpart(fs) yscaled ypart(fs) shifted @#.c 
           withpen pencircle scaled boldsize withcolor bordercolor;
    elseif (border=dash):
      @#.m := nodemargin * solidsize + fm;
      draw @#.f xscaled xpart(fs) yscaled ypart(fs) shifted @#.c 
           withpen pencircle scaled solidsize dashed evenly scaled dashsize withcolor bordercolor;
    elseif (border=double):
      @#.m := nodemargin * solidsize + fm;
      draw @#.f xscaled (xpart(fs)-2doublesize) yscaled (ypart(fs)-2doublesize) shifted @#.c 
           withpen pencircle scaled solidsize withcolor bordercolor;
      draw @#.f xscaled xpart(fs) yscaled ypart(fs) shifted @#.c 
           withpen pencircle scaled solidsize withcolor bordercolor;
    elseif (border=none):
      @#.m := nodemargin;
    else:
      errmessage("Node border not defined");
    fi
  
  fi

  if (nodelabel=yes):
    if ((urcorner pic - llcorner pic) <> (0,0)):
      label(l, @#.c) withcolor nodelabelcolor;
    fi
  fi
enddef;


% draws an arrow between two nodes and labels it
%
% syntax:      arrow.<labelpos>(<labeloff>,<label>)(<node>,<node>) <path>;
%   where      <labelpos> = lft | rt | top | bot | ulft | urt | llft | lrt
%              <labeloff> is between 0.0 and 1.0
%              <node> is a node
%              <path> is a path
%
% example:     arrow.top(0.5, btex $a$ etex)(a[0][0],a[0][1]) a[0][0].c{dir90}..a[0][1].c;
%
% parameters:  style = solid | bold | dash | bolddash | invisible
%              arrowcolor = black | white | ...
%              arrowlabel = yes | no
%              unfillonarrowlabel = yes | no
%              unfillcolor = white | black | ...
%              arrowlabelcolor = black | white | ...
%              tipangle = 25 | ...;
%              tipsharpness = 10 | ...;
%              tipsize = 4 | ...;
%              arrowmargin = 1.5 | ...
%              solidsize = 0.9 | ...
%              boldsize = 1.5 | ...
%              dashsize = 0.75 | ...
vardef arrow@#(expr o,l)(suffix a,b) expr p =
  save cutp;
  path cutp;
  if ((style=bold) or (style=bolddash)):
    cutp := (p) cutbefore (a.f xscaled xpart(a.s) yscaled ypart(a.s) shifted a.c) 
                cutafter (b.f xscaled (xpart(b.s)+b.m+arrowmargin*boldsize) 
                              yscaled (ypart(b.s)+b.m+arrowmargin*boldsize) shifted b.c);
  else:
    cutp := (p) cutbefore (a.f xscaled xpart(a.s) yscaled ypart(a.s) shifted a.c) 
                cutafter (b.f xscaled (xpart(b.s)+b.m+arrowmargin*solidsize) 
                              yscaled (ypart(b.s)+b.m+arrowmargin*solidsize) shifted b.c);
  fi

  save endpoint,endpointdir,pathtotip,tippoint,tipa,tipb,tip;
  pair endpoint; endpoint := point length(cutp) of cutp;
  pair endpointdir; endpointdir := unitvector(direction length(cutp) of cutp);
  path pathtotip; pathtotip := cutp cutafter (circlepath scaled 2tipsize shifted endpoint);
  pair tippoint; tippoint := point length(pathtotip) of pathtotip;
  path tipa; tipa := endpoint{-endpointdir rotated tipsharpness}..
                     (endpoint - ((endpoint-tippoint) rotated tipangle));
  path tipb; tipb := endpoint{-endpointdir rotated -tipsharpness}..
                     (endpoint - ((endpoint-tippoint) rotated -tipangle));
  path tip; 
  if ((style=bold) or (style=bolddash)):
    tip := reverse(tipa)--tipb--cycle;
  else:
    tip := tipa--reverse(tipa)--tipb--reverse(tipb)--cycle;
  fi

  if (style=solid):
    draw cutp withpen pencircle scaled solidsize withcolor arrowcolor;
    draw tip withpen pencircle scaled solidsize withcolor arrowcolor;
  elseif (style=bold):
    draw cutp withpen pencircle scaled boldsize withcolor arrowcolor;
    draw tip withpen pencircle scaled boldsize withcolor arrowcolor;
  elseif (style=dash):
    draw cutp withpen pencircle scaled solidsize dashed evenly scaled dashsize withcolor arrowcolor;
    draw tip withpen pencircle scaled solidsize withcolor arrowcolor;
  elseif (style=bolddash):
    draw cutp withpen pencircle scaled boldsize dashed evenly scaled dashsize withcolor arrowcolor;
    draw tip withpen pencircle scaled boldsize withcolor arrowcolor;
  elseif (style=invisible):
  else:
    errmessage("Arrow style not defined");
  fi

  if (arrowlabel=yes):
    save lab;
    picture lab;
    lab := thelabel.@#(l, point o*length(cutp) of cutp);
    if (unfillonarrowlabel=yes):
      fill (bbox lab) withcolor unfillcolor;
    fi
    draw lab withcolor arrowlabelcolor;     
    %label.@#(l, point o*length(cutp) of cutp) withcolor arrowlabelcolor;
  fi
enddef;


% draws an arrow looping around a node and labels it
%
% syntax:      loop.<labelpos>(<labeloff>,<label>)(<node>) <dir>;
%   where      <labelpos> = lft | rt | top | bot | ulft | urt | llft | lrt
%              <labeloff> is between 0.0 and 1.0
%              <node> is a node
%              <dir> is an angle
%
% example:     loop.top(0.5, btex $a$ etex)(a[0][0]) 90;
%
% parameters:  loopsize = 15 | ...
%              looporientation = counterclockwiseorientation | clockwiseorientation
%              style = solid | bold | dash | bolddash | invisible
%              arrowcolor = black | white | ...
%              arrowlabel = yes | no
%              tipangle = 25 | ...;
%              tipsharpness = 10 | ...;
%              tipsize = 4 | ...;
%              arrowmargin = 1.5 | ...
%              boldsize = 1.5 | ...
%              dashsize = 0.75 | ...
vardef loop@#(expr o,l)(suffix a) expr d =
  save p;
  path p; 
  if (looporientation=clockwiseorientation):
    p := (-0.5*loopsize,0)..(0,0.5*loopsize)..(0.5*loopsize,0)..(0,-0.5*loopsize)..cycle;
  elseif (looporientation=counterclockwiseorientation):
    p := (-0.5*loopsize,0)..(0,-0.5*loopsize)..(0.5*loopsize,0)..(0,0.5*loopsize)..cycle;
  else:
    errmessage("Loop orientation not defined");
  fi
  arrow.@#(o,l)(a,a) (p shifted (0.6*loopsize,0) rotated d shifted a.c)
enddef;


% draws an arrow reaching a node and labels it
%
% syntax:      incoming.<labelpos>(<labeloff>,<label>)(<node>) <dir>;
%   where      <labelpos> = lft | rt | top | bot | ulft | urt | llft | lrt
%              <labeloff> is between 0.0 and 1.0
%              <node> is a node
%              <dir> is an angle
%
% example:     incoming.lft(0.5, btex $a$ etex)(a[0][0]) 90;
%
% parameters:  incominglength = 20 | ...
%              style = solid | bold | dash | bolddash
%              arrowcolor = black | white | ...
%              arrowlabel = yes | no
%              tipangle = 25 | ...;
%              tipsharpness = 10 | ...;
%              tipsize = 4 | ...;
%              arrowmargin = 1 | ...
%              boldsize = 1.5 | ...
%              dashsize = 0.75 | ...
vardef incoming@#(expr o,l)(suffix a) expr d =
  save incoming_a;
  put.incoming_a ((incominglength,0) rotated d shifted a.c);
  node_marker.incoming_a("");

  arrow.@#(o,l)(incoming_a,a) incoming_a.c--a.c;
enddef;


% draws an arrow departing from a node and labels it
%
% syntax:      outgoing.<labelpos>(<labeloff>,<label>)(<node>) <dir>;
%   where      <labelpos> = lft | rt | top | bot | ulft | urt | llft | lrt
%              <labeloff> is between 0.0 and 1.0
%              <node> is a node
%              <dir> is an angle
%
% example:     outgoing.lft(0.5, btex $a$ etex)(a[0][0]) 90;
%
% parameters:  outgoinglength = 20 | ...
%              style = solid | bold | dash | bolddash
%              arrowcolor = black | white | ...
%              arrowlabel = yes | no
%              tipangle = 25 | ...;
%              tipsharpness = 10 | ...;
%              tipsize = 4 | ...;
%              arrowmargin = 1 | ...
%              boldsize = 1.5 | ...
%              dashsize = 0.75 | ...
vardef outgoing@#(expr o,l)(suffix a) expr d =
  save outgoing_a;
  put.outgoing_a ((outgoinglength,0) rotated d shifted a.c);
  node_marker.outgoing_a("");

  arrow.@#(o,l)(a,outgoing_a) a.c--outgoing_a.c;
enddef;


% this function can be used to enclose a sequence of points inside a bounding area
%
% syntax:      enclose <path>;
%   where      <path> is a closed path, whose points are listed in clockwise order
%
% example:     enclose a[0][0].c--a[0][1].c--a[1][1].c--cycle;
%
% parameters:  style = solid | bold | dash | bolddash
%              enclosurecolor = black | white | ...
%              enclosuremargin = 5 | ...
%              solidsize = 0.9 | ...
%              boldsize = 1.5 | ...
%              dashsize = 0.75 | ...
vardef enclose expr p =
  if (style=solid):
    draw enclosure(p) withpen pencircle scaled solidsize withcolor enclosurecolor;
  elseif (style=bold):
    draw enclosure(p) withpen pencircle scaled boldsize withcolor enclosurecolor;
  elseif (style=dash):
    draw enclosure(p) withpen pencircle scaled solidsize dashed evenly scaled dashsize withcolor enclosurecolor;
  elseif (style=bolddash):
    draw enclosure(p) withpen pencircle scaled boldsize dashed evenly scaled dashsize withcolor enclosurecolor;
  else:
    errmessage("Arrow style not defined");
  fi
enddef;


% shorthand macros
def node_circle = with shape(circle) node enddef;
def node_utriangle = with shape(utriangle) node enddef;
def node_ltriangle = with shape(ltriangle) node enddef;
def node_dtriangle = with shape(dtriangle) node enddef;
def node_rtriangle = with shape(rtriangle) node enddef;
def node_diamond = with shape(diamond) node enddef;
def node_unfilled = with filling(none) node enddef;
def node_filled = with filling(solid) node enddef;
def node_filledleft = with filling(lefthalf) node enddef;
def node_filledright = with filling(righthalf) node enddef;
def node_solid = with border(solid) node enddef;
def node_bold = with border(bold) node enddef;
def node_dash = with border(dash) node enddef;
def node_double = with border(double) node enddef;
def node_hidden = with border(none) node enddef;
def node_boxed = with shape(boxed) node enddef;
def node_fixed = with shape(fixedbox) node enddef;
def node_roundbox = with shape(roundbox) node enddef;
def node_roundfixed = with shape(roundfixedbox) node enddef;
def node_marker = with shape(none) node enddef;
def arrow_solid = with style(solid) arrow enddef;
def arrow_bold = with style(bold) arrow enddef;
def arrow_dash = with style(dash) arrow enddef;
def arrow_bolddash = with style(bolddash) arrow enddef;
def arrow_invisible = with style(invisible) arrow enddef;
def loop_solid = with style(solid) loop enddef;
def loop_bold = with style(bold) loop enddef;
def loop_dash = with style(dash) loop enddef;
def loop_bolddash = with style(bolddash) loop enddef;
def loop_invisible = with style(invisible) loop enddef;
def loop_cw = with looporientation(clockwiseorientation) loop enddef;
def loop_ccw = with looporientation(counterclockwiseorientation) loop enddef;
def incoming_solid = with style(solid) incoming enddef;
def incoming_bold = with style(bold) incoming enddef;
def incoming_dash = with style(dash) incoming enddef;
def incoming_bolddash = with style(bolddash) incoming enddef;
def incoming_invisible = with style(invisible) incoming enddef;
def outgoing_solid = with style(solid) outgoing enddef;
def outgoing_bold = with style(bold) outgoing enddef;
def outgoing_dash = with style(dash) outgoing enddef;
def outgoing_bolddash = with style(bolddash) outgoing enddef;
def outgoing_invisible = with style(invisible) outgoing enddef;
def enclose_solid = with style(solid) enclose enddef;
def enclose_bold = with style(bold) enclose enddef;
def enclose_dash = with style(dash) enclose enddef;
def enclose_bolddash = with style(bolddash) enclose enddef;
def enclose_thin = with style(dash) dashsize(0.5) enclose enddef;
% e.g. with fillingcolor(black) node ...
vardef with@#(expr v) text e = push.@#; @# := v; e; pop.@# enddef;
% e.g. light.gray, light.light.gray, ...
vardef dark@# = 0.5[@#,black] enddef;
vardef light@# = 0.5[white,@#] enddef;
def gray = dark.white enddef;
% e.g. push fillingcolor; fillingcolor := gray; ... pop fillingcolor;
vardef push@# = @#.back[@#.count] := @#; @#.count := @#.count + 1 enddef;
vardef pop@# = @#.count := @#.count - 1; @# := @#.back[@#.count] enddef;


% default paths
def circlepath = ((0.5,0)..(0,0.5)..(-0.5,0)..(0,-0.5)..cycle) enddef;
def trianglepath = ((0.433,-0.25)--(0,0.5)--(-0.433,-0.25)--cycle) enddef;
def utrianglepath = trianglepath enddef;
def ltrianglepath = (trianglepath rotated 90) enddef;
def btrianglepath = (trianglepath rotated 180) enddef;
def rtrianglepath = (trianglepath rotated 270) enddef;
def squarepath = ((0.5,-0.5)--(-0.5,-0.5)--(-0.5,0.5)--(0.5,0.5)--cycle) enddef;
def diamondpath = ((0.5,0)--(0,0.5)--(-0.5,0)--(0,-0.5)--cycle) enddef;
def urdiamondpath = ((0,0.5)--(0.5,0)--(0,0)--cycle) enddef;
def uldiamondpath = ((-0.5,0)--(0,0.5)--(0,0)--cycle) enddef;
def lrdiamondpath = ((0.5,0)--(0,-0.5)--(0,0)--cycle) enddef;
def lldiamondpath = ((0,0)--(0,-0.5)--(-0.5,0)--cycle) enddef;
vardef rrectangle(expr w,h) = (((0.5w-0.25h,-0.5h)---(-0.5w+0.25h,-0.5h)..
                                (-0.5w+0.25h,0.5h)---(0.5w-0.25h,0.5h)..cycle) 
                               xscaled (1/w) yscaled (1/h)) enddef;
vardef sqr(expr x) = ((x)*(x)) enddef;
vardef firstenclosurepoint(expr p,q) = ((ypart(p)-ypart(q)) * sqrt(sqr(enclosuremargin) / (sqr(xpart(p)-xpart(q)) + sqr(ypart(p)-ypart(q)))) + xpart(p),
                                        (xpart(q)-xpart(p)) * sqrt(sqr(enclosuremargin) / (sqr(xpart(p)-xpart(q)) + sqr(ypart(p)-ypart(q)))) + ypart(p)) enddef;
vardef secondenclosurepoint(expr p,q) = ((ypart(p)-ypart(q)) * sqrt(sqr(enclosuremargin) / (sqr(xpart(p)-xpart(q)) + sqr(ypart(p)-ypart(q)))) + xpart(q),
                                         (xpart(q)-xpart(p)) * sqrt(sqr(enclosuremargin) / (sqr(xpart(p)-xpart(q)) + sqr(ypart(p)-ypart(q)))) + ypart(q)) enddef;       vardef enclosuresegment(expr p,q) = firstenclosurepoint(p,q)---secondenclosurepoint(p,q) enddef;                   
vardef enclosure(expr p) =
  save enc;
  save i;
  path enc;
  if (pair p):
    enc := circlepath scaled (2*enclosuremargin) shifted point 1 of p;
  else:
    enc := enclosuresegment(point 0 of p, point 1 of p);
    for i=1 upto length(p)-1:
      enc := enc..enclosuresegment(point i of p, point i+1 of p);
    endfor;
    enc := enc..cycle;
  fi
  enc
enddef;


% general appearence constants and variables
def none             = 1 enddef;
def yes              = 2 enddef;
def no               = 3 enddef;
def circle           = 10 enddef;
def utriangle        = 11 enddef;
def ltriangle        = 12 enddef;
def btriangle        = 13 enddef;
def rtriangle        = 14 enddef;
def boxed            = 15 enddef;
def fixedbox         = 16 enddef;
def roundbox         = 17 enddef;
def roundfixedbox    = 18 enddef;
def diamond          = 19 enddef;
def solid            = 20 enddef;
def lefthalf         = 21 enddef;
def righthalf        = 22 enddef;
def bold             = 30 enddef;
def dash             = 31 enddef;
def bolddash         = 32 enddef;
def double           = 33 enddef;
def invisible        = 34 enddef;
def clockwiseorientation = 40 enddef;
def counterclockwiseorientation = 41 enddef;

pair spacing;
pair offset;
pair numbering;
numeric size; 
numeric shape; 
numeric boxmargin; 
numeric fixedboxwidth; 
numeric fixedboxheight; 
numeric border; 
numeric filling; 
numeric style;
numeric nodelabel;
numeric arrowlabel; 
numeric unfillonarrowlabel; 
numeric tipangle; 
numeric tipsharpness;
numeric tipsize; 
numeric loopsize;
numeric looporientation;
numeric incominglength;
numeric outgoinglength;
numeric solidsize;
numeric boldsize;
numeric dashsize; 
numeric doublesize; 
numeric nodemargin; 
numeric arrowmargin;
numeric enclosuremargin;
color bordercolor;
color fillingcolor;
color nodelabelcolor;
color arrowcolor;
color arrowlabelcolor;
color unfillcolor; 
color enclosurecolor;

spacing = (60,30);
offset = (0,0);
numbering = (0,0);
size := 5;
shape := circle;
boxmargin := 5;
fixedboxwidth := 14;
fixedboxheight := 14;
border := solid;
filling := none; 
style := solid;
nodelabel := yes;
arrowlabel := yes;
unfillonarrowlabel := no;
unfillcolor := white;
tipangle := 20; 
tipsharpness := 15;
tipsize := 4; 
loopsize := 14;
looporientation := counterclockwiseorientation;
incominglength := 20;
outgoinglength := 20;
solidsize := 0.7;
boldsize := 1.5;
dashsize := 0.7;
doublesize := 1.3; 
nodemargin := 1.5;
arrowmargin := 3.8;
enclosuremargin := 5;
bordercolor = black;
fillingcolor = black;
nodelabelcolor = black;
arrowcolor = black;
arrowlabelcolor = black;
enclosurecolor = gray;
linecap := butt;
linejoin := mitered;


% variable stacks
pair spacing.back[];
pair offset.back[];
pair numbering.back[];
numeric size.back[]; 
numeric shape.back[]; 
numeric boxmargin.back[]; 
numeric fixedboxwidth.back[]; 
numeric fixedboxheight.back[]; 
numeric border.back[]; 
numeric filling.back[]; 
numeric style.back[];
numeric nodelabel.back[];
numeric arrowlabel.back[]; 
numeric unfillonarrowlabel.back[]; 
numeric tipangle.back[]; 
numeric tipsharpness.back[];
numeric tipsize.back[]; 
numeric loopsize.back[];
numeric looporientation.back[];
numeric incominglength.back[];
numeric outgoinglength.back[];
numeric solidsize.back[];
numeric boldsize.back[];
numeric dashsize.back[]; 
numeric doublesize.back[]; 
numeric nodemargin.back[]; 
numeric arrowmargin.back[];
numeric enclosuremargin.back[];
color bordercolor.back[];
color fillingcolor.back[];
color nodelabelcolor.back[];
color arrowcolor.back[];
color arrowlabelcolor.back[];
color unfillcolor.back[]; 
color enclosurecolor.back[];

numeric spacing.count;
numeric offset.count;
numeric numbering.count;
numeric size.count; 
numeric shape.count; 
numeric boxmargin.count; 
numeric fixedboxwidth.count; 
numeric fixedboxheight.count; 
numeric border.count; 
numeric filling.count; 
numeric style.count;
numeric nodelabel.count;
numeric arrowlabel.count; 
numeric unfillonarrowlabel.count; 
numeric unfillcolor.count; 
numeric tipangle.count; 
numeric tipsharpness.count;
numeric tipsize.count; 
numeric loopsize.count;
numeric looporientation.count;
numeric incominglength.count;
numeric outgoinglength.count;
numeric solidsize.count;
numeric boldsize.count;
numeric dashsize.count; 
numeric doublesize.count; 
numeric nodemargin.count; 
numeric arrowmargin.count;
numeric enclosuremargin.count;
numeric bordercolor.count;
numeric fillingcolor.count;
numeric nodelabelcolor.count;
numeric arrowcolor.count;
numeric arrowlabelcolor.count;
numeric enclosurecolor.count;

spacing.count := 0;
offset.count := 0;
numbering.count := 0;
size.count := 0; 
shape.count := 0; 
boxmargin.count := 0; 
fixedboxwidth.count := 0; 
fixedboxheight.count := 0; 
border.count := 0; 
filling.count := 0; 
style.count := 0;
nodelabel.count := 0;
arrowlabel.count := 0; 
unfillonarrowlabel.count := 0; 
unfillcolor.count := 0; 
tipangle.count := 0; 
tipsharpness.count := 0;
tipsize.count := 0; 
loopsize.count := 0;
looporientation.count := 0;
incominglength.count := 0;
outgoinglength.count := 0;
solidsize.count := 0;
boldsize.count := 0;
dashsize.count := 0; 
doublesize.count := 0; 
nodemargin.count := 0; 
arrowmargin.count := 0;
enclosuremargin.count := 0;
bordercolor.count := 0;
fillingcolor.count := 0;
nodelabelcolor.count := 0;
arrowcolor.count := 0;
arrowlabelcolor.count := 0;
enclosurecolor.count := 0;

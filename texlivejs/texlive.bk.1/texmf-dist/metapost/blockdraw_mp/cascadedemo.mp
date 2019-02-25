verbatimtex
%& latex
\documentclass[a4]{article}
\begin{document}
etex

input blockdraw;
input ./docblockprefs;


beginfig( -1 )

  % The controller box has corners (x1,y1), (x2,y2)
  % The inner system box has corners (x3,y3), (x4,y4)
  y1 := -2u;
  y2 := 1.3u;
  y3 := -1.4u;
  y4 := 1u;
  
  picture reg[];
  reg1 := longblock( btex Reg.~1 etex, (-1u,0) );
  reg2 := longblock( btex Reg.~2 etex, (-4u,0) );

  picture G[];
  G1 := longblock( btex $G_{1}$ etex, (1.5u,0) );
  G2 := longblock( btex $G_{2}$ etex, (4u,0) );

  picture terminator[];
  terminator1 := pointpicture( leftpoint( reg2, 2, 2 ) - (1u,0) );
  terminator2 := pointpicture( (5.5u,0) );

  path con;
  picture lab;
  
  con := hhconnect( center( terminator1 ), leftpoint( reg2, 2, 2 ), 0.5, 0 );
  lab := conlabel( to_ulft, btex $y_{\mathrm{ref}}$ etex, point infinity of con );
  x1 := xpart( mspoint( con, 0.2, 0 ) );
  
  con := hhconnect( rightpoint( reg2, 2, 2 ), leftpoint( reg1, 2, 2 ), 0.5, 0 );
  lab := conlabel( to_urt, btex $z_{\mathrm{ref}}$ etex, point 0 of con );
  x3 := xpart( mspoint( con, 0.6, 0 ) );
  
  con := rlconnect( reg1, G1 );
  lab := conlabel( to_top, btex $u$ etex, mspoint( con, 0.8, 0 ) );
  x2 := xpart( mspoint( con, 0.3, 0 ) );

  picture split[];  

  con := rlconnect( G1, G2 );
  lab := conlabel( to_top, btex $z$ etex, mspoint( con, 0.8, 0 ) );
  split1 := splitdot( mspoint( con, 0.3, 0 ) );
  x4 := xpart( mspoint( con, 0.5, 0 ) );

  con := rlconnect( G2, terminator2 );
  lab := conlabel( to_top, btex $y$ etex, mspoint( con, 0.8, 0 ) );
  split2 := splitdot( mspoint( con, 0.4, 0 ) );

  % Draw boxes
  draw (x1,y1)--(x1,y2)--(x2,y2)--(x2,y1)--cycle withpen pencircle scaled dashlw dashed gldash1;
  draw (x3,y3)--(x3,y4)--(x4,y4)--(x4,y3)--cycle withpen pencircle scaled dashlw dashed gldash2;

  % Draw broken connections
  pair p;
  p := ( x2, 0.5[y1,y3] );
  con := vhconnect( center split2, p );
  con := hhconnect( p, leftpoint( reg2, 2, 1 ), 1, 0.4u );

  p := ( x2, 1.5[y1,y3] );
  con := vhconnect( center split1, p );
  con := hhconnect( p, leftpoint( reg1, 2, 1 ), 1, 0.4u );

endfig;
end;

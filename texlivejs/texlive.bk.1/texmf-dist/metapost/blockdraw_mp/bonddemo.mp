verbatimtex
%& latex
\documentclass[a4]{article}
\begin{document}
etex

input bondgraph;
def pjunction(expr z ) =
  junction( btex p etex, z )
enddef;
def sjunction(expr z ) =
  junction( btex s etex, z )
enddef;
def tfjunction(expr z, arrowdir, lbl ) =
  junctionlbl( btex TF etex, arrowdir, lbl, z, true )
enddef;
def gyjunction(expr z, arrowdir, lbl ) =
  junctionlbl( btex GY etex, arrowdir, lbl, z, false )
enddef;

beginfig( -1 )
  numeric u;
  u := 2cm;
  ahlength := 0.15*u;
  
  picture j[];
  j1 := sjunction( (1u,1u) );
  j2 := gyjunction( (2u,1u), to_rt, btex $\mu$ etex );
  j3 := sjunction( (3u,1u) );
  j4 := tfjunction( (4u,1u), to_rt, btex $r$ etex );
  j5 := pjunction( (5u,1u) );
  j6 := sjunction( (5u,-0.5u) );
  j7 := sjunction( (5u,2u) );
  
  tbond( bgconnect( j1, j2 ) );
  hbond( bgconnect( j2, j3 ) );
  tbond( bgconnect( j3, j4 ) );
  tbond( bgconnect( j4, j5 ) );
  hbond( bgconnect( j5, j6 ) );
  tbond( bgconnect( j5, j7 ) );

  tbond( terminalfr( j1, btex R: $\phi_{1}(\bullet)$ etex, (1u,0u) ) );
  hbond( terminalfr( j1, btex I: $m_{1}$ etex, (1u,2u) ) );
  hbond( terminalfr( j3, btex I: $m_{2}$ etex, (3u,2u) ) );
  tbond( terminalfr( j3, btex R: $R_{2}$ etex, (center j3)+1u*dir(-120) ) );
  tbond( terminalfr( j3, btex R: $R_{3}$ etex, (center j3)+1u*dir(-60) ) );

  hbond( terminalto( j6, btex $S_{\mathrm{e}}$ etex, (center j6)+(-1u,0u) ) );
  hbond( terminalfr( j6, btex I: $m_{3}$ etex, (center j6)+(1u,0u) ) );

  tbond( terminalfr( j7, btex C: $C_{1}$ etex, (4u,2u) ) );
  tbond( terminalfr( j7, btex R: $R_{1}$ etex, (6u,2u) ) );

  path con;
  picture lab;

  con := terminalto( j1, btex $S_{\mathrm{e}}$ etex, (0u,1u) );
  hbond( con );
  flowlabel( con, btex f etex );
  effortlabel( con, btex e etex );

endfig;
end;

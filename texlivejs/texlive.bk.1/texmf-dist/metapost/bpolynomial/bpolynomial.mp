%%% bpolynomial.mp
%%% Copyright 2007 Stephan Hennig <stephanhennig@arcor.de>
%
% This work may be distributed and/or modified under the conditions of
% the LaTeX Project Public License, either version 1.3 of this license
% or (at your option) any later version.  The latest version of this
% license is in http://www.latex-project.org/lppl.txt
%

%%% Identify yourself.
if known bpolynomial_fileversion: endinput fi;
string bpolynomial_fileversion;
bpolynomial_fileversion := "v0.5 (2007/12/12)";
message "Loading bpolynomial " & bpolynomial_fileversion;


%%% Main user macro for defining polynomials.
%%% Arguments are a suffix and the coefficients
%%%  of the function a*x^3 + b*x^2 + c*x + d.
vardef newBPolynomial@#(expr a, b, c, d)=
  bpolynomial__defineBPolynomial.@#(a, b, c, d);
  bpolynomial__defineBPolynomial.@#'(0, 3a, 2b, c);
  bpolynomial__defineBPolynomial.@#''(0, 0, 6a, 2b);
  bpolynomial__defineBPolynomial.@#'''(0, 0, 0, 6a);
enddef;


%%% This macro returns the path of a Bezier curve that matches
%%% a function a*x^3 + b*x^2 + c*x + d between two points A and D.
%%% This macro is the heart of this package and is used by
%%% several other macros.
%%% Arguments are the coefficients of the polynomial and the
%%% start and end point of the graph/path.
vardef bpolynomial__getBezierFromPolynomial(expr a, b, c, d, A, D)=
save xA,xB,xC,xD,yA,yB,yC,yD;
save xl,yl,xr,yr,dx;
numeric xA,xB,xC,xD,yA,yB,yC,yD;
numeric xl,yl,xr,yr,dx;
  xl := xpart A;
  yl := ypart A;
  xr := xpart D;
  yr := ypart D;
  dx := xpart D - xpart A;
  %%% Original equation system for x values.
%   xA                  = xl;
%   3(xB - xA)          = dx;
%   3(xC - 2xB + xA)    = 0;
%   xD - 3xC + 3xB - xA = 0;
  %%% Modified equation system.
  xA := xl;
  xB := xl + dx/3;
  xC := xr - dx/3;
  xD := xr;
  %%% Original equation system for y values.
%   yA                  = ((a*xl + b)*xl + c)*xl + d;
%   3(yB - yA)          = dx*((3a*xl + 2b)*xl + c);
%   3(yC - 2yB + yA)    = dx*dx*(3a*xl + b);
%   yD - 3yC + 3yB - yA = a*dx*dx*dx;
  %%% Modified equation system.
  yA               := yl;
  3(yB - yA)       = dx*((3a*xl + 2b)*xl + c);
  3(yC - 2yB + yA) = dx*dx*(3a*xl + b);
  yD               := yr;
  %%% Return path A..controls B and C..D.
  (xA,yA)..controls (xB,yB) and (xC,yC)..(xD,yD)
enddef;


%%% This macro returns the path of a Bezier curve that matches
%%% a function a*x^3 + b*x^2 + c*x + d in the range [xl, xr].
%%% Arguments are the coefficients of the polynomial and the
%%% range boundaries of the graph/path.
vardef getBezierFromPolynomial(expr a, b, c, d, xl, xr)=
  bpolynomial__getBezierFromPolynomial(a, b, c, d,
    (xl, ((a*xl+b)*xl+c)*xl+d),
    (xr, ((a*xr+b)*xr+c)*xr+d))
enddef;


%%% This macro returns the path of a Bezier curve that matches
%%% a function a*x^3 + b*x^2 + c*x + d in the range [xl, xr].
%%% Arguments are the coefficients of the polynomial and the
%%% range boundaries of the graph/path.
vardef getBezierFromSqrRoot(expr u, v, w, xl, xr)=
save yl, yr;
numeric yl,yr;
    if (xl >= -v):
      yl := xl;
    else:
      message "Package bpolynomial warning:  Replacing lower range boundary " & decimal xl & " by " & decimal -v & "!";
      yl := -v;
    fi
    if (xr >= -v):
      yr := xr;
    else:
      message "Package bpolynomial warning:  Replacing upper range boundary " & decimal xr & " by " & decimal -v & "!";
      yr := -v;
    fi
  bpolynomial__getBezierFromPolynomial(0, 1/u/u, -2*w/u/u, (w/u)*(w/u)-v,
    (u*sqrt(yl+v)+w, yl),
    (u*sqrt(yr+v)+w, yr)) reflectedabout ((0,0),(1,1))
enddef;


%%% This macro returns the path of a Bezier curve that matches
%%% a function a*x^3 + b*x^2 + c*x + d in the range [xl, xr].
%%% Arguments are the coefficients of the polynomial and the
%%% range boundaries of the graph/path.
vardef getBezierFromCubRoot(expr u, v, w, xl, xl)=
save yl, yr;
numeric yl,yr;
    if (xl >= -v):
      yl := xl;
    else:
      message "Package bpolynomial warning:  Replacing lower range boundary " & decimal xl & " by " & decimal -v & "!";
      yl := -v;
    fi
    if (xr >= -v):
      yr := xr;
    else:
      message "Package bpolynomial warning:  Replacing upper range boundary " & decimal xr & " by " & decimal -v & "!";
      yr := -v & "!";
    fi
  bpolynomial__getBezierFromPolynomial(1/u/u/u, -3w/u/u/u, 3(w/u)*(w/u)/u, (w/u)*(w/u)*(w/u)-v,
    (u*((yl+v)**(1/3))+w, yl),
    (u*((yr+v)**(1/3))+w, yr)) reflectedabout ((0,0),(1,1))
enddef;


%%% This internal macro defines a new polynomial.
%%% Arguments are a suffix macro and the coefficients
%%% of the polynomial a*x^3 + b*x^2 + c*x + d.
vardef bpolynomial__defineBPolynomial@#(expr ca,cb,cc,cd)=
numeric @#.a, @#.b, @#.c, @#.d;
  %%% Save coefficients for later access.
  %%% Variable @#.a refers to coefficient a of polynomial @#.
  @#.a := ca;
  @#.b := cb;
  @#.c := cc;
  @#.d := cd;
  
  %%% This macro returns values of polynomial @#.
  %%% Argument is an x value.
  vardef @#.eval(expr x)=
    (((@#.a*x + @#.b)*x + @#.c)*x + @#.d)
  enddef;
  
  %%% This macro returns the path corresponding to polynomial @#
  %%% on the intervall [xl, xr].
  vardef @#.getPath(expr xl,xr)=
    bpolynomial__getBezierFromPolynomial(@#.a, @#.b, @#.c, @#.d, (xl, @#.eval(xl)), (xr, @#.eval(xr)))
  enddef;
  
  %%% This macro returns a path tangent to @# at point (x, f(x))
  %%% covering the interval [x+xm, x+xp].
  vardef @#.getTangent(expr x, xm, xp)=
  save m, y;
  numeric m, y;
    m := (3@#.a*x + 2@#.b)*x + @#.c;
    y := @#.eval(x);
    (x+xm, y + m*xm) -- (x+xp, y + m*xp)
  enddef;
  
enddef;


%%% This macro defines a new square root.
%%% Arguments are a suffix macro and the parameters
%%% of the function u*(x + v)^(1/2) + w.
vardef newBSqrRoot@#(expr cu,cv,cw)=
numeric @#.a, @#.b, @#.c, @#.d;
numeric @#.u, @#.v, @#.w;
  %%% Save parameters for later access.
  %%% Variable @#.v refers to parameters of square root @#.
  %%% Variables @#.a to @#.d store the coefficients of the
  %%% corresponding polynomial.
  @#.u := cu;
  @#.v := cv;
  @#.w := cw;
  @#.a := 0;
  @#.b := 1/cu/cu;
  @#.c := -2*cw/cu/cu;
  @#.d := (cw/cu)*(cw/cu)-cv;
  
  %%% This macro returns values of polynomial @#.
  %%% Argument is an x value.
  vardef @#.eval(expr x)=
    if (x >= -@#.v):
      @#.u*sqrt(x + @#.v) + @#.w
    else:
      message "Package bpolynomial warning:  Cannot evaluate function at x = " & decimal x & "!";
      @#.w
    fi
  enddef;
  
  %%% This macro returns the path corresponding to square root @#
  %%% on the intervall [yl, yr].  The path of the corresponing
  %%% polynomial is computed and then transformed.
  vardef @#.getPath(expr xl,xr)=
  save yl, yr;
  numeric yl, yr;
    if (xl >= -@#.v):
      yl := xl;
    else:
      message "Package bpolynomial warning:  Replacing lower range boundary " & decimal xl & " by " & decimal -@#.v & "!";
      yl := -@#.v;
    fi
    if (xr >= -@#.v):
      yr := xr;
    else:
      message "Package bpolynomial warning:  Replacing upper range boundary " & decimal xr & " by " & decimal -@#.v & "!";
      yr := -@#.v;
    fi
    bpolynomial__getBezierFromPolynomial(@#.a, @#.b, @#.c, @#.d, (@#.eval(yl), yl), (@#.eval(yr), yr))
    reflectedabout ((0,0),(1,1))
  enddef;
  
  %%% This macro returns a path tangent to square root @#
  %%% at point (x, f(x)) covering the interval [x+xm, x+xp].
  vardef @#.getTangent(expr x, epsl, epsr)=
  save m, y;
  numeric m, y;
    if (x >= -@#.v):
      m := @#.u/(2sqrt(x + @#.v));
      y := @#.eval(x);
      (x+epsl, y + m*epsl) -- (x+epsr, y + m*epsr)
    else:
      message "Package bpolynomial warning:  Cannot draw tangent at x = " & decimal x & "!";
      (-@#.v, @#.w)--(-@#.v, @#.w+1)
    fi
  enddef;
  
enddef;

  
%%% This macro defines a new cubic root.
%%% Arguments are a suffix macro and the parameters
%%% of the function u*(x + v)^(1/3) + w.
vardef newBCubRoot@#(expr cu,cv,cw)=
numeric @#.a, @#.b, @#.c, @#.d;
numeric @#.u, @#.v, @#.w;
  %%% Save parameters for later access.
  %%% Variable @#.v refers to parameters of cubic root @#.
  %%% Variables @#.a to @#.d store the coefficients of the
  %%% corresponding polynomial.
  @#.u := cu;
  @#.v := cv;
  @#.w := cw;
  @#.a := 1/cu/cu/cu;
  @#.b := -3cw/cu/cu/cu;
  @#.c := 3(cw/cu)*(cw/cu)/cu;
  @#.d := (cw/cu)*(cw/cu)*(cw/cu)-cv;
  
  %%% This macro returns values of polynomial @#.
  %%% Argument is an x value.
  vardef @#.eval(expr x)=
    if (x >= -@#.v):
      @#.u*((x+@#.v)**(1/3)) + @#.w
    else:
      message "Package bpolynomial warning:  Cannot evaluate function at x = " & decimal x & "!";
      @#.w
    fi
  enddef;
  
  %%% This macro returns the path corresponding to cubic root @#
  %%% on the intervall [yl, yr].  The path of the corresponing
  %%% polynomial is computed and then transformed.
  vardef @#.getPath(expr xl,xr)=
  save yl, yr;
  numeric yl, yr;
    if (xl >= -@#.v):
      yl := xl;
    else:
      message "Package bpolynomial warning:  Replacing lower range boundary " & decimal xl & " by " & decimal -@#.v & "!";
      yl := -@#.v;
    fi
    if (xr >= -@#.v):
      yr := xr;
    else:
      message "Package bpolynomial warning:  Replacing upper range boundary " & decimal xr & " by " & decimal -@#.v & "!";
      yr := -@#.v;
    fi
    bpolynomial__getBezierFromPolynomial(@#.a, @#.b, @#.c, @#.d, (@#.eval(yl), yl), (@#.eval(yr), yr))
      reflectedabout ((0,0),(1,1))
  enddef;
  
  %%% This macro returns a path tangent to cubic root @#
  %%% at point (x, f(x)) covering the interval [x+xm, x+xp].
  vardef @#.getTangent(expr x, epsl, epsr)=
  save m, y;
  numeric m, y;
    if (x >= -@#.v):
      m := @#.u/3/((x + @#.v)**(2/3));
      y := @#.eval(x);
      (x+epsl, y + m*epsl) -- (x+epsr, y + m*epsr)
    else:
      message "Package bpolynomial warning:  Cannot draw tangent at x = " & decimal x & "!";
      (-@#.v, @#.w)--(-@#.v, @#.w+1)
    fi
  enddef;
  
enddef;

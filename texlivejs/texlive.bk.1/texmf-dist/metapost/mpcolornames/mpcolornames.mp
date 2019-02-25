%%% file mpcolornames.mp
%%% Copyright 2009, 2011 Stephan Hennig
%
% This work may be distributed and/or modified under the conditions of
% the LaTeX Project Public License, either version 1.3 of this license
% or (at your option) any later version.  The latest version of this
% license is in http://www.latex-project.org/lppl.txt
%
if known mpcolornames_fileversion: endinput fi;
string mpcolornames_fileversion;
mpcolornames_fileversion := "v0.20 (2011/07/14)";
message "Loading package mpcolornames.mp " & mpcolornames_fileversion;

%%% Load color name definitions.
input mpcolornames-spec-dvipsnam-def
input mpcolornames-spec-svgnam-def
input mpcolornames-spec-x11nam-def
input mpcolornames-spec-xcolor-sty

%%% Declare all color variable identifiers.
_mpcolornames_spec_dvipsnam_def;
_mpcolornames_spec_svgnam_def;
_mpcolornames_spec_xelevennam_def;
_mpcolornames_spec_xcolor_sty;


%%% This user macro saves all color identifiers clashing
%%% in DVIPS and SVG specification and re-declares all
%%% DVIPS color names (see macro svgnames).
def dvipsnames=
save Aquamarine, Black, Blue, BlueViolet, Brown, CadetBlue,
  CornflowerBlue, Cyan, DarkOrchid, ForestGreen, Fuchsia, Goldenrod,
  Gray, Green, GreenYellow, Lavender, LimeGreen, Magenta, Maroon,
  MidnightBlue, NavyBlue, Orange, OrangeRed, Orchid, Plum, Purple, Red,
  RoyalBlue, Salmon, SeaGreen, SkyBlue, SpringGreen, Tan, Thistle,
  Turquoise, Violet, VioletRed, White, Yellow, YellowGreen;
  _mpcolornames_spec_dvipsnam_def;
enddef;

%%% This user macro saves all color identifiers clashing
%%% in DVIPS and SVG specification and re-declares all
%%% SVG color names (see macro dvipsnames).
def svgnames=
save Aquamarine, Black, Blue, BlueViolet, Brown, CadetBlue,
  CornflowerBlue, Cyan, DarkOrchid, ForestGreen, Fuchsia, Goldenrod,
  Gray, Green, GreenYellow, Lavender, LimeGreen, Magenta, Maroon,
  MidnightBlue, NavyBlue, Orange, OrangeRed, Orchid, Plum, Purple, Red,
  RoyalBlue, Salmon, SeaGreen, SkyBlue, SpringGreen, Tan, Thistle,
  Turquoise, Violet, VioletRed, White, Yellow, YellowGreen;
  _mpcolornames_spec_svgnam_def;
enddef;

%%% Define color model constants.
newinternal nomodel, greyscalemodel, rgbmodel, cmykmodel;
nomodel := 1;
greyscalemodel := 3;
rgbmodel := 5;
cmykmodel := 7;

endinput

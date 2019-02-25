% Public domain.
% Created 2012-2016, Palle Joergensen, hamselv(at)pallej.dk

numeric barbedarrowindent; barbedarrowindent:=.75;

let drawarrow_orig = drawarrow;
let drawdblarrow_orig = drawdblarrow;

def drawarrow_default expr p = _apth:=p; _finarr_default enddef;
def drawarrow_default_unfilled expr p = _apth:=p; _finarr_default_unfilled enddef;
def drawarrow_default_sharp expr p = _apth:=p; _finarr_default_sharp enddef;
def drawarrow_barbed expr p = _apth:=p; _finarr_barbed enddef;
def drawarrow_barbed_unfilled expr p = _apth:=p; _finarr_barbed_unfilled enddef;
def drawarrow_barbed_sharp expr p = _apth:=p; _finarr_barbed_sharp enddef;
def drawarrow_open expr p = _apth:=p; _finarr_open enddef;

def drawdblarrow_default expr p = _apth:=p; _findarr_default enddef;
def drawdblarrow_default_unfilled expr p = _apth:=p; _findarr_default_unfilled enddef;
def drawdblarrow_default_sharp expr p = _apth:=p; _findarr_default_sharp enddef;
def drawdblarrow_barbed expr p = _apth:=p; _findarr_barbed enddef;
def drawdblarrow_barbed_unfilled expr p = _apth:=p; _findarr_barbed_unfilled enddef;
def drawdblarrow_barbed_sharp expr p = _apth:=p; _findarr_barbed_sharp enddef;
def drawdblarrow_open expr p = _apth:=p; _findarr_open enddef;

vardef arrowhead_default expr p = %% For default like arrow heads
  save q,r,e,s;
  path q,r,s; pair e;
  e = point length p of p;
  q = gobble(p shifted -e cutafter makepath(pencircle scaled 2ahlength)) cuttings;
  r = ((q rotated .5ahangle)--(reverse q rotated -.5ahangle)--cycle) shifted e;
  s = (point length r of r)--(point (length r-1) of r);
  _apth:= gobble(_apth cutbefore s) cuttings;
  r
enddef;

vardef arrowhead_barbed expr p = %% For barbed arrow heads
  save q,e,f,r;
  path q,r; pair e,f;
  e = point length p of p;
  f = (p shifted -e) intersectionpoint (makepath(pencircle scaled (barbedarrowindent*2*ahlength)));
  q = gobble(p shifted -e cutafter makepath(pencircle scaled 2ahlength)) cuttings;
  r = ((q rotated .5ahangle)--(reverse q rotated -.5ahangle)--f--cycle) shifted e;
  _apth:= gobble(_apth cutbefore f shifted e) cuttings;
  r
enddef;

vardef arrowhead_open expr p = %% For open arrow head
  save q,r,e;
  path q,r; pair e;
  e = point length p of p;
  q = gobble(p shifted -e cutafter makepath(pencircle scaled 2ahlength)) cuttings;
  r = ((q rotated .5ahangle)--(reverse q rotated -.5ahangle)) shifted e;
  r 
enddef;

def _finarr_default text t =
  filldraw arrowhead_default _apth t;
  draw _apth t
enddef;

def _findarr_default text t =
  filldraw arrowhead_default _apth t;
  _apth:= reverse _apth;
  filldraw arrowhead_default _apth t;
  draw _apth t
enddef;

def _finarr_default_unfilled text t =
  draw arrowhead_default _apth t;
  draw _apth t
enddef;

def _findarr_default_unfilled text t =
  draw arrowhead_default _apth t;
  _apth:= reverse _apth;
  draw arrowhead_default _apth t;
  draw _apth t
enddef;

def _finarr_default_sharp text t =
  fill arrowhead_default _apth t;
  draw _apth t
enddef;

def _findarr_default_sharp text t =
  fill arrowhead_default _apth t;
  _apth:= reverse _apth;
  fill arrowhead_default _apth t;
  draw _apth t
enddef;

def _finarr_barbed text t =
  filldraw arrowhead_barbed _apth t;
  draw _apth t
enddef;

def _findarr_barbed text t =
  filldraw arrowhead_barbed _apth t;
  _apth:= reverse _apth;
  filldraw arrowhead_barbed _apth t;
  draw _apth t
enddef;

def _finarr_barbed_unfilled text t =
  draw arrowhead_barbed _apth t;
  draw _apth t
enddef;

def _findarr_barbed_unfilled text t =
  draw arrowhead_barbed _apth t;
  _apth:= reverse _apth;
  draw arrowhead_barbed _apth t;
  draw _apth t
enddef;

def _finarr_barbed_sharp text t =
  fill arrowhead_barbed _apth t;
  draw _apth t
enddef;

def _findarr_barbed_sharp text t =
  fill arrowhead_barbed _apth t;
  _apth:= reverse _apth;
  fill arrowhead_barbed _apth t;
  draw _apth t
enddef;

def _finarr_open text t =
  draw arrowhead_open _apth t;
  draw _apth t
enddef;

def _findarr_open text t =
  draw arrowhead_open _apth t;
  _apth:= reverse _apth;
  draw arrowhead_open _apth t;
  draw _apth t
enddef;

numeric orig, default, defaultunfilled, defaultsharp, barbed, barbedunfilled, barbedsharp, open;

orig = 0; default = 1; defaultunfilled = 2; defaultsharp = 3; barbed = 4; barbedunfilled = 5; barbedsharp = 6; open = 7;

def setarrows expr t =
  if t = orig:
    let drawarrow = drawarrow_orig;
    let drawdblarrow = drawdblarrow_orig;
  elseif t = default:
    let drawarrow = drawarrow_default;
    let drawdblarrow = drawdblarrow_default;
  elseif t = defaultunfilled:
    let drawarrow = drawarrow_default_unfilled;
    let drawdblarrow = drawdblarrow_default_unfilled;
  elseif t = defaultsharp:
    let drawarrow = drawarrow_default_sharp;
    let drawdblarrow = drawdblarrow_default_sharp;
  elseif t = barbed:
    let drawarrow = drawarrow_barbed;
    let drawdblarrow = drawdblarrow_barbed;
  elseif t = barbedunfilled:
    let drawarrow = drawarrow_barbed_unfilled;
    let drawdblarrow = drawdblarrow_barbed_unfilled;
  elseif t = barbedsharp:
    let drawarrow = drawarrow_barbed_sharp;
    let drawdblarrow = drawdblarrow_barbed_sharp;
  elseif t = open:
    let drawarrow = drawarrow_open;
    let drawdblarrow = drawdblarrow_open;
  fi
enddef;

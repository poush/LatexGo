%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
%%                        repere.mp                           %%
%%   Macros pour la construction de figures dans un repère    %%
%%                    o.peault@posteo.net                     %%
%%              Version 17.11.2 (Novembre 2017)               %%
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
%
% This work may be distributed and/or modified under the conditions of
% the LaTeX Project Public License, either version 1.3 of this license
% or (at your option) any later version.  The latest version of this
% license is in http://www.latex-project.org/lppl.txt
%
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

input format;
if not known mplib: input latexmp fi;

warningcheck:=0;


%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
%%%%%%%%%%   REPERE   %%%%%%%%%
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
numeric _nfig,_nbaxes,theta,taillegrad,taillepoint,taillecroix,facteurx,facteury;
boolean flecheaxe,displayfrac,coupe,boolgradxpart,boolgradypart;
_nfig:=1;
path cadre;
numeric _diag,_largcadre,_hautcadre,_tfig;
pair _O,_I,_J,_O_;
transform _T;
picture _axorlab; pair poslabO;

string marque_p,fraction;

facteury:=1;

boolean rep_groupe;
rep_groupe:=false;

%%%%%%%%%%% Sauvegarde macros plain

let oldbeginfig=beginfig;
let oldendfig=endfig;

let olddraw = draw;
let olddrawarrow = drawarrow;
let olddrawdblarrow = drawdblarrow;
let oldfill = fill;
vardef theoldlabel@#(expr s,z) =  % Position s near z
  save p; picture p;
  if picture s:  p=s
  else:    p = s infont defaultfont scaled defaultscale
  fi;
  p shifted (z + labeloffset*laboff@# -
     (labxf@#*lrcorner p + labyf@#*ulcorner p
       + (1-labxf@#-labyf@#)*llcorner p
     )
  )
enddef;
vardef oldbbox primary p =
  llcorner p-(bboxmargin,bboxmargin) -- lrcorner p+(bboxmargin,-bboxmargin)
  -- urcorner p+(bboxmargin,bboxmargin) -- ulcorner p+(-bboxmargin,bboxmargin)
  -- cycle
enddef;


%%%%%%% Redéfinition beginfig

def beginfig(expr c)=
  oldbeginfig(c);
  _nfig:=c;
  rep_groupe:=true
enddef;

def endfig=
  oldendfig;
  _nfig:=_nfig+1;
  rep_groupe:=false
enddef;


%%%%%%%%%% Définition du repère

vardef repere@#(text t)=
 if (str @#="") or (str @#="larg") or (str @#="orth") or (str @#="prop"): 
    definitionrepere@#(t)
 else:
    reperenum@#(t)
 fi
enddef;


vardef reperenum[]@#(text t)=
  _nfig:=@;
  definitionrepere@#(t)
enddef;

boolean bf;
bf:=false;

vardef definitionrepere@#(text t) =
  save i,_def;
  if not rep_groupe: oldbeginfig(_nfig);bf:=true fi;
  numeric _def[],i,unitex,unitey,unite;
  numeric Xmin,Xmax,Ymin,Ymax,XmiN,XmaX,YmiN,YmaX;
  _def[7]:=90;i:=1;
  for _i=t: _def[i]:=_i; i:=i+1; endfor;
  Xmin:=_def1; Xmax:=_def2; Ymin:=_def4; Ymax:=_def5; theta:=_def7;
  if str @#="larg": _def3:=(_def3-_def6*cosd(theta)/sind(theta))/(Xmax-Xmin);_def6:=_def6/((Ymax-Ymin)*sind(theta))
  elseif str @#="orth": _def3:=_def3/(Xmax-Xmin); _def6:=_def3;theta:=90 
  elseif str @#="prop": _def3:=_def3/(Xmax-Xmin); _def6:=_def6*_def3;theta:=90
  fi;
  Ux:=_def3;Uy:=_def6;
  _T:=identity xscaled Ux yscaled Uy slanted cosd(theta) yscaled sind(theta);
  _defcadre;
  settout(Xmin,Xmax,Ymin,Ymax);
  _O:=_cart(0,0); xO:=0 ; yO:=0;_O_:=(0,0);
  _I:=_cart(1,0); _J:=_cart(0,1);
  taillegrad:=0.8mm;taillepoint:=3;taillecroix:=1mm;_nbaxes:=0;_axorlab:=nullpicture;poslabO:=(0,0);
  marque_p := "plein";displayfrac:=false;flecheaxe:=true;coupe:=true;
  boolgradxpart:=true;boolgradypart:=true;
  defaultscale:=1;
  unitex:=abs(_I);unitey:=abs(_J);unite:=unitex;
  facteurx:=1;facteury:=1;
  string extranumx,extranumy;
  extranumx=extranumy="";
  init_traces;
enddef;

%%%% Initialisations tracés (redéfinition draw etc.)
def init_traces =
  %% draw
  def draw expr p =
    addto currentpicture
    if picture p:
      also p
    else:
      doublepath p transformed _T withpen currentpen
    fi
    _op_
  enddef;
  %% fill
  def fill expr c =
    if path c:
       addto currentpicture contour (c transformed _T) _op_
    else:
      olddraw c
    fi
  enddef;
  %% thelabel
  vardef thelabel@#(expr s,z) =  % Position s near z
    save p; picture p;
    if picture s:  p=s
%    else:    p = s infont defaultfont scaled defaultscale
    else:    p = LaTeX(s)
    fi;
    p shifted (_cart(z) + labeloffset*laboff@# -
       (labxf@#*lrcorner p + labyf@#*ulcorner p
         + (1-labxf@#-labyf@#)*llcorner p
       )
    )
  enddef;
  %% drawarrow
  def drawarrow expr p = _apth:=p transformed _T; _finarr enddef;
  def drawdblarrow expr p = _apth:=p transformed _T; _findarr enddef;
  %% bbox
  vardef bbox primary p =
    if picture p: oldbbox p transformed inverse _T
    else: oldbbox p
    fi
  enddef;
enddef;

def traces_orig =
  def fill expr c = addto currentpicture contour c _op_ enddef;
  def draw expr p =
    addto currentpicture
    if picture p:
      also p
    else:
      doublepath p withpen currentpen
    fi
    _op_
  enddef;
  vardef thelabel@#(expr s,z) =  % Position s near z
    save p; picture p;
    if picture s:  p=s
    else:    p = s infont defaultfont scaled defaultscale
    fi;
    p shifted (z + labeloffset*laboff@# -
       (labxf@#*lrcorner p + labyf@#*ulcorner p
         + (1-labxf@#-labyf@#)*llcorner p
       )
    )
  enddef;
  vardef bbox primary p =
    llcorner p-(bboxmargin,bboxmargin) -- lrcorner p+(bboxmargin,-bboxmargin)
    -- urcorner p+(bboxmargin,bboxmargin) -- ulcorner p+(-bboxmargin,bboxmargin)-- cycle
  enddef;
  def drawarrow expr p = _apth:=p; _finarr enddef;
  def drawdblarrow expr p = _apth:=p; _findarr enddef;

enddef;

def _finarr text t =
  olddraw _apth t;
  filldraw arrowhead _apth  t
enddef;

def _findarr text t =
  olddraw _apth t;
  filldraw arrowhead _apth withpen currentpen  t;
  filldraw arrowhead  reverse _apth  withpen currentpen  t
enddef;

vardef arrowhead expr p = %redéfinition flèches
  save q,e; path q; pair e;
  e = point length p of p;
  q = gobble(p shifted -e cutafter makepath(pencircle scaled 2ahlength))
    cuttings;
  (q rotated .5ahangle & reverse q rotated -.5ahangle -- 0.5*(point 0 of q)-- cycle)  shifted e
enddef;

def setaxes(expr a,b,c,d)=
  AxeXmin:=a;AxeXmax:=b;AxeYmin:=c;AxeYmax:=d
enddef;

def setgrad(expr a,b,c,d)=
  GradXmin:=a;GradXmax:=b;GradYmin:=c;GradYmax:=d
enddef;

def setval(expr a,b,c,d)=
  ValXmin:=a;ValXmax:=b;ValYmin:=c;ValYmax:=d
enddef;

def setquad(expr a,b,c,d)=
  QuadXmin:=a;QuadXmax:=b;QuadYmin:=c;QuadYmax:=d
enddef;

def settout(expr a,b,c,d)=
  setaxes(a,b,c,d);
  setgrad(a,b,c,d);
  setval(a,b,c,d);
  setquad(a,b,c,d);
enddef;

let setall=settout;

def fin =
  if _nbaxes=1: olddraw _axorlab fi;
  if coupe: clip currentpicture to (cadre transformed _T) fi;
  if bf: oldendfig; bf:=false;_nfig:=_nfig+1 fi;
  traces_orig;
enddef;

def _defcadre=
   cadre:=(Xmin,Ymin)--(Xmin,Ymax)--(Xmax,Ymax)--(Xmax,Ymin)--cycle;
   XmiN:=Xmin-0.05(Xmax-Xmin);XmaX:=Xmax+0.05(Xmax-Xmin);
   YmiN:=Ymin-0.05(Ymax-Ymin);YmaX:=Ymax+0.05(Ymax-Ymin);
   _diag:=abs(llcorner cadre - urcorner cadre);
   _diag_:=abs(llcorner _cart(cadre) - urcorner _cart(cadre));
   _largcadre:=abs(llcorner cadre - lrcorner cadre);
   _largcadre_:=abs(llcorner _cart(cadre) - lrcorner _cart(cadre));
   _hautcadre:=abs(llcorner cadre - ulcorner cadre);
   _hautcadre_:=abs(llcorner _cart(cadre) - ulcorner _cart(cadre));
   _tfig:=max(_largcadre,_hautcadre);         % compatibilité geometriesyr
enddef;

%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
%%%%%%%%%%   ORIGINE   %%%%%%%%%
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

def interaxes(expr a,b) =
  _O:=_cart(a,b);_O_:=(a,b);
  xO:=a;
  yO:=b;
enddef;

%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
%%%%%%%%%%   AXES   %%%%%%%%%
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

pair _posgradx, _posgradx.lft, _posgradx.rt, _posgradx.ulft, _posgradx.top, _posgradx.urt, _posgradx.llft, _posgradx.bot, _posgradx.lrt;
_posgradx=_posgradx.bot=_posgradx.lft=_posgradx.rt=-_posgradx.top=(0,-1);
-_posgradx.llft=_posgradx.urt=(0.5,0.5);_posgradx.lrt=-_posgradx.ulft=(0.5,-0.5);


pair _posgrady, _posgrady.lft, _posgrady.rt, _posgrady.ulft, _posgrady.top, _posgrady.urt, _posgrady.llft, _posgrady.bot, _posgrady.lrt;
_posgrady=_posgrady.bot=_posgrady.lft=_posgrady.top=-_posgrady.rt=(-1,0);
-_posgrady.llft=_posgrady.urt=(0.5,0.5);_posgrady.lrt=-_posgrady.ulft=(0.5,-0.5);

vardef _etiqx_@#(expr ab,dec,st)=   %étiquettes axe des abscisses
  save pic;
  picture pic;
  if numeric st: pic:=LaTeX("$\num{" & decimal(st) & extranumx & "}$")
  elseif string st: pic:=LaTeX(st)
  else: pic:=st fi;
  theoldlabel.@#(pic,_cart(ab,yO) shifted (dec*_posgradx@#))
enddef;

vardef _etiqy_@#(expr ro,dec,st)=   %étiquettes axe des ordonnées
  save pic;
  picture pic;
  if numeric st: pic:=LaTeX("$\num{" & decimal(st) & extranumy & "}$")
  elseif string st: pic:=LaTeX(st)
  else: pic:=st fi;
  theoldlabel.@#(pic,_cart(xO,ro) shifted (dec*_posgrady@#))
enddef;


vardef graduationx(expr x)=          %%%%%%% graduation axe des abscisses
   ((0,taillegrad)--(0,-taillegrad)) rotated (theta-90) shifted _cart(x,yO)
enddef;


vardef graduationy(expr y)=          %%%%%%% graduation axe des ordonnées
   ((taillegrad,0)--(-taillegrad,0)) shifted _cart(xO,y)
enddef;

vardef etiquettex@#(expr x)=
   _etiqx_@#(x,taillegrad,x*facteurx)
enddef;


vardef etiquettey@#(expr y)=
   _etiqy_@#(y,taillegrad,y*facteury)
enddef;


vardef dessinaxex=_cart(AxeXmin,yO)--_cart(AxeXmax,yO) enddef;

vardef dessinaxey=_cart(xO,AxeYmin)--_cart(xO,AxeYmax) enddef;


vardef graduationsaxex(expr grad)=      %%%% ensemble des graduations abscisses
   save $;picture $;
   $=image(%
    imax:=floor((GradXmax-xO)/grad);imin:=ceiling((GradXmin-xO)/grad);
    for i=imin upto imax-1:
     olddraw graduationx(arrondimil(i*grad)+xO) withpen pencircle scaled 0.5bp;
    endfor
    % dernière graduation
    if AxeXmax*Ux-(imax*grad+xO)*Ux>ahlength: olddraw graduationx(arrondimil(imax*grad)+xO) withpen pencircle scaled 0.5bp fi);
   $
enddef;

vardef graduationsaxey(expr grad)=      %%%% ensemble des graduations ordonnées
   save $;picture $;
   $=image(%
    imax:=floor((GradYmax-yO)/grad);imin:=ceiling((GradYmin-yO)/grad);
    for i=imin upto imax-1:
     olddraw graduationy(arrondimil(i*grad)+yO) withpen pencircle scaled 0.5bp;
    endfor;
    % dernière graduation
    if AxeYmax*Uy-(imax*grad+yO)*Uy>ahlength: olddraw graduationy(arrondimil(imax*grad)+yO) withpen pencircle scaled 0.5bp fi);
   $
enddef;


vardef etiquettesaxex@#(expr val)=       %%% ensemble des étiquettes abscisses
   save $,imin,imax,labmin,labmax;
   picture $,labmin,labmax;
   numeric imin,imax;
     $=image(%
   	imin:=ceiling((ValXmin-xO)/val);imax:=floor((ValXmax-xO)/val);
   	% définition première étiquette
        if (imin<>0):
   	    labmin:= etiquettex.@#(arrondimil(imin*val)+xO)
	   else: labmin:=nullpicture
   	fi;
   	% définition dernière étiquette
        if (imax<>0):
   	    labmax:= etiquettex.@#(arrondimil(imax*val)+xO)
	   else: labmax:=nullpicture
   	fi;
   	% tracé première étiquette
	   if xpart ((ulcorner labmin) transformed inverse _T)>=Xmin: olddraw labmin fi;
   	% tracé autres étiquettes
   	for i=imin+1 upto imax-1:
    		if (i<>0):
    		  olddraw etiquettex.@#(arrondimil(i*val)+xO)
    		fi;
   	endfor;
   	% tracé dernière étiquette
   	if xpart ((lrcorner labmax) transformed inverse _T)<=Xmax: olddraw labmax fi;
        );
      $
enddef;

vardef etiquettesaxey@#(expr val)=       %%% ensemble des étiquettes ordonnées
   save $,imin,imax,labmin,labmax;
   picture $,labmin,labmax;
   numeric imin,imax;
     $=image(%
   	imin:=ceiling((ValYmin-yO)/val);imax:=floor((ValYmax-yO)/val);
   	% définition première étiquette
        if (imin<>0):
   	    labmin:= etiquettey.@#(arrondimil(imin*val)+yO)
	   else: labmin:=nullpicture
   	fi;
   	% définition dernière étiquette
        if (imax<>0):
   	    labmax:= etiquettey.@#(arrondimil(imax*val)+yO)
	   else: labmax:=nullpicture
   	fi;
   	% tracé première étiquette
   	if ypart (llcorner labmin) >=ypart _cart(Xmin,Ymin): olddraw labmin fi;
   	% tracé autres étiquettes
   	for i=imin+1 upto imax-1:
    		if (i<>0):
    		  olddraw etiquettey.@#(arrondimil(i*val)+yO)
    		fi;
   	endfor;
   	% tracé dernière étiquette
   	if ypart (ulcorner labmax) <=ypart _cart(Xmax,Ymax): olddraw labmax fi
         );
      $
enddef;

vardef _axex_@#(expr grad,val,nn)=
   save $;
   picture $;
   $=image(
   %    axe
   if flecheaxe: olddrawarrow  else: olddraw fi dessinaxex;
   %    graduations
   if grad>0: olddraw graduationsaxex(grad) fi;
   %    étiquettes
   if val>0:
   	if nn=1:
	       if str @#<>"":
		  olddraw etiquettesaxex@#(val);
		  _axorlab:=etiquettex@#(xO)
	       else:
		  olddraw etiquettesaxex.bot(val);
		  _axorlab:=etiquettex.bot(xO)
	       fi;
	       poslabO:=poslabO + unitvector(0,ypart _posgradx@#);
	       if xO<>yO:
		  olddraw _axorlab
	       elseif _nbaxes=2:
		  olddraw _etiqx_(xO,0,xO) shifted (0.7*abs(llcorner _axorlab - urcorner _axorlab)*poslabO)
	       fi
	elseif nn=2:
	       if str @#<>"":
		  olddraw etiquettesaxex@#(val);
		  olddraw etiquettex@#(xO)
	       else:
		  olddraw etiquettesaxex.bot(val);
		  olddraw etiquettex.bot(xO)
	       fi
	else:
	       if str @#<>"":
		  olddraw etiquettesaxex@#(val)
	       else:
		  olddraw etiquettesaxex.bot(val)
	       fi
	fi
   fi
   );
   $
enddef;

vardef _axey_@#(expr grad,val,nn)=
   save $;
   picture $;
   $=image(
   %    axe
   if flecheaxe: olddrawarrow  else: olddraw fi dessinaxey;
   %    graduations
   if grad>0: olddraw graduationsaxey(grad) fi;
   %    étiquettes
   if val>0:
   	if nn=1:
	       if str @#<>"":
		  olddraw etiquettesaxey@#(val);
		  _axorlab:=etiquettey@#(yO)
	       else:
		  olddraw etiquettesaxey.lft(val);
		  _axorlab:=etiquettey.lft(yO)
	       fi;
	       poslabO:=poslabO + unitvector(xpart _posgrady@#,0);
	       if xO<>yO:
		  olddraw _axorlab
	       elseif _nbaxes=2:
		  olddraw _etiqy_(yO,0,yO) shifted (0.7*abs(llcorner _axorlab - urcorner _axorlab)*poslabO)
	       fi
	elseif nn=2:
	       if str @#<>"":
		  olddraw etiquettesaxey@#(val);
		  olddraw etiquettey@#(yO)
	       else:
		  olddraw etiquettesaxey.lft(val);
		  olddraw etiquettey.lft(yO)
	       fi
	else:
	       if str @#<>"":
		  olddraw etiquettesaxey@#(val)
	       else:
		  olddraw etiquettesaxey.lft(val)
	       fi
	fi
   fi
   );
   $
enddef;

vardef axex@# (expr grad,val)=  %%%%%%axe des abscisses avec gestion graduation origine
   _nbaxes:=_nbaxes+1;
   _axex_@#(grad,val,1)
enddef;

vardef axey@# (expr grad,val)=  %%%%%%axe des ordonnées avec gestion graduation origine
   _nbaxes:=_nbaxes+1;
   _axey_@#(grad,val,1)
enddef;

vardef axexo@#(expr grad,val)=  %%%%%%axe des abscisses avec graduation origine
   _axex_@#(grad,val,2)
enddef;

vardef axeyo@#(expr grad,val)=  %%%%%%axe des ordonnées avec graduation origine
   _axey_@#(grad,val,2)
enddef;

vardef axexn@#(expr grad,val)=  %%%%%%axe des abscisses sans graduation origine
   _axex_@#(grad,val,3)
enddef;

vardef axeyn@#(expr grad,val)=  %%%%%%axe des ordonnées sans graduation origine
   _axey_@#(grad,val,3)
enddef;

vardef axes@# (expr grad,val)= %%%% les deux axes
   save $,posx,posy;
   picture $;
   numeric posx,posy;
   posx:=ypart (_posgradx@#+_posgrady@#);
   posy:=xpart (_posgradx@#+_posgrady@#);
   $=image(%
   if posx>0: draw axex.top(grad,val) else: draw axex.bot(grad,val) fi;
   if posy>0: draw axey.rt(grad,val) else: draw axey.lft(grad,val) fi
   );
   $
enddef;

vardef axeso@# (expr grad,val)= %%%% les deux axes avec origine
   save $,posx,posy;
   picture $;
   numeric posx,posy;
   posx:=ypart (_posgradx@#+_posgrady@#);
   posy:=xpart (_posgradx@#+_posgrady@#);
   $=image(%
   if posx>0: draw axexo.top(grad,val) else: draw axexo.bot(grad,val) fi;
   if posy>0: draw axeyo.rt(grad,val) else: draw axeyo.lft(grad,val) fi
   );
   $
enddef;

vardef axesn@# (expr grad,val)= %%%% les deux axes sans origine
   save $,posx,posy;
   picture $;
   numeric posx,posy;
   posx:=ypart (_posgradx@#+_posgrady@#);
   posy:=xpart (_posgradx@#+_posgrady@#);
   $=image(%
   if posx>0: draw axexn.top(grad,val) else: draw axexn.bot(grad,val) fi;
   if posy>0: draw axeyn.rt(grad,val) else: draw axeyn.lft(grad,val) fi
   );
   $
enddef;

% axes gradués avec multiples de pi

vardef fracmulttext(expr n,d,tt)=  %%%% construction de la fraction n*tt/d
   save nn,dd,s,fr,$,fraction;
   string s,fr,fraction;
   picture $;
   numeric nn,dd;
   nn:=abs((n)/pgcd(n,d));dd:=d/pgcd(n,d);
   if displayfrac:
     fraction:="d"
     else: fraction:=""
   fi;
   if dd=1:
   	if nn=1:
   	  fr:=tt
   	  else: fr:=decimal nn & tt
   	fi
   else:
   	if nn=1:
   	  fr:="\" & fraction & "frac{" & tt & "}{" & decimal dd & "}"
   	  else: fr:="\" & fraction & "frac{" & decimal nn & tt & "}{" & decimal dd & "}"
   	fi
   fi;
   if n<0:
     s:="-"
     else: s:="";
           if n=0:
             fr:= "0"
           fi
    fi;
   $=LaTeX("$" & s & fr & "$");
   $
enddef;

vardef fracmultpi(expr n,d)=
  fracmulttext(n,d,"\pi")
enddef;


vardef etiquettexpi@#(expr n,d)=
   _etiqx_@#(n*pi/d,taillegrad,fracmultpi(n,d))
enddef;

vardef etiquetteypi@#(expr n,d)=
   _etiqy_@#(n*pi/d,taillegrad,fracmultpi(n,d))
enddef;


vardef etiquettesaxexpi@#(expr n,d)=       %%% ensemble des étiquettes multiples de pi abscisses
   save $,imin,imax,labmin,labmax,val;
   picture $,labmin,labmax;
   numeric imin,imax,val;
    val:=n*pi/d;
     $=image(%
   	imin:=ceiling((ValXmin-xO)/val);imax:=floor((ValXmax-xO)/val);
   	% définition première étiquette
        if (imin<>0):
   	    labmin:= etiquettexpi.@#(imin*n,d)
	   else: labmin:=nullpicture
   	fi;
   	% définition dernière étiquette
        if (imax<>0):
   	    labmax:= etiquettexpi.@#(imax*n,d)
	   else: labmax:=nullpicture
   	fi;
   	% tracé première étiquette
	   if xpart ((ulcorner labmin) transformed inverse _T)>=Xmin: draw labmin fi;
   	% tracé autres étiquettes
   	for i=imin+1 upto imax-1:
    		if (i<>0):
    		  draw etiquettexpi.@#(i*n,d)
    		fi;
   	endfor;
   	% tracé dernière étiquette
   	if xpart ((lrcorner labmax) transformed inverse _T)<=Xmax: draw labmax fi;
        );
      $
enddef;

vardef etiquettesaxeypi@#(expr n,d)=       %%% ensemble des étiquettes multiples de pi ordonnées
   save $,imin,imax,labmin,labmax,val;
   picture $,labmin,labmax;
   numeric imin,imax,val;
    val:=n*pi/d;
     $=image(%
   	imin:=ceiling((ValYmin-yO)/val);imax:=floor((ValYmax-yO)/val);
   	% définition première étiquette
        if (imin<>0):
   	    labmin:= etiquetteypi.@#(imin*n,d)
	   else: labmin:=nullpicture
   	fi;
   	% définition dernière étiquette
        if (imax<>0):
   	    labmax:= etiquetteypi.@#(imax*n,d)
	   else: labmax:=nullpicture
   	fi;
   	% tracé première étiquette
   	if ypart (llcorner labmin) >=ypart _cart(Xmin,Ymin): draw labmin fi;
   	% tracé autres étiquettes
   	for i=imin+1 upto imax-1:
    		if (i<>0):
    		  draw etiquetteypi.@#(i*n,d)
    		fi;
   	endfor;
   	% tracé dernière étiquette
   	if ypart (ulcorner labmax) <=ypart _cart(Xmax,Ymax): draw labmax fi
         );
      $
enddef;

vardef _axexpi_@#(expr num,den,nn)=
   save $,grad;
   numeric grad;
   picture $;
   grad:=num*pi/den;
   $=image(
   %    axe
   if flecheaxe: olddrawarrow  else: olddraw fi dessinaxex;
   %    graduations
   if grad>0: draw graduationsaxex(grad) fi;
   %    étiquettes
   if nn=1:
       if str @#<>"":
	  draw etiquettesaxexpi@#(num,den);
	  _axorlab:=etiquettexpi@#(xO/pi,1)
       else:
	  draw etiquettesaxexpi.bot(num,den);
	  _axorlab:=etiquettexpi.bot(xO/pi,1)
       fi;
       poslabO:=poslabO + unitvector(0,ypart _posgradx@#);
       if xO<>yO:
	  draw _axorlab
       elseif _nbaxes=2:
	  draw  _etiqx_(xO,0,fracmultpi(xO/pi,1)) shifted (0.7*abs(llcorner _axorlab - urcorner _axorlab)*poslabO)
       fi
   elseif nn=2:
       if str @#<>"":
	  draw etiquettesaxexpi@#(num,den);
	  draw etiquettexpi@#(xO/pi,1)
       else:
	  draw etiquettesaxexpi.bot(num,den);
	  draw etiquettexpi.bot(xO/pi,1)
       fi
   else:
       if str @#<>"":
	  draw etiquettesaxexpi@#(num,den)
       else:
	  draw etiquettesaxexpi.bot(num,den)
       fi
   fi
   );
   $
enddef;

vardef _axeypi_@#(expr num,den,nn)=
   save $,grad;
   numeric grad;
   picture $;
   grad:=num*pi/den;
   $=image(
   %    axe
   if flecheaxe: olddrawarrow  else: olddraw fi dessinaxey;
   %    graduations
   if grad>0: draw graduationsaxey(grad) fi;
   %    étiquettes
   if nn=1:
       if str @#<>"":
	  draw etiquettesaxeypi@#(num,den);
	  _axorlab:=etiquetteypi@#(yO/pi,1)
       else:
	  draw etiquettesaxeypi.lft(num,den);
	  _axorlab:=etiquetteypi.lft(yO/pi,1)
       fi;
       poslabO:=poslabO + unitvector(xpart _posgrady@#,0);
       if xO<>yO:
	  draw _axorlab
       elseif _nbaxes=2:
	  draw  _etiqy_(yO,0,fracmultpi(yO/pi,1)) shifted (0.7*abs(llcorner _axorlab - urcorner _axorlab)*poslabO)
%	  draw _etiqy_(yO,0,yO) shifted (0.7*abs(llcorner _axorlab - urcorner _axorlab)*poslabO)
       fi
   elseif nn=2:
       if str @#<>"":
	  draw etiquettesaxeypi@#(num,den);
	  draw etiquetteypi@#(yO/pi,1)
       else:
	  draw etiquettesaxeypi.lft(num,den);
	  draw etiquetteypi.lft(yO/pi,1)
       fi
   else:
       if str @#<>"":
	  draw etiquettesaxeypi@#(num,den)
       else:
	  draw etiquettesaxeypi.lft(num,den)
       fi
   fi
   );
   $
enddef;

vardef axexpi@# (expr n,d)=  %%%%%%axe des abscisses avec gestion graduation origine mult pi
   _nbaxes:=_nbaxes+1;
   _axexpi_@#(n,d,1)
enddef;

vardef axeypi@# (expr n,d)=  %%%%%%axe des ordonnées avec gestion graduation origine mult pi
   _nbaxes:=_nbaxes+1;
   _axeypi_@#(n,d,1)
enddef;

vardef axexpio@#(expr n,d)=  %%%%%%axe des abscisses avec graduation origine mult pi
   _axexpi_@#(n,d,2)
enddef;

vardef axeypio@#(expr n,d)=  %%%%%%axe des ordonnées avec graduation origine mult pi
   _axeypi_@#(n,d,2)
enddef;

vardef axexpin@#(expr n,d)=  %%%%%%axe des abscisses sans graduation origine mult pi
   _axexpi_@#(n,d,3)
enddef;

vardef axeypin@#(expr grad,val)=  %%%%%%axe des ordonnées sans graduation origine mult pi
   _axeypi_@#(n,d,3)
enddef;

vardef axespi@# (expr n,d)= %%%% les deux axes mult pi
   save $,posx,posy;
   picture $;
   numeric posx,posy;
   posx:=ypart (_posgradx@#+_posgrady@#);
   posy:=xpart (_posgradx@#+_posgrady@#);
   $=image(%
   if posx>0: draw axexpi.top(n,d) else: draw axexpi.bot(n,d) fi;
   if posy>0: draw axeypi.rt(n,d) else: draw axeypi.lft(n,d) fi
   );
   $
enddef;

vardef axespio@# (expr n,d)= %%%% les deux axes avec origine mult pi
   save $,posx,posy;
   picture $;
   numeric posx,posy;
   posx:=ypart (_posgradx@#+_posgrady@#);
   posy:=xpart (_posgradx@#+_posgrady@#);
   $=image(%
   if posx>0: draw axexpio.top(n,d) else: draw axexpio.bot(n,d) fi;
   if posy>0: draw axeypio.rt(n,d) else: draw axeypio.lft(n,d) fi
   );
   $
enddef;

vardef axespin@# (expr n,d)= %%%% les deux axes sans origine mult pi
   save $,posx,posy;
   picture $;
   numeric posx,posy;
   posx:=ypart (_posgradx@#+_posgrady@#);
   posy:=xpart (_posgradx@#+_posgrady@#);
   $=image(%
   if posx>0: draw axexpin.top(n,d) else: draw axexpin.bot(n,d) fi;
   if posy>0: draw axeypin.rt(n,d) else: draw axeypin.lft(n,d) fi
   );
   $
enddef;


%%%%%%%% graduations isolées

vardef axexpart@#(text t)=
   save $,tmp,var;
   picture $;
   numeric tmp;
   boolean var;
   var:=false;
   $=image(%
	for _i=t:
	   if numeric _i:
		if var: if str @#="": draw _etiqx_.bot(tmp,taillegrad,tmp) else: draw _etiqx_@#(tmp,taillegrad,tmp) fi fi;
		if boolgradxpart:
		   olddraw graduationx(_i) withpen pencircle scaled 0.8bp
		fi;
		tmp:=_i;
		var:=true
	   else:
		if str @#="": draw _etiqx_.bot(tmp,taillegrad,_i) else: draw _etiqx_@#(tmp,taillegrad,_i) fi;
		var:=false
	   fi;
	endfor;
   if var: if str @#="": draw _etiqx_.bot(tmp,taillegrad,tmp) else: draw _etiqx_@#(tmp,taillegrad,tmp) fi fi);
   $
enddef;

vardef axeypart@#(text t)=
   save $,tmp,var;
   picture $;
   numeric tmp;
   boolean var;
   var:=false;
   $=image(%
	for _i=t:
	   if numeric _i:
		if var: if str @#="": draw _etiqy_.lft(tmp,taillegrad,tmp) else: draw _etiqy_@#(tmp,taillegrad,tmp) fi fi;
		olddraw ((taillegrad,0)--(-taillegrad,0)) shifted _cart(xO,_i) withpen pencircle scaled 0.8bp;
		tmp:=_i;
		var:=true
	   else:
		if str @#="": draw _etiqy_.lft(tmp,taillegrad,_i) else: draw _etiqy_@#(tmp,taillegrad,_i) fi;
		var:=false
	   fi;
	endfor;
   if var: if str @#="": draw _etiqy_.lft(tmp,taillegrad,tmp) else: draw _etiqy_@#(tmp,taillegrad,tmp) fi fi);
   $
enddef;


vardef axesunit=
  save $;
  picture $;
  $=image(%
        draw axes(0,0);
        draw axexpart(1);
        draw axeypart(1);
        label.llft("$0$",_cart(0,0));
          );
  $
enddef;



%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
%%%%%%%%%%   POINTS - VECTEURS   %%%%%%%%%
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
vardef _ccoord(expr xA,yA)=
   (xA,yA) transformed _T
enddef;

vardef _coord(expr xA,yA)=
   (xA,yA)
enddef;

vardef _cobjet(expr obj)=
   obj transformed _T
enddef;

vardef _cart(text t)=
   if long_texte(t)=2: _ccoord(t)
      else: _cobjet(t)
   fi
enddef;

vardef _c(text t)=
   if long_texte(t)=2: _coord(t)
   else: t
   fi
enddef;


vardef pol(expr r,theta)=
 (r*cos(theta),r*sin(theta))
enddef;

vardef pold(expr r,theta)=
 (r*cosd(theta),r*sind(theta))
enddef;

color coulpoint,coullabel,coullabelfonc;
coulpoint:=black;coullabel:=black;coullabelfonc:=black;


vardef MarquePointFig(expr pp)=      % compatibilité geometriesyr15
 save $;
 picture $;
  if marque_p = "plein":
    $:=image(oldfill fullcircle scaled taillepoint shifted _cart(pp) withcolor coulpoint);
  elseif marque_p = "creux":
    $:=image(%
    oldfill fullcircle scaled taillepoint shifted _cart(pp) withcolor background;
    olddraw fullcircle scaled taillepoint shifted _cart(pp) withcolor coulpoint);
  elseif marque_p = "croix":
  $:=image(%
    olddraw ((-taillecroix,0)--(taillecroix,0)) shifted _cart(pp) withcolor coulpoint;
    olddraw ((0,-taillecroix)--(0,taillecroix)) shifted _cart(pp) withcolor coulpoint)
  else: $:=nullpicture
  fi;
  $
enddef;

def MarquePoint(expr pp)=      % compatibilité geometriesyr15
  draw MarquePointFig(pp)
enddef;


vardef pointe(text t) =      %geometriesyr15
  for p_ = t: if pair p_: MarquePoint(p_); fi endfor;
enddef;


vardef nommepoint@#(text t)=
   save $,ch,dess,latch;
   pair $;
   string ch,latch;
   picture dess;
   if long_texte(t)=1:
      dess:=image(draw MarquePointFig(t);
                  ch:=_chaine(t);
                  label@#("$" & ch & "$",t) withcolor coullabel)
   else:
      dess:=image(%
      for PP=t:
        if pair PP: MarquePoint(PP); $:=PP
        else: if string PP: label@#(PP,$) else: label@#(PP scaled defaultscale,$) fi withcolor coullabel
        fi;
      endfor)
   fi;
   dess
enddef;


vardef nommecourbe@#(suffix p)(text t)=
   save A,ch,dess;
   pair A;
   string ch;
   picture dess;
   if long_texte(t)=1: 
      dess:=image(ch:=_chaine(p);
                  A:=(t,fonccourbe.p(t));
                  label@#("$" & ch & "$",A) withcolor coullabelfonc)
   else:
      dess:=image(%
        for _a=t:
          if numeric _a: A:=(_a,fonccourbe.p(_a))
          else: if string _a: label@#(_a,A) else: label@#(_a scaled defaultscale,A) fi withcolor coullabelfonc
          fi;
        endfor)
   fi;
   dess
enddef;






vardef nommeobj@#(text t)=
 save $;
 picture $;
 if long_texte(t)=4: $:=nommeangle@#(t)
 else:
   for i=t:
     if pair i: $:=nommepoint@#(t)
     elseif str @#="": $:=nommeautoobj(t)
     else: $:=nommecourbe@#(t)
     fi;
     exitif true;
   endfor
 fi;
   $
enddef;

def nomme = draw nommeobj enddef;


%
% Notation automatique des chemins 02/17
%
string prefnomme;
prefnomme:="right";

% Permet de savoir si un point est mieux placé relativement à prefnomme
tertiarydef A estmieuxplace B =
   if prefnomme="right": xpart A > xpart B
   elseif prefnomme="left": xpart A < xpart B
   elseif prefnomme="top": ypart A > ypart B
   elseif prefnomme="bottom": ypart A < ypart B
   elseif hide(errmessage "string 'prefnomme' should be set to left, right, top or bottom")
   fi
enddef;

% Cherche le "time" du meilleur point
vardef pointnommetime(expr p)=
  save Pt, nbint, P, T,pp;
  pair Pt,P[];
  numeric nbint,pp,T[];
  intercourbestimes(T)(cadre,p);
  Pt:=_O;pp:=0;
  if known T[1]:
    Pt:= point T[1] of p;
    pp:=T[1];
    nbint:=1;
    forever:
      exitif not known T[nbint+1];
      nbint:=nbint+1;
      if (point T[nbint] of p) estmieuxplace Pt:
         Pt:=point T[nbint] of p;
         pp:=T[nbint];
      fi;
    endfor
  fi;
  pp
enddef;

% Cherche la "meilleure" position du label du point pp de time tt du chemin courbe
vardef position(expr pp,tt,courbe)=
  save pos,tmpdir;
  string pos;
  numeric tmpdir;
  tmpdir := angle(direction tt of courbe);
  if arrondimil((Ymax-ypart pp)/(Ymax-Ymin))=0:
     if tmpdir <0: pos:="llft"
     else: pos:="lrt"
     fi
  elseif arrondimil((Ymin-ypart pp)/(Ymax-Ymin))=0:
     if tmpdir <0: pos:="urt"
     else: pos:="ulft"
     fi
  elseif arrondimil((Xmax-xpart pp)/(Xmax-Xmin))=0:
     if tmpdir <0: pos:="llft"
     else: pos:="ulft"
     fi
  elseif arrondimil((Xmin-xpart pp)/(Xmax-Xmin))=0:
     if tmpdir <0: pos:="urt"
     else: pos:="lrt"
     fi
  fi;
  pos
enddef;

% Notation automatique des chemins

% Avec label automatique
vardef nommeautoobjsuf(suffix p)=
  nommeautoobjtex(p,"$" & _chaine(p) & "$")
enddef;

% Avec label donné
vardef nommeautoobjtex(expr p,leg)=
  save ptA,pos,ttmp;
  pair ptA;
  numeric ttmp;
  string pos;
  ttmp:=pointnommetime(p);
  ptA:= point ttmp of p;
  pos:=position(ptA,ttmp,p);
  if string leg:
     scantokens("thelabel." & pos)(leg,ptA)
  else:
    scantokens("thelabel." & pos)(leg scaled defaultscale,ptA)
  fi
enddef;

vardef nommeautoobj(text t)=
  if long_texte(t)=1: nommeautoobjsuf(t)
  else: nommeautoobjtex(t)
  fi
enddef;



vardef vecteur@#(expr A)(text t)=
   save $,ch,m;
   picture $;
   pair m;
   string ch;
   $=image(%
   if long_texte(t)=1: drawarrow A--A+t;ch:=_chaine(t);label@#("$\vv{" & ijmath(ch) & "}$",A+t/2)
   else:
      for u=t:
        if pair u: drawarrow A--A+u; m:=A+u/2
        else: if string u: if u<>"": label@#("$\vv{" & u & "}$",m) fi else: label@#(u,m) fi
        fi;
      endfor
   fi);
   $
enddef;

vardef marquepointcourbefig(suffix p)(text t)=
   save $;
   picture $;
   $=image(%
   for i=t:
     MarquePoint((i,fonccourbe.p(i)));
   endfor);
   $
enddef;

def marquepointcourbe= draw marquepointcourbefig enddef;

vardef marquepointcheminfig(suffix p)(text t)=
   save $;
   picture $;
   $=image(%
   for i=t:
     MarquePoint(point i of p);
   endfor);
   $
enddef;

def marquepointchemin= draw marquepointcheminfig enddef;

vardef marquecheminouvertdroitefig(expr p)=
   halfcircle shifted (0,-0.5)
              scaled (2*taillepoint)
              rotated (90+angle(direction infinity of _cart(p)))
              shifted (point infinity of _cart(p))
enddef;

def marquecheminouvertdroite= olddraw marquecheminouvertdroitefig enddef;

vardef marquecheminouvertgauchefig(expr p)=
   halfcircle shifted (0,-0.5)
              scaled (2*taillepoint)
              rotated (-90+angle(direction 0 of _cart(p)))
              shifted (point 0 of _cart(p))
enddef;

def marquecheminouvertgauche= olddraw marquecheminouvertgauchefig enddef;

def marquecheminouvert(expr p) text t=
   marquecheminouvertdroite(p) t;
   marquecheminouvertgauche(p) t
enddef;


%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
%%%%%%%%%%   BASE   %%%%%%%%%
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
vardef ijmath(suffix s)=
 if (substring (0,1) of s)="i": s:="\imath" & substring (1,infinity) of s fi;
 if (substring (0,1) of s)="j": s:="\jmath" & substring (1,infinity) of s fi;
 s
enddef;


color coulbase;
coulbase:=black;

vardef base(suffix a,b,c)=
 save O,I,J,$;
 string O,I,J;
 picture $;
 O:=_chaine(a); I:=_chaine(b); J:=_chaine(c);
 $:=image(%
 draw vecteur.bot(_O_,(1,0),ijmath(I)) withpen pencircle scaled 0.8 withcolor coulbase;
 draw vecteur.lft(_O_,(0,1),ijmath(J)) withpen pencircle scaled 0.8 withcolor coulbase;
 nomme.llft(_O_,"$" & O & "$") withcolor coulbase
 );
 $
enddef;


vardef basep(suffix a,b,c)=
 save O,I,J,$;
 string O,I,J;
 picture $;
 O:=_chaine(a); I:=_chaine(b); J:=_chaine(c);
 $:=image(%
 nomme.llft(_O_,"$" & O & "$") withcolor coulbase;
 draw axexpart(1,"$" & I & "$") withcolor coulbase;
 draw axeypart(1,"$" & J & "$") withcolor coulbase;
 );
 $
enddef;

%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
%%%%%%%%%%   QUADRILLAGE   %%%%%%%%%
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

  numeric ep; color coul;
  ep:= .3bp;                    %%%%%%%% épaisseur du trait
  coul := .7white;              %%%%%%%% couleur du trait
  def quadstyle= enddef;

  vardef quadrillage(expr quadx,quady) =
   save $;
   picture $;
 $=image(if quadx>0:
    for i=ceiling((QuadXmin-xO)/quadx) upto floor((QuadXmax-xO)/quadx):
     olddraw _cart(arrondimil(i*quadx)+xO,QuadYmin)--_cart(arrondimil(i*quadx)+xO,QuadYmax) quadstyle withpen pencircle scaled ep withcolor coul;
    endfor;
  fi;
  if quady>0:
    for i=ceiling((QuadYmin-yO)/quady) upto floor((QuadYmax-yO)/quady):
     olddraw _cart(QuadXmin,arrondimil(i*quady)+yO)--_cart(QuadXmax,arrondimil(i*quady)+yO) withpen pencircle scaled ep withcolor coul quadstyle;
    endfor;
  fi);
  $
 enddef;

  vardef papierpointe(expr quadx,quady) =
   save $;
   picture $;
 $=image(if (quadx>0) and (quady>0):
    for i=ceiling(QuadXmin/quadx) upto floor(QuadXmax/quadx):
      for j=ceiling(QuadYmin/quady) upto floor(QuadYmax/quady):
        olddraw (0,0) shifted _cart(i*quadx,j*quady) withpen pencircle scaled 2;
      endfor;
    endfor;
  fi);
  $
 enddef;

 numeric pm_epa, pm_epb, pm_epc;
 color pm_coula, pm_coulb, pm_coulc;
 pm_epa := .2bp; pm_epb := .3bp; pm_epc := .4bp;              %%%%%%%%%% épaisseurs des traits
 pm_coula := .6*white; pm_coulb := .4*white; pm_coulc := black;   %%%%%%%%%% couleurs des traits

vardef papiermillimetre =
  save $;
  picture $;
  $=image(%
  for i= ceiling(QuadXmin*Ux*10/cm) upto floor(QuadXmax*Ux*10/cm):
    if i mod 5 <> 0: olddraw (i*cm/10,QuadYmin*Uy)--(i*cm/10,QuadYmax*Uy) withpen pencircle scaled pm_epa withcolor pm_coula fi;
  endfor
  for i= ceiling(QuadYmin*Uy*10/cm) upto floor(QuadYmax*Uy*10/cm):
    if i mod 5<> 0: olddraw (QuadXmin*Ux,i*cm/10)--(QuadXmax*Ux,i*cm/10) withpen pencircle scaled pm_epa withcolor pm_coula fi;
  endfor
  %
  for i= ceiling(QuadXmin*Ux/cm)*2+1 step 2 until floor(QuadXmax*Ux/cm)*2-1:
    olddraw (i*cm/2,QuadYmin*Uy)--(i*cm/2,QuadYmax*Uy) withpen pencircle scaled pm_epb withcolor pm_coulb;
  endfor
  for i= ceiling(QuadYmin*Uy/cm)*2+1 step 2 until floor(QuadYmax*Uy/cm)*2-1:
    olddraw (QuadXmin*Ux,i*cm/2)--(QuadXmax*Ux,i*cm/2) withpen pencircle scaled pm_epb withcolor pm_coulb;
  endfor
  %
  for i= ceiling(QuadXmin*Ux/cm) upto floor(QuadXmax*Ux/cm):
    olddraw (i*cm,QuadYmin*Uy)--(i*cm,QuadYmax*Uy) withpen pencircle scaled pm_epc withcolor pm_coulc;
  endfor
  for i= ceiling(QuadYmin*Uy/cm) upto floor(QuadYmax*Uy/cm):
    olddraw (QuadXmin*Ux,i*cm)--(QuadXmax*Ux,i*cm) withpen pencircle scaled pm_epc withcolor pm_coulc;
  endfor);
  $
enddef;


%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
%%%%%%%%%%  FONCTIONS - COURBES   %%%%%%%%%
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

vardef courbef_(suffix f)(expr xmin, xmax, n) =   %Courbe représentative d'une fonction
   save $,x;
   path $;
   $=((xmin,f(xmin))
    for i=1 upto n-1:
      ..(xmin+i*(xmax-xmin)/(n-1),f(xmin+i*(xmax-xmin)/(n-1)))
    endfor );
   $
enddef;


vardef courbef_l(suffix f)(expr xmin, xmax, n) =   %Courbe représentative d'une fonction
   save $,x;
   path $;
   $=((xmin,f(xmin))
    for i=1 upto n-1:
      ...(xmin+i*(xmax-xmin)/(n-1),f(xmin+i*(xmax-xmin)/(n-1)))
    endfor );
   $
enddef;


vardef courbefonc(suffix f)(text t)=
        save cc;path cc;
        save k,Val;numeric k,Val[];
        Val[1]:=Xmin;Val[2]:=Xmax;Val[3]:=60;
        k:=1;
        for i=t:
           Val[k]:=i;
           k:=k+1;
        endfor
        courbef_(f,Val[1],Val[2],Val[3])
enddef;


vardef courbefoncl(suffix f)(text t)=
        save cc;path cc;
        save k,Val;numeric k,Val[];
        Val[1]:=Xmin;Val[2]:=Xmax;Val[3]:=100;
        k:=1;
        for i=t:
           Val[k]:=i;
           k:=k+1;
        endfor
        courbef_l(f,Val[1],Val[2],Val[3])
enddef;




vardef courbepoints(suffix f)(expr xmin, xmax, n) =  %Points non reliés
   save $,x;
   picture $;
   $=image(MarquePoint((xmin,f(xmin)));
           for i=1 upto n-1:
              MarquePoint((xmin+i*(xmax-xmin)/(n-1),f(xmin+i*(xmax-xmin)/(n-1))));
           endfor );
   $
enddef;

vardef fonccourbe@#(expr x)=    %Ordonnée du point de la courbe @# d'abscisse x (dans le repère utilisateur)
   ypart pointcourbe@#(x)
enddef;

vardef pointcourbe@#(expr x)=   %Point de la courbe @# d'abscisse x dans le repère utilisateur
save _P_,t;
  numeric t; pair _P_;
  (t,whatever)=@# intersectiontimes ((x,2*Ymin-Ymax)--(x,2*Ymax-Ymin));
  if t=-1: _P_:=(x,0)
  else: _P_:=point t of @#
  fi;
  _P_
enddef;

vardef der@#(expr x)=   %Fonction dérivée
   save pp,t,v,w,d;
   path pp;
   pair v,w;
   pp:=@#;
   (t,whatever) = pp intersectiontimes ((x,2*Ymin-Ymax)--(x,2*Ymax-Ymin));
   v:=direction t of pp;
%   w:=unitvector(v transformed inverse _T);
   if xpart v = 0: d:=0 else: d:= (ypart v)/(xpart v) fi;
   d
enddef;

vardef intercourbes(suffix P)(expr p,q)= %renvoie les points d'intersections de p et q dans P[]
  save i,pp;
  numeric i;
  path pp;
  pp:=p;
  i:=1;
  forever:
   exitif xpart(pp intersectiontimes q)=-1;
   P[i]:=point xpart(pp intersectiontimes q) of pp;
   pp:=subpath(xpart(pp intersectiontimes q)+0.01,length pp) of pp;
                   %0.01(?!) pour que le point trouvé ne soit pas dans le sous-chemin...
   i:=i+1;
  endfor;
enddef;

vardef intercourbestimes(suffix T)(expr p,q)= %renvoie le "time" de q des points d'intersections de p et q dans T[]
  save i,pp;
  numeric i;
  path pp;
  pp:=p;
  i:=1;
  forever:
   exitif xpart(pp intersectiontimes q)=-1;
   T[i]:=ypart(pp intersectiontimes q);
   pp:=subpath(xpart(pp intersectiontimes q)+0.01,length pp) of pp;
                   %0.01(?!) pour que le point trouvé ne soit pas dans le sous-chemin...
   i:=i+1;
  endfor;
enddef;

vardef ptantecedents(suffix P)(expr y,p)=
  intercourbes(P,(Xmin,y)--(Xmax,y),p)
enddef;

vardef antecedents(suffix P)(expr y,p)=
  pair PP[];
  ptantecedents(PP,y,p);
  for i=1 upto 10: P[i]:=xpart (PP[i]); endfor
enddef;

%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
%%%%%%%%%%   INTERPOLATION   %%%%%%%%%
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
%Novembre 2017
vardef polynomelagrangept(text t)(expr x)=
  0
  for i=t:
    + ypart i
    for j=t:
      if i<>j: *((x-xpart j)/(xpart i - xpart j)) fi
    endfor
  endfor
enddef;

%Novembre 2017
vardef polynomelagrangeval(text t)(expr x)=
save tmp,k,j,ab,or;
pair tmp[];numeric k,j,ab,or;
k:=0;j:=0;
for i=t:
  if j=0: ab:=i else: or:=i; k:=k+1; tmp[k]=(ab,or) fi;
  j:=1-j;
endfor
polynomelagrangept(tmp[1] for ii=2 upto k: ,tmp[ii] endfor)(x)
enddef;

%Novembre 2017
vardef polynomelagrange(text t)(expr x)=
  save tmp;
  numeric tmp;
  for i=t:
    if pair i: tmp:=polynomelagrangept(t)(x)
    else: tmp:=polynomelagrangeval(t)(x)
    fi;
    exitif true;
  endfor
  tmp
enddef;


%Novembre 2017
vardef lagrange(text t)(text q)=
  vardef _tmp_poly_lag(expr x)= polynomelagrange(t)(x) enddef;
  courbefonc(_tmp_poly_lag)(q)
enddef;


%Novembre 2017
vardef polynomehermitetriplet(text t)(expr x)=
%t=(x1,y1,z1),(x2,y2,z2)...
%H(X)=Σqi(X)Pi(X) avec qi(X)=Li(X)² et Pi(X)=yi+(X-xi)(zi-qi'(xi)yi)
%qi'(xi)=Σ2/(xi-xj)
0
for i=t:
   +
   (greenpart i+(x-redpart i)*(bluepart i - 
   (0
   for j=t:   %qi'(xi)
     if i<>j: + 2/(redpart i - redpart j) fi
   endfor
   )
   *greenpart i))
   for j=t:  % qi(X)
     if i<>j: *(((x-redpart j)/(redpart i - redpart j))**2) fi
   endfor
endfor
enddef;

%Novembre 2017
vardef polynomehermiteptder(text t)(expr x)=
save tmp,k,j,re,gr,bl,i;
color tmp[];numeric k,j,re,gr,bl,i;
k:=0;j:=0;
for i=t:
   if pair i: re:= xpart i; gr:= ypart i else: bl:=i; k:=k+1; tmp[k]=(re,gr,bl) fi;
endfor
polynomehermitetriplet(tmp[1] for ii=2 upto k: ,tmp[ii] endfor)(x)
enddef;

%Novembre 2017
vardef polynomehermite(text t)(expr x)=
  save tmp;
  numeric tmp;
  for i=t:
    if color i: tmp:=polynomehermitetriplet(t)(x)
    else: tmp:=polynomehermiteptder(t)(x)
    fi;
    exitif true;
  endfor
  tmp
enddef;


%Novembre 2017
vardef hermite(text t)(text q)=
  vardef _tmp_poly_her(expr x)= polynomehermite(t)(x) enddef;
  courbefoncl(_tmp_poly_her)(q)
enddef;


% Novembre 2017
vardef spcuhezz (expr t)= 2*(t**3)-3*(t**2)+1 enddef;
vardef spcuheuz (expr t)= t**3-2*(t**2)+t enddef;
vardef spcuhezu (expr t)= -2*(t**3)+3*(t**2) enddef;
vardef spcuheuu (expr t)= t**3-t**2 enddef;


% Novembre 2017
vardef splinecubique (expr xa,ya,da,xb,yb,db)(expr x)=
% On donne deux points et les dérivées en ces points
  save t;
  numeric t;
  t=(x-xa)/(xb-xa);
  (spcuhezz(t))*ya + (spcuheuz(t))*da*(xb - xa) + (spcuhezu(t))*yb + (spcuheuu(t))*db*(xb - xa)
enddef;

% Novembre 2017
vardef splineinterpolderfonct_coul(text t)(expr x)=
% On donne points et dérivées sous forme de triplets (x,y,y')
  save pta,ptb,prem,sortie;
  color pta,ptb;
  boolean prem,sortie;
  prem:=true;sortie:=false;
  for i=t:
    if prem: ptb:=i; prem:=false
    else:
       pta:=ptb;
       ptb:=i;
       if x< redpart ptb: sortie:=true fi;
    fi;
    exitif sortie;
  endfor
  splinecubique(redpart pta, greenpart pta, bluepart pta,redpart ptb, greenpart ptb, bluepart ptb)(x)
enddef;

% Novembre 2017
vardef splineinterpolderfonct_pt(text t)(expr x)=
% On donne points et dérivées sous forme de liste (A,y'A,B,y'B...)
   save tmp,k,re,gr,bl;
   color tmp[];
   numeric re,gr,bl,k;
   k:=0;
   for i=t:
     if pair i: k:=k+1; re:= xpart i; gr:= ypart i
     else: bl:=i; tmp[k]:=(re,gr,bl)
     fi;
   endfor
   splineinterpolderfonct_coul(tmp[1] for ii=2 upto k: ,tmp[ii] endfor)(x)
enddef;

% Novembre 2017
vardef splineinterpolderfonct_listeval(text t)(expr x)=
% On donne points et dérivées sous forme de liste de valeurs (xA,yA,y'A,xB,yB,y'B...)
   save tmp,k,j,re,gr,bl;
   color tmp[];
   k:=0;j:=0;
   for i=t:
      if j=0: re:= i; j:=1
      elseif j=1: gr:=i; j:=2
      else: bl:=i; tmp[k]:=(re,gr,bl); j:=0;k:=k+1
      fi;
    endfor
   splineinterpolderfonct_coul(tmp[0] for ii=1 upto k-1: ,tmp[ii] endfor)(x)
enddef;


% Novembre 2017
vardef splinederfonct(text t)(expr x)=
  save tmp;
  numeric tmp;
  for i=t:
    if color i: tmp:=splineinterpolderfonct_coul(t)(x)
    elseif pair i: tmp:=splineinterpolderfonct_pt(t)(x)
    else: tmp:=splineinterpolderfonct_listeval(t)(x)
    fi;
    exitif true;
  endfor
  tmp
enddef;

% Novembre 2017
vardef splineder(text t)(text q)=
  vardef _tmp_poly_splineder(expr x)= splinederfonct(t)(x) enddef;
  courbefoncl(_tmp_poly_splineder)(q)
enddef;


% Novembre 2017
vardef deriveesplinecubique(suffix k)(suffix xs,ys)(expr n)=
% renvoie les dérivées pour interpolation avec splines cubiques
% source : https://en.wikipedia.org/wiki/Spline_interpolation
% xs[] et ys[] sont des listes, n est le nombre de valeurs
% Renvoie les dérivées dans la liste k[]
  (2k[0] + k[1])/(xs[1] - xs[0]) = 3(ys[1]-ys[0])/((xs[1]-xs[0])**2);
  for i=1 upto n-1:
    k[i-1]/(xs[i] - xs[i-1]) + 2k[i]/(xs[i] - xs[i-1]) + 2k[i]/(xs[i+1] - xs[i]) + k[i+1]/(xs[i+1] - xs[i]) = 3(ys[i] - ys[i-1])/((xs[i]-xs[i-1])**2) + 3(ys[i+1] - ys[i])/((xs[i+1]-xs[i])**2);
  endfor
  (k[n-1] + 2k[n])/(xs[n]-xs[n-1]) = 3(ys[n]-ys[n-1])/((xs[n]-xs[n-1])**2);
enddef;

% Novembre 2017
vardef splineinterpolfonct_pt(text t)(expr x)=
% t est la liste des points A,B,C...
  save xa,ya,dd,n;
  numeric xa[],ya[],dd[],n;
  n:=-1;
  for i=t:
    n := n + 1;
    xa[n] := xpart i; ya[n] := ypart i;
  endfor
  deriveesplinecubique(dd)(xa,ya)(n);
  splinederfonct((xa[0],ya[0],dd[0]) for ii=1 upto n: , (xa[ii],ya[ii],dd[ii]) endfor)(x)
enddef;

vardef splineinterpolfonct_listeval(text t)(expr x)=
% t est la liste des valeurs (x1,y1,x2,y2,x3,y3...)
  save xa,ya,tmp,k,j;
  numeric xa,ya,k,j;
  pair tmp[];
  k:=0;j:=0;
  for i=t:
    if j=0: xa:= i
    else: ya:=i; tmp[k]:= (xa,ya); k:= k+1
    fi;
    j:=1-j;
  endfor
  splineinterpolfonct_pt(tmp[0] for ii=1 upto k-1: ,tmp[ii] endfor)(x)
enddef;

% Novembre 2017
vardef splinefonct(text t)(expr x)=
  save tmp;
  numeric tmp;
  for i=t:
    if pair i: tmp:=splineinterpolfonct_pt(t)(x)
    else: tmp:=splineinterpolfonct_listeval(t)(x)
    fi;
    exitif true;
  endfor
  tmp
enddef;

% Novembre 2017
vardef spline(text t)(text q)=
  vardef _tmp_poly_spline(expr x)= splinefonct(t)(x) enddef;
  courbefonc(_tmp_poly_spline)(q)
enddef;





%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
%%%%%%%%%%   TANGENTES   %%%%%%%%%
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

numeric longtan;
longtan:=20;

vardef tangentefleche@# (suffix p)(text tt) =
   save t,$,pp,i,N;
pair senstan.gauche,senstan.droite,senstan.double;
senstan.gauche=(1,0);senstan.droite=(0,1);senstan.double=(1,1);
   numeric N[],i;
   i:=0;
   pair _v,M;
   picture $;
   for n=tt: i:=incr i ; N[i]:=n; endfor;
   if i=1: N2:=longtan fi;
   (t,whatever) = p intersectiontimes ((N1,Ymin)--(N1,Ymax));
   M:=point t of p;
   _v:=N2*unitvector(direction t of p);
   $=image(%
		MarquePoint(M);
		if (xpart senstan@#) <> 0: olddrawarrow _cart(M)--_cart(M)-_v*(xpart senstan@#) fi;
		if (ypart senstan@#) <> 0: olddrawarrow _cart(M)--_cart(M)+_v*(ypart senstan@#) fi;
    );
   $
enddef;

vardef tangentedroite(expr p,a) =
 save $,m,M,t;
 path $;
 numeric m,t;
 pair M;
 (t,whatever) = p intersectiontimes ((a,Ymin)--(a,Ymax));
 M:=point t of p;
 $=M-_diag*unitvector(direction t of p)--M+_diag*unitvector(direction t of p);
 $
enddef;

vardef tangente@#(suffix p)(text tt) =
  if str @#="": tangentedroite(p)(tt)
  else: tangentefleche@#(p)(tt)
  fi
enddef;


%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
%%%%%%%%%%   CALCUL INTÉGRAL   %%%%%%%%%
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

vardef entrecourbes(expr p,q,xmin,xmax)=
 buildcycle(droiteeqx(xmax),p,droiteeqx(xmin),q)
enddef;

vardef souscourbe(expr p,xmin,xmax)=
 buildcycle(droiteeqx(xmax),p,droiteeqx(xmin),(Xmin,0)--(Xmax,0))
enddef;


vardef rectangles@#(suffix p)(expr a,b,n)=   %Riemann, renvoie un chemin fermé
 save pas,_rect_;
 numeric pas;
 path _rect_;
 pas=(b-a)/n;
 _rect_ =
 for i=0 upto n-1:
   (a+i*pas,yO)--_segmrect_@#(p,a+i*pas,pas)--
 endfor
 (b,yO)--cycle;
 _rect_
enddef;

numeric _typerect.min,_typerect.max,_typerect.droite,_typerect.gauche;
_typerect.min=1;_typerect.max=2;_typerect.droite=3;_typerect.gauche=4;

vardef _segmrect_@#(suffix p)(expr a,pas)=
 save _sousp;
 path _sousp;
 _sousp=subpath (xpart(p intersectiontimes droiteeqx(a)),xpart(p intersectiontimes droiteeqx(a+pas))) of p;
 if _typerect@#=1: llcorner _sousp -- lrcorner _sousp
  elseif _typerect@#=2: ulcorner _sousp -- urcorner _sousp
   elseif _typerect@#=3: (pointcourbe.p(a))--(pointcourbe.p(a) shifted (pas,0))
    elseif _typerect@#=4: (pointcourbe.p(a+pas) shifted (-pas,0))--(pointcourbe.p(a+pas))
 fi
enddef;

%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
%%%%%%%%%%   DROITES   %%%%%%%%%
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
vardef droiteeqred(expr a,b)=
 save $;
 path $;
 if (-(Ymax-Ymin)/(Xmax-Xmin)<a) and ((Ymax-Ymin)/(Xmax-Xmin)>a):
  $:=(XmiN,a*XmiN+b)--(XmaX,a*XmaX+b);
 elseif a>0:
  $:=(YmiN/a-b/a,YmiN)--(YmaX/a-b/a,YmaX);
 else:
  $:=(YmaX/a-b/a,YmaX)--(YmiN/a-b/a,YmiN);
 fi;
 $
enddef;

vardef droiteeqx(expr c)=
  (c,2*Ymin-Ymax)--(c,2*Ymax-Ymin)
enddef;

vardef droiteeqcart(expr a,b,c)=
 save $;
 path $;
 if b=0:
   $=droiteeqx(-c/a)
 else:
   $:=droiteeqred(-a/b,-c/b)
 fi;
 $
enddef;

vardef droiteeq(text t)=
  save $;
  path $;
  if long_texte(t)=1: $:= droiteeqx(t) fi;
  if long_texte(t)=2: $:= droiteeqred(t) fi;
  if long_texte(t)=3: $:= droiteeqcart(t) fi;
  $
enddef;


vardef droitept(expr A,B)=  %geometrie15syr
  (_diag/abs(A-B))[B,A]--(_diag/abs(A-B))[A,B]
enddef;

vardef droite(text t)=
  save $;
  path $;
  for i=t:
    if pair i: $:=droitept(t) else: $:=droiteeq(t) fi;
    exitif true;
  endfor;
  $
enddef;


%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
%%%%%%%%%%   DEMI-PLANS   %%%%%%%%%%
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

vardef demiplaninf(expr d)=
  save $,A,B;
  path $;
  pair A,B;
  if (point 0 of d) yscaled -1 < (point infinity of d) yscaled -1:
   A:=point 0 of d; B:= point infinity of d
   else: B:=point 0 of d; A:= point infinity of d
  fi;
  $=A--
  if ypart A>=ypart (Xmin,Ymax): (Xmin,Ymax)-- fi
  if ypart A>ypart (Xmin,Ymin): (Xmin,Ymin)-- fi
  if ypart B>ypart (Xmax,Ymin): (Xmax,Ymin)-- fi
  if ypart B>=ypart (Xmax,Ymax): (Xmax,Ymax)-- fi
  B--cycle;
  $
enddef;

vardef demiplansup(expr d)=
  save $,A,B;
  path $;
  pair A,B;
  if (point 0 of d) yscaled -1 < (point infinity of d) yscaled -1:
   A:=point 0 of d; B:= point infinity of d
   else: B:=point 0 of d; A:= point infinity of d
  fi;
  $=A--
  if ypart A<=ypart (Xmin,Ymin): (Xmin,Ymin)-- fi
  if ypart A<ypart (Xmin,Ymax): (Xmin,Ymax)-- fi
  if ypart B<ypart (Xmax,Ymax): (Xmax,Ymax)-- fi
  if ypart B<=ypart (Xmax,Ymin): (Xmax,Ymin)-- fi
  B--cycle;
  $
enddef;

%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
%%%%%%%%%%   PROJECTIONS   %%%%%%%%%
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
vardef projetex(expr A)=
  (xpart (A),yO)
enddef;

vardef projetey(expr A)=
  (xO,ypart (A))
enddef;

vardef projectionx@#(text t)=
  save $,_a,_fg,dec;
  picture $,_fg;_fg:=nullpicture;
  numeric dec;dec=0;
  pair _a;
  $=image(%
   for i=t:
    if pair i: draw i--projetex(i);_a:=i elseif numeric i: dec:=i else: _fg:=thelabel.@#(i,projetex(_a)) fi;
   endfor;
   draw _fg shifted (0,dec));
  $
enddef;

vardef projectiony@#(text t)=
  save $,_a,_fg,dec;
  picture $,_fg;_fg:=nullpicture;
  numeric dec;dec=0;
  pair _a;
  $=image(%
   for i=t:
    if pair i: draw i--projetey(i);_a:=i elseif numeric i: dec:=i else: _fg:=thelabel.@#(i,projetey(_a)) fi;
   endfor;
   draw _fg shifted (dec,0));
  $
enddef;


vardef projectionaxes(text t)=
  save $,_A,n;
  picture $,_fg[];_fg1=_fg2=nullpicture;
  pair _A;
  numeric n,dd;n=1;dd=0;
   $=image(%
  for i=t: if numeric i: dd:=i fi; endfor
  for i=t:
   if not numeric i:
     if pair i: _A:=i;
     elseif n=1: if ypart _A > ypart _O_: draw projectionx.bot(_A,i,-dd) else: draw projectionx.top(_A,i,dd) fi;n:=n+1
     else: if xpart _A > xpart _O_: draw projectiony.lft(_A,i,-dd) else: draw projectiony.rt(_A,i,dd) fi;n:=n+1
     fi;
   fi;
  endfor;
  if n<=2: draw projectiony(_A) fi; if n=1: draw projectionx(_A) fi);
 $
enddef;

%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
%%%%%%%%%%%%   SUITES   %%%%%%%%%%%%
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
vardef suite(suffix u)(expr deb,fin)=
  save $;
  picture $;
  $=courbepoints(u,deb,fin,fin-deb+1);
  $
enddef;

vardef _suiterecfonc_(expr x)=0 enddef;
numeric _suiterecdeb_, _suiterecfin_, _suiterecinit_;

vardef suiterec(suffix f)(expr deb,fin,init)= %escalier un+1=f(un), u_deb=init
  vardef _suiterecfonc_(expr x)=f(x) enddef;
  _suiterecdeb_:=deb;_suiterecfin_:=fin;_suiterecinit_:=init;	%stocke les valeurs pour réutilisation
  save $,un;
  path $;
  numeric un;
  un=init;
  $=(un,yO)
  for i=deb upto fin-1:
    --(un,f(un))--(f(un),f(un))
    hide(un:=f(un))
  endfor;
  $
enddef;

vardef suiterecprojx@#(text t)=   	%projections et étiquettes sur axe x, utilise les valeurs de suiterec
  save $,deb,fin,nom,_qw_,un,lab;
  picture $;
  string nom,lab;
  numeric deb,fin,_qw_,un,_prec;
  deb:=_suiterecdeb_;fin:=_suiterecfin_;un:=_suiterecinit_;
  _qw_:=1;
  for i=t:			%récupère les éventuelles nouvelles valeurs pour deb et fin
    if _qw_ =1: if string i: nom:=i else: nom:="_val";_prec:=i fi;
    elseif _qw_=2:
    		deb:=i;
    		for j=_suiterecdeb_ upto i-1:
    		  un:=_suiterecfonc_(un);
    		endfor
    elseif _qw_=3: fin:=i
    fi;
    _qw_:=_qw_+1;
  endfor;
  $=image(%
  if nom="":
    if deb=_suiterecdeb_:
      deb:=deb+1;un:=_suiterecfonc_(un)
    fi;
    for i=deb upto fin:
      draw projectionx.@#((un,un));
      un:=_suiterecfonc_(un);
    endfor
  elseif nom="_val":
    if deb=_suiterecdeb_:
      draw etiquettex.@#(arrondi(10**_prec,un));
      deb:=deb+1;un:=_suiterecfonc_(un)
    fi;
    for i=deb upto fin:
      lab:="$\num{" &  decimal(arrondi(10**_prec,un)) & "}$";
      draw projectionx.@#((un,un),lab,-taillegrad);
      un:=_suiterecfonc_(un);
    endfor
  else:
    if deb=_suiterecdeb_:
      label.@#("$" & nom & "_{" & decimal(deb) & "}" & "$",(un,yO));
      deb:=deb+1;un:=_suiterecfonc_(un)
    fi;
    for i=deb upto fin:
      lab:="$" & nom & "_{" & decimal(i) & "}" & "$";
      draw projectionx.@#((un,un),lab);
      un:=_suiterecfonc_(un);
    endfor
  fi);
  $
enddef;

vardef suiterecprojy@#(text t)=   	%projections et étiquettes sur axe y, utilise les valeurs de suiterec
  save $,deb,fin,nom,_qw_,un,lab;
  picture $;
  string nom,lab;
  numeric deb,fin,_qw_,un,_prec;
  deb:=_suiterecdeb_;fin:=_suiterecfin_;un:=_suiterecinit_;
  _qw_:=1;
  for i=t:				%récupère les éventuelles nouvelles valeurs pour deb et fin
    if _qw_ =1: if string i: nom:=i else: nom:="_val";_prec:=i fi;
    elseif _qw_=2:
    		deb:=i;
    		for j=_suiterecdeb_ upto i-2:
    		  un:=_suiterecfonc_(un);
    		endfor
    elseif _qw_=3: fin:=i
    fi;
    _qw_:=_qw_+1;
  endfor;
  $=image(%
  if nom="":
    if deb=_suiterecdeb_:
      deb:=deb+1;
    fi;
    for i=deb-1 upto fin-1:
      draw projectiony.@#((un,_suiterecfonc_(un)));
      un:=_suiterecfonc_(un);
    endfor
  elseif nom="_val":
    if deb=_suiterecdeb_:
      deb:=deb+1;
    fi;
    for i=deb-1 upto fin-1:
      lab:="$\num{" &  decimal(arrondi(10**_prec,un)) & "}$";
      draw projectiony.@#((un,_suiterecfonc_(un)),lab,-taillegrad);
      un:=_suiterecfonc_(un);
    endfor
  else:
    if deb=_suiterecdeb_:
      deb:=deb+1;
    fi;
    for i=deb-1 upto fin-1:
      lab:="$" & nom & "_{" & decimal(i+1) & "}" & "$";
      draw projectiony.@#((un,_suiterecfonc_(un)),lab);
      un:=_suiterecfonc_(un);
    endfor
  fi);
  $
enddef;


vardef suiterecproj(text t)=
 save $;
 picture $;
 $=image(%
 draw suiterecprojx.bot(t);
 draw suiterecprojy.lft(t));
 $
enddef;


%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
%%%%%%%%%%   INTERVALLES   %%%%%%%%%
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
vardef bornex[](expr val)=
 ((1mm,-2mm)--(0,-2mm)--(0,2mm)--(1mm,2mm)) if @<0: xscaled -1 fi shifted _cart(val,xO)
enddef;

vardef borney[](expr val)=
 ((2mm,1mm)--(2mm,0)--(-2mm,0)--(-2mm,1mm)) if @<0: yscaled -1 fi shifted _cart(yO,val)
enddef;

pair sensborne.FF,sensborne.FO,sensborne.OF,sensborne.OO;
sensborne.FF=-sensborne.OO=(1,-1);sensborne.FO=-sensborne.OF=(1,1);

vardef intervallex@#(expr vmin,vmax)=
  save $;
  picture $;
  $=image(%
   olddraw _cart(vmin,xO)--_cart(vmax,xO) withpen pencircle scaled 2pt;
   olddraw bornex[xpart sensborne@#](vmin) withpen pencircle scaled 2pt;
   olddraw bornex[ypart sensborne@#](vmax) withpen pencircle scaled 2pt);
  $
enddef;

vardef intervalley@#(expr vmin,vmax)=
  save $;
  picture $;
  $=image(%
   olddraw _cart(yO,vmin)--_cart(yO,vmax) withpen pencircle scaled 2pt;
   olddraw borney[xpart sensborne@#](vmin) withpen pencircle scaled 2pt;
   olddraw borney[ypart sensborne@#](vmax) withpen pencircle scaled 2pt);
  $
enddef;

%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
%%%%%%%%%%%%%   STATISTIQUES   %%%%%%%%%%%%
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

numeric _decboitemoustache_,_largboitemoustache_;


vardef boitemoustache(text t)=
  _decboitemoustache_:=1.5cm;
  _largboitemoustache_:=1cm;
  save $,n;
   picture $;
   numeric n,_valeursboitemoustache_[];
   n:=1;
   for i=t:
     _valeursboitemoustache_[n]:=i;
     n:=n+1;
   endfor;
   if known _valeursboitemoustache_[6]: _decboitemoustache_:=_valeursboitemoustache_[6] fi;
   if known _valeursboitemoustache_[7]: _largboitemoustache_:=_valeursboitemoustache_[7] fi;
   $=image(%
   oldfill fullcircle scaled 3 shifted _cart(_valeursboitemoustache_[1],yO);
   olddraw _cart(_valeursboitemoustache_[1],yO)--_cart(_valeursboitemoustache_[2],yO);
   olddraw _cart(_valeursboitemoustache_[2],yO) shifted (0,-_largboitemoustache_/2)--_cart(_valeursboitemoustache_[2],yO) shifted (0,_largboitemoustache_/2)--_cart(_valeursboitemoustache_[4],yO) shifted (0,_largboitemoustache_/2)--_cart(_valeursboitemoustache_[4],yO) shifted (0,-_largboitemoustache_/2)--cycle;
   olddraw _cart(_valeursboitemoustache_[3],yO) shifted (0,-_largboitemoustache_/2)--_cart(_valeursboitemoustache_[3],yO) shifted (0,_largboitemoustache_/2);
   olddraw _cart(_valeursboitemoustache_[4],yO)--_cart(_valeursboitemoustache_[5],yO);
   oldfill fullcircle scaled 3 shifted _cart(_valeursboitemoustache_[5],yO)%
   ) shifted (0,_decboitemoustache_);
   $
enddef;

vardef projboitemoustache@#(text t)=
   save $,n,_lab_,_comp_,A,tmp;
   pair A;
   picture $;
   string _lab_[];
   numeric n_comp_,tmp;
   n:=long_texte(t);
   if n=0:
     _lab_[1]:="$X_{min}$";
     _lab_[2]:="$Q_1$";
     _lab_[3]:="$M_e$";
     _lab_[4]:="$Q_3$";
     _lab_[5]:="$X_{max}$";
   elseif n=1:
     if t=0: for i=1 upto 5: _lab_[i]:=""; endfor
     else: 
       tmp:=floor(t);
       for i=1 upto 5:
          _lab_[i]:="\num{" & decimal(arrondi(10**tmp,_valeursboitemoustache_[i])) & "}";
       endfor
     fi
   else: _comp_:=1; for i=t:
                       if numeric i: _lab_[_comp_]:="\num{" & decimal(i) & "}"
                         elseif string i: _lab_[_comp_]:=i
                         else: _lab_[_comp_]:=i
                       fi;
                       _comp_:=_comp_+1;
                    endfor
   fi;
   $=image(%
   for i=1 upto 5:
     if (i=1) or (i=5):
       A:=_cart(_valeursboitemoustache_[i],yO) shifted(0,_decboitemoustache_)
       else: A:=_cart(_valeursboitemoustache_[i],yO) shifted(0,_decboitemoustache_-_largboitemoustache_/2)
     fi;
     draw projectionx@#(A transformed inverse _T,_lab_[i]);
   endfor);
   $
enddef;


numeric diampointsbatons;
diampointsbatons:=5;

vardef diagrammebatons(text t) =
   save $;
   picture $;
   numeric tmp_taillepoint;
   string tmp_marque_p;
   tmp_taillepoint:=taillepoint;
   tmp_marque_p := marque_p;
   $=image(%
     interim linecap:=butt;
     marque_p:="plein";
     taillepoint:=diampointsbatons*0.5;
     for i=t:
        draw i--projetex(i);
        MarquePoint(i);
     endfor
     );
   taillepoint:=tmp_taillepoint;
   marque_p := tmp_marque_p;
   $
enddef;


numeric largbarres;
largbarres := 20;

def barrei(expr p)=
   (projetex(_cart(p)-0.5(largbarres,0))--(_cart(p)-0.5(largbarres,0))--(_cart(p)+0.5(largbarres,0))--projetex(_cart(p)+0.5(largbarres,0))) transformed inverse _T
enddef;

vardef diagrammebarres(text t)=
   save tmp;
   path tmp;
   tmp:= for i=t: barrei(i)-- endfor cycle;
   tmp
enddef;

%octobre 2016
%diagramme en batons de la loi binomiale
vardef diagrammebinomiale(expr n,p)=
   save tmp;
   picture tmp;
   tmp:=scantokens("diagrammebatons("&
           "(0," & decimal(binomiale(n,p,0)) & ")" &
           for i=1 upto n: ",(" & decimal(i) & "," & decimal(binomiale(n,p,i)) & ")" &
           endfor
           ")");
   tmp
enddef;

%mai 2017
%diagramme en batons de la loi uniforme discrète
vardef diagrammeuniforme(expr n,m)=
   save tmp;
   picture tmp;
   tmp:=scantokens("diagrammebatons("&
           "(" & decimal(n) & "," & decimal(1/(m-n+1)) & ")" &
           for i=n+1 upto m: ",(" & decimal(i) & "," & decimal(1/(m-n+1)) & ")" &
           endfor
           ")");
   tmp
enddef;

%mai 2017
%diagramme en batons de la loi géométrique
vardef diagrammegeometrique(expr p)=
   save tmp;
   picture tmp;
   tmp:=scantokens("diagrammebatons("&
           "(1," & decimal(p) & ")" &
           for i=2 upto Xmax: ",(" & decimal(i) & "," & decimal(((1-p)**(i-1))*p) & ")" &
           endfor
           ")");
   tmp
enddef;

%mai 2017
%diagramme en batons de la loi de Poisson
vardef diagrammepoisson(expr lambda)=
   save tmp;
   picture tmp;
   tmp:=scantokens("diagrammebatons("&
           "(0," & decimal(poisson(lambda,0)) & ")" &
           for i=1 upto Xmax: ",(" & decimal(i) & "," & decimal(poisson(lambda,i)) & ")" &
           endfor
           ")");
   tmp
enddef;


% mai 2017
% courbe de la densité de la loi normale
vardef densitenormale(text t)=
  if long_texte(t)=2: %les bornes ne sont pas précisées donc on prend Xmin et Xmax
    densitenormalebornes(t,Xmin,Xmax)
  else:   % les bornes sont précisées
    densitenormalebornes(t)
  fi
enddef;

%courbe de la densité de la loi normale entre a et b
vardef densitenormalebornes(expr mu,sigma,a,b)=
  vardef tmpdens(expr x)=
    (1/(sigma*sqrt(2*pi)))*exp(-0.5*(((x-mu)/sigma)**2))
  enddef;
  courbefonc(tmpdens)(a,b)
enddef;


% Mai 2017
% courbe de la densité de la loi exponentielle
vardef densiteexponentielle(expr lambda)=
  vardef tmpdens(expr x)=
    lambda*exp(-lambda*x)
  enddef;
  courbefonc(tmpdens)(0,Xmax)
enddef;

%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
%%%%%%%%%%%%%%   POLYGONES   %%%%%%%%%%%%%%
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

vardef polygone(text t)=
  save poly;
  path poly;
  poly := 
    for i=t:
      i--
    endfor
    cycle;
  poly
enddef;

if not known typetrace:
  vardef triangle(expr A,B,C)=
    polygone(A,B,C)
  enddef;
fi

vardef parallelogramme(expr A,O,B)=
  O--A--(A+B-O)--B--cycle
enddef;

vardef polygoneregulier(expr A,B,n)=
  save poly,centre;
  path poly;pair centre;
  _cart(B)-centre = (_cart(A)-centre) rotated (360/n);
  poly:= _cart(A)
     for i = 1 upto n-1:
       -- (_cart(A) rotatedaround(centre,(i*360)/n))
     endfor
     --cycle;
  poly transformed inverse _T
enddef;

vardef sommetpolygoneregulier(expr A,B,n,i)=
  save $,centre;
  pair $,centre;
  _cart(B)-centre = (_cart(A)-centre) rotated (360/n);
  $= _cart(A) rotatedaround(centre,((i-1)*360)/n);
  $ transformed inverse _T
enddef;

vardef equilateral(expr A,B)=
  polygoneregulier(A,B,3)
enddef;

vardef carre(expr A,B)=
  polygoneregulier(A,B,4)
enddef;

%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
%%%%%%%%%%%   CERCLES ET ARCS   %%%%%%%%%%%
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
vardef arccercle(expr A,O,B)=
  path tmp,arc;
  tmp:=fullcircle scaled (2*(abs(_cart(A)-_cart(O)))) rotated angle(_cart(A)-_cart(O)) shifted _cart(O);
  if angle(_cart(B)-_cart(O))>angle(_cart(A)-_cart(O)):
    arc:=subpath(0,(angle(_cart(B)-_cart(O))-angle(_cart(A)-_cart(O)))*(length tmp)/360) of tmp;
  else:
    arc:=subpath(0,(360-(angle(_cart(A)-_cart(O))-angle(_cart(B)-_cart(O))))*(length tmp)/360) of tmp;
  fi
  arc transformed inverse _T
enddef;

vardef cerclecr(expr O,r)=
  fullcircle scaled (2*r*Ux) shifted _cart(O) transformed inverse _T
enddef;

vardef cerclecp(expr O,A)=
  fullcircle scaled (2*abs(_cart(A)-_cart(O))) shifted _cart(O) transformed inverse _T
enddef;

vardef cerclecir(expr A,B,C)=
  save O;pair O;
  _cart(O)-0.5[_cart(A),_cart(B)]=whatever * (_cart(B)-_cart(A)) rotated 90;
  _cart(O)-0.5[_cart(A),_cart(C)]=whatever * (_cart(C)-_cart(A)) rotated 90;
  cerclecp(O,A)
enddef;

vardef cercle(text t)=
   save $;path $;
   save r;boolean r;
   r:=false;
   if long_texte(t)=3:
     $:=cerclecir(t)
   else:
     for i=t:
       if numeric i: r:=true fi;
     endfor
     if r: $:=cerclecr(t) else: $:=cerclecp(t) fi;
   fi;
   $   
enddef;


%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
%%%%%   MARQUES ANGLES, SEGMENTS...   %%%%%
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%


taille_marque_a:=0.4cm;
sep_marque_a:=1.5;


vardef arc_marqueangle(expr A,O,B,t)=
  arccercle((_cart(O)+t*unitvector(_cart(A)-_cart(O))) transformed inverse _T,O,(_cart(O)+t*unitvector(_cart(B)-_cart(O))) transformed inverse _T)
enddef;

vardef marqueanglegeo(expr A,O,B,n)=
  O--arc_marqueangle(A,O,B,taille_marque_a-(n-1)*sep_marque_a/2)
  for i=1 upto n-1:
   --reverse arc_marqueangle(A,O,B,taille_marque_a-(n-1)*sep_marque_a/2+(i-1)*sep_marque_a)--
   arc_marqueangle(A,O,B,taille_marque_a-(n-1)*sep_marque_a/2+i*sep_marque_a)
  endfor
  --cycle
enddef;


vardef marqueangleor(expr A,O,B)=
  arc_marqueangle(A,O,B,taille_marque_a)
enddef;

vardef marqueangle(text t)=
  if long_texte(t)=4: marqueanglegeo(t)
  else: marqueangleor(t)
  fi
enddef;

vardef nommeangle@#(expr A,O,B,p)=
  save P,a;pair P;path a;
  a:=arc_marqueangle(A,O,B,taille_marque_a);
  P:= point (arctime 0.5*arclength a of a) of a;
  if string p: thelabel@#(p,P)
  else: thelabel@#(p scaled defaultscale,P)
  fi
enddef;



taille_marque_ad:=0.3cm;

vardef marqueangledroit(expr A,O,B)=
  parallelogramme((_cart(O)+taille_marque_ad*unitvector(_cart(A)-_cart(O))) transformed inverse _T,O,(_cart(O)+taille_marque_ad*unitvector(_cart(B)-_cart(O))) transformed inverse _T)
enddef;

taille_marque_s:=0.3cm;
angle_marque_s:=60;
sep_marque_s:=2;

vardef milieu(expr A,B)=
  0.5[A,B]
enddef;

vardef marqueunique_s(expr A,B)=
   ((-taille_marque_s*unitvector(_cart(A)-_cart(B))/2)--(taille_marque_s*unitvector(_cart(A)-_cart(B))/2)) rotated angle_marque_s
enddef;

vardef marquesegment(expr A,B,n)=
 save $;
 picture $;
 $=image(
    for i=1 upto n:
      draw marqueunique_s(A,B) shifted ((i-1-(n-1)/2)*sep_marque_s*unitvector(_cart(B)-_cart(A))) transformed inverse _T;
    endfor
    );
  $ shifted milieu(_cart(A),_cart(B))
enddef;



%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
%%%%%%%%%%   FONCTIONS USUELLES   %%%%%%%%%
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

pi:=3.141592654;
e:=2.718281828;

vardef sin(expr x) = sind(180*x/pi) enddef;

vardef cos(expr x) = cosd(180*x/pi) enddef;

vardef tan(expr x) = sin(x)/cos(x) enddef;

vardef exp(expr x) = mexp(x*256) enddef;

vardef ln(expr x) = mlog(x)/256 enddef;

vardef ch(expr x)=(exp(x)+exp(-x))/2 enddef;

vardef sh(expr x)=(exp(x)-exp(-x))/2 enddef;

vardef Arctan(expr x)= pi*angle(1,x)/180 enddef;

vardef Arcsin(expr x)= Arctan(x/sqrt(1-x**2)) enddef;

vardef Arccos(expr x)= pi/2-Arcsin(x) enddef;


%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
%%%%%%%%%%   REMPLISSAGE   %%%%%%%%%
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
let _fill_ = fill;

def fill expr c=
if path c: _fill_ c else: draw c fi
enddef;

numeric largbriques,hautbriques,decbriques;
largbriques=12;hautbriques=6;decbriques=6;

vardef briques(text t)=
 if long_texte(t)=0:
    repbriques(largbriques,hautbriques,decbriques)
 else:
    repbriques(t)
 fi
enddef;



vardef repbriques(expr larg,haut,dec)=
 numeric d;d=0;
 image(%
 for j=0 upto _hautcadre_/haut:
   olddraw ((0,0)--(_largcadre_,0)) shifted (0,j*haut);
   d:=d+dec;if d>larg: d:=d-larg fi;
   for i=0 upto _largcadre_/larg:
     olddraw ((0,0)--(0,haut)) shifted (i*larg+d,j*haut);
   endfor;
 endfor) shifted llcorner _cart(cadre)
enddef;


numeric pashach,anglehach;
pashach=5;anglehach=60;

vardef hachures(text t)=
 if long_texte(t)=0:
    rephachures(pashach,anglehach)
 else:
    rephachures(t)
 fi
enddef;

vardef rephachures(expr pas,angle)=
 image(%
 for i=floor(-_diag_/(2*pas)) upto ceiling(_diag_/(2*pas)):
 olddraw ((-_diag_/2,0)--(_diag_/2,0)) shifted (0,i*pas);
 endfor) rotated angle shifted center _cart(cadre)
enddef;

numeric pervagues,ampvagues,decvagues;
pervagues=20;ampvagues=3;decvagues=10;

vardef vagues(text t)=
 if long_texte(t)=0:
    repvagues(pervagues,ampvagues,decvagues)
 else:
    repvagues(t)
 fi
enddef;


vardef repvagues(expr per,amp,dec)=   %D'après le manuel de l'utilisateur de MetaPost
 image(%
 for j=0 upto _hautcadre_/dec:
   for i=0 upto _largcadre_/amp:
    olddraw ((0,0){curl 0}..(per/4,-amp)..(per/2,0){curl 0}..(3*per/4,amp)..(per,0){curl 0}) shifted (i*per,j*dec);
   endfor;
 endfor) shifted llcorner _cart(cadre)
enddef;


primarydef p avec c =
 begingroup
 save _des_;
 picture _des_;
 _des_:=c;
 clip _des_ to (p transformed _T);
 _des_
 endgroup
enddef;


%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
%%%%%%%%%%   DIVERS   %%%%%%%%%
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

string LaTeX_packages[],LaTeX_preamble,LaTeX_inputenc;
LaTeX_preamble:="";LaTeX_inputenc:="";

numeric n_packages;
n_packages:=0;

def LaTeX_AjoutPackage(expr t)=
     latexmp_packages:=latexmp_packages & "," & t
enddef;

def LaTeX_AjoutCommande(expr t)=
  LaTeX_preamble:=LaTeX_preamble  & t
enddef;

def LaTeX_Encodage(expr t)=
  LaTeX_inputenc:= t
enddef;



boolean LaTeXprem;
LaTeXprem:=true;

def LaTeXsetup =
   if LaTeXprem:
      LaTeXprem:=false;
      latexmp_preamble:=LaTeX_preamble;
      latexmp_inputenc:=LaTeX_inputenc;
      if latexmp_inputenc="": latexmp_inputenc:="utf8" fi;
      if latexmp_packages="": latexmp_packages:="fourier" fi;
      latexmp_packages:=latexmp_packages & ",textcomp,mathtools,mathrsfs,esvect[e],siunitx[output-decimal-marker={,}],babel[french]";
      latexmp_preamble:=latexmp_preamble & "\newcommand{\vect}[1]{\vv{#1}}" & "\newcommand{\calc}{\mathscr{C}}" & "\newcommand{\calp}{\mathscr{P}}" & "\DecimalMathComma" ;
   fi
enddef;

vardef LaTeX primary sc =   
  if known mplib: textext(sc) scaled defaultscale
  else: LaTeXsetup; textext(sc) scaled defaultscale
  fi
enddef;
%vardef LaTeX primary sc =   
%   LaTeXsetup; textext(sc) scaled defaultscale
%enddef;


% Mai 2017
% Légende avec flèche
vardef thelegende@#(expr lab,p) =
  image(%
  label@#(lab,point 0 of p);
  drawarrow p)
enddef;

def legende = draw thelegende enddef;


%%%%%%%%%%%%%%%Figure intermédiaire%%%%%%%%%%%%%%%%%%%
def figureinter=
  clip currentpicture to (cadre transformed _T);
  shipit;
  _nfig:=_nfig+1;
  charcode:=charcode+1;
enddef;



def epaisseur=withpen pencircle scaled enddef;
def couleur=withcolor enddef;


vardef long_texte(text t)=
  save i;
  numeric i;
  i:=0;
  for n=t: i:=i+1; endfor
  i
enddef;

vardef _chaine(suffix s)= %met les termes en indice si le 2e est un chiffre
  save c,d;
  string c,d;
  d:= str s;
  if length(d)=1:
     c:=d
     elseif isdigit (substring (1,2) of d):
            c:= (substring (0,1) of d) & "_{" & substring (1,infinity) of d & "}"
            else: c:=str s
  fi;
  c
enddef;


%%%%%%%%%%%%%%% MATHS %%%%%%%%%%%%%%%%%

vardef arrondi(expr p,x)=              %arrondi de x au p-ième
  round((x-floor(x))*p)/p+floor(x)
enddef;

vardef arrondimil(expr x)=
  arrondi(1000,x)
enddef;

vardef pgcd(expr a,b)=
  save r_,a_,b_;
  numeric r_,a_,b_;
  a_=a;b_=b;
  forever:
    r_:=a_ mod b_;
    exitif r_=0;
    a_:=b_;
    b_:=r_;
  endfor;
  b_
enddef;

vardef factorielle(expr n)=  %  Calcul de n!
  save $;
  numeric $;
  $:= 1  for i=1 upto n: * i endfor;
  $
enddef;

vardef binom(expr n,k)=    % calcul du coefficient binomial k parmi n
  save $,p;
  numeric $,p;
  p:= min(k,n-k);
  $:=1;
  for i=1 upto p:
   $:= ($*(n-i+1))/i;
  endfor
  $
enddef;

vardef binomiale(expr n,p,k)=
   save $,ktmp,ptmp;
   numeric $,ktmp,ptmp;
   if k>n-k:
      ktmp:=n-k;
      ptmp:=1-p
   else:
      ktmp:=k;
      ptmp:=p
   fi;
   $:=1;
   for i=1 upto ktmp:
      $:=((n-i+1)/i)*ptmp*$;
   endfor
   for i=1 upto n-ktmp:
      $:=$*(1-ptmp);
   endfor
   $
enddef;

% Mai 2017
% P(X=k) pour X suivant la loi de Poisson de paramètre lambda
vardef poisson(expr lambda,k)=
 exp(-lambda)
 for i=1 upto k:
   *(lambda/i)
 endfor
enddef;

%%%%%%%%%%%%%%% COULEURS %%%%%%%%%%%%%%%%%%%
cmykcolor Rouge,Vert,Bleu,Marron,Lime,Orange,Rose,Pourpre,Violet,Cyan,Magenta,Jaune,Olive,Noir,Grisfonce,Gris,Grisclair,Blanc,Beige,Marine,Moutarde,Vertfonce;

Rouge:=(0,1,1,0);
Vert:=(1,0,1,0);
Bleu:=(1,1,0,0);
Marron:=(0,0.53,1,0.65);
Lime:=(0.38,0,0.78,0.01);
Orange:=(0,0.5,1,0);
Rose:=(0,0.57,0.38,0.01);
Pourpre:=(0,0.91,0.59,0.38);
Violet:=(0.5,1,0,0.4);
Cyan:=(1,0,0,0);
Magenta:=(0,1,0,0);
Jaune:=(0,0,1,0);
Olive:=(0.21,0,0.75,0.45);
Noir:=(0,0,0,1);
Grisfonce:=(0,0,0,0.75);
Gris:=(0,0,0,0.5);
Grisclair:=(0,0,0,0.25);
Blanc:=(0,0,0,0);
Beige:=(0,0.14,0.37,0.22);
Marine:=(1,1,0,0.5);
Moutarde:=(0.04,0,1,0.19);
Vertfonce:=(1,0,1,0.5);


vardef conversion_cmyn_rvb(expr coul)=
  ((1-cyanpart coul)*(1-blackpart coul),(1-magentapart coul)*(1-blackpart coul),(1-yellowpart coul)*(1-blackpart coul))
enddef;

color rouge,vert,bleu,marron,lime,orange,rose,pourpre,violet,cyan,magenta,jaune,olive,noir,grisfonce,gris,grisclair,blanc,beige,marine,moutarde,vertfonce;

rouge:=conversion_cmyn_rvb(Rouge);
vert:=conversion_cmyn_rvb(Vert);
bleu:=conversion_cmyn_rvb(Bleu);
marron:=conversion_cmyn_rvb(Marron);
lime:=conversion_cmyn_rvb(Lime);
orange:=conversion_cmyn_rvb(Orange);
rose:=conversion_cmyn_rvb(Rose);
pourpre:=conversion_cmyn_rvb(Pourpre);
violet:=conversion_cmyn_rvb(Violet);
cyan:=conversion_cmyn_rvb(Cyan);
magenta:=conversion_cmyn_rvb(Magenta);
jaune:=conversion_cmyn_rvb(Jaune);
olive:=conversion_cmyn_rvb(Olive);
noir:=conversion_cmyn_rvb(Noir);
grisfonce:=conversion_cmyn_rvb(Grisfonce);
gris:=conversion_cmyn_rvb(Gris);
grisclair:=conversion_cmyn_rvb(Grisclair);
blanc:=conversion_cmyn_rvb(Blanc);
beige:=conversion_cmyn_rvb(Beige);
marine:=conversion_cmyn_rvb(Marine);
moutarde:=conversion_cmyn_rvb(Moutarde);
vertfonce:=conversion_cmyn_rvb(Vertfonce);


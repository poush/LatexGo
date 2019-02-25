%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
%%                        mptrees.mp                          %%
%%               Probability trees with MetaPost              %%
%%                    o.peault@posteo.net                     %%
%%                 Version 17.06 (June 2017)                  %%
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
%
% This work may be distributed and/or modified under the conditions of
% the LaTeX Project Public License, either version 1.3 of this license
% or (at your option) any later version.  The latest version of this
% license is in http://www.latex-project.org/lppl.txt
%
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
if not known mplib: input latexmp fi;

boolean arbres_latexmp;
arbres_latexmp:=true;

numeric posprob;   % position de l'étiquette sur la branche
posprob:=0.6;

numeric scaleprob;
scaleprob:=0.85;   % échelle de l'étiquette sur la branche

numeric scaleev;
scaleev:=1;   % échelle de l'évènement

numeric dirtree,dirlabel; % direction de l'arbre
dirtree:=0;
dirlabel:=0;

numeric proboffset;  % redéfinition temporaire de labeloffset pour affichage probas
proboffset:=labeloffset;

numeric endedgeshift;
endedgeshift:=0;

pair Orig_arbre[][];  % sommet de l'arbre i,j
Orig_arbre[1][1]:=origin;

numeric colonne_cour,ligne_cour;

numeric countligne[];  % nombre de ligne pour le niveau i
 
numeric typedec;  % 0 origine dépend de la taille de l'évènement, 1 taille fixée
numeric shiftev;   % taille du décalage dans le cas où typedec=1
shiftev:=0; % dans ce cas, typedec =0
extra_beginfig:=extra_beginfig & "shiftev:=0;"; % remise à zéro en début de figure


numeric typeprob; % affichage de la proba sur la branche
typeprob:=1;

boolean abscoord; % Coordonnée absolues
abscoord=false;

string branchtype,endlabeltype;
branchtype="segment";
endlabeltype="none";

boolean edgearrow;
edgearrow:=false;

numeric endlabelspace;
endlabelspace:=1cm;


% Étiquette au début de l'arbre
vardef startlabel(expr s)=
  if dirtree<>0: dirlabel:=dirtree fi;
   if dirlabel>0:
     theevlabel(labelarbres(s) scaled scaleev,origin,-180+dirlabel)
   else:
     theevlabel(labelarbres(s) scaled scaleev,origin,180+dirlabel)
   fi
enddef;


% Étiquettes de fin d'arbre
vardef colonne.endlabel[]=
  @
enddef;

vardef endlabel[][](expr s)=
  save i,j,tmpbranchtype,tmpabscoord,tmps;
  numeric i,j;
  string tmpbranchtype,tmps;
  boolean tmpabscoord;
  i:=colonne.#@;
  j:=@;
  if string s: tmps:= "\strut " & s else: tmps:=s fi;
  tmpbranchtype:=branchtype;
  branchtype:=endlabeltype;
  tmpabscoord:=abscoord;
  abscoord:=false;
  tree[i][j]((endlabelspace,0) rotated (dirlabel-dirtree))(tmps,"")
  hide(branchtype:=tmpbranchtype;abscoord:=tmpabscoord;)
enddef;


vardef labelarbres(expr s)=
  save p; picture p;
  if picture s:  p=s
  elseif path s: p=image(draw s)
  else: p=textext(s)
  fi;
  p
enddef;


% longueur du segment qui traverse la figure p selon l'angle inc
vardef longdir(expr p,inc)= 
  if urcorner p = llcorner p:
    0
  elseif (abs inc <= abs angle (urcorner p -llcorner p)) or (abs inc > 180 - abs angle (urcorner p -llcorner p)):
    abs((lrcorner p - llcorner p)/cosd(inc))
  else:
    abs((ulcorner p - llcorner p)/sind(inc))
  fi
enddef;

vardef theevlabel(expr s,z,inc)=
  save p; picture p;
  save d; numeric d;
  if picture s:  p=s
  else:    p = textext(s)
  fi;
  d=0.5*longdir(p,inc);
%  p shifted (z - 0.5(lrcorner p - llcorner p) - 0.5(ulcorner p - llcorner p) + (d+labeloffset)*dir(inc))
  p shifted (z - center p + (d+labeloffset)*dir(inc))
enddef;

def evlabel = draw theevlabel enddef;



vardef thelabelbranchehaut(expr Ori,Fin,Fig)=
   interim labeloffset:=proboffset;
   save M,pp;
   pair M; path pp;
   pp=dessinbranche(Ori,Fin);
   M= point (arctime posprob*(arclength  pp) of pp) of pp;
   M:=M + 0.5(llcorner Fig - lrcorner Fig);
   if xpart Ori <= xpart Fin:
      M:=M+proboffset*unitvector(dir (dirlabel+90))
   else:
      M:=M-proboffset*unitvector(dir (dirlabel+90))
   fi;
   Fig shifted M
enddef;


vardef thelabelbranchehautrot(expr Ori,Fin,Fig)=
   interim labeloffset:=proboffset;
   if  xpart Ori <= xpart Fin:
      Fig shifted (0.5*(ulcorner Fig - lrcorner Fig) + llcorner Fig+(0,proboffset)) rotated (angle(Fin-Ori)) shifted posprob[Ori,Fin]
   else:
      Fig shifted (0.5*(ulcorner Fig - lrcorner Fig) + llcorner Fig+(0,proboffset)) rotated (angle(Ori-Fin)) shifted posprob[Ori,Fin]
   fi
enddef;



vardef thelabelbranchesuper(expr Ori,Fin,Fig)=
   save figtmp;
   picture figtmp;
   figtmp:=Fig shifted (posprob[Ori,Fin]-0.5*(lrcorner Fig + ulcorner Fig));
   image(fill bbox figtmp withcolor background;
         draw figtmp)
enddef;


vardef thelabelbranchesuperrot(expr Ori,Fin,Fig)=
   save figtmp;
   picture figtmp;
   figtmp:=Fig shifted (-0.5*(lrcorner Fig + ulcorner Fig)) rotated (angle(Fin-Ori)) shifted posprob[Ori,Fin];
   image(fill bbox figtmp withcolor background;
         draw figtmp)
enddef;



vardef thelabelbranche(expr Ori,Fin,Fig)=
  if typeprob=1:
     thelabelbranchehaut(Ori,Fin,Fig)
  elseif typeprob=2:
     thelabelbranchesuper(Ori,Fin,Fig)
  elseif typeprob=3:
     thelabelbranchehautrot(Ori,Fin,Fig)
  elseif typeprob=4:
     thelabelbranchesuperrot(Ori,Fin,Fig)
  fi
enddef;

%%%%%%%% Dessin de la branche
vardef dessinbranche(expr Ori,Fin)=
  if branchtype="segment":
    Ori--Fin
  else:
    Ori--Fin
  fi
enddef;


%%%%%%%% Dessin complet de la branche (avec proba, évènement

vardef branche_abs(expr Ori,Fin,Eve,Pro)=
   save figtmp,thelab,figlab,tmpshft;
   picture figtmp,thelab,figlab;
   numeric tmpshft;
   thelab:=labelarbres(Pro) scaled scaleprob;
   if ypart Ori > ypart Fin:  %le décalage se fait en fonction de la direction de la branche
      tmpshft:=endedgeshift
   else:
      tmpshft:=-endedgeshift
   fi;
   figlab:=thelabelbranche(Ori,(Fin+ (0,tmpshft)) rotatedaround(Ori,dirtree),thelab);
   figtmp=image(%
      if branchtype<>"none":
         if edgearrow: 
            drawarrow 
         else:
            draw
         fi
         dessinbranche(Ori,Fin + (0,tmpshft)) rotatedaround(Ori,dirtree)
      fi;
      draw figlab;
      evlabel(Eve,Fin rotatedaround(Ori,dirtree),dirlabel)
      );
   figtmp
enddef;


vardef branche_rel(expr Ori,dx,dy,Eve,Pro)=
  branche_abs(Ori,Ori+(dx,dy),Eve,Pro)
enddef;


vardef _arbre_(expr Ori)(text t)(text r)= % (pt)(pt1,pt2...)(ev,proba,ev,proba...)
  save figtmp,n,Fintmp,labeltmp,counttmp,countlab;
  picture figtmp,labeltmp[];
  numeric counttmp,countlab;
  pair Fintmp[];
  if dirtree<>0: dirlabel:=dirtree fi;
  if colonne_cour=1: for i=1 upto 6: countligne[i]:=0; endfor fi
  figtmp=image(%
      counttmp:=0;
      for i=t:
        counttmp:=counttmp+1;
        Fintmp[counttmp]:=i;
      endfor;
      counttmp:=0;countlab:=0;
      for i=r:
         countlab:=countlab+1;
         labeltmp[countlab]:=labelarbres(i);
         if countlab=2:
            counttmp:=counttmp+1;countligne[colonne_cour+1]:=countligne[colonne_cour+1]+1;
            draw branche_abs(Ori,Fintmp[counttmp],labeltmp[1] scaled scaleev,labeltmp[2]);
            Orig_arbre[colonne_cour+1][countligne[colonne_cour+1]]:=Fintmp[counttmp] shifted 
              if typedec=0: ((longdir(labeltmp[1] scaled scaleev,dirlabel)+2labeloffset)*(1,0))
              else: (shiftev,0)
              fi
              if dirtree=0: rotatedaround(Fintmp[counttmp],dirlabel) fi
              rotatedaround(Ori,dirtree);
            countlab:=0
         fi;
      endfor);
   figtmp
enddef;


vardef arbre_var(expr Ori,horiz,Ymax)(text t)(text r)= % (pt,dec horiz,Ymax)(dy1,dy2...)(ev,proba,ev,proba...)
  save Fin,compt,Ytmp;
  numeric compt,Ytmp;
  pair Fin[];
  Fin[0]:=Ori+(horiz,Ymax);
  compt:=0;Ytmp:=Ymax;
  for i=t:
    compt:=compt+1;Ytmp:=Ytmp-i;
    Fin[compt]:=Ori+(horiz,Ytmp);
  endfor
  def ptarr=
    Fin[0]
    for i=1 upto compt:
     ,Fin[i]
    endfor
  enddef;
  _arbre_(Ori)(ptarr)(r)
enddef;


vardef arbre_decv(expr Ori,horiz,Ymax)(text t)(text r)= 
          % (pt,dec horiz)(dy1,dy2...)(ev,proba,ev,proba...)
  save Fin,compt,Ytmp;
  numeric compt,Ytmp;
  pair Fin[];
  if abscoord:
    Fin[0]:=(horiz,Ymax)
  else:
    Fin[0]:=Ori+(horiz,Ymax)
  fi;
  compt:=0;Ytmp:=Ymax;
  for i=t:
    compt:=compt+1;Ytmp:=i;
    if abscoord:
      Fin[compt]:=(horiz,Ytmp)
    else:
      Fin[compt]:=Ori+(horiz,Ytmp)
    fi;
  endfor
  def ptarr=
    Fin[0]
    for i=1 upto compt:
     ,Fin[i]
    endfor
  enddef;
  _arbre_(Ori)(ptarr)(r)
enddef;


vardef arbre_fixe(expr Ori,horiz,Ymax,decy)(text r)=
  save Fin,compt,compt_par;
  numeric compt,compt_par;
  pair Fin[];
  if abscoord:
    Fin[0]:=(horiz,Ymax + ypart Ori)
  else:
    Fin[0]:=Ori+(horiz,Ymax)
  fi;
  compt:=0;compt_par:=0;
  for i=r:
    compt:=compt+1;compt_par:=compt_par+1;
    if compt_par=2:
       compt_par:=0;
       if abscoord:
         Fin[compt/2]:=(0, ypart Ori) + (horiz,Ymax-decy*compt/2)
       else:
         Fin[compt/2]:=Ori+(horiz,Ymax-decy*compt/2)
       fi;
    fi
  endfor
  def ptarr=
    Fin[0]
    for i=1 upto compt:
     ,Fin[i]
    endfor
  enddef;
  _arbre_(Ori)(ptarr)(r)
enddef;


vardef colonne.reg.arbre[]=
  @
enddef;

vardef colonne.comp.arbre[]=
  @
enddef;

vardef colonne.dec.arbre[]=
  @
enddef;


vardef reg.arbre[][](text t)(text r)=
 save compt,decal;
 numeric compt,decal[];
 colonne_cour:=colonne.#@;
 ligne_cour:=@;
 typedec:=0;
  if shiftev<>0: typedec:=1 fi;
 compt:=0;
   for i=t:
    if numeric i: 
       compt:=compt+1;
       decal[compt]:=i
    else:
       typedec:=1;
       scantokens i
    fi;
   endfor
 compt:=0;
   for i=r:
    compt:=compt+1;
   endfor
 arbre_fixe(Orig_arbre[colonne_cour][ligne_cour],decal[1],(compt/2-1)*decal[2]/2,decal[2])(r)
enddef;



vardef comp.arbre[][](text t)(text r)=
  colonne_cour:=colonne.#@;
  ligne_cour:=@;
  typedec:=0;
  if shiftev<>0: typedec:=1 fi;
  save tmp_compt;
  numeric tmp_compt;
  tmp_compt:=0;
  for i=t:
    if string i:
      typedec:=1;
      scantokens i
    fi;
  endfor
  if abscoord:
    def tmp_text=t enddef
  else:
  def tmp_text= % Si abscoord tmp_text=t
    for i=t:
      hide(tmp_compt:=tmp_compt+1;)
      if (tmp_compt>1) and (not string i):
         ,Orig_arbre[colonne_cour][ligne_cour]+i
      elseif not string i: 
         Orig_arbre[colonne_cour][ligne_cour]+i
      fi
    endfor
  enddef
  fi;
  _arbre_(Orig_arbre[colonne_cour][ligne_cour])(tmp_text)(r)
enddef;

    
%%%%%%%%%%%%%%%%%%%%%%%%% Modif 10/16 - Décalage par rapport à l'origine
vardef dec.arbre[][](text t)(text r)=
  save decal;
  numeric decal[];
  colonne_cour:=colonne.#@;
  ligne_cour:=@;
  typedec:=0;
  if shiftev<>0: typedec:=1 fi;
  save tmp_compt;
  numeric tmp_compt;
  tmp_compt:=0;
  for i=t:
    if numeric i:
       tmp_compt:=tmp_compt+1;
       decal[tmp_compt]:=i
    else:
       typedec:=1;
       scantokens i
    fi;
  endfor
  def tmp_text=
    decal[3]
    for i=4 upto tmp_compt:
      ,decal[i]
    endfor
  enddef;
  arbre_decv(Orig_arbre[colonne_cour][ligne_cour],decal[1],decal[2])(tmp_text)(r)
enddef;
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%5    

vardef arbre[][](text t)(text r)=
  save tmp_type,tmp_compt;
  numeric tmp_type,tmp_compt;
  tmp_compt:=0;
  for i=t:
    if numeric i: tmp_compt:=tmp_compt+1 fi;
  endfor
  if tmp_compt=0: % Arbre défini par des points (dec_horiz,dec_vert)
     comp.#@.@(t)(r)
  elseif tmp_compt=2: % Arbre régulier, on donne largeur et esp. vert.
     reg.#@.@(t)(r)
  else:
     dec.#@.@(t)(r) % Arbre semi-régulier, largeur fixe, decalages vert.
  fi
enddef;

def tree = arbre enddef;

#!/bin/sh

#
#
#  xhlatex                                  Version 1.1
#  Copyright (C) 2003--2009               Eitan M. Gurari
#  Copyright 2009 TeX Users Group
#
#  This work may be distributed and/or modified under the
#  conditions of the LaTeX Project Public License, either
#  version 1.3 of this license or (at your option) any
#  later version. The latest version of this license is
#  in
#    http://www.latex-project.org/lppl.txt
#  and version 1.3 or later is part of all distributions
#  of LaTeX version 2003/12/01 or later.
#
#  This work has the LPPL maintenance status "maintained".
#
#  The Current Maintainer of this work
#  is the TeX4ht Project.
#
#                                         tex4ht@tug.org
#                              http://www.tug.org/tex4ht
#
#


        latex $5 '\makeatletter\def\HCode{\futurelet\HCode\HChar}\def\HChar{\ifx"\HCode\def\HCode"##1"{\Link##1}\expandafter\HCode\else\expandafter\Link\fi}\def\Link#1.a.b.c.{\g@addto@macro\@documentclasshook{\RequirePackage[#1,xhtml]{tex4ht}}\let\HCode\documentstyle\def\documentstyle{\let\documentstyle\HCode\expandafter\def\csname tex4ht\endcsname{#1,xhtml}\def\HCode####1{\documentstyle[tex4ht,}\@ifnextchar[{\HCode}{\documentstyle[tex4ht]}}}\makeatother\HCode '$2'.a.b.c.\input ' $1
        latex $5 '\makeatletter\def\HCode{\futurelet\HCode\HChar}\def\HChar{\ifx"\HCode\def\HCode"##1"{\Link##1}\expandafter\HCode\else\expandafter\Link\fi}\def\Link#1.a.b.c.{\g@addto@macro\@documentclasshook{\RequirePackage[#1,xhtml]{tex4ht}}\let\HCode\documentstyle\def\documentstyle{\let\documentstyle\HCode\expandafter\def\csname tex4ht\endcsname{#1,xhtml}\def\HCode####1{\documentstyle[tex4ht,}\@ifnextchar[{\HCode}{\documentstyle[tex4ht]}}}\makeatother\HCode '$2'.a.b.c.\input ' $1
        latex $5 '\makeatletter\def\HCode{\futurelet\HCode\HChar}\def\HChar{\ifx"\HCode\def\HCode"##1"{\Link##1}\expandafter\HCode\else\expandafter\Link\fi}\def\Link#1.a.b.c.{\g@addto@macro\@documentclasshook{\RequirePackage[#1,xhtml]{tex4ht}}\let\HCode\documentstyle\def\documentstyle{\let\documentstyle\HCode\expandafter\def\csname tex4ht\endcsname{#1,xhtml}\def\HCode####1{\documentstyle[tex4ht,}\@ifnextchar[{\HCode}{\documentstyle[tex4ht]}}}\makeatother\HCode '$2'.a.b.c.\input ' $1
        tex4ht -f/$1  -i~/tex4ht.dir/texmf/tex4ht/ht-fonts/$3
        t4ht -f/$1 $4 -cvalidate ## -d~/WWW/temp/ -m644 




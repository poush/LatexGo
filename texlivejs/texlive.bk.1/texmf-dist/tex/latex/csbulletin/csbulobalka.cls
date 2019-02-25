%% $Id$
\ProvidesClass{csbulobalka}[2008/12/08 Naskladej obalku]
\newif\if@ZWzadek
\newif\if@ZWvnitrek
\def\ZW@sz{a5}
\DeclareOption{zadek}{\def\ZW@sz{a4,Landscape,spine=0mm}\@ZWzadektrue}
\DeclareOption{Zadek}{\def\ZW@sz{a4,Landscape,spine=0mm}\@ZWzadektrue\@ZWvnitrektrue}
\ProcessOptions
\LoadClass{article}
\RequirePackage[\ZW@sz,margins=0mm,strictheight,cropmarks,nopagenumbers]{zwpagelayout}
\RequirePackage{zwtools,graphicx}
\RequirePackage[T1]{fontenc}
\RequirePackage{lmodern}
\parindent 0mm
\pagestyle{empty}
\newcount\zw@pg
\newcommand\BulObalka[2][bul.pdf]{\setkeys{zwpl}{croptitle=Zpravodaj #2}\ZWPDFgetnum #1 \ZW@pgnum
  \if@ZWzadek \includegraphics[page=\ZW@pgnum]{#1}\hfill \fi
  \includegraphics[page=1]{#1}\if@ZWvnitrek
  \clearpage
  \zw@pg=\ZW@pgnum \advance\zw@pg\m@ne
  \includegraphics[page=2]{#1}\hfill
  \includegraphics[page=\number\zw@pg]{#1}\fi}

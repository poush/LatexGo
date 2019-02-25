%% $Id$
\ProvidesClass{csbulv1}[2008/12/08 V1]
\newif\if@JenVnitrek
\DeclareOption{jenvnitrek}{\@JenVnitrektrue}
\ProcessOptions
\LoadClass{article}
\RequirePackage[a4,Landscape,margins=0mm,strictheight]{zwpagelayout}
\RequirePackage{zwtools,graphicx}
\newdimen\Vonedim  \Vonedim\z@
\newcommand\Vtwo[1][3mm]{\Vonedim #1\relax}
\def\bul@v{\hskip -\Vonedim \relax}
\parindent 0mm
\pagestyle{empty}
\newcount\zw@odd
\newcount\zw@even
\newcommand\Skladej[1][bul.pdf]{\ZWPDFgetnum #1 \ZW@pgnum
  \zw@odd=\ZW@pgnum
  \ifodd\zw@odd\else
    \zw@even=\zw@odd
    \divide\zw@even 2
    \ifodd\zw@even
      \advance\zw@odd\@ne
    \else
      \advance\zw@odd\m@ne
    \fi
  \fi
  \zw@even=2
  \if@JenVnitrek
    \advance\zw@even 2
    \advance\zw@odd -2
  \fi
  \loop
    \noindent\hbox to .5\linewidth{\ifnum\zw@odd>\ZW@pgnum\else \bul@v
                        \reflectbox{\includegraphics[page=\number\zw@odd]{#1}}\fi\hss}%
             \hbox to .5\linewidth{\hss
                        \reflectbox{\includegraphics[page=\number\zw@even]{#1}}\bul@v}\par
    \advance\zw@even 2
    \advance\zw@odd -2
    \ifnum\zw@odd>1
  \repeat}

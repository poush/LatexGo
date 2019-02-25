%%
%% This is file `bidipresentation.cls',
%% 
%%   __________________________________________________
%%   Copyright © 2009–2014  Vafa Khalighi <persian-tex@tug.org>
%%
%% A great portion of the code is brorrowd from texpower bundle:
%%
%% -------------------------------------------------------------------------------------
%% TeXPower bundle - dynamic online presentations with LaTeX
%% Copyright (C) 1999-2004 Stephan Lehmke
%% Copyright (C) 2003-2005 Hans Fredrik Nordhaug
%% -------------------------------------------------------------------------------------
%%
%% with modifications to get things working properly in both right to
%% left and left to right modes.
%% 
%%   It may be distributed and/or modified under the LaTeX Project Public License,
%%   version 1.3c or higher (your choice). The latest version of
%%   this license is at: http://www.latex-project.org/lppl.txt
%% 
%%   This work is “author-maintained” (as per LPPL maintenance status)
%%   by Vafa Khalighi.
%% 
\NeedsTeXFormat{LaTeX2e}
\ProvidesClass{bidipresentation}[2014/09/26 v0.3 Experimental bidi presentation]
\RequirePackage{scrlfile}
\RequirePackage{fancyhdr}
\RequirePackage{ifthen}
\RequirePackage{calc}
\RequirePackage{keyval}
\DeclareOption*{\PassOptionsToClass{\CurrentOption}{article}}
\newboolean{verbose@bidipres}
\DeclareOption{verbose}{\setboolean{verbose@bidipres}{true}}
\provideboolean{display}
\DeclareOption{display}{\setboolean{display}{true}}
\DeclareOption{printout}{\setboolean{display}{false}}
\newboolean{fixcolorstack@bidipres}
\DeclareOption{fixcolorstack}{\setboolean{fixcolorstack@bidipres}{true}}
\newboolean{strongfiltering@bidipres}
\DeclareOption{strongfiltering}{\setboolean{strongfiltering@bidipres}{true}}
\newcommand{\strongfilteringon}{\setboolean{strongfiltering@bidipres}{true}}
\newcommand{\strongfilteringoff}{\setboolean{strongfiltering@bidipres}{false}}
\newboolean{nineminutes@bidipres}
\DeclareOption{nineminutes}{\setboolean{nineminutes@bidipres}{true}}
\newboolean{bidiprescolor}
\newboolean{coloremph@bidipres}
\DeclareOption{coloremph}
{\setboolean{bidiprescolor}{true}\setboolean{coloremph@bidipres}{true}}
\newboolean{colormath@bidipres}
\DeclareOption{colormath}
{\setboolean{bidiprescolor}{true}\setboolean{colormath@bidipres}{true}}
\newboolean{colorhighlight@bidipres}
\DeclareOption{colorhighlight}
{\setboolean{bidiprescolor}{true}\setboolean{colorhighlight@bidipres}{true}}
\newboolean{whitebackground@bidipres}
\setboolean{whitebackground@bidipres}{true}% This is the default.
\DeclareOption{whitebackground}
{\setboolean{bidiprescolor}{true}\setboolean{whitebackground@bidipres}{true}}
\newboolean{lightbackground@bidipres}
\DeclareOption{lightbackground}
{\setboolean{bidiprescolor}{true}\setboolean{lightbackground@bidipres}{true}}
\newboolean{blackbackground@bidipres}
\DeclareOption{blackbackground}
{\setboolean{bidiprescolor}{true}\setboolean{blackbackground@bidipres}{true}}
\newboolean{darkbackground@bidipres}
\DeclareOption{darkbackground}
{\setboolean{bidiprescolor}{true}\setboolean{darkbackground@bidipres}{true}}
\ExecuteOptions{display}
\ProcessOptions\relax
\LoadClass{article}

\RequirePackage[foot=10.2pt,head=0pt,paperwidth=128mm,paperheight=96mm,left=5mm,top=5mm,right=7mm,bottom=8mm]{geometry}

\renewcommand{\headrulewidth}{0mm}

\renewcommand{\maketitle}%
  {\ClassError{bidipresentation}{Caution: ``maketitle'' command not supported}%
  {Please use ``titlepage'' environment instead}%
}

\RequirePackage{hyperref}

\fancypagestyle{pres}{%
\lhead{}%
\chead{}%
\rhead{}%
\ifthenelse{\boolean{bidiprescolor}}{%
\lfoot{\xecolor{textcolor}\footnotesize \thepage}}{%
\lfoot{\footnotesize \thepage}}
\cfoot{}%
\rfoot{}%
}

\pagestyle{pres}

\newcommand{\distance}[1]{\vspace*{\stretch{#1}}}
\newcommand{\abstand}[1]{\vspace*{\stretch{#1}}}

\setlength{\parskip}{0.6ex}
\setlength{\parindent}{0mm}

\newenvironment{plainslide}[1][]%
   {{\raggedleft \large\bfseries #1\par}\par\vspace*{\stretch{1}}}%
   {\par\vspace*{\stretch{1}}\newpage}

\newenvironment{rawslide}{}{\newpage}%

\def\itemize{%
  \ifnum \@itemdepth >\thr@@\@toodeep\else
    \advance\@itemdepth\@ne
    \edef\@itemitem{labelitem\romannumeral\the\@itemdepth}%
    \expandafter
    \list
      \csname\@itemitem\endcsname
      {\def\makelabel##1{\hss\llap{##1}}}%
  \fi
    \setlength{\itemsep}{0ex}%
    \setlength{\parskip}{0.1ex}%
    \setlength{\parsep}{0ex}%
    }%
\let\enditemize =\endlist

\def\enumerate{%
  \ifnum \@enumdepth >\thr@@\@toodeep\else
    \advance\@enumdepth\@ne
    \edef\@enumctr{enum\romannumeral\the\@enumdepth}%
      \expandafter
      \list
        \csname label\@enumctr\endcsname
        {\usecounter\@enumctr\def\makelabel##1{\hss\llap{##1}}}%
  \fi
    \setlength{\itemsep}{0ex}%
    \setlength{\parskip}{0.1ex}%
    \setlength{\parsep}{0ex}%
    }%
\let\endenumerate =\endlist

\renewenvironment{description}
               {\list{}{\labelwidth\z@ \itemindent-\leftmargin
                        \let\makelabel\descriptionlabel}
 \setlength{\itemsep}{0ex}%
    \setlength{\parskip}{0.1ex}%
    \setlength{\parsep}{0ex}}
               {\endlist}
               
\ifthenelse{\boolean{display}}
{\ClassInfo{bidipresentation}{Producing display version. Dynamic features activated.}}
{\ClassInfo{bidipresentation}{Producing printout version. Dynamic features inactive.}}
\ifthenelse{\boolean{verbose@bidipres}}{\setcounter{errorcontextlines}{10000}}{}

\newcounter{tmpcnta@bidipres}
\newcounter{tmpcntb@bidipres}

\newlength{\tempdima@bidipres}
\newlength{\tempdimb@bidipres}

\newbox\tempbox@bidipres

\newboolean{carryon@bidipres}
\newcommand{\bidiprespagewidth}{\strip@pt\paperwidth truept}
\newcommand{\bidiprespageheight}{\strip@pt\paperheight truept}
\newcommand{\mkfactor}[2]%
{\setlength{\tempdima@bidipres}{1pt*#2}\edef#1{\strip@pt\tempdima@bidipres}}
\newcommand{\mklength@bidipres}[2]
{\setlength{\tempdima@bidipres}{#2}\edef#1{\the\tempdima@bidipres}}

\newcommand{\mklength}{}
\let\mklength\mklength@bidipres




\ifthenelse{\boolean{bidiprescolor}}{%
\RequirePackage{color}%
\RequirePackage{xecolor}%
}{}%
\ifthenelse{\boolean{bidiprescolor}}{% Yes.
  \let\setcolor@bidipres=\color%
  \let\o@definecolor@bidipres=\definecolor%
  \def\definecolor#1#2#3%
  {%
    \o@definecolor@bidipres{#1}{#2}{#3}%
    \expandafter\edef\csname colordef@bidipres@#1\endcsname%
    {\csname processcolor@bidipres@#2\endcsname{#3}}%
    }%
  \@ifundefined{c@lor@namefile}{}{\input{\c@lor@namefile}}

  \ifx\color@gray\@undefined
    \ifx\color@rgb\@undefined
    \else
      \definecolor{black}{rgb}{0,0,0}
      \definecolor{white}{rgb}{1,1,1}
    \fi
  \else
    \definecolor{black}{gray}{0}
    \definecolor{white}{gray}{1}
  \fi
  \ifx\color@rgb\@undefined\else
    \definecolor{red}{rgb}{1,0,0}
    \definecolor{green}{rgb}{0,1,0}
    \definecolor{blue}{rgb}{0,0,1}
  \fi
  \ifx\color@cmyk\@undefined\else
    \definecolor{cyan}{cmyk}{1,0,0,0}
    \definecolor{magenta}{cmyk}{0,1,0,0}
    \definecolor{yellow}{cmyk}{0,0,1,0}
  \fi
  \newcommand{\interpolate@bidipres}[3]%
  {%
    \setlength{\tempdima@bidipres}{1pt-#1pt}%               Calculate the second factor for the weighted average.
    \edef\secondfactor@bidipres{\strip@pt\tempdima@bidipres}%
    \setlength{\tempdima@bidipres}{#2pt*\real{#1}+#3pt*\real{\secondfactor@bidipres}}% Calculate the weighted average.
    \ifthenelse{\lengthtest{\tempdima@bidipres<0pt}}%       Bound the result to the interval [0,1] (just in case the first
    {\setlength{\tempdima@bidipres}{0pt}}%                  factor was not from [0,1]).
    {\ifthenelse{\lengthtest{\tempdima@bidipres>1pt}}{\setlength{\tempdima@bidipres}{1pt}}{}}%
    \edef\result@bidipres{\strip@pt\tempdima@bidipres}%
    }
  \def\interpolate@three@bidipres#1,#2,#3;#4,#5,#6;#7%
  {%
    \interpolate@bidipres{#7}{#1}{#4}%                      First intermediary value.
    \edef\newcolordef@bidipres{\result@bidipres,}%                Store first value.
    \interpolate@bidipres{#7}{#2}{#5}%                      Second intermediary value.
    \edef\newcolordef@bidipres{\newcolordef@bidipres\result@bidipres,}% Store second value.
    \interpolate@bidipres{#7}{#3}{#6}%                      Third intermediary value.
    \edef\newcolordef@bidipres{\newcolordef@bidipres\result@bidipres}%  Store third value.
    }
  \def\interpolate@four@bidipres#1,#2,#3,#4;#5,#6,#7,#8;#9%
  {%
    \interpolate@bidipres{#9}{#1}{#5}%                      First intermediary value.
    \edef\newcolordef@bidipres{\result@bidipres,}%                Store first value.
    \interpolate@bidipres{#9}{#2}{#6}%                      Second intermediary value.
    \edef\newcolordef@bidipres{\newcolordef@bidipres\result@bidipres,}% Store second value.
    \interpolate@bidipres{#9}{#3}{#7}%                      Third intermediary value.
    \edef\newcolordef@bidipres{\newcolordef@bidipres\result@bidipres,}% Store third value.
    \interpolate@bidipres{#9}{#4}{#8}%                      Fourth intermediary value.
    \edef\newcolordef@bidipres{\newcolordef@bidipres\result@bidipres}%  Store fourth value.
    }
  \def\convert@cmykvalue@rgbvalue@bidipres#1#2%
  {%
    \setlength{\tempdima@bidipres}{1pt-#1pt-#2pt}%
    \ifthenelse{\lengthtest{\tempdima@bidipres<0pt}}{\setlength{\tempdima@bidipres}{0pt}}{}%
    \edef\result@bidipres{\strip@pt\tempdima@bidipres}%
    }%
  \def\convert@cmyk@rgb@bidipres#1,#2,#3,#4;%
  {%
    \convert@cmykvalue@rgbvalue@bidipres{#1}{#4}%
    \edef\newcolordef@bidipres{\result@bidipres,}%                Store first value.
    \convert@cmykvalue@rgbvalue@bidipres{#2}{#4}%
    \edef\newcolordef@bidipres{\newcolordef@bidipres\result@bidipres,}% Store second value.
    \convert@cmykvalue@rgbvalue@bidipres{#3}{#4}%
    \edef\newcolordef@bidipres{\newcolordef@bidipres\result@bidipres}%  Store third value.
    }
  \def\convert@RGBvalue@rgbvalue@bidipres#1%
  {%
    \setlength{\tempdima@bidipres}{#1pt/255}%
    \edef\result@bidipres{\strip@pt\tempdima@bidipres}%
    }%
  \def\convert@RGB@rgb@bidipres#1,#2,#3;%
  {%
    \convert@RGBvalue@rgbvalue@bidipres{#1}%
    \edef\newcolordef@bidipres{\result@bidipres,}%                Store first value.
    \convert@RGBvalue@rgbvalue@bidipres{#2}%
    \edef\newcolordef@bidipres{\newcolordef@bidipres\result@bidipres,}% Store second value.
    \convert@RGBvalue@rgbvalue@bidipres{#3}%
    \edef\newcolordef@bidipres{\newcolordef@bidipres\result@bidipres}%  Store third value.
    }
  \newcommand{\colorbetween}[4][.5]%
  {%
    \begingroup%                               Make the definition of \processcolor... local.
      \newcommand{\processcolor@bidipres@rgb}[3]%    What if the first color is an rgb color?
      {%
        \ifx##2\processcolor@bidipres@rgb%           Are both colors rgb colors?
          \interpolate@three@bidipres##1;##3;{#1}%   Calculate interpolated values.
         \else
          \ifx##2\processcolor@bidipres@gray%        Is the second color from the gray model?
            \interpolate@three@bidipres##1;##3,##3,##3;{#1}%    Calculate interpolated values.
           \else
            \ifx##2\processcolor@bidipres@cmyk%      Is the second color from the cmyk model?
              \convert@cmyk@rgb@bidipres##3;%        Convert to rgb.
              \edef\newcolordef@bidipres{\noexpand\interpolate@three@bidipres##1;\newcolordef@bidipres;{#1}}%
              \newcolordef@bidipres
             \else
              \ifx##2\processcolor@bidipres@RGB%     Is the second color from the RGB model?
                \convert@RGB@rgb@bidipres##3;%       Convert to rgb.
                \edef\newcolordef@bidipres{\noexpand\interpolate@three@bidipres##1;\newcolordef@bidipres;{#1}}%
                \newcolordef@bidipres
               \else
                \ifx##2\processcolor@bidipres@hsb%   Is the second color from the hsb model?
                  \ClassError{bidipresentation}{Don't know how to convert an hsb color!}
                \fi
              \fi
            \fi
          \fi
        \fi
        \edef\newcolordef@bidipres{{rgb}{\newcolordef@bidipres}}% Store the result
        }%
      \newcommand{\processcolor@bidipres@gray}[3]%          What if the first color is a gray color?
      {%
        \ifx##2\processcolor@bidipres@gray%                 Are both colors gray colors?
          \interpolate@bidipres{#1}{##1}{##3}%              Calculate interpolated value.
          \edef\newcolordef@bidipres{{gray}{\result@bidipres}}%   Store the result
         \else
          \processcolor@bidipres@rgb{##1,##1,##1}{##2}{##3}% Otherwise, convert first color to rgb and continue.
        \fi
        }%
      \newcommand{\processcolor@bidipres@cmyk}[3]%          What if the first color is a cmyk color?
      {%
        \ifx##2\processcolor@bidipres@cmyk%                 Are both colors cmyk colors?
          \interpolate@four@bidipres##1;##3;{#1}%           Calculate interpolated values.
          \edef\newcolordef@bidipres{{cmyk}{\newcolordef@bidipres}}% Store the result
         \else
          \convert@cmyk@rgb@bidipres##1;%                   Otherwise, convert first color to rgb ...
          \expandafter\processcolor@bidipres@rgb\expandafter{\newcolordef@bidipres}{##2}{##3}% ... and continue.
        \fi
        }%
      \newcommand{\processcolor@bidipres@RGB}[3]%           What if the first color is an RGB color?
      {%
        \convert@RGB@rgb@bidipres##1;%                      Convert to rgb ...
        \expandafter\processcolor@bidipres@rgb\expandafter{\newcolordef@bidipres}{##2}{##3}% ... and continue.
        }%
      \newcommand{\processcolor@bidipres@hsb}[3]%           What if the first color is an hsb color?
      {%
        \ifx##2\processcolor@bidipres@hsb%                  Are both colors hsb colors?
          \interpolate@three@bidipres##1;##3;{#1}%          Calculate interpolated values.
          \edef\newcolordef@bidipres{{hsb}{\newcolordef@bidipres}}% Store the result
         \else
          \ClassError{bidipresentation}{Don't know how to convert an hsb color!}
        \fi
        }%
      \expandafter\let\expandafter
      \firstcol@bidipres\csname colordef@bidipres@#3\endcsname    % Retrieve definition of color <source1>...
      \expandafter\expandafter\expandafter\firstcol@bidipres% and apply (remember \processcolor... is part of the definition)
      \csname colordef@bidipres@#4\endcsname%                 to definition of color <source2>.
      \edef\end@bidipres%                                     Define color <target> (outside the enclosing group).
      {\endgroup\noexpand\definecolor{#2}\newcolordef@bidipres}%
    \end@bidipres
    }% matches \newcommand{\colorbetween}
  \newcommand{\complement@bidipres}[1]%
  {%
    \setlength{\tempdima@bidipres}{1pt-#1pt}%
    \edef\result@bidipres{\strip@pt\tempdima@bidipres}%
    }
  \def\complement@three@bidipres#1,#2,#3;%
  {%
    \complement@bidipres{#1}%
    \edef\newcolordef@bidipres{\result@bidipres,}%                Store first value.
    \complement@bidipres{#2}%
    \edef\newcolordef@bidipres{\newcolordef@bidipres\result@bidipres,}% Store second value.
    \complement@bidipres{#3}%
    \edef\newcolordef@bidipres{\newcolordef@bidipres\result@bidipres}%  Store third value.
    }
  \def\grabfourth@bidipres#1,#2,#3,#4;%
  {%
    \def\mem@bidipres{#4}%                         Store fourth element.
    \def\result@bidipres{#1,#2,#3;}%               Store first three elements.
    }
  \newcommand{\complementcolor}[2]%
  {%
    \begingroup%                               Make the definition of \processcolor... local.
      \newcommand{\processcolor@bidipres@rgb}[1]%    What if the color is an rgb color?
      {%
        \complement@three@bidipres##1;%              Calculate complemented values.
        \edef\newcolordef@bidipres{{rgb}{\newcolordef@bidipres}}% Store the result
        }%
      \newcommand{\processcolor@bidipres@gray}[1]%   What if the color is a gray color?
      {%
        \complement@bidipres{##1}%                   Calculate complemented value.
        \edef\newcolordef@bidipres{{gray}{\result@bidipres}}% Store the result
        }%
      \newcommand{\processcolor@bidipres@cmyk}[1]%   What if the color is a cmyk color?
      {%
        \grabfourth@bidipres##1;%                    Remember fourth element.
        \expandafter\complement@three@bidipres\result@bidipres%  Calculate complemented values of first three elements.
        \edef\newcolordef@bidipres{{cmyk}{\newcolordef@bidipres,\mem@bidipres}}% Store the result, putting back the fourth element.
        }%
      \newcommand{\processcolor@bidipres@RGB}[1]%    What if the color is an RGB color?
      {%
        \convert@RGB@rgb@bidipres##1;%               Convert to rgb ...
        \expandafter\processcolor@bidipres@rgb\expandafter{\newcolordef@bidipres}% ... and continue.
        }%
      \newcommand{\processcolor@bidipres@hsb}[1]%    What if the color is an hsb color?
      {%
        \complement@three@bidipres##1;%              Calculate complemented values.
        \edef\newcolordef@bidipres{{hsb}{\newcolordef@bidipres}}% Store the result
        }%
      \csname colordef@bidipres@#2\endcsname%        Execute definition of color <source> (which contains \processcolor...)
      \edef\end@bidipres%                            Define color <target> (outside the enclosing group).
      {\endgroup\noexpand\definecolor{#1}\newcolordef@bidipres}%
    \end@bidipres
    }% matches \newcommand{\complementcolor}
  }% matches \ifthenelse{\boolean{bidiprescolor}}{% Yes.
{% No. Do nothing.
  }
\newcommand{\replacecolor}
{%
  \let\replacecolor@hook@bidipres=\@gobble% This hook can be used for variant checking (see below).
  \replacecolor@bidipres%                   Pick up arguments.
  }

\newcommand{\replacecolor@bidipres}[2][]% Pick up the first two arguments of \replacecolor.
{%
  \ifthenelse{\equal{#1}{}}{\edef\tcolname@bidipres{#2}}{\edef\tcolname@bidipres{#2@#1}}% Construct `real' target color name.
  \@replacecolor@bidipres%                                                        Read second argument.
  }%
\ifthenelse{\boolean{bidiprescolor}}% Only if bidipresentation's color management is active.
{% Yes.
  \newcommand{\undefinecolor@bidipres}[1]%                                Make a color undefined.
  {\expandafter\let\csname\string\color @#1\endcsname=\@undefined}%

  \newcommand{\ifcolorexists@bidipres}[3]%                                Conditional for testing whether a color is defined.
  {\@ifundefined{\string\color @#1}{#3}{#2}}%                       Test whether a given color is defined.

  \newcommand{\@replacecolor@bidipres}[2][]%                              Second part of \replacecolor.
  {%
    \ifthenelse{\equal{#1}{}}{\edef\scolname@bidipres{#2}}{\edef\scolname@bidipres{#2@#1}}% Construct `real' source color name.
    \ifcolorexists@bidipres{\scolname@bidipres}%                                            Does the source color exist at all?
    {% Yes.
      \replacecolor@hook@bidipres{\tcolname@bidipres}%                                      Execute hook.
      \expandafter\let\csname\string\color @\tcolname@bidipres\expandafter\endcsname% Make value of target color
      \csname\string\color @\scolname@bidipres\endcsname%                             identical with source color.
      \expandafter\let\csname colordef@bidipres@\tcolname@bidipres\expandafter\endcsname%   Make definition of target color
      \csname colordef@bidipres@\scolname@bidipres\endcsname%                               identical with source color.
      }%
    {% No. Do nothing.
      }%
    }%
  \newcommand{\colors@bidipres}{}
  \newcommand{\removecolor@bidipres}[1]%
  {%
    \def\processme@bidipres##1%              This macro does the real work.
    {%
      \ifthenelse{\equal{#1}{##1}}%    Is this the color to be removed?
      {% Yes. Do nothing, so it vanishes.
        }
      {% No. Re-insert.
        \expandafter\def\expandafter\colors@bidipres\expandafter{\colors@bidipres\processme@bidipres{##1}}%
        }%
      }%
    \expandafter\let\expandafter\colors@bidipres\expandafter\empty% Initialize \colors@bidipres.
    \colors@bidipres%                                               Execute \processme@bidipres for every color on the list.
    }
  \newcommand{\addbidiprescolor}[1]%
  {%
    \removecolor@bidipres{#1}%               Remove this color from the list (to avoid duplicates).
    \expandafter\def\expandafter\colors@bidipres\expandafter{\colors@bidipres\processme@bidipres{#1}}% ... and insert.
    \register@normalvariant@bidipres{#1}%    Register the normal variant for this color.
    }
  \newcommand{\definebidiprescolor}[4][]
  {%
    \addbidiprescolor{#2}%                   Add color to the list.
    \ifthenelse{\equal{#1}{}}%         Color from the current color set?
    {\definecolor{#2}{#3}{#4}}%        Yep. Just define the color.
    {\definecolor{#2@#1}{#3}{#4}}%     No. Add color set identifyer.
    }
  \newcommand{\replacecolors@bidipres}%
  {%
    \@ifstar%                                    The starred version will put the color set into normal variant.
    {\let\replacecolor@hook@bidipres=\register@normalvariant@bidipres\@replacecolors@bidipres}
    {\let\replacecolor@hook@bidipres=\@gobble\@replacecolors@bidipres}%
    }

  \newcommand{\@replacecolors@bidipres}[4]%            This part does the real work.
  {%
    \def\processme@bidipres##1{\replacecolor@bidipres[#1]{#2##1}[#3]{#4##1}}%
    \colors@bidipres
    }
  \newcommand{\usecolorset}[1]%
  {%
    \replacecolors@bidipres*{}{}{#1}{}%   Replace normal variant (registering variants).
    \replacecolors@bidipres{}{d}{#1}{d}%  Replace dimmed variant.
    \replacecolors@bidipres{}{e}{#1}{e}%  Replace enhanced variant.
    \xecolor{textcolor}%              Activate textcolor.
    \pagecolor{pagecolor}%          Activate pagecolor.
    }%
  \newcommand{\dumpcolorset}[1]%
  {%
    \nonnormalwarnings@bidipres{Dumping color set #1}% Output a warning for every color not in the normal variant.
    \replacecolors@bidipres{#1}{}{}{}%                 Dump normal variant (hopefully).
    \replacecolors@bidipres{#1}{d}{}{d}%               Dump dimmed variant.
    \replacecolors@bidipres{#1}{e}{}{e}%               Dump enhanced variant.
    }%
  \newcommand{\registervariant@bidipres}[2]%           Remember which variant a color is currently in.
  {\expandafter\def\csname cvar@#1@bidipres\endcsname{#2}}

  \newcommand{\register@normalvariant@bidipres}[1]%    Register that a color is now in the normal variant.
  {\registervariant@bidipres{#1}{}}

  \newcommand{\currentvariant@bidipres}[1]%            Return the current variant of a color.
  {\csname cvar@#1@bidipres\endcsname}

  \newcommand{\ifnormalvariant@bidipres}[3]%           Conditional for checking whether a color is in the normal variant.
  {\ifthenelse{\equal{\currentvariant@bidipres{#1}}{}}{#2}{#3}}

  \newcommand{\nonnormalwarnings@bidipres}[1]%         Checks the current variant for every standard color and gives a warning
  {%                                             if it's not the normal one.
    \def\processme@bidipres##1%
    {%
      \ifnormalvariant@bidipres{##1}{}
      {%
        \ClassWarning{bidipresentation}
        {#1\MessageBreak when color ##1 is in \currentvariant@bidipres{##1} variant}%
        }%
      }%
    \colors@bidipres
    }
  \newcommand{\dimlevel}{.7}
  \newcommand{\dimcolor}[2][\dimlevel]
  {%
    \ifnormalvariant@bidipres{#2}%            Color in the normal variant?
    {% Yes.
      \registervariant@bidipres{#2}{d}%       Register dimmed variant.
      \ifcolorexists@bidipres{d#2}%           Dedicated dimmed color found?
      {\replacecolor{#2}{d#2}}%         Yes. use that one.
      {\colorbetween[#1]{#2}{pagecolor}{#2}}% No. Dim numerically using \colorbetween.
      }%
    {}% No. Do nothing.
    }
  \newcommand{\dimcolors}[1][\dimlevel]
  {%
    \def\processme@bidipres##1{\dimcolor[#1]{##1}}%
    \colors@bidipres
    }%
  \newcommand{\enhancelevel}{.5}
  \newcommand{\enhancecolor}[2][\enhancelevel]
  {%
    \ifnormalvariant@bidipres{#2}%            Color in the normal variant?
    {%
      \registervariant@bidipres{#2}{e}%       Register enhanced variant.
      \ifcolorexists@bidipres{e#2}%           Dedicated enhanced color found?
      {\replacecolor{#2}{e#2}}%         Yes. use that one.
      {\colorbetween[-#1]{#2}{pagecolor}{#2}}% No. Enhance numerically using \colorbetween.
      }%
    {}%
    }%
  \newcommand{\enhancecolors}[1][\enhancelevel]
  {%
    \def\processme@bidipres##1{\enhancecolor[#1]{##1}}%
    \colors@bidipres
    }%
  \newcommand{\replacecolorsbyone@bidipres}[2]%
  {%
    \def\processme@bidipres##1{\replacecolor{#1##1}{#2}}%
    \colors@bidipres
    }
  \newcommand{\vanishcolor}{pagecolor}
  \newcommand{\vanishcolors}[1][\vanishcolor]{\replacecolorsbyone@bidipres{}{#1}}
  \input{bidiprescolors.cfg}
  \newcommand{\whitebackground}%
  {%
    \usecolorset{whitebg}%
    }
  \ifthenelse{\boolean{whitebackground@bidipres}}
  {\AtEndOfClass{\whitebackground}}
  {}
  \newcommand{\lightbackground}%
  {%
    \usecolorset{lightbg}%
    }
  \ifthenelse{\boolean{lightbackground@bidipres}}{\AtEndOfClass{\lightbackground}}{}
  \newcommand{\darkbackground}%
  {%
    \usecolorset{darkbg}%
    }
  \ifthenelse{\boolean{darkbackground@bidipres}}{\AtEndOfClass{\darkbackground}}{}
  \newcommand{\blackbackground}%
  {%
    \usecolorset{blackbg}%
    }
  \ifthenelse{\boolean{blackbackground@bidipres}}{\AtEndOfClass{\blackbackground}}{}
  \ifthenelse{\boolean{bidiprescolor}}
  {%
    \renewcommand{\normalcolor}{\xecolor{textcolor}}%      \normalcolor should produce textcolor.

    \let\o@textnormal@bidipres=\textnormal%                       \textnormal should also set text color.
    \def\textnormal#1{\o@textnormal@bidipres{\normalcolor#1}}
    \AtEndOfClass{\xecolor{textcolor}\let\default@color\current@color}
    \AtBeginDocument%
    {%
      \pagecolor{pagecolor}\xecolor{textcolor}%
    }%
  }
  {}
  \ifthenelse{\boolean{bidiprescolor}}{\AtBeginDocument{\pagecolor{pagecolor}\xecolor{textcolor}}}{}
  }% matches \ifthenelse{\boolean{bidiprescolor}}{% Yes.
{% No; provide dummies.
  \let\setcolor@bidipres=\@gobble%
  \newcommand{\@replacecolor@bidipres}[2][]{}%
  \let\addbidiprescolor=\@gobble
  \newcommand{\definebidiprescolor}[4][]{}%
  \let\usecolorset=\@gobble
  \let\dumpcolorset=\@gobble
  \newcommand{\dimcolor}[2][]{}
  \newcommand{\dimcolors}[1][]{}
  \newcommand{\enhancecolor}[2][]{}
  \newcommand{\enhancecolors}[1][]{}
  \newcommand{\vanishcolors}[1][]{}
  }
\ifthenelse{\boolean{coloremph@bidipres}}%                       Should \emph use color?
{%  Yes;
  \DeclareRobustCommand{\em}%                              Redefine \em.
  {%
    \@nomath\em \xecolor{emcolor}%                           Change color.
    \replacecolor{tmp@bidipres}{emcolor}%                        Exchange emcolor and altemcolor.
    \replacecolor{emcolor}{altemcolor}%
    \replacecolor{altemcolor}{tmp@bidipres}%
    }%
  }%
{}% No; keep original definition.

\ifthenelse{\boolean{colorhighlight@bidipres}}%                Color highlighting enabled?
{%  Yes; code is displayed typewriter-style, bold and in a special color.
  \DeclareRobustCommand{\code}[1]{\textxecolor{codecolor}{\textbf{\texttt{#1}}}}%
  \DeclareRobustCommand{\codeswitch}{\xecolor{codecolor}\bfseries\ttfamily}%
  }
{%  No; code is displayed just in typewriter-style and bold.
  \DeclareRobustCommand{\code}[1]{\textbf{\texttt{#1}}}%
  \DeclareRobustCommand{\codeswitch}{\bfseries\ttfamily}%
  }
\newcommand{\macroname}[1]{\code{\textbackslash#1}}
\newcommand{\commandapp}[3][]{\code{\macroname{#2}\ifthenelse{\equal{#1}{}}{}{[#1]}\{#3\}}}
\newcommand{\carg}[1]{\code{\origmath{\left<\code{#1}\right>}}}
\ifthenelse{\boolean{colorhighlight@bidipres}}%                  Color highlighting enabled?
{%  Yes;
  \DeclareRobustCommand{\underl}{\textxecolor{underlcolor}}% Use color to highlight.
  }
{%  No;
  \DeclareRobustCommand{\underl}{\textbf}%                 Use bold face.
  }
\ifthenelse{\boolean{colorhighlight@bidipres}}%                  Color highlighting enabled?
{%  Yes;
  \DeclareRobustCommand{\concept}{\textxecolor{conceptcolor}}% Use color to highlight.
  }
{%  No;
  \DeclareRobustCommand{\concept}{\textbf}%                  Use bold face.
  }
\ifthenelse{\boolean{colorhighlight@bidipres}}%                  Color highlighting enabled?
{%  Yes;
  \DeclareRobustCommand{\inactive}{\textxecolor{inactivecolor}}% Use color to highlight.
  }
{%  No;
  \DeclareRobustCommand{\inactive}{\monochromeinactive}%       Use monochrome default.
  }

\providecommand{\monochromeinactive}{}% What should \inactive do if colors can't be used? We provide a hook for
                                      % user definitions.
\ifthenelse{\boolean{colorhighlight@bidipres}}%                  Color highlighting enabled?
{%  Yes; use a colored box.
  \newcommand{\present}[2][]{\leavevmode\llap{\textbf{\footnotesize#1}\,}\fcolorbox{textcolor}{presentcolor}{#2}}%
  \newcommand{\mkpbox@bidipres}[1]{\fcolorbox{presentcolor}{presentcolor}{#1}}% Internal macro for use by \presentbox.
  }
{%  No; use an \fbox.
  \newcommand{\present}[2][]{\leavevmode\llap{\textbf{\footnotesize#1}\,}\fbox{#2}}%
  \newcommand{\mkpbox@bidipres}[1]{\fbox{#1}}%
  }
\newsavebox{\pbox@bidipres}%                                  Container for the minipage to be boxed.
\newenvironment{presentbox}%
{%
  \par\smallskip%                                       First a small space to separate the area from preceding text.
  \begin{lrbox}{\pbox@bidipres}%                              Save the contents in a minipage inside \pbox@bidipres.
    \noindent
    \begin{minipage}{\linewidth-2\fboxsep-2\fboxrule}%  Reduce the width of the minipage to leave space for the frame.
      \replacecolor{presentcolor}{pagecolor}%           If \present is used inside the colored area...
      }%
    {%
    \end{minipage}
  \end{lrbox}%
  \noindent\mkpbox@bidipres{\usebox{\pbox@bidipres}}%               This typesets the saved minipage inside the coloured area.
  \smallskip%                                           A small space to separate the area from succeding text.
  \par
  }
\newcommand{\rulestripes}{10}
\newcommand{\stripeoverlap}{.15pt}
\newcommand{\rulefirstgradprogression}{1}
\newcommand{\rulesecondgradprogression}{1}
\newcommand{\rulegradmidpoint}{.5}
\newcounter{stripe@bidipres}

\newcounter{stripes@bidipres}

\newcommand{\firstgradprogression@bidipres}{1}

\newcommand{\secondgradprogression@bidipres}{1}

\newcounter{gradprogression@bidipres}

\newcommand{\gradmidpoint@bidipres}{.5}
\newcommand{\mkgradfirstfactor@bidipres}{\mkgradfactor@bidipres\firstgradprogression@bidipres}

\newcommand{\mkgradsecondfactor@bidipres}{\mkgradfactor@bidipres\secondgradprogression@bidipres}

\newcommand{\mkgradfactor@bidipres}[3]% Calculate a factor modified by a `progression' parameter.
{%
  \mkfactor{#2}{#3}%                               Calculate the unmodified factor.
  \setcounter{gradprogression@bidipres}{#1}%             Factor definition may contain a calc-expression.
  \ifthenelse{\value{gradprogression@bidipres}=1}{}%     Progression value 1 is neutral.
  {%
    \ifthenelse{\value{gradprogression@bidipres}<0}%     `Negative' progression?
    {% Yes.
      \@tempcnta-\value{gradprogression@bidipres}\relax% Complement progression wrt 0.
      \mkfactor{#2}{1-1pt*\real{#2}}%              Complement factor definition wrt 1pt.
      }
    {\@tempcnta\value{gradprogression@bidipres}\relax}%  No; Use progression as given.
    \whiledo{\the\@tempcnta>1}%                    Calculate (factor definition)^(progression).
    {\advance\@tempcnta by -1\relax\mkfactor{#2}{\real{#2}*\real{#2}}}%
    \ifthenelse{\value{gradprogression@bidipres}<0}%     `Negative' progression?
    {% Yes.
      \mkfactor{#2}{1-1pt*\real{#2}}%              Complement result wrt 1pt.
      }
    {}%
  }%
}
\newcommand{\vgradrule}[1][]% Pick up first optional argument: [<stripes>]
{%
  \let\firstgradprogression@bidipres=\rulefirstgradprogression%  Use progression parameter for rules.
  \ifthenelse{\equal{#1}{}}%                               First optional argument given?
  {\setcounter{stripes@bidipres}{\rulestripes}}%                 No; use default value.
  {\setcounter{stripes@bidipres}{#1}}%                           Yes.
  \vgradrule@bidipres%                                           Pick up [<startmodel>]{<startcolor>}.
}

\newcommand{\vgradrule@bidipres}[2][]% Pick up next pair of arguments: [<startmodel>]{<startcolor>}.
{%
  \ifthenelse{\equal{#1}{}}%               <startmodel> given?
  {\replacecolor{startcolor@bidipres}{#2}}%      No; <startcolor> is a color name.
  {\definecolor{startcolor@bidipres}{#1}{#2}}%   Yes; {<startmodel>}{<startcolor>} is a color definition.
  \@vgradrule@bidipres%                          Pick up [<endmodel>]{<endcolor>}.
}

\newcommand{\@vgradrule@bidipres}[2][]% Pick up next pair of arguments: [<endmodel>]{<endcolor>}.
{%
  \ifthenelse{\equal{#1}{}}
  {\replacecolor{endcolor@bidipres}{#2}}
  {\definecolor{endcolor@bidipres}{#1}{#2}}%
  \@@vgradrule@bidipres%                         Pick up rule arguments and proceed.
}
\newcommand{\hstripe@bidipres}[4]%
{\hbox{{\setcolor@bidipres{stripecolor@bidipres}\rule{#2}{#3}}}#4}
\newcommand{\@@vgradrule@bidipres}[3][0pt]%
{%
  \ifthenelse{\value{stripes@bidipres}<2}%       A `pathological case' which can happen in animations: If 0 or 1 stripes are
                                   %       requested, a division by zero error would be produced by the gradient code.
  {\mbox{{\setcolor@bidipres{startcolor@bidipres}\rule[#1]{#2}{#3}}}}% In this case, just produce a colored rule.
  {%
    \raisebox{#1}%                         Evaluate the <raise> argument of the rule.
    {%
      \vbox%                               A vbox with \offinterlineskip allows to align the stripes vertically.
      {%
        \offinterlineskip
        \setcounter{stripe@bidipres}{0}%         Initialize the number of the current stripe.
        \whiledo{\value{stripe@bidipres}<\value{stripes@bidipres}}
        {%
          \mkgradfirstfactor@bidipres{\tmp@bidipres}%  Make the weight for \colorbetween, based on the number of the current stripe
          {\value{stripe@bidipres}/(\value{stripes@bidipres}-1)}% and the first gradient progression.
          \colorbetween[\tmp@bidipres]{stripecolor@bidipres}{endcolor@bidipres}{startcolor@bidipres}% Calculate stripe color.
          \stepcounter{stripe@bidipres}%
          \ifthenelse{\value{stripe@bidipres}=\value{stripes@bidipres}}%     Last stripe?
          {\hstripe@bidipres{\tmp@bidipres}{#2}{(#3)/\value{stripes@bidipres}}{}}% Yes; make stripe w/o overlap.
          {%                                                     No; add a kern to make stripes overlap.
            \hstripe@bidipres{\tmp@bidipres}{#2}{(#3)/\value{stripes@bidipres}+\stripeoverlap}{\kern-\stripeoverlap}%
            }%
          }% matches \whiledo{\value{stripe@bidipres}<\value{stripes@bidipres}}{%
        }% matches \vbox{%
      }% matches \raisebox{#1}{%
    }% matches second argument of \ifthenelse{\value{stripes@bidipres}<2}
  }% matches \newcommand{\@@vgradrule@bidipres}[3][0pt]{%
\newcommand{\dblvgradrule}[1][]% Pick up first optional argument: [<midpoint>]
{%
  \let\firstgradprogression@bidipres=\rulefirstgradprogression%  Use progression parameters for rules.
  \let\secondgradprogression@bidipres=\rulesecondgradprogression
  \ifthenelse{\equal{#1}{}}%                               First optional argument given?
  {\let\gradmidpoint@bidipres=\rulegradmidpoint}%                No; use default value.
  {\def\gradmidpoint@bidipres{#1}}%                              Yes.
  \dblvgradrule@bidipres%                                        Pick up second optional argument.
}

\newcommand{\dblvgradrule@bidipres}[1][]% Pick up second optional argument: [<stripes>]
{%
  \ifthenelse{\equal{#1}{}}
  {\setcounter{stripes@bidipres}{\rulestripes}}
  {\setcounter{stripes@bidipres}{#1}}%
  \@dblvgradrule@bidipres
}

\newcommand{\@dblvgradrule@bidipres}[2][]% Pick up next pair of arguments: [<startmodel>]{<startcolor>}.
{%
  \ifthenelse{\equal{#1}{}}
  {\replacecolor{startcolor@bidipres}{#2}}
  {\definecolor{startcolor@bidipres}{#1}{#2}}%
  \@@dblvgradrule@bidipres
}

\newcommand{\@@dblvgradrule@bidipres}[2][]% Pick up next pair of arguments: [<midmodel>]{<midcolor>}.
{%
  \ifthenelse{\equal{#1}{}}
  {\replacecolor{midcolor@bidipres}{#2}}
  {\definecolor{midcolor@bidipres}{#1}{#2}}%
  \@@@dblvgradrule@bidipres
}

\newcommand{\@@@dblvgradrule@bidipres}[2][]% Pick up next pair of arguments: [<endmodel>]{<endcolor>}.
{%
  \ifthenelse{\equal{#1}{}}
  {\replacecolor{endcolor@bidipres}{#2}}
  {\definecolor{endcolor@bidipres}{#1}{#2}}%
  \@@@@dblvgradrule@bidipres%                         Pick up rule arguments and proceed.
}

\newcommand{\@@@@dblvgradrule@bidipres}[3][0pt]%              Main part of \dblvgradrule.
{%
  \ifthenelse{\value{stripes@bidipres}<2}%                    The gradient code is not equipped for making less than 2 stripes.
  {\mbox{{\setcolor@bidipres{midcolor@bidipres}\rule[#1]{#2}{#3}}}}% In this case, just produce a rule colored with the middle color.
  {%
    \raisebox{#1}%                                      Evaluate the <raise> argument of the rule.
    {%
      \vbox%                                            A vbox with \offinterlineskip allows to align the stripes
      {%                                                vertically.
        \offinterlineskip
        \setcounter{stripe@bidipres}{0}%                      Initialize the number of the current stripe.
        \setcounter{tmpcnta@bidipres}%                        Number of the `middle' stripe.
        {\value{stripes@bidipres}*\real{\gradmidpoint@bidipres}}%
        \whiledo{\value{stripe@bidipres}<\value{tmpcnta@bidipres}}% Produce the upper part of the gradient.
        {%
          \mkgradfirstfactor@bidipres{\tmp@bidipres}%               Make the weight for \colorbetween, based on the number of the
          {\value{stripe@bidipres}/\value{tmpcnta@bidipres}}%       current stripe and the first gradient progression.
          \colorbetween[\tmp@bidipres]{stripecolor@bidipres}{midcolor@bidipres}{startcolor@bidipres}% Calculate stripe color.
          \hstripe@bidipres{\tmp@bidipres}%                                               Make stripe with overlap.
          {#2}{(#3)/\value{stripes@bidipres}+\stripeoverlap}{\kern-\stripeoverlap}% This is the upper part, remember?
          \stepcounter{stripe@bidipres}%
          }%
        \stepcounter{tmpcnta@bidipres}%
        \ifthenelse{\value{stripes@bidipres}=\value{tmpcnta@bidipres}}% Only one stripe left to produce?
        {\hstripe@bidipres{1}{#2}{(#3)/\value{stripes@bidipres}}{}}%    Just produce one stripe colored with the end color.
        {%
          \whiledo{\value{stripe@bidipres}<\value{stripes@bidipres}}%   Produce the lower part of the gradient.
          {%
            \mkgradsecondfactor@bidipres{\tmp@bidipres}%                Make the weight for \colorbetween.
            {(\value{stripe@bidipres}-\value{tmpcnta@bidipres}+1)/(\value{stripes@bidipres}-\value{tmpcnta@bidipres})}%
            \colorbetween[\tmp@bidipres]{stripecolor@bidipres}{endcolor@bidipres}{midcolor@bidipres}% Calculate stripe color.
            \stepcounter{stripe@bidipres}%
            \ifthenelse{\value{stripe@bidipres}=\value{stripes@bidipres}}%     Last stripe?
            {\hstripe@bidipres{\tmp@bidipres}{#2}{(#3)/\value{stripes@bidipres}}{}}% Yes; make stripe w/o overlap.
            {%                                                     No; add kern to make stripes overlap.
              \hstripe@bidipres{\tmp@bidipres}{#2}{(#3)/\value{stripes@bidipres}+\stripeoverlap}{\kern-\stripeoverlap}%
              }%
            }% matches \whiledo{\value{stripe@bidipres}<\value{stripes@bidipres}}%
          }% matches second argument of \ifthenelse{\value{stripes@bidipres}=\value{tmpcnta@bidipres}}%
        }% matches \vbox{%
      }% matches \raisebox{#1}{%
    }% matches second argument of \ifthenelse{\value{stripes@bidipres}<2}%
  }% matches \newcommand{\@@@@dblvgradrule@bidipres}[3][0pt]%
\newcommand{\hgradrule}[1][]% Pick up first optional argument: [<stripes>].
{%
  \let\firstgradprogression@bidipres=\rulefirstgradprogression%  Use progression parameter for rules.
  \ifthenelse{\equal{#1}{}}%                               First optional argument given?
  {\setcounter{stripes@bidipres}{\rulestripes}}%                 No; use default value.
  {\setcounter{stripes@bidipres}{#1}}%                           Yes.
  \hgradrule@bidipres%                                           Pick up [<startmodel>]{<startcolor>}.
}

\newcommand{\hgradrule@bidipres}[2][]% Pick up next pair of arguments: [<startmodel>]{<startcolor>}.
{%
  \ifthenelse{\equal{#1}{}}
  {\replacecolor{startcolor@bidipres}{#2}}
  {\definecolor{startcolor@bidipres}{#1}{#2}}%
  \@hgradrule@bidipres
}

\newcommand{\@hgradrule@bidipres}[2][]
{%
  \ifthenelse{\equal{#1}{}}
  {\replacecolor{endcolor@bidipres}{#2}}
  {\definecolor{endcolor@bidipres}{#1}{#2}}%
  \@@hgradrule@bidipres%                         Pick up rule arguments and proceed.
}

\newcommand{\vstripe@bidipres}[4]%              Helper command for making _one_ stripe. Can be overladed for making historams.
{{\setcolor@bidipres{stripecolor@bidipres}\rule{#2}{#3}#4}}

\newcommand{\@@hgradrule@bidipres}[3][0pt]%      Main part of \hgradrule.
{%
  \ifthenelse{\value{stripes@bidipres}<2}%       A `pathological case' which can happen in animations: If 0 or 1 stripes are
                                   %       requested, a division by zero error would be produced by the gradient code.
  {\mbox{{\setcolor@bidipres{startcolor@bidipres}\rule[#1]{#2}{#3}}}}% In this case, just produce a colored rule.
  {%
    \raisebox{#1}%                         Evaluate the <raise> argument of the rule.
    {%
      \setcounter{stripe@bidipres}{0}%           Initialize the number of the current stripe.
      \whiledo{\value{stripe@bidipres}<\value{stripes@bidipres}}
      {%
        \mkgradfirstfactor@bidipres{\tmp@bidipres}%    Make the weight for \colorbetween, based on the number of the current stripe
        {\value{stripe@bidipres}/(\value{stripes@bidipres}-1)}% and the first gradient progression.
        \colorbetween[\tmp@bidipres]{stripecolor@bidipres}{endcolor@bidipres}{startcolor@bidipres}% Calculate stripe color.
        \stepcounter{stripe@bidipres}%
        \ifthenelse{\value{stripe@bidipres}=\value{stripes@bidipres}}%     Last stripe?
        {\vstripe@bidipres{\tmp@bidipres}{(#2)/\value{stripes@bidipres}}{#3}{}}% Yes; make stripe w/o overlap.
        {%                                                     No; add a kern to make stripes overlap.
          \vstripe@bidipres{\tmp@bidipres}{(#2)/\value{stripes@bidipres}+\stripeoverlap}{#3}{\kern-\stripeoverlap}%
          }%
        }% matches \whiledo{\value{stripe@bidipres}<\value{stripes@bidipres}}{%
      }% matches \raisebox{#1}{%
    }% matches second argument of \ifthenelse{\value{stripes@bidipres}<2}%
  }% matches \newcommand{\@@hgradrule@bidipres}[3][0pt]{%

\newcommand{\dblhgradrule}[1][]% Pick up first optional argument: [<midpoint>].
{%
  \let\firstgradprogression@bidipres=\rulefirstgradprogression%  Use progression parameters for rules.
  \let\secondgradprogression@bidipres=\rulesecondgradprogression
  \ifthenelse{\equal{#1}{}}{\let\gradmidpoint@bidipres=\rulegradmidpoint}{\def\gradmidpoint@bidipres{#1}}%
  \dblhgradrule@bidipres
}

\newcommand{\dblhgradrule@bidipres}[1][]% Pick up second optional argument: [<stripes>].
{%
  \ifthenelse{\equal{#1}{}}{\setcounter{stripes@bidipres}{\rulestripes}}{\setcounter{stripes@bidipres}{#1}}%
  \@dblhgradrule@bidipres
}

\newcommand{\@dblhgradrule@bidipres}[2][]% Pick up next pair of arguments: [<startmodel>]{<startcolor>}.
{%
  \ifthenelse{\equal{#1}{}}{\replacecolor{startcolor@bidipres}{#2}}{\definecolor{startcolor@bidipres}{#1}{#2}}%
  \@@dblhgradrule@bidipres
}

\newcommand{\@@dblhgradrule@bidipres}[2][]
{%
  \ifthenelse{\equal{#1}{}}{\replacecolor{midcolor@bidipres}{#2}}{\definecolor{midcolor@bidipres}{#1}{#2}}%
  \@@@dblhgradrule@bidipres
}

\newcommand{\@@@dblhgradrule@bidipres}[2][]
{%
  \ifthenelse{\equal{#1}{}}
  {\replacecolor{endcolor@bidipres}{#2}}
  {\definecolor{endcolor@bidipres}{#1}{#2}}%
  \@@@@dblhgradrule@bidipres%                         Pick up rule arguments and proceed.
}

\newcommand{\@@@@dblhgradrule@bidipres}[3][0pt]%             Main part of \dblhgradrule.
{%
  \ifthenelse{\value{stripes@bidipres}<2}%                   The gradient code is not equipped for making less than 2 stripes.
  {\mbox{{\setcolor@bidipres{midcolor@bidipres}\rule[#1]{#2}{#3}}}}% In this case, just produce a rule colored with the middle color.
  {%
    \raisebox{#1}%                                     Evaluate the <raise> argument of the rule.
    {%
      \setcounter{stripe@bidipres}{0}%                       Initialize the number of the current stripe.
      \setcounter{tmpcnta@bidipres}%                          Number of the `middle' stripe.
      {\value{stripes@bidipres}*\real{\gradmidpoint@bidipres}}%
      \whiledo{\value{stripe@bidipres}<\value{tmpcnta@bidipres}}%   Produce the left part of the gradient.
      {%
        \mkgradfirstfactor@bidipres{\tmp@bidipres}%                 Make the weight for \colorbetween, based on the number of the
        {\value{stripe@bidipres}/\value{tmpcnta@bidipres}}%         current stripe and the first gradient progression.
        \colorbetween[\tmp@bidipres]{stripecolor@bidipres}{midcolor@bidipres}{startcolor@bidipres}% Calculate stripe color.
        \vstripe@bidipres{\tmp@bidipres}%                                               Make stripe with overlap.
        {(#2)/\value{stripes@bidipres}+\stripeoverlap}{#3}{\kern-\stripeoverlap}% This is the left part, remember?
        \stepcounter{stripe@bidipres}%
        }%
      \stepcounter{tmpcnta@bidipres}%
      \ifthenelse{\value{stripes@bidipres}=\value{tmpcnta@bidipres}}% Only one stripe left to produce?
      {\vstripe@bidipres{1}{(#2)/\value{stripes@bidipres}}{#3}{}}%    Just produce one stripe colored with the end color.
      {%
        \whiledo{\value{stripe@bidipres}<\value{stripes@bidipres}}%   Produce the right part of the gradient.
        {%
          \mkgradsecondfactor@bidipres{\tmp@bidipres}%                Make the weight for \colorbetween.
          {(\value{stripe@bidipres}-\value{tmpcnta@bidipres})/(\value{stripes@bidipres}-\value{tmpcnta@bidipres}-1)}%
          \colorbetween[\tmp@bidipres]{stripecolor@bidipres}{endcolor@bidipres}{midcolor@bidipres}% Calculate stripe color.
          \stepcounter{stripe@bidipres}%
          \ifthenelse{\value{stripe@bidipres}=\value{stripes@bidipres}}%     Last stripe?
          {\vstripe@bidipres{\tmp@bidipres}{(#2)/\value{stripes@bidipres}}{#3}{}}% Yes; make stripe w/o overlap.
          {%                                                     Add kern to make stripes overlap.
            \vstripe@bidipres{\tmp@bidipres}{(#2)/\value{stripes@bidipres}+\stripeoverlap}{#3}{\kern-\stripeoverlap}%
            }%
          }% matches \whiledo{\value{stripe@bidipres}<\value{stripes@bidipres}}{%
        }% matches second argument of \ifthenelse{\value{stripes@bidipres}=\value{tmpcnta@bidipres}}%
      }% matches \raisebox{#1}{%
    }% matches second argument of \ifthenelse{\value{stripes@bidipres}<2}%
  }% matches \newcommand{\@@@@dblhgradrule@bidipres}[3][0pt]{%


\providecommand{\clipbox}[2][\z@]{\leavevmode\hbox{#2}}

\newcommand{\dgradslope}{1,1}

\newcounter{dgradhslope@bidipres}

\newcounter{dgradvslope@bidipres}

\def\setdgradslope(#1,#2){\setcounter{dgradhslope@bidipres}{#1}\setcounter{dgradvslope@bidipres}{#2}}
\newcommand{\dgradrule}[1][]
{%
  \ifthenelse{\equal{#1}{}}{\expandafter\setdgradslope\expandafter(\dgradslope)}{\setdgradslope(#1)}%
  \dgradrule@bidipres
}

\newcommand{\dgradrule@bidipres}[2][]
{%
  \ifthenelse{\equal{#1}{}}{\replacecolor{startcolor@bidipres}{#2}}{\definecolor{startcolor@bidipres}{#1}{#2}}%
  \@dgradrule@bidipres
}

\newcommand{\@dgradrule@bidipres}[2][]
{%
  \ifthenelse{\equal{#1}{}}{\replacecolor{endcolor@bidipres}{#2}}{\definecolor{endcolor@bidipres}{#1}{#2}}%
  \@@dgradrule@bidipres
}

\newcommand{\dstripewd@bidipres}{.7pt}

\newcommand{\@@dgradrule@bidipres}[3][0pt]
{%
  \raisebox{#1}
  {%
    \thicklines
    \setcounter{stripe@bidipres}{0}%
    \setcounter{tmpcnta@bidipres}{1*\ratio{#3}{\dstripewd@bidipres}}%
    \setcounter{stripes@bidipres}{1*\ratio{#3}{\dstripewd@bidipres}+1*\ratio{#2}{\dstripewd@bidipres}}%
    \@xarg\c@dgradhslope@bidipres\@yarg\c@dgradvslope@bidipres
    \makebox[\dstripewd@bidipres]
    {%
      \whiledo{\value{stripe@bidipres}<\value{tmpcnta@bidipres}}
      {%
        \mkfactor{\tmp@bidipres}{\value{stripe@bidipres}/(\value{stripes@bidipres}-1)}%
        \colorbetween[\tmp@bidipres]{stripecolor@bidipres}{endcolor@bidipres}{startcolor@bidipres}%
        \setlength{\@linelen}{\dstripewd@bidipres*\value{stripe@bidipres}}%
        \raisebox{\dstripewd@bidipres*(\value{tmpcnta@bidipres}-\value{stripe@bidipres})}
        {\makebox[0pt]{{\setcolor@bidipres{stripecolor@bidipres}\hbox to 0pt{\@sline\hss}}}}%
        \stepcounter{stripe@bidipres}%
        }%
      }%
    \whiledo{\value{stripe@bidipres}<\value{stripes@bidipres}}
    {%
      \mkfactor{\tmp@bidipres}{\value{stripe@bidipres}/(\value{stripes@bidipres}-1)}%
      \colorbetween[\tmp@bidipres]{stripecolor@bidipres}{endcolor@bidipres}{startcolor@bidipres}%
      \makebox[\dstripewd@bidipres]{{\setcolor@bidipres{stripecolor@bidipres}.}}%
      \stepcounter{stripe@bidipres}%
      }%
    }%
  }%
\newcommand{\vgradbox}[1][]% Pick up first optional argument: [<stripes>].
{%
  \let\firstgradprogression@bidipres=\rulefirstgradprogression%  Use progression parameter for rules.
  \ifthenelse{\equal{#1}{}}%                               First optional argument given?
  {\setcounter{stripes@bidipres}{\rulestripes}}%                 No; use default value.
  {\setcounter{stripes@bidipres}{#1}}%                           Yes.
  \vgradbox@bidipres%                                            Pick up remaining optional arguments.
}

\newcommand{\vgradbox@bidipres}[2][]
{%
  \ifthenelse{\equal{#1}{}}{\replacecolor{startcolor@bidipres}{#2}}{\definecolor{startcolor@bidipres}{#1}{#2}}%
  \@vgradbox@bidipres
}

\newcommand{\@vgradbox@bidipres}[2][]
{%
  \ifthenelse{\equal{#1}{}}{\replacecolor{endcolor@bidipres}{#2}}{\definecolor{endcolor@bidipres}{#1}{#2}}%
  \@@gradbox@bidipres\@@vgradrule@bidipres%                    Make a generic background box with vertical gradient background.
}

\newcommand{\@@gradbox@bidipres}[2]%                     Generic background box.
{%
  \leavevmode%                                     Make box behave like \mbox.
  \setbox\tempbox@bidipres
  \hbox{\kern\fboxsep{\set@color#2}\kern\fboxsep}% An \hbox containing <contents> plus additional white space.
  \rlap%                                           Underlay box background with rule command passed as #1.
  {%
    #1[-\fboxsep-\dp\tempbox@bidipres]%                  Box depth augmented by `white' space.
    {\wd\tempbox@bidipres}%                              Space on the sides has already been added.
    {\ht\tempbox@bidipres+\dp\tempbox@bidipres+2\fboxsep}}%    Total height.
  \box\tempbox@bidipres%                                 Overlay box contents.
  }%
\newcommand{\hgradbox}[1][]
{%
  \let\secondgradprogression@bidipres=\rulesecondgradprogression
  \ifthenelse{\equal{#1}{}}{\setcounter{stripes@bidipres}{\rulestripes}}{\setcounter{stripes@bidipres}{#1}}%
  \hgradbox@bidipres
}

\newcommand{\hgradbox@bidipres}[2][]
{%
  \ifthenelse{\equal{#1}{}}{\replacecolor{startcolor@bidipres}{#2}}{\definecolor{startcolor@bidipres}{#1}{#2}}%
  \@hgradbox@bidipres
}

\newcommand{\@hgradbox@bidipres}[2][]
{%
  \ifthenelse{\equal{#1}{}}{\replacecolor{endcolor@bidipres}{#2}}{\definecolor{endcolor@bidipres}{#1}{#2}}%
  \@@gradbox@bidipres\@@hgradrule@bidipres
}
\newcommand{\dblvgradbox}[1][]
{%
  \let\firstgradprogression@bidipres=\rulefirstgradprogression%  Use progression parameters for rules.
  \let\secondgradprogression@bidipres=\rulesecondgradprogression
  \ifthenelse{\equal{#1}{}}{\let\gradmidpoint@bidipres=\rulegradmidpoint}{\def\gradmidpoint@bidipres{#1}}%
  \dblvgradbox@bidipres
}

\newcommand{\dblvgradbox@bidipres}[1][]
{%
  \ifthenelse{\equal{#1}{}}{\setcounter{stripes@bidipres}{\rulestripes}}{\setcounter{stripes@bidipres}{#1}}%
  \@dblvgradbox@bidipres
}

\newcommand{\@dblvgradbox@bidipres}[2][]
{%
  \ifthenelse{\equal{#1}{}}{\replacecolor{startcolor@bidipres}{#2}}{\definecolor{startcolor@bidipres}{#1}{#2}}%
  \@@dblvgradbox@bidipres
}

\newcommand{\@@dblvgradbox@bidipres}[2][]
{%
  \ifthenelse{\equal{#1}{}}{\replacecolor{midcolor@bidipres}{#2}}{\definecolor{midcolor@bidipres}{#1}{#2}}%
  \@@@dblvgradbox@bidipres
}

\newcommand{\@@@dblvgradbox@bidipres}[2][]
{%
  \ifthenelse{\equal{#1}{}}{\replacecolor{endcolor@bidipres}{#2}}{\definecolor{endcolor@bidipres}{#1}{#2}}%
  \@@gradbox@bidipres\@@@@dblvgradrule@bidipres
}
\newcommand{\dblhgradbox}[1][]
{%
  \let\firstgradprogression@bidipres=\rulefirstgradprogression
  \let\secondgradprogression@bidipres=\rulesecondgradprogression
  \ifthenelse{\equal{#1}{}}{\let\gradmidpoint@bidipres=\rulegradmidpoint}{\def\gradmidpoint@bidipres{#1}}%
  \dblhgradbox@bidipres
}

\newcommand{\dblhgradbox@bidipres}[1][]
{%
  \ifthenelse{\equal{#1}{}}{\setcounter{stripes@bidipres}{\rulestripes}}{\setcounter{stripes@bidipres}{#1}}%
  \@dblhgradbox@bidipres
}

\newcommand{\@dblhgradbox@bidipres}[2][]
{%
  \ifthenelse{\equal{#1}{}}{\replacecolor{startcolor@bidipres}{#2}}{\definecolor{startcolor@bidipres}{#1}{#2}}%
  \@@dblhgradbox@bidipres
}

\newcommand{\@@dblhgradbox@bidipres}[2][]
{%
  \ifthenelse{\equal{#1}{}}{\replacecolor{midcolor@bidipres}{#2}}{\definecolor{midcolor@bidipres}{#1}{#2}}%
  \@@@dblhgradbox@bidipres
}

\newcommand{\@@@dblhgradbox@bidipres}[2][]
{%
  \ifthenelse{\equal{#1}{}}{\replacecolor{endcolor@bidipres}{#2}}{\definecolor{endcolor@bidipres}{#1}{#2}}%
  \@@gradbox@bidipres\@@@@dblhgradrule@bidipres
}
\newcommand{\backgroundstyle}[2][]
{%
  \replacecolor{startcolor@bidipres}{bgndstartcolor}%                           Initialize the internal counterparts
  \replacecolor{midcolor@bidipres}{bgndmidcolor}%                               of parameters to their default values.
  \replacecolor{endcolor@bidipres}{bgndendcolor}%
  \replacecolor{bgndtoppanelcolor@bidipres}{toppanelcolor}%
  \replacecolor{bgndbottompanelcolor@bidipres}{bottompanelcolor}%
  \replacecolor{bgndleftpanelcolor@bidipres}{leftpanelcolor}%
  \replacecolor{bgndrightpanelcolor@bidipres}{rightpanelcolor}%
  \let\firstgradprogression@bidipres=\bgndfirstgradprogression
  \let\secondgradprogression@bidipres=\bgndsecondgradprogression%
  \setcounter{stripes@bidipres}{\bgndstripes}%
  \let\gradmidpoint@bidipres=\bgndgradmidpoint
  \let\bgndtoppanelheight@bidipres=\empty%                 The panel dimensions depend on other parameters. If they are not
  \let\bgndbottompanelheight@bidipres=\empty%              set directly, defaults are calculated after setting keyval
  \let\bgndleftpanelwidth@bidipres=\empty%                 parameters.
  \let\bgndrightpanelwidth@bidipres=\empty
  \let\hpanelsvalue@bidipres=\empty
  \setboolean{autopanels@bidipres}{true}%
  \csname set#2bgnd@bidipres\endcsname{#1}%                Execute the style-specific command which defines the background box.
  }
\newcommand{\bgndstripes}{10}
\newcommand{\bgndgradmidpoint}{.5}
\newcommand{\bgndfirstgradprogression}{1}
\newcommand{\bgndsecondgradprogression}{1}
\newcommand{\bgndtoppanelheight}{0pt}

\newcommand{\bgndbottompanelheight}{0pt}

\newcommand{\bgndleftpanelwidth}{0pt}

\newcommand{\bgndrightpanelwidth}{0pt}
\newcommand{\bgndtoppanelheight@bidipres}{0pt}

\newcommand{\bgndtoppanelwidth@bidipres}{0pt}

\newcommand{\bgndbottompanelheight@bidipres}{0pt}

\newcommand{\bgndbottompanelwidth@bidipres}{0pt}

\newcommand{\bgndleftpanelheight@bidipres}{0pt}

\newcommand{\bgndleftpanelwidth@bidipres}{0pt}

\newcommand{\bgndrightpanelheight@bidipres}{0pt}

\newcommand{\bgndrightpanelwidth@bidipres}{0pt}

\newboolean{hpanels@bidipres}

\newboolean{autopanels@bidipres}
\define@key{bgnd@bidipres}{stripes}{\setcounter{stripes@bidipres}{#1}}

\define@key{bgnd@bidipres}{startcolor}{\replacecolor{startcolor@bidipres}{#1}}

\define@key{bgnd@bidipres}{startcolordef}{\definecolor{startcolor@bidipres}#1}

\define@key{bgnd@bidipres}{midcolor}{\replacecolor{midcolor@bidipres}{#1}}

\define@key{bgnd@bidipres}{midcolordef}{\definecolor{midcolor@bidipres}#1}

\define@key{bgnd@bidipres}{endcolor}{\replacecolor{endcolor@bidipres}{#1}}

\define@key{bgnd@bidipres}{endcolordef}{\definecolor{endcolor@bidipres}#1}

\define@key{bgnd@bidipres}{gradmidpoint}{\edef\gradmidpoint@bidipres{#1}}

\define@key{bgnd@bidipres}{firstgradprogression}{\def\firstgradprogression@bidipres{#1}}

\define@key{bgnd@bidipres}{secondgradprogression}{\def\secondgradprogression@bidipres{#1}}

\define@key{bgnd@bidipres}{hpanels}[true]{\def\hpanelsvalue@bidipres{#1}}

\define@key{bgnd@bidipres}{autopanels}[true]{\setboolean{autopanels@bidipres}{#1}}

\define@key{bgnd@bidipres}{toppanelcolor}{\replacecolor{bgndtoppanelcolor@bidipres}{#1}}

\define@key{bgnd@bidipres}{toppanelcolordef}{\definecolor{bgndtoppanelcolor@bidipres}#1}

\define@key{bgnd@bidipres}{bottompanelcolor}{\replacecolor{bgndbottompanelcolor@bidipres}{#1}}

\define@key{bgnd@bidipres}{bottompanelcolordef}{\definecolor{bgndbottompanelcolor@bidipres}#1}

\define@key{bgnd@bidipres}{leftpanelcolor}{\replacecolor{bgndleftpanelcolor@bidipres}{#1}}

\define@key{bgnd@bidipres}{leftpanelcolordef}{\definecolor{bgndleftpanelcolor@bidipres}#1}

\define@key{bgnd@bidipres}{rightpanelcolor}{\replacecolor{bgndrightpanelcolor@bidipres}{#1}}

\define@key{bgnd@bidipres}{rightpanelcolordef}{\definecolor{bgndrightpanelcolor@bidipres}#1}

\define@key{bgnd@bidipres}{toppanelheight}{\mklength@bidipres{\bgndtoppanelheight@bidipres}{#1}}

\define@key{bgnd@bidipres}{bottompanelheight}{\mklength@bidipres{\bgndbottompanelheight@bidipres}{#1}}

\define@key{bgnd@bidipres}{leftpanelwidth}{\mklength@bidipres{\bgndleftpanelwidth@bidipres}{#1}}

\define@key{bgnd@bidipres}{rightpanelwidth}{\mklength@bidipres{\bgndrightpanelwidth@bidipres}{#1}}
\newbox\bgndbox@bidipres
\setbox\bgndbox@bidipres\null% Default: Empty.
\newcommand{\mkpanels@bidipres}[1]%
{%
  \ifthenelse{\boolean{hpanels@bidipres}}%                                    `horizontal' panels?
  {% Yes. Vertically align top panel, center area with left and right panels, and bottom panel.
    \vbox%                                                              A vbox with \offinterlineskip allows to align the
    {%                                                                  horizontal panels with the `background center'.
      \offinterlineskip
      \ifthenelse{\lengthtest{\bgndtoppanelheight@bidipres=0pt}}%             Should top panel be created?
      {}% No.
      {%
        \hbox{{%
            \setcolor@bidipres{bgndtoppanelcolor@bidipres}%
            \rule{\bgndtoppanelwidth@bidipres}{\bgndtoppanelheight@bidipres}%       Make horizontal colored area.
            }}%
        }%
      \hbox%                                                            Make `background center'.
      {%
        \ifthenelse{\lengthtest{\bgndleftpanelwidth@bidipres=0pt}}%           Should left panel be created?
        {}% No.
        {{%
            \setcolor@bidipres{bgndleftpanelcolor@bidipres}%
            \rule{\bgndleftpanelwidth@bidipres}{\bgndleftpanelheight@bidipres}%     Make vertical colored area.
            }}%
        #1%                                                             Make main background object.
        {\bgndtoppanelwidth@bidipres-\bgndleftpanelwidth@bidipres-\bgndrightpanelwidth@bidipres}% Calculate remaining space in the center.
        {\bgndleftpanelheight@bidipres}%
        \ifthenelse{\lengthtest{\bgndrightpanelwidth@bidipres=0pt}}%          Should right panel be created?
        {}% No.
        {{%
            \setcolor@bidipres{bgndrightpanelcolor@bidipres}%
            \rule{\bgndrightpanelwidth@bidipres}{\bgndrightpanelheight@bidipres}%   Make vertical colored area.
            }}%
        }% matches \hbox{%
      \ifthenelse{\lengthtest{\bgndbottompanelheight@bidipres=0pt}}%          Should bottom panel be created?
      {}% No.
      {%
        \hbox
        {{%
            \setcolor@bidipres{bgndbottompanelcolor@bidipres}%
            \rule{\bgndbottompanelwidth@bidipres}{\bgndbottompanelheight@bidipres}% Make horizontal colored area.
            }}%
        }%
      }% matches \vbox{%
    }% matches \ifthenelse{\boolean{hpanels@bidipres}}{%
  {% No. Horizontally align left panel, center area with top and bottom panels, and right panel.
    \ifthenelse{\lengthtest{\bgndleftpanelwidth@bidipres=0pt}}%               Should left panel be created?
    {}% No.
    {{%
        \setcolor@bidipres{bgndleftpanelcolor@bidipres}%
        \rule{\bgndleftpanelwidth@bidipres}{\bgndleftpanelheight@bidipres}%         Make vertical colored area.
        }}%
    \vbox%                                                              A vbox with \offinterlineskip allows to align
    {%                                                                  the horizontal panels with the center object.
      \offinterlineskip
      \ifthenelse{\lengthtest{\bgndtoppanelheight@bidipres=0pt}}%             Should top panel be created?
      {}% No.
      {%
        \hbox%
        {{%
            \setcolor@bidipres{bgndtoppanelcolor@bidipres}%
            \rule{\bgndtoppanelwidth@bidipres}{\bgndtoppanelheight@bidipres}%       Make horizontal colored area.
            }}%
        }%
      \hbox%                                                            Make main background object.
      {%
        #1%
        {\bgndtoppanelwidth@bidipres}%
        {\bgndleftpanelheight@bidipres-\bgndtoppanelheight@bidipres-\bgndbottompanelheight@bidipres}% Calculate space in the center.
        }%
      \ifthenelse{\lengthtest{\bgndbottompanelheight@bidipres=0pt}}%          Should bottom panel be created?
      {}% No.
      {%
        \hbox%
        {{%
            \setcolor@bidipres{bgndbottompanelcolor@bidipres}%
            \rule{\bgndbottompanelwidth@bidipres}{\bgndbottompanelheight@bidipres}% Make horizontal colored area.
            }}%
        }%
      }% matches \vbox{%
    \ifthenelse{\lengthtest{\bgndrightpanelwidth@bidipres=0pt}}%              Should right panel be created?
    {}% No.
    {{%
        \setcolor@bidipres{bgndrightpanelcolor@bidipres}%
        \rule{\bgndrightpanelwidth@bidipres}{\bgndrightpanelheight@bidipres}% Make vertical colored area.
        }}%
    }% matches second argument of \ifthenelse{\boolean{hpanels@bidipres}}
  }% matches \newcommand{\mkpanels@bidipres}[1]{%
\newcommand{\initpanels@bidipres}[1]%
{%
  \ifx\hpanelsvalue@bidipres\empty%                          Has the hpanels parameter been given?
    \setboolean{hpanels@bidipres}{#1}%                       No; use default.
   \else
    \setboolean{hpanels@bidipres}{\hpanelsvalue@bidipres}%         Yes; use parameter setting.
  \fi
  \ifthenelse{\boolean{hpanels@bidipres}}%                   `horizontal' panel direction?
  {% Yes. Horizontal panels are `outer', vertical panels are `inner'.
    \let\bgndtoppanelwidth@bidipres=\bidiprespagewidth%            Full width for horizontal panels.
    \let\bgndbottompanelwidth@bidipres=\bidiprespagewidth%
    \ifthenelse{\equal{\bgndtoppanelheight@bidipres}{}}%     Has the top panel height been set?
    {% No. Guess default.
      \ifx\toppanelcontents@bidipres\empty%                  Is the panel defined?
        \mklength@bidipres{\bgndtoppanelheight@bidipres}{\bgndtoppanelheight}% Use background-specific default.
       \else
        \ifthenelse{\boolean{autopanels@bidipres}}%          Calculate panel dimensions?
        {% Yes.
          \calcvdimen@bidipres{\bgndtoppanelheight@bidipres}{\bgndtoppanelwidth@bidipres}% Measure the height of panel contents.
          {\toppanelcontents@bidipres}%
          \let\toppanelheight=\bgndtoppanelheight@bidipres%  Overwrite panel settings.
          \let\toppanelwidth=\bgndtoppanelwidth@bidipres%
          \def\toppanelshift{0pt}%                     Top panel spans the whole upper screen.
          }
        {% No
          \mklength@bidipres{\bgndtoppanelheight@bidipres}{\toppanelheight}%   Use panel-specific default.
          }%
      \fi
      }% matches \ifthenelse{\equal{\bgndtoppanelheight@bidipres}{}}
    {% Yes.
      \let\toppanelheight=\bgndtoppanelheight@bidipres%      Overwrite panel settings  - use user-supplied value.
    }
    \ifthenelse{\equal{\bgndbottompanelheight@bidipres}{}}%         Has the bottom panel height been set?
    {% No. Guess default.
      \ifx\bottompanelcontents@bidipres\empty%                      Is the bottom panel defined?
        \mklength@bidipres{\bgndbottompanelheight@bidipres}{\bgndbottompanelheight}% Use background-specific default.
       \else
        \ifthenelse{\boolean{autopanels@bidipres}}%                 Calculate panel dimensions?
        {% Yes.
          \calcvdimen@bidipres{\bgndbottompanelheight@bidipres}{\bgndbottompanelwidth@bidipres}% Measure the height of panel contents.
          {\bottompanelcontents@bidipres}%
          \let\bottompanelheight=\bgndbottompanelheight@bidipres%   Overwrite panel settings.
          \let\bottompanelwidth=\bgndbottompanelwidth@bidipres%
          \def\bottompanelshift{0pt}%                         Bottom panel spans the whole upper screen.
          }
        {% No
          \mklength@bidipres{\bgndbottompanelheight@bidipres}{\bottompanelheight}%   Use panel-specific default.
          }%
      \fi
      }% matches \ifthenelse{\equal{\bgndbottompanelheight@bidipres}{}}
    {% Yes.
      \let\bottompanelheight=\bgndbottompanelheight@bidipres%   Overwrite panel settings - use user-supplied value.
    }
    \mklength@bidipres{\bgndleftpanelheight@bidipres}%                Calculate remaining space in the center.
    {\bidiprespageheight-\bgndtoppanelheight@bidipres-\bgndbottompanelheight@bidipres}%
    \let\bgndrightpanelheight@bidipres=\bgndleftpanelheight@bidipres% Height of left and right panels is equal.
    \ifthenelse{\equal{\bgndleftpanelwidth@bidipres}{}}%        Has the left panel width been set?
    {% No. Guess default.
      \ifx\leftpanelcontents@bidipres\empty%                    Is the panel defined?
        \mklength@bidipres{\bgndleftpanelwidth@bidipres}{\bgndleftpanelwidth}% Use background-specific default.
       \else
        \ifthenelse{\boolean{autopanels@bidipres}}%             Calculate panel dimensions?
        {% Yes.
          \calchdimen@bidipres{\bgndleftpanelwidth@bidipres}{\bgndleftpanelheight@bidipres}% Measure the `optimal' width of panel contents.
          {\leftpanelcontents@bidipres}%
          \let\leftpanelheight=\bgndleftpanelheight@bidipres%   Overwrite panel settings.
          \let\leftpanelwidth=\bgndleftpanelwidth@bidipres%
          \let\leftpanelraise=\bgndbottompanelheight@bidipres%  Left panel is raised above bottom panel.
          }
        {% No
          \mklength@bidipres{\bgndleftpanelwidth@bidipres}{\leftpanelwidth}%   Use panel-specific default.
          }%
      \fi
      }% matches \ifthenelse{\equal{\bgndleftpanelwidth@bidipres}{}}
    {% Yes.
      \let\leftpanelwidth=\bgndleftpanelwidth@bidipres%         Overwrite panel settings - use user-supplied value.
    }
    \ifthenelse{\equal{\bgndrightpanelwidth@bidipres}{}}%       Has the right panel width been set?
    {% No. Guess default.
      \ifx\rightpanelcontents@bidipres\empty%                   Is the panel defined?
        \mklength@bidipres{\bgndrightpanelwidth@bidipres}{\bgndrightpanelwidth}% Use background-specific default.
       \else
        \ifthenelse{\boolean{autopanels@bidipres}}%             Calculate panel dimensions?
        {% Yes.
          \calchdimen@bidipres{\bgndrightpanelwidth@bidipres}{\bgndrightpanelheight@bidipres}% Measure `optimal' width of panel contents.
          {\rightpanelcontents@bidipres}%
          \let\rightpanelheight=\bgndrightpanelheight@bidipres% Overwrite panel settings.
          \let\rightpanelwidth=\bgndrightpanelwidth@bidipres%
          \let\rightpanelraise=\bgndbottompanelheight@bidipres% Right panel is raised above bottom panel.
          }
        {% No
          \mklength@bidipres{\bgndrightpanelwidth@bidipres}{\rightpanelwidth}%   Use panel-specific default.
          }%
      \fi
      }% matches \ifthenelse{\equal{\bgndrightpanelwidth@bidipres}{}}
    {% Yes.
      \let\rightpanelwidth=\bgndrightpanelwidth@bidipres%       Overwrite panel settings - use user-supplied value.
    }
    }% matches \ifthenelse{\boolean{hpanels@bidipres}}
  {% No. Vertical panels are `outer', horizontal panels are `inner'.
    \let\bgndleftpanelheight@bidipres=\bidiprespageheight%          Full height for vertical panels.
    \let\bgndrightpanelheight@bidipres=\bidiprespageheight%
    \ifthenelse{\equal{\bgndleftpanelwidth@bidipres}{}}%      Has the left panel width been set?
    {% No. Guess default.
      \ifx\leftpanelcontents@bidipres\empty%                  Is the panel defined?
        \mklength@bidipres{\bgndleftpanelwidth@bidipres}{\bgndleftpanelwidth}% Use background-specific default.
       \else
        \ifthenelse{\boolean{autopanels@bidipres}}%           Calculate panel dimensions?
        {% Yes.
          \calchdimen@bidipres{\bgndleftpanelwidth@bidipres}{\bgndleftpanelheight@bidipres}% Measure the `optimal' width of panel contents.
          {\leftpanelcontents@bidipres}%
          \let\leftpanelheight=\bgndleftpanelheight@bidipres% Overwrite panel settings.
          \let\leftpanelwidth=\bgndleftpanelwidth@bidipres%
          \def\leftpanelraise{0pt}%                     Left panel spans the whole left part of the screen.
          }
        {% No
          \mklength@bidipres{\bgndleftpanelwidth@bidipres}{\leftpanelwidth}%   Use panel-specific default.
          }%
      \fi
      }% matches \ifthenelse{\equal{\bgndleftpanelwidth@bidipres}{}}
    {% Yes.
      \let\leftpanelwidth=\bgndleftpanelwidth@bidipres%       Overwrite panel settings - use user-supplied value.
    }
    \ifthenelse{\equal{\bgndrightpanelwidth@bidipres}{}}%       Has the right panel width been set?
    {% No. Guess default.
      \ifx\rightpanelcontents@bidipres\empty%                   Is the panel defined?
        \mklength@bidipres{\bgndrightpanelwidth@bidipres}{\bgndrightpanelwidth}% Use background-specific default.
       \else
        \ifthenelse{\boolean{autopanels@bidipres}}%             Calculate panel dimensions?
        {% Yes.
          \calchdimen@bidipres{\bgndrightpanelwidth@bidipres}{\bgndrightpanelheight@bidipres}% Measure `optimal' width of panel contents.
          {\rightpanelcontents@bidipres}%
          \let\rightpanelheight=\bgndrightpanelheight@bidipres% Overwrite panel settings.
          \let\rightpanelwidth=\bgndrightpanelwidth@bidipres%
          \def\rightpanelraise{0pt}%                      Right panel spans the whole left part of the screen.
          }
        {% No
          \mklength@bidipres{\bgndrightpanelwidth@bidipres}{\rightpanelwidth}%   Use panel-specific default.
          }%
      \fi
      }% matches \ifthenelse{\equal{\bgndrightpanelwidth@bidipres}{}}
    {% Yes.
      \let\rightpanelwidth=\bgndrightpanelwidth@bidipres%       Overwrite panel settings - use user-supplied value.
    }
    \mklength@bidipres{\bgndtoppanelwidth@bidipres}%                Calculate remaining space in the center.
    {\bidiprespagewidth-\bgndleftpanelwidth@bidipres-\bgndrightpanelwidth@bidipres}%
    \let\bgndbottompanelwidth@bidipres=\bgndtoppanelwidth@bidipres% Width of top and bottom panels is equal.
    \ifthenelse{\equal{\bgndtoppanelheight@bidipres}{}}%      Has the top panel height been set?
    {% No. Guess default.
      \ifx\toppanelcontents@bidipres\empty%                   Is the panel defined?
        \mklength@bidipres{\bgndtoppanelheight@bidipres}{\bgndtoppanelheight}% Use background-specific default.
       \else
        \ifthenelse{\boolean{autopanels@bidipres}}%           Calculate panel dimensions?
        {% Yes.
          \calcvdimen@bidipres{\bgndtoppanelheight@bidipres}{\bgndtoppanelwidth@bidipres}% Measure the height of panel contents.
          {\toppanelcontents@bidipres}%
          \let\toppanelheight=\bgndtoppanelheight@bidipres%   Overwrite panel settings.
          \let\toppanelwidth=\bgndtoppanelwidth@bidipres%
          \let\toppanelshift=\bgndleftpanelwidth@bidipres%    Shift top panel to the right of left panel.
          }
        {% No
          \mklength@bidipres{\bgndtoppanelheight@bidipres}{\toppanelheight}%   Use panel-specific default.
          }%
      \fi
      }% matches \ifthenelse{\equal{\bgndtoppanelheight@bidipres}{}}
    {% Yes.
      \let\toppanelheight=\bgndtoppanelheight@bidipres%       Overwrite panel settings - use user-supplied value.
    }
    \ifthenelse{\equal{\bgndbottompanelheight@bidipres}{}}%       Has the bottom panel height been set?
    {% No. Guess default.
      \ifx\bottompanelcontents@bidipres\empty%                    Is the panel defined?
        \mklength@bidipres{\bgndbottompanelheight@bidipres}{\bgndbottompanelheight}% Use background-specific default.
       \else
        \ifthenelse{\boolean{autopanels@bidipres}}%               Calculate panel dimensions?
        {% Yes.
          \calcvdimen@bidipres{\bgndbottompanelheight@bidipres}{\bgndbottompanelwidth@bidipres}% Measure the height of panel contents.
          {\bottompanelcontents@bidipres}%
          \let\bottompanelheight=\bgndbottompanelheight@bidipres% Overwrite panel settings.
          \let\bottompanelwidth=\bgndbottompanelwidth@bidipres%
          \let\bottompanelshift=\bgndleftpanelwidth@bidipres%     Shift bottom panel to the right of left panel.
          }
        {% No
          \mklength@bidipres{\bgndbottompanelheight@bidipres}{\bottompanelheight}%   Use panel-specific default.
          }%
      \fi
      }% matches \ifthenelse{\equal{\bgndbottompanelheight@bidipres}{}}
    {% Yes.
      \let\bottompanelheight=\bgndbottompanelheight@bidipres%     Overwrite panel settings - use user-supplied value.
    }
    }% matches second argument of \ifthenelse{\boolean{hpanels@bidipres}}
  }% matches \newcommand{\initpanels@bidipres}[1]{
\newcommand{\phantomrule@bidipres}[2]{\rule{0pt}{#2}\rule{#1}{0pt}}
\newcommand{\setnonebgnd@bidipres}[1]%              Implementation of the background style ``none''.
{\global\setbox\bgndbox@bidipres=\null}%            Just produce an empty box.

\newcommand{\setplainbgnd@bidipres}[1]%             Implementation of the background style ``plain''.
{%
  \setkeys{bgnd@bidipres}{#1}%                      Evaluate parameters.
  \initpanels@bidipres{true}%                       Initialize panel parameters.
  \global\setbox\bgndbox@bidipres=\hbox{\mkpanels@bidipres{\phantomrule@bidipres}}% Make panels only.
  }%

\newcommand{\setvgradientbgnd@bidipres}[1]%         Implementation of the background style ``vgradient''.
{%
  \setkeys{bgnd@bidipres}{#1}%                      Evaluate parameters.
  \initpanels@bidipres{false}%                      Initialize panel parameters.
  \global\setbox\bgndbox@bidipres=\hbox{\mkpanels@bidipres{\@@vgradrule@bidipres}}% Make background box.
  }

\newcommand{\sethgradientbgnd@bidipres}[1]%         Implementation of the background style ``hgradient''.
{%
  \setkeys{bgnd@bidipres}{#1}%                      Evaluate parameters.
  \initpanels@bidipres{true}%                       Initialize panel parameters.
  \global\setbox\bgndbox@bidipres=\hbox{\mkpanels@bidipres{\@@hgradrule@bidipres}}% Make background box.
  }

\newcommand{\setdoublevgradientbgnd@bidipres}[1]%   Implementation of the background style ``doublevgradient''.
{%
  \setkeys{bgnd@bidipres}{#1}%                      Evaluate parameters.
  \initpanels@bidipres{false}%                      Initialize panel parameters.
  \global\setbox\bgndbox@bidipres=\hbox{\mkpanels@bidipres{\@@@@dblvgradrule@bidipres}}% Make background box.
  }

\newcommand{\setdoublehgradientbgnd@bidipres}[1]%   Implementation of the background style ``doublehgradient''.
{%
  \setkeys{bgnd@bidipres}{#1}%                      Evaluate parameters.
  \initpanels@bidipres{true}%                       Initialize panel parameters.
  \global\setbox\bgndbox@bidipres=\hbox{\mkpanels@bidipres{\@@@@dblhgradrule@bidipres}}% Make background box.
  }
\providecommand{\hpagecolor}[2][]
{%
  \ifthenelse{\equal{#1}{}}
  {\colorbetween{ppendcolor}{#2}{white}\backgroundstyle[startcolor=#2,endcolor=ppendcolor]{hgradient}}
  {\backgroundstyle[startcolor=#1,endcolor=#2]{hgradient}}%
  }
\providecommand{\vpagecolor}[2][]
{%
  \ifthenelse{\equal{#1}{}}
  {\colorbetween{ppendcolor}{#2}{white}\backgroundstyle[startcolor=#2,endcolor=ppendcolor]{vgradient}}
  {\backgroundstyle[startcolor=#1,endcolor=#2]{vgradient}}%
  }
\mklength@bidipres{\panelmargin}{\fboxsep}
\newcommand{\toppanelwidth}{\bidiprespagewidth}%     Width.
\newcommand{\toppanelheight}{\bidiprespageheight/5}% Height.
\newcommand{\toppanelshift}{0pt}%              Space between left screen edge and left edge of top panel.
\newcommand{\bottompanelwidth}{\bidiprespagewidth}%     Width.
\newcommand{\bottompanelheight}{\bidiprespageheight/5}% Height.
\newcommand{\bottompanelshift}{0pt}%              Space between left screen edge and left edge of bottom panel.
\newcommand{\leftpanelwidth}{\bidiprespagewidth/5}% Width.
\newcommand{\leftpanelheight}{\bidiprespageheight}% Height.
\newcommand{\leftpanelraise}{0pt}%            Space between bottom screen edge and bottom edge of left panel.
\newcommand{\rightpanelwidth}{\bidiprespagewidth/5}% Width.
\newcommand{\rightpanelheight}{\bidiprespageheight}% Height.
\newcommand{\rightpanelraise}{0pt}%            Space between bottom screen edge and bottom edge of left panel.
\newcommand*{\toppanelcontents@bidipres}{}
\newcommand*{\bottompanelcontents@bidipres}{}
\newcommand*{\leftpanelcontents@bidipres}{}
\newcommand*{\rightpanelcontents@bidipres}{}
\newcommand{\DeclarePanel}{\@ifstar\auto@declarepanel@bidipres\declarepanel@bidipres}

\newcommand{\declarepanel@bidipres}[3][]%                          Non-starred version of \DeclarePanel.
{%
  \expandafter\gdef\csname #2panelcontents@bidipres\endcsname{#3}% Just store panel contents.
  \ifthenelse{\equal{#1}{}}{}{\csname store#2panel@bidipres\endcsname{#1}}% If <name> was given, store panel parameters away.
  }%

\newcommand{\storetoppanel@bidipres}[1]
{%
  \expandafter\global\expandafter\let\csname toppanelcontents@bidipres@#1\endcsname\toppanelcontents@bidipres% Contents.
  \expandafter\global\expandafter\let\csname toppanelwidth@bidipres@#1\endcsname\toppanelwidth@bidipres%       Width.
  \expandafter\global\expandafter\let\csname toppanelheight@bidipres@#1\endcsname\toppanelheight@bidipres%     Height.
  \expandafter\global\expandafter\let\csname toppanelshift@bidipres@#1\endcsname\toppanelshift@bidipres%       Raise.
}

\newcommand{\storebottompanel@bidipres}[1]
{%
  \expandafter\global\expandafter\let\csname bottompanelcontents@bidipres@#1\endcsname\bottompanelcontents@bidipres%
  \expandafter\global\expandafter\let\csname bottompanelwidth@bidipres@#1\endcsname\bottompanelwidth@bidipres%
  \expandafter\global\expandafter\let\csname bottompanelheight@bidipres@#1\endcsname\bottompanelheight@bidipres%
  \expandafter\global\expandafter\let\csname bottompanelshift@bidipres@#1\endcsname\bottompanelshift@bidipres%
}

\newcommand{\storeleftpanel@bidipres}[1]
{%
  \expandafter\global\expandafter\let\csname leftpanelcontents@bidipres@#1\endcsname\leftpanelcontents@bidipres%
  \expandafter\global\expandafter\let\csname leftpanelwidth@bidipres@#1\endcsname\leftpanelwidth@bidipres%
  \expandafter\global\expandafter\let\csname leftpanelheight@bidipres@#1\endcsname\leftpanelheight@bidipres%
  \expandafter\global\expandafter\let\csname leftpanelraise@bidipres@#1\endcsname\leftpanelraise@bidipres%
}

\newcommand{\storerightpanel@bidipres}[1]
{%
  \expandafter\global\expandafter\let\csname rightpanelcontents@bidipres@#1\endcsname\rightpanelcontents@bidipres%
  \expandafter\global\expandafter\let\csname rightpanelwidth@bidipres@#1\endcsname\rightpanelwidth@bidipres%
  \expandafter\global\expandafter\let\csname rightpanelheight@bidipres@#1\endcsname\rightpanelheight@bidipres%
  \expandafter\global\expandafter\let\csname rightpanelraise@bidipres@#1\endcsname\rightpanelraise@bidipres%
}

\newcommand{\auto@declarepanel@bidipres}[2]%                           Starred version of \DeclarePanel.
{\csname calc#1dimen@bidipres\endcsname{#2}\declarepanel@bidipres{#1}{#2}} % Calculate `optimal' dimension and store contents.

\newcommand{\restorepanels}[1]
{%
  \@ifundefined{toppanelcontents@bidipres@#1}{\global\let\toppanelcontents@bidipres\empty}
  {%
    \expandafter\global\expandafter\let\expandafter\toppanelcontents@bidipres\csname toppanelcontents@bidipres@#1\endcsname
    \expandafter\global\expandafter\let\expandafter\toppanelwidth@bidipres\csname toppanelwidth@bidipres@#1\endcsname
    \expandafter\global\expandafter\let\expandafter\toppanelheight@bidipres\csname toppanelheight@bidipres@#1\endcsname
    \expandafter\global\expandafter\let\expandafter\toppanelshift@bidipres\csname toppanelshift@bidipres@#1\endcsname
    }%
  \@ifundefined{bottompanelcontents@bidipres@#1}{\global\let\bottompanelcontents@bidipres\empty}
  {%
    \expandafter\global\expandafter\let\expandafter\bottompanelcontents@bidipres\csname bottompanelcontents@bidipres@#1\endcsname
    \expandafter\global\expandafter\let\expandafter\bottompanelwidth@bidipres\csname bottompanelwidth@bidipres@#1\endcsname
    \expandafter\global\expandafter\let\expandafter\bottompanelheight@bidipres\csname bottompanelheight@bidipres@#1\endcsname
    \expandafter\global\expandafter\let\expandafter\bottompanelshift@bidipres\csname bottompanelshift@bidipres@#1\endcsname
    }%
  \@ifundefined{leftpanelcontents@bidipres@#1}{\global\let\leftpanelcontents@bidipres\empty}
  {%
    \expandafter\global\expandafter\let\expandafter\leftpanelcontents@bidipres\csname leftpanelcontents@bidipres@#1\endcsname
    \expandafter\global\expandafter\let\expandafter\leftpanelwidth@bidipres\csname leftpanelwidth@bidipres@#1\endcsname
    \expandafter\global\expandafter\let\expandafter\leftpanelheight@bidipres\csname leftpanelheight@bidipres@#1\endcsname
    \expandafter\global\expandafter\let\expandafter\leftpanelraise@bidipres\csname leftpanelraise@bidipres@#1\endcsname
    }%
  \@ifundefined{rightpanelcontents@bidipres@#1}{\global\let\rightpanelcontents@bidipres\empty}
  {%
    \expandafter\global\expandafter\let\expandafter\rightpanelcontents@bidipres\csname rightpanelcontents@bidipres@#1\endcsname
    \expandafter\global\expandafter\let\expandafter\rightpanelwidth@bidipres\csname rightpanelwidth@bidipres@#1\endcsname
    \expandafter\global\expandafter\let\expandafter\rightpanelheight@bidipres\csname rightpanelheight@bidipres@#1\endcsname
    \expandafter\global\expandafter\let\expandafter\rightpanelraise@bidipres\csname rightpanelraise@bidipres@#1\endcsname
    }%
}
\newcommand{\calctopdimen@bidipres}[1]{\calcvdimen@bidipres{\toppanelheight}{\toppanelwidth}{#1}}
\newcommand{\calcbottomdimen@bidipres}[1]{\calcvdimen@bidipres{\bottompanelheight}{\bottompanelwidth}{#1}}
\newcommand{\calcleftdimen@bidipres}[1]{\calchdimen@bidipres{\leftpanelwidth}{\leftpanelheight}{#1}}%
\newcommand{\calcrightdimen@bidipres}[1]{\calchdimen@bidipres{\rightpanelwidth}{\rightpanelheight}{#1}}%
\newcommand{\panel@sanitize@bidipres}
{%
  \let\hyperlink=\@secondoftwo
  \let\Acrobatmenu=\@secondoftwo
}
\newcommand{\calcvdimen@bidipres}[3]
{%
  \setbox\tempbox@bidipres=\hbox{\panel@sanitize@bidipres\@@mk@panel@bidipres{#2}{}{toppaneltextcolor}{#3}}% Set panel into a dummy box.
  \mklength@bidipres{#1}{\ht\tempbox@bidipres+\dp\tempbox@bidipres}%                                       % Measure total height.
}
\newcommand{\calchdimen@bidipres}[3]
{%
  \optwidth@bidipres{#1}{#2-\panelmargin*2}%              Calculate `optimal' width of a parbox. Panel margins are respected.
  {.5\textwidth-\panelmargin*2}{\panelalignment#3}% .5\textwidth is the hardcoded absolute maximum width.
  \mklength@bidipres{#1}{#1+\panelmargin*2}%
  }
\newcommand{\optwidthsteps}{100}
\newcommand{\optwidthlinetolerance}{200}
\let\maxbadness@bidipres=\@tempcnta
\def\optwidthdisablecommands@bidipres
{%
  \let\Hy@colorlink\@firstofone
  \let\Hy@endcolorlink\relax
  }
\newcommand{\optwidth@bidipres}[4]
{%
  \setcounter{tmpcnta@bidipres}{0}%                                  Initialize `probe counter' for box width.
  \let\best@cnt@bidipres=\empty%                                     Initialize number of best `probe' so far.
  \def\bestbadness@bidipres{1000000}%                                Initialize badness of best `probe'.
  \setboolean{carryon@bidipres}{true}%                               Flag for breaking out of loop.
  \setlength{\tempdimb@bidipres}{#2}%                                Store maximal box height.
  \whiledo
  {\value{tmpcnta@bidipres}<\optwidthsteps\and\boolean{carryon@bidipres}}% Probes done or break of loop?
  {%
    \stepcounter{tmpcnta@bidipres}%                                  Start next probe.
    \setbox\@tempboxa=\hbox%                                   The trick with vbox/lastbox is to get the vbox
    {%                                                         produced by \parbox `immediately' into a box register.
      \optwidthdisablecommands@bidipres%                             Turn off some nasties not needed when measuring.
      \parbox[b]{(#3)/\optwidthsteps*\value{tmpcnta@bidipres}}%      Make the next parbox.
      {\hfuzz\maxdimen\hbadness\@M\relax#4}%
      \global\setbox\tempbox@bidipres=\lastbox%                      ... and assign \tempbox@bidipres to it.
      }%
    \setlength{\tempdima@bidipres}{\ht\tempbox@bidipres+\dp\tempbox@bidipres}%   Measure total height.
    \ifthenelse{\lengthtest{\tempdima@bidipres>\tempdimb@bidipres}}%       If it exceeds the maximum height given, the box isn't
    {}%                                                        acceptable anyway.
    {%
      \calcmaxbadness@bidipres{\maxbadness@bidipres}{\tempbox@bidipres}%         Calculate `worst badness' of any hbox appearing in parbox.
      \ifthenelse{\not\maxbadness@bidipres>\optwidthlinetolerance}%  Below Threshold?
      {% Yes. Accept this width.
        \edef\best@cnt@bidipres{\thetmpcnta@bidipres}%                     Store this probe number.
        \setboolean{carryon@bidipres}{false}%                        Break loop.
        }
      {% No. Carry on.
        \ifthenelse{\maxbadness@bidipres<\bestbadness@bidipres}%           Below lowest badness found so far?
        {% Yes. Store probe number.
          \edef\bestbadness@bidipres{\number\maxbadness@bidipres}%         Store badness value.
          \edef\best@cnt@bidipres{\thetmpcnta@bidipres}%                   Store probe number.
          }
        {}% No. Try next probe.
        }% matches second argument of \ifthenelse{\not\maxbadness@bidipres>\optwidthlinetolerance}%
      }% matches second argument of \ifthenelse{\lengthtest{\tempdima@bidipres>\tempdimb@bidipres}}%
    }% matches \whiledo{\value{tmpcnta@bidipres}<\optwidthsteps\and\boolean{carryon@bidipres}}{%
  \ifx\best@cnt@bidipres\empty%                                      Was _any_ badness below the initialization value found?
    \mklength@bidipres{#1}{#3}% No; return max width.
   \else
    \mklength@bidipres{#1}{(#3)/\optwidthsteps*\best@cnt@bidipres}% Yes; return width of best probe.
  \fi
  }% matches \newcommand{\optwidth@bidipres}[4]{%
\newcommand{\calcmaxbadness@bidipres}[2]
{%
  \let\@resultcnt@bidipres=#1%           Here we store the result.
  \global\@resultcnt@bidipres=\z@\relax% Just in case no hbox occurs...
  \setlength{\@tempdima}{\wd#2}%   This is the width to which every hbox is stretched for finding its badness.
  \setbox\@tempboxa=\vbox%         A dummy vbox for recursively analysing the vbox contents using \lastbox
  {%
    \hfuzz\maxdimen\hbadness\@M
    \unvbox#2%                     `free' the contents of the vbox.
    \measureboxes@bidipres%              Analyse `tail to head' using \lastbox.
    }%
  }
\newcommand{\measureboxes@bidipres}%
{%
  \unskip\unpenalty\unkern%    This is a kluge for TeX, because there is no certain way of finding out whether there's a
  \unskip\unpenalty\unkern%    penalty, glue or kern on the vertical list. \lastpenalty will give its value, but a
  \unskip\unpenalty\unkern%    value of 0 might mean there was none or there was one of value 0.
  \unskip\unpenalty\unkern%    This is different in eTeX. I might make a switch to a smarter solution.
  \unskip\unpenalty\unkern
  \unskip\unpenalty\unkern
  \unskip\unpenalty\unkern
  \unskip\unpenalty\unkern
  \unskip\unpenalty\unkern
  \unskip\unpenalty\unkern
  \setbox\@tempboxa=\lastbox% Grab last box.
  \ifhbox\@tempboxa%          Was this an hbox?
    \setbox0=\hb@xt@\@tempdima{\unhbox\@tempboxa}% Yes. Reformat with given width.
    \ifnum\badness>\@resultcnt@bidipres%                 Badness larger than largest recorded badness?
      \global\@resultcnt@bidipres=\badness%              Yes. Memorize.
    \fi
    \expandafter\measureboxes@bidipres%                  Recursive call.
   \else
    \ifvbox\@tempboxa%                                      Was this a vbox?
      \expandafter\expandafter\expandafter\measureboxes@bidipres% Ignore, but execute recursive call.
    \fi
  \fi
  }
\newcommand{\mk@toppanel@bidipres}% top panel
{%
  \ifx\toppanelcontents@bidipres\empty%           top panel specified?
   \else%                                   Yes; create box with appropriate dimensions, background color and contents.
    \@mk@panel@bidipres{\toppanelwidth}{\toppanelheight}{toppaneltextcolor}{\toppanelcontents@bidipres}%
  \fi
  }

\newcommand{\mk@bottompanel@bidipres}% bottom panel
{%
  \ifx\bottompanelcontents@bidipres\empty%        bottom panel specified?
   \else%                                   Yes; create box with appropriate dimensions, background color and contents.
    \@mk@panel@bidipres{\bottompanelwidth}{\bottompanelheight}{bottompaneltextcolor}{\bottompanelcontents@bidipres}%
  \fi
  }

\newcommand{\mk@leftpanel@bidipres}% left panel
{%
  \ifx\leftpanelcontents@bidipres\empty%          left panel specified?
   \else%                                   Yes; create box with appropriate dimensions, background color and contents.
    \@mk@panel@bidipres{\leftpanelwidth}{\leftpanelheight}{leftpaneltextcolor}{\leftpanelcontents@bidipres}%
  \fi
  }

\newcommand{\mk@rightpanel@bidipres}% right panel
{%
  \ifx\rightpanelcontents@bidipres\empty%         right panel specified?
   \else%                                   Yes; create box with appropriate dimensions, text color and contents.
    \@mk@panel@bidipres{\rightpanelwidth}{\rightpanelheight}{rightpaneltextcolor}{\rightpanelcontents@bidipres}%
  \fi
  }

\newcommand{\@mk@panel@bidipres}[2]% Generate `standard' parbox parameters for panels.
{%
  \@@mk@panel@bidipres{#1}{[#2-\panelmargin*2][s]}%
  }

\@ifclassloaded{powersem}
{%
  \newcommand{\panelalignment}{\sem@ptsize{\slide@ptsize}\large\normalsize}%
}
{%
  \newcommand{\panelalignment}%            Justification for panels. This setting allows a certain amount of
  {\setlength{\rightskip}{0pt plus 20pt}}% `right-raggedness'. Leave empty for standard parbox formatting.
}

\newcommand{\@@mk@panel@bidipres}[4]
{%
  \vbox
  {%
    \offinterlineskip
    \kern\panelmargin%  Top margin.
    \hbox
    {{%
        \ifthenelse{\boolean{instepwise@bidipres}}%  Inside \stepwise, colors mat have been dimmed, leaking out to panels.
        {\usecolorset{stwcolors}}{}%           Restore them, just in case.
        \xecolor{#3}%                            Set panel text color.
        \kern\panelmargin%                     Left margin.
        \parbox[b]#2{#1-\panelmargin*2}%       The parbox with the main panel contents.
        {%
          \normalfont
          \panelalignment#4%
          \hrule\@height\z@%            The hrule makes sure the total height of this box can be measured appropriately.
          }%
        \kern\panelmargin%              Right margin.
        }}%
    \kern\panelmargin%                  Bottom margin.
    }%
  }
\newcommand{\buttonsep}{\fboxsep}
\newcommand{\buttonrule}{0pt}
\newcommand{\buttonshadowhshift}{.3\fboxsep}
\newcommand{\buttonshadowvshift}{-.3\fboxsep}
\newcommand{\button}[1][0pt]%      Collect first optional parameter.
{%
  \mklength@bidipres\bt@width@bidipres{#1}%    Store optional argument.
  \button@bidipres
}

\newcommand{\button@bidipres}[1][0pt]%   Collect second optional parameter.
{%
  \mklength@bidipres\bt@height@bidipres{#1}%   Store optional argument.
  \@button@bidipres
}

\newcommand{\@button@bidipres}[1][0pt]%  Collect third optional parameter.
{%
  \mklength@bidipres\bt@depth@bidipres{#1}%    Store optional argument.
  \@@button@bidipres
}

\newcommand{\@@button@bidipres}[3][c]%   Collect fourth optional and two mandatory parameters and proceed.
{%
  \ifthenelse{\lengthtest{\bt@width@bidipres=0pt}}%       <width> given?
  {\mklength@bidipres{\bt@width@bidipres}{\widthof{#3}}}%       No. Calculate width of <text>.
  {\mklength@bidipres{\bt@width@bidipres}{\bt@width@bidipres-\buttonsep*2-\buttonrule*2}}% Yes. Calculate area left for <text>.
  \ifthenelse{\lengthtest{\bt@height@bidipres=0pt}}%      <height> given?
  {\mklength@bidipres{\bt@height@bidipres}{\heightof{#3}}}%     No. Calculate height of <text>.
  {\mklength@bidipres{\bt@height@bidipres}{\bt@height@bidipres-\buttonsep-\buttonrule}}% Yes. Calculate area left for <text>.
  \ifthenelse{\lengthtest{\bt@depth@bidipres=0pt}}%       <depth> given?
  {\mklength@bidipres{\bt@depth@bidipres}{\depthof{#3}}}%       No. Calculate depth of <text>.
  {\mklength@bidipres{\bt@depth@bidipres}{\bt@depth@bidipres-\buttonsep-\buttonrule}}% Yes. Calculate area left for <text>.
  \leavevmode% \rlap creates a `raw' hbox. So we get into horizontal mode.
  \rlap%       Make shadow.
  {%
    \hspace*{\buttonshadowhshift}%  Horizontal displacement.
    \raisebox{\buttonshadowvshift}% Vertical displacement.
    {%
      {% Inner group for correct color handling.
        \setcolor@bidipres{buttonshadowcolor}% Button shadow color.
        \rule%                           Create colored rectangular patch of appropriate dimensions.
        [-\bt@depth@bidipres-\buttonsep-\buttonrule]
        {\bt@width@bidipres+\buttonsep*2+\buttonrule*2}
        {\bt@height@bidipres+\bt@depth@bidipres+\buttonsep*2+\buttonrule*2}%
        }% matches inner group
      }% matches \raisebox{\buttonshadowvshift}{%
    }% matches \rlap{%
  \edef\o@fboxrule@bidipres{\the\fboxrule}%    Preserve original definitions of \fbox parameters.
  \edef\o@fboxsep@bidipres{\the\fboxsep}%
  #2%                                    Execute <navcommand>.
  {%
    \setlength{\fboxrule}{\buttonrule}%        Set \fbox parameters for button frame.
    \setlength{\fboxsep}{\buttonsep}%
    \fcolorbox{buttonframecolor}{buttoncolor}% Create button frame with the right colors.
    {%
      \makebox[\bt@width@bidipres][#1]%              Create box of correct width to contain <text>.
      {%
        \raisebox{0pt}[\bt@height@bidipres][\bt@depth@bidipres]% Create box of correct height and depth.
        {%
          \setlength{\fboxrule}{\o@fboxrule@bidipres}\setlength{\fboxsep}{\o@fboxsep@bidipres}% Restore fbox parameters.
          \setcolor@bidipres{buttontextcolor}#3%           Produce <text>.
          }% matches \raisebox{0pt}[\bt@height@bidipres][\bt@depth@bidipres]{%
        }% matches \makebox[\bt@width@bidipres][#1]{%
      }% matches \fcolorbox{buttonframecolor}{buttoncolor}{%
    }% matches argument of <navcommand>.
  }% matches \newcommand{\@@button@bidipres}[3][c]{%
\newcommand{\buttonsymbolsize}{\footnotesize}
\@ifpackageloaded{amssymb}%     AMS symbols available?
{% Yes. Use `black' symbols.
  \newcommand{\buttonleftarrowsymbol}{{\buttonsymbolsize\boldmath\origmath{\blacktriangleleft}}}%   `left' arrow.
  \newcommand{\buttonrightarrowsymbol}{{\buttonsymbolsize\boldmath\origmath{\blacktriangleright}}}% `right' arrow.
  \newcommand{\buttonbackarrowsymbol}{{\buttonsymbolsize\boldmath\origmath{\vartriangleleft}}}%     `back' arrow.
}
{% No. Use replacements from standard set.
  \newcommand{\buttonleftarrowsymbol}{{\buttonsymbolsize\boldmath\origmath{\lhd}}}%       `left' arrow.
  \newcommand{\buttonrightarrowsymbol}{{\buttonsymbolsize\boldmath\origmath{\rhd}}}%      `right' arrow.
  \newcommand{\buttonbackarrowsymbol}{{\buttonsymbolsize\boldmath\origmath{\leftarrow}}}% `back' arrow.
}
\newcommand{\stdbuttonwidth}{\widthof{\buttonrightarrowsymbol\buttonrightarrowsymbol\buttonrightarrowsymbol}+4pt}
\newcommand{\currentpagevalue}{\value{page}}
\newcommand{\backpagebutton}[1][\stdbuttonwidth]
{%
  \button[#1]{\setcounter{tmpcnta@bidipres}{\currentpagevalue-1}\hyperlink{page.\thetmpcnta@bidipres}}
  {\buttonleftarrowsymbol\buttonleftarrowsymbol}%
  }
\newcommand{\backstepbutton}[1][\stdbuttonwidth]
{%
  \button[#1]{\Acrobatmenu{PrevPage}}
  {\buttonleftarrowsymbol}%
  }
\newcommand{\gobackbutton}[1][\stdbuttonwidth]
{%
  \button[#1]{\Acrobatmenu{GoBack}}
  {\buttonbackarrowsymbol}%
  }
\newcommand{\nextstepbutton}[1][\stdbuttonwidth]
{%
  \button[#1]{\Acrobatmenu{NextPage}}
  {\buttonrightarrowsymbol}%
  }
\newcommand{\nextpagebutton}[1][\stdbuttonwidth]
{%
  \button[#1]{\setcounter{tmpcnta@bidipres}{\currentpagevalue+1}\hyperlink{firstpage.\thetmpcnta@bidipres}}
  {\buttonrightarrowsymbol\buttonrightarrowsymbol}%
  }
\newcommand{\nextfullpagebutton}[1][\stdbuttonwidth]
{%
  \button[#1]{\setcounter{tmpcnta@bidipres}{\currentpagevalue+1}\hyperlink{page.\thetmpcnta@bidipres}}
  {\buttonrightarrowsymbol\buttonrightarrowsymbol\buttonrightarrowsymbol}%
  }
\newcommand{\fullscreenbutton}[1][\stdbuttonwidth]
{%
  \button[#1]{\Acrobatmenu{FullScreen}}
  {\buttonrightarrowsymbol\buttonleftarrowsymbol}%
  }
\ifthenelse{\boolean{display}}%            Are dynamic features enabled?
{% Yes.
  \newcommand{\pagetransition}[1]%         Definition for preamble.
  {%
    \@ifpackageloaded{hyperref}%           Can we use \hypersetup?
    {% Yes.
      \hypersetup{pdfpagetransition={#1}}% Set page transition with \hypersetup.
      }
    {% No. In this case, we can't set the page transition.
      \ClassWarning{bidipresentation}
      {Package hyperref not loaded.\MessageBreak Page transition not set}%
      }%
    }% matches \newcommand{\pagetransition}[1]{%
  \AtBeginDocument%                      Definition for document body.
  {%
    \@ifpackageloaded{hyperref}%         Can we use \hypersetup?
    {% Yes.
      \hypersetup{pdfpagetransition={}}% Make pagetransition setting (consistently) local to groups.
      \renewcommand{\pagetransition}[1]{\hypersetup{pdfpagetransition={#1}}}%
      }
    {% No. Disable page transitions.
      \ClassWarning{bidipresentation}
      {Package hyperref not loaded.\MessageBreak Page transitions disabled}%
      \let\pagetransition=\@gobble
      }%
    }% matches \AtBeginDocument{%
  }% matches \ifthenelse{\boolean{display}}{%
{\let\pagetransition=\@gobble}% No. Disable page transitions.
\newcommand{\pageTransitionSplitHO}{\pagetransition{Split /Dm /H /M /O}}% Split Horizontally to the outside.

\newcommand{\pageTransitionSplitHI}{\pagetransition{Split /Dm /H /M /I}}% Split Horizontally to the inside.

\newcommand{\pageTransitionSplitVO}{\pagetransition{Split /Dm /V /M /O}}% Split Vertically to the outside.

\newcommand{\pageTransitionSplitVI}{\pagetransition{Split /Dm /V /M /I}}% Split Vertically to the inside.

\newcommand{\pageTransitionBlindsH}{\pagetransition{Blinds /Dm /H}}% Horizontal Blinds.

\newcommand{\pageTransitionBlindsV}{\pagetransition{Blinds /Dm /V}}% Vertical Blinds.

\newcommand{\pageTransitionBoxO}{\pagetransition{Box /M /O}}% Growing Box.

\newcommand{\pageTransitionBoxI}{\pagetransition{Box /M /I}}% Shrinking Box.

\newcommand{\pageTransitionWipe}[1]{\pagetransition{Wipe /Di #1}}% Wipe from one edge of the page to the facing edge.

\newcommand{\pageTransitionDissolve}{\pagetransition{Dissolve}}% Dissolve.

\newcommand{\pageTransitionGlitter}[1]{\pagetransition{Glitter /Di #1}}% Glitter from one edge to the facing edge.

\newcommand{\pageTransitionReplace}{\pagetransition{Replace}}% Simple Replace (the default).
\newcommand{\infinitepageduration}{}%          Default: No page duration setting on every page.

\ifthenelse{\boolean{nineminutes@bidipres}}%         If the option nineminutes is given, every page without explicit setting
{\renewcommand{\infinitepageduration}{546}}{}% gets a setting of 546 seconds (9.1 minutes).
\ifthenelse{\boolean{display}}%            Are dynamic features enabled?
{% Yes.
  \newcommand{\pageDuration}[1]%           Definition for preamble.
  {%
    \@ifpackageloaded{hyperref}%           Can we use \hypersetup?
    {% Yes.
      \hypersetup{pdfpageduration={#1}}%   Set page duration with \hypersetup.
      }%
    {% No. In this case, we can't set the page duration.
      \ClassWarning{bidipresentation}
      {Package hyperref not loaded.\MessageBreak Page duration not set}%
      }%
    }% matches \newcommand{\pageDuration}[1]{%
  \AtBeginDocument%                        Make sure this also works if bidipresentation is loaded before hyperref.
  {%
    \@ifpackageloaded{hyperref}%                    Can we use \hypersetup?
    {% Yes.
      \edef\next{\noexpand\hypersetup{pdfpageduration={\infinitepageduration}}}%
      \next%                                        Set default page duration.
      \renewcommand{\pageDuration}[1]{\hypersetup{pdfpageduration={#1}}}% Set page duration with \hypersetup.
      }%
    {% No. In this case, we can't set the page duration.
      \ClassWarning{bidipresentation}
      {Package hyperref not loaded.\MessageBreak Page duration disabled}%
      \let\pageDuration=\@gobble
      }%
    }% matches \AtBeginDocument{%
  }% matches \ifthenelse{\boolean{display}}{%
{\let\pageDuration=\@gobble}% No. Disable page duration.
\newcommand{\stopAdvancing}
{\edef\next{\noexpand\pageDuration{\infinitepageduration}}\next}% Reset to default page duration.
\AtBeginDocument{\shipoutinit@bidipres}%
\newcommand*{\shipoutinit@bidipres}
{%
  \let\o@shipout@bidipres=\shipout% Memorize previous definition.
  \let\shipout\shipout@bidipres%    Replace by own one.
  }%
\newcommand{\shipout@bidipres}
{%
  \afterassignment\shipout@test@bidipres
  \global\setbox\@cclv= %
  }%
\newcommand{\shipout@test@bidipres}
{%
  \ifvoid\@cclv\relax%               Is the box assigned yet?
    \aftergroup\shipout@output@bidipres%   No; defer execution of \shipout@output@bidipres.
   \else
    \shipout@output@bidipres%              Yes; execute \shipout@output@bidipres immediately.
  \fi%
  }%
\newcommand{\shipout@output@bidipres}
{%
  \shipout@hook@bidipres%          Here, our own stuff is executed, manipulating \@cclv.
  \o@shipout@bidipres\box\@cclv%   Execute original shipout routine.
  }%
\newcommand{\AtShipout}[1]
{\expandafter\gdef\expandafter\at@shipout@once@bidipres\expandafter{\at@shipout@once@bidipres#1}}% Add argument to container.
\newcommand{\at@shipout@once@bidipres}{}
\AtBeginDocument{\global\let\o@hyper@@anchor\hyper@@anchor}
\@ifpackageloaded{hyperref}%                            Is hyperref loaded?
{% Yes. Prepare hook.
  \newcommand{\do@insert@firstanchor@bidipres}%               This is executed on the first subpage of every page.
  {\hypertarget{firstpage.\number\currentpagevalue}{}}% Create target.
  }
{\newcommand{\do@insert@firstanchor@bidipres}{}}% No. Leave hook empty.
\newcommand{\dont@insert@firstanchor@bidipres}{}%
\newcommand{\insert@firstanchor@bidipres}{\do@insert@firstanchor@bidipres}%
\newcommand{\shipout@hook@bidipres}
{%
  \filterpage@bidipres%                  Filter out whatsits on duplicate pages.
  \setbox\@cclv=%                  Create `real' page box (which is later shipped out).
  \hbox{%
    \set@typeset@protect
    \raise\ht\@cclv\rlap%                         Place background box.
    {%
      \vtop to \bidiprespageheight
      {%
        \offinterlineskip
        \hrule\@height\z@\relax
        \kern -1truein\relax
        \kern -\voffset\relax
        \moveleft 1truein\hbox{\kern-\hoffset\copy\bgndbox@bidipres}%
        \vss
        \kern 1truein\relax
        \kern\voffset\relax
        }%
      }%
    \raise\ht\@cclv\rlap%                         Place `vertical' panels.
    {%
      \vtop to \bidiprespageheight
      {%
        \offinterlineskip
        \hrule\@height\z@\relax
        \kern -1truein\relax
        \kern -\voffset\relax
        \moveleft 1truein\hb@xt@\bidiprespagewidth
        {%
          \kern-\hoffset\raise\leftpanelraise\hbox{\mk@leftpanel@bidipres}%
          \hfill
          \raise\rightpanelraise\hbox{\mk@rightpanel@bidipres}%
          \kern\hoffset
          }%
        \vss
        \kern 1truein\relax
        \kern\voffset\relax
        }%
      }%
    \raise\ht\@cclv\rlap%                         Place `horizontal' panels.
    {%
      \vtop to \bidiprespageheight
      {%
        \offinterlineskip
        \hrule\@height\z@\relax
        \kern -1truein\relax
        \kern -\voffset\relax
        \moveleft 1truein\hbox{\kern-\hoffset\kern\toppanelshift\mk@toppanel@bidipres}%
        \vfill
        \moveleft 1truein\hbox{\kern-\hoffset\kern\bottompanelshift\mk@bottompanel@bidipres}%
        \kern 1truein\relax
        \kern\voffset\relax
        }%
      }%
    \raise\ht\@cclv\rlap
    {%
      \let\hyper@@anchor\o@hyper@@anchor%       Reactivate hyper anchors.
      \insert@firstanchor@bidipres%                   Execute hook for creating target firstpage.<n>
      \ifshippingduplicate%                     Will further subpages follow?
        \global\let\insert@firstanchor@bidipres=\dont@insert@firstanchor@bidipres% Deactivate hook for next page.
       \else
        \global\let\insert@firstanchor@bidipres=\do@insert@firstanchor@bidipres%   Reactivate hook for next page.
      \fi
      \at@shipout@once@bidipres%                      Execute code stored away by \AtShipout.
      }%
    \global\let\at@shipout@once@bidipres=\empty%      Clear \AtShipout container.
    \box\@cclv
    }%
  }
\def\colorcorrections@bidipres{\relax}%          The `counter stack' of color correction codes, reset at every \shipout.

\AtBeginDocument%                          Make sure to catch color.sty even if it's loaded after bidipresentation.
{%
  \ifthenelse{\boolean{fixcolorstack@bidipres}}% Was the fixcolorstack option given?
  {%
    \@ifundefined{VTeXversion}%            Using vtex?
    {% No. Go on.
      \ifthenelse{\boolean{pdf}}%          Producing pdf with pdftex?
      {% Yes. Color stack fixing unnecessary.
        \ClassWarning{bidipresentation}
        {pdftex doesn't need color stack correction.\MessageBreak Option fixcolorstack disabled.}%
        }
      {% No. We need to add corrections for the color stack...
        \@ifpackageloaded{color}%          ... but only if color.sty is loaded at all.
        {%
          \expandafter\def\expandafter\shipout@hook@bidipres\expandafter% Extend \shipout hook ...
          {\shipout@hook@bidipres\clearcolorcorrections@bidipres}%              ... by a command to clear counter stack.
                                %
          \newcommand{\clearcolorcorrections@bidipres}%                          The counter stack is cleared...
          {%                                                               ... on all `final' shipouts.
            \ifshippingduplicate
             \else
              \gdef\colorcorrections@bidipres{\relax}%
            \fi
          }
          \expandafter\def\expandafter\o@set@color@bidipres\expandafter%
          {%
            \set@color%                                                This is the `real' original definition.
            \expandafter\aftergroup\csname\current@color\endcsname%    Add definition of \current@color.
            }%

          \let\o@reset@color@bidipres=\reset@color%                          Save original definition of \reset@color.
          \def\remove@resetcolor@bidipres#1\aftergroup\reset@color%
          {\def\pushcolor@bidipres##1{{\def\current@color{##1}#1}}}%
                                %
          \expandafter\remove@resetcolor@bidipres\set@color
          \def\pushcolorname@bidipres#1%
          {%
            \begingroup \escapechar\m@ne\xdef\@gtempa{\string#1}\endgroup% Get the coded tokens back (without \ ).
            \expandafter\pushcolor@bidipres\expandafter{\@gtempa}%               ... and execute push.
            }%
          \def\set@color%
          {%
            \o@set@color@bidipres%                                             `Original' definition of \set@color.
            \expandafter\@temptokena\expandafter{\colorcorrections@bidipres}%  Add \o@reset@color@bidipres command at the front
            \xdef\colorcorrections@bidipres{\noexpand\o@reset@color@bidipres\the\@temptokena}% ...  of \colorcorrections@bidipres.
            }

          \def\reset@color#1%                                            \reset@color now receives the name of the color.
          {%
            \expandafter\addpushtoccor@bidipres\colorcorrections@bidipres\@nil{#1}%  Add a push command for this color to the front
                                                                      %  of \colorcorrections@bidipres.
            \o@reset@color@bidipres%                                           `Original' definition of \reset@color.
            }%

          \def\addpushtoccor@bidipres#1#2\@nil#3%      Add a push command for some color to the front of \colorcorrections@bidipres.
          {%
            \ifx\o@reset@color@bidipres#1%             For efficiency, a push immediately followed by a reset cancel out.
              \gdef\colorcorrections@bidipres{#2}%
             \else
              \gdef\colorcorrections@bidipres{\pushcolorname@bidipres{#3}#1#2}% Otherwise, add the push to \colorcorrections@bidipres.
            \fi
            }%
          }% matches \@ifpackageloaded{color}
        {}% No changes needed if color.sty is not loaded.
        }% matches second argument of \ifthenelse{\boolean{pdf}}
      }% matches \@ifundefined{VTeXversion}
    {% Yes. Color stack fixing unnecessary.
      \ClassWarning{bidipresentation}
      {vtex doesn't need color stack correction.\MessageBreak Option fixcolorstack disabled.}%
      }%
    }% matches \ifthenelse{\boolean{fixcolorstack@bidipres}}
  {}%
  }% matches \AtBeginDocument
\newif\ifshippingduplicate
\providecommand{\bidipreseject}{\newpage}
\newbox\mempageconts@bidipres
\newinsert\memfootins@bidipres
\newtoks\memoutput@bidipres
\def\cl@@ckptpause@bidipres{\@elt{page}}
\def\savepausecounters@bidipres{%
  \begingroup
    \def\@elt##1{\global\csname c@##1\endcsname\the\csname c@##1\endcsname}%
    \xdef\restorepausecounters@bidipres{\cl@@ckptpause@bidipres}%
  \endgroup
  }
\newcommand{\pausesafecounter}[1]%
{\expandafter\def\expandafter\cl@@ckptpause@bidipres\expandafter{\cl@@ckptpause@bidipres\@elt{#1}}}
\@ifclassloaded{seminar}{\pausesafecounter{slide}}{}
\ifthenelse{\boolean{display}}{%
  \AtBeginDocument{\@ifpackageloaded{hyperref}{%
  \let\hyper@anchor@bidipres=\hyper@anchor
  \long\def\hyper@@anchor#1#2{%
    %%% \ifthenelse{\boolean{instepwise@bidipres}}%
    \ifthenelse{\boolean{instepwise@bidipres} \AND \NOT \boolean{strongfiltering@bidipres}}%
      {\ifthenelse{\NOT \boolean{instep@bidipres}}%
       {\ifthenelse{\value{step}=\value{firststep}}{\@hyper@@anchor#1\relax#2\relax}{}}%
       {\ifthenelse{\boolean{active} \AND \boolean{firstactivation}}%
            {\@hyper@@anchor#1\relax#2\relax}{}}% End \ifthenelse{\boolean{active} ...
      }% End \ifthenelse{\NOT \boolean{instep@bidipres}}
      {\@hyper@@anchor#1\relax#2\relax}% End \ifthenelse{\boolean{instepwise@bidipres}}
  }
  \let\hyper@anchorstart@bidipres=\hyper@anchorstart
  \def\hyper@anchorstart#1{%
    \ifthenelse{\boolean{instepwise@bidipres} \AND \NOT \boolean{strongfiltering@bidipres}}%
      {\ifthenelse{\NOT \boolean{instep@bidipres}}%
       {\ifthenelse{\value{step}=\value{firststep}}{\hyper@anchorstart@bidipres{#1}}{}}%
       {\ifthenelse{\boolean{active} \AND \boolean{firstactivation}}%
            {\hyper@anchorstart@bidipres{#1}}{}}% End \ifthenelse{\boolean{active} ...
      }% End \ifthenelse{\NOT \boolean{instep@bidipres}}
      {\hyper@anchorstart@bidipres{#1}}% End \ifthenelse{\boolean{instepwise@bidipres}}
  }
  }{}}% End \AtBeginDocument{\@ifpackageloaded{hyperref}{
  % Changing \protected@write to avoid duplicates in aux-file
  \let\protected@write@bidipres=\protected@write
  \long\def\protected@write#1#2#3{%
    \ifthenelse{\boolean{instepwise@bidipres} \AND \NOT \boolean{strongfiltering@bidipres}}%
      {\ifthenelse{\NOT \boolean{instep@bidipres}}%
       {\ifthenelse{\value{step}=\value{firststep}}{\protected@write@bidipres{#1}{#2}{#3}}{}}%
       {\ifthenelse{\boolean{active} \AND \boolean{firstactivation}}%
            {\protected@write@bidipres{#1}{#2}{#3}}{}}% End \ifthenelse{\boolean{active} ...
      }% End \ifthenelse{\NOT \boolean{instep@bidipres}}
      {\protected@write@bidipres{#1}{#2}{#3}}% End \ifthenelse{\boolean{instepwise@bidipres}}
  }%
}{}% End \ifthenelse{\boolean{display}}
\def\save@bidipres
{%
  \par%                                                Always end current paragraph.
  \global\setbox\mempageconts@bidipres=\copy\voidb@x%        Initialise \mempageconts@bidipres (suggested by Ross Moore).
  \savepausecounters@bidipres%                               Save counters.
  \memoutput@bidipres=\output%                               Make backup copy of output routine.
  \output={\global\setbox\mempageconts@bidipres=\box\@cclv}% Copy current page contents.
  \eject%                                              Trigger now.
  \global\setbox\memfootins@bidipres=\copy\footins%          Save footnotes.
  \global\skip\memfootins@bidipres=\skip\footins
  \global\count\memfootins@bidipres=\count\footins
  \global\dimen\memfootins@bidipres=\dimen\footins
  \output=\memoutput@bidipres%                               Restore output routine.
  }
\let\filterpage@bidipres\relax
\newcommand{\filterwhatsits@bidipres}{%
  \ifthenelse{\boolean{strongfiltering@bidipres}}%
    {\global\setbox\@cclv=\hbox{\leaders\copy\@cclv\hskip\wd\@cclv}}% Old aggressive/robust filtering
    {}% No filtering - handled by \insertfilterwhatsits@bidipres and stepwise aware commands.
}
\newcommand{\insertfilterwhatsits@bidipres}{%
  \global\setbox\tempbox@bidipres=\hbox{\leaders\copy\tempbox@bidipres\hskip\wd\tempbox@bidipres}%
}
\newcommand{\insertfirstduplicate@bidipres}
{\unvcopy\mempageconts@bidipres}%             Just output the vbox's contents.
\newcommand{\do@colorcorrections@bidipres}
{%
  {%
    \colorcorrections@bidipres%               Execute color correction stack.
    \gdef\colorcorrections@bidipres{\relax}%  Re-initialize for next round.
    }%
  }
\newcommand{\insertsecondduplicate@bidipres}
{%
  \do@colorcorrections@bidipres%                         Execute color correction stack.
  \global\setbox\footins=\copy\memfootins@bidipres%      Restore footnotes.
  \global\skip\footins=\skip\memfootins@bidipres
  \global\count\footins=\count\memfootins@bidipres
  \global\dimen\footins=\dimen\memfootins@bidipres
  \ifthenelse{\boolean{strongfiltering@bidipres}}%
    {\unvcopy\mempageconts@bidipres}%
    {\setbox\tempbox@bidipres=\vbox{\unvcopy\mempageconts@bidipres}%
     \insertfilterwhatsits@bidipres
     \copy\tempbox@bidipres%
    }
  }
\newcommand{\outputduplicate@bidipres}
{%
  \shippingduplicatetrue%                       This switch can be evaluated in panels or headers/footers.
  \global\let\filterpage@bidipres\filterwhatsits@bidipres%  Filter out file whatsits when shipping out.
  \global\let\o@hyper@@anchor@bidipres\hyper@@anchor% Save definition of hyperref command for hyper anchors.
  \global\let\hyper@@anchor\@gobble%            Disable hyper anchors on duplicate pages to avoid duplicate page anchors.
  \bidipreseject%                                     Shipout page.
  \global\let\hyper@@anchor\o@hyper@@anchor@bidipres% Restore definition of hyperref command for hyper anchors.
  \global\let\filterpage@bidipres\relax%              Disable whatsit filtering.
  \shippingduplicatefalse%                      Unset switch.
  }%
\providecommand\pause% If pause.sty is loaded, the existing definition of \pause is not overwritten.
{%
  \save@bidipres%                                         Save contents of the page...
  \insertfirstduplicate@bidipres%                         ... and insert again.
  \ifthenelse{\boolean{display}}%                   Are dynamic features enabled?
  {% Yes.
    \outputduplicate@bidipres%                            Output page.
    \restorepausecounters@bidipres%                       Restore counters (page number).
    \insertsecondduplicate@bidipres%                      Reinsert saved contents.
    }
  {}%
  }%
\newcommand{\@onlyinstepwise@bidipres}[1]
{%
  \providecommand#1%
  {%
    \ClassError{bidipresentation}%
    {Command \string#1 can be used only inside \string\stepwise}
    {%
      Commands like \string\step, \string\switch,
      \string\multistep\space or \string\overlays\MessageBreak
      can be used only inside the argument of a \string\stepwise\space variant.
    }%
  }%
}
\newcounter{totalsteps}
\newcounter{firststep}
\newcounter{step}
\newcounter{stepcommand}
\newcounter{stepsperformed}
\newboolean{firstactivation}
\newboolean{active}
\newcommand{\displayboxed}
{%
  \ifmmode                                           % We need to distinguish between math and text mode.
    \expandafter\mathpalette\expandafter\math@db@bidipres  % In math mode, the style has to be respected.
  \else
    \expandafter\text@db@bidipres
  \fi
}
\newcommand{\text@db@bidipres}[1]{\mbox{#1}}            % In text mode, we just use an \mbox.
\newcommand{\math@db@bidipres}[2]{\mbox{$\m@th#1{#2}$}} % In math mode, the style (#1) is inserted by \mathpalette.
\let\displayidentical=\@iden
\newcommand{\hidephantom}[1]
{%
  {% a group makes redefinitions local
    \leavevmode\phantom{#1}%
    }%
  }
\newcommand{\hideignore}[1]{}
\newcommand{\hidesmartignore}[1]{\setbox\tempbox@bidipres=\vbox{#1}}

\ifthenelse{\boolean{colormath@bidipres}}{%
  \newcommand{\commitcolor@bidipres}
  {\textxecolor{\ifmmode mathcolor\else textcolor\fi}}
}{
  \newcommand{\commitcolor@bidipres}{\textxecolor{textcolor}}
}
\ifthenelse{\boolean{bidiprescolor}}{
  \newcommand{\hidedimmed}[1]{%
    {
      \ifthenelse{\boolean{instepwise@bidipres}}{\usecolorset{stwcolors}}{}%
      \dimcolors
      \commitcolor@bidipres{#1}
    }
  }
}{
  \let\hidedimmed=\displayidentical
}
\ifthenelse{\boolean{bidiprescolor}}{
  \newcommand{\hidevanish}[1]{\textxecolor{\vanishcolor}{\vanishcolors#1}}
}{
  \let\hidevanish=\hidephantom
}
\newcommand{\boxedsteps}          % Use boxed versions.
{\let\displaystepcontents=\displayboxed\let\hidestepcontents=\hidephantom}

\newcommand{\nonboxedsteps}       % Use nonboxed versions.
{\let\displaystepcontents=\displayidentical\let\hidestepcontents=\hideignore}
\nonboxedsteps
\let\activatestep=\displayidentical
\newlength{\highlightboxsep}
\setlength{\highlightboxsep}{.5\fboxsep}
\DeclareRobustCommand{\highlightboxed}
{%
  \ifmmode%                                           Check for math mode.
    \expandafter\mathpalette\expandafter\math@hb@bidipres%  Math mode version needs to respect current style.
  \else
    \expandafter\text@hb@bidipres%                          Text mode version.
  \fi
}
\newcommand{\math@hb@bidipres}[2]{\text@hb@bidipres{$\m@th#1{#2}$}}
\ifthenelse{\boolean{colorhighlight@bidipres}}%                  Color highlighting enabled?
{%  Yes; use a box with colored background.
  \newcommand{\text@hb@bidipres}[1]
  {%
    \makebox[\width-2\highlightboxsep]%                    Make the frame stick out at the sides.
    {%
      \setlength{\fboxsep}{\highlightboxsep}%              Set frame size.
      \raisebox{0pt}[\height-\fboxsep][\depth-\fboxsep]%   Make the frame stick out above and below.
      {\colorbox{highlightcolor}{#1}}%                     Make colored box containing <text>.
      }%
    }%
  }% matches \ifthenelse{\boolean{colorhighlight@bidipres}}
{%  No; use an \fbox.
  \newcommand{\text@hb@bidipres}[1]
  {%
    \makebox[\width-2\highlightboxsep-2\fboxrule]%         Make the frame stick out at the sides.
    {%
      \setlength{\fboxsep}{\highlightboxsep}%              Set frame size.
      \raisebox{0pt}[\height-\fboxsep-\fboxrule][\depth-\fboxsep-\fboxrule]% Make the frame stick out above and below.
      {\fbox{#1}}%%                                        Make an fbox containing <text>.
      }%
    }%
  }% matches second argument of \ifthenelse{\boolean{colorhighlight@bidipres}}

\ifthenelse{\boolean{bidiprescolor}}% Can we use colors at all?
{% Yes.
  \newcommand{\highlightenhanced}[1]%             Make argument appear in `enhanced' colors.
  {%
    {% A group makes the color changes local.
      \ifthenelse{\boolean{instepwise@bidipres}}{\usecolorset{stwcolors}}{}% Just in case we currently are in enhanced mode...
      \enhancecolors%          Enhance colors.
      \commitcolor@bidipres{#1}%     Switch on enhanced color.
      }%
    }%
  }
{\let\highlightenhanced=\displayidentical}% No. Disable this command.
\newcommand{\pickup@s@optargs@bidipres}
{%
  \@ifnextchar[%]            Check for first optional argument in [...] syntax.
  {\f@brackstep@bidipres}%
  {%
    \@ifnextchar(%)          Check for first optional argument in (...) syntax.
    {\f@parenstep@bidipres}
    {\f@brackstep@bidipres[]}%     No optional argument given; call with empty argument in [...] syntax (default).
    }%
}

\def\f@brackstep@bidipres[#1]%     First optional argument was given in [...] syntax.
{%
  \def\tmp@bidipres{#1}%
  \ifx\tmp@bidipres\empty%         Optional argument empty?
    \def\f@step@bidiprescheck{\ifthenelse{\value{step}=\value{stepcommand}}}% Yes; use default.
   \else
    \def\f@step@bidiprescheck{\ifthenelse{#1}}% No; condition is defined via \ifthenelse.
  \fi
  \f@step@bidipres%                Go on and check for second optional argument.
}

\def\f@parenstep@bidipres(#1)%     First optional argument was given in (...) syntax.
{%
  \def\f@step@bidiprescheck{#1}%   Save condition (given as argument).
  \f@step@bidipres%                Go on and check for second optional argument.
  }

\newcommand{\f@step@bidipres}%     Pick up the second optional argument.
{%
  \@ifnextchar[%]            Check for second optional argument in [...] syntax.
  {\s@brackstep@bidipres}
  {%
    \@ifnextchar(%)          Check for second optional argument in (...) syntax.
    {\s@parenstep@bidipres}
    {\s@parenstep@bidipres(\if@first@bidipres@true)}% No second optional argument given;
    }%                                    call with \if@first@bidipres@true in (...) syntax (default).
}

\def\s@brackstep@bidipres[#1]%     Second optional argument was given in [...] syntax.
{%
  \def\s@step@bidiprescheck{\ifthenelse{#1}}% Condition is defined via \ifthenelse.
  \@do@s@bidipres%                Go on.
  }

\def\s@parenstep@bidipres(#1)%     Second optional argument was given in (...) syntax.
{%
  \def\s@step@bidiprescheck{#1}%   Save condition (given as argument).
  \@do@s@bidipres%                Go on.
  }
\newcommand{\deactivate@inner@bidipres}% \switch behaviour.
{%
  \let\inner@display@bidipres=\displayidentical%
  \let\inner@hide@bidipres=\displayidentical%
  }

\newcommand{\activate@inner@bidipres}% \step behaviour.
{%
  \let\inner@display@bidipres=\displaystepcontents%
  \let\inner@hide@bidipres=\hidestepcontents%
  }
\@onlyinstepwise@bidipres\step
\newcommand{\proper@step@bidipres}{\let\@do@s@bidipres=\@step@bidipres\pickup@s@optargs@bidipres}
\newcommand{\@step@bidipres}[1]{\activate@inner@bidipres\@@switch@bidipres{#1}{#1}}
\@onlyinstepwise@bidipres\switch
\newcommand{\proper@switch@bidipres}{\deactivate@inner@bidipres\let\@do@s@bidipres=\@@switch@bidipres\pickup@s@optargs@bidipres}
\newcommand{\if@first@bidipres@true}[2]%
{%
  \expandafter                   % \first@bidipres@<n> is set to \@undefined if \switch command number <n> has not yet been
  \ifx\csname first@bidipres@\the\c@stepcommand\endcsname\empty%                            activated and \empty otherwise.
    #1%
   \else
    #2%
  \fi
  }
\@ifundefined{ifmeasuring@}{\newif\ifmeasuring@}{}
\newcommand{\@switch@bidipres}[2]
{%
  \global\advance\c@stepcommand by 1\relax% This execution of \switch is counted.
  \setboolean{instep@bidipres}{true}%             Set indicator.
  %
  % If the verbose option is set, type out some accounting information which can be used for debugging.
  \ifthenelse{\boolean{verbose@bidipres}}
  {%
    \ClassInfo{bidipresentation}
    {Step: \the\c@step, Stepcommand: \the\c@stepcommand,\MessageBreak Stepsperformed: \the\c@stepsperformed}%
    }
  {}%
  %
  \f@step@bidiprescheck% Is this step to be activated? \f@step@bidiprescheck is defined by the first optional argument of \switch.
  {% Yes.
    \if@first@bidipres@true{}% For non-unique conditions given as optional argument or when \reswitch is used, it might happen
    {%       that \first@bidipres@\value{stepcommand} is already set. In this case, don't advance the counter stepsperformed.
      \ifmeasuring@\else% Do nothing in AMSLaTeX's measuring pass for aligned equations.
        \global\expandafter\let\csname first@bidipres@\the\c@stepcommand\endcsname=\empty% Set \first@bidipres@\value{stepcommand}
      \fi
      \global\advance\c@stepsperformed by 1\relax% Advance the counter for `real' first activations.
      \gdef\current@step@bidipres{#2}%
      }%
    \setboolean{firstactivation}{true}% This switch can be tested in <stepcontents>, but also in <whenactive>.
    }
  {% No.
    \setboolean{firstactivation}{false}% This switch can be tested in <stepcontents>, but also in <whenactive>.
    }% End of \f@step@bidiprescheck
  %
  \let\o@afterstep@bidipres=\afterstep% We need to save the current definition of \afterstep.
  %
  \s@step@bidiprescheck% Is this step active? \s@step@bidiprescheck is defined by the second optional argument of \switch.
  {% Yes.
    \setboolean{active}{true}%               Make this fact known to the user.
    \ifthenelse{\boolean{firstactivation}}
    {\inner@display@bidipres{\activatestep{#2}}}%  `First' display of <stepcontents>.
    {\inner@display@bidipres{#2}}%                 Display <stepcontents>.
    }
  {% No.
    \setboolean{active}{false}%              Make this fact known to the user.
    \let\afterstep=\@gobble%                 Don't execute \afterstep here.
    \ifthenelse{\boolean{firstactivation}}
    {\inner@hide@bidipres{\activatestep{#1}}}%     Hide <stepcontents>, but with `first activation'.
    {\inner@hide@bidipres{#1}}%                    Hide <stepcontents>.
    }% End of \s@step@bidiprescheck
  %
  \let\afterstep=\o@afterstep@bidipres%            Restore the definition of \afterstep.
  \setboolean{instep@bidipres}{false}%             Set indicator.
  }% End of the definition of \@switch@bidipres.
\@onlyinstepwise@bidipres\restep

\newcommand{\proper@restep@bidipres}
{%
  \global\advance\c@stepcommand by -1% This is done by simply counting \value{stepcommand} backwards.
  \proper@step@bidipres%                     Go on with \step.
  }
\@onlyinstepwise@bidipres\reswitch

\newcommand{\proper@reswitch@bidipres}
{%
  \global\advance\c@stepcommand by -1% This is done by simply counting \value{stepcommand} backwards.
  \proper@switch@bidipres%                     Go on with \switch.
  }
\@onlyinstepwise@bidipres\bstep

\newcommand{\proper@bstep@bidipres}{\let\@do@s@bidipres=\@bstep@bidipres\pickup@s@optargs@bidipres}
\newcommand{\@bstep@bidipres}[1]{{\boxedsteps\@step@bidipres{#1}}}
\@onlyinstepwise@bidipres\rebstep

\newcommand{\proper@rebstep@bidipres}
{%
  \global\advance\c@stepcommand by -1% This is done by simply counting \value{stepcommand} backwards.
  \proper@bstep@bidipres%                     Go on with \bstep.
  }
\ifthenelse{\boolean{colormath@bidipres}}% Should we color math?
{% Yes.
  \newcommand{\commitcolors@bidipres}
  {\xecolor{\ifmmode mathcolor\else textcolor\fi}}% Switch to mathcolor if in math mode, to textcolor otherwise.
  }
{% No.
  \newcommand{\commitcolors@bidipres}{\xecolor{textcolor}}% Switch to textcolor.
}

\@onlyinstepwise@bidipres\dstep

\newcommand{\proper@dstep@bidipres}{\deactivate@inner@bidipres\let\@do@s@bidipres=\@dstep@bidipres\pickup@s@optargs@bidipres}

\ifthenelse{\boolean{bidiprescolor}}% Can we use colors at all?
{% Yes.
  \newcommand{\@dstep@bidipres}{\@@switch@bidipres{\dimcolors\commitcolors@bidipres}{\set@color}}
  }
{\newcommand{\@dstep@bidipres}{\@@switch@bidipres{}{}}}% No. Disable this command.
\@onlyinstepwise@bidipres\redstep

\newcommand{\proper@redstep@bidipres}
{%
  \global\advance\c@stepcommand by -1% This is done by simply counting \value{stepcommand} backwards.
  \proper@dstep@bidipres%                     Go on with \dstep.
  }
\@onlyinstepwise@bidipres\vstep

\newcommand{\proper@vstep@bidipres}{\deactivate@inner@bidipres\let\@do@s@bidipres=\@vstep@bidipres\pickup@s@optargs@bidipres}

\ifthenelse{\boolean{bidiprescolor}}% Can we use colors at all?
{% Yes.
  \newcommand{\@vstep@bidipres}{\@@switch@bidipres{\vanishcolors\xecolor{textcolor}}{\set@color}}
  }
{\newcommand{\@vstep@bidipres}{\@@switch@bidipres{}{}}}% No. Disable this command.
\@onlyinstepwise@bidipres\revstep

\newcommand{\proper@revstep@bidipres}
{%
  \global\advance\c@stepcommand by -1% This is done by simply counting \value{stepcommand} backwards.
  \proper@vstep@bidipres%                     Go on with \vstep.
  }
\@onlyinstepwise@bidipres\steponce

\newcommand{\proper@steponce@bidipres}
{\@ifnextchar[{\brack@steponce@bidipres}{\@steponce@bidipres}}% Optional argument in square brackets?

\newcommand{\@steponce@bidipres}
{%
  \@ifnextchar(%%          Optional argument in parentheses?
  {\paren@steponce@bidipres}%
  {\brack@steponce@bidipres[]}%  [] is the default if no optional argument is given.
  }

\def\brack@steponce@bidipres[#1]%
{%
  \def\optarg@so@bidipres{[#1]}% Store optional argument for later re-insertion.
  \@@steponce@bidipres%          Proceed.
  }%

\def\paren@steponce@bidipres(#1){\def\optarg@so@bidipres{(#1)}\@@steponce@bidipres}
\newcommand{\@@steponce@bidipres}[1]{\expandafter\step\optarg@so@bidipres[\boolean{firstactivation}]{#1}}
\newcounter{substep}
\@onlyinstepwise@bidipres\multistep

\newcommand{\proper@multistep@bidipres}
{%
  \let\ns@ms@bidipres=\normalstep@ms@bidipres% Placeholder for `every step but the last one'.
  \let\nshook@ms@bidipres=\relax%        These hooks are used by \movie.
  \let\lshook@ms@bidipres=\relax
  \@ifstar%                        Starred version?
  {%
    \let\ls@ms@bidipres=\laststep@ms@bidipres% Last step acts differently.
    \multistep@bidipres%                 Collect optional argument and proceed.
    }
  {%
    \let\ls@ms@bidipres=\normalstep@ms@bidipres% Last step acts like all other steps.
    \multistep@bidipres%                   Collect optional argument and proceed.
    }%
  }

\newcommand{\multistep@bidipres}% Collect optional argument.
{\@ifnextchar[{\brack@multistep@bidipres}{\@multistep@bidipres}}% Optional argument in square brackets?

\newcommand{\@multistep@bidipres}
{%
  \@ifnextchar(%%          Optional argument in parentheses?
  {\paren@multistep@bidipres}%
  {\brack@multistep@bidipres[]}% [] is the default if no optional argument is given.
  }

\def\brack@multistep@bidipres[#1]%
{%
  \def\optarg@ms@bidipres{[#1]}% Store optional argument for later re-insertion.
  \@@multistep@bidipres%         Proceed.
  }%

\def\paren@multistep@bidipres(#1){\def\optarg@ms@bidipres{(#1)}\@@multistep@bidipres}

\newcommand{\normalstep@ms@bidipres}[1]
{%
  \expandafter\switch\optarg@ms@bidipres%  Re-insert optional argument.
  [\boolean{firstactivation}]{}{#1}% `normal' steps appear only once.
  }

\newcommand{\laststep@ms@bidipres}[1]
{\expandafter\switch\optarg@ms@bidipres{}{#1}}% In the starred version, the last step doesn't disappear.
\newcommand{\@@multistep@bidipres}[2]
{%
  \setcounter{substep}{0}%       Initialize substep counter.
  \whiledo{\value{substep}<#1}%  Iterate <n> times.
  {%
    \stepcounter{substep}%
    \ifthenelse{\value{substep}=#1}% Last step?
    {\ls@ms@bidipres{\lshook@ms@bidipres#2}}%    Execute single step (together with \movie hooks).
    {\ns@ms@bidipres{\nshook@ms@bidipres#2}}%
    }%
  }
\@onlyinstepwise@bidipres\movie

\newcommand{\proper@movie@bidipres}
{%
  \let\ns@ms@bidipres=\normalstep@ms@bidipres% Placeholder for `every step but the last one'.
  \def\nshook@ms@bidipres{\afterstep{\pageDuration{\dur@ms@bidipres}}}% Page duration to be used between steps.
  \def\lshook@ms@bidipres{\afterstep{\end@ms@bidipres}}%                Page duration setting after last step.
  \@ifstar%                        Starred version?
  {%
    \let\ls@ms@bidipres=\laststep@ms@bidipres% Last step acts differently.
    \movie@bidipres%                     Collect optional argument and proceed.
    }
  {%
    \let\ls@ms@bidipres=\normalstep@ms@bidipres% Last step acts like all other steps.
    \movie@bidipres%                       Collect optional argument and proceed.
    }%
  }

\newcommand{\movie@bidipres}% Collect optional argument.
{\@ifnextchar[{\brack@movie@bidipres}{\@movie@bidipres}}%        Optional argument in square brackets?

\newcommand{\@movie@bidipres}
{\@ifnextchar({\paren@movie@bidipres}{\brack@movie@bidipres[]}}% Optional argument in parentheses?

\def\brack@movie@bidipres[#1]{\def\optarg@ms@bidipres{[#1]}\@@movie@bidipres}% Store optional argument and proceed.
\def\paren@movie@bidipres(#1){\def\optarg@ms@bidipres{(#1)}\@@movie@bidipres}

\newcommand{\@@movie@bidipres}[2]% Collect <n> and <dur> arguments.
{\gdef\dur@ms@bidipres{#2}\gdef\nosteps@ms@bidipres{#1}\@@@movie@bidipres}

\newcommand{\@@@movie@bidipres}[1][\stopAdvancing]% Collect second optional argument and call body of \multistep.
{\gdef\end@ms@bidipres{#1}\@@multistep@bidipres{\nosteps@ms@bidipres}}
\@onlyinstepwise@bidipres\overlays

\providecommand{\proper@overlays@bidipres}
{\@ifnextchar[{\brack@overlays@bidipres}{\@overlays@bidipres}}% Optional argument in square brackets?

\newcommand{\@overlays@bidipres}
{%
  \@ifnextchar(%%          Optional argument in parentheses?
  {\paren@overlays@bidipres}%
  {\brack@overlays@bidipres[]}%  [] is the default if no optional argument is given.
  }

\def\brack@overlays@bidipres[#1]%
{%
  \def\optarg@ov@bidipres{[#1]}% Store optional argument for later re-insertion.
  \@@overlays@bidipres%          Proceed.
  }%

\def\paren@overlays@bidipres(#1){\def\optarg@ov@bidipres{(#1)}\@@overlays@bidipres}
\newcommand{\@@overlays@bidipres}[2]
{%
  \setcounter{substep}{1}%       Initialize substep counter.
  \leavevmode%                   Make sure that \rlap doesn't insert anything in the vertical list.
  \whiledo{\value{substep}<#1}%  Iterate <n-1> times (since we start at 1).
  {%
    \expandafter\switch\optarg@ov@bidipres{}{\ifthenelse{\boolean{firstactivation}}{\mbox{#2}}{\rlap{#2}}}%
    \stepcounter{substep}%
  }%
  \expandafter\switch\optarg@ov@bidipres{}{\mbox{#2}}% Always using \mbox for last overlay.
}
\newenvironment{stepcapsule}{}{}
\newcommand{\afterstep}[1]
{%
  \gdef\@afterstep@bidipres{#1}% The argument is simply stored in \@afterstep@bidipres, which is executed in \stepwise.
  }
\newcounter{o@fs@bidipres}
\newcommand{\stepwise}
{%
  \global\c@o@fs@bidipres=\c@firststep\relax%     Save the default value of counter firststep.
  \@ifstar%                                 Using the starred version?
  {% Yes.
    \c@firststep=1\relax%                   Start with counter step at number 1.
    \@stepwise@bidipres%                          Collect optional argument and proceed.
    }
  {% No.
    \@stepwise@bidipres%                          Use the default.
    }% End of \@ifstar.
  }%
\newcommand{\list@stepcapsule}
{%
  \renewenvironment{stepcapsule}%                    stepcapsule is to put an invisible rule on the vertical list.
  {\vspace*{\parskip}\hrule \@height\z@\relax}{}
  }%

\let\par@stepcapsule=\list@stepcapsule%              Identical for \parstepwise.
\newcommand{\liststepwise}
{%
  \@ifstar%                           Starred version?
  {\def\star@bidipres{*}\@liststepwise@bidipres}% Save star in \star@bidipres, collect optional argument and proceed.
  {\def\star@bidipres{}\@liststepwise@bidipres}%  Collect optional argument and proceed (non-starred version).
  }

\newcommand{\@liststepwise@bidipres}[1][]%  Collect optional argument.
{%
  \expandafter\stepwise\star@bidipres%                             Re-insert the star (if given).
  [%
    \list@stepcapsule%                                       Activate special stepcapsule.
    #1%                                                      Insert optional argument of \liststepwise.
    ]%
  }
\newcommand{\parstepwise}
{%
  \@ifstar%                           Starred version?
  {\def\star@bidipres{*}\@parstepwise@bidipres}%  Save star in \star@bidipres, collect optional argument and proceed.
  {\def\star@bidipres{}\@parstepwise@bidipres}%   Collect optional argument and proceed (non-starred version).
  }

\newcommand{\@parstepwise@bidipres}[1][]%  Collect optional argument.
{%
  \expandafter\stepwise\star@bidipres%     Re-insert the star (if given).
  [%
    \boxedsteps%                     Activate \boxedsteps.
    \par@stepcapsule%                Activate special stepcapsule.
    #1%                              Insert optional argument of \parstepwise.
    ]%
  }
\newcommand{\count@em@bidipres}[2]
{%
  \global\advance\c@stepcommand by 1\relax% We simply advance the number of \step commands...
  #2%                                     ... and execute the second argument (to find nested uses of \step).
}
\def\@nb@bidipresfalse{\global\let\if@nb@bidipres\iffalse}
\def\@nb@bidiprestrue{\global\let\if@nb@bidipres\iftrue}
\newtoks\ep@bidipres
\def\savecounters@bidipres{%
  \begingroup
    \def\@elt##1{\global\csname c@##1\endcsname\the\csname c@##1\endcsname}%
    \xdef\restorecounters@bidipres{\cl@@ckpt}%
  \endgroup
  \if@nobreak\@nb@bidiprestrue\else\@nb@bidipresfalse\fi
  \global\ep@bidipres\everypar
  }
\def\savebidiprescounters@bidipres{%
  \begingroup
    \def\@elt##1{\global\csname c@##1\endcsname\the\csname c@##1\endcsname}%
    \xdef\restorebidiprescounters@bidipres{\cl@@ckpt@bidipres}%
  \endgroup
  }
\def\cl@@ckpt@bidipres{\@elt{totalsteps}\@elt{firststep}\@elt{step}\@elt{stepcommand}\@elt{stepsperformed}\@elt{o@fs@bidipres}}
\newcommand{\releasecounter}[1]%
{\expandafter\def\expandafter\cl@@ckpt@bidipres\expandafter{\cl@@ckpt@bidipres\@elt{#1}}}
\newcommand{\disable@counting@bidipres}
{%
  \let\afterstep=\@gobble
  \renewcommand{\backgroundstyle}[2][]{}%
  \renewcommand{\@@vgradrule@bidipres}[3][0pt]{}%
  \renewcommand{\@@@@dblvgradrule@bidipres}[3][0pt]{}%
  \renewcommand{\@@hgradrule@bidipres}[3][0pt]{}%
  \renewcommand{\@@@@dblhgradrule@bidipres}[3][0pt]{}%
}
\newboolean{instepwise@bidipres}
\newboolean{instep@bidipres}
\newcommand{\@stepwise@bidipres}[2][]
{%
  \save@bidipres%                               Save the current contents of the page.
  \savecounters@bidipres%                       Save the values of all counters.
  \dumpcolorset{stwcolors}%               Make a copy of all color definitions.
  \begingroup%                            A group makes redefinitions local.
    \setboolean{instepwise@bidipres}{true}%     Set indicatior.
    \let\step\proper@step@bidipres%             By default, \step executes \proper@step@bidipres.
    \let\restep\proper@restep@bidipres%
    \let\bstep\proper@bstep@bidipres%
    \let\rebstep\proper@rebstep@bidipres%
    \let\dstep\proper@dstep@bidipres%
    \let\redstep\proper@redstep@bidipres%
    \let\vstep\proper@vstep@bidipres%
    \let\revstep\proper@revstep@bidipres%
    \let\steponce\proper@steponce@bidipres%
    \let\multistep\proper@multistep@bidipres%
    \let\movie\proper@movie@bidipres%
    \let\overlays\proper@overlays@bidipres%
    \let\switch\proper@switch@bidipres%         By default, \switch executes \proper@switch@bidipres.
    \let\reswitch\proper@reswitch@bidipres%
    \let\orig@mathchoice@bidipres=\mathchoice%  Save the current definition of \mathchoice...
    \def\mathchoice##1##2##3##4%          ... and redefine.
    {%
      \orig@mathchoice@bidipres%                The original definition of \mathchoice is called...
      {##1}%                              ... with the first argument untouched and in all other arguments, \step ...
      {\let\step\restep\let\bstep\rebstep\let\dstep\redstep\let\vstep\revstep\let\switch\reswitch##2}% ... redefined ...
      {\let\step\restep\let\bstep\rebstep\let\dstep\redstep\let\vstep\revstep\let\switch\reswitch##3}% ... to execute ...
      {\let\step\restep\let\bstep\rebstep\let\dstep\redstep\let\vstep\revstep\let\switch\reswitch##4}% ... \restep.
      }%
    %
    \c@stepcommand=0\relax%               Initialize the counter for \step commands.
    \let\@@switch@bidipres=\count@em@bidipres%        Next, we count the \step commands in <contents>...
    \setbox\tempbox@bidipres%                    ... by putting <contents> into a \vbox (which is then discarded).
    =\vbox
    {%
      \hfuzz\maxdimen\hbadness\@M\relax%  No bogus `overfull \hbox' warnings.
      \disable@counting@bidipres#2%             Inside the \vbox, some commands are redefined for safety and efficiency.
    }%
    \c@totalsteps=\c@stepcommand%         Now, we know the total number of \step commands.
    %
    % Next, we have to reset \first@bidipres@<n> for <n>=0...\value{totalsteps}.
    \c@step=0\relax
    \loop
     \ifnum\c@step<\c@totalsteps
      \advance\c@step by 1\relax
      \expandafter\let\csname first@bidipres@\the\c@step\endcsname=\@undefined% \first@bidipres@<n>=\@undefined means step <n>
                                                                        % hasn't yet been activated.
    \repeat
    #1%
    %
    \c@step=\c@firststep%                   Set the counter for the current step to its starting value...
    \c@stepsperformed=0\relax%              ... and also the counter for the \step commands which are already activated.
    \let\@@switch@bidipres=\@switch@bidipres%           \step will now act normally.
    \ifthenelse{\boolean{verbose@bidipres}}%      Some accounting info (if verbose option is set).
    {\ClassInfo{bidipresentation}{Total number of step commands: \the\c@totalsteps}}
    {}%
    %
    \ifthenelse{\boolean{display}}%         Are dynamic features enabled?
    {}% Yes.
    {%  No. Do only one loop.
      \c@stepsperformed=\c@totalsteps%      Set everything up for the last loop.
      \c@step=0\relax%                      Set \first@bidipres@<n> for <n>=0...\value{totalsteps}.
      \loop
       \ifnum\c@step<\c@totalsteps
        \advance\c@step by 1\relax
        \expandafter\let\csname first@bidipres@\the\c@step\endcsname=\@empty% \first@bidipres@<n>=\@empty means step <n>
                                                                      % has already been activated.
      \repeat
      \advance\c@step by 1\relax%           This way, the last step won't think it's `first activated'.
      }%
    \let\insertdup@bidipres=\insertfirstduplicate@bidipres% Setup command to restore page contents for the first time.
    \loop%                                  This is the central loop.
      \c@stepcommand=0\relax%               Initialize the counter for the current \step command.
      \savebidiprescounters@bidipres%                   Save the `stepwise-specific' counters.
      \restorecounters@bidipres%                  Restore the `original' values of all counters...
      \restorebidiprescounters@bidipres%                ... and the current values of the `stepwise-specific' counters.
      \let\@afterstep@bidipres=\relax%            Reset the container for \afterstep.
      %
      \insertdup@bidipres%                        Insert saved page contents.
      \begin{stepcapsule}%                  This is usually empty, but may start a minipage (or whatever).
        \usecolorset{stwcolors}%            Restore colors to state at the beginning of \stepwise.
        \if@nb@bidipres\@nobreaktrue\else\@nobreakfalse\fi
        \global\everypar\ep@bidipres
        #2%                                 Execute <contents>
      \end{stepcapsule}%
      %
      \@afterstep@bidipres%                       Whatever has been saved with \afterstep is now executed.
     \ifnum\c@stepsperformed<\c@totalsteps% Doing one more round?
      \outputduplicate@bidipres%                  Shipout this page and round we go again.
      \let\insertdup@bidipres=\insertsecondduplicate@bidipres% Setup command to restore page contents for subsequent times.
      \advance\c@step by 1\relax%           Round we go again
    \repeat
  \endgroup
  \global\c@firststep=\c@o@fs@bidipres\relax%     Restore default value of counter firststep.
}
\newenvironment{fragilesteps}{%
  \def\bidipresentation@verbatimfilename{\jobname-bidipresentation.vrb}%
  \immediate\openout\bidipresentation@verbatimfileout=\bidipresentation@verbatimfilename%
  \bidipresentation@verbatimreadframe%
}
{%
  \immediate\closeout\bidipresentation@verbatimfileout%
  \stepwise{\input{\bidipresentation@verbatimfilename}}%
}
\newwrite\bidipresentation@verbatimfileout

\def\bidipresentation@verbatimreadframe{%
  \begingroup%
  \let\do\@makeother\dospecials%
  \count@=127%
  \@whilenum\count@<255 \do{%
    \advance\count@ by 1%
    \catcode\count@=11%
  }%
  \@makeother\^^L% and whatever other special cases
  \endlinechar`\^^M \catcode`\^^M=12 \bidipresentation@processframefirstline}

{\catcode`\^^M=12\endlinechar=-1%
  \long\gdef\bidipresentation@processframefirstline#1^^M{%
    \def\bidipresentation@test{#1}%
    \ifx\bidipresentation@test\bidipresentation@stopframefirst%
      \let\next=\bidipresentation@endfragilesteps%
    \else
      \ifx\bidipresentation@test\@empty%
      \else%
        \@temptokena={#1}%
        \immediate\write\bidipresentation@verbatimfileout{\the\@temptokena}%
      \fi%
      \let\next=\bidipresentation@processframeline%
    \fi%
    \next%
  }
  \long\gdef\bidipresentation@processframeline#1^^M{%
    \def\bidipresentation@test{#1}%
    \ifx\bidipresentation@test\bidipresentation@stopframe%
      \let\next=\bidipresentation@endfragilesteps%
    \else
      \immediate\write\bidipresentation@verbatimfileout{#1}%
    \fi%
    \next%
  }
}

{
  \escapechar=-1\relax%
  \xdef\bidipresentation@stopframe{\string\\end\string\{fragilesteps\string\}}
  \xdef\bidipresentation@stopframefirst{\noexpand\end\string\{fragilesteps\string\}}
}

\def\bidipresentation@endfragilesteps{\endgroup\end{fragilesteps}}

\newboolean{bidipresl@paralist}
\@ifpackageloaded{paralist}{\setboolean{bidipresl@paralist}{true}}{}
\newboolean{bidipresl@eqlist}
\@ifpackageloaded{eqlist}{\setboolean{bidipresl@eqlist}{true}}{}
\newboolean{bidipresl@pausestep}
\DeclareOption{pausestep}{\setboolean{bidipresl@pausestep}{true}}
\newboolean{bidipresl@noflipendstep}
\DeclareOption{noflipendstep}{\setboolean{bidipresl@noflipendstep}{true}}

\ProcessOptions
\define@key{bidipresl}{pausestep}[true]{%
  \setboolean{bidipresl@pausestep}{#1}
}
\define@key{bidipresl}{noflipendstep}[true]{%
  \setboolean{bidipresl@noflipendstep}{#1}
}
\newcommand*{\bidipreslsetup}{\setkeys{bidipresl}}
\newif\ifbidipresl@instepenv \bidipresl@instepenvfalse
\newif\ifbidipresl@inpausestepenv \bidipresl@inpausestepenvfalse
\newif\ifbidipresl@indimenv  \bidipresl@indimenvfalse
\newif\ifbidipresl@inflipenv \bidipresl@inflipenvfalse
\let\oldenumerate=\enumerate
\let\olditemize=\itemize
\let\olddescription=\description
\let\endoldenumerate=\endenumerate
\let\endolditemize=\enditemize
\let\endolddescription=\enddescription
\ifthenelse{\boolean{bidipresl@eqlist}}{%
\let\oldeqlist=\eqlist
\let\endoldeqlist=\endeqlist
}{}
\ifthenelse{\boolean{bidipresl@paralist}}{%
\let\oldcompactenum=\compactenum
\let\oldcompactitem=\compactitem
\let\endoldcompactenum=\endcompactenum
\let\endoldcompactitem=\endcompactitem
}{}
\let\bidipresl@nx\noexpand
\let\bidipresl@xp\expandafter
\newtoks\bidipresl@emptytoks
\newtoks\bidipresl@envbody
\long\def\bidipresl@addto@envbody#1{\global\bidipresl@envbody\bidipresl@xp{\the\bidipresl@envbody#1}}
\def\bidipresl@collect@body#1{%
  \bidipresl@envbody{\bidipresl@xp#1\bidipresl@xp{\the\bidipresl@envbody}}%
  \edef\bidipresl@process@envbody{\the\bidipresl@envbody\bidipresl@nx\end{\@currenvir}}%
  \bidipresl@envbody\bidipresl@emptytoks \def\begin@stack{b}%
  \begingroup
  \bidipresl@xp\let\csname\@currenvir\endcsname\bidipresl@collect@@body
  \edef\bidipresl@process@envbody{\bidipresl@xp\bidipresl@nx\csname\@currenvir\endcsname}%
  \bidipresl@process@envbody
}
\long\def\bidipresl@push@begins#1\begin#2{%
  \ifx\end#2\else b\bidipresl@xp\bidipresl@push@begins\fi
}
\long\def\bidipresl@collect@@body#1\end#2{%
  \edef\begin@stack{\bidipresl@push@begins#1\begin\end \bidipresl@xp\@gobble\begin@stack}%
  \ifx\@empty\begin@stack
    \endgroup
    \@checkend{#2}%
    \bidipresl@addto@envbody{#1}%
  \else
    \bidipresl@addto@envbody{#1\end{#2}}%
  \fi
  \bidipresl@process@envbody
}
\def\bidipresl@addmargin#1{%
  \advance\@listdepth 1
  \addtolength{\csname leftmargin\romannumeral\@listdepth\endcsname}{#1}
  \advance\@listdepth -1
}

\ifthenelse{\boolean{display}}{%
\ifthenelse{\boolean{bidiprescolor}}% Can we use colors?
{% Yes. In this case highlighting is implemented by switching color.
  \def\bidipresl@flipstep{%
    \step{\ifthenelse{\boolean{firstactivation}}%
      {\xecolor{textcolor}}%
      {\xecolor{inactivecolor}}%
    }%
  }%
}
{% No. In this case highlighting is implemented by putting the item in boldface.
  \def\bidipresl@flipstep{%
    \step{\ifthenelse{\boolean{firstactivation}}{\bfseries}{\mdseries}}
  }%
}
\ifthenelse{\boolean{bidiprescolor}}% Can we use colors?
{% Yes. In this case highlighting is implemented by using \dstep
  \def\bidipresl@dimstep{\dstep}%
}
{% No. In this case highlighting is implemented by putting the item in boldface.
  \def\bidipresl@dimstep{%
    \step{\bfseries}%
    \ifthenelse{\boolean{active}}{}{\mdseries}%
  }%
}
\ifthenelse{\boolean{bidiprescolor}}% Can we use colors?
{% Yes. In this case stepping is implemented by using \vstep
  \def\bidipresl@step{\vstep}%
}
{% No. In this case stepping is implemented using \pause
  \def\bidipresl@step{\pause}%
}
}{% \boolean{display} is false
\def\bidipresl@flipstep{\relax}%
\def\bidipresl@dimstep{\relax}%
\def\bidipresl@step{\relax}%
}
\newenvironment{flipitem}[1][0cm]{%
  \bidipresl@addmargin{#1}
  \bidipresl@collect@body\@flipitem}%
 {\global\@ignoretrue}
\newenvironment{flipdesc}[1][0cm]{%
  \bidipresl@addmargin{#1}
  \bidipresl@collect@body\@flipdesc}%
 {\global\@ignoretrue}
\newenvironment{flipenum}[1][0cm]{%
  \bidipresl@addmargin{#1}
  \bidipresl@collect@body\@flipenum}%
 {\global\@ignoretrue}
\ifthenelse{\boolean{bidipresl@eqlist}}{%
\newenvironment{flipeqlist}[1][0cm]{%
  \bidipresl@collect@body\@flipeqlist}%
 {\global\@ignoretrue}
\newenvironment{flipcompacteqlist}[1][0cm]{%
  \bidipresl@collect@body\@flipcompacteqlist}%
 {\global\@ignoretrue}
}{}
\ifthenelse{\boolean{bidipresl@paralist}}{%
\newenvironment{flipcompactitem}[1][0cm]{%
  \bidipresl@addmargin{#1}
  \bidipresl@collect@body\@flipcompactitem}%
 {\global\@ignoretrue}
\newenvironment{flipcompactenum}[1][0cm]{%
  \bidipresl@addmargin{#1}
  \bidipresl@collect@body\@flipcompactenum}%
 {\global\@ignoretrue}
}{}

\newcommand\@fliplist[2]{%
  \ifbidipresl@indimenv
    \ClassError{bidipresentation}{%
      dim* and flip* environments do NOT nest}{%
      Do not continue! Type 'q' to stop and fix the nested list.
    }
  \else\ifbidipresl@instepenv
    \begin{#1}
    \let\hidestepcontents=\displaystepcontents
    \renewcommand{\item}{\bidipresl@flipstep\bidipresl@origitem}%
    #2
    \end{#1}%
  \else
    \ifbidipresl@inpausestepenv\let\liststepwise=\stepwise\fi
    \liststepwise[\let\hidestepcontents=\displaystepcontents]{%
      \begin{#1}
      \ifbidipresl@inpausestepenv\else
        \ifbidipresl@instepenv\else\let\bidipresl@origitem=\item\fi
      \fi
      \bidipresl@instepenvtrue
      \bidipresl@inflipenvtrue
      \renewcommand{\item}{\bidipresl@flipstep\bidipresl@origitem}%
      #2
      \ifthenelse{\boolean{bidipresl@noflipendstep}}{}{\step{}}%
      \end{#1}}
  \fi\fi
}

\newcommand\@flipitem[1]{%
 \@fliplist{olditemize}{#1}}
\newcommand\@flipdesc[1]{%
 \@fliplist{olddescription}{#1}}
\newcommand\@flipenum[1]{%
 \@fliplist{oldenumerate}{#1}}
\ifthenelse{\boolean{bidipresl@eqlist}}{%
\newcommand\@flipeqlist[1]{%
 \@fliplist{oldeqlist}{#1}}
\newcommand\@flipcompacteqlist[1]{%
 \@fliplist{compacteqlist}{#1}}
}{}
\ifthenelse{\boolean{bidipresl@paralist}}{%
\newcommand\@flipcompactitem[1]{%
 \@fliplist{oldcompactitem}{#1}}
\newcommand\@flipcompactenum[1]{%
 \@fliplist{oldcompactenum}{#1}}
}{}
\newenvironment{dimitem}[1][0cm]{%
  \bidipresl@addmargin{#1}
  \bidipresl@collect@body\@dimitem}%
 {\global\@ignoretrue}
\newenvironment{dimdesc}[1][0cm]{%
  \bidipresl@addmargin{#1}
  \bidipresl@collect@body\@dimdesc}%
 {\global\@ignoretrue}
\newenvironment{dimenum}[1][0cm]{%
  \bidipresl@addmargin{#1}
  \bidipresl@collect@body\@dimenum}%
 {\global\@ignoretrue}
\ifthenelse{\boolean{bidipresl@eqlist}}{%
\newenvironment{dimeqlist}[1][0cm]{%
  \bidipresl@collect@body\@dimeqlist}%
 {\global\@ignoretrue}
\newenvironment{dimcompacteqlist}[1][0cm]{%
  \bidipresl@collect@body\@dimcompacteqlist}%
 {\global\@ignoretrue}
}{}
\ifthenelse{\boolean{bidipresl@paralist}}{%
\newenvironment{dimcompactitem}[1][0cm]{%
  \bidipresl@addmargin{#1}
  \bidipresl@collect@body\@dimcompactitem}%
 {\global\@ignoretrue}
\newenvironment{dimcompactenum}[1][0cm]{%
  \bidipresl@addmargin{#1}
  \bidipresl@collect@body\@dimcompactenum}%
 {\global\@ignoretrue}
}{}

\newcommand\@dimlist[2]{%
  \ifbidipresl@inflipenv
    \ClassError{bidipresentation}{%
      dim* and flip* environments do NOT nest}{%
      Do not continue! Type <q> to stop and fix the nested list.
    }
  \else\ifbidipresl@instepenv
    \begin{#1}
    \renewcommand{\item}{\bidipresl@dimstep\bidipresl@origitem}%
    #2
    \end{#1}%
  \else
    \ifbidipresl@inpausestepenv\let\liststepwise=\stepwise\fi
    \liststepwise{%
      \begin{#1}
      \ifbidipresl@inpausestepenv\else
        \ifbidipresl@instepenv\else\let\bidipresl@origitem=\item\fi
      \fi
      \bidipresl@instepenvtrue
      \bidipresl@indimenvtrue
      \renewcommand{\item}{\bidipresl@dimstep\bidipresl@origitem}%
      #2
      \end{#1}}
  \fi\fi
}

\newcommand\@dimitem[1]{%
 \@dimlist{olditemize}{#1}}
\newcommand\@dimdesc[1]{%
 \@dimlist{olddescription}{#1}}
\newcommand\@dimenum[1]{%
 \@dimlist{oldenumerate}{#1}}
\ifthenelse{\boolean{bidipresl@eqlist}}{%
\newcommand\@dimeqlist[1]{%
 \@dimlist{oldeqlist}{#1}}
\newcommand\@dimcompacteqlist[1]{%
 \@dimlist{compacteqlist}{#1}}
}{}
\ifthenelse{\boolean{bidipresl@paralist}}{%
\newcommand\@dimcompactitem[1]{%
 \@dimlist{oldcompactitem}{#1}}
\newcommand\@dimcompactenum[1]{%
 \@dimlist{oldcompactenum}{#1}}
}{}
\newenvironment{stepitem}[1][0cm]{%
  \bidipresl@addmargin{#1}
  \bidipresl@collect@body\@stepitem}%
 {\global\@ignoretrue}
\newenvironment{stepdesc}[1][0cm]{%
  \bidipresl@addmargin{#1}
  \bidipresl@collect@body\@stepdesc}%
 {\global\@ignoretrue}
\newenvironment{stepenum}[1][0cm]{%
  \bidipresl@addmargin{#1}
  \bidipresl@collect@body\@stepenum}%
 {\global\@ignoretrue}
\ifthenelse{\boolean{bidipresl@eqlist}}{%
\newenvironment{stepeqlist}[1][0cm]{%
  \bidipresl@collect@body\@stepeqlist}%
 {\global\@ignoretrue}
\newenvironment{stepcompacteqlist}[1][0cm]{%
  \bidipresl@collect@body\@stepcompacteqlist}%
 {\global\@ignoretrue}
}{}
\ifthenelse{\boolean{bidipresl@paralist}}{%
\newenvironment{stepcompactitem}[1][0cm]{%
  \bidipresl@addmargin{#1}
  \bidipresl@collect@body\@stepcompactitem}%
 {\global\@ignoretrue}
\newenvironment{stepcompactenum}[1][0cm]{%
  \bidipresl@addmargin{#1}
  \bidipresl@collect@body\@stepcompactenum}%
 {\global\@ignoretrue}
}{}
\newcommand\@steplist[2]{%
\ifthenelse{\boolean{bidipresl@pausestep}}{%
  \ifbidipresl@inflipenv
    \ClassError{bidipresentation}{%
      flip* followed by step* environment does NOT work \MessageBreak
      when the pausestep option is used}{%
      Do not continue! Type <q> to stop and fix the nested list.
    }
  \else\ifbidipresl@indimenv
    \ClassError{bidipresentation}{%
      dim* followed by step* environment does NOT work \MessageBreak
      when the pausestep option is used}{%
      Do not continue! Type <q> to stop and fix the nested list.
    }
  \else
    \begin{#1}
      \ifbidipresl@inpausestepenv\else\let\bidipresl@origitem=\item\fi
      \bidipresl@inpausestepenvtrue
      \renewcommand{\item}{\pause\bidipresl@origitem}%
      #2
    \end{#1}
  \fi\fi
}{
  \ifbidipresl@inflipenv
    \begin{#1}
    \renewcommand{\item}{\bidipresl@flipstep\bidipresl@origitem}
    #2
    \end{#1}%
  \else\ifbidipresl@indimenv
    \begin{#1}
    \renewcommand{\item}{\dstep\bidipresl@origitem}%
    #2
    \end{#1}%
  \else\ifbidipresl@instepenv
    \begin{#1}
    \renewcommand{\item}{\bidipresl@step\bidipresl@origitem}%
    #2
    \end{#1}%
  \else
    \liststepwise{%
      \begin{#1}
      \ifbidipresl@instepenv\else\let\bidipresl@origitem=\item\fi
      \bidipresl@instepenvtrue
      \renewcommand{\item}{\bidipresl@step\bidipresl@origitem}%
      #2
      \end{#1}}
  \fi\fi\fi
}
}

\newcommand\@stepitem[1]{%
 \@steplist{olditemize}{#1}}
\newcommand\@stepdesc[1]{%
 \@steplist{olddescription}{#1}}
\newcommand\@stepenum[1]{%
 \@steplist{oldenumerate}{#1}}
\ifthenelse{\boolean{bidipresl@eqlist}}{%
\newcommand\@stepeqlist[1]{%
 \@steplist{oldeqlist}{#1}}
\newcommand\@stepcompacteqlist[1]{%
 \@steplist{compacteqlist}{#1}}
}{}
\ifthenelse{\boolean{bidipresl@paralist}}{%
\newcommand\@stepcompactitem[1]{%
 \@steplist{oldcompactitem}{#1}}
\newcommand\@stepcompactenum[1]{%
 \@steplist{oldcompactenum}{#1}}
}{}
\newenvironment{compacteqlist}[1][0cm]{%
  % \bidipresl@addmargin{#1}
  \begin{eqlist}[\parsep0pt\itemsep0pt]}%
 {\end{eqlist}}
\renewenvironment{enumerate}[1][0cm]{%
  \bidipresl@addmargin{#1}
  \begin{oldenumerate}
    \ifbidipresl@instepenv
      \renewcommand{\item}{\bidipresl@origitem}%
    \fi
 }%
 {\end{oldenumerate}}

\renewenvironment{itemize}[1][0cm]{%
  \bidipresl@addmargin{#1}
  \begin{olditemize}
    \ifbidipresl@instepenv
      \renewcommand{\item}{\bidipresl@origitem}%
    \fi
 }%
 {\end{olditemize}}

\renewenvironment{description}[1][0cm]{%
  % \bidipresl@addmargin{#1} % Has no effect - FIXME
  \begin{olddescription}
    \ifbidipresl@instepenv
      \renewcommand{\item}{\bidipresl@origitem}%
    \fi
 }%
 {\end{olddescription}}
\ifthenelse{\boolean{bidipresl@paralist}}{%
\renewenvironment{compactenum}[1][0cm]{%
  \bidipresl@addmargin{#1}
  \begin{oldcompactenum}
    \ifbidipresl@instepenv
      \renewcommand{\item}{\bidipresl@origitem}%
    \fi
 }%
 {\end{oldcompactenum}}

\renewenvironment{compactitem}[1][0cm]{%
  \bidipresl@addmargin{#1}
  \begin{oldcompactitem}
    \ifbidipresl@instepenv
      \renewcommand{\item}{\bidipresl@origitem}%
    \fi
 }%
 {\end{oldcompactitem}}
}{}
\endinput
%%
%% End of file `bidipresentation.cls'.

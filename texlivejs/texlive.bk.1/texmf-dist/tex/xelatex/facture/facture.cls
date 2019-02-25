%%
%% This is file `facture.cls',
%% generated with the docstrip utility.
%%
%% The original source files were:
%%
%% facture.dtx  (with options: `facture')
%% 
%% Droit d'auteur : Maïeul Rouquette 2011,
%% Licence Creative Commons - Paternité - Partage des Conditions Initiales à l'identique
%% http://creativecommons.org/licenses/by-sa/2.0/fr/
%% 
\NeedsTeXFormat{LaTeX2e}
\ProvidesClass{facture}[2017/04/12/04 v1.2.2]
\LoadClass[a4paper]{article}%On se base sur la classe article
\RequirePackage{fontspec}
\RequirePackage{xunicode}
\RequirePackage{polyglossia}
\setmainlanguage{french}
\RequirePackage{numprint}%Pour gérer l'affichage des nombres
\RequirePackage{fltpoint}% Pour faire les calculs dans le tableau
\RequirePackage{tikz} % tikz est utilisé pour tracer des boites, par exemple
\RequirePackage{graphicx} % Pour insérer des images. Utiliser le format jpg pour plus de simplicité.
\RequirePackage{fancyhdr} % Pour entête et pied de page
\RequirePackage{array}
\RequirePackage{longtable}
\RequirePackage{colortbl}
\RequirePackage{advdate}%Pour manipuler les dates
\RequirePackage{xargs}%Pour des arguments conditionnels
\newif\ifsansTVA
\DeclareOption{sansTVA}{\sansTVAtrue}
\newif\ifsansremise
\DeclareOption{sansremise}{\sansremisetrue}
\ProcessOptions
\definecolor{entetes}{HTML}{888888}
\definecolor{encadre}{RGB}{111,111,111}
\newcommand{\libelle}[1]{\textcolor{entetes}{\textbf#1}}
\setlength{\tabcolsep}{1pt}
\newlength{\epaisseurcadre}
\setlength{\epaisseurcadre}{1.5mm}
\newcommand{\codeclient}{Code client :}
\newcommand{\datetxt}{Date:}
\newcommand{\datelimitetxt}{À payer avant:}
\newcommand{\facturation}{Facturation}
\newcommand{\facturetxt}{Facture}
\newcommand{\livraison}{Livraison}
\newcommand{\livraisonfacturation}{Livraison et Facturation}
\newcommand{\ntxt}{~n°}
\newcommand{\produit}{Produit}
\newcommand{\quantite}{Quantité}
\newcommand{\remise}{Remise}
\newcommand{\unite}{€}
\ifsansTVA%
    \newcommand{\tottxt}{Total}
    \newcommand{\prixtxt}{Prix}
    \newcommand{\postTotaux}{\hfill TVA non applicable, art. 293 B}
\else%
    \newcommand{\prixHT}{Prix HT}
    \newcommand{\TVAtxt}{TVA}
    \newcommand{\prixTTC}{Prix TTC}
    \newcommand{\totHTtxt}{Total HT}
    \newcommand{\totTVAtxt}{Total TVA}
    \newcommand{\totTTCtxt}{Total TTC}
    \newcommand{\postTotaux}{}
\fi
\newcommand{\largeurDescriptif}{0.2\textwidth}
\newcommand{\largeurTVA}{0.2\textwidth}
\ifsansremise
  \newcommand{\largeurChiffresAvecTVA}{\dimexpr (\textwidth-\largeurDescriptif-\largeurTVA)/4\relax}
  \newcommand{\largeurChiffres}{\dimexpr (\textwidth-\largeurDescriptif)/3 \relax}
\else
  \newcommand{\largeurChiffresAvecTVA}{\dimexpr (\textwidth-\largeurDescriptif-\largeurTVA)/5\relax}
  \newcommand{\largeurChiffres}{\dimexpr (\textwidth-\largeurDescriptif)/4 \relax}
\fi
\npaddmissingzero
\nprounddigits{2}
\def\@TVAdefaut{19,6}
\def\@type{\facturetxt}
\renewcommand{\date}[1]{\SetDate[#1]}
\newcommand{\TVAdefaut}[1]{\def\@TVAdefaut{#1}}
\newcommand{\datelimite}[1]{\def\@datelimite{#1}}
\newcommand{\dest}[1]{\def\@dest{#1}}
\newcommand{\fact}[1]{\def\@fact{#1}}
\newcommand{\adresseemet}[1]{\def\@adresseemet{#1}}
\newcommand{\nomemet}[1]{\def\@nomemet{#1}}
\newcommand{\type}[1]{\def\@type{#1}}
\newcommand{\numero}[1]{\def\@numero{#1}}
\newcommand{\codedest}[1]{\def\@codedest{#1}}

\newcommand{\entete}{

    \noindent\begin{tikzpicture}

        \noindent\node [font=\bf\Huge,text width=0.5\textwidth,text=entetes,text centered]{%
            \@nomemet%
        };

        \noindent\node (b)[xshift=0.5\textwidth,text width=0.5\textwidth, right]{%
            \@adresseemet%
        };
    \coordinate[xshift=-\textwidth-\epaisseurcadre,yshift=1ex] (a) at (b.north);
    \coordinate[xshift=-\epaisseurcadre,yshift=-1ex] (c) at (b.south);
    \draw[color=encadre,line width=\epaisseurcadre] (a) rectangle  (c);
    \end{tikzpicture}

    \vspace{3ex}

    \begin{flushright}

    {\Huge\libelle{\@type}}

    \end{flushright}

    \vspace{3ex}

    \begin{tikzpicture}

    \ifdef{\@fact}{
    \node[text width=0.33\textwidth,anchor=base]{
        \libelle{\facturation}

        \@fact
        };
    }{}

    \node[xshift=0.33\textwidth,text width=0.33\textwidth,anchor=base]{\ifdef{\@fact}{
            \libelle{\livraison}}
            {\libelle{\livraisonfacturation}}

        \@dest
    };
    \node[text width=0.33\textwidth,xshift=0.66\textwidth,anchor=base]{
        \libelle{{\datetxt}} \today    \\
        \ifdef{\@numero}{%
            \libelle{{\@type\ntxt}} \@numero
         \\
        }{}
        \ifdef{\@codedest}{%
            \libelle{{\codeclient}} \@codedest
        }{}
        \ifdef{\@datelimite}{\\\AdvanceDate[\@datelimite]\libelle{{\datelimitetxt}} \today}{}
    };

    \end{tikzpicture}

}
\ifsansTVA
    \xdef\tot{}
\else
    \xdef\totTVA{}
    \xdef\totHT{}
    \xdef\totTTC{}
\fi
\newcolumntype{P}[1]{>{\raggedleft}p{#1}}
\newenvironment{facture}{%
    \setlength{\extrarowheight}{0.5ex}
    \setlength{\tabcolsep}{0.5em}
 \edef\@largeurDescriptif{\dimexpr\largeurDescriptif -2\tabcolsep\relax}
 \edef\@largeurChiffres{\dimexpr\largeurChiffres -2\tabcolsep\relax}
 \edef\@largeurTVA{\dimexpr\largeurTVA -2\tabcolsep\relax}
 \edef\@largeurChiffresAvecTVA{\dimexpr\largeurChiffresAvecTVA -2\tabcolsep\relax}
    \arrayrulecolor{encadre}
    \ifsansTVA%
        \ifsansremise%
        \begin{longtable}{%
        |p{\@largeurDescriptif}%Descriptif
        |P{\@largeurChiffres}%Qt
        |P{\@largeurChiffres}%Prix
        |P{\@largeurChiffres}|%Total
        }%
        \hline%
        \rowcolor{entetes}%
        \centering\textbf\produit &%
        \centering\textbf\quantite   &%
        \centering\textbf\prixtxt &%
        \centering\textbf\tottxt%
        \tabularnewline[1ex]%
    \else%
        \begin{longtable}{%
        |p{\@largeurDescriptif}%Descriptif
        |P{\@largeurChiffres}%Qt
        |P{\@largeurChiffres}%Prix
        |P{\@largeurChiffres}%Remise
        |P{\@largeurChiffres}|%Total
        }%
        \hline%
        \rowcolor{entetes}%
        \centering\textbf\produit &%
        \centering\textbf\quantite   &%
        \centering\textbf\prixtxt &%
        \centering\textbf\remise &%
        \centering\textbf\tottxt%
        \tabularnewline[1ex]%
     \fi%
    \else%
        \ifsansremise%
        \begin{longtable}{%
        |p{\@largeurDescriptif}|%Descriptif
        P{\@largeurChiffresAvecTVA}|%Qt
        P{\@largeurChiffresAvecTVA}|%HT unitaire
        P{\@largeurChiffresAvecTVA}|%Totalht
        P{\@largeurTVA}|%TVA
        P{\@largeurChiffresAvecTVA}|%Total TTC
        }%
        \hline%
        \rowcolor{entetes}
        \centering\textbf\produit &%
        \centering\textbf\quantite &%
        \centering\textbf\prixHT &%
        \centering\textbf\totHTtxt &%
        \centering\textbf\TVAtxt &%
        \textbf\prixTTC \tabularnewline[1ex]%

        \else%
        \begin{longtable}{%
        |p{\@largeurDescriptif}|%Descriptif
        P{\@largeurChiffresAvecTVA}|%Qt
        P{\@largeurChiffresAvecTVA}|%HT unitaire
        P{\@largeurChiffresAvecTVA}|%Remise
        P{\@largeurChiffresAvecTVA}|%Totalht
        P{\@largeurTVA}|%TVA
        P{\@largeurChiffresAvecTVA}|%Total TTC
        }%
        \hline%
        \rowcolor{entetes}
        \centering\textbf\produit &%
        \centering\textbf\quantite &%
        \centering\textbf\prixHT &%
        \centering\textbf\remise &%
        \centering\textbf\totHTtxt &%
        \centering\textbf\TVAtxt &%
        \textbf\prixTTC \tabularnewline[1ex]%
        \fi%
    \fi%
    \endhead%
    \endfoot%

    }%
{%
    \end{longtable}
                        \ifsansTVA%
                            \noindent\hspace{0.66\textwidth}\hfill \libelle{\tottxt:} \numprint[\unite]{\tot}\\%
                        \else%
                            \noindent\hspace{0.66\textwidth}\libelle{\totHTtxt:}\hfill \numprint[\unite]{\totHT}\\%
                            \hbox{}\hspace{0.66\textwidth}\libelle{\totTVAtxt:}\hfill \numprint[\unite]{\totTVA}\\%
                            \hbox{}\noindent\hspace{0.66\textwidth}\libelle{\totTTCtxt:}\hfill \numprint[\unite]{\totTTC}\\
                        \fi
                        \hspace{0.66\textwidth}\postTotaux

    }
\newcommand{\lignesansTVA}[5]{
  #1 &
  #2 &
  #3 &
  \unless\ifsansremise
    #4 &
  \fi
  #5 \tabularnewline[1ex]}

\newcommand{\afficheTVA}[1]{\raggedleft{\numprint[\%]{#1}}  \hfill $\triangleright$  \numprint[\unite]{\TVA}}
\newcommandx{\ligne}[5][2=1,5=\@TVAdefaut,4=0,usedefault]{%
    \ifsansTVA
        \fpMul{\prix}{#3}{#2}%
        \fpSub{\prix}{\prix}{#4}%
        \fpAdd{\tot}{\prix}{\tot}%
        \xdef\tot{\tot}%
        \xdef\prix{\prix}%
        %Affichage
        \lignesansTVA{#1}{#2}{\numprint[\unite]{#3}}{\numprint[\unite]{#4}}{\numprint[\unite]{\prix}}%
    \else
        % Prix hors taxe
        \fpMul{\HT}{#3}{#2}%
        \unless\ifsansremise%
          \fpSub{\HT}{\HT}{#4}%
        \fi%
        \xdef\HT{\HT}%retenons
        \fpAdd{\totHT}{\totHT}{\HT}%
        \xdef\totHT{\totHT}%
        % Calcul de la TVA
        \ifsansremise%
           \fpDiv{\centieme}{#4}{100}%
        \else%
          \fpDiv{\centieme}{#5}{100}%
        \fi
        \fpMul{\TVA}{\centieme}{\HT}%
        \xdef\TVA{\TVA}%retenons
        \fpAdd{\totTVA}{\totTVA}{\TVA}%
        \xdef\totTVA{\totTVA}%
        % Prix TTC
        \fpAdd{\TTC}{\HT}{\TVA}%
        \xdef\TTC{\TTC}%
        \fpAdd{\totTTC}{\totTTC}{\TTC}%
        \xdef\totTTC{\totTTC}%
        % Affichage
        #1 &
        #2 &
        \numprint[\unite]{#3} &
        \unless\ifsansremise
          \numprint[\unite]{#4} &
        \fi
        \numprint[\unite]{\HT} &
        \afficheTVA{#5} &
        \numprint[\unite]{\TTC} \tabularnewline[1ex]%
    \fi
    \hline
}
\AtBeginDocument{
\pagestyle{fancy}
\fancyhf{}
\renewcommand{\headrule}{}%Pas de règle après l'entête
\lfoot{\ifnum \value{page}>1 \thepage\fi}%Indiquer le numéro de page, sauf sur la première
\rfoot{\@pied}
}
\newcommand{\pied}[1]{\def\@pied{#1}}%Le pied définissable par l'utilisateur
\endinput
%%
%% End of file `facture.cls'.

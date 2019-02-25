% Author:  Marc Wäckerlin
% License: LGPL
\NeedsTeXFormat{LaTeX2e}
\ProvidesClass{businesscard-qrcode}[2018/08/15 version 1.2 ready for ctan]

%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% option evaluation
\RequirePackage{kvoptions}
\SetupKeyvalOptions{
	family=BCQ,
	prefix=BCQ@
}
\DeclareStringOption[89mm]{paperwidth}
\DeclareStringOption[59mm]{paperheight}
\DeclareStringOption[85mm]{contentwidth}
\DeclareStringOption[55mm]{contentheight}
\DeclareStringOption[8pt]{fontsize}
\DeclareStringOption[2mm]{padding}
\DeclareStringOption[2]{cutdist}
\DeclareStringOption[1]{cutlen}
\DeclareStringOption[0.50]{textwidth}
\DeclareStringOption[0.40]{qrwidth}
\DeclareStringOption[de]{lang}
\DeclareBoolOption[true]{address}
\DeclareComplementaryOption{noaddress}{address}
\DeclareBoolOption[true]{hint}
\DeclareComplementaryOption{nohint}{hint}
\DeclareBoolOption[true]{icon}
\DeclareComplementaryOption{noicon}{icon}
\DeclareBoolOption[true]{rightalign}
\DeclareComplementaryOption{leftalign}{rightalign}
\DeclareBoolOption[true]{iconleft}
\DeclareComplementaryOption{iconright}{iconleft}
\DeclareBoolOption[true]{fill}
\DeclareComplementaryOption{nofill}{fill}
\DeclareBoolOption[true]{qrfirst}
\DeclareComplementaryOption{textfirst}{qrfirst}
\DeclareBoolOption[true]{https}
\DeclareComplementaryOption{www}{https}
\DeclareDefaultOption{\@unknownoptionerror}
\ProcessKeyvalOptions*


%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% definitions from the options
\def\content{paperwidth=\BCQ@contentwidth,paperheight=\BCQ@contentheight}
\def\papersize{width=\BCQ@paperwidth,height=\BCQ@paperheight}
\def\padding{\BCQ@padding} % padding around the content
\def\border{\BCQ@cutdist} % distance between start of cutmark and content in mm
\def\cutlen{\BCQ@cutlen} % length of ct marks in mm
\def\textpercents{\BCQ@textwidth} % size of text part 0..1
\def\imagepercents{\BCQ@qrwidth} % size of qrcode image part 0..1
\def\lang{\BCQ@lang}
\def\protdisplay{\ifBCQ@https https://\else www.\fi}
\def\protprefix{\ifBCQ@https https://\fi}
\ifBCQ@address\def\printaddress{}\fi


%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% global dependencies and settings
\LoadClass[\BCQ@fontsize]{extarticle}
\RequirePackage{marvosym}
\RequirePackage{fontawesome}
\RequirePackage[final]{qrcode}
\RequirePackage{etoolbox}
\RequirePackage{DejaVuSans}
\RequirePackage[T1]{fontenc}
\RequirePackage{wrapfig}
\RequirePackage[\content,top=\padding,left=\padding,right=\padding,bottom=\padding]{geometry}
%\RequirePackage{pbox}
\RequirePackage{varwidth}
\RequirePackage{calc}
\pagestyle{empty}
\setlength{\parindent}{0pt}
\renewcommand*\familydefault{\sfdefault}
\setlength{\fboxsep}{0pt}


%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% data registration
\newcommand\registerData[1]{
	\expandafter\newcommand\csname #1\endcsname[1]{
		\expandafter\def\csname X#1\endcsname{##1}
	}
}
\registerData{type}
\registerData{givennames}
\registerData{familynames}
\registerData{honoricprefix}
\registerData{honoricsuffix}
\registerData{additionalnames}
\registerData{pobox}
\registerData{extaddr}
\registerData{street}
\registerData{city}
\registerData{region}
\registerData{zip}
\registerData{country}
\registerData{phone}
\registerData{email}
\registerData{jabber}
\registerData{matrixorg}
\registerData{cloud}
\registerData{homepage}
\registerData{wordpress}
\registerData{drupal}
\registerData{joomla}
\registerData{wikipedia}
\registerData{link}
\registerData{world}
\registerData{git}
\registerData{gitea}
\registerData{github}
\registerData{facebook}
\registerData{twitter}
\registerData{youtube}
\registerData{google}
\registerData{pgpurl}
\registerData{pgpfingerprint}


%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% auxiliary commands
\newcommand\enforceright{\leftskip0pt plus 1fill\rightskip0pt}
\newcommand\exec[1]{\csname #1\endcsname}
\newcommand\insa[3][]{\ifcsdef{#2}{

	\ifBCQ@iconleft
		\ifBCQ@icon\parbox{1em}{\centering\exec{#3}}\ \fi\ifBCQ@hint{\tiny#1}\fi\ifBCQ@fill\hfill\fi\exec{#2}
	\else
		\ifBCQ@hint{\tiny#1\ }\fi\exec{#2}\ifBCQ@fill\hfill\fi\ifBCQ@icon\ \parbox{1em}{\centering\exec{#3}}\fi
	\fi
}{}}
\newcommand\ifexists[2]{\ifcsdef{#1}{#2}{}}
\newcommand\ifboth[3]{\ifcsdef{#1}{\ifcsdef{#2}{#3}{}}{}}
\newcommand\ifany[3]{\ifcsdef{#1}{#3}{\ifcsdef{#2}{#3}{}}}
\newcommand\cond[1]{\ifcsdef{#1}{\exec{#1}}{}}
\newcommand\heightscale{\dimexpr\textheight-\ifcsempty{name}{0em}{2em}-\ifcsdef{Xpgpfingerprint}{2em}{0em}-\ifcsdef{Xadditionalnames}{2em}{0em}\relax}


%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% name - assemble full name from the parts, such as Xgivennames and Xfamilynames
\newcommand\name{\ifexists{Xhonoricprefix}{\Xhonoricprefix\ }\ifexists{Xgivennames}{\Xgivennames\ }\ifexists{Xfamilynames}{\Xfamilynames}\ifexists{Xhonoricsuffix}{\ \Xhonoricsuffix}}


%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% vcard - the content of the vcard
\newcommand\vcard{BEGIN:VCARD^^J
VERSION:4.0^^J
N:\cond{Xfamilynames};\cond{Xgivennames};\cond{Xadditionalnames};\cond{Xhonoricprefix};\cond{Xhonoricsuffix}^^J
FN:\name\ifexists{Xadditionalnames}{\ifcsempty{name}{}{\ }\Xadditionalnames}^^J
\ifexists{printaddress}{ADR\ifexists{Xtype}{;TYPE=\Xtype}:\cond{Xpobox};\cond{Xextaddr};\cond{Xstreet};\cond{Xcity};\cond{Xregion};\cond{Xzip};\cond{Xcountry}^^J}
\ifexists{Xphone}{TEL;VALUE=uri;TYPE=\ifexists{Xtype}{\Xtype,}voice,text:tel:\Xphone^^J}
\ifexists{Xemail}{EMAIL\ifexists{Xtype}{;TYPE=\Xtype}:\Xemail^^J}
\ifexists{Xjabber}{IMPP;TYPE=XMPP:\Xjabber^^J}
\ifexists{Xmatrixorg}{IMPP;TYPE=MATRIX:\Xmatrixorg^^J}
\ifexists{Xcloud}{URL:https://nextcloud.com/federation/\#\Xcloud^^J}
\ifexists{Xhomepage}{URL:https://\Xhomepage^^J}
\ifexists{Xwordpress}{URL:https://\Xwordpress^^J}
\ifexists{Xdrupal}{URL:https://\Xdrupal^^J}
\ifexists{Xjoomla}{URL:https://\Xjoomla^^J}
\ifexists{Xwikipedia}{URL:https://\lang.wikipedia.org/wiki/\Xwikipedia^^J}
\ifexists{Xlink}{URL:https://\Xlink^^J}
\ifexists{Xworld}{URL:https://\Xworld^^J}
\ifexists{Xgit}{URL:https://\Xgit^^J}
\ifexists{Xgitea}{URL:https://\Xgitea^^J}
\ifexists{Xgithub}{URL:https://github.com/\Xgithub^^J}
\ifexists{Xfacebook}{URL:https://facebook.com/\Xfacebook^^J}
\ifexists{Xtwitter}{URL:https://twitter.com/\Xtwitter^^J}
\ifexists{Xyoutube}{URL:https://youtube.com/user/\Xyoutube^^J}
\ifexists{Xgoogle}{URL:https://plus.google.com/+\Xgoogle^^J}
\ifexists{Xpgpurl}{KEY;MEDIATYPE=application/pgp-keys:\Xpgpurl^^J}
\ifexists{Xpgpfingerprint}{KEY:data:application/x-pgp-fingerprint,\Xpgpfingerprint^^J}
END:VCARD^^J}


%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% address - the address as shown in the textbox
\newcommand\address{
	
	\cond{Xpobox}

	\cond{Xextaddr}
	
	\cond{Xstreet}
	
	\cond{Xzip} \cond{Xcity}
	
	\cond{Xregion} \cond{Xcountry}
	
}


%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% inserttext - assemble the textbox
\newcommand\inserttext{
	%\frame
	{
	\begin{minipage}[c][\heightscale][c]{\textpercents\textwidth}
		\ifBCQ@rightalign\begin{flushright}\fi	
		\ifexists{printaddress}{
			\ifBCQ@iconleft
				\ifBCQ@icon\parbox[c]{1em}{\faMapMarker}\ \ifBCQ@fill\hfill\fi\fi
				%\frame{
					%\pbox[t]{\dimexpr\textwidth-2em\relax}{
				\begin{varwidth}{\dimexpr\textwidth-2em\relax}
					\ifBCQ@rightalign\enforceright\fi\address
				\end{varwidth}
					%}
				%}
			\else
				%\pbox[t]{\dimexpr\textwidth-2em\relax}{
				\begin{varwidth}{\dimexpr\textwidth-2em\relax}
					\ifBCQ@rightalign\enforceright\fi\address
				\end{varwidth}
				%}
				\ifBCQ@icon\ifBCQ@fill\hfill\fi\ \parbox[c]{1em}{\faMapMarker}\fi
			\fi
			\vspace{1em}
		}
	
		\insa[tel:]{Xphone}{faMobile}\insa[mailto:]{Xemail}{Email}\insa[xmpp]{Xjabber}{faCommentsO}\insa[matrix.org]{Xmatrixorg}{faCommentsO}\insa[nextcloud-id]{Xcloud}{faCloud}\insa[\protdisplay]{Xhomepage}{faHome}\insa[\protdisplay]{Xwordpress}{faWordpress}\insa[\protdisplay]{Xdrupal}{faDrupal}\insa[\protdisplay]{Xjoomla}{faJoomla}\insa[{\protprefix}\lang.wikipedia.org/wiki/]{Xwikipedia}{faWikipediaW}\insa[\protdisplay]{Xlink}{faLink}\insa[\protdisplay]{Xworld}{faGlobe}\insa[\protdisplay]{Xgit}{faGit}\insa[\protdisplay]{Xgitea}{faGithubAlt}\insa[{\protprefix}github.com/]{Xgithub}{faGithub}\insa[{\protprefix}facebook.com/]{Xfacebook}{faFacebook}\insa[{\protprefix}twitter.com/]{Xtwitter}{faTwitter}\insa[{\protprefix}youtube.com/user/]{Xyoutube}{faYoutube}\insa[{\protprefix}plus.google.com/+]{Xgoogle}{faGooglePlus}

		\ifBCQ@rightalign\end{flushright}\fi
	\end{minipage}
}
}


%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% insertqrcode - insert the qr-code
\newcommand\insertqrcode{
	%\frame
	{
	\begin{minipage}[c][\heightscale][c]{\imagepercents\textwidth}
		\qrcode[level=Q,version=0,height=\textwidth]{\vcard}
	\end{minipage}
}
}


%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% insertname - insert the name on the top
\newcommand\insertname{
	%\frame
	%\begin{minipage}{\textwidth}
		%\pbox[t]{0.9\textwidth}
		{\bfseries
		
			\cond{name}
		
			\cond{Xadditionalnames}
		
		}
	%\end{minipage}
}

%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% drawcard - assemble all blocks into the visiting card
\newcommand\drawcard{
	\ifBCQ@rightalign\begin{flushright}\fi
		\insertname 
		\noindent\makebox[\linewidth]{\rule{\paperwidth}{0.4pt}} % horizontal line
		\vfill
		\ifBCQ@qrfirst
			\insertqrcode
			\hfill
			\inserttext
		\else
			\inserttext
			\hfill
			\insertqrcode
		\fi
		\ifexists{Xpgpfingerprint}{
			\vfill
			\ifBCQ@iconleft
				\faLock\ifBCQ@hint{\tiny\ pgp}\fi\hfill{\small\Xpgpfingerprint}
			\else
				{\small\Xpgpfingerprint}\hfill\ifBCQ@hint{\tiny{pgp\ }}\fi\faLock
			\fi
		}
	\ifBCQ@rightalign\end{flushright}\fi
}


%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% cut / crop marks
\RequirePackage[\papersize,noinfo,center,pdftex]{crop}
\newcommand\tl{
	\begin{picture}(0,0)
	\thinlines\unitlength1mm
	\put(-\border,0){\line(1,0){\cutlen}}
	\put(0,\border){\line(0,-1){\cutlen}}
	\end{picture}
}
\newcommand\tr{
	\begin{picture}(0,0)
	\thinlines\unitlength1mm
	\put(\border,0){\line(-1,0){\cutlen}}
	\put(0,\border){\line(0,-1){\cutlen}}
	\end{picture}
}
\newcommand\bl{
	\begin{picture}(0,0)
	\thinlines\unitlength1mm
	\put(-\border,0){\line(1,0){\cutlen}}
	\put(0,-\border){\line(0,1){\cutlen}}
	\end{picture}
}
\newcommand\br{
	\begin{picture}(0,0)
	\thinlines\unitlength1mm
	\put(\border,0){\line(-1,0){\cutlen}}
	\put(0,-\border){\line(0,1){\cutlen}}
	\end{picture}
}
\cropdef[]\tl\tr\bl\br{cut}
\crop[cut]

### file spec-xcolor-sty.awk
### Copyright 2009, 2011 Stephan Hennig
#
# This work may be distributed and/or modified under the conditions of
# the LaTeX Project Public License, either version 1.3 of this license
# or (at your option) any later version.  The latest version of this
# license is in http://www.latex-project.org/lppl.txt
#
BEGIN {
    FS = ",|;|}|{| |/"
    i = 0
}
# file version
/\[[0-9]+\/[0-9]+\/[0-9]+ v[0-9.]+[a-z]* .*\]/ {
    match($0, "v[0-9.]+[a-z]*")
    version = substr($0, RSTART, RLENGTH)
}
# rgb/hsb/cmyk/gray
/[a-z]+,[0-9.]+,[0-9.]+,[0-9.]+\/[0-9.]+,[0-9.]+,[0-9.]+\/[0-9.]+,[0-9.]+,[0-9.]+,[0-9.]+\/[0-9.]+[;}]/ {
    i++
    name[i] = $3
    r[i] = $4
    g[i] = $5
    b[i] = $6
    hu[i] = $7
    sa[i] = $8
    br[i] = $9
    c[i] = $10
    m[i] = $11
    y[i] = $12
    k[i] = $13
    gry[i] = $14
#    print name[i] "=(" r[i] "," g[i] "," b[i] ")(" hu[i] "," sa[i] "," br[i] ")(" c[i] "," m[i] "," y[i] "," k[i] ")(" gry[i] ")"
}
# cmyk/rgb/hsb/gray
/[a-z]+,[0-9.]+,[0-9.]+,[0-9.]+,[0-9.]+\/[0-9.]+,[0-9.]+,[0-9.]+\/[0-9.]+,[0-9.]+,[0-9.]+\/[0-9.]+[;}]/ {
    i++
    name[i] = $3
    c[i] = $4
    m[i] = $5
    y[i] = $6
    k[i] = $7
    r[i] = $8
    g[i] = $9
    b[i] = $10
    hu[i] = $11
    sa[i] = $12
    br[i] = $13
    gry[i] = $14
#    print name[i] "=(" c[i] "," m[i] "," y[i] "," k[i] ")(" r[i] "," g[i] "," b[i] ")(" hu[i] "," sa[i] "," br[i] ")(" gry[i] ")"
}
# gray/rgb/hsb/cmyk
/[a-z]+,[0-9.]+\/[0-9.]+,[0-9.]+,[0-9.]+\/[0-9.]+,[0-9.]+,[0-9.]+\/[0-9.]+,[0-9.]+,[0-9.]+,[0-9.]+[;}]/ {
    i++
    name[i] = $3
    gry[i] = $4
    r[i] = $5
    g[i] = $6
    b[i] = $7
    hu[i] = $8
    sa[i] = $9
    br[i] = $10
    c[i] = $11
    m[i] = $12
    y[i] = $13
    k[i] = $14
#    print name[i] "=(" gry[i] ")(" r[i] "," g[i] "," b[i] ")(" hu[i] "," sa[i] "," br[i] ")(" c[i] "," m[i] "," y[i] "," k[i] ")"
}
END {
    print "Found " i " base colors (" version ")."
# Build file mpcolornames-spec-xcolor-sty.mp.
    file = "mpcolornames-spec-xcolor-sty.mp"
    print "%%% file " file > file
    print "%%% Copyright 2009, 2011 Stephan Hennig" >> file
    print "%" >> file
    print "% This work may be distributed and/or modified under the conditions of" >> file
    print "% the LaTeX Project Public License, either version 1.3 of this license" >> file
    print "% or (at your option) any later version.  The latest version of this" >> file
    print "% license is in http://www.latex-project.org/lppl.txt" >> file
    print "%" >> file
    print "def _mpcolornames_spec_xcolor_sty=" >> file
    print "rgbcolor" >> file
    for (j = 1; j < i; j++) print "rgb_" name[j] "," >> file
    print "rgb_" name[i] ";" >> file
    print "cmykcolor" >> file
    for (j = 1; j < i; j++) print "cmyk_" name[j] "," >> file
    print "cmyk_" name[i] ";" >> file
    print "numeric" >> file
    for (j = 1; j < i; j++) print "grey_" name[j] "," >> file
    print "grey_" name[i] ";" >> file
    for (j = 1; j <= i; j++) print "rgb_" name[j] ":=(" r[j] "," g[j] "," b[j] ");" >> file
    for (j = 1; j <= i; j++) print "cmyk_" name[j] ":=(" c[j] "," m[j] "," y[j] "," k[j] ");" >> file
    for (j = 1; j <= i; j++) print "grey_" name[j] ":=" gry[j] ";" >> file
    print "enddef;" >> file
    print "endinput" >> file


# Build file proof-spec-xcolor-sty.mp.
    file = "proof-spec-xcolor-sty.mp"
    print "%%% file " file > file
    print "input proof-mpcolornames" >> file
    print "specname := \"xcolor-sty\";" >> file
    print "defaultcolormodel := 5;% RGB" >> file
    for (j = 1; j <= i; j++) print "proof(rgb_" name[j] ");" >> file
    print "defaultcolormodel := 7;% CMYK" >> file
    for (j = 1; j <= i; j++) print "proof(cmyk_" name[j] ");" >> file
    print "defaultcolormodel := 3;% grey scale" >> file
    for (j = 1; j <= i; j++) print "proof(grey_" name[j] ");" >> file
    print "end" >> file

# Build file tab-spec-xcolor-sty.tex.
    file = "tab-spec-xcolor-sty.tex"
    print "%%% file " file > file
#    print "\\vspace{\\floatsep}" >> file
    print "\\begingroup" >> file
    print "\\ttfamily\\small\\color{mpcolor}" >> file
    print "\\setlength{\\tabcolsep}{.5\\columnsep}" >> file
    print "\\setlength{\\tabcolwidth}{\\textwidth}" >> file
    print "\\addtolength{\\tabcolwidth}{-4\\tabcolsep}" >> file
    print "\\setlength{\\tabcolwidth}{.333\\tabcolwidth}" >> file
    print "\\begin{longtable}{@{}*{3}{p{\\tabcolwidth}}@{}}" >> file
    print "  \\caption{RGB, CMYK, and grey~scale colors from \\LaTeX\\ package \\name{xcolor}.}%" >> file
    print "  \\label{tab:spec-xcolor-sty}\\\\" >> file
    print "\\multicolumn{3}{l}{\\normalfont\\footnotesize\\normalcolor Taken from file \\texttt{xcolor.sty} " version " as distributed by \\LaTeX\\ package \\name{xcolor} (" i " colors, with augmented names).}" >> file
    print "\\endfirsthead" >> file
    print "" >> file
    for (j = 1; j <= i; j++) print "\\colorproof[xcolor-sty]{" name[j] "}\\\\" >> file
    print "\\end{longtable}" >> file
    print "\\endgroup" >> file
}

### file spec-dvipsnam-def.awk
### Copyright 2009, 2011 Stephan Hennig
#
# This work may be distributed and/or modified under the conditions of
# the LaTeX Project Public License, either version 1.3 of this license
# or (at your option) any later version.  The latest version of this
# license is in http://www.latex-project.org/lppl.txt
#
BEGIN {
    FS = "{|}|,"
    i = 0
}
# file version
/\[[0-9]+\/[0-9]+\/[0-9]+ v[0-9.]+[a-z]* .*\]/ {
    match($0, "v[0-9.]+[a-z]*")
    version = substr($0, RSTART, RLENGTH)
}
# CMYK color spec
/^\\DefineNamedColor\{named\}\{[a-zA-Z]+\} *\{cmyk\}\{[0-9.]+,[0-9.]+,[0-9.]+,[0-9.]+\}/ {
    i++
    name[i] = $4
    c[i] = $8
    m[i] = $9
    y[i] = $10
    k[i] = $11
#    print name[i] "=(" c[i] "," m[i] "," y[i] "," k[i] ")"
}
END {
    print "Found " i " DVIPS colors (" version ")."
# Build file mpcolornames-spec-dvipsnam-def.mp.
    file = "mpcolornames-spec-dvipsnam-def.mp"
    print "%%% file " file > file
    print "%%% Copyright 2009, 2011 Stephan Hennig" >> file
    print "%" >> file
    print "% This work may be distributed and/or modified under the conditions of" >> file
    print "% the LaTeX Project Public License, either version 1.3 of this license" >> file
    print "% or (at your option) any later version.  The latest version of this" >> file
    print "% license is in http://www.latex-project.org/lppl.txt" >> file
    print "%" >> file
    print "def _mpcolornames_spec_dvipsnam_def=" >> file
    print "cmykcolor" >> file
    for (j = 1; j < i; j++) print name[j] "," >> file
    print name[i] ";" >> file
    for (j = 1; j <= i; j++) print name[j] ":=(" c[j] "," m[j] "," y[j] "," k[j] ");" >> file
    print "enddef;" >> file
    print "endinput" >> file

# Build file proof-spec-dvipsnam-def.mp.
    file = "proof-spec-dvipsnam-def.mp"
    print "%%% file " file > file
    print "input proof-mpcolornames" >> file
    print "dvipsnames;" >> file
    print "defaultcolormodel := 7;% CMYK" >> file
    print "specname := \"dvipsnam-def\";" >> file
    for (j = 1; j <= i; j++) print "proof(" name[j] ");" >> file
    print "end" >> file

# Build file tab-spec-dvipsnam-def.tex.
    file = "tab-spec-dvipsnam-def.tex"
    print "%%% file " file > file
    print "\\vspace{\\floatsep}" >> file
    print "\\begin{multicols}{4}[\\noindent\\parbox{\\textwidth}{%" >> file
    print "    \\captionof{table}{CMYK colors from DVIPS specification.}%" >> file
    print "    \\label{tab:spec-dvipsnam-def}%" >> file
    print "    \\footnotesize Taken from file \\texttt{dvipsnam.def} " version " as distributed by \\LaTeX\\ package \\name{color} (" i " colors)." >> file
    print "  }]" >> file
    print "  \\raggedcolumns" >> file
    print "  \\setlength{\\parindent}{0pt}" >> file
    print "  \\ttfamily\\small\\color{mpcolor}" >> file
    for (j = 1; j <= i; j++) print "\\colorproof[dvipsnam-def]{" name[j] "}\\par" >> file
    print "\\end{multicols}" >> file
}

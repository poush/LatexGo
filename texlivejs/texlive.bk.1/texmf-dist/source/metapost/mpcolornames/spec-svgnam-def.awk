### file spec-svgnam-def.awk
### Copyright 2009, 2011 Stephan Hennig
#
# This work may be distributed and/or modified under the conditions of
# the LaTeX Project Public License, either version 1.3 of this license
# or (at your option) any later version.  The latest version of this
# license is in http://www.latex-project.org/lppl.txt
#
BEGIN {
    FS = ",|;|}"
    i = 0
}
# file version
/\[[0-9]+\/[0-9]+\/[0-9]+ v[0-9.]+[a-z]* .*\]/ {
    match($0, "v[0-9.]+[a-z]*")
    version = substr($0, RSTART, RLENGTH)
}
# RGB color spec
/[a-z]+,[0-9.]+,[0-9.]+,[0-9.]+[;}]/ {
    i++
    name[i] = $1
    r[i] = $2
    g[i] = $3
    b[i] = $4
#    print name[i] "=(" r[i] "," g[i] "," b[i] ")"
}
END {
    print "Found " i " SVG colors (" version ")."
# Build file mpcolornames-spec-svgnam-def.mp.
    file = "mpcolornames-spec-svgnam-def.mp"
    print "%%% file " file > file
    print "%%% Copyright 2009, 2011 Stephan Hennig" >> file
    print "%" >> file
    print "% This work may be distributed and/or modified under the conditions of" >> file
    print "% the LaTeX Project Public License, either version 1.3 of this license" >> file
    print "% or (at your option) any later version.  The latest version of this" >> file
    print "% license is in http://www.latex-project.org/lppl.txt" >> file
    print "%" >> file
    print "def _mpcolornames_spec_svgnam_def=" >> file
    print "rgbcolor" >> file
    for (j = 1; j < i; j++) print name[j] "," >> file
    print name[i] ";" >> file
    for (j = 1; j <= i; j++) print name[j] ":=(" r[j] "," g[j] "," b[j] ");" >> file
    print "enddef;" >> file
    print "endinput" >> file

# Build file proof-spec-svgnam-def.mp.
    file = "proof-spec-svgnam-def.mp"
    print "%%% file " file > file
    print "input proof-mpcolornames" >> file
    print "defaultcolormodel := 5;% RGB" >> file
    print "specname := \"svgnam-def\";" >> file
    for (j = 1; j <= i; j++) print "proof(" name[j] ");" >> file
    print "end" >> file

# Build file tab-spec-svgnam-def.tex.
    file = "tab-spec-svgnam-def.tex"
    print "%%% file " file > file
    print "\\vspace{\\floatsep}" >> file
    print "\\begin{multicols}{4}[\\noindent\\parbox{\\textwidth}{%" >> file
    print "    \\captionof{table}{RGB colors from SVG specification.}%" >> file
    print "    \\label{tab:spec-svgnam-def}%" >> file
    print "    \\footnotesize Taken from file \\texttt{svgnam.def} " version " as distributed by \\LaTeX\\ package \\name{xcolor} (" i " colors)." >> file
    print "  }]" >> file
    print "  \\raggedcolumns" >> file
    print "  \\setlength{\\parindent}{0pt}" >> file
    print "  \\ttfamily\\small\\color{mpcolor}" >> file
    for (j = 1; j <= i; j++) print "\\colorproof[svgnam-def]{" name[j] "}\\par" >> file
    print "\\end{multicols}" >> file
}

### file spec-x11nam-def.awk
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
    j = 0
}
# file version
/\[[0-9]+\/[0-9]+\/[0-9]+ v[0-9.]+[a-z]* .*\]/ {
    match($0, "v[0-9.]+[a-z]*")
    version = substr($0, RSTART, RLENGTH)
}
# RGB color spec
/^[a-zA-Z]+[0-9],[0-9.]+,[0-9.]+,[0-9.]+[;}]/ {
    i++
    name[i] = $1
    r[i] = $2
    g[i] = $3
    b[i] = $4
    basename = name[i]
    sub(/[0-9]+$/, "", basename)
    flag = 0
    for (n = 1; n <= j; n++)
        if (bname[n] == basename) flag = 1
    if (flag == 0) {
        j++
        bname[j] = basename
    }
#    print basename ":" name[i] "=(" r[i] "," g[i] "," b[i] ")"
}
END {
    print "Found " i " X11 colors (" version ")."
    print "Found " j " X11 color base names."
# Build file mpcolornames-spec-x11nam-def.mp.
    file = "mpcolornames-spec-x11nam-def.mp"
    print "%%% file " file > file
    print "%%% Copyright 2009, 2011 Stephan Hennig" >> file
    print "%" >> file
    print "% This work may be distributed and/or modified under the conditions of" >> file
    print "% the LaTeX Project Public License, either version 1.3 of this license" >> file
    print "% or (at your option) any later version.  The latest version of this" >> file
    print "% license is in http://www.latex-project.org/lppl.txt" >> file
    print "%" >> file
    print "def _mpcolornames_spec_xelevennam_def=" >> file
    print "rgbcolor" >> file
    for (n = 1; n < j; n++) print bname[n] "[]," >> file
    print bname[j] "[];" >> file
    for (n = 1; n <= i; n++) print name[n] ":=(" r[n] "," g[n] "," b[n] ");" >> file
    print "enddef;" >> file
    print "endinput" >> file

# Build file proof-spec-x11nam-def.mp.
    file = "proof-spec-x11nam-def.mp"
    print "%%% file " file > file
    print "input proof-mpcolornames" >> file
    print "defaultcolormodel := 5;% RGB" >> file
    print "specname := \"x11nam-def\";" >> file
    for (n = 1; n <= i; n++) print "proof(" name[n] ");" >> file
    print "end" >> file

# Build file tab-spec-x11nam-def.tex.
    file = "tab-spec-x11nam-def.tex"
    print "%%% file " file > file
    print "\\vspace{\\floatsep}" >> file
    print "\\begin{multicols}{4}[\\noindent\\parbox{\\textwidth}{%" >> file
    print "    \\captionof{table}{RGB colors from X11 specification.}%" >> file
    print "    \\label{tab:spec-x11nam-def}%" >> file
    print "    \\footnotesize Taken from file \\texttt{x11nam.def} " version " as distributed by \\LaTeX\\ package \\name{xcolor} (" i " colors)." >> file
    print "  }]" >> file
    print "  \\raggedcolumns" >> file
    print "  \\setlength{\\parindent}{0pt}" >> file
    print "  \\ttfamily\\small\\color{mpcolor}" >> file
    for (n = 1; n <= i; n++) print "\\colorproof[x11nam-def]{" name[n] "}\\par" >> file
    print "\\end{multicols}" >> file
}

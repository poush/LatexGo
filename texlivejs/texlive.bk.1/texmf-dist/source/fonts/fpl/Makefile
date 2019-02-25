# Time-stamp: <2005-02-13 11:57:43 ralf> 
# Copyright 2005 Ralf Stubner
# See the file COPYING (GNU General Public License) for license
# conditions. 

FONTFORGE=/usr/bin/fontforge -script

SC_SOURCE=TeXPalladioL-SC.pe Palladio-SC.sfd pplrc9d-kern.afm
IT_SOURCE=TeXPalladioL-ItalicOsF.pe Palladio-ItalicOsF.sfd pplri9d-kern.afm
BD_SOURCE=TeXPalladioL-BoldOsF.pe Palladio-BoldOsF.sfd pplb9d-kern.afm
BI_SOURCE=TeXPalladioL-BoldItalicOsF.pe Palladio-BoldItalicOsF.sfd pplbi9d-kern.afm
SOURCE=$(SC_SOURCE) $(IT_SOURCE) $(BD_SOURCE) $(BI_SOURCE) URW-OtherSubrs.ps AddGPL AddException

all: fplrc8a.pfb fplrij8a.pfb fplbj8a.pfb fplbij8a.pfb

fplrc8a.pfb: $(SC_SOURCE)
	$(FONTFORGE) TeXPalladioL-SC.pe

fplrij8a.pfb: $(IT_SOURCE)
	$(FONTFORGE) TeXPalladioL-ItalicOsF.pe

fplbj8a.pfb: $(BD_SOURCE)
	$(FONTFORGE) TeXPalladioL-BoldOsF.pe

fplbij8a.pfb: $(BI_SOURCE) 
	$(FONTFORGE) TeXPalladioL-BoldItalicOsF.pe

clean:
	rm -f fpl*8a.* TeXPalladioL*sfd

dist: all
	rm -rf dist/
	mkdir -p dist/type1 dist/afm dist/pfm dist/source
	cp README COPYING dist/ 
	cp fplrc8a.pfb fplrij8a.pfb fplbj8a.pfb fplbij8a.pfb dist/type1/
	cp fplrc8a.pfm fplrij8a.pfm fplbj8a.pfm fplbij8a.pfm dist/pfm/
	cp fplrc8a.afm fplrij8a.afm fplbj8a.afm fplbij8a.afm dist/afm/
	cp $(SOURCE) Makefile dist/source/ 
	cp README.source dist/source/README
	(cd dist; zip -r fpl.zip README COPYING type1 afm pfm source)


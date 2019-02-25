PDFLATEX = pdflatex
MPOST = mpost
MARKDOWN = markdown
AWK = gawk
CD = cd
CP = cp
RM = rm -f
ZIP = zip
PACKAGE=mpcolornames
VERSION=v020


.PHONY: all note clean doc todo release colorspecs


note:
	@echo "*** Makefile for $(PACKAGE) package ***"
	@echo "Please type:"
	@echo "make doc         to build documentation."
	@echo "make todo        to build TODO list."
	@echo "make clean       to clean this directory."
	@echo "make release     to build a CTAN package."
	@echo "make colorspecs  to process .def files."


all: doc


doc: $(PACKAGE).pdf


todo: TODO.html

clean:
	$(RM) *.aux *.bbl *.blg *.log *.out *.toc *.mps
	$(RM) mpcolornames-spec-*.mp proof-spec-*.mp tab-spec-*.tex tab-clash-*.tex


$(PACKAGE).pdf: colorspecs tab-clash
	$(MPOST) expl-array-index
	$(MPOST) fig-clash-svg-dvips
	$(MPOST) proof-spec-dvipsnam-def
	$(MPOST) proof-spec-svgnam-def
	$(MPOST) proof-spec-x11nam-def
	$(MPOST) proof-spec-xcolor-sty
	$(MPOST) proof-spec-plain-mp
	$(PDFLATEX) $(PACKAGE)
	$(PDFLATEX) $(PACKAGE)
	$(PDFLATEX) $(PACKAGE)


TODO.html: TODO.mkd
	$(MARKDOWN) $<


colorspecs:
	$(AWK) -f spec-svgnam-def.awk svgnam.def
	$(AWK) -f spec-dvipsnam-def.awk dvipsnam.def
	$(AWK) -f spec-x11nam-def.awk x11nam.def
	$(AWK) -f spec-xcolor-sty.awk xcolor.sty
	$(AWK) -f spec-plain-mp.awk plain.mp


tab-clash:
	$(AWK) -f tab-clash-svg-dvips.awk mpcolornames-spec-svgnam-def.mp mpcolornames-spec-dvipsnam-def.mp


release: doc
	$(RM) package/$(PACKAGE)-*.zip
	$(RM) package/texmf/metapost/$(PACKAGE)/*
	$(RM) package/texmf/doc/metapost/$(PACKAGE)/*
	$(RM) package/texmf/source/metapost/$(PACKAGE)/*
	$(CP) $(PACKAGE)*.mp package/texmf/metapost/$(PACKAGE)/
	$(CP) $(PACKAGE).tex tab-*.tex expl-*.mp fig-*.mp CHANGES LICENSE README $(PACKAGE).pdf proof-*.mp package/texmf/doc/metapost/$(PACKAGE)/
	$(CP) *.awk Makefile package/texmf/source/metapost/$(PACKAGE)/
	$(CD) package &&	$(ZIP) -9r $(PACKAGE)-$(VERSION) texmf &&  $(CD) ..

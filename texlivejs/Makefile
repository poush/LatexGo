TLVERSION = $(shell wget -qO- http://mirrors.ctan.org/systems/texlive/Source | grep -o 'texlive-[^-]*-source.tar.xz' | grep -o -m1 '[0-9]\{8\}[^-]\?')
TLDATE = $(shell echo ${TLVERSION}|grep -o [[:digit:]]*)
TLDIR = texlive-${TLDATE}-source
TLFILE = texlive-${TLVERSION}-source.tar.xz
SHELL=bash


CFG_OPTS_COMMON=\
    --enable-native-texlive-build \
    --enable-static \
    --enable-cxx-runtime-hack \
    --disable-all-pkgs \
    --without-x \
    --without-system-poppler \
    --without-system-freetype2 \
    --without-system-kpathsea \
    --without-system-libpng \
    --without-system-xpdf \
    --without-system-zlib \
    --without-system-teckit \
    --without-system-zziplib \
    --without-system-gd \
    --disable-ptex \
    --disable-largefile \



all: pdftex bibtex texlive.lst

test:
	makefile_path := $(abspath $(lastword $(MAKEFILE_LIST)))
	cur_dir := $(notdir $(patsubst %/,%,$(dir $(mkfile_path))))

$(TLFILE):
	@echo "downloading Texlive"
	wget -nc "http://mirrors.ctan.org/systems/texlive/Source/${TLFILE}"

$(TLDIR): $(TLFILE)
	@echo "unpacking sources"
	rm -rf ${TLDIR}
	tar -xf ${TLFILE}
	touch ${TLDIR}

%tangle %tie %web2c: $(TLDIR)
	@echo "building web2c binaries"
	rm -rf tmp&&mkdir tmp
	rm -rf binary&&mkdir binary
	cd tmp&&../${TLDIR}/configure -C $(CFG_OPTS_COMMON) --disable-ptex --enable-pdftex &>configure.log
	cd tmp&&make &>make.log
	cd tmp/texk/web2c&&make pdftex &>make.log
	cp -rp tmp/texk/web2c/{tangle,tie,web2c} binary/
	#rm -rf tmp

.PHONY: tangle tie web2c
tangle tie web2c: binary/tangle binary/tie binary/web2c

libs: $(TLDIR)

build:
	rm -rf build
	mkdir build

build/Makefile: $(TLDIR) | build
	@echo "configure.."
	cd build&& \
		CONFIG_SHELL=/bin/bash \
	   	EMCONFIGURE_JS=0 \
		emconfigure ../$(TLDIR)/configure -C $(CFG_OPTS_COMMON) --enable-pdftex --enable-bibtex CFLAGS="-DELIDE_CODE -Wno-implicit"\
		&>configure.log

%texk/web2c/Makefile %texk/kpathsea/Makefile: build/Makefile
	@echo "make in TeXLive root.."
	cd build&& ax_cv_c_float_words_bigendian=no emconfigure make &>make.log

build/texk/kpathsea/rebuild.stamp: build/texk/kpathsea/Makefile
	cd build/texk/kpathsea/&&emmake make rebuild &> make.log

.PHONY: kpathsea
kpathsea: build/texk/kpathsea/rebuild.stamp
	

pdftex.bc: binary/tangle binary/tie binary/web2c  build/texk/web2c/Makefile kpathsea
	@echo "make pdftex"
	cp -rfp binary/{tangle,tie,web2c} build/texk/web2c/
	cd build/texk/web2c && emmake make pdftex  -o tangle -o tie -o web2c -o web2c/makecpool &>pdftex.log
	opt -strip-debug build/texk/web2c/pdftex >pdftex.bc

pdftex-worker.js: pdftex-pre.js pdftex-post.js pdftex.bc
	@echo "create pdftex worker"
	#OBJFILES=$$(for i in `find build/texk/web2c/lib build/texk/kpathsea -name '*.o'` ; do llvm-nm $$i | grep main >/dev/null || echo $$i ; done) && \
		emcc  --memory-init-file 0 -v --closure 1 -s TOTAL_MEMORY=$$((128*1024*1024)) -O3  pdftex.bc -s INVOKE_RUN=0 --pre-js pdftex-pre.js --post-js pdftex-post.js -o pdftex-worker.js
.PHONY: pdftex
pdftex: pdftex-worker.js

bibtex.bc:  binary/tangle binary/tie binary/web2c  build/texk/web2c/Makefile kpathsea
	@echo "make bibtex"
	cp -rfp binary/{tangle,tie,web2c} build/texk/web2c/
	cd build/texk/web2c && emmake make bibtex  -o tangle &> bibtex.log
	opt -strip-debug build/texk/web2c/bibtex >bibtex.bc


bibtex-worker.js: bibtex-pre.js bibtex-post.js bibtex.bc
	emcc  --memory-init-file 0 --closure 1 -v -O3 --pre-js bibtex-pre.js --post-js bibtex-post.js -s INVOKE_RUN=0 bibtex.bc -o bibtex-worker.js

.PHONY: bibtex
bibtex: bibtex-worker.js

install-tl-unx.tar.gz:
	wget http://mirror.ctan.org/systems/texlive/tlnet/install-tl-unx.tar.gz

texlive: install-tl-unx.tar.gz
	rm -rf texlive&&mkdir texlive
	cd texlive && tar xzvf ../install-tl-unx.tar.gz
	echo selected_scheme scheme-basic > texlive/profile.input
	echo TEXDIR `pwd`/texlive >> texlive/profile.input
	echo TEXMFLOCAL `pwd`/texlive/texmf-local >> texlive/profile.input
	echo TEXMFSYSVAR `pwd`/texlive/texmf-var >> texlive/profile.input
	echo TEXMFSYSCONFIG `pwd`/texlive/texmf-config >> texlive/profile.input
	echo TEXMFVAR `pwd`/home/texmf-var >> texlive/profile.input
	@echo "Installing Texlive"
	@cd texlive && ./install-tl-*/install-tl -profile profile.input
	@echo "Removing unnecessary files"
	cd texlive && rm -rf bin readme* tlpkg install* *.html texmf-dist/doc

texlive.lst: texlive
	find texlive -type d -exec echo {}/. \; | sed 's/^texlive//g' >texlive.lst
	find texlive -type f | sed 's/^texlive//g' >>texlive.lst

clean:
	rm -rf tmp
	rm -rf binary
	rm -rf build
	rm -rf texlive-*-source*
	rm -f install-tl-unx.tar.gz
	rm -f texlive.lst
	rm -f pdftex-worker.js
	rm -f bibtex-worker.js
	rm -f pdftex.bc
	rm -f bibtex.bc
	rm -rf texlive

dist:
	rm -rf tmp
	rm -rf binary
	rm -rf build
	rm -rf texlive-*-source*
	rm -f install-tl-unx.tar.gz
	rm -f pdftex.bc
	rm -f bibtex.bc


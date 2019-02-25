#!/bin/sh

sourcedir=$PWD
cd ../../../
TDS=$PWD

write_comment()
{
	echo
	echo "# $1"
	echo
}

check_for_success()
{
	if [ "x$1" == "x0" ]; then
		echo "    OK"
	else
		echo "    failed (return code: $1)"
		return -1
	fi
}

run_command()
{
	echo ">>> running: '$1'"
	$1
	check_for_success $?
}


mvs=marvosym

patchA="$sourcedir/patch_marvosym_afm.sed"
patchB="$sourcedir/patch_marvosym_pfb.sed"
fileA="$TDS/fonts/afm/public/$mvs/$mvs.afm"
fileB="$TDS/fonts/type1/public/$mvs/$mvs.pfb"

# the reason why I first move and then edit in place is that somebody might
# want to change licence or something else in afm/pfb without running the
# conversion itself
write_comment "create type1 fonts"
run_command   "cd $TDS/fonts/truetype/public/$mvs"
run_command   "ttf2pt1 -b $mvs.ttf"
run_command   "mv $mvs.afm $fileA"
run_command   "mv $mvs.pfb $fileB"

write_comment "patch comments in afm"
echo "\$\$ sed -i \"\" -f $patchA $fileA"
sed -i "" -f $patchA $fileA
check_for_success $?

write_comment "patch comments in pfb"
run_command   "cd $TDS/fonts/type1/public/$mvs"
write_comment "create ascii version of the font first (disassemble)"
run_command   "t1disasm $mvs.pfb $mvs.pfb.txt"
write_comment "apply a patch to that one"
echo "\$\$ sed -i \"\" -f $patchB $fileB.txt"
sed -i "" -f $patchB $fileB.txt
check_for_success $?
write_comment "convert the font back into binary"
run_command   "t1asm $mvs.pfb.txt $mvs.pfb"
run_command   "rm $mvs.pfb.txt"

write_comment "create tex metrics"
run_command   "cd $TDS/fonts/afm/public/marvosym"
run_command   "afm2tfm marvosym.afm"
run_command   "mv marvosym.tfm $TDS/fonts/tfm/public/marvosym/umvs.tfm"

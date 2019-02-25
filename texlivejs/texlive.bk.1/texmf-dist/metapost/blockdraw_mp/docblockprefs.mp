numeric u;
u := 1cm;

numeric dashlw;
dashlw := 0.3pt;
picture gldash[];
gldash1 := dashpattern( on 0.25u off 0.25u );
gldash2 := dashpattern( on 0.5u off 0.1u on 0.1u off 0.1u on 0.1u off 0.1u );

longblockrx := 0.7u;
longblockry := 0.4u;
smallblockr := 0.3u;
connectionlw := 0.8pt;
textscale := 1;

shiftofflabelmargin := 2bboxmargin;
pickup pencircle scaled connectionlw;


input suanpan

setup_abacus(N=13,NBL=5,NBU=2,bead="suanpan",units=0);

% initial value of a suanpan
beginfig(1);
  rod_numbers:=false;
  reset_abacus;
  draw_abacus;
endfig;


setup_abacus(N=13,NBL=4,NBU=1,bead="soroban",units=1);

% initial value of a soroban
beginfig(2);
  rod_numbers:=false;
  reset_abacus;
  draw_abacus;
endfig;

setup_abacus(N=13,NBL=5,NBU=2,bead="suanpan",units=0);
beginfig(3);
  rod_numbers:=true;
  reset_abacus;
  valL[1]:=2;
  valL[3]:=5;
  valU[2]:=1;
  valU[4]:=2;
  draw_abacus;
endfig;

beginfig(4);
  reset_abacus;
  set_abacus_val("10552");
  draw_abacus;
endfig;

beginfig(10);
  reset_abacus;
  valL[1]:=2;
  valL[3]:=5;
  valU[2]:=1;
  valU[4]:=2;
  draw_abacus;
endfig;

beginfig(20);
  reset_abacus;
  valL[1]:=3;
  valL[3]:=5;
  valU[2]:=1;
  valU[4]:=2;
  draw_abacus;
endfig;

% soroban?
beginfig(30);
  setup_abacus(N=13,NBL=4,NBU=1,bead="soroban",units=1);
  set_abacus_val("651324");
  set_abacus_gray(deck="lower",below="000011",
                               above="000010");
  set_abacus_gray(deck="upper",below="000001",
	    	               above="000010");
  draw_abacus;
  mark_abacus(i=1,j=5)(btex 1 etex);
  mark_abacus(i=2,j=2)(btex 2 etex);
  mark_abacus(i=2,j=3)(btex 3 etex);
endfig;


%show_val;

setup_abacus(N=13,NBL=4,NBU=1,bead="soroban",units=1);
set_abacus_val("651324");
reset_abacus_gray;
add_val(v="82363456",iv=100,fig=true);
%message "**********************************";
%show_val;

setup_abacus(N=13,NBL=5,NBU=2,bead="suanpan",units=0);

% detailing one of the addition cases
beginfig(200);
  reset_abacus;
  reset_abacus_gray;
  set_abacus_val("82951324");
  draw_abacus;
endfig;

beginfig(201);
  set_abacus_val("82951324");
  add_val(v="60000",iv=100,fig=false);
  draw_abacus;
endfig;

%-------------------------------------------

beginfig(202);
  reset_abacus;
  reset_abacus_gray;
  set_abacus_val("82951324");
  set_abacus_gray(deck="lower",below="1010000",
                         above="0400000");
  set_abacus_gray(deck="upper",below="0110000",
                         above="0000000");
  draw_abacus;
endfig;

beginfig(203);
  reset_abacus_gray;
  add_val(v="60000",iv=100,fig=false);
  set_abacus_gray(deck="lower",below="0400000",
                         above="1010000");
  set_abacus_gray(deck="upper",below="0000000",
	    	         above="0110000");
  draw_abacus;
  mark_abacus(i=5,j=5)(btex 1 etex);
endfig;

% the following two commands enable a base-8 abacus
vbu:=4; % value of a bead in the upper deck
setup_abacus(N=13,NBL=3,NBU=1,bead="suanpan",units=0);

beginfig(300);
  reset_abacus;
  reset_abacus_gray;
  set_abacus_val("3401256");
  draw_abacus;
endfig;

beginfig(301);
  add_val(v="1234",iv=100,fig=false);
  draw_abacus;
endfig;

end


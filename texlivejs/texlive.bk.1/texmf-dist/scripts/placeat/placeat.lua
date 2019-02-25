-- 
--  This is file `placeat.lua',
--  generated with the docstrip utility.
-- 
--  The original source files were:
-- 
--  placeat.dtx  (with options: `lua')
--  
--  EXPERIMENTAL CODE
--  
--  This package is copyright © 2017 Arno L. Trautmann. It may be distributed and/or
--  modified under the conditions of the LaTeX Project Public License, either version 1.3c
--  of this license or (at your option) any later version. This work has the LPPL mainten-
--  ance status ‘maintained’.
function pdf_print (...)
  for _, str in ipairs({...}) do
    pdf.print(str .. " ")
  end
  pdf.print("\n")
end

function move (p1,p2)
  if (p2) then
    pdf_print(p1,p2,"m")
  else
    pdf_print(p1[1],p1[2],"m")
  end
end

function line(p1,p2)
  pdf_print(p1,p2,"l")
end

function curve(p11,p12,p21,p22,p31,p32)
  if (p22) then
    p1,p2,p3 = {p11,p12},{p21,p22},{p31,p32}
  else
    p1,p2,p3 = p11,p12,p21
  end
  pdf_print(p1[1], p1[2],
              p2[1], p2[2],
              p3[1], p3[2], "c")
end

function linewidth(w)
  pdf_print(w,"w")
end

function fill()
  pdf_print("f")
end

function stroke()
  pdf_print("S")
end

-- welp, let's have some fun!
-- with the function radd, a random coordinate change is added if used
-- randfact will adjust the amount of randomization
-- everything is relative in the grid size
-- BUT: In fact, do we really want to have wiggly lines? …
local randfact = 100
local radd = function()
  return (math.random()-0.5)*randfact
end

function placelineat(x1,y1,x2,y2)
  xfac = tex.pagewidth/gridnrx/65536  -- factors to convert given number to absolute coordinates
  yfac = tex.pageheight/gridnry/65536 -- should both be global!
  xar = (x2-x1)*xfac                  -- end point of the arrow
  yar = (y1-y2)*yfac                  --
  move(0,0)                           -- start
  line(xar,yar)                       -- draw main line
  stroke()
end

function placearrowat(x1,y1,x2,y2)
  xfac = tex.pagewidth/gridnrx/65536  -- factors to convert given number to absolute coordinates
  yfac = tex.pageheight/gridnry/65536 -- should both be global!
  xar = (x2-x1)*xfac                  -- end point of the arrow
  yar = (y1-y2)*yfac                  --
  parx = xar/math.sqrt(xar^2+yar^2)   -- direction of the arrow
  pary = yar/math.sqrt(xar^2+yar^2)   --
  perpx = -pary                       -- perp of the arrow direction
  perpy =  parx                       --
  move(0,0)                           -- start
  line(xar,yar)                       -- draw main line
  move(xar,yar)
  line(xar-arrowheadlength*parx+arrowheadlength*perpx,yar-arrowheadlength*pary+arrowheadlength*perpy)  -- draw arrowhead
  move(xar,yar)
  line(xar-arrowheadlength*parx-arrowheadlength*perpx,yar-arrowheadlength*pary-arrowheadlength*perpy)
  stroke()
end

-- better circle-approximation by using quarter circles, according to wikipedia article about Bézier curves
-- k = 1 gives a circle, everything else something else …
function placecircleat(r,k,filled)
  local P0,P1,P2,P3
  r = r * 59.5 -- next arbitrary scale factor; the circle has radius "1" in x-units
  local rk = 0.55228*r*k

  P0 = {r,0}
  move  (P0[1],P0[2])

  P1 = {r,rk}   P2 = {rk,r}   P3 = {0,r}
  curve (P1,P2,P3)

  P1 = {-rk,r}  P2 = {-r,rk}  P3 = {-r,0}
  curve (P1,P2,P3)

  P1 = {-r,-rk} P2 = {-rk,-r} P3 = {0,-r}
  curve (P1,P2,P3)

  P1 = {rk,-r}  P2 = {r,-rk}  P3 = {r,0}
  curve (P1,P2,P3)

  if filled then
    fill()
  end
  stroke()
end

function placesquareat(length)
  move (-length,-length)
  line ( length,-length)
  line ( length, length)
  line (-length, length)
  line (-length,-length)
  stroke()
end

function placecurveat(x1,y1,x2,y2,x3,y3,x4,y4) -- start point and three numbers. Start is only offset.
  xfac = tex.pagewidth/gridnrx/65536  -- factors to convert given number to absolute coordinates
  yfac = tex.pageheight/gridnry/65536 -- should both be global!
  x2 = (x2-x1)*xfac
  y2 = (y2-y1)*yfac
  x3 = (x3-x1)*xfac
  y3 = (y3-y1)*yfac
  x4 = (x4-x1)*xfac
  y4 = (y4-y1)*yfac
  move(0,0)                         -- start
  curve(x2,-y2,x3,-y3,x4,-y4)       -- coordinates for Bezier curve
  stroke()
end

function placerectangleat(x1,y1,x2,y2,filled)
  xfac = tex.pagewidth/gridnrx/65536
  yfac = tex.pageheight/gridnry/65536
  x2 = (x2-x1)*xfac
  y2 = (y1-y2)*yfac
  move(0,0)
  line(x2,0)
  line(x2,y2)
  line(0,y2)
  line(0,0)
  if filled then
    fill()
  end
  stroke()
end
-- 
--  End of File `placeat.lua'.

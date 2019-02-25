-----------------------------------------------------------------------
--         FILE:  xindex-cfg-common.lua
--  DESCRIPTION:  configuration file for xindex.lua
-- REQUIREMENTS:  
--       AUTHOR:  Herbert Voß
--      LICENSE:  LPPL1.3
-----------------------------------------------------------------------

if not modules then modules = { } end modules ['xindex-cfg-common'] = {
      version = 0.07,
      comment = "configuration to xindex.lua",
       author = "Herbert Voss",
    copyright = "Herbert Voss",
      license = "LPPL 1.3"
}

indexheader = { 
  de = {"Symbole", "Zahlen"},
  en = {"Symbols", "Numbers"},
  fr = {"Symboles","Chiffre"},
  jp = {"シンボル","番号"},
}

folium = { 
  de = {"f", "ff"},
  en = {"f", "ff"},
  fr = {"\\,sq","\\,sqq"},
}


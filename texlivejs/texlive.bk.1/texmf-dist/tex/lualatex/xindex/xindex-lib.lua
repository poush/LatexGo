-----------------------------------------------------------------------
--         FILE:  xindex-lib.lua
--  DESCRIPTION:  library for xindex.lua
-- REQUIREMENTS:  
--       AUTHOR:  Herbert Voß
--      LICENSE:  LPPL1.3
-----------------------------------------------------------------------

if not modules then modules = { } end modules ['xindex-lib'] = {
      version = 0.07,
      comment = "main library  to xindex.lua",
       author = "Herbert Voss",
    copyright = "Herbert Voss",
      license = "LPPL 1.3"
}

local escapechar1 = "\""
local escapechar2 = "\"\""
local Letters = "ÄÖÜäöüabcdefghijklmnopqrstuvwxyzßABCDEFGHIJKLMNOPQRSTUVWXYZ"
local Digits = "0123456789"

-- Looks up the character `character´ in the alphabet and returns its 'normalization' for sorting
local function get_normalized_char( CharList, character )
  for i, alphabet_entry in ipairs(CharList) do
    for _, alphabet_char in ipairs(alphabet_entry) do
      if character == alphabet_char then
        return alphabet_entry[1]
      end
    end
  end
  return character
end

function Lower(strOrig)   -- return UTF string.lower
  local str = ""
  for i=1, utf.len(strOrig) do
    local c = utf.sub(strOrig,i,i)
    if c == "Ä" then str = str.."ä"
    elseif c == "Ö" then str = str.."ö"
    elseif c == "Ü" then str = str.."ü"
    else str = str..utf.lower(c)
    end
  end
  return str
end

function NormalizedLower(strOrig)  -- return normalized UTF string.lower (ä -> a)
  local str = ""
  for i=1, utf.len(strOrig) do
    local c = get_normalized_char(alphabet_lower,utf.sub(strOrig,i,i))
    str = str..string.lower(c)
  end
  return str
end

function NormalizedUpper(strOrig)  -- return normalized UTF string.upper (ä -> A)
  local str = ""
  for i=1, utf.len(strOrig) do
    local c = get_normalized_char(alphabet_lower,utf.sub(strOrig,i,i))
    str = str..string.upper(c)
  end
  strOrig = str
  str = ""
  for i=1, utf.len(strOrig) do
    local c = get_normalized_char(alphabet_upper,utf.sub(strOrig,i,i))
    str = str..string.upper(c)
  end
  return str
end

function checkVert(str) -- get the | part
  local vert = string.find(str,"|",1,true)
  if (vert) then 
    vertStr = string.sub(str,vert+1)
    str = string.sub(str,1,vert-1)
    return (vertStr)
  else
   return ("")
  end
end

function checkEntry(str) -- get the index entry name
  local at=string.find(str,"@")
  local excl=string.find(str,"!")
  if (excl and at) then
    if (at < excl) then 
      return string.sub(str,1,at-1)
    else 
      return string.sub(str,1,excl-1)
    end
  elseif (excl) then
    return string.sub(str,1,excl-1)
  elseif (at) then
    return string.sub(str,1,at-1)
  else
    return (str)
  end
end

function replaceAt(str)  -- return "bar"  from  "foo@bar" 
--  return str:gsub('[^!|@%s]+@', '')
  return str:gsub('[^!|@]+@', '')
end

function dofile(filename)
  local file = kpse.find_file(filename) 
  local f = assert(loadfile(file))
  return f()
end

-- see if the file exists
function file_exists(file)
local f = io.open(file, "rb")
if f then f:close() end
return f ~= nil
end

-- get all lines from a file, returns an empty 
-- list/table if the file does not exist
function read_lines_from(infile)
  if not file_exists(infile) then return {} end
  local lines = {}
  local str
  local c
  for line in io.lines(infile) do 
    if line ~= "" then
      if string.find(line,'\\indexentry',1,true) then
        str = line:gsub('^\\%a+%s*{','{')  -- remove "\\indexentry "
        writeLog(1,"read_lines: str="..str.." ("..utf.sub(str,2,2)..")\n",2)
        if getCharType(utf.sub(str,2,2)) == 0 then   -- we have a symbol
          lines[#lines + 1] = str:gsub('^{*','{ ')  -- add a space before the symbol
        else 
          lines[#lines + 1] = str
        end
      else
        lines[#lines + 1] = "\\MACRO<<< "..line  -- allow macros between entries
      end
    end
  end
  return lines
end

function array_concat(...) 
    local t = {}
    for n = 1,select("#",...) do
        local arg = select(n,...)
        if type(arg)=="table" then
            for _,v in ipairs(arg) do
                t[#t+1] = v
            end
        else
            t[#t+1] = arg
        end
    end
    return t
end

function findSequences(a) -- look for 1,2,3,4, ... 
  local b = {}
  local firstPage = a[1]     			-- first page in the sequence
  for i=2,#a do              			-- next page until end of page list
    if a[i]-a[i-1] > 1 then  			-- not next page
      lastPage = a[i-1]      			-- new start for a sequence search
      if lastPage - firstPage >= minCompress then 		-- sequence found
        b[#b+1]= tostring(firstPage).."--"..tostring(lastPage)
      else
        b[#b+1]= firstPage
        if (firstPage ~= lastPage) then b[#b+1]= lastPage end
      end 
      firstPage=a[i]
    end
  end
  if a[#a] - firstPage > 2 then  -- test file end
    b[#b+1]= tostring(firstPage).."--"..tostring(a[#a])
  else
    b[#b+1]= firstPage
    if (firstPage ~= a[#a]) then b[#b+1]= a[#a] end
  end 
  return (b)
end


function deleteOpenClose(v) -- remove |( and/or |)
  res, _ = string.gsub(v:gsub('\\[()]%s*$', ''), '\\[()]%s*', ' \\')
  return res
end

-- "\)  " -> ""
-- "\)foo" -> \foo

function checkParenthesis(Entries) -- search for |( ... |) entries
  local paraOpen
  local paraClose
  local firstPage = 0
  local lastPage
  local newEntries = {}
  for k,v in pairs(Entries) do
    if (k % 50) == 0 then writeLog(1,".",1) end
    if v["Entry"] then 
      v["Entry"] = replaceAt(v["Entry"])  -- foo@bar!baz@foobar -> bar!foobar
      CurrentEntry = v["Entry"]
      paraOpen = v["pages"][1]["special"]:find("\\(",1,true)
      paraClose = v["pages"][1]["special"]:find("\\)",1,true)
      if paraOpen then 
        firstPage = v["pages"][1]["number"]
      elseif paraClose then
        lastPage = v["pages"][1]["number"]
        newEntries[#newEntries+1] = { Entry   = v["Entry"],
                                      pages   = {{ number  = firstPage.."--"..lastPage,
                                                  special = deleteOpenClose(v["pages"][1]["special"])}},
                                      sortChar= v["sortChar"],
                                      Macro   = v["Macro"]
                                    }
        firstPage = 0
      elseif ((firstPage == 0) and not paraClose) then
        newEntries[#newEntries+1] = v    -- same Entry with greater page or new entry
      end
    end
  end
  return newEntries
end

function replaceVerticalChar(v)
--  res, _ = string.gsub(v:gsub('|[()]$', ''), '|[()]?', ' \\')
--  return res
  if not v:match('|') then 
    return v,""
  else 
    return v:gsub('|.*',''), v:match('|.*'):gsub('|','\\'):gsub("%s+", "")  -- part before, part after | without spaces
  end
end

function getEntryAndPage(w, nextW, EntryList) 
-- \indexentry{Aachen, Johann von}{VII/1-215}
-- \indexentry {Document@\idxtextClasses !IEEEtran@{\sfffffamily IEEEtran}}{185}
--  if indexEntry(w) then
    local macro = nil
    if string.find(nextW,"\\MACRO<<< ") then
      macro = string.gsub(nextW,'\\MACRO<<<','') 
    end
    local entry, pageNo = w:match('{(.*)}%s*{(.*)}')
--    if numericPage then 
--      if tonumber(pageNo) then -- check for roman numbering
--        pageNo = tonumber(pageNo) 
--      end
--    end
    local IndexString, Special = replaceVerticalChar(entry)
    EntryList[#EntryList+1] = { 
      Entry   = IndexString,   -- the index item  foo@bar 
      pages   = {{
        number = pageNo,
        special = Special  }},  -- the page number(s) and the part after |
      sortChar= NormalizedUpper(utf.sub(IndexString,1,1)), --    :byte(), -- Initial for later output
      Macro   = macro
    }
  if args_v then 
    if Special == "" then Special = "-" end
    writeLog(1,"getEntryAndPage: "..tostring(IndexString,pageNo,Special,utf.sub(IndexString,1,1),macro).."\n",2) 
  end
  return EntryList
end

function compressEntryList(EntryList)
--  require 'xindex-pretty'.dump(EntryList)   -- only for internal dump
  local newList = {}
  newList[1] = EntryList[1]  -- at least one entry
  local nPages = 1
  for k=2,#EntryList do
    if EntryList[k] then  -- exists? 
      local vEntry = EntryList[k]["Entry"]
      local last = EntryList[k-1]   -- complete data
      if (getSortString(last["Entry"]) == getSortString(vEntry)) then  -- Entry exists -> add page
--  require 'xindex-pretty'.dump(EntryList)   -- only for internal dump
--  require 'xindex-pretty'.dump(newList)   -- only for internal dump
        if (newList[#newList]["pages"][nPages]["number"] ~= EntryList[k]["pages"][1]["number"])    -- different pages or special?
           or (newList[#newList]["pages"][nPages]["special"] ~= EntryList[k]["pages"][1]["special"]) then
          newList[#newList]["pages"][nPages+1] = EntryList[k]["pages"][1]
          nPages = nPages + 1
--  require 'xindex-pretty'.dump(newList)   -- only for internal dump
        else
          -- gleiche Entries, gleiche Seiten, gleiche specials -> nichts tun
        end
      else  -- not the same entry
--  require 'xindex-pretty'.dump(newList)   -- only for internal dump
        newList[#newList]["pages"] = deletePageDups(newList[#newList]["pages"]) 
        newList[#newList+1] = EntryList[k] 
        nPages = 1
      end
    end
  end
  -- last data line
  newList[#newList]["pages"] = deletePageDups(newList[#newList]["pages"]) 
--  require 'xindex-pretty'.dump(newList)   -- only for internal dump
  return newList
end

--[[   example entry
EntryList[2] = { 
      Entry   = "Johann",   -- the index item  foo@bar 
      pages   = {           -- the page number(s) and the part after |
        { number  = 111,
          special = '\\emph'  },
        { number  = 11,
          special = "\\textit"}
      },  
      sortChar= "", -- Initial for later output
      Macro   = ""
}
]]


function deletePageDups(pages)
  if #pages == 1 then return pages end
  local newPages = {pages[1]}
  local notfound
  for i=2,#pages do
    notfound = true
    for j=1,#newPages do
      if (pages[i]["number"] == newPages[j]["number"]) and (pages[i]["special"] == newPages[j]["special"]) then 
        notfound = false
        break
      end
    end
    if notfound then 
      newPages[#newPages+1] = pages[i]
    end
  end
  return newPages
end


function compressPageList(pages) --  called with (v["pages"])
  writeLog(1,"compressPageList: we have "..#pages.." pages for this entry\n",2)
--  require 'xindex-pretty'.dump(pages)   -- only for internal dump
  pages = deletePageDups(pages)  -- delete duplicate page numners with same special
  local str
  if #pages == 1 then -- only one pageno
    return pages
  end  -- only one pageno
  if #pages == 2 then  -- only two pages
    if tonumber(pages[1]["number"]) and tonumber(pages[2]["number"]) then
      if ((tonumber(pages[2]["number"]) - tonumber(pages[1]["number"])) == 1) and 
          (pages[1]["special"] == pages[2]["special"]) then 
        pages[1]["number"] = pages[1]["number"].."f"  
        pages[2] = nil
--      elseif (pages[1]["number"] == pages[2]["number"]) and
--             (pages[1]["special"] == pages[2]["special"]) then 
--        pages[2] = nil
      end
    end
    return pages
  end 
  -- we have at least three pages
  pages[#pages+1] = {number = 9999999, special = ""}  -- dummy to sort the last real page number correct
  local startIndex
  local newPages = {}  -- { pages[1], pages[2], ... }
  local series = {}    -- { pages[1], pages[2], ... }
  if tonumber(pages[1]["number"]) then -- if a number we start with seconf page
    newPages = {}
    series = {pages[1]}
    startIndex = 2
  else                                 -- if not a number we start with third page
    newPages = {pages[1]}
    series = {pages[2]}
    startIndex = 3
  end
if args_v then   print ("compressPageList: more than two pages for the entry\n") end
  for i=startIndex,#pages do
    if tonumber(pages[i-1]["number"]) and tonumber(pages[i]["number"]) then  -- de we have something like 17--31 in the current list
      if ((tonumber(pages[i]["number"])-tonumber(pages[i-1]["number"])) == 1) and 
         (pages[i]["special"] == pages[i-1]["special"])  then   -- something like 12, 13 with identical |\special
        series[#series+1] = pages[i]--         page difference is 1, add page to series
      elseif (#series == 1) then    --     no -f page -> only one page -> output
        newPages[#newPages+1] = series[1]
        series = {pages[i]}
      elseif (#series > minCompress) then  -- we found series od f pages like 11, 12, 13, 14 
        -- the sequenz gets the special from the first page
        newPages[#newPages+1] = { number = series[1]["number"].."--"..series[#series]["number"], special = series[1]["special"]}  -- first..last
        series = {pages[i]}
      else -- series < minCompress
        if fCompress then
          if #series == 2 then -- two pages -> 3f
            writeLog(1,"compressPageList: Two consecutive pages for this entry\n",2)
            if series[1]["special"] == series[2]["special"] then
              newPages[#newPages+1] = { number = series[1]["number"]..page_folium[1], special = series[1]["special"] }
            else
              newPages[#newPages+1] = series[1]   -- different |\special -> no compress to -f
              newPages[#newPages+1] = series[2]
            end
          else  -- must be #series=3
            if (series[1]["special"] == series[2]["special"]) and (series[2]["special"] == series[3]["special"]) then
              newPages[#newPages+1] = { number = series[1]["number"]..page_folium[2], special = series[1]["special"] }  -- three pages 
            elseif (series[1]["special"] == series[2]["special"]) then
              newPages[#newPages+1] = { number = series[1]["number"]..page_folium[1], special = series[1]["special"] }  -- three pages 
              newPages[#newPages+1] = series[3]
            elseif (series[2]["special"] == series[3]["special"]) then
              newPages[#newPages+1] = series[1]
              newPages[#newPages+1] = { number = series[2]["number"]..page_folium[1], special = series[2]["special"] }  -- three pages 
            else  -- all different specials 
              newPages[#newPages+1] = series[1] 
              newPages[#newPages+1] = series[2]
              newPages[#newPages+1] = series[3]
            end
          end
        else
          for i=1,#series do
            newPages[#newPages+1] = series[i]
          end
        end
        series = {pages[i]}
      end
    else -- current or forgoing page is not a number, we simply add it
      if tonumber(pages[i]["number"]) then -- p[i-1] is non numeric p[i] is ok and not last no
        series = {pages[i]}
      else    --  current page is non numeric
        if (#series > minCompress) then  -- we found a page series
          newPages[#newPages+1] = { number = series[1]["number"].."--"..series[#series]["number"], -- first..last
                                    special =series[1]["special"] }
          series = {pages[i]}
        else -- series < minCompress
          for i=1,#series do
            newPages[#newPages+1] = series[i]
          end
          series = {pages[i]}
        end
      end  
    end
  end
--  require 'xindex-pretty'.dump(newPages)
  return newPages
end


-- 2 letter
-- 1 digit
-- 0 symbol

UTFdatafile = kpse.find_file("xindex-unicode.lua")
local category_data = dofile(UTFdatafile)
local floor = math.floor

local function binary_range_search(code_point, ranges)
    local low, mid, high
    low, high = 1, #ranges
    while low <= high do
        mid = floor((low + high) / 2)
        local range = ranges[mid]
        if code_point < range[1] then
            high = mid - 1
        elseif code_point <= range[2] then
            return range, mid
        else
            low = mid + 1
        end
    end
    return nil, mid
end

function get_category(code_point)
    if category_data.singles[code_point] then
        return category_data.singles[code_point]
    else
        local range = binary_range_search(code_point, category_data.ranges)
        return range and range[3] or "Cn"
    end
end

function getCharType(c)
--  print ("getCharType c="..c..": codepoint="..utf8.codepoint(c))
  local category = get_category(utf8.codepoint(c))
--  print ("getCharType: "..category)
  if category == "Nd" then return 1 
  elseif category:sub(1, 1) == "L" then return 2
  else return 0
  end 
end

--print(get_category(utf8.codepoint('ö')))
--print(category_to_number(get_category(utf8.codepoint('ö'))))

function getCharTypeOld(c) -- in case of Lua < 5.3 (has no utf support)
  if utf.find(Letters,c,1,true) then return 2 
  elseif utf.find(Digits,c,1,true) then return 1 
  else return 0
  end
end

-- string.gsub('{Entry}{page}', '{[^{}]*}$', '')  -> {Entry}
-- str = "\indexentry {foo}{bar}"
-- first, second = str:match('{([^}]*)}%s*{([^}]*)}')  -> foo, bar

function UTFCompare(a,b)  
-- a, b are something like \indexentry{foo}{bar}
--  writeLog(1,"UTFCompare:  "..a["Entry"]..", "..a["pages"][1]["number"].." - "..b["Entry"]..", "..b["pages"][1]["number"].."\n",2)
--  k = k + 1
--  if (k % 50) == 0 then writeLog(1,".",1) end
  local A,B,Apage,Bpage
  if numericPage then
    if tonumber(a["pages"][1]["number"]) then
      Apage = string.format("%09d",a["pages"][1]["number"])
    else
      Apage = string.format("%09d",romanToNumber(a["pages"][1]["number"]))
    end
    if tonumber(b["pages"][1]["number"]) then
      Bpage = string.format("%09d",b["pages"][1]["number"])
    else
      Bpage = string.format("%09d",romanToNumber(b["pages"][1]["number"]))
    end
  else
    Apage = string.format("%09s",a["pages"][1]["number"])
    Bpage = string.format("%09s",b["pages"][1]["number"])
  end
  A = NormalizedUpper(getSortString(a["Entry"].." "..Apage..a["pages"][1]["special"]):gsub('!','')) -- replace! by empty
  B = NormalizedUpper(getSortString(b["Entry"].." "..Bpage..b["pages"][1]["special"]):gsub('!',''))
  writeLog(1,"UTFCompare: A--B "..A.."--"..B.."\n",2)
-- print(A,B)
--[[ 
  if A == B then  -- same entry, use also page number
    Apage = string.format("%09s",a["pages"][1]["number"])
    Bpage = string.format("%09s",b["pages"][1]["number"])
    A = string.format("%-90s",A)..Apage
    B = string.format("%-90s",B)..Bpage
  end
  if numericPage then
    if tonumber(a["pages"][1]["number"]) then
      Apage = string.format("%09d",a["pages"][1]["number"])
    else
      Apage = string.format("%09d",romanToNumber(a["pages"][1]["number"]))
    end
    if tonumber(b["pages"][1]["number"]) then
      Bpage = string.format("%09d",b["pages"][1]["number"])
    else
      Bpage = string.format("%09d",romanToNumber(b["pages"][1]["number"]))
    end
  else
    Apage = string.format("%09s",a["pages"][1]["number"])
    Bpage = string.format("%09s",b["pages"][1]["number"])
  end
  A = string.format("%-90s",A)..Apage
  B = string.format("%-90s",B)..Bpage
]]
  return A < B
end

function pageCompare(a,b)  -- a = {{number=...,special=..},{...,...}}
-- a["number"], b["number"] are something like "3" or "VI-17" or "9--31"
  writeLog(1,"pageCompare: "..a["number"].."  "..b["number"].."\n",2) 
  if (a["number"] == nil) or (b["number"] == nil) then return true end   -- should be no nil here
  local a0 = a["number"]  -- can be numeric or alphanumeric
  local b0 = b["number"]
--  if pageNoPrefixDel ~= "" then                 ---- not active
--    A = (a0:gsub(pageNoPrefixPattern,''))
--    B = (b0:gsub(pageNoPrefixPattern,''))
--    a0 = tonumber(A) or romanToNumber(A)
--    b0 = tonumber(B) or romanToNumber(B)
--  else
  if numericPage then
    if (type(a0) == "number") and (type(b0) == "number") then return a0 < b0 end
    if romanToNumber(a0) and (type(b0) == "number") then return true end -- ii < 2
    if (type(a0) == "number") and romanToNumber(b0) then return false end -- ii > 2
    if romanToNumber(a0) and romanToNumber(b0) then return a0 < b0 end -- ii < iii
    -- now we have some special page numbers 
    A = tostring(a0)
    B = tostring(b0)
    A1 = A:find("--",1,true) or A:find("f",1,true)  -- sequence or folio pages
    B1 = B:find("--",1,true) or B:find("f",1,true)
    if A1 then a0 = tonumber(A:sub(1,A1-1)) end
    if B1 then b0 = tonumber(B:sub(1,B1-1)) end
    return tonumber(a0) < tonumber(b0)  -- numeric
  else
    return a0 < b0                      -- alphanumeric (strings)
  end
end

function checkFF(p)
  if not p then return p end
  local P = tostring(p)
  if P:find("ff") then 
    return P:gsub('%a+','').."\\nohyperpage{"..page_folium[2].."}"
  elseif P:find("f") then 
    return P:gsub('%a+','').."\\nohyperpage{"..page_folium[1].."}" 
  else 
    return P
  end
end

function getRawPages(v)
  writeLog(1,"getRawPages, Entry: "..v["Entry"]..",  page: "..tostring(v["pages"][1]["number"]),2)
  if v then
    local str = tostring(v["pages"][1]["number"]).."("..tostring(v["pages"][1]["special"])..")"
    for i=2,#v["pages"] do 
      if v["pages"] then 
        str = str..", "..tostring(v["pages"][i]["number"]).."("..tostring(v["pages"][i]["special"])..")" 
      end
    end
    return str
  else
   return "v->nil"
  end
end

function getRawPagesP(p) -- does the same but uses table pages
  if p then
    local str = tostring(p[1]["number"]).."("..tostring(p[1]["special"])..")"
    for i=2,#p do 
      if p then 
        str = str..", "..tostring(p[i]["number"]).."("..tostring(p[i]["special"])..")" 
      end
    end
    return str
  else
   return "pages->nil"
  end
end


function getPageList(v,hyperpage)
  if specialGetPageList then
    local pageNo = specialGetPageList(v,hyperpage)
    return pageNo
  end
  local Pages = {}
  if v["pages"] then
    table.sort(v["pages"],pageCompare)-- nur nötig, da User manuell eine Zeile einfügen kann
    if specialCompressPageList then
      Pages = specialCompressPageList(v["pages"])
    else
      Pages = compressPageList(v["pages"])
    end
--  require 'xindex-pretty'.dump(Pages)   -- only for internal dump
    local pageNo
--[[
\indexentry{Auto|hyperindexformat{\textbf}}{1}
->   \item Auto, \hyperindexformat{\textbf}{1}

    add for example  \hyperpage{5\nohyperpage{f}}  , same for ff

  \item foo, \hyperpage{1\nohyperpage{f}}, 
		\hyperpage{4\nohyperpage{ff}}, \hyperpage{8}

]]
    if hyperpage then
        if string.find(v["pages"][1]["special"],"hyperindexformat") then
          pageNo = v["pages"][1]["special"].."{"..checkFF(Pages[1]["number"].."}")
        else
          pageNo = "\\hyperpage{"..checkFF(Pages[1]["number"]).."}"
        end
      for i=2,#Pages do
        if string.find(v["pages"][i]["special"],"hyperindexformat") then
          pageNo = pageNo..", "..v["pages"][i]["special"].."{"..checkFF(Pages[i]["number"].."}")
        else
          pageNo = pageNo..", \\hyperpage{"..checkFF(Pages[i]["number"]).."}"
        end
--        Pages[i] = nil
      end
    else
      writeLog(1,"getPageList: "..tostring(Pages[1]["special"]).."{"..tostring(Pages[1]["number"]).."}\n",2) 
      if (Pages[1]["special"] == nil) or (Pages[1]["number"] == nil) then return ""  end 
      pageNo = Pages[1]["special"].."{"..Pages[1]["number"].."}" 
      for i=2,#Pages do
        if Pages[i]["number"] then
          pageNo = pageNo..", "..Pages[i]["special"].."{"..Pages[i]["number"].."}"
          Pages[i] = {}
        end
      end
    end
    return pageNo
  else
    return ""
  end
end


function getPathFileExt(str)
  local filepath = str:match("(.*[/\\])")
  local filename = str:match("^.+/(.+)$")
  local fileext = str:match("^.+(%..+)$")
  return filepath,filename,fileext
end

function printList(Index,level)
  for k,v in pairs(Index) do 
   if v["Entry"] then
    local sortChar = v["sortChar"]
    if v["Entry"] and v["Macro"] then
      writeLog(1,"Entry: "..v["Entry"].."; Pages: "..getRawPages(v).."Special: "..v["pages"][1]["special"].."; Type: "..sortChar.."; Macro: "..v["Macro"].."\n",level)
    else
      writeLog(1,"Entry: "..v["Entry"].."; Pages: "..getRawPages(v).."Special: "..v["pages"][1]["special"].."; Type: "..sortChar.."; Macro: nil".."\n",level)
    end
   end
  end
end

function getItem(str,n)
  if n >= 0 then 
    local item = (str:gsub("!.*", "%0!")
                     :gsub("[^!]*!", "", n)
                     :match("^([^!]*)!") ) 
    writeLog(1,"getItem ("..str..", "..n..") = "..item.."\n",2)
    return item
  end
end

local romanMap = { 
    I = 1,
    V = 5,
    X = 10,
    L = 50,
    C = 100, 
    D = 500, 
    M = 1000,
}

local numbers = { 1, 5, 10, 50, 100, 500, 1000 }
local romanchars = { "I", "V", "X", "L", "C", "D", "M" }
local RomanNumerals = { }

function numberToRoman(s)
    --s = tostring(s)
    s = tonumber(s)
    if not s or s ~= s then error"Unable to convert to number" end
    if s == math.huge then error"Unable to convert infinity" end
    s = math.floor(s)
    if s <= 0 then return s end
	local ret = ""
        for i = #numbers, 1, -1 do
        local num = numbers[i]
        while s - num >= 0 and s > 0 do
            ret = ret .. romanchars[i]
            s = s - num
        end
        for j = 1, i - 1 do
            local n2 = numbers[j]
            if s - (num - n2) >= 0 and s < num and s > 0 and num - n2 ~= n2 then
                ret = ret .. romanchars[j] .. romanchars[i]
                s = s - (num - n2)
                break
            end
        end
    end
    return ret
end

function romanToNumber(s)
--  if args_v then print("romanToNumber: "..tostring(s)) end
--  if not s then return end
  s = s:upper()
  local ret = 0
  local i = 1
  while i <= s:len() do
    local c = s:sub(i, i)
    if c ~= " " then -- allow spaces
      local m = romanMap[c] 
      if not m then return nil end           --error("Unknown Roman Numeral '" .. c .. "'")
      local next = s:sub(i + 1, i + 1)
      local nextm = romanMap[next]
      if next and nextm then
        if nextm > m then 
          ret = ret + (nextm - m)
          i = i + 1
        else
          ret = ret + m
        end
      else
        ret = ret + m
      end
    end
      i = i + 1
  end
  return ret
end

function commandEntry(line)
  return string.find(line,"\\MACRO<<<",1,true)
end

function checkHyperpage(lines)
  local hyperpage = false
  for i=1,#lines do
    if string.find(lines[i],'hyperpage}') then
      hyperpage = true
      break
    end
  end
  if hyperpage then
    for i=1,#lines do
      lines[i] = string.gsub(lines[i],'|?hyperpage}{','}{')
    end
    return true, lines
  else
     return false, lines
  end
  return
end

function itemOutput(last, v, hyperpage)
  local lastItems = last
  local currentItems = {}
  local Entry = v["Entry"]
--  require 'xindex-pretty'.dump(v)   -- only for internal dump
  local str
  local excl = select(2,string.gsub(Entry,"!","!")) -- Number of !
  writeLog(1,"itemOutput(): We have entry "..Entry.."\n",2)
  writeLog(1,"itemOutput(): The entry has "..excl.." Exclamation characters\n",2)
  if excl == 0 then
    str = "  \\item "..Entry..itemPageDelimiter.." "..getPageList(v,hyperpage).."\n"
    for i, str0 in ipairs(escape_chars) do       -- undo the escape char setting
      str = str:gsub(str0[2],str0[3])
    end
    outFile:write(str)
    lastItems = {}
    lastItems[1] = Entry
  else  
    for i = 1,excl+1 do
      currentItems[i] = getItem(Entry,i-1)  -- 0 ! 1 ! 2 ! ...
      local item = "item"
      if (currentItems[i] ~= lastItems[i]) then
        writeLog(1,"itemOutput: currentItems[i]: "..tostring(currentItems[i]).."~= lastItems[i]: "..tostring(lastItems[i]).."\n",2)
        local space = "  "
        for j = 2,i do 
          item = "sub"..item   -- get the sub...subitem
          space = space.."  "
        end 
        if not sublabels[i] then sublabels[i] = "---" end    -- only three levels are predefined
        writeLog(1,"itemOutput: currentItems[i]: "..currentItems[i].."; item: "..item.."\n",2)
        if (i == 1) and (item == "item") then
          str = space.."\\"..item.." "..sublabels[i]..currentItems[i].."\n"
        else
          str = space.."\\"..item.." "..sublabels[i]..currentItems[i]..itemPageDelimiter.." "..getPageList(v,hyperpage).."\n"
        end  
        for i, str0 in ipairs(escape_chars) do       -- undo the escape char setting
          str = string.gsub(str,str0[2],str0[3])
        end
        outFile:write(str)
        lastItems[i] = currentItems[i]
      else
        writeLog(1,"itemOutput: currentItems[i]: "..currentItems[i].."= lastItems[i]: "..lastItems[i].."\n",2)
      end
    end
  end
  return lastItems
end

--  \item Bugenhagen, {VII/1-16}, {166}, {17}, {215}, {222f}, {226}, {237f}, {248}, {258f}, {263}, {269}, {316f}, {321}, {361}, {365f}, {368}, {385}, {431}, {57}, {65}, {68}, {71}, {714}, {728}, {73f}, {748}, {75}, {79}, {81}, {85}, {90f}, {VII/2/1-1013}, {1015}, {1049}, {1085}, {1088}, {1097--1100}, {1110}, {1114}, {1120}, {1126}, {1148}, {1175}, {1234}, {1236ff}, {761}, {782}, {785}, {799}, {803--811}, {813f}, {818}, {822f}, {829}, {832--835}, {839f}, {848f}, {851}, {857--862}, {864f}, {867--871}, {873}, {875}, {877}, {880}, {882}, {884}, {961}, {973}, {IX-277}
--    \subitem -\,Johannes, {VII/1-16}, {166}, {17}, {215}, {222f}, {226}, {237f}, {248}, {258f}, {263}, {269}, {316f}, {321}, {361}, {365f}, {368}, {385}, {431}, {57}, {65}, {68}, {71}, {714}, {728}, {73f}, {748}, {75}, {79}, {81}, {85}, {90f}, {VII/2/1-1013}, {1015}, {1049}, {1085}, {1088}, {1097--1100}, {1110}, {1114}, {1120}, {1126}, {1148}, {1175}, {1234}, {1236ff}, {761}, {782}, {785}, {799}, {803--811}, {813f}, {818}, {822f}, {829}, {832--835}, {839f}, {848f}, {851}, {857--862}, {864f}, {867--871}, {873}, {875}, {877}, {880}, {882}, {884}, {961}, {973}, {IX-277}

local match = function(expr)
  local C, Ct, S = lpeg.C, lpeg.Ct, lpeg.S
  local sep = S("@!|")
  local str = C((1 - sep)^0)
  local prefix = function(prefix)
    return function(match)
      return prefix .. match
    end
  end
  local idx = str * ( "@" * str / prefix("@")
                    + "!" * str / prefix("!")
                    + "|" * str / prefix("|"))^0
  return Ct(idx):match(expr)
end

function getSortString(Entry)
  local t = match(Entry)
--  require 'xindex-pretty'.dump(t)   -- only for internal dump
  local data = t[1]
  local c = utf.sub(data,1,1)
  if getCharType(c) == 0 then 
    data = " "..data
  end
  for i = 2,#t do 
    if not (t[i]:sub(1,1) == "@") then -- and not (t[i]:sub(1,1) == "|") then
      data = data..t[i]
    end
  end
  return data
end

function writeLog(i, str, level)  -- mode i 0->console; 1->logfile: 2->both
  if not_quiet then
    if level <= vlevel then  
      if (i ~= 1) or (i < 0) then io.write(tostring(str)) end
      if i > 0 then logFile:write(tostring(str)) end
    end
  else 
    if level < 0  then 
      io.write(tostring(str)) 
    elseif level == 0 then 
      logFile:write(tostring(str)) 
    end
  end
end

function string:split()
   local sep, fields = " ", {}
   local pattern = string.format("([^%s]+)", sep)
   self:gsub(pattern, function(c) fields[#fields+1] = c end)
   return fields
end



--\indexentry{hello@foo!world@foo!bar|bar}{60}


--[[
\indexentry {Schrift!Höhe}{64}
\indexentry {Schrift!Breite}{64}
\indexentry {Schrift!Tiefe}{64}

]]

function shellsort(a)
    local inc = math.ceil( #a / 2 )
    while inc > 0 do
        for i = inc, #a do
            local tmp = a[i]
            local j = i
            while j > inc and not UTFCompare(a[j-inc],tmp) do
                a[j] = a[j-inc]
                j = j - inc
            end
            a[j] = tmp
        end
        inc = math.floor( 0.5 + inc / 2.2 )
    end 
    return a
end
 
function stripLeadingSpaces(str)
  return str:gsub("^%s*(.-)%s*$", "%1")
end



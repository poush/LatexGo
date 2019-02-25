--- Pretty-printing Lua tables.
-- based on Steve Donovans Penlight package
-- Also provides a sandboxed Lua table reader and
-- a function to present large numbers in human-friendly format.
--

if not modules then modules = { } end modules ['xindex-pretty'] = {
      version = 0.07,
      comment = "dump a Lua table for debugging",
       author = "Steve Donovan",
    copyright = "Steve Donovan",
      license = "MIT"
}

local append = table.insert
local concat = table.concat
local mfloor, mhuge = math.floor, math.huge
local mtype = math.type

local original_tostring = tostring

--- Utility function that finds any patterns that match a long string's an open or close.
-- Note that having this function use the least number of equal signs that is possible is a harder algorithm to come up with.
-- Right now, it simply returns the greatest number of them found.
-- @param s The string
-- @return 'nil' if not found. If found, the maximum number of equal signs found within all matches.
local function has_lquote(s)
    local lstring_pat = '([%[%]])(=*)%1'
    local equals, new_equals, _
    local finish = 1
    repeat
        _, finish, _, new_equals = s:find(lstring_pat, finish)
        if new_equals then
            equals = max(equals or 0, #new_equals)
        end
    until not new_equals

    return equals
end

--- Quote the given string and preserve any control or escape characters, such that reloading the string in Lua returns the same result.
-- @param s The string to be quoted.
-- @return The quoted string.

function quote_string(s)
--    assert_string(1,s)
    -- Find out if there are any embedded long-quote sequences that may cause issues.
    -- This is important when strings are embedded within strings, like when serializing.
    -- Append a closing bracket to catch unfinished long-quote sequences at the end of the string.
    local equal_signs = has_lquote(s .. "]")

    -- Note that strings containing "\r" can't be quoted using long brackets
    -- as Lua lexer converts all newlines to "\n" within long strings.
    if (s:find("\n") or equal_signs) and not s:find("\r") then
        -- If there is an embedded sequence that matches a long quote, then
        -- find the one with the maximum number of = signs and add one to that number.
        equal_signs = ("="):rep((equal_signs or -1) + 1)
        -- Long strings strip out leading newline. We want to retain that, when quoting.
        if s:find("^\n") then s = "\n" .. s end
        local lbracket, rbracket =
            "[" .. equal_signs .. "[",
            "]" .. equal_signs .. "]"
        s = lbracket .. s .. rbracket
    else
        -- Escape funny stuff. Lua 5.1 does not handle "\r" correctly.
        s = ("%q"):format(s):gsub("\r", "\\r")
    end
    return s
end

-- Patch tostring to format numbers with better precision
-- and to produce cross-platform results for
-- infinite values and NaN.
local function tostring(value)
    if type(value) ~= "number" then
        return original_tostring(value)
    elseif value ~= value then
        return "NaN"
    elseif value == mhuge then
        return "Inf"
    elseif value == -mhuge then
        return "-Inf"
    elseif (_VERSION ~= "Lua 5.3" or mtype(value) == "integer") and mfloor(value) == value then
        return ("%d"):format(value)
    else
        local res = ("%.14g"):format(value)
        if _VERSION == "Lua 5.3" and mtype(value) == "float" and not res:find("%.") then
            -- Number is internally a float but looks like an integer.
            -- Insert ".0" after first run of digits.
            res = res:gsub("%d+", "%0.0", 1)
        end
        return res
    end
end

local pretty = {}

local function quote_if_necessary (v)
    if not v then return ''
    else
        --AAS
        if v:find ' ' then v = quote_string(v) end
    end
    return v
end

local keywords

local function is_identifier (s)
    return type(s) == 'string' and s:find('^[%a_][%w_]*$') and not keywords[s]
end

local function quote (s)
    if type(s) == 'table' then
        return pretty.write(s,'')
    else
        --AAS
        return quote_string(s)-- ('%q'):format(tostring(s))
    end
end

local function index (numkey,key)
    --AAS
    if not numkey then
        key = quote(key)
         key = key:find("^%[") and (" " .. key .. " ") or key
    end
    return '['..key..']'
end

--- Create a string representation of a Lua table.
-- This function never fails, but may complain by returning an
-- extra value. Normally puts out one item per line, using
-- the provided indent; set the second parameter to an empty string
-- if you want output on one line.
-- @tab tbl Table to serialize to a string.
-- @string[opt] space The indent to use.
-- Defaults to two spaces; pass an empty string for no indentation.
-- @bool[opt] not_clever Pass `true` for plain output, e.g `{['key']=1}`.
-- Defaults to `false`.
-- @return a string
-- @return an optional error message

function pretty.dump (tbl,space,not_clever)
    if type(tbl) ~= 'table' then
        local res = tostring(tbl)
        if type(tbl) == 'string' then return quote(tbl) end
        return res, 'not a table'
    end
    if not keywords then
        keywords = {
            ["and"] = true, ["break"] = true,  ["do"] = true,
            ["else"] = true, ["elseif"] = true, ["end"] = true,
            ["false"] = true, ["for"] = true, ["function"] = true,
            ["if"] = true, ["in"] = true,  ["local"] = true, ["nil"] = true,
            ["not"] = true, ["or"] = true, ["repeat"] = true,
            ["return"] = true, ["then"] = true, ["true"] = true,
            ["until"] = true,  ["while"] = true
        }
    end
    local set = ' = '
    if space == '' then set = '=' end
    space = space or '  '
    local lines = {}
    local line = ''
    local tables = {}


    local function put(s)
        if #s > 0 then
            line = line..s
        end
    end

    local function putln (s)
        if #line > 0 then
            line = line..s
            append(lines,line)
            line = ''
        else
            append(lines,s)
        end
    end

    local function eat_last_comma ()
        local n = #lines
        local lastch = lines[n]:sub(-1,-1)
        if lastch == ',' then
            lines[n] = lines[n]:sub(1,-2)
        end
    end

    local writeit
    writeit = function (t,oldindent,indent)
        local tp = type(t)
        if tp ~= 'string' and  tp ~= 'table' then
            putln(quote_if_necessary(tostring(t))..',')
        elseif tp == 'string' then
            -- if t:find('\n') then
            --     putln('[[\n'..t..']],')
            -- else
            --     putln(quote(t)..',')
            -- end
            --AAS
            putln(quote_string(t) ..",")
        elseif tp == 'table' then
            if tables[t] then
                putln('<cycle>,')
                return
            end
            tables[t] = true
            local newindent = indent..space
            putln('{')
            local used = {}
            if not not_clever then
                for i,val in ipairs(t) do
                    put(indent)
                    writeit(val,indent,newindent)
                    used[i] = true
                end
            end
            for key,val in pairs(t) do
                local tkey = type(key)
                local numkey = tkey == 'number'
                if not_clever then
                    key = tostring(key)
                    put(indent..index(numkey,key)..set)
                    writeit(val,indent,newindent)
                else
                    if not numkey or not used[key] then -- non-array indices
                        if tkey ~= 'string' then
                            key = tostring(key)
                        end
                        if numkey or not is_identifier(key) then
                            key = index(numkey,key)
                        end
                        put(indent..key..set)
                        writeit(val,indent,newindent)
                    end
                end
            end
            tables[t] = nil
            eat_last_comma()
            putln(oldindent..'},')
        else
            putln(tostring(t)..',')
        end
    end
    writeit(tbl,'',space)
    eat_last_comma()
    return concat(lines,#space > 0 and '\n' or '')
end

return pretty

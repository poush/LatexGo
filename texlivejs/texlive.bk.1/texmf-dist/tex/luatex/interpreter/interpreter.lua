-- This is the main Lua file for the Interpreter package.
-- Further information in interpreter-doc.pdf or interpreter-doc.txt.
-- Paul Isambert - zappathustra AT free DOT fr - June 2012
--
-- Beware, this is written with Gates. Please read the Gates doc if
-- you want to understand something.

local find, gsub, match, sub = string.find, string.gsub, string.match, string.sub
local insert, sort, remove   = table.insert, table.sort, table.remove
local io_open                = io.open
local ipairs, pairs, type    = ipairs, pairs, type
require("gates.lua")
if not gates.iterator then
  tex.error("Interpreter error: Your version of Gates should be at least v.0.2. I quit. Expect chaos")
  return
end

interpreter = gates.new("interpreter")

-- *** interpreter.active ***
-- Following paragraphs (as defined by interpreter.paragraph) are interpreted
-- iff this is not set to false.
interpreter.active = true
-- *** interpreter.default_class ***
-- Sets the default class for patterns which are added without specifying the
-- class. Default 1.
interpreter.default_class = 1

interpreter.core = {
  classes = {}, -- The classes of patterns.
  lines   = {}, -- The lines of the paragraph.
  reader  = gates.new("interpreter_reader"), -- The main processing functions.
  tools   = gates.new("interpreter_tools")}  -- Auxiliary functions.

-- Utility function sorting patterns by length (alphabetically if they are of
-- equal length).
function interpreter.core.tools.sort (a, b)
  local a, b = a.pattern, b.pattern
  return #a == #b and a < b or #a > #b
end

-- *** interpreter.add_pattern (table) ***
-- Creates pattern <table>, which can contain the following entries:
-- pattern [string]   = The pattern to match. Magic characters are obeyed!
-- replace [string]   = The replacement for <pattern>. Can be a string, a
--                      table or a function. A simple string.gsub() is
--                      applied.
-- call    [function] = The function applied to <pattern>; <replace> is applied
--                      iff there is no <call>.
-- offset  [number]   = If <pattern> is used at index n, then the search on the
--                      same line for the same pattern starts again at index n
--                      + offset. Applied only when no <call> (in this case,
--                      search starts again at the beginning of the line). By
--                      default, offset = 0. This is needed to avoid infinite
--                      loops with replacements which contain the pattern;
--                      e.g. replacing "TeX" with "\TeX" will produce an
--                      infinite loop, unless offset = 2.
-- nomagic [boolean]  = Sets whether <replace> should be transformed with interpreter.nomagic.
-- class   [number]   = The pattern's <class> (classes of patterns are applied in
--                      order, e.g. all patterns in class 1 are applied, then
--                      all patterns in class 2, etc; class 0, however, is
--                      always applied last). If <class> is not given, the
--                      default_class number is used. Classes must be numbered
--                      consecutively.
interpreter.list{"add_pattern",
    {"ensure_class",
    function (tb)
      local class = tb.class or interpreter.default_class
      interpreter.set_class(class, {})
      setmetatable(tb, interpreter.core.classes[class].meta)
      return tb, class
    end},
    {"apply_nomagic", conditional = function (tb) return tb.nomagic end,
                      autoreturn = true,
    function (tb, class)
      tb.pattern = interpreter.nomagic(tb.pattern)
    end},
    {"insert_pattern", autoreturn = true,
        {"do_insert", autoreturn = true,
        function (tb, class)
          insert(interpreter.core.classes[class], tb)
        end},
        {"sort_class", autoreturn = true,
        function (tb, class)
          sort(interpreter.core.classes[class], interpreter.core.tools.sort)
        end}}}

-- *** interpreter.set_class (number, table) ***
-- Sets default values (of the table normally specified in add_pattern) for
-- patterns of class <number>; patterns added to this class can still specify
-- different values, which will override defaults. In other words, this is a
-- metatable for patterns (which are tables) of that class.
function interpreter.set_class (num, tb)
  interpreter.core.classes[num] = interpreter.core.classes[num] or
                                  { meta = { __index = function (_, k) return  interpreter.core.classes[num].meta[k] end } }
  for a, b in pairs(tb) do
    interpreter.core.classes[num].meta[a] = b
  end
  return interpreter.core.classes[num]
end

-- Class 0 must exist since it is always used at the end of the paragraph.
interpreter.set_class(0, {})

-- *** interpreter.nomagic (string) ***
-- Turns a normal string into a string with magic characters escaped, so it
-- can be used as a pattern.
interpreter.core.tools.magic_characters = {
  ["^"] = "%^",
  ["$"] = "%$",
  ["("] = "%(",
  [")"] = "%)",
  ["%"] = "%%",
  ["."] = "%.",
  ["["] = "%[",
  ["]"] = "%]",
  ["*"] = "%*",
  ["+"] = "%+",
  ["-"] = "%-",
  ["?"] = "%?",
}
function interpreter.nomagic (str)
  local i, s = 1, ""
  local magic_characters = interpreter.core.tools.magic_characters
  while i <= #str do
    local c, c2, c3 = sub(str, i, i), sub(str, i + 1, i + 1), sub(str, i + 2, i + 2)
    i = i + 1
    if c == "%"  and magic_characters[c2] then
      s = s .. c2
      i = i + 1
    elseif c == "." and c2 == "." and c3 == "." then
      s = s .. "(.-)"
      i = i + 2
    elseif magic_characters[c] then
      s = s .. "%" .. c
    else
      s = s .. c
    end
  end
  return s
end

-- *** interpreter.protect ([spec]) ***
-- Protects a set of lines in a paragraph; a protected line won't be
-- interpreted. If <spec> is a number, this protects line <spec> in the current
-- paragraph; if <spec> is true, this protects the entire current paragraph. Of
-- course, patterns that were applied to the line(s) or paragraph before
-- protection happened aren't undone.
function interpreter.protect (num)
  if type(num) == "number" then
    if type(interpreter.core.reader.protected) ~= "boolean" then
      interpreter.core.reader.protected = interpreter.core.reader.protected or {}
      interpreter.core.reader.protected[num] = true
    end
  else
    interpreter.core.reader.protected = true
  end
end

-- Utility function making a replacement in a string but only from a certain
-- position and only once. We can't let gsub unrestricted, because some
-- part(s) of the string might be protected.
function interpreter.core.tools.xsub (str, num, patt, rep)
  return sub(str, 1, num-1) .. gsub(sub(str, num), patt, rep, 1)
end

-- *** interpreter.protector (left [, right]) ***
-- Sets <left> and <right> (set to <left> if missing) as protectors, i.e.
-- enclosed material won't be processed even if the line is processed
-- otherwise.  For instance: after interpreter.protector ("|"), the word
-- "little" in
--
--     Hello, |little| world!
--
-- will be left untouched; Interpreter is terribly smart (thanks to lpeg), so
-- in "|a| b |c|", "b" isn't protected, as intended, because the "|" on its
-- left doesn't match the one on its right but with the one before "a".  An
-- example with <right> specified: interpreter.protector("[", "]") and
-- then:
--
--     Hello, [little] world!
--
-- achieves the same as above. Protectors AREN'T removed when the line is
-- finally passed to TeX; and there can be several protectors. Compare with
-- interpreter.escape.
local P, Cf, Cg, Cp, Ct, V = lpeg.P, lpeg.Cf, lpeg.Cg, lpeg.Cp, lpeg.Ct, lpeg.V
local _grammar
function interpreter.core.tools.protector (str, index)
  local protections = Cf(Ct("") * Cg{ _grammar + 1 * V(1) }^1, rawset)
  protections = protections:match(str)
  if protections then
    for a, b in pairs(protections) do
      if index > a and index < b then
        return nil, b
      end
    end
  end
  return index
end
function interpreter.protector (left, right)
  right = right or left
  local gram = P(Cp() * P(left) * (1 - P(right))^0 * Cp() * P(right))
  if _grammar then
    _grammar = _grammar + gram
  else
    _grammar = gram
  end
end

-- *** interpreter.escape ***
-- A string used as an escape character: if a pattern matches, it is processed
-- iff the character immediately to its left isn't <escape>. The escape
-- character IS removed once the lines have been processed, so TeX never sees
-- it; also, only one escape character is allowed, and itself can't be escaped
-- (i.e. it doesn't mean anything to try to escape it). E.g.:
--
--     interpreter.escape = "|"
--     ... this won't be |*processed*
--
-- Assuming you have a pattern with stars, here it won't be applied. Instead
-- "this won't be *processed*" will be passed to TeX (note that the escape
-- character has disappeared).

function interpreter.core.tools.get_index (str, patt, index)
  index = find(str, patt, index)
  if index then
    if sub(str, index-1, index-1) == interpreter.escape then
      return interpreter.core.tools.get_index(str, patt, index + 1)
    elseif _grammar then
      local right
      index, right = interpreter.core.tools.protector(str, index, patt)
      return index or interpreter.core.tools.get_index(str, patt, right + 1)
    else
      return index
    end
  end
end

-- *** interpreter.paragraph ***
-- The pattern that defines a line acting as a paragraph boundary,
-- prompting Interpreter to process the lines gathered up to now. Default is a
-- line composed of spaces at most.
interpreter.paragraph = "%s*"

-- *** interpreter.direct (pattern) ***
-- Sets the pattern defining a line as direct Lua code: if a line begins with
-- <pattern> (which itself shouldn't contain the beginning-of-string character "^")
-- the code that follows is processed as Lua code, and the line is turned to
-- an empty string; note that this empty string will be seen as a paragraph
-- boundary if the line happened in the middle of a paragraph and
-- interpreter.paragraph has set paragraph boundary to empty string.  Default
-- is "%%I " (two "%" followed by one "I" followed by at least one space
-- character).
interpreter.direct = "%%%%I%s+"

-- At last, the function to be registered in open_read_file, defining the
-- function that reads a file.

interpreter.core.reader.current_line = 0
interpreter.core.reader.current_line = 0

interpreter.core.reader.list{"read_file",
    {"make_paragraph", conditional = function () return #interpreter.core.lines == 0 end,
        {"aggregate_lines", loopuntil = function (_, line) return not line or gsub(line, "^" .. interpreter.paragraph .. "$", "") == "" end,
            {"read_line",
            function (f)
              return f, f:read()
            end},
            {"check_direct", conditional = function (_, line) return line and interpreter.direct end,
            function (f, line)
              if match(line, "^" .. interpreter.direct) then
                loadstring(gsub(line, "^" .. interpreter.direct, ""))()
                line = ""
              end
              return f, line
            end},
            {"insert_line", conditional = function (_, line) return line end,
                            autoreturn = true,
            function (f, line)
              insert(interpreter.core.lines, line)
            end}},
        {"apply_classes", conditional = function () return #interpreter.core.lines > 0 and interpreter.active end,
            {"pass_class", iterator = function ()
                                        local done_zero
                                        local function f (t, i)
                                          if type(interpreter.core.reader.protected) ~= "boolean" then
                                            if not done_zero then
                                              i = i+1
                                              local v = t[i]
                                              if v then
                                                return i, v
                                              else
                                                done_zero = true
                                                return 0, t[0]
                                              end
                                            end
                                          end
                                        end
                                        return f, interpreter.core.classes, 0
                                      end,
                {"pass_pattern", iterator = function (_, class) 
                                              local function f (t, i)
                                                if type(interpreter.core.reader.protected) ~= "boolean" then
                                                  i = i+1
                                                  local v = t[i]
                                                  if v then
                                                    return i, v
                                                  end
                                                end
                                              end
                                              return f, class, 0
                                            end,
                    {"process_lines", iterator = function (_, pattern)
                                               interpreter.core.reader.current_line = 0
                                               interpreter.core.reader.current_index = 0
                                               return function ()
                                                 if type(interpreter.core.reader.protected) ~= "boolean" then
                                                   local l = interpreter.core.reader.current_line
                                                   local i = interpreter.core.reader.current_index
                                                   if i == 0 then
                                                     l, i = l + 1, 1
                                                   end
                                                   line = interpreter.core.lines[l]
                                                   -- When protected, a line is a table.
                                                   while type(line) == "table" do
                                                     l, i = l+1, 1
                                                     line = interpreter.core.lines[l]
                                                   end
                                                   if line then
                                                     interpreter.core.reader.current_line = l
                                                     interpreter.core.reader.current_index = i
                                                     return l, pattern, i
                                                   end
                                                 end
                                               end
                                             end,
                            {"switch", autoreturn = true,
                            function (_, pattern)
                              if pattern.call then
                                interpreter.core.reader.ajar("call", "process_lines")
                              elseif pattern.replace then
                                interpreter.core.reader.ajar("replace", "process_lines")
                              end
                            end},
                            {"call", status = "close",
                            function(i, pattern, ind)
                              local line = interpreter.core.lines[i]
                              local index = interpreter.core.tools.get_index(line, pattern.pattern, ind)
                              if index then
                                local L, O = pattern.call(interpreter.core.lines, i, index, pattern)
                                if O then
                                  interpreter.core.reader.current_line = L
                                  interpreter.core.reader.current_index = O
                                elseif L then
                                  interpreter.core.reader.current_index = L
                                end
                              else
                                interpreter.core.reader.current_index = 0
                              end
                            end},
                            {"replace", status = "close",
                            function(i, pattern, ind)
                              local line = interpreter.core.lines[i]
                              local index = interpreter.core.tools.get_index(line, pattern.pattern, ind)
                              if index then
                                interpreter.core.lines[i] = interpreter.core.tools.xsub(line, index, pattern.pattern, pattern.replace)
                                interpreter.core.reader.current_index = index + (pattern.offset or 0)
                              else
                                interpreter.core.reader.current_index = 0
                              end
                            end},
                            {"protect", iterator = function ()
                                          if type(interpreter.core.reader.protected) == "table" then
                                            return pairs(interpreter.core.reader.protected)
                                          end
                                        end,
                            function (n)
                              if type(interpreter.core.lines[n]) == "string" then
                                interpreter.core.lines[n] = {interpreter.core.lines[n]}
                              end
                            end}}}},
            {"unprotect",
                {"undo_protected",
                function ()
                  interpreter.core.reader.protected = nil
                end},
                {"unprotect_lines", iterator = function () return ipairs(interpreter.core.lines) end,
                function (i, l)
                  if type(l) == "table" then
                    interpreter.core.lines[i] = l[1]
                  end
                end}},
            {"remove_escape", conditional = function () return interpreter.escape end,
            function ()
              for num, line in ipairs(interpreter.core.lines) do
                interpreter.core.lines[num] = gsub(line, interpreter.escape, "")
              end
            end}}},
    {"return_line",
    function ()
      return remove(interpreter.core.lines, 1)
    end}}

interpreter.core.reader.list{"input",
    -- *** interpreter.unregister () ***
    -- The function used to remove read_file from the "open_read_file" callback.
    -- Uses callback.register by default, or luatexbase.remove_from_callback if
    -- detected.
    {"unregister", autoreturn = true,
        {"set_unregister", conditional = function () return interpreter.type"unregister" == 0 end,
        function ()
          if luatexbase and luatexbase.remove_from_callback then
            function interpreter.unregister ()
              luatexbase.remove_from_callback("open_read_file", "interpreter")
            end
          else
            function interpreter.unregister ()
              callback.register("open_read_file", nil)
            end
          end
        end},
        {"use_unregister",
        function () -- You can't use the `unregister' gate directly, because it isn't created yet.
          interpreter.unregister()
        end}},
    {"open_file",
    function (fname)
      return io_open(fname)
    end},
    {"set_reader",
    function (f)
      return {reader = function () return interpreter.core.reader.read_file(f) end}
    end}}

function interpreter.reset ()
  interpreter.active = true
  interpreter.default_class = 1
  interpreter.core.classes = {}
  interpreter.set_class(0, {})
  _grammar = nil
  interpreter.escape  = nil
  interpreter.paragraph = "%s*"
  interpreter.direct = "%%%%I%s+"
end

-- *** interpreter.register (function) ***
-- The function used to register the read_file function in the
-- "open_read_file" callback.  If none is given, use callback.register, or
-- luatexbase.add_to_callback if detected (with "interpreter" as the name).
-- The function is defined in \interpretfile (see interpreter.tex).

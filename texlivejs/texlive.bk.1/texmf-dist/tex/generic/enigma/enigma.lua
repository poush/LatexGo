#!/usr/bin/env texlua
-----------------------------------------------------------------------
--         FILE:  enigma.lua
--        USAGE:  Call via interface from within a TeX session.
--  DESCRIPTION:  Enigma logic.
-- REQUIREMENTS:  LuaTeX capable format (Luaplain, ConTeXt).
--       AUTHOR:  Philipp Gesang (Phg), <phg42 dot 2a at gmail dot com>
--      VERSION:  release
--      CREATED:  2013-03-28 02:12:03+0100
-----------------------------------------------------------------------
--

--[[ichd--
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
\startdocsection[title=Format Dependent Code]
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

\startparagraph
Exported functionality will be collected in the table
\identifier{enigma}.
\stopparagraph
--ichd]]--

local enigma = { machines = { }, callbacks = { } }
local format_is_context = false

--[[ichd--
\startparagraph
Afaict, \LATEX\ for \LUATEX\ still lacks a globally accepted
namespacing convention. This is more than bad, but we’ll have to cope
with that. For this reason we brazenly introduce
\identifier{packagedata} (in analogy to \CONTEXT’s
\identifier{thirddata}) table as a package namespace proposal. If this
module is called from a \LATEX\ or plain session, the table
\identifier{packagedata} will already have been created so we will
identify the format according to its presence or absence, respectively.
\stopparagraph
--ichd]]--

if packagedata then            -- latex or plain
  packagedata.enigma = enigma
elseif thirddata then          -- context
  format_is_context = true
  thirddata.enigma  = enigma
else                           -- external call, mtx-script or whatever
  _ENV.enigma = enigma
end
--[[ichd--
\stopdocsection
--ichd]]--

--[[ichd--
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
\startdocsection[title=Prerequisites]
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
\startparagraph
First of all, we generate local copies of all those library functions
that are expected to be referenced frequently.
The format-independent stuff comes first; it consists of functions from
the
\identifier{io},
\identifier{lpeg},
\identifier{math},
\identifier{string},
\identifier{table}, and
\identifier{unicode}
libraries.
\stopparagraph
--ichd]]--

local get_debug_info               = debug.getinfo
local ioread                       = io.read
local iowrite                      = io.write
local mathfloor                    = math.floor
local mathrandom                   = math.random
local next                         = next
local nodecopy                     = node and node.copy
local nodeid                       = node and node.id
local nodeinsert_before            = node and node.insert_before
local nodeinsert_after             = node and node.insert_after
local nodelength                   = node and node.length
local nodenew                      = node and node.new
local noderemove                   = node and node.remove
local nodeslide                    = node and node.slide
local nodetraverse                 = node and node.traverse
local nodetraverse_id              = node and node.traverse_id
local nodesinstallattributehandler
local nodestasksappendaction
local nodestasksdisableaction
if format_is_context then
  nodesinstallattributehandler = nodes.installattributehandler
  nodestasksappendaction       = nodes.tasks.appendaction
  nodestasksdisableaction      = nodes.tasks.disableaction
end
local stringfind                   = string.find
local stringformat                 = string.format
local stringlower                  = string.lower
local stringsub                    = string.sub
local stringupper                  = string.upper
local tableconcat                  = table.concat
local tonumber                     = tonumber
local type                         = type
local utf8byte                     = unicode.utf8.byte
local utf8char                     = unicode.utf8.char
local utf8len                      = unicode.utf8.len
local utf8lower                    = unicode.utf8.lower
local utf8sub                      = unicode.utf8.sub
local utfcharacters                = string.utfcharacters

--- debugging tool (careful, this *will* break context!)
--dofile(kpse.find_file("lualibs-table.lua")) -- archaic version :(
--table.print = function (...) print(table.serialize(...)) end

local tablecopy
if format_is_context then
  tablecopy = table.copy
else -- could use lualibs instead but not worth the overhead
  tablecopy = function (t) -- ignores tables as keys
    local result = { }
    for k, v in next, t do
      if type(v) == table then
        result[k] = tablecopy(v)
      else
        result[k] = v
      end
    end
    return result
  end
end

local GLYPH_NODE                   = node and nodeid"glyph"
local GLUE_NODE                    = node and nodeid"glue"
local GLUE_SPEC_NODE               = node and nodeid"glue_spec"
local KERN_NODE                    = node and nodeid"kern"
local DISC_NODE                    = node and nodeid"disc"
local HLIST_NODE                   = node and nodeid"hlist"
local VLIST_NODE                   = node and nodeid"vlist"

local IGNORE_NODES = node and {
--[GLUE_NODE] = true,
  [KERN_NODE] = true,
--[DISC_NODE] = true,
} or { }

--[[ichd--
\startparagraph
The initialization of the module relies heavily on parsers generated by
\type{LPEG}.
\stopparagraph
--ichd]]--

local lpeg = require "lpeg"

local C,   Cb, Cc, Cf, Cg,
      Cmt, Cp, Cs, Ct
  = lpeg.C,   lpeg.Cb, lpeg.Cc, lpeg.Cf, lpeg.Cg,
    lpeg.Cmt, lpeg.Cp, lpeg.Cs, lpeg.Ct

local P, R, S, V, lpegmatch
    = lpeg.P, lpeg.R, lpeg.S, lpeg.V, lpeg.match

--local B = lpeg.version() == "0.10" and lpeg.B or nil

--[[ichd--
\startparagraph
By default the output to \type{stdout} will be zero. The verbosity
level can be adjusted in order to alleviate debugging.
\stopparagraph
--ichd]]--
--local verbose_level = 42
local verbose_level = 0

--[[ichd--
\startparagraph
Historically, Enigma-encoded messages were restricted to a size of 250
characters. With sufficient verbosity we will indicate whether this
limit has been exceeded during the \TEX\ run.
\stopparagraph
--ichd]]--
local max_msg_length = 250
--[[ichd--
\stopdocsection
--ichd]]--


--[[ichd--
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
\startdocsection[title=Globals]
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
\startparagraph
The following mappings are used all over the place as we convert back
and forth between the characters (unicode) and their numerical
representation.
\stopparagraph
--ichd]]--

local value_to_letter   -- { [int] -> chr }
local letter_to_value   -- { [chr] -> int }
local alpha_sorted      -- string, length 26
local raw_rotor_wiring  -- { string0, .. string5, }
local notches           -- { [int] -> int } // rotor num -> notch pos
local reflector_wiring  -- { { [int] -> int }, ... } // symmetrical
do
  value_to_letter = {
    "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m",
    "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z",
  }

  letter_to_value = {
    a = 01, b = 02, c = 03, d = 04, e = 05, f = 06, g = 07, h = 08,
    i = 09, j = 10, k = 11, l = 12, m = 13, n = 14, o = 15, p = 16,
    q = 17, r = 18, s = 19, t = 20, u = 21, v = 22, w = 23, x = 24,
    y = 25, z = 26,
  }
--[[ichd--
\startparagraph
The five rotors to simulate.\reference[listing:rotor_wiring]{}
Their wirings are created from strings at runtime, see below the
function \luafunction{get_rotors}.
\stopparagraph
--ichd]]--

  --[[
    Nice: http://www.ellsbury.com/ultraenigmawirings.htm
  ]]--
  alpha_sorted = "abcdefghijklmnopqrstuvwxyz"
  raw_rotor_wiring = {
    [0] = alpha_sorted,
          "ekmflgdqvzntowyhxuspaibrcj",
          "ajdksiruxblhwtmcqgznpyfvoe",
          "bdfhjlcprtxvznyeiwgakmusqo",
          "esovpzjayquirhxlnftgkdcmwb",
          "vzbrgityupsdnhlxawmjqofeck",
  }

--[[ichd--
\startparagraph
Notches are assigned to rotors according to the Royal Army
mnemonic.
\stopparagraph
--ichd]]--
  notches = { }
  do
    local raw_notches = "rfwkannnn"
    --local raw_notches = "qevjz"
    local n = 1
    for chr in utfcharacters(raw_notches) do
      local pos = stringfind(alpha_sorted, chr)
      notches[n] = pos - 1
      n = n + 1
    end
  end

--[[ichd--
\placetable[here][listing:reflector]%
  {The three reflectors and their substitution rules.}{%
  \starttabulate[|r|l|]
    \NC UKW a \NC AE BJ CM DZ FL GY HX IV KW NR OQ PU ST \NC \NR
    \NC UKW b \NC AY BR CU DH EQ FS GL IP JX KN MO TZ VW \NC \NR
    \NC UKW c \NC AF BV CP DJ EI GO HY KR LZ MX NW QT SU \NC \NR
  \stoptabulate
}
--ichd]]--

  reflector_wiring = { }
  local raw_ukw = {
    { a = "e", b = "j", c = "m", d = "z", f = "l", g = "y", h = "x",
      i = "v", k = "w", n = "r", o = "q", p = "u", s = "t", },
    { a = "y", b = "r", c = "u", d = "h", e = "q", f = "s", g = "l",
      i = "p", j = "x", k = "n", m = "o", t = "z", v = "w", },
    { a = "f", b = "v", c = "p", d = "j", e = "i", g = "o", h = "y",
      k = "r", l = "z", m = "x", n = "w", q = "t", s = "u", },
  }
  for i=1, #raw_ukw do
    local new_wiring = { }
    local current_ukw = raw_ukw[i]
    for from, to in next, current_ukw do
      from = letter_to_value[from]
      to   = letter_to_value[to]
      new_wiring[from] = to
      new_wiring[to]   = from
    end
    reflector_wiring[i] = new_wiring
  end
end

--[[ichd--
\stopdocsection
--ichd]]--

--[[ichd--
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
\startdocsection[title=Pretty printing for debug purposes]
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
\startparagraph
The functions below allow for formatting of the terminal output; they
have no effect on the workings of the enigma simulator.
\stopparagraph
--ichd]]--

local emit
local pprint_ciphertext
local pprint_encoding
local pprint_encoding_scheme
local pprint_init
local pprint_machine_step
local pprint_new_machine
local pprint_rotor
local pprint_rotor_scheme
local pprint_step
local polite_key_request
local key_invalid
do
  local eol = "\n"

  local colorstring_template = "\027[%d;1m%s\027[0m"
  local colorize = function (s, color)
    color = color and color < 38 and color > 29 and color or 31
    return stringformat(colorstring_template,
                        color,
                        s)
  end

  local underline = function (s)
    return stringformat("\027[4;37m%s\027[0m", s)
  end

  local s_steps     = [[Total characters encoded with machine “]]
  local f_warnsteps = [[ (%d over permitted maximum)]]
  pprint_machine_step = function (n, name)
    local sn
    name = colorize(name, 36)
    if n > max_msg_length then
      sn = colorize(n, 31) .. stringformat(f_warnsteps,
                                           n - max_msg_length)
    else
      sn = colorize(n, 37)
    end
    return s_steps .. name .. "”: " .. sn .. "."
  end
  local rotorstate = "[s \027[1;37m%s\027[0m n\027[1;37m%2d\027[0m]> "
  pprint_rotor = function (rotor)
    local visible = rotor.state % 26 + 1
    local w, n    = rotor.wiring, (rotor.notch - visible) % 26 + 1
    local tmp = { }
    for i=1, 26 do
      local which = (i + rotor.state - 1) % 26 + 1
      local chr   = value_to_letter[rotor.wiring.from[which]]
      if i == n then -- highlight positions of notches
        tmp[i] = colorize(stringupper(chr), 32)
      --elseif chr == value_to_letter[visible] then
      ---- highlight the character in window
      --  tmp[i] = colorize(chr, 33)
      else
        tmp[i] = chr
      end
    end
    return stringformat(rotorstate,
                        stringupper(value_to_letter[visible]),
                        n)
        .. tableconcat(tmp)
  end

  local rotor_scheme = underline"[rot not]"
                    .. "  "
                    .. underline(alpha_sorted)
  pprint_rotor_scheme = function ()
    return rotor_scheme
  end

  local s_encoding_scheme = eol
                         .. [[in > 1 => 2 => 3 > UKW > 3 => 2 => 1]]
  pprint_encoding_scheme = function ()
    return underline(s_encoding_scheme)
  end
  local s_step     = " => "
  local stepcolor  = 36
  local finalcolor = 32
  pprint_encoding = function (steps)
    local nsteps, result = #steps, { }
    for i=0, nsteps-1 do
      result[i+1] = colorize(value_to_letter[steps[i]], stepcolor)
                 .. s_step
    end
    result[nsteps+1] = colorize(value_to_letter[steps[nsteps]],
                                finalcolor)
    return tableconcat(result)
  end

  local init_announcement
      = colorize("\n" .. [[Initial position of rotors: ]],
                                     37)
  pprint_init = function (init)
    local result = ""
    result = value_to_letter[init[1]] .. " "
          .. value_to_letter[init[2]] .. " "
          .. value_to_letter[init[3]]
    return init_announcement .. colorize(stringupper(result), 34)
  end

  local machine_announcement =
    [[Enigma machine initialized with the following settings.]] .. eol
  local s_ukw  = colorize("        Reflector:", 37)
  local s_pb   = colorize("Plugboard setting:", 37)
  local s_ring = colorize("   Ring positions:", 37)
  local empty_plugboard = colorize(" ——", 34)
  pprint_new_machine = function (m)
    local result = { "" }
    result[#result+1] = underline(machine_announcement)
    result[#result+1] = s_ukw
                     .. " "
                     .. colorize(
                          stringupper(value_to_letter[m.reflector]),
                          34
                        )
    local rings = ""
    for i=1, 3 do
      local this = m.ring[i]
      rings = rings
           .. " "
           .. colorize(stringupper(value_to_letter[this + 1]), 34)
    end
    result[#result+1] = s_ring .. rings
    if m.__raw.plugboard then
      local tpb, pb = m.__raw.plugboard, ""
      for i=1, #tpb do
        pb = pb .. " " .. colorize(tpb[i], 34)
      end
      result[#result+1] = s_pb .. pb
    else
      result[#result+1] = s_pb .. empty_plugboard
    end
    result[#result+1] = ""
    result[#result+1] = pprint_rotor_scheme()
    for i=1, 3 do
      result[#result+1] = pprint_rotor(m.rotors[i])
    end
    return tableconcat(result, eol) .. eol
  end

  local step_template  = colorize([[Step № ]], 37)
  local chr_template   = colorize([[  ——  Input ]], 37)
  local pbchr_template = colorize([[ → ]], 37)
  pprint_step = function (n, chr, pb_chr)
    return eol
        .. step_template
        .. colorize(n, 34)
        .. chr_template
        .. colorize(stringupper(value_to_letter[chr]), 34)
        .. pbchr_template
        .. colorize(stringupper(value_to_letter[pb_chr]), 34)
        .. eol
  end

  -- Split the strings into lines, group them in bunches of five etc.
  local tw = 30
  local pprint_textblock = function (s)
    local len = utf8len(s)
    local position = 1    -- position in string
    local nline    = 5    -- width of current line
    local out      = utf8sub(s, position, position+4)
    repeat
      position = position + 5
      nline    = nline + 6
      if nline > tw then
        out = out .. eol .. utf8sub(s, position, position+4)
        nline = 1
      else
        out = out .. " " .. utf8sub(s, position, position+4)
      end
    until position > len
    return out
  end

  local intext  = colorize([[Input text:]], 37)
  local outtext = colorize([[Output text:]], 37)
  pprint_ciphertext = function (input, output, upper_p)
    if upper_p then
      input  = stringupper(input)
      output = stringupper(output)
    end
    return eol
        .. intext
        .. eol
        .. pprint_textblock(input)
        .. eol .. eol
        .. outtext
        .. eol
        .. pprint_textblock(output)
  end

--[[ichd--
\startparagraph
\luafunction{emit} is the main wrapper function for
\identifier{stdout}.  Checks if the global verbosity setting exceeds
the specified threshold, and only then pushes the output.
\stopparagraph
--ichd]]--
  emit = function (v, f, ...)
    if f and v and verbose_level >= v then
      iowrite(f(...) .. eol)
    end
    return 0
  end
--[[ichd--
\startparagraph
The \luafunction{polite_key_request} will be called in case the
\identifier{day_key} field of the machine setup is empty at the time of
initialization.
\stopparagraph
--ichd]]--
  local s_request = "\n\n                     "
                 .. underline"This is an encrypted document." .. [[


            Please enter the document key for enigma machine
                              “%s”.

                              Key Format:

Ref R1 R2 R3 I1 I2 I3 [P1 ..]   Ref: reflector A/B/C
                                Rn:  rotor, I through V
                                In:  ring position, 01 through 26
                                Pn:  optional plugboard wiring, upto 32

>]]
  polite_key_request = function (name)
    return stringformat(s_request, colorize(name, 33))
  end

  local s_invalid_key = colorize"Warning!"
                     .. " The specified key is invalid."
  key_invalid = function ()
    return s_invalid_key
  end
end

--[[ichd--
\startparagraph
The functions \luafunction{new} and \luafunction{ask_for_day_key} are
used outside their scope, so we declare them beforehand.
\stopparagraph
--ichd]]--
local new
local ask_for_day_key
do
--[[ichd--
\stopdocsection
--ichd]]--

--[[ichd--
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
\startdocsection[title=Rotation]
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
\startparagraph
The following function \luafunction{do_rotate} increments the
rotational state of a single rotor. There are two tests for notches:
\startitemize[n]
  \item whether it’s at the current character, and
  \item whether it’s at the next character.
\stopitemize
The latter is an essential prerequisite for double-stepping.
\stopparagraph
--ichd]]--
  local do_rotate = function (rotor)
    rotor.state = rotor.state % 26 + 1
    return rotor,
           rotor.state     == rotor.notch,
           rotor.state + 1 == rotor.notch
  end

--[[ichd--
\startparagraph
The \luafunction{rotate} function takes care of rotor (\emph{Walze})
movement. This entails incrementing the next rotor whenever the notch
has been reached and covers the corner case \emph{double stepping}.
\stopparagraph
--ichd]]--
  local rotate = function (machine)
    local rotors     = machine.rotors
    local rc, rb, ra = rotors[1], rotors[2], rotors[3]

    ra, nxt = do_rotate(ra)
    if nxt or machine.double_step then
      rb, nxt, nxxt = do_rotate(rb)
      if nxt then
        rc = do_rotate(rc)
      end
      if nxxt then
        --- weird: home.comcast.net/~dhhamer/downloads/rotors1.pdf
        machine.double_step = true
      else
        machine.double_step = false
      end
    end
    machine.rotors = { rc, rb, ra }
  end
--[[ichd--
\stopdocsection
--ichd]]--

--[[ichd--
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
\startdocsection[title=Input Preprocessing]
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
\startparagraph
Internally, we will use lowercase strings as they are a lot more
readable than uppercase. Lowercasing happens prior to any further
dealings with input. After the encoding or decoding has been
accomplished, there will be an optional (re-)uppercasing.
\stopparagraph

\startparagraph
Substitutions \reference[listing:preproc]{}are applied onto the
lowercased input. You might want to avoid some of these, above all the
rules for numbers, because they translate single digits only. The
solution is to write out numbers above ten.
\stopparagraph
--ichd]]--

  local pp_substitutions = {
    -- Umlauts are resolved.
    ["ö"]  = "oe",
    ["ä"]  = "ae",
    ["ü"]  = "ue",
    ["ß"]  = "ss",
    -- WTF?
    ["ch"] = "q",
    ["ck"] = "q",
    -- Punctuation -> “x”
    [","]  = "x",
    ["."]  = "x",
    [";"]  = "x",
    [":"]  = "x",
    ["/"]  = "x",
    ["’"]  = "x",
    ["‘"]  = "x",
    ["„"]  = "x",
    ["“"]  = "x",
    ["“"]  = "x",
    ["-"]  = "x",
    ["–"]  = "x",
    ["—"]  = "x",
    ["!"]  = "x",
    ["?"]  = "x",
    ["‽"]  = "x",
    ["("]  = "x",
    [")"]  = "x",
    ["["]  = "x",
    ["]"]  = "x",
    ["<"]  = "x",
    [">"]  = "x",
    -- Spaces are omitted.
    [" "]  = "",
    ["\n"] = "",
    ["\t"] = "",
    ["\v"] = "",
    ["\\"] = "",
    -- Numbers are resolved.
    ["0"]  = "null",
    ["1"]  = "eins",
    ["2"]  = "zwei",
    ["3"]  = "drei",
    ["4"]  = "vier",
    ["5"]  = "fuenf",
    ["6"]  = "sechs",
    ["7"]  = "sieben",
    ["8"]  = "acht",
    ["9"]  = "neun",
  }

--[[ichd--
\stopdocsection
--ichd]]--

--[[ichd--
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
\startdocsection[
  title={Main function chain to be applied to single characters},
]
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

\startparagraph
As far as the Enigma is concerned, there is no difference between
encoding and decoding. Thus, we need only one function
(\luafunction{encode_char}) to achieve the complete functionality.
However, within every encoding step, characters will be wired
differently in at least one of the rotors according to its rotational
state. Rotation is simulated by adding the \identifier{state} field of
each rotor to the letter value (its position on the ingoing end).
\stopparagraph
\placetable[here][table:dirs]{Directional terminology}{%
  \starttabulate[|l|r|l|]
    \NC boolean \NC direction \NC meaning       \NC \AR
    \NC true    \NC    “from” \NC right to left \NC \AR
    \NC false   \NC    “to”   \NC left to right \NC \AR
  \stoptabulate%
}
\startparagraph
The function \luafunction{do_do_encode_char} returns the character
substitution for one rotor. As a letter passes through each rotor
twice, the argument \identifier{direction} determines which way the
substitution is applied.
\stopparagraph
--ichd]]--
  local do_do_encode_char = function (char, rotor, direction)
    local rw     = rotor.wiring
    local rs     = rotor.state
    local result = char
    if direction then -- from
      result = (result + rs - 1) % 26 + 1
      result = rw.from[result]
      result = (result - rs - 1) % 26 + 1
    else -- to
      result = (result + rs - 1) % 26 + 1
      result = rw.to[result]
      result = (result - rs - 1) % 26 + 1
    end
    return result
  end

--[[ichd--
\startparagraph
Behind the plugboard, every character undergoes seven substitutions:
two for each rotor plus the central one through the reflector. The
function \luafunction{do_encode_char}, although it returns the final
result only, keeps every intermediary step inside a table for debugging
purposes.  This may look inefficient but is actually a great advantage
whenever something goes wrong.
\stopparagraph
--ichd]]--
  --- ra -> rb -> rc -> ukw -> rc -> rb -> ra
  local do_encode_char = function (rotors, reflector, char)
    local rc, rb, ra = rotors[1], rotors[2], rotors[3]
    local steps = { [0] = char }
    --
    steps[1] = do_do_encode_char(steps[0], ra,  true)
    steps[2] = do_do_encode_char(steps[1], rb,  true)
    steps[3] = do_do_encode_char(steps[2], rc,  true)
    steps[4] = reflector_wiring[reflector][steps[3]]
    steps[5] = do_do_encode_char(steps[4], rc, false)
    steps[6] = do_do_encode_char(steps[5], rb, false)
    steps[7] = do_do_encode_char(steps[6], ra, false)
    emit(2, pprint_encoding_scheme)
    emit(2, pprint_encoding, steps)
    return steps[7]
  end

--[[ichd--
\startparagraph
Before an input character is passed on to the actual encoding routing,
the function \luafunction{encode_char} matches it agains the latin
alphabet.
Characters failing this test are either passed through or ignored,
depending on the machine option \identifier{other_chars}.
Also, the counter of encoded characters is incremented at this stage
and some pretty printer hooks reside here.
\stopparagraph

\startparagraph
\luafunction{encode_char} contributes only one element of the encoding
procedure: the plugboard (\emph{Steckerbrett}).
Like the rotors described above, a character passed through this
device twice; the plugboard marks the beginning and end of every step.
For debugging purposes, the first substitution is stored in a separate
local variable, \identifier{pb_char}.
\stopparagraph
--ichd]]--

  local encode_char = function (machine, char)
    machine.step = machine.step + 1
    machine:rotate()
    local pb = machine.plugboard
    char = letter_to_value[char]
    local pb_char = pb[char]           -- first plugboard substitution
    emit(2, pprint_step, machine.step, char, pb_char)
    emit(3, pprint_rotor_scheme)
    emit(3, pprint_rotor, machine.rotors[1])
    emit(3, pprint_rotor, machine.rotors[2])
    emit(3, pprint_rotor, machine.rotors[3])
    char = do_encode_char(machine.rotors,
                          machine.reflector,
                          pb_char)
    return value_to_letter[pb[char]]   -- second plugboard substitution
  end

  local get_random_pattern = function ()
    local a, b, c
        = mathrandom(1,26), mathrandom(1,26), mathrandom(1,26)
    return value_to_letter[a]
        .. value_to_letter[b]
        .. value_to_letter[c]
  end

  local pattern_to_state = function (pat)
    return {
      letter_to_value[stringsub(pat, 1, 1)],
      letter_to_value[stringsub(pat, 2, 2)],
      letter_to_value[stringsub(pat, 3, 3)],
    }
  end

  local set_state = function (machine, state)
    local rotors = machine.rotors
    for i=1, 3 do
      rotors[i].state = state[i] - 1
    end
  end

--[[ichd--
\startparagraph
When \modulename{Enigma} is called from \TEX, the encoding
proceeds character by character as we iterate one node at a time.
\luafunction{encode_string} is a wrapper for use with strings, e.~g. in
the mtx-script (\at{page}[sec:fun]).
It handles iteration and extraction of successive characters from the
sequence.
\stopparagraph
--ichd]]--
  local encode_string = function (machine, str) --, pattern)
    local result = { }
    for char in utfcharacters(str) do
      local tmp = machine:encode(char)
      if tmp ~= false then
        if type(tmp) == "table" then
          for i=1, #tmp do
            result[#result+1] = tmp[i]
          end
        else
          result[#result+1] = tmp
        end
      end
    end
    machine:processed_chars()
    return tableconcat(result)
  end
--[[ichd--
\stopdocsection
--ichd]]--

--[[ichd--
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
\startdocsection[title=Initialization string parser]
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

\placetable[here][]{Initialization strings}{%
  \bTABLE
    \bTR
      \bTD        Reflector     \eTD
      \bTD[nc=3]  Rotor         \eTD
      \bTD[nc=3]  Initial       \eTD
      \bTD[nc=10] Plugboard wiring    \eTD
    \eTR
    \eTR
    \bTR
      \bTD in slot       \eTD
      \bTD[nc=3] setting \eTD
      \bTD[nc=3] rotor   \eTD
    \eTR
    \bTR
      \bTD \eTD
      \bTD 1 \eTD\bTD 2 \eTD\bTD 3 \eTD
      \bTD 1 \eTD\bTD 2 \eTD\bTD 3 \eTD
      \bTD 1 \eTD\bTD 2 \eTD\bTD 3 \eTD\bTD 4 \eTD\bTD 5 \eTD
      \bTD 6 \eTD\bTD 7 \eTD\bTD 8 \eTD\bTD 9 \eTD\bTD 10 \eTD
    \eTR
    \bTR
      \bTD B \eTD
      \bTD I  \eTD\bTD IV \eTD\bTD III \eTD
      \bTD 16 \eTD\bTD 26 \eTD\bTD  08 \eTD
      \bTD AD \eTD\bTD CN \eTD\bTD  ET \eTD
      \bTD FL \eTD\bTD GI \eTD\bTD  JV \eTD
      \bTD KZ \eTD\bTD PU \eTD\bTD  QY \eTD
      \bTD WX \eTD
    \eTR
  \eTABLE
}
--ichd]]--
  local roman_digits = {
    i   = 1, I   = 1,
    ii  = 2, II  = 2,
    iii = 3, III = 3,
    iv  = 4, IV  = 4,
    v   = 5, V   = 5,
  }

  local p_init = P{
    "init",
    init               = V"whitespace"^-1 * Ct(V"do_init"),
    do_init            = (V"reflector" * V"whitespace")^-1
                       * V"rotors"     * V"whitespace"
                       * V"ring"
                       * (V"whitespace" * V"plugboard")^-1
                       ,
    reflector          = Cg(C(R("ac","AC")) / stringlower, "reflector")
                       ,

    rotors             = Cg(Ct(V"rotor" * V"whitespace"
                             * V"rotor" * V"whitespace"
                             * V"rotor"),
                             "rotors")
                       ,
    rotor              = Cs(V"roman_five"  / roman_digits
                          + V"roman_four"  / roman_digits
                          + V"roman_three" / roman_digits
                          + V"roman_two"   / roman_digits
                          + V"roman_one"   / roman_digits)
                       ,
    roman_one          = P"I"   + P"i",
    roman_two          = P"II"  + P"ii",
    roman_three        = P"III" + P"iii",
    roman_four         = P"IV"  + P"iv",
    roman_five         = P"V"   + P"v",

    ring               = Cg(Ct(V"double_digit" * V"whitespace"
                             * V"double_digit" * V"whitespace"
                             * V"double_digit"),
                            "ring")
                       ,
    double_digit       = C(R"02" * R"09"),

    plugboard          = Cg(V"do_plugboard", "plugboard"),
    --- no need to enforce exactly ten substitutions
    --do_plugboard       = Ct(V"letter_combination" * V"whitespace"
    --                      * V"letter_combination" * V"whitespace"
    --                      * V"letter_combination" * V"whitespace"
    --                      * V"letter_combination" * V"whitespace"
    --                      * V"letter_combination" * V"whitespace"
    --                      * V"letter_combination" * V"whitespace"
    --                      * V"letter_combination" * V"whitespace"
    --                      * V"letter_combination" * V"whitespace"
    --                      * V"letter_combination" * V"whitespace"
    --                      * V"letter_combination")
    do_plugboard       = Ct(V"letter_combination"
                          * (V"whitespace" * V"letter_combination")^0)
                       ,
    letter_combination = C(R("az", "AZ") * R("az", "AZ")),

    whitespace         = S" \n\t\v"^1,
  }


--[[ichd--
\stopdocsection
--ichd]]--

--[[ichd--
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
\startdocsection[title=Initialization routines]
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

\startparagraph
The plugboard is implemented as a pair of hash tables.
\stopparagraph
--ichd]]--
  local get_plugboard_substitution = function (p)
    --- Plugboard wirings are symmetrical, thus we have one table for
    --- each direction.
    local tmp, result = { }, { }
    for _, str in next, p do
      local one, two = stringlower(stringsub(str, 1, 1)),
                      stringlower(stringsub(str, 2))
      tmp[one] = two
      tmp[two] = one
    end
    local n_letters = 26

    local lv = letter_to_value
    for n=1, n_letters do
      local letter  = value_to_letter[n]
      local sub = tmp[letter] or letter
      -- Map each char either to the plugboard substitution or itself.
      result[lv[letter]] = lv[sub or letter]
    end
    return result
  end

--[[ichd--
\startparagraph
Initialization of the rotors requires some precautions to be taken.
The most obvious of which is adjusting the displacement of its wiring
by the ring setting.
\stopparagraph
\startparagraph
Another important task is to store the notch position in order for it
to be retrievable by the rotation subroutine at a later point.
\stopparagraph
\startparagraph
The actual bidirectional mapping is implemented as a pair of tables.
The initial order of letters, before the ring shift is applied, is
alphabetical on the input (right, “from”) side and, on the output
(left, “to”) side taken by the hard wired correspondence as specified
in the rotor wirings above.
NB the descriptions in terms of “output” and “input” directions is
misleading in so far as during any encoding step the electricity will
pass through every rotor in both ways.
Hence, the “input” (right, from) direction literally applies only to
the first half of the encoding process between plugboard and reflector.
\stopparagraph
\startparagraph
The function \luafunction{do_get_rotor} creates a single rotor instance
and populates it with character mappings. The \identifier{from} and
\identifier{to} subfields of its \identifier{wiring} field represent
the wiring in the respective directions.
This initital wiring was specified in the corresponding
\identifier{raw_rotor_wiring} table; the ringshift is added modulo the
alphabet size in order to get the correctly initialized rotor.
\stopparagraph
--ichd]]--
  local do_get_rotor = function (raw, notch, ringshift)
    local rotor = {
      wiring = {
        from  = { },
        to    = { },
      },
      state = 0,
      notch = notch,
    }
    local w = rotor.wiring
    for from=1, 26 do
      local to   = letter_to_value[stringsub(raw, from, from)]
      --- The shift needs to be added in both directions.
      to   = (to   + ringshift - 1) % 26 + 1
      from = (from + ringshift - 1) % 26 + 1
      rotor.wiring.from[from] = to
      rotor.wiring.to  [to  ] = from
    end
    --table.print(rotor, "rotor")
    return rotor
  end

--[[ichd--
\startparagraph
Rotors are initialized sequentially accordings to the initialization
request.
The function \luafunction{get_rotors} walks over the list of
initialization instructions and calls \luafunction{do_get_rotor} for
the actual generation of the rotor table. Each rotor generation request
consists of three elements:
\stopparagraph
\startitemize[n]
  \item the choice of rotor (one of five),
  \item the notch position of said rotor, and
  \item the ring shift.
\stopitemize
--ichd]]--
  local get_rotors = function (rotors, ring)
    local s, r = { }, { }
    for n=1, 3 do
      local nr = tonumber(rotors[n])
      local ni = tonumber(ring[n]) - 1 -- “1” means shift of zero
      r[n] = do_get_rotor(raw_rotor_wiring[nr], notches[nr], ni)
      s[n] = ni
    end
    return r, s
  end

  local decode_char = encode_char -- hooray for involutory ciphers

--[[ichd--
\startparagraph
The function \luafunction{encode_general} is an intermediate step for
the actual single-character encoding / decoding routine
\luafunction{enchode_char}.
Its purpose is to ensure encodability of a given character before
passing it along.
Characters are first checked against the replacement table
\identifier{pp_substitutions} (see \at{page}[listing:preproc]).
For single-character replacements the function returns the encoded
character (string).
However, should the replacement turn out to consist of more than one
character, each one will be encoded successively, yielding a list.
\stopparagraph
--ichd]]--
  local encode_general = function (machine, chr)
    local chr = utf8lower(chr)
    local replacement
        = pp_substitutions[chr] or letter_to_value[chr] and chr
    if not replacement then
      if machine.other_chars then
        return chr
      else
        return false
      end
    end

    if utf8len(replacement) == 1 then
      return encode_char(machine, replacement)
    end
    local result = { }
    for new_chr in utfcharacters(replacement) do
      result[#result+1] = encode_char(machine, new_chr)
    end
    return result
  end

  local process_message_key
  local alpha        = R"az"
  local alpha_dec    = alpha / letter_to_value
  local whitespace   = S" \n\t\v"
  local mkeypattern  = Ct(alpha_dec  * alpha_dec * alpha_dec)
                    * whitespace^0
                    * C(alpha * alpha *alpha)
  process_message_key = function (machine, message_key)
    message_key = stringlower(message_key)
    local init, three = lpegmatch(mkeypattern, message_key)
    -- to be implemented
  end

  local decode_string = function (machine, str, message_key)
    machine.kenngruppe, str = stringsub(str, 3, 5), stringsub(str, 6)
    machine:process_message_key(message_key)
    local decoded = encode_string(machine, str)
    return decoded
  end

  local testoptions = {
    size = 42,

  }
  local generate_header = function (options)
  end

  local processed_chars = function (machine)
    emit(1, pprint_machine_step, machine.step, machine.name)
  end

--[[ichd--
\startparagraph
The day key is entrusted to the function \luafunction{handle_day_key}.
If the day key is the empty string or \type{nil}, it will ask for a key
on the terminal. (Cf. below, \at{page}[listing:ask_for_day_key].)
Lesson: don’t forget providing day keys in your setups when running in
batch mode.
\stopparagraph
--ichd]]--
  local handle_day_key handle_day_key = function (dk, name, old)
    local result
    if not dk or dk == "" then
      dk = ask_for_day_key(name, old)
    end
    result = lpegmatch(p_init, dk)
    result.reflector = result.reflector or "b"
    -- If we don’t like the key we’re going to ask again. And again....
    return result or handle_day_key(nil, name, dk)
  end

--[[ichd--
\startparagraph
The enigma encoding is restricted to an input -- and, naturally, output
-- alphabet of exactly twenty-seven characters. Obviously, this would
severely limit the set of encryptable documents. For this reason the
plain text would be \emph{preprocessed} prior to encoding, removing
spaces and substituting a range of characters, e.\,g. punctuation, with
placeholders (“X”) from the encodable spectrum. See above
\at{page}[listing:preproc] for a comprehensive list of substitutions.
\stopparagraph

\startparagraph
The above mentioned preprocessing, however, does not even nearly extend
to the whole unicode range that modern day typesetting is expected to
handle. Thus, sooner or later an Enigma machine will encounter
non-preprocessable characters and it will have to decide what to do
with them. The Enigma module offers two ways to handle this kind of
situation: \emph{drop} those characters, possibly distorting the
deciphered plain text, or to leave them in, leaving hints behind as to
the structure of the encrypted text. None of these is optional, so it
is nevertheless advisable to not include non-latin characters in the
plain text in the first place. The settings key
\identifier{other_chars} (type boolean) determines whether we will keep
or drop offending characters.
\stopparagraph
--ichd]]--

  new = function (name, args)
    local setup_string, pattern = args.day_key, args.rotor_setting
    local raw_settings = handle_day_key(setup_string, name)
    local rotors, ring =
      get_rotors(raw_settings.rotors, raw_settings.ring)
    local plugboard
        = raw_settings.plugboard
          and get_plugboard_substitution(raw_settings.plugboard)
          or  get_plugboard_substitution{ }
    local machine = {
      name                = name,
      step                = 0, -- n characters encoded
      init                = {
        rotors = raw_settings.rotors,
        ring   = raw_settings.ring
      },
      rotors              = rotors,
      ring                = ring,
      state               = init_state,
      other_chars         = args.other_chars,
      spacing             = args.spacing,
      ---> a>1, b>2, c>3
      reflector           = letter_to_value[raw_settings.reflector],
      plugboard           = plugboard,
      --- functionality
      rotate              = rotate,
      --process_message_key = process_message_key,
      encode_string       = encode_string,
      encode_char         = encode_char,
      encode              = encode_general,
      decode_string       = decode_string,
      decode_char         = decode_char,
      set_state           = set_state,
      processed_chars     = processed_chars,
      --- <badcodingstyle> -- hackish but occasionally useful
      __raw               = raw_settings
      --- </badcodingstyle>
    } --- machine
    local init_state
      = pattern_to_state(pattern or get_random_pattern())
    emit(1, pprint_init, init_state)
    machine:set_state(init_state)

    --table.print(machine.rotors)
    emit(1, pprint_new_machine, machine)
    return machine
  end

end
--[[ichd--
\stopdocsection
--ichd]]--


--[[ichd--
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
\startdocsection[title=Setup Argument Handling]
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
--ichd]]--
do
--[[ichd--
\startparagraph
As the module is intended to work both with the Plain and \LATEX\
formats as well as \CONTEXT, we can’t rely on format dependent setups.
Hence the need for an argument parser. Should be more efficient anyways
as all the functionality resides in Lua.
\stopparagraph
--ichd]]--

  local p_args = P{
    "args",
    args           = Cf(Ct"" * (V"kv_pair" + V"emptyline")^0, rawset),
    kv_pair        = Cg(V"key"
                      * V"separator"
                      * (V"value" * V"final"
                      + V"empty"))
                  * V"rest_of_line"^-1
                  ,
    key            = V"whitespace"^0 * C(V"key_char"^1),
    key_char       = (1 - V"whitespace" - V"eol" - V"equals")^1,
    separator      = V"whitespace"^0 * V"equals" * V"whitespace"^0,
    empty          = V"whitespace"^0 * V"comma" * V"rest_of_line"^-1
                  * Cc(false)
                  ,
    value          = C((V"balanced" + (1 - V"final"))^1),
    final          = V"whitespace"^0 * V"comma" + V"rest_of_string",
    rest_of_string = V"whitespace"^0
                   * V"eol_comment"^-1
                   * V"eol"^0
                   * V"eof"
                   ,
    rest_of_line   = V"whitespace"^0 * V"eol_comment"^-1 * V"eol",
    eol_comment    = V"comment_string" * (1 - (V"eol" + V"eof"))^0,
    comment_string = V"lua_comment" + V"TeX_comment",
    TeX_comment    = V"percent",
    lua_comment    = V"double_dash",
    emptyline      = V"rest_of_line",

    balanced       = V"balanced_brk" + V"balanced_brc",
    balanced_brk   = V"lbrk"
                   * (V"balanced" + (1 - V"rbrk"))^0
                   * V"rbrk"
                   ,
    balanced_brc   = V"lbrc"
                   * (V"balanced" + (1 - V"rbrc"))^0
                   * V"rbrc"
                   ,
    -- Terminals
    eol            = P"\n\r" + P"\r\n" + P"\n" + P"\r",
    eof            = -P(1),
    whitespace     = S" \t\v",
    equals         = P"=",
    dot            = P".",
    comma          = P",",
    dash           = P"-",    double_dash  = V"dash" * V"dash",
    percent        = P"%",
    lbrk           = P"[",    rbrk         = P"]",
    lbrc           = P"{",    rbrc         = P"}",
  }


--[[ichd--
\startparagraph
In the next step we process the arguments, check the input for sanity
etc. The function \luafunction{parse_args} will test whether a value
has a sanitizer routine and, if so, apply it to its value.
\stopparagraph
--ichd]]--

  local boolean_synonyms = {
    ["1"]    = true,
    doit     = true,
    indeed   = true,
    ok       = true,
    ["⊤"]    = true,
    ["true"] = true,
    yes      = true,
  }
  local toboolean
      = function (value) return boolean_synonyms[value] or false end
  local alpha = R("az", "AZ")
  local digit = R"09"
  local space = S" \t\v"
  local ans   = alpha + digit + space
  local p_ans = Cs((ans + (1 - ans / ""))^1)
  local alphanum_or_space  = function (str)
    if type(str) ~= "string" then return nil end
    return lpegmatch(p_ans, str)
  end
  local ensure_int = function (n)
    n = tonumber(n)
    if not n then return 0 end
    return mathfloor(n + 0.5)
  end
  p_alpha = Cs((alpha + (1 - alpha / ""))^1)
  local ensure_alpha = function (s)
    s = tostring(s)
    return lpegmatch(p_alpha, s)
  end

  local sanitizers = {
    other_chars   = toboolean,          -- true = keep, false = drop
    spacing       = toboolean,
    day_key       = alphanum_or_space,
    rotor_setting = ensure_alpha,
    verbose       = ensure_int,
  }
  enigma.parse_args = function (raw)
    local args = lpegmatch(p_args, raw)
    for k, v in next, args do
      local f = sanitizers[k]
      if f then
        args[k] = f(v)
      else
        -- OPTIONAL be fascist and permit only predefined args
        args[k] = v
      end
    end
    return args
  end
--[[ichd--
\startparagraph
If the machine setting lacks key settings then we’ll go ahead and ask
\reference[listing:ask_for_day_key]{}%
the user directly, hence the function \luafunction{ask_for_day_key}.
We abort after three misses lest we annoy the user \dots
\stopparagraph
--ichd]]--
  local max_tries = 3
  ask_for_day_key = function (name, old, try)
    if try == max_tries then
      iowrite[[
Aborting. Entered invalid key three times.
]]
      os.exit()
    end
    if old then
      emit(0, key_invalid)
    end
    emit(0, polite_key_request, name)
    local result = ioread()
    iowrite("\n")
    return alphanum_or_space(result) or
           ask_for_day_key(name, (try and try + 1 or 1))
  end
end

--[[ichd--
\stopdocsection
--ichd]]--

--[[ichd--
\startdocsection[title=Callback]
\startparagraph
This is the interface to \TEX. We generate a new callback handler for
each defined Enigma machine. \CONTEXT\ delivers the head as third
argument of a callback only (...‽), so we’ll have to do some variable
shuffling on the function side.
\stopparagraph

\startparagraph
When grouping output into the traditional blocks of five letters we
insert space nodes. As their properties depend on the font we need to
recreate the space item for every paragraph. Also, as \CONTEXT\ does
not preload a font we lack access to font metrics before
\type{\starttext}.  Thus creating the space earlier will result in an
error.
The function \luafunction{generate_space} will be called inside the
callback in order to get an appropriate space glue.
\stopparagraph
--ichd]]--

local generate_space = function ( )
  local current_fontparms = font.getfont(font.current()).parameters
  local space_node        = nodenew(GLUE_NODE)
  space_node.spec         = nodenew(GLUE_SPEC_NODE)
  space_node.spec.width   = current_fontparms.space
  space_node.spec.shrink  = current_fontparms.space_shrink
  space_node.spec.stretch = current_fontparms.space_stretch
  return space_node
end

--[[ichd--
\startparagraph
\useURL[khaled_hosny_texsx] [http://tex.stackexchange.com/a/11970]
       []                   [tex.sx]
Registering a callback (“node attribute”?, “node task”?, “task
action”?) in \CONTEXT\ is not straightforward, let alone documented.
The trick is to create, install and register a handler first in order
to use it later on \dots\ many thanks to Khaled Hosny, who posted an
answer to \from[khaled_hosny_texsx].
\stopparagraph
--ichd]]--

local new_callback = function (machine, name)
  enigma.machines [name] = machine
  local format_is_context = format_is_context
  local current_space_node
  local mod_5 = 0

  --- First we need to choose an insertion method. If autospacing is
  --- requested, a space will have to be inserted every five
  --- characters.  The rationale behind using differend functions to
  --- implement each method is that it should be faster than branching
  --- for each character.
  local insert_encoded

  if machine.spacing then -- auto-group output
    insert_encoded = function (head, n, replacement)
      local insert_glyph = nodecopy(n)
      if replacement then -- inefficient but bulletproof
        insert_glyph.char = utf8byte(replacement)
        --print(utf8char(n.char), "=>", utf8char(insertion.char))
      end
      --- if we insert a space we need to return the
      --- glyph node in order to track positions when
      --- replacing multiple nodes at once (e.g. ligatures)
      local insertion  = insert_glyph
      mod_5 = mod_5 + 1
      if mod_5 > 5 then
        mod_5 = 1
        insertion = nodecopy(current_space_node)
        insertion.next, insert_glyph.prev = insert_glyph, insertion
      end
      if head == n then --> replace head
        local succ = head.next
        if succ then
          insert_glyph.next, succ.prev = succ, insert_glyph
        end
        head = insertion
      else --> replace n
        local pred, succ = n.prev, n.next
        pred.next, insertion.prev = insertion, pred
        if succ then
          insert_glyph.next, succ.prev = succ, insert_glyph
        end
      end

      --- insertion becomes the new head
      return head, insert_glyph -- so we know where to insert
    end
  else

    insert_encoded = function (head, n, replacement)
      local insertion = nodecopy(n)
      if replacement then
        insertion.char = utf8byte(replacement)
      end
      if head == n then
        local succ = head.next
        if succ then
          insertion.next, succ.prev = succ, insertion
        end
        head = insertion
      else
        nodeinsert_before(head, n, insertion)
        noderemove(head, n)
      end
      return head, insertion
    end
  end

  --- The callback proper starts here.
  local aux aux = function (head, recurse)
    if recurse == nil then recurse = 0 end
    for n in nodetraverse(head) do
      local nid = n.id
      --print(utf8char(n.char), n)
      if nid == GLYPH_NODE then
        local chr         = utf8char(n.char)
        --print(chr, n)
        local replacement  = machine:encode(chr)
        --print(chr, replacement, n)
        local treplacement = replacement and type(replacement)
        --if replacement == false then
        if not replacement then
          noderemove(head, n)
        elseif treplacement == "string" then
          --print(head, n, replacement)
          head, _ = insert_encoded(head, n, replacement)
        elseif treplacement == "table" then
          local current = n
          for i=1, #replacement do
            head, current = insert_encoded(head, current, replacement[i])
          end
        end
      elseif nid == GLUE_NODE then
        if n.subtype ~= 15 then -- keeping the parfillskip
          noderemove(head, n)
        end
      elseif IGNORE_NODES[nid] then
        -- drop spaces and kerns
        noderemove(head, n)
      elseif nid == DISC_NODE then
        --- ligatures need to be resolved if they are characters
        local npre, npost = n.pre, n.post
        if nodeid(npre)  == GLYPH_NODE and
           nodeid(npost) == GLYPH_NODE then
          if npre.char and npost.char then -- ligature between glyphs
            local replacement_pre  = machine:encode(utf8char(npre.char))
            local replacement_post = machine:encode(utf8char(npost.char))
            insert_encoded(head,  npre, replacement_pre)
            insert_encoded(head, npost, replacement_post)
          else -- hlists or whatever
            -- pass
            --noderemove(head, npre)
            --noderemove(head, npost)
          end
        end
        noderemove(head, n)
      elseif nid == HLIST_NODE or nid == VLIST_NODE then
        if nodelength(n.list) > 0 then
          n.list = aux(n.list, recurse + 1)
        end
--      else
--        -- TODO other node types
--        print(n)
      end
    end
    nodeslide(head)
    return head
  end -- callback auxiliary

  --- Context requires
  ---  × argument shuffling; a properly registered “action” gets the
  ---    head passed as its third argument
  ---  × hacking our way around the coupling of pre_linebreak_filter
  ---    and hpack_filter; background:
  ---    http://www.ntg.nl/pipermail/ntg-context/2012/067779.html
  local cbk = function (a, _, c)
    local head
    current_space_node = generate_space ()
    mod_5              = 0
    if format_is_context == true then
      head = c
      local cbk_env = get_debug_info(4) -- no getenv in lua 5.2
      --inspect(cbk_env)
      if cbk_env.func == nodes.processors.pre_linebreak_filter then
        -- how weird is that?
        return aux(head)
      end
      return head
    end
    head = a
    return aux(head)
  end

  if format_is_context then
    local cbk_id = "enigma_" .. name
    enigma.callbacks[name] = nodesinstallattributehandler{
      name      = cbk_id,
      namespace = thirddata.enigma,
      processor = cbk,
    }
    local cbk_location = "thirddata.enigma.callbacks." .. name
    nodestasksappendaction("processors",
                           --"characters",
                           --"finalizers",
                           --- this one is tagged “for users”
                           --- (cf. node-tsk.lua)
                           "before",
                           cbk_location)
    nodestasksdisableaction("processors", cbk_location)
  else
    enigma.callbacks[name] = cbk
  end
end

--[[ichd--
\startparagraph
Enigma\reference[listing:retrieve]{} machines can be copied and derived
from one another at will, cf.  the \texmacro{defineenigma} on
\at{page}[listing:define]. Two helper functions residing inside the
\identifier{thirddata.enigma} namespace take care of these actions:
\luafunction{save_raw_args} and \luafunction{retrieve_raw_args}. As
soon as a machine is defined, we store its parsed options inside the
table \identifier{configurations} for later reference. For further
details on the machine derivation mechanism see
\at{page}[listing:inherit].
\stopparagraph
--ichd]]--
local configurations = { }

local save_raw_args = function (conf, name)
  local current = configurations[name] or { }
  for k, v in next, conf do
    current[k] = v
  end
  configurations[name] = current
end

local retrieve_raw_args = function (name)
  local cn = configurations[name]
  return cn and tablecopy(cn) or { }
end

enigma.save_raw_args     = save_raw_args
enigma.retrieve_raw_args = retrieve_raw_args


--[[ichd--
\startparagraph
The function \luafunction{new_machine} instantiates a table containing
the complete specification of a workable \emph{Enigma} machine and
other metadata. The result is intended to be handed over to the
callback creation mechanism (\luafunction{new_callback}). However, the
arguments table is usally stored away in the
\identifier{thirddata.enigma} namespace anyway
(\luafunction{save_raw_args}), so that the specification of any machine
can be inherited by some new setup later on.
\stopparagraph
--ichd]]--
local new_machine = function (name)
  local args = configurations[name]
  --table.print(configurations)
  verbose_level = args and args.verbose or verbose_level
  local machine = new(name, args)
  return machine
end

enigma.new_machine  = new_machine
enigma.new_callback = new_callback

--[[ichd--
\stopdocsection
--ichd]]--

-- vim:ft=lua:sw=2:ts=2:tw=71:expandtab

--
--------------------------------------------------------------------------------
--         FILE:  mtx-t-enigma.lua
--        USAGE:  mtxrun --script enigma --setup="s" --text="t"
--  DESCRIPTION:  context script interface for the Enigma module
-- REQUIREMENTS:  latest ConTeXt MkIV
--       AUTHOR:  Philipp Gesang (Phg), <gesang@stud.uni-heidelberg.de>
--      CREATED:  2013-03-28 02:14:05+0100
--------------------------------------------------------------------------------
--

environment.loadluafile("enigma")

local iowrite = io.write

local helpinfo = [[
===============================================================
    The Enigma module, command line interface.
    © 2012--2013 Philipp Gesang. License: 2-clause BSD.
    Home: <https://bitbucket.org/phg/enigma/>
===============================================================

USAGE:

    mtxrun --script enigma --setup="settings" --text="text"
           --verbose=int

    where the settings are to be specified as a comma-delimited
    conjunction of “key=value” statements, and “text” refers to
    the text to be encoded. Note that due to the involutory
    design of the enigma cipher, the text can be both plaintext
    and ciphertext.

===============================================================
]]

local application = logs.application {
    name     = "mtx-t-enigma",
    banner   = "The Enigma for ConTeXt, hg-rev 37+",
    helpinfo = helpinfo,
}

local ea = environment.argument

local setup, text = ea"setup" or ea"s",  ea"text" or ea"t"
local verbose     = ea"verbose" or ea"v"

local out = function (str)
  iowrite(str)
end

local machine_id = "external"
if setup and text then
  local args    = enigma.parse_args(setup)
  if not args then
    application.help()
    iowrite"\n\n[Error] Could not process enigma setup!\n\n"
  end
  enigma.save_raw_args(args, machine_id)
  --local machine = enigma.new_machine(enigma.parse_args(setup))
  local machine = enigma.new_machine(machine_id)
  --machine.name  = machine_id
  local result  = machine:encode_string(text)
  if result then
    out(result)
  else
    application.help()
  end
else
    application.help()
end

